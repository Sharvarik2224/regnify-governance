import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Clock, Upload, Send, Star, Flag, User } from "lucide-react";
import { employeeTasks } from "@/data/employeeMockData";
import { useState } from "react";

const TaskDetail = () => {
  const { taskId } = useParams();
  const task = employeeTasks.find((t) => t.id === taskId) || employeeTasks[0];
  const [progress, setProgress] = useState(task.progress);
  const [status, setStatus] = useState(task.status);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    console.log("Task update:", { taskId, progress, status, comment });
  };

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
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {task.assignedBy}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {task.deadline}</span>
                <Badge className={task.priority === "High" ? "bg-destructive text-destructive-foreground" : task.priority === "Medium" ? "bg-amber-100 text-amber-700 border-0" : "bg-green-100 text-green-700 border-0"}>{task.priority}</Badge>
                <Badge variant="outline" className="text-primary border-primary">{task.status}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm">Edit Details</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Task Description</CardTitle></CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">{task.description}</CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Activity Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {task.comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${c.role === "Manager" ? "bg-amber-100 text-amber-700" : c.role === "System" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                    {c.role === "System" ? <Flag className="h-3 w-3" /> : c.role === "Manager" ? <Star className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  </div>
                  <div className={`flex-1 rounded-lg p-3 ${c.role === "Manager" ? "bg-amber-50 border border-amber-100" : "bg-muted/50"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground">{c.author} ({c.role})</p>
                      <p className="text-xs text-muted-foreground">{c.date}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.text}</p>
                    {c.attachment && (
                      <div className="mt-2 flex items-center gap-2 rounded border px-2 py-1 text-xs text-muted-foreground w-fit">
                        <FileText className="h-3 w-3" /> {c.attachment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Post Update</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress (%)</span>
                  <span className="text-primary font-semibold">{progress}%</span>
                </div>
                <Slider value={[progress]} onValueChange={([v]) => setProgress(v)} max={100} step={5} />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>START</span><span>FINISH</span></div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Update Status</label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Add Comment</label>
                <Textarea className="mt-1" placeholder="Describe what you've accomplished..." value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Click to upload or drag and drop files here</p>
              </div>
              <Button className="w-full gap-2" onClick={handleSubmit}><Send className="h-4 w-4" /> Submit Task Update</Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-primary flex items-center gap-2">ℹ️ Note to Employee</p>
              <p className="text-xs text-muted-foreground mt-1">Updating your progress regularly helps the team stay aligned. If you are stuck, please change the status to "Stuck" and leave a comment for your manager.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
