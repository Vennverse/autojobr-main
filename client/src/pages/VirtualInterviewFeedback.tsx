import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Star, TrendingUp, Award, ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [match] = useRoute("/virtual-interview/:sessionId/feedback");
  const sessionId = match?.sessionId;
  const { toast } = useToast();

  // Fetch interview feedback from database
  const { data: feedbackData, isLoading, error } = useQuery<InterviewFeedback>({
    queryKey: ['/api/virtual-interview/feedback', sessionId],
    queryFn: () => apiRequest('GET', `/api/virtual-interview/${sessionId}/feedback`),
    enabled: !!sessionId,
    retry: false
  });

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Invalid session. Please start a new interview.</p>
            <Button onClick={() => setLocation('/virtual-interview/start')} className="mt-4">
              Start New Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading your interview feedback...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !feedbackData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              {(error as any)?.message || 'Failed to load interview feedback'}
            </p>
            <div className="space-y-2">
              <Button onClick={() => setLocation('/dashboard')} className="w-full">
                Return to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/virtual-interview/start')} 
                className="w-full"
              >
                Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { interview, feedback } = feedbackData;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="mb-4"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Interview Complete!
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Here's your detailed performance feedback
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Feedback */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Overall Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className={`text-6xl font-bold ${getScoreColor(interview.overallScore)}`}>
                    {interview.overallScore}%
                  </div>
                  <Badge className={getScoreBadgeColor(interview.overallScore)}>
                    {interview.overallScore >= 85 ? 'Excellent' : interview.overallScore >= 70 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feedback.performanceSummary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Technical Skills</span>
                      <span className={`font-semibold ${getScoreColor(feedback.technicalSkillsScore)}`}>
                        {feedback.technicalSkillsScore}%
                      </span>
                    </div>
                    <Progress value={feedback.technicalSkillsScore} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Problem Solving</span>
                      <span className={`font-semibold ${getScoreColor(feedback.problemSolvingScore)}`}>
                        {feedback.problemSolvingScore}%
                      </span>
                    </div>
                    <Progress value={feedback.problemSolvingScore} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Communication</span>
                      <span className={`font-semibold ${getScoreColor(feedback.communicationScore)}`}>
                        {feedback.communicationScore}%
                      </span>
                    </div>
                    <Progress value={feedback.communicationScore} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Adaptability</span>
                      <span className={`font-semibold ${getScoreColor(feedback.adaptabilityScore)}`}>
                        {feedback.adaptabilityScore}%
                      </span>
                    </div>
                    <Progress value={feedback.adaptabilityScore} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Stress Handling</span>
                      <span className={`font-semibold ${getScoreColor(feedback.stressHandling)}`}>
                        {feedback.stressHandling}%
                      </span>
                    </div>
                    <Progress value={feedback.stressHandling} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedback.keyStrengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedback.areasForImprovement.map((improvement, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{improvement}</span>
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
                <CardTitle>Session Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Questions:</span>
                    <span className="font-semibold">{interview.questionsAsked}/{interview.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                    <span className="font-semibold">{interview.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Interview Type:</span>
                    <span className="font-semibold capitalize">{interview.interviewType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Role:</span>
                    <span className="font-semibold capitalize">{interview.role.replace(/_/g, ' ')}</span>
                  </div>
                  {interview.company && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Company:</span>
                      <span className="font-semibold">{interview.company}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Readiness:</span>
                    <span className={`font-semibold capitalize ${
                      feedback.roleReadiness === 'ready' ? 'text-green-600' : 
                      feedback.roleReadiness === 'needs_practice' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {feedback.roleReadiness.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interview.recommendations.map((action, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setLocation('/dashboard')}
                data-testid="back-to-dashboard-main"
              >
                Return to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/virtual-interview/start')}
                data-testid="retake-interview"
              >
                Take Another Interview
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}