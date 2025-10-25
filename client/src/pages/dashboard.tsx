import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import EnhancedDashboard from "./enhanced-dashboard";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Wait for auth to complete before redirecting
    if (isLoading) return;

    if (!isAuthenticated) {
      console.log('🔒 [DASHBOARD] Not authenticated, redirecting to /auth');
      setLocation("/auth");
      return;
    }

    // Redirect based on user type
    if (user?.userType === 'recruiter') {
      console.log('👔 [DASHBOARD] Recruiter detected, redirecting to recruiter dashboard');
      setLocation("/recruiter-dashboard");
    } else {
      console.log('👤 [DASHBOARD] Job seeker authenticated, showing dashboard');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

  // Show loading state while checking authentication
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show enhanced dashboard for job seekers
  if (user?.userType !== 'recruiter') {
    return <EnhancedDashboard />;
  }
  
  return null;
}