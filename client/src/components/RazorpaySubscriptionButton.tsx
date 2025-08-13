import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, IndianRupee } from "lucide-react";

interface RazorpaySubscriptionButtonProps {
  tierId: string;
  tierName: string;
  price: number;
  userEmail: string;
  disabled?: boolean;
  className?: string;
}

// Declare Razorpay global
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpaySubscriptionButton({
  tierId,
  tierName,
  price,
  userEmail,
  disabled = false,
  className = ""
}: RazorpaySubscriptionButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createRazorpaySubscription = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/razorpay/create', {
        tierId,
        userEmail
      });
      return response;
    },
    onSuccess: async (data) => {
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        toast({
          title: "Payment Error",
          description: "Failed to load Razorpay. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your Razorpay key
        subscription_id: data.subscriptionId,
        name: 'AutoJobr',
        description: `${tierName} Subscription`,
        image: '/logo.png', // Your logo
        handler: function (response: any) {
          toast({
            title: "Payment Successful!",
            description: `Your ${tierName} subscription is now active.`,
          });
          
          // Invalidate and refetch subscription data
          queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
          queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You can try again anytime.",
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    },
    onError: (error: any) => {
      console.error('Razorpay subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handleSubscribe = () => {
    setIsProcessing(true);
    createRazorpaySubscription.mutate();
  };

  // Calculate INR amount (approximate)
  const inrAmount = Math.round(price * 83); // 83 is approximate USD to INR rate

  return (
    <Button
      onClick={handleSubscribe}
      disabled={disabled || isProcessing || createRazorpaySubscription.isPending}
      className={`w-full bg-blue-600 hover:bg-blue-700 text-white ${className}`}
    >
      <div className="flex items-center justify-center gap-2">
        <IndianRupee className="w-4 h-4" />
        <CreditCard className="w-4 h-4" />
        <span>
          {isProcessing || createRazorpaySubscription.isPending 
            ? "Processing..." 
            : `Pay ₹${inrAmount.toLocaleString('en-IN')} with Razorpay`
          }
        </span>
      </div>
    </Button>
  );
}