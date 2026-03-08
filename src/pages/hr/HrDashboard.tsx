import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Plus, Users, AlertTriangle, CheckSquare, AlertCircle, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const kpis = [
  { label: "Active Probation", value: "124", icon: Users, change: "+12% from last month", changeType: "positive" as const },
  { label: "High Risk", value: "12", icon: AlertTriangle, change: "Needs attention", changeType: "warning" as const },
  { label: "Pending Approvals", value: "8", icon: CheckSquare, change: "Avg response 4h", changeType: "neutral" as const },
];

const employees = [
  { id: "1", name: "Alice Johnson", manager: "Robert Smith", daysLeft: 15, risk: "High" as const, recommendation: "Review Required", conflict: true },
  { id: "2", name: "Michael Chen", manager: "Sarah Williams", daysLeft: 42, risk: "Medium" as const, recommendation: "Monitor", conflict: false },
  { id: "3", name: "Sarah Parker", manager: "Robert Smith", daysLeft: 5, risk: "Critical" as const, recommendation: "Immediate Action", conflict: true },
];

const alerts = [
  { title: "Unusual Data Export", desc: "System detected a 4.2GB data export by user [M. Chen] outside regular working hours. Investigation recommended.", time: "24 MINUTES AGO", severity: "CRITICAL SEVERITY" },
  { title: "Policy Compliance Gap", desc: "Updated EU Data Protection policy needs acknowledgement by 48 departmental leads. 12 currently pending.", time: "2 HOURS AGO", severity: "MODERATE SEVERITY" },
];

type AuditLogRecord = {
  id: string;
  timestamp?: string;
  action?: string;
  entity?: string;
  actor?: string;
};

const formatLogTime = (timestamp?: string) => {
  if (!timestamp) {
    return "-";
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
};

const riskBadge = (risk: string) => {
  const styles: Record<string, string> = {
    Low: "risk-badge-low",
    Medium: "risk-badge-medium",
    High: "risk-badge-high",
    Critical: "risk-badge-critical",
  };
  return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${styles[risk] || ""}`;
};

const HrDashboard = () => {
  const [recentLogs, setRecentLogs] = useState<AuditLogRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentLogs = async () => {
      setIsLoadingLogs(true);
      setLogsError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/audit-logs?limit=3`);
        if (!response.ok) {
          throw new Error(`Unable to load recent audit activity. Status ${response.status}`);
        }

        const payload = await response.json();
        setRecentLogs(Array.isArray(payload) ? payload.slice(0, 3) : []);
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
      <div className="flex gap-3">
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export Report</Button>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />New Assessment</Button>
      </div>
    </div>

    {/* KPI Cards */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{k.label}</span>
            <k.icon className={`h-5 w-5 ${k.changeType === "warning" ? "text-warning" : "text-muted-foreground/50"}`} />
          </div>
          <p className="text-3xl font-bold text-foreground">{k.value}</p>
          <p className={`mt-1 text-xs ${k.changeType === "positive" ? "text-success" : k.changeType === "warning" ? "text-destructive" : "text-muted-foreground"}`}>
            {k.change}
          </p>
        </div>
      ))}
    </div>

    {/* Employee Risk Table */}
    <div className="rounded-lg border border-border bg-card">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Employee Risk Monitoring</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Manager</th>
              <th className="px-5 py-3">Days Left</th>
              <th className="px-5 py-3">Risk Score</th>
              <th className="px-5 py-3">Manager Rec</th>
              <th className="px-5 py-3">Conflict Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4 text-sm font-medium text-foreground">{emp.name}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{emp.manager}</td>
                <td className="px-5 py-4 text-sm text-foreground">{emp.daysLeft}</td>
                <td className="px-5 py-4"><span className={riskBadge(emp.risk)}>{emp.risk}</span></td>
                <td className="px-5 py-4 text-sm text-muted-foreground italic">{emp.recommendation}</td>
                <td className="px-5 py-4 text-center">
                  {emp.conflict ? <AlertTriangle className="h-4 w-4 text-warning mx-auto" /> : <span className="text-success">✓</span>}
                </td>
                <td className="px-5 py-4">
                  <Link to={`/hr/employees/${emp.id}`}>
                    <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" />View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Bottom Panels */}
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Alerts */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">High-Priority Alerts</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">View All</Button>
        </div>
        <div className="p-5 space-y-4">
          {alerts.map((a, i) => (
            <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
              <p className="mt-2 text-[10px] font-semibold text-destructive uppercase tracking-wider">{a.time} • {a.severity}</p>
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
