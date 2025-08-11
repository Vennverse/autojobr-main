// Optimized React Query hook with smart caching
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey'> {
  queryKey: string[];
  priority?: 'high' | 'normal' | 'low';
  smartStaleTime?: boolean;
}

export function useOptimizedQuery<T>({
  queryKey,
  priority = 'normal',
  smartStaleTime = true,
  ...options
}: OptimizedQueryOptions<T>) {
  const lastFetchTime = useRef<number>(0);
  const successCount = useRef<number>(0);

  // Calculate dynamic stale time based on data stability
  const calculateStaleTime = () => {
    if (!smartStaleTime) return options.staleTime || 0;
    
    const baseStaleTime = {
      high: 30 * 1000,      // 30 seconds for high priority
      normal: 5 * 60 * 1000, // 5 minutes for normal
      low: 15 * 60 * 1000    // 15 minutes for low priority
    };

    // Increase stale time for stable data
    const stabilityMultiplier = Math.min(successCount.current / 10, 3);
    return baseStaleTime[priority] * (1 + stabilityMultiplier);
  };

  // Optimize refetch behavior
  const shouldRefetch = () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    // Prevent too frequent refetches
    if (timeSinceLastFetch < 1000) return false;
    
    // Reduce refetch frequency for background tabs
    if (document.hidden && priority === 'low') return false;
    
    return true;
  };

  const result = useQuery({
    queryKey,
    staleTime: calculateStaleTime(),
    refetchOnWindowFocus: priority === 'high' && shouldRefetch(),
    refetchOnMount: shouldRefetch(),
    refetchOnReconnect: true,
    ...options,
  });

  // Track fetch metrics
  useEffect(() => {
    if (result.isFetching) {
      lastFetchTime.current = Date.now();
    }
    if (result.isSuccess) {
      successCount.current++;
    }
  }, [result.isFetching, result.isSuccess]);

  return result;
}

// Batched query invalidation
export function useBatchedInvalidation() {
  const invalidationQueue = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchInvalidate = (queryKey: string) => {
    invalidationQueue.current.add(queryKey);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Batch invalidations over 100ms
    timeoutRef.current = setTimeout(() => {
      const keys = Array.from(invalidationQueue.current);
      invalidationQueue.current.clear();
      
      // Process batched invalidations
      keys.forEach(key => {
        // Implement actual invalidation logic here
        console.log('Invalidating:', key);
      });
    }, 100);
  };

  return { batchInvalidate };
}