import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, ArrowRight, RefreshCw, CreditCard, MessageCircle, ThumbsUp, Share2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PayPalHostedButton from '@/components/PayPalHostedButton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SiLinkedin } from 'react-icons/si';
import { useMutation } from '@tanstack/react-query';

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
  const [activeTab, setActiveTab] = useState<'comment' | 'linkedin' | 'payment'>('comment');
  const [linkedinPostUrl, setLinkedinPostUrl] = useState('');
  const [linkedinCommentUrl, setLinkedinCommentUrl] = useState('');

  const sessionId = params?.sessionId;

  // LinkedIn share verification mutation
  const verifyLinkedinShareMutation = useMutation({
    mutationFn: async (postUrl: string) => {
      return await apiRequest(`/api/virtual-interview/${sessionId}/retake/linkedin-share`, "POST", {
        linkedinPostUrl: postUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "LinkedIn Post Verified!",
        description: "Your retake is now available. Starting new interview...",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/virtual-interview/feedback', sessionId] });
      setTimeout(() => setLocation('/virtual-interview-start'), 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify LinkedIn post. Please ensure the post is public.",
        variant: "destructive",
      });
    },
  });

  // LinkedIn comment verification mutation
  const verifyLinkedinCommentMutation = useMutation({
    mutationFn: async (commentUrl: string) => {
      return await apiRequest(`/api/virtual-interview/${sessionId}/retake/linkedin-comment`, "POST", {
        linkedinCommentUrl: commentUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "LinkedIn Comment Verified!",
        description: "Your retake is now available. Starting new interview...",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/virtual-interview/feedback', sessionId] });
      setTimeout(() => setLocation('/virtual-interview-start'), 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify LinkedIn comment. Please ensure the comment is public.",
        variant: "destructive",
      });
    },
  });

  const handleLinkedinShare = () => {
    const role = interviewData?.role || 'interview';
    const shareText = `Just completed a virtual ${role.replace(/_/g, ' ')} interview practice on AutoJobr! Working on sharpening my skills for the next opportunity. #CareerGrowth #InterviewPrep #JobSearch`;
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
    verifyLinkedinShareMutation.mutate(linkedinPostUrl);
  };

  const handleVerifyLinkedinComment = async () => {
    if (!linkedinCommentUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your LinkedIn comment URL",
        variant: "destructive",
      });
      return;
    }
    verifyLinkedinCommentMutation.mutate(linkedinCommentUrl);
  };

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
            
            {/* Show retake option for all self-initiated interviews - always visible */}
            {!isRecruiterAssigned && (
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 mb-4">
                <CardHeader>
                  <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2 text-lg">
                    <RefreshCw className="w-5 h-5" />
                    {interviewData?.overallScore < 70 ? 'Improve Your Score' : 'Perfect Your Performance'}
                  </CardTitle>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                    {interviewData?.overallScore < 70 
                      ? "Your performance shows room for growth. Retake to practice and achieve better results!"
                      : "Great work! Retake to refine your skills even further!"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'comment' | 'linkedin' | 'payment')} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="comment" className="flex items-center gap-1 text-xs" data-testid="tab-comment-like">
                        <MessageCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Comment</span>
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1">FREE</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="linkedin" className="flex items-center gap-1 text-xs" data-testid="tab-linkedin-share">
                        <Share2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Share</span>
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1">FREE</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="payment" className="flex items-center gap-1 text-xs" data-testid="tab-payment">
                        <CreditCard className="w-3 h-3" />
                        $5
                      </TabsTrigger>
                    </TabsList>

                    {/* Comment & Like Tab */}
                    <TabsContent value="comment" className="space-y-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-3 rounded-lg border border-green-200">
                        <div className="flex items-start gap-2">
                          <div className="flex gap-1">
                            <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <ThumbsUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm">Free Retake via LinkedIn</h3>
                            <p className="text-xs text-green-700 dark:text-green-300">Comment on our post to unlock your free retake!</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Visit our company LinkedIn post</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Like the post and add a meaningful comment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Paste your comment URL to verify</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h4 className="font-medium text-xs">Step 1: View & Comment on Our Post</h4>
                        <Button
                          onClick={() => {
                            window.open('https://www.linkedin.com/posts/autojobr_autojobr-ai-recruitmenttech-activity-7397982472216502272-9PEn?utm_source=share&utm_medium=member_desktop', '_blank');
                          }}
                          className="w-full bg-[#0077B5] hover:bg-[#006399] text-white"
                          data-testid="button-view-company-post"
                        >
                          <SiLinkedin className="w-4 h-4 mr-2" />
                          View AutoJobr Post
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-xs">Step 2: Paste Your Comment URL</h4>
                        <Input
                          type="url"
                          placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                          value={linkedinCommentUrl}
                          onChange={(e) => setLinkedinCommentUrl(e.target.value)}
                          className="w-full text-sm"
                          data-testid="input-comment-url"
                        />
                        <p className="text-[10px] text-gray-500">Click timestamp on your comment to get the link</p>
                      </div>

                      <Button
                        onClick={handleVerifyLinkedinComment}
                        disabled={verifyLinkedinCommentMutation.isPending || !linkedinCommentUrl.trim()}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="button-verify-comment"
                      >
                        {verifyLinkedinCommentMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Verify & Unlock Free Retake
                          </div>
                        )}
                      </Button>
                    </TabsContent>

                    {/* LinkedIn Share Tab */}
                    <TabsContent value="linkedin" className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <SiLinkedin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Free Retake via LinkedIn Share</h3>
                            <p className="text-xs text-blue-700 dark:text-blue-300">Share your learning journey to unlock!</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Share a post about your interview on LinkedIn</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Post must be publicly visible</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span>Paste the post URL to verify</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h4 className="font-medium text-xs">Step 1: Share on LinkedIn</h4>
                        <Button
                          onClick={handleLinkedinShare}
                          className="w-full bg-[#0077B5] hover:bg-[#006399] text-white"
                          data-testid="button-share-linkedin"
                        >
                          <SiLinkedin className="w-4 h-4 mr-2" />
                          Share Post on LinkedIn
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-xs">Step 2: Paste Post URL</h4>
                        <Input
                          type="url"
                          placeholder="https://www.linkedin.com/posts/..."
                          value={linkedinPostUrl}
                          onChange={(e) => setLinkedinPostUrl(e.target.value)}
                          className="w-full text-sm"
                          data-testid="input-linkedin-url"
                        />
                      </div>

                      <Button
                        onClick={handleVerifyLinkedinPost}
                        disabled={verifyLinkedinShareMutation.isPending || !linkedinPostUrl.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        data-testid="button-verify-linkedin"
                      >
                        {verifyLinkedinShareMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Verify & Unlock Free Retake
                          </div>
                        )}
                      </Button>
                    </TabsContent>

                    {/* Payment Tab */}
                    <TabsContent value="payment" className="space-y-4">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-purple-600 mb-1">$5</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">One-time payment</div>
                      </div>

                      <div className="space-y-2 text-xs mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Fresh set of questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Same difficulty level</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Instant access after payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Best score counts</span>
                        </div>
                      </div>

                      {!showRetakePayment ? (
                        <Button
                          onClick={() => setShowRetakePayment(true)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          data-testid="button-retake-interview"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay $5 to Retake
                        </Button>
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
                    </TabsContent>
                  </Tabs>
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