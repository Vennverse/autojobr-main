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
  Shield
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
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
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'cashfree' | 'razorpay'>('paypal');
  const [showPayment, setShowPayment] = useState(false);

  // Fetch only job seeker subscription tiers
  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ['/api/subscription/tiers'],
    queryFn: () => fetch('/api/subscription/tiers?userType=jobseeker').then(res => res.json()),
  });

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/current'],
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { tierId: string; paymentMethod: string }) => {
      return await apiRequest('POST', '/api/subscription/create', data);
    },
    onSuccess: (data) => {
      if (data.order?.orderId) {
        toast({
          title: "Payment initiated",
          description: "Complete your payment to activate premium features.",
        });
        setShowPayment(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
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

  const handleSubscribe = (tierId: string) => {
    setSelectedTier(tierId);
    createSubscriptionMutation.mutate({ tierId, paymentMethod });
  };

  const handleCancelSubscription = () => {
    if (confirm("Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period.")) {
      cancelSubscriptionMutation.mutate();
    }
  };

  // PayPal script loading and button initialization
  useEffect(() => {
    const loadPayPalScript = () => {
      // Check if PayPal script is already loaded
      if (window.paypal) {
        initializePayPalButtons();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AUzUXMfJm1WWbSHiAKfylwAd4AOYkMQV_tE_Pzg2g9zxmGyPC1bt82hlQ_vQycZSrM-ke8gICEeh8kTf&vault=true&intent=subscription';
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.onload = () => {
        initializePayPalButtons();
      };
      document.head.appendChild(script);
    };

    const initializePayPalButtons = () => {
      // Premium Monthly Button ($5)
      if (window.paypal && document.getElementById('paypal-button-container-P-9SC66893530757807NCRWYCI')) {
        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: function(data: any, actions: any) {
            return actions.subscription.create({
              plan_id: 'P-9SC66893530757807NCRWYCI',
              application_context: {
                shipping_preference: 'NO_SHIPPING' // Digital service only
              }
            });
          },
          onApprove: function(data: any, actions: any) {
            // Send subscription ID to backend for verification
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
      if (window.paypal && document.getElementById('paypal-button-container-P-5JM23618R75865735NCRXOLY')) {
        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: function(data: any, actions: any) {
            return actions.subscription.create({
              plan_id: 'P-5JM23618R75865735NCRXOLY',
              application_context: {
                shipping_preference: 'NO_SHIPPING' // Digital service only
              }
            });
          },
          onApprove: function(data: any, actions: any) {
            // Send subscription ID to backend for verification
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

    // Cleanup function
    return () => {
      const premiumContainer = document.getElementById('paypal-button-container-P-9SC66893530757807NCRWYCI');
      const ultraContainer = document.getElementById('paypal-button-container-P-5JM23618R75865735NCRXOLY');
      if (premiumContainer) premiumContainer.innerHTML = '';
      if (ultraContainer) ultraContainer.innerHTML = '';
    };
  }, [queryClient, toast]);

  const getIconForTier = (tierName: string) => {
    if (tierName.includes('Basic')) return <Star className="h-6 w-6" />;
    if (tierName.includes('Premium')) return <Crown className="h-6 w-6" />;
    return <Star className="h-6 w-6" />;
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    return value.toLocaleString();
  };

  if (tiersLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Filter to ensure only job seeker tiers are displayed
  const tiers: JobSeekerSubscriptionTier[] = (tiersData?.tiers || []).filter((tier: any) => tier.userType === 'jobseeker');
  const subscription = (currentSubscription as any)?.subscription || null;
  const isFreeTier = !subscription || !subscription?.isActive;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Usage Monitoring Sidebar */}
        <div className="lg:col-span-1">
          <UsageMonitoringWidget />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Job Seeker Premium Plans</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Supercharge your job search with AI-powered tools, unlimited applications, and premium features.
            </p>
            
            {isFreeTier && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Free tier limits applied - Upgrade now for unlimited access!</span>
                </div>
              </div>
            )}
          </div>

          {/* Current Subscription Status */}
          {subscription && (
            <Card className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-semibold">{subscription.tierDetails?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={subscription.isActive ? "default" : "secondary"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Billing</p>
                    <p className="font-semibold">
                      ${subscription.amount} / {subscription.billingCycle}
                    </p>
                  </div>
                </div>
                
                {subscription.isActive && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {subscription.daysRemaining} days remaining
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={cancelSubscriptionMutation.isPending}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscription Plans - Simplified to 2 Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Premium Monthly - $5 */}
            <Card className="relative">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Crown className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Premium Monthly</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">$5</span>
                  <span className="text-muted-foreground">/month</span>
                  <Badge className="ml-2 bg-green-600">83% OFF Market Price</Badge>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">AI Resume Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Job Matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Chrome Extension Auto-fill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Unlimited Cover Letters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Advanced Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Basic Support</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Limits</h4>
                  <div className="flex justify-between text-sm">
                    <span>Resume Analyses</span>
                    <span className="font-medium">25/month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Job Applications</span>
                    <span className="font-medium">Unlimited</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Auto-Fill Forms</span>
                    <span className="font-medium">Unlimited</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div id="paypal-button-container-P-9SC66893530757807NCRWYCI" className="min-h-[50px]"></div>
                </div>
              </CardContent>
            </Card>

            {/* Ultra Premium Monthly - $15 */}
            <Card className="relative border-blue-500 ring-2 ring-blue-200">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Most Popular</Badge>
              </div>
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Ultra Premium Monthly</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">$15</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Everything in Premium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Virtual AI Interviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Coding Tests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Chat with Recruiters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Priority Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">API Access</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Limits</h4>
                  <div className="flex justify-between text-sm">
                    <span>Resume Analyses</span>
                    <span className="font-medium">Unlimited</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Virtual Interviews</span>
                    <span className="font-medium">Unlimited</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Everything Else</span>
                    <span className="font-medium">Unlimited</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div id="paypal-button-container-P-5JM23618R75865735NCRXOLY" className="min-h-[50px]"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Why Choose Premium?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">Advanced AI analyzes your resume and matches you with perfect jobs</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Save Time</h3>
                  <p className="text-sm text-muted-foreground">Auto-fill job applications with your Chrome extension</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Get Results</h3>
                  <p className="text-sm text-muted-foreground">Premium users get 3x more interviews on average</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Information */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Secure Payment with PayPal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Your payment is processed securely through PayPal. You can cancel your subscription anytime from your PayPal account or our platform.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Cancel anytime</span>
                <Check className="h-4 w-4 text-green-600" />
                <span>Instant activation</span>
                <Check className="h-4 w-4 text-green-600" />
                <span>30-day money back guarantee</span>
              </div>
            </CardContent>
          </Card>

          {/* Job Seeker Benefits Showcase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Why Job Seekers Choose Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center space-y-2">
                  <Brain className="h-8 w-8 mx-auto text-blue-600" />
                  <h3 className="font-semibold">AI Resume Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant ATS compatibility scores and personalized resume improvements
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <Search className="h-8 w-8 mx-auto text-green-600" />
                  <h3 className="font-semibold">Smart Job Matching</h3>
                  <p className="text-sm text-muted-foreground">
                    Find relevant jobs faster with AI-powered matching algorithms
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-purple-600" />
                  <h3 className="font-semibold">Auto-Fill Applications</h3>
                  <p className="text-sm text-muted-foreground">
                    Chrome extension fills job applications automatically across 500+ sites
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <TrendingUp className="h-8 w-8 mx-auto text-orange-600" />
                  <h3 className="font-semibold">Interview Practice</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice virtual interviews and improve your performance with AI feedback
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}