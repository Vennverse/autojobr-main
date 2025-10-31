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
  Zap,
  CreditCard,
  Calendar,
  TrendingUp,
  Search,
  BarChart3,
  Target
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import UsageMonitoringWidget from "@/components/UsageMonitoringWidget";
import RazorpaySubscriptionButton from "@/components/RazorpaySubscriptionButton";
import { useEffect } from "react";

interface JobSeekerSubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  userType: 'jobseeker';
  features: string[];
  limits: {
    applications?: number;
    interviews?: number;
  };
}

export default function JobSeekerPremium() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paypal'>('paypal');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<'paypal' | 'razorpay' | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Fetch user data for email
  const { data: user } = useQuery<{email?: string}>({
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

  // Set payment gateway to Razorpay for all users (supports international payments)
  useEffect(() => {
    setPaymentGateway('razorpay');
    setIsLoadingLocation(false);
  }, []);

  const tiers: JobSeekerSubscriptionTier[] = tiersData || [];

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    setShowPayment(true);
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('applications')) return <Target className="w-4 h-4" />;
    if (feature.toLowerCase().includes('analytics')) return <BarChart3 className="w-4 h-4" />;
    if (feature.toLowerCase().includes('search')) return <Search className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  if (tiersLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading premium plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="jobseeker-premium-page">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          <h1 className="text-4xl font-bold" data-testid="text-page-title">Premium Job Seeker Plans</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-page-description">
          Supercharge your job search with premium features and unlimited applications
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="border-primary" data-testid="card-current-subscription">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium" data-testid="text-current-plan">Plan:</span>
                <Badge data-testid="badge-current-plan">{currentSubscription.tierName || 'Premium'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'} data-testid="badge-subscription-status">
                  {currentSubscription.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Monitoring Widget */}
      <UsageMonitoringWidget />

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isCurrentPlan = currentSubscription?.tierId === tier.id;
          const isPopular = tier.name.toLowerCase().includes('professional') || tier.name.toLowerCase().includes('pro');

          return (
            <Card 
              key={tier.id} 
              className={`relative ${isPopular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              data-testid={`card-tier-${tier.id}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" data-testid="badge-popular">
                  Most Popular
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4" variant="secondary" data-testid="badge-current">
                  Current Plan
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="text-2xl" data-testid={`text-tier-name-${tier.id}`}>{tier.name}</CardTitle>
                <CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold" data-testid={`text-tier-price-${tier.id}`}>
                      {tier.currency === 'INR' ? '₹' : '$'}{tier.price}
                    </span>
                    <span className="text-muted-foreground">/{tier.billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Separator />
                
                {/* Features List */}
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-muted-foreground">Features included:</p>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2" data-testid={`feature-${tier.id}-${index}`}>
                        {getFeatureIcon(feature)}
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limits */}
                {tier.limits && Object.keys(tier.limits).length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm text-muted-foreground">Limits:</p>
                    <ul className="space-y-1">
                      {tier.limits.applications && (
                        <li className="flex items-center gap-2 text-sm" data-testid={`limit-applications-${tier.id}`}>
                          <TrendingUp className="w-4 h-4" />
                          <span>{tier.limits.applications === -1 ? 'Unlimited' : tier.limits.applications} applications</span>
                        </li>
                      )}
                      {tier.limits.interviews && (
                        <li className="flex items-center gap-2 text-sm" data-testid={`limit-interviews-${tier.id}`}>
                          <Calendar className="w-4 h-4" />
                          <span>{tier.limits.interviews === -1 ? 'Unlimited' : tier.limits.interviews} mock interviews</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <Separator />

                {/* CTA Button */}
                {!isCurrentPlan ? (
                  <Button 
                    className="w-full"
                    onClick={() => handleSelectTier(tier.id)}
                    data-testid={`button-select-tier-${tier.id}`}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to {tier.name}
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    variant="secondary"
                    disabled
                    data-testid="button-current-plan"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Your Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Section */}
      {showPayment && selectedTier && (
        <Card className="border-primary" data-testid="card-payment-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Complete Your Subscription
            </CardTitle>
            <CardDescription>
              Select your payment method to activate your premium plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingLocation ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Detecting your location...</p>
              </div>
            ) : (
              <>
                <PaymentGatewaySelector
                  selectedGateway={paymentGateway}
                  onGatewayChange={setPaymentGateway}
                />

                {paymentGateway === 'paypal' && user?.email && (
                  <PayPalSubscriptionButton
                    tierId={selectedTier}
                    userEmail={user.email}
                    onSuccess={() => {
                      toast({
                        title: "Subscription Activated! 🎉",
                        description: "Your premium features are now available.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                      setShowPayment(false);
                    }}
                    onError={(error) => {
                      toast({
                        title: "Payment Failed",
                        description: error,
                        variant: "destructive",
                      });
                    }}
                  />
                )}

                {paymentGateway === 'razorpay' && (
                  <RazorpaySubscriptionButton
                    tierId={selectedTier}
                    onSuccess={() => {
                      toast({
                        title: "Subscription Activated! 🎉",
                        description: "Your premium features are now available.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                      setShowPayment(false);
                    }}
                    onError={(error) => {
                      toast({
                        title: "Payment Failed",
                        description: error,
                        variant: "destructive",
                      });
                    }}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefits Section */}
      <Card data-testid="card-benefits">
        <CardHeader>
          <CardTitle>Why Go Premium?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <Target className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Unlimited Applications</h3>
                <p className="text-sm text-muted-foreground">Apply to as many jobs as you want without restrictions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <BarChart3 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Advanced Analytics</h3>
                <p className="text-sm text-muted-foreground">Track your application success rate and optimize your strategy</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Search className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Priority Job Matches</h3>
                <p className="text-sm text-muted-foreground">Get matched with the best opportunities first</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Tools</h3>
                <p className="text-sm text-muted-foreground">Access resume optimization and cover letter generation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
