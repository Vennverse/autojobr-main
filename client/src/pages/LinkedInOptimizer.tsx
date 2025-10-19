
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
  PieChart
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
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
        return;
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await res.json();
      setProfile(data);
      setEditedHeadline(data.generatedHeadline || '');
      setEditedAbout(data.generatedAbout || '');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load LinkedIn profile',
        variant: 'destructive'
      });
      setProfile({
        generatedHeadline: null,
        generatedAbout: null,
        topKeywords: [],
        isPremium: false,
        profileCompletenessScore: 0,
        missingElements: [],
        generationsThisMonth: 0,
        freeGenerationsRemaining: 1
      });
    } finally {
      setLoading(false);
    }
  };

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
        title: 'Success!',
        description: profile?.isPremium ? 'Profile optimizations generated' : 'Free optimization generated',
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
        editedAbout + '\n\nLet\'s connect and explore opportunities!'
      ];
      setAbTestVersions(versions);
      toast({ title: 'A/B Test Versions Generated', description: '3 versions created for testing' });
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

      toast({ title: 'Saved!', description: 'Your edits have been saved' });
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
    toast({ title: 'Copied!', description: 'Content copied to clipboard' });
  };

  const exportAsPDF = () => {
    if (!profile?.isPremium) {
      setShowUpgradePrompt(true);
      return;
    }
    toast({ title: 'Coming Soon', description: 'PDF export will be available shortly' });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your LinkedIn profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">LinkedIn Profile Optimizer</h2>
              <p className="text-muted-foreground mb-6">
                Sign in to optimize your LinkedIn profile with AI
              </p>
              <Button onClick={() => setLocation('/auth-page?redirect=/linkedin-optimizer')}>
                Sign In to Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPremium = profile?.isPremium || false;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">LinkedIn Profile Optimizer</h1>
            <p className="text-muted-foreground">
              AI-powered optimization to boost your professional presence
            </p>
          </div>
          <Badge variant={isPremium ? "default" : "secondary"} className="h-8 px-4">
            {isPremium ? (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Premium
              </>
            ) : (
              'Free Tier'
            )}
          </Badge>
        </div>

        {/* Profile Completeness Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">Profile Completeness</span>
              </div>
              <span className="text-2xl font-bold">{profile?.profileCompletenessScore}%</span>
            </div>
            <Progress value={profile?.profileCompletenessScore || 0} className="h-2 mb-3" />
            {profile?.missingElements && profile.missingElements.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Missing: {profile.missingElements.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Free Tier Usage */}
        {!isPremium && (
          <Alert className="mt-4">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>FREE Tier:</strong> {profile?.freeGenerationsRemaining || 0} optimization{(profile?.freeGenerationsRemaining || 0) !== 1 ? 's' : ''} remaining this month
              {profile?.freeGenerationsRemaining === 0 && (
                <Button 
                  variant="link" 
                  className="ml-2 p-0 h-auto"
                  onClick={() => setShowUpgradePrompt(true)}
                >
                  Upgrade to Premium →
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="headline">Headline</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="advanced">
            {isPremium ? 'Advanced' : <Lock className="h-4 w-4" />}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Headline Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Your Headline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.generatedHeadline ? (
                  <>
                    <p className="mb-4 p-3 bg-muted rounded-lg">{profile.generatedHeadline}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(profile.generatedHeadline!)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">Generate your optimized headline</p>
                )}
              </CardContent>
            </Card>

            {/* Top Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Keywords
                  {!isPremium && <Badge variant="secondary" className="ml-2">Top 5</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.topKeywords && profile.topKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.topKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline">{keyword}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Generate keywords for your profile</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => generateOptimizations()}
                disabled={generating || (!isPremium && profile?.freeGenerationsRemaining === 0)}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Profile Optimizations
                </span>
                {generating && <RefreshCw className="h-4 w-4 animate-spin" />}
              </Button>
              
              {!isPremium && (
                <div className="text-sm text-muted-foreground text-center">
                  Free tier: Generates headline + top 5 keywords only
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Features Preview */}
          {!isPremium && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Unlock Premium Features
                </CardTitle>
                <CardDescription>Get unlimited access to all optimization tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Unlimited Generations</div>
                      <div className="text-sm text-muted-foreground">Generate as many variations as you need</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Full About Section</div>
                      <div className="text-sm text-muted-foreground">A/B test 3 versions</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">All Keywords (10+)</div>
                      <div className="text-sm text-muted-foreground">Full keyword analysis with density charts</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Endorsement Templates</div>
                      <div className="text-sm text-muted-foreground">Personalized request messages</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Weekly Content Calendar</div>
                      <div className="text-sm text-muted-foreground">AI-suggested posts</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">PDF Export</div>
                      <div className="text-sm text-muted-foreground">Download optimized profile guide</div>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => setLocation('/subscription')}
                >
                  Upgrade to Premium
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Headline Tab */}
        <TabsContent value="headline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Professional Headline
                </span>
                {isPremium && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateOptimizations('headline')}
                    disabled={generating}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Your professional tagline (120 characters max)
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
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {editedHeadline.length}/120 characters
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditing({ ...isEditing, headline: false })}>
                        Cancel
                      </Button>
                      <Button onClick={saveEdits}>Save</Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-lg">{editedHeadline || 'No headline generated yet'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing({ ...isEditing, headline: true })}
                      disabled={!editedHeadline}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(editedHeadline)}
                      disabled={!editedHeadline}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </>
              )}

              {!isPremium && (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Premium users can generate unlimited headline variations
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Headline Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Headline Optimization Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Include your current role and years of experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Add 2-3 top skills relevant to your industry</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use industry keywords recruiters search for</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Keep it concise and impactful (under 120 chars)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Section Tab */}
        <TabsContent value="about" className="space-y-6">
          {isPremium ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Professional Summary
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={generateAbTestVersions}
                        disabled={generating}
                      >
                        <PieChart className="h-4 w-4 mr-2" />
                        A/B Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => generateOptimizations('about')}
                        disabled={generating}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Your professional story with measurable impact
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {abTestVersions.length > 0 && (
                    <div className="mb-4">
                      <Label>A/B Test Versions:</Label>
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
                        rows={12}
                        className="resize-none font-mono text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditing({ ...isEditing, about: false })}>
                          Cancel
                        </Button>
                        <Button onClick={saveEdits}>Save</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {editedAbout || 'Generate your professional summary'}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing({ ...isEditing, about: true })}
                          disabled={!editedAbout}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => copyToClipboard(editedAbout)}
                          disabled={!editedAbout}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={exportAsPDF}
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
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
                  <p className="text-muted-foreground mb-6">
                    Upgrade to Premium to unlock full about section optimization with A/B testing
                  </p>
                  <Button onClick={() => setLocation('/subscription')}>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Keywords for Your Role
                </span>
                {isPremium && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateOptimizations('keywords')}
                    disabled={generating}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {isPremium ? 'All 10+ keywords with density analysis' : 'Top 5 keywords (upgrade for full analysis)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.topKeywords && profile.topKeywords.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {profile.topKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-base py-2 px-4">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  
                  {!isPremium && (
                    <Alert>
                      <BarChart3 className="h-4 w-4" />
                      <AlertDescription>
                        Premium users get all 10+ keywords with density charts and trending analysis
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Generate keywords to see recommendations</p>
              )}
            </CardContent>
          </Card>

          {/* Skills Prioritization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Skills Prioritization
                {!isPremium && <Lock className="h-4 w-4 ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">Order your skills for maximum visibility</p>
                  {['JavaScript', 'React', 'TypeScript', 'Node.js', 'Python'].map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{skill}</span>
                      <Badge>Priority {idx + 1}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Premium feature - Upgrade to prioritize your skills</p>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Endorsement Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Personalized endorsement request templates
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Template for colleagues:</p>
                        <p className="text-xs text-muted-foreground">
                          "Hi [Name], I hope you're doing well! Would you mind endorsing me for [Skill]? 
                          I'd be happy to return the favor!"
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Recommendation Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Draft personalized recommendation requests
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">For managers:</p>
                        <p className="text-xs text-muted-foreground">
                          "Dear [Manager], I valued working under your leadership. Would you be willing 
                          to write a brief recommendation highlighting our collaboration?"
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Weekly Content Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">AI-suggested posts for engagement</p>
                    <div className="space-y-2">
                      {['Monday: Share industry insight', 'Wednesday: Career milestone update', 'Friday: Weekend motivation'].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Industry Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Industry Keyword Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      What's trending in your field
                    </p>
                    <div className="space-y-2">
                      {['AI/ML', 'Cloud Computing', 'DevOps', 'Blockchain'].map((trend, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{trend}</span>
                          <Badge variant="outline">+{15 + idx * 5}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Professional Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <Button variant="outline" onClick={() => copyToClipboard(editedHeadline + '\n\n' + editedAbout)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All
                    </Button>
                    <Button variant="outline" onClick={exportAsPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Crown className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-semibold mb-2">Premium Advanced Features</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Get access to endorsement templates, recommendation drafts, content calendar, 
                    industry trends, and professional export options
                  </p>
                  <Button size="lg" onClick={() => setLocation('/subscription')}>
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUpgradePrompt(false)}>
          <Card className="max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                Upgrade to Premium
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You've used your free optimization. Upgrade to Premium for:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Unlimited optimizations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Full about section with A/B testing (3 versions)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  All 10+ keywords with density analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Endorsement & recommendation templates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Weekly content calendar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  PDF export & professional formatting
                </li>
              </ul>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowUpgradePrompt(false)} className="flex-1">
                  Maybe Later
                </Button>
                <Button onClick={() => setLocation('/subscription')} className="flex-1">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
