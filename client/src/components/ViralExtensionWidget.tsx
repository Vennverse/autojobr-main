
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Share2, 
  Trophy, 
  Star, 
  Gift,
  Crown,
  TrendingUp,
  Award,
  Zap,
  Network,
  Target,
  MessageCircle
} from "lucide-react";

interface ViralReward {
  type: 'referral' | 'intel_sharing' | 'application_success' | 'insider_tip';
  points: number;
  description: string;
  unlocks: string[];
}

interface JobIntelligence {
  jobUrl: string;
  company: string;
  totalAutoJobrApplicants: number;
  averageSuccessRate: number;
  salaryIntel: {
    reportedSalary?: number;
    reportedBy: number;
    negotiationTips: string[];
  };
  insiderTips: string[];
  applicationTiming: {
    optimalTime: string;
    competitorCount: number;
  };
}

interface ViralExtensionWidgetProps {
  jobUrl: string;
  onNetworkBoost?: (boost: any) => void;
}

export default function ViralExtensionWidget({ jobUrl, onNetworkBoost }: ViralExtensionWidgetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showIntelForm, setShowIntelForm] = useState(false);
  const [intelData, setIntelData] = useState({
    salaryInfo: '',
    interviewExperience: '',
    companyTips: '',
    applicationTips: ''
  });

  // Get viral leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['viral-leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/extension/viral-leaderboard');
      if (!response.ok) throw new Error('Failed to get leaderboard');
      return response.json();
    }
  });

  // Track application mutation
  const trackApplicationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/extension/track-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobUrl,
          applicationData: {
            timeToComplete: 120, // 2 minutes
            fieldsAutoFilled: 15
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to track application');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🚀 Application Tracked!",
        description: data.socialProof,
        duration: 5000,
      });
      
      if (onNetworkBoost) {
        onNetworkBoost(data);
      }
    }
  });

  // Share intelligence mutation
  const shareIntelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/extension/share-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobUrl,
          intelligence: intelData
        })
      });
      
      if (!response.ok) throw new Error('Failed to share intelligence');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🧠 Intelligence Shared!",
        description: `You earned ${data.rewards[0]?.points} points for helping the community!`,
        duration: 5000,
      });
      
      setShowIntelForm(false);
      setIntelData({ salaryInfo: '', interviewExperience: '', companyTips: '', applicationTips: '' });
      queryClient.invalidateQueries({ queryKey: ['viral-leaderboard'] });
    }
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/extension/create-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl })
      });
      
      if (!response.ok) throw new Error('Failed to create referral');
      return response.json();
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(`Check out this job! Apply with AutoJobr: ${jobUrl}?ref=${data.referralCode}`);
      toast({
        title: "🎯 Referral Link Created!",
        description: "Link copied to clipboard. Share with friends to earn rewards!",
        duration: 5000,
      });
    }
  });

  // Get application boost
  const { data: applicationBoost } = useQuery({
    queryKey: ['application-boost', jobUrl],
    queryFn: async () => {
      const response = await fetch('/api/extension/application-boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobUrl })
      });
      
      if (!response.ok) throw new Error('Failed to get application boost');
      return response.json();
    }
  });

  return (
    <div className="space-y-4">
      {/* Application Boost Card */}
      {applicationBoost?.success && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Network className="h-5 w-5" />
              🚀 ACE Network Effects Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-800">
                  {applicationBoost.boost.boostType.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {applicationBoost.boost.message}
              </p>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Your Network Advantages:
                </p>
                {applicationBoost.boost.advantagePoints.map((advantage: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-purple-700 dark:text-purple-300">
                      {advantage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Viral Extension Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Users className="h-5 w-5" />
            AutoJobr Network Intelligence
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Network Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => trackApplicationMutation.mutate()}
              disabled={trackApplicationMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Target className="h-4 w-4 mr-2" />
              Track Application
            </Button>

            <Button
              onClick={() => createReferralMutation.mutate()}
              disabled={createReferralMutation.isPending}
              variant="outline"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Create Referral
            </Button>
          </div>

          {/* Intelligence Sharing */}
          {!showIntelForm ? (
            <Button
              onClick={() => setShowIntelForm(true)}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              💡 Share Job Intelligence (+200 points)
            </Button>
          ) : (
            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-3">
                Share Your Intelligence
              </h4>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Salary info (e.g., $85k base + bonus)"
                  value={intelData.salaryInfo}
                  onChange={(e) => setIntelData({...intelData, salaryInfo: e.target.value})}
                  className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                <textarea
                  placeholder="Interview experience & tips..."
                  value={intelData.interviewExperience}
                  onChange={(e) => setIntelData({...intelData, interviewExperience: e.target.value})}
                  className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                />
                
                <textarea
                  placeholder="Company culture & application tips..."
                  value={intelData.applicationTips}
                  onChange={(e) => setIntelData({...intelData, applicationTips: e.target.value})}
                  className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => shareIntelMutation.mutate()}
                  disabled={shareIntelMutation.isPending}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Share & Earn 200 Points
                </Button>
                <Button
                  onClick={() => setShowIntelForm(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Community Leaderboard Preview */}
          {leaderboard?.success && (
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Community Leaders
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-blue-600">
                    {leaderboard.leaderboard.communityStats.totalApplications.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600">Community Applications</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-green-600">
                      {leaderboard.leaderboard.communityStats.averageSuccessRate}%
                    </div>
                    <p className="text-gray-600">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">
                      {leaderboard.leaderboard.communityStats.jobsWithIntel.toLocaleString()}
                    </div>
                    <p className="text-gray-600">Jobs with Intel</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Viral Features Showcase */}
          <div className="text-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-indigo-800 dark:text-indigo-200">
                Network Power Active
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <Award className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                <p className="text-blue-700 dark:text-blue-300">Job Intel</p>
              </div>
              <div className="text-center">
                <Users className="h-4 w-4 mx-auto text-green-500 mb-1" />
                <p className="text-green-700 dark:text-green-300">Referrals</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                <p className="text-purple-700 dark:text-purple-300">Success Boost</p>
              </div>
            </div>
            
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-2">
              🚀 <strong>AutoJobr ACE Network</strong> - Industry's first viral job platform
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
