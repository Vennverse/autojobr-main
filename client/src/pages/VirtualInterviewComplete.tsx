import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function VirtualInterviewComplete() {
  const [, params] = useRoute('/virtual-interview-complete/:sessionId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [completing, setCompleting] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [interviewId, setInterviewId] = useState<number | null>(null);

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