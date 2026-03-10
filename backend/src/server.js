import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Binary, MongoClient, ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { SignPdf } from 'node-signpdf';
const signer = new SignPdf();
import { plainAddPlaceholder } from 'node-signpdf/dist/helpers/index.js';
import createAuthRoutes from "./routes/auth.routes.js";
import { cleanupGeneratedCertificate, generateCertificate } from "./generateCert.js";
import youtubeRoutes from "../routes/youtube.routes.js";
import assignmentRoutes from "../routes/assignment.routes.js";
import { employeeRoutes } from "../routes/employee.routes.js";
dotenv.config();



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const port = Number(process.env.PORT);
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || "regnify_hr";
const mongoEmployeesCollection = process.env.MONGODB_EMPLOYEES_COLLECTION || "employees";
const mongoSignaturesCollection = process.env.MONGODB_SIGNATURES_COLLECTION || "signatures";
const mongoDigitalCertificatesCollection = process.env.MONGODB_DIGITAL_CERTIFICATES_COLLECTION || "digital_certificates";
const mongoDocumentAuditCollection = process.env.MONGODB_DOCUMENT_AUDIT_COLLECTION || "document_audit";
const mongoHrDataCollection = process.env.MONGODB_HR_DATA_COLLECTION || "hr_data";
const mongoAuditLogsCollection = process.env.MONGODB_AUDIT_LOGS_COLLECTION || "audit_logs";
const mongoTasksCollection = process.env.MONGODB_TASKS_COLLECTION || "Tasks";
const mongoEmployeePerformanceCollection = process.env.MONGODB_EMPLOYEE_PERFORMANCE_COLLECTION || "Employee_performance";
const mongoHrRequestsCollection = process.env.MONGODB_HR_REQUESTS_COLLECTION || "hr_requests";
const n8nGenRequestWebhookUrl = process.env.N8N_GENREQ_WEBHOOK_URL || "https://regnify-2.app.n8n.cloud/webhook-test/genreq";
const publicBaseUrl = process.env.PUBLIC_BASE_URL

if (!mongoUri) {
  throw new Error("MONGODB_URI is required.");
}

const mongoClient = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 10000,
});
let db;

const app = express();

const buildAuditHash = (payload) => crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
const auditStreamClients = new Set();
const allowedAuditActions = new Set([
  "Employee Created",
  "Login Success",
  "Login Failed",
  "Logout Success",
  "Offer Letter Generated",
  "Certificate Generation Triggered",
  "Digital Certificate Generated",
  "Uploading .p12 to database",
  "Profile Data Updated",
  "Task Assigned",
  "Task Submitted",
  "Task Approved",
  "Task Feedback Sent",
  "Employee Performance Updated",
  "HR Request Submitted",
]);

const toApiAuditLog = (logDocument) => ({
  id: logDocument._id?.toString?.() || logDocument.id,
  timestamp: logDocument.timestamp,
  actor: logDocument.actor,
  action: logDocument.action,
  entity: logDocument.entity,
  entityId: logDocument.entityId ?? null,
  metadata: logDocument.metadata ?? {},
  hash: logDocument.hash,
});

const broadcastAuditLog = (logDocument) => {
  const payload = `data: ${JSON.stringify(toApiAuditLog(logDocument))}\n\n`;
  for (const client of auditStreamClients) {
    client.write(payload);
  }
};

const deriveActorFromRequest = (req) => {
  return (
    req?.user?.role ||
    req?.user?.name ||
    req?.body?.hr_id ||
    req?.body?.official_email ||
    req?.body?.email ||
    "System"
  );
};

const logAudit = async ({ actor, action, entity, entityId = null, metadata = {} }) => {
  if (!db || !allowedAuditActions.has(action)) {
    return;
  }

  try {
    const timestamp = new Date();
    const entry = {
      timestamp,
      actor: actor || "System",
      action,
      entity,
      entityId,
      metadata,
    };

    const hash = buildAuditHash(entry);
    const insertResult = await db.collection(mongoAuditLogsCollection).insertOne({ ...entry, hash });
    broadcastAuditLog({
      _id: insertResult.insertedId,
      ...entry,
      hash,
    });
  } catch (auditError) {
    console.error("[AuditLog] Unable to persist audit log:", auditError);
  }
};

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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

app.get("/api/audit-logs/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write("retry: 2500\n\n");
  auditStreamClients.add(res);

  req.on("close", () => {
    auditStreamClients.delete(res);
  });
});

app.use("/api", createAuthRoutes({ getDb: () => db, logAudit }));

const getCertificateWebhookUrls = () => {
  const configuredWebhookUrl = process.env.N8N_CERTIFICATE_WEBHOOK_URL;
  const defaultTestUrl = "https://regnify.app.n8n.cloud/webhook-test/certificate-gen";
  const fallbackProdUrl = "https://regnify.app.n8n.cloud/webhook/certificate-gen";

  if (!configuredWebhookUrl) {
    return [defaultTestUrl, fallbackProdUrl];
  }

  if (configuredWebhookUrl.includes("/webhook-test/")) {
    return [configuredWebhookUrl, fallbackProdUrl];
  }

  return [configuredWebhookUrl];
};

