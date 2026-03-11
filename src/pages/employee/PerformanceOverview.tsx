import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { AlertCircle, Loader2, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface Metrics {
  completion_ratio: number;
  avg_delay_days: number;
  attendance_percent: number;
  escalation_count: number;
  warning_count: number;
  manager_rating: number;
  performance_trend: number;
  task_consistency: number;
}

interface MLPrediction {
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  top_risk_factors: Record<string, number>;
  explanation_sentences: string[];
}

interface RiskData {
  metrics: Metrics;
  prediction: MLPrediction | null;
  ml_error?: string | null;
}

const RISK_COLORS = {
  LOW: { badge: "bg-green-100 text-green-700 border-green-200", gauge: "#22c55e" },
  MEDIUM: { badge: "bg-amber-100 text-amber-700 border-amber-200", gauge: "#f59e0b" },
  HIGH: { badge: "bg-red-100 text-red-700 border-red-200", gauge: "#ef4444" },
} as const;

type MetricKey = keyof Metrics;

const METRIC_CFG: Record<MetricKey, { label: string; format: (v: number) => string }> = {
  completion_ratio:  { label: "Task Completion",    format: (v) => `${(v * 100).toFixed(0)}%` },
  attendance_percent:{ label: "Attendance",          format: (v) => `${v.toFixed(1)}%` },
  manager_rating:    { label: "Manager Rating",      format: (v) => `${v.toFixed(1)} / 5` },
  task_consistency:  { label: "Task Consistency",    format: (v) => v.toFixed(2) },
  performance_trend: { label: "Performance Trend",   format: (v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) },
  avg_delay_days:    { label: "Avg Delay",           format: (v) => `${v.toFixed(1)} days` },
  escalation_count:  { label: "Escalations",         format: (v) => `${v}` },
  warning_count:     { label: "Warnings",            format: (v) => `${v}` },
};

const FACTOR_LABELS: Record<string, string> = {
  completion_ratio:   "Task Completion",
  avg_delay_days:     "Avg Delay",
  attendance_percent: "Attendance",
  escalation_count:   "Escalations",
  warning_count:      "Warnings",
  manager_rating:     "Manager Rating",
  performance_trend:  "Perf. Trend",
  task_consistency:   "Consistency",
};

const METRIC_ORDER: MetricKey[] = [
  "completion_ratio", "attendance_percent", "manager_rating", "task_consistency",
  "performance_trend", "avg_delay_days", "escalation_count", "warning_count",
];

function RiskGauge({ score, level }: { score: number; level: "LOW" | "MEDIUM" | "HIGH" }) {
  const color = RISK_COLORS[level].gauge;
  const circumference = 2 * Math.PI * 40;
  const strokeDash = (Math.min(score, 100) / 100) * circumference;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] font-semibold uppercase" style={{ color }}>RISK</span>
      </div>
    </div>
  );
}

const PerformanceOverview = () => {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/api/ml/risk-prediction/${encodeURIComponent(user.email)}`)
      .then((r) => {
        if (!r.ok) return r.json().then((e: { error?: string }) => Promise.reject(e?.error ?? `HTTP ${r.status}`));
        return r.json() as Promise<RiskData>;
      })
      .then((d) => { setRiskData(d); setLoading(false); })
      .catch((err: unknown) => { setError(String(err)); setLoading(false); });
  }, [user?.email]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading performance data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!riskData) return null;

  const { metrics, prediction, ml_error } = riskData;
  const level = prediction?.risk_level ?? "LOW";
  const score = prediction ? Math.round(prediction.risk_score) : 0;
  const colors = RISK_COLORS[level];

  const factorChartData = prediction
    ? Object.entries(prediction.top_risk_factors)
        .map(([key, value]) => ({
          name: FACTOR_LABELS[key] ?? key,
          value: parseFloat(Math.abs(value).toFixed(3)),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-powered risk assessment based on your live performance data.
          </p>
          {prediction && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Risk Level:</span>
              <Badge className={`${colors.badge} border font-semibold`}>{level}</Badge>
            </div>
          )}
        </div>
        {prediction && <RiskGauge score={score} level={level} />}
      </div>

      {/* ML offline notice */}
      {ml_error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">ML prediction service is currently offline. Showing live metrics only.</p>
          </CardContent>
        </Card>
      )}

      {/* XAI insight banner */}
      {prediction && prediction.explanation_sentences.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase text-primary mb-2">AI Insights</p>
                <ul className="space-y-1.5">
                  {prediction.explanation_sentences.map((s, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Live metrics grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {METRIC_ORDER.map((key) => {
                const cfg = METRIC_CFG[key];
                const val = metrics[key];
                const isNegative = (key === "avg_delay_days" || key === "escalation_count" || key === "warning_count") && val > 0;
                const isTrend = key === "performance_trend";
                return (
                  <div key={key} className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground mb-1">{cfg.label}</p>
                    <div className="flex items-center gap-1.5">
                      {isTrend && (
                        val >= 0
                          ? <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                          : <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <span
                        className={`text-lg font-bold ${
                          isNegative ? "text-red-600" : isTrend && val < 0 ? "text-red-600" : "text-foreground"
                        }`}
                      >
                        {cfg.format(val)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top risk factors bar chart */}
        {factorChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Risk Factors</CardTitle>
              <p className="text-xs text-muted-foreground">SHAP-based feature importance</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={factorChartData}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => [v.toFixed(3), "Impact"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {factorChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? "#ef4444" : i === 1 ? "#f97316" : i === 2 ? "#f59e0b" : "hsl(var(--primary))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Progress bars */}
        <Card className={factorChartData.length > 0 ? "col-span-2" : "col-span-2"}>
          <CardHeader><CardTitle className="text-base">Key Indicators</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>Task Completion</span>
                <span className="font-semibold text-primary">{(metrics.completion_ratio * 100).toFixed(0)}%</span>
              </div>
              <Progress value={metrics.completion_ratio * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>Attendance</span>
                <span className="font-semibold text-primary">{metrics.attendance_percent.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.attendance_percent} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>Task Consistency</span>
                <span className="font-semibold text-primary">{(metrics.task_consistency * 100).toFixed(0)}%</span>
              </div>
              <Progress value={metrics.task_consistency * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span>Manager Rating</span>
                <span className="font-semibold text-primary">{metrics.manager_rating.toFixed(1)} / 5</span>
              </div>
              <Progress value={(metrics.manager_rating / 5) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceOverview;
