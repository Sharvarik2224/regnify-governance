import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadServiceAccount = () => {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (envJson) {
    return JSON.parse(envJson);
  }

  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or add src/config/serviceAccountKey.json");
  }

  return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
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
