import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { teamMembers } from "@/data/managerMockData";

const ManagerTaskNew = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [form, setForm] = useState({
    employee: "",
    title: "",
    description: "",
    priority: "",
    weightage: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Task Assignment Payload:", { ...form, deadline: date?.toISOString() });
    navigate("/manager/tasks");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate("/manager/tasks")} className="inline-flex items-center text-xs font-semibold text-primary uppercase tracking-wider hover:underline">
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to Tasks
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Assign New Task</h1>
        <p className="text-sm text-muted-foreground">Create and assign a task to a team member under probation.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div>
          <Label>Select Employee</Label>
          <Select value={form.employee} onValueChange={(v) => setForm({ ...form, employee: v })}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Choose an employee" /></SelectTrigger>
            <SelectContent>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name} — {m.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Task Title</Label>
          <Input className="mt-1" placeholder="Enter task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea className="mt-1" rows={4} placeholder="Describe the task requirements..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <Label>Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Weightage</Label>
            <Input className="mt-1" type="number" placeholder="e.g. 20" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/manager/tasks")}>Cancel</Button>
          <Button type="submit">Assign Task</Button>
        </div>
      </form>
    </div>
  );
};

export default ManagerTaskNew;
