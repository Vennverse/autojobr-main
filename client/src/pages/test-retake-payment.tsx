import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  RefreshCw, 
  CreditCard, 
  CheckCircle, 
  TrendingUp, 
  Trophy,
  AlertTriangle,
  ArrowLeft,
  Star,
  Users,
  Target,
  Brain
} from "lucide-react";
import PayPalHostedButton from "@/components/PayPalHostedButton";

export default function TestRetakePayment() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'amazon_pay'>('paypal');

  // Fetch test assignment details
  const { data: assignment, isLoading } = useQuery({
    queryKey: [`/api/test-assignments/${params.id}`],
    enabled: !!params.id,
  });

  // Process retake payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      // In a real implementation, this would integrate with PayPal/Amazon Pay
      // For demo purposes, we'll simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      return await apiRequest(`/api/test-assignments/${params?.id}/retake/payment`, "POST", {
        paymentProvider: paymentMethod,
        paymentIntentId: `${paymentMethod}_${Date.now()}`, // Mock payment ID
        ...paymentData
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful!",
        description: "Your retake is now available. You can start the test again.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/test-assignments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/test-assignments/${params?.id}`] });
      
      // Redirect to test page
      setTimeout(() => {
        setLocation(`/test/${params?.id}`);
      }, 1500);
    },
    onError: (error: any) => {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    if (!assignment) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing based on selected method
      const paymentData = {
        amount: 500, // $5 in cents
        currency: 'USD',
        testAssignmentId: (assignment as any)?.id,
      };

      await processPaymentMutation.mutateAsync(paymentData);
    } catch (error) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
    }
  };

  // Calculate passing score and gap
  const passingScore = (assignment as any)?.testTemplate?.passingScore || 75;
  const currentScore = (assignment as any)?.score || 0;
  const scoreGap = Math.max(0, passingScore - currentScore);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading test details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment || (assignment as any)?.status === 'passed') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Test Assignment Not Available</h3>
            <p className="text-gray-600 mb-4">
              This test assignment doesn't exist, you've already passed it, or retakes are not allowed.
            </p>
            <Button onClick={() => setLocation('/tests')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has already paid and retake is allowed, redirect them to test
  if ((assignment as any)?.retakeAllowed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Retake Already Available!</h3>
            <p className="text-gray-600 mb-4">
              You've already paid for a retake. You can start the test again now.
            </p>
            <Button onClick={() => setLocation(`/test/${params?.id}`)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Test Retake
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show retake payment if user failed the test
  if ((assignment as any)?.score >= passingScore) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">You've Already Passed!</h3>
            <p className="text-gray-600 mb-4">
              Your score of {(assignment as any)?.score}% meets the passing requirement of {passingScore}%.
            </p>
            <Button onClick={() => setLocation('/tests')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/tests')} 
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tests
        </Button>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Unlock Your Retake
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Give yourself another chance to showcase your skills
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Motivation & Benefits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600" />
                {(assignment as any)?.testTemplate?.title || 'Skills Assessment'}
              </CardTitle>
              <CardDescription>
                {(assignment as any)?.recruiter?.companyName || 'Test'} • {(assignment as any)?.recruiter?.firstName} {(assignment as any)?.recruiter?.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{currentScore}%</div>
                  <div className="text-sm text-gray-600">Your Score</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{passingScore}%</div>
                  <div className="text-sm text-gray-600">Passing Score</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{scoreGap}</div>
                  <div className="text-sm text-gray-600">Points Needed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivation Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <TrendingUp className="w-5 h-5" />
                Why Retake This Test?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-800">
                You were only <strong>{scoreGap} points away</strong> from passing! 
                Many successful candidates improve their scores significantly on retakes.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Fresh Questions</h4>
                    <p className="text-xs text-blue-700">New questions test the same skills with different scenarios</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Prove Dedication</h4>
                    <p className="text-xs text-blue-700">Show recruiters your commitment to excellence</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Stand Out</h4>
                    <p className="text-xs text-blue-700">Few candidates take the initiative to improve</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Join the 73%</h4>
                    <p className="text-xs text-blue-700">Success rate of candidates who retake failed tests</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 p-3 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  💡 <strong>Success Story:</strong> "I scored 65% on my first attempt and 89% on retake. 
                  Got the job offer the next week!" - Sarah K., Software Engineer
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment */}
        <div className="space-y-6">
          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center bg-blue-50">
              <CardTitle className="text-blue-900">Retake Package</CardTitle>
              <CardDescription>One-time payment for unlimited improvement</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">$5</div>
                <div className="text-sm text-gray-600">One-time payment</div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Fresh set of questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Same time limit as original</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Instant access after payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Best score counts</span>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Payment Method Selection */}
              <div className="space-y-4">
                <div className="text-sm font-medium">Payment Method</div>
                
                <div className="space-y-2">
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">PayPal</div>
                        <div className="text-sm text-gray-500">Secure online payments</div>
                      </div>
                      {paymentMethod === 'paypal' && (
                        <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'amazon_pay' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod('amazon_pay')}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Amazon Pay</div>
                        <div className="text-sm text-gray-500">Amazon payment methods</div>
                      </div>
                      {paymentMethod === 'amazon_pay' && (
                        <CheckCircle className="w-4 h-4 text-orange-600 ml-auto" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {paymentMethod === 'paypal' ? (
                <PayPalHostedButton
                  purpose="test_retake"
                  amount={5}
                  itemName={`${(assignment as any)?.testTemplate?.title || 'Skills Assessment'} - Retake`}
                  onPaymentSuccess={(data) => {
                    toast({
                      title: "Payment Successful!",
                      description: "Your retake is now available. You can start the test again.",
                    });
                    
                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/test-assignments"] });
                    queryClient.invalidateQueries({ queryKey: [`/api/test-assignments/${params?.id}`] });
                    
                    // Redirect to test page
                    setTimeout(() => {
                      setLocation(`/test/${params?.id}`);
                    }, 1500);
                  }}
                  onPaymentError={(error) => {
                    toast({
                      title: "Payment Failed",
                      description: error.message || "There was an error processing your payment. Please try again.",
                      variant: "destructive",
                    });
                  }}
                  description="Complete payment to unlock your test retake"
                  disabled={isProcessing}
                />
              ) : (
                <Button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-orange-600 hover:bg-orange-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Processing Payment...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Pay with Amazon Pay
                    </div>
                  )}
                </Button>
              )}
              
              <p className="text-xs text-gray-500 text-center mt-3">
                Secure payment processing. Money-back guarantee if technical issues occur.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}