import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Shield, LayoutDashboard, ClipboardList, MessageSquare, Bell, User, BarChart3, CalendarCheck, Settings, Search, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/employee/dashboard" },
  { label: "HR Updates", icon: Bell, path: "/employee/hr-updates" },
  { label: "My Tasks", icon: ClipboardList, path: "/employee/tasks" },
  { label: "Communication", icon: MessageSquare, path: "/employee/communication" },
  { label: "Performance", icon: BarChart3, path: "/employee/performance" },
  { label: "Attendance", icon: CalendarCheck, path: "/employee/attendance" },
  { label: "Profile", icon: User, path: "/employee/profile" },
];

const EmployeeLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="flex w-60 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">Employee Portal</span>
            <p className="text-[10px] text-muted-foreground leading-none">Regnify Inc. Global</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          {menuItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">System</p>
            <Link
              to="/employee/dashboard"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "E"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || "Employee"}</p>
              <p className="text-[10px] text-muted-foreground">Employee</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks, updates..." className="pl-9 bg-muted/50 border-0" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.name || "Alex Rivera"}</p>
                <p className="text-[10px] text-muted-foreground">Product Designer</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
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

export default EmployeeLayout;
