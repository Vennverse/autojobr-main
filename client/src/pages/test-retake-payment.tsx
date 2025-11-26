
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  RefreshCw,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Star,
  Users,
  Target,
  Brain,
  Lightbulb,
  Award,
  Share2,
  ExternalLink,
  MessageCircle,
  ThumbsUp
} from "lucide-react";
import PayPalHostedButton from "@/components/PayPalHostedButton";
import { SiLinkedin } from "react-icons/si";

export default function TestRetakePayment() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'amazon_pay'>('paypal');
  const [linkedinPostUrl, setLinkedinPostUrl] = useState('');
  const [linkedinCommentUrl, setLinkedinCommentUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'payment' | 'linkedin' | 'comment'>('comment');

  // Fetch test assignment details
  const { data: assignment, isLoading } = useQuery({
    queryKey: [`/api/test-assignments/${params.id}`],
    enabled: !!params.id,
  });

  // Debug: Log assignment data
  console.log('🔍 [RETAKE PAYMENT] Assignment data:', {
    id: assignment?.id,
    status: assignment?.status,
    retakeAllowed: assignment?.retakeAllowed
  });

  // Process retake payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      return await apiRequest(`/api/test-assignments/${params?.id}/retake/payment`, "POST", {
        paymentProvider: paymentMethod,
        paymentIntentId: `${paymentMethod}_${Date.now()}`,
        ...paymentData
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful!",
        description: "Your retake is now available. You can start the test again.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/test-assignments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/test-assignments/${params?.id}`] });

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
      const paymentData = {
        amount: 500,
        currency: 'USD',
        testAssignmentId: (assignment as any)?.id,
      };

      await processPaymentMutation.mutateAsync(paymentData);
    } catch (error) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
    }
  };

  // LinkedIn share verification mutation
  const verifyLinkedinShareMutation = useMutation({
    mutationFn: async (postUrl: string) => {
      return await apiRequest(`/api/test-assignments/${params?.id}/retake/linkedin-share`, "POST", {
        linkedinPostUrl: postUrl
      });
    },
    onSuccess: (data) => {
      toast({
        title: "LinkedIn Post Verified! 🎉",
        description: "Your retake is now available. You can start the test again.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/test-assignments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/test-assignments/${params?.id}`] });

      setTimeout(() => {
        setLocation(`/test/${params?.id}`);
      }, 1500);
    },
    onError: (error: any) => {
      console.error('LinkedIn verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify LinkedIn post. Please ensure the post is public and the URL is correct.",
        variant: "destructive",
      });
    },
  });

  const handleLinkedinShare = () => {
    const testName = assignment?.testTemplate?.title || 'Skills Assessment';
    const shareText = `I'm taking on new challenges to showcase my skills! Just completed a ${testName} on AutoJobr. Excited to demonstrate what I can do! 🚀 #CareerGrowth #SkillsDevelopment`;
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

  // LinkedIn comment verification mutation
  const verifyLinkedinCommentMutation = useMutation({
    mutationFn: async (commentUrl: string) => {
      return await apiRequest(`/api/test-assignments/${params?.id}/retake/linkedin-comment`, "POST", {
        linkedinCommentUrl: commentUrl
      });
    },
    onSuccess: (data) => {
      toast({
        title: "LinkedIn Comment Verified! 🎉",
        description: "Your retake is now available. You can start the test again.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/test-assignments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/test-assignments/${params?.id}`] });

      setTimeout(() => {
        setLocation(`/test/${params?.id}`);
      }, 1500);
    },
    onError: (error: any) => {
      console.error('LinkedIn comment verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify LinkedIn comment. Please ensure the comment is public and the URL is correct.",
        variant: "destructive",
      });
    },
  });

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

  const passingScore = assignment?.testTemplate?.passingScore || 70;
  const canRetake = assignment?.status === 'completed' && !assignment?.retakeAllowed;

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

  // CRITICAL: If user has already paid and retake is allowed, show button to start test
  if ((assignment as any)?.retakeAllowed) {
    console.log('✅ [RETAKE] User already paid - retakeAllowed is true, showing start button');
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Retake Already Available!</h3>
            <p className="text-gray-600 mb-4">
              You've already paid for a retake. Click below to start the test again with fresh questions.
            </p>
            <Button 
              onClick={() => {
                console.log('🚀 [RETAKE] User clicked Start Test Retake - redirecting to /test/' + params?.id);
                setLocation(`/test/${params?.id}`);
              }}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-start-retake"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Test Retake
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
            Second Chance Available
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everyone deserves another opportunity to showcase their true potential
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
                <Award className="w-5 h-5 text-blue-600" />
                {assignment?.testTemplate?.title || 'Skills Assessment'}
              </CardTitle>
              <CardDescription>
                {assignment?.recruiter?.companyName || 'Test'} • {assignment?.recruiter?.firstName} {assignment?.recruiter?.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Why Consider a Retake?</h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Experienced technical issues or distractions during your test?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Feel your performance didn't reflect your true abilities?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Want another chance to showcase your skills?</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Motivation Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Target className="w-5 h-5" />
                What You Get with a Retake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-800 dark:text-blue-200">
                Sometimes external factors, technical issues, or an off day can impact test performance. A retake gives you a fresh opportunity to demonstrate your true capabilities and shine.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Fresh Questions</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Completely new questions testing the same skills</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Second Chance</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Show your true potential without previous constraints</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Stand Out</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Demonstrate resilience and commitment to excellence</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Fair Opportunity</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Everyone deserves a chance to perform at their best</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-900/60 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  💡 <strong>Success Story:</strong> "My internet crashed during the first attempt. The retake option was a lifesaver - I could finally show what I'm capable of!" - Sarah K., Software Engineer
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment or LinkedIn Share */}
        <div className="space-y-6">
          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center bg-blue-50 dark:bg-blue-900/20">
              <CardTitle className="text-blue-900 dark:text-blue-100">Unlock Your Retake</CardTitle>
              <CardDescription>Choose your preferred option</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'payment' | 'linkedin' | 'comment')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="comment" className="flex items-center gap-1 text-xs" data-testid="tab-comment-like">
                    <MessageCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Comment & Like</span>
                    <span className="sm:hidden">Comment</span>
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="flex items-center gap-1 text-xs" data-testid="tab-linkedin-share">
                    <Share2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Share Post</span>
                    <span className="sm:hidden">Share</span>
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="flex items-center gap-1 text-xs" data-testid="tab-payment">
                    <CreditCard className="w-3 h-3" />
                    Pay $5
                  </TabsTrigger>
                </TabsList>

                {/* Comment & Like Tab */}
                <TabsContent value="comment" className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex gap-1">
                        <MessageCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">Free Retake via LinkedIn Engagement</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">Comment on our company post and unlock your retake for free!</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Visit our company LinkedIn post</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Like the post and add a meaningful comment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Comment must be publicly visible</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Paste your comment URL to verify</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Instant retake access after verification</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Step 1: View & Engage with Our Post</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                        📌 AutoJobr LinkedIn Post
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Click the button below to visit our post. Like the post and leave a meaningful comment to unlock your free retake!
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        window.open('https://www.linkedin.com/posts/autojobr_autojobr-ai-recruitmenttech-activity-7397982472216502272-9PEn?utm_source=share&utm_medium=member_desktop&rcm=ACoAACy2vZ4BzqZqbVKOV8GfxfamJ5bAWGCUfpk', '_blank');
                      }}
                      className="w-full bg-[#0077B5] hover:bg-[#006399] text-white"
                      data-testid="button-view-company-post"
                    >
                      <SiLinkedin className="w-4 h-4 mr-2" />
                      View AutoJobr Post on LinkedIn
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Opens our LinkedIn post - Like and comment to get a free retake!</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Step 2: Like & Comment</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 <strong>Tip:</strong> After liking the post, add a thoughtful comment. Then click the timestamp on your comment to get its unique URL.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Step 3: Paste Your Comment URL</h4>
                    <Input
                      type="url"
                      placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                      value={linkedinCommentUrl}
                      onChange={(e) => setLinkedinCommentUrl(e.target.value)}
                      className="w-full"
                      data-testid="input-comment-url"
                    />
                    <p className="text-xs text-gray-500">Copy the URL from your comment (click timestamp on your comment to get the link)</p>
                  </div>

                  <Button
                    onClick={handleVerifyLinkedinComment}
                    disabled={verifyLinkedinCommentMutation.isPending || !linkedinCommentUrl.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-verify-comment"
                  >
                    {verifyLinkedinCommentMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Verifying Comment...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Verify & Unlock Retake
                      </div>
                    )}
                  </Button>
                </TabsContent>

                {/* LinkedIn Share Tab */}
                <TabsContent value="linkedin" className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3 mb-3">
                      <SiLinkedin className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Free Retake via LinkedIn Share</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Share your learning journey and unlock your retake for free!</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Share a post about your test on LinkedIn</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Post must be publicly visible</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Paste the post URL to verify</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Instant retake access after verification</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Step 1: Share on LinkedIn</h4>
                    <Button
                      onClick={handleLinkedinShare}
                      className="w-full bg-[#0077B5] hover:bg-[#006399] text-white"
                      data-testid="button-share-linkedin"
                    >
                      <SiLinkedin className="w-4 h-4 mr-2" />
                      Share Post on LinkedIn
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Opens LinkedIn in a new window with pre-filled text</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Step 2: Paste Post URL</h4>
                    <Input
                      type="url"
                      placeholder="https://www.linkedin.com/posts/..."
                      value={linkedinPostUrl}
                      onChange={(e) => setLinkedinPostUrl(e.target.value)}
                      className="w-full"
                      data-testid="input-linkedin-url"
                    />
                    <p className="text-xs text-gray-500">Copy the URL from your LinkedIn post after sharing</p>
                  </div>

                  <Button
                    onClick={handleVerifyLinkedinPost}
                    disabled={verifyLinkedinShareMutation.isPending || !linkedinPostUrl.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-verify-linkedin"
                  >
                    {verifyLinkedinShareMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Verifying Post...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Verify & Unlock Retake
                      </div>
                    )}
                  </Button>
                </TabsContent>

                {/* Payment Tab */}
                <TabsContent value="payment" className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">$5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">One-time payment</div>
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
                      paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200'
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
                      paymentMethod === 'amazon_pay' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200'
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
                  serviceId={params?.id}
                  itemName={`${assignment?.testTemplate?.title || 'Skills Assessment'} - Retake`}
                  onPaymentSuccess={async (data) => {
                    console.log('💳 [RETAKE] PayPal payment success:', data);

                    toast({
                      title: "Payment Received! ✅",
                      description: "Verifying payment and enabling retake access...",
                      duration: 3000,
                    });

                    try {
                      console.log('🔍 [RETAKE] Verifying payment...');
                      const verifyResponse = await fetch('/api/payments/verify-paypal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          orderId: data.orderID,
                          serviceType: 'test_retake',
                          serviceId: params?.id,
                          amount: 5
                        }),
                        credentials: 'include'
                      });

                      const verifyData = await verifyResponse.json();
                      console.log('📊 [RETAKE] Verification result:', verifyData);

                      if (verifyData.success && verifyData.accessGranted) {
                        toast({
                          title: "Retake Enabled! 🎉",
                          description: "Your test retake is now available. Redirecting to test...",
                          duration: 3000,
                        });

                        queryClient.invalidateQueries({ queryKey: ["/api/jobseeker/test-assignments"] });
                        queryClient.invalidateQueries({ queryKey: [`/api/test-assignments/${params?.id}`] });

                        setTimeout(() => {
                          console.log('🚀 [RETAKE] Redirecting to test page...');
                          setLocation(`/test/${params?.id}`);
                        }, 1500);
                      } else {
                        console.error('❌ [RETAKE] Access not granted:', verifyData);
                        
                        toast({
                          title: "Payment Issue",
                          description: verifyData.message || "Payment received but retake access failed. Please contact support with order ID: " + data.orderID,
                          variant: "destructive",
                          duration: 15000,
                        });

                        setTimeout(() => {
                          console.log('🔄 [RETAKE] Redirecting to tests page after error');
                          setLocation(`/job-seeker/tests`);
                        }, 3000);
                      }
                    } catch (error: any) {
                      console.error('❌ [RETAKE] Payment verification error:', error);
                      
                      toast({
                        title: "Verification Error",
                        description: "Payment confirmed but verification failed. Please contact support with order ID: " + data.orderID,
                        variant: "destructive",
                        duration: 15000,
                      });

                      setTimeout(() => {
                        console.log('🔄 [RETAKE] Redirecting to tests page after error');
                        setLocation(`/job-seeker/tests`);
                      }, 3000);
                    }
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
