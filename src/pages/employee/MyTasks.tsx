import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";

type EmployeeTask = {
  id: string;
  title: string;
  managerName: string;
  deadline: string | null;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In Progress" | "Completed";
  progress: number;
  overview: string;
  acceptanceCriteria: string[];
};

const normalizeStatus = (value: string): EmployeeTask["status"] => {
  const status = String(value || "").toLowerCase();
  if (status === "completed" || status === "complete") return "Completed";
  if (status === "in progress") return "In Progress";
  return "Pending";
};

const priorityColor: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

const statusColor: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/10 text-primary",
  Completed: "bg-green-100 text-green-700",
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async (silent = false) => {
    if (!user?.email) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const query = new URLSearchParams({ assignedToEmail: user.email });
      const response = await fetch(`${API_BASE_URL}/api/tasks?${query.toString()}`);

      if (!response.ok) {
        throw new Error(`Unable to fetch tasks. Status ${response.status}`);
      }

      const data = await response.json();
      const apiTasks = Array.isArray(data?.tasks) ? data.tasks : [];

      setTasks(
        apiTasks.map((task: any) => ({
          status: normalizeStatus(task.managerStatus || task.status || "Pending"),
          id: String(task.id),
          title: String(task.title || ""),
          managerName: String(task.managerName || "Manager"),
          deadline: task.deadline || null,
          priority: (task.priority || "Medium") as EmployeeTask["priority"],
          progress:
            normalizeStatus(task.managerStatus || task.status || "Pending") === "Completed"
              ? 100
              : Number(task.progress || 0),
          overview: String(task.overview || ""),
          acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [],
        })),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const intervalId = window.setInterval(() => {
      fetchTasks(true);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user?.email]);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (tab !== "All" && task.status !== tab) return false;
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, tab, tasks]);

  const counts = useMemo(
    () => ({
      Pending: tasks.filter((task) => task.status === "Pending").length,
      "In Progress": tasks.filter((task) => task.status === "In Progress").length,
      Completed: tasks.filter((task) => task.status === "Completed").length,
    }),
    [tasks],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground text-sm">You have {tasks.length} assigned tasks.</p>
        </div>
        <Button variant="outline" onClick={() => fetchTasks()}>Refresh</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Pending">Pending <span className="ml-1.5 text-xs bg-muted-foreground/20 rounded-full px-1.5">{counts.Pending}</span></TabsTrigger>
            <TabsTrigger value="In Progress">In Progress <span className="ml-1.5 text-xs bg-muted-foreground/20 rounded-full px-1.5">{counts["In Progress"]}</span></TabsTrigger>
            <TabsTrigger value="Completed">Completed <span className="ml-1.5 text-xs bg-muted-foreground/20 rounded-full px-1.5">{counts.Completed}</span></TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>

        <TabsContent value={tab} className="mt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks found.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((task) => (
                <Link to={`/employee/tasks/${task.id}`} key={task.id}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <div className="h-16 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg flex items-center justify-between px-4">
                      <Badge className={`${statusColor[task.status]} text-[10px]`}>{task.status.toUpperCase()}</Badge>
                      <Badge className={`${priorityColor[task.priority]} text-[10px]`}>{task.priority.toUpperCase()}</Badge>
                    </div>
                    <CardContent className="pt-4 space-y-3">
                      <h3 className="font-semibold text-foreground">{task.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.overview || "No description provided."}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {task.managerName.split(" ").map((name) => name[0]).join("")}
                        </div>
                        <span className="text-xs text-muted-foreground">Assigned by {task.managerName}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="text-primary font-medium">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(task.deadline)}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{task.acceptanceCriteria.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTasks;
