import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Calendar, MessageSquare } from "lucide-react";
import { employeeTasks } from "@/data/employeeMockData";
import { Link } from "react-router-dom";

const priorityColor: Record<string, string> = {
  High: "bg-destructive text-destructive-foreground",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

const statusColor: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/10 text-primary",
  Completed: "bg-green-100 text-green-700",
};

const MyTasks = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");

  const filtered = employeeTasks.filter((t) => {
    if (tab !== "All" && t.status !== tab) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    Pending: employeeTasks.filter(t => t.status === "Pending").length,
    "In Progress": employeeTasks.filter(t => t.status === "In Progress").length,
    Completed: employeeTasks.filter(t => t.status === "Completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground text-sm">You have {employeeTasks.length} tasks remaining this week.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New Task</Button>
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
            <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <TabsContent value={tab} className="mt-6">
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((task) => (
              <Link to={`/employee/tasks/${task.id}`} key={task.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="h-16 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg flex items-center justify-between px-4">
                    <Badge className={`${statusColor[task.status]} text-[10px]`}>{task.status.toUpperCase()}</Badge>
                    <Badge className={`${priorityColor[task.priority]} text-[10px]`}>{task.priority.toUpperCase()} PRIORITY</Badge>
                  </div>
                  <CardContent className="pt-4 space-y-3">
                    <h3 className="font-semibold text-foreground">{task.title}</h3>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {task.assignedBy.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-xs text-muted-foreground">Assigned by {task.assignedBy}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="text-primary font-medium">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1.5" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{task.deadline}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{task.comments.length}</span>
                    </div>
                    {task.status === "Completed" && <span className="text-xs text-green-600 font-medium flex items-center gap-1">✅ Done</span>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTasks;
