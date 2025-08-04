import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  Clock, 
  Target,
  Briefcase,
  Zap,
  Crown,
  Plus,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Building,
  ArrowRight,
  Sparkles,
  Activity,
  BarChart3,
  MessageCircle,
  Code,
  Brain,
  Trophy,
  ChevronRight,
  PlayCircle,
  Award,
  Rocket,
  Lightbulb,
  BookOpen,
  Mic,
  Video,
  PenTool,
  Globe,
  Flame,
  TrendingDown,
  Copy,
  Gift,
  Compass,
  Shield,
  Gauge,
  TrendingUp as TrendUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Layers,
  Megaphone,
  Handshake
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const pulseVariants = {
  rest: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const slideInVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const bounceVariants = {
  rest: { y: 0 },
  bounce: {
    y: [-2, 2, -2],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function EnhancedDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showAchievements, setShowAchievements] = useState(false);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth";
      return;
    }
  }, [isAuthenticated, isLoading]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/applications/stats"],
    retry: false,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
    retry: false,
  });

  const { data: resumes } = useQuery({
    queryKey: ["/api/resumes"],
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const { data: jobPostings } = useQuery({
    queryKey: ["/api/jobs/postings"],
    retry: false,
  });

  const { data: testAssignments } = useQuery({
    queryKey: ["/api/jobseeker/test-assignments"],
    retry: false,
  });

  const { data: rankingTestHistory } = useQuery({
    queryKey: ["/api/ranking-tests/history"],
    retry: false,
  });

  const { data: mockInterviewStats } = useQuery({
    queryKey: ["/api/mock-interview/stats"],
    retry: false,
  });

  const { data: recentJobs } = useQuery({
    queryKey: ["/api/jobs/postings"],
    retry: false,
  });

  const userName = user?.firstName || user?.name || "Job Seeker";
  const isPremium = user?.planType === 'premium';
  const profileCompletion = profile?.profileCompletion || 0;
  const resumeScore = resumes?.[0]?.atsScore || 0;
  const totalApplications = applications?.length || 0;
  const pendingTests = testAssignments?.length || 0;
  const interviewsPending = mockInterviewStats?.totalSessions || 0;

  // Calculate user progress and achievements
  const hasUploadedResume = (resumes?.length || 0) > 0;
  const hasAppliedToJobs = totalApplications > 0;
  const hasCompletedInterview = interviewsPending > 0;
  const hasCompletedTests = (rankingTestHistory?.length || 0) > 0;
  const hasGoodResumeScore = resumeScore >= 70;
  const hasCompleteProfile = profileCompletion >= 80;

  // Calculate overall progress
  const progressTasks = [
    { id: 'profile', completed: hasCompleteProfile, label: 'Complete Profile', points: 20 },
    { id: 'resume', completed: hasUploadedResume, label: 'Upload Resume', points: 15 },
    { id: 'resume_score', completed: hasGoodResumeScore, label: 'Achieve 70+ ATS Score', points: 25 },
    { id: 'apply', completed: hasAppliedToJobs, label: 'Apply to Jobs', points: 20 },
    { id: 'interview', completed: hasCompletedInterview, label: 'Complete Interview', points: 30 },
    { id: 'test', completed: hasCompletedTests, label: 'Take Skill Test', points: 25 }
  ];

  const completedTasksCount = progressTasks.filter(task => task.completed).length;
  const totalProgress = Math.round((completedTasksCount / progressTasks.length) * 100);
  const totalPoints = progressTasks.filter(task => task.completed).reduce((sum, task) => sum + task.points, 0);

  // User level calculation
  const userLevel = Math.floor(totalPoints / 50) + 1;
  const pointsToNextLevel = (userLevel * 50) - totalPoints;

  // Achievements
  const achievements = [
    { 
      id: 'first_resume', 
      title: 'Resume Rookie', 
      description: 'Upload your first resume', 
      icon: Upload, 
      unlocked: hasUploadedResume,
      rarity: 'common'
    },
    { 
      id: 'ats_master', 
      title: 'ATS Master', 
      description: 'Achieve 80+ ATS score', 
      icon: Target, 
      unlocked: resumeScore >= 80,
      rarity: 'rare'
    },
    { 
      id: 'job_hunter', 
      title: 'Job Hunter', 
      description: 'Apply to 5+ jobs', 
      icon: Briefcase, 
      unlocked: totalApplications >= 5,
      rarity: 'common'
    },
    { 
      id: 'interview_ace', 
      title: 'Interview Ace', 
      description: 'Complete 3+ interviews', 
      icon: Video, 
      unlocked: interviewsPending >= 3,
      rarity: 'epic'
    },
    { 
      id: 'skill_champion', 
      title: 'Skill Champion', 
      description: 'Complete 5+ skill tests', 
      icon: Trophy, 
      unlocked: (rankingTestHistory?.length || 0) >= 5,
      rarity: 'legendary'
    }
  ];

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const nextAchievement = achievements.find(a => !a.unlocked);

  // Smart recommendations based on user progress
  const getSmartRecommendations = () => {
    const recommendations = [];
    
    if (!hasUploadedResume) {
      recommendations.push({
        title: "Upload Your Resume",
        description: "Start your journey by uploading your resume for AI analysis",
        action: () => setLocation("/profile"),
        priority: "high",
        icon: Upload,
        color: "red"
      });
    } else if (resumeScore < 70) {
      recommendations.push({
        title: "Improve Resume Score",
        description: `Current ATS score: ${resumeScore}%. Let's get it to 70+!`,
        action: () => setLocation("/resumes"),
        priority: "high",
        icon: TrendUp,
        color: "orange"
      });
    }
    
    if (profileCompletion < 80) {
      recommendations.push({
        title: "Complete Your Profile",
        description: `${profileCompletion}% complete. Finish for better job matches`,
        action: () => setLocation("/profile"),
        priority: "medium",
        icon: Target,
        color: "blue"
      });
    }
    
    if (!hasAppliedToJobs && hasUploadedResume) {
      recommendations.push({
        title: "Apply to Your First Job",
        description: "Your resume is ready! Start applying to positions",
        action: () => setLocation("/jobs"),
        priority: "high",
        icon: Briefcase,
        color: "green"
      });
    }
    
    if (!hasCompletedInterview) {
      recommendations.push({
        title: "Practice Interview Skills",
        description: "Boost confidence with AI-powered interview practice",
        action: () => setLocation("/virtual-interview/new"),
        priority: "medium",
        icon: Video,
        color: "purple"
      });
    }
    
    return recommendations.slice(0, 3); // Show top 3 recommendations
  };

  const smartRecommendations = getSmartRecommendations();

  // Enhanced feature cards with usage tracking
  const featureCards = [
    {
      title: "Career AI Assistant",
      description: "Get personalized career guidance, skill gap analysis, and AI-powered career roadmaps",
      icon: Brain,
      route: "/career-ai-assistant",
      stats: "Powered by AI",
      gradient: "from-orange-500 to-red-500",
      action: "Get Insights",
      helpText: "AI analyzes your profile and provides strategic career advice, skill recommendations, and growth pathways",
      isNew: true,
      usageCount: 0,
      successRate: "95%"
    },
    {
      title: "Smart Job Matching",
      description: "Find perfect jobs with AI matching algorithm that analyzes your skills and preferences",
      icon: Target,
      route: "/jobs",
      stats: `${jobPostings?.length || 0} Jobs Available`,
      gradient: "from-purple-500 to-pink-500",
      action: "Browse Jobs",
      helpText: "AI matches you with jobs based on skills, experience, and career goals - increasing your success rate by 3x",
      isPopular: true,
      usageCount: totalApplications,
      successRate: "78%"
    },
    {
      title: "Virtual Interviews",
      description: "Practice with AI-powered interviews that adapt to your responses and provide real-time feedback",
      icon: Video,
      route: "/virtual-interview/new",
      stats: `${interviewsPending} Completed`,
      gradient: "from-green-500 to-emerald-500",
      action: "Start Interview",
      helpText: "Practice realistic interviews with AI that simulates real hiring managers - 85% of users improve within 3 sessions",
      isRecommended: !hasCompletedInterview,
      usageCount: interviewsPending,
      successRate: "85%"
    },
    {
      title: "Ranking Tests",
      description: "Compete with other candidates in skill-based challenges and showcase your abilities",
      icon: Trophy,
      route: "/ranking-tests",
      stats: `${rankingTestHistory?.length || 0} Completed`,
      gradient: "from-yellow-500 to-orange-500",
      action: "Join Ranking",
      helpText: "Stand out by ranking in top 10% - recruiters actively seek high-performing candidates from our leaderboards",
      isCompetitive: true,
      usageCount: rankingTestHistory?.length || 0,
      successRate: "72%"
    },
    {
      title: "Mock Interviews",
      description: "Practice behavioral interviews with personalized feedback and improvement suggestions",
      icon: Mic,
      route: "/mock-interview",
      stats: `${mockInterviewStats?.averageScore || 0}% Avg Score`,
      gradient: "from-indigo-500 to-purple-500",
      action: "Practice Now",
      helpText: "Master behavioral questions with AI feedback - users report 40% better performance in real interviews",
      isImproving: (mockInterviewStats?.averageScore || 0) > 0,
      usageCount: mockInterviewStats?.totalSessions || 0,
      successRate: "89%"
    }
  ];

  const quickActions = [
    {
      title: "Upload Resume",
      description: "Get instant AI analysis",
      icon: Upload,
      action: () => setLocation("/profile"),
      color: "blue"
    },
    {
      title: "Apply to Jobs",
      description: "Browse and apply instantly",
      icon: Briefcase,
      action: () => setLocation("/jobs"),
      color: "green"
    },
    {
      title: "Start Interview",
      description: "Practice with AI interviewer",
      icon: PlayCircle,
      action: () => setLocation("/virtual-interview/new"),
      color: "purple"
    },
    {
      title: "Take Test",
      description: "Complete technical assessment",
      icon: PenTool,
      action: () => setLocation("/job-seeker-tests"),
      color: "orange"
    }
  ];

  const recentApplications = applications?.slice(0, 3) || [];

  // Resume upload handler
  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
        
        toast({
          title: "Resume Uploaded Successfully",
          description: `ATS Score: ${result.resume?.atsScore || 'Analyzing...'}% - Your resume has been analyzed and optimized.`,
        });
      } else {
        let errorMessage = "Failed to upload resume";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Cover letter generation handler
  const generateCoverLetter = async (jobDescription: string, companyName: string, jobTitle: string) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          jobDescription,
          jobTitle,
          companyName,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCoverLetterResult(result.coverLetter);
        
        toast({
          title: "Cover Letter Generated",
          description: "Your personalized cover letter is ready",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Generation failed");
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Enhanced Welcome Header with Progress */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Main Welcome */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <motion.h1 
                  variants={slideInVariants}
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                >
                  Welcome back, {userName}!
                </motion.h1>
                {isPremium && (
                  <motion.div variants={bounceVariants} initial="rest" animate="bounce">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </motion.div>
                )}
              </div>
              
              {/* User Level & Progress */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 text-sm font-semibold">
                  <Star className="w-4 h-4 mr-1" />
                  Level {userLevel}
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                  {totalPoints} XP
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  <Flame className="w-4 h-4 mr-1 text-orange-500" />
                  {unlockedAchievements.length} Achievements
                </Badge>
              </div>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your AI-powered career journey • {totalProgress}% Complete
              </p>
            </div>

            {/* Progress Overview Card */}
            <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-5" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                      <Gauge className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Career Progress</h3>
                      <p className="text-sm text-muted-foreground">Complete tasks to unlock features and earn XP</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAchievements(!showAchievements)}
                    className="gap-2"
                  >
                    <Award className="w-4 h-4" />
                    Achievements
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">{completedTasksCount}/{progressTasks.length} tasks</span>
                  </div>
                  <Progress value={totalProgress} className="h-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Getting Started</span>
                    <span>Career Ready</span>
                  </div>
                </div>

                {/* Quick Progress Tasks */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {progressTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      variants={slideInVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        task.completed 
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          task.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        }`}>
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Timer className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.label}</p>
                          <p className="text-xs text-muted-foreground">+{task.points} XP</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Next Level Progress */}
                {pointsToNextLevel > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendUp className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Next Level:</span>
                      <span className="text-blue-600 dark:text-blue-400">{pointsToNextLevel} XP to Level {userLevel + 1}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Premium CTA for non-premium users */}
            {!isPremium && (
              <motion.div 
                variants={pulseVariants}
                initial="rest"
                animate="pulse"
                className="mx-auto max-w-2xl"
              >
                <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 dark:from-yellow-950 dark:via-orange-950 dark:to-pink-950 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full">
                        <Rocket className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                          🚀 Unlock Premium Features
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Get unlimited applications, AI interviews, priority support & exclusive features
                        </p>
                      </div>
                      <Button 
                        size="lg"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                        onClick={() => setLocation("/job-seeker-premium")}
                      >
                        Upgrade Now
                        <Sparkles className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Smart Recommendations */}
          {smartRecommendations.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 opacity-5" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                      <Compass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Smart Recommendations</h3>
                      <p className="text-sm text-muted-foreground">Personalized next steps to boost your career</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {smartRecommendations.map((rec, index) => (
                      <motion.div
                        key={rec.title}
                        variants={slideInVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                        className="cursor-pointer"
                        onClick={rec.action}
                      >
                        <Card className={`h-full border-2 transition-all duration-200 hover:shadow-lg ${
                          rec.priority === 'high' 
                            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950' 
                            : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${
                                rec.color === 'red' ? 'from-red-500 to-red-600' :
                                rec.color === 'orange' ? 'from-orange-500 to-orange-600' :
                                rec.color === 'blue' ? 'from-blue-500 to-blue-600' :
                                rec.color === 'green' ? 'from-green-500 to-green-600' :
                                'from-purple-500 to-purple-600'
                              }`}>
                                <rec.icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm">{rec.title}</h4>
                                  {rec.priority === 'high' && (
                                    <Badge className="bg-red-500 text-white text-xs px-2 py-0">
                                      High Priority
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{rec.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Achievements Modal */}
          <AnimatePresence>
            {showAchievements && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowAchievements(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Your Achievements</h3>
                        <p className="text-sm text-muted-foreground">
                          {unlockedAchievements.length} of {achievements.length} unlocked
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAchievements(false)}
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <Card
                        key={achievement.id}
                        className={`transition-all duration-200 ${
                          achievement.unlocked
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-3 rounded-xl ${
                              achievement.unlocked
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                : 'bg-gray-300 dark:bg-gray-700'
                            }`}>
                              <achievement.icon className={`w-6 h-6 ${
                                achievement.unlocked ? 'text-white' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{achievement.title}</h4>
                                <Badge
                                  className={`text-xs px-2 py-0 ${
                                    achievement.rarity === 'legendary' ? 'bg-purple-500 text-white' :
                                    achievement.rarity === 'epic' ? 'bg-orange-500 text-white' :
                                    achievement.rarity === 'rare' ? 'bg-blue-500 text-white' :
                                    'bg-gray-500 text-white'
                                  }`}
                                >
                                  {achievement.rarity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              {achievement.unlocked && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Unlocked!
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {nextAchievement && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">Next Achievement:</p>
                          <p className="text-sm text-muted-foreground">{nextAchievement.title} - {nextAchievement.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resume Analysis Featured Card */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-xl">
              <div className="absolute inset-0 bg-black/5" />
              <CardContent className="p-8 relative text-white">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">AI Resume Analysis</h2>
                      <p className="text-emerald-100 text-base">
                        Upload and optimize your resumes with AI-powered ATS scoring
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 font-medium px-3 py-1">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Upload Status */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-100 font-medium">Resumes uploaded:</span>
                      <span className="text-xl font-bold">
                        {(resumes as any)?.length || 0}/{user?.planType === 'premium' ? '∞' : '2'}
                      </span>
                    </div>
                    
                    {((resumes as any)?.length || 0) >= 2 && user?.planType !== 'premium' && (
                      <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                        <p className="text-sm font-medium mb-3">Upload limit reached</p>
                        <Button 
                          className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-semibold shadow-lg"
                          onClick={() => setLocation("/pricing")}
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade for Unlimited
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Latest Analysis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-emerald-100">Latest Resume Analysis:</h3>
                    
                    {resumes && (resumes as any).length > 0 ? (
                      <div className="bg-white/10 rounded-xl p-4 border border-white/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-emerald-100">
                            📄 {(resumes as any)[0]?.name || 'Resume'}
                          </span>
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold">
                            ATS: {resumeScore}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="text-xl font-bold text-green-300">
                              {(resumes as any)[0]?.analysis?.content?.strengthsFound?.length || 1}
                            </div>
                            <div className="text-xs text-emerald-200">Strengths</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-orange-300">
                              {(resumes as any)[0]?.analysis?.recommendations?.length || 4}
                            </div>
                            <div className="text-xs text-emerald-200">Tips</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-red-300">
                              {(resumes as any)[0]?.analysis?.keywordOptimization?.missingKeywords?.length || 2}
                            </div>
                            <div className="text-xs text-emerald-200">Missing</div>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                          onClick={() => setLocation("/resumes")}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Analysis
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-white/10 rounded-xl p-4 border border-white/20 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-3 text-emerald-200" />
                        <p className="text-sm text-emerald-100 mb-3">Upload your resume to get instant AI analysis</p>
                        <Button 
                          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
                          onClick={() => setLocation("/resumes")}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Overview */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                    <p className="text-3xl font-bold">{totalApplications}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Profile Score</p>
                    <p className="text-3xl font-bold">{profileCompletion}%</p>
                  </div>
                  <Target className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">ATS Score</p>
                    <p className="text-3xl font-bold">{resumeScore}%</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Pending Tests</p>
                    <p className="text-3xl font-bold">{pendingTests}</p>
                  </div>
                  <Code className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Quick Actions */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Quick Actions</h2>
                  <p className="text-sm text-muted-foreground">Jump into your career journey</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
                <Timer className="w-3 h-3 mr-1" />
                Fast Track
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className="cursor-pointer"
                  onClick={action.action}
                >
                  <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all duration-200 shadow-md hover:shadow-lg">
                    <CardContent className="p-6 text-center">
                      <motion.div 
                        variants={pulseVariants}
                        initial="rest"
                        whileHover="pulse"
                        className={`w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br ${
                          action.color === 'blue' ? 'from-blue-500 to-blue-600' :
                          action.color === 'green' ? 'from-green-500 to-green-600' :
                          action.color === 'purple' ? 'from-purple-500 to-purple-600' :
                          'from-orange-500 to-orange-600'
                        } flex items-center justify-center shadow-lg`}
                      >
                        <action.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="font-semibold mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full group hover:bg-primary hover:text-primary-foreground"
                      >
                        Get Started
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main Feature Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


            {/* Assigned Tests Card */}
            <motion.div variants={itemVariants}>
              <Card className="h-full border-0 overflow-hidden relative bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-5" />
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                      <Code className="w-6 h-6 text-white" />
                    </div>
                    {pendingTests > 0 && (
                      <Badge className="bg-orange-500 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        {pendingTests} Pending
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">Assigned Tests</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete technical assessments assigned by recruiters to showcase your skills and advance in the hiring process
                  </p>
                  
                  {pendingTests > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pending Tests</span>
                        <span className="text-lg font-bold text-orange-600">{pendingTests}</span>
                      </div>
                      <div className="space-y-2">
                        {testAssignments?.slice(0, 2).map((test: any, index: number) => (
                          <div key={index} className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                            <p className="text-sm font-medium">{test.testType || 'Technical Assessment'}</p>
                            <p className="text-xs text-muted-foreground">{test.jobTitle || 'Job Position'}</p>
                          </div>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => setLocation("/job-seeker-tests")}
                      >
                        Take Tests
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Code className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">No assigned tests at the moment</p>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation("/ranking-tests")}
                      >
                        Try Practice Tests
                        <Trophy className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Enhanced Feature Cards */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI-Powered Features</h2>
                  <p className="text-sm text-muted-foreground">Discover tools that accelerate your career</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                <Zap className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featureCards.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className="cursor-pointer"
                  onClick={() => setLocation(feature.route)}
                >
                  <Card className="h-full border-0 overflow-hidden relative shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`} />
                    <CardContent className="p-6 relative">
                      {/* Feature badges */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex gap-2">
                          {feature.isNew && (
                            <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                              <Sparkles className="w-3 h-3 mr-1" />
                              New
                            </Badge>
                          )}
                          {feature.isPopular && (
                            <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                              <Flame className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                          {feature.isRecommended && (
                            <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                              <Star className="w-3 h-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                          {feature.isCompetitive && (
                            <Badge className="bg-purple-500 text-white text-xs px-2 py-1">
                              <Trophy className="w-3 h-3 mr-1" />
                              Competitive
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                      
                      {/* Usage stats */}
                      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>Used {feature.usageCount} times</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendUp className="w-3 h-3" />
                          <span>{feature.successRate} success rate</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-4 italic">{feature.helpText}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">{feature.stats}</span>
                        <Button 
                          size="sm" 
                          className={`group bg-gradient-to-r ${feature.gradient} hover:shadow-lg transition-all duration-200`}
                        >
                          {feature.action}
                          <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>

                      {/* Progress indicator for features with usage */}
                      {feature.usageCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Your Progress</span>
                            <span>{Math.min(feature.usageCount * 20, 100)}%</span>
                          </div>
                          <Progress value={Math.min(feature.usageCount * 20, 100)} className="h-1" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Jobs Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Recent Platform Jobs</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation("/jobs")}
                  >
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative">
                {recentJobs && recentJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentJobs.slice(0, 6).map((job: any) => (
                      <div 
                        key={job.id} 
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border/50 hover:border-purple-200 dark:hover:border-purple-800 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/jobs/${job.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Building className="w-8 h-8 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {job.jobType || 'Full-time'}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-1">{job.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{job.companyName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{job.location || 'Remote'}</span>
                        </div>
                        {job.salaryRange && (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <DollarSign className="w-3 h-3" />
                            <span>{job.salaryRange}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No jobs available at the moment</p>
                    <Button onClick={() => setLocation("/jobs")}>
                      Browse All Jobs
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Resume Analysis & AI Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resume Analysis Tab */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Resume Analysis
                  </CardTitle>
                  <p className="text-sm text-green-100">
                    Upload and optimize your resumes with AI-powered ATS scoring
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Resumes uploaded:</span>
                    <span className="font-medium">
                      {resumes?.length || 0}/{user?.planType === 'premium' ? '∞' : '2'}
                    </span>
                  </div>
                  
                  {(resumes?.length || 0) < (user?.planType === 'premium' ? 999 : 2) ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleResumeUpload(file);
                          }
                        }}
                        className="w-full p-2 rounded bg-white/20 border border-white/30 text-white placeholder:text-white/70 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/30 file:text-white"
                        disabled={isUploadingResume}
                      />
                      {isUploadingResume && (
                        <div className="mt-2 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white mx-auto"></div>
                          <p className="text-xs mt-1 text-green-100">Analyzing resume...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-green-100 mb-2">
                        {user?.planType === 'premium' ? 'Unlimited uploads available' : 'Upload limit reached'}
                      </p>
                      {user?.planType !== 'premium' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => setLocation("/job-seeker-premium")}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade for Unlimited
                        </Button>
                      )}
                    </div>
                  )}

                  {resumes && resumes.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Latest Resume Analysis:</div>
                      <div className="bg-white/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate">{resumes[0]?.name || 'Resume'}</span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              (resumes[0]?.atsScore || 0) >= 80 ? 'bg-green-100 text-green-800' :
                              (resumes[0]?.atsScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            ATS: {resumes[0]?.atsScore || 'N/A'}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-green-200">
                              {resumes[0]?.analysis?.content?.strengthsFound?.length || 0}
                            </div>
                            <div>Strengths</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-orange-200">
                              {resumes[0]?.analysis?.recommendations?.length || 0}
                            </div>
                            <div>Tips</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-200">
                              {resumes[0]?.analysis?.keywordOptimization?.missingKeywords?.length || 0}
                            </div>
                            <div>Missing</div>
                          </div>
                        </div>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => setLocation("/resumes")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Analysis
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Cover Letter Generator */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cover Letter Generator
                  </CardTitle>
                  <p className="text-sm text-blue-100">
                    Generate personalized cover letters with AI
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Company name..."
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                        id="company-name-input"
                      />
                      <Input
                        placeholder="Job title..."
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                        id="job-title-input"
                      />
                    </div>
                    <textarea
                      placeholder="Paste the job description here..."
                      className="w-full p-3 rounded bg-white/20 border border-white/30 text-white placeholder:text-white/70 min-h-[100px] resize-none"
                      id="job-description-input"
                    />
                    <Button
                      variant="secondary"
                      className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => {
                        const jobDesc = (document.getElementById('job-description-input') as HTMLTextAreaElement)?.value;
                        const companyName = (document.getElementById('company-name-input') as HTMLInputElement)?.value || 'The Company';
                        const jobTitle = (document.getElementById('job-title-input') as HTMLInputElement)?.value || 'The Position';
                        
                        if (jobDesc.trim()) {
                          generateCoverLetter(jobDesc, companyName, jobTitle);
                        } else {
                          toast({
                            title: "Job Description Required",
                            description: "Please paste a job description first",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Cover Letter
                        </>
                      )}
                    </Button>
                  </div>

                  {coverLetterResult && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Generated Cover Letter:</div>
                      <div className="bg-white/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <pre className="text-xs text-white/90 whitespace-pre-wrap font-sans">
                          {coverLetterResult}
                        </pre>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                        onClick={() => {
                          navigator.clipboard.writeText(coverLetterResult);
                          toast({
                            title: "Copied to Clipboard",
                            description: "Cover letter copied successfully",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Enhanced Premium CTA (if not premium) */}
          {!isPremium && (
            <motion.div variants={itemVariants}>
              <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-yellow-500 via-orange-500 to-pink-500 shadow-2xl">
                <div className="absolute inset-0 bg-black/10" />
                <CardContent className="p-8 relative text-white">
                  <div className="text-center mb-8">
                    <motion.div 
                      variants={bounceVariants}
                      initial="rest"
                      animate="bounce"
                      className="flex items-center justify-center gap-3 mb-4"
                    >
                      <Crown className="w-10 h-10 text-yellow-200" />
                      <h3 className="text-3xl font-bold">
                        Unlock Your Full Potential
                      </h3>
                      <Crown className="w-10 h-10 text-yellow-200" />
                    </motion.div>
                    
                    <p className="text-lg text-yellow-100 mb-2 max-w-3xl mx-auto">
                      Join thousands of successful job seekers who landed their dream jobs with our premium features.
                    </p>
                    <p className="text-yellow-200 text-sm">
                      🚀 Get unlimited applications, AI interviews, priority support & exclusive features
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <motion.div 
                      variants={slideInVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.1 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Flame className="w-8 h-8 text-yellow-200" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">Unlimited Applications</h4>
                      <p className="text-sm text-yellow-100">Apply to as many jobs as you want</p>
                    </motion.div>
                    
                    <motion.div 
                      variants={slideInVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.2 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-purple-200" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">AI Virtual Interviews</h4>
                      <p className="text-sm text-yellow-100">Practice with advanced AI interviewer</p>
                    </motion.div>
                    
                    <motion.div 
                      variants={slideInVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.3 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-green-200" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">Priority Rankings</h4>
                      <p className="text-sm text-yellow-100">Get featured in ranking tests</p>
                    </motion.div>
                    
                    <motion.div 
                      variants={slideInVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.4 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-blue-200" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">Priority Support</h4>
                      <p className="text-sm text-yellow-100">Get help when you need it most</p>
                    </motion.div>
                  </div>

                  {/* Success stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">3x</div>
                      <div className="text-sm text-yellow-100">Higher Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">85%</div>
                      <div className="text-sm text-yellow-100">Interview Improvement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">10k+</div>
                      <div className="text-sm text-yellow-100">Success Stories</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <motion.div
                      variants={pulseVariants}
                      initial="rest"
                      animate="pulse"
                    >
                      <Button 
                        size="lg"
                        className="bg-white text-orange-600 hover:bg-gray-100 font-bold px-12 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                        onClick={() => setLocation("/job-seeker-premium")}
                      >
                        <Crown className="w-6 h-6 mr-3" />
                        Upgrade to Premium Now
                        <Sparkles className="w-6 h-6 ml-3" />
                      </Button>
                    </motion.div>
                    <p className="text-xs text-yellow-200 mt-3">
                      ⚡ Limited time offer • 30-day money-back guarantee
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}