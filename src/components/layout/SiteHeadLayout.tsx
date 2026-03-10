import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Shield, LayoutDashboard, ClipboardCheck, Users, BarChart3, History, Lightbulb, FileText, Settings, Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Executive Dashboard", icon: LayoutDashboard, path: "/site-head/dashboard" },
  { label: "Pending Decisions", icon: ClipboardCheck, path: "/site-head/pending" },
  { label: "Employee Reviews", icon: Users, path: "/site-head/pending" },
  { label: "Performance Analytics", icon: BarChart3, path: "/site-head/analytics" },
  { label: "Approval History", icon: History, path: "/site-head/history" },
];

const intelligenceItems = [
  { label: "Site Insights", icon: Lightbulb, path: "/site-head/insights" },
  { label: "Audit Logs", icon: FileText, path: "/site-head/audit" },
];

const SiteHeadLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="flex w-60 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-primary">Regnify</span>
            <p className="text-[10px] text-muted-foreground leading-none">Site Executive</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Main</p>
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <p className="px-3 mt-6 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Intelligence</p>
          {intelligenceItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <div className="mt-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">System</p>
            <Link
              to="/site-head/dashboard"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">SH</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || "A. Henderson"}</p>
              <p className="text-[10px] text-muted-foreground">Site Head, Region 1</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Global search for employees, reports, or decisions..." className="pl-9 bg-muted/50 border-0" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <span className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary">SITE HEAD</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SiteHeadLayout;
