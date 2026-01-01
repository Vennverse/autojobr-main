import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Clock, DollarSign, CheckCircle, MessageCircle, History, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PayPalHostedButton from '@/components/PayPalHostedButton';
import { usePaymentAccess } from '@/hooks/usePaymentAccess';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

interface InterviewConfig {
  interviewType: string;
  role: string;
  company: string;
  difficulty: string;
  duration: number;
  interviewerPersonality: string;
}

export default function VirtualInterviewStart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<InterviewConfig>({
    interviewType: 'technical',
    role: 'software_engineer',
    company: '',
    difficulty: 'medium',
    duration: 30,
    interviewerPersonality: 'professional'
  });
  
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    remainingFree: number;
    needsPayment: boolean;
    cost?: number;
    isRetake?: boolean;
    isRecruiterAssigned?: boolean;
    isPractice?: boolean;
  } | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Fetch past interviews
  const { data: pastInterviews, isLoading: loadingHistory } = useQuery({
    queryKey: ['/api/virtual-interview/history'],
    queryFn: () => apiRequest('/api/virtual-interview/history', 'GET'),
    retry: false
  });

  const checkEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const response = await apiRequest('/api/virtual-interview/check-eligibility', 'POST');
      
      setEligibility({
        eligible: true,
        remainingFree: response.remainingFree,
        needsPayment: false
      });
    } catch (error: any) {
      if (error.message.includes('402')) {
        // No free interviews remaining - show payment for retake
        setEligibility({
          eligible: false,
          remainingFree: 0,
          needsPayment: true,
          cost: 5
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to check interview eligibility",
          variant: "destructive",
        });
      }
    } finally {
      setCheckingEligibility(false);
    }
  };



  const startChatInterview = async () => {
    try {
      setLoading(true);
      
      const response = await apiRequest('/api/chat-interview/start-chat', 'POST', {
        role: config.role,
        interviewType: config.interviewType,
        difficulty: config.difficulty,
        duration: config.duration,
        totalQuestions: 5,
        personality: config.interviewerPersonality
      });

      toast({
        title: "AI Interview Started",
        description: "Your AI interview has begun. Good luck!",
      });

      setLocation(`/chat-interview/${response.sessionId}`);
    } catch (error: any) {
      console.error('Error starting chat interview:', error);
      
      toast({
        title: "Error", 
        description: "Failed to start chat interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    toast({
      title: "Payment Successful",
      description: "You can now start your interview. Payment confirmed!",
    });
    setShowPayment(false);
    setEligibility({
      eligible: true,
      remainingFree: 1,
      needsPayment: false
    });
    
    // Automatically start the interview after payment
    startChatInterview();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              AI-Powered Virtual Interview
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Practice with our advanced AI interviewer that adapts to your role. 
              Get detailed feedback, performance analysis, and <span className="font-semibold text-purple-600 dark:text-purple-400">discover your hiring chances</span>!
            </p>
            
            {/* Key Features Pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-4 py-2">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Real-time AI Conversations
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-1.5" />
                Detailed Analytics
              </Badge>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 px-4 py-2">
                <Award className="w-4 h-4 mr-1.5" />
                Hiring Probability Score
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span>Interview Configuration</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="interviewType">Interview Type</Label>
                      <Select
                        value={config.interviewType}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, interviewType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                          <SelectItem value="system_design">System Design</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="accounting">Accounting</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={config.role}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="software_engineer">Software Engineer</SelectItem>
                          <SelectItem value="frontend_developer">Frontend Developer</SelectItem>
                          <SelectItem value="backend_developer">Backend Developer</SelectItem>
                          <SelectItem value="fullstack_developer">Full Stack Developer</SelectItem>
                          <SelectItem value="data_scientist">Data Scientist</SelectItem>
                          <SelectItem value="data_analyst">Data Analyst</SelectItem>
                          <SelectItem value="devops_engineer">DevOps Engineer</SelectItem>
                          <SelectItem value="mobile_developer">Mobile Developer</SelectItem>
                          <SelectItem value="qa_engineer">QA Engineer</SelectItem>
                          <SelectItem value="cybersecurity_specialist">Cybersecurity Specialist</SelectItem>
                          <SelectItem value="product_manager">Product Manager</SelectItem>
                          <SelectItem value="project_manager">Project Manager</SelectItem>
                          <SelectItem value="business_analyst">Business Analyst</SelectItem>
                          <SelectItem value="sales_representative">Sales Representative</SelectItem>
                          <SelectItem value="sales_manager">Sales Manager</SelectItem>
                          <SelectItem value="account_manager">Account Manager</SelectItem>
                          <SelectItem value="business_development">Business Development</SelectItem>
                          <SelectItem value="marketing_manager">Marketing Manager</SelectItem>
                          <SelectItem value="digital_marketing_specialist">Digital Marketing Specialist</SelectItem>
                          <SelectItem value="content_marketing_specialist">Content Marketing Specialist</SelectItem>
                          <SelectItem value="social_media_manager">Social Media Manager</SelectItem>
                          <SelectItem value="financial_analyst">Financial Analyst</SelectItem>
                          <SelectItem value="investment_banker">Investment Banker</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="financial_planner">Financial Planner</SelectItem>
                          <SelectItem value="hr_manager">HR Manager</SelectItem>
                          <SelectItem value="talent_acquisition_specialist">Talent Acquisition Specialist</SelectItem>
                          <SelectItem value="operations_manager">Operations Manager</SelectItem>
                          <SelectItem value="supply_chain_manager">Supply Chain Manager</SelectItem>
                          <SelectItem value="consulting">Management Consultant</SelectItem>
                          <SelectItem value="ui_ux_designer">UI/UX Designer</SelectItem>
                          <SelectItem value="graphic_designer">Graphic Designer</SelectItem>
                          <SelectItem value="customer_success_manager">Customer Success Manager</SelectItem>
                          <SelectItem value="customer_support_specialist">Customer Support Specialist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select
                        value={config.difficulty}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, difficulty: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select
                        value={config.duration.toString()}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, duration: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      value={config.company}
                      onChange={(e) => setConfig(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g. Google, Microsoft, Startup..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="personality">Interviewer Personality</Label>
                    <Select
                      value={config.interviewerPersonality}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, interviewerPersonality: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="challenging">Challenging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Eligibility Check */}
                  {!eligibility && (
                    <Button
                      onClick={checkEligibility}
                      disabled={checkingEligibility}
                      className="w-full"
                      variant="outline"
                    >
                      {checkingEligibility ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking Eligibility...
                        </>
                      ) : (
                        'Check Eligibility'
                      )}
                    </Button>
                  )}

                  {/* This component is deprecated - use chat interviews instead */}

                  {/* Start Interview Button */}
                  {eligibility?.eligible && (
                    <div className="space-y-3">
                      <Button
                        onClick={startChatInterview}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        size="lg"
                        data-testid="start-ai-interview"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Starting AI Interview...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Start AI Interview
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {eligibility?.needsPayment && !showPayment && (
                    <Button
                      onClick={() => setShowPayment(true)}
                      className="w-full"
                      size="lg"
                      data-testid="show-payment-button"
                    >
                      {eligibility?.isRetake 
                        ? "Pay $5 to Retake Interview"
                        : "Pay $5 for Additional Interview"
                      }
                    </Button>
                  )}

                  {/* PayPal Payment Component */}
                  {showPayment && (
                    <div className="mt-6">
                      <PayPalHostedButton
                        purpose="virtual_interview"
                        amount={5}
                        itemName={eligibility?.isRetake 
                          ? "Virtual Interview Retake"
                          : "Additional Virtual Interview Practice"
                        }
                        onPaymentSuccess={(data) => {
                          toast({
                            title: "Payment Successful!",
                            description: "Your virtual interview access has been granted. Starting interview...",
                          });
                          
                          // Update eligibility to allow interview start
                          setEligibility(prev => prev ? {
                            ...prev,
                            eligible: true,
                            needsPayment: false
                          } : null);
                          setShowPayment(false);
                          
                          // Automatically start interview after payment
                          setTimeout(() => {
                            startChatInterview();
                          }, 1500);
                        }}
                        onPaymentError={(error) => {
                          toast({
                            title: "Payment Failed",
                            description: error.message || "There was an error processing your payment. Please try again.",
                            variant: "destructive",
                          });
                        }}
                        description="Complete payment to access your virtual interview practice session"
                        disabled={loading}
                      />
                      
                      <div className="mt-4 text-center">
                        <Button
                          variant="ghost"
                          onClick={() => setShowPayment(false)}
                          className="text-sm"
                        >
                          Cancel Payment
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              {/* Eligibility Status */}
              {eligibility && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Interview Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {eligibility.eligible ? (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Ready to Start</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {eligibility.remainingFree} free interview{eligibility.remainingFree !== 1 ? 's' : ''} remaining
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                        <DollarSign className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Payment Required</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${eligibility.cost} for additional interview
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    What You'll Get
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm">
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">AI-Powered Adaptive Interviewer</div>
                        <div className="text-gray-600 dark:text-gray-400">Natural conversation that adjusts to your responses</div>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Coding Questions for Technical Roles</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">NEW!</span> Get actual coding problems, algorithms, and system design questions for developer roles
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Comprehensive Performance Analysis</div>
                        <div className="text-gray-600 dark:text-gray-400">Detailed breakdown of technical, communication, and problem-solving skills</div>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Hiring Probability Score</div>
                        <div className="text-gray-600 dark:text-gray-400">Know your chances of getting hired based on your performance</div>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Personalized Improvement Plan</div>
                        <div className="text-gray-600 dark:text-gray-400">Actionable recommendations to enhance your interview skills</div>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Safe Practice Environment</div>
                        <div className="text-gray-600 dark:text-gray-400">Build confidence without the pressure of real interviews</div>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Free Users</span>
                    <Badge variant="secondary">1 Free Practice</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Premium Users</span>
                    <Badge variant="secondary">5 Free Practices</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Additional Practice</span>
                    <Badge>$5 per retake</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Past Interviews History Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Your Interview History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Loading your interview history...</p>
                </div>
              ) : pastInterviews && pastInterviews.length > 0 ? (
                <div className="space-y-4">
                  {pastInterviews.map((interview: any, index: number) => {
                    const getScoreColor = (score: number) => {
                      if (score >= 80) return 'text-green-600 dark:text-green-400';
                      if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
                      return 'text-red-600 dark:text-red-400';
                    };

                    const getScoreBadge = (score: number) => {
                      if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
                      if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
                      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
                    };

                    return (
                      <Card key={interview.id || index} className="border-2 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            {/* Interview Details */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-lg">
                                  {interview.role?.replace(/_/g, ' ') || 'Interview'}
                                </h4>
                                {interview.company && (
                                  <Badge variant="outline">{interview.company}</Badge>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {new Date(interview.startTime || interview.createdAt).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span className="capitalize">{interview.interviewType?.replace('_', ' ')}</span>
                                <span>•</span>
                                <span className="capitalize">{interview.difficulty}</span>
                                <span>•</span>
                                <span>{interview.duration || 30} min</span>
                              </div>

                              {/* Performance Metrics */}
                              {interview.status === 'completed' && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                  <div>
                                    <p className="text-xs text-gray-500">Overall Score</p>
                                    <p className={`text-lg font-bold ${getScoreColor(interview.overallScore || 0)}`}>
                                      {interview.overallScore || 0}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Technical</p>
                                    <div className="flex items-center gap-1">
                                      <Progress value={interview.technicalScore || 0} className="h-2 w-16" />
                                      <span className="text-sm font-medium">{interview.technicalScore || 0}%</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Communication</p>
                                    <div className="flex items-center gap-1">
                                      <Progress value={interview.communicationScore || 0} className="h-2 w-16" />
                                      <span className="text-sm font-medium">{interview.communicationScore || 0}%</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Questions</p>
                                    <p className="text-sm font-medium">
                                      {interview.questionsAsked || 0}/{interview.totalQuestions || 0}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Key Insights */}
                              {interview.status === 'completed' && (interview.strengths || interview.weaknesses) && (
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                                  {interview.strengths && interview.strengths.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Key Strengths
                                      </p>
                                      <ul className="text-xs text-gray-600 dark:text-gray-400 ml-4 mt-1">
                                        {interview.strengths.slice(0, 2).map((strength: string, i: number) => (
                                          <li key={i} className="list-disc">{strength}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {interview.weaknesses && interview.weaknesses.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Areas to Improve
                                      </p>
                                      <ul className="text-xs text-gray-600 dark:text-gray-400 ml-4 mt-1">
                                        {interview.weaknesses.slice(0, 2).map((weakness: string, i: number) => (
                                          <li key={i} className="list-disc">{weakness}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col justify-between gap-2 md:min-w-[180px]">
                              {interview.status === 'completed' ? (
                                <>
                                  <Badge className={getScoreBadge(interview.overallScore || 0)}>
                                    {interview.overallScore >= 80 ? 'Excellent' : interview.overallScore >= 60 ? 'Good' : 'Needs Work'}
                                  </Badge>
                                  <Button
                                    onClick={() => setLocation(`/virtual-interview/${interview.sessionId}/feedback`)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                  >
                                    <Award className="w-4 h-4 mr-2" />
                                    View Feedback
                                  </Button>
                                </>
                              ) : interview.status === 'active' ? (
                                <>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>
                                  <Button
                                    onClick={() => setLocation(`/chat-interview/${interview.sessionId}`)}
                                    size="sm"
                                    className="w-full"
                                  >
                                    Resume Interview
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                  {interview.status || 'Pending'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No Interview History Yet</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                    Start your first AI interview to build your practice history
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}