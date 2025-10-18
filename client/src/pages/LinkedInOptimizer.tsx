
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Copy, Lock, TrendingUp, CheckCircle2, AlertCircle, RefreshCw, Crown, Zap, BarChart3, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LinkedInOptimizer() {
  const { toast } = useToast();
  const [editedHeadline, setEditedHeadline] = useState("");
  const [editedAbout, setEditedAbout] = useState("");
  const [regenerateOptions, setRegenerateOptions] = useState({
    headline: false,
    about: false,
    keywords: false
  });

  // Fetch existing profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/linkedin-optimizer"],
  });

  // Generate mutation with selective regeneration
  const generateMutation = useMutation({
    mutationFn: async () => await apiRequest("/api/linkedin-optimizer/generate", "POST", { regenerate: regenerateOptions }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/linkedin-optimizer"] });
      if (data.headline) setEditedHeadline(data.headline);
      if (data.about) setEditedAbout(data.about);
      toast({ 
        title: data.isPremium ? "✨ Profile generated!" : "🎉 Free generation complete!", 
        description: data.message 
      });
      // Reset regeneration options
      setRegenerateOptions({ headline: false, about: false, keywords: false });
    },
    onError: (error: any) => {
      if (error.requiresUpgrade) {
        toast({ 
          title: "🔒 Upgrade Required", 
          description: error.message, 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", description: "Failed to generate profile", variant: "destructive" });
      }
    }
  });

  // Save edits mutation
  const saveEditsMutation = useMutation({
    mutationFn: async () => 
      await apiRequest("/api/linkedin-optimizer/save-edits", "POST", {
        headline: editedHeadline,
        about: editedAbout
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/linkedin-optimizer"] });
      toast({ title: "💾 Saved!", description: "Your edits have been saved." });
    }
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `📋 Copied ${label}!`, description: "Paste it into LinkedIn." });
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  const isPremium = profile?.isPremium ?? false;
  const completenessScore = profile?.profileCompletenessScore || 0;
  const missingElements = profile?.missingElements || [];
  const topKeywords = profile?.topKeywords || [];
  const freeGenerationsRemaining = profile?.freeGenerationsRemaining ?? 1;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          LinkedIn Profile Optimizer
          {isPremium && <Crown className="w-8 h-8 text-yellow-500" />}
        </h1>
        <p className="text-muted-foreground">
          {isPremium ? "Premium: Unlimited optimizations" : "Free: 1 optimization per month"}
        </p>
      </div>

      {/* Free Tier Banner */}
      {!isPremium && (
        <Card className="mb-6 border-gradient-to-r from-yellow-400 to-orange-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  🚀 Unlock Full Power
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Premium gets: Unlimited generations • Full About section • 10 keywords • A/B testing • Monthly refresh
                </p>
                <p className="text-sm font-medium text-yellow-700">
                  {freeGenerationsRemaining > 0 
                    ? `You have ${freeGenerationsRemaining} free generation remaining this month` 
                    : "Free limit reached - Upgrade for unlimited access"}
                </p>
              </div>
              <Button variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500">
                Upgrade to Premium - $5/mo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Profile Strength</span>
            </div>
            <div className="text-3xl font-bold mb-2">{completenessScore}%</div>
            <Progress value={completenessScore} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {completenessScore >= 80 ? "Excellent!" : completenessScore >= 50 ? "Good progress" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Keywords Optimized</span>
            </div>
            <div className="text-3xl font-bold mb-2">{topKeywords.length}/{isPremium ? 10 : 5}</div>
            <p className="text-xs text-muted-foreground">
              {isPremium ? "Premium: All 10 keywords" : "Free: Top 5 keywords"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">Visibility Boost</span>
            </div>
            <div className="text-3xl font-bold mb-2">+{Math.round(completenessScore * 2.5)}%</div>
            <p className="text-xs text-muted-foreground">
              Estimated search visibility increase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Selective Regeneration Controls (Premium Only) */}
      {isPremium && profile?.generatedHeadline && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Selective Regeneration
            </CardTitle>
            <CardDescription>Choose what to regenerate (saves AI tokens)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="regen-headline" 
                  checked={regenerateOptions.headline}
                  onCheckedChange={(checked) => setRegenerateOptions(prev => ({ ...prev, headline: checked }))}
                />
                <Label htmlFor="regen-headline">Headline</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="regen-about" 
                  checked={regenerateOptions.about}
                  onCheckedChange={(checked) => setRegenerateOptions(prev => ({ ...prev, about: checked }))}
                />
                <Label htmlFor="regen-about">About Section</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="regen-keywords" 
                  checked={regenerateOptions.keywords}
                  onCheckedChange={(checked) => setRegenerateOptions(prev => ({ ...prev, keywords: checked }))}
                />
                <Label htmlFor="regen-keywords">Keywords</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="mb-6">
        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={generateMutation.isPending || (!isPremium && freeGenerationsRemaining === 0)}
          size="lg"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {generateMutation.isPending 
            ? "Generating..." 
            : profile?.generatedHeadline 
              ? (Object.values(regenerateOptions).some(v => v) ? "Regenerate Selected" : "Regenerate All")
              : "Generate Optimized Profile"}
        </Button>
        {!isPremium && freeGenerationsRemaining === 0 && (
          <p className="text-sm text-red-600 mt-2 text-center">
            Free tier limit reached. Upgrade to Premium for unlimited generations.
          </p>
        )}
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          {/* Headline Preview */}
          {profile?.generatedHeadline && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>📌 Optimized Headline</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(profile.generatedHeadline, "Headline")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{profile.generatedHeadline}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* About Section Preview */}
          {isPremium && profile?.generatedAbout && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>📝 About Section</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(profile.generatedAbout, "About")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  <p className="text-sm">{profile.generatedAbout}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* About Section Locked (Free Tier) */}
          {!isPremium && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="p-6 text-center">
                <Lock className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                <h3 className="font-semibold mb-2">Premium Feature: Full About Section</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to get AI-generated About section with Problem→Solution→Impact structure
                </p>
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  Unlock for $5/month
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Keywords */}
          {topKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  🔑 Top Keywords
                </CardTitle>
                <CardDescription>
                  {isPremium ? "All 10 keywords for maximum visibility" : "Top 5 keywords (Premium: 10)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {topKeywords.map((keyword: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
                {!isPremium && (
                  <p className="text-xs text-muted-foreground mt-3">
                    💡 Premium unlocks 5 more industry-specific keywords
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="edit" className="space-y-6">
          {/* Edit Headline */}
          {profile?.generatedHeadline && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Headline</CardTitle>
                <CardDescription>Customize your professional tagline (120 chars max)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={editedHeadline || profile.generatedHeadline}
                  onChange={(e) => setEditedHeadline(e.target.value)}
                  className="min-h-[80px]"
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {(editedHeadline || profile.generatedHeadline).length}/120 characters
                </p>
              </CardContent>
            </Card>
          )}

          {/* Edit About */}
          {isPremium && profile?.generatedAbout && (
            <Card>
              <CardHeader>
                <CardTitle>Edit About Section</CardTitle>
                <CardDescription>Refine your professional story</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={editedAbout || profile.generatedAbout}
                  onChange={(e) => setEditedAbout(e.target.value)}
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          {(editedHeadline || editedAbout) && (
            <Button 
              onClick={() => saveEditsMutation.mutate()}
              disabled={saveEditsMutation.isPending}
              className="w-full"
            >
              💾 Save Edits
            </Button>
          )}
        </TabsContent>
      </Tabs>

      {/* Missing Elements Alert */}
      {missingElements.length > 0 && (
        <Card className="mt-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Boost your profile completeness</p>
                <p className="text-xs text-muted-foreground">
                  Missing: {missingElements.join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
