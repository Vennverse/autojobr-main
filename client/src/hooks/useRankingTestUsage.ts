import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';

interface RankingTestUsage {
  monthlyFreeUsed: number;
  monthlyFreeLimit: number;
  currentMonth: string;
  isPremium: boolean;
  canUseFree: boolean;
  nextResetDate: string;
}

export function useRankingTestUsage() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: usage, isLoading, error, refetch } = useQuery<RankingTestUsage>({
    queryKey: ['/api/ranking-tests/usage', user?.id, user?.planType], // Include planType in query key
    queryFn: async () => {
      const response = await apiRequest('/api/ranking-tests/usage', 'GET');
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Calculate if user can use free test
  const canUseFreeTest = () => {
    if (!usage || !user) return false;
    
    const isPremium = user.planType === 'premium' || user.planType === 'enterprise';
    if (!isPremium) return false;
    
    return usage.monthlyFreeUsed < usage.monthlyFreeLimit;
  };

  // Get remaining free tests
  const getRemainingFreeTests = () => {
    if (!usage || !user) return 0;
    
    const isPremium = user.planType === 'premium' || user.planType === 'enterprise';
    if (!isPremium) return 0;
    
    return Math.max(0, usage.monthlyFreeLimit - usage.monthlyFreeUsed);
  };

  // Get next reset date
  const getNextResetDate = () => {
    if (!usage) return null;
    return new Date(usage.nextResetDate);
  };

  return {
    usage,
    isLoading,
    error,
    refetch,
    canUseFreeTest: canUseFreeTest(),
    remainingFreeTests: getRemainingFreeTests(),
    nextResetDate: getNextResetDate(),
    isPremium: user?.planType === 'premium' || user?.planType === 'enterprise',
  };
}