import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  Wrench,
  Target,
  Brain,
  FileText,
  DollarSign,
  MapPin,
  Building,
  Clock,
  Zap,
  Search,
  Download,
  Upload,
  CheckCircle,
  Star,
  TrendingUp,
  BarChart3,
  Eye,
  Globe,
  Shield,
  Lightbulb,
  Calculator,
  Filter,
  Sparkles,
  Code,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle,
  Users,
  Chrome,
  Smartphone,
  Mail,
  MessageSquare,
  Video,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  Headphones,
  HelpCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  isPopular?: boolean;
  isPremium?: boolean;
  status?: "active" | "inactive";
}

export default function AdvancedToolsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleToolClick = (toolId: string) => {
    if (toolId === "linkedin-optimizer") {
      setLocation("/linkedin-optimizer");
    } else {
      setSelectedTool(toolId);
    }
  };

  const tools: Tool[] = [
    // Resume & Profile Tools
    {
      id: "ats-scanner",
      name: "ATS Resume Scanner",
      description: "Check if your resume passes Applicant Tracking Systems with detailed feedback and optimization suggestions.",
      icon: Target,
      category: "resume",
      isPopular: true,
    },
    {
      id: "resume-builder",
      name: "AI Resume Builder",
      description: "Create ATS-friendly resumes with AI-powered content suggestions and professional templates.",
      icon: FileText,
      category: "resume",
    },
    {
      id: "resume-optimizer",
      name: "Resume Keyword Optimizer",
      description: "Optimize your resume with relevant keywords based on job descriptions and industry trends.",
      icon: Sparkles,
      category: "resume",
    },
    {
      id: "profile-scorer",
      name: "Profile Completeness Score",
      description: "Get a detailed analysis of your profile completeness with actionable improvement suggestions.",
      icon: Star,
      category: "resume",
    },
    {
      id: "linkedin-optimizer",
      name: "LinkedIn Profile Optimizer",
      description: "AI-powered LinkedIn profile optimization with headline, about section, and keyword recommendations.",
      icon: TrendingUp,
      category: "resume",
      isPopular: true,
    },

    // Job Search Tools
    {
      id: "salary-calculator",
      name: "Salary Calculator",
      description: "Research competitive salaries based on role, location, experience, and company size.",
      icon: DollarSign,
      category: "search",
      isPopular: true,
    },
    {
      id: "job-matcher",
      name: "Smart Job Matcher",
      description: "Find jobs that match your skills, experience, and preferences using AI-powered algorithms.",
      icon: Search,
      category: "search",
    },
    {
      id: "company-research",
      name: "Company Research Tool",
      description: "Get comprehensive insights about companies, including culture, benefits, and employee reviews.",
      icon: Building,
      category: "search",
    },
    {
      id: "location-analyzer",
      name: "Location Job Analyzer",
      description: "Analyze job markets by location with data on demand, salaries, and growth trends.",
      icon: MapPin,
      category: "search",
    },

    // Application Tools
    {
      id: "auto-apply",
      name: "Auto Job Application",
      description: "Automatically apply to multiple jobs with customized cover letters and resume optimization.",
      icon: Zap,
      category: "application",
      isPopular: true,
      isPremium: true,
    },
    {
      id: "cover-letter-ai",
      name: "AI Cover Letter Generator",
      description: "Generate personalized cover letters tailored to specific job postings and companies.",
      icon: Mail,
      category: "application",
    },
    {
      id: "application-tracker",
      name: "Application Tracker",
      description: "Track all your job applications with status updates, follow-ups, and interview scheduling.",
      icon: BarChart3,
      category: "application",
    },
    {
      id: "email-templates",
      name: "Professional Email Templates",
      description: "Access templates for follow-ups, interview thank-you notes, and networking emails.",
      icon: MessageSquare,
      category: "application",
    },

    // Interview Tools
    {
      id: "interview-prep",
      name: "AI Interview Prep",
      description: "Practice with AI-powered mock interviews and get personalized feedback on your responses.",
      icon: Video,
      category: "interview",
      isPremium: true,
    },
    {
      id: "question-bank",
      name: "Interview Question Bank",
      description: "Access thousands of interview questions categorized by role, company, and difficulty level.",
      icon: HelpCircle,
      category: "interview",
    },
    {
      id: "behavioral-coach",
      name: "Behavioral Interview Coach",
      description: "Master behavioral interviews with the STAR method and personalized coaching.",
      icon: Brain,
      category: "interview",
    },
    {
      id: "technical-prep",
      name: "Technical Interview Prep",
      description: "Practice coding challenges and technical questions with real-time feedback.",
      icon: Code,
      category: "interview",
    },

    // Networking Tools
    {
      id: "linkedin-optimizer",
      name: "LinkedIn Profile Optimizer",
      description: "Optimize your LinkedIn profile for better visibility and networking opportunities.",
      icon: Users,
      category: "networking",
    },
    {
      id: "referral-finder",
      name: "Employee Referral Finder",
      description: "Connect with employees at your target companies for potential referrals and insights.",
      icon: Handshake,
      category: "networking",
      isPremium: true,
    },
    {
      id: "networking-tracker",
      name: "Networking Tracker",
      description: "Manage your professional network with contact tracking and follow-up reminders.",
      icon: Calendar,
      category: "networking",
    },

    // Skills & Learning
    {
      id: "skill-gap-analyzer",
      name: "Skill Gap Analyzer",
      description: "Identify skill gaps for your target roles and get personalized learning recommendations.",
      icon: TrendingUp,
      category: "skills",
    },
    {
      id: "certification-tracker",
      name: "Certification Tracker",
      description: "Track your professional certifications and discover new ones to advance your career.",
      icon: Award,
      category: "skills",
    },
    {
      id: "learning-path",
      name: "Personalized Learning Path",
      description: "Get customized learning recommendations based on your career goals and current skills.",
      icon: BookOpen,
      category: "skills",
    },
  ];

  const categories = [
    { id: "all", name: "All Tools", icon: Wrench },
    { id: "resume", name: "Resume & Profile", icon: FileText },
    { id: "search", name: "Job Search", icon: Search },
    { id: "application", name: "Applications", icon: Zap },
    { id: "interview", name: "Interview Prep", icon: Video },
    { id: "networking", name: "Networking", icon: Users },
    { id: "skills", name: "Skills & Learning", icon: GraduationCap },
  ];

  const filteredTools = activeTab === "all" ? tools : tools.filter(tool => tool.category === activeTab);
  const popularTools = tools.filter(tool => tool.isPopular);

  const analyzeResume = async () => {
    if (!resumeText.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate ATS analysis
    setTimeout(() => {
      const score = Math.floor(Math.random() * 30) + 70; // 70-100 range
      setAtsScore(score);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return "Excellent! Your resume is highly optimized for ATS.";
    if (score >= 75) return "Good! Minor improvements could help.";
    if (score >= 60) return "Fair. Several areas need improvement.";
    return "Poor. Significant optimization needed.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Wrench className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Advanced Job Search Tools
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Supercharge your job search with AI-powered tools for resume optimization, interview prep, salary research, and career advancement.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{tools.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Tools</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{popularTools.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Popular Tools</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{tools.filter(t => t.isPremium).length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Premium Tools</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{categories.length - 1}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Categories</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured: ATS Resume Scanner */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              Featured: ATS Resume Scanner
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Most Popular</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Test your resume against Applicant Tracking Systems to ensure it gets past the initial screening.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resume-text">Paste your resume text here:</Label>
                  <Textarea
                    id="resume-text"
                    placeholder="Copy and paste your resume content..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="min-h-32"
                  />
                </div>
                
                <div>
                  <Label htmlFor="job-desc">Job description (optional):</Label>
                  <Textarea
                    id="job-desc"
                    placeholder="Paste the job description to get targeted optimization tips..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-24"
                  />
                </div>
                
                <Button 
                  onClick={analyzeResume} 
                  disabled={!resumeText.trim() || isAnalyzing}
                  className="w-full"
                  data-testid="button-analyze-resume"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-4">
                {atsScore !== null ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-white dark:bg-gray-800 rounded-lg border"
                  >
                    <div className="text-center mb-4">
                      <div className={`text-4xl font-bold mb-2 ${getScoreColor(atsScore)}`}>
                        {atsScore}/100
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">ATS Compatibility Score</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-sm font-medium mb-2">Analysis Summary:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {getScoreDescription(atsScore)}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Keyword Match</span>
                          <span className="font-medium">{Math.floor(atsScore * 0.9)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Format Score</span>
                          <span className="font-medium">{Math.floor(atsScore * 0.95)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Readability</span>
                          <span className="font-medium">{Math.floor(atsScore * 1.02)}%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Upload your resume to get started with ATS analysis</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tool Categories */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7 mb-6">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex items-center gap-2"
                  >
                    <category.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group"
                      >
                        <Card className="h-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform">
                                  <Icon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                    {tool.name}
                                  </h3>
                                  <div className="flex gap-2 mt-1">
                                    {tool.isPopular && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Star className="w-3 h-3 mr-1" />
                                        Popular
                                      </Badge>
                                    )}
                                    {tool.isPremium && (
                                      <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                        Premium
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                              {tool.description}
                            </p>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleToolClick(tool.id)}
                                data-testid={`button-use-${tool.id}`}
                              >
                                Use Tool
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
                
                {filteredTools.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tools found</h3>
                    <p className="text-gray-500">Try selecting a different category</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Access Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Chrome className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Chrome Extension</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Auto-apply to jobs</p>
                </div>
              </div>
              <Link href="/chrome-extension">
                <Button size="sm" className="w-full mt-3">Install</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Salary Research</h3>
                  <p className="text-xs text-green-700 dark:text-green-300">Compare salaries</p>
                </div>
              </div>
              <Button size="sm" className="w-full mt-3" variant="outline">Research</Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Mock Interview</h3>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Practice with AI</p>
                </div>
              </div>
              <Link href="/mock-interview">
                <Button size="sm" className="w-full mt-3" variant="outline">Start</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">Get Referrals</h3>
                  <p className="text-xs text-orange-700 dark:text-orange-300">Network & connect</p>
                </div>
              </div>
              <Link href="/referral-marketplace">
                <Button size="sm" className="w-full mt-3" variant="outline">Explore</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}