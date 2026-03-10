import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },

  actor: {
    type: String,
    required: true
  },

  action: {
    type: String,
    required: true
  },

  entity: {
    type: String,
    required: true
  },

  entityId: {
    type: String
  },

  metadata: {
    type: Object
  },

  hash: {
    type: String
  }

}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);