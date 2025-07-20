import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Crown, 
  Users, 
  Building2,
  Zap,
  CreditCard,
  Calendar,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Search,
  BarChart3,
  Headphones
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import PayPalButton from "@/components/PayPalButton";
import UsageMonitoringWidget from "@/components/UsageMonitoringWidget";

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  userType: 'jobseeker' | 'recruiter';
  features: string[];
  limits: {
    jobPostings?: number;
    interviews?: number;
    candidates?: number;
  };
}

export default function RecruiterPremium() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'razorpay'>('paypal');
  const [showPayment, setShowPayment] = useState(false);

  // Fetch recruiter subscription tiers
  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ['/api/subscription/tiers', { userType: 'recruiter' }],
  });

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/current'],
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { tierId: string; paymentMethod: string }) => {
      return await apiRequest('/api/subscription/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      if (data.order?.orderId) {
        toast({
          title: "Payment initiated",
          description: "Complete your payment to unlock premium recruiting features.",
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
      return await apiRequest('/api/subscription/cancel', {
        method: 'POST',
      });
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

  const getIconForTier = (tierName: string) => {
    if (tierName.includes('Starter')) return <Zap className="h-6 w-6" />;
    if (tierName.includes('Professional')) return <Users className="h-6 w-6" />;
    if (tierName.includes('Enterprise')) return <Building2 className="h-6 w-6" />;
    return <Users className="h-6 w-6" />;
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

  const tiers: SubscriptionTier[] = tiersData?.tiers || [];
  const subscription = currentSubscription?.subscription;
  const isFreeTier = !subscription || !subscription.isActive;

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
            <h1 className="text-3xl font-bold mb-4">Recruiter Premium Plans</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Scale your recruiting with unlimited job postings, advanced candidate management, and AI-powered interviews.
            </p>
            
            {isFreeTier && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Free tier limits applied - Upgrade now to scale your recruiting!</span>
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

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            {tiers.map((tier) => (
              <Card 
                key={tier.id} 
                className={`relative ${tier.name.includes('Professional') ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}
              >
                {tier.name.includes('Professional') && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getIconForTier(tier.name)}
                      <div>
                        <CardTitle>{tier.name}</CardTitle>
                        <CardDescription>
                          <span className="text-2xl font-bold">${tier.price}</span>
                          <span className="text-muted-foreground">/{tier.billingCycle}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={createSubscriptionMutation.isPending || (subscription?.tier === tier.id && subscription.isActive)}
                      variant={tier.name.includes('Professional') ? "default" : "outline"}
                      size="lg"
                    >
                      {subscription?.tier === tier.id && subscription.isActive ? 'Current Plan' : 'Upgrade Now'}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Features Included</h4>
                      {tier.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Limits */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Monthly Limits</h4>
                      {tier.limits.jobPostings && (
                        <div className="flex justify-between text-sm">
                          <span>Job Postings</span>
                          <span className="font-medium">{formatLimit(tier.limits.jobPostings)}</span>
                        </div>
                      )}
                      {tier.limits.candidates && (
                        <div className="flex justify-between text-sm">
                          <span>Candidates</span>
                          <span className="font-medium">{formatLimit(tier.limits.candidates)}</span>
                        </div>
                      )}
                      {tier.limits.interviews && (
                        <div className="flex justify-between text-sm">
                          <span>Interviews</span>
                          <span className="font-medium">{formatLimit(tier.limits.interviews)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Method Selection */}
          {showPayment && selectedTier && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete Payment
                </CardTitle>
                <CardDescription>
                  Choose your payment method to unlock premium recruiting features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('paypal')}
                    className="flex-1"
                  >
                    PayPal
                  </Button>
                  <Button
                    variant={paymentMethod === 'razorpay' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('razorpay')}
                    className="flex-1"
                  >
                    Razorpay
                  </Button>
                </div>

                {paymentMethod === 'paypal' && (
                  <div className="border rounded-lg p-4">
                    <PayPalButton
                      amount={tiers.find(t => t.id === selectedTier)?.price.toString() || "0"}
                      currency="USD"
                      intent="CAPTURE"
                    />
                  </div>
                )}

                {paymentMethod === 'razorpay' && (
                  <div className="border rounded-lg p-4 text-center text-muted-foreground">
                    <p>Razorpay integration coming soon</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Benefits Showcase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Why Upgrade to Recruiter Premium?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center space-y-2">
                  <UserCheck className="h-8 w-8 mx-auto text-blue-600" />
                  <h3 className="font-semibold">AI Interview Assignments</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically screen candidates with AI-powered virtual interviews
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <Search className="h-8 w-8 mx-auto text-green-600" />
                  <h3 className="font-semibold">Unlimited Job Postings</h3>
                  <p className="text-sm text-muted-foreground">
                    Post unlimited jobs and reach the best candidates
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <BarChart3 className="h-8 w-8 mx-auto text-purple-600" />
                  <h3 className="font-semibold">Advanced Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Track hiring metrics and optimize your recruitment process
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <Headphones className="h-8 w-8 mx-auto text-orange-600" />
                  <h3 className="font-semibold">Dedicated Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Get priority support and dedicated account management
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