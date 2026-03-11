import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Binary, MongoClient, ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { SignPdf } from 'node-signpdf';
const signer = new SignPdf();
import { plainAddPlaceholder } from 'node-signpdf/dist/helpers/index.js';
import createAuthRoutes from "./routes/auth.routes.js";
import getFirebaseAdmin from "./config/firebaseAdmin.js";
import { cleanupGeneratedCertificate, generateCertificate } from "./generateCert.js";
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
const mongoTeamsCollection = process.env.MONGODB_TEAMS_COLLECTION || "teams";
const mongoMetricsOneCollection = process.env.MONGODB_METRICS_ONE_COLLECTION || "metrics_one";
const mongoMetricsLegacyCollection = process.env.MONGODB_METRICS_LEGACY_COLLECTION || "metrics_1";
const mongoEmployeePerformanceCollection = process.env.MONGODB_EMPLOYEE_PERFORMANCE_COLLECTION || "Employee_performance";
const mongoHrRequestsCollection = process.env.MONGODB_HR_REQUESTS_COLLECTION || "hr_requests";
const mongoUsersCollection = process.env.MONGODB_USERS_COLLECTION || "users";
const mongoComplainsCollection = process.env.MONGODB_COMPLAINS_COLLECTION || "complains";
const n8nGenRequestWebhookUrl = process.env.N8N_GENREQ_WEBHOOK_URL || "https://regnify-2.app.n8n.cloud/webhook-test/genreq";
const n8nSendPassWebhookUrl = process.env.N8N_SENDPASS_WEBHOOK_URL || "https://regnify-2.app.n8n.cloud/webhook-test/sendpass";
const n8nSendPassWebhookSecret = process.env.N8N_SENDPASS_WEBHOOK_SECRET || "";
const n8nServiceToken = process.env.N8N_SERVICE_TOKEN || "";
const publicBaseUrl = process.env.PUBLIC_BASE_URL

const generatePasscode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[crypto.randomInt(0, chars.length)]).join("");
};

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
  "Digital Certificate Downloaded",
  "PDF Signed",
  "Manager Onboard Member",
  "Manager Report Generated",
  "Team Created",
  "Team Task Assigned",
  "Manager Warning Submitted",
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const roundTo = (value, digits = 4) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isTaskCompleted = (task) => {
  const status = String(task?.status || "").toLowerCase();
  const managerStatus = String(task?.manager_status || "").toLowerCase();
  return status === "completed" || managerStatus === "completed";
};

const getTaskCompletedAt = (task) => {
  return (
    task?.completed_at ||
    task?.submission?.submitted_at ||
    task?.submission_data?.submitted_at ||
    null
  );
};

const getTaskActivityAt = (task) => {
  return (
    task?.completed_at ||
    task?.manager_feedback?.reviewed_at ||
    task?.submission?.submitted_at ||
    task?.submission_data?.submitted_at ||
    task?.updated_at ||
    task?.created_at ||
    null
  );
};

