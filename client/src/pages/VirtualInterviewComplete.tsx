import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, ArrowRight, RefreshCw, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PayPalHostedButton from '@/components/PayPalHostedButton';
import { Badge } from '@/components/ui/badge';

export default function VirtualInterviewComplete() {
  const [, params] = useRoute('/virtual-interview-complete/:sessionId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [completing, setCompleting] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const [showRetakePayment, setShowRetakePayment] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);

  const sessionId = params?.sessionId;

  useEffect(() => {
    if (!sessionId) {
      setLocation('/virtual-interview-start');
      return;
    }
    completeInterview();
  }, [sessionId]);

  const completeInterview = async () => {
    try {
      setCompleting(true);
      
      const response = await apiRequest(`/api/virtual-interview/${sessionId}/complete`, 'POST');
      
      setInterviewId(response.interviewId);
      setInterviewData(response);
      setCompleted(true);
      
      toast({
        title: "Interview Completed",
        description: "Your interview has been completed and analyzed. You can now view your feedback!",
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
                Congratulations! You've successfully completed your virtual AI interview.
                Your responses have been analyzed and your personalized feedback is ready.
              </p>
            </div>

            {/* Show retake option for low scores or recruiter-assigned interviews */}
            {(interviewData?.overallScore < 70 || interviewData?.assignedByRecruiter) && (
              <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 mb-4">
                <CardHeader>
                  <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2 text-lg">
                    <RefreshCw className="w-5 h-5" />
                    {interviewData?.overallScore < 70 ? 'Improve Your Score' : 'Retake Available'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {interviewData?.assignedByRecruiter 
                      ? 'This interview was assigned by a recruiter. You can retake it to improve your performance and show your best abilities!'
                      : `Your score of ${interviewData?.overallScore}% shows room for improvement. Retake the interview to practice and improve your performance!`}
                  </p>
                  
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Interview Retake</span>
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
                        purpose="virtual_interview"
                        amount={5}
                        itemName={`${(interviewData?.role || 'Interview').replace(/_/g, ' ')} Retake`}
                        onPaymentSuccess={() => {
                          toast({
                            title: "Payment Successful!",
                            description: "Your interview retake access has been granted. Starting new interview...",
                          });
                          
                          setTimeout(() => {
                            setLocation('/virtual-interview-start');
                          }, 1500);
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
            
            <div className="space-y-3">
              <Button
                onClick={goToFeedback}
                className="w-full"
                size="lg"
              >
                View Your Feedback
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                onClick={startNewInterview}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Start Another Interview
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your interview results have been saved to your profile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}