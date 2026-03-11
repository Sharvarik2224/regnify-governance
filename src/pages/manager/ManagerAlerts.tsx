import { useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";

type AuditLogRecord = {
  id: string;
  timestamp?: string;
  actor?: string;
  action?: string;
  entity?: string;
};

type TaskRecord = {
  id: string;
  title?: string;
  assignedToName?: string;
  managerStatus?: string;
  updatedAt?: string;
  createdAt?: string;
};

const toUiTimestamp = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const ManagerAlerts = () => {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [logsResponse, tasksResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/audit-logs?limit=80`),
          fetch(`${API_BASE_URL}/api/tasks`),
        ]);

        const logsPayload = await logsResponse.json().catch(() => []);
        const tasksPayload = await tasksResponse.json().catch(() => ({}));

        setLogs(Array.isArray(logsPayload) ? logsPayload : []);
        setTasks(Array.isArray(tasksPayload?.tasks) ? tasksPayload.tasks : []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredLogs = useMemo(
    () => logs.filter((log) => {
      if (!normalizedSearch) return true;
      return [log.actor, log.action, log.entity, log.timestamp]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    }),
    [logs, normalizedSearch],
  );

  const taskLogs = useMemo(
    () => [...tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .filter((task) => {
        if (!normalizedSearch) return true;
        return [task.title, task.assignedToName, task.managerStatus]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .slice(0, 80),
    [tasks, normalizedSearch],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs and Task Logs</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">AUDIT ENTRIES</span>
          <p className="text-3xl font-bold mt-1 text-foreground">{loading ? "-" : filteredLogs.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TASK EVENTS</span>
          <p className="text-3xl font-bold mt-1 text-foreground">{loading ? "-" : taskLogs.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TASK APPROVALS</span>
          <p className="text-3xl font-bold mt-1 text-foreground">
            {loading ? "-" : taskLogs.filter((task) => String(task.managerStatus || "").toLowerCase() === "completed").length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PENDING REVIEWS</span>
          <p className="text-3xl font-bold mt-1 text-foreground">
            {loading ? "-" : taskLogs.filter((task) => String(task.managerStatus || "").toLowerCase() === "pending").length}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <h2 className="font-semibold text-foreground">Audit Logs</h2>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-sm text-muted-foreground" colSpan={3}>No audit logs found.</td>
                  </tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 text-xs text-muted-foreground">{toUiTimestamp(log.timestamp)}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{log.actor || "System"}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{log.action || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <h2 className="font-semibold text-foreground">Task Logs</h2>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">Task</th>
                  <th className="px-5 py-3">Assignee</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {taskLogs.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-sm text-muted-foreground" colSpan={3}>No task logs found.</td>
                  </tr>
                ) : taskLogs.map((task) => (
                  <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 text-sm text-foreground">{task.title || "Untitled task"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{task.assignedToName || "-"}</td>
                    <td className="px-5 py-4 text-sm text-foreground">{task.managerStatus || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerAlerts;
