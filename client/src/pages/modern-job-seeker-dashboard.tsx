import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  FileText, 
  Upload, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  Clock, 
  Target,
  Briefcase,
  Crown,
  Eye,
  Calendar,
  DollarSign,
  Users,
  ArrowRight,
  Activity,
  BarChart3,
  MessageCircle,
  Code,
  Brain,
  Trophy,
  PlayCircle,
  Award,
  Mic,
  PenTool,
  Zap,
  Plus,
  User
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

export default function ModernJobSeekerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  // Data queries with proper typing
  const { data: stats } = useQuery<{
    totalApplications: number;
    interviews: number;
    offers: number;
    rejections: number;
  }>({
    queryKey: ["/api/applications/stats"],
    retry: false,
  });

  const { data: applications } = useQuery<any[]>({
    queryKey: ["/api/applications"],
    retry: false,
  });

  const { data: resumes } = useQuery<any[]>({
    queryKey: ["/api/resumes"],
    retry: false,
  });

  const { data: profile } = useQuery<{
    fullName?: string;
    phone?: string;
    location?: string;
    professionalTitle?: string;
    summary?: string;
  }>({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const { data: jobs } = useQuery<any[]>({
    queryKey: ["/api/jobs/postings"],
    retry: false,
  });

  const { data: mockInterviewStats } = useQuery<{
    averageScore: number;
    totalSessions: number;
  }>({
    queryKey: ["/api/mock-interview/stats"],
    retry: false,
  });

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    const fields: (keyof typeof profile)[] = ['fullName', 'phone', 'location', 'professionalTitle', 'summary'];
    const completed = fields.filter(field => profile[field]).length;
    return Math.round((completed / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  // Get recent applications
  const recentApplications = (applications || []).slice(0, 3);

  // Main feature cards
  const featureCards = [
    {
      title: "Job Applications",
      description: "Track your applications and get insights",
      icon: Briefcase,
      route: "/applications",
      stats: `${stats?.totalApplications || 0} Total`,
      color: "blue",
      action: "View Applications"
    },
    {
      title: "Find Jobs",
      description: "Discover perfect job matches with AI",
      icon: Target,
      route: "/jobs",
      stats: `${(jobs || []).length} Available`,
      color: "green",
      action: "Browse Jobs"
    },
    {
      title: "AI Career Assistant",
      description: "Get personalized career guidance",
      icon: Brain,
      route: "/career-ai-assistant",
      stats: "AI Powered",
      color: "purple",
      action: "Start Analysis"
    },
    {
      title: "Skill Tests",
      description: "Prove your skills with coding challenges",
      icon: Code,
      route: "/job-seeker-tests",
      stats: "Technical",
      color: "orange",
      action: "Take Test"
    },
    {
      title: "Mock Interviews",
      description: "Practice with AI interviewer",
      icon: Mic,
      route: "/mock-interview",
      stats: `${mockInterviewStats?.averageScore || 0}% Avg`,
      color: "indigo",
      action: "Practice Now"
    },
    {
      title: "Ranking Tests",
      description: "Compete with other candidates",
      icon: Trophy,
      route: "/ranking-tests",
      stats: "Leaderboard",
      color: "yellow",
      action: "Join Ranking"
    }
  ];

  // Quick action buttons
  const quickActions = [
    {
      title: "Upload Resume",
      icon: Upload,
      action: () => setLocation("/profile"),
      color: "blue"
    },
    {
      title: "Apply Now",
      icon: Briefcase,
      action: () => setLocation("/jobs"),
      color: "green"
    },
    {
      title: "Start Interview",
      icon: PlayCircle,
      action: () => setLocation("/virtual-interview/new"),
      color: "purple"
    },
    {
      title: "Messages",
      icon: MessageCircle,
      action: () => setLocation("/chat"),
      color: "pink"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      green: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      orange: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
      indigo: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
      yellow: "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700",
      pink: "from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.firstName || 'Job Seeker'}!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Let's accelerate your career journey
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Applications</p>
                      <p className="text-3xl font-bold">{stats?.totalApplications || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Interviews</p>
                      <p className="text-3xl font-bold">{stats?.interviews || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Profile Score</p>
                      <p className="text-3xl font-bold">{profileCompletion}%</p>
                    </div>
                    <Star className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Open Jobs</p>
                      <p className="text-3xl font-bold">{(jobs || []).length}</p>
                    </div>
                    <Briefcase className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r ${getColorClasses(action.color)} text-white border-0 hover:shadow-lg transition-all duration-200`}
                      onClick={action.action}
                      data-testid={`quick-action-${action.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <action.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{action.title}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Features Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCards.map((feature, index) => (
                <Card 
                  key={index} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => setLocation(feature.route)}
                  data-testid={`feature-card-${feature.title.toLowerCase().replace(' ', '-')}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${getColorClasses(feature.color)}`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary">{feature.stats}</Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {feature.description}
                    </p>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
                    >
                      {feature.action}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Applications */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Recent Applications
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLocation("/applications")}
                    data-testid="view-all-applications"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentApplications.length > 0 ? (
                    <div className="space-y-4">
                      {recentApplications.map((app: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {app.jobTitle}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {app.companyName}
                            </p>
                          </div>
                          <Badge variant={app.status === 'pending' ? 'secondary' : 'default'}>
                            {app.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No applications yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-2" 
                        onClick={() => setLocation("/jobs")}
                        data-testid="start-applying"
                      >
                        Start Applying
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Profile Completion */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Profile Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Profile Progress</span>
                      <span className="text-sm text-gray-500">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                    
                    <div className="space-y-2">
                      {(resumes || []).length > 0 ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Resume uploaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Upload your resume</span>
                        </div>
                      )}
                      
                      {profile?.summary ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Professional summary added</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Add professional summary</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/profile")}
                      data-testid="complete-profile"
                    >
                      Complete Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}