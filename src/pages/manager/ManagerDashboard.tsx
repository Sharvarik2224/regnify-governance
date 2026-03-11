import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Users, ClipboardList, Calendar, Flag, ScrollText, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type EmployeeRecord = {
  id: string;
  full_name?: string;
  email?: string;
  department?: string;
  manager_assigned?: string;
  probation_period?: string;
  date_of_joining?: string | null;
};

type TaskRecord = {
  id: string;
  assignedToEmail?: string;
  assignedToName?: string;
  managerEmail?: string;
  managerStatus?: string;
  status?: string;
  title?: string;
  updatedAt?: string;
  createdAt?: string;
  deadline?: string | null;
};

type AuditLogRecord = {
  id: string;
  timestamp?: string;
  actor?: string;
  action?: string;
  entity?: string;
};

type PerformanceRecord = {
  employee_email?: string;
  attendance_percent?: number;
};

const riskBarColor = (pct: number) => {
  if (pct >= 80) return "bg-success";
  if (pct >= 50) return "bg-warning";
  return "bg-destructive";
};

const toDisplayTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const toProbationDaysRemaining = (employee: EmployeeRecord) => {
  const probationDays = Number(String(employee.probation_period || "").match(/\d+/)?.[0] || 0);
  if (!probationDays || !employee.date_of_joining) {
    return null;
  }

  const start = new Date(employee.date_of_joining);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setDate(end.getDate() + probationDays);
  const diffMs = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const assignedEmployees = useMemo(() => {
    const managerTokens = [
      normalize(user?.name || ""),
      normalize((user?.email || "").split("@")[0] || ""),
    ].filter(Boolean);

    return employees.filter((employee) => {
      const assigned = normalize(employee.manager_assigned || "");
      return assigned && managerTokens.some((token) => assigned.includes(token));
    });
  }, [employees, user?.email, user?.name]);

  const assignedEmployeeEmails = useMemo(
    () => new Set(assignedEmployees.map((employee) => String(employee.email || "").trim().toLowerCase())),
    [assignedEmployees],
  );

  const managerTasks = useMemo(() => {
    const normalizedManagerEmail = String(user?.email || "").trim().toLowerCase();

    return tasks.filter((task) => {
      const assignedEmail = String(task.assignedToEmail || "").trim().toLowerCase();
      const taskManagerEmail = String(task.managerEmail || "").trim().toLowerCase();

      return (
        assignedEmployeeEmails.has(assignedEmail) ||
        (normalizedManagerEmail && taskManagerEmail === normalizedManagerEmail)
      );
    });
  }, [assignedEmployeeEmails, tasks, user?.email]);

  const probationMemberEmails = useMemo(() => {
    const emails = new Set<string>(assignedEmployeeEmails);
    for (const task of managerTasks) {
      const email = String(task.assignedToEmail || "").trim().toLowerCase();
      if (email) {
        emails.add(email);
      }
    }
    return Array.from(emails);
  }, [assignedEmployeeEmails, managerTasks]);

  const probationRows = useMemo(() => {
    return probationMemberEmails.map((email, index) => {
      const employee = employees.find(
        (record) => String(record.email || "").trim().toLowerCase() === email,
      );

      const relatedTasks = managerTasks.filter((task) => String(task.assignedToEmail || "").trim().toLowerCase() === email);
      const completedTasks = relatedTasks.filter((task) => String(task.managerStatus || "").toLowerCase() === "completed").length;
      const taskPct = relatedTasks.length ? Math.round((completedTasks / relatedTasks.length) * 100) : 0;
      const attendance = Number(
        performance.find((record) => String(record.employee_email || "").trim().toLowerCase() === email)?.attendance_percent ?? 0,
      );

      const fallbackName = String(relatedTasks[0]?.assignedToName || "").trim();

      return {
        id: employee?.id || `task-member-${index}`,
        name: employee?.full_name || fallbackName || email,
        initials: (employee?.full_name || fallbackName || "UE")
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || "")
          .join("") || "UE",
        department: employee?.department || "-",
        daysLeft: employee ? toProbationDaysRemaining(employee) : null,
        taskPct,
        attendance: Math.max(0, Math.min(100, Math.round(attendance))),
      };
    });
  }, [employees, managerTasks, performance, probationMemberEmails]);

  const pendingTaskReviews = managerTasks.filter((task) => String(task.managerStatus || "").toLowerCase() === "pending").length;
  const evaluationsDue = probationRows.filter((row) => typeof row.daysLeft === "number" && row.daysLeft <= 7).length;
  const conflictFlags = managerTasks.filter((task) => {
    if (!task.deadline || String(task.managerStatus || "").toLowerCase() === "completed") {
      return false;
    }

    const deadline = new Date(task.deadline);
    return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
  }).length;

  const recentTaskLogs = useMemo(
    () => [...managerTasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 5),
    [managerTasks],
  );

  const kpis = [
    { label: "ACTIVE PROBATION", value: String(probationRows.length), sub: "Members", icon: Users },
    { label: "PENDING TASK REVIEWS", value: String(pendingTaskReviews), sub: "Awaiting approval", icon: ClipboardList },
    { label: "EVALUATIONS DUE", value: String(evaluationsDue), sub: evaluationsDue > 0 ? "Critical" : "On track", subColor: evaluationsDue > 0 ? "text-destructive" : "text-success", icon: Calendar },
    { label: "CONFLICT FLAGS", value: String(conflictFlags), sub: conflictFlags > 0 ? "Requires action" : "No blockers", icon: Flag },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [employeesResponse, tasksResponse, logsResponse, performanceResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/employees`),
          fetch(`${API_BASE_URL}/api/tasks`),
          fetch(`${API_BASE_URL}/api/audit-logs?limit=8`),
          fetch(`${API_BASE_URL}/api/employee-performance`),
        ]);

        const employeesPayload = await employeesResponse.json().catch(() => ({}));
        const tasksPayload = await tasksResponse.json().catch(() => ({}));
        const logsPayload = await logsResponse.json().catch(() => []);
        const performancePayload = await performanceResponse.json().catch(() => ({}));

        setEmployees(Array.isArray(employeesPayload?.employees) ? employeesPayload.employees : []);
        setTasks(Array.isArray(tasksPayload?.tasks) ? tasksPayload.tasks : []);
        setAuditLogs(Array.isArray(logsPayload) ? logsPayload : []);
        setPerformance(Array.isArray(performancePayload?.performance) ? performancePayload.performance : []);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enterprise Governance Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time monitoring and compliance status for your direct reports.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</span>
                <k.icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-3xl font-bold text-foreground">{loading ? "-" : k.value}</p>
              <p className={`mt-1 text-xs ${k.subColor || "text-muted-foreground"}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 grid gap-4">
          <div className="rounded-lg border border-border bg-card">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Audit Logs</h2>
            </div>
            <div className="p-4 space-y-2 max-h-44 overflow-auto">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No audit events yet.</p>
              ) : auditLogs.map((log) => (
                <div key={log.id} className="text-xs border-b border-border/60 pb-2 last:border-0">
                  <p className="font-medium text-foreground">{log.action || "Unknown action"}</p>
                  <p className="text-muted-foreground">{log.actor || "System"} • {toDisplayTime(log.timestamp)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Task Logs</h2>
            </div>
            <div className="p-4 space-y-2 max-h-44 overflow-auto">
              {recentTaskLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No task updates yet.</p>
              ) : recentTaskLogs.map((task) => (
                <div key={task.id} className="text-xs border-b border-border/60 pb-2 last:border-0">
                  <p className="font-medium text-foreground">{task.title || "Untitled task"}</p>
                  <p className="text-muted-foreground">{task.assignedToName || "Employee"} • {task.managerStatus || task.status || "Pending"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">My Team Under Probation</h2>
          <Link to="/manager/team">
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">Employee Name</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Days Remaining</th>
                <th className="px-5 py-3">Task Completion</th>
                <th className="px-5 py-3">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={5}>Loading assigned employees...</td>
                </tr>
              ) : probationRows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={5}>No employees are assigned to this manager.</td>
                </tr>
              ) : probationRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {row.initials}
                      </div>
                      <span className="text-sm font-medium text-foreground">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{row.department}</td>
                  <td className="px-5 py-4 text-sm text-foreground">{typeof row.daysLeft === "number" ? `${row.daysLeft} days` : "-"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${riskBarColor(row.taskPct)}`} style={{ width: `${row.taskPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{row.taskPct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${riskBarColor(row.attendance)}`} style={{ width: `${row.attendance}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{row.attendance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
