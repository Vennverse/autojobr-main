import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle } from "lucide-react";

interface PayPalHostedButtonProps {
  purpose: 'mock_interview' | 'virtual_interview' | 'ranking_test' | 'test_retake';
  amount: number;
  itemName: string;
  serviceId?: string; // CRITICAL: For test_retake, this is the assignment ID
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export default function PayPalHostedButton({
  purpose,
  amount,
  itemName,
  serviceId,
  onPaymentSuccess,
  onPaymentError,
  description,
  className,
  disabled = false
}: PayPalHostedButtonProps) {
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'test_retake': return 'Test Retake';
      case 'mock_interview': return 'Mock Interview Session';
      case 'virtual_interview': return 'Virtual Interview Access';
      case 'ranking_test': return 'Ranking Test';
      default: return 'Payment';
    }
  };

  useEffect(() => {
    // Load PayPal SDK script only once
    if (!scriptLoadedRef.current && !document.querySelector('[src*="paypal.com/sdk/js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=BAAldFszNqKJIYtyrttw8tRB6ENYS9eXMuKDv8gGYtC7O_mMKygc6zxU3nzErJA4P1eeeUZoFS_RXyyhx0&components=hosted-buttons&disable-funding=venmo&currency=USD';
      script.crossOrigin = 'anonymous';
      script.async = true;
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        renderHostedButton();
      };
      
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        onPaymentError?.({ message: 'Failed to load PayPal payment system' });
      };
      
      document.head.appendChild(script);
    } else if (scriptLoadedRef.current || (window as any).paypal) {
      renderHostedButton();
    }
  }, []);

  const renderHostedButton = () => {
    if (!(window as any).paypal?.HostedButtons || !paypalContainerRef.current || disabled) {
      return;
    }

    // Clear any existing button content
    paypalContainerRef.current.innerHTML = '';
    
    try {
      (window as any).paypal.HostedButtons({
        hostedButtonId: "XRDMZMHE93YDS"
      }).render(paypalContainerRef.current).then(() => {
        console.log('PayPal hosted button rendered successfully');
        
        // Listen for payment completion events
        // Note: PayPal hosted buttons use postMessage for communication
        window.addEventListener('message', handlePayPalMessage);
      }).catch((error: any) => {
        console.error('Failed to render PayPal hosted button:', error);
        onPaymentError?.({ message: 'Failed to load payment button' });
      });
    } catch (error) {
      console.error('PayPal hosted button error:', error);
      onPaymentError?.({ message: 'Payment system error' });
    }
  };

  const handlePayPalMessage = (event: MessageEvent) => {
    // PayPal hosted buttons communicate via postMessage
    if (event.origin !== 'https://www.paypal.com' && event.origin !== 'https://www.sandbox.paypal.com') {
      return;
    }

    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      if (data.type === 'payment_success' || data.event === 'payment_success') {
        console.log('✅ PayPal payment success received:', data);
        
        // Record payment on server and grant access
        recordPaymentAndGrantAccess(data);
      } else if (data.type === 'payment_error' || data.event === 'payment_error') {
        console.log('❌ PayPal payment error received:', data);
        onPaymentError?.({ 
          message: data.message || 'Payment was not completed successfully' 
        });
      }
    } catch (error) {
      console.log('Non-JSON PayPal message received:', event.data);
    }
  };

  const recordPaymentAndGrantAccess = async (paymentData: any) => {
    try {
      // Call our server to record the payment and verify access
      const response = await fetch('/api/payments/verify-paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceType: purpose,
          serviceId: serviceId, // CRITICAL: Pass assignment ID for test retakes
          amount: amount,
          paymentData: paymentData,
          itemName: itemName
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Payment verified and recorded:', result);
        
        onPaymentSuccess?.({
          ...paymentData,
          verified: true,
          serviceType: purpose,
          amount: amount
        });
      } else {
        const error = await response.json();
        console.error('❌ Payment verification failed:', error);
        onPaymentError?.({ 
          message: error.message || 'Payment verification failed' 
        });
      }
    } catch (error) {
      console.error('❌ Error recording payment:', error);
      onPaymentError?.({ 
        message: 'Failed to verify payment. Please contact support.' 
      });
    }
  };

  // Clean up event listeners
  const cleanup = () => {
    window.removeEventListener('message', handlePayPalMessage);
  };

  // Effect cleanup
  useEffect(() => {
    return cleanup;
  }, []);

  const continueRenderHostedButton = () => {
    try {
      (window as any).paypal.HostedButtons({
        hostedButtonId: "XRDMZMHE93YDS"
      }).render(paypalContainerRef.current).then(() => {
        // Payment success handling
        // Note: PayPal hosted buttons handle success/error via webhook or return URL
        // For client-side handling, we'd need to implement a polling mechanism
        // or use server-side webhooks to update payment status
        
        // Optional: Set up polling to check payment status
        if (onPaymentSuccess) {
          // This is a placeholder - in a real implementation, you'd poll your server
          // to check if the payment was completed
          console.log('PayPal hosted button rendered successfully');
        }
      }).catch((error: any) => {
        console.error('Error rendering PayPal hosted button:', error);
        onPaymentError?.(error);
      });
    } catch (error) {
      console.error('Error initializing PayPal hosted button:', error);
      onPaymentError?.(error as any);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment with PayPal
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service:</span>
                <span className="font-medium">{getPurposeLabel(purpose)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Item:</span>
                <span className="font-medium">{itemName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Amount:</span>
                <span className="text-lg font-bold">USD ${amount}</span>
              </div>
            </div>
          </div>

          {/* PayPal Badge */}
          <div className="flex items-center justify-center gap-2 p-2 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200">
            <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">P</div>
            <Badge className="bg-blue-100 text-blue-800">PayPal Secure Payment</Badge>
          </div>
          
          {/* PayPal Hosted Button Container */}
          <div className="flex justify-center py-4">
            <div 
              ref={paypalContainerRef}
              className={disabled ? 'opacity-50 pointer-events-none' : ''}
            />
          </div>
          
          {disabled && (
            <p className="text-center text-sm text-muted-foreground">
              Payment unavailable
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Security Info */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-green-800 dark:text-green-200">
              Secure PayPal Payment
            </div>
            <div className="text-green-700 dark:text-green-300">
              Your payment is processed securely through PayPal. 
              Access will be granted immediately after successful payment completion.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}