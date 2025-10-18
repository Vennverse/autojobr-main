import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Copy, Lock, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LinkedInOptimizer() {
  const { toast } = useToast();
  const [editedHeadline, setEditedHeadline] = useState("");
  const [editedAbout, setEditedAbout] = useState("");

  // Fetch existing profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/linkedin-optimizer"],
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => await apiRequest("/api/linkedin-optimizer/generate", "POST", {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/linkedin-optimizer"] });
      setEditedHeadline(data.headline || "");
      setEditedAbout(data.about || "");
      toast({ title: "✨ Profile generated!", description: "Your LinkedIn profile has been optimized." });
    },
    onError: (error: any) => {
      if (error.requiresUpgrade) {
        toast({ 
          title: "🔒 Premium Required", 
          description: error.error || "Upgrade to continue", 
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
      toast({ title: "💾 Saved!", description: "Your edits have been saved." });
    }
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `📋 Copied ${label}!`, description: "Paste it into your LinkedIn profile." });
  };

  if (isLoading) {
    return <div className="container mx-auto py-8" data-testid="loading-state">Loading...</div>;
  }

  const isPremium = profile?.isPremium ?? false;
  const completenessScore = profile?.profileCompletenessScore || 0;
  const missingElements = profile?.missingElements || [];
  const topKeywords = profile?.topKeywords || [];

  return (
    <div className="container mx-auto py-8 max-w-6xl" data-testid="linkedin-optimizer-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="page-title">
          LinkedIn Profile Optimizer
        </h1>
        <p className="text-muted-foreground" data-testid="page-description">
          10x your visibility | 3x more opportunities
        </p>
      </div>

      {/* Premium Upgrade Banner */}
      {!isPremium && (
        <Card className="mb-6 border-primary" data-testid="upgrade-banner">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">🚀 Unlock Full Power</h3>
                <p className="text-sm text-muted-foreground">
                  Get unlimited headline variations, AI About section, experience optimization & more
                </p>
              </div>
              <Button variant="default" data-testid="button-upgrade">
                Upgrade to Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Completeness Score */}
      <Card className="mb-6" data-testid="completeness-card">
        <CardHeader>
          <CardTitle>Profile Strength</CardTitle>
          <CardDescription>Your LinkedIn profile completeness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium" data-testid="text-completeness-score">{completenessScore}%</span>
                <span className="text-sm text-muted-foreground">
                  {completenessScore >= 80 ? "Excellent" : completenessScore >= 60 ? "Good" : "Needs Work"}
                </span>
              </div>
              <Progress value={completenessScore} className="h-2" data-testid="progress-completeness" />
            </div>

            {missingElements.length > 0 && (
              <div data-testid="missing-elements">
                <p className="text-sm font-medium mb-2">Missing:</p>
                <div className="flex flex-wrap gap-2">
                  {missingElements.map((item: string, i: number) => (
                    <Badge key={i} variant="outline" data-testid={`badge-missing-${i}`}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="mb-6">
        <Button 
          onClick={() => generateMutation.mutate()} 
          disabled={generateMutation.isPending}
          size="lg"
          className="w-full"
          data-testid="button-generate"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {generateMutation.isPending ? "Generating..." : "Generate Optimized Profile"}
        </Button>
      </div>

      {/* Display generated profile content */}
      {profile?.generatedHeadline && profile?.generatedAbout && (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ✨ Optimized LinkedIn Profile
              </CardTitle>
              <CardDescription>
                Use these AI-generated suggestions to enhance your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Headline */}
              {profile.generatedHeadline && (
                <div>
                  <h3 className="font-semibold mb-2">📌 Optimized Headline</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{profile.generatedHeadline}</p>
                  </div>
                </div>
              )}

              {/* About Section */}
              {profile.generatedAbout && (
                <div>
                  <h3 className="font-semibold mb-2">📝 About Section</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{profile.generatedAbout}</p>
                  </div>
                </div>
              )}

              {/* Top Keywords */}
              {topKeywords.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">🔑 Top Keywords to Use</h3>
                  <div className="flex flex-wrap gap-2">
                    {topKeywords.map((keyword: string, i: number) => (
                      <Badge key={i} variant="secondary" data-testid={`badge-keyword-${i}`}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            onClick={() => {
              const content = `
LINKEDIN HEADLINE:
${profile.generatedHeadline || 'N/A'}

ABOUT SECTION:
${profile.generatedAbout || 'N/A'}

TOP KEYWORDS:
${topKeywords?.join(', ') || 'N/A'}
              `.trim();
              navigator.clipboard.writeText(content);
              toast({ title: "📋 Copied Profile Content!", description: "Paste it into your LinkedIn profile." });
            }}
            variant="outline"
            className="w-full"
            data-testid="button-copy-all"
          >
            📋 Copy All to Clipboard
          </Button>
        </div>
      )}

      {/* Headline Section (Editable) */}
      {profile?.generatedHeadline && (
        <Card className="mb-6" data-testid="card-headline">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Edit Headline</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(editedHeadline || profile.generatedHeadline, "Headline")}
                data-testid="button-copy-headline"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>Your professional tagline (120 chars max)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={editedHeadline || profile.generatedHeadline}
              onChange={(e) => setEditedHeadline(e.target.value)}
              className="min-h-[80px]"
              placeholder="AI-generated headline will appear here"
              data-testid="textarea-headline"
            />
          </CardContent>
        </Card>
      )}

      {/* About Section (Editable) */}
      {profile?.generatedAbout && (
        <Card className="mb-6" data-testid="card-about">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CardTitle>Edit About Section</CardTitle>
                {!isPremium && <Lock className="w-4 h-4 text-muted-foreground" />}
              </div>
              {isPremium && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(editedAbout || profile.generatedAbout, "About")}
                  data-testid="button-copy-about"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
            <CardDescription>Your professional story with measurable impact</CardDescription>
          </CardHeader>
          <CardContent>
            {isPremium ? (
              <Textarea 
                value={editedAbout || profile.generatedAbout}
                onChange={(e) => setEditedAbout(e.target.value)}
                className="min-h-[200px]"
                placeholder="AI-generated About section"
                data-testid="textarea-about"
              />
            ) : (
              <div className="bg-muted p-6 rounded-lg text-center" data-testid="about-locked">
                <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-2">Premium Feature</p>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock AI-generated About section with compelling storytelling
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Keywords (Redundant if shown above, but kept for potential different display) */}
      {topKeywords.length > 0 && (
        <Card className="mb-6" data-testid="card-keywords">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Keywords for Your Role
            </CardTitle>
            <CardDescription>
              {isPremium ? "All 10 keywords" : "Top 5 keywords (Premium: 10)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map((keyword: string, i: number) => (
                <Badge key={i} variant="secondary" data-testid={`badge-keyword-${i}`}>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {(editedHeadline || editedAbout) && (
        <Button 
          onClick={() => saveEditsMutation.mutate()}
          disabled={saveEditsMutation.isPending}
          variant="outline"
          className="w-full"
          data-testid="button-save"
        >
          Save Edits
        </Button>
      )}
    </div>
  );
}