app.post("/api/generate-certificate", async (req, res) => {
  const { name, email, company } = req.body ?? {};

  if (!name || !email || !company) {
    return res.status(400).json({ error: "name, email and company are required" });
  }

  try {
    const payload = { name, email, company };
    const webhookUrls = getCertificateWebhookUrls();

    let finalResponse = null;
    let finalData = null;

    for (const webhookUrl of webhookUrls) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : { message: "Webhook triggered successfully" };
      } catch {
        data = { message: responseText || "Webhook triggered successfully" };
      }

      finalResponse = response;
      finalData = data;

      // If webhook-test is not active (404), retry production webhook URL.
      if (response.status === 404 && webhookUrl.includes("/webhook-test/")) {
        continue;
      }

      break;
    }

    if (!finalResponse) {
      return res.status(502).json({ error: "No webhook response received" });
    }

    if (!finalResponse.ok) {
      return res.status(502).json({
        error: "Certificate generation webhook failed",
        details: finalData,
      });
    }

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Certificate Generation Triggered",
      entity: "Certificate",
      entityId: String(email || ""),
      metadata: {
        candidate: name,
        company,
      },
    });

    return res.status(200).json(finalData);
  } catch (error) {
    return res.status(500).json({
      error: "Unable to trigger certificate generation webhook",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/hr-ai-generate-request", async (req, res) => {
  const { subject, message, employee_name, employee_email } = req.body ?? {};

  try {
    const payload = {
      subject: String(subject || "").trim(),
      message: String(message || "").trim(),
      employee_name: String(employee_name || "").trim(),
      employee_email: String(employee_email || "").trim().toLowerCase(),
      requested_at: new Date().toISOString(),
    };

    const webhookResponse = await fetch(n8nGenRequestWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await webhookResponse.text();
    let responsePayload;
    try {
      responsePayload = responseText ? JSON.parse(responseText) : { message: "Webhook triggered" };
    } catch {
      responsePayload = { message: responseText || "Webhook triggered" };
    }

    if (!webhookResponse.ok) {
      return res.status(502).json({
        error: "Unable to trigger AI generation webhook",
        details: responsePayload,
      });
    }

    return res.status(200).json({
      message: "AI generation webhook triggered",
      data: responsePayload,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to trigger AI generation webhook",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/hr-requests", async (req, res) => {
  const { subject, message, employee_name, employee_email, attachments } = req.body ?? {};

  if (!subject || !message || !employee_email) {
    return res.status(400).json({ error: "subject, message and employee_email are required" });
  }

  const normalizedAttachments = Array.isArray(attachments)
    ? attachments
        .map((file) => ({
          name: String(file?.name || "").trim(),
          mime_type: String(file?.mimeType || file?.mime_type || "application/octet-stream"),
          size: Number(file?.size || 0),
          file_data: file?.base64 ? new Binary(parseDataUrlToBuffer(String(file.base64))) : null,
        }))
        .filter((file) => file.name && file.file_data)
    : [];

  const payload = {
    event_type: "employee_hr_request",
    subject: String(subject).trim(),
    message: String(message).trim(),
    employee_name: String(employee_name || "").trim(),
    employee_email: String(employee_email || "").trim().toLowerCase(),
    attachments: normalizedAttachments,
    feedback_notes: [],
    created_at: new Date().toISOString(),
  };

  try {
    const result = await db.collection(mongoHrRequestsCollection).insertOne(payload);

    await logAudit({
      actor: payload.employee_email,
      action: "HR Request Submitted",
      entity: "HR Request",
      entityId: result.insertedId.toString(),
      metadata: {
        subject: payload.subject,
        attachments: normalizedAttachments.length,
      },
    });

    return res.status(201).json({
      message: "HR request submitted",
      request: {
        id: result.insertedId.toString(),
        subject: payload.subject,
        message: payload.message,
        employee_name: payload.employee_name,
        employee_email: payload.employee_email,
        attachments: normalizedAttachments.map((file) => ({
          name: file.name,
          mime_type: file.mime_type,
          size: file.size,
        })),
        created_at: payload.created_at,
      },
    });
  } catch (serverError) {
    console.error("[CreateHrRequest] Mongo insert error:", serverError);
    return res.status(500).json({ error: "Unable to submit HR request" });
  }
});

app.get("/api/hr-requests", async (_req, res) => {
  try {
    const requests = await db
      .collection(mongoHrRequestsCollection)
      .find({ event_type: "employee_hr_request" }, { sort: { created_at: -1 }, projection: { "attachments.file_data": 0 } })
      .toArray();

    return res.status(200).json({
      requests: requests.map((request) => ({
        id: request._id.toString(),
        subject: request.subject || "",
        message: request.message || "",
        employee_name: request.employee_name || "",
        employee_email: request.employee_email || "",
        created_at: request.created_at || null,
        feedback_notes: Array.isArray(request.feedback_notes)
          ? request.feedback_notes
              .map((note) => ({
                note: String(note?.note || "").trim(),
                hr_name: String(note?.hr_name || "").trim(),
                hr_email: String(note?.hr_email || "").trim(),
                created_at: note?.created_at || null,
              }))
              .filter((note) => Boolean(note.note))
          : [],
        attachments: Array.isArray(request.attachments)
          ? request.attachments.map((file, index) => ({
              name: file.name || `Attachment ${index + 1}`,
              mime_type: file.mime_type || "application/octet-stream",
              size: Number(file.size || 0),
              download_url: `${publicBaseUrl || "http://localhost:5000"}/api/hr-requests/${request._id.toString()}/attachments/${index}`,
            }))
          : [],
      })),
    });
  } catch (serverError) {
    console.error("[GetHrRequests] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch HR requests" });
  }
});

app.post("/api/hr-requests/:id/feedback", async (req, res) => {
  const { id } = req.params;
  const { note, hr_name, hr_email } = req.body ?? {};

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid request id" });
  }

  const normalizedNote = String(note || "").trim();
  if (!normalizedNote) {
    return res.status(400).json({ error: "note is required" });
  }

  const feedbackEntry = {
    note: normalizedNote,
    hr_name: String(hr_name || "").trim(),
    hr_email: String(hr_email || "").trim().toLowerCase(),
    created_at: new Date().toISOString(),
  };

  try {
    const result = await db.collection(mongoHrRequestsCollection).findOneAndUpdate(
      { _id: new ObjectId(id), event_type: "employee_hr_request" },
      {
        $push: {
          feedback_notes: feedbackEntry,
        },
      },
      { returnDocument: "after" },
    );

    const updatedRequest = result?.value ?? result ?? null;
    if (!updatedRequest) {
      return res.status(404).json({ error: "HR request not found" });
    }

    await logAudit({
      actor: feedbackEntry.hr_email || feedbackEntry.hr_name || deriveActorFromRequest(req),
      action: "Task Feedback Sent",
      entity: "HR Request",
      entityId: id,
      metadata: {
        employee_email: updatedRequest.employee_email || "",
        subject: updatedRequest.subject || "",
      },
    });

    return res.status(200).json({
      message: "HR feedback note saved",
      feedback_note: feedbackEntry,
    });
  } catch (serverError) {
    console.error("[AddHrRequestFeedback] Mongo update error:", serverError);
    return res.status(500).json({ error: "Unable to save HR feedback note" });
  }
});

app.get("/api/hr-requests/:id/attachments/:index", async (req, res) => {
  const { id, index } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid request id" });
  }

  const attachmentIndex = Number(index);
  if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
    return res.status(400).json({ error: "Invalid attachment index" });
  }

  try {
    const requestDoc = await db.collection(mongoHrRequestsCollection).findOne({ _id: new ObjectId(id) });

    if (!requestDoc) {
      return res.status(404).json({ error: "HR request not found" });
    }

    const attachment = Array.isArray(requestDoc.attachments) ? requestDoc.attachments[attachmentIndex] : null;
    if (!attachment?.file_data) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const fileData = attachment.file_data;
    const fileBuffer = Buffer.isBuffer(fileData)
      ? fileData
      : fileData?.buffer
        ? Buffer.from(fileData.buffer)
        : Buffer.from(fileData);

    res.setHeader("Content-Type", attachment.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename=\"${attachment.name || "attachment"}\"`);
    return res.status(200).send(fileBuffer);
  } catch (serverError) {
    console.error("[GetHrRequestAttachment] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch attachment" });
  }
});

app.post("/api/generate-certificate/download", async (req, res) => {
  const { name, email, company } = req.body ?? {};

  if (!name || !email || !company) {
    return res.status(400).json({ error: "name, email and company are required" });
  }

  try {
    const payload = { name, email, company };
    const webhookUrls = getCertificateWebhookUrls();

    for (const webhookUrl of webhookUrls) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Retry production URL if webhook-test listener is inactive.
      if (response.status === 404 && webhookUrl.includes("/webhook-test/")) {
        continue;
      }

      if (!response.ok) {
        const responseText = await response.text();
        let details;

        try {
          details = responseText ? JSON.parse(responseText) : null;
        } catch {
          details = responseText || null;
        }

        return res.status(502).json({
          error: "Certificate generation webhook failed",
          details,
        });
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";

      // If workflow responded with JSON, surface it instead of forcing file download.
      if (contentType.includes("application/json")) {
        const payloadData = await response.json().catch(() => null);
        return res.status(502).json({
          error: "Webhook returned JSON instead of certificate binary",
          details: payloadData,
        });
      }

      const contentDisposition =
        response.headers.get("content-disposition") ||
        `attachment; filename="${String(email).split("@")[0] || "certificate"}.p12"`;

      const certificateBinary = Buffer.from(await response.arrayBuffer());

      await logAudit({
        actor: deriveActorFromRequest(req),
        action: "Digital Certificate Downloaded",
        entity: "HR Certificate",
        entityId: String(email || ""),
        metadata: {
          certificateType: "PKCS12",
          candidate: name,
          company,
        },
      });

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", contentDisposition);
      res.setHeader("Content-Length", String(certificateBinary.length));
      return res.status(200).send(certificateBinary);
    }

    return res.status(502).json({ error: "No webhook response received" });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to download digital certificate",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/generate", async (req, res) => {
  const { name, email, company } = req.body ?? {};

  if (!name || !email || !company) {
    return res.status(400).json({ error: "name, email and company are required" });
  }

  let cleanupPath = "";

  try {
    const generated = await generateCertificate(name, email, company);
    cleanupPath = generated.cleanupPath;

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Digital Certificate Generated",
      entity: "HR Certificate",
      entityId: String(email || ""),
      metadata: {
        certificateType: "PKCS12",
        candidate: name,
        company,
      },
    });

    return res.download(generated.filePath, "certificate.p12", async (downloadError) => {
      await cleanupGeneratedCertificate(cleanupPath).catch(() => {
        // Ignore cleanup errors after response lifecycle.
      });

      if (downloadError) {
        console.error("[GenerateCertificate] Download error:", downloadError);
      }
    });
  } catch (error) {
    await cleanupGeneratedCertificate(cleanupPath).catch(() => {
      // Ignore cleanup errors while handling request errors.
    });

    return res.status(500).json({
      error: "Unable to generate certificate",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
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
    site_head_approval_required,
    workflow_update_channel,
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
    const workflowUpdateChannel = workflow_update_channel === "whatsapp" || workflow_update_channel === "gmail"
      ? workflow_update_channel
      : "gmail";

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
      site_head_approval_required: Boolean(site_head_approval_required),
      workflow_update_channel: workflowUpdateChannel,
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

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Profile Data Updated",
      entity: "HR Profile",
      entityId: hr_id,
      metadata: {
        hr_name: hr_name ?? "",
        official_email,
        department: department ?? "",
      },
    });

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

app.post("/api/hr-data/workflow-settings", async (req, res) => {
  const {
    hr_id,
    generate_offer_letters_enabled,
    site_head_approval_required,
    workflow_update_channel,
  } = req.body ?? {};

  if (!hr_id) {
    return res.status(400).json({ error: "hr_id is required" });
  }

  const workflowUpdateChannel = workflow_update_channel === "whatsapp" || workflow_update_channel === "gmail"
    ? workflow_update_channel
    : "gmail";

  try {
    await db.collection(mongoHrDataCollection).updateOne(
      { hr_id },
      {
        $set: {
          generate_offer_letters_enabled: Boolean(generate_offer_letters_enabled),
          site_head_approval_required: Boolean(site_head_approval_required),
          workflow_update_channel: workflowUpdateChannel,
          updated_at: new Date().toISOString(),
        },
        $setOnInsert: { created_at: new Date().toISOString() },
      },
      { upsert: true },
    );

    const hrData = await db.collection(mongoHrDataCollection).findOne(
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
      message: "Workflow settings saved",
      hrData: hrData
        ? {
            id: hrData._id.toString(),
            ...hrData,
          }
        : null,
    });
  } catch (serverError) {
    console.error("[SaveWorkflowSettings] Mongo upsert error:", serverError);
    return res.status(500).json({ error: "Unable to save workflow settings" });
  }
});

app.post("/api/hr-data/workflow-manual-offer-letter", async (req, res) => {
  const {
    hr_id,
    file_name,
    mime_type,
    file_base64,
  } = req.body ?? {};

  if (!hr_id || !file_name || !mime_type || !file_base64) {
    return res.status(400).json({ error: "hr_id, file_name, mime_type and file_base64 are required" });
  }

  if (mime_type !== "application/pdf") {
    return res.status(400).json({ error: "Only PDF files are allowed" });
  }

  try {
    const payload = {
      event_type: "manual_offer_letter_upload",
      hr_id,
      file_name,
      mime_type,
      file_data: new Binary(parseDataUrlToBuffer(file_base64)),
      uploaded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const result = await db.collection(mongoDocumentAuditCollection).insertOne(payload);

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Offer Letter Generated",
      entity: "Offer Letter",
      entityId: result.insertedId.toString(),
      metadata: {
        hr_id,
        file_name,
        mime_type,
      },
    });

    return res.status(201).json({
      message: "Manual offer letter template stored",
      documentAudit: {
        id: result.insertedId.toString(),
        event_type: payload.event_type,
        hr_id: payload.hr_id,
        file_name: payload.file_name,
        mime_type: payload.mime_type,
        uploaded_at: payload.uploaded_at,
      },
    });
  } catch (serverError) {
    console.error("[UploadManualOfferLetter] Mongo insert error:", serverError);
    return res.status(500).json({ error: "Unable to store manual offer letter template" });
  }
});

app.post("/api/hr-data/password", async (req, res) => {
  const { hr_id, new_password } = req.body ?? {};

  if (!hr_id || !new_password) {
    return res.status(400).json({ error: "hr_id and new_password are required" });
  }

  try {
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

// Signature management endpoints - upload new signature, revoke existing signature, get active signature for HR. Only one active signature per HR is allowed - uploading a new signature will automatically revoke the previous active signature.
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

  const allowedMimeTypes = ["image/png", "image/jpeg","image/jpg"];
  if (!allowedMimeTypes.includes(mime_type)) {
    return res.status(400).json({ error: "Only image/png or image/jpeg or image/jpg signatures are supported" });
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

app.get("/api/digital-certificates/:hrId", async (req, res) => {
  const hrId = req.params.hrId;

  if (!hrId) {
    return res.status(400).json({ error: "hrId is required" });
  }

  try {
    const certificate = await db.collection(mongoDigitalCertificatesCollection).findOne(
      { hr_id: hrId },
      {
        sort: { updated_at: -1 },
        projection: { file_data: 0 },
      },
    );

    if (!certificate) {
      return res.status(200).json({ digitalCertificate: null });
    }

    return res.status(200).json({
      digitalCertificate: {
        id: certificate._id.toString(),
        ...certificate,
      },
    });
  } catch (serverError) {
    console.error("[GetDigitalCertificate] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch digital certificate" });
  }
});

// Endpoint to upload/update digital certificate - expects .p12 file in base64 format, along with a flag to enable/disable digital signing. Stores the certificate securely in MongoDB and associates it with the HR's profile. Only one active certificate per HR is allowed - uploading a new one will overwrite the existing certificate and settings.

app.post("/api/digital-certificates/save", async (req, res) => {
  const {
    hr_id,
    digital_signing_enabled,
    file_name,
    mime_type,
    file_base64,
  } = req.body ?? {};

  if (!hr_id) {
    return res.status(400).json({ error: "hr_id is required" });
  }

  const hasFilePayload = Boolean(file_base64);
  const normalizedFileName = String(file_name || "").trim();
  if (hasFilePayload) {
    if (!normalizedFileName || !normalizedFileName.toLowerCase().endsWith(".p12")) {
      return res.status(400).json({ error: "Only .p12 digital certificate files are allowed" });
    }
  }

  try {
    const updatePayload = {
      hr_id,
      digital_signing_enabled: Boolean(digital_signing_enabled),
      updated_at: new Date().toISOString(),
    };

    if (hasFilePayload) {
      updatePayload.file_name = normalizedFileName;
      updatePayload.mime_type = mime_type || "application/x-pkcs12";
      updatePayload.file_data = new Binary(parseDataUrlToBuffer(file_base64));
      updatePayload.uploaded_at = new Date().toISOString();
    }

    await db.collection(mongoDigitalCertificatesCollection).updateOne(
      { hr_id },
      {
        $set: updatePayload,
        $setOnInsert: { created_at: new Date().toISOString() },
      },
      { upsert: true },
    );

    const savedCertificate = await db.collection(mongoDigitalCertificatesCollection).findOne(
      { hr_id },
      { projection: { file_data: 0 } },
    );

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: hasFilePayload ? "Digital Certificate Generated" : "Profile Data Updated",
      entity: "HR Certificate",
      entityId: hr_id,
      metadata: {
        certificateType: hasFilePayload ? "PKCS12" : null,
        digital_signing_enabled: Boolean(digital_signing_enabled),
        file_name: hasFilePayload ? normalizedFileName : null,
      },
    });

    if (hasFilePayload) {
      await logAudit({
        actor: deriveActorFromRequest(req),
        action: "Uploading .p12 to database",
        entity: "HR Certificate",
        entityId: hr_id,
        metadata: {
          file_name: normalizedFileName,
          mime_type: mime_type || "application/x-pkcs12",
        },
      });
    }

    return res.status(200).json({
      message: "Digital certificate settings saved",
      digitalCertificate: savedCertificate
        ? {
            id: savedCertificate._id.toString(),
            ...savedCertificate,
          }
        : null,
    });
  } catch (serverError) {
    console.error("[SaveDigitalCertificate] Mongo upsert error:", serverError);
    return res.status(500).json({ error: "Unable to save digital certificate settings" });
  }
});

// Document audit endpoint - stores an audit record for each document signed, with details of the signature and signer
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

    await logAudit({
      actor: signed_by,
      action: "Document Audit Stored",
      entity: "Document",
      entityId: document_id,
      metadata: {
        workflow_id,
        signature_hash: signature_hash || null,
      },
    });

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

//PDF signing endpoint - expects base64 encoded PDF and certificate, returns base64 encoded signed PDF
app.post('/sign', async (req, res) => {
  try {
    const { pdf, certificate } = req.body;

    if (!pdf || !certificate) {
      return res.status(400).json({
        error: 'Missing required fields: pdf and certificate'
      });
    }

    const pdfBuffer = Buffer.from(pdf, 'base64');
    const p12Buffer = Buffer.from(certificate, 'base64');

    // ✅ STEP 1: Add signature placeholder
    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: 'Document Approval',
      signatureLength: 8192,
    });

    // ✅ STEP 2: Sign the PDF
    const signedPdf = signer.sign(pdfWithPlaceholder, p12Buffer, {
      passphrase: process.env.CERT_PASSWORD,
    });

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "PDF Signed",
      entity: "Document",
      metadata: {
        certificateType: "PKCS12",
        pdfBytes: pdfBuffer.length,
      },
    });

    res.json({
      signedPdf: signedPdf.toString('base64'),
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to sign PDF',
      details: error.message,
    });
  }
});

