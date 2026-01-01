import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, MessageCircle, Clock, User, Bot, AlertTriangle, Sparkles, Target, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface InterviewMessage {
  sender: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

interface InterviewState {
  sessionId: string;
  status: 'active' | 'completed';
  currentQuestion: string;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  category: string;
  role: string;
}

export default function VirtualInterview() {
  const [, params] = useRoute('/virtual-interview/:sessionId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [interview, setInterview] = useState<InterviewState | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);

  const sessionId = params?.sessionId;
  
  // Auto-scroll to bottom only when NEW messages arrive (not on typing)
  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      previousMessageCountRef.current = messages.length;
    }
  }, [messages]);

  // Character count and quality indicators
  const characterCount = currentResponse.length;
  const minRecommendedChars = 100;
  const goodChars = 200;
  const getQualityIndicator = () => {
    if (characterCount === 0) return { color: 'text-gray-400', message: 'Start typing your response' };
    if (characterCount < minRecommendedChars) return { color: 'text-orange-500', message: 'Add more detail for a better response' };
    if (characterCount < goodChars) return { color: 'text-yellow-500', message: 'Good start! Add more specifics' };
    return { color: 'text-green-500', message: 'Great detail level!' };
  };
  
  const qualityIndicator = getQualityIndicator();
  const [isRedirecting, setIsRedirecting] = useState(!sessionId || sessionId === 'new');

  // Check session validity and redirect if needed
  useEffect(() => {
    if (!sessionId || sessionId === 'new') {
      setIsRedirecting(true);
      setLocation('/virtual-interview-start');
    } else {
      setIsRedirecting(false);
    }
  }, [sessionId, setLocation]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to interview setup...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Check authentication first
    if (authLoading) return;
    
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      const returnUrl = `/virtual-interview/${sessionId}`;
      setLocation(`/auth-page?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    loadCurrentQuestion();
  }, [sessionId, authLoading, isAuthenticated]);

  // Timer countdown effect
  useEffect(() => {
    if (!interview || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto-complete interview
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [interview, timeRemaining]);

  const loadCurrentQuestion = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/virtual-interview/${sessionId}/question`, 'GET');
      
      setInterview({
        sessionId: sessionId!,
        status: 'active',
        currentQuestion: response.question,
        questionNumber: response.questionNumber,
        totalQuestions: response.totalQuestions,
        timeRemaining: response.timeRemaining,
        category: response.category,
        role: response.role
      });
      
      // Set the timer
      setTimeRemaining(response.timeRemaining || 1800); // Default 30 minutes

      // Add interviewer question to messages (clear duplicate if reloading same question)
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => 
          !(msg.sender === 'interviewer' && msg.content === response.question)
        );
        return [...filteredMessages, {
          sender: 'interviewer',
          content: response.question,
          timestamp: new Date().toISOString()
        }];
      });

      setStartTime(Date.now());
    } catch (error: any) {
      console.error('Error loading question:', error);
      
      // Check if error response contains redirect information
      const errorData = error.response?.data || error;
      
      if (error.message.includes('Interview completed')) {
        // Interview is complete, redirect to feedback
        setLocation(`/virtual-interview-feedback/${sessionId}`);
      } else if (errorData.redirect) {
        // Server provided a redirect path
        toast({
          title: "Error",
          description: errorData.message || "Failed to load interview question",
          variant: "destructive",
        });
        setLocation(errorData.redirect);
      } else {
        toast({
          title: "Error",
          description: errorData.message || "Failed to load interview question",
          variant: "destructive",
        });
        setLocation('/virtual-interview-start');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!currentResponse.trim() || !interview || !startTime) return;

    try {
      setSubmitting(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      // Add candidate response to messages
      setMessages(prev => [...prev, {
        sender: 'candidate',
        content: currentResponse,
        timestamp: new Date().toISOString()
      }]);

      const response = await apiRequest(`/api/virtual-interview/${sessionId}/response`, 'POST', {
        response: currentResponse,
        timeSpent
      });

      setCurrentResponse('');

      if (response.isComplete) {
        // Interview completed, redirect to completion page
        setLocation(`/virtual-interview-complete/${sessionId}`);
      } else {
        // Load next question
        await loadCurrentQuestion();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeUp = async () => {
    toast({
      title: "Time's Up!",
      description: "Your interview time has expired. We'll now generate your feedback.",
      variant: "default",
    });
    
    try {
      await apiRequest(`/api/virtual-interview/${sessionId}/complete`, 'POST');
      setLocation(`/virtual-interview-complete/${sessionId}`);
    } catch (error) {
      console.error('Error completing interview:', error);
      toast({
        title: "Error",
        description: "Failed to complete interview",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-center text-gray-600 dark:text-gray-400">
              Loading your interview question...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center pt-6">
            <p className="text-gray-600 dark:text-gray-400">Interview session not found</p>
            <Button 
              onClick={() => setLocation('/virtual-interview-start')} 
              className="mt-4"
            >
              Start New Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (interview.questionNumber / interview.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Virtual AI Interview
              </h1>
              {interview.role && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Interviewing for: <span className="font-semibold">{interview.role}</span>
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={timeRemaining < 300 ? "destructive" : "secondary"} 
                className="flex items-center space-x-1"
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeRemaining)}</span>
              </Badge>
              <Badge variant="outline">
                Question {interview.questionNumber} of {interview.totalQuestions}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Interview Conversation</span>
                  <Badge variant="secondary" className="ml-auto">
                    {interview.category}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto mb-4 max-h-80 scroll-smooth">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 ${
                        message.sender === 'candidate' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                      data-testid={`message-${message.sender}-${index}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'interviewer' 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {message.sender === 'interviewer' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      
                      <div className={`flex-1 ${
                        message.sender === 'candidate' ? 'text-right' : ''
                      }`}>
                        <div className={`inline-block p-3 rounded-lg max-w-full ${
                          message.sender === 'interviewer'
                            ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                            : 'bg-blue-600 text-white'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Response Input */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Response
                    </label>
                    <Textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (currentResponse.trim() && !submitting) {
                            submitResponse();
                          }
                        }
                      }}
                      placeholder="Type your response to the interview question... (Press Shift+Enter for new line)"
                      className="min-h-[120px] resize-none"
                      disabled={submitting}
                      data-testid="textarea-response"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">Press Enter to submit, Shift+Enter for a new line</p>
                      <div className={`flex items-center gap-2 text-xs ${qualityIndicator.color}`}>
                        <Sparkles className="w-3 h-3" />
                        <span>{characterCount} characters - {qualityIndicator.message}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {characterCount < minRecommendedChars && currentResponse.length > 0 && (
                        <div className="flex items-center gap-1 text-orange-500 text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Short responses may receive lower scores</span>
                        </div>
                      )}
                      {characterCount >= goodChars && (
                        <div className="flex items-center gap-1 text-green-500 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          <span>Detailed response</span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={submitResponse}
                      disabled={!currentResponse.trim() || submitting}
                      className="px-6"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Response'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Session ID</p>
                  <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {sessionId}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Question Type</p>
                  <Badge variant="outline">{interview.category}</Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
                  <p className="text-sm">
                    Question {interview.questionNumber} of {interview.totalQuestions}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Success Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use the <strong>STAR method</strong>: Situation, Task, Action, Result</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Give <strong>specific examples</strong> from your experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Aim for <strong>200+ characters</strong> for detailed responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Explain your <strong>thought process</strong> clearly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Quantify results</strong> when possible (%, $, time saved)</span>
                  </li>
                </ul>
                
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                      <strong>Avoid:</strong> Vague answers, one-liners, and off-topic responses. They will negatively impact your score.
                    </div>
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