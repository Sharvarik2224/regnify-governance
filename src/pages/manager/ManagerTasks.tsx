import { useEffect, useMemo, useState } from "react";
import { Plus, SlidersHorizontal, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";

const GET_EMPLOYEES_ENDPOINT = `${API_BASE_URL}/api/employees`;
const GET_TASKS_ENDPOINT = `${API_BASE_URL}/api/tasks`;
const ADD_TASK_ENDPOINT = `${API_BASE_URL}/api/tasks`;
const REVIEW_TASK_ENDPOINT = (taskId: string) => `${API_BASE_URL}/api/tasks/${taskId}/manager-review`;

const tabs = ["All Tasks", "Pending", "In Progress", "Completed"];

const categoryOptions = ["Development", "Bug Fix", "Research", "Documentation", "Testing", "DevOps", "UI/UX"];
const priorityOptions = ["Low", "Medium", "High", "Critical"];
const etaOptions = ["8 Hours", "1 Day", "3 Days", "1 Week"];
const difficultyOptions = ["Easy", "Medium", "Hard"];
const reminderOptions = ["1 day before", "6 hours before"];

type EmployeeRecord = {
  id: string;
  full_name?: string;
  role?: string;
  department?: string;
  email?: string;
};

type TaskRecord = {
  id: string;
  title: string;
  overview: string;
  assignedToEmployeeId: string;
  assignedToName: string;
  assignedToRole: string;
  assignedToEmail: string;
  department: string;
  category: string;
  priority: string;
  estimatedCompletionTime: string;
  deadline: string | null;
  difficulty: string;
  requiredSkills: string[];
  attachments: Array<{ name: string; mimeType?: string; size?: number }>;
  acceptanceCriteria: string[];
  reminderEnabled: boolean;
  reminderBefore: string;
  status: string;
  managerStatus: "Pending" | "In Progress" | "Completed";
  employeeStatus: string;
  progress: number;
  completedAt: string | null;
  submission: {
    deployment_url?: string;
    employee_comment?: string;
    files?: string[];
    submitted_at?: string | null;
  } | null;
  submissionData: {
    comment?: string;
    deployed_link?: string;
    image?: { name?: string; mime_type?: string; base64?: string } | null;
    submitted_at?: string;
  } | null;
  managerFeedback: {
    criteria?: string;
    reviewed_at?: string;
  } | null;
  managerName: string;
  createdAt: string;
};

type TaskFormState = {
  title: string;
  overview: string;
  assignedToEmployeeId: string;
  department: string;
  category: string;
  priority: string;
  estimatedCompletionTime: string;
  deadline: string;
  difficulty: string;
  requiredSkills: string;
  acceptanceCriteria: string;
  reminderEnabled: boolean;
  reminderBefore: string;
};

const initialFormState: TaskFormState = {
  title: "",
  overview: "",
  assignedToEmployeeId: "",
  department: "",
  category: "",
  priority: "Medium",
  estimatedCompletionTime: "",
  deadline: "",
  difficulty: "Medium",
  requiredSkills: "",
  acceptanceCriteria: "",
  reminderEnabled: false,
  reminderBefore: "1 day before",
};

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    Pending: "bg-warning/10 text-warning border-warning/20",
    "In Progress": "bg-info/10 text-info border-info/20",
    Completed: "bg-success/10 text-success border-success/20",
  };
  return `inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${styles[status] || "bg-muted text-muted-foreground border-border"}`;
};

const normalizeManagerStatus = (status: string): "Pending" | "In Progress" | "Completed" => {
  const value = String(status || "").toLowerCase();
  if (value === "completed") return "Completed";
  if (value === "in progress") return "In Progress";
  return "Pending";
};

const normalizeTaskRecord = (task: any): TaskRecord => ({
  ...task,
  managerStatus: normalizeManagerStatus(task?.managerStatus || task?.manager_status || task?.status || "Pending"),
});