app.get("/api/employees", async (_req, res) => {
  try {
    const employees = await db
      .collection(mongoEmployeesCollection)
      .find({}, { sort: { _id: -1 } })
      .toArray();

    return res.status(200).json({
      employees: employees.map((employee) => ({
        id: employee._id.toString(),
        ...employee,
      })),
    });
  } catch (serverError) {
    console.error("[GetEmployees] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch employees" });
  }
});

app.get("/api/employees/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid employee id" });
  }

  try {
    const employee = await db.collection(mongoEmployeesCollection).findOne({ _id: new ObjectId(id) });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.status(200).json({
      employee: {
        id: employee._id.toString(),
        ...employee,
      },
    });
  } catch (serverError) {
    console.error("[GetEmployeeById] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch employee" });
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

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Employee Created",
      entity: "Employee",
      entityId: result.insertedId.toString(),
      metadata: {
        full_name: payload.full_name,
        department: payload.department,
        role: payload.role,
      },
    });

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

const mapTaskDocumentToApi = (taskDocument) => ({
  id: taskDocument._id?.toString?.() || taskDocument.id,
  title: taskDocument.title || "",
  overview: taskDocument.overview || "",
  assignedToEmployeeId: taskDocument.assigned_to_employee_id || "",
  assignedToName: taskDocument.assigned_to_name || "",
  assignedToRole: taskDocument.assigned_to_role || "",
  assignedToEmail: taskDocument.assigned_to_email || "",
  department: taskDocument.department || "",
  category: taskDocument.category || "",
  priority: taskDocument.priority || "Medium",
  estimatedCompletionTime: taskDocument.estimated_completion_time || "",
  deadline: taskDocument.deadline || null,
  difficulty: taskDocument.difficulty || "Medium",
  requiredSkills: Array.isArray(taskDocument.required_skills) ? taskDocument.required_skills : [],
  attachments: Array.isArray(taskDocument.attachments) ? taskDocument.attachments : [],
  acceptanceCriteria: Array.isArray(taskDocument.acceptance_criteria) ? taskDocument.acceptance_criteria : [],
  reminderEnabled: Boolean(taskDocument.reminder_enabled),
  reminderBefore: taskDocument.reminder_before || "",
  status: taskDocument.status || "Pending",
  managerStatus: taskDocument.manager_status || "Pending",
  employeeStatus: taskDocument.employee_status || "pending",
  progress: Number.isFinite(taskDocument.progress) ? taskDocument.progress : 0,
  completedAt: taskDocument.completed_at || null,
  submission:
    taskDocument.submission ||
    (taskDocument.submission_data
      ? {
          deployment_url: taskDocument.submission_data.deployed_link || "",
          employee_comment: taskDocument.submission_data.comment || "",
          files: taskDocument.submission_data.image?.name ? [taskDocument.submission_data.image.name] : [],
          submitted_at: taskDocument.submission_data.submitted_at || null,
        }
      : {
          deployment_url: "",
          employee_comment: "",
          files: [],
          submitted_at: null,
        }),
  // Backward compatible field used by existing frontend components.
  submissionData:
    taskDocument.submission_data ||
    (taskDocument.submission
      ? {
          comment: taskDocument.submission.employee_comment || "",
          deployed_link: taskDocument.submission.deployment_url || "",
          image: null,
          submitted_at: taskDocument.submission.submitted_at || null,
        }
      : null),
  managerFeedback: taskDocument.manager_feedback || null,
  managerName: taskDocument.manager_name || "",
  managerEmail: taskDocument.manager_email || "",
  createdAt: taskDocument.created_at || null,
  updatedAt: taskDocument.updated_at || null,
});

