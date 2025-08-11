import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Crown, TrendingUp, Zap, Trophy, Gift, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useRankingTestUsage } from "@/hooks/useRankingTestUsage";

interface UsageReport {
  subscription: any;
  usage: Record<string, number>;
  limits: Record<string, number>;
  percentages: Record<string, number>;
  upgradeRecommended: boolean;
}

export default function UsageMonitoringWidget() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: usageReport, isLoading, error } = useQuery({
    queryKey: ['/api/usage/report', user?.id, user?.planType], // Include user data in query key
    refetchInterval: 60000, // Refresh every minute
    retry: 1, // Only retry once to avoid excessive requests
    enabled: !!user, // Only fetch when user is available
  });

  // Get ranking test usage for premium users
  const { 
    canUseFreeTest, 
    remainingFreeTests, 
    nextResetDate, 
    isPremium,
    usage: rankingUsage 
  } = useRankingTestUsage();

  // Extract ranking test data from main usage report if available
  const getFreeRankingTestData = () => {
    if (usageReport && usageReport.usage && usageReport.limits) {
      const freeUsed = usageReport.usage.freeRankingTests || 0;
      const freeLimit = usageReport.limits.freeRankingTests || (isPremium ? 1 : 0);
      const remaining = Math.max(0, freeLimit - freeUsed);
      
      return {
        used: freeUsed,
        limit: freeLimit,
        remaining: remaining,
        canUse: isPremium && remaining > 0
      };
    }
    
    // Fallback to separate hook data
    return {
      used: rankingUsage?.monthlyFreeUsed || 0,
      limit: rankingUsage?.monthlyFreeLimit || (isPremium ? 1 : 0),
      remaining: remainingFreeTests,
      canUse: canUseFreeTest
    };
  };

  const freeRankingData = getFreeRankingTestData();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !usageReport) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <p>Unable to load usage data</p>
        </CardContent>
      </Card>
    );
  }

  const report: UsageReport = usageReport;
  const isFreeTier = !report.subscription || !report.subscription.isActive;
  const showUpgradePrompt = report.upgradeRecommended || isFreeTier;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return "Unlimited";
    return limit.toLocaleString();
  };

  const formatUsageItem = (key: string) => {
    const labels: Record<string, string> = {
      // Job seeker metrics
      resumeUploads: "Resume Uploads",
      jobApplications: "Job Applications",
      testAssignmentsReceived: "Test Assignments",
      messagesUsed: "Messages Sent",
      // Recruiter metrics
      jobPostings: "Job Postings",
      applicantsTotal: "Total Applicants",
      testInterviewAssignments: "Test/Interview Assignments",
      // Common metrics
      interviews: "Interviews",
      candidates: "Candidates",
      rankingTests: "Ranking Tests (Paid)",
      freeRankingTests: "Free Ranking Tests"
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {showUpgradePrompt && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Crown className="h-5 w-5" />
              {isFreeTier ? "Upgrade to Premium" : "Usage Limit Warning"}
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              {isFreeTier 
                ? "You're on the free tier with limited features. Upgrade now for unlimited access!"
                : "You're approaching your monthly limits. Consider upgrading for more usage."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                // Get user type from actual API data rather than URL guessing
                if (report.subscription?.userType === 'recruiter') {
                  setLocation('/recruiter-premium');
                } else {
                  setLocation('/job-seeker-premium');
                }
              }}
              className="w-full"
              size="sm"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage This Month
          </CardTitle>
          {report.subscription && (
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {report.subscription.tierDetails?.name || 'Premium'}
              </Badge>
              {report.subscription.isActive && (
                <Badge variant="outline">
                  {report.subscription.daysRemaining} days left
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(report.usage).map(([key, used]) => {
            const limit = report.limits[key] || -1;
            const percentage = report.percentages[key] || 0;
            
            if (limit === 0) return null; // Skip features not available
            
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span>{formatUsageItem(key)}</span>
                  <span className={getUsageColor(percentage)}>
                    {used} / {formatLimit(limit)}
                  </span>
                </div>
                {limit > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={percentage} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-xs ${getUsageColor(percentage)}`}>
                      {percentage}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          
          {isFreeTier && Object.keys(report.usage).length === 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Start Using Features</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Begin using AutoJobr features to see your usage statistics here.
              </p>
            </div>
          )}
          
          {isFreeTier && Object.keys(report.usage).length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Free Tier Active</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You're using the free tier. Upgrade for unlimited access to all features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Tests Premium Benefits */}
      {isPremium && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Trophy className="h-5 w-5" />
              Ranking Tests
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Premium monthly benefits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Monthly Free Tests</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                {freeRankingData.remaining} remaining
              </Badge>
            </div>
            
            {nextResetDate && (
              <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                <Calendar className="h-3 w-3" />
                <span>Resets: {nextResetDate.toLocaleDateString()}</span>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => setLocation('/ranking-tests')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Take Ranking Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking Tests Upgrade Prompt for Free Users */}
      {!isPremium && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Trophy className="h-5 w-5" />
              Ranking Tests
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Premium feature available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
              <Crown className="h-4 w-4" />
              <span>Get 1 free ranking test every month with Premium!</span>
            </div>
            
            <div className="text-xs text-amber-700 dark:text-amber-300">
              • Compete for top rankings
              • Get noticed by recruiters
              • Save $12/year on tests
            </div>
            
            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700 space-y-2">
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => setLocation('/job-seeker-premium')}
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => setLocation('/ranking-tests')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Take Paid Test ($1)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}