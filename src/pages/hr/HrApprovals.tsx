import { Link } from "react-router-dom";
import { Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const approvals = [
  { id: "1", name: "Alice Johnson", risk: "High", recommendation: "Review Required", conflict: true, daysLeft: 15 },
  { id: "2", name: "Michael Chen", risk: "Medium", recommendation: "Monitor", conflict: false, daysLeft: 42 },
  { id: "3", name: "Sarah Parker", risk: "Critical", recommendation: "Immediate Action", conflict: true, daysLeft: 5 },
  { id: "4", name: "Jordan Smith", risk: "High", recommendation: "Override Pending", conflict: true, daysLeft: 18 },
  { id: "5", name: "Liam Foster", risk: "Low", recommendation: "Approve", conflict: false, daysLeft: 60 },
];

const riskBadge = (risk: string) => {
  const styles: Record<string, string> = { Low: "risk-badge-low", Medium: "risk-badge-medium", High: "risk-badge-high", Critical: "risk-badge-critical" };
  return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${styles[risk] || ""}`;
};

const HrApprovals = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
      <p className="text-sm text-muted-foreground">Review and action employee probation decisions awaiting HR approval.</p>
    </div>

    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <th className="px-5 py-3">Employee</th>
            <th className="px-5 py-3">Risk Score</th>
            <th className="px-5 py-3">Manager Recommendation</th>
            <th className="px-5 py-3">Conflict</th>
            <th className="px-5 py-3">Days Remaining</th>
            <th className="px-5 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {approvals.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-5 py-4 text-sm font-medium text-foreground">{a.name}</td>
              <td className="px-5 py-4"><span className={riskBadge(a.risk)}>{a.risk}</span></td>
              <td className="px-5 py-4 text-sm text-muted-foreground italic">{a.recommendation}</td>
              <td className="px-5 py-4 text-center">
                {a.conflict ? <AlertTriangle className="h-4 w-4 text-warning mx-auto" /> : <span className="text-success">✓</span>}
              </td>
              <td className="px-5 py-4 text-sm text-foreground">{a.daysLeft}</td>
              <td className="px-5 py-4">
                <Link to={`/hr/employees/${a.id}`}>
                  <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" />Review</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default HrApprovals;
