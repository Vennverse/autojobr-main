import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, MessageCircle, Clock, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
}

export default function VirtualInterview() {
  const [, params] = useRoute('/virtual-interview/:sessionId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [interview, setInterview] = useState<InterviewState | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const sessionId = params?.sessionId;

  useEffect(() => {
    if (!sessionId) {
      setLocation('/virtual-interview-start');
      return;
    }
    loadCurrentQuestion();
  }, [sessionId]);

  const loadCurrentQuestion = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/virtual-interview/${sessionId}/question`);
      
      setInterview({
        sessionId: sessionId!,
        status: 'active',
        currentQuestion: response.question,
        questionNumber: response.questionNumber,
        totalQuestions: response.totalQuestions,
        timeRemaining: response.timeRemaining,
        category: response.category
      });

      // Add interviewer question to messages
      setMessages(prev => [...prev, {
        sender: 'interviewer',
        content: response.question,
        timestamp: new Date().toISOString()
      }]);

      setStartTime(Date.now());
    } catch (error: any) {
      console.error('Error loading question:', error);
      
      if (error.message.includes('Interview completed')) {
        // Interview is complete, redirect to feedback
        setLocation(`/virtual-interview-feedback/${sessionId}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to load interview question",
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Virtual AI Interview
            </h1>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(interview.timeRemaining)}</span>
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
                <div className="flex-1 space-y-4 overflow-y-auto mb-4 max-h-80">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 ${
                        message.sender === 'candidate' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                      placeholder="Type your response to the interview question..."
                      className="min-h-[120px] resize-none"
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Take your time to provide a thoughtful response
                    </p>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Take your time to think before responding</li>
                  <li>• Provide specific examples when possible</li>
                  <li>• Explain your thought process clearly</li>
                  <li>• Ask clarifying questions if needed</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}