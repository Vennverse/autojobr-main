import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface PayPalSubscriptionButtonProps {
  tierId: string;
  amount: string;
  currency: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  planName?: string;
  userType?: 'jobseeker' | 'recruiter';
  className?: string;
}

export default function PayPalSubscriptionButton({
  tierId,
  amount,
  currency,
  onSuccess,
  onError,
  planName = "Premium Subscription",
  userType = "jobseeker",
  className = ""
}: PayPalSubscriptionButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentialsChecked, setCredentialsChecked] = useState(false);

  useEffect(() => {
    const initializePayPal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if PayPal credentials are available
        const credentialsResponse = await fetch('/api/payment/paypal/check-credentials');
        const credentialsData = await credentialsResponse.json();
        
        if (!credentialsData.available) {
          setError('PayPal payment is currently unavailable. Please contact support.');
          setIsLoading(false);
          return;
        }

        setCredentialsChecked(true);

        // Load PayPal SDK if not already loaded
        if (!(window as any).paypal) {
          const script = document.createElement('script');
          // Use subscription intent and vault for recurring payments
          script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.VITE_PAYPAL_CLIENT_ID || 'test'}&currency=${currency}&intent=subscription&vault=true&components=buttons`;
          script.async = true;
          
          script.onload = () => {
            renderPayPalButton();
          };
          
          script.onerror = () => {
            setError('Failed to load PayPal SDK');
            setIsLoading(false);
          };
          
          document.body.appendChild(script);
        } else {
          renderPayPalButton();
        }
      } catch (err) {
        console.error('PayPal initialization error:', err);
        setError('Failed to initialize PayPal');
        setIsLoading(false);
      }
    };

    const renderPayPalButton = () => {
      if (!paypalRef.current || !(window as any).paypal) {
        return;
      }

      // Clear any existing buttons
      paypalRef.current.innerHTML = '';

      (window as any).paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'subscribe'
        },
        
        createSubscription: async () => {
          try {
            // Use existing subscription API that integrates with PayPalSubscriptionService
            const response = await fetch('/api/subscription/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tierId: tierId,
                paymentMethod: 'paypal',
                userType: userType
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to create PayPal subscription');
            }

            const subscriptionData = await response.json();
            return subscriptionData.paypalSubscriptionId;
          } catch (err) {
            console.error('Error creating PayPal subscription:', err);
            setError('Failed to create subscription');
            throw err;
          }
        },

        onApprove: async (data: any) => {
          try {
            // Handle subscription approval - the existing webhook will handle activation
            console.log('PayPal subscription approved:', data);
            onSuccess?.(data);
          } catch (err) {
            console.error('Error handling PayPal subscription approval:', err);
            onError?.(err);
          }
        },

        onError: (err: any) => {
          console.error('PayPal error:', err);
          setError('Payment failed. Please try again.');
          onError?.(err);
        },

        onCancel: (data: any) => {
          console.log('PayPal payment cancelled:', data);
          setError('Payment was cancelled');
        }
      }).render(paypalRef.current).then(() => {
        setIsLoading(false);
      }).catch((err: any) => {
        console.error('Error rendering PayPal button:', err);
        setError('Failed to load PayPal button');
        setIsLoading(false);
      });
    };

    initializePayPal();
  }, [amount, currency]);

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`paypal-subscription-button ${className}`}>
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="font-semibold">{planName}</h4>
          <p className="text-lg font-bold">{currency} {amount}/month</p>
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading PayPal...</span>
          </div>
        )}
        
        <div ref={paypalRef} className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'}></div>
      </div>
    </div>
  );
}