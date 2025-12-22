import React, { useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayPalSubscription = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if PayPal credentials are available
      const credentialsResponse = await fetch('/api/payment/paypal/check-credentials');
      const credentialsData = await credentialsResponse.json();
      
      if (!credentialsData.available) {
        setError('PayPal payment is currently unavailable. Please contact support.');
        return;
      }

      // Create PayPal subscription using existing service
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId: tierId,
          amount: amount,
          paymentMethod: 'paypal',
          userType: userType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PayPal subscription');
      }

      const subscriptionData = await response.json();
      
      // Redirect to PayPal approval URL
      if (subscriptionData.approvalUrl) {
        window.location.href = subscriptionData.approvalUrl;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (err: any) {
      console.error('Error creating PayPal subscription:', err);
      setError(err.message || 'Failed to create subscription. Please try again.');
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

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
        
        <Button
          onClick={handlePayPalSubscription}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              Subscribe with PayPal
            </>
          )}
        </Button>
      </div>
    </div>
  );
}