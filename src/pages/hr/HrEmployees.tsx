import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const employees = [
  { id: "1", name: "Sarah Anderson", empId: "EMP-0092", initials: "SA", dept: "Product Strategy", manager: "Robert Fox", probEnd: "Oct 12, 2024", riskLevel: "Low", riskPct: 20, status: "ACTIVE" },
  { id: "2", name: "Jameson Miller", empId: "EMP-0104", initials: "JM", dept: "Engineering", manager: "Annette Black", probEnd: "Nov 05, 2024", riskLevel: "Medium", riskPct: 55, status: "UNDER REVIEW" },
  { id: "3", name: "Eleanor Lewis", empId: "EMP-0211", initials: "EL", dept: "Legal Compliance", manager: "Cody Fisher", probEnd: "Dec 20, 2024", riskLevel: "High", riskPct: 85, status: "FINALIZED" },
  { id: "4", name: "Daniel K. Zhao", empId: "EMP-0045", initials: "DZ", dept: "Operations", manager: "Guy Hawkins", probEnd: "Sept 30, 2024", riskLevel: "Low", riskPct: 15, status: "ACTIVE" },
  { id: "5", name: "Bessie Knight", empId: "EMP-0182", initials: "BK", dept: "Finance", manager: "Esther Howard", probEnd: "Jan 15, 2025", riskLevel: "Medium", riskPct: 50, status: "UNDER REVIEW" },
];

const riskBarColor = (level: string) => {
  if (level === "Low") return "bg-success";
  if (level === "Medium") return "bg-warning";
  return "bg-destructive";
};

const statusStyle = (status: string) => {
  if (status === "ACTIVE") return "bg-success/10 text-success border-success/20";
  if (status === "UNDER REVIEW") return "bg-warning/10 text-warning border-warning/20";
  return "bg-muted text-muted-foreground border-border";
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ADD_EMPLOYEE_ENDPOINT = `${API_BASE_URL}/api/employees`;

type AddEmployeeForm = {
  full_name: string;
  email: string;
  department: string;
  role: string;
  phone: string;
  probation_period: string;
  manager_assigned: string;
  date_of_joining: string;
};

const initialFormState: AddEmployeeForm = {
  full_name: "",
  email: "",
  department: "",
  role: "",
  phone: "",
  probation_period: "",
  manager_assigned: "",
  date_of_joining: "",
};

const HrEmployees = () => {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState<AddEmployeeForm>(initialFormState);

  const filtered = employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  const updateField = (field: keyof AddEmployeeForm, value: string) => {
    setEmployeeForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleAddEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!employeeForm.role) {
      setFormError("Role is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(ADD_EMPLOYEE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeForm),
      });

      if (!response.ok) {
        const errorResponse = await response.json().catch(() => null);
        const apiError =
          errorResponse?.details ||
          errorResponse?.error ||
          `Employee creation failed with status ${response.status}`;

        throw new Error(apiError);
      }

      setEmployeeForm(initialFormState);
      setIsDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to add employee. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees Directory</h1>
          <p className="text-sm text-muted-foreground">Monitor employee status, risk factors, and probation periods across the enterprise.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 mt-4 max-h-[72vh] overflow-y-auto pr-1" onSubmit={handleAddEmployee}>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  className="mt-1"
                  placeholder="Full Name"
                  value={employeeForm.full_name}
                  onChange={(event) => updateField("full_name", event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-1"
                  placeholder="Email"
                  value={employeeForm.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  className="mt-1"
                  placeholder="Department"
                  value={employeeForm.department}
                  onChange={(event) => updateField("department", event.target.value)}
                />
              </div>

              <div>
                <Label>Role *</Label>
                <Select value={employeeForm.role} onValueChange={(value) => updateField("role", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select an option ..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                    <SelectItem value="HR Executive">HR Executive</SelectItem>
                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                    <SelectItem value="Operations Associate">Operations Associate</SelectItem>
                    <SelectItem value="Finance Analyst">Finance Analyst</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  className="mt-1"
                  placeholder="Phone"
                  value={employeeForm.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="probation_period">Probation Period</Label>
                <Input
                  id="probation_period"
                  className="mt-1"
                  placeholder="Probation period"
                  value={employeeForm.probation_period}
                  onChange={(event) => updateField("probation_period", event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="manager_assigned">Manager Assigned</Label>
                <Input
                  id="manager_assigned"
                  className="mt-1"
                  placeholder="Manager assigned"
                  value={employeeForm.manager_assigned}
                  onChange={(event) => updateField("manager_assigned", event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="date_of_joining">Date of Joining</Label>
                <Input
                  id="date_of_joining"
                  type="date"
                  className="mt-1"
                  value={employeeForm.date_of_joining}
                  onChange={(event) => updateField("date_of_joining", event.target.value)}
                />
              </div>

              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Add Employee"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employees by name, ID or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select>
            <SelectTrigger className="w-40"><SelectValue placeholder="Risk: All Levels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status: All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="review">Under Review</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-44"><SelectValue placeholder="Department: All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="eng">Engineering</SelectItem>
              <SelectItem value="ops">Operations</SelectItem>
              <SelectItem value="fin">Finance</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon"><SlidersHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Employee Name</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Manager</th>
              <th className="px-5 py-3">Probation End</th>
              <th className="px-5 py-3">Risk Score</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                <td className="px-5 py-4">
                  <Link to={`/hr/employees/${emp.id}`} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {emp.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground">ID: {emp.empId}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{emp.dept}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{emp.manager}</td>
                <td className="px-5 py-4 text-sm text-foreground">{emp.probEnd}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${riskBarColor(emp.riskLevel)}`} style={{ width: `${emp.riskPct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{emp.riskLevel}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle(emp.status)}`}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing 1 to {filtered.length} of 48 employees</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled><ChevronLeft className="h-3 w-3 mr-1" />Previous</Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next<ChevronRight className="h-3 w-3 ml-1" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrEmployees;
