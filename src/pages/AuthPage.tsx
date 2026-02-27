import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const roleTitles: Record<string, string> = {
  hr: "HR Admin",
  manager: "Manager",
  employee: "Employee",
  "site-head": "Site Head",
};

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") || "hr") as UserRole;
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      login(form.email, form.password, role);
    } else {
      signup(form.name, form.email, form.password, role);
    }
    const dashboardMap: Record<string, string> = {
      hr: "/hr/dashboard",
      manager: "/manager/dashboard",
      employee: "/employee/dashboard",
      "site-head": "/site-head/dashboard",
    };
    navigate(dashboardMap[role] || "/hr/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-3">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Regnify</h1>
            <p className="mt-1 text-sm font-medium text-foreground">
              {mode === "login" ? "Login to your governance dashboard" : "Create your account"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "login" ? "Enter your credentials to access your account" : "Fill in your details to get started"}
            </p>
            <span className="mt-2 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              {roleTitles[role] || "HR Admin"}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg border border-border bg-muted p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" />
              </div>
            )}
            <div>
              <Label htmlFor="email">Enterprise Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                )}
              </div>
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {mode === "signup" && (
              <div>
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required className="mt-1.5" />
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">
              {mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "New to Regnify? " : "Already have an account? "}
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary hover:underline font-medium">
                {mode === "login" ? "Contact your administrator" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">© 2026 REGNIFY. COMPLIANCE SECURED.</p>
    </div>
  );
};

export default AuthPage;
