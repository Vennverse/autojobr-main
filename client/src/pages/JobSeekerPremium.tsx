
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Crown, 
  Star, 
  Zap, 
  CreditCard,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Brain,
  Target,
  FileText,
  Search,
  Clock,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import UsageMonitoringWidget from "@/components/UsageMonitoringWidget";

interface JobSeekerSubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  userType: 'jobseeker';
  features: string[];
  limits: {
    jobAnalyses?: number;
    resumeAnalyses?: number;
    applications?: number;
    autoFills?: number;
    interviews?: number;
  };
}

export default function JobSeekerPremium() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  // Fetch user data
  const { data: user } = useQuery<{planType?: string}>({
    queryKey: ['/api/user']
  });

  // Fetch only job seeker subscription tiers
  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ['/api/subscription/tiers'],
    queryFn: () => fetch('/api/subscription/tiers?userType=jobseeker').then(res => res.json()),
  });

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/current'],
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/subscription/cancel', {});
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

  const handleCancelSubscription = () => {
    if (confirm("Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period.")) {
      cancelSubscriptionMutation.mutate();
    }
  };

  // PayPal script loading and button initialization
  useEffect(() => {
    let isMounted = true;

    const loadPayPalScript = () => {
      if (window.paypal) {
        setTimeout(() => initializePayPalButtons(), 100);
        return;
      }

      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (isMounted) setTimeout(() => initializePayPalButtons(), 100);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AUzUXMfJm1WWbSHiAKfylwAd4AOYkMQV_tE_Pzg2g9zxmGyPC1bt82hlQ_vQycZSrM-ke8gICEeh8kTf&vault=true&intent=subscription';
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.async = true;
      script.onload = () => {
        if (isMounted) setTimeout(() => initializePayPalButtons(), 100);
      };
      document.head.appendChild(script);
    };

    const initializePayPalButtons = () => {
      if (!window.paypal) return;

      // Premium Monthly Button ($5)
      const premiumContainer = document.getElementById('paypal-button-container-P-9SC66893530757807NCRWYCI');
      if (premiumContainer && !premiumContainer.hasChildNodes()) {
        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'black',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: function(data: any, actions: any) {
            return actions.subscription.create({
              plan_id: 'P-9SC66893530757807NCRWYCI',
              application_context: {
                shipping_preference: 'NO_SHIPPING'
              }
            });
          },
          onApprove: function(data: any, actions: any) {
            fetch('/api/paypal/verify-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                subscriptionId: data.subscriptionID,
                planId: 'P-9SC66893530757807NCRWYCI',
                planType: 'premium'
              })
            }).then(response => response.json())
            .then(result => {
              if (result.success) {
                queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                queryClient.invalidateQueries({ queryKey: ['/api/usage/report'] });
                toast({
                  title: "Premium Activated!",
                  description: "Your premium features are now active.",
                });
              }
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
        }).render('#paypal-button-container-P-9SC66893530757807NCRWYCI');
      }

      // Ultra Premium Monthly Button ($15)
      const ultraContainer = document.getElementById('paypal-button-container-P-5JM23618R75865735NCRXOLY');
      if (ultraContainer && !ultraContainer.hasChildNodes()) {
        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'black',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: function(data: any, actions: any) {
            return actions.subscription.create({
              plan_id: 'P-5JM23618R75865735NCRXOLY',
              application_context: {
                shipping_preference: 'NO_SHIPPING'
              }
            });
          },
          onApprove: function(data: any, actions: any) {
            fetch('/api/paypal/verify-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                subscriptionId: data.subscriptionID,
                planId: 'P-5JM23618R75865735NCRXOLY',
                planType: 'ultra_premium'
              })
            }).then(response => response.json())
            .then(result => {
              if (result.success) {
                queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                queryClient.invalidateQueries({ queryKey: ['/api/usage/report'] });
                toast({
                  title: "Ultra Premium Activated!",
                  description: "Your ultra premium features are now active.",
                });
              }
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
        }).render('#paypal-button-container-P-5JM23618R75865735NCRXOLY');
      }
    };

    loadPayPalScript();

    return () => {
      isMounted = false;
    };
  }, [queryClient, toast]);

  if (tiersLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-800"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 absolute top-0 left-0"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subscription = (currentSubscription as any)?.subscription || null;
  const isPremiumUser = user?.planType === 'premium' || user?.planType === 'ultra_premium' || user?.planType === 'enterprise';
  const isFreeTier = !isPremiumUser && (!subscription || !(subscription?.isActive === true || subscription?.status === 'active'));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 mb-4">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Elevate Your Career</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Premium Job Search,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Simplified.
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              AI-powered tools that transform your job search. Get hired faster with intelligent automation and premium features.
            </p>

            {isFreeTier && (
              <div className="mt-8 max-w-md mx-auto">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3 text-amber-900 dark:text-amber-100">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Free tier limits active. Upgrade for unlimited access.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Sidebar - Usage Monitoring */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <UsageMonitoringWidget />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Current Subscription */}
            {subscription && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl"></div>
                <Card className="relative border-blue-100 dark:border-blue-900 shadow-lg shadow-blue-500/5 rounded-3xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950">
                          <Crown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        Active Subscription
                      </CardTitle>
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800">
                        {subscription.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                        <p className="font-semibold text-lg">{subscription.tierDetails?.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Billing</p>
                        <p className="font-semibold text-lg">${subscription.amount}/{subscription.billingCycle}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                        <p className="font-semibold text-lg">{subscription.daysRemaining} days</p>
                      </div>
                    </div>
                    
                    {subscription.isActive && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>Renews automatically</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleCancelSubscription}
                          disabled={cancelSubscriptionMutation.isPending}
                          className="hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600"
                        >
                          Cancel Plan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pricing Plans */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                  Choose Your Plan
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Select the perfect plan for your career journey
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Premium Plan */}
                <div 
                  className="relative group"
                  onMouseEnter={() => setHoveredPlan('premium')}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl transition-all duration-500 ${hoveredPlan === 'premium' ? 'opacity-20 blur-xl scale-105' : 'opacity-0'}`}></div>
                  <Card className="relative border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden h-full">
                    <CardHeader className="space-y-4 pb-8">
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                          <Crown className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800">
                          Save 83%
                        </Badge>
                      </div>
                      
                      <div>
                        <CardTitle className="text-2xl mb-2">Premium</CardTitle>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold tracking-tight">$5</span>
                          <span className="text-gray-500 dark:text-gray-400">/month</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {[
                          'AI Resume Analysis',
                          'Smart Job Matching',
                          'Auto-fill Applications',
                          'Unlimited Cover Letters',
                          'Advanced Analytics',
                          'Priority Support'
                        ].map((feature, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Resume Analyses</span>
                          <span className="font-medium">25/month</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Applications</span>
                          <span className="font-medium">Unlimited</span>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <div id="paypal-button-container-P-9SC66893530757807NCRWYCI" className="min-h-[50px]"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Ultra Premium Plan */}
                <div 
                  className="relative group"
                  onMouseEnter={() => setHoveredPlan('ultra')}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl opacity-75 blur-sm group-hover:opacity-100 transition-all duration-500"></div>
                  <Card className="relative bg-white dark:bg-gray-950 border-0 shadow-2xl rounded-3xl overflow-hidden h-full">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
                    
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg px-4 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                    
                    <CardHeader className="space-y-4 pb-8 pt-8">
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                          <Sparkles className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      
                      <div>
                        <CardTitle className="text-2xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Ultra Premium
                        </CardTitle>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold tracking-tight">$15</span>
                          <span className="text-gray-500 dark:text-gray-400">/month</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {[
                          'Everything in Premium',
                          'AI Interview Practice',
                          'Coding Assessments',
                          'Recruiter Chat Access',
                          'Advanced Analytics',
                          'API Access'
                        ].map((feature, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">All Features</span>
                          <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Unlimited</span>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <div id="paypal-button-container-P-5JM23618R75865735NCRXOLY" className="min-h-[50px]"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {[
                {
                  icon: Zap,
                  title: 'AI-Powered',
                  description: 'Advanced algorithms match you with perfect opportunities',
                  gradient: 'from-yellow-400 to-orange-500'
                },
                {
                  icon: Clock,
                  title: 'Save Time',
                  description: 'Auto-fill applications across 500+ job sites',
                  gradient: 'from-green-400 to-emerald-500'
                },
                {
                  icon: TrendingUp,
                  title: 'Get Results',
                  description: '3x more interviews on average for premium users',
                  gradient: 'from-blue-400 to-purple-500'
                }
              ].map((benefit, i) => (
                <Card key={i} className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 rounded-2xl group">
                  <CardContent className="pt-6 text-center space-y-3">
                    <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${benefit.gradient} p-3 group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">{benefit.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Security & Trust */}
            <Card className="border-gray-200 dark:border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-xl bg-green-50 dark:bg-green-950">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Secure & Trusted
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your payment is processed securely through PayPal. Cancel anytime with no questions asked.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {['Cancel Anytime', 'Instant Activation', '30-Day Guarantee'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
