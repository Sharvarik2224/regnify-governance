import { Link } from "react-router-dom";
import { Users, ClipboardList, Calendar, Flag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teamMembers, dashboardAlerts } from "@/data/managerMockData";

const kpis = [
  { label: "ACTIVE PROBATION", value: "8", sub: "Members", icon: Users },
  { label: "PENDING TASK REVIEWS", value: "12", sub: "+2 since yesterday", subColor: "text-warning", icon: ClipboardList },
  { label: "EVALUATIONS DUE", value: "3", sub: "Critical", subColor: "text-destructive", icon: Calendar },
  { label: "CONFLICT FLAGS", value: "1", sub: "Requires action", icon: Flag },
];

const severityStyle = (severity: string) => {
  if (severity === "HIGH SEVERITY") return "bg-destructive/10 text-destructive border-destructive/20";
  if (severity === "MEDIUM") return "bg-warning/10 text-warning border-warning/20";
  if (severity === "ADVISORY") return "bg-info/10 text-info border-info/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
};

const riskBarColor = (pct: number) => {
  if (pct >= 80) return "bg-success";
  if (pct >= 50) return "bg-warning";
  return "bg-destructive";
};

const ManagerDashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Enterprise Governance Overview</h1>
      <p className="text-sm text-muted-foreground">Real-time monitoring and compliance status for your direct reports.</p>
    </div>

    <div className="grid gap-4 lg:grid-cols-5">
      {/* KPI Cards */}
      <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-bold text-foreground">{k.value}</p>
            <p className={`mt-1 text-xs ${k.subColor || "text-muted-foreground"}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Governance Alerts Panel */}
      <div className="lg:col-span-2 rounded-lg border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Flag className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Governance Alerts</h2>
        </div>
        <div className="p-4 space-y-3 max-h-80 overflow-auto">
          {dashboardAlerts.map((alert, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${severityStyle(alert.severity)}`}>
                  {alert.severity}
                </span>
                <span className="text-[10px] text-muted-foreground">{alert.timestamp}</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-2 text-xs uppercase tracking-wider font-semibold">
            Clear All Notifications
          </Button>
        </div>
      </div>
    </div>

    {/* Team Under Probation Table */}
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
            {teamMembers.slice(0, 4).map((m) => {
              const daysLeft = Math.max(5, Math.floor(Math.random() * 50) + 5);
              return (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {m.initials}
                      </div>
                      <span className="text-sm font-medium text-foreground">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{m.department}</td>
                  <td className="px-5 py-4 text-sm text-foreground">{daysLeft} days</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${riskBarColor(m.taskPct)}`} style={{ width: `${m.taskPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{m.taskPct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${riskBarColor(m.attendance)}`} style={{ width: `${m.attendance}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{m.attendance}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default ManagerDashboard;
