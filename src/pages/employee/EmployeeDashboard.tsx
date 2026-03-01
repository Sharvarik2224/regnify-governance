import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, Clock, BarChart3, Bell } from "lucide-react";
import { employeeTasks, hrUpdates } from "@/data/employeeMockData";
import { useAuth } from "@/contexts/AuthContext";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const completed = employeeTasks.filter(t => t.status === "Completed").length;
  const pending = employeeTasks.filter(t => t.status === "Pending").length;

  const kpis = [
    { label: "Tasks Assigned", value: employeeTasks.length, icon: ClipboardList, color: "text-primary" },
    { label: "Completed", value: completed, icon: CheckCircle, color: "text-green-600" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-500" },
    { label: "Attendance", value: "96%", icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name || "Alex"}</h1>
          <p className="text-muted-foreground text-sm">Here's your probation overview and recent activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-primary text-primary px-3 py-1">Probationary</Badge>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0">45 Days Remaining</Badge>
        </div>
      </div>

      {/* Performance Score */}
      <Card className="border bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Performance Score</p>
            <p className="text-4xl font-bold text-primary mt-1">92</p>
            <p className="text-sm text-muted-foreground mt-1">Top 5% of Organization</p>
          </div>
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${92 * 2.51} 251`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">92</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
              </div>
              <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-50`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Task Updates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {employeeTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">Due: {task.deadline}</p>
                </div>
                <Badge variant={task.status === "Completed" ? "default" : task.status === "In Progress" ? "secondary" : "outline"} className="text-xs">
                  {task.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Latest HR Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {hrUpdates.slice(0, 3).map((update) => (
              <div key={update.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  {update.important && <Badge className="bg-destructive text-destructive-foreground text-[10px]">Important</Badge>}
                  <span className="text-xs text-muted-foreground">{update.date}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{update.title}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
