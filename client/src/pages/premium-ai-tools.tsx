import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  FileText, 
  DollarSign, 
  MessageSquare, 
  TrendingUp,
  Crown,
  Loader2,
  Copy,
  Check
} from "lucide-react";

export default function PremiumAITools() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cover-letter");
  const [copied, setCopied] = useState(false);

  // Cover Letter State
  const [coverLetterData, setCoverLetterData] = useState({
    jobTitle: "",
    company: "",
    description: "",
    requirements: "",
    resume: ""
  });
  const [coverLetter, setCoverLetter] = useState<any>(null);

  // Salary Negotiation State
  const [salaryData, setSalaryData] = useState({
    currentOffer: "",
    desiredSalary: "",
    jobTitle: "",
    experience: "",
    location: ""
  });
  const [salaryAdvice, setSalaryAdvice] = useState<any>(null);

  // Interview Answer State
  const [interviewQuestion, setInterviewQuestion] = useState("");
  const [interviewResume, setInterviewResume] = useState("");
  const [interviewAnswer, setInterviewAnswer] = useState<any>(null);

  // Career Path State
  const [careerData, setCareerData] = useState({
    currentRole: "",
    experience: "",
    skills: "",
    interests: "",
    targetRole: ""
  });
  const [careerPath, setCareerPath] = useState<any>(null);

  // Check premium status
  const { data: user } = useQuery({ queryKey: ['/api/user'] });
  const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';

  // Cover Letter Mutation
  const coverLetterMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/cover-letter', 'POST', {
        jobDetails: {
          title: coverLetterData.jobTitle,
          company: coverLetterData.company,
          description: coverLetterData.description,
          requirements: coverLetterData.requirements
        },
        resume: coverLetterData.resume
      });
    },
    onSuccess: (data) => {
      setCoverLetter(data);
      toast({ title: "Cover Letter Generated!", description: "Your personalized cover letter is ready." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message?.includes('premium') ? "This feature requires a Premium subscription." : "Failed to generate cover letter.",
        variant: "destructive"
      });
    }
  });

  // Salary Negotiation Mutation
  const salaryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/salary-negotiation', 'POST', {
        currentOffer: parseInt(salaryData.currentOffer),
        desiredSalary: parseInt(salaryData.desiredSalary),
        jobTitle: salaryData.jobTitle,
        experience: parseInt(salaryData.experience),
        location: salaryData.location
      });
    },
    onSuccess: (data) => {
      setSalaryAdvice(data);
      toast({ title: "Negotiation Strategy Ready!", description: "AI-powered salary advice generated." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message?.includes('premium') ? "This feature requires a Premium subscription." : "Failed to generate advice.",
        variant: "destructive"
      });
    }
  });

  // Interview Answer Mutation
  const interviewMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/interview-answer', 'POST', {
        question: interviewQuestion,
        resume: interviewResume
      });
    },
    onSuccess: (data) => {
      setInterviewAnswer(data);
      toast({ title: "Interview Answer Generated!", description: "Your STAR method answer is ready." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message?.includes('premium') ? "This feature requires a Premium subscription." : "Failed to generate answer.",
        variant: "destructive"
      });
    }
  });

  // Career Path Mutation
  const careerPathMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/career-path', 'POST', {
        currentRole: careerData.currentRole,
        experience: parseInt(careerData.experience),
        skills: careerData.skills.split(',').map(s => s.trim()),
        interests: careerData.interests.split(',').map(i => i.trim()),
        targetRole: careerData.targetRole || undefined
      });
    },
    onSuccess: (data) => {
      setCareerPath(data);
      toast({ title: "Career Path Created!", description: "Your personalized career roadmap is ready." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message?.includes('premium') ? "This feature requires a Premium subscription." : "Failed to generate career path.",
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Content copied to clipboard" });
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Premium AI Tools</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Unlock powerful AI-powered career tools to accelerate your job search
          </p>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">Premium Features Include:</h3>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span>AI Cover Letter Generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span>Salary Negotiation Coach</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <span>Interview Answer Generator (STAR Method)</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span>Personalized Career Path Planner</span>
                </li>
              </ul>
              <Button size="lg" className="w-full" asChild data-testid="button-upgrade-premium">
                <a href="/subscription">Upgrade to Premium - $10/month</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Premium AI Tools</h1>
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            AI-powered career tools to help you land your dream job faster
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cover-letter" data-testid="tab-cover-letter">
              <FileText className="w-4 h-4 mr-2" />
              Cover Letter
            </TabsTrigger>
            <TabsTrigger value="salary" data-testid="tab-salary">
              <DollarSign className="w-4 h-4 mr-2" />
              Salary Coach
            </TabsTrigger>
            <TabsTrigger value="interview" data-testid="tab-interview">
              <MessageSquare className="w-4 h-4 mr-2" />
              Interview Prep
            </TabsTrigger>
            <TabsTrigger value="career" data-testid="tab-career">
              <TrendingUp className="w-4 h-4 mr-2" />
              Career Path
            </TabsTrigger>
          </TabsList>

          {/* Cover Letter Generator */}
          <TabsContent value="cover-letter">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Cover Letter</CardTitle>
                  <CardDescription>Create a personalized cover letter tailored to the job</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cl-job-title">Job Title</Label>
                    <Input
                      id="cl-job-title"
                      data-testid="input-job-title"
                      placeholder="e.g., Senior Software Engineer"
                      value={coverLetterData.jobTitle}
                      onChange={(e) => setCoverLetterData({...coverLetterData, jobTitle: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cl-company">Company Name</Label>
                    <Input
                      id="cl-company"
                      data-testid="input-company"
                      placeholder="e.g., Google"
                      value={coverLetterData.company}
                      onChange={(e) => setCoverLetterData({...coverLetterData, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cl-description">Job Description</Label>
                    <Textarea
                      id="cl-description"
                      data-testid="textarea-job-description"
                      placeholder="Paste the job description here..."
                      value={coverLetterData.description}
                      onChange={(e) => setCoverLetterData({...coverLetterData, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cl-resume">Your Resume/Experience</Label>
                    <Textarea
                      id="cl-resume"
                      data-testid="textarea-resume"
                      placeholder="Paste your resume or key achievements..."
                      value={coverLetterData.resume}
                      onChange={(e) => setCoverLetterData({...coverLetterData, resume: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => coverLetterMutation.mutate()}
                    disabled={coverLetterMutation.isPending}
                    data-testid="button-generate-cover-letter"
                  >
                    {coverLetterMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Cover Letter</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Cover Letter</CardTitle>
                    {coverLetter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(coverLetter.coverLetter)}
                        data-testid="button-copy-cover-letter"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {coverLetter ? (
                    <div className="space-y-4">
                      <div className="prose dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm" data-testid="text-cover-letter">
                          {coverLetter.coverLetter}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Key Highlights:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {coverLetter.keyHighlights?.map((highlight: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Your generated cover letter will appear here
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Salary Negotiation */}
          <TabsContent value="salary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Negotiation Coach</CardTitle>
                  <CardDescription>Get AI-powered negotiation strategy and talking points</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="salary-current">Current Offer ($)</Label>
                    <Input
                      id="salary-current"
                      data-testid="input-current-offer"
                      type="number"
                      placeholder="75000"
                      value={salaryData.currentOffer}
                      onChange={(e) => setSalaryData({...salaryData, currentOffer: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary-desired">Desired Salary ($)</Label>
                    <Input
                      id="salary-desired"
                      data-testid="input-desired-salary"
                      type="number"
                      placeholder="90000"
                      value={salaryData.desiredSalary}
                      onChange={(e) => setSalaryData({...salaryData, desiredSalary: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary-job">Job Title</Label>
                    <Input
                      id="salary-job"
                      data-testid="input-salary-job-title"
                      placeholder="Software Engineer"
                      value={salaryData.jobTitle}
                      onChange={(e) => setSalaryData({...salaryData, jobTitle: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary-exp">Years of Experience</Label>
                    <Input
                      id="salary-exp"
                      data-testid="input-experience"
                      type="number"
                      placeholder="5"
                      value={salaryData.experience}
                      onChange={(e) => setSalaryData({...salaryData, experience: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary-location">Location</Label>
                    <Input
                      id="salary-location"
                      data-testid="input-location"
                      placeholder="San Francisco, CA"
                      value={salaryData.location}
                      onChange={(e) => setSalaryData({...salaryData, location: e.target.value})}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => salaryMutation.mutate()}
                    disabled={salaryMutation.isPending}
                    data-testid="button-get-salary-advice"
                  >
                    {salaryMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><DollarSign className="w-4 h-4 mr-2" /> Get Negotiation Strategy</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Negotiation Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  {salaryAdvice ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Counter Offer Suggestion:</h4>
                        <p className="text-2xl font-bold" data-testid="text-counter-offer">${salaryAdvice.counterOfferSuggestion?.toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Strategy:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{salaryAdvice.strategy}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Talking Points:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {salaryAdvice.talkingPoints?.map((point: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{point}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">How to Respond:</h4>
                        <div className="space-y-2">
                          {salaryAdvice.responses?.map((r: any, i: number) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.scenario}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"{r.response}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Your negotiation strategy will appear here
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interview Answer Generator */}
          <TabsContent value="interview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interview Answer Generator</CardTitle>
                  <CardDescription>Get STAR method answers for any interview question</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="interview-question">Interview Question</Label>
                    <Textarea
                      id="interview-question"
                      data-testid="textarea-interview-question"
                      placeholder="e.g., Tell me about a time you handled a difficult situation..."
                      value={interviewQuestion}
                      onChange={(e) => setInterviewQuestion(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="interview-resume">Your Background/Resume</Label>
                    <Textarea
                      id="interview-resume"
                      data-testid="textarea-interview-resume"
                      placeholder="Paste your resume or relevant experience..."
                      value={interviewResume}
                      onChange={(e) => setInterviewResume(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => interviewMutation.mutate()}
                    disabled={interviewMutation.isPending}
                    data-testid="button-generate-answer"
                  >
                    {interviewMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><MessageSquare className="w-4 h-4 mr-2" /> Generate Answer</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>STAR Method Answer</CardTitle>
                    {interviewAnswer && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(interviewAnswer.fullAnswer)}
                        data-testid="button-copy-answer"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {interviewAnswer ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
                        <div>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">S</span>
                          <span className="text-sm ml-2">{interviewAnswer.starAnswer.situation}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-purple-600 dark:text-purple-400">T</span>
                          <span className="text-sm ml-2">{interviewAnswer.starAnswer.task}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-green-600 dark:text-green-400">A</span>
                          <span className="text-sm ml-2">{interviewAnswer.starAnswer.action}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">R</span>
                          <span className="text-sm ml-2">{interviewAnswer.starAnswer.result}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Full Answer:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300" data-testid="text-full-answer">
                          {interviewAnswer.fullAnswer}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Key Points to Emphasize:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {interviewAnswer.keyPoints?.map((point: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Your interview answer will appear here
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Career Path Planner */}
          <TabsContent value="career">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Career Path Planner</CardTitle>
                  <CardDescription>Get a personalized 3-5 year career roadmap</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="career-current">Current Role</Label>
                    <Input
                      id="career-current"
                      data-testid="input-current-role"
                      placeholder="e.g., Software Engineer"
                      value={careerData.currentRole}
                      onChange={(e) => setCareerData({...careerData, currentRole: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="career-exp">Years of Experience</Label>
                    <Input
                      id="career-exp"
                      data-testid="input-career-experience"
                      type="number"
                      placeholder="3"
                      value={careerData.experience}
                      onChange={(e) => setCareerData({...careerData, experience: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="career-skills">Skills (comma-separated)</Label>
                    <Input
                      id="career-skills"
                      data-testid="input-skills"
                      placeholder="React, Node.js, Python, AWS"
                      value={careerData.skills}
                      onChange={(e) => setCareerData({...careerData, skills: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="career-interests">Interests (comma-separated)</Label>
                    <Input
                      id="career-interests"
                      data-testid="input-interests"
                      placeholder="Leadership, AI/ML, Product Management"
                      value={careerData.interests}
                      onChange={(e) => setCareerData({...careerData, interests: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="career-target">Target Role (optional)</Label>
                    <Input
                      id="career-target"
                      data-testid="input-target-role"
                      placeholder="e.g., Engineering Manager"
                      value={careerData.targetRole}
                      onChange={(e) => setCareerData({...careerData, targetRole: e.target.value})}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => careerPathMutation.mutate()}
                    disabled={careerPathMutation.isPending}
                    data-testid="button-generate-career-path"
                  >
                    {careerPathMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Roadmap...</>
                    ) : (
                      <><TrendingUp className="w-4 h-4 mr-2" /> Generate Career Path</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Career Roadmap</CardTitle>
                </CardHeader>
                <CardContent>
                  {careerPath ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Career Progression:</h4>
                        <div className="space-y-4">
                          {careerPath.careerRoadmap?.map((step: any, i: number) => (
                            <div key={i} className="border-l-4 border-blue-500 pl-4 pb-4">
                              <h5 className="font-semibold text-lg">{step.role}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{step.timeframe}</p>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                                {step.salaryRange}
                              </p>
                              <div className="mt-2">
                                <p className="text-xs font-semibold">Skills Needed:</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {step.skillsNeeded?.join(', ')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Start This Month:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {careerPath.immediateActions?.map((action: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Your career roadmap will appear here
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
