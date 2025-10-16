import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navbar";
import { ContextualSidebar } from "@/components/contextual-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  FileText,
  TrendingUp,
  CheckCircle,
  Briefcase,
  Zap,
  Brain,
  Video,
  Target,
  ArrowRight,
  Sparkles,
  Search,
  Users,
  Clock,
  Flame,
  Crown,
  Play,
  ChevronRight,
  Upload,
  Star,
  Trophy,
  Rocket,
  Handshake,
  BookOpen,
  Send
} from "lucide-react";

export default function EnhancedDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [dailyStreak, setDailyStreak] = useState(0);

  const { data: stats } = useQuery({
    queryKey: ["/api/applications/stats"],
    retry: false,
  });

  const { data: applications } = useQuery({
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🔒 [ENHANCED_DASHBOARD] Not authenticated, redirecting to /auth');
      sessionStorage.clear(); // Clear any stale session data
      window.location.href = "/auth?reason=session_required";
    }
  }, [isAuthenticated, isLoading]);

  // Calculate daily streak
  useEffect(() => {
    if (!user) return;
    const streakKey = `streak_${user.id}`;
    const lastVisitKey = `lastVisit_${user.id}`;
    const storedStreak = parseInt(localStorage.getItem(streakKey) || '0');
    const storedLastVisit = localStorage.getItem(lastVisitKey);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (storedLastVisit === yesterday) {
      const newStreak = storedStreak + 1;
      setDailyStreak(newStreak);
      localStorage.setItem(streakKey, newStreak.toString());
      
      if (newStreak === 7) {
        toast({
          title: "🔥 7-Day Streak!",
          description: "You're on fire! Keep it up!",
        });
      }
    } else if (storedLastVisit !== today) {
      setDailyStreak(1);
      localStorage.setItem(streakKey, '1');
    } else {
      setDailyStreak(storedStreak);
    }

    localStorage.setItem(lastVisitKey, today);
  }, [user, toast]);

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

  const userName = user?.firstName || user?.name || "Job Seeker";
  const isPremium = user?.planType === "premium";
  const profileCompletion = (profile as any)?.profileCompletion || 0;
  const resumeScore = Array.isArray(resumes) && resumes.length > 0 ? resumes[0]?.atsScore || 0 : 0;
  const totalApplications = Array.isArray(applications) ? applications.length : 0;
  const hasResume = Array.isArray(resumes) && resumes.length > 0;
  const recentApplications = Array.isArray(applications) ? applications.slice(0, 5) : [];

  // Quick action cards - Daily use features
  const quickActions = [
    {
      title: "Generate Cover Letter",
      description: "Create AI-powered cover letters in seconds",
      icon: Brain,
      color: "from-purple-500 to-pink-600",
      route: "/cover-letter-generator",
      badge: "Most Used"
    },
    {
      title: "Analyze Resume",
      description: `${hasResume ? `Current ATS: ${resumeScore}%` : 'Upload & get ATS score'}`,
      icon: Target,
      color: "from-green-500 to-teal-600",
      route: "/resumes",
      badge: hasResume ? (resumeScore >= 70 ? "✓ Good" : "Needs Work") : "Start Here"
    },
    {
      title: "Search Jobs",
      description: "AI-matched jobs from 100+ boards",
      icon: Search,
      color: "from-blue-500 to-indigo-600",
      route: "/jobs",
      badge: "New Jobs Daily"
    },
    {
      title: "Video Interview",
      description: "Practice with AI interviewer",
      icon: Video,
      color: "from-orange-500 to-red-600",
      route: "/virtual-interview/new",
      badge: "Trending"
    },
    {
      title: "Get Referred",
      description: "10K+ employees ready to refer you",
      icon: Handshake,
      color: "from-blue-600 to-purple-600",
      route: "/referral-marketplace",
      badge: "300% Higher Rate"
    },
    {
      title: "One-Click Apply",
      description: "Install Chrome extension",
      icon: Zap,
      color: "from-yellow-500 to-orange-600",
      route: "/extension",
      badge: "Time Saver"
    }
  ];

  // Daily challenges for gamification
  const dailyChallenges = [
    {
      id: 'apply',
      title: '🎯 Apply to 3 Jobs',
      progress: Math.min(totalApplications, 3),
      total: 3,
      reward: '+50 XP',
      action: () => setLocation('/jobs')
    },
    {
      id: 'resume',
      title: '📄 Improve Resume',
      progress: hasResume && resumeScore >= 70 ? 1 : 0,
      total: 1,
      reward: '+30 XP',
      action: () => setLocation('/resumes')
    },
    {
      id: 'profile',
      title: '✨ Complete Profile',
      progress: profileCompletion >= 80 ? 1 : 0,
      total: 1,
      reward: '+25 XP',
      action: () => setLocation('/profile')
    }
  ];

  const completedChallenges = dailyChallenges.filter(c => c.progress >= c.total).length;

  // Daily habit tracking with localStorage persistence
  const [dailyChecklist, setDailyChecklist] = useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('dailyChecklist');
    const savedData = saved ? JSON.parse(saved) : null;
    
    // Reset checklist if it's a new day
    if (savedData && savedData.date === today) {
      return savedData.checklist;
    }
    
    return {
      resumeReviewed: false,
      threeApplications: false,
      networked: false,
      skillLearned: false
    };
  });

  // Save to localStorage whenever checklist changes
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('dailyChecklist', JSON.stringify({
      date: today,
      checklist: dailyChecklist
    }));
  }, [dailyChecklist]);

  return (
    <>
      <Navbar />
      <SidebarProvider>
        <ContextualSidebar />
        <SidebarInset>
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard</h2>
            </div>
          </div>

        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Welcome Header with Streak */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between flex-wrap gap-4"
            >
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Welcome back, {userName}! 👋
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Let's land that dream job today
                </p>
              </div>
              <div className="flex items-center gap-4">
                {dailyStreak > 0 && (
                  <Badge className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <Flame className="w-4 h-4 mr-2" />
                    {dailyStreak} Day Streak
                  </Badge>
                )}
                {!isPremium && (
                  <Button 
                    onClick={() => setLocation('/subscription')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    data-testid="button-upgrade-premium"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Daily Career Checklist */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-2 border-purple-100 dark:border-purple-900 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-purple-500" />
                      Daily Career Habits
                    </span>
                    <Badge variant="outline">
                      {Object.values(dailyChecklist).filter(Boolean).length}/4 Complete
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: 'resumeReviewed', label: 'Review & update resume', icon: FileText },
                    { key: 'threeApplications', label: 'Apply to 3+ jobs', icon: Send },
                    { key: 'networked', label: 'Connect with 2 professionals', icon: Users },
                    { key: 'skillLearned', label: 'Learn something new (15 min)', icon: BookOpen }
                  ].map(({ key, label, icon: Icon }) => (
                    <div 
                      key={key}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      onClick={() => setDailyChecklist(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    >
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        dailyChecklist[key as keyof typeof dailyChecklist] 
                          ? 'bg-purple-500 border-purple-500' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {dailyChecklist[key as keyof typeof dailyChecklist] && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className={dailyChecklist[key as keyof typeof dailyChecklist] ? 'line-through text-slate-500' : ''}>
                        {label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Daily Challenges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-blue-100 dark:border-blue-900 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                      Daily Challenges ({completedChallenges}/{dailyChallenges.length})
                    </CardTitle>
                    <Badge variant="outline">{completedChallenges === dailyChallenges.length ? '✅ Complete!' : 'In Progress'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dailyChallenges.map((challenge) => (
                    <div key={challenge.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" onClick={challenge.action}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{challenge.title}</span>
                          <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">{challenge.reward}</Badge>
                        </div>
                        <Progress value={(challenge.progress / challenge.total) * 100} className="h-2" />
                      </div>
                      <div className="text-sm text-slate-500">
                        {challenge.progress}/{challenge.total}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900"
                      onClick={() => setLocation(action.route)}
                      data-testid={`card-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center`}>
                            <action.icon className="w-6 h-6 text-white" />
                          </div>
                          <Badge className="text-xs">{action.badge}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">{action.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{action.description}</p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                          Start Now
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Active Applications */}
            {recentApplications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                        Recent Applications ({totalApplications})
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setLocation('/applications')} data-testid="button-view-all-applications">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentApplications.map((app: any) => {
                      // Extract real data from application object - enhanced extraction
                      const jobTitle = app.jobTitle || 
                                      app.jobPostingTitle || 
                                      app.job?.title || 
                                      app.title ||
                                      'Position Not Specified';
                      
                      const company = app.companyName || 
                                     app.company || 
                                     app.jobPostingCompany || 
                                     app.job?.company ||
                                     app.job?.companyName ||
                                     'Company Not Specified';
                      
                      const appliedDate = app.appliedAt || 
                                         app.appliedDate || 
                                         app.createdAt ||
                                         app.dateApplied;
                      
                      const status = app.status || 'applied';
                      
                      // Debug log to see what data we're getting
                      console.log('[DASHBOARD] Application data:', {
                        id: app.id,
                        jobTitle,
                        company,
                        appliedDate,
                        status,
                        rawApp: app
                      });
                      
                      return (
                        <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => setLocation('/applications')}>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-white">{jobTitle}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{company}</p>
                            {appliedDate && (
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                Applied {new Date(appliedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Badge 
                            className={
                              status === 'applied' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                              status === 'reviewing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                              status === 'interviewing' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                              status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                            }
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase className="w-8 h-8 opacity-80" />
                      <Badge className="bg-white/20 text-white border-0">Total</Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">{totalApplications}</div>
                    <div className="text-sm opacity-90">Applications</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-8 h-8 opacity-80" />
                      <Badge className="bg-white/20 text-white border-0">ATS</Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">{resumeScore}%</div>
                    <div className="text-sm opacity-90">Resume Score</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-8 h-8 opacity-80" />
                      <Badge className="bg-white/20 text-white border-0">Profile</Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">{profileCompletion}%</div>
                    <div className="text-sm opacity-90">Completed</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Flame className="w-8 h-8 opacity-80" />
                      <Badge className="bg-white/20 text-white border-0">Streak</Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">{dailyStreak}</div>
                    <div className="text-sm opacity-90">Days Active</div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Premium Upsell for Free Users */}
            {!isPremium && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-2 border-yellow-300 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upgrade to Premium</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Unlimited AI tools, priority referrals, and advanced insights - Just $10/month</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setLocation('/subscription')}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                        data-testid="button-premium-upsell"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recommended Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                    Recommended for You
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!hasResume && (
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-red-600" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Upload Your Resume</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Get instant ATS score and optimization tips</p>
                        </div>
                      </div>
                      <Button onClick={() => setLocation('/resumes')} data-testid="button-upload-resume">
                        Upload Now
                      </Button>
                    </div>
                  )}
                  {hasResume && resumeScore < 70 && (
                    <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Improve Resume Score</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Current: {resumeScore}% - Let's get to 70%+</p>
                        </div>
                      </div>
                      <Button onClick={() => setLocation('/resumes')} data-testid="button-improve-resume">
                        Optimize
                      </Button>
                    </div>
                  )}
                  {totalApplications === 0 && hasResume && (
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Rocket className="w-5 h-5 text-green-600" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">Start Applying to Jobs</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Your resume is ready! Time to apply</p>
                        </div>
                      </div>
                      <Button onClick={() => setLocation('/jobs')} data-testid="button-start-applying">
                        Browse Jobs
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">Practice Video Interviews</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Boost your confidence with AI feedback</p>
                      </div>
                    </div>
                    <Button onClick={() => setLocation('/virtual-interview/new')} data-testid="button-practice-interview">
                      <Play className="w-4 h-4 mr-2" />
                      Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}
