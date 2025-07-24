import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TrendingDown
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

export default function EnhancedDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

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

  const userName = user?.firstName || user?.name || "Job Seeker";
  const isPremium = user?.planType === 'premium';
  const profileCompletion = profile?.profileCompletion || 0;
  const resumeScore = resumes?.[0]?.atsScore || 0;
  const totalApplications = applications?.length || 0;
  const pendingTests = testAssignments?.length || 0;
  const interviewsPending = mockInterviewStats?.totalSessions || 0;

  // Feature cards data
  const featureCards = [
    {
      title: "AI Resume Analysis",
      description: "Get instant ATS compatibility scores",
      icon: Brain,
      route: "/profile",
      premium: false,
      stats: `${resumeScore}% ATS Score`,
      gradient: "from-blue-500 to-cyan-500",
      action: "Analyze Resume"
    },
    {
      title: "Smart Job Matching",
      description: "Find perfect jobs with AI matching",
      icon: Target,
      route: "/jobs",
      premium: false,
      stats: `${jobPostings?.length || 0} Jobs Available`,
      gradient: "from-purple-500 to-pink-500",
      action: "Browse Jobs"
    },
    {
      title: "Virtual Interviews",
      description: "Practice with AI-powered interviews",
      icon: Video,
      route: "/virtual-interview/new",
      premium: true,
      stats: `${interviewsPending} Completed`,
      gradient: "from-green-500 to-emerald-500",
      action: "Start Interview"
    },
    {
      title: "Coding Tests",
      description: "Take technical assessments",
      icon: Code,
      route: "/job-seeker-tests",
      premium: false,
      stats: `${pendingTests} Pending`,
      gradient: "from-orange-500 to-red-500",
      action: "Take Test"
    },
    {
      title: "Ranking Tests",
      description: "Compete with other candidates",
      icon: Trophy,
      route: "/ranking-tests",
      premium: true,
      stats: `${rankingTestHistory?.length || 0} Completed`,
      gradient: "from-yellow-500 to-orange-500",
      action: "Join Ranking"
    },
    {
      title: "Mock Interviews",
      description: "Practice behavioral interviews",
      icon: Mic,
      route: "/mock-interview",
      premium: true,
      stats: `${mockInterviewStats?.averageScore || 0}% Avg Score`,
      gradient: "from-indigo-500 to-purple-500",
      action: "Practice Now"
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
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome back, {userName}!
              </h1>
              {isPremium && <Crown className="w-8 h-8 text-yellow-500 animate-pulse" />}
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered job search command center
            </p>
            
            {!isPremium && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto max-w-md"
              >
                <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500 rounded-full">
                        <Rocket className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                          Unlock Premium Features
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          Get unlimited applications, AI interviews & more
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={() => setLocation("/job-seeker-premium")}
                      >
                        Upgrade
                        <Sparkles className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
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

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              Quick Actions
            </h2>
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
                  <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all duration-200">
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-${action.color}-100 dark:bg-${action.color}-900 flex items-center justify-center`}>
                        <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                      </div>
                      <h3 className="font-semibold mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Platform Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCards.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className="cursor-pointer"
                  onClick={() => setLocation(feature.route)}
                >
                  <Card className="h-full border-0 overflow-hidden relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`} />
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient}`}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        {feature.premium && !isPremium && (
                          <Badge className="bg-yellow-500 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">{feature.stats}</span>
                        <Button 
                          size="sm" 
                          variant={feature.premium && !isPremium ? "outline" : "default"}
                          className="group"
                        >
                          {feature.action}
                          <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity & Applications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Applications */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Recent Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentApplications.length > 0 ? (
                    <div className="space-y-4">
                      {recentApplications.map((app: any) => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building className="w-8 h-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{app.jobTitle}</p>
                              <p className="text-sm text-muted-foreground">{app.companyName}</p>
                            </div>
                          </div>
                          <Badge variant={app.status === 'applied' ? 'default' : 'secondary'}>
                            {app.status}
                          </Badge>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => setLocation("/applications")}
                      >
                        View All Applications
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No applications yet</p>
                      <Button onClick={() => setLocation("/jobs")}>
                        Browse Jobs
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Progress & Achievements */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-500" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Profile Completion</span>
                      <span className="text-sm text-muted-foreground">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Resume ATS Score</span>
                      <span className="text-sm text-muted-foreground">{resumeScore}%</span>
                    </div>
                    <Progress value={resumeScore} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Achievements</h4>
                    {profileCompletion > 80 && (
                      <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm">Profile 80% Complete</span>
                      </div>
                    )}
                    {resumeScore > 70 && (
                      <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">High ATS Score Achieved</span>
                      </div>
                    )}
                    {totalApplications >= 5 && (
                      <div className="flex items-center gap-3 p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                        <span className="text-sm">5+ Applications Submitted</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Premium CTA (if not premium) */}
          {!isPremium && (
            <motion.div variants={itemVariants}>
              <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 dark:from-yellow-950 dark:via-orange-950 dark:to-pink-950">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      Unlock Your Full Potential
                    </h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Join thousands of successful job seekers who landed their dream jobs with our premium features.
                    Get unlimited applications, AI interviews, and priority support.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                        <Flame className="w-6 h-6 text-yellow-600" />
                      </div>
                      <h4 className="font-semibold">Unlimited Applications</h4>
                      <p className="text-sm text-muted-foreground">Apply to as many jobs as you want</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Video className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold">AI Virtual Interviews</h4>
                      <p className="text-sm text-muted-foreground">Practice with advanced AI interviewer</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold">Priority Rankings</h4>
                      <p className="text-sm text-muted-foreground">Get featured in ranking tests</p>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8"
                    onClick={() => setLocation("/job-seeker-premium")}
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Premium
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}