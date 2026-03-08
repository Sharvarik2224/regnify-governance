import { useState } from "react";
import { AlertTriangle, Clock, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const categories = [
  {
    title: "High Risk Employees",
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/5 border-destructive/20",
    items: [
      { title: "Sarah Parker - Critical Risk (Score: 92)", desc: "5 days remaining. Manager recommends immediate action. AI flags attendance pattern anomaly." },
      { title: "Alice Johnson - High Risk (Score: 78)", desc: "15 days remaining. Governance conflict detected between AI and manager assessment." },
    ],
  },
  {
    title: "Attendance Violations",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/5 border-warning/20",
    items: [
      { title: "Michael Chen - Below 85% Threshold", desc: "Attendance dropped to 82% over last 30 days. System activity inconsistent." },
    ],
  },
  {
    title: "Expiring Probation",
    icon: Users,
    color: "text-info",
    bgColor: "bg-info/5 border-info/20",
    items: [
      { title: "Sarah Parker - 5 days remaining", desc: "Critical risk employee with unresolved governance checks." },
      { title: "Daniel Zhao - 12 days remaining", desc: "Low risk. All governance checks passed. Awaiting final site head approval." },
    ],
  },
];

const GovernanceAlerts = () => {
  const [feedbackInput, setFeedbackInput] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState<string[]>([
    "Jordan Smith: schedule performance coaching and attendance audit this week.",
  ]);

  const handleAddFeedback = () => {
    const trimmedNote = feedbackInput.trim();
    if (!trimmedNote) {
      return;
    }

    setFeedbackNotes((previous) => [trimmedNote, ...previous]);
    setFeedbackInput("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Governance Alerts</h1>
        <p className="text-sm text-muted-foreground">Critical governance notifications requiring immediate HR attention.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat.title} className="rounded-lg border border-border bg-card">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <cat.icon className={`h-5 w-5 ${cat.color}`} />
              <h2 className="font-semibold text-foreground">{cat.title}</h2>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{cat.items.length}</span>
            </div>
            <div className="p-5 space-y-3">
              {cat.items.map((item, i) => (
                <div key={i} className={`rounded-lg border p-4 ${cat.bgColor}`}>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Leave Applications, Manager Reports & HR Feedback</h2>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{2 + feedbackNotes.length}</span>
          </div>

          <div className="p-5 space-y-3">
            <div className="rounded-lg border p-4 bg-primary/5 border-primary/20">
              <h3 className="text-sm font-semibold text-foreground">Leave Application - Michael Chen</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Employee requested 3 leave days (Mar 12 - Mar 14). Awaiting HR review.</p>
            </div>

            <div className="rounded-lg border p-4 bg-primary/5 border-primary/20">
              <h3 className="text-sm font-semibold text-foreground">Manager Report - Sarah Parker</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Manager submitted monthly performance report. Recommendation: immediate intervention.</p>
            </div>

            <div className="rounded-lg border p-4 bg-primary/5 border-primary/20 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Add HR Feedback Note</h3>
              <Textarea
                placeholder="Write an HR feedback note for an employee..."
                value={feedbackInput}
                onChange={(event) => setFeedbackInput(event.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={handleAddFeedback}>Save Feedback Note</Button>
            </div>

            {feedbackNotes.map((note, index) => (
              <div key={`${note}-${index}`} className="rounded-lg border p-4 bg-primary/5 border-primary/20">
                <h3 className="text-sm font-semibold text-foreground">HR Feedback Note</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceAlerts;
