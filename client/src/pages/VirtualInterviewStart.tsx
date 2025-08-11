import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Clock, DollarSign, CheckCircle, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PayPalButton from '@/components/PayPalButton';

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

  const handlePaymentSuccess = () => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Virtual AI Interview
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Practice your interview skills with our AI-powered virtual interviewer. 
              Get personalized feedback and improve your performance.
            </p>
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
                          <SelectItem value="product_manager">Product Manager</SelectItem>
                          <SelectItem value="devops_engineer">DevOps Engineer</SelectItem>
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

                  {/* Payment Section for Retakes */}
                  {eligibility?.needsPayment && showPayment && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                          <DollarSign className="w-5 h-5" />
                          <span>Additional Interview - $5</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                          {eligibility?.isRetake 
                            ? "Retaking recruiter-assigned interviews requires payment."
                            : "You've used all your free practice interviews. Pay $5 to take another interview for additional practice."
                          }
                        </p>
                        <PayPalButton
                          amount="5.00"
                          currency="USD"
                          intent="CAPTURE"
                          onSuccess={handlePaymentSuccess}
                        />
                      </CardContent>
                    </Card>
                  )}

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
                    >
                      {eligibility?.isRetake 
                        ? "Pay $5 to Retake Interview"
                        : "Pay $5 for Additional Interview"
                      }
                    </Button>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What You'll Get</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>AI-powered interviewer with realistic conversation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Personalized feedback and performance analysis</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Role-specific questions tailored to your field</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Detailed scoring across multiple criteria</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Practice in a safe, pressure-free environment</span>
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
      </div>
    </div>
  );
}