import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";
import { useEffect } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  firstName?: string;
  lastName?: string;
  onboardingCompleted?: boolean;
  planType?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false, // Don't retry on auth failure
    staleTime: 0, // Always check for fresh auth state
  });

  // SECURITY: Detect logout and immediately clear all state
  useEffect(() => {
    if (error && error.message.includes('401')) {
      console.log('🚨 [AUTH] Unauthorized detected - clearing all state');
      queryClient.clear();
      sessionStorage.clear();
      const theme = localStorage.getItem('theme');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
    }
  }, [error, queryClient]);

  return {
    user: user ?? null,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
