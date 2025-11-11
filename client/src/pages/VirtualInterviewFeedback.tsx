import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Star, TrendingUp, Award, ArrowLeft, Loader2, RefreshCw, Target, Briefcase, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PayPalInterviewPayment from '@/components/PayPalInterviewPayment';

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
  
  // All hooks at the top
  const [showRetakePayment, setShowRetakePayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

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
      setTimeout(() => setLocation('/virtual-interview/start'), 1500);
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

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <p className="mb-4">Invalid session. Please start a new interview.</p>
            <Button onClick={() => setLocation('/virtual-interview/start')} className="w-full" data-testid="start-new-interview">
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
              <Button variant="outline" onClick={() => setLocation('/virtual-interview/start')} className="w-full">
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

            {/* Retake Option */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardHeader>
                <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  {interview.overallScore < 70 ? 'Improve Your Score' : 'Perfect Your Performance'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {interview.overallScore < 70 
                    ? "Your performance shows room for growth. Retake to practice and achieve better results!"
                    : "Great work! Retake to refine your skills even further and maximize your hiring potential!"}
                </p>

                {!showRetakePayment ? (
                  <div className="space-y-3">
                    <div className="bg-white/80 dark:bg-gray-900/50 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Interview Retake</span>
                        <span className="font-bold text-2xl text-purple-600 dark:text-purple-400">$5</span>
                      </div>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                        <li>✓ Fresh set of questions tailored to your role</li>
                        <li>✓ Same difficulty level for consistent practice</li>
                        <li>✓ Instant access after payment confirmation</li>
                        <li>✓ Your best score is saved automatically</li>
                      </ul>
                    </div>

                    <Button
                      onClick={() => setShowRetakePayment(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                      disabled={processingPayment}
                      data-testid="retake-interview-button"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retake Interview - $5
                        </>
                      )}
                    </Button>
                  </div>
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
                  onClick={() => setLocation('/virtual-interview/start')}
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
