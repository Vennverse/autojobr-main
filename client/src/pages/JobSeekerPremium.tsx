import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Crown, 
  Sparkles,
  Coffee,
  Briefcase,
  TrendingUp,
  Calendar,
  X,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    paypal?: any;
    Razorpay?: any;
  }
}

type PlanType = 'smart_saver' | 'monthly_access' | null;
type PaymentMethod = 'paypal' | 'razorpay' | null;

export default function JobSeekerPremium() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: user } = useQuery<{planType?: string; email?: string}>({
    queryKey: ['/api/user']
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['/api/subscription/current'],
  });

  // Handle subscription success/error from URL params (after PayPal redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscription = urlParams.get('subscription');
    const message = urlParams.get('message');

    if (subscription === 'success') {
      toast({
        title: "Subscription Activated!",
        description: message || "Your premium subscription is now active.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/job-seeker-premium');
      // Refresh subscription data
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } else if (subscription === 'error') {
      toast({
        title: "Subscription Failed",
        description: message || "There was an issue activating your subscription.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/job-seeker-premium');
    } else if (subscription === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: message || "Subscription setup was cancelled.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/job-seeker-premium');
    }
  }, [toast, queryClient]);

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/subscription/cancel', 'POST', {});
    },
    onSuccess: () => {
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled and will not renew.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Load PayPal script
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AUzUXMfJm1WWbSHiAKfylwAd4AOYkMQV_tE_Pzg2g9zxmGyPC1bt82hlQ_vQycZSrM-ke8gICEeh8kTf&vault=true&intent=subscription';
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setIsProcessing(true);

    try {
      if (method === 'paypal') {
        await handlePayPalPayment();
      } else if (method === 'razorpay') {
        await handleRazorpayPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    const planPricing = {
      smart_saver: 13.00,
      monthly_access: 19.00
    };

    const price = selectedPlan ? planPricing[selectedPlan] : 0;
    const planName = selectedPlan === 'smart_saver' ? 'Smart Saver' : 'Monthly Access';

    try {
      // Create PayPal subscription order via backend
      const response = await apiRequest('/api/payments/paypal/create-subscription', 'POST', {
        amount: price,
        currency: 'USD',
        planType: selectedPlan,
        planName: planName
      });

      if (response.approvalUrl) {
        // Redirect to PayPal for payment approval
        toast({
          title: "Redirecting to PayPal",
          description: "Taking you to PayPal to complete your subscription...",
        });
        
        // Small delay to show the toast before redirecting
        setTimeout(() => {
          window.location.href = response.approvalUrl;
        }, 1000);
      } else {
        throw new Error('Failed to get PayPal approval URL');
      }
    } catch (error: any) {
      console.error('PayPal subscription error:', error);
      throw new Error(error.message || 'Failed to create PayPal subscription');
    }
  };

  const handleRazorpayPayment = async () => {
    const planPrices = {
      smart_saver: 1300, // $13 in cents
      monthly_access: 1900 // $19 in cents
    };

    const price = selectedPlan ? planPrices[selectedPlan] : 0;
    const planName = selectedPlan === 'smart_saver' ? 'Smart Saver' : 'Monthly Access';

    try {
      const response = await apiRequest('/api/payments/razorpay/create-subscription', 'POST', {
        amount: price,
        currency: 'USD',
        planType: selectedPlan,
        planName: planName
      });

      if (response.subscriptionId && window.Razorpay) {
        const options = {
          key: response.keyId,
          subscription_id: response.subscriptionId,
          name: 'AutoJobr',
          description: `${planName} Subscription`,
          handler: async function (response: any) {
            try {
              await apiRequest('/api/payments/razorpay/verify-subscription', 'POST', {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpaySignature: response.razorpay_signature,
                planType: selectedPlan
              });

              queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
              queryClient.invalidateQueries({ queryKey: ['/api/user'] });

              toast({
                title: "Success!",
                description: `${planName} activated successfully!`,
              });

              setShowPaymentDialog(false);
              setIsProcessing(false);
            } catch (error) {
              console.error('Verification error:', error);
              toast({
                title: "Verification Failed",
                description: "Payment received but verification failed. Please contact support.",
                variant: "destructive",
              });
              setIsProcessing(false);
            }
          },
          prefill: {
            email: user?.email || 'customer@example.com'
          },
          theme: {
            color: '#3B82F6'
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setIsProcessing(false);
      } else {
        throw new Error('Failed to create Razorpay subscription');
      }
    } catch (error) {
      console.error('Razorpay error:', error);
      throw error;
    }
  };

  const subscription = (currentSubscription as any)?.subscription || null;
  const isPremiumUser = user?.planType === 'premium' || user?.planType === 'smart_saver' || user?.planType === 'monthly_access';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 mb-4">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Land Your Dream Job</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Land your next job faster —
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                without overpaying.
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Competitors charge $19–$29 for fewer tools. AutoJobr gives you everything for less.
            </p>
          </div>
        </div>
      </div>

      {/* Current Subscription Status */}
      {subscription && subscription.isActive && (
        <div className="container mx-auto px-4 pb-8 max-w-4xl">
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900">
                    <Crown className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Active Subscription</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subscription.tierDetails?.name} - Renews in {subscription.daysRemaining} days
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600"
                  data-testid="button-cancel-subscription"
                >
                  Cancel Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* CARD 1 - SMART SAVER (Most Popular) */}
            <Card 
              className="relative border-2 border-green-200 dark:border-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              data-testid="card-plan-smart-saver"
            >
              {/* Most Popular Badge */}
              <div className="absolute -right-12 top-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-12 py-1 rotate-45 text-xs font-semibold shadow-lg">
                Most Popular
              </div>

              {/* Soft Green Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>

              <CardHeader className="relative pb-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-300 dark:border-green-700 text-xs px-3 py-1">
                    🏷️ Smart Saver — Most Popular
                  </Badge>
                </div>

                <CardTitle className="text-3xl font-bold mb-2">
                  <span className="text-5xl">$13</span>
                  <span className="text-xl text-gray-500 dark:text-gray-400 font-normal"> / month</span>
                </CardTitle>

                <div className="space-y-2">
                  <Badge className="bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-0 text-sm font-medium">
                    💚 Save $72 a year
                  </Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Coffee className="h-3 w-3" />
                    Just $0.43 a day — less than a coffee, more for your career.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    Auto-renew — Cancel Anytime
                  </p>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  "Land your next job faster — without overpaying."
                </p>

                <div className="space-y-3">
                  {[
                    'Unlimited Resumes & Job Tracking',
                    'AI-Powered Keyword & Cover Letter Builder',
                    'Resume & Profile Analysis for Better Matches',
                    '72% of users landed interviews within 3 weeks',
                    'Competitors charge $19–$29 for fewer tools',
                    'Cancel Anytime — No Commitment'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Smart choice for serious job seekers.
                  </p>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                    onClick={() => handlePlanSelect('smart_saver')}
                    data-testid="button-select-smart-saver"
                  >
                    Get Started — $13/mo
                  </Button>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                    Auto-renew, cancel anytime.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2 - MONTHLY ACCESS (Try Once) */}
            <Card 
              className="relative border-2 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              data-testid="card-plan-monthly-access"
            >
              {/* Flexible Badge */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 transition-all duration-300"></div>

              <CardHeader className="relative pb-6">
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 text-xs px-3 py-1 mb-4 w-fit">
                  ⚡ Flexible Plan — Pay As You Go
                </Badge>

                <CardTitle className="text-3xl font-bold mb-2">
                  <span className="text-5xl">$19</span>
                  <span className="text-xl text-gray-500 dark:text-gray-400 font-normal"> / month</span>
                </CardTitle>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />
                    $0.63 a day — great for quick projects or resumes.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    Monthly subscription
                  </p>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  "Try for a month — flexible access."
                </p>

                <div className="space-y-3">
                  {[
                    'Same AI tools & resume features as Smart Saver',
                    'Perfect for one-off applications or interview prep',
                    'Upgrade anytime to Smart Saver and save 30%',
                    'Full access to all premium features',
                    'No long-term commitment required'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    $19 shows value — $13 feels smart.
                  </p>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                    onClick={() => handlePlanSelect('monthly_access')}
                    data-testid="button-select-monthly-access"
                  >
                    Start Monthly — $19
                  </Button>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                    Upgrade later to save 30%.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Section */}
          <div className="mt-12 text-center space-y-4">
            <div className="inline-block p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-100 dark:border-blue-900">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Competitors charge $19–$29 for fewer tools.
              </p>
              <p className="text-base text-gray-700 dark:text-gray-300">
                AutoJobr gives you everything for just $13 — or $19 if you prefer flexibility.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm">
                🧠 Real ROI: Users report 5× more applications and faster interviews.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-payment-method">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select your preferred payment provider to complete your {selectedPlan === 'smart_saver' ? 'Smart Saver ($13/mo)' : 'Monthly Access ($19/mo)'} subscription
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {/* PayPal Option */}
            <button
              onClick={() => handlePaymentMethodSelect('paypal')}
              disabled={isProcessing}
              className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-payment-paypal"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852a.932.932 0 0 1 .922-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.814-4.463z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">PayPal</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Secure payment with PayPal</p>
                  </div>
                </div>
                {isProcessing && selectedPaymentMethod === 'paypal' && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                )}
              </div>
            </button>

            {/* Razorpay Option */}
            <button
              onClick={() => handlePaymentMethodSelect('razorpay')}
              disabled={isProcessing}
              className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-payment-razorpay"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">R</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Razorpay</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Credit/Debit Card, UPI, NetBanking</p>
                  </div>
                </div>
                {isProcessing && selectedPaymentMethod === 'razorpay' && (
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                )}
              </div>
            </button>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setShowPaymentDialog(false);
              setSelectedPlan(null);
              setSelectedPaymentMethod(null);
            }}
            className="w-full"
            data-testid="button-cancel-payment"
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
