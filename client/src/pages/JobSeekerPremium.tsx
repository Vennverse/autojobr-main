import { useState } from "react";
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
  Calendar,
  TrendingUp,
  Target,
  BarChart3,
  FileText,
  Briefcase,
  Chrome,
  Video,
  MessageSquare,
  Award,
  Gift,
  Coffee,
  Star
} from "lucide-react";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import RazorpaySubscriptionButton from "@/components/RazorpaySubscriptionButton";
import { useEffect } from "react";

interface PricingTier {
  id: string;
  name: string;
  badge: string;
  subBadge?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  yearlyDiscount?: number;
  perDayPrice: string;
  tagline: string;
  highlights: string[];
  softClose: string;
  ctaText: string;
  isPopular?: boolean;
  isPremium?: boolean;
  color: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "monthly-access",
    name: "MONTHLY ACCESS",
    badge: "⚡ Flexible Plan",
    monthlyPrice: 19,
    perDayPrice: "$0.63/day",
    tagline: "Try full access for a month — no subscription.",
    highlights: [
      "Same AI tools & Resume Builder as Smart Saver",
      "Ideal for quick job hunts or interview prep",
      "Upgrade anytime to Smart Saver and save 30%",
      "Full access — no auto-renew hassle"
    ],
    softClose: "For users testing the waters before committing.",
    ctaText: "Start Monthly — $19",
    color: "yellow"
  },
  {
    id: "smart-saver",
    name: "SMART SAVER",
    badge: "🏷️ Most Popular · Smart Saver",
    subBadge: "💚 Save $72/year — Cancel Anytime",
    monthlyPrice: 13,
    yearlyPrice: 130,
    yearlyDiscount: 26,
    perDayPrice: "$0.43/day",
    tagline: "Everything you need to get hired — faster.",
    highlights: [
      "Unlimited Resumes & Job Tracking",
      "AI Resume & Cover Letter Builder",
      "LinkedIn & ATS Optimization",
      "Chrome Extension for One-Click Apply",
      "Interview Practice Tools",
      "72% of users got interviews within 3 weeks",
      "Cancel Anytime — No Hidden Fees"
    ],
    softClose: "Smart choice for job seekers who mean business.",
    ctaText: "Get Started — $13/mo",
    isPopular: true,
    color: "green"
  },
  {
    id: "ultra-plan",
    name: "ULTRA PLAN",
    badge: "💎 Premium Experience",
    subBadge: "✨ For serious professionals",
    monthlyPrice: 24,
    yearlyPrice: 240,
    yearlyDiscount: 48,
    perDayPrice: "$0.80/day",
    tagline: "Go beyond applications — accelerate your entire career.",
    highlights: [
      "Everything in Smart Saver, plus:",
      "Unlimited AI Applications & Mock Interviews",
      "Video Interview Prep + AI Feedback",
      "Career Analytics & Salary Coach",
      "Priority Referrals & Early Job Access",
      "Career Planning & Growth Tracker",
      "24-hour Priority Support"
    ],
    softClose: "Designed for ambitious professionals & career switchers.",
    ctaText: "Upgrade to Ultra — $24/mo",
    isPremium: true,
    color: "blue"
  }
];

