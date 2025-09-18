import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  RefreshCw, 
  CreditCard, 
  ArrowLeft, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import PayPalHostedButton from '@/components/PayPalHostedButton';

interface MockInterviewResults {
  sessionId: string;
  score: number;
  totalQuestions: number;
  questionsAnswered: number;
  timeSpent: number;
  status: string;
  role: string;
  company: string;
  interviewType: string;
  difficulty: string;
  feedback: string;
  retakeAllowed: boolean;
  assignedByRecruiter?: boolean;
  questions: Array<{
    question: string;
    userAnswer: string;
    score: number;
    feedback: string;
    timeSpent: number;
  }>;
}

export default function MockInterviewResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRetakePayment, setShowRetakePayment] = useState(false);

  // Fetch interview results
  const { data: results, isLoading } = useQuery<MockInterviewResults>({
    queryKey: [`/api/mock-interview/results/${sessionId}`],
    enabled: !!sessionId,
  });

  // Process retake payment mutation  
  const retakePaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      // Use existing backend retake payment endpoint
      return await apiRequest(`/api/interviews/mock/${results?.sessionId}/retake-payment`, 'POST', {
        paymentProvider: 'paypal',
        amount: 500 // $5 in cents
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful!",
        description: "Your mock interview retake access has been granted. Starting new interview...",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/mock-interview'] });
      queryClient.removeQueries({ queryKey: [`/api/mock-interview/results/${sessionId}`] });
      
      // Redirect to start new mock interview
      setTimeout(() => {
        setLocation('/mock-interview');
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center pt-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Results Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to load interview results. The session may have expired.
            </p>
            <Button onClick={() => setLocation('/mock-interview')}>
              Back to Mock Interviews
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            onClick={() => setLocation('/mock-interview')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mock Interviews
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Interview Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {results.role.replace(/_/g, ' ')} at {results.company}
            </p>
          </div>
        </div>

        {/* Overall Score Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold ${getScoreColor(results.score)} mb-2`}>
                {results.score}%
              </div>
              <Badge className={getScoreBadge(results.score)} variant="secondary">
                {results.score >= 80 ? 'Excellent' : results.score >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {results.questionsAnswered}/{results.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Questions Answered</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  <Clock className="w-6 h-6 mx-auto" />
                </div>
                <div className="text-sm text-gray-600">{formatTime(results.timeSpent)}</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.difficulty.charAt(0).toUpperCase() + results.difficulty.slice(1)}
                </div>
                <div className="text-sm text-gray-600">Difficulty</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {results.interviewType.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-600">Type</div>
              </div>
            </div>

            {results.feedback && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Overall Feedback</h4>
                <p className="text-gray-700 dark:text-gray-300">{results.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question-by-Question Results */}
        {results.questions && results.questions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold">Question {index + 1}</h5>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{formatTime(question.timeSpent)}</Badge>
                        <Badge className={getScoreBadge(question.score)}>
                          {question.score}%
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{question.question}</p>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-3 mb-3">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Your Answer:</p>
                      <p className="text-blue-700 dark:text-blue-300">{question.userAnswer || 'No answer provided'}</p>
                    </div>
                    
                    {question.feedback && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Feedback:</p>
                        <p className="text-gray-700 dark:text-gray-300">{question.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Retake Section */}
        {(results.score < 70 || results.assignedByRecruiter) && !results.retakeAllowed && (
          <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 mb-6">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                {results.score < 70 ? 'Improve Your Score' : 'Retake Available'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {results.assignedByRecruiter 
                  ? 'This interview was assigned by a recruiter. You can retake it to improve your performance and show your best abilities!'
                  : `Your score of ${results.score}% shows room for improvement. Retake the interview to practice and improve your performance!`}
              </p>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Mock Interview Retake</span>
                  <span className="font-bold text-lg text-orange-600">$5</span>
                </div>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Fresh set of questions</li>
                  <li>• Same role and difficulty</li>
                  <li>• Instant access after payment</li>
                  <li>• Best score counts</li>
                </ul>
              </div>

              {!showRetakePayment ? (
                <Button
                  onClick={() => setShowRetakePayment(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay $5 to Retake Interview
                </Button>
              ) : (
                <div className="space-y-4">
                  <PayPalHostedButton
                    purpose="mock_interview"
                    amount={5}
                    itemName={`${results.role.replace(/_/g, ' ')} Mock Interview Retake`}
                    onPaymentSuccess={async (paymentData) => {
                      try {
                        await retakePaymentMutation.mutateAsync(paymentData);
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
                    description="Complete payment to retake your mock interview"
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => setLocation('/mock-interview')}
            variant="outline"
            size="lg"
          >
            Back to Mock Interviews
          </Button>
          
          <Button
            onClick={() => setLocation('/dashboard')}
            size="lg"
          >
            Return to Dashboard
          </Button>
          
          {results.retakeAllowed && (
            <Button
              onClick={() => setLocation('/mock-interview')}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Retake
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}