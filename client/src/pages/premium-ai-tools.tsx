import { useState } from "react";
import { Helmet } from "react-helmet";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Mail,
  Eye,
  Globe,
  AlertCircle,
  RefreshCw,
  Play,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Star,
  Users,
  Award,
  Brain
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PremiumAITools() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cover-letter");
  const [copied, setCopied] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showTutorial, setShowTutorial] = useState<string | null>(null);

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
  const [completeResume, setCompleteResume] = useState<any>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pageFormat, setPageFormat] = useState<'1-page' | '2-page'>('2-page');

  // Resume Gap State
  const [gapData, setGapData] = useState({
    gapPeriod: "",
    gapReason: "",
    previousRole: "",
    nextRole: "",
    skillsDeveloped: ""
  });
  const [gapSolution, setGapSolution] = useState<any>(null);

  // Tutorial content
  const tutorials = {
    "cover-letter": {
      title: "AI Cover Letter Writer - Personalized Job Applications",
      steps: [
        "Paste the job description you're applying for",
        "AI analyzes the job requirements and company culture",
        "Your resume is automatically matched against job keywords",
        "Get a personalized cover letter with 95% ATS compatibility",
        "Edit interactively using natural language prompts"
      ],
      demo: "See how Sarah got 3x more interviews using AI-matched cover letters",
      stats: { success: "95%", time: "2 min", interviews: "3x more" }
    },
    "salary": {
      title: "Salary Negotiation Coach - Get Higher Offers",
      steps: [
        "Enter your current offer and desired salary",
        "AI analyzes market data for your role and location",
        "Get personalized negotiation scripts and talking points",
        "Learn when to counter and how to handle objections",
        "Increase your offers by an average of $12,000"
      ],
      demo: "Users negotiate $12K higher salaries on average",
      stats: { avgIncrease: "$12,000", confidence: "92%", successRate: "78%" }
    },
    "interview": {
      title: "STAR Interview Answer Generator - Ace Behavioral Questions",
      steps: [
        "Enter any behavioral interview question",
        "AI analyzes your resume for relevant experiences",
        "Get structured STAR method answers",
        "Practice with multiple variations",
        "Sound confident and prepared in every interview"
      ],
      demo: "Practice 50+ common questions with AI coaching",
      stats: { questions: "50+", passRate: "89%", avgTime: "3 min" }
    },
    "career": {
      title: "Career Growth Planner - 3-5 Year Roadmap Builder",
      steps: [
        "Tell us your current role and experience level",
        "AI maps out your 3-5 year career roadmap",
        "Get specific skills to learn for each step",
        "See salary ranges and timeline estimates",
        "Take action with immediate next steps"
      ],
      demo: "Plan your path from Junior to Senior in 3 years",
      stats: { pathways: "500+", accuracy: "94%", timeframe: "3-5 years" }
    },
    "bullets": {
      title: "Resume Bullet Point Enhancer - Achievement Statements",
      steps: [
        "Paste your weak resume bullet points",
        "AI transforms them into achievement statements",
        "Get metrics-driven, action-oriented language",
        "ATS keywords automatically included",
        "Copy and paste into your resume instantly"
      ],
      demo: "Transform 'Did tasks' into 'Achieved 40% efficiency gain'",
      stats: { improvement: "87%", atsScore: "+45", recruiters: "2x views" }
    },
    "tailor": {
      title: "Resume Optimizer - ATS-Friendly PDF Generator",
      steps: [
        "Upload your resume or use stored version",
        "Paste the target job description",
        "AI tailors every section to match requirements",
        "Get ATS score with missing keywords highlighted",
        "Download professional PDF in Harvard/Stanford format"
      ],
      demo: "Get 85+ ATS score with one click",
      stats: { atsScore: "85+", timesSaved: "30 min", applications: "100s" }
    },
    "gaps": {
      title: "Career Gap Explainer - Turn Gaps Into Strengths",
      steps: [
        "Enter your employment gap period and reason",
        "AI creates positive framing strategies",
        "Get multiple resume entry options",
        "Learn interview talking points",
        "Turn gaps into growth stories"
      ],
      demo: "Turn 2-year gap into 'Entrepreneurial Venture' success",
      stats: { strategies: "5+", confidence: "94%", hirability: "+67%" }
    },
    "linkedin-optimizer": {
      title: "LinkedIn Profile Optimizer - 5x More Recruiter Views",
      steps: [
        "Connect your LinkedIn profile",
        "AI analyzes profile strength and visibility",
        "Get headline and about section suggestions",
        "Optimize keywords for recruiter searches",
        "Increase profile views by 5x"
      ],
      demo: "Get found by recruiters 5x more often",
      stats: { visibility: "5x", keywords: "30+", messages: "3x more" }
    }
  };

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
        resume: coverLetterData.resume || userResume?.resumeText
      });
    },
    onSuccess: (data) => {
      const letterText = typeof data === 'string' ? data : (data.coverLetter || data);
      if (letterText && typeof letterText === 'string') {
        setCoverLetter("");
        const text = letterText;
        let index = 0;
        const typingSpeed = 10;
        const typeWriter = () => {
          if (index < text.length) {
            setCoverLetter(text.substring(0, index + 1));
            index++;
            setTimeout(typeWriter, typingSpeed);
          }
        };
        typeWriter();
        if (data.matchAnalysis) {
          setMatchedPhrases(data.matchAnalysis);
          setShowMatchAnalysis(true);
        }
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
        location: salaryData.location,
        resume: userResume?.resumeText
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
        resume: interviewResume || userResume?.resumeText
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
        targetRole: careerData.targetRole || undefined,
        resume: userResume?.resumeText
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
        industry: bulletData.industry || undefined,
        resume: userResume?.resumeText
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
        resumeText: tailorData.resumeText || userResume?.resumeText,
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

  // Complete Resume Generation Mutation
  const completeResumeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/generate-tailored-resume', 'POST', {
        jobDescription: tailorData.jobDescription,
        jobTitle: tailorData.jobTitle,
        targetCompany: tailorData.targetCompany || undefined
      });
    },
    onSuccess: (data) => {
      setCompleteResume(data);
      toast({
        title: "✨ Complete Resume Generated!",
        description: "Your tailored resume is ready. Click 'Download PDF' to save it."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message?.includes('premium') ? "This feature requires a Premium subscription." :
                     error.message?.includes('No structured') ? "Please complete your profile with experience and education first." :
                     "Failed to generate resume.",
        variant: "destructive"
      });
    }
  });

  // Download PDF function
  const downloadResumePdf = async () => {
    if (!completeResume?.tailoredResume) {
      toast({ title: "Error", description: "No resume data to download", variant: "destructive" });
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const response = await fetch('/api/premium/ai/download-tailored-resume-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          resumeData: completeResume.tailoredResume,
          templateStyle: 'harvard',
          pageFormat: pageFormat
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to download PDF' }));
        toast({
          title: "Download Failed",
          description: errorData.message || "Failed to generate PDF",
          variant: "destructive"
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tailored_Resume_${tailorData.jobTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Success!", description: "Resume PDF downloaded successfully" });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Resume Gap Filler Mutation
  const gapMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/premium/ai/resume-gaps', 'POST', {
        gapPeriod: gapData.gapPeriod,
        gapReason: gapData.gapReason || undefined,
        previousRole: gapData.previousRole || undefined,
        nextRole: gapData.nextRole || undefined,
        skillsDeveloped: gapData.skillsDeveloped ? gapData.skillsDeveloped.split(',').map(s => s.trim()) : undefined,
        resume: userResume?.resumeText
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

  // Preview overlay component for non-premium users
  const PreviewOverlay = ({ featureName }: { featureName: string }) => (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
      <Card className="max-w-md mx-4 border-2 border-yellow-500 shadow-2xl">
        <CardContent className="p-6 text-center">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Unlock {featureName}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You're viewing a preview. Upgrade to Premium to use this powerful AI tool.
          </p>
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            asChild
          >
            <a href="/subscription">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Premium - $13/month
            </a>
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            Join 10,000+ professionals using our AI tools
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Tutorial Modal Component
  const TutorialModal = ({ toolId }: { toolId: string }) => {
    const tutorial = tutorials[toolId as keyof typeof tutorials];
    if (!tutorial) return null;

    return (
      <Dialog open={showTutorial === toolId} onOpenChange={() => setShowTutorial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              {tutorial.title}
            </DialogTitle>
            <DialogDescription>
              Learn how to use this tool in under 2 minutes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg">
              {Object.entries(tutorial.stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                </div>
              ))}
            </div>

            {/* Step-by-step guide */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                How It Works
              </h4>
              {tutorial.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>

            {/* Demo showcase */}
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-400">Real Success Story</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">{tutorial.demo}</p>
            </div>

            <Button onClick={() => setShowTutorial(null)} className="w-full" size="lg">
              Got It, Let's Try It!
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Show loading state while checking user data
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading your AI workspace...</p>
        </div>
      </div>
    );
  }

  const isPreviewMode = !isPremium;

  const handleBlockedAction = (featureName: string) => {
    if (isPreviewMode) {
      toast({
        title: "Premium Feature Required",
        description: `${featureName} is a premium feature. Upgrade to unlock full access!`,
        variant: "destructive",
      });
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30">
      <Helmet>
        <title>Premium AI Career Tools - Cover Letter, Salary Coach, Interview Prep | Autojobr</title>
        <meta name="description" content="Access powerful AI career tools including cover letter generator, salary negotiation coach, interview answer generator, resume optimizer, and LinkedIn profile enhancement. Accelerate your job search with enterprise-grade AI assistance." />
      </Helmet>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section - Simplified */}
        <div className="text-center mb-8 space-y-4">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 text-sm">
            <Crown className="w-4 h-4 mr-2 inline" />
            {isPreviewMode ? 'Preview Mode' : 'Premium Active'}
          </Badge>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Premium Career Tools
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Generate cover letters, optimize your resume, and prepare for interviews
            </p>
          </div>

          {isPreviewMode && (
            <Card className="max-w-2xl mx-auto border-2 border-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-left">
                    <h3 className="font-semibold">Preview Mode Active</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Upgrade to use these tools
                    </p>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    asChild
                  >
                    <a href="/subscription">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade - $13/mo
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Interactive Tool Selector */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2 h-auto bg-white/50 dark:bg-gray-800/50 p-2 rounded-xl">
            {Object.entries(tutorials).map(([key, tutorial]) => (
              <TabsTrigger 
                key={key}
                value={key} 
                className="flex flex-col items-center gap-2 p-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all"
              >
                <div className="text-2xl">
                  {key === 'cover-letter' && <FileText className="w-5 h-5" />}
                  {key === 'salary' && <DollarSign className="w-5 h-5" />}
                  {key === 'interview' && <MessageSquare className="w-5 h-5" />}
                  {key === 'career' && <TrendingUp className="w-5 h-5" />}
                  {key === 'bullets' && <Zap className="w-5 h-5" />}
                  {key === 'tailor' && <Target className="w-5 h-5" />}
                  {key === 'gaps' && <Calendar className="w-5 h-5" />}
                  {key === 'linkedin-optimizer' && <Globe className="w-5 h-5" />}
                </div>
                <span className="text-xs hidden sm:inline text-center leading-tight">
                  {key === 'cover-letter' && 'Cover Letter'}
                  {key === 'salary' && 'Salary Coach'}
                  {key === 'interview' && 'Interview Prep'}
                  {key === 'career' && 'Career Path'}
                  {key === 'bullets' && 'Resume Bullets'}
                  {key === 'tailor' && 'Resume Optimizer'}
                  {key === 'gaps' && 'Gap Explainer'}
                  {key === 'linkedin-optimizer' && 'LinkedIn'}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tool Tutorial Buttons */}
          {Object.entries(tutorials).map(([key]) => (
            <TabsContent key={key} value={key}>
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowTutorial(key)}
                    className="border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Tutorial (2 min)
                  </Button>
                  <Badge variant="outline" className="text-sm">
                    <Users className="w-3 h-3 mr-1" />
                    {tutorials[key as keyof typeof tutorials].stats.success || '10K+'} users
                  </Badge>
                </div>
                {isPreviewMode && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Preview Only - Upgrade to Use
                  </Badge>
                )}
              </div>
              <TutorialModal toolId={key} />
            </TabsContent>
          ))}

          {/* Cover Letter Generator */}
          <TabsContent value="cover-letter">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="relative border-2 border-blue-200 dark:border-blue-800">
                {isPreviewMode && <PreviewOverlay featureName="Cover Letter Generator" />}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Generate Cover Letter
                  </CardTitle>
                  <CardDescription>Create a personalized cover letter for any job posting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cl-job-title">Job Title</Label>
                    <Input
                      id="cl-job-title"
                      placeholder="e.g., Senior Software Engineer"
                      value={coverLetterData.jobTitle}
                      onChange={(e) => setCoverLetterData({...coverLetterData, jobTitle: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cl-company">Company Name</Label>
                    <Input
                      id="cl-company"
                      placeholder="e.g., Google"
                      value={coverLetterData.company}
                      onChange={(e) => setCoverLetterData({...coverLetterData, company: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cl-description">Job Description</Label>
                    <Textarea
                      id="cl-description"
                      placeholder="Paste the job description here..."
                      value={coverLetterData.description}
                      onChange={(e) => setCoverLetterData({...coverLetterData, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cl-resume">Your Resume (Optional)</Label>
                    {userResume?.resumeText && (
                      <div className="mb-2 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        We'll use your uploaded resume from the Resumes page
                      </div>
                    )}
                    <Textarea
                      id="cl-resume"
                      placeholder={userResume?.resumeText ? "Leave blank to use your uploaded resume, or paste different text here" : "Paste your resume text or upload one on the Resumes page"}
                      value={coverLetterData.resume}
                      onChange={(e) => setCoverLetterData({...coverLetterData, resume: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => {
                      if (!handleBlockedAction('Cover Letter Generator')) {
                        coverLetterMutation.mutate();
                      }
                    }}
                    disabled={coverLetterMutation.isPending || isPreviewMode}
                    size="lg"
                  >
                    {coverLetterMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : isPreviewMode ? (
                      <><Crown className="w-4 h-4 mr-2" /> Upgrade to Use</>
                    ) : (
                      <>Generate Cover Letter</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-500" />
                      Generated Cover Letter
                    </CardTitle>
                    {coverLetter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(coverLetter)}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {coverLetter ? (
                    <div className="space-y-4">
                      {showMatchAnalysis && matchedPhrases.length > 0 && (
                        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Target className="h-5 w-5 text-green-600" />
                              How Your Experience Matches This Job
                            </CardTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              We found these connections between your resume and the job posting
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {matchedPhrases.slice(0, 3).map((match, idx) => (
                              <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
                                <div className="flex items-start gap-2">
                                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="mb-1">
                                      <span className="font-semibold text-blue-700 dark:text-blue-400 text-xs uppercase">Your Experience:</span>
                                      <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">"{match.resume}"</p>
                                    </div>
                                    <div className="mb-1">
                                      <span className="font-semibold text-purple-700 dark:text-purple-400 text-xs uppercase">Job Requirement:</span>
                                      <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">"{match.job}"</p>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded mt-2">
                                      <span className="font-semibold text-yellow-800 dark:text-yellow-300 text-xs">💡 Why it's a match:</span>
                                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">{match.reason}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                      <Textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="min-h-[400px]"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your AI-generated cover letter will appear here
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Fill in the details and click Generate to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Salary Negotiation */}
          <TabsContent value="salary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="relative border-2 border-green-200 dark:border-green-800">
                {isPreviewMode && <PreviewOverlay featureName="Salary Negotiation Coach" />}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    Salary Negotiation Coach
                  </CardTitle>
                  <CardDescription>Get AI-powered negotiation strategy and talking points</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userResume?.resumeText && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      ✅ Using your stored resume to analyze your experience level and skills
                    </div>
                  )}
                  <div>
                    <Label htmlFor="salary-current">Current Offer ($)</Label>
                    <Input
                      id="salary-current"
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
                      placeholder="Software Engineer"
                      value={salaryData.jobTitle}
                      onChange={(e) => setSalaryData({...salaryData, jobTitle: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary-exp">Years of Experience</Label>
                    <Input
                      id="salary-exp"
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
                      placeholder="San Francisco, CA"
                      value={salaryData.location}
                      onChange={(e) => setSalaryData({...salaryData, location: e.target.value})}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={() => {
                      if (!handleBlockedAction('Salary Negotiation Coach')) {
                        salaryMutation.mutate();
                      }
                    }}
                    disabled={salaryMutation.isPending || isPreviewMode}
                    size="lg"
                  >
                    {salaryMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : isPreviewMode ? (
                      <><Crown className="w-4 h-4 mr-2" /> Upgrade to Analyze</>
                    ) : (
                      <><DollarSign className="w-4 h-4 mr-2" /> Get Negotiation Strategy</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-green-600" />
                    Negotiation Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salaryAdvice ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6 rounded-lg">
                        <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Counter Offer Suggestion:</h4>
                        <p className="text-4xl font-bold text-green-700 dark:text-green-300">${salaryAdvice.counterOfferSuggestion?.toLocaleString()}</p>
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
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <DollarSign className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your negotiation strategy will appear here
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Enter your salary details to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Interview Answer Generator */}
          <TabsContent value="interview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="relative border-2 border-blue-200 dark:border-blue-800">
                {isPreviewMode && <PreviewOverlay featureName="Interview Answer Generator" />}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    Interview Answer Generator
                  </CardTitle>
                  <CardDescription>Get STAR method answers for any interview question</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="interview-question">Interview Question</Label>
                    <Textarea
                      id="interview-question"
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
                      placeholder={userResume?.resumeText ? "Using your stored resume (you can override by typing here)" : "Paste your resume or relevant experience..."}
                      value={interviewResume}
                      onChange={(e) => setInterviewResume(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => {
                      if (!handleBlockedAction('Interview Answer Generator')) {
                        interviewMutation.mutate();
                      }
                    }}
                    disabled={interviewMutation.isPending || isPreviewMode}
                    size="lg"
                  >
                    {interviewMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : isPreviewMode ? (
                      <><Crown className="w-4 h-4 mr-2" /> Upgrade to Generate</>
                    ) : (
                      <><MessageSquare className="w-4 h-4 mr-2" /> Generate Answer</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-500" />
                      STAR Method Answer
                    </CardTitle>
                    {interviewAnswer && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(interviewAnswer.fullAnswer)}
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
                          <span className="font-semibold text-blue-600 dark:text-purple-400">S</span>
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
                        <p className="text-sm text-gray-600 dark:text-gray-300">
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
                    <div className="text-center py-16">
                      <MessageSquare className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your STAR method answer will appear here
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Enter the question and your background to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Career Path Planner */}
          <TabsContent value="career">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="relative border-2 border-orange-200 dark:border-orange-800">
                {isPreviewMode && <PreviewOverlay featureName="Career Path Planner" />}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                    Career Path Planner
                  </CardTitle>
                  <CardDescription>Get a personalized 3-5 year career roadmap</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userResume?.resumeText && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Using your stored resume to personalize career path recommendations
                    </div>
                  )}
                  <div>
                    <Label htmlFor="career-current">Current Role</Label>
                    <Input
                      id="career-current"
                      placeholder="e.g., Software Engineer"
                      value={careerData.currentRole}
                      onChange={(e) => setCareerData({...careerData, currentRole: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="career-exp">Years of Experience</Label>
                    <Input
                      id="career-exp"
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
                      placeholder="React, Node.js, Python, AWS"
                      value={careerData.skills}
                      onChange={(e) => setCareerData({...careerData, skills: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="career-interests">Interests (comma-separated)</Label>
                    <Input
                      id="career-interests"
                      placeholder="Leadership, AI/ML, Product Management"
                      value={careerData.interests}
                      onChange={(e) => setCareerData({...careerData, interests: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="career-target">Target Role (optional)</Label>
                    <Input
                      id="career-target"
                      placeholder="e.g., Engineering Manager"
                      value={careerData.targetRole}
                      onChange={(e) => setCareerData({...careerData, targetRole: e.target.value})}
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    onClick={() => {
                      if (!handleBlockedAction('Career Path Planner')) {
                        careerPathMutation.mutate();
                      }
                    }}
                    disabled={careerPathMutation.isPending || isPreviewMode}
                    size="lg"
                  >
                    {careerPathMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Roadmap...</>
                    ) : isPreviewMode ? (
                      <><Crown className="w-4 h-4 mr-2" /> Upgrade to Generate</>
                    ) : (
                      <><TrendingUp className="w-4 h-4 mr-2" /> Generate Career Path</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-orange-600" />
                    Your Career Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {careerPath ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Career Progression:</h4>
                        <div className="space-y-4">
                          {careerPath.careerRoadmap?.map((step: any, i: number) => (
                            <div key={i} className="border-l-4 border-orange-500 pl-4 pb-4">
                              <h5 className="font-semibold text-lg">{step.role}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{step.timeframe}</p>
                              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-1">
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
                    <div className="text-center py-16">
                      <TrendingUp className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your career roadmap will appear here
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Fill in your career details to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resume Bullet Point Enhancer */}
          <TabsContent value="bullets">
            <Card className="relative border-2 border-yellow-200 dark:border-yellow-800">
              {isPreviewMode && <PreviewOverlay featureName="Resume Bullet Enhancer" />}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  AI Resume Bullet Point Enhancer
                </CardTitle>
                <CardDescription>Transform weak descriptions into powerful, achievement-oriented statements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userResume?.resumeText && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    AI will reference your stored resume for context-aware enhancements
                  </div>
                )}
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
                    onClick={() => {
                      if (!handleBlockedAction('Resume Bullet Enhancer')) {
                        bulletMutation.mutate();
                      }
                    }}
                    disabled={bulletMutation.isPending || !bulletData.jobTitle || !bulletData.currentBulletPoints.some(bp => bp.trim()) || isPreviewMode}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                    size="lg"
                  >
                    {bulletMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enhancing...</>
                    ) : isPreviewMode ? (
                      <><Crown className="w-4 h-4 mr-2" /> Upgrade to Enhance</>
                    ) : (
                      <>Enhance Bullet Points</>
                    )}
                  </Button>
                </div>

                {enhancedBullets && (
                  <div className="border-t pt-6 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                      Enhanced Resume Bullets
                    </h3>
                    {enhancedBullets.enhancedBulletPoints?.map((item: any, i: number) => (
                      <div key={i} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original:</p>
                          <p className="text-sm line-through text-gray-600 dark:text-gray-400">{item.original}</p>
                        </div>
                        <div>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Enhanced:</p>
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
              <Card className="relative border-2 border-blue-200 dark:border-blue-800">
                {isPreviewMode && <PreviewOverlay featureName="Resume Optimizer" />}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    Tailor Resume to Job
                  </CardTitle>
                  <CardDescription>Optimize your resume for a specific job posting with ATS keywords</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!userResume?.resumeText && !tailorData.resumeText && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">No resume found</p>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Please upload a resume at <a href="/resumes" className="underline">the resumes page</a> or paste your resume text below.
                      </p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="tailor-job-title">Target Job Title *</Label>
                    <Input
                      id="tailor-job-title"
                      placeholder="e.g., Senior Software Engineer"
                      value={tailorData.jobTitle}
                      onChange={(e) => setTailorData({...tailorData, jobTitle: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tailor-company">Target Company (Optional)</Label>
                    <Input
                      id="tailor-company"
                      placeholder="e.g., Google"
                      value={tailorData.targetCompany}
                      onChange={(e) => setTailorData({...tailorData, targetCompany: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tailor-job-description">Job Description *</Label>
                    <Textarea
                      id="tailor-job-description"
                      placeholder="Paste the full job description here..."
                      value={tailorData.jobDescription}
                      onChange={(e) => setTailorData({...tailorData, jobDescription: e.target.value})}
                      rows={8}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tailor-resume">Your Resume (Optional)</Label>
                    {userResume?.resumeText && (
                      <div className="mb-2 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Using your stored resume automatically
                      </div>
                    )}
                    <Textarea
                      id="tailor-resume"
                      placeholder={userResume?.resumeText ? "Using your stored resume (you can override by typing here)" : "Paste your resume text here..."}
                      value={tailorData.resumeText}
                      onChange={(e) => setTailorData({...tailorData, resumeText: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      onClick={() => {
                        if (!handleBlockedAction('Complete Resume Generator')) {
                          completeResumeMutation.mutate();
                        }
                      }}
                      disabled={completeResumeMutation.isPending || !tailorData.jobDescription?.trim() || !tailorData.jobTitle?.trim() || isPreviewMode}
                      size="lg"
                    >
                      {completeResumeMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Complete Resume...</>
                      ) : isPreviewMode ? (
                        <><Crown className="w-4 h-4 mr-2" /> Upgrade to Generate Resume</>
                      ) : (
                        <><FileText className="w-4 h-4 mr-2" /> Generate Complete Resume & PDF</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (!handleBlockedAction('Resume Optimizer')) {
                          tailorMutation.mutate();
                        }
                      }}
                      disabled={tailorMutation.isPending || (!userResume?.resumeText && !tailorData.resumeText) || !tailorData.jobDescription?.trim() || !tailorData.jobTitle?.trim() || isPreviewMode}
                    >
                      {tailorMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : isPreviewMode ? (
                        <><Crown className="w-4 h-4 mr-2" /> Upgrade for Recommendations</>
                      ) : (
                        <><Target className="w-4 h-4 mr-2" /> Get Recommendations Only</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {completeResume ? 'Your Tailored Resume' : 'Tailored Resume'}
                    </CardTitle>
                    {completeResume?.tailoredResume && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={downloadResumePdf}
                        disabled={isDownloadingPdf}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isDownloadingPdf ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Downloading...</>
                        ) : (
                          <><FileText className="w-4 h-4 mr-2" /> Download PDF</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {completeResume?.tailoredResume ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800 dark:text-green-300 mb-2">
                          <CheckCircle className="h-5 w-5" />
                          <h4 className="font-semibold">Resume Generated Successfully!</h4>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          Your resume has been tailored for {tailorData.jobTitle}
                          {tailorData.targetCompany && ` at ${tailorData.targetCompany}`}.
                          Click "Download PDF" to save it.
                        </p>
                      </div>

                      {completeResume.modifications && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">✨ AI Modifications Applied:</h4>
                          <ul className="space-y-1 text-sm">
                            {completeResume.modifications.summaryChanged && (
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-blue-600" />
                                Professional summary optimized with job keywords
                              </li>
                            )}
                            {completeResume.modifications.experienceModified > 0 && (
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-blue-600" />
                                {completeResume.modifications.experienceModified} experience section(s) enhanced
                              </li>
                            )}
                            {completeResume.modifications.skillsReordered > 0 && (
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-blue-600" />
                                Skills reordered by relevance to job
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                        <h4 className="font-semibold mb-3">Resume Preview:</h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-semibold text-lg">{completeResume.tailoredResume.fullName}</p>
                            <p className="text-gray-600 dark:text-gray-400">{completeResume.tailoredResume.email}</p>
                          </div>
                          {completeResume.tailoredResume.summary && (
                            <div>
                              <p className="font-semibold">Professional Summary:</p>
                              <p className="text-gray-700 dark:text-gray-300">{completeResume.tailoredResume.summary}</p>
                            </div>
                          )}
                          {completeResume.tailoredResume.skills && completeResume.tailoredResume.skills.length > 0 && (
                            <div>
                              <p className="font-semibold">Top Skills:</p>
                              <p className="text-gray-700 dark:text-gray-300">
                                {completeResume.tailoredResume.skills.slice(0, 10).join(' • ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                        <Label className="text-sm font-semibold mb-3 block">📄 Resume Format (Harvard/Stanford Standard)</Label>
                        <RadioGroup
                          value={pageFormat}
                          onValueChange={(value) => setPageFormat(value as '1-page' | '2-page')}
                          className="space-y-2"
                        >
                          <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white dark:bg-gray-800 hover:border-blue-500 transition-colors">
                            <RadioGroupItem value="1-page" id="format-1page" className="mt-0.5" />
                            <Label htmlFor="format-1page" className="cursor-pointer flex-1">
                              <div className="font-semibold text-sm">1-Page Resume (Compact)</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                ✓ McKinsey/Goldman Sachs standard • Optimized spacing for single page • Best for MBA/entry-level
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white dark:bg-gray-800 hover:border-blue-500 transition-colors">
                            <RadioGroupItem value="2-page" id="format-2page" className="mt-0.5" />
                            <Label htmlFor="format-2page" className="cursor-pointer flex-1">
                              <div className="font-semibold text-sm">2-Page Resume (Professional)</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                ✓ Recommended for 5+ years experience • Better readability • More white space
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={downloadResumePdf}
                          disabled={isDownloadingPdf}
                          className="flex-1"
                        >
                          {isDownloadingPdf ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Downloading...</>
                          ) : (
                            <><FileText className="w-4 h-4 mr-2" /> Download {pageFormat === '1-page' ? '1-Page' : '2-Page'} PDF</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : tailoredResume ? (
                    <div className="space-y-4">
                      {tailoredResume.atsScore && (
                        <div className={`p-6 rounded-lg border-2 ${
                          tailoredResume.atsScore >= 80 ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                          tailoredResume.atsScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                          'bg-red-50 dark:bg-red-900/20 border-red-500'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-lg">ATS Compatibility Score</h4>
                            <div className={`text-3xl font-bold ${
                              tailoredResume.atsScore >= 80 ? 'text-green-600' :
                              tailoredResume.atsScore >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {tailoredResume.atsScore}%
                            </div>
                          </div>
                          <Progress value={tailoredResume.atsScore} className="h-3 mb-3" />
                          <div className="flex gap-2 flex-wrap">
                            <Badge className="bg-green-600 text-white">
                              ✓ {tailoredResume.keywordMatches?.matched?.length || 0} Keywords Matched
                            </Badge>
                            <Badge variant="destructive">
                              ✗ {tailoredResume.keywordMatches?.missing?.length || 0} Keywords Missing
                            </Badge>
                            <Badge variant="outline">
                              {tailoredResume.keywordMatches?.recommended?.length || 0} To Add
                            </Badge>
                          </div>
                          <p className="text-sm mt-3 font-medium">
                            {tailoredResume.atsScore >= 80 ? '🎯 Excellent! Your resume should pass most ATS systems.' :
                             tailoredResume.atsScore >= 60 ? '⚠️ Good, but needs improvement to maximize ATS pass rate.' :
                             '🚨 Low score - follow recommendations below to improve significantly.'}
                          </p>
                        </div>
                      )}
                      {tailoredResume.keywordMatches?.missing && tailoredResume.keywordMatches.missing.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 text-red-800 dark:text-red-200">🚨 Critical Missing Keywords</h4>
                          <p className="text-sm mb-3">Add these keywords to your resume to improve ATS compatibility:</p>
                          <div className="flex flex-wrap gap-2">
                            {tailoredResume.keywordMatches.missing.map((keyword: string, i: number) => (
                              <Badge
                                key={i}
                                variant="destructive"
                                className="cursor-pointer hover:bg-red-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(keyword);
                                  toast({ title: "Copied!", description: `"${keyword}" copied to clipboard` });
                                }}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold mb-2">⚡ Priority Changes (Do These First):</h4>
                        <ul className="space-y-2">
                          {tailoredResume.priorityChanges?.map((change: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-orange-700 dark:text-orange-300">{change}</span>
                            </li>
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
                    <div className="text-center py-16">
                      <Target className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your tailored resume will appear here
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Fill in the job details and click "Tailor Resume" to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resume Gap Filler */}
          <TabsContent value="gaps">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="relative border-2 border-purple-200 dark:border-purple-800">
                {isPreviewMode && <PreviewOverlay featureName="Career Gap Strategy" />}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    Career Gap Strategy Builder
                  </CardTitle>
                  <CardDescription>Present employment gaps positively and strategically</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userResume?.resumeText && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      AI will analyze your stored resume to create gap strategies
                    </div>
                  )}
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
                    onClick={() => {
                      if (!handleBlockedAction('Career Gap Strategy')) {
                        gapMutation.mutate();
                      }
                    }}
                    disabled={gapMutation.isPending || !gapData.gapPeriod || isPreviewMode}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {gapMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                    ) : isPreviewMode ? (
                      <><Crown className="w-4 h-4 mr-2" /> Upgrade to Generate</>
                    ) : (
                      <>Generate Gap Strategy</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-purple-600" />
                    Strategy & Recommendations
                  </CardTitle>
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
                    <div className="text-center py-16">
                      <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Your career gap strategy will appear here
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Enter your gap details to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LinkedIn Optimizer */}
          <TabsContent value="linkedin-optimizer">
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-6 h-6 text-indigo-600" />
                  LinkedIn Profile Optimizer
                </CardTitle>
                <CardDescription>
                  Optimize your LinkedIn profile to attract recruiters and stand out in your industry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
                    Transform Your LinkedIn Profile with AI
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    Stand out to recruiters and hiring managers with an AI-optimized LinkedIn profile that showcases your unique value proposition.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm" data-testid="feature-headline">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">AI-Powered Headline</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Generate attention-grabbing headlines that highlight your expertise
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm" data-testid="feature-about">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">About Section</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Craft compelling narratives that tell your professional story
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm" data-testid="feature-keywords">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                          <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Keyword Analysis</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Optimize with industry-specific keywords to boost visibility
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      What You'll Get:
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Professional headline variations tailored to your industry</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Compelling About section that showcases your unique value</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Strategic keyword recommendations for better recruiter visibility</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Experience bullet point enhancements with measurable impact</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Skills section optimization to pass LinkedIn's search algorithms</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    asChild
                    data-testid="button-go-to-linkedin-optimizer"
                  >
                    <a href="/linkedin-optimizer">
                      <Globe className="w-5 h-5 mr-2" />
                      Go to LinkedIn Optimizer
                    </a>
                  </Button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-100">
                        Pro Tip: Maximize Your Results
                      </h4>
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Upload your current resume first to help our AI understand your background and create more personalized LinkedIn optimizations. The AI will analyze your experience and achievements to craft compelling profile content.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}