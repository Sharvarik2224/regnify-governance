import express from "express";
import getFirebaseAdmin from "../config/firebaseAdmin.js";
import authenticate from "../middleware/authenticate.js";

const createAuthRoutes = ({ getDb, usersCollectionName = process.env.MONGODB_USERS_COLLECTION || "users" }) => {
  const router = express.Router();
  const allowedRoles = new Set(["hr", "manager", "employee", "site-head"]);

  router.post("/sync-user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const requestedRoleRaw = String(req.body?.role || "").toLowerCase();
      const hasRequestedRole = allowedRoles.has(requestedRoleRaw);
      const requestedRole = hasRequestedRole
        ? requestedRoleRaw
        : "employee";

      const admin = getFirebaseAdmin();
      const decoded = await admin.auth().verifyIdToken(token);
      const { uid } = decoded;

      const db = getDb();
      if (!db) {
        return res.status(503).json({ message: "Database not ready" });
      }

      let user = await db.collection(usersCollectionName).findOne({ firebase_uid: uid });

      if (!user) {
        const now = new Date().toISOString();
        const createdUser = {
          firebase_uid: uid,
          email: decoded.email || "",
          role: requestedRole,
          is_active: true,
          created_at: now,
          updated_at: now,
        };

        await db.collection(usersCollectionName).insertOne(createdUser);
        user = createdUser;
      } else if (hasRequestedRole && user.role !== requestedRole) {
        return res.status(403).json({
          message: `Role mismatch. This email is registered as ${user.role}.`,
        });
      }

      if (user.is_active === false) {
        return res.status(403).json({ message: "Account not activated" });
      }

      return res.status(200).json({
        message: "User authenticated",
        role: user.role,
      });
    } catch (error) {
      console.error("[SyncUser] Auth error:", error);

      const message = error instanceof Error
        ? error.message
        : "Unauthorized";

      const isConfigError =
        message.includes("service account") ||
        message.includes("FIREBASE_SERVICE_ACCOUNT_JSON") ||
        message.includes("Unexpected token") ||
        message.includes("JSON");

      return res.status(isConfigError ? 500 : 401).json({
        message: isConfigError ? "Firebase Admin configuration error" : "Unauthorized",
        details: message,
      });
    }
  });

  router.get("/hr-only", authenticate, async (req, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(503).json({ message: "Database not ready" });
      }

      const user = await db.collection(usersCollectionName).findOne({ firebase_uid: req.user.uid });

      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }

      if (user.role !== "HR") {
        return res.status(403).json({ message: "Access denied" });
      }

      return res.status(200).json({ message: "Welcome HR" });
    } catch (error) {
      console.error("[HrOnly] Error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/protected", authenticate, (req, res) => {
    return res.status(200).json({
      message: "Access granted",
      user: req.user,
    });
  });

  return router;
};

export default createAuthRoutes;
