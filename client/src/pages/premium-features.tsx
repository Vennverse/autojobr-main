import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/navbar";
import { PremiumFeaturesList } from "@/components/premium-features-list";
import { 
  Crown, 
  TrendingUp, 
  Zap, 
  Award,
  CheckCircle,
  Clock,
  Star,
  BarChart3
} from "lucide-react";

interface PremiumData {
  planType: string;
  usage: any;
  access: any;
  value: any;
  isPremium: boolean;
}

export default function PremiumFeaturesPage() {
  const [userType, setUserType] = useState<'job_seeker' | 'recruiter'>('job_seeker');

  const { data: premiumData, isLoading } = useQuery<PremiumData>({
    queryKey: ['/api/premium/features'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: user } = useQuery<{userType?: string}>({
    queryKey: ['/api/user']
  });

  useEffect(() => {
    if (user?.userType) {
      setUserType(user.userType === 'recruiter' ? 'recruiter' : 'job_seeker');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPremium = premiumData?.isPremium || false;
  const planType = premiumData?.planType || 'free';
  const usage = premiumData?.usage || {};
  const value = premiumData?.value || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                Premium Features
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {isPremium 
                  ? "You're enjoying all premium benefits! Here's your feature overview:"
                  : "Discover the power of premium features to accelerate your career:"
                }
              </p>
            </div>
            <div className="text-right">
              <Badge 
                className={`text-sm px-3 py-1 ${
                  isPremium 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {isPremium ? (
                  <>
                    <Star className="w-3 h-3 mr-1" />
                    {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
                  </>
                ) : (
                  'Free Plan'
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Premium Value Dashboard */}
        {isPremium && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Premium Value</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Savings</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                        ${value.totalSavings || 0}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Compared to pay-per-use pricing
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Features Used</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                        {value.featuresUsed?.length || 0}
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Premium features active
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Premium Since</p>
                      <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                        {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    Growing your career
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        {isPremium && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {userType === 'job_seeker' ? 'Resume Uploads' : 'Job Postings'}
                    </span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userType === 'job_seeker' ? usage.resumeUploads || 0 : usage.jobPostings || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Unlimited</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {userType === 'job_seeker' ? 'Applications' : 'Candidate Searches'}
                    </span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userType === 'job_seeker' ? usage.jobApplications || 0 : usage.candidateSearches || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Unlimited</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">AI Analysis</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage.aiAnalyses || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Unlimited</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {userType === 'job_seeker' ? 'Profile Views' : 'Resume Downloads'}
                    </span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userType === 'job_seeker' ? '∞' : usage.resumeDownloads || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Unlimited</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Premium Features List */}
        <PremiumFeaturesList 
          userType={userType} 
          currentPlan={planType as 'free' | 'premium' | 'enterprise'}
          className="mb-8"
        />

        {/* Success Stories */}
        {!isPremium && (
          <Card className="mb-8 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                Join 10,000+ Professionals Who've Accelerated Their Careers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3x More Interviews</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Premium users get 3x more interview calls with AI-optimized applications
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">50% Faster Hiring</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Advanced targeting helps you find the right candidates quickly
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Higher Salaries</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Premium features help negotiate 15% higher average salaries
                  </p>
                </div>
              </div>
              <div className="text-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3"
                  onClick={() => window.location.href = `/${userType}/premium`}
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Start Your Premium Journey
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}