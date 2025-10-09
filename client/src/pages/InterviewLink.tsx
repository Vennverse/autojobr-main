import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Video, Code, Clock, AlertCircle, FileText } from 'lucide-react';

export default function InterviewLink() {
  const [, params] = useRoute('/interview-link/:linkId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const linkId = params?.linkId;

  useEffect(() => {
    if (!linkId) {
      setError('Invalid interview link');
      setLoading(false);
      return;
    }

    loadInterviewLink();
  }, [linkId]);

  const loadInterviewLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interviews/link/${linkId}`);

      if (response.status === 410) {
        setError('This interview link has expired');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Interview link not found');
      }

      const data = await response.json();
      setInterviewData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview link');
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      setLocation(`/auth?mode=login&returnUrl=${encodeURIComponent(`/interview-link/${linkId}`)}`);
      return;
    }

    try {
      setStarting(true);
      const response = await fetch(`/api/interviews/link/${linkId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          domain: interviewData?.domain || 'general'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start interview');
      }

      const data = await response.json();

      toast({
        title: "Interview Started",
        description: "Redirecting you to your interview...",
      });

      setLocation(data.redirectUrl);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading interview...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Interview Link Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAssignmentIcon = () => {
    if (interviewData?.interviewType === 'test') {
      return <FileText className="h-6 w-6 text-purple-600" />;
    } else if (interviewData?.interviewType === 'virtual' || interviewData?.interviewType === 'chat') {
      return <Video className="h-6 w-6 text-blue-600" />;
    } else {
      return <Code className="h-6 w-6 text-green-600" />;
    }
  };

  const getAssignmentTitle = () => {
    if (interviewData?.interviewType === 'test') {
      return 'Test Assignment';
    } else {
      return 'Interview Invitation';
    }
  };

  const getAssignmentBadge = () => {
    if (interviewData?.interviewType === 'test') {
      return 'Test Assessment';
    } else if (interviewData?.interviewType === 'virtual' || interviewData?.interviewType === 'chat') {
      return 'AI Interview';
    } else {
      return 'Coding Test';
    }
  };

  const getExpectationsList = () => {
    if (interviewData?.interviewType === 'test') {
      return (
        <>
          <li>• Timed test questions</li>
          <li>• Multiple question types</li>
          <li>• Instant scoring and feedback</li>
        </>
      );
    } else if (interviewData?.interviewType === 'virtual' || interviewData?.interviewType === 'chat') {
      return (
        <>
          <li>• AI-powered conversational interview</li>
          <li>• Real-time questions and feedback</li>
          <li>• Professional assessment and scoring</li>
        </>
      );
    } else {
      return (
        <>
          <li>• Technical coding challenges</li>
          <li>• Live code execution environment</li>
          <li>• Automated testing and scoring</li>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            {getAssignmentIcon()}
            {getAssignmentTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {interviewData?.role}
              </h3>
              {interviewData?.company && (
                <p className="text-gray-600 dark:text-gray-400">at {interviewData.company}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="capitalize">
                {getAssignmentBadge()}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {interviewData?.difficulty} Level
              </Badge>
            </div>

            {interviewData?.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Expires: {new Date(interviewData.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What to Expect:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              {getExpectationsList()}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={startInterview}
              disabled={starting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              size="lg"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  {isAuthenticated ? `Start ${interviewData?.interviewType === 'test' ? 'Test' : 'Interview'}` : 'Login to Start'}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              size="lg"
            >
              Cancel
            </Button>
          </div>

          {!isAuthenticated && (
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              You'll need to login or create an account to take this {interviewData?.interviewType === 'test' ? 'test' : 'interview'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}