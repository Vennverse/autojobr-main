import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import EnhancedDashboard from "./enhanced-dashboard";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Wait for auth to complete before redirecting
    if (isLoading) return;

    // Mark that we've checked auth at least once
    setHasCheckedAuth(true);

    if (!isAuthenticated) {
      console.log('🔒 [DASHBOARD] Not authenticated, redirecting to /auth');
      setLocation("/auth");
      return;
    }

    // Redirect based on user type
    if (user?.userType === 'recruiter' || user?.currentRole === 'recruiter') {
      console.log('👔 [DASHBOARD] Recruiter detected, redirecting to recruiter dashboard');
      setLocation("/recruiter-dashboard");
    } else {
      console.log('👤 [DASHBOARD] Job seeker authenticated, showing dashboard');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

  // Show loading state while checking authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, return null (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Show enhanced dashboard for job seekers
  if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
    return <EnhancedDashboard />;
  }
  
  return null;
}