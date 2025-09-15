import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { ContextualSidebar } from "@/components/contextual-sidebar";
import { 
  SidebarProvider, 
  SidebarInset,
  SidebarTrigger 
} from "@/components/ui/sidebar";
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
  Handshake,
  Headphones,
  Bell,
  Network,
  UserCheck,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};

const pulseVariants = {
  rest: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const slideInVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const bounceVariants = {
  rest: { y: 0 },
  bounce: {
    y: [-2, 2, -2],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
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
  const [showExitModal, setShowExitModal] = useState(false);
  const [showInsightsPaywall, setShowInsightsPaywall] = useState(false);

  // Usage tracking for freemium limits - moved to top to avoid hoisting issues
  const [dailyUsage, setDailyUsage] = useState({
    aiCoachQuestions: 2, // Free users get 3 per day
    jobApplications: 8, // Free users get 10 per day
    resumeAnalyses: 1, // Free users get 2 per day
    interviewPractices: 1, // Free users get 2 per day
  });

  // Define key variables early to avoid hoisting issues
  const userName = user?.firstName || user?.name || "Job Seeker";
  const isPremium = user?.planType === "premium";

  // Freemium limits - moved to top to avoid hoisting issues
  const freemiumLimits = {
    aiCoachQuestions: { free: 3, premium: "unlimited" },
    jobApplications: { free: 10, premium: "unlimited" },
    resumeAnalyses: { free: 2, premium: "unlimited" },
    interviewPractices: { free: 2, premium: "unlimited" },
    advancedInsights: { free: false, premium: true },
    prioritySupport: { free: false, premium: true },
  };

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

  // Exit-intent detection for premium modal - DISABLED
  useEffect(() => {
    // Disabled exit intent popup to prevent intrusive behavior
    return;
  }, [isPremium, showExitModal]);

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

  // Safe data access with proper fallbacks
  const profileCompletion = (profile as any)?.profileCompletion || 0;
  const resumeScore = Array.isArray(resumes) && resumes.length > 0 ? resumes[0]?.atsScore || 0 : 0;
  const totalApplications = Array.isArray(applications) ? applications.length : 0;
  const pendingTests = Array.isArray(testAssignments) ? testAssignments.length : 0;
  const interviewsPending = (mockInterviewStats as any)?.totalSessions || 0;

  // Calculate user progress and achievements
  const hasUploadedResume = Array.isArray(resumes) ? resumes.length > 0 : false;
  const hasAppliedToJobs = totalApplications > 0;
  const hasCompletedInterview = interviewsPending > 0;
  const hasCompletedTests = Array.isArray(rankingTestHistory) ? rankingTestHistory.length > 0 : false;
  const hasGoodResumeScore = resumeScore >= 70;
  const hasCompleteProfile = profileCompletion >= 80;

  // Calculate overall progress
  const progressTasks = [
    {
      id: "profile",
      completed: hasCompleteProfile,
      label: "Complete Profile",
      points: 20,
    },
    {
      id: "resume",
      completed: hasUploadedResume,
      label: "Upload Resume",
      points: 15,
    },
    {
      id: "resume_score",
      completed: hasGoodResumeScore,
      label: "Achieve 70+ ATS Score",
      points: 25,
    },
    {
      id: "apply",
      completed: hasAppliedToJobs,
      label: "Apply to Jobs",
      points: 20,
    },
    {
      id: "interview",
      completed: hasCompletedInterview,
      label: "Complete Interview",
      points: 30,
    },
    {
      id: "test",
      completed: hasCompletedTests,
      label: "Take Skill Test",
      points: 25,
    },
  ];

  const completedTasksCount = progressTasks.filter(
    (task) => task.completed,
  ).length;
  const totalProgress = Math.round(
    (completedTasksCount / progressTasks.length) * 100,
  );
  const totalPoints = progressTasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.points, 0);

  // User level calculation
  const userLevel = Math.floor(totalPoints / 50) + 1;
  const pointsToNextLevel = userLevel * 50 - totalPoints;

  // Achievements
  const achievements = [
    {
      id: "first_resume",
      title: "Resume Rookie",
      description: "Upload your first resume",
      icon: Upload,
      unlocked: hasUploadedResume,
      rarity: "common",
    },
    {
      id: "ats_master",
      title: "ATS Master",
      description: "Achieve 80+ ATS score",
      icon: Target,
      unlocked: resumeScore >= 80,
      rarity: "rare",
    },
    {
      id: "job_hunter",
      title: "Job Hunter",
      description: "Apply to 5+ jobs",
      icon: Briefcase,
      unlocked: totalApplications >= 5,
      rarity: "common",
    },
    {
      id: "interview_ace",
      title: "Interview Ace",
      description: "Complete 3+ interviews",
      icon: Video,
      unlocked: interviewsPending >= 3,
      rarity: "epic",
    },
    {
      id: "skill_champion",
      title: "Skill Champion",
      description: "Complete 5+ skill tests",
      icon: Trophy,
      unlocked: Array.isArray(rankingTestHistory) && rankingTestHistory.length >= 5,
      rarity: "legendary",
    },
  ];

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const nextAchievement = achievements.find((a) => !a.unlocked);

  // Usage tracking and freemium limits moved to top to avoid hoisting issues

  // Smart recommendations with premium upselling
  const getSmartRecommendations = () => {
    const recommendations = [];

    // Premium-focused recommendations
    if (
      !isPremium &&
      dailyUsage.aiCoachQuestions >= freemiumLimits.aiCoachQuestions.free
    ) {
      recommendations.push({
        title: "🚀 Unlock Unlimited AI Coach",
        description:
          "You've used all 3 daily AI coach questions. Get unlimited access!",
        action: () => setLocation("/job-seeker-premium"),
        priority: "premium",
        icon: Crown,
        color: "gold",
        isPremiumFeature: true,
      });
    }

    if (
      !isPremium &&
      dailyUsage.jobApplications >= freemiumLimits.jobApplications.free
    ) {
      recommendations.push({
        title: "💼 Apply to More Jobs",
        description:
          "Daily application limit reached. Upgrade for unlimited applications!",
        action: () => setLocation("/job-seeker-premium"),
        priority: "premium",
        icon: Briefcase,
        color: "gold",
        isPremiumFeature: true,
      });
    }

    if (!hasUploadedResume) {
      recommendations.push({
        title: "Upload Your Resume",
        description:
          "Start your journey by uploading your resume for AI analysis",
        action: () => setLocation("/profile"),
        priority: "high",
        icon: Upload,
        color: "red",
      });
    } else if (resumeScore < 70) {
      recommendations.push({
        title: "Improve Resume Score",
        description: `Current ATS score: ${resumeScore}%. Let's get it to 70+!`,
        action: () => setLocation("/resumes"),
        priority: "high",
        icon: TrendUp,
        color: "orange",
      });
    }

    if (profileCompletion < 80) {
      recommendations.push({
        title: "Complete Your Profile",
        description: `${profileCompletion}% complete. Finish for better job matches`,
        action: () => setLocation("/profile"),
        priority: "medium",
        icon: Target,
        color: "blue",
      });
    }

    if (!hasAppliedToJobs && hasUploadedResume) {
      recommendations.push({
        title: "Apply to Your First Job",
        description: "Your resume is ready! Start applying to positions",
        action: () => setLocation("/jobs"),
        priority: "high",
        icon: Briefcase,
        color: "green",
      });
    }

    if (!hasCompletedInterview) {
      recommendations.push({
        title: "Practice Interview Skills",
        description: "Boost confidence with AI-powered interview practice",
        action: () => setLocation("/virtual-interview/new"),
        priority: "medium",
        icon: Video,
        color: "purple",
      });
    }

    // Premium-only insights recommendation
    if (!isPremium && hasAppliedToJobs && totalApplications >= 3) {
      recommendations.push({
        title: "🔍 Get Advanced Job Insights",
        description:
          "See why applications aren't converting. Premium analytics available!",
        action: () => setLocation("/job-seeker-premium"),
        priority: "premium",
        icon: BarChart3,
        color: "gold",
        isPremiumFeature: true,
      });
    }

    return recommendations.slice(0, 4); // Show top 4 recommendations
  };

  const smartRecommendations = getSmartRecommendations();

  // Handle resume upload
  const handleResumeUpload = async (file: File) => {
    if (!file) return;

    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Resume Uploaded Successfully!",
          description:
            "Your resume is being analyzed. Results will be available shortly.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description:
          "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Generate cover letter
  const generateCoverLetter = async (
    jobDescription: string,
    companyName: string,
    jobTitle: string,
  ) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobData: {
            company: companyName,
            title: jobTitle,
            description: jobDescription,
          },
          userProfile: null, // Will be fetched server-side
          extractedData: {
            company: companyName,
            role: jobTitle,
          },
        }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCoverLetterResult(data.coverLetter);
        toast({
          title: "Cover Letter Generated!",
          description: "Your personalized cover letter is ready.",
        });
      } else {
        throw new Error("Generation failed");
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description:
          "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Success stories for social proof
  const successStories = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "Google",
      avatar: "👩‍💻",
      story: "Got 3 interviews in 2 weeks using AI resume optimization!",
      improvement: "300% more interviews",
      timeframe: "2 weeks",
    },
    {
      name: "Marcus Johnson",
      role: "Product Manager",
      company: "Microsoft",
      avatar: "👨‍💼",
      story:
        "Premium insights helped me identify skill gaps and land my dream job!",
      improvement: "5x more responses",
      timeframe: "3 weeks",
    },
    {
      name: "Emily Rodriguez",
      role: "Data Scientist",
      company: "Netflix",
      avatar: "👩‍🔬",
      story: "AI interview practice boosted my confidence and success rate!",
      improvement: "85% interview success",
      timeframe: "1 month",
    },
  ];

  // Premium benefits for comparison
  const premiumBenefits = [
    {
      feature: "AI Coach Questions",
      freeLimit: "3/day",
      premiumValue: "Unlimited",
      roi: "Save $200/month",
      icon: Brain,
    },
    {
      feature: "Job Applications",
      freeLimit: "10/day",
      premiumValue: "Unlimited",
      roi: "Apply 5x more",
      icon: Briefcase,
    },
    {
      feature: "Resume Analysis",
      freeLimit: "2/day",
      premiumValue: "Unlimited",
      roi: "Perfect ATS score",
      icon: FileText,
    },
    {
      feature: "Career Insights",
      freeLimit: "None",
      premiumValue: "Full access",
      roi: "3x better results",
      icon: BarChart3,
    },
  ];

  // Duplicate removed - using the one defined above

  // Enhanced feature cards with usage tracking
  const featureCards = [
    {
      title: "Career AI Assistant",
      description:
        "Get personalized career guidance, skill gap analysis, and AI-powered career roadmaps",
      icon: Brain,
      route: "/career-ai-assistant",
      stats: "Powered by AI",
      gradient: "from-blue-500 to-blue-600",
      action: "Get Insights",
      helpText:
        "AI analyzes your profile and provides strategic career advice, skill recommendations, and growth pathways",
      isNew: true,
      usageCount: 0,
      successRate: "95%",
    },
    {
      title: "Smart Job Matching",
      description:
        "Find perfect jobs with AI matching algorithm that analyzes your skills and preferences",
      icon: Target,
      route: "/jobs",
      stats: `${Array.isArray(jobPostings) ? jobPostings.length : 0} Jobs Available`,
      gradient: "from-gray-600 to-gray-700",
      action: "Browse Jobs",
      helpText:
        "AI matches you with jobs based on skills, experience, and career goals - increasing your success rate by 3x",
      isPopular: true,
      usageCount: totalApplications,
      successRate: "78%",
    },
    {
      title: "Virtual Interviews",
      description:
        "Practice with AI-powered interviews that adapt to your responses and provide real-time feedback",
      icon: Video,
      route: "/virtual-interview/new",
      stats: `${interviewsPending} Completed`,
      gradient: "from-blue-600 to-indigo-600",
      action: "Start Interview",
      helpText:
        "Practice realistic interviews with AI that simulates real hiring managers - 85% of users improve within 3 sessions",
      isRecommended: !hasCompletedInterview,
      usageCount: interviewsPending,
      successRate: "85%",
    },
    {
      title: "Ranking Tests",
      description:
        "Compete with other candidates in skill-based challenges and showcase your abilities",
      icon: Trophy,
      route: "/ranking-tests",
      stats: `${Array.isArray(rankingTestHistory) ? rankingTestHistory.length : 0} Completed`,
      gradient: "from-slate-500 to-slate-600",
      action: "Join Ranking",
      helpText:
        "Stand out by ranking in top 10% - recruiters actively seek high-performing candidates from our leaderboards",
      isCompetitive: true,
      usageCount: Array.isArray(rankingTestHistory) ? rankingTestHistory.length : 0,
      successRate: "72%",
    },
    {
      title: "Mock Interviews",
      description:
        "Practice behavioral interviews with personalized feedback and improvement suggestions",
      icon: Mic,
      route: "/mock-interview",
      stats: `${(mockInterviewStats as any)?.averageScore || 0}% Avg Score`,
      gradient: "from-indigo-500 to-indigo-600",
      action: "Practice Now",
      helpText:
        "Master behavioral questions with AI feedback - users report 40% better performance in real interviews",
      isImproving: ((mockInterviewStats as any)?.averageScore || 0) > 0,
      usageCount: (mockInterviewStats as any)?.totalSessions || 0,
      successRate: "89%",
    },
  ];

  const quickActions = [
    {
      title: "Upload Resume",
      description: "Get instant AI analysis",
      icon: Upload,
      action: () => setLocation("/profile"),
      color: "blue",
    },
    {
      title: "Apply to Jobs",
      description: "Browse and apply instantly",
      icon: Briefcase,
      action: () => setLocation("/jobs"),
      color: "green",
    },
    {
      title: "Start Interview",
      description: "Practice with AI interviewer",
      icon: PlayCircle,
      action: () => setLocation("/virtual-interview/new"),
      color: "purple",
    },
    {
      title: "Take Test",
      description: "Complete technical assessment",
      icon: PenTool,
      action: () => setLocation("/job-seeker-tests"),
      color: "orange",
    },
  ];

  const recentApplications = Array.isArray(applications) ? applications.slice(0, 3) : [];

  // Duplicate functions removed - using the ones defined earlier

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <ContextualSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/80 backdrop-blur-sm relative z-10">
            <SidebarTrigger className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1">
              <Navbar />
            </div>
          </header>
          <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 w-full overflow-x-hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 sm:space-y-6 lg:space-y-8"
        >
          {/* Enhanced Welcome Header with Progress */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Main Welcome */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <motion.h1
                  variants={slideInVariants}
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white"
                >
                  Welcome back, {userName}!
                </motion.h1>
                {isPremium && (
                  <motion.div
                    variants={bounceVariants}
                    initial="rest"
                    animate="bounce"
                  >
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </motion.div>
                )}
              </div>

              {/* User Level & Progress */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                <Badge className="bg-blue-600 text-white px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Level {userLevel}
                </Badge>
                <Badge variant="outline" className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
                  {totalPoints} XP
                </Badge>
                <Badge variant="outline" className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-orange-500" />
                  {unlockedAchievements.length} Achievements
                </Badge>
              </div>

              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Your AI-powered career journey • {totalProgress}% Complete
              </p>
            </div>

            {/* Progress Overview Card */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardContent className="p-3 sm:p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-600">
                      <Gauge className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Career Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete tasks to unlock features and earn XP
                      </p>
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
                    <span className="text-muted-foreground">
                      {completedTasksCount}/{progressTasks.length} tasks
                    </span>
                  </div>
                  <Progress value={totalProgress} className="h-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Getting Started</span>
                    <span>Career Ready</span>
                  </div>
                </div>

                {/* Quick Progress Tasks */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pr-2">
                  {progressTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      variants={slideInVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                      className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 ${
                        task.completed
                          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            task.completed
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                          }`}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Timer className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.label}</p>
                          <p className="text-xs text-muted-foreground">
                            +{task.points} XP
                          </p>
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
                      <span className="text-blue-600 dark:text-blue-400">
                        {pointsToNextLevel} XP to Level {userLevel + 1}
                      </span>
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
                <Card className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-950 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 rounded-full">
                        <Rocket className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                          🚀 Unlock Premium Features
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Get unlimited applications, AI interviews, priority
                          support & exclusive features
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
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

          {/* Clean Usage Tracker */}
          {!isPremium &&
            (dailyUsage.aiCoachQuestions >= 2 ||
              dailyUsage.jobApplications >= 7) && (
              <motion.div variants={itemVariants}>
                <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500" />
                        <div>
                          <h4 className="font-semibold">
                            You're almost at your daily limits
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {dailyUsage.aiCoachQuestions >=
                            freemiumLimits.aiCoachQuestions.free
                              ? "AI Coach limit reached"
                              : dailyUsage.jobApplications >=
                                  freemiumLimits.jobApplications.free
                                ? "Application limit reached"
                                : "Upgrade for unlimited access"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setLocation("/JobSeekerPremium")}
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        Upgrade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          {/* Smart Recommendations */}
          {smartRecommendations.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="p-3 sm:p-6 relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-blue-600">
                      <Compass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        Smart Recommendations
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Personalized next steps to boost your career
                      </p>
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
                        <Card
                          className={`h-full border-2 transition-all duration-200 hover:shadow-lg ${
                            rec.isPremiumFeature
                              ? "border-yellow-300 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950"
                              : rec.priority === "high"
                                ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950"
                                : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg bg-gradient-to-br ${
                                  rec.color === "gold"
                                    ? "from-yellow-500 to-orange-500"
                                    : rec.color === "red"
                                      ? "from-red-500 to-red-600"
                                      : rec.color === "orange"
                                        ? "from-orange-500 to-orange-600"
                                        : rec.color === "blue"
                                          ? "from-blue-500 to-blue-600"
                                          : rec.color === "green"
                                            ? "from-green-500 to-green-600"
                                            : "from-purple-500 to-purple-600"
                                }`}
                              >
                                <rec.icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm">
                                    {rec.title}
                                  </h4>
                                  {rec.isPremiumFeature && (
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-0">
                                      <Crown className="w-3 h-3 mr-1" />
                                      Premium
                                    </Badge>
                                  )}
                                  {rec.priority === "high" &&
                                    !rec.isPremiumFeature && (
                                      <Badge className="bg-red-500 text-white text-xs px-2 py-0">
                                        High Priority
                                      </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {rec.description}
                                </p>
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

          {/* Referral Marketplace Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 opacity-5" />
              <CardContent className="p-3 sm:p-6 relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                      <Handshake className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        Referral Marketplace
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Connect with employees for career advice, interview prep & referrals
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm px-3 py-1">
                    New!
                  </Badge>
                </div>

                {/* Feature Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <motion.div
                    variants={slideInVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                        <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-semibold text-sm">Career Advice</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get insights from real employees about company culture, career paths, and growth opportunities
                    </p>
                  </motion.div>

                  <motion.div
                    variants={slideInVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                        <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="font-semibold text-sm">Interview Prep</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Practice with real employees, get insider tips, and boost your interview success rate
                    </p>
                  </motion.div>

                  <motion.div
                    variants={slideInVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                        <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-semibold text-sm">Referrals</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get referred by employees and increase your chances of landing your dream job
                    </p>
                  </motion.div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center justify-center gap-8 mb-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">500+</div>
                    <div className="text-muted-foreground">Verified Employees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">85%</div>
                    <div className="text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">200+</div>
                    <div className="text-muted-foreground">Companies</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    onClick={() => setLocation("/referral-marketplace")}
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Browse Services
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
                    onClick={() => setLocation("/become-referrer")}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Become a Referrer
                  </Button>
                </div>

                {/* Success Story */}
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-green-500 text-white">
                      <Star className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        "I got 3 interviews and 1 offer in 2 weeks using the referral marketplace!"
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        - Sarah M., Software Engineer at Google
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Career Insights Paywall */}
          {!isPremium && hasAppliedToJobs && totalApplications >= 2 && (
            <motion.div variants={itemVariants}>
              <Card className="border-0 overflow-hidden relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 opacity-5" />
                <CardContent className="p-3 sm:p-6 relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        AI Career Insights
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Discover why your applications aren't converting
                      </p>
                    </div>
                  </div>

                  {/* Preview Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white dark:to-gray-800 z-10 rounded-lg"></div>
                      <div className="blur-sm">
                        <h4 className="font-semibold text-sm mb-2">
                          Application Success Rate
                        </h4>
                        <div className="text-2xl font-bold text-red-500 mb-1">
                          12%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Industry average: 35%
                        </p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <Button
                          size="sm"
                          onClick={() => setShowInsightsPaywall(true)}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Unlock
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white dark:to-gray-800 z-10 rounded-lg"></div>
                      <div className="blur-sm">
                        <h4 className="font-semibold text-sm mb-2">
                          Top Missing Skills
                        </h4>
                        <div className="space-y-1">
                          <div className="text-xs">
                            • React.js (mentioned in 80% of jobs)
                          </div>
                          <div className="text-xs">
                            • AWS (mentioned in 65% of jobs)
                          </div>
                          <div className="text-xs">
                            • TypeScript (mentioned in 55% of jobs)
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <Button
                          size="sm"
                          onClick={() => setShowInsightsPaywall(true)}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Unlock
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      🧠 Get AI-Powered Career Insights
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Understand exactly why your applications aren't converting
                      and get personalized recommendations
                    </p>
                    <Button
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-6"
                      onClick={() => setLocation("/JobSeekerPremium")}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Unlock Insights - $9/month
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
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
                        <h3 className="text-xl font-semibold">
                          Your Achievements
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {unlockedAchievements.length} of {achievements.length}{" "}
                          unlocked
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
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800"
                            : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-3 rounded-xl ${
                                achievement.unlocked
                                  ? "bg-gradient-to-br from-green-500 to-emerald-500"
                                  : "bg-gray-300 dark:bg-gray-700"
                              }`}
                            >
                              <achievement.icon
                                className={`w-6 h-6 ${
                                  achievement.unlocked
                                    ? "text-white"
                                    : "text-gray-500"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {achievement.title}
                                </h4>
                                <Badge
                                  className={`text-xs px-2 py-0 ${
                                    achievement.rarity === "legendary"
                                      ? "bg-purple-500 text-white"
                                      : achievement.rarity === "epic"
                                        ? "bg-orange-500 text-white"
                                        : achievement.rarity === "rare"
                                          ? "bg-blue-500 text-white"
                                          : "bg-gray-500 text-white"
                                  }`}
                                >
                                  {achievement.rarity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {achievement.description}
                              </p>
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
                          <p className="font-medium text-sm">
                            Next Achievement:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nextAchievement.title} -{" "}
                            {nextAchievement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>



          {/* Stats Overview */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Total Applications
                    </p>
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
                    <p className="text-green-100 text-sm font-medium">
                      Profile Score
                    </p>
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
                    <p className="text-purple-100 text-sm font-medium">
                      ATS Score
                    </p>
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
                    <p className="text-orange-100 text-sm font-medium">
                      Pending Tests
                    </p>
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
                  <p className="text-sm text-muted-foreground">
                    Jump into your career journey
                  </p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
                <Timer className="w-3 h-3 mr-1" />
                Fast Track
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                          action.color === "blue"
                            ? "from-blue-500 to-blue-600"
                            : action.color === "green"
                              ? "from-green-500 to-green-600"
                              : action.color === "purple"
                                ? "from-purple-500 to-purple-600"
                                : "from-orange-500 to-orange-600"
                        } flex items-center justify-center shadow-lg`}
                      >
                        <action.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="font-semibold mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {action.description}
                      </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Assigned Tests Card */}
            <motion.div variants={itemVariants}>
              <Card className="h-full border-0 overflow-hidden relative bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-5" />
                <CardContent className="p-3 sm:p-6 relative">
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
                    Complete technical assessments assigned by recruiters to
                    showcase your skills and advance in the hiring process
                  </p>

                  {pendingTests > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Pending Tests
                        </span>
                        <span className="text-lg font-bold text-orange-600">
                          {pendingTests}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {testAssignments
                          ?.slice(0, 2)
                          .map((test: any, index: number) => (
                            <div
                              key={index}
                              className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg"
                            >
                              <p className="text-sm font-medium">
                                {test.testType || "Technical Assessment"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {test.jobTitle || "Job Position"}
                              </p>
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
                      <p className="text-sm text-muted-foreground mb-4">
                        No assigned tests at the moment
                      </p>
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
                  <p className="text-sm text-muted-foreground">
                    Discover tools that accelerate your career
                  </p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                <Zap className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`}
                    />
                    <CardContent className="p-6 relative flex flex-col h-full">
                      {/* Feature badges */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                        >
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex gap-2 flex-wrap">
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

                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {feature.description}
                        </p>

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

                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-4 italic">
                          {feature.helpText}
                        </p>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-primary">
                            {feature.stats}
                          </span>
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
                          <div className="pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Your Progress</span>
                              <span>
                                {Math.min(feature.usageCount * 20, 100)}%
                              </span>
                            </div>
                            <Progress
                              value={Math.min(feature.usageCount * 20, 100)}
                              className="h-1"
                            />
                          </div>
                        )}
                      </div>
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
                    <CardTitle className="text-xl">
                      Recent Platform Jobs
                    </CardTitle>
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
                            {job.jobType || "Full-time"}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                          {job.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {job.companyName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">
                            {job.location || "Remote"}
                          </span>
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
                    <p className="text-muted-foreground mb-4">
                      No jobs available at the moment
                    </p>
                    <Button onClick={() => setLocation("/jobs")}>
                      Browse All Jobs
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI-Powered Tools Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resume Analysis Card */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full border-0 shadow-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-white/5 pattern-dots pattern-emerald-300 pattern-bg-transparent pattern-size-4 pattern-opacity-20"></div>
                
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Upload className="h-6 w-6" />
                    </div>
                    Resume Analysis
                  </CardTitle>
                  <p className="text-emerald-100 text-sm leading-relaxed">
                    Upload and optimize your resumes with AI-powered ATS scoring
                  </p>
                </CardHeader>
                
                <CardContent className="relative z-10 flex flex-col h-full pb-6">
                  {/* Status Bar */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-100">Resumes uploaded:</span>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 font-semibold">
                        {resumes?.length || 0}/{user?.planType === "premium" ? "∞" : "2"}
                      </Badge>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="flex-1 space-y-4">
                    {(resumes?.length || 0) < (user?.planType === "premium" ? 999 : 2) ? (
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleResumeUpload(file);
                          }}
                          className="w-full p-3 rounded-lg bg-white/15 border border-white/30 text-white placeholder:text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-white/20 file:text-white file:font-medium hover:bg-white/20 transition-colors"
                          disabled={isUploadingResume}
                        />
                        {isUploadingResume && (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-3 border-white/30 border-t-white mx-auto"></div>
                            <p className="text-sm mt-2 text-emerald-100 font-medium">
                              Analyzing resume...
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-white/10 rounded-lg">
                        <Crown className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
                        <p className="text-sm text-emerald-100 mb-3 font-medium">
                          {user?.planType === "premium" ? "Unlimited uploads available" : "Upload limit reached"}
                        </p>
                        {user?.planType !== "premium" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 text-white border-0 font-medium"
                            onClick={() => setLocation("/job-seeker-premium")}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Upgrade for Unlimited
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Latest Analysis */}
                    {Array.isArray(resumes) && resumes.length > 0 && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-200" />
                            <span className="text-sm font-medium truncate">
                              {resumes[0]?.name || "Resume"}
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs font-semibold ${
                              (resumes[0]?.atsScore || 0) >= 80
                                ? "bg-green-100 text-green-800"
                                : (resumes[0]?.atsScore || 0) >= 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            ATS: {resumes[0]?.atsScore || "N/A"}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="text-center p-2 bg-white/10 rounded">
                            <div className="font-bold text-lg text-emerald-200">
                              {Array.isArray(resumes[0]?.analysis?.content?.strengthsFound) ? resumes[0].analysis.content.strengthsFound.length : 0}
                            </div>
                            <div className="text-emerald-100">Strengths</div>
                          </div>
                          <div className="text-center p-2 bg-white/10 rounded">
                            <div className="font-bold text-lg text-orange-200">
                              {Array.isArray(resumes[0]?.analysis?.recommendations) ? resumes[0].analysis.recommendations.length : 0}
                            </div>
                            <div className="text-orange-100">Tips</div>
                          </div>
                          <div className="text-center p-2 bg-white/10 rounded">
                            <div className="font-bold text-lg text-red-200">
                              {Array.isArray(resumes[0]?.analysis?.keywordOptimization?.missingKeywords) ? resumes[0].analysis.keywordOptimization.missingKeywords.length : 0}
                            </div>
                            <div className="text-red-100">Missing</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="secondary"
                    className="w-full mt-4 bg-white/15 hover:bg-white/25 text-white border-0 font-medium h-11"
                    onClick={() => setLocation("/resumes")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Analysis
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cover Letter Generator Card */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full border-0 shadow-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-white/5 pattern-dots pattern-indigo-300 pattern-bg-transparent pattern-size-4 pattern-opacity-20"></div>
                
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <PenTool className="h-6 w-6" />
                    </div>
                    Cover Letter Generator
                  </CardTitle>
                  <p className="text-indigo-100 text-sm leading-relaxed">
                    Generate personalized cover letters with AI
                  </p>
                </CardHeader>
                
                <CardContent className="relative z-10 flex flex-col h-full pb-6">
                  {/* Input Section */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Company name..."
                        className="bg-white/15 border-white/30 text-white placeholder:text-white/70 h-11"
                        id="company-name-input"
                        data-testid="input-company-name"
                      />
                      <Input
                        placeholder="Job title..."
                        className="bg-white/15 border-white/30 text-white placeholder:text-white/70 h-11"
                        id="job-title-input"
                        data-testid="input-job-title"
                      />
                    </div>
                    
                    <textarea
                      placeholder="Paste the job description here..."
                      className="w-full p-3 rounded-lg bg-white/15 border border-white/30 text-white placeholder:text-white/70 min-h-[120px] resize-none font-sans"
                      id="job-description-input"
                      data-testid="textarea-job-description"
                    />

                    {/* Generated Cover Letter Display */}
                    {coverLetterResult && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle className="h-4 w-4 text-green-300" />
                          Generated Cover Letter:
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <pre className="text-xs text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                            {coverLetterResult}
                          </pre>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full bg-white/15 hover:bg-white/25 text-white border-0 font-medium"
                          onClick={() => {
                            navigator.clipboard.writeText(coverLetterResult);
                            toast({
                              title: "Copied to Clipboard",
                              description: "Cover letter copied successfully",
                            });
                          }}
                          data-testid="button-copy-cover-letter"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <Button
                    variant="secondary"
                    className="w-full mt-4 bg-white/15 hover:bg-white/25 text-white border-0 font-medium h-11"
                    onClick={() => {
                      const jobDesc = (document.getElementById("job-description-input") as HTMLTextAreaElement)?.value;
                      const companyName = (document.getElementById("company-name-input") as HTMLInputElement)?.value || "The Company";
                      const jobTitle = (document.getElementById("job-title-input") as HTMLInputElement)?.value || "The Position";

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
                    data-testid="button-generate-cover-letter"
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
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Clean Premium CTA */}
          {!isPremium && totalApplications >= 1 && (
            <motion.div variants={itemVariants}>
              <Card className="border-0 overflow-hidden relative bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl">
                <CardContent className="p-6 text-white text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Crown className="w-6 h-6 text-yellow-300" />
                    <h3 className="text-xl font-bold">
                      Ready to Land Your Dream Job?
                    </h3>
                  </div>

                  <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Join 10,000+ successful job seekers. Get unlimited
                    applications, AI insights, and 3x better results.
                  </p>

                  <div className="flex items-center justify-center gap-8 mb-6 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold">3x</div>
                      <div className="text-blue-200">Better Results</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">∞</div>
                      <div className="text-blue-200">Applications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-blue-200">AI Support</div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-3 shadow-lg"
                    onClick={() => setLocation("/JobSeekerPremium")}
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Premium
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-xs text-blue-200 mt-2">
                    7-day free trial • Cancel anytime
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Exit-Intent Premium Modal */}
          <AnimatePresence>
            {false && showExitModal && !isPremium && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowExitModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-md w-full shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center">
                    <div className="p-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 w-fit mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      Wait! Don't Miss Out
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      You're about to leave without unlocking your career
                      potential. Get 60% off premium features now!
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Unlimited AI coach questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Unlimited job applications</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Advanced career insights</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3"
                        onClick={() => {
                          setShowExitModal(false);
                          setLocation("/JobSeekerPremium");
                        }}
                      >
                        <Crown className="w-5 h-5 mr-2" />
                        Get 60% Off - Limited Time
                        <Timer className="w-5 h-5 ml-2" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowExitModal(false)}
                      >
                        Maybe later
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Insights Paywall Modal */}
          <AnimatePresence>
            {showInsightsPaywall && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowInsightsPaywall(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-lg w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 w-fit mx-auto mb-4">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      Unlock AI Career Insights
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Get personalized insights on why your applications aren't
                      converting and what to improve.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="font-semibold">
                          Success Rate Analysis
                        </div>
                        <div className="text-muted-foreground">
                          Compare vs industry
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="font-semibold">Skill Gap Analysis</div>
                        <div className="text-muted-foreground">
                          Missing keywords
                        </div>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                        <div className="font-semibold">Market Insights</div>
                        <div className="text-muted-foreground">
                          Salary & trends
                        </div>
                      </div>
                      <div className="p-3 bg-violet-50 dark:bg-violet-950 rounded-lg">
                        <div className="font-semibold">Action Plan</div>
                        <div className="text-muted-foreground">
                          Step-by-step guide
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3"
                        onClick={() => {
                          setShowInsightsPaywall(false);
                          setLocation("/JobSeekerPremium");
                        }}
                      >
                        <Crown className="w-5 h-5 mr-2" />
                        Upgrade to Premium - $9/month
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowInsightsPaywall(false)}
                      >
                        Not now
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
