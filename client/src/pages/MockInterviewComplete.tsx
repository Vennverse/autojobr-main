
import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, ArrowRight, RefreshCw, CreditCard, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PayPalHostedButton from '@/components/PayPalHostedButton';

export default function MockInterviewComplete() {
  const [, params] = useRoute('/mock-interview-complete/:sessionId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [completing, setCompleting] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const [showRetakeOptions, setShowRetakeOptions] = useState(false);
  const [linkedinPostUrl, setLinkedinPostUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);

  const sessionId = params?.sessionId;

  useEffect(() => {
    if (!sessionId) {
      setLocation('/mock-interview');
      return;
    }
    
    completeInterview();
  }, [sessionId]);

  const completeInterview = async () => {
    try {
      setCompleting(true);
      
      const response = await apiRequest(`/api/mock-interview/${sessionId}/complete`, 'POST');
      
      setInterviewId(response.interviewId);
      setInterviewData(response);
      setCompleted(true);
      
      toast({
        title: "Interview Completed",
        description: response.assignedBy 
          ? "Your interview has been submitted successfully!"
          : "Your interview has been completed. You can now view your results!",
      });
    } catch (error) {
      console.error('Error completing interview:', error);
      toast({
        title: "Error",
        description: "Failed to complete interview. Please try again.",
        variant: "destructive",
      });
      setLocation('/mock-interview');
    } finally {
      setCompleting(false);
    }
  };

  const handleLinkedinShare = () => {
    const interviewName = (interviewData?.role || 'Mock Interview').replace(/_/g, ' ');
    const shareText = `Just completed a ${interviewName} on AutoJobr! Excited to showcase my coding skills! 💻 #CareerGrowth #TechnicalInterview`;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://autojobr.com')}&summary=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank', 'width=600,height=600');
  };

  const handleVerifyLinkedinPost = async () => {
    if (!linkedinPostUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your LinkedIn post URL",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      await apiRequest(`/api/interviews/mock/${interviewId}/linkedin-retake`, 'POST', {
        linkedinPostUrl: linkedinPostUrl.trim()
      });

      toast({
        title: "LinkedIn Post Verified! 🎉",
        description: "Your retake is now available. Starting new interview...",
      });

      setTimeout(() => {
        setLocation('/mock-interview');
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify LinkedIn post. Please ensure the post is public.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (completing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Completing Your Interview
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing your responses...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    const isRecruiterAssigned = !!interviewData?.assignedBy;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
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
                  ? "Congratulations! You've successfully completed your assigned interview."
                  : "Congratulations! You've successfully completed your mock interview."}
              </p>
            </div>

            {/* Show retake options for recruiter-assigned interviews */}
            {isRecruiterAssigned && (
              <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2 text-lg">
                    <RefreshCw className="w-5 h-5" />
                    Want to Improve Your Performance?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    This interview was assigned by a recruiter. Retake it to improve before they review your submission!
                  </p>

                  {!showRetakeOptions ? (
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          handleLinkedinShare();
                          toast({
                            title: "Share on LinkedIn",
                            description: "After sharing, paste the post URL below to unlock free retake",
                          });
                          setShowRetakeOptions(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share on LinkedIn for Free Retake
                      </Button>
                      
                      <div className="text-center text-sm text-gray-500">or</div>
                      
                      <Button
                        onClick={() => setShowRetakeOptions(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay $5 to Retake
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* LinkedIn verification option */}
                      <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-sm">Free Retake via LinkedIn</h4>
                        <Input
                          type="url"
                          placeholder="Paste LinkedIn post URL here..."
                          value={linkedinPostUrl}
                          onChange={(e) => setLinkedinPostUrl(e.target.value)}
                        />
                        <Button
                          onClick={handleVerifyLinkedinPost}
                          disabled={isVerifying || !linkedinPostUrl.trim()}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify & Unlock Retake
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="text-center text-sm text-gray-500">or</div>

                      {/* PayPal payment option */}
                      <PayPalHostedButton
                        purpose="mock_interview"
                        amount={5}
                        itemName={`${(interviewData?.role || 'Interview').replace(/_/g, ' ')} Retake`}
                        onPaymentSuccess={async () => {
                          try {
                            await apiRequest(`/api/interviews/mock/${interviewId}/retake-payment`, 'POST', {
                              paymentProvider: 'paypal',
                              amount: 500
                            });
                            
                            toast({
                              title: "Payment Successful!",
                              description: "Your interview retake access has been granted.",
                            });
                            
                            setTimeout(() => {
                              setLocation('/mock-interview');
                            }, 1500);
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Failed to process payment",
                              variant: "destructive"
                            });
                          }
                        }}
                        onPaymentError={(error) => {
                          toast({
                            title: "Payment Failed",
                            description: error.message,
                            variant: "destructive",
                          });
                        }}
                        description="Pay $5 to retake interview"
                      />
                      
                      <Button
                        variant="ghost"
                        onClick={() => setShowRetakeOptions(false)}
                        className="w-full text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-3">
              {!isRecruiterAssigned && (
                <Button
                  onClick={() => setLocation(`/mock-interview/${sessionId}/results`)}
                  className="w-full"
                  size="lg"
                >
                  View Results
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              <Button
                onClick={() => setLocation('/dashboard')}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

