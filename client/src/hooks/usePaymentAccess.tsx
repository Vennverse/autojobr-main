import { useQuery } from '@tanstack/react-query';

interface PaymentAccessResponse {
  hasAccess: boolean;
  serviceType: string;
  userId: string;
}

export function usePaymentAccess(serviceType: string, withinMinutes: number = 30) {
  return useQuery<PaymentAccessResponse>({
    queryKey: ['payment-access', serviceType, withinMinutes],
    queryFn: async () => {
      const response = await fetch(`/api/payments/check-access/${serviceType}?withinMinutes=${withinMinutes}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to check payment access');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Don't auto-refetch
    retry: 2
  });
}

export function usePaymentHistory(serviceType?: string) {
  return useQuery({
    queryKey: ['payment-history', serviceType],
    queryFn: async () => {
      const params = serviceType ? `?serviceType=${serviceType}` : '';
      const response = await fetch(`/api/payments/history${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}