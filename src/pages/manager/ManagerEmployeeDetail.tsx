import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Building2, Calendar, Mail, AlertTriangle, CheckCircle2, XCircle, Clock, Shield, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { teamMembers } from "@/data/managerMockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const tabs = ["Overview", "Tasks", "Performance", "Evaluation", "Governance"];

const perfData = [
  { month: "Jul", score: 72 }, { month: "Aug", score: 68 }, { month: "Sep", score: 75 },
  { month: "Oct", score: 80 }, { month: "Nov", score: 78 }, { month: "Dec", score: 82 },
];

const employeeTasks = [
  { id: "1", title: "API Documentation Review", assignedDate: "Oct 5, 2024", status: "Completed", score: 92 },
  { id: "2", title: "Security Audit Checklist", assignedDate: "Oct 12, 2024", status: "In Progress", score: null },
  { id: "3", title: "Unit Test Coverage Report", assignedDate: "Oct 18, 2024", status: "Pending Review", score: null },
  { id: "4", title: "Infrastructure Migration Plan", assignedDate: "Nov 1, 2024", status: "Completed", score: 88 },
];

const taskStatusBadge = (s: string) => {
  const m: Record<string, string> = {
    "Completed": "bg-success/10 text-success border-success/20",
    "In Progress": "bg-info/10 text-info border-info/20",
    "Pending Review": "bg-warning/10 text-warning border-warning/20",
  };
  return `inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${m[s] || ""}`;
};

const ManagerEmployeeDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [recommendation, setRecommendation] = useState("");
  const [justification, setJustification] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emp = teamMembers.find((m) => m.id === id) || teamMembers[0];

  const handleSubmitEval = () => {
    console.log("Evaluation submitted:", { recommendation, justification, employeeId: id });
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <Link to="/manager/team" className="inline-flex items-center text-xs font-semibold text-primary uppercase tracking-wider hover:underline">
        <ArrowLeft className="mr-1 h-3 w-3" /> Manager / Employees / {emp.name}
      </Link>

      {/* Header Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-accent text-lg font-bold text-accent-foreground">
              {emp.initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{emp.name}</h1>
              <p className="text-sm text-muted-foreground">{emp.role} | #EMP-{emp.id.padStart(3, "0")}</p>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{emp.department}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined Oct 15, 2023</span>
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{emp.email}</span>
              </div>
            </div>
          </div>
          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive uppercase">Probation Period</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Employee Information</h3>
            {[
              ["Full Name", emp.name], ["Role", emp.role], ["Department", emp.department],
              ["Email", emp.email], ["Probation End", emp.probationEnd], ["Status", emp.status],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Probation Progress</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">{emp.taskPct}%</span>
              <span className="text-sm text-muted-foreground mb-1">completed</span>
            </div>
            <Progress value={emp.taskPct} className="h-2" />
            <p className="text-sm text-muted-foreground">Probation ends {emp.probationEnd}</p>
          </div>
        </div>
      )}

      {/* Tasks */}
      {activeTab === "Tasks" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">Task</th>
                <th className="px-5 py-3">Assigned Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {employeeTasks.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-4 text-sm font-medium text-foreground">{t.title}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{t.assignedDate}</td>
                  <td className="px-5 py-4"><span className={taskStatusBadge(t.status)}>{t.status}</span></td>
                  <td className="px-5 py-4 text-sm">{t.score ? <span className="font-semibold text-success">{t.score}/100</span> : "—"}</td>
                  <td className="px-5 py-4"><Button variant="ghost" size="sm" className="text-primary text-xs">Review</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Performance */}
      {activeTab === "Performance" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Task Completion", value: `${emp.taskPct}%`, pct: emp.taskPct },
              { label: "Attendance", value: `${emp.attendance}%`, pct: emp.attendance },
              { label: "Avg Score", value: "7.8 / 10", pct: 78 },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
                <Progress value={m.pct} className="h-1.5 mt-3" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Evaluation */}
      {activeTab === "Evaluation" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics Summary */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />System-Calculated Metrics Summary</h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Updated: 2H Ago</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">KPI Completion</p>
                  <p className="text-2xl font-bold text-foreground mt-1">94.2%</p>
                  <Progress value={94} className="h-1 mt-2" />
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Task Velocity</p>
                  <p className="text-2xl font-bold text-foreground mt-1">High</p>
                  <p className="text-xs text-success mt-1">↗ 12% above average</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Attendance Rate</p>
                  <p className="text-2xl font-bold text-foreground mt-1">100%</p>
                  <p className="text-xs text-muted-foreground mt-1">Perfect record (90 days)</p>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />Manager Final Recommendation
              </h3>
              {submitted ? (
                <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="font-semibold text-success">Submitted — Pending HR Review</p>
                  <p className="text-xs text-muted-foreground mt-1">Decision: {recommendation}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mb-3">Recommendation Decision</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { value: "Confirm", desc: "Permanent employment confirmed." },
                      { value: "Extend", desc: "Extend probation by 30-90 days." },
                      { value: "Terminate", desc: "Release from current role." },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                          recommendation === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">{opt.value}</span>
                          <input type="radio" name="rec" value={opt.value} checked={recommendation === opt.value} onChange={() => setRecommendation(opt.value)} className="accent-primary ml-auto" />
                        </div>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </label>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Justification for Decision <span className="text-destructive">*</span></p>
                    <Textarea
                      placeholder="Provide detailed reasoning for this evaluation decision. This will be reviewed by HR compliance..."
                      rows={4}
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Minimum 150 characters required. Your justification is permanent and will be logged in the governance trail.</p>
                  </div>
                  <Button className="mt-4 w-full" onClick={handleSubmitEval} disabled={!recommendation || justification.length < 10}>
                    <Send className="mr-2 h-4 w-4" />Submit Evaluation
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <h3 className="font-semibold text-foreground mb-4 flex items-center justify-center gap-2"><AlertTriangle className="h-4 w-4" />Risk Indicator</h3>
              <div className="relative inline-flex items-center justify-center">
                <svg className="h-28 w-28" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--success))" strokeWidth="8" strokeDasharray={`${12 * 3.14} 314`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-bold text-foreground">LOW</span>
                  <p className="text-[10px] text-muted-foreground">12/100</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">System assessment identifies minimal compliance or performance risk.</p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Performance Integrity</span><span className="text-success font-semibold">Excellent</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Policy Adherence</span><span className="text-success font-semibold">Compliant</span></div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Current Workflow Status</h3>
              <div className="space-y-4">
                {[
                  { step: "Self-Evaluation", status: "Completed by Employee", active: false, done: true },
                  { step: "Manager Review", status: "In Progress (Active Role)", active: true, done: false },
                  { step: "HR Verification", status: "Target: PENDING_HR", active: false, done: false },
                  { step: "Final Confirmation", status: "Executive Approval", active: false, done: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 h-3 w-3 rounded-full shrink-0 ${s.done ? "bg-success" : s.active ? "bg-primary" : "bg-muted"}`} />
                    <div>
                      <p className={`text-sm font-medium ${s.active ? "text-primary" : s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.step}</p>
                      <p className={`text-xs ${s.active ? "text-primary" : "text-muted-foreground"}`}>{s.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-info/30 bg-info/5 p-4">
              <p className="text-xs font-semibold text-info flex items-center gap-1"><Shield className="h-3 w-3" />Policy Note</p>
              <p className="text-xs text-muted-foreground mt-1">All evaluations submitted are subject to audit for impartiality. Ensure your justification aligns with the recorded system metrics.</p>
            </div>
          </div>
        </div>
      )}

      {/* Governance */}
      {activeTab === "Governance" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Compliance Checks</h3>
            {[
              { label: "Attendance Threshold (>90%)", pass: emp.attendance >= 90 },
              { label: "Task Completion Threshold (>70%)", pass: emp.taskPct >= 70 },
              { label: "AI Risk Score (Read-only)", pass: emp.riskLevel === "Low" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                {c.pass ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                <span className="text-sm text-foreground">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-3">AI Assessment (Read-only)</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Risk Score</span>
                <span className="font-bold text-foreground">{emp.riskScore.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AI Recommendation</span>
                <span className="font-semibold text-foreground">{emp.riskLevel === "Low" ? "Confirm" : emp.riskLevel === "Medium" ? "Extend" : "Review Required"}</span>
              </div>
            </div>
            {emp.riskLevel === "High" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="font-semibold text-destructive text-sm">⚠ AI recommendation differs from manager decision.</p>
                <p className="text-xs text-muted-foreground mt-1">High risk score detected. Any manager override will be logged to the governance audit trail.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerEmployeeDetail;
