import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  firstName?: string;
  lastName?: string;
  onboardingCompleted?: boolean;
  planType?: string;
  subscriptionStatus?: string;
  freeRankingTestsRemaining?: number;
  userType?: string;
  currentRole?: string;
  availableRoles?: string;
  emailVerified?: boolean;
}

export function useAuth() {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0, // Always fetch fresh for security
    refetchOnWindowFocus: true, // Revalidate on focus
    refetchOnMount: true, // Always revalidate on mount
    retry: 1, // Retry once on failure
  });

  // CRITICAL: Validate session integrity
  const isAuthenticated = !!user;
  
  if (isAuthenticated && user) {
    const storedUserId = sessionStorage.getItem('current_user_id');
    
    // Session mismatch detection
    if (storedUserId && storedUserId !== user.id) {
      console.error('🚨 [AUTH] Session ID mismatch - potential security issue');
      sessionStorage.clear();
      window.location.href = '/auth?reason=session_invalid';
    }
  }

  // Handle authentication errors
  if (error) {
    console.error('🚨 [AUTH] Authentication error:', error);
    // Don't redirect on network errors, only on auth failures
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      sessionStorage.clear();
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth?reason=session_expired';
      }
    }
  }

  return {
    user: user ?? null,
    isLoading,
    error,
    isAuthenticated,
  };
}