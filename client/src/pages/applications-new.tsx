import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  Zap,
  Crown,
  Lock,
  Sparkles,
  ArrowRight,
  Send,
  Eye,
  Users,
  Award,
  BarChart3,
  AlertCircle,
  FileText,
  MessageSquare,
  Filter,
  ChevronDown,
  ExternalLink,
  Star,
  TrendingDown,
  RefreshCw,
  Settings,
  Download,
  Brain,
  Lightbulb,
  CheckSquare,
  XCircle
} from "lucide-react";

// Premium Feature Gate Component
const PremiumFeature = ({ 
  children, 
  requiresPremium = true,
  featureName = "feature"
}: { 
  children: React.ReactNode; 
  requiresPremium?: boolean;
  featureName?: string;
}) => {
  const { user } = useAuth();
  const isPremium = user?.planType === "premium" || user?.subscriptionStatus === "active";

  if (requiresPremium && !isPremium) {
    return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent rounded-lg">
          <div className="text-center px-4">
            <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm mb-2">Premium Feature</p>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold"
              onClick={() => window.location.href = '/subscription'}
              data-testid="button-upgrade-premium"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function ApplicationsNew() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const isPremium = user?.planType === "premium" || user?.subscriptionStatus === "active";

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, authLoading]);

  // Fetch applications
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: isAuthenticated,
  });

  // Calculate analytics
  const analytics = {
    total: applications.length,
    thisWeek: applications.filter((app: any) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(app.appliedDate || app.createdAt) >= weekAgo;
    }).length,
    needFollowUp: applications.filter((app: any) => {
      const daysSince = Math.floor(
        (Date.now() - new Date(app.appliedDate || app.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince >= 7 && daysSince <= 14 && app.status === 'applied' && !app.lastContactedAt;
    }).length,
    interviews: applications.filter((app: any) => app.status === 'interview').length,
    offers: applications.filter((app: any) => app.status === 'offered').length,
    responseRate: applications.length > 0 
      ? Math.round((applications.filter((app: any) => app.status !== 'applied').length / applications.length) * 100)
      : 0,
    avgResponseTime: 5.2, // Mock for now, can calculate from actual data
  };

  // Get today's priority actions (AI-powered for premium)
  const todayActions = [
    ...(applications
      .filter((app: any) => {
        const daysSince = Math.floor(
          (Date.now() - new Date(app.appliedDate || app.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince === 7 && app.status === 'applied';
      })
      .slice(0, 3)
      .map((app: any) => ({
        type: 'followup',
        priority: 'high',
        title: `Follow up: ${app.company}`,
        description: `7 days since application. Send follow-up email.`,
        applicationId: app.id,
        company: app.company,
        jobTitle: app.jobTitle,
      }))),
    ...(applications
      .filter((app: any) => app.status === 'interview')
      .slice(0, 2)
      .map((app: any) => ({
        type: 'prep',
        priority: 'urgent',
        title: `Prep for ${app.company} interview`,
        description: `Review job description and practice questions.`,
        applicationId: app.id,
        company: app.company,
        jobTitle: app.jobTitle,
      }))),
  ].slice(0, 5);

  // Loading state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Your Interview Journey
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track applications. Get interviews. Land your dream job.
              </p>
            </div>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              onClick={() => window.location.href = '/jobs'}
              data-testid="button-find-jobs"
            >
              <Plus className="w-4 h-4 mr-2" />
              Find Jobs
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.total}</p>
                  <p className="text-xs text-green-600 mt-1">+{analytics.thisWeek} this week</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Need Follow-up</p>
                  <p className="text-3xl font-bold text-orange-600">{analytics.needFollowUp}</p>
                  <p className="text-xs text-orange-600 mt-1">Take action today</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interviews</p>
                  <p className="text-3xl font-bold text-purple-600">{analytics.interviews}</p>
                  <p className="text-xs text-purple-600 mt-1">Keep crushing it! 🎯</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Response Rate</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.responseRate}%</p>
                  <p className="text-xs text-green-600 mt-1">Industry avg: 15%</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Action Plan - PREMIUM */}
            <PremiumFeature requiresPremium={true} featureName="Daily Action Plan">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 shadow-xl text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Target className="w-5 h-5" />
                      Today's Priority Actions
                      <Badge className="ml-auto bg-yellow-400 text-black">
                        <Crown className="w-3 h-3 mr-1" />
                        AI-Powered
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-indigo-100">
                      {todayActions.length} actions to move closer to your next interview
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {todayActions.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-white/80" />
                        <p className="text-white/90">You're all caught up! 🎉</p>
                        <p className="text-indigo-200 text-sm mt-1">Check back tomorrow for new actions</p>
                      </div>
                    ) : (
                      todayActions.map((action, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer"
                          data-testid={`action-${action.type}-${index}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              action.priority === 'urgent' ? 'bg-red-500' : 
                              action.priority === 'high' ? 'bg-orange-500' : 
                              'bg-blue-500'
                            }`}>
                              {action.type === 'followup' ? <Mail className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{action.title}</h4>
                                <Badge variant="outline" className="text-xs border-white/30 text-white">
                                  {action.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-indigo-100 mb-2">{action.description}</p>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-white text-indigo-600 hover:bg-white/90"
                                  data-testid={`button-take-action-${index}`}
                                >
                                  {action.type === 'followup' ? 'Send Email' : 'Start Prep'}
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-white/30 text-white hover:bg-white/10"
                                >
                                  Later
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </PremiumFeature>

            {/* Applications List */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Applications</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                        data-testid="input-search"
                      />
                    </div>
                    <Button variant="outline" size="icon" data-testid="button-filter">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Tabs defaultValue="all" className="mt-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all" data-testid="tab-all">
                      All ({applications.length})
                    </TabsTrigger>
                    <TabsTrigger value="applied" data-testid="tab-applied">
                      Applied ({applications.filter((a: any) => a.status === 'applied').length})
                    </TabsTrigger>
                    <TabsTrigger value="followup" data-testid="tab-followup">
                      Follow-up ({analytics.needFollowUp})
                    </TabsTrigger>
                    <TabsTrigger value="interview" data-testid="tab-interview">
                      Interviews ({analytics.interviews})
                    </TabsTrigger>
                    <TabsTrigger value="offer" data-testid="tab-offer">
                      Offers ({analytics.offers})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {appsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No applications yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Start applying to jobs and track your journey to success
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600"
                      onClick={() => window.location.href = '/jobs'}
                      data-testid="button-browse-jobs"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications
                      .filter((app: any) => 
                        !searchTerm || 
                        app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        app.company?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((app: any, index: number) => {
                        const daysSince = Math.floor(
                          (Date.now() - new Date(app.appliedDate || app.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const needsFollowUp = daysSince >= 7 && daysSince <= 14 && app.status === 'applied';

                        return (
                          <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
                              needsFollowUp 
                                ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10' 
                                : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
                            }`}
                            onClick={() => setSelectedApplication(app)}
                            data-testid={`application-card-${app.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {app.jobTitle}
                                  </h3>
                                  {needsFollowUp && (
                                    <Badge variant="outline" className="border-orange-500 text-orange-600">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Follow-up
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {app.company} • {app.location || 'Remote'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {daysSince}d ago
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {app.status?.replace('_', ' ')}
                                    </Badge>
                                  </span>
                                  {app.source && (
                                    <span className="text-gray-400">via {app.source}</span>
                                  )}
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open quick actions menu
                                }}
                                data-testid={`button-actions-${app.id}`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Quick Actions - Show on hover */}
                            <div className="flex gap-2 mt-3 opacity-0 hover:opacity-100 transition-opacity">
                              {needsFollowUp && (
                                <Button size="sm" variant="outline" className="text-xs">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Send Follow-up
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="text-xs">
                                <Linkedin className="w-3 h-3 mr-1" />
                                Find Contact
                              </Button>
                              {isPremium && (
                                <>
                                  <Button size="sm" variant="outline" className="text-xs">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Cover Letter
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-xs">
                                    <Brain className="w-3 h-3 mr-1" />
                                    Interview Prep
                                  </Button>
                                </>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Premium Upgrade CTA - Show for free users */}
            {!isPremium && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 border-0 shadow-xl text-black">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-6 h-6" />
                      <CardTitle className="text-black">Go Premium</CardTitle>
                    </div>
                    <CardDescription className="text-black/80">
                      Get 3x more interviews with AI-powered tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>AI daily action plan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Auto follow-up system</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Application quality scoring</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Unlimited AI cover letters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Gmail & Calendar integration</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-black hover:bg-gray-900 text-white font-semibold"
                      onClick={() => window.location.href = '/subscription'}
                      data-testid="button-upgrade-sidebar"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Success Insights - PREMIUM */}
            <PremiumFeature requiresPremium={true} featureName="Success Insights">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4" />
                    Success Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Response Rate</span>
                      <span className="text-sm font-semibold text-green-600">
                        {analytics.responseRate}%
                      </span>
                    </div>
                    <Progress value={analytics.responseRate} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.responseRate > 15 ? '🎉 Above' : '📈 Below'} industry average
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold mb-2">Best performing sources:</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Referrals</span>
                        <span className="font-semibold text-green-600">60%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">LinkedIn</span>
                        <span className="font-semibold text-blue-600">25%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Indeed</span>
                        <span className="font-semibold text-gray-600">8%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-900 dark:text-blue-300">
                        <p className="font-semibold mb-1">AI Recommendation:</p>
                        <p>Focus on referrals - they have 7x higher success rate!</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PremiumFeature>

            {/* Quick Tools */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Quick Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/cover-letter-generator'}
                  data-testid="button-cover-letter-tool"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Cover Letter Generator
                  {!isPremium && <Lock className="w-3 h-3 ml-auto text-gray-400" />}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/mock-interview'}
                  data-testid="button-interview-prep-tool"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Interview Practice
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/resumes'}
                  data-testid="button-resume-tool"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Resume Optimizer
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/referral-marketplace'}
                  data-testid="button-referral-tool"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Find Referrals
                </Button>
              </CardContent>
            </Card>

            {/* Task Reminders */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Upcoming Tasks
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.location.href = '/job-seeker-tasks'}
                    data-testid="button-view-all-tasks"
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : tasks.filter((t: any) => t.status === 'pending').length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">All caught up! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks
                      .filter((t: any) => t.status === 'pending')
                      .slice(0, 3)
                      .map((task: any) => (
                        <div 
                          key={task.id} 
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                          data-testid={`task-${task.id}`}
                        >
                          <p className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </p>
                          {task.dueDateTime && (
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {new Date(task.dueDateTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
