import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const tabs = ["Overview", "Performance", "AI Evaluation"];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type EmployeeRecord = {
  id: string;
  full_name?: string;
  email?: string;
  department?: string;
  role?: string;
  phone?: string;
  probation_period?: string;
  manager_assigned?: string;
  date_of_joining?: string | null;
};

const EmployeeDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) {
        setError("Employee id is missing");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/employees/${id}`);
        if (!response.ok) {
          const responseBody = await response.json().catch(() => null);
          throw new Error(responseBody?.error || `Unable to load employee. Status ${response.status}`);
        }

        const data = await response.json();
        setEmployee(data?.employee ?? null);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch employee");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading employee profile...</p>;
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <Link to="/hr/employees" className="inline-flex items-center text-xs font-semibold text-primary uppercase tracking-wider hover:underline">
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to Employee Directory
        </Link>
        <p className="text-sm text-destructive">{error || "Employee not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/hr/employees" className="inline-flex items-center text-xs font-semibold text-primary uppercase tracking-wider hover:underline">
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to Employee Directory
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Employee Governance Detail: {employee.full_name || "Unnamed Employee"}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {employee.role || "Role not set"} - {employee.department || "Department not set"} - Employee ID: #{employee.id}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 text-xs font-semibold text-destructive inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> High Risk Profile
            </span>
            <span className="rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-xs font-semibold text-success">Verified Compliance</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export Report</Button>
        </div>
      </div>

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

      {activeTab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Employee Information</h3>
            {[
              ["Full Name", employee.full_name || "-"],
              ["Email", employee.email || "-"],
              ["Department", employee.department || "-"],
              ["Role", employee.role || "-"],
              ["Manager", employee.manager_assigned || "-"],
              ["Phone", employee.phone || "-"],
              ["Date Of Joining", employee.date_of_joining || "-"],
              ["Probation Period", employee.probation_period || "-"],
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
              <span className="text-4xl font-bold text-foreground">76%</span>
              <span className="text-sm text-muted-foreground mb-1">completed</span>
            </div>
            <Progress value={76} className="h-2" />
            <p className="text-sm text-muted-foreground">18 days remaining</p>
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
          ].map((metric) => (
            <div key={metric.label} className="rounded-lg border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
              <Progress value={metric.pct} className="h-1.5 mt-3" />
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
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--warning))" strokeWidth="8" strokeDasharray="226 314" strokeLinecap="round" transform="rotate(-90 60 60)" />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold text-foreground">72</span>
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
          </div>

          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="rounded-lg bg-info/5 border border-info/20 p-4">
              <p className="font-semibold text-info text-sm flex items-center gap-2"><Shield className="h-4 w-4" />AI Governance Recommendation</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Increased oversight required; review task cadence and align with manager feedback.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;
