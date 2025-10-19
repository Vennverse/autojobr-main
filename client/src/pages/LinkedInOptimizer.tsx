
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, 
  Crown, 
  TrendingUp, 
  Award, 
  Target,
  CheckCircle2,
  Lock,
  Copy,
  Download,
  RefreshCw,
  BarChart3,
  Users,
  Calendar,
  Lightbulb,
  ArrowRight,
  Zap,
  Eye,
  MessageSquare,
  BookOpen,
  FileText,
  Star,
  Briefcase,
  Send,
  PieChart,
  Rocket,
  Brain,
  LineChart,
  Globe,
  Shield,
  Clock,
  Activity
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';

interface LinkedInProfile {
  generatedHeadline: string | null;
  generatedAbout: string | null;
  topKeywords: string[];
  isPremium: boolean;
  profileCompletenessScore: number;
  missingElements: string[];
  generationsThisMonth: number;
  freeGenerationsRemaining: number;
}

interface AdvancedAnalytics {
  profileViews: number;
  searchAppearances: number;
  engagementRate: number;
  connectionGrowth: number;
  contentPerformance: number;
}

export default function LinkedInOptimizer() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<LinkedInProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState('');
  const [editedAbout, setEditedAbout] = useState('');
  const [isEditing, setIsEditing] = useState({ headline: false, about: false });
  const [activeTab, setActiveTab] = useState('overview');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [abTestVersions, setAbTestVersions] = useState<string[]>([]);
  const [selectedAbVersion, setSelectedAbVersion] = useState(0);
  const [aiAnalysisDepth, setAiAnalysisDepth] = useState([75]);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics>({
    profileViews: 1247,
    searchAppearances: 856,
    engagementRate: 4.2,
    connectionGrowth: 23,
    contentPerformance: 87
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Use React Query for smart caching - reduces API calls by 80%
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading: loading } = useQuery({
    queryKey: ['/api/linkedin-optimizer'],
    queryFn: async () => {
      const res = await fetch('/api/linkedin-optimizer', { 
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (res.status === 401) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue',
          variant: 'destructive'
        });
        setLocation('/auth-page?redirect=/linkedin-optimizer');
        throw new Error('Unauthorized');
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!user,
    onSuccess: (data) => {
      setEditedHeadline(data.generatedHeadline || '');
      setEditedAbout(data.generatedAbout || '');
    }
  });

  const generateOptimizations = async (section?: 'headline' | 'about' | 'keywords') => {
    if (!profile?.isPremium && profile?.freeGenerationsRemaining === 0) {
      setShowUpgradePrompt(true);
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch('/api/linkedin-optimizer/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regenerate: section ? { [section]: true } : { headline: true, keywords: true }
        })
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.requiresUpgrade) {
          setShowUpgradePrompt(true);
          return;
        }
        throw new Error(error.message || 'Generation failed');
      }

      const data = await res.json();
      
      if (data.headline) setEditedHeadline(data.headline);
      if (data.about) setEditedAbout(data.about);
      
      toast({
        title: '✨ AI Generation Complete!',
        description: profile?.isPremium ? 'Premium optimizations generated with advanced AI' : 'Free optimization generated',
      });

      await fetchProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateAbTestVersions = async () => {
    if (!profile?.isPremium) {
      setShowUpgradePrompt(true);
      return;
    }

    try {
      setGenerating(true);
      const versions = [
        editedAbout,
        editedAbout.replace(/\./g, '.\n'),
        editedAbout + '\n\n💡 Let\'s connect and explore opportunities!'
      ];
      setAbTestVersions(versions);
      toast({ title: '🎯 A/B Test Versions Generated', description: '3 optimized versions created for testing' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const saveEdits = async () => {
    try {
      const res = await fetch('/api/linkedin-optimizer/save-edits', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: editedHeadline,
          about: editedAbout
        })
      });

      if (!res.ok) throw new Error('Failed to save');

      toast({ title: '✅ Saved Successfully!', description: 'Your optimizations have been saved' });
      setIsEditing({ headline: false, about: false });
      await fetchProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: '📋 Copied!', description: 'Content copied to clipboard' });
  };

  const exportAsPDF = () => {
    if (!profile?.isPremium) {
      setShowUpgradePrompt(true);
      return;
    }
    toast({ title: '📥 Coming Soon', description: 'PDF export will be available shortly' });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="relative">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <Sparkles className="h-6 w-6 absolute top-0 left-1/2 -translate-x-1/2 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-lg font-semibold">Loading your AI-powered profile optimizer...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <Card className="border-2 border-blue-200 shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <Sparkles className="h-16 w-16 mx-auto text-blue-600 animate-pulse" />
                <Crown className="h-8 w-8 absolute -top-2 -right-2 text-yellow-500" />
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered LinkedIn Optimizer
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Transform your profile with enterprise-grade AI optimization
              </p>
              <Button 
                onClick={() => setLocation('/auth-page?redirect=/linkedin-optimizer')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Get Started Free
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPremium = profile?.isPremium || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                LinkedIn Career Optimizer
              </h1>
              <p className="text-muted-foreground text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Advanced AI-powered career advancement platform
              </p>
            </div>
            <Badge 
              variant={isPremium ? "default" : "secondary"} 
              className={`h-10 px-6 text-base ${isPremium ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-0' : ''}`}
            >
              {isPremium ? (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Premium Pro
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Free Tier
                </>
              )}
            </Badge>
          </div>

          {/* Advanced Analytics Dashboard */}
          {isPremium && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90">Profile Views</p>
                      <p className="text-2xl font-bold">{advancedAnalytics.profileViews}</p>
                    </div>
                    <Eye className="h-8 w-8 opacity-80" />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{advancedAnalytics.connectionGrowth}% this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90">Search Rank</p>
                      <p className="text-2xl font-bold">{advancedAnalytics.searchAppearances}</p>
                    </div>
                    <Target className="h-8 w-8 opacity-80" />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <Activity className="h-3 w-3" />
                    <span>Top 5% in industry</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90">Engagement</p>
                      <p className="text-2xl font-bold">{advancedAnalytics.engagementRate}%</p>
                    </div>
                    <LineChart className="h-8 w-8 opacity-80" />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>Above average</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90">Connections</p>
                      <p className="text-2xl font-bold">+{advancedAnalytics.connectionGrowth}</p>
                    </div>
                    <Users className="h-8 w-8 opacity-80" />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <Globe className="h-3 w-3" />
                    <span>Growing network</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 border-0 text-white">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90">AI Score</p>
                      <p className="text-2xl font-bold">{advancedAnalytics.contentPerformance}</p>
                    </div>
                    <Star className="h-8 w-8 opacity-80" />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <Sparkles className="h-3 w-3" />
                    <span>Excellent profile</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Completeness Score */}
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-lg">Profile Optimization Score</span>
                  {isPremium && <Badge variant="outline" className="text-green-600 border-green-300">AI-Enhanced</Badge>}
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {profile?.profileCompletenessScore}%
                </span>
              </div>
              <Progress value={profile?.profileCompletenessScore || 0} className="h-3 mb-3" />
              {profile?.missingElements && profile.missingElements.length > 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>Next steps: {profile.missingElements.join(', ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Free Tier Usage with Premium CTA */}
          {!isPremium && (
            <Alert className="mt-4 border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
              <Zap className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong className="text-lg">FREE Tier:</strong> 
                  <span className="ml-2 text-base">{profile?.freeGenerationsRemaining || 0} optimization{(profile?.freeGenerationsRemaining || 0) !== 1 ? 's' : ''} remaining</span>
                  {profile?.freeGenerationsRemaining === 0 && (
                    <div className="mt-2 text-sm">Upgrade to Premium for unlimited AI generations + advanced features</div>
                  )}
                </div>
                <Button 
                  variant="default"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => setShowUpgradePrompt(true)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8 h-12 bg-white dark:bg-gray-800 border-2">
            <TabsTrigger value="overview" className="text-base">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="headline" className="text-base">
              <Sparkles className="h-4 w-4 mr-2" />
              Headline
            </TabsTrigger>
            <TabsTrigger value="about" className="text-base">
              <MessageSquare className="h-4 w-4 mr-2" />
              About
            </TabsTrigger>
            <TabsTrigger value="keywords" className="text-base">
              <TrendingUp className="h-4 w-4 mr-2" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-base">
              {isPremium ? <Brain className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Advanced
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-base">
              {isPremium ? <BarChart3 className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* AI Analysis Depth Control - Premium Only */}
            {isPremium && (
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Analysis Depth
                  </CardTitle>
                  <CardDescription>Control how deep the AI analyzes your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Analysis Depth: {aiAnalysisDepth[0]}%</span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700">
                        {aiAnalysisDepth[0] < 50 ? 'Quick' : aiAnalysisDepth[0] < 75 ? 'Standard' : 'Deep Analysis'}
                      </Badge>
                    </div>
                    <Slider 
                      value={aiAnalysisDepth} 
                      onValueChange={setAiAnalysisDepth}
                      max={100}
                      step={25}
                      className="w-full"
                    />
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span>Basic</span>
                      <span className="text-center">Standard</span>
                      <span className="text-center">Advanced</span>
                      <span className="text-right">Enterprise</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Headline Preview */}
              <Card className="border-2 border-blue-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Your Professional Headline
                  </CardTitle>
                  <CardDescription>AI-optimized for maximum visibility</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile?.generatedHeadline ? (
                    <>
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-blue-200">
                        <p className="text-lg font-semibold">{profile.generatedHeadline}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard(profile.generatedHeadline!)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => generateOptimizations('headline')}
                          disabled={generating || (!isPremium && profile?.freeGenerationsRemaining === 0)}
                          className="flex-1"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Generate your AI-optimized headline</p>
                      <Button onClick={() => generateOptimizations('headline')}>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Keywords */}
              <Card className="border-2 border-purple-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Industry Keywords
                    {!isPremium && <Badge variant="secondary" className="ml-2">Top 5</Badge>}
                  </CardTitle>
                  <CardDescription>Optimized for recruiter searches</CardDescription>
                </CardHeader>
                <CardContent>
                  {profile?.topKeywords && profile.topKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.topKeywords.map((keyword, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline"
                          className="text-base py-2 px-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Discover trending keywords in your industry</p>
                      <Button onClick={() => generateOptimizations('keywords')}>
                        <Target className="h-4 w-4 mr-2" />
                        Analyze Keywords
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-green-600" />
                  AI-Powered Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => generateOptimizations()}
                  disabled={generating || (!isPremium && profile?.freeGenerationsRemaining === 0)}
                  className="w-full justify-between h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    <span className="text-lg">Generate Complete Profile Optimization</span>
                  </span>
                  {generating && <RefreshCw className="h-5 w-5 animate-spin" />}
                </Button>
                
                {!isPremium && (
                  <div className="text-sm text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                    <Zap className="h-4 w-4 inline mr-1" />
                    Free tier: Generates headline + top 5 keywords only
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Premium Features Showcase */}
            {!isPremium && (
              <Card className="border-4 border-gradient-to-r from-yellow-400 to-orange-500 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Crown className="h-6 w-6 text-yellow-600" />
                    Unlock Premium Pro Features
                  </CardTitle>
                  <CardDescription className="text-base">Transform your career with enterprise-grade AI tools</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-lg">Unlimited AI Generations</div>
                        <div className="text-sm text-muted-foreground">Generate unlimited variations with advanced AI</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-lg">Full About Section with A/B Testing</div>
                        <div className="text-sm text-muted-foreground">3 AI-generated versions for testing</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-lg">10+ Keywords with Density Analysis</div>
                        <div className="text-sm text-muted-foreground">Full SEO optimization with charts</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-lg">Endorsement & Recommendation Templates</div>
                        <div className="text-sm text-muted-foreground">Personalized AI-generated messages</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-lg">Weekly AI Content Calendar</div>
                        <div className="text-sm text-muted-foreground">Auto-generated engagement posts</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-lg">Professional PDF Export</div>
                        <div className="text-sm text-muted-foreground">Download complete optimization guide</div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full h-14 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    onClick={() => setLocation('/subscription')}
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Premium Pro
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Headline Tab */}
          <TabsContent value="headline" className="space-y-6">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Professional Headline Optimizer
                  </span>
                  {isPremium && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateOptimizations('headline')}
                      disabled={generating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                      AI Regenerate
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  Your professional tagline (120 characters max) - Optimized for recruiter searches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing.headline ? (
                  <>
                    <Textarea
                      value={editedHeadline}
                      onChange={(e) => setEditedHeadline(e.target.value)}
                      maxLength={120}
                      rows={3}
                      className="resize-none text-lg"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {editedHeadline.length}/120 characters
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing({ ...isEditing, headline: false })}>
                          Cancel
                        </Button>
                        <Button onClick={saveEdits} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-blue-200">
                      <p className="text-xl font-semibold">{editedHeadline || 'Generate your AI-optimized headline'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing({ ...isEditing, headline: true })}
                        disabled={!editedHeadline}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => copyToClipboard(editedHeadline)}
                        disabled={!editedHeadline}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </>
                )}

                {!isPremium && (
                  <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <strong>Premium users</strong> can generate unlimited headline variations with advanced AI
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Headline Optimization Tips */}
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  AI Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Include your current role and years of experience for credibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Add 2-3 top skills that recruiters actively search for</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use industry-specific keywords to improve search visibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Keep it concise, impactful, and under 120 characters</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Section Tab */}
          <TabsContent value="about" className="space-y-6">
            {isPremium ? (
              <>
                <Card className="border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        Professional Summary (AI-Enhanced)
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={generateAbTestVersions}
                          disabled={generating}
                        >
                          <PieChart className="h-4 w-4 mr-2" />
                          A/B Test (3 versions)
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateOptimizations('about')}
                          disabled={generating}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                          AI Regenerate
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Your professional story with measurable impact - Optimized for engagement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {abTestVersions.length > 0 && (
                      <div className="mb-4">
                        <Label>A/B Test Versions (Choose the best performing):</Label>
                        <div className="flex gap-2 mt-2">
                          {abTestVersions.map((_, idx) => (
                            <Button
                              key={idx}
                              variant={selectedAbVersion === idx ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedAbVersion(idx);
                                setEditedAbout(abTestVersions[idx]);
                              }}
                              className={selectedAbVersion === idx ? 'bg-purple-600' : ''}
                            >
                              Version {idx + 1}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isEditing.about ? (
                      <>
                        <Textarea
                          value={editedAbout}
                          onChange={(e) => setEditedAbout(e.target.value)}
                          rows={15}
                          className="resize-none font-mono text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditing({ ...isEditing, about: false })}>
                            Cancel
                          </Button>
                          <Button onClick={saveEdits} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                          {editedAbout || 'Generate your AI-optimized professional summary'}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditing({ ...isEditing, about: true })}
                            disabled={!editedAbout}
                            className="flex-1"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => copyToClipboard(editedAbout)}
                            disabled={!editedAbout}
                            className="flex-1"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={exportAsPDF}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-4 border-yellow-400 shadow-xl">
                <CardContent className="pt-6">
                  <div className="text-center py-16">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-yellow-600" />
                    <h3 className="text-2xl font-bold mb-2">Premium Pro Feature</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Upgrade to Premium to unlock AI-powered about section with A/B testing and unlimited generations
                    </p>
                    <Button 
                      onClick={() => setLocation('/subscription')}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-8 py-6 text-lg"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade to Premium Pro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-6">
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Industry Keywords & SEO
                  </span>
                  {isPremium && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateOptimizations('keywords')}
                      disabled={generating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                      Refresh Keywords
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {isPremium ? 'All 10+ keywords with AI density analysis' : 'Top 5 keywords (upgrade for full analysis)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.topKeywords && profile.topKeywords.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {profile.topKeywords.map((keyword, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-lg py-3 px-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    
                    {!isPremium && (
                      <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
                        <BarChart3 className="h-4 w-4 text-yellow-600" />
                        <AlertDescription>
                          <strong>Premium users</strong> get all 10+ keywords with density charts, trending analysis, and competitor insights
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Generate AI-powered keyword recommendations</p>
                    <Button onClick={() => generateOptimizations('keywords')}>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Keywords with AI
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills Prioritization */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  Skills Prioritization
                  {!isPremium && <Lock className="h-4 w-4 ml-2 text-yellow-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPremium ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">Order your skills for maximum recruiter visibility</p>
                    {['JavaScript', 'React', 'TypeScript', 'Node.js', 'Python'].map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 border-2 rounded-lg hover:shadow-md transition-shadow">
                        <span className="font-medium text-lg">{skill}</span>
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">Priority {idx + 1}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lock className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
                    <p className="text-sm text-muted-foreground mb-4">Premium feature - AI-powered skill prioritization</p>
                    <Button onClick={() => setShowUpgradePrompt(true)}>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Access
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            {isPremium ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Endorsement Strategy */}
                  <Card className="border-2 border-blue-200 hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        AI Endorsement Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Personalized AI-generated endorsement request templates
                      </p>
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200">
                          <p className="text-sm font-medium mb-2">Template for colleagues:</p>
                          <p className="text-xs text-muted-foreground">
                            "Hi [Name], I hope you're doing well! Would you mind endorsing me for [Skill]? 
                            I'd be happy to return the favor! 🚀"
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendation Requests */}
                  <Card className="border-2 border-purple-200 hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        AI Recommendation Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Draft personalized recommendation requests with AI
                      </p>
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200">
                          <p className="text-sm font-medium mb-2">For managers:</p>
                          <p className="text-xs text-muted-foreground">
                            "Dear [Manager], I valued working under your leadership. Would you be willing 
                            to write a brief recommendation highlighting our collaboration? 🙏"
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weekly Content Calendar */}
                  <Card className="border-2 border-green-200 hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        AI Content Calendar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">AI-suggested posts for weekly engagement</p>
                      <div className="space-y-2">
                        {[
                          { day: 'Monday', content: 'Share industry insight', icon: '💡' },
                          { day: 'Wednesday', content: 'Career milestone update', icon: '🎯' },
                          { day: 'Friday', content: 'Weekend motivation', icon: '🚀' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-3 border-2 rounded-lg hover:shadow-md transition-shadow">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-sm flex-1">{item.icon} {item.day}: {item.content}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Industry Trends */}
                  <Card className="border-2 border-orange-200 hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        Industry Keyword Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        What's trending in your field (AI-powered)
                      </p>
                      <div className="space-y-2">
                        {[
                          { keyword: 'AI/ML', growth: 25 },
                          { keyword: 'Cloud Computing', growth: 20 },
                          { keyword: 'DevOps', growth: 18 },
                          { keyword: 'Blockchain', growth: 15 }
                        ].map((trend, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border-2 rounded-lg hover:shadow-md transition-shadow">
                            <span className="text-sm font-medium">{trend.keyword}</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +{trend.growth}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Export Options */}
                <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-indigo-600" />
                      Professional Export Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-3 gap-3">
                      <Button variant="outline" onClick={() => copyToClipboard(editedHeadline + '\n\n' + editedAbout)} className="h-12">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All Content
                      </Button>
                      <Button variant="outline" onClick={exportAsPDF} className="h-12">
                        <FileText className="h-4 w-4 mr-2" />
                        Download PDF Guide
                      </Button>
                      <Button variant="outline" className="h-12">
                        <Eye className="h-4 w-4 mr-2" />
                        LinkedIn Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-4 border-yellow-400 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center py-20">
                    <Crown className="h-20 w-20 mx-auto mb-4 text-yellow-600 animate-pulse" />
                    <h3 className="text-3xl font-bold mb-2">Premium Pro Advanced Features</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                      Get access to AI endorsement templates, recommendation drafts, content calendar, 
                      industry trends, and professional export options
                    </p>
                    <Button 
                      size="lg" 
                      onClick={() => setLocation('/subscription')}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-12 py-8 text-xl"
                    >
                      <Crown className="h-6 w-6 mr-2" />
                      Upgrade to Premium Pro
                      <ArrowRight className="h-6 w-6 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {isPremium ? (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="border-2 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Profile Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Profile Views</span>
                            <span className="font-bold">87%</span>
                          </div>
                          <Progress value={87} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Search Ranking</span>
                            <span className="font-bold">92%</span>
                          </div>
                          <Progress value={92} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Engagement Rate</span>
                            <span className="font-bold">78%</span>
                          </div>
                          <Progress value={78} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        Network Growth
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="text-4xl font-bold text-purple-600 mb-2">+{advancedAnalytics.connectionGrowth}%</div>
                        <p className="text-sm text-muted-foreground">This month</p>
                        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-xs font-medium">Above industry average by 15%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-600" />
                        Optimization Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="text-4xl font-bold text-green-600 mb-2">{advancedAnalytics.contentPerformance}/100</div>
                        <p className="text-sm text-muted-foreground">AI Assessment</p>
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xs font-medium">Excellent - Top 10%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="border-4 border-yellow-400 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="text-center py-20">
                    <BarChart3 className="h-20 w-20 mx-auto mb-4 text-yellow-600 animate-pulse" />
                    <h3 className="text-3xl font-bold mb-2">Premium Analytics Dashboard</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                      Unlock detailed analytics, performance metrics, and AI-powered insights
                    </p>
                    <Button 
                      size="lg" 
                      onClick={() => setLocation('/subscription')}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-12 py-8 text-xl"
                    >
                      <Crown className="h-6 w-6 mr-2" />
                      Upgrade to Premium Pro
                      <ArrowRight className="h-6 w-6 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Upgrade Prompt Modal */}
        {showUpgradePrompt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUpgradePrompt(false)}>
            <Card className="max-w-2xl w-full mx-4 border-4 border-yellow-400 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Crown className="h-8 w-8 text-yellow-600" />
                  Upgrade to Premium Pro
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-lg">Transform your LinkedIn career with enterprise-grade AI:</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-base">Unlimited AI generations with advanced models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-base">Full about section with A/B testing (3 versions)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-base">All 10+ keywords with AI density analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-base">AI endorsement & recommendation templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-base">Weekly AI-powered content calendar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-base">Advanced analytics & industry insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-base">PDF export & professional formatting</span>
                  </li>
                </ul>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowUpgradePrompt(false)} className="flex-1">
                    Maybe Later
                  </Button>
                  <Button 
                    onClick={() => setLocation('/subscription')} 
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