export default function JobSeekerPremium() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<'paypal' | 'razorpay' | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch user data for email
  const { data: user } = useQuery<{email?: string}>({
    queryKey: ['/api/user']
  });

  // Fetch current subscription
  const { data: currentSubscription } = useQuery({
    queryKey: ['/api/subscription/current'],
  });

  // Set payment gateway to Razorpay for all users
  useEffect(() => {
    setPaymentGateway('razorpay');
    setIsLoadingLocation(false);
  }, []);

  const handleSelectTier = (tier: PricingTier) => {
    setSelectedTier(tier);
    setSelectedBillingCycle(billingCycle);
    setShowPaymentDialog(true);
  };
  
  const getSelectedTierId = () => {
    if (!selectedTier) return '';
    // For monthly-access, always use monthly tier ID
    if (selectedTier.id === 'monthly-access') return selectedTier.id;
    // For other tiers, append billing cycle
    return selectedBillingCycle === 'yearly' ? `${selectedTier.id}-yearly` : `${selectedTier.id}-monthly`;
  };
  
  const getSelectedPrice = () => {
    if (!selectedTier) return 0;
    return selectedBillingCycle === 'yearly' && selectedTier.yearlyPrice 
      ? selectedTier.yearlyPrice 
      : selectedTier.monthlyPrice;
  };

  const getCardGlow = (color: string) => {
    const glowMap = {
      green: "shadow-lg shadow-green-500/20 border-green-500/50",
      yellow: "shadow-md shadow-yellow-500/10 border-yellow-500/30",
      blue: "shadow-lg shadow-blue-500/20 border-blue-500/50"
    };
    return glowMap[color as keyof typeof glowMap] || "";
  };

  const getBadgeVariant = (color: string) => {
    if (color === "green") return "default";
    if (color === "blue") return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20" data-testid="jobseeker-premium-page">
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-10 h-10 text-yellow-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent" data-testid="text-page-title">
              Premium Job Seeker Plans
            </h1>
          </div>
          <p className="text-xl text-muted-foreground" data-testid="text-page-description">
            Accelerate your job search with AI-powered tools and premium features
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Coffee className="w-4 h-4" />
            <span className="font-medium">Just $0.43/day — less than a coffee</span>
          </div>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
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
                    <Badge data-testid="badge-current-plan">{currentSubscription.tierName || 'Premium'}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge 
                      variant={currentSubscription.status === 'active' ? 'default' : 'secondary'} 
                      data-testid="badge-subscription-status"
                    >
                      {currentSubscription.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('monthly')}
            data-testid="button-toggle-monthly"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('yearly')}
            data-testid="button-toggle-yearly"
          >
            Yearly
            <Badge variant="secondary" className="ml-2">Save up to $72</Badge>
          </Button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const isCurrentPlan = currentSubscription?.tierName?.toLowerCase().includes(tier.name.toLowerCase());
            const displayPrice = billingCycle === 'yearly' && tier.yearlyPrice ? tier.yearlyPrice : tier.monthlyPrice;
            const priceLabel = billingCycle === 'yearly' ? 'year' : 'month';

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
                      ⭐ MOST POPULAR
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
                      <span className="text-muted-foreground text-lg">/ {priceLabel}</span>
                    </div>
                    {billingCycle === 'yearly' && tier.yearlyDiscount && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Save ${tier.yearlyDiscount}/year
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">{tier.perDayPrice} — {tier.id === 'monthly-access' ? 'great for quick goals' : tier.id === 'smart-saver' ? 'less than a coffee' : 'premium results, affordable rate'}</p>
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
                        tier.isPopular ? 'bg-green-600 hover:bg-green-700' : 
                        tier.isPremium ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                      onClick={() => handleSelectTier(tier)}
                      data-testid={`button-select-${tier.id}`}
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      {tier.id === 'monthly-access' 
                        ? tier.ctaText 
                        : billingCycle === 'yearly' && tier.yearlyPrice
                          ? `Get Started — $${tier.yearlyPrice}/yr`
                          : tier.ctaText}
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

                  {tier.id === 'monthly-access' && (
                    <p className="text-xs text-center text-muted-foreground">
                      One-time payment • No auto-renew
                    </p>
                  )}
                  {(tier.id === 'smart-saver' || tier.id === 'ultra-plan') && (
                    <p className="text-xs text-center text-muted-foreground">
                      Auto-renew • Cancel anytime
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Conversion Boost Strip */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20" data-testid="card-conversion-boost">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold text-center mb-6">
              Why 78% choose AutoJobr:
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">"More tools. More ROI. More interviews."</p>
                  <p className="text-sm text-muted-foreground mt-1">Average user applies to 5× more jobs and lands interviews 3× faster.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Best Value in the Market</p>
                  <p className="text-sm text-muted-foreground mt-1">Competitors charge 2–3× more for fewer features.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Proven Results</p>
                  <p className="text-sm text-muted-foreground mt-1">Smart Saver users say it paid for itself in their first interview.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg">Risk-Free Trial</p>
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
                <FileText className="w-10 h-10 text-primary mb-2" />
                <CardTitle>AI Resume Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create ATS-optimized resumes with AI assistance. Stand out from the crowd.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Chrome className="w-10 h-10 text-primary mb-2" />
                <CardTitle>One-Click Apply</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Chrome extension to apply to jobs in seconds. Save hours of manual work.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Video className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Interview Prep</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Practice with AI mock interviews and get instant feedback on your performance.
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
              You've selected: <strong>{selectedTier?.name}</strong> at ${getSelectedPrice()}/{selectedBillingCycle === 'yearly' ? 'year' : 'month'}
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
                  <PaymentGatewaySelector
                    selectedGateway={paymentGateway}
                    onGatewayChange={setPaymentGateway}
                  />
                </div>

                {paymentGateway === 'paypal' && user?.email && selectedTier && (
                  <PayPalSubscriptionButton
                    tierId={getSelectedTierId()}
                    userEmail={user.email}
                    onSuccess={() => {
                      toast({
                        title: "🎉 Subscription Activated!",
                        description: "Welcome to premium! Your features are now unlocked.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
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

                {paymentGateway === 'razorpay' && selectedTier && (
                  <RazorpaySubscriptionButton
                    tierId={getSelectedTierId()}
                    onSuccess={() => {
                      toast({
                        title: "🎉 Subscription Activated!",
                        description: "Welcome to premium! Your features are now unlocked.",
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
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
