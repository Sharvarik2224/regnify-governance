import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { siteInsights } from "@/data/siteHeadMockData";
import { Sparkles, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

const severityStyle = {
  positive: { bg: "bg-green-50 border-green-200", icon: TrendingUp, iconColor: "text-green-600" },
  warning: { bg: "bg-amber-50 border-amber-200", icon: AlertTriangle, iconColor: "text-amber-600" },
  critical: { bg: "bg-destructive/5 border-destructive/20", icon: AlertTriangle, iconColor: "text-destructive" },
};

const SiteInsights = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Insights</h1>
        <p className="text-muted-foreground text-sm">AI-generated organizational intelligence and strategic recommendations.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <p className="text-xs uppercase font-semibold opacity-80">Workforce Stability Index</p>
            <p className="text-4xl font-bold mt-2">{siteInsights.stabilityIndex}%</p>
            <Progress value={siteInsights.stabilityIndex} className="h-2 mt-3 bg-primary-foreground/20" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Skill Gap Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {siteInsights.skillGaps.map((skill) => (
                <Badge key={skill} variant="outline" className="mr-2">{skill}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Critical skills needed across departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">High Turnover Departments</CardTitle></CardHeader>
          <CardContent>
            {siteInsights.highTurnover.map((dept) => (
              <div key={dept} className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span className="text-sm text-foreground">{dept}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2">Departments requiring retention strategy</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI-Generated Insights</h2>
        <div className="space-y-4">
          {siteInsights.aiInsights.map((insight, i) => {
            const style = severityStyle[insight.severity];
            return (
              <Card key={i} className={`${style.bg} border`}>
                <CardContent className="flex items-start gap-4 p-5">
                  <style.icon className={`h-6 w-6 ${style.iconColor} shrink-0 mt-0.5`} />
                  <div>
                    <h3 className="font-semibold text-foreground">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SiteInsights;