app.get("/api/tasks", async (req, res) => {
  const assignedToEmployeeId = String(req.query.assignedToEmployeeId || "").trim();
  const assignedToEmail = String(req.query.assignedToEmail || "").trim().toLowerCase();

  const query = {};
  if (assignedToEmployeeId) {
    query.assigned_to_employee_id = assignedToEmployeeId;
  }
  if (assignedToEmail) {
    query.assigned_to_email = assignedToEmail;
  }

  try {
    const tasks = await db
      .collection(mongoTasksCollection)
      .find(query, { sort: { created_at: -1 } })
      .toArray();

    return res.status(200).json({
      tasks: tasks.map(mapTaskDocumentToApi),
    });
  } catch (serverError) {
    console.error("[GetTasks] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch tasks" });
  }
});

app.get("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  try {
    const task = await db.collection(mongoTasksCollection).findOne({ _id: new ObjectId(id) });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json({ task: mapTaskDocumentToApi(task) });
  } catch (serverError) {
    console.error("[GetTaskById] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch task" });
  }
});

app.post("/api/tasks", async (req, res) => {
  const {
    title,
    overview,
    assignedToEmployeeId,
    assignedToName,
    assignedToRole,
    assignedToEmail,
    department,
    category,
    priority,
    estimatedCompletionTime,
    deadline,
    difficulty,
    requiredSkills,
    attachments,
    acceptanceCriteria,
    reminderEnabled,
    reminderBefore,
    managerName,
    managerEmail,
  } = req.body ?? {};

  if (!title || !overview || !assignedToEmployeeId || !assignedToName || !assignedToEmail || !category || !priority || !deadline || !difficulty) {
    return res.status(400).json({
      error: "title, overview, assignedToEmployeeId, assignedToName, assignedToEmail, category, priority, deadline and difficulty are required",
    });
  }

  const payload = {
    title: String(title).trim(),
    overview: String(overview).trim(),
    assigned_to_employee_id: String(assignedToEmployeeId),
    assigned_to_name: String(assignedToName).trim(),
    assigned_to_role: String(assignedToRole || "").trim(),
    assigned_to_email: String(assignedToEmail || "").trim().toLowerCase(),
    department: String(department || "").trim(),
    category: String(category).trim(),
    priority: String(priority).trim(),
    estimated_completion_time: String(estimatedCompletionTime || "").trim(),
    deadline: String(deadline),
    difficulty: String(difficulty).trim(),
    required_skills: Array.isArray(requiredSkills)
      ? requiredSkills.map((skill) => String(skill).trim()).filter(Boolean)
      : [],
    attachments: Array.isArray(attachments)
      ? attachments
          .map((file) => ({
            name: String(file?.name || "").trim(),
            mimeType: String(file?.mimeType || "application/octet-stream"),
            base64: String(file?.base64 || ""),
            size: Number(file?.size || 0),
          }))
          .filter((file) => file.name && file.base64)
      : [],
    acceptance_criteria: Array.isArray(acceptanceCriteria)
      ? acceptanceCriteria.map((criterion) => String(criterion).trim()).filter(Boolean)
      : [],
    reminder_enabled: Boolean(reminderEnabled),
    reminder_before: reminderEnabled ? String(reminderBefore || "") : "",
    status: "Pending",
    manager_status: "Pending",
    employee_status: "pending",
    progress: 0,
    submission: {
      deployment_url: "",
      employee_comment: "",
      files: [],
      submitted_at: null,
    },
    manager_name: String(managerName || "Manager"),
    manager_email: String(managerEmail || "").trim().toLowerCase(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const result = await db.collection(mongoTasksCollection).insertOne(payload);

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Task Assigned",
      entity: "Task",
      entityId: result.insertedId.toString(),
      metadata: {
        title: payload.title,
        assigned_to: payload.assigned_to_name,
        priority: payload.priority,
        deadline: payload.deadline,
      },
    });

    return res.status(201).json({
      message: "Task assigned",
      task: mapTaskDocumentToApi({ _id: result.insertedId, ...payload }),
    });
  } catch (serverError) {
    console.error("[AssignTask] Mongo insert error:", serverError);
    return res.status(500).json({ error: "Unable to assign task" });
  }
});

