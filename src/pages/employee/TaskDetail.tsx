import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Clock, Flag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type TaskDetailRecord = {
  id: string;
  title: string;
  managerName: string;
  deadline: string | null;
  priority: "High" | "Medium" | "Low" | "Critical";
  status: "Pending" | "In Progress" | "Completed";
  progress: number;
  overview: string;
  acceptanceCriteria: string[];
  attachments: Array<{ name: string }>;
};

const TaskDetail = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState<TaskDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setError("Task id is missing");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`);
        if (!response.ok) {
          throw new Error(`Unable to load task. Status ${response.status}`);
        }

        const data = await response.json();
        const apiTask = data?.task;

        const parsedTask: TaskDetailRecord = {
          id: String(apiTask?.id || taskId),
          title: String(apiTask?.title || "Untitled Task"),
          managerName: String(apiTask?.managerName || "Manager"),
          deadline: apiTask?.deadline || null,
          priority: (apiTask?.priority || "Medium") as TaskDetailRecord["priority"],
          status: (apiTask?.status || "Pending") as TaskDetailRecord["status"],
          progress: Number(apiTask?.progress || 0),
          overview: String(apiTask?.overview || "No task description available."),
          acceptanceCriteria: Array.isArray(apiTask?.acceptanceCriteria) ? apiTask.acceptanceCriteria : [],
          attachments: Array.isArray(apiTask?.attachments) ? apiTask.attachments : [],
        };

        setTask(parsedTask);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load task");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading task details...</p>;
  }

  if (error || !task) {
    return <p className="text-sm text-destructive">{error || "Task not found"}</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/employee/tasks" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Tasks
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-primary font-semibold flex items-center gap-1"><FileText className="h-3 w-3" /> TASK ID: {task.id}</p>
              <h1 className="text-2xl font-bold text-foreground mt-1">{task.title}</h1>
              <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {task.managerName}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {task.deadline || "-"}</span>
                <Badge className={task.priority === "High" ? "bg-destructive text-destructive-foreground" : task.priority === "Medium" ? "bg-amber-100 text-amber-700 border-0" : "bg-green-100 text-green-700 border-0"}>{task.priority}</Badge>
                <Badge variant="outline" className="text-primary border-primary">{task.status}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm">Edit Details</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Task Description</CardTitle></CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">{task.overview}</CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Activity Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {task.acceptanceCriteria.length === 0 && task.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet for this task.</p>
              ) : null}
              {task.acceptanceCriteria.map((criterion, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 bg-amber-100 text-amber-700">
                    <Flag className="h-3 w-3" />
                  </div>
                  <div className="flex-1 rounded-lg p-3 bg-amber-50 border border-amber-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground">Acceptance Criteria</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{criterion}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