const priorityBadge = (priority: string) => {
  const styles: Record<string, string> = {
    Critical: "bg-destructive text-destructive-foreground",
    High: "bg-destructive/10 text-destructive border-destructive/20",
    Medium: "bg-warning/10 text-warning border-warning/20",
    Low: "bg-success/10 text-success border-success/20",
  };
  return `inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${styles[priority] || "bg-muted text-muted-foreground border-border"}`;
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const resolveSubmittedLink = (task: TaskRecord) => {
  return String(task.submission?.deployment_url || task.submissionData?.deployed_link || "").trim();
};

const resolveSubmittedFiles = (task: TaskRecord) => {
  if (Array.isArray(task.submission?.files) && task.submission.files.length > 0) {
    return task.submission.files;
  }
  if (task.submissionData?.image?.name) {
    return [task.submissionData.image.name];
  }
  return [] as string[];
};

const resolveSubmittedImageHref = (task: TaskRecord) => {
  const image = task.submissionData?.image;
  const raw = String(image?.base64 || "").trim();
  if (!raw) {
    return "";
  }

  // If the database already contains a complete data URL, use it directly.
  if (raw.startsWith("data:image/")) {
    return raw;
  }

  // Remove accidental whitespace/newlines from stored base64.
  const normalizedBase64 = raw.replace(/\s+/g, "");

  const mimeType = image.mime_type || "image/png";
  return `data:${mimeType};base64,${normalizedBase64}`;
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error(`Unable to read file ${file.name}`));
    reader.readAsDataURL(file);
  });

