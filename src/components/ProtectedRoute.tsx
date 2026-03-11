import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRole: string;
}

const ProtectedRoute = ({ children, allowedRole }: Props) => {
  try {
    const authContext = useAuth();
    const { user, isAuthenticated, isLoading } = authContext;

    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    // Not authenticated, redirect to home
    if (!isAuthenticated || !user) {
      return <Navigate to="/" replace />;
    }

    // Check role match
    if (user.role !== allowedRole) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // If context error, redirect to home
    console.warn("ProtectedRoute auth context error:", error);
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;