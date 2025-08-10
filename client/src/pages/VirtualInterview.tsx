import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InterviewQuestion {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  category: string;
  timeRemaining?: number;
}

interface InterviewSession {
  interviewId: number;
  sessionId: string;
  status: string;
  greeting: string;
  configuration: {
    interviewType: string;
    role: string;
    company?: string;
    difficulty: string;
    duration: number;
    interviewerPersonality: string;
  };
}

export default function VirtualInterview() {
  const [, setLocation] = useLocation();
  const [match] = useRoute("/virtual-interview/:sessionId");
  const sessionId = match?.sessionId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [response, setResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes per question
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);

  // Get current question
  const { data: questionData, isLoading: questionLoading, error: questionError } = useQuery({
    queryKey: ['/api/virtual-interview/question', sessionId],
    queryFn: () => apiRequest('GET', `/api/virtual-interview/${sessionId}/question`),
    enabled: !!sessionId && !!interviewSession,
    retry: false
  });

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: (data: { response: string; timeSpent: number }) =>
      apiRequest('POST', `/api/virtual-interview/${sessionId}/response`, data),
    onSuccess: (data) => {
      if (data.isComplete) {
        completeInterviewMutation.mutate();
      } else {
        // Fetch next question
        queryClient.invalidateQueries({ queryKey: ['/api/virtual-interview/question', sessionId] });
        setResponse("");
        setQuestionStartTime(Date.now());
        setTimeLeft(300);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit response",
        variant: "destructive"
      });
    }
  });

  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/virtual-interview/${sessionId}/complete`),
    onSuccess: () => {
      setLocation(`/virtual-interview/${sessionId}/feedback`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete interview",
        variant: "destructive"
      });
    }
  });

  // Timer effect
  useEffect(() => {
    if (!currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit if time runs out
          if (response.trim()) {
            handleSubmitResponse();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, response]);

  // Update current question when data changes
  useEffect(() => {
    if (questionData) {
      setCurrentQuestion(questionData);
      setTimeLeft(300); // Reset timer for new question
      setQuestionStartTime(Date.now());
    }
  }, [questionData]);

  // Handle question error
  useEffect(() => {
    if (questionError) {
      if ((questionError as any)?.message?.includes('Interview completed')) {
        completeInterviewMutation.mutate();
      } else {
        toast({
          title: "Error",
          description: (questionError as any)?.message || "Failed to load question",
          variant: "destructive"
        });
      }
    }
  }, [questionError]);

  // Get session from URL parameters or localStorage
  useEffect(() => {
    if (!sessionId) {
      setLocation('/virtual-interview/start');
      return;
    }

    // Try to get session data from localStorage or initialize
    const storedSession = localStorage.getItem(`interview_session_${sessionId}`);
    if (storedSession) {
      try {
        setInterviewSession(JSON.parse(storedSession));
      } catch (e) {
        console.error('Failed to parse stored session:', e);
        setLocation('/virtual-interview/start');
      }
    } else {
      // If no stored session, redirect to start
      setLocation('/virtual-interview/start');
    }
  }, [sessionId, setLocation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitResponse = () => {
    if (!response.trim() || !currentQuestion) return;
    
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    submitResponseMutation.mutate({
      response: response.trim(),
      timeSpent
    });
  };

  if (!sessionId || !interviewSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading interview session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading next question...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>No question available. Please check your interview session.</p>
            <Button 
              onClick={() => setLocation('/dashboard')} 
              className="mt-4"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (currentQuestion.questionNumber / currentQuestion.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Virtual Interview Session
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Question {currentQuestion} of {totalQuestions}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interviewer */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 bg-blue-100 dark:bg-blue-900">
                    <AvatarFallback className="text-blue-600 dark:text-blue-300 font-semibold">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">Interview Assistant</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Virtual Interviewer
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {currentQuestion.question}
                    </p>
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      Category: {currentQuestion.category}
                    </div>
                  </div>
                  
                  {currentQuestion.questionNumber > 1 && (
                    <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Previous response recorded successfully
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Response Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Your Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here..."
                    className="min-h-[120px] resize-none"
                    data-testid="response-textarea"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {response.length} characters
                    </span>
                    
                    <Button 
                      onClick={handleSubmitResponse}
                      disabled={!response.trim() || submitResponseMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="submit-response"
                    >
                      {submitResponseMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {currentQuestion.questionNumber === currentQuestion.totalQuestions ? 'Complete Interview' : 'Next Question'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interview Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: currentQuestion.totalQuestions }, (_, i) => i + 1).map((q) => (
                    <div
                      key={q}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        q === currentQuestion.questionNumber
                          ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : q < currentQuestion.questionNumber
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          q === currentQuestion.questionNumber
                            ? 'bg-blue-500 text-white'
                            : q < currentQuestion.questionNumber
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {q < currentQuestion.questionNumber ? <CheckCircle className="w-3 h-3" /> : q}
                      </div>
                      <span className="text-sm">
                        Question {q}
                        {q === currentQuestion.questionNumber && ' (Current)'}
                        {q < currentQuestion.questionNumber && ' (Completed)'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Take your time to think before responding</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Use specific examples when possible</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Stay calm and be yourself</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Each question has a 5-minute time limit</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}