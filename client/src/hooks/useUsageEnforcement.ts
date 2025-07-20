import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UsageEnforcementResult {
  allowed: boolean;
  upgradeRequired: boolean;
  message: string;
}

export function useUsageEnforcement() {
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lastFeature, setLastFeature] = useState<string>();

  const enforceUsageMutation = useMutation({
    mutationFn: async (feature: string) => {
      return await apiRequest('/api/usage/enforce', {
        method: 'POST',
        body: JSON.stringify({ feature }),
      });
    },
    onSuccess: (data: UsageEnforcementResult, feature) => {
      if (!data.allowed && data.upgradeRequired) {
        setLastFeature(feature);
        setShowUpgradeModal(true);
        toast({
          title: "Usage limit reached",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check usage limits",
        variant: "destructive",
      });
    },
  });

  const checkUsage = async (feature: string): Promise<boolean> => {
    try {
      const result = await enforceUsageMutation.mutateAsync(feature);
      return result.allowed;
    } catch (error) {
      console.error('Usage enforcement error:', error);
      return false;
    }
  };

  return {
    checkUsage,
    showUpgradeModal,
    setShowUpgradeModal,
    lastFeature,
    isChecking: enforceUsageMutation.isPending,
  };
}