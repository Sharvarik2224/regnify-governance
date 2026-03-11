import express from "express";
import getFirebaseAdmin from "../config/firebaseAdmin.js";
import authenticate from "../middleware/authenticate.js";

const WORKDAY_TARGET_HOURS = 8;
const ATTENDANCE_WINDOW_DAYS = 30;

const calculateAttendancePercent = (sessions) => {
  const now = Date.now();
  const windowStart = now - (ATTENDANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const hoursByDate = new Map();

  for (const session of Array.isArray(sessions) ? sessions : []) {
    const loginAt = new Date(session?.login_at || 0).getTime();
    const logoutAt = new Date(session?.logout_at || 0).getTime();

    if (Number.isNaN(loginAt) || Number.isNaN(logoutAt) || logoutAt <= loginAt || logoutAt < windowStart) {
      continue;
    }

    const dateKey = new Date(loginAt).toISOString().slice(0, 10);
    const workedHours = Math.max(0, (logoutAt - loginAt) / (1000 * 60 * 60));
    const previous = hoursByDate.get(dateKey) || 0;
    hoursByDate.set(dateKey, previous + workedHours);
  }

  if (hoursByDate.size === 0) {
    return 0;
  }

  const dayScores = Array.from(hoursByDate.values()).map((hours) => Math.min(1, hours / WORKDAY_TARGET_HOURS));
  const averageScore = dayScores.reduce((sum, score) => sum + score, 0) / dayScores.length;
  return Math.round((averageScore * 100 + Number.EPSILON) * 100) / 100;
};

const createAuthRoutes = ({
  getDb,
  logAudit,
  usersCollectionName = process.env.MONGODB_USERS_COLLECTION || "users",
  employeePerformanceCollectionName = process.env.MONGODB_EMPLOYEE_PERFORMANCE_COLLECTION || "Employee_performance",
  attendanceSessionsCollectionName = process.env.MONGODB_ATTENDANCE_SESSIONS_COLLECTION || "attendance_sessions",
}) => {
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

      // Employees cannot self-register. Their accounts must be provisioned by HR.
      if (isNewUser && requestedRole === "employee") {
        // Delete the Firebase account that was just created so it doesn't linger
        try { await admin.auth().deleteUser(uid); } catch (_) { /* best-effort */ }

        if (typeof logAudit === "function") {
          await logAudit({
            actor: decoded.email || uid,
            action: "Login Failed",
            entity: "Auth",
            metadata: {
              reason: "Employee self-signup blocked",
              email: decoded.email,
            },
          });
        }

        return res.status(403).json({
          message: "Employee accounts cannot be created via self-signup. Please contact your HR administrator to receive your login credentials.",
        });
      }

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

      if (user.role === "employee") {
        const existingOpenSession = await db.collection(attendanceSessionsCollectionName).findOne({
          employee_email: String(decoded.email || "").trim().toLowerCase(),
          logout_at: null,
        });

        if (!existingOpenSession) {
          await db.collection(attendanceSessionsCollectionName).insertOne({
            employee_email: String(decoded.email || "").trim().toLowerCase(),
            firebase_uid: uid,
            login_at: new Date().toISOString(),
            logout_at: null,
            worked_hours: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
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
      const db = getDb();
      if (!db) {
        return res.status(503).json({ message: "Database not ready" });
      }

      const userRecord = await db.collection(usersCollectionName).findOne({ firebase_uid: uid });
      const normalizedEmail = String(decoded.email || userRecord?.email || "").trim().toLowerCase();

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

      if ((userRecord?.role || req.body?.role) === "employee" && normalizedEmail) {
        const openSession = await db.collection(attendanceSessionsCollectionName).findOne(
          {
            employee_email: normalizedEmail,
            logout_at: null,
          },
          {
            sort: { login_at: -1 },
          },
        );

        if (openSession) {
          const logoutAt = new Date();
          const loginAtDate = new Date(openSession.login_at || logoutAt.toISOString());
          const workedHours = Math.max(0, (logoutAt.getTime() - loginAtDate.getTime()) / (1000 * 60 * 60));

          await db.collection(attendanceSessionsCollectionName).updateOne(
            { _id: openSession._id },
            {
              $set: {
                logout_at: logoutAt.toISOString(),
                worked_hours: Math.round((workedHours + Number.EPSILON) * 100) / 100,
                updated_at: logoutAt.toISOString(),
              },
            },
          );

          const recentSessions = await db.collection(attendanceSessionsCollectionName).find(
            {
              employee_email: normalizedEmail,
            },
            {
              sort: { login_at: -1 },
              limit: 120,
            },
          ).toArray();

          const attendancePercent = calculateAttendancePercent(recentSessions);
          const nowIso = new Date().toISOString();

          await db.collection(employeePerformanceCollectionName).updateOne(
            { employee_email: normalizedEmail },
            {
              $set: {
                employee_email: normalizedEmail,
                attendance_percent: attendancePercent,
                updated_at: nowIso,
              },
              $setOnInsert: {
                completion_ratio: 0,
                avg_delay_days: 0,
                escalation_count: 0,
                warning_count: 0,
                manager_rating: 0,
                performance_trend: 0,
                task_consistency: 0,
                created_at: nowIso,
              },
            },
            { upsert: true },
          );
        }
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
