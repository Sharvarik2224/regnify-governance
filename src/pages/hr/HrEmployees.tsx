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

const HrEmployees = () => {
  const [search, setSearch] = useState("");

  const filtered = employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees Directory</h1>
          <p className="text-sm text-muted-foreground">Monitor employee status, risk factors, and probation periods across the enterprise.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {["Full Name", "Email", "Department", "Role", "Assigned Manager"].map((f) => (
                <div key={f}>
                  <Label>{f}</Label>
                  <Input className="mt-1" placeholder={f} />
                </div>
              ))}
              <Button className="w-full">Add Employee</Button>
            </div>
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
