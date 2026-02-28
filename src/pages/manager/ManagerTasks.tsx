import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, SlidersHorizontal, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { managerTasks } from "@/data/managerMockData";

const tabs = ["All Tasks", "Active", "Pending Review", "Completed"];

const statusCards = [
  { label: "Pending Review", value: "12", change: "+2.5%", changeColor: "text-success", barColor: "bg-primary" },
  { label: "In Progress", value: "48", change: "-5.1%", changeColor: "text-destructive", barColor: "bg-warning" },
  { label: "Completed (MTD)", value: "156", change: "+10.2%", changeColor: "text-success", barColor: "bg-success" },
];

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    "Pending Review": "bg-warning/10 text-warning border-warning/20",
    "In Progress": "bg-info/10 text-info border-info/20",
    "Completed": "bg-success/10 text-success border-success/20",
    "Revision Requested": "bg-destructive/10 text-destructive border-destructive/20",
  };
  return `inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${styles[status] || ""}`;
};

const ManagerTasks = () => {
  const [activeTab, setActiveTab] = useState("All Tasks");
  const navigate = useNavigate();

  const filtered = managerTasks.filter((t) => {
    if (activeTab === "All Tasks") return true;
    if (activeTab === "Active") return t.status === "In Progress";
    if (activeTab === "Pending Review") return t.status === "Pending Review";
    if (activeTab === "Completed") return t.status === "Completed";
    return true;
  });

  const pendingCount = managerTasks.filter((t) => t.status === "Pending Review").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Task Assignment & Tracking</h1>
        <Button size="sm" onClick={() => navigate("/manager/tasks/new")}>
          <Plus className="mr-2 h-4 w-4" />Assign New Task
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statusCards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <span className={`text-xs font-semibold ${c.changeColor}`}>{c.change}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{c.value}</p>
            <div className={`h-1 w-full rounded-full mt-3 ${c.barColor}`} />
          </div>
        ))}
      </div>

      {/* Tabs + Actions */}
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
              {tab === "Pending Review" && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><SlidersHorizontal className="mr-2 h-3 w-3" />Filter</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-3 w-3" />Export</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Task Title</th>
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">Deadline</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Manager Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground">Project: {t.project}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                      {t.employeeInitials}
                    </div>
                    <span className="text-sm text-foreground">{t.employeeName}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{t.deadline}</td>
                <td className="px-5 py-4"><span className={statusBadge(t.status)}>{t.status}</span></td>
                <td className="px-5 py-4 text-sm">
                  {t.score !== null ? (
                    <span className={`font-semibold ${t.score >= 80 ? "text-success" : t.score >= 60 ? "text-warning" : "text-destructive"}`}>
                      {t.score}/100
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {t.status === "Pending Review" && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-primary text-xs">Review</Button>
                      <Button variant="ghost" size="sm" className="text-success text-xs">Approve</Button>
                    </div>
                  )}
                  {t.status === "In Progress" && (
                    <span className="text-xs italic text-muted-foreground">Awaiting Submission</span>
                  )}
                  {t.status === "Completed" && (
                    <span className="text-xs italic text-muted-foreground">Archived</span>
                  )}
                  {t.status === "Revision Requested" && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-primary text-xs">Re-Review</Button>
                      <Button variant="ghost" size="sm" className="text-warning text-xs">Remind</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of 64 tasks</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled><ChevronLeft className="h-3 w-3" /></Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm"><ChevronRight className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTasks;
