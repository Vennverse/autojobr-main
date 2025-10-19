import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, ArrowRight, RefreshCw, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PayPalHostedButton from '@/components/PayPalHostedButton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

export default function VirtualInterviewComplete() {
  const [, params] = useRoute('/virtual-interview-complete/:sessionId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [completing, setCompleting] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const [showRetakePayment, setShowRetakePayment] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);

  const sessionId = params?.sessionId;

  useEffect(() => {
    // Check authentication first
    if (authLoading) return;
    
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      const returnUrl = `/virtual-interview-complete/${sessionId}`;
      setLocation(`/auth-page?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!sessionId) {
      setLocation('/virtual-interview-start');
      return;
    }
    
    completeInterview();
  }, [sessionId, authLoading, isAuthenticated]);

  const completeInterview = async () => {
    try {
      setCompleting(true);
      
      const response = await apiRequest(`/api/virtual-interview/${sessionId}/complete`, 'POST');
      
      setInterviewId(response.interviewId);
      setInterviewData(response);
      setCompleted(true);
      
      toast({
        title: "Interview Completed",
        description: response.assignmentType === 'recruiter_assigned' 
          ? "Your interview has been submitted successfully. Thank you for completing it!"
          : "Your interview has been completed and analyzed. You can now view your feedback!",
      });
    } catch (error) {
      console.error('Error completing interview:', error);
      toast({
        title: "Error",
        description: "Failed to complete interview. Please try again.",
        variant: "destructive",
      });
      setLocation('/virtual-interview-start');
    } finally {
      setCompleting(false);
    }
  };

  const goToFeedback = () => {
    setLocation(`/virtual-interview/${sessionId}/feedback`);
  };

  const startNewInterview = () => {
    setLocation('/virtual-interview-start');
  };

  const goToDashboard = () => {
    setLocation('/dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Checking Authentication
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your account...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Completing Your Interview
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We're analyzing your responses and generating personalized feedback...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    // Check if this is a recruiter-assigned interview
    const isRecruiterAssigned = interviewData?.assignmentType === 'recruiter_assigned';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">
              Interview Complete!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isRecruiterAssigned 
                  ? "Congratulations! You've successfully completed your assigned interview. Your responses have been submitted to the recruiter."
                  : "Congratulations! You've successfully completed your virtual AI interview. Your responses have been analyzed and your personalized feedback is ready."}
              </p>
            </div>

            {/* Show retake option for recruiter-assigned interviews */}
            {isRecruiterAssigned && (
              <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 mb-4">
                <CardHeader>
                  <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2 text-lg">
                    <RefreshCw className="w-5 h-5" />
                    Want to Improve Your Performance?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    This interview was assigned by a recruiter. You can retake it to practice and improve your performance before the recruiter reviews your submission!
                  </p>
                  
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Interview Retake Options</span>
                    </div>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Fresh set of questions</li>
                      <li>• Same role and difficulty</li>
                      <li>• Instant access</li>
                      <li>• Best performance counts</li>
                    </ul>
                  </div>

                  {!showRetakePayment ? (
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          const interviewName = (interviewData?.role || 'Virtual Interview').replace(/_/g, ' ');
                          const shareText = `Just completed a ${interviewName} on AutoJobr! Excited to demonstrate my skills and improve! 🚀 #CareerGrowth #InterviewPrep`;
                          const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://autojobr.com')}&summary=${encodeURIComponent(shareText)}`;
                          window.open(shareUrl, '_blank', 'width=600,height=600');
                          
                          toast({
                            title: "Share on LinkedIn",
                            description: "After sharing, paste the post URL below to unlock free retake",
                          });
                          setShowRetakePayment(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Share on LinkedIn for Free Retake
                      </Button>
                      
                      <div className="text-center text-sm text-gray-500">or</div>
                      
                      <Button
                        onClick={() => setShowRetakePayment(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay $5 to Retake
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <PayPalHostedButton
                        purpose="virtual_interview"
                        amount={5}
                        itemName={`${(interviewData?.role || 'Interview').replace(/_/g, ' ')} Retake`}
                        onPaymentSuccess={async (paymentData) => {
                          try {
                            await apiRequest(`/api/interviews/virtual/${interviewId}/retake-payment`, 'POST', {
                              paymentProvider: 'paypal',
                              amount: 500
                            });
                            
                            toast({
                              title: "Payment Successful!",
                              description: "Your interview retake access has been granted. Starting new interview...",
                            });
                            
                            setTimeout(() => {
                              setLocation('/virtual-interview-start');
                            }, 1500);
                          } catch (error: any) {
                            toast({
                              title: "Payment Processing Error",
                              description: error.message || "Failed to process retake payment",
                              variant: "destructive"
                            });
                          }
                        }}
                        onPaymentError={(error) => {
                          toast({
                            title: "Payment Failed",
                            description: error.message || "There was an error processing your payment. Please try again.",
                            variant: "destructive",
                          });
                        }}
                        description="Complete payment to retake your virtual interview"
                      />
                      
                      <Button
                        variant="ghost"
                        onClick={() => setShowRetakePayment(false)}
                        className="w-full text-sm"
                      >
                        Cancel Payment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Show retake option for self-initiated interviews with low scores */}
            {!isRecruiterAssigned && interviewData?.overallScore < 70 && (
              <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 mb-4">
                <CardHeader>
                  <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2 text-lg">
                    <RefreshCw className="w-5 h-5" />
                    Improve Your Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Your score of {interviewData?.overallScore}% shows room for improvement. Retake the interview to practice and improve your performance!
                  </p>
                  
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Interview Retake</span>
                      <span className="font-bold text-lg text-orange-600">$5</span>
                    </div>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Fresh set of questions</li>
                      <li>• Same role and difficulty</li>
                      <li>• Instant access after payment</li>
                      <li>• Best score counts</li>
                    </ul>
                  </div>

                  {!showRetakePayment ? (
                    <Button
                      onClick={() => setShowRetakePayment(true)}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay $5 to Retake Interview
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <PayPalHostedButton
                        purpose="virtual_interview"
                        amount={5}
                        itemName={`${(interviewData?.role || 'Interview').replace(/_/g, ' ')} Retake`}
                        onPaymentSuccess={async (paymentData) => {
                          try {
                            // Call existing backend retake payment endpoint
                            await apiRequest(`/api/interviews/virtual/${interviewId}/retake-payment`, 'POST', {
                              paymentProvider: 'paypal',
                              amount: 500 // $5 in cents
                            });
                            
                            toast({
                              title: "Payment Successful!",
                              description: "Your interview retake access has been granted. Starting new interview...",
                            });
                            
                            setTimeout(() => {
                              setLocation('/virtual-interview-start');
                            }, 1500);
                          } catch (error: any) {
                            toast({
                              title: "Payment Processing Error",
                              description: error.message || "Failed to process retake payment",
                              variant: "destructive"
                            });
                          }
                        }}
                        onPaymentError={(error) => {
                          toast({
                            title: "Payment Failed",
                            description: error.message || "There was an error processing your payment. Please try again.",
                            variant: "destructive",
                          });
                        }}
                        description="Complete payment to retake your virtual interview"
                      />
                      
                      <Button
                        variant="ghost"
                        onClick={() => setShowRetakePayment(false)}
                        className="w-full text-sm"
                      >
                        Cancel Payment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-3">
              {/* Only show feedback button for self-initiated interviews */}
              {!isRecruiterAssigned && (
                <Button
                  onClick={goToFeedback}
                  className="w-full"
                  size="lg"
                >
                  View Your Feedback
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {/* Show different buttons based on interview type */}
              {isRecruiterAssigned ? (
                <Button
                  onClick={goToDashboard}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Return to Dashboard
                </Button>
              ) : (
                <Button
                  onClick={startNewInterview}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Start Another Interview
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRecruiterAssigned 
                  ? "Your interview responses have been submitted to the recruiter"
                  : "Your interview results have been saved to your profile"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}