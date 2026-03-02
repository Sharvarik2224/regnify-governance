import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || "regnify_hr";
const mongoEmployeesCollection = process.env.MONGODB_EMPLOYEES_COLLECTION || "employees";
const mongoSignaturesCollection = process.env.MONGODB_SIGNATURES_COLLECTION || "signatures";
const mongoDigitalCertificatesCollection = process.env.MONGODB_DIGITAL_CERTIFICATES_COLLECTION || "digital_certificates";
const mongoDocumentAuditCollection = process.env.MONGODB_DOCUMENT_AUDIT_COLLECTION || "document_audit";
const mongoHrDataCollection = process.env.MONGODB_HR_DATA_COLLECTION || "hr_data";

if (!mongoUri) {
  throw new Error("MONGODB_URI is required.");
}

const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000 });

const run = async () => {
  await client.connect();
  const db = client.db(mongoDbName);

  await db.collection(mongoEmployeesCollection).createIndex({ email: 1 }, { sparse: true });
  await db.collection(mongoHrDataCollection).createIndex({ hr_id: 1 }, { unique: true });

  await db.collection(mongoSignaturesCollection).createIndex({ hr_id: 1, uploaded_at: -1 });
  await db.collection(mongoSignaturesCollection).createIndex({ hr_id: 1, status: 1, uploaded_at: -1 });
  await db.collection(mongoDigitalCertificatesCollection).createIndex({ hr_id: 1 }, { unique: true });

  await db.collection(mongoDocumentAuditCollection).createIndex({ document_id: 1 });
  await db.collection(mongoDocumentAuditCollection).createIndex({ workflow_id: 1 });
  await db.collection(mongoDocumentAuditCollection).createIndex({ signed_at: -1 });

  console.log("MongoDB indexes created successfully.");
};

run()
  .catch((error) => {
    console.error("Failed to create MongoDB indexes:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
