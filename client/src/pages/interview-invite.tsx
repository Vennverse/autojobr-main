import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Video, Code, Award, Users, Calendar, Building2, Briefcase } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function InterviewInvite() {
  const { token } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user is authenticated
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false
  });

  // Fetch invitation details
  const { data: invitationData, isLoading: inviteLoading, error: inviteError } = useQuery({
    queryKey: [`/api/interviews/invite/${token}`],
    enabled: !!token,
    retry: false
  });

  // Mutation to mark invitation as used
  const useInvitationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/interviews/invite/${token}/use`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      // Redirect to appropriate interview based on type
      const { interviewType, interviewConfig } = data;
      
      switch (interviewType) {
        case 'virtual':
          // Redirect to virtual interview start
          navigate(`/virtual-interview-start?fromInvite=true`);
          break;
        case 'mock':
          // Redirect to mock interview
          navigate(`/mock-interview?fromInvite=true`);
          break;
        case 'video-interview':
          // Redirect to video interview
          navigate(`/ChatInterview?fromInvite=true`);
          break;
        default:
          toast({
            title: "Interview Ready",
            description: "Your interview has been set up. Check your dashboard.",
          });
          navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process invitation",
        variant: "destructive"
      });
    }
  });

  // Auto-process invitation if user is authenticated
  useEffect(() => {
    if (user && invitationData && !isProcessing) {
      setIsProcessing(true);
      useInvitationMutation.mutate();
    }
  }, [user, invitationData, isProcessing]);

  const handleSignUpToInterview = () => {
    // Redirect to auth page with return URL
    const returnUrl = encodeURIComponent(`/interview-invite/${token}`);
    navigate(`/auth?mode=signup&returnUrl=${returnUrl}`);
  };

  const handleLoginToInterview = () => {
    // Redirect to auth page with return URL
    const returnUrl = encodeURIComponent(`/interview-invite/${token}`);
    navigate(`/auth?mode=login&returnUrl=${returnUrl}`);
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual':
        return <Video className="h-12 w-12 text-blue-600" />;
      case 'mock':
        return <Code className="h-12 w-12 text-green-600" />;
      case 'skills-verification':
        return <Award className="h-12 w-12 text-purple-600" />;
      case 'personality':
        return <Users className="h-12 w-12 text-orange-600" />;
      default:
        return <Briefcase className="h-12 w-12 text-gray-600" />;
    }
  };

  const getInterviewTypeName = (type: string) => {
    const names: Record<string, string> = {
      'virtual': 'Virtual AI Interview',
      'mock': 'Mock Interview',
      'skills-verification': 'Skills Verification',
      'personality': 'Personality Assessment',
      'video-interview': 'Video Interview'
    };
    return names[type] || 'Interview';
  };

  if (userLoading || inviteLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteError || !invitationData?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This interview invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full" data-testid="button-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invitation } = invitationData;
  const jobPosting = invitation.jobPosting;

  // If user is authenticated and processing, show loading state
  if (user && isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-gray-600">Setting up your interview...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is not authenticated - show invitation details and prompt to sign up/login
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl" data-testid="card-interview-invite">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getInterviewTypeIcon(invitation.interviewType)}
          </div>
          <CardTitle className="text-2xl">
            You've Been Invited to an Interview!
          </CardTitle>
          <CardDescription className="text-lg">
            {getInterviewTypeName(invitation.interviewType)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Job Details */}
          {jobPosting && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3 mb-3">
                <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-lg" data-testid="text-job-title">
                    {jobPosting.title}
                  </h3>
                  <p className="text-gray-600" data-testid="text-company">
                    {jobPosting.company}
                  </p>
                  {jobPosting.location && (
                    <p className="text-sm text-gray-500">{jobPosting.location}</p>
                  )}
                </div>
              </div>
              
              {jobPosting.description && (
                <p className="text-sm text-gray-700 line-clamp-3">
                  {jobPosting.description}
                </p>
              )}
            </div>
          )}

          {/* Interview Details */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Interview Details
            </h4>
            <div className="text-sm space-y-1 text-gray-700">
              <p>Type: {getInterviewTypeName(invitation.interviewType)}</p>
              <p>Expires: {new Date(invitation.expiryDate).toLocaleDateString()}</p>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              To take this interview, you need to create a free account or sign in. 
              After completing the interview, you'll automatically be added as an applicant for this position.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleSignUpToInterview}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              data-testid="button-signup-interview"
            >
              Sign Up & Start Interview
            </Button>
            
            <Button 
              onClick={handleLoginToInterview}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-login-interview"
            >
              Already have an account? Log In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
