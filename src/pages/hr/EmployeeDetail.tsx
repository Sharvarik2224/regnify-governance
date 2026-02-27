import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, XCircle, Clock, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const tabs = ["Overview", "Performance", "AI Evaluation", "Governance Checks", "Approval Workflow", "Audit Trail"];

const employee = {
  name: "Jordan Smith",
  title: "Software Engineer - Cloud Infrastructure",
  empId: "E-99420",
  risk: "High",
  riskScore: 72,
  daysLeft: 18,
  probProgress: 76,
  status: "Under Review",
  manager: "Sarah Jenkins",
  department: "Engineering",
  startDate: "Jul 15, 2024",
  endDate: "Jan 15, 2025",
};

const auditTrail = [
  { time: "2024-12-20 14:22:15", actor: "System (AI)", action: "Risk Score Updated", entity: "Employee #E-99420", hash: "a3f2c1..." },
  { time: "2024-12-19 16:30:00", actor: "Sarah Jenkins", action: "Performance Review Uploaded", entity: "Employee #E-99420", hash: "b7d4e2..." },
  { time: "2024-12-18 09:15:00", actor: "HR_Admin", action: "Governance Check Triggered", entity: "Employee #E-99420", hash: "c9a8f3..." },
];

const EmployeeDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/hr/employees" className="inline-flex items-center text-xs font-semibold text-primary uppercase tracking-wider hover:underline">
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to Employee Directory
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Employee Governance Detail: {employee.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{employee.title} • Employee ID: #{employee.empId}</p>
          <div className="flex gap-2 mt-2">
            <span className="rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 text-xs font-semibold text-destructive">⚠ High Risk Profile</span>
            <span className="rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-xs font-semibold text-success">✓ Verified Compliance</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export Report</Button>
          <Button size="sm">View Full Profile</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium uppercase tracking-wider transition-colors ${
                activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Employee Information</h3>
            {[
              ["Full Name", employee.name],
              ["Department", employee.department],
              ["Manager", employee.manager],
              ["Start Date", employee.startDate],
              ["End Date", employee.endDate],
              ["Status", employee.status],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Probation Progress</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">{employee.probProgress}%</span>
              <span className="text-sm text-muted-foreground mb-1">completed</span>
            </div>
            <Progress value={employee.probProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">{employee.daysLeft} days remaining</p>
          </div>
        </div>
      )}

      {activeTab === "Performance" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            { label: "Task Completion", value: "82%", pct: 82 },
            { label: "Attendance", value: "91%", pct: 91 },
            { label: "Avg Task Score", value: "7.4 / 10", pct: 74 },
            { label: "On-time Delivery", value: "68%", pct: 68 },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
              <Progress value={m.pct} className="h-1.5 mt-3" />
            </div>
          ))}
        </div>
      )}

      {activeTab === "AI Evaluation" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Integrity Risk Score</p>
            <div className="relative inline-flex items-center justify-center">
              <svg className="h-36 w-36" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--warning))" strokeWidth="8" strokeDasharray={`${employee.riskScore * 3.14} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold text-foreground">{employee.riskScore}</span>
                <p className="text-[10px] text-muted-foreground uppercase">of 100</p>
              </div>
            </div>
            <span className="mt-3 inline-flex rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">Medium-High Risk</span>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Predictive Risk Category</p>
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
              <p className="font-semibold text-destructive text-sm">Early Attrition / Performance Deviation</p>
              <p className="text-xs text-muted-foreground mt-1">94% model confidence based on recent velocity drops.</p>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Explainable AI (SHAP-Based Feature Importance)</p>
              {[
                { label: "Task Completion Velocity", impact: "-30.4%", pct: 70, color: "bg-destructive" },
                { label: "Attendance & System Activity", impact: "-15.2%", pct: 45, color: "bg-warning" },
                { label: "Peer Feedback Sentiment", impact: "+5.8%", pct: 20, color: "bg-success" },
              ].map((f) => (
                <div key={f.label} className="mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{f.label}</span>
                    <span className={`font-semibold ${f.impact.startsWith("-") ? "text-destructive" : "text-success"}`}>{f.impact}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted mt-1">
                    <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="rounded-lg bg-info/5 border border-info/20 p-4">
              <p className="font-semibold text-info text-sm flex items-center gap-2"><Shield className="h-4 w-4" />AI Governance Recommendation</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                "Increased oversight required; review task cadence. The drop in task completion significantly outweighs positive peer feedback. Suggest immediate manager-led sync to identify blockers."
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Governance Checks" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Compliance Checks</h3>
            {[
              { label: "Attendance Threshold (>90%)", pass: false },
              { label: "Technical Skill Competency", pass: true },
              { label: "Task Completion SLA", pass: false },
              { label: "Peer Review (Pending)", pass: null },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                {c.pass === true && <CheckCircle2 className="h-4 w-4 text-success" />}
                {c.pass === false && <XCircle className="h-4 w-4 text-destructive" />}
                {c.pass === null && <Clock className="h-4 w-4 text-muted-foreground" />}
                <span className={`text-sm ${c.pass === null ? "text-muted-foreground italic" : "text-foreground"}`}>{c.label}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="font-semibold text-destructive text-sm">⚠ Critical Conflict Detected</p>
              <p className="text-xs text-muted-foreground mt-1">Manager recommended <strong>CONFIRM</strong> but AI risk is HIGH (72).</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-3">HR Manual Override</h3>
              <Textarea placeholder="Provide justification for overriding AI recommendation..." rows={4} />
              <Button className="mt-3 w-full">Submit Justification</Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2 uppercase tracking-wider">Logged to Audit Trail</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Approval Workflow" && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-6">Approval Pipeline</h3>
          <div className="flex items-center gap-4 mb-8">
            {["Manager Review", "HR Decision", "Site Head Final"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? "bg-success text-success-foreground" : i === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${i === 1 ? "font-semibold text-primary" : "text-muted-foreground"}`}>{step}</span>
                {i < 2 && <div className="h-px w-8 bg-border" />}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
            <p className="font-semibold text-foreground mb-4">HR Decision Required</p>
            <div className="flex gap-4 mb-4">
              {["Approve", "Send Back", "Override & Forward"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="decision" className="accent-primary" />
                  <span className="text-sm text-foreground">{opt}</span>
                </label>
              ))}
            </div>
            <Textarea placeholder="Mandatory justification..." rows={3} />
            <Button className="mt-3">Submit Decision</Button>
          </div>
        </div>
      )}

      {activeTab === "Audit Trail" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Immutable Audit Trail</h3>
            <p className="text-xs text-muted-foreground italic">This log is append-only and tamper-evident.</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Hash</th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map((a, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{a.time}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{a.actor}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{a.action}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{a.entity}</td>
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" />{a.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;
