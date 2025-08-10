import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Clock, 
  Users, 
  Target, 
  Brain, 
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Star,
  Loader2
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InterviewConfig {
  interviewType: string;
  role: string;
  company?: string;
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

  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: (data: InterviewConfig) => apiRequest('POST', '/api/virtual-interview/start', data),
    onSuccess: (data) => {
      // Store session data in localStorage for the interview page
      localStorage.setItem(`interview_session_${data.sessionId}`, JSON.stringify(data));
      
      toast({
        title: "Interview Started",
        description: "Your virtual interview session has begun!",
      });
      
      // Navigate to the interview page
      setLocation(`/virtual-interview/${data.sessionId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start interview session",
        variant: "destructive"
      });
    }
  });

  const handleStartInterview = () => {
    if (!config.role) {
      toast({
        title: "Missing Information",
        description: "Please select a role for the interview",
        variant: "destructive"
      });
      return;
    }
    
    startInterviewMutation.mutate(config);
  };

  const interviewTypes = [
    { value: 'technical', label: 'Technical Interview', description: 'Code challenges and technical questions' },
    { value: 'behavioral', label: 'Behavioral Interview', description: 'Situational and experience-based questions' },
    { value: 'mixed', label: 'Mixed Interview', description: 'Combination of technical and behavioral' },
    { value: 'system_design', label: 'System Design', description: 'Architecture and design questions' }
  ];

  const roles = [
    { value: 'software_engineer', label: 'Software Engineer' },
    { value: 'frontend_developer', label: 'Frontend Developer' },
    { value: 'backend_developer', label: 'Backend Developer' },
    { value: 'fullstack_developer', label: 'Full Stack Developer' },
    { value: 'data_scientist', label: 'Data Scientist' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'devops_engineer', label: 'DevOps Engineer' },
    { value: 'mobile_developer', label: 'Mobile Developer' },
    { value: 'qa_engineer', label: 'QA Engineer' },
    { value: 'ui_ux_designer', label: 'UI/UX Designer' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', description: 'Entry-level questions' },
    { value: 'medium', label: 'Medium', description: 'Mid-level questions' },
    { value: 'hard', label: 'Hard', description: 'Senior-level questions' }
  ];

  const personalities = [
    { value: 'friendly', label: 'Friendly', description: 'Encouraging and supportive' },
    { value: 'professional', label: 'Professional', description: 'Structured and thorough' },
    { value: 'challenging', label: 'Challenging', description: 'Rigorous and demanding' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Brain className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Virtual Interview Practice
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Practice your interview skills with AI-powered virtual interviews. 
            Get personalized feedback and improve your performance.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interview Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Interview Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Interview Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {interviewTypes.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => setConfig(prev => ({ ...prev, interviewType: type.value }))}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          config.interviewType === type.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {type.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={config.role} onValueChange={(value) => setConfig(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input
                      id="company"
                      placeholder="e.g., Google, Microsoft"
                      value={config.company}
                      onChange={(e) => setConfig(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <div className="space-y-2">
                      {difficulties.map((difficulty) => (
                        <div
                          key={difficulty.value}
                          onClick={() => setConfig(prev => ({ ...prev, difficulty: difficulty.value }))}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            config.difficulty === difficulty.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="font-medium text-sm">{difficulty.label}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {difficulty.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Interviewer Personality</Label>
                    <div className="space-y-2">
                      {personalities.map((personality) => (
                        <div
                          key={personality.value}
                          onClick={() => setConfig(prev => ({ ...prev, interviewerPersonality: personality.value }))}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            config.interviewerPersonality === personality.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="font-medium text-sm">{personality.label}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {personality.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
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
              </CardContent>
            </Card>

            {/* Start Button */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Ready to Start?</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Your virtual interview will begin immediately
                    </p>
                  </div>
                  <Button 
                    onClick={handleStartInterview}
                    disabled={startInterviewMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                    data-testid="start-interview"
                  >
                    {startInterviewMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Start Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What to Expect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">AI-Powered Questions</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Dynamic questions tailored to your role and experience
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Real-time Feedback</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Instant analysis of your responses and communication
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Performance Scoring</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Detailed breakdown of strengths and areas to improve
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Practice Recommendations</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Personalized suggestions for interview improvement
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interview Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {config.interviewType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Role:</span>
                    <span className="font-medium capitalize">
                      {config.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {config.company && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Company:</span>
                      <span className="font-medium">{config.company}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Difficulty:</span>
                    <Badge 
                      variant="outline" 
                      className={`capitalize ${
                        config.difficulty === 'easy' ? 'border-green-500 text-green-600' :
                        config.difficulty === 'medium' ? 'border-yellow-500 text-yellow-600' :
                        'border-red-500 text-red-600'
                      }`}
                    >
                      {config.difficulty}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                    <span className="font-medium">{config.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Style:</span>
                    <span className="font-medium capitalize">{config.interviewerPersonality}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Find a quiet space with good lighting</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Test your microphone and camera beforehand</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Keep water nearby and stay hydrated</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Take your time to think before answering</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Be authentic and showcase your personality</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}