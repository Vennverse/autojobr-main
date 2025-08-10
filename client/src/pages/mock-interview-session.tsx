import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";
import { 
  Timer, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Pause, 
  Code, 
  MessageCircle, 
  Settings, 
  Lightbulb,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface MockInterview {
  id: number;
  sessionId: string;
  userId: string;
  role: string;
  company: string;
  interviewType: string;
  difficulty: string;
  language: string;
  totalQuestions: number;
  currentQuestion: number;
  timeRemaining: number;
  status: string;
  score: number;
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

interface MockInterviewQuestion {
  id: number;
  interviewId: number;
  questionNumber: number;
  question: string;
  questionType: string;
  difficulty: string;
  hints: string;
  testCases: string;
  sampleAnswer: string;
  userAnswer: string;
  userCode: string;
  feedback: string;
  score: number;
  timeSpent: number;
}

interface InterviewSession {
  interview: MockInterview;
  questions: MockInterviewQuestion[];
}

export default function MockInterviewSession() {
  const [, params] = useRoute('/mock-interview/:sessionId');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const sessionId = params?.sessionId;
  
  // Debug logging
  console.log('🔍 MockInterviewSession - Route params:', params);
  console.log('🔍 MockInterviewSession - SessionId:', sessionId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [userCode, setUserCode] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);
  const [codeOutput, setCodeOutput] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef(Date.now());
  
  // Anti-cheating state
  const [warningCount, setWarningCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch interview session
  const { data: session, isLoading, error } = useQuery<InterviewSession>({
    queryKey: [`/api/mock-interviews/${sessionId}`],
    enabled: !!sessionId,
    retry: false,
  });
  
  // Debug logging
  console.log('🔍 MockInterviewSession Query - sessionId:', sessionId);
  console.log('🔍 MockInterviewSession Query - isLoading:', isLoading);
  console.log('🔍 MockInterviewSession Query - session:', session);
  console.log('🔍 MockInterviewSession Query - error:', error);

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: number; answer: string; code?: string; timeSpent: number }) => {
      return await apiRequest('/api/mock-interview/answer', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Answer Submitted",
        description: "Your answer has been recorded and scored.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/mock-interviews/${sessionId}/start`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Interview Started!",
        description: "Good luck! Security monitoring is now active.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/mock-interviews/${sessionId}`] });
      setIsTimerRunning(true);
      enterFullscreen(); // Enter fullscreen mode when interview starts
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Run code mutation
  const runCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('/api/mock-interview/execute-code', 'POST', {
        code,
        language: session?.interview.language || 'javascript',
        testCases: currentQuestion?.testCases ? JSON.parse(currentQuestion.testCases) : []
      });
    },
    onSuccess: (result) => {
      setCodeOutput(result.output || result.error || 'Code executed successfully');
    },
    onError: (error) => {
      setCodeOutput(`Error: ${error.message}`);
    }
  });

  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/mock-interview/complete/${sessionId}`, 'POST');
    },
    onSuccess: () => {
      // SECURITY FIX: Clear cache to prevent stale retakeAllowed data
      queryClient.removeQueries({ queryKey: [`/api/mock-interview/session/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/mock-interview'] });
      
      toast({
        title: "Interview Completed!",
        description: "Redirecting to results...",
      });
      navigate(`/mock-interview/results/${sessionId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Load saved answer for current question
  useEffect(() => {
    if (session?.questions[currentQuestionIndex]) {
      const question = session.questions[currentQuestionIndex];
      setUserAnswer(question.userAnswer || '');
      setUserCode(question.userCode || '');
      setTimeSpent(question.timeSpent || 0);
      questionStartTime.current = Date.now();
    }
  }, [currentQuestionIndex, session]);

  // Anti-cheating measures
  useEffect(() => {
    if (session?.interview.status !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        setWarningCount(prev => prev + 1);
        
        toast({
          title: "Warning: Tab Switch Detected",
          description: `You've switched tabs ${newCount} times. Multiple violations may result in interview cancellation.`,
          variant: "destructive"
        });
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const newCount = copyAttempts + 1;
      setCopyAttempts(newCount);
      setWarningCount(prev => prev + 1);
      
      toast({
        title: "Warning: Copy Attempt Detected",
        description: `Copy/paste is disabled. Attempt ${newCount} recorded.`,
        variant: "destructive"
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        title: "Warning: Paste Blocked",
        description: "Pasting content is not allowed during the interview.",
        variant: "destructive"
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common cheating key combinations
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'f' || e.key === 't' || e.key === 'w')
      ) {
        e.preventDefault();
        setWarningCount(prev => prev + 1);
        toast({
          title: "Warning: Blocked Action",
          description: "Keyboard shortcuts are disabled during the interview.",
          variant: "destructive"
        });
      }
      
      // Block F12 and other developer tools shortcuts
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        toast({
          title: "Warning: Developer Tools Blocked",
          description: "Developer tools are not allowed during the interview.",
          variant: "destructive"
        });
      }
    };

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      toast({
        title: "Warning: Right Click Disabled",
        description: "Right-click is disabled during the interview.",
        variant: "destructive"
      });
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && session?.interview.status === 'in_progress') {
        setWarningCount(prev => prev + 1);
        toast({
          title: "Warning: Fullscreen Exited",
          description: "Please stay in fullscreen mode during the interview.",
          variant: "destructive"
        });
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [session?.interview.status, tabSwitchCount, copyAttempts, toast]);

  // Enter fullscreen when interview starts
  const enterFullscreen = async () => {
    if (containerRef.current && !document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (error) {
        console.warn('Fullscreen not supported or denied');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading interview session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Session Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The interview session could not be found or has expired.</p>
          <Button onClick={() => navigate('/mock-interview')}>
            Back to Mock Interviews
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    const currentTimeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    
    await submitAnswerMutation.mutateAsync({
      questionId: currentQuestion.id,
      answer: userAnswer,
      code: currentQuestion.questionType === 'coding' ? userCode : undefined,
      timeSpent: currentTimeSpent
    });

    // Move to next question or complete interview
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setUserCode('');
      setTimeSpent(0);
      setShowHints(false);
      setShowTestCases(false);
    } else {
      completeInterviewMutation.mutate();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRunCode = () => {
    if (userCode.trim()) {
      runCodeMutation.mutate(userCode);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'coding': return <Code className="w-5 h-5" />;
      case 'behavioral': return <MessageCircle className="w-5 h-5" />;
      case 'system_design': return <Settings className="w-5 h-5" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const hints = currentQuestion?.hints ? (() => {
    try {
      // If it's already an array, return it directly
      if (Array.isArray(currentQuestion.hints)) {
        return currentQuestion.hints;
      }
      // Otherwise try to parse as JSON
      return JSON.parse(currentQuestion.hints);
    } catch (error) {
      console.warn('Failed to parse hints:', error);
      return [];
    }
  })() : [];
  
  const testCases = currentQuestion?.testCases ? (() => {
    try {
      // If it's already an array, return it directly
      if (Array.isArray(currentQuestion.testCases)) {
        return currentQuestion.testCases;
      }
      // Otherwise try to parse as JSON
      return JSON.parse(currentQuestion.testCases);
    } catch (error) {
      console.warn('Failed to parse test cases:', error);
      return [];
    }
  })() : [];

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {session.interview.role} Interview
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {session.interview.company || 'Mock Company'} • {session.interview.interviewType.replace('_', ' ')}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-600" />
                <span className="font-mono text-lg">{formatTime(timeSpent)}</span>
              </div>
              {/* Security status indicator */}
              {session?.interview.status === 'in_progress' && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 dark:text-gray-400">Monitoring Active</span>
                  {warningCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {warningCount} warning{warningCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </span>
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(currentQuestion?.questionType || '')}
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <Badge className={getDifficultyColor(currentQuestion?.difficulty || '')}>
                    {currentQuestion?.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="text-gray-900 dark:text-gray-100 text-lg leading-relaxed">
                    {currentQuestion?.question}
                  </p>
                </div>

                {/* Hints */}
                {hints.length > 0 && (
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHints(!showHints)}
                      className="mb-3"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {showHints ? 'Hide' : 'Show'} Hints ({hints.length})
                    </Button>
                    {showHints && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <ul className="space-y-2">
                          {hints.map((hint: string, index: number) => (
                            <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                              {index + 1}. {hint}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Test Cases for Coding Questions */}
                {currentQuestion?.questionType === 'coding' && testCases.length > 0 && (
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTestCases(!showTestCases)}
                      className="mb-3"
                    >
                      {showTestCases ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showTestCases ? 'Hide' : 'Show'} Test Cases ({testCases.length})
                    </Button>
                    {showTestCases && (
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="space-y-3">
                          {testCases.map((testCase: any, index: number) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                Test Case {index + 1}: {testCase.description}
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Input:</span>
                                  <code className="ml-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                    {JSON.stringify(testCase.input)}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Expected:</span>
                                  <code className="ml-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                    {JSON.stringify(testCase.expected)}
                                  </code>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Answer Input */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
              </CardHeader>
              <CardContent>
                {currentQuestion?.questionType === 'coding' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Explanation
                      </label>
                      <Textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Explain your approach and thought process..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Code ({session.interview.language})
                      </label>
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <Editor
                          height="300px"
                          defaultLanguage={session.interview.language}
                          value={userCode}
                          onChange={(value) => setUserCode(value || '')}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            automaticLayout: true,
                          }}
                        />
                      </div>
                      
                      {/* Run Code Button and Output */}
                      {userCode && (
                        <div className="mt-4 space-y-3">
                          <Button
                            onClick={handleRunCode}
                            disabled={runCodeMutation.isPending}
                            variant="outline"
                            className="w-full"
                          >
                            {runCodeMutation.isPending ? (
                              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            Run Code
                          </Button>
                          
                          {codeOutput && (
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                              <div className="text-gray-400 text-xs mb-2">Output:</div>
                              <pre className="whitespace-pre-wrap">{codeOutput}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[200px]"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div>
            <Card className="bg-white dark:bg-gray-800 mb-6">
              <CardHeader>
                <CardTitle>Interview Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        index === currentQuestionIndex
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : question.userAnswer
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : question.userAnswer
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {question.userAnswer ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Question {index + 1}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {question.questionType.replace('_', ' ')} • {question.difficulty}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="pt-6">
                {session.interview.status === 'assigned' && session.interview.currentQuestion === 0 ? (
                  <div className="text-center">
                    <Button
                      onClick={() => startInterviewMutation.mutate()}
                      disabled={startInterviewMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {startInterviewMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Start Interview
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={submitAnswerMutation.isPending || completeInterviewMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {submitAnswerMutation.isPending || completeInterviewMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      ) : currentQuestionIndex === session.questions.length - 1 ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      {currentQuestionIndex === session.questions.length - 1 ? 'Complete' : 'Next'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}