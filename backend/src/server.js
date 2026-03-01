import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Binary, MongoClient, ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || "regnify_hr";
const mongoEmployeesCollection = process.env.MONGODB_EMPLOYEES_COLLECTION || "employees";
const mongoSignaturesCollection = process.env.MONGODB_SIGNATURES_COLLECTION || "signatures";
const mongoDocumentAuditCollection = process.env.MONGODB_DOCUMENT_AUDIT_COLLECTION || "document_audit";
const mongoHrDataCollection = process.env.MONGODB_HR_DATA_COLLECTION || "hr_data";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;

if (!mongoUri) {
  throw new Error("MONGODB_URI is required.");
}

const mongoClient = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 10000,
});
let db;

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const parseDataUrlToBuffer = (dataUrl) => {
  const base64Payload = String(dataUrl).includes(",")
    ? String(dataUrl).split(",")[1]
    : String(dataUrl);
  return Buffer.from(base64Payload, "base64");
};

const hashPassword = (password) => crypto.createHash("sha256").update(password).digest("hex");

app.get("/api/hr-data/:hrId", async (req, res) => {
  const hrId = req.params.hrId;

  if (!hrId) {
    return res.status(400).json({ error: "hrId is required" });
  }

  try {
    const hrData = await db.collection(mongoHrDataCollection).findOne(
      { hr_id: hrId },
      {
        projection: {
          password_hash: 0,
          profile_photo_data: 0,
          organization_logo_data: 0,
        },
      },
    );

    if (!hrData) {
      return res.status(200).json({ hrData: null });
    }

    return res.status(200).json({
      hrData: {
        id: hrData._id.toString(),
        ...hrData,
      },
    });
  } catch (serverError) {
    console.error("[GetHrData] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch HR data" });
  }
});

app.post("/api/hr-data/profile", async (req, res) => {
  const {
    hr_id,
    hr_name,
    designation,
    department,
    official_email,
    contact_number,
    employee_id,
    timezone,
    organization_name,
    role,
    two_factor_enabled,
    generate_offer_letters_enabled,
    profile_photo_name,
    profile_photo_mime,
    profile_photo_base64,
    organization_logo_name,
    organization_logo_mime,
    organization_logo_base64,
  } = req.body ?? {};

  if (!hr_id || !official_email) {
    return res.status(400).json({ error: "hr_id and official_email are required" });
  }

  try {
    const updatePayload = {
      hr_id,
      hr_name: hr_name ?? "",
      designation: designation ?? "",
      department: department ?? "",
      official_email,
      contact_number: contact_number ?? "",
      employee_id: employee_id ?? "",
      timezone: timezone ?? "",
      organization_name: organization_name ?? "",
      role: role || "HR Admin",
      two_factor_enabled: Boolean(two_factor_enabled),
      generate_offer_letters_enabled: Boolean(generate_offer_letters_enabled),
      updated_at: new Date().toISOString(),
    };

    if (profile_photo_name) {
      updatePayload.profile_photo_name = profile_photo_name;
    }
    if (profile_photo_mime) {
      updatePayload.profile_photo_mime = profile_photo_mime;
    }
    if (profile_photo_base64) {
      updatePayload.profile_photo_data = new Binary(parseDataUrlToBuffer(profile_photo_base64));
    }

    if (organization_logo_name) {
      updatePayload.organization_logo_name = organization_logo_name;
    }
    if (organization_logo_mime) {
      updatePayload.organization_logo_mime = organization_logo_mime;
    }
    if (organization_logo_base64) {
      updatePayload.organization_logo_data = new Binary(parseDataUrlToBuffer(organization_logo_base64));
    }

    await db.collection(mongoHrDataCollection).updateOne(
      { hr_id },
      {
        $set: updatePayload,
        $setOnInsert: { created_at: new Date().toISOString() },
      },
      { upsert: true },
    );

    const savedData = await db.collection(mongoHrDataCollection).findOne(
      { hr_id },
      {
        projection: {
          password_hash: 0,
          profile_photo_data: 0,
          organization_logo_data: 0,
        },
      },
    );

    return res.status(200).json({
      message: "HR profile saved",
      hrData: savedData
        ? {
            id: savedData._id.toString(),
            ...savedData,
          }
        : null,
    });
  } catch (serverError) {
    console.error("[SaveHrProfile] Mongo upsert error:", serverError);
    return res.status(500).json({ error: "Unable to save HR profile" });
  }
});

