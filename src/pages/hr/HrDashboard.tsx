import { Link } from "react-router-dom";
import { Download, Plus, Users, AlertTriangle, CheckSquare, ShieldAlert, TrendingUp, AlertCircle, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const kpis = [
  { label: "Active Probation", value: "124", icon: Users, change: "+12% from last month", changeType: "positive" as const },
  { label: "High Risk", value: "12", icon: AlertTriangle, change: "Needs attention", changeType: "warning" as const },
  { label: "Pending Approvals", value: "8", icon: CheckSquare, change: "Avg response 4h", changeType: "neutral" as const },
  { label: "Policy Violations", value: "3", icon: ShieldAlert, change: "Down 2 this week", changeType: "positive" as const },
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

const auditItems = [
  { title: "Access Level Escalated", desc: "Administrator role assigned to Sarah W. by HR_Admin", time: "14:22:15 UTC" },
  { title: "Login Success", desc: "Employee Alice Johnson logged in from recognized IP: 192.168.1.45", time: "14:15:02 UTC" },
  { title: "Policy Acknowledgement", desc: "Robert S. confirmed 'Workplace Harassment' policy update.", time: "13:58:30 UTC" },
];

const riskBadge = (risk: string) => {
  const styles: Record<string, string> = {
    Low: "risk-badge-low",
    Medium: "risk-badge-medium",
    High: "risk-badge-high",
    Critical: "risk-badge-critical",
  };
  return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${styles[risk] || ""}`;
};

const HrDashboard = () => (
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          {auditItems.map((a, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-foreground">{a.title}</h3>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
                <p className="mt-1 text-[10px] font-mono text-muted-foreground">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default HrDashboard;
