import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { siteHeadKPIs, departmentPerformance, riskHeatmap, approvalTrend } from "@/data/siteHeadMockData";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Calendar, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from "recharts";

const ExecutiveDashboard = () => {
  const { user } = useAuth();

  const riskColor = (level: number) => level > 70 ? "bg-destructive" : level > 50 ? "bg-amber-500" : level > 30 ? "bg-primary" : "bg-green-500";
  const riskLabel = (label: string) => label === "Elevated" ? "text-destructive" : label === "Watch" ? "text-amber-600" : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, Site Head</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">Site Performance Index:</span>
            <Badge variant="outline" className="border-primary text-primary font-bold">88/100</Badge>
            <Progress value={88} className="w-24 h-2" />
            <span className="text-sm text-muted-foreground">STATUS:</span>
            <Badge className="bg-green-100 text-green-700 border-0">● STABLE</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Last 30 Days</Button>
          <Button className="gap-2"><Download className="h-4 w-4" /> Export Report</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-3">
        {siteHeadKPIs.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                <span className={`text-xs mb-1 ${kpi.changeType === "positive" ? "text-green-600" : "text-destructive"}`}>{kpi.change}</span>
              </div>
              <Progress value={typeof kpi.value === "number" ? Math.min(kpi.value * 5, 100) : 94} className="h-1 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Department Performance */}
        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Department-wise Performance</CardTitle>
              <p className="text-xs text-muted-foreground">Efficiency scores per organizational unit</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-primary" /> TARGET</span>
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-primary/40" /> ACTUAL</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="target" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Heatmap */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Risk Heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">Concentration by department</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskHeatmap.map((r) => (
              <div key={r.department}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{r.department}</span>
                  <span className={`text-xs font-semibold ${riskLabel(r.label)}`}>{r.label}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full ${riskColor(r.level)}`} style={{ width: `${r.level}%` }} />
                </div>
              </div>
            ))}
            <div className="flex items-start gap-2 mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Immediate Action Required</p>
                <p className="text-xs text-muted-foreground">2 cases in Operations reached Threshold 3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Monthly Approval vs Rejection Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Longitudinal view of executive decision outcomes</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><div className="h-0.5 w-4 bg-primary" /> APPROVALS</span>
            <span className="flex items-center gap-1"><div className="h-0.5 w-4 bg-muted-foreground" /> REJECTIONS</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={approvalTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Area type="monotone" dataKey="approvals" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
              <Area type="monotone" dataKey="rejections" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={1} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveDashboard;
