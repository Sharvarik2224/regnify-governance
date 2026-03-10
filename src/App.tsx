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
import HrSettings from "./pages/hr/HrSettings";
import ManagerLayout from "./components/layout/ManagerLayout";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerTeam from "./pages/manager/ManagerTeam";
import ManagerTasks from "./pages/manager/ManagerTasks";
import ManagerTaskNew from "./pages/manager/ManagerTaskNew";
import ManagerEmployeeDetail from "./pages/manager/ManagerEmployeeDetail";
import ManagerApprovals from "./pages/manager/ManagerApprovals";
import ManagerAlerts from "./pages/manager/ManagerAlerts";
import EmployeeLayout from "./components/layout/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyTasks from "./pages/employee/MyTasks";
import TaskDetail from "./pages/employee/TaskDetail";
import Communication from "./pages/employee/Communication";
import HRUpdates from "./pages/employee/HRUpdates";
import PerformanceOverview from "./pages/employee/PerformanceOverview";
import Attendance from "./pages/employee/Attendance";
import Profile from "./pages/employee/Profile";
import SiteHeadLayout from "./components/layout/SiteHeadLayout";
import ExecutiveDashboard from "./pages/sitehead/ExecutiveDashboard";
import PendingDecisions from "./pages/sitehead/PendingDecisions";
import EmployeeReview from "./pages/sitehead/EmployeeReview";
import PerformanceAnalytics from "./pages/sitehead/PerformanceAnalytics";
import ApprovalHistory from "./pages/sitehead/ApprovalHistory";
import SiteInsights from "./pages/sitehead/SiteInsights";
import SiteHeadAuditLogs from "./pages/sitehead/SiteHeadAuditLogs";
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
              <Route path="settings" element={<HrSettings />} />
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

            {/* Employee Routes */}
            <Route path="/employee" element={<ProtectedRoute allowedRole="employee"><EmployeeLayout /></ProtectedRoute>}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="tasks" element={<MyTasks />} />
              <Route path="tasks/:taskId" element={<TaskDetail />} />
              <Route path="communication" element={<Communication />} />
              <Route path="hr-updates" element={<HRUpdates />} />
              <Route path="performance" element={<PerformanceOverview />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Site Head Routes */}
            <Route path="/site-head" element={<ProtectedRoute allowedRole="site-head"><SiteHeadLayout /></ProtectedRoute>}>
              <Route index element={<ExecutiveDashboard />} />
              <Route path="dashboard" element={<ExecutiveDashboard />} />
              <Route path="pending" element={<PendingDecisions />} />
              <Route path="review/:employeeId" element={<EmployeeReview />} />
              <Route path="analytics" element={<PerformanceAnalytics />} />
              <Route path="history" element={<ApprovalHistory />} />
              <Route path="insights" element={<SiteInsights />} />
              <Route path="audit" element={<SiteHeadAuditLogs />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