const handleTaskSubmit = async (req, res) => {
  const { id } = req.params;
  const { comment, deployed_link, image_base64, image_name, image_mime_type, submitted_by_email } = req.body ?? {};

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  if (!comment && !deployed_link && !image_base64) {
    return res.status(400).json({ error: "At least one of comment, deployed_link or image_base64 is required" });
  }

  const submittedAt = new Date().toISOString();
  const normalizedComment = String(comment || "").trim();
  const normalizedDeployedLink = String(deployed_link || "").trim();
  const normalizedImageName = String(image_name || "").trim();
  const submissionData = {
    comment: normalizedComment,
    deployed_link: normalizedDeployedLink,
    image: image_base64
      ? {
          name: normalizedImageName || "task-image",
          mime_type: String(image_mime_type || "image/png"),
          base64: String(image_base64),
        }
      : null,
    submitted_by_email: String(submitted_by_email || "").trim().toLowerCase(),
    submitted_at: submittedAt,
  };

  try {
    const result = await db.collection(mongoTasksCollection).findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "completed",
          employee_status: "completed",
          manager_status: "In Progress",
          progress: 100,
          completed_at: submittedAt,
          submission: {
            deployment_url: normalizedDeployedLink,
            employee_comment: normalizedComment,
            files: normalizedImageName ? [normalizedImageName] : [],
            submitted_at: submittedAt,
          },
          submission_data: submissionData,
          updated_at: submittedAt,
        },
      },
      { returnDocument: "after" },
    );

    const updatedTask = result?.value ?? result ?? null;
    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Task Submitted",
      entity: "Task",
      entityId: id,
      metadata: {
        submitted_by_email: submissionData.submitted_by_email || null,
        has_deployed_link: Boolean(submissionData.deployed_link),
        has_image: Boolean(submissionData.image),
      },
    });

    return res.status(200).json({
      message: "Task submitted",
      task: mapTaskDocumentToApi(updatedTask),
    });
  } catch (serverError) {
    console.error("[SubmitTask] Mongo update error:", serverError);
    return res.status(500).json({ error: "Unable to submit task" });
  }
};

