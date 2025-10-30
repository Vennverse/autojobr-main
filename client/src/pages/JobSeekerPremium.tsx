
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
  Zap,
  Rocket,
  Star,
  TrendingUp,
  X,
  Loader2,
  Shield,
  Infinity,
  Award,
  Users,
  Target,
  BarChart3,
  MessageCircle,
  Video,
  FileText,
  Brain,
  ChevronRight,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    paypal?: any;
    Razorpay?: any;
  }
}

type PlanType = 'smart_saver' | 'monthly_access' | 'ultra_premium' | null;
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscription = urlParams.get('subscription');
    const message = urlParams.get('message');

    if (subscription === 'success') {
      toast({
        title: "Subscription Activated!",
        description: message || "Your premium subscription is now active.",
      });
      window.history.replaceState({}, '', '/job-seeker-premium');
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } else if (subscription === 'error') {
      toast({
        title: "Subscription Failed",
        description: message || "There was an issue activating your subscription.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/job-seeker-premium');
    } else if (subscription === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: message || "Subscription setup was cancelled.",
        variant: "destructive",
      });
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
      monthly_access: 19.00,
      ultra_premium: 24.00
    };

    const price = selectedPlan ? planPricing[selectedPlan] : 0;
    const planNames = {
      smart_saver: 'Smart Saver',
      monthly_access: 'Monthly Access',
      ultra_premium: 'Ultra Premium'
    };
    const planName = selectedPlan ? planNames[selectedPlan] : '';

    try {
      const response = await apiRequest('/api/payments/paypal/create-subscription', 'POST', {
        amount: price,
        currency: 'USD',
        planType: selectedPlan,
        planName: planName
      });

      if (response.approvalUrl) {
        toast({
          title: "Redirecting to PayPal",
          description: "Taking you to PayPal to complete your subscription...",
        });
        
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
      smart_saver: 1300,
      monthly_access: 1900,
      ultra_premium: 2400
    };

    const price = selectedPlan ? planPrices[selectedPlan] : 0;
    const planNames = {
      smart_saver: 'Smart Saver',
      monthly_access: 'Monthly Access',
      ultra_premium: 'Ultra Premium'
    };
    const planName = selectedPlan ? planNames[selectedPlan] : '';

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
  const isPremiumUser = user?.planType === 'premium' || user?.planType === 'smart_saver' || user?.planType === 'monthly_access' || user?.planType === 'ultra_premium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-200 dark:border-blue-800 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Join 10,000+ Successful Job Seekers
              </span>
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              <span className="block text-gray-900 dark:text-white mb-2">
                Land Your Dream Job
              </span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Without Overpaying
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              AI-powered tools that give you <span className="font-bold text-blue-600">5× more interviews</span> at a fraction of the cost
            </p>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white dark:border-gray-900"></div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">10,000+</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Active Users</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-bold text-gray-900 dark:text-white">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Subscription Status */}
      {subscription && subscription.isActive && (
        <div className="container mx-auto px-4 pb-12 max-w-6xl relative z-10">
          <Card className="border-2 border-green-400 dark:border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">Active Subscription</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subscription.tierDetails?.name} • Renews in <span className="font-semibold">{subscription.daysRemaining} days</span>
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 transition-all"
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
      <div className="container mx-auto px-4 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* CARD 1 - SMART SAVER */}
            <Card 
              className="relative border-2 border-green-300 dark:border-green-700 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
              data-testid="card-plan-smart-saver"
            >
              {/* Popular Badge */}
              <div className="absolute -right-12 top-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-16 py-2 rotate-45 text-sm font-bold shadow-lg z-10">
                POPULAR
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-green-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>

              <CardHeader className="relative pb-8 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-300 dark:border-green-700 text-sm px-4 py-1.5 font-semibold">
                    💰 Best Value
                  </Badge>
                </div>

                <CardTitle className="text-4xl font-black mb-4">
                  Smart Saver
                </CardTitle>

                <div className="space-y-3">
                  <div>
                    <span className="text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">$13</span>
                    <span className="text-2xl text-gray-500 dark:text-gray-400 font-normal">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Just $0.43/day — less than a coffee
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-950/50">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">Save $72/year</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6 pb-8">
                <div className="space-y-4">
                  {[
                    'Unlimited Resumes & Job Applications',
                    'AI-Powered Resume & Cover Letter Builder',
                    'Resume & Profile Analysis',
                    'Job Matching Algorithm',
                    'Application Tracking Dashboard',
                    'Email Support',
                    'Cancel Anytime'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-7 text-lg shadow-xl hover:shadow-2xl transition-all group"
                  onClick={() => handlePlanSelect('smart_saver')}
                  data-testid="button-select-smart-saver"
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* CARD 2 - MONTHLY ACCESS */}
            <Card 
              className="relative border-2 border-blue-300 dark:border-blue-700 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
              data-testid="card-plan-monthly-access"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-blue-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>

              <CardHeader className="relative pb-8 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700 text-sm px-4 py-1.5 font-semibold">
                    ⚡ Flexible
                  </Badge>
                </div>

                <CardTitle className="text-4xl font-black mb-4">
                  Monthly Access
                </CardTitle>

                <div className="space-y-3">
                  <div>
                    <span className="text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">$19</span>
                    <span className="text-2xl text-gray-500 dark:text-gray-400 font-normal">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    $0.63/day — perfect for quick wins
                  </p>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6 pb-8">
                <div className="space-y-4">
                  {[
                    'Everything in Smart Saver',
                    'Priority AI Processing',
                    'Advanced Analytics Dashboard',
                    'Interview Preparation Tools',
                    'Salary Negotiation Coach',
                    'Priority Email Support',
                    'Monthly Subscription'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-7 text-lg shadow-xl hover:shadow-2xl transition-all group"
                  onClick={() => handlePlanSelect('monthly_access')}
                  data-testid="button-select-monthly-access"
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* CARD 3 - ULTRA PREMIUM (NEW) */}
            <Card 
              className="relative border-2 border-purple-300 dark:border-purple-700 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 backdrop-blur-sm"
              data-testid="card-plan-ultra-premium"
            >
              {/* Premium Badge */}
              <div className="absolute -right-12 top-8 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white px-16 py-2 rotate-45 text-sm font-bold shadow-lg z-10 animate-pulse">
                PREMIUM
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-500"></div>

              <CardHeader className="relative pb-8 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-sm px-4 py-1.5 font-semibold shadow-lg">
                    🚀 Ultimate
                  </Badge>
                </div>

                <CardTitle className="text-4xl font-black mb-4">
                  Ultra Premium
                </CardTitle>

                <div className="space-y-3">
                  <div>
                    <span className="text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">$24</span>
                    <span className="text-2xl text-gray-500 dark:text-gray-400 font-normal">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Infinity className="h-4 w-4" />
                    Complete career acceleration package
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">VIP Treatment</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6 pb-8">
                <div className="space-y-4">
                  {[
                    { icon: Infinity, text: 'Everything in Monthly Access' },
                    { icon: Video, text: 'Unlimited AI Mock Interviews' },
                    { icon: Brain, text: 'Personalized Career Coaching' },
                    { icon: Users, text: 'Direct Recruiter Connections' },
                    { icon: Target, text: 'Premium Job Targeting' },
                    { icon: MessageCircle, text: '24/7 Priority Chat Support' },
                    { icon: Shield, text: 'Background Check Assistance' },
                    { icon: FileText, text: 'Professional Resume Writing' }
                  ].map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white font-bold py-7 text-lg shadow-xl hover:shadow-2xl transition-all group"
                  onClick={() => handlePlanSelect('ultra_premium')}
                  data-testid="button-select-ultra-premium"
                >
                  Get Ultra Premium
                  <Rocket className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Section */}
          <div className="mt-20 text-center space-y-8">
            <div className="inline-block p-8 rounded-3xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-xl backdrop-blur-sm">
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Why AutoJobr Beats the Competition
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl">
                Competitors charge <span className="font-bold text-red-600">$29-$49/month</span> for basic features. <br/>
                We give you <span className="font-bold text-green-600">everything for just $13-$24</span> — up to 73% savings!
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: '10k+', label: 'Happy Users', color: 'from-blue-500 to-cyan-500' },
              { icon: Target, value: '72%', label: 'Got Interviews in 3 Weeks', color: 'from-green-500 to-emerald-500' },
              { icon: TrendingUp, value: '5×', label: 'More Applications', color: 'from-purple-500 to-pink-500' },
              { icon: Award, value: '4.9★', label: 'Average Rating', color: 'from-yellow-500 to-orange-500' }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="border-2 hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Final CTA */}
          <div className="mt-20 text-center p-12 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Transform Your Career?
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands who landed their dream jobs. Start today for less than a coffee per day.
            </p>
            <Button 
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              onClick={() => handlePlanSelect('smart_saver')}
              data-testid="button-cta-smart-saver"
            >
              Start for $13/month →
            </Button>
            <p className="text-sm text-blue-100 mt-4">
              ✨ Cancel anytime • 🔒 Secure payment • ⚡ Instant access
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-payment-method">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select your preferred payment provider for {
                selectedPlan === 'smart_saver' ? 'Smart Saver ($13/mo)' : 
                selectedPlan === 'monthly_access' ? 'Monthly Access ($19/mo)' : 
                'Ultra Premium ($24/mo)'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
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
