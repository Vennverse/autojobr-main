
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle2, Globe, IndianRupee, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SimplePaymentGatewaySelector from "@/components/SimplePaymentGatewaySelector";
import PayPalHostedButton from "@/components/PayPalHostedButton";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ReferralMarketplacePayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'paypal' | 'razorpay' | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('bookingId');
    const amt = params.get('amount');
    
    if (id && amt) {
      setBookingId(parseInt(id));
      setAmount(parseFloat(amt));
    }
  }, []);

  const initPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId || !amount) throw new Error('Missing booking information');
      
      return await apiRequest<any>('/api/referral-marketplace/payment/initialize', 'POST', {
        bookingId,
        amount
      });
    },
    onSuccess: (data) => {
      setPaymentData(data);
      
      // Auto-select gateway based on response
      if (data.provider === 'razorpay') {
        setSelectedGateway('razorpay');
      } else if (data.provider === 'paypal') {
        setSelectedGateway('paypal');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Initialization Failed",
        description: error.message || "Failed to initialize payment",
        variant: "destructive"
      });
    }
  });

  const handleRazorpayPayment = () => {
    if (!paymentData) return;

    // Load Razorpay script if not already loaded
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const options = {
        key: paymentData.razorpayKeyId,
        amount: paymentData.amount * 100,
        currency: paymentData.currency,
        name: "AutoJobr Referral Marketplace",
        description: `Booking #${bookingId}`,
        order_id: paymentData.orderId,
        handler: async function (response: any) {
          try {
            const verifyResult = await apiRequest<any>(
              '/api/referral-marketplace/payment/razorpay/verify',
              'POST',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingId
              }
            );

            if (verifyResult.success) {
              toast({
                title: "Payment Successful!",
                description: "Your booking is confirmed. Check your email for the meeting link.",
              });
              queryClient.invalidateQueries({ queryKey: ['/api/referral-marketplace/bookings'] });
              setLocation('/my-bookings');
            }
          } catch (error: any) {
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Failed to verify payment",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#4F46E5"
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    };
    document.body.appendChild(script);
  };

  const handlePayPalSuccess = () => {
    toast({
      title: "Payment Successful!",
      description: "Your booking is confirmed. Check your email for the meeting link.",
    });
    queryClient.invalidateQueries({ queryKey: ['/api/referral-marketplace/bookings'] });
    setLocation('/my-bookings');
  };

  const handlePayPalError = (error: any) => {
    toast({
      title: "Payment Failed",
      description: error.message || "Failed to process payment",
      variant: "destructive"
    });
  };

  if (!bookingId || !amount) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Invalid payment link. Please return to the booking page and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Payment
          </CardTitle>
          <CardDescription>
            Complete your booking payment with escrow protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Booking ID:</span>
              <Badge variant="secondary">#{bookingId}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount:</span>
              <span className="text-lg font-bold">${amount.toFixed(2)}</span>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Escrow Protection:</strong> Your payment will be held securely until the service is delivered and confirmed by both parties.
            </AlertDescription>
          </Alert>

          {!paymentData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>Payment method will be automatically selected based on your location</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">PayPal</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For international users
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Razorpay</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For Indian users (30% discount)
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => initPaymentMutation.mutate()}
                disabled={initPaymentMutation.isPending}
                data-testid="button-proceed-payment"
              >
                {initPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <SimplePaymentGatewaySelector
                selectedGateway={selectedGateway}
                onGatewayChange={setSelectedGateway}
              />

              {selectedGateway === 'paypal' && (
                <PayPalHostedButton
                  purpose="mock_interview"
                  amount={amount}
                  itemName={`Referral Booking #${bookingId}`}
                  serviceId={bookingId.toString()}
                  onPaymentSuccess={handlePayPalSuccess}
                  onPaymentError={handlePayPalError}
                  description="Complete your referral booking payment"
                />
              )}

              {selectedGateway === 'razorpay' && paymentData.provider === 'razorpay' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <IndianRupee className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Razorpay Payment</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Amount: ₹{paymentData.amount.toLocaleString('en-IN')}
                      {paymentData.discount > 0 && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          {paymentData.discount}% off
                        </Badge>
                      )}
                    </p>
                    <Button
                      className="w-full"
                      onClick={handleRazorpayPayment}
                    >
                      <IndianRupee className="mr-2 h-4 w-4" />
                      Pay with Razorpay
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>By proceeding, you agree to our terms and conditions</p>
            <p>🔒 All transactions are encrypted and secure</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
