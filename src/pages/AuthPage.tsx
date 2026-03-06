import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const modeParam = String(searchParams.get("mode") || "").toLowerCase();
  const initialMode: "login" | "signup" = modeParam === "signup" ? "signup" : "login";

  const roleParam = String(searchParams.get("role") || "").toLowerCase();
  const selectedRole: UserRole | undefined =
    roleParam === "hr" ||
    roleParam === "manager" ||
    roleParam === "employee" ||
    roleParam === "site-head"
      ? roleParam
      : undefined;

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      let role: "hr" | "manager" | "employee" | "site-head";

      if (mode === "login") {
        role = await login(form.email, form.password, selectedRole);
      } else {
        if (!selectedRole) {
          toast({
            title: "Select role first",
            description: "Please choose your role from the landing page before signing up.",
            variant: "destructive",
          });
          return;
        }

        if (form.password !== form.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          return;
        }
        await signup(form.name, form.email, form.password, selectedRole);
        toast({
          title: "Verify your email",
          description: "Verification email sent. Please verify your email before logging in.",
        });
        setMode("login");
        return;
      }

      const dashboardMap: Record<string, string> = {
        hr: "/hr/dashboard",
        manager: "/manager/dashboard",
        employee: "/employee/dashboard",
        "site-head": "/site-head/dashboard",
      };

      toast({
        title: "Login Successful",
        description: `Logged in as ${role.toUpperCase()}`,
      });

      navigate(dashboardMap[role], { replace: true });

    } catch (error: any) {
      console.error(error);
      const message = error?.message || "Something went wrong";
      const isVerificationInfo = message.includes("Verification email sent");
      toast({
        title: isVerificationInfo ? "Verify your email" : "Authentication Failed",
        description: message,
        variant: isVerificationInfo ? "default" : "destructive",
      });
    } finally {
      setLoading(false);
    }
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
              {mode === "login"
                ? "Login to your governance dashboard"
                : "Create your account"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg border border-border bg-muted p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                mode === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                mode === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label>Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Processing..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default AuthPage;