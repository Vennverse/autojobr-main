import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Crown, 
  Zap,
  Sparkles,
  Building2,
  Target,
  Users,
  BrainCircuit,
  Briefcase,
  Video,
  Award,
  Gift,
  Coffee,
  Globe,
  Heart,
  TrendingUp,
  Shield,
  Mail
} from "lucide-react";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";
import SimplePaymentGatewaySelector from "@/components/SimplePaymentGatewaySelector";
import RazorpaySubscriptionButton from "@/components/RazorpaySubscriptionButton";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";

interface PricingTier {
  id: string;
  name: string;
  badge: string;
  subBadge?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  yearlyDiscount?: number;
  perDayPrice?: string;
  tagline: string;
  highlights: string[];
  softClose: string;
  ctaText: string;
  isPopular?: boolean;
  isPremium?: boolean;
  isFree?: boolean;
  color: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "FREE",
    badge: "Always Free",
    monthlyPrice: 0,
    perDayPrice: "$0/day",
    tagline: "Get started with essential recruiting tools.",
    highlights: [
      "Free Career Page (Platform-Maintained)",
      "Showcase your company brand",
      "Attract quality candidates organically",
      "Post up to 3 jobs per month",
      "Basic candidate search",
      "Email support",
      "Perfect for testing the waters"
    ],
    softClose: "Great for startups and small teams exploring hiring.",
    ctaText: "Start Free Today",
    isFree: true,
    color: "gray"
  },
  {
    id: "starter",
    name: "STARTER",
    badge: "Best Value",
    subBadge: "Most Popular for Small Teams",
    monthlyPrice: 10,
    perDayPrice: "$0.33/day",
    tagline: "Essential tools for small recruiting teams.",
    highlights: [
      "Everything in FREE, plus:",
      "Free Career Page (Enhanced Features)",
      "Up to 10 active job postings",
      "AI-powered candidate matching",
      "Advanced candidate search filters",
      "Email & chat support",
      "Basic analytics dashboard",
      "Mobile app access"
    ],
    softClose: "Perfect for growing teams hiring regularly.",
    ctaText: "Get Started — $10/mo",
    isPopular: true,
    color: "green"
  },
  {
    id: "professional",
    name: "PROFESSIONAL",
    badge: "Most Popular",
    subBadge: "Cancel Anytime",
    monthlyPrice: 20,
    perDayPrice: "$0.67/day",
    tagline: "Advanced recruiting with AI-powered features.",
    highlights: [
      "Everything in STARTER, plus:",
      "Unlimited job postings",
      "Premium AI candidate scoring & ranking",
      "Automated candidate screening",
      "Video interview integration",
      "Custom assessment creation",
      "Advanced analytics & reporting",
      "Team collaboration tools",
      "Priority support",
      "API access"
    ],
    softClose: "Smart choice for professional recruiting teams.",
    ctaText: "Upgrade to Pro — $20/mo",
    isPremium: true,
    color: "blue"
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    badge: "Premium Experience",
    subBadge: "For serious hiring operations",
    monthlyPrice: 40,
    perDayPrice: "$1.33/day",
    tagline: "Complete hiring platform with white-glove service.",
    highlights: [
      "Everything in PROFESSIONAL, plus:",
      "White-label career pages",
      "Custom AI model training",
      "Advanced hiring predictions",
      "Background check integration",
      "Dedicated account manager",
      "Custom integrations & API",
      "SLA guarantees",
      "Advanced security & compliance",
      "24/7 priority phone support",
      "Onboarding & training"
    ],
    softClose: "Designed for enterprises scaling their hiring.",
    ctaText: "Contact Sales — $40/mo",
    isPremium: true,
    color: "purple"
  }
];