app.post("/api/hr-data/password", async (req, res) => {
  const { hr_id, current_password, new_password } = req.body ?? {};

  if (!hr_id || !new_password) {
    return res.status(400).json({ error: "hr_id and new_password are required" });
  }

  try {
    const hrData = await db.collection(mongoHrDataCollection).findOne({ hr_id });

    if (hrData?.password_hash) {
      if (!current_password) {
        return res.status(400).json({ error: "current_password is required" });
      }

      const currentPasswordHash = hashPassword(current_password);
      if (currentPasswordHash !== hrData.password_hash) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
    }

    const newPasswordHash = hashPassword(new_password);
    await db.collection(mongoHrDataCollection).updateOne(
      { hr_id },
      {
        $set: {
          password_hash: newPasswordHash,
          password_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        $setOnInsert: { created_at: new Date().toISOString() },
      },
      { upsert: true },
    );

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (serverError) {
    console.error("[SaveHrPassword] Mongo update error:", serverError);
    return res.status(500).json({ error: "Unable to update password" });
  }
});

app.get("/api/hr-data/document-settings/:hrId", async (req, res) => {
  const hrId = req.params.hrId;

  if (!hrId) {
    return res.status(400).json({ error: "hrId is required" });
  }

  try {
    const latestSettings = await db.collection(mongoDocumentAuditCollection).findOne(
      { event_type: "document_settings", hr_id: hrId },
      {
        sort: { created_at: -1 },
        projection: { template_data: 0 },
      },
    );

    if (!latestSettings) {
      return res.status(200).json({ documentSettings: null });
    }

    return res.status(200).json({
      documentSettings: {
        id: latestSettings._id.toString(),
        ...latestSettings,
      },
    });
  } catch (serverError) {
    console.error("[GetDocumentSettings] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch document settings" });
  }
});

app.post("/api/hr-data/document-settings", async (req, res) => {
  const {
    hr_id,
    watermark,
    auto_email,
    digital_stamp_position,
    template_name,
    template_mime,
    template_base64,
  } = req.body ?? {};

  if (!hr_id) {
    return res.status(400).json({ error: "hr_id is required" });
  }

  if (template_base64 && template_mime !== "application/pdf") {
    return res.status(400).json({ error: "Only PDF templates are allowed" });
  }

  try {
    const payload = {
      event_type: "document_settings",
      hr_id,
      watermark: Boolean(watermark),
      auto_email: Boolean(auto_email),
      digital_stamp_position: digital_stamp_position || "left",
      template_name: template_name || null,
      template_mime: template_mime || null,
      created_at: new Date().toISOString(),
    };

    if (template_base64) {
      payload.template_data = new Binary(parseDataUrlToBuffer(template_base64));
    }

    const result = await db.collection(mongoDocumentAuditCollection).insertOne(payload);

    return res.status(201).json({
      message: "Document settings saved",
      documentSettings: {
        id: result.insertedId.toString(),
        ...payload,
      },
    });
  } catch (serverError) {
    console.error("[SaveDocumentSettings] Mongo insert error:", serverError);
    return res.status(500).json({ error: "Unable to save document settings" });
  }
});

app.get("/api/signatures/:hrId", async (req, res) => {
  const hrId = req.params.hrId;

  if (!hrId) {
    return res.status(400).json({ error: "hrId is required" });
  }

  try {
    const signature = await db.collection(mongoSignaturesCollection).findOne(
      { hr_id: hrId },
      { sort: { uploaded_at: -1 } },
    );

    if (!signature) {
      return res.status(200).json({ signature: null });
    }

    return res.status(200).json({
      signature: {
        id: signature._id.toString(),
        hr_id: signature.hr_id,
        file_url: `${publicBaseUrl}/api/signatures/file/${signature._id.toString()}`,
        file_hash: signature.file_hash,
        uploaded_at: signature.uploaded_at,
        status: signature.status,
      },
    });
  } catch (serverError) {
    console.error("[GetSignature] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unexpected backend error" });
  }
});

app.get("/api/signatures/file/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid signature id" });
  }

  try {
    const signature = await db.collection(mongoSignaturesCollection).findOne(
      { _id: new ObjectId(id) },
      { projection: { file_data: 1, mime_type: 1 } },
    );

    if (!signature?.file_data) {
      return res.status(404).json({ error: "Signature file not found" });
    }

    const fileData = signature.file_data;
    const fileBuffer = Buffer.isBuffer(fileData)
      ? fileData
      : fileData?.buffer
        ? Buffer.from(fileData.buffer)
        : Buffer.from(fileData);

    res.setHeader("Content-Type", signature.mime_type || "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).send(fileBuffer);
  } catch (serverError) {
    console.error("[GetSignatureFile] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unexpected backend error" });
  }
});

