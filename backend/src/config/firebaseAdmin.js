import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeServiceAccount = (serviceAccount) => {
  if (!serviceAccount || typeof serviceAccount !== "object") {
    throw new Error("Invalid Firebase service account payload.");
  }

  const normalized = { ...serviceAccount };
  if (typeof normalized.private_key === "string") {
    // Render env values often store escaped newlines as literal "\\n".
    normalized.private_key = normalized.private_key.replace(/\\n/g, "\n");
  }

  return normalized;
};

const loadServiceAccount = () => {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (envJson) {
    try {
      return normalizeServiceAccount(JSON.parse(envJson));
    } catch (error) {
      throw new Error(
        `Invalid FIREBASE_SERVICE_ACCOUNT_JSON. ${error instanceof Error ? error.message : "Unable to parse JSON."}`,
      );
    }
  }

  const envBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (envBase64) {
    try {
      const decoded = Buffer.from(envBase64, "base64").toString("utf8");
      return normalizeServiceAccount(JSON.parse(decoded));
    } catch (error) {
      throw new Error(
        `Invalid FIREBASE_SERVICE_ACCOUNT_BASE64. ${error instanceof Error ? error.message : "Unable to decode base64 JSON."}`,
      );
    }
  }

  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or add src/config/serviceAccountKey.json");
  }

  return normalizeServiceAccount(JSON.parse(fs.readFileSync(serviceAccountPath, "utf8")));
};

const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  const serviceAccount = loadServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
};

export default getFirebaseAdmin;
