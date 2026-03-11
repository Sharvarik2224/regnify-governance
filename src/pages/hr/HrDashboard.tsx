import { useEffect, useState } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

type AuditLogRecord = {
  id: string;
  timestamp?: string;
  action?: string;
  entity?: string;
  actor?: string;
};

type ComplaintRecord = {
  id: string;
  employee_name?: string;
  employee_email?: string;
  manager_name?: string;
  manager_email?: string;
  complaint_text?: string;
  severity?: string;
  created_at?: string;
};

const formatLogTime = (timestamp?: string) => {
  if (!timestamp) {
    return "-";
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
};

const HrDashboard = () => {
  const [recentLogs, setRecentLogs] = useState<AuditLogRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentLogs = async () => {
      setIsLoadingLogs(true);
      setLogsError(null);

      try {
        const [logsResponse, complaintsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/audit-logs?limit=3`),
          fetch(`${API_BASE_URL}/api/complains?limit=5`),
        ]);

        if (!logsResponse.ok) {
          throw new Error(`Unable to load recent audit activity. Status ${logsResponse.status}`);
        }

        const logsPayload = await logsResponse.json();
        const complaintsPayload = await complaintsResponse.json().catch(() => ({}));
        const complaintRecords = Array.isArray(complaintsPayload?.complaints) ? complaintsPayload.complaints : [];

        setRecentLogs(Array.isArray(logsPayload) ? logsPayload.slice(0, 3) : []);
        setComplaints(complaintRecords);
      } catch (error) {
        setLogsError(error instanceof Error ? error.message : "Unable to load recent audit activity");
      } finally {
        setIsLoadingLogs(false);
      }
    };

    void fetchRecentLogs();
  }, []);

  return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Governance Suite</h1>
        <p className="text-sm text-muted-foreground">Real-time enterprise compliance and risk monitoring.</p>
      </div>
      <div />
    </div>

    {/* Bottom Panels */}
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Alerts */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Complaints of Employee from Manager</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">View All</Button>
        </div>
        <div className="p-5 space-y-4">
          {complaints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No manager complaints found.</p>
          ) : complaints.map((complaint) => (
            <div key={complaint.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h3 className="font-semibold text-foreground text-sm">
                {complaint.employee_name || complaint.employee_email || "Employee"} - Manager Complaint
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{complaint.complaint_text || "No details provided."}</p>
              <p className="mt-2 text-[10px] font-semibold text-destructive uppercase tracking-wider">
                {formatLogTime(complaint.created_at)} • {String(complaint.severity || "high").toUpperCase()} SEVERITY
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Reported by {complaint.manager_name || complaint.manager_email || "Manager"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Activity */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Recent Audit Activity</h2>
          </div>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">Live Feed</span>
        </div>
        <div className="p-5 space-y-4">
          {isLoadingLogs ? (
            <p className="text-sm text-muted-foreground">Loading recent audit activity...</p>
          ) : logsError ? (
            <p className="text-sm text-destructive">{logsError}</p>
          ) : recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent logs available.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-foreground">{log.action || "Unknown Action"}</h3>
                  <p className="text-xs text-muted-foreground">{`${log.entity || "Entity"} - ${log.actor || "System"}`}</p>
                  <p className="mt-1 text-[10px] font-mono text-muted-foreground">{formatLogTime(log.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default HrDashboard;
