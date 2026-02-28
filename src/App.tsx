import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import HrLayout from "./components/layout/HrLayout";
import HrDashboard from "./pages/hr/HrDashboard";
import HrEmployees from "./pages/hr/HrEmployees";
import EmployeeDetail from "./pages/hr/EmployeeDetail";
import HrApprovals from "./pages/hr/HrApprovals";
import GovernanceAlerts from "./pages/hr/GovernanceAlerts";
import AuditLogs from "./pages/hr/AuditLogs";
import ManagerLayout from "./components/layout/ManagerLayout";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerTeam from "./pages/manager/ManagerTeam";
import ManagerTasks from "./pages/manager/ManagerTasks";
import ManagerTaskNew from "./pages/manager/ManagerTaskNew";
import ManagerEmployeeDetail from "./pages/manager/ManagerEmployeeDetail";
import ManagerApprovals from "./pages/manager/ManagerApprovals";
import ManagerAlerts from "./pages/manager/ManagerAlerts";
import PlaceholderDashboard from "./pages/PlaceholderDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* HR Routes */}
            <Route path="/hr" element={<ProtectedRoute allowedRole="hr"><HrLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<HrDashboard />} />
              <Route path="employees" element={<HrEmployees />} />
              <Route path="employees/:id" element={<EmployeeDetail />} />
              <Route path="approvals" element={<HrApprovals />} />
              <Route path="governance-alerts" element={<GovernanceAlerts />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>

            {/* Manager Routes */}
            <Route path="/manager" element={<ProtectedRoute allowedRole="manager"><ManagerLayout /></ProtectedRoute>}>
              <Route index element={<ManagerDashboard />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="team" element={<ManagerTeam />} />
              <Route path="tasks" element={<ManagerTasks />} />
              <Route path="tasks/new" element={<ManagerTaskNew />} />
              <Route path="employees/:id" element={<ManagerEmployeeDetail />} />
              <Route path="approvals" element={<ManagerApprovals />} />
              <Route path="alerts" element={<ManagerAlerts />} />
            </Route>

            {/* Other role placeholders */}
            <Route path="/employee/dashboard" element={<ProtectedRoute allowedRole="employee"><PlaceholderDashboard role="Employee" /></ProtectedRoute>} />
            <Route path="/site-head/dashboard" element={<ProtectedRoute allowedRole="site-head"><PlaceholderDashboard role="Site Head" /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
