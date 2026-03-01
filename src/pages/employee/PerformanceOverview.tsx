import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { performanceData } from "@/data/employeeMockData";
import { Sparkles, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const PerformanceOverview = () => {
  const d = performanceData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
          <p className="text-muted-foreground text-sm">Hello Alex, you've reached {d.overallScore}% of your quarterly targets. Keep up the momentum!</p>
        </div>
        <div className="relative h-24 w-24">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${d.overallScore * 2.51} 251`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-primary">{d.overallScore}</span>
            <span className="text-[10px] text-primary">SCORE</span>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-3 p-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase text-primary">AI INSIGHT</p>
            <p className="text-sm text-foreground">Your performance improved <strong className="text-primary">10%</strong> {d.aiInsight.split("10%")[1]}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Monthly Performance Trend</CardTitle>
            <Badge className="bg-green-100 text-green-700 border-0 text-xs">+12% vs LY</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card>
          <CardHeader><CardTitle className="text-base">Task Completion Rate</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {d.taskCompletion.map((tc) => (
              <div key={tc.category}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-foreground">{tc.category}</span>
                  <span className="font-semibold text-primary">{tc.rate}%</span>
                </div>
                <Progress value={tc.rate} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skill Radar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Skill Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={d.skillRadar}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Manager Feedback */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">ST</div>
              <div>
                <p className="text-sm font-semibold text-foreground">{d.managerFeedback.manager}</p>
                <p className="text-xs text-muted-foreground uppercase">{d.managerFeedback.role}</p>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Manager Feedback Summary</h3>
              <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3">"{d.managerFeedback.summary}"</blockquote>
            </div>
            <div className="flex flex-wrap gap-2">
              {d.managerFeedback.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card className="border-t-2 border-t-primary">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold text-foreground">Ready for your next milestone?</h3>
            <p className="text-sm text-muted-foreground">Complete your next 'Architecture Design' task to hit 95% score.</p>
          </div>
          <Button>View Active Tasks</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOverview;
