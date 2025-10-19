
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Crown, Download, RefreshCw, Lock, TrendingUp, Target, Users, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';

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

  // Fetch profile when user is authenticated
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else if (!authLoading) {
      // Auth loading is done and no user found
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching LinkedIn profile...');
      
      const res = await fetch('/api/linkedin-optimizer', { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 Response status:', res.status);
      
      if (res.status === 401) {
        console.warn('⚠️ Not authenticated, redirecting to login');
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue',
          variant: 'destructive'
        });
        setLocation('/auth-page?redirect=/linkedin-optimizer');
        return;
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Profile fetch error:', errorText);
        throw new Error(errorText || 'Failed to fetch profile');
      }
      
      const data = await res.json();
      console.log('✅ Profile loaded successfully:', data);
      setProfile(data);
      setEditedHeadline(data.generatedHeadline || '');
      setEditedAbout(data.generatedAbout || '');
    } catch (error: any) {
      console.error('❌ Profile fetch failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load LinkedIn profile',
        variant: 'destructive'
      });
      // Set empty profile to stop loading state
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

  const handleGenerate = async (regenerate?: { headline?: boolean; about?: boolean; keywords?: boolean }) => {
    if (!profile?.isPremium && profile?.freeGenerationsRemaining === 0) {
      toast({
        title: 'Free Tier Limit Reached',
        description: 'Upgrade to Premium for unlimited generations',
        variant: 'destructive'
      });
      setLocation('/job-seeker-premium');
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch('/api/linkedin-optimizer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ regenerate: regenerate || {} })
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.requiresUpgrade) {
          setLocation('/job-seeker-premium');
        }
        throw new Error(error.message || 'Generation failed');
      }

      const data = await res.json();
      
      toast({
        title: 'Success',
        description: profile?.isPremium ? 'Profile optimized successfully' : 'Free tier: Headline generated',
      });

      // Refresh profile to get updated data from cache
      await fetchProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate profile',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    try {
      const res = await fetch('/api/linkedin-optimizer/save-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          headline: editedHeadline,
          about: editedAbout
        })
      });

      if (!res.ok) throw new Error('Failed to save edits');

      toast({
        title: 'Saved',
        description: 'Your edits have been saved',
      });

      setIsEditing({ headline: false, about: false });
      await fetchProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save edits',
        variant: 'destructive'
      });
    }
  };

  const exportProfile = (format: 'txt' | 'pdf') => {
    const content = `
LinkedIn Profile - Optimized by AutoJobr

HEADLINE:
${editedHeadline}

ABOUT SECTION:
${editedAbout}

TOP KEYWORDS:
${profile?.topKeywords.join(', ')}
    `.trim();

    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'linkedin-profile-optimized.txt';
      a.click();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If still no user after loading, show error message instead of blank screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Please log in to access LinkedIn Optimizer</p>
            <Button onClick={() => setLocation('/auth-page?redirect=/linkedin-optimizer')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPremium = profile?.isPremium || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-blue-600" />
              LinkedIn Profile Optimizer
            </h1>
            <p className="text-gray-600 mt-2">AI-powered profile enhancement</p>
          </div>
          {!isPremium && (
            <Button onClick={() => setLocation('/job-seeker-premium')} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          )}
        </div>

        {/* Tier Badge & Stats */}
        <Card className="border-2 border-blue-200 bg-white/80 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Badge className={isPremium ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white text-lg py-2 px-4' : 'bg-blue-600 text-white text-lg py-2 px-4'}>
                  {isPremium ? '💎 PREMIUM USER' : '🆓 FREE TIER'}
                </Badge>
                <div className="text-sm text-gray-600">
                  {isPremium ? (
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      Unlimited Generations
                    </span>
                  ) : (
                    <span>Free Generations: {profile?.freeGenerationsRemaining || 0}/1 remaining</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{profile?.profileCompletenessScore}%</div>
                <div className="text-sm text-gray-600">Profile Complete</div>
              </div>
            </div>
            <Progress value={profile?.profileCompletenessScore || 0} className="mt-4 h-3" />
            {profile?.missingElements && profile.missingElements.length > 0 && (
              <div className="mt-3 text-sm text-amber-600">
                Missing: {profile.missingElements.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="headline">Headline</TabsTrigger>
            <TabsTrigger value="about">About Section</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Generate or regenerate specific sections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => handleGenerate()} 
                  disabled={generating || (!isPremium && profile?.freeGenerationsRemaining === 0)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {profile?.generatedHeadline ? 'Regenerate Full Profile' : 'Generate Full Profile'}
                </Button>

                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    onClick={() => handleGenerate({ headline: true })}
                    disabled={generating}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Headline Only
                  </Button>
                  <Button 
                    onClick={() => handleGenerate({ about: true })}
                    disabled={generating || !isPremium}
                    variant="outline"
                  >
                    {!isPremium && <Lock className="w-4 h-4 mr-2" />}
                    About Only
                  </Button>
                  <Button 
                    onClick={() => handleGenerate({ keywords: true })}
                    disabled={generating}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Keywords Only
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Feature Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">🆓 Free Tier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">✅ 1 profile optimization per month</div>
                  <div className="flex items-center gap-2">✅ Basic headline generation</div>
                  <div className="flex items-center gap-2">✅ Top 5 keywords</div>
                  <div className="flex items-center gap-2">✅ Profile completeness score</div>
                  <div className="flex items-center gap-2">✅ Plain text export</div>
                  <div className="flex items-center gap-2 text-gray-400">❌ About section optimization</div>
                  <div className="flex items-center gap-2 text-gray-400">❌ A/B testing</div>
                  <div className="flex items-center gap-2 text-gray-400">❌ Advanced analytics</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-600" />
                    💎 Premium Tier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-semibold">⭐ Unlimited optimizations</div>
                  <div className="flex items-center gap-2 font-semibold">⭐ Full about section (3 versions)</div>
                  <div className="flex items-center gap-2 font-semibold">⭐ Top 10 keywords + density analysis</div>
                  <div className="flex items-center gap-2 font-semibold">⭐ Skills gap analysis</div>
                  <div className="flex items-center gap-2 font-semibold">⭐ Endorsement templates</div>
                  <div className="flex items-center gap-2 font-semibold">⭐ Weekly content calendar</div>
                  <div className="flex items-center gap-2 font-semibold">⭐ Competitor analysis</div>
                  <div className="flex items-center gap-2 font-semibold">⭐ Search visibility score</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Headline Tab */}
          <TabsContent value="headline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Optimized Headline</span>
                  <Button 
                    onClick={() => handleGenerate({ headline: true })}
                    disabled={generating}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </CardTitle>
                <CardDescription>Your professional LinkedIn headline</CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.generatedHeadline ? (
                  <div className="space-y-4">
                    {isEditing.headline ? (
                      <>
                        <Textarea
                          value={editedHeadline}
                          onChange={(e) => setEditedHeadline(e.target.value)}
                          rows={3}
                          className="font-medium"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdits}>Save Changes</Button>
                          <Button variant="outline" onClick={() => {
                            setEditedHeadline(profile.generatedHeadline || '');
                            setIsEditing({ ...isEditing, headline: false });
                          }}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <p className="text-lg font-medium text-gray-900">{editedHeadline}</p>
                        </div>
                        <Button variant="outline" onClick={() => setIsEditing({ ...isEditing, headline: true })}>
                          Edit Headline
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No headline generated yet. Click "Generate Full Profile" to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>About Section</span>
                  {isPremium && (
                    <Button 
                      onClick={() => handleGenerate({ about: true })}
                      disabled={generating}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {isPremium ? 'Your optimized about section' : 'Premium feature - Upgrade to unlock'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isPremium ? (
                  <div className="text-center py-12 space-y-4">
                    <Lock className="w-16 h-16 mx-auto text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-700">Premium Feature</h3>
                    <p className="text-gray-600">Unlock full about section optimization with 3 A/B tested versions</p>
                    <Button onClick={() => setLocation('/job-seeker-premium')} className="bg-gradient-to-r from-amber-500 to-orange-600">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                ) : profile?.generatedAbout ? (
                  <div className="space-y-4">
                    {isEditing.about ? (
                      <>
                        <Textarea
                          value={editedAbout}
                          onChange={(e) => setEditedAbout(e.target.value)}
                          rows={12}
                          className="font-medium"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdits}>Save Changes</Button>
                          <Button variant="outline" onClick={() => {
                            setEditedAbout(profile.generatedAbout || '');
                            setIsEditing({ ...isEditing, about: false });
                          }}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200 whitespace-pre-wrap">
                          <p className="text-gray-900">{editedAbout}</p>
                        </div>
                        <Button variant="outline" onClick={() => setIsEditing({ ...isEditing, about: true })}>
                          Edit About Section
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No about section generated yet. Click "Generate Full Profile" to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Top Keywords</span>
                  <Button 
                    onClick={() => handleGenerate({ keywords: true })}
                    disabled={generating}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </CardTitle>
                <CardDescription>
                  {isPremium ? 'Top 10 industry keywords with density analysis' : 'Top 5 essential keywords'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.topKeywords && profile.topKeywords.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {profile.topKeywords.map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-base py-2 px-4 bg-blue-100 text-blue-800">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    {!isPremium && (
                      <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Upgrade to Premium for 10 keywords, density charts, and trending analysis
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No keywords generated yet. Click "Generate Full Profile" to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Section */}
        {(profile?.generatedHeadline || profile?.generatedAbout) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={() => exportProfile('txt')} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export as Text
                </Button>
                {!isPremium && (
                  <Button disabled variant="outline" className="opacity-50">
                    <Lock className="w-4 h-4 mr-2" />
                    PDF Export (Premium)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
