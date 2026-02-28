import { useState } from "react";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { governanceAlerts } from "@/data/managerMockData";

const tabs = ["All Alerts", "High Severity", "Pending Review", "Archived"];

const severityStyle = (severity: string) => {
  if (severity.includes("CRITICAL")) return "bg-destructive text-destructive-foreground";
  if (severity.includes("WARNING")) return "bg-warning text-warning-foreground";
  return "bg-success text-success-foreground";
};

const summaryCards = [
  { label: "TOTAL ALERTS", value: "24" },
  { label: "CRITICAL (RED)", value: "08", valueColor: "text-destructive" },
  { label: "WARNING (AMBER)", value: "12", valueColor: "text-warning" },
  { label: "RESOLVED", value: "04", valueColor: "text-success" },
];

const ManagerAlerts = () => {
  const [activeTab, setActiveTab] = useState("All Alerts");

  const filtered = governanceAlerts.filter((a) => {
    if (activeTab === "All Alerts") return true;
    if (activeTab === "High Severity") return a.severity.includes("CRITICAL");
    if (activeTab === "Pending Review") return a.severity.includes("WARNING");
    if (activeTab === "Archived") return a.severity.includes("RESOLVED");
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Governance Alerts</h1>
        <div className="flex gap-3 items-center">
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search alerts..." className="pl-9" />
          </div>
          <Button size="sm"><Download className="mr-2 h-4 w-4" />Export Audit Trail</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{c.label}</span>
            <p className={`text-3xl font-bold mt-1 ${c.valueColor || "text-foreground"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium transition-colors ${activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {filtered.map((alert) => (
          <div key={alert.id} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severityStyle(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs text-muted-foreground">ID: #{alert.id.toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{alert.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm">
                    {alert.severity.includes("CRITICAL") ? "Review Audit Trail" : alert.severity.includes("RESOLVED") ? "View Details" : "View Details"}
                  </Button>
                  <Button size="sm">
                    {alert.severity.includes("CRITICAL") ? "Assign Investigation" : alert.severity.includes("RESOLVED") ? "Archive" : "Acknowledge"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerAlerts;
