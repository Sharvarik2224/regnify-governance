import { useEffect, useMemo, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight, Users2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/lib/audit";

type EmployeeRecord = {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  department?: string;
  probation_period?: string;
  date_of_joining?: string | null;
};

type TaskRecord = {
  id: string;
  assignedToEmail?: string;
  managerStatus?: string;
};

type PerformanceRecord = {
  employee_email?: string;
  completion_ratio?: number;
};

type TeamRecord = {
  id: string;
  name: string;
  managerName?: string;
  managerEmail?: string;
  members: Array<{
    employeeId: string;
    name: string;
    email: string;
    role: string;
    department: string;
  }>;
  createdAt?: string | null;
};

type TeamTaskForm = {
  title: string;
  overview: string;
  category: string;
  priority: string;
  deadline: string;
  difficulty: string;
};

const riskBadgeStyle = (level: string) => {
  if (level === "Low") return "bg-green-100 text-green-700 border-green-200";
  if (level === "Medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
};

const statusStyle = (status: string) => {
  if (status === "Approved All") return "bg-success/10 text-success border-success/20";
  if (status === "Review Pending") return "bg-warning/10 text-warning border-warning/20";
  return "bg-muted text-muted-foreground border-border";
};

const isManagerApprovedTask = (task: TaskRecord) => {
  return String(task.managerStatus || "").trim().toLowerCase() === "completed";
};

const riskBarColor = (pct: number) => {
  if (pct >= 80) return "bg-success";
  if (pct >= 50) return "bg-warning";
  return "bg-destructive";
};

const toProbationEnd = (joiningDate?: string | null, probationPeriod?: string) => {
  if (!joiningDate || !probationPeriod) return "-";

  const start = new Date(joiningDate);
  if (Number.isNaN(start.getTime())) return "-";

  const probationDays = Number(String(probationPeriod).match(/\d+/)?.[0] || 0);
  if (!probationDays) return "-";

  const end = new Date(start);
  end.setDate(end.getDate() + probationDays);

  return end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const ManagerTeam = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [warningSubmitting, setWarningSubmitting] = useState(false);
  const [warningTarget, setWarningTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [warningText, setWarningText] = useState("");
  const [teamTaskForm, setTeamTaskForm] = useState<TeamTaskForm>({
    title: "",
    overview: "",
    category: "General",
    priority: "Medium",
    deadline: "",
    difficulty: "Medium",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [employeesResponse, tasksResponse, performanceResponse, teamsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/employees`),
        fetch(`${API_BASE_URL}/api/tasks`),
        fetch(`${API_BASE_URL}/api/employee-performance`),
        fetch(`${API_BASE_URL}/api/teams?managerEmail=${encodeURIComponent(user?.email || "")}`),
      ]);

      const employeesPayload = await employeesResponse.json().catch(() => ({}));
      const tasksPayload = await tasksResponse.json().catch(() => ({}));
      const performancePayload = await performanceResponse.json().catch(() => ({}));
      const teamsPayload = await teamsResponse.json().catch(() => ({}));

      setEmployees(Array.isArray(employeesPayload?.employees) ? employeesPayload.employees : []);
      setTasks(Array.isArray(tasksPayload?.tasks) ? tasksPayload.tasks : []);
      setPerformance(Array.isArray(performancePayload?.performance) ? performancePayload.performance : []);
      setTeams(Array.isArray(teamsPayload?.teams) ? teamsPayload.teams : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load manager team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user?.email]);

  const employeeRows = useMemo(() => {
    return employees.map((employee) => {
      const employeeEmail = String(employee.email || "").trim().toLowerCase();
      const relatedTasks = tasks.filter((task) => String(task.assignedToEmail || "").trim().toLowerCase() === employeeEmail);
      const completedTasks = relatedTasks.filter((task) => isManagerApprovedTask(task)).length;
      const taskPct = relatedTasks.length ? Math.round((completedTasks / relatedTasks.length) * 100) : 0;

      const performanceRecord = performance.find(
        (record) => String(record.employee_email || "").trim().toLowerCase() === employeeEmail,
      );

      const completionRatio = Number(performanceRecord?.completion_ratio ?? taskPct);
      const riskScore = Math.max(0, Math.round((100 - completionRatio) / 12));
      const riskLevel = completionRatio >= 80 ? "Low" : completionRatio >= 50 ? "Medium" : "High";
      const status = relatedTasks.length > 0 && completedTasks === relatedTasks.length
        ? "Approved All"
        : "Review Pending";

      return {
        id: employee.id,
        name: employee.full_name || "Unnamed Employee",
        initials: (employee.full_name || "UE")
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || "")
          .join("") || "UE",
        email: employee.email || "-",
        role: employee.role || "-",
        probationEnd: toProbationEnd(employee.date_of_joining, employee.probation_period),
        tasksCompleted: completedTasks,
        tasksTotal: relatedTasks.length,
        taskPct,
        riskScore,
        riskLevel,
        status,
      };
    });
  }, [employees, tasks, performance]);

  const filtered = useMemo(
    () => employeeRows.filter((member) => {
      const matchSearch =
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.role.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || member.status.toLowerCase().includes(statusFilter);
      const matchRisk = riskFilter === "all" || member.riskLevel.toLowerCase() === riskFilter;
      return matchSearch && matchStatus && matchRisk;
    }),
    [employeeRows, search, statusFilter, riskFilter],
  );

  const selectedTeam = useMemo(() => teams.find((team) => team.id === selectedTeamId) || null, [teams, selectedTeamId]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRiskFilter("all");
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds((previous) =>
      previous.includes(employeeId)
        ? previous.filter((id) => id !== employeeId)
        : [...previous, employeeId],
    );
  };

  const resetTeamTaskForm = () => {
    setTeamTaskForm({
      title: "",
      overview: "",
      category: "General",
      priority: "Medium",
      deadline: "",
      difficulty: "Medium",
    });
  };

  const handleGenerateReport = async (employeeId: string, employeeName: string) => {
    await logAuditEvent({
      action: "Manager Report Generated",
      entity: "Employee",
      entityId: employeeId,
      actor: user?.email || user?.name || "Manager",
      metadata: {
        employee_name: employeeName,
        source: "manager/team",
      },
    });
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || selectedEmployeeIds.length === 0) {
      setError("Team name and at least one employee are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName.trim(),
          memberEmployeeIds: selectedEmployeeIds,
          managerName: user?.name || "Manager",
          managerEmail: user?.email || "",
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to create team. Status ${response.status}`);
      }

      setMessage(`Team \"${teamName.trim()}\" created successfully.`);
      setTeamDialogOpen(false);
      setTeamName("");
      setSelectedEmployeeIds([]);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTaskToTeam = async () => {
    if (!selectedTeamId || !teamTaskForm.title || !teamTaskForm.overview || !teamTaskForm.deadline) {
      setError("Team, title, overview and deadline are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${selectedTeamId}/assign-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...teamTaskForm,
          managerName: user?.name || "Manager",
          managerEmail: user?.email || "",
          requiredSkills: [],
          acceptanceCriteria: [],
          reminderEnabled: false,
          reminderBefore: "",
          estimatedCompletionTime: "",
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to assign task to team. Status ${response.status}`);
      }

      setMessage(`Task assigned to ${selectedTeam?.name || "team"} (${payload?.createdTasks || 0} employees).`);
      setAssignDialogOpen(false);
      resetTeamTaskForm();
      await loadData();
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Unable to assign task to team");
    } finally {
      setSubmitting(false);
    }
  };

  const openWarningDialog = (member: { id: string; name: string; email: string }) => {
    setWarningTarget(member);
    setWarningText("");
    setWarningDialogOpen(true);
  };

  const handleSubmitWarning = async () => {
    if (!warningTarget?.email) {
      setError("Employee email is required for sending warning.");
      return;
    }

    const normalizedWarning = warningText.trim();
    if (!normalizedWarning) {
      setError("Please enter warning details before submitting.");
      return;
    }

    setWarningSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/complains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_email: warningTarget.email,
          employee_name: warningTarget.name,
          manager_email: String(user?.email || "").trim().toLowerCase(),
          manager_name: String(user?.name || "Manager").trim(),
          complaint_text: normalizedWarning,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to submit warning. Status ${response.status}`);
      }

      await logAuditEvent({
        action: "Task Feedback Sent",
        entity: "Complaint",
        entityId: payload?.complaint?.id || warningTarget.id,
        actor: user?.email || user?.name || "Manager",
        metadata: {
          employee_email: warningTarget.email,
          source: "manager/team/warning",
        },
      });

      setWarningDialogOpen(false);
      setWarningTarget(null);
      setWarningText("");
      setMessage(`Warning submitted for ${warningTarget.name}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit warning");
    } finally {
      setWarningSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Team</h1>
          <p className="text-sm text-muted-foreground">View all employees, build teams, and assign tasks at team level.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><FolderPlus className="mr-2 h-4 w-4" />Create Team</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
                <DialogDescription>Select employees and group them into a reusable team.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input id="team-name" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="e.g. Compliance Squad" className="mt-1" />
                </div>

                <div>
                  <Label>Select Team Members</Label>
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-border p-3 space-y-2">
                    {employeeRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No employees available.</p>
                    ) : employeeRows.map((member) => (
                      <label key={member.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-muted/40">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={selectedEmployeeIds.includes(member.id)} onCheckedChange={() => toggleEmployeeSelection(member.id)} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role} - {member.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTeam} disabled={submitting}>{submitting ? "Creating..." : "Create Team"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Users2 className="mr-2 h-4 w-4" />Assign Task to Team</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Task to Team</DialogTitle>
                <DialogDescription>Create one task and assign it to every member of the selected team.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Team</Label>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select team" /></SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>{team.name} ({team.members.length} members)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Task Title</Label>
                  <Input className="mt-1" value={teamTaskForm.title} onChange={(event) => setTeamTaskForm((previous) => ({ ...previous, title: event.target.value }))} />
                </div>

                <div>
                  <Label>Task Overview</Label>
                  <Textarea className="mt-1" rows={4} value={teamTaskForm.overview} onChange={(event) => setTeamTaskForm((previous) => ({ ...previous, overview: event.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Input className="mt-1" value={teamTaskForm.category} onChange={(event) => setTeamTaskForm((previous) => ({ ...previous, category: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={teamTaskForm.priority} onValueChange={(value) => setTeamTaskForm((previous) => ({ ...previous, priority: value }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Deadline</Label>
                    <Input type="date" className="mt-1" value={teamTaskForm.deadline} onChange={(event) => setTeamTaskForm((previous) => ({ ...previous, deadline: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select value={teamTaskForm.difficulty} onValueChange={(value) => setTeamTaskForm((previous) => ({ ...previous, difficulty: value }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAssignTaskToTeam} disabled={submitting}>{submitting ? "Assigning..." : "Assign to Team"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Warning</DialogTitle>
            <DialogDescription>
              {warningTarget
                ? `Submit a complaint for ${warningTarget.name}. This will be visible in HR high-priority alerts.`
                : "Submit a complaint for this employee."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="warning-text">Warning Details</Label>
            <Textarea
              id="warning-text"
              rows={5}
              value={warningText}
              onChange={(event) => setWarningText(event.target.value)}
              placeholder="Example: Employee is not completing assigned tasks or working hours are below 6 hours/day."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWarningDialogOpen(false)} disabled={warningSubmitting}>Cancel</Button>
              <Button onClick={handleSubmitWarning} disabled={warningSubmitting}>{warningSubmitting ? "Submitting..." : "Submit Warning"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employees by name, role, or email..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved All</SelectItem>
                <SelectItem value="review">Review Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Level:</span>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Risk Levels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-3 w-3" />Clear</Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Member Name</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Probation End</th>
              <th className="px-5 py-3">Tasks</th>
              <th className="px-5 py-3">Risk Score</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={7}>Loading employees...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={7}>No employees found.</td>
              </tr>
            ) : filtered.map((member) => (
              <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{member.role}</td>
                <td className="px-5 py-4 text-sm text-foreground">{member.probationEnd}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{member.tasksCompleted} / {member.tasksTotal}</span>
                    <span className="text-xs text-muted-foreground">{member.taskPct}%</span>
                  </div>
                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden mt-1">
                    <div className={`h-full rounded-full ${riskBarColor(member.taskPct)}`} style={{ width: `${member.taskPct}%` }} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskBadgeStyle(member.riskLevel)}`}>
                    {member.riskScore.toFixed(2)}<br />{member.riskLevel}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle(member.status)}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={() => handleGenerateReport(member.id, member.name)}>Generate Report</Button>
                    <Button
                      size="sm"
                      className="text-xs font-semibold"
                      onClick={() => openWarningDialog({ id: member.id, name: member.name, email: member.email })}
                    >
                      Send Warning
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing 1 to {filtered.length} of {employeeRows.length} members</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled><ChevronLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm"><ChevronRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Teams</h2>
          <p className="text-xs text-muted-foreground">{teams.length} team(s)</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Team Name</th>
              <th className="px-5 py-3">Members</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={4}>No teams created yet.</td>
              </tr>
            ) : teams.map((team) => (
              <tr key={team.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4 text-sm font-medium text-foreground">{team.name}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{team.members.length}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "-"}</td>
                <td className="px-5 py-4">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedTeamId(team.id); setAssignDialogOpen(true); }}>
                    Assign Task
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerTeam;
