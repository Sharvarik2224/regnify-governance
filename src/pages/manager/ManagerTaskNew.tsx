import { useEffect, useMemo, useState } from "react";
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
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type EmployeeRecord = {
  id: string;
  full_name?: string;
  role?: string;
  email?: string;
  department?: string;
};

const ManagerTaskNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    employee: "",
    title: "",
    description: "",
    priority: "",
    weightage: "",
  });

  useEffect(() => {
    const loadEmployees = async () => {
      const response = await fetch(`${API_BASE_URL}/api/employees`);
      const payload = await response.json().catch(() => ({}));
      setEmployees(Array.isArray(payload?.employees) ? payload.employees : []);
    };

    void loadEmployees();
  }, []);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === form.employee) || null,
    [employees, form.employee],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!selectedEmployee?.email || !date || !form.title || !form.description || !form.priority) {
      setFormError("Please complete employee, title, description, deadline and priority.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          overview: form.description,
          assignedToEmployeeId: selectedEmployee.id,
          assignedToName: selectedEmployee.full_name || "",
          assignedToRole: selectedEmployee.role || "",
          assignedToEmail: selectedEmployee.email,
          department: selectedEmployee.department || "",
          category: "General",
          priority: form.priority,
          estimatedCompletionTime: form.weightage ? `${form.weightage} hours` : "",
          deadline: date.toISOString(),
          difficulty: "Medium",
          requiredSkills: [],
          attachments: [],
          acceptanceCriteria: [],
          reminderEnabled: false,
          reminderBefore: "",
          managerName: user?.name || "Manager",
          managerEmail: user?.email || "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to create task. Status ${response.status}`);
      }

      navigate("/manager/tasks");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create task");
    } finally {
      setSubmitting(false);
    }
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
          <Select value={form.employee} onValueChange={(value) => setForm({ ...form, employee: value })}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Choose an employee" /></SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>{employee.full_name || "Employee"} - {employee.role || "Role"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Task Title</Label>
          <Input className="mt-1" placeholder="Enter task title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea className="mt-1" rows={4} placeholder="Describe the task requirements..." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
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
            <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Weightage (Hours)</Label>
            <Input className="mt-1" type="number" placeholder="e.g. 20" value={form.weightage} onChange={(event) => setForm({ ...form, weightage: event.target.value })} />
          </div>
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/manager/tasks")}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? "Assigning..." : "Assign Task"}</Button>
        </div>
      </form>
    </div>
  );
};

export default ManagerTaskNew;
