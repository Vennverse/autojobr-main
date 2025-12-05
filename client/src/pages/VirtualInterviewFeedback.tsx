import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Star, TrendingUp, Award, ArrowLeft, Loader2, RefreshCw, Target, Briefcase, AlertCircle, Share2, ExternalLink, MessageCircle, ThumbsUp, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PayPalInterviewPayment from '@/components/PayPalInterviewPayment';
import { SiLinkedin } from "react-icons/si";

interface InterviewFeedback {
  interview: {
    id: number;
    sessionId: string;
    interviewType: string;
    role: string;
    company?: string;
    difficulty: string;
    duration: number;
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    startTime: string;
    endTime: string;
    questionsAsked: number;
    totalQuestions: number;
  };
  feedback: {
    performanceSummary: string;
    keyStrengths: string[];
    areasForImprovement: string[];
    technicalSkillsScore: number;
    problemSolvingScore: number;
    communicationScore: number;
    responseConsistency: number;
    adaptabilityScore: number;
    stressHandling: number;
    roleReadiness: string;
    aiConfidenceScore: number;
  };
}

export default function VirtualInterviewFeedback() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/virtual-interview/:sessionId/feedback");
  const sessionId = params?.sessionId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // All hooks at the top
  const [showRetakePayment, setShowRetakePayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [linkedinPostUrl, setLinkedinPostUrl] = useState('');
  const [linkedinCommentUrl, setLinkedinCommentUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'comment' | 'linkedin' | 'payment'>('comment');

  // Fetch interview feedback
  const { data: feedbackData, isLoading, error } = useQuery<InterviewFeedback>({
    queryKey: ['/api/virtual-interview/feedback', sessionId],
    queryFn: () => apiRequest(`/api/virtual-interview/${sessionId}/feedback`, 'GET'),
    enabled: !!sessionId,
    retry: false
  });
  
  // Calculate hiring chances
  const calculateHiringChance = (overallScore: number) => {
    if (overallScore >= 90) return { percentage: 95, label: "Excellent", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900" };
    if (overallScore >= 80) return { percentage: 80, label: "Very Good", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900" };
    if (overallScore >= 70) return { percentage: 65, label: "Good", color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900" };
    if (overallScore >= 60) return { percentage: 45, label: "Moderate", color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900" };
    if (overallScore >= 50) return { percentage: 25, label: "Low", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900" };
    return { percentage: 10, label: "Very Low", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900" };
  };

  const handlePaymentSuccess = async (paymentIntentId: string, paymentProvider: string) => {
    try {
      setProcessingPayment(true);
      await apiRequest(`/api/virtual-interview/${sessionId}/retake-payment`, 'POST', {
        paymentProvider,
        paymentIntentId
      });
      toast({
        title: "Payment Successful!",
        description: "You can now retake the interview.",
      });
      setShowRetakePayment(false);
      setTimeout(() => setLocation('/virtual-interview-start'), 1500);
    } catch (error: any) {
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

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
    const role = feedbackData?.interview?.role || 'interview';
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

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <p className="mb-4">Invalid session. Please start a new interview.</p>
            <Button onClick={() => setLocation('/virtual-interview-start')} className="w-full" data-testid="start-new-interview">
              Start New Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">Analyzing your performance...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Generating detailed feedback</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !feedbackData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 dark:text-red-400 mb-4 font-medium">
              {(error as any)?.message || 'Failed to load interview feedback'}
            </p>
            <div className="space-y-2">
              <Button onClick={() => setLocation('/dashboard')} className="w-full" data-testid="return-dashboard">
                Return to Dashboard
              </Button>
              <Button variant="outline" onClick={() => setLocation('/virtual-interview-start')} className="w-full">
                Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { interview, feedback } = feedbackData;
  const hiringChance = calculateHiringChance(interview.overallScore);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="mb-4 hover:bg-white/50 dark:hover:bg-gray-800/50"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Award className="w-10 h-10 text-yellow-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                Interview Complete!
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Here's your detailed performance analysis and hiring chances
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Feedback */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score & Hiring Chances */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Overall Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className={`text-6xl font-bold ${getScoreColor(interview.overallScore)}`} data-testid="overall-score">
                      {interview.overallScore}%
                    </div>
                    <Badge className={getScoreBadgeColor(interview.overallScore)}>
                      {interview.overallScore >= 85 ? 'Excellent' : interview.overallScore >= 70 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${hiringChance.percentage >= 70 ? 'border-green-200 dark:border-green-800' : 'border-yellow-200 dark:border-yellow-800'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    Hiring Chances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className={`text-6xl font-bold ${hiringChance.color}`} data-testid="hiring-chance">
                      {hiringChance.percentage}%
                    </div>
                    <Badge className={hiringChance.bgColor + " text-base px-4 py-1"}>
                      {hiringChance.label} Chance
                    </Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {hiringChance.percentage >= 80 
                        ? "You're highly likely to succeed in this role!" 
                        : hiringChance.percentage >= 60
                        ? "You have a good chance with some improvements"
                        : "Keep practicing to increase your chances"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="performance-summary">
                  {feedback.performanceSummary}
                </p>
              </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Technical Skills</span>
                      <span className={`font-bold text-lg ${getScoreColor(feedback.technicalSkillsScore)}`} data-testid="technical-score">
                        {feedback.technicalSkillsScore}%
                      </span>
                    </div>
                    <Progress value={feedback.technicalSkillsScore} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Problem Solving</span>
                      <span className={`font-bold text-lg ${getScoreColor(feedback.problemSolvingScore)}`} data-testid="problem-solving-score">
                        {feedback.problemSolvingScore}%
                      </span>
                    </div>
                    <Progress value={feedback.problemSolvingScore} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Communication</span>
                      <span className={`font-bold text-lg ${getScoreColor(feedback.communicationScore)}`} data-testid="communication-score">
                        {feedback.communicationScore}%
                      </span>
                    </div>
                    <Progress value={feedback.communicationScore} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Response Consistency</span>
                      <span className={`font-bold text-lg ${getScoreColor(feedback.responseConsistency)}`}>
                        {feedback.responseConsistency}%
                      </span>
                    </div>
                    <Progress value={feedback.responseConsistency} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Adaptability</span>
                      <span className={`font-bold text-lg ${getScoreColor(feedback.adaptabilityScore)}`}>
                        {feedback.adaptabilityScore}%
                      </span>
                    </div>
                    <Progress value={feedback.adaptabilityScore} className="h-3" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Stress Handling</span>
                      <span className={`font-bold text-lg ${getScoreColor(feedback.stressHandling)}`}>
                        {feedback.stressHandling}%
                      </span>
                    </div>
                    <Progress value={feedback.stressHandling} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card className="border-l-4 border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  Your Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedback.keyStrengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30" data-testid={`strength-${index}`}>
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="border-l-4 border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-6 h-6" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedback.areasForImprovement.map((improvement, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30" data-testid={`improvement-${index}`}>
                      <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{improvement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                    <span className="font-semibold" data-testid="questions-count">{interview.questionsAsked}/{interview.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-semibold">{interview.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-semibold capitalize">{interview.interviewType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Role:</span>
                    <span className="font-semibold capitalize">{interview.role.replace(/_/g, ' ')}</span>
                  </div>
                  {interview.company && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Company:</span>
                      <span className="font-semibold">{interview.company}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Role Readiness:</span>
                      <Badge className={
                        feedback.roleReadiness === 'ready' ? 'bg-green-100 text-green-800' : 
                        feedback.roleReadiness === 'needs_practice' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }>
                        {feedback.roleReadiness.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interview.recommendations.map((action, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`recommendation-${index}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Retake Option with LinkedIn and Payment tabs */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardHeader>
                <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  {interview.overallScore < 70 ? 'Improve Your Score' : 'Perfect Your Performance'}
                </CardTitle>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                  {interview.overallScore < 70 
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
                        data-testid="retake-interview-button"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay $5 to Retake
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <PayPalInterviewPayment
                          amount={5}
                          sessionId={sessionId || ''}
                          interviewType="virtual_interview"
                          onSuccess={handlePaymentSuccess}
                          onCancel={() => setShowRetakePayment(false)}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold"
                onClick={() => setLocation('/dashboard')}
                data-testid="back-to-dashboard-main"
              >
                Return to Dashboard
              </Button>
              {interview.overallScore >= 70 && (
                <Button 
                  variant="outline" 
                  className="w-full border-2"
                  onClick={() => setLocation('/virtual-interview-start')}
                  data-testid="take-another-interview"
                >
                  Take Another Interview
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
