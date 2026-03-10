import { useState } from "react";
import { SlidersHorizontal, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { managerApprovals } from "@/data/managerMockData";

const tabs = ["All Requests", "Tasks", "Evaluations"];

const statusCards = [
  { label: "Total Pending", value: "24", barColor: "bg-primary" },
  { label: "High Urgency", value: "06", barColor: "bg-destructive", valueColor: "text-destructive" },
  { label: "Avg. Response Time", value: "1.2 Days", barColor: "bg-success" },
];

const statusStyle = (s: string) => {
  const m: Record<string, string> = {
    "URGENT": "bg-destructive/10 text-destructive border-destructive/20",
    "PENDING": "bg-warning/10 text-warning border-warning/20",
    "IN PROGRESS": "bg-success/10 text-success border-success/20",
    "NEW": "bg-info/10 text-info border-info/20",
  };
  return `inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m[s] || ""}`;
};

const ManagerApprovals = () => {
  const [activeTab, setActiveTab] = useState("All Requests");

  const filtered = managerApprovals.filter((a) => {
    if (activeTab === "All Requests") return true;
    if (activeTab === "Tasks") return a.type === "Task";
    return a.type === "Evaluation";
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
        <p className="text-sm text-muted-foreground">Review and manage organizational submissions for accountability.</p>
      </div>

      {/* Tabs + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6 border-b border-border">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium transition-colors ${activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><SlidersHorizontal className="mr-2 h-3 w-3" />Filter</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3" />Export</Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statusCards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-5">
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <p className={`text-3xl font-bold mt-1 ${c.valueColor || "text-foreground"}`}>{c.value}</p>
            <div className={`h-1 w-full rounded-full mt-3 ${c.barColor}`} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Days Remaining</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{a.employeeInitials}</div>
                    <span className="text-sm font-medium text-foreground">{a.employeeName}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${a.type === "Evaluation" ? "bg-accent text-accent-foreground border-border" : "bg-muted text-muted-foreground border-border"}`}>
                    {a.type}
                  </span>
                </td>
                <td className={`px-5 py-4 text-sm ${a.daysRemaining <= 5 ? "text-destructive font-semibold italic" : "text-foreground"}`}>
                  {a.daysRemaining <= 5 ? `${a.daysRemaining} Days Left` : `${a.daysRemaining} Days Left`}
                </td>
                <td className="px-5 py-4"><span className={statusStyle(a.status)}>{a.status}</span></td>
                <td className="px-5 py-4">
                  <Button size="sm" className="text-xs">Review</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing 1 to {filtered.length} of 24 approvals</p>
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

export default ManagerApprovals;
