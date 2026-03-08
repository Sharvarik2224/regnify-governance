import express from "express";
import getFirebaseAdmin from "../config/firebaseAdmin.js";
import authenticate from "../middleware/authenticate.js";

const createAuthRoutes = ({ getDb, logAudit, usersCollectionName = process.env.MONGODB_USERS_COLLECTION || "users" }) => {
  const router = express.Router();
  const allowedRoles = new Set(["hr", "manager", "employee", "site-head"]);

  router.post("/sync-user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        if (typeof logAudit === "function") {
          await logAudit({
            actor: String(req.body?.email || "Unknown User"),
            action: "Login Failed",
            entity: "Auth",
            metadata: {
              reason: "No token provided",
              requestedRole: String(req.body?.role || "").toLowerCase() || null,
            },
          });
        }

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
      const isNewUser = !user;

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
        if (typeof logAudit === "function") {
          await logAudit({
            actor: decoded.email || uid,
            action: "Login Failed",
            entity: "Auth",
            entityId: uid,
            metadata: {
              reason: "Role mismatch",
              registeredRole: user.role,
              requestedRole,
            },
          });
        }

        return res.status(403).json({
          message: `Role mismatch. This email is registered as ${user.role}.`,
        });
      }

      if (user.is_active === false) {
        if (typeof logAudit === "function") {
          await logAudit({
            actor: decoded.email || uid,
            action: "Login Failed",
            entity: "Auth",
            entityId: uid,
            metadata: {
              reason: "Account not activated",
              role: user.role,
            },
          });
        }

        return res.status(403).json({ message: "Account not activated" });
      }

      if (typeof logAudit === "function") {
        await logAudit({
          actor: decoded.email || uid,
          action: "Login Success",
          entity: "Auth",
          entityId: uid,
          metadata: {
            role: user.role,
            isNewUser,
            requestedRole,
          },
        });
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

      if (typeof logAudit === "function") {
        await logAudit({
          actor: String(req.body?.email || "Unknown User"),
          action: "Login Failed",
          entity: "Auth",
          metadata: {
            reason: message,
          },
        });
      }

      return res.status(isConfigError ? 500 : 401).json({
        message: isConfigError ? "Firebase Admin configuration error" : "Unauthorized",
        details: message,
      });
    }
  });

  router.post("/login-failed", async (req, res) => {
    try {
      const { email, reason, requestedRole, stage } = req.body ?? {};

      if (typeof logAudit === "function") {
        await logAudit({
          actor: String(email || "Unknown User"),
          action: "Login Failed",
          entity: "Auth",
          metadata: {
            reason: String(reason || "Unknown reason"),
            requestedRole: String(requestedRole || "").toLowerCase() || null,
            stage: String(stage || "client"),
          },
        });
      }

      return res.status(200).json({ message: "Login failure logged" });
    } catch (error) {
      console.error("[LoginFailed] Logging error:", error);
      return res.status(500).json({ message: "Unable to log login failure" });
    }
  });

  router.post("/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const admin = getFirebaseAdmin();
      const decoded = await admin.auth().verifyIdToken(token);
      const { uid } = decoded;

      if (typeof logAudit === "function") {
        await logAudit({
          actor: decoded.email || uid,
          action: "Logout Success",
          entity: "Auth",
          entityId: uid,
          metadata: {
            role: String(req.body?.role || "").toLowerCase() || null,
          },
        });
      }

      return res.status(200).json({ message: "Logout logged" });
    } catch (error) {
      console.error("[Logout] Auth error:", error);

      const message = error instanceof Error
        ? error.message
        : "Unauthorized";

      return res.status(401).json({
        message: "Unauthorized",
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
