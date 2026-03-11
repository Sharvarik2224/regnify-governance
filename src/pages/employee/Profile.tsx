import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { CheckCircle2, Clock3, ListTodo, TrendingUp } from "lucide-react";

type EmployeeTask = {
  id: string;
  title: string;
  status: "Pending" | "In Progress" | "Completed";
  priority: string;
  deadline: string | null;
  updatedAt: string | null;
};

type PerformanceRecord = {
  completion_ratio?: number;
  attendance_percent?: number;
  avg_delay_days?: number;
  warning_count?: number;
  escalation_count?: number;
  updated_at?: string | null;
};

const normalizeStatus = (value: string): EmployeeTask["status"] => {
  const status = String(value || "").toLowerCase();
  if (status === "completed" || status === "complete") return "Completed";
  if (status === "in progress") return "In Progress";
  return "Pending";
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const statusBadgeClass = (status: EmployeeTask["status"]) => {
  if (status === "Completed") return "bg-green-100 text-green-700 border-0";
  if (status === "In Progress") return "bg-primary/10 text-primary border-0";
  return "bg-muted text-muted-foreground border-0";
};

const Profile = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [performance, setPerformance] = useState<PerformanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.email) {
        setTasks([]);
        setPerformance(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [tasksResponse, performanceResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tasks?assignedToEmail=${encodeURIComponent(user.email)}`),
          fetch(`${API_BASE_URL}/api/employee-performance/${encodeURIComponent(user.email.toLowerCase())}`),
        ]);

        const tasksPayload = await tasksResponse.json().catch(() => ({}));
        const performancePayload = await performanceResponse.json().catch(() => ({}));

        const apiTasks = Array.isArray(tasksPayload?.tasks) ? tasksPayload.tasks : [];
        const normalizedTasks: EmployeeTask[] = apiTasks.map((task: any) => ({
          id: String(task.id),
          title: String(task.title || "Untitled Task"),
          status: normalizeStatus(task.managerStatus || task.status || "Pending"),
          priority: String(task.priority || "Medium"),
          deadline: task.deadline || null,
          updatedAt: task.updatedAt || task.createdAt || null,
        }));

        setTasks(normalizedTasks);
        setPerformance(performancePayload?.performance || null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load profile summary");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProfileData();
  }, [user?.email]);

  const summary = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "Completed").length;
    const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length;
    const pendingTasks = tasks.filter((task) => task.status === "Pending").length;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionPercent,
    };
  }, [tasks]);

  const recentTasks = useMemo(
    () => [...tasks]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6),
    [tasks],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <h1 className="text-2xl font-bold text-foreground">{user?.name || "Employee"}</h1>
        <p className="text-sm text-muted-foreground">{user?.email || "-"}</p>
        <p className="text-xs text-muted-foreground mt-1">Dynamic work summary based on your real task and performance data.</p>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading profile summary...</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!isLoading && !error ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Completed Tasks</p>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{summary.completedTasks}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">In Progress</p>
                  <Clock3 className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{summary.inProgressTasks}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Pending Tasks</p>
                  <ListTodo className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{summary.pendingTasks}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Task Completion</p>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{summary.completionPercent}%</p>
                <Progress value={summary.completionPercent} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Work Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks available yet.</p>
                ) : (
                  recentTasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{task.title}</p>
                        <Badge className={statusBadgeClass(task.status)}>{task.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Priority: {task.priority} • Deadline: {formatDate(task.deadline)}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Last Updated: {formatDateTime(task.updatedAt)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion Ratio</span>
                  <span className="font-semibold text-foreground">{Math.round(Number(performance?.completion_ratio || 0) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendance</span>
                  <span className="font-semibold text-foreground">{Number(performance?.attendance_percent || 0)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Delay</span>
                  <span className="font-semibold text-foreground">{Number(performance?.avg_delay_days || 0)} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Warnings</span>
                  <span className="font-semibold text-foreground">{Number(performance?.warning_count || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Escalations</span>
                  <span className="font-semibold text-foreground">{Number(performance?.escalation_count || 0)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">Updated: {formatDateTime(performance?.updated_at)}</p>
                <Button variant="outline" size="sm" className="w-full">Refresh Summary</Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Profile;