app.post("/api/signatures/upload", async (req, res) => {
  const { hr_id, file_name, mime_type, file_base64 } = req.body ?? {};

  if (!hr_id || !file_name || !mime_type || !file_base64) {
    return res.status(400).json({ error: "hr_id, file_name, mime_type and file_base64 are required" });
  }

  const allowedMimeTypes = ["image/png", "image/jpeg"];
  if (!allowedMimeTypes.includes(mime_type)) {
    return res.status(400).json({ error: "Only image/png or image/jpeg signatures are supported" });
  }

  try {
    const base64Payload = String(file_base64).includes(",")
      ? String(file_base64).split(",")[1]
      : String(file_base64);
    const fileBuffer = Buffer.from(base64Payload, "base64");
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const signaturesCollection = db.collection(mongoSignaturesCollection);

    await signaturesCollection.updateMany(
      { hr_id, status: "active" },
      { $set: { status: "revoked", revoked_at: new Date().toISOString() } },
    );

    const signaturePayload = {
      hr_id,
      file_name,
      mime_type,
      file_data: new Binary(fileBuffer),
      file_hash: fileHash,
      uploaded_at: new Date().toISOString(),
      status: "active",
    };

    const insertResult = await signaturesCollection.insertOne(signaturePayload);
    const insertedId = insertResult.insertedId;

    return res.status(201).json({
      message: "Signature uploaded successfully",
      signature: {
        id: insertedId.toString(),
        hr_id,
        file_url: `${publicBaseUrl}/api/signatures/file/${insertedId.toString()}`,
        file_hash: fileHash,
        uploaded_at: signaturePayload.uploaded_at,
        status: "active",
      },
    });
  } catch (serverError) {
    console.error("[UploadSignature] Unexpected server error:", serverError);
    return res.status(500).json({ error: "Unexpected backend error" });
  }
});

app.post("/api/signatures/revoke", async (req, res) => {
  const { hr_id } = req.body ?? {};

  if (!hr_id) {
    return res.status(400).json({ error: "hr_id is required" });
  }

  try {
    const result = await db.collection(mongoSignaturesCollection).findOneAndUpdate(
      { hr_id, status: "active" },
      { $set: { status: "revoked", revoked_at: new Date().toISOString() } },
      { sort: { uploaded_at: -1 }, returnDocument: "after" },
    );

    const signature = result?.value ?? result ?? null;
    return res.status(200).json({
      message: signature ? "Signature revoked" : "No active signature found",
      signature: signature
        ? {
            id: signature._id.toString(),
            hr_id: signature.hr_id,
            file_url: `${publicBaseUrl}/api/signatures/file/${signature._id.toString()}`,
            file_hash: signature.file_hash,
            uploaded_at: signature.uploaded_at,
            status: signature.status,
          }
        : null,
    });
  } catch (serverError) {
    console.error("[RevokeSignature] Mongo update error:", serverError);
    return res.status(500).json({ error: "Unexpected backend error" });
  }
});

app.post("/api/document-audit", async (req, res) => {
  const {
    document_id,
    signature_hash,
    document_hash,
    signed_by,
    signed_at,
    workflow_id,
  } = req.body ?? {};

  if (!document_id || !document_hash || !signed_by || !workflow_id) {
    return res.status(400).json({ error: "document_id, document_hash, signed_by and workflow_id are required" });
  }

  const payload = {
    document_id,
    signature_hash: signature_hash || null,
    document_hash,
    signed_by,
    signed_at: signed_at || new Date().toISOString(),
    workflow_id,
  };

  try {
    const result = await db.collection(mongoDocumentAuditCollection).insertOne(payload);
    return res.status(201).json({
      message: "Document audit stored",
      audit: {
        id: result.insertedId.toString(),
        ...payload,
      },
    });
  } catch (serverError) {
    console.error("[DocumentAudit] Mongo insert error:", serverError);
    return res.status(500).json({ error: "Unexpected backend error" });
  }
});

app.post("/api/employees", async (req, res) => {
  const {
    full_name,
    email,
    department,
    role,
    phone,
    probation_period,
    manager_assigned,
    date_of_joining,
  } = req.body ?? {};

  if (!role) {
    return res.status(400).json({ error: "role is required" });
  }

  const payload = {
    full_name: full_name ?? "",
    email: email ?? "",
    department: department ?? "",
    role,
    phone: phone ?? "",
    probation_period: probation_period ?? "",
    manager_assigned: manager_assigned ?? "",
    date_of_joining: date_of_joining || null,
  };

  console.log("[AddEmployee] Incoming payload:", payload);
  console.log("[AddEmployee] Target collection:", mongoEmployeesCollection);

  try {
    const result = await db.collection(mongoEmployeesCollection).insertOne(payload);

    return res.status(201).json({
      message: "Employee added",
      employee: {
        id: result.insertedId.toString(),
        ...payload,
      },
    });
  } catch (serverError) {
    console.error("[AddEmployee] Mongo insert error:", serverError);
    return res.status(500).json({ error: "Unexpected backend error" });
  }
});

app.use((error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request payload too large. Please upload a smaller file (max ~15MB).",
    });
  }

  return next(error);
});

const startServer = async () => {
  await mongoClient.connect();
  db = mongoClient.db(mongoDbName);

  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log(`[Startup] MongoDB connected: true`);
    console.log(`[Startup] MongoDB database: ${mongoDbName}`);
    console.log(`[Startup] Employees collection: ${mongoEmployeesCollection}`);
    console.log(`[Startup] Signatures collection: ${mongoSignaturesCollection}`);
    console.log(`[Startup] Document audit collection: ${mongoDocumentAuditCollection}`);
    console.log(`[Startup] HR data collection: ${mongoHrDataCollection}`);
  });
};

startServer().catch((error) => {
  console.error("[Startup] Unable to connect to MongoDB:", error);
  process.exit(1);
});
