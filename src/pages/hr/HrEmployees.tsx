import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ADD_EMPLOYEE_ENDPOINT = `${API_BASE_URL}/api/employees`;
const GET_EMPLOYEES_ENDPOINT = `${API_BASE_URL}/api/employees`;

type EmployeeRecord = {
  id: string;
  full_name?: string;
  email?: string;
  department?: string;
  role?: string;
  phone?: string;
  probation_period?: string;
  manager_assigned?: string;
  date_of_joining?: string | null;
};

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
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState<AddEmployeeForm>(initialFormState);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    setEmployeesError(null);

    try {
      const response = await fetch(GET_EMPLOYEES_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Unable to load employees. Status ${response.status}`);
      }

      const data = await response.json();
      const apiEmployees = Array.isArray(data?.employees) ? data.employees : [];
      setEmployees(apiEmployees);
    } catch (error) {
      setEmployeesError(error instanceof Error ? error.message : "Unable to fetch employees");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const departments = useMemo(() => {
    const uniqueDepartments = new Set(
      employees
        .map((employee) => (employee.department || "").trim())
        .filter(Boolean),
    );

    return Array.from(uniqueDepartments).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filtered = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !normalizedQuery ||
        [employee.full_name, employee.email, employee.role, employee.phone, employee.manager_assigned]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      const matchesDepartment = selectedDepartment === "all" || (employee.department || "") === selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, selectedDepartment]);

  const updateField = (field: keyof AddEmployeeForm, value: string) => {
    setEmployeeForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSendCredentials = async (employeeId: string, employeeName: string) => {
    setProvisioningId(employeeId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/provision-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Failed with status ${response.status}`);
      }

      toast({
        title: "Workflow triggered",
        description: `Credential email workflow started for ${employeeName}.`,
      });
    } catch (error) {
      toast({
        title: "Failed to send credentials",
        description: error instanceof Error ? error.message : "Unable to provision account",
        variant: "destructive",
      });
    } finally {
      setProvisioningId(null);
    }
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
      await fetchEmployees();
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
          <p className="text-sm text-muted-foreground">Monitor employee profile records from your employee collection.</p>
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

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employees by name, email, role or manager..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Department: All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department} value={department}>{department}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Employee Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Manager</th>
              <th className="px-5 py-3">Probation Period</th>
              <th className="px-5 py-3">Date Of Joining</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingEmployees ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={8}>Loading employees...</td>
              </tr>
            ) : employeesError ? (
              <tr>
                <td className="px-5 py-6 text-sm text-destructive" colSpan={8}>{employeesError}</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={9}>No employees found.</td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                  <td className="px-5 py-4">
                    <Link to={`/hr/employees/${emp.id}`} className="text-sm font-medium text-foreground hover:text-primary hover:underline">
                      {emp.full_name || "Unnamed Employee"}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{emp.email || "-"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{emp.department || "-"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{emp.role || "-"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{emp.phone || "-"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{emp.manager_assigned || "-"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{emp.probation_period || "-"}</td>
                  <td className="px-5 py-4 text-sm text-foreground">{emp.date_of_joining || "-"}</td>
                  <td className="px-5 py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1"
                      disabled={provisioningId === emp.id}
                      onClick={() => handleSendCredentials(emp.id, emp.full_name || emp.email || "Employee")}
                    >
                      <Mail className="h-3 w-3" />
                      {provisioningId === emp.id ? "Sending..." : "Send Credentials"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {employees.length} employees</p>
          <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={isLoadingEmployees}>
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HrEmployees;