app.patch("/api/tasks/:id/submit", handleTaskSubmit);
app.post("/api/tasks/:id/submit", handleTaskSubmit);

const handleManagerReviewTask = async (req, res) => {
  const { id } = req.params;
  const { action, feedback_criteria, reviewer_email } = req.body ?? {};

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  if (action !== "approve" && action !== "feedback") {
    return res.status(400).json({ error: "action must be 'approve' or 'feedback'" });
  }

  if (action === "feedback" && !String(feedback_criteria || "").trim()) {
    return res.status(400).json({ error: "feedback_criteria is required when action is 'feedback'" });
  }

  const reviewedAt = new Date().toISOString();
  const nextUpdate =
    action === "approve"
      ? {
          status: "Completed",
          manager_status: "Completed",
          progress: 100,
          updated_at: reviewedAt,
        }
      : {
          status: "In Progress",
          manager_status: "In Progress",
          manager_feedback: {
            criteria: String(feedback_criteria || "").trim(),
            reviewer_email: String(reviewer_email || "").trim().toLowerCase(),
            reviewed_at: reviewedAt,
          },
          updated_at: reviewedAt,
        };

  try {
    const result = await db.collection(mongoTasksCollection).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: nextUpdate },
      { returnDocument: "after" },
    );

    const updatedTask = result?.value ?? result ?? null;
    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: action === "approve" ? "Task Approved" : "Task Feedback Sent",
      entity: "Task",
      entityId: id,
      metadata: {
        reviewer_email: String(reviewer_email || "").trim().toLowerCase() || null,
      },
    });

    return res.status(200).json({
      message: action === "approve" ? "Task approved" : "Feedback shared",
      task: mapTaskDocumentToApi(updatedTask),
    });
  } catch (serverError) {
    console.error("[ManagerReviewTask] Mongo update error:", serverError);
    return res.status(500).json({ error: "Unable to process manager review" });
  }
};

