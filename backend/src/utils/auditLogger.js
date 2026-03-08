import crypto from "crypto";
import AuditLog from "./models/Auditlog.js";

export const logAudit = async ({
  actor,
  action,
  entity,
  entityId,
  metadata
}) => {

  const logData = {
    actor,
    action,
    entity,
    entityId,
    metadata,
    timestamp: new Date()
  };

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(logData))
    .digest("hex");

  logData.hash = hash;

  await AuditLog.create(logData);
};