const computeEmployeeMetrics = (employeeEmail, tasks, openComplaintCount = 0) => {
  const now = new Date();
  const assignedTasks = Array.isArray(tasks) ? tasks : [];
  const completedTasks = assignedTasks.filter((task) => isTaskCompleted(task));

  const assignedCount = assignedTasks.length;
  const completedCount = completedTasks.length;
  const completionRatio = assignedCount > 0 ? completedCount / assignedCount : 0;

  const delayDays = assignedTasks
    .map((task) => {
      const deadline = safeDate(task?.deadline);
      if (!deadline) {
        return null;
      }

      const endDate = isTaskCompleted(task)
        ? safeDate(getTaskCompletedAt(task))
        : now;

      if (!endDate) {
        return null;
      }

      return Math.max(0, (endDate.getTime() - deadline.getTime()) / MS_PER_DAY);
    })
    .filter((value) => Number.isFinite(value));

  const avgDelayDays = delayDays.length > 0
    ? delayDays.reduce((sum, value) => sum + value, 0) / delayDays.length
    : 0;

  const overdueOpenTasks = assignedTasks.filter((task) => {
    if (isTaskCompleted(task)) {
      return false;
    }

    const deadline = safeDate(task?.deadline);
    return Boolean(deadline && deadline.getTime() < now.getTime());
  }).length;

  const onTimeCompletedTasks = completedTasks.filter((task) => {
    const completedAt = safeDate(getTaskCompletedAt(task));
    const deadline = safeDate(task?.deadline);
    if (!completedAt || !deadline) {
      return false;
    }
    return completedAt.getTime() <= deadline.getTime();
  }).length;

  const highPriorityOverdues = assignedTasks.filter((task) => {
    const priority = String(task?.priority || "").toLowerCase();
    if (priority !== "high" && priority !== "critical") {
      return false;
    }

    if (isTaskCompleted(task)) {
      const completedAt = safeDate(getTaskCompletedAt(task));
      const deadline = safeDate(task?.deadline);
      return Boolean(completedAt && deadline && completedAt.getTime() > deadline.getTime());
    }

    const deadline = safeDate(task?.deadline);
    return Boolean(deadline && deadline.getTime() < now.getTime());
  }).length;

  const missedDeadlineCount = delayDays.filter((value) => value > 0).length;
  const severeDelayCount = delayDays.filter((value) => value >= 2).length;
  const feedbackWarnings = assignedTasks.filter((task) => String(task?.manager_feedback?.criteria || "").trim()).length;
  const warningCount = feedbackWarnings + missedDeadlineCount;
  const escalationCount = overdueOpenTasks + highPriorityOverdues + severeDelayCount + Math.max(0, Number(openComplaintCount) || 0);

  // Attendance proxy: share of tasks currently on-time (completed on/before deadline or active and not overdue).
  const onTimeActiveTasks = assignedTasks.filter((task) => {
    if (isTaskCompleted(task)) {
      return false;
    }

    const deadline = safeDate(task?.deadline);
    return Boolean(deadline && deadline.getTime() >= now.getTime());
  }).length;

  const onTimeWorkloadCount = onTimeCompletedTasks + onTimeActiveTasks;
  const attendancePercent = assignedCount > 0
    ? (onTimeWorkloadCount / assignedCount) * 100
    : 0;

  const onTimeRatio = completedCount > 0 ? onTimeCompletedTasks / completedCount : 0;
  const warningPenalty = Math.min(1, warningCount * 0.1);
  const escalationPenalty = Math.min(1, escalationCount * 0.08);
  const managerRating = 1 + (completionRatio * 2) + (onTimeRatio * 2) - warningPenalty - escalationPenalty;

  const recentWindowStart = new Date(now.getTime() - (30 * MS_PER_DAY));
  const previousWindowStart = new Date(now.getTime() - (60 * MS_PER_DAY));

  const recentTasks = assignedTasks.filter((task) => {
    const activityAt = safeDate(getTaskActivityAt(task));
    return Boolean(activityAt && activityAt.getTime() >= recentWindowStart.getTime());
  });

  const previousTasks = assignedTasks.filter((task) => {
    const activityAt = safeDate(getTaskActivityAt(task));
    if (!activityAt) return false;
    return activityAt.getTime() >= previousWindowStart.getTime() && activityAt.getTime() < recentWindowStart.getTime();
  });

  const computeWindowScore = (windowTasks) => {
    if (windowTasks.length === 0) {
      return completionRatio;
    }

    const scores = windowTasks.map((task) => {
      const completedScore = isTaskCompleted(task) ? 1 : 0;
      const deadline = safeDate(task?.deadline);
      const endDate = isTaskCompleted(task)
        ? safeDate(getTaskCompletedAt(task))
        : now;
      const isOnTime = Boolean(deadline && endDate && endDate.getTime() <= deadline.getTime());
      const timelinessScore = isOnTime ? 1 : 0;
      return (completedScore * 0.6) + (timelinessScore * 0.4);
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const recentCompletion = computeWindowScore(recentTasks);
  const previousCompletion = computeWindowScore(previousTasks);

  const performanceTrend = recentCompletion - previousCompletion;

  const adherenceScores = assignedTasks.map((task) => {
    const completionScore = isTaskCompleted(task) ? 1 : 0;
    const deadline = safeDate(task?.deadline);
    const endDate = isTaskCompleted(task)
      ? safeDate(getTaskCompletedAt(task))
      : now;
    const timelinessScore = Boolean(deadline && endDate && endDate.getTime() <= deadline.getTime()) ? 1 : 0;
    return (completionScore * 0.6) + (timelinessScore * 0.4);
  });

  const adherenceMean = adherenceScores.length > 0
    ? adherenceScores.reduce((sum, value) => sum + value, 0) / adherenceScores.length
    : 0;

  const adherenceVariance = adherenceScores.length > 1
    ? adherenceScores.reduce((sum, value) => sum + ((value - adherenceMean) ** 2), 0) / adherenceScores.length
    : 0;

  const adherenceStd = Math.sqrt(adherenceVariance);
  const maxReasonableStd = 0.5;
  const taskConsistency = Math.max(0, 1 - Math.min(1, adherenceStd / maxReasonableStd));

  return {
    employee_email: employeeEmail,
    assigned_tasks: assignedCount,
    completed_tasks: completedCount,
    completion_ratio: roundTo(completionRatio, 4),
    avg_delay_days: roundTo(avgDelayDays, 4),
    attendance_percent: roundTo(Math.max(0, Math.min(100, attendancePercent)), 2),
    escalation_count: escalationCount,
    warning_count: warningCount,
    manager_rating: roundTo(Math.max(1, Math.min(5, managerRating)), 2),
    performance_trend: roundTo(performanceTrend, 4),
    task_consistency: roundTo(taskConsistency, 4),
    source: "computed_from_tasks",
  };
};

const syncEmployeeMetrics = async (employeeEmails = []) => {
  if (!db) {
    return { processed: 0 };
  }

  const metricsCollectionNames = Array.from(new Set([
    mongoMetricsOneCollection,
    mongoMetricsLegacyCollection,
  ].filter(Boolean)));

  const normalizedEmails = Array.from(new Set(
    employeeEmails
      .map((email) => String(email || "").trim().toLowerCase())
      .filter(Boolean),
  ));

  const taskQuery = normalizedEmails.length > 0
    ? { assigned_to_email: { $in: normalizedEmails } }
    : {};

  const tasks = await db.collection(mongoTasksCollection).find(taskQuery).toArray();
  const groupedTasks = new Map();

  for (const task of tasks) {
    const employeeEmail = String(task?.assigned_to_email || "").trim().toLowerCase();
    if (!employeeEmail) {
      continue;
    }

    if (!groupedTasks.has(employeeEmail)) {
      groupedTasks.set(employeeEmail, []);
    }
    groupedTasks.get(employeeEmail).push(task);
  }

  const targetEmails = normalizedEmails.length > 0
    ? normalizedEmails
    : Array.from(groupedTasks.keys());

  const complaintQuery = normalizedEmails.length > 0
    ? {
      employee_email: { $in: normalizedEmails },
      status: { $ne: "resolved" },
    }
    : { status: { $ne: "resolved" } };

  const complaints = await db
    .collection(mongoComplainsCollection)
    .find(complaintQuery, { projection: { employee_email: 1 } })
    .toArray();

  const complaintCountsByEmail = new Map();
  for (const complaint of complaints) {
    const employeeEmail = String(complaint?.employee_email || "").trim().toLowerCase();
    if (!employeeEmail) {
      continue;
    }

    complaintCountsByEmail.set(employeeEmail, (complaintCountsByEmail.get(employeeEmail) || 0) + 1);
  }

  for (const employeeEmail of targetEmails) {
    const metricsPayload = computeEmployeeMetrics(
      employeeEmail,
      groupedTasks.get(employeeEmail) || [],
      complaintCountsByEmail.get(employeeEmail) || 0,
    );
    const metricsTimestamp = new Date().toISOString();

    for (const collectionName of metricsCollectionNames) {
      await db.collection(collectionName).updateOne(
        { employee_email: employeeEmail },
        {
          $set: {
            ...metricsPayload,
            updated_at: metricsTimestamp,
          },
          $setOnInsert: {
            created_at: metricsTimestamp,
          },
        },
        { upsert: true },
      );
    }

    const metricsOneDocument = await db.collection(mongoMetricsOneCollection).findOne(
      { employee_email: employeeEmail },
      {
        projection: {
          completion_ratio: 1,
          avg_delay_days: 1,
          attendance_percent: 1,
          escalation_count: 1,
          warning_count: 1,
          manager_rating: 1,
          performance_trend: 1,
          task_consistency: 1,
          assigned_tasks: 1,
          completed_tasks: 1,
        },
      },
    );

    await db.collection(mongoEmployeePerformanceCollection).updateOne(
      { employee_email: employeeEmail },
      {
        $set: {
          employee_email: employeeEmail,
          completion_ratio: Number(metricsOneDocument?.completion_ratio ?? 0),
          avg_delay_days: Number(metricsOneDocument?.avg_delay_days ?? 0),
          attendance_percent: Number(metricsOneDocument?.attendance_percent ?? 0),
          escalation_count: Number(metricsOneDocument?.escalation_count ?? 0),
          warning_count: Number(metricsOneDocument?.warning_count ?? 0),
          manager_rating: Number(metricsOneDocument?.manager_rating ?? 0),
          performance_trend: Number(metricsOneDocument?.performance_trend ?? 0),
          task_consistency: Number(metricsOneDocument?.task_consistency ?? 0),
          assigned_tasks: Number(metricsOneDocument?.assigned_tasks ?? 0),
          completed_tasks: Number(metricsOneDocument?.completed_tasks ?? 0),
          updated_at: new Date().toISOString(),
        },
        $setOnInsert: {
          created_at: new Date().toISOString(),
        },
      },
      { upsert: true },
    );
  }

  return { processed: targetEmails.length };
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

app.use("/api", createAuthRoutes({
  getDb: () => db,
  logAudit,
  employeePerformanceCollectionName: mongoEmployeePerformanceCollection,
  attendanceSessionsCollectionName: process.env.MONGODB_ATTENDANCE_SESSIONS_COLLECTION || "attendance_sessions",
}));

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
    employee_email: String(employee_email).trim().toLowerCase(),
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

app.post("/api/hr/provision-employee", async (req, res) => {
  const employeeId = String(req.body?.employee_id || "").trim();

  if (!employeeId || !ObjectId.isValid(employeeId)) {
    return res.status(400).json({ error: "employee_id is required and must be a valid ObjectId" });
  }

  try {
    const employee = await db.collection(mongoEmployeesCollection).findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found in the employees collection" });
    }

    const employeeEmail = String(employee.email || "").trim().toLowerCase();
    if (!employeeEmail) {
      return res.status(400).json({ error: "Employee record has no email address" });
    }

    const firebaseAdmin = getFirebaseAdmin();

    // Ensure Firebase Auth account exists. Password will be set by n8n callback.
    let firebaseUid;
    try {
      const firebaseUser = await firebaseAdmin.auth().createUser({
        email: employeeEmail,
        password: generatePasscode(),
        displayName: String(employee.full_name || "").trim() || employeeEmail,
        emailVerified: true,
      });
      firebaseUid = firebaseUser.uid;
    } catch (createError) {
      if (createError?.errorInfo?.code === "auth/email-already-exists") {
        const existingUser = await firebaseAdmin.auth().getUserByEmail(employeeEmail);
        firebaseUid = existingUser.uid;
      } else {
        throw createError;
      }
    }

    // Upsert in users collection
    await db.collection(mongoUsersCollection).updateOne(
      { firebase_uid: firebaseUid },
      {
        $set: {
          firebase_uid: firebaseUid,
          email: employeeEmail,
          role: "employee",
          is_active: true,
          employee_id: employeeId,
          updated_at: new Date().toISOString(),
        },
        $setOnInsert: { created_at: new Date().toISOString() },
      },
      { upsert: true },
    );

    if (!n8nSendPassWebhookUrl) {
      return res.status(500).json({
        error: "N8N_SENDPASS_WEBHOOK_URL is missing.",
      });
    }

    const webhookPayload = {
      employee_id: employeeId,
      employee_email: employeeEmail,
      employee_name: String(employee.full_name || "").trim() || "Employee",
      role: "employee",
      department: String(employee.department || "").trim() || "",
      manager: String(employee.manager_assigned || "").trim() || "",
      firebase_uid: firebaseUid,
      requested_by: deriveActorFromRequest(req),
      requested_at: new Date().toISOString(),
      password_update_callback_url: `${publicBaseUrl || "http://localhost:5000"}/api/integrations/n8n/employee-passcode`,
    };

    const webhookHeaders = {
      "Content-Type": "application/json",
      ...(n8nSendPassWebhookSecret ? { "x-regnify-signature": n8nSendPassWebhookSecret } : {}),
    };

    const webhookResponse = await fetch(n8nSendPassWebhookUrl, {
      method: "POST",
      headers: webhookHeaders,
      body: JSON.stringify(webhookPayload),
    });

    const webhookResponseText = await webhookResponse.text();
    let webhookResponsePayload;
    try {
      webhookResponsePayload = webhookResponseText ? JSON.parse(webhookResponseText) : null;
    } catch {
      webhookResponsePayload = webhookResponseText || null;
    }

    if (!webhookResponse.ok) {
      return res.status(502).json({
        error: "Unable to trigger credential workflow in n8n",
        details: webhookResponsePayload,
      });
    }

    await logAudit({
      actor: deriveActorFromRequest(req),
      action: "Employee Created",
      entity: "Employee",
      entityId: employeeId,
      metadata: {
        full_name: String(employee.full_name || ""),
        email: employeeEmail,
        provisioned_by: "HR",
      },
    });

    return res.status(200).json({
      message: `Credential workflow triggered for ${employeeEmail}`,
      email: employeeEmail,
      workflow: webhookResponsePayload,
    });
  } catch (serverError) {
    console.error("[ProvisionEmployee] Error:", serverError);
    return res.status(500).json({ error: serverError?.message || "Unable to provision employee account" });
  }
});

app.post("/api/integrations/n8n/employee-passcode", async (req, res) => {
  if (!n8nServiceToken) {
    return res.status(503).json({ error: "N8N_SERVICE_TOKEN is not configured on backend." });
  }

  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token || token !== n8nServiceToken) {
    return res.status(401).json({ error: "Unauthorized n8n callback" });
  }

  const employeeEmail = String(req.body?.employee_email || "").trim().toLowerCase();
  const firebaseUid = String(req.body?.firebase_uid || "").trim();
  const passcode = String(req.body?.passcode || "");

  if (!passcode || passcode.length < 8) {
    return res.status(400).json({ error: "passcode is required and must be at least 8 characters" });
  }

  if (!employeeEmail && !firebaseUid) {
    return res.status(400).json({ error: "employee_email or firebase_uid is required" });
  }

  try {
    const firebaseAdmin = getFirebaseAdmin();

    let targetUid = firebaseUid;
    if (!targetUid) {
      const firebaseUser = await firebaseAdmin.auth().getUserByEmail(employeeEmail);
      targetUid = firebaseUser.uid;
    }

    await firebaseAdmin.auth().updateUser(targetUid, {
      password: passcode,
      emailVerified: true,
    });

    await db.collection(mongoUsersCollection).updateOne(
      { firebase_uid: targetUid },
      {
        $set: {
          is_active: true,
          updated_at: new Date().toISOString(),
        },
      },
    );

    await logAudit({
      actor: "n8n",
      action: "Profile Data Updated",
      entity: "Employee Credentials",
      entityId: targetUid,
      metadata: {
        employee_email: employeeEmail || null,
        source: "n8n_sendpass_workflow",
      },
    });

    return res.status(200).json({ message: "Employee passcode updated" });
  } catch (serverError) {
    console.error("[N8nPasscodeUpdate] Error:", serverError);
    return res.status(500).json({ error: serverError?.message || "Unable to update employee passcode" });
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

const mapTeamDocumentToApi = (teamDocument) => ({
  id: teamDocument._id?.toString?.() || teamDocument.id,
  name: teamDocument.name || "",
  managerName: teamDocument.manager_name || "",
  managerEmail: teamDocument.manager_email || "",
  members: Array.isArray(teamDocument.members)
    ? teamDocument.members.map((member) => ({
        employeeId: String(member.employee_id || ""),
        name: String(member.name || ""),
        email: String(member.email || ""),
        role: String(member.role || ""),
        department: String(member.department || ""),
      }))
    : [],
  createdAt: teamDocument.created_at || null,
  updatedAt: teamDocument.updated_at || null,
});

app.get("/api/teams", async (req, res) => {
  const managerEmail = String(req.query.managerEmail || "").trim().toLowerCase();
  const query = managerEmail ? { manager_email: managerEmail } : {};

  try {
    const teams = await db
      .collection(mongoTeamsCollection)
      .find(query, { sort: { updated_at: -1 } })
      .toArray();

    return res.status(200).json({ teams: teams.map(mapTeamDocumentToApi) });
  } catch (serverError) {
    console.error("[GetTeams] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch teams" });
  }
});

app.post("/api/teams", async (req, res) => {
  const { name, memberEmployeeIds, managerName, managerEmail } = req.body ?? {};

  const normalizedName = String(name || "").trim();
  const normalizedMemberIds = Array.isArray(memberEmployeeIds)
    ? memberEmployeeIds.map((employeeId) => String(employeeId || "").trim()).filter(Boolean)
    : [];

  if (!normalizedName || normalizedMemberIds.length === 0) {
    return res.status(400).json({ error: "name and at least one memberEmployeeId are required" });
  }

  const validObjectIds = normalizedMemberIds.filter((employeeId) => ObjectId.isValid(employeeId)).map((employeeId) => new ObjectId(employeeId));
  if (validObjectIds.length === 0) {
    return res.status(400).json({ error: "No valid employee ids provided" });
  }

  try {
    const membersSource = await db
      .collection(mongoEmployeesCollection)
      .find({ _id: { $in: validObjectIds } })
      .toArray();

    if (membersSource.length === 0) {
      return res.status(404).json({ error: "No matching employees found" });
    }

    const members = membersSource.map((employee) => ({
      employee_id: employee._id.toString(),
      name: String(employee.full_name || "").trim(),
      email: String(employee.email || "").trim().toLowerCase(),
      role: String(employee.role || "").trim(),
      department: String(employee.department || "").trim(),
    }));

    const payload = {
      name: normalizedName,
      manager_name: String(managerName || "Manager").trim(),
      manager_email: String(managerEmail || "").trim().toLowerCase(),
      members,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await db.collection(mongoTeamsCollection).insertOne(payload);

    await logAudit({
      actor: payload.manager_email || deriveActorFromRequest(req),
      action: "Team Created",
      entity: "Team",
      entityId: result.insertedId.toString(),
      metadata: {
        team_name: payload.name,
        member_count: members.length,
      },
    });

    return res.status(201).json({
      message: "Team created",
      team: mapTeamDocumentToApi({ _id: result.insertedId, ...payload }),
    });
  } catch (serverError) {
    console.error("[CreateTeam] Mongo write error:", serverError);
    return res.status(500).json({ error: "Unable to create team" });
  }
});

app.post("/api/teams/:id/assign-task", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    overview,
    category,
    priority,
    estimatedCompletionTime,
    deadline,
    difficulty,
    requiredSkills,
    acceptanceCriteria,
    reminderEnabled,
    reminderBefore,
    managerName,
    managerEmail,
  } = req.body ?? {};

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid team id" });
  }

  if (!title || !overview || !category || !priority || !deadline || !difficulty) {
    return res.status(400).json({ error: "title, overview, category, priority, deadline and difficulty are required" });
  }

  try {
    const team = await db.collection(mongoTeamsCollection).findOne({ _id: new ObjectId(id) });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const members = Array.isArray(team.members) ? team.members.filter((member) => member?.employee_id && member?.email) : [];
    if (members.length === 0) {
      return res.status(400).json({ error: "Team has no members" });
    }

    const nowIso = new Date().toISOString();
    const taskPayloads = members.map((member) => ({
      title: String(title).trim(),
      overview: String(overview).trim(),
      assigned_to_employee_id: String(member.employee_id),
      assigned_to_name: String(member.name || "").trim(),
      assigned_to_role: String(member.role || "").trim(),
      assigned_to_email: String(member.email || "").trim().toLowerCase(),
      department: String(member.department || "").trim(),
      category: String(category).trim(),
      priority: String(priority).trim(),
      estimated_completion_time: String(estimatedCompletionTime || "").trim(),
      deadline: String(deadline),
      difficulty: String(difficulty).trim(),
      required_skills: Array.isArray(requiredSkills)
        ? requiredSkills.map((skill) => String(skill).trim()).filter(Boolean)
        : [],
      attachments: [],
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
      manager_name: String(managerName || team.manager_name || "Manager").trim(),
      manager_email: String(managerEmail || team.manager_email || "").trim().toLowerCase(),
      team_id: id,
      team_name: String(team.name || "").trim(),
      created_at: nowIso,
      updated_at: nowIso,
    }));

    const insertResult = await db.collection(mongoTasksCollection).insertMany(taskPayloads);

    await syncEmployeeMetrics(members.map((member) => String(member.email || "").trim().toLowerCase()));

    await logAudit({
      actor: String(managerEmail || team.manager_email || "").trim().toLowerCase() || deriveActorFromRequest(req),
      action: "Team Task Assigned",
      entity: "Team",
      entityId: id,
      metadata: {
        team_name: String(team.name || "").trim(),
        title: String(title).trim(),
        assigned_count: taskPayloads.length,
      },
    });

    return res.status(201).json({
      message: "Task assigned to team",
      createdTasks: Object.keys(insertResult.insertedIds).length,
    });
  } catch (serverError) {
    console.error("[AssignTeamTask] Mongo write error:", serverError);
    return res.status(500).json({ error: "Unable to assign task to team" });
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

    await syncEmployeeMetrics([payload.assigned_to_email]);

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
          status: "In Progress",
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

    await syncEmployeeMetrics([String(updatedTask.assigned_to_email || "").trim().toLowerCase()]);

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

    await syncEmployeeMetrics([String(updatedTask.assigned_to_email || "").trim().toLowerCase()]);

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

app.post("/api/employee-performance/recompute", async (req, res) => {
  const employeeEmail = String(req.body?.employee_email || req.query?.employeeEmail || "").trim().toLowerCase();

  try {
    const result = await syncEmployeeMetrics(employeeEmail ? [employeeEmail] : []);
    return res.status(200).json({
      message: employeeEmail
        ? `Employee performance recomputed for ${employeeEmail}`
        : "Employee performance recomputed for all task-linked employees",
      processed: result.processed,
    });
  } catch (serverError) {
    console.error("[RecomputeEmployeePerformance] Compute error:", serverError);
    return res.status(500).json({ error: "Unable to recompute employee performance" });
  }
});

app.get("/api/metrics-one", async (req, res) => {
  const employeeEmail = String(req.query.employeeEmail || "").trim().toLowerCase();
  const query = employeeEmail ? { employee_email: employeeEmail } : {};

  try {
    const metrics = await db
      .collection(mongoMetricsOneCollection)
      .find(query, { sort: { updated_at: -1 } })
      .toArray();

    return res.status(200).json({ metrics });
  } catch (serverError) {
    console.error("[GetMetricsOne] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch metrics_one records" });
  }
});

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

const mlApiBaseUrl = process.env.ML_API_URL || "http://localhost:8000";

app.get("/api/ml/risk-prediction/:employeeEmail", async (req, res) => {
  const employeeEmail = String(req.params.employeeEmail || "").trim().toLowerCase();
  if (!employeeEmail) {
    return res.status(400).json({ error: "employeeEmail is required" });
  }

  try {
    const record = await db
      .collection(mongoEmployeePerformanceCollection)
      .findOne({ employee_email: employeeEmail });

    if (!record) {
      return res.status(404).json({ error: "No performance record found for this employee" });
    }

    const metrics = mapEmployeePerformanceToApi(record);

    const mlPayload = {
      completion_ratio: metrics.completion_ratio,
      avg_delay_days: metrics.avg_delay_days,
      attendance_percent: metrics.attendance_percent,
      escalation_count: metrics.escalation_count,
      warning_count: metrics.warning_count,
      manager_rating: metrics.manager_rating,
      performance_trend: metrics.performance_trend,
      task_consistency: metrics.task_consistency,
    };

    let prediction = null;
    let mlError = null;

    try {
      const mlResponse = await fetch(`${mlApiBaseUrl}/ml/predict-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mlPayload),
        signal: AbortSignal.timeout(10000),
      });

      if (mlResponse.ok) {
        prediction = await mlResponse.json();
      } else {
        const errBody = await mlResponse.text().catch(() => "");
        mlError = `ML service returned ${mlResponse.status}: ${errBody}`;
        console.warn("[MLRiskPrediction] ML API error:", mlError);
      }
    } catch (mlCallError) {
      mlError = mlCallError instanceof Error ? mlCallError.message : "ML service unavailable";
      console.warn("[MLRiskPrediction] ML call failed:", mlError);
    }

    return res.status(200).json({
      metrics,
      prediction,
      ml_error: mlError,
    });
  } catch (serverError) {
    console.error("[MLRiskPrediction] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch risk prediction" });
  }
});

const mapComplaintToApi = (complaintDocument) => ({
  id: complaintDocument._id?.toString?.() || complaintDocument.id,
  employee_email: String(complaintDocument.employee_email || "").trim().toLowerCase(),
  employee_name: String(complaintDocument.employee_name || "").trim(),
  manager_email: String(complaintDocument.manager_email || "").trim().toLowerCase(),
  manager_name: String(complaintDocument.manager_name || "").trim(),
  complaint_text: String(complaintDocument.complaint_text || "").trim(),
  severity: String(complaintDocument.severity || "high").toLowerCase(),
  status: String(complaintDocument.status || "open").toLowerCase(),
  created_at: complaintDocument.created_at || null,
  updated_at: complaintDocument.updated_at || null,
});

app.get("/api/complains", async (req, res) => {
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 200)
    : 50;
  const status = String(req.query.status || "").trim().toLowerCase();

  const query = status ? { status } : {};

  try {
    const records = await db
      .collection(mongoComplainsCollection)
      .find(query, { sort: { created_at: -1 } })
      .limit(limit)
      .toArray();

    return res.status(200).json({
      complaints: records.map(mapComplaintToApi),
    });
  } catch (serverError) {
    console.error("[GetComplains] Mongo read error:", serverError);
    return res.status(500).json({ error: "Unable to fetch complaints" });
  }
});

app.post("/api/complains", async (req, res) => {
  const {
    employee_email,
    employee_name,
    manager_email,
    manager_name,
    complaint_text,
    severity,
  } = req.body ?? {};

  const normalizedEmployeeEmail = String(employee_email || "").trim().toLowerCase();
  const normalizedComplaintText = String(complaint_text || "").trim();

  if (!normalizedEmployeeEmail || !normalizedComplaintText) {
    return res.status(400).json({ error: "employee_email and complaint_text are required" });
  }

  const nowIso = new Date().toISOString();
  const payload = {
    employee_email: normalizedEmployeeEmail,
    employee_name: String(employee_name || "").trim(),
    manager_email: String(manager_email || "").trim().toLowerCase(),
    manager_name: String(manager_name || "").trim(),
    complaint_text: normalizedComplaintText,
    severity: String(severity || "high").trim().toLowerCase() || "high",
    status: "open",
    created_at: nowIso,
    updated_at: nowIso,
  };

  try {
    const result = await db.collection(mongoComplainsCollection).insertOne(payload);
    const savedRecord = await db.collection(mongoComplainsCollection).findOne({ _id: result.insertedId });

    await syncEmployeeMetrics([normalizedEmployeeEmail]);

    await logAudit({
      actor: payload.manager_email || payload.manager_name || deriveActorFromRequest(req),
      action: "Manager Warning Submitted",
      entity: "Complaint",
      entityId: result.insertedId.toString(),
      metadata: {
        employee_email: payload.employee_email,
        severity: payload.severity,
      },
    });

    return res.status(201).json({
      message: "Warning complaint submitted",
      complaint: savedRecord ? mapComplaintToApi(savedRecord) : null,
    });
  } catch (serverError) {
    console.error("[CreateComplaint] Mongo insert error:", serverError);
    return res.status(500).json({ error: "Unable to submit complaint" });
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

app.post("/api/audit-logs/event", async (req, res) => {
  const { action, entity, entityId, metadata, actor } = req.body ?? {};

  const normalizedAction = String(action || "").trim();
  const normalizedEntity = String(entity || "").trim();

  if (!normalizedAction || !normalizedEntity) {
    return res.status(400).json({ error: "action and entity are required" });
  }

  if (!allowedAuditActions.has(normalizedAction)) {
    return res.status(400).json({ error: "Unsupported audit action" });
  }

  await logAudit({
    actor: String(actor || deriveActorFromRequest(req) || "System").trim() || "System",
    action: normalizedAction,
    entity: normalizedEntity,
    entityId: entityId ? String(entityId) : null,
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  });

  return res.status(201).json({ message: "Audit event recorded" });
});

app.use((error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request payload too large. Please upload a smaller file (max ~50MB).",
    });
  }

  return next(error);
});

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
