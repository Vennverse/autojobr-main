import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trophy, Star, Clock, Users, Crown, Target, CheckCircle, XCircle, CreditCard, Gift, Calendar, Sparkles, Award, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRankingTestUsage } from '@/hooks/useRankingTestUsage';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

export default function RankingTests() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [leaderboardType, setLeaderboardType] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch available test categories and domains
  const { data: categories = { categories: [], domains: [] } } = useQuery({
    queryKey: ['/api/ranking-tests/categories'],
    queryFn: async () => {
      try {
        const res = await apiRequest('/api/ranking-tests/categories', 'GET');
        return res;
      } catch (error) {
        // Fallback data when not authenticated
        console.log('Using fallback categories - authentication required');
        return {
          categories: ["technical", "behavioral", "general"],
          domains: ["general", "technical", "finance", "marketing", "sales", "hr", "accounting"]
        };
      }
    }
  });

  // Fetch user's test history
  const { data: testHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/ranking-tests/history'],
    queryFn: async () => {
      try {
        const res = await apiRequest('/api/ranking-tests/history', 'GET');
        return res;
      } catch (error) {
        console.log('Test history unavailable - authentication required');
        return [];
      }
    }
  });

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/ranking-tests/leaderboard', selectedCategory, selectedDomain, leaderboardType],
    queryFn: async () => {
      if (!selectedCategory || !selectedDomain) return [];
      try {
        const res = await apiRequest(`/api/ranking-tests/leaderboard?category=${selectedCategory}&domain=${selectedDomain}&type=${leaderboardType}&limit=10`, 'GET');
        return res;
      } catch (error) {
        console.log('Leaderboard unavailable - authentication required');
        return [];
      }
    },
    enabled: !!selectedCategory && !!selectedDomain
  });

  // Create new test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: { category: string; domain: string; difficultyLevel: string }) => {
      const response = await apiRequest('/api/ranking-tests/create', 'POST', testData);
      return response;
    },
    onSuccess: (test) => {
      toast({
        title: "Test Started!",
        description: "Your ranking test has started. Good luck! 🚀",
      });
      // Redirect to test taking page
      window.location.href = `/test/${test.id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test",
        variant: "destructive",
      });
    }
  });

  const handleCreateTest = () => {
    if (!selectedCategory || !selectedDomain) {
      toast({
        title: "Missing Information",
        description: "Please select category and domain",
        variant: "destructive",
      });
      return;
    }

    createTestMutation.mutate({
      category: selectedCategory,
      domain: selectedDomain,
      difficultyLevel: 'expert'
    });
  };

  const difficulties = [
    { value: 'beginner', label: 'Beginner', description: 'Basic questions' },
    { value: 'intermediate', label: 'Intermediate', description: 'Moderate difficulty' },
    { value: 'advanced', label: 'Advanced', description: 'Challenging questions' },
    { value: 'expert', label: 'Expert', description: 'Very difficult questions' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-4 h-4 text-orange-500" />;
    return <Target className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            100% Free • No Payment Required
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Ranking Test System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Compete with top talent, showcase your skills, and get discovered by recruiters.
            Take unlimited free tests and climb the leaderboard! 🚀
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Creation Section */}
          <div className="lg:col-span-2">
            <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Award className="w-6 h-6 text-blue-600" />
                  Start Your Free Ranking Test
                </CardTitle>
                <CardDescription className="text-base">
                  Select your test parameters and start competing - completely free! 🎉
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <Target className="w-4 h-4 inline mr-1" />
                      Category
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.categories.map((cat: string) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Domain
                    </label>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger className="border-2">
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.domains.map((domain: string) => (
                          <SelectItem key={domain} value={domain}>
                            {domain.charAt(0).toUpperCase() + domain.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-900 dark:text-amber-100">Expert Level Challenge</span>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    All ranking tests are set to expert difficulty to ensure fair competition among top performers.
                    This is where the best showcase their skills! 💪
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 dark:text-blue-100">Why Take Ranking Tests?</span>
                  </div>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Weekly top 10 performers get featured to recruiters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Monthly top 5 performers get premium recruiter exposure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>100% free - take as many tests as you want!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Public rankings to showcase your expertise</span>
                    </li>
                  </ul>
                </div>

                {/* Start Test Button */}
                <Button 
                  onClick={handleCreateTest}
                  disabled={!selectedCategory || !selectedDomain || createTestMutation.isPending}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {createTestMutation.isPending ? 'Starting Test...' : 'Start Free Test Now'}
                </Button>
              </CardContent>
            </Card>

            {/* Test History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Your Test History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading test history...</p>
                  </div>
                ) : testHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No tests taken yet. Create your first ranking test!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {testHistory.map((test: any) => (
                      <div key={test.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getRankBadge(test.rank || 0)}
                            <span className="font-medium">{test.testTitle}</span>
                          </div>
                          <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                            {test.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Score:</span>
                            <span className={`ml-1 font-medium ${getScoreColor(test.percentageScore)}`}>
                              {test.percentageScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Rank:</span>
                            <span className="ml-1 font-medium">#{test.rank || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Time:</span>
                            <span className="ml-1 font-medium">{Math.round(test.timeSpent / 60)}m</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Payment:</span>
                            <span className="ml-1 font-medium">
                              {test.paymentStatus === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-500 inline" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 inline" />
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Leaderboard
                </CardTitle>
                <CardDescription>
                  Top performers in selected category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select value={leaderboardType} onValueChange={(value: string) => setLeaderboardType(value as 'weekly' | 'monthly' | 'all-time')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="all-time">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!selectedCategory || !selectedDomain ? (
                  <p className="text-gray-500 text-center py-8">
                    Select category and domain to view leaderboard
                  </p>
                ) : leaderboardLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading leaderboard...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No rankings yet. Be the first to take a test!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry: any, index: number) => (
                      <div key={entry.userId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getRankBadge(entry.rank)}
                          <span className="font-bold text-lg">#{entry.rank}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {entry.userName} {entry.userLastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            Score: <span className={getScoreColor(entry.score)}>{entry.score}%</span>
                          </div>
                        </div>
                        {entry.rank <= 10 && (
                          <Badge variant="secondary" className="text-xs">
                            Recruiter Visible
                          </Badge>
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