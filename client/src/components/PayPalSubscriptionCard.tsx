import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// PayPal TypeScript declarations
declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: {
          shape?: string;
          color?: string;
          layout?: string;
          label?: string;
        };
        createSubscription?: (data: any, actions: any) => Promise<string>;
        onApprove?: (data: any, actions: any) => void;
        onError?: (err: any) => void;
      }) => {
        render: (selector: string) => void;
      };
    };
  }
}

export default function PayPalSubscriptionCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadPayPalScript = () => {
      // Check if PayPal script is already loaded
      if (window.paypal) {
        if (isMounted) {
          setTimeout(() => initializePayPalButton(), 200);
        }
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript) {
        // Wait for existing script to load
        existingScript.addEventListener('load', () => {
          if (isMounted) {
            setTimeout(() => initializePayPalButton(), 200);
          }
        });
        return;
      }

      // Load PayPal script
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AUzUXMfJm1WWbSHiAKfylwAd4AOYkMQV_tE_Pzg2g9zxmGyPC1bt82hlQ_vQycZSrM-ke8gICEeh8kTf&vault=true&intent=subscription';
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.async = true;
      
      script.onload = () => {
        if (isMounted) {
          setTimeout(() => initializePayPalButton(), 200);
        }
      };
      
      script.onerror = () => {
        if (isMounted) {
          setError('Failed to load PayPal SDK');
          setIsLoading(false);
        }
      };
      
      document.head.appendChild(script);
    };

    const initializePayPalButton = () => {
      const containerId = 'paypal-button-container-sidebar';
      const container = document.getElementById(containerId);
      
      if (!container) {
        // Container not ready yet, try again
        setTimeout(() => initializePayPalButton(), 100);
        return;
      }

      if (window.paypal) {
        // Clear any existing content
        container.innerHTML = '';
        
        try {
          window.paypal.Buttons({
            style: {
              shape: 'rect',
              color: 'gold',
              layout: 'vertical',
              label: 'subscribe'
            },
            createSubscription: function(data: any, actions: any) {
              return actions.subscription.create({
                plan_id: 'P-9SC66893530757807NCRWYCI'
              });
            },
            onApprove: function(data: any, actions: any) {
              alert(data.subscriptionID);
              // Refresh subscription data
              queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
              queryClient.invalidateQueries({ queryKey: ['/api/user'] });
              queryClient.invalidateQueries({ queryKey: ['/api/usage/report'] });
              toast({
                title: "Subscription Activated!",
                description: "Your premium features are now active.",
              });
            },
            onError: function(err: any) {
              console.error('PayPal subscription error:', err);
              toast({
                title: "Payment Error",
                description: "Failed to process subscription. Please try again.",
                variant: "destructive",
              });
            }
          }).render(`#${containerId}`);
          
          if (isMounted) {
            setIsLoading(false);
            setError(null);
          }
        } catch (error) {
          console.error('Error rendering PayPal button:', error);
          if (isMounted) {
            setError('Error rendering PayPal button');
            setIsLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setError('PayPal SDK not available');
          setIsLoading(false);
        }
      }
    };

    // Start loading process
    loadPayPalScript();

    // Cleanup function
    return () => {
      isMounted = false;
      const container = document.getElementById('paypal-button-container-sidebar');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [queryClient, toast]);

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <CreditCard className="h-5 w-5" />
          Premium Subscription
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Subscribe with PayPal for instant access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-blue-700">Loading PayPal...</span>
          </div>
        )}
        
        {error && (
          <div className="p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-sm text-blue-600 underline"
            >
              Retry
            </button>
          </div>
        )}
        
        <div 
          id="paypal-button-container-sidebar" 
          className={isLoading || error ? 'hidden' : ''}
        ></div>
      </CardContent>
    </Card>
  );
}