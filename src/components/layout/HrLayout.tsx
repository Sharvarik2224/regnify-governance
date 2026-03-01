import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Shield, LayoutDashboard, Users, CheckSquare, AlertTriangle, FileText, Settings, Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/hr/dashboard" },
  { label: "Employees", icon: Users, path: "/hr/employees" },
  { label: "Approvals", icon: CheckSquare, path: "/hr/approvals" },
  { label: "Governance Alerts", icon: AlertTriangle, path: "/hr/governance-alerts" },
  { label: "Audit Logs", icon: FileText, path: "/hr/audit-logs" },
];

const HrLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const settingsActive = location.pathname === "/hr/settings";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">Regnify HR</span>
            <p className="text-[10px] text-muted-foreground leading-none">Enterprise Suite</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                  active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Settings</p>
            <Link
              to="/hr/settings"
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                settingsActive ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              Configurations
            </Link>
          </div>
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employees or logs..." className="pl-9 bg-muted/50 border-0" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Global Corp</span>
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <span className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary">HR ADMIN</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning text-primary-foreground text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HrLayout;