const ManagerTasks = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All Tasks");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [form, setForm] = useState<TaskFormState>(initialFormState);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    const response = await fetch(GET_EMPLOYEES_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Unable to fetch employees. Status ${response.status}`);
    }
    const data = await response.json();
    setEmployees(Array.isArray(data?.employees) ? data.employees : []);
  };

  const fetchTasks = async () => {
    const response = await fetch(GET_TASKS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Unable to fetch tasks. Status ${response.status}`);
    }
    const data = await response.json();
    const apiTasks = Array.isArray(data?.tasks) ? data.tasks : [];
    setTasks(apiTasks.map((task: any) => normalizeTaskRecord(task)));
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([fetchEmployees(), fetchTasks()]);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load manager task data");
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === form.assignedToEmployeeId) || null,
    [employees, form.assignedToEmployeeId],
  );

  useEffect(() => {
    if (selectedEmployee) {
      setForm((previous) => ({
        ...previous,
        department: selectedEmployee.department || previous.department,
      }));
    }
  }, [selectedEmployee]);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (activeTab === "Pending") return task.managerStatus === "Pending";
      if (activeTab === "In Progress") return task.managerStatus === "In Progress";
      if (activeTab === "Completed") return task.managerStatus === "Completed";
      return true;
    });
  }, [activeTab, tasks]);

  const statusCards = useMemo(() => {
    const pending = tasks.filter((task) => task.managerStatus === "Pending").length;
    const inProgress = tasks.filter((task) => task.managerStatus === "In Progress").length;
    const completed = tasks.filter((task) => task.managerStatus === "Completed").length;
    return [
      { label: "Pending", value: pending, barColor: "bg-warning" },
      { label: "In Progress", value: inProgress, barColor: "bg-info" },
      { label: "Completed", value: completed, barColor: "bg-success" },
    ];
  }, [tasks]);

  const resetForm = () => {
    setForm(initialFormState);
    setAttachments([]);
    setFormError(null);
  };

  const handleEmployeeSelection = (employeeId: string) => {
    setForm((previous) => ({ ...previous, assignedToEmployeeId: employeeId }));
  };

  const handleSubmitTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!selectedEmployee?.email) {
      setFormError("Selected employee must have a valid email in employees collection.");
      return;
    }

    if (!form.title || !form.overview || !form.category || !form.priority || !form.deadline || !form.difficulty) {
      setFormError("Please complete all mandatory fields before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const attachmentPayload = await Promise.all(
        attachments.map(async (file) => ({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          base64: await fileToBase64(file),
        })),
      );

      const requiredSkills = form.requiredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const acceptanceCriteria = form.acceptanceCriteria
        .split("\n")
        .map((item) => item.trim().replace(/^[-*]\s*/, ""))
        .filter(Boolean);

      const response = await fetch(ADD_TASK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          overview: form.overview,
          assignedToEmployeeId: selectedEmployee.id,
          assignedToName: selectedEmployee.full_name || "",
          assignedToRole: selectedEmployee.role || "",
          assignedToEmail: selectedEmployee.email,
          department: form.department,
          category: form.category,
          priority: form.priority,
          estimatedCompletionTime: form.estimatedCompletionTime,
          deadline: form.deadline,
          difficulty: form.difficulty,
          requiredSkills,
          attachments: attachmentPayload,
          acceptanceCriteria,
          reminderEnabled: form.reminderEnabled,
          reminderBefore: form.reminderEnabled ? form.reminderBefore : "",
          managerName: user?.name || "Manager",
          managerEmail: user?.email || "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Task assignment failed. Status ${response.status}`);
      }

      const payload = await response.json();
      if (payload?.task) {
        setTasks((previous) => [normalizeTaskRecord(payload.task), ...previous]);
      } else {
        await fetchTasks();
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Unable to assign task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManagerReview = async (taskId: string, action: "approve" | "feedback") => {
    try {
      setIsReviewing(taskId);
      let feedbackCriteria = "";

      if (action === "feedback") {
        const input = window.prompt("Enter feedback criteria for the employee:", "");
        if (!input || !input.trim()) {
          return;
        }
        feedbackCriteria = input.trim();
      }

      const response = await fetch(REVIEW_TASK_ENDPOINT(taskId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          feedback_criteria: feedbackCriteria,
          reviewer_email: user?.email || "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to process review. Status ${response.status}`);
      }

      const payload = await response.json();
      const updatedTask = payload?.task;

      if (updatedTask?.id) {
        setTasks((previous) =>
          previous.map((task) =>
            task.id === updatedTask.id
              ? normalizeTaskRecord(updatedTask)
              : task,
          ),
        );
      } else {
        await fetchTasks();
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to process manager review");
    } finally {
      setIsReviewing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Task Assignment & Tracking</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setFormError(null)}>
              <Plus className="mr-2 h-4 w-4" />Assign New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Assign Task to Intern</DialogTitle>
            </DialogHeader>
            <form className="mt-4 space-y-4 max-h-[78vh] overflow-y-auto pr-1" onSubmit={handleSubmitTask}>
              <div>
                <Label htmlFor="task_title">Task Title *</Label>
                <Input
                  id="task_title"
                  className="mt-1"
                  placeholder="Implement Login Authentication API"
                  value={form.title}
                  onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="overview">High Level Overview of Task *</Label>
                <Textarea
                  id="overview"
                  className="mt-1"
                  rows={4}
                  placeholder="Develop a secure login authentication API using Node.js and JWT..."
                  value={form.overview}
                  onChange={(event) => setForm((previous) => ({ ...previous, overview: event.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Assigned To (Select Intern) *</Label>
                  <Select value={form.assignedToEmployeeId} onValueChange={handleEmployeeSelection}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Intern" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {(employee.full_name || "Unnamed Employee")} - {(employee.role || "Employee")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    className="mt-1"
                    placeholder="IT Department"
                    value={form.department}
                    onChange={(event) => setForm((previous) => ({ ...previous, department: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Task Category *</Label>
                  <Select value={form.category} onValueChange={(value) => setForm((previous) => ({ ...previous, category: value }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority Level *</Label>
                  <Select value={form.priority} onValueChange={(value) => setForm((previous) => ({ ...previous, priority: value }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Estimated Completion Time</Label>
                  <Select value={form.estimatedCompletionTime} onValueChange={(value) => setForm((previous) => ({ ...previous, estimatedCompletionTime: value }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select estimate" /></SelectTrigger>
                    <SelectContent>
                      {etaOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    className="mt-1"
                    value={form.deadline}
                    onChange={(event) => setForm((previous) => ({ ...previous, deadline: event.target.value }))}
                  />
                </div>
                <div>
                  <Label>Task Difficulty *</Label>
                  <Select value={form.difficulty} onValueChange={(value) => setForm((previous) => ({ ...previous, difficulty: value }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                    <SelectContent>
                      {difficultyOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="required_skills">Required Skills</Label>
                <Input
                  id="required_skills"
                  className="mt-1"
                  placeholder="React, Node.js, MongoDB"
                  value={form.requiredSkills}
                  onChange={(event) => setForm((previous) => ({ ...previous, requiredSkills: event.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="attachments">Attachments</Label>
                <Input
                  id="attachments"
                  type="file"
                  className="mt-1"
                  multiple
                  onChange={(event) => setAttachments(Array.from(event.target.files || []))}
                />
                {attachments.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Attached: {attachments.map((file) => file.name).join(", ")}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="acceptance_criteria">Acceptance Criteria</Label>
                <Textarea
                  id="acceptance_criteria"
                  className="mt-1"
                  rows={4}
                  placeholder="- Login API should validate email and password\n- JWT token should be generated"
                  value={form.acceptanceCriteria}
                  onChange={(event) => setForm((previous) => ({ ...previous, acceptanceCriteria: event.target.value }))}
                />
              </div>

              <div className="rounded-md border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="reminder_enabled"
                    checked={form.reminderEnabled}
                    onCheckedChange={(checked) => setForm((previous) => ({ ...previous, reminderEnabled: Boolean(checked) }))}
                  />
                  <Label htmlFor="reminder_enabled">Send reminder before deadline</Label>
                </div>
                {form.reminderEnabled && (
                  <div>
                    <Label>Reminder Timing</Label>
                    <Select value={form.reminderBefore} onValueChange={(value) => setForm((previous) => ({ ...previous, reminderBefore: value }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {reminderOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => { resetForm(); setIsDialogOpen(false); }}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Task"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statusCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
            <div className={`h-1 w-full rounded-full mt-3 ${card.barColor}`} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><SlidersHorizontal className="mr-2 h-3 w-3" />Filter</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3" />Export</Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Task</th>
              <th className="px-5 py-3">Assigned To</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">ETA</th>
              <th className="px-5 py-3">Deadline</th>
              <th className="px-5 py-3">Workflow Status</th>
              <th className="px-5 py-3">Reminder</th>
              <th className="px-5 py-3">Manager Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-sm text-muted-foreground">Loading tasks...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-sm text-destructive">{error}</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-sm text-muted-foreground">No tasks found. Assign a task to populate this table.</td>
              </tr>
            ) : (
              filtered.map((task) => (
                <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/30 align-top">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">{task.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{task.overview}</p>
                    {task.requiredSkills.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">Skills: {task.requiredSkills.join(", ")}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground">
                    <p>{task.assignedToName}</p>
                    <p className="text-[10px] text-muted-foreground">{task.assignedToRole || "Employee"}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{task.department || "-"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{task.category || "-"}</td>
                  <td className="px-5 py-4"><span className={priorityBadge(task.priority)}>{task.priority}</span></td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{task.estimatedCompletionTime || "-"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(task.deadline)}</td>
                  <td className="px-5 py-4">
                    <span className={statusBadge(normalizeManagerStatus(task.managerStatus || task.status || "Pending"))}>
                      {normalizeManagerStatus(task.managerStatus || task.status || "Pending")}
                    </span>
                    {task.managerFeedback?.criteria && (
                      <p className="mt-1 text-[10px] text-warning">Feedback shared</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {task.reminderEnabled ? task.reminderBefore || "Enabled" : "Disabled"}
                    <p className="mt-1">Attachments: {task.attachments.length}</p>
                    {resolveSubmittedLink(task) && (
                      <p className="mt-1">
                        URL: <a href={resolveSubmittedLink(task)} target="_blank" rel="noreferrer" className="text-primary underline">Open Link</a>
                      </p>
                    )}
                    {resolveSubmittedFiles(task).length > 0 && (
                      <p className="mt-1">Files: {resolveSubmittedFiles(task).join(", ")}</p>
                    )}
                    {resolveSubmittedImageHref(task) && (
                      <p className="mt-1">
                        Image: <a href={resolveSubmittedImageHref(task)} target="_blank" rel="noreferrer" className="text-primary underline">Open Image</a>
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {task.managerStatus === "In Progress" ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleManagerReview(task.id, "approve")} disabled={isReviewing === task.id}>
                          {isReviewing === task.id ? "Processing..." : "Approve"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleManagerReview(task.id, "feedback")} disabled={isReviewing === task.id}>
                          Send Feedback
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No action required</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {tasks.length} tasks</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled><ChevronLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm" disabled><ChevronRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTasks;
