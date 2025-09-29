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
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Code, 
  Clock, 
  Building, 
  User, 
  CheckCircle,
  AlertCircle,
  LogIn
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface InvitationData {
  valid: boolean;
  interviewType: string;
  role: string;
  company: string;
  difficulty: string;
  isUsed: boolean;
  jobPostingId?: number;
}

export default function InterviewInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/interviews/invite/${token}`);
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setInvitation(data);
      } else {
        setError(data.message || 'Invalid invitation');
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!user) {
      // Redirect to auth page with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/auth?returnUrl=${returnUrl}&mode=signup`);
      return;
    }

    if (!invitation) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/interviews/invite/${token}/use`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Interview assigned successfully! Redirecting...",
        });
        
        // Redirect to the interview
        setTimeout(() => {
          navigate(data.interviewUrl);
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to start interview",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'virtual':
        return <Video className="h-8 w-8 text-blue-600" />;
      case 'mock':
        return <Code className="h-8 w-8 text-green-600" />;
      default:
        return <Video className="h-8 w-8 text-blue-600" />;
    }
  };

  const getInterviewTypeText = (type: string) => {
    switch (type) {
      case 'virtual':
        return 'Virtual AI Interview';
      case 'mock':
        return 'Mock Coding Interview';
      default:
        return 'Interview';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Not Found</h2>
            <p className="text-gray-600 mb-4">The interview invitation could not be found.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.isUsed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Completed</h2>
            <p className="text-gray-600 mb-4">This interview invitation has already been used.</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getInterviewIcon(invitation.interviewType)}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            You're Invited to an Interview
          </CardTitle>
          <p className="text-gray-600">
            Complete the interview process to apply for this position
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Interview Details */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Interview Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{getInterviewTypeText(invitation.interviewType)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium">{invitation.role}</p>
                </div>
              </div>
              
              {invitation.company && (
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium">{invitation.company}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <Badge className={getDifficultyColor(invitation.difficulty)}>
                    {invitation.difficulty.charAt(0).toUpperCase() + invitation.difficulty.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* What to Expect */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">What to Expect</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {invitation.interviewType === 'virtual' ? (
                <>
                  <li>• AI-powered conversational interview</li>
                  <li>• Questions tailored to the {invitation.role} role</li>
                  <li>• Real-time feedback and scoring</li>
                  <li>• Estimated duration: 30-45 minutes</li>
                </>
              ) : (
                <>
                  <li>• Live coding challenges</li>
                  <li>• Technical questions for {invitation.role}</li>
                  <li>• Code execution and testing</li>
                  <li>• Estimated duration: 45-60 minutes</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Button */}
          <div className="text-center">
            {!user ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You need to create an account or sign in to start the interview
                </p>
                <Button 
                  onClick={handleStartInterview}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In / Create Account
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleStartInterview}
                disabled={processing}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Starting Interview...
                  </>
                ) : (
                  <>
                    {getInterviewIcon(invitation.interviewType)}
                    <span className="ml-2">Start Interview</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Legal Notice */}
          <div className="text-xs text-gray-500 text-center">
            By proceeding, you agree to AutoJobr's Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
