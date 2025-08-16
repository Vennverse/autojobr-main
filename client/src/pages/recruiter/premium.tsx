import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Crown, Check, X, Target, Users, BrainCircuit, Zap, Building2, Mail, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";

interface RecruiterSubscriptionData {
  subscription: {
    planType: string;
    subscriptionStatus: string;
    subscriptionEndDate?: string;
  };
  usage: {
    jobPostings: number;
    premiumTargeting: number;
    candidateMessages: number;
    resumeViews: number;
  };
  limits: {
    jobPostings: number;
    premiumTargeting: number;
    candidateMessages: number;
    resumeViews: number;
  } | null;
}

export default function RecruiterPremium() {
  const { toast } = useToast();
  const [pendingTargetingJob, setPendingTargetingJob] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal' | 'razorpay'>('paypal');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check for pending targeting job from Premium Targeting page
  useEffect(() => {
    const pending = localStorage.getItem('pendingTargetingJob');
    if (pending) {
      setPendingTargetingJob(JSON.parse(pending));
    }
  }, []);

  const { data: subscriptionData, isLoading } = useQuery<RecruiterSubscriptionData>({
    queryKey: ['/api/subscription/status'],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest('/api/subscription/upgrade', 'POST', paymentData);
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      
      // If there's a pending targeting job, create it now
      if (pendingTargetingJob) {
        try {
          await apiRequest('/api/jobs/targeted', 'POST', pendingTargetingJob);
          localStorage.removeItem('pendingTargetingJob');
          toast({
            title: "Premium Targeting Job Created!",
            description: `Your targeted job posting "${pendingTargetingJob.title}" is now live with premium targeting.`,
          });
          // Redirect to dashboard
          window.location.href = '/';
        } catch (error) {
          toast({
            title: "Job Creation Failed", 
            description: "Premium subscription activated but job creation failed. Please try posting again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Upgraded Successfully!",
          description: "Welcome to AutoJobr Premium for Recruiters! Enjoy unlimited access to all features.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/subscription/cancel', 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled. You'll retain premium features until the end of your billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStripePayment = async () => {
    try {
      const response = await apiRequest('/api/payments/stripe/create-checkout', 'POST', {
        amount: 4900, // $49 in cents
        currency: 'usd',
        userType: 'recruiter'
      });
      
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('Failed to create Stripe checkout session');
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw error;
    }
  };

  const handlePayPalPayment = async () => {
    try {
      const response = await apiRequest('/api/payments/paypal/create-order', 'POST', {
        amount: '49.00',
        currency: 'USD',
        userType: 'recruiter'
      });
      
      if (response.approvalUrl) {
        window.location.href = response.approvalUrl;
      } else {
        throw new Error('Failed to create PayPal order');
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      throw error;
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const response = await apiRequest('/api/payments/razorpay/create-order', 'POST', {
        amount: 4900, // $49 in cents
        currency: 'USD',
        userType: 'recruiter'
      });
      
      if (response.order_id) {
        // Initialize Razorpay checkout
        const options = {
          key: response.key_id,
          amount: response.amount,
          currency: response.currency,
          order_id: response.order_id,
          name: 'AutoJobr Premium',
          description: 'Recruiter Premium Subscription',
          handler: function (response: any) {
            upgradeMutation.mutate({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: 'razorpay',
              amount: 49
            });
          },
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error('Razorpay payment error:', error);
      throw error;
    }
  };

  const handleUpgrade = async () => {
    setIsProcessingPayment(true);
    
    try {
      if (selectedPaymentMethod === 'stripe') {
        await handleStripePayment();
      } else if (selectedPaymentMethod === 'paypal') {
        await handlePayPalPayment();
      } else if (selectedPaymentMethod === 'razorpay') {
        await handleRazorpayPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (used: number, limit: number) => {
    if (limit === -1) return "bg-green-500"; // Unlimited
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <RecruiterNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPremium = subscriptionData?.subscription.planType === 'premium';
  const isActive = subscriptionData?.subscription.subscriptionStatus === 'active';

  return (
    <div className="min-h-screen bg-background">
      <RecruiterNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Recruiter Premium</h1>
            <p className="text-muted-foreground text-lg">
              Unlock powerful recruiting tools and unlimited access to premium features
            </p>
          </div>

          {/* Premium Targeting Notification */}
          {pendingTargetingJob && (
            <Card className="mb-6 border-purple-200 bg-purple-50 dark:bg-purple-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-purple-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Premium Targeting Job Pending</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                      Job "{pendingTargetingJob.title}" ready to post with premium targeting for ${pendingTargetingJob.estimatedCost}. 
                      Upgrade to Premium to activate targeted candidate matching.
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    ${pendingTargetingJob.estimatedCost}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Current Plan Status */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>
                    Your current subscription status and usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge variant={isPremium && isActive ? "default" : "secondary"}>
                        {isPremium && isActive ? "Premium" : "Basic"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Price</span>
                      <span className="text-lg font-bold">
                        {isPremium ? "$49/month" : "Free"}
                      </span>
                    </div>

                    {subscriptionData?.subscription.subscriptionEndDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Renewal</span>
                        <span className="text-sm">
                          {new Date(subscriptionData.subscription.subscriptionEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <Separator />

                    {/* Usage Statistics */}
                    {subscriptionData?.usage && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Usage This Month</h4>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Job Postings</span>
                            <span>{subscriptionData.usage.jobPostings}/{subscriptionData.limits?.jobPostings === -1 ? '∞' : subscriptionData.limits?.jobPostings}</span>
                          </div>
                          <Progress 
                            value={getUsagePercentage(subscriptionData.usage.jobPostings, subscriptionData.limits?.jobPostings || 0)} 
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Premium Targeting</span>
                            <span>{subscriptionData.usage.premiumTargeting}/{subscriptionData.limits?.premiumTargeting === -1 ? '∞' : subscriptionData.limits?.premiumTargeting}</span>
                          </div>
                          <Progress 
                            value={getUsagePercentage(subscriptionData.usage.premiumTargeting, subscriptionData.limits?.premiumTargeting || 0)} 
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Resume Views</span>
                            <span>{subscriptionData.usage.resumeViews}/{subscriptionData.limits?.resumeViews === -1 ? '∞' : subscriptionData.limits?.resumeViews}</span>
                          </div>
                          <Progress 
                            value={getUsagePercentage(subscriptionData.usage.resumeViews, subscriptionData.limits?.resumeViews || 0)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    )}

                    {isPremium && isActive && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => cancelMutation.mutate()}
                        className="w-full"
                        disabled={cancelMutation.isPending}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Premium Plan Features */}
            <div className="lg:col-span-2">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Crown className="h-6 w-6 text-amber-500" />
                    Premium Plan
                    <Badge className="bg-amber-100 text-amber-800">Most Popular</Badge>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Everything you need to find and hire the best talent
                  </CardDescription>
                  <div className="text-3xl font-bold text-blue-600">
                    $49<span className="text-lg font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Core Features */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        Core Features
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Unlimited job postings
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Unlimited candidate applications
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Advanced resume analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Background check integration
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Priority support
                        </li>
                      </ul>
                    </div>

                    {/* Premium Features */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-purple-500" />
                        AI-Powered Features
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Premium targeting & AI matching
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Automated candidate screening
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Custom assessment creation
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Advanced analytics dashboard
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          API access & integrations
                        </li>
                      </ul>
                    </div>
                  </div>

                  {!isPremium && (
                    <>
                      <Separator className="mb-6" />
                      
                      {/* Payment Methods */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Choose Payment Method</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            variant={selectedPaymentMethod === 'paypal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedPaymentMethod('paypal')}
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            PayPal
                          </Button>
                          <Button
                            variant={selectedPaymentMethod === 'stripe' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedPaymentMethod('stripe')}
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Stripe
                          </Button>
                          <Button
                            variant={selectedPaymentMethod === 'razorpay' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedPaymentMethod('razorpay')}
                            className="flex items-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Razorpay
                          </Button>
                        </div>

                        {/* Payment Button */}
                        {selectedPaymentMethod === 'paypal' ? (
                          <PayPalSubscriptionButton
                            tierId="recruiter-premium"
                            amount="49.00"
                            currency="USD"
                            planName="Recruiter Premium"
                            userType="recruiter"
                            onSuccess={(data) => {
                              upgradeMutation.mutate({
                                paypalOrderId: data.orderId,
                                paymentMethod: 'paypal',
                                amount: 49
                              });
                            }}
                            onError={(error) => {
                              toast({
                                title: "Payment Failed",
                                description: error.message || "PayPal payment failed. Please try again.",
                                variant: "destructive",
                              });
                            }}
                            className="w-full"
                          />
                        ) : (
                          <Button
                            onClick={handleUpgrade}
                            disabled={isProcessingPayment || upgradeMutation.isPending}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            size="lg"
                          >
                            {isProcessingPayment || upgradeMutation.isPending ? (
                              <>Processing...</>
                            ) : (
                              <>
                                <Crown className="w-5 h-5 mr-2" />
                                Upgrade to Premium - $49/month
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
              <CardDescription>
                See what's included in each plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-center py-3 px-4">Basic (Free)</th>
                      <th className="text-center py-3 px-4">Premium ($49/mo)</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b">
                      <td className="py-3 px-4">Job Postings</td>
                      <td className="text-center py-3 px-4">2 active jobs</td>
                      <td className="text-center py-3 px-4">
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                        Unlimited
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Applicants per Job</td>
                      <td className="text-center py-3 px-4">20 applicants</td>
                      <td className="text-center py-3 px-4">
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                        Unlimited
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Premium Targeting</td>
                      <td className="text-center py-3 px-4">
                        <X className="h-4 w-4 text-red-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Custom Assessments</td>
                      <td className="text-center py-3 px-4">
                        <X className="h-4 w-4 text-red-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Advanced Analytics</td>
                      <td className="text-center py-3 px-4">Basic</td>
                      <td className="text-center py-3 px-4">
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                        Advanced
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">API Access</td>
                      <td className="text-center py-3 px-4">
                        <X className="h-4 w-4 text-red-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Priority Support</td>
                      <td className="text-center py-3 px-4">
                        <X className="h-4 w-4 text-red-500 mx-auto" />
                      </td>
                      <td className="text-center py-3 px-4">
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}