app.patch("/api/tasks/:id/manager-review", handleManagerReviewTask);
app.post("/api/tasks/:id/manager-review", handleManagerReviewTask);

const mapEmployeePerformanceToApi = (performanceDocument) => ({
  id: performanceDocument._id?.toString?.() || performanceDocument.id,
  employee_email: performanceDocument.employee_email || "",
  completion_ratio: Number(performanceDocument.completion_ratio ?? 0),
  avg_delay_days: Number(performanceDocument.avg_delay_days ?? 0),
  attendance_percent: Number(performanceDocument.attendance_percent ?? 0),
  escalation_count: Number(performanceDocument.escalation_count ?? 0),
  warning_count: Number(performanceDocument.warning_count ?? 0),
  manager_rating: Number(performanceDocument.manager_rating ?? 0),
  performance_trend: Number(performanceDocument.performance_trend ?? 0),
  task_consistency: Number(performanceDocument.task_consistency ?? 0),
  created_at: performanceDocument.created_at || null,
  updated_at: performanceDocument.updated_at || null,
});

app.get("/api/employee-performance", async (req, res) => {
  const employeeEmail = String(req.query.employeeEmail || "").trim().toLowerCase();
  const query = employeeEmail ? { employee_email: employeeEmail } : {};

  try {
    const records = await db
      .collection(mongoEmployeePerformanceCollection)
      .find(query, { sort: { updated_at: -1 } })
      .toArray();

    return res.status(200).json({
      performance: records.map(mapEmployeePerformanceToApi),
    });
  } catch (serverError) {
    console.error("[GetEmployeePerformance] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch employee performance data" });
  }
});