export default function RecruiterPremium() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<'paypal' | 'razorpay' | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Fetch user data for email
  const { data: user } = useQuery<{email?: string}>({
    queryKey: ['/api/user']
  });

  // Fetch current subscription
  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/subscription/status'],
  });

  // Set payment gateway to Razorpay for all users
  useEffect(() => {
    setPaymentGateway('razorpay');
    setIsLoadingLocation(false);
  }, []);

  const handleSelectTier = (tier: PricingTier) => {
    // For free tier, no payment needed
    if (tier.isFree) {
      toast({
        title: "Already on Free Plan!",
        description: "You're already enjoying all FREE tier benefits including your platform-maintained career page.",
      });
      return;
    }
    
    setSelectedTier(tier);
    setSelectedBillingCycle('monthly'); // Always monthly for recruiters
    setShowPaymentDialog(true);
  };
  
  const getSelectedTierId = () => {
    if (!selectedTier) return '';
    // Backend expects underscore format: recruiter_starter_monthly
    return `recruiter_${selectedTier.id}_monthly`;
  };
  
  const getSelectedPrice = () => {
    if (!selectedTier) return 0;
    return selectedTier.monthlyPrice;
  };

  const getCardGlow = (color: string) => {
    const glowMap = {
      green: "shadow-lg shadow-green-500/20 border-green-500/50",
      gray: "shadow-sm border-gray-300/50",
      blue: "shadow-lg shadow-blue-500/20 border-blue-500/50",
      purple: "shadow-lg shadow-purple-500/20 border-purple-500/50"
    };
    return glowMap[color as keyof typeof glowMap] || "";
  };

  const getBadgeVariant = (color: string) => {
    if (color === "green") return "default";
    if (color === "blue") return "secondary";
    return "outline";
  };

  const currentPlanType = subscriptionData?.subscription?.planType || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20" data-testid="recruiter-premium-page">
      <RecruiterNavbar />
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-10 h-10 text-yellow-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent" data-testid="text-page-title">
              Recruiter Premium Plans
            </h1>
          </div>
          <p className="text-xl text-muted-foreground" data-testid="text-page-description">
            Find and hire the best talent with AI-powered recruiting tools
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Coffee className="w-4 h-4" />
            <span className="font-medium">Starting at just $0.33/day — less than a coffee</span>
          </div>
        </div>

        {/* Current Subscription Status */}
        {subscriptionData && currentPlanType !== 'free' && (
          <Card className="max-w-2xl mx-auto border-primary/50 bg-primary/5" data-testid="card-current-subscription">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Active Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Current Plan:</span>
                    <Badge data-testid="badge-current-plan">{currentPlanType.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge 
                      variant={subscriptionData.subscription?.subscriptionStatus === 'active' ? 'default' : 'secondary'} 
                      data-testid="badge-subscription-status"
                    >
                      {subscriptionData.subscription?.subscriptionStatus || 'active'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Billing Only for Recruiters */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">Monthly Billing</Badge>
          <span>•</span>
          <span>Cancel Anytime</span>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => {
            // Convert tier.id to backend format for comparison
            const backendTierId = tier.isFree ? 'free' : `recruiter_${tier.id}_monthly`;
            const isCurrentPlan = currentPlanType === backendTierId || currentPlanType === tier.id;
            const displayPrice = tier.monthlyPrice;
            const priceLabel = 'month';

            return (
              <Card 
                key={tier.id}
                className={`relative transition-all duration-300 hover:scale-105 ${
                  tier.isPopular ? `${getCardGlow(tier.color)} scale-105` : 'border-muted'
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-tier-${tier.id}`}
              >
                {/* Popular Badge */}
                {tier.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 text-sm font-semibold" data-testid="badge-most-popular">
                      <Sparkles className="w-3 h-3 mr-1 inline" />
                      MOST POPULAR
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 right-4 bg-primary" data-testid="badge-your-plan">
                    Your Plan
                  </Badge>
                )}

                <CardHeader className="space-y-4 pt-8">
                  {/* Plan Name */}
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-center" data-testid={`text-tier-name-${tier.id}`}>
                      {tier.name}
                    </CardTitle>
                    <div className="text-center">
                      <Badge variant={getBadgeVariant(tier.color)} className="text-xs" data-testid={`badge-plan-${tier.id}`}>
                        {tier.badge}
                      </Badge>
                    </div>
                    {tier.subBadge && (
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400" data-testid={`sub-badge-${tier.id}`}>
                          {tier.subBadge}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center space-y-1">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold" data-testid={`text-price-${tier.id}`}>
                        ${displayPrice}
                      </span>
                      {!tier.isFree && <span className="text-muted-foreground text-lg">/ {priceLabel}</span>}
                    </div>
                    {tier.perDayPrice && (
                      <p className="text-sm text-muted-foreground">{tier.perDayPrice}</p>
                    )}
                  </div>

                  {/* Tagline */}
                  <CardDescription className="text-center text-base font-medium" data-testid={`text-tagline-${tier.id}`}>
                    {tier.tagline}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Separator />

                  {/* Highlights */}
                  <div className="space-y-3">
                    {tier.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-2" data-testid={`highlight-${tier.id}-${idx}`}>
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Soft Close */}
                  <p className="text-sm text-center text-muted-foreground italic" data-testid={`text-soft-close-${tier.id}`}>
                    {tier.softClose}
                  </p>

                  {/* CTA Button */}
                  {!isCurrentPlan ? (
                    <Button 
                      className={`w-full h-12 text-base font-semibold ${
                        tier.isFree ? 'bg-gray-600 hover:bg-gray-700' :
                        tier.isPopular ? 'bg-green-600 hover:bg-green-700' : 
                        tier.isPremium ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                      onClick={() => handleSelectTier(tier)}
                      data-testid={`button-select-${tier.id}`}
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      {tier.ctaText}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full h-12"
                      variant="outline"
                      disabled
                      data-testid="button-current-plan"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Your Current Plan
                    </Button>
                  )}

                  {!tier.isFree && (
                    <p className="text-xs text-center text-muted-foreground">
                      Auto-renew • Cancel anytime
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Free Career Page Highlight */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-green-500/5 to-blue-500/5 border-green-500/20" data-testid="card-free-career-page">
          <CardContent className="py-8">
            <div className="flex items-start gap-4">
              <Globe className="w-12 h-12 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  FREE Career Page For All Plans
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Platform-Maintained
                  </Badge>
                </h3>
                <p className="text-muted-foreground mb-4">
                  Every plan includes a beautiful, professional career page maintained by our platform. 
                  Showcase your company brand, culture, and open positions to attract quality candidates organically — no extra cost!
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Customizable Branding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Always Up-to-Date</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    <span className="text-sm">SEO Optimized</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Boost Strip */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20" data-testid="card-conversion-boost">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold text-center mb-6">
              Why Top Recruiters Choose AutoJobr:
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">"Hire 3× Faster with AI"</p>
                  <p className="text-sm text-muted-foreground mt-1">Average recruiter fills positions 65% faster with AI-powered matching.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Unbeatable Value</p>
                  <p className="text-sm text-muted-foreground mt-1">Competitors charge 5–10× more for similar features.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Proven ROI</p>
                  <p className="text-sm text-muted-foreground mt-1">Professional tier users report 40% higher quality hires.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Risk-Free</p>
                  <p className="text-sm text-muted-foreground mt-1">Cancel anytime. No hidden fees. No commitments.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Showcase */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8">What You Get With Premium</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <BrainCircuit className="w-10 h-10 text-primary mb-2" />
                <CardTitle>AI-Powered Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced AI algorithms match your jobs with the perfect candidates automatically.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Video className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Video Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Conduct one-way and live video interviews directly through the platform.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track hiring metrics, candidate quality, and optimize your recruiting process.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-payment">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Complete Your Subscription
            </DialogTitle>
            <DialogDescription>
              You've selected: <strong>{selectedTier?.name}</strong> at ${getSelectedPrice()}/month
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {isLoadingLocation ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Setting up payment...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <label className="text-sm font-medium">Select Payment Method:</label>
                  <SimplePaymentGatewaySelector
                    selectedGateway={paymentGateway}
                    onGatewayChange={setPaymentGateway}
                  />
                </div>

                {paymentGateway === 'paypal' && user?.email && selectedTier && (
                  <PayPalSubscriptionButton
                    tierId={getSelectedTierId()}
                    amount={getSelectedPrice().toString()}
                    currency="USD"
                    planName={selectedTier.name}
                    userType="recruiter"
                    onSuccess={() => {
                      toast({
                        title: "Subscription Activated!",
                        description: "Welcome to premium! Your features are now unlocked.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                      setShowPaymentDialog(false);
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

                {paymentGateway === 'razorpay' && selectedTier && user?.email && (
                  <RazorpaySubscriptionButton
                    tierId={getSelectedTierId()}
                    tierName={selectedTier.name}
                    price={getSelectedPrice()}
                    userEmail={user.email}
                    onSuccess={() => {
                      toast({
                        title: "Subscription Activated!",
                        description: "Welcome to premium! Your features are now unlocked.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                      setShowPaymentDialog(false);
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
