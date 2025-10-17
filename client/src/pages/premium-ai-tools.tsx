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
  Check,
  Target,
  Zap,
  Calendar,
  CheckCircle,
  Mail
} from "lucide-react";

export default function PremiumAITools() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cover-letter");
  const [copied, setCopied] = useState(false);

  // Check premium status
  const { data: user } = useQuery({ queryKey: ['/api/user'] });
  const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise';

  // Fetch user's active resume
  const { data: userResume } = useQuery({
    queryKey: ['/api/resumes/active-text'],
    enabled: !!user,
  });

  // Cover Letter State
  const [coverLetterData, setCoverLetterData] = useState({
    jobTitle: "",
    company: "",
    description: "",
    requirements: "",
    resume: ""
  });
  const [coverLetter, setCoverLetter] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showMatchAnalysis, setShowMatchAnalysis] = useState(false);
  const [matchedPhrases, setMatchedPhrases] = useState<Array<{resume: string, job: string, reason: string}>>([]);
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [shortVersion, setShortVersion] = useState("");


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

  // Resume Bullet Points State
  const [bulletData, setBulletData] = useState({
    currentBulletPoints: [""],
    jobTitle: "",
    company: "",
    industry: ""
  });
  const [enhancedBullets, setEnhancedBullets] = useState<any>(null);

  // Resume Tailor State
  const [tailorData, setTailorData] = useState({
    resumeText: "",
    jobDescription: "",
    jobTitle: "",
    targetCompany: ""
  });
  const [tailoredResume, setTailoredResume] = useState<any>(null);

  // Resume Gap State
  const [gapData, setGapData] = useState({
    gapPeriod: "",
    gapReason: "",
    previousRole: "",
    nextRole: "",
    skillsDeveloped: ""
  });
  const [gapSolution, setGapSolution] = useState<any>(null);

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
        resume: coverLetterData.resume || userResume?.resumeText // Auto-use stored resume
      });
    },
    onSuccess: (data) => {
      if (data.coverLetter) {
        // Typing animation effect
        setCoverLetter("");
        const text = data.coverLetter;
        let index = 0;
        const typingSpeed = 10; // ms per character

        const typeWriter = () => {
          if (index < text.length) {
            setCoverLetter(text.substring(0, index + 1));
            index++;
            setTimeout(typeWriter, typingSpeed);
          }
        };
        typeWriter();

        // Set match analysis if provided
        if (data.matchAnalysis) {
          setMatchedPhrases(data.matchAnalysis);
          setShowMatchAnalysis(true);
        }

        // Generate short version for recruiter summary
        if (data.shortVersion) {
          setShortVersion(data.shortVersion);
        }

        toast({
          title: "✨ Success!",
          description: "AI-powered cover letter generated with smart matching",
        });
      }
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
        resume: interviewResume || userResume?.resumeText // Auto-use stored resume
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

  // Resume Bullet Enhancer Mutation
  const bulletMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/resume-bullets', 'POST', {
        currentBulletPoints: bulletData.currentBulletPoints.filter(bp => bp.trim()),
        jobTitle: bulletData.jobTitle,
        company: bulletData.company || undefined,
        industry: bulletData.industry || undefined
      });
    },
    onSuccess: (data) => {
      setEnhancedBullets(data);
      toast({ title: "Bullets Enhanced!", description: "Your resume bullet points have been transformed." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message?.includes('premium') ? "This feature requires a Premium subscription." : "Failed to enhance bullets.",
        variant: "destructive"
      });
    }
  });

  // Resume Tailor Mutation
  const tailorMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/tailor-resume', 'POST', {
        resumeText: tailorData.resumeText,
        jobDescription: tailorData.jobDescription,
        jobTitle: tailorData.jobTitle,
        targetCompany: tailorData.targetCompany || undefined
      });
    },
    onSuccess: (data) => {
      setTailoredResume(data);
      toast({ title: "Resume Optimized!", description: `ATS Score: ${data.atsScore}% - Your resume is now tailored to the job.` });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message?.includes('premium') ? "This feature requires a Premium subscription." : "Failed to tailor resume.",
        variant: "destructive"
      });
    }
  });

  // Resume Gap Filler Mutation
  const gapMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/resume-gaps', 'POST', {
        gapPeriod: gapData.gapPeriod,
        gapReason: gapData.gapReason || undefined,
        previousRole: gapData.previousRole || undefined,
        nextRole: gapData.nextRole || undefined,
        skillsDeveloped: gapData.skillsDeveloped ? gapData.skillsDeveloped.split(',').map(s => s.trim()) : undefined
      });
    },
    onSuccess: (data) => {
      setGapSolution(data);
      toast({ title: "Gap Strategy Ready!", description: "Professional recommendations for presenting your career gap." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message?.includes('premium') ? "This feature requires a Premium subscription." : "Failed to create gap strategy.",
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

  // Show loading state while checking user data
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

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
                <li className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Resume Bullet Point Enhancer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-500" />
                  <span>Job-Specific Resume Optimizer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <span>Career Gap Strategy Builder</span>
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
          <TabsList className="grid w-full grid-cols-7 gap-1">
            <TabsTrigger value="cover-letter" data-testid="tab-cover-letter" className="text-xs sm:text-sm">
              <FileText className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Cover Letter</span>
              <span className="sm:hidden">Cover</span>
            </TabsTrigger>
            <TabsTrigger value="salary" data-testid="tab-salary" className="text-xs sm:text-sm">
              <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Salary Coach</span>
              <span className="sm:hidden">Salary</span>
            </TabsTrigger>
            <TabsTrigger value="interview" data-testid="tab-interview" className="text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Interview</span>
              <span className="sm:hidden">Interview</span>
            </TabsTrigger>
            <TabsTrigger value="career" data-testid="tab-career" className="text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Career Path</span>
              <span className="sm:hidden">Career</span>
            </TabsTrigger>
            <TabsTrigger value="bullets" data-testid="tab-bullets" className="text-xs sm:text-sm">
              <Zap className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Resume Bullets</span>
              <span className="sm:hidden">Bullets</span>
            </TabsTrigger>
            <TabsTrigger value="tailor" data-testid="tab-tailor" className="text-xs sm:text-sm">
              <Target className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Tailor Resume</span>
              <span className="sm:hidden">Tailor</span>
            </TabsTrigger>
            <TabsTrigger value="gaps" data-testid="tab-gaps" className="text-xs sm:text-sm">
              <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Fill Gaps</span>
              <span className="sm:hidden">Gaps</span>
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
                    {userResume?.resumeText && (
                      <div className="mb-2 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Using your stored resume automatically
                      </div>
                    )}
                    <Textarea
                      id="cl-resume"
                      data-testid="textarea-resume"
                      placeholder={userResume?.resumeText ? "Using your stored resume (you can override by typing here)" : "Paste your resume or key achievements..."}
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
                      {/* Match Analysis Section */}
                      {showMatchAnalysis && matchedPhrases.length > 0 && (
                        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-green-600" />
                              🎯 Smart Context Fusion - How AI Matched Your Profile
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {matchedPhrases.slice(0, 3).map((match, idx) => (
                              <div key={idx} className="text-xs p-2 bg-white dark:bg-slate-900 rounded border">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                                  <div>
                                    <span className="font-semibold text-blue-600">Resume:</span> "{match.resume}"
                                    <br />
                                    <span className="font-semibold text-purple-600">Job:</span> "{match.job}"
                                    <br />
                                    <span className="text-slate-600">💡 {match.reason}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Recruiter Summary Mode */}
                      {shortVersion && (
                        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              📧 Recruiter Summary - 3-Line Elevator Pitch
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm italic">{shortVersion}</p>
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(shortVersion);
                                toast({ title: "Copied!", description: "Summary copied for email/LinkedIn" });
                              }}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              <Copy className="h-3 w-3 mr-2" />
                              Copy for Email
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      <div className="flex justify-between items-center">
                        <CardTitle>Generated Cover Letter</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditMode(!editMode)}
                            variant="outline"
                            size="sm"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {editMode ? 'Hide' : 'Interactive Edit'}
                          </Button>
                          <Button
                            onClick={() => copyToClipboard(coverLetter.coverLetter)}
                            variant="outline"
                            size="sm"
                            data-testid="button-copy-cover-letter"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Interactive Edit Mode */}
                      {editMode && (
                        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950">
                          <CardHeader>
                            <CardTitle className="text-sm">🎨 Interactive Edit Mode - Chat to Refine</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g., 'make it more confident', 'shorter', 'add technical details'"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                              />
                              <Button
                                onClick={async () => {
                                  if (!editPrompt.trim()) return;
                                  setIsGenerating(true);
                                  try {
                                    const response = await fetch('/api/cover-letter/refine', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        currentLetter: coverLetter.coverLetter, // Use coverLetter.coverLetter
                                        instruction: editPrompt
                                      })
                                    });
                                    const data = await response.json();
                                    if (data.refinedLetter) {
                                      setCoverLetter(data.refinedLetter); // Update state with refined letter
                                      toast({ title: "✨ Refined!", description: "Cover letter updated" });
                                      setEditPrompt("");
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to refine", variant: "destructive" });
                                  } finally {
                                    setIsGenerating(false);
                                  }
                                }}
                                disabled={isGenerating}
                              >
                                {isGenerating ? "Refining..." : "Apply"}
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {['Make it more confident', 'Shorter', 'More technical', 'Less formal', 'Add metrics'].map((suggestion) => (
                                <Badge
                                  key={suggestion}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-purple-100"
                                  onClick={() => setEditPrompt(suggestion)}
                                >
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <Textarea
                        value={coverLetter.coverLetter} // Use coverLetter.coverLetter
                        onChange={(e) => setCoverLetter({...coverLetter, coverLetter: e.target.value})} // Update state correctly
                        className="min-h-[400px]"
                      />
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
                    {userResume?.resumeText && (
                      <div className="mb-2 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Using your stored resume automatically
                      </div>
                    )}
                    <Textarea
                      id="interview-resume"
                      data-testid="textarea-interview-resume"
                      placeholder={userResume?.resumeText ? "Using your stored resume (you can override by typing here)" : "Paste your resume or relevant experience..."}
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

          {/* Resume Bullet Point Enhancer */}
          <TabsContent value="bullets">
            <Card>
              <CardHeader>
                <CardTitle>AI Resume Bullet Point Enhancer</CardTitle>
                <CardDescription>Transform weak descriptions into powerful, achievement-oriented statements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      placeholder="e.g., Senior Software Engineer"
                      value={bulletData.jobTitle}
                      onChange={(e) => setBulletData({...bulletData, jobTitle: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Company (optional)</Label>
                      <Input
                        placeholder="e.g., Google"
                        value={bulletData.company}
                        onChange={(e) => setBulletData({...bulletData, company: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Industry (optional)</Label>
                      <Input
                        placeholder="e.g., Technology"
                        value={bulletData.industry}
                        onChange={(e) => setBulletData({...bulletData, industry: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Current Bullet Points</Label>
                    {bulletData.currentBulletPoints.map((bp, i) => (
                      <Textarea
                        key={i}
                        placeholder={`Bullet point ${i + 1}: e.g., Managed team projects`}
                        value={bp}
                        onChange={(e) => {
                          const newBullets = [...bulletData.currentBulletPoints];
                          newBullets[i] = e.target.value;
                          setBulletData({...bulletData, currentBulletPoints: newBullets});
                        }}
                        className="mb-2"
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulletData({...bulletData, currentBulletPoints: [...bulletData.currentBulletPoints, ""]})}
                    >
                      + Add Bullet Point
                    </Button>
                  </div>
                  <Button
                    onClick={() => bulletMutation.mutate()}
                    disabled={bulletMutation.isPending || !bulletData.jobTitle || !bulletData.currentBulletPoints.some(bp => bp.trim())}
                    className="w-full"
                  >
                    {bulletMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enhance Bullet Points
                  </Button>
                </div>

                {enhancedBullets && (
                  <div className="border-t pt-6 space-y-4">
                    <h3 className="font-semibold text-lg">Enhanced Resume Bullets</h3>
                    {enhancedBullets.enhancedBulletPoints?.map((item: any, i: number) => (
                      <div key={i} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original:</p>
                          <p className="text-sm line-through text-gray-600 dark:text-gray-400">{item.original}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Enhanced:</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.enhanced}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {item.keywords?.map((kw: string, ki: number) => (
                            <Badge key={ki} variant="outline" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div>
                      <h4 className="font-semibold mb-2">Overall Tips:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {enhancedBullets.overallTips?.map((tip: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job-Specific Resume Tailor */}
          <TabsContent value="tailor">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tailor Resume to Job</CardTitle>
                  <CardDescription>Optimize your resume for maximum ATS compatibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Your Resume Text</Label>
                    <Textarea
                      placeholder="Paste your current resume text here..."
                      value={tailorData.resumeText}
                      onChange={(e) => setTailorData({...tailorData, resumeText: e.target.value})}
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label>Job Description</Label>
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={tailorData.jobDescription}
                      onChange={(e) => setTailorData({...tailorData, jobDescription: e.target.value})}
                      rows={6}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        placeholder="e.g., Senior Developer"
                        value={tailorData.jobTitle}
                        onChange={(e) => setTailorData({...tailorData, jobTitle: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Company (optional)</Label>
                      <Input
                        placeholder="e.g., Microsoft"
                        value={tailorData.targetCompany}
                        onChange={(e) => setTailorData({...tailorData, targetCompany: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => tailorMutation.mutate()}
                    disabled={tailorMutation.isPending || !tailorData.resumeText || !tailorData.jobDescription || !tailorData.jobTitle}
                    className="w-full"
                  >
                    {tailorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Optimize Resume
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimization Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {tailoredResume ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">ATS Score: {tailoredResume.atsScore}%</h4>
                        <div className="flex gap-2 mb-3">
                          <Badge className="bg-green-500">Matched: {tailoredResume.keywordMatches?.matched?.length || 0}</Badge>
                          <Badge variant="destructive">Missing: {tailoredResume.keywordMatches?.missing?.length || 0}</Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Priority Changes:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {tailoredResume.priorityChanges?.map((change: string, i: number) => (
                            <li key={i} className="text-sm text-orange-600 dark:text-orange-400">{change}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations:</h4>
                        {tailoredResume.tailoringRecommendations?.map((rec: any, i: number) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-2">
                            <p className="font-medium text-sm">{rec.section}</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">{rec.recommended}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rec.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Your optimization results will appear here
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resume Gap Filler */}
          <TabsContent value="gaps">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Career Gap Strategy Builder</CardTitle>
                  <CardDescription>Present employment gaps positively and strategically</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Gap Period</Label>
                    <Input
                      placeholder="e.g., Jan 2023 - Dec 2023"
                      value={gapData.gapPeriod}
                      onChange={(e) => setGapData({...gapData, gapPeriod: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Reason for Gap (optional)</Label>
                    <Input
                      placeholder="e.g., Family care, Health, Career transition"
                      value={gapData.gapReason}
                      onChange={(e) => setGapData({...gapData, gapReason: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Previous Role (optional)</Label>
                      <Input
                        placeholder="e.g., Product Manager"
                        value={gapData.previousRole}
                        onChange={(e) => setGapData({...gapData, previousRole: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Target Role (optional)</Label>
                      <Input
                        placeholder="e.g., Senior PM"
                        value={gapData.nextRole}
                        onChange={(e) => setGapData({...gapData, nextRole: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Skills Developed (comma-separated, optional)</Label>
                    <Input
                      placeholder="e.g., Online courses, Certifications, Side projects"
                      value={gapData.skillsDeveloped}
                      onChange={(e) => setGapData({...gapData, skillsDeveloped: e.target.value})}
                    />
                  </div>
                  <Button
                    onClick={() => gapMutation.mutate()}
                    disabled={gapMutation.isPending || !gapData.gapPeriod}
                    className="w-full"
                  >
                    {gapMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Gap Strategy
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strategy & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  {gapSolution ? (
                    <div className="space-y-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Recommended Approach:</h4>
                        <p className="text-sm capitalize">{gapSolution.recommendedApproach}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Gap Presentation Options:</h4>
                        {gapSolution.gapExplanations?.map((exp: any, i: number) => (
                          <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-3">
                            <p className="font-medium text-sm mb-1">{exp.approach}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{exp.description}</p>
                            <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                              {exp.resumeEntry}
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">When to use: {exp.whenToUse}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Interview Tips:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {gapSolution.interviewTips?.map((tip: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Your gap strategy will appear here
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