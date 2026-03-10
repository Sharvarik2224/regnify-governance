import { useState } from "react";
import { Search, UserPlus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { teamMembers } from "@/data/managerMockData";

const riskBadgeStyle = (level: string) => {
  if (level === "Low") return "bg-green-100 text-green-700 border-green-200";
  if (level === "Medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
};

const statusStyle = (status: string) => {
  if (status === "Active") return "bg-success/10 text-success border-success/20";
  if (status === "Review Pending") return "bg-warning/10 text-warning border-warning/20";
  return "bg-muted text-muted-foreground border-border";
};

const riskBarColor = (pct: number) => {
  if (pct >= 80) return "bg-success";
  if (pct >= 50) return "bg-warning";
  return "bg-destructive";
};

const ManagerTeam = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const filtered = teamMembers.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status.toLowerCase().includes(statusFilter);
    const matchRisk = riskFilter === "all" || m.riskLevel.toLowerCase() === riskFilter;
    return matchSearch && matchStatus && matchRisk;
  });

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setRiskFilter("all"); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Team</h1>
          <p className="text-sm text-muted-foreground">Manage performance, track probation periods, and monitor department safety scores.</p>
        </div>
        <Button size="sm"><UserPlus className="mr-2 h-4 w-4" />Onboard Member</Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search team members by name or role..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
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

      {/* Table */}
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
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {m.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{m.role}</td>
                <td className={`px-5 py-4 text-sm ${m.probationEndWarning ? "text-destructive font-semibold" : "text-foreground"}`}>
                  {m.probationEnd}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{m.tasksCompleted} / {m.tasksTotal}</span>
                    <span className="text-xs text-muted-foreground">{m.taskPct}%</span>
                  </div>
                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden mt-1">
                    <div className={`h-full rounded-full ${riskBarColor(m.taskPct)}`} style={{ width: `${m.taskPct}%` }} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskBadgeStyle(m.riskLevel)}`}>
                    {m.riskScore.toFixed(2)}<br />{m.riskLevel}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle(m.status)}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">Generate Report</Button>
                    <Button size="sm" className="text-xs font-semibold">Send Warning</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing 1 to {filtered.length} of 24 members</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled><ChevronLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm"><ChevronRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTeam;
