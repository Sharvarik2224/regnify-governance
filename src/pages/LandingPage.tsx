import { Link, useNavigate } from "react-router-dom";
import { Shield, BarChart3, Brain, AlertTriangle, CheckCircle2, FileCheck, Users, Briefcase, User, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const problems = [
  { icon: AlertTriangle, title: "Manual Tracking", desc: "Spreadsheet-based probation tracking leads to missed deadlines and inconsistent evaluation." },
  { icon: Users, title: "Subjective Evaluation", desc: "Lack of standardized criteria results in biased decisions and legal exposure." },
  { icon: FileCheck, title: "No Audit Trace", desc: "Absence of tamper-proof records creates compliance risk during regulatory reviews." },
  { icon: Brain, title: "No Predictive Intelligence", desc: "Reactive management with no early warning system for at-risk employees." },
];

const layers = [
  { icon: Shield, title: "Onboarding Governance Engine", desc: "Standardize legal and policy setup for every new hire automatically." },
  { icon: BarChart3, title: "Continuous Performance Tracking", desc: "Real-time data synchronization with probation-specific KPIs." },
  { icon: Brain, title: "AI Risk Intelligence", desc: "Detect early warning signs and compliance risks using predictive engines." },
  { icon: AlertTriangle, title: "Policy & Conflict Detection", desc: "Identify governance conflicts between AI and manager assessments." },
  { icon: CheckCircle2, title: "Multi-Level Approval Workflow", desc: "Secure, hierarchy-based decision flows with legal verification." },
  { icon: FileCheck, title: "Immutable Audit Layer", desc: "Tamper-proof records for every interaction with hash verification." },
];

const roles = [
  { id: "hr", icon: Briefcase, title: "HR Admin", desc: "Full governance suite access. Manage employees, approvals, and audit logs." },
  { id: "manager", icon: Users, title: "Manager", desc: "Track team probation, submit evaluations, and review AI insights." },
  { id: "employee", icon: User, title: "Employee", desc: "View your probation status, performance metrics, and governance checks." },
  { id: "site-head", icon: Building2, title: "Site Head", desc: "Final approval authority. Enterprise-wide compliance oversight." },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">REGNIFY</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth?mode=login")}>
            Login
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container relative grid gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-5xl">
              Transform Probation into{" "}
              <span className="text-primary">Intelligent Governance</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
              AI-powered risk intelligence, structured approval workflows, and immutable compliance tracking. Built for enterprise-grade oversight.
            </p>
            <div className="mt-8 flex gap-3">
              <Button size="lg" onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })}>
                Get Started <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById("solution")?.scrollIntoView({ behavior: "smooth" })}>
                Learn More
              </Button>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-1 shadow-lg">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <div className="p-8 flex flex-col items-center justify-center min-h-[240px] bg-muted/30 rounded-b-md">
                <BarChart3 className="h-16 w-16 text-primary/30" />
                <p className="mt-4 text-sm text-muted-foreground">Governance Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className="py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-foreground">The Problem with Traditional Probation</h2>
            <p className="mt-3 text-muted-foreground">Most organizations rely on fragmented, manual processes that expose them to compliance risk.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((p) => (
              <div key={p.title} className="rounded-lg border border-border bg-card p-6">
                <p.icon className="h-8 w-8 text-destructive/70 mb-4" />
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="py-20 border-t border-border bg-card">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-foreground">A Structured 6-Layer Architecture</h2>
            <p className="mt-3 text-muted-foreground">Our framework ensures consistency and compliance across the entire probation lifecycle.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {layers.map((l, i) => (
              <div key={l.title} className="rounded-lg border border-border bg-background p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                    <l.icon className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Layer {i + 1}</span>
                </div>
                <h3 className="font-semibold text-foreground">{l.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section id="roles" className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-foreground">Choose Your Role</h2>
            <p className="mt-3 text-muted-foreground">Select your role to access the appropriate governance dashboard.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/auth?role=${r.id}&mode=signup`)}
                className="group rounded-lg border border-border bg-card p-6 text-left hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent group-hover:bg-primary/10 transition-colors">
                  <r.icon className="h-6 w-6 text-accent-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Continue <ChevronRight className="ml-1 h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Regnify v1.0.0</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer">Contact Support</span>
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Regnify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