app.get("/api/employee-performance/:employeeEmail", async (req, res) => {
  const employeeEmail = String(req.params.employeeEmail || "").trim().toLowerCase();

  if (!employeeEmail) {
    return res.status(400).json({ error: "employeeEmail is required" });
  }

  try {
    const record = await db.collection(mongoEmployeePerformanceCollection).findOne({ employee_email: employeeEmail });

    if (!record) {
      return res.status(404).json({ error: "Employee performance record not found" });
    }

    return res.status(200).json({
      performance: mapEmployeePerformanceToApi(record),
    });
  } catch (serverError) {
    console.error("[GetEmployeePerformanceByEmail] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch employee performance data" });
  }
});

app.post("/api/employee-performance", async (req, res) => {
  const {
    employee_email,
    completion_ratio,
    avg_delay_days,
    attendance_percent,
    escalation_count,
    warning_count,
    manager_rating,
    performance_trend,
    task_consistency,
  } = req.body ?? {};

  const normalizedEmployeeEmail = String(employee_email || "").trim().toLowerCase();

  if (!normalizedEmployeeEmail) {
    return res.status(400).json({ error: "employee_email is required" });
  }

  const payload = {
    employee_email: normalizedEmployeeEmail,
    completion_ratio: Number(completion_ratio ?? 0),
    avg_delay_days: Number(avg_delay_days ?? 0),
    attendance_percent: Number(attendance_percent ?? 0),
    escalation_count: Number(escalation_count ?? 0),
    warning_count: Number(warning_count ?? 0),
    manager_rating: Number(manager_rating ?? 0),
    performance_trend: Number(performance_trend ?? 0),
    task_consistency: Number(task_consistency ?? 0),
    updated_at: new Date().toISOString(),
  };

  try {
    await db.collection(mongoEmployeePerformanceCollection).updateOne(
      { employee_email: normalizedEmployeeEmail },
      {
        $set: payload,
        $setOnInsert: { created_at: new Date().toISOString() },
      },
      { upsert: true },
    );

    const savedRecord = await db.collection(mongoEmployeePerformanceCollection).findOne({ employee_email: normalizedEmployeeEmail });

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Employee Performance Updated",
      entity: "Employee Performance",
      entityId: normalizedEmployeeEmail,
      metadata: {
        employee_email: normalizedEmployeeEmail,
      },
    });

    return res.status(200).json({
      message: "Employee performance saved",
      performance: savedRecord ? mapEmployeePerformanceToApi(savedRecord) : null,
    });
  } catch (serverError) {
    console.error("[UpsertEmployeePerformance] Mongo upsert error:", serverError);
    return res.status(500).json({ error: "Unable to save employee performance" });
  }
});

app.get("/api/audit-logs", async (req, res) => {
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 200)
    : 50;

  try {
    const logs = await db
      .collection(mongoAuditLogsCollection)
      .find(
        {
          action: { $in: Array.from(allowedAuditActions) },
        },
        { sort: { timestamp: -1 } },
      )
      .limit(limit)
      .toArray();

    return res.status(200).json(logs.map((log) => toApiAuditLog(log)));
  } catch (serverError) {
    console.error("[GetAuditLogs] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch audit logs" });
  }
});

app.use((error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request payload too large. Please upload a smaller file (max ~50MB).",
    });
  }

  return next(error);
});

// Add route handlers for imported routes
app.use("/api/youtube", youtubeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/employees", employeeRoutes);

const startServer = async () => {
  await mongoClient.connect();
  db = mongoClient.db(mongoDbName);

  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log("Certificate service running");
    console.log(`[Startup] MongoDB connected: true`);
    console.log(`[Startup] MongoDB database: ${mongoDbName}`);
    console.log(`[Startup] Employees collection: ${mongoEmployeesCollection}`);
    console.log(`[Startup] Signatures collection: ${mongoSignaturesCollection}`);
    console.log(`[Startup] Digital certificates collection: ${mongoDigitalCertificatesCollection}`);
    console.log(`[Startup] Document audit collection: ${mongoDocumentAuditCollection}`);
    console.log(`[Startup] Audit logs collection: ${mongoAuditLogsCollection}`);
    console.log(`[Startup] HR data collection: ${mongoHrDataCollection}`);
    console.log(`[Startup] Tasks collection: ${mongoTasksCollection}`);
    console.log(`[Startup] Employee performance collection: ${mongoEmployeePerformanceCollection}`);
  });
};

startServer().catch((error) => {
  console.error("[Startup] Unable to connect to MongoDB:", error);
  process.exit(1);
});
