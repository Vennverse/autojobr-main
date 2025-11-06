import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  XCircle,
  Copy,
  Info
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

// Follow-up Email Modal Component
const FollowUpEmailModal = ({ 
  isOpen, 
  onClose, 
  application,
  isPremium
}: { 
  isOpen: boolean;
  onClose: () => void;
  application: any;
  isPremium: boolean;
}) => {
  const { toast } = useToast();
  const [emailContent, setEmailContent] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generateEmailMutation = useMutation({
    mutationFn: async (appId: number) => {
      return await apiRequest('POST', `/api/applications/${appId}/follow-up-email`);
    },
    onSuccess: (data) => {
      setEmailContent(data.email);
      toast({
        title: "✨ Email generated!",
        description: "Your follow-up email is ready to send.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to generate email";
      if (errorMessage.includes("Limit reached")) {
        toast({
          title: "❌ Limit reached",
          description: "Free users get 2 follow-up emails per month. Upgrade to Premium for unlimited access.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  });

  const handleCopyEmail = () => {
    if (emailContent) {
      navigator.clipboard.writeText(`Subject: ${emailContent.subject}\n\n${emailContent.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "📋 Copied!",
        description: "Email copied to clipboard",
      });
    }
  };

  useEffect(() => {
    if (isOpen && application && !emailContent) {
      generateEmailMutation.mutate(application.id);
    }
  }, [isOpen, application]);

  useEffect(() => {
    if (!isOpen) {
      setEmailContent(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Follow-up Email for {application?.company}
          </DialogTitle>
          <DialogDescription>
            AI-generated professional follow-up email template
          </DialogDescription>
        </DialogHeader>

        {generateEmailMutation.isPending ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Generating your personalized email...</p>
          </div>
        ) : emailContent ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject</label>
              <Input 
                value={emailContent.subject}
                onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                className="mt-1"
                data-testid="input-email-subject"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Body</label>
              <Textarea 
                value={emailContent.body}
                onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                rows={12}
                className="mt-1 font-mono text-sm"
                data-testid="textarea-email-body"
              />
            </div>

            <Alert>
              <Lightbulb className="w-4 h-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">💡 Pro Tips:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {emailContent.tips?.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-close-email-modal"
          >
            Close
          </Button>
          <Button 
            onClick={handleCopyEmail}
            disabled={!emailContent}
            data-testid="button-copy-email"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Quality Check Modal Component
const QualityCheckModal = ({ 
  isOpen, 
  onClose, 
  application
}: { 
  isOpen: boolean;
  onClose: () => void;
  application: any;
}) => {
  const { toast } = useToast();
  const [qualityData, setQualityData] = useState<any>(null);

  const qualityCheckMutation = useMutation({
    mutationFn: async (appId: number) => {
      return await apiRequest('POST', `/api/applications/${appId}/quality-check`);
    },
    onSuccess: (data) => {
      setQualityData(data.quality);
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check quality",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (isOpen && application && !qualityData) {
      qualityCheckMutation.mutate(application.id);
    }
  }, [isOpen, application]);

  useEffect(() => {
    if (!isOpen) {
      setQualityData(null);
    }
  }, [isOpen]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-orange-600';
      default: return 'text-red-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Application Quality Report
          </DialogTitle>
          <DialogDescription>
            AI analysis of your application to {application?.company}
          </DialogDescription>
        </DialogHeader>

        {qualityCheckMutation.isPending ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Analyzing your application...</p>
          </div>
        ) : qualityData ? (
          <div className="space-y-4">
            <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <div className={`text-6xl font-bold ${getGradeColor(qualityData.grade)} mb-2`}>
                {qualityData.grade}
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {qualityData.score}/100
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Overall Quality Score
              </p>
            </div>

            {qualityData.feedback && qualityData.feedback.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Feedback:</h4>
                <div className="space-y-2">
                  {qualityData.feedback.map((item: any, i: number) => (
                    <Alert key={i} variant={item.type === 'warning' ? 'destructive' : 'default'}>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        <p className="font-semibold">{item.message}</p>
                        <p className="text-sm mt-1">{item.action}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {qualityData.recommendations && qualityData.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">💡 Recommendations:</h4>
                <ul className="space-y-2">
                  {qualityData.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button onClick={onClose} data-testid="button-close-quality-modal">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ApplicationsNew() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [emailModalApp, setEmailModalApp] = useState<any>(null);
  const [qualityModalApp, setQualityModalApp] = useState<any>(null);

  const isPremium = user?.planType === "premium" || user?.subscriptionStatus === "active";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, authLoading]);

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: isAuthenticated,
  });

  const { data: dailyActionsData, isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/applications/daily-actions"],
    enabled: isAuthenticated && isPremium,
    retry: false,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/applications/analytics"],
    enabled: isAuthenticated && isPremium,
    retry: false,
  });

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
    avgResponseTime: 5.2,
  };

  const todayActions = isPremium && dailyActionsData?.actions 
    ? dailyActionsData.actions 
    : [];

  const handleGenerateEmail = (app: any) => {
    setEmailModalApp(app);
  };

  const handleQualityCheck = (app: any) => {
    setQualityModalApp(app);
  };

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
          <div className="lg:col-span-2 space-y-6">
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
                      {actionsLoading ? 'Loading...' : `${todayActions.length} actions to move closer to your next interview`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actionsLoading ? (
                      <div className="py-8 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-white/80" />
                        <p className="text-white/90">Loading your actions...</p>
                      </div>
                    ) : todayActions.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-white/80" />
                        <p className="text-white/90">You're all caught up! 🎉</p>
                        <p className="text-indigo-200 text-sm mt-1">Check back tomorrow for new actions</p>
                      </div>
                    ) : (
                      todayActions.map((action: any, index: number) => (
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
                              {action.type === 'followup' ? <Mail className="w-4 h-4" /> : 
                               action.type === 'quality_check' ? <Award className="w-4 h-4" /> :
                               <Brain className="w-4 h-4" />}
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
                                  onClick={() => {
                                    const app = applications.find((a: any) => a.id === action.applicationId);
                                    if (action.type === 'followup') {
                                      handleGenerateEmail(app);
                                    } else if (action.type === 'quality_check') {
                                      handleQualityCheck(app);
                                    }
                                  }}
                                  data-testid={`button-take-action-${index}`}
                                >
                                  {action.type === 'followup' ? 'Generate Email' : 
                                   action.type === 'quality_check' ? 'Check Quality' : 
                                   'Start Prep'}
                                  <ArrowRight className="w-3 h-3 ml-1" />
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
                            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                              needsFollowUp 
                                ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10' 
                                : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
                            }`}
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
                                  {app.applicationQualityScore && (
                                    <Badge variant="secondary">
                                      <Award className="w-3 h-3 mr-1" />
                                      {app.applicationQualityScore}/100
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
                            </div>

                            <div className="flex gap-2 mt-3">
                              {needsFollowUp && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleGenerateEmail(app)}
                                  data-testid={`button-generate-email-${app.id}`}
                                >
                                  <Mail className="w-3 h-3 mr-1" />
                                  Generate Follow-up
                                  {!isPremium && <Lock className="w-3 h-3 ml-1" />}
                                </Button>
                              )}
                              {isPremium && !app.applicationQualityScore && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handleQualityCheck(app)}
                                  data-testid={`button-quality-check-${app.id}`}
                                >
                                  <Award className="w-3 h-3 mr-1" />
                                  Check Quality
                                </Button>
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

          <div className="space-y-6">
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
                        <span>Unlimited follow-up emails</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Application quality scoring</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Detailed analytics</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Gmail & Calendar integration</span>
                      </div>
                    </div>
                    <div className="bg-black/10 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">Free Plan Quota:</span>
                        <span className="text-xs">Resets monthly</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Follow-up emails:</span>
                        <span className="font-bold">2/month</span>
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

            <PremiumFeature requiresPremium={true} featureName="Success Insights">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4" />
                    Success Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : analyticsData ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Response Rate</span>
                          <span className="text-sm font-semibold text-green-600">
                            {analyticsData.insights.overallResponseRate}%
                          </span>
                        </div>
                        <Progress value={analyticsData.insights.overallResponseRate} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {analyticsData.insights.overallResponseRate > 15 ? '🎉 Above' : '📈 Below'} industry average
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold mb-2">Best performing sources:</p>
                        <div className="space-y-2">
                          {analyticsData.analytics.slice(0, 3).map((item: any) => (
                            <div key={item.source} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400 capitalize">{item.source}</span>
                              <span className={`font-semibold ${
                                item.responseRate > 30 ? 'text-green-600' : 
                                item.responseRate > 15 ? 'text-blue-600' : 
                                'text-gray-600'
                              }`}>
                                {item.responseRate}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="text-xs text-blue-900 dark:text-blue-300">
                            <p className="font-semibold mb-1">AI Recommendation:</p>
                            <p>Focus on {analyticsData.insights.bestSource} - {analyticsData.insights.bestResponseRate}% response rate!</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
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
                  )}
                </CardContent>
              </Card>
            </PremiumFeature>

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

      <FollowUpEmailModal 
        isOpen={!!emailModalApp}
        onClose={() => setEmailModalApp(null)}
        application={emailModalApp}
        isPremium={isPremium}
      />

      <QualityCheckModal 
        isOpen={!!qualityModalApp}
        onClose={() => setQualityModalApp(null)}
        application={qualityModalApp}
      />
    </div>
  );
}
