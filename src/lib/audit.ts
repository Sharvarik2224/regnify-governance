import { API_BASE_URL } from "@/lib/api";

type AuditEventPayload = {
  action: string;
  entity: string;
  entityId?: string | null;
  actor?: string;
  metadata?: Record<string, unknown>;
};

export const logAuditEvent = async (payload: AuditEventPayload) => {
  try {
    await fetch(`${API_BASE_URL}/api/audit-logs/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("Unable to record audit event", error);
  }
};
