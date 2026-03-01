import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { employeeReviewData } from "@/data/siteHeadMockData";
import { ArrowLeft, Shield, Clock, CheckCircle, Sparkles, Lock, RotateCcw, UserX, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const EmployeeReview = () => {
  const { employeeId } = useParams();
  const d = employeeReviewData;
  const [justification, setJustification] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleDecision = (decision: string) => {
    console.log("Decision:", { decision, justification, employeeId });
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <Link to="/site-head/pending" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Pending Decisions
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">AJ</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{d.name}</h1>
                <Badge variant="outline" className="text-primary border-primary text-[10px]">{d.empId}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{d.department} | {d.role}</p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground"><Shield className="h-3 w-3" /> {d.status}</span>
                <span className="text-amber-600 flex items-center gap-1"><Clock className="h-3 w-3" /> {d.daysRemaining} days remaining</span>
                <Badge className="bg-green-100 text-green-700 border-0 text-[10px] gap-1"><CheckCircle className="h-3 w-3" /> HR Rec: {d.hrRecommendation}</Badge>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">OVERALL AI SCORE</p>
            <div className="relative h-20 w-20 mx-auto mt-1">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeDasharray={`${d.aiScore * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">{d.aiScore}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Skill Assessment */}
            <Card>
              <CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Skill Assessment</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={Object.entries(d.skills).map(([k, v]) => ({ skill: k.toUpperCase(), score: v }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Trend */}
            <Card>
              <CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Performance Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={d.performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Attendance */}
          <Card>
            <CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Attendance Consistency (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-0.5">
                {Array.from({ length: 30 }, (_, i) => {
                  const r = Math.random();
                  const color = i % 7 >= 5 ? "bg-muted" : r > 0.9 ? "bg-amber-400" : "bg-green-500";
                  return <div key={i} className={`h-8 flex-1 rounded-sm ${color}`} />;
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-green-500" /> Present</span>
                  <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-amber-400" /> Late</span>
                  <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-sm bg-muted" /> Weekend/Off</span>
                </div>
                <span className="text-sm font-medium text-foreground">Consistency: {d.attendanceConsistency}%</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Evaluation */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Evaluation Insights</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">SUGGESTED DECISION</p>
                  <p className="text-lg font-bold text-green-600 flex items-center gap-2 mt-1"><CheckCircle className="h-5 w-5" /> {d.aiDecision}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">REASONING SUMMARY</p>
                  <ul className="mt-2 space-y-2">
                    {d.aiReasons.map((r, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" /> {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decision Panel */}
        <div className="col-span-2 space-y-6">
          <Card className={submitted ? "opacity-60" : ""}>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Final Decision Authority</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button disabled={submitted} onClick={() => handleDecision("confirm")} className="w-full justify-start gap-3 h-12 bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-5 w-5" /> Approve Confirmation</Button>
              <Button disabled={submitted} onClick={() => handleDecision("extend")} className="w-full justify-start gap-3 h-12 bg-primary hover:bg-primary/90"><RotateCcw className="h-5 w-5" /> Extend Probation</Button>
              <Button disabled={submitted} onClick={() => handleDecision("terminate")} className="w-full justify-start gap-3 h-12 bg-destructive hover:bg-destructive/90"><UserX className="h-5 w-5" /> Terminate Contract</Button>
              <Button disabled={submitted} onClick={() => handleDecision("sendback")} variant="outline" className="w-full justify-start gap-3 h-12"><ArrowUpRight className="h-5 w-5" /> Send Back to HR</Button>

              <div className="pt-2">
                <label className="text-sm font-semibold text-foreground">Justification & Final Comments</label>
                <Textarea disabled={submitted} className="mt-2" rows={5} placeholder="Provide executive reasoning for your decision. This will be recorded in the audit log and shared with HR." value={justification} onChange={(e) => setJustification(e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-1 italic">This action is irreversible and will trigger automatic notifications to the employee and relevant department heads.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2"><Lock className="h-3 w-3" /> SECURE SITE-HEAD AUTHORIZATION REQUIRED</div>
              {submitted && <Badge className="bg-green-100 text-green-700 border-0 w-full justify-center py-2">Decision Submitted Successfully</Badge>}
            </CardContent>
          </Card>

          {/* Workflow */}
          <Card>
            <CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Review Workflow</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {d.workflow.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`h-3 w-3 rounded-full mt-1 ${step.completed ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                  <div className="flex-1 border-l-2 border-border pb-4 pl-4 -mt-0.5">
                    <p className={`text-sm font-semibold ${step.completed ? "text-foreground" : "text-primary"}`}>{step.step}</p>
                    <p className="text-xs text-muted-foreground">{step.actor}{step.actor && " • "}{step.status}{step.date && ` • ${step.date}`}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReview;
