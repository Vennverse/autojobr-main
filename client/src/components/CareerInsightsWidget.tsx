
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Target,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";

interface CareerInsight {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
}

const iconMap = {
  'resume_optimization': FileText,
  'career_transition': TrendingUp,
  'salary_alert': DollarSign,
  'skill_gap': Target,
  'application_pattern': Sparkles
};

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
};

export default function CareerInsightsWidget() {
  const { data: insights, isLoading, error } = useQuery<{ success: boolean; insights: CareerInsight[] }>({
    queryKey: ['/api/career-insights'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Debug logging
  console.log('CareerInsightsWidget:', { isLoading, insights, error });

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-950 dark:to-pink-950 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <Lightbulb className="h-6 w-6 animate-pulse" />
            <span className="text-lg font-bold">💡 Analyzing Your Career Path...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-20 bg-purple-100 dark:bg-purple-900 rounded-lg animate-pulse"></div>
          <div className="h-20 bg-purple-100 dark:bg-purple-900 rounded-lg animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if no insights
  if (!insights?.insights?.length) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-950 dark:via-pink-950 dark:to-purple-900 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">💡 Career Co-Pilot Insights</h3>
              <p className="text-xs text-purple-100 mt-1">Personalized recommendations for your success</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0 text-sm px-3 py-1">
            {insights.insights.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {insights.insights.slice(0, 3).map((insight, index) => {
          const Icon = iconMap[insight.type as keyof typeof iconMap] || Lightbulb;
          const isHighPriority = insight.priority === 'high';
          
          return (
            <div 
              key={index}
              className={`bg-white dark:bg-gray-900 p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
                isHighPriority 
                  ? 'border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900' 
                  : 'border-purple-200 dark:border-purple-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  isHighPriority 
                    ? 'bg-gradient-to-br from-red-500 to-pink-500' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                } shadow-md`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                      {insight.title}
                    </h4>
                    <Badge className={`${priorityColors[insight.priority]} text-xs px-2 py-1 shrink-0`} variant="outline">
                      {insight.priority === 'high' ? '🔥 ' : insight.priority === 'medium' ? '⚡ ' : '💡 '}
                      {insight.priority.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {insight.message}
                  </p>
                  
                  <Link href={insight.actionUrl}>
                    <Button 
                      size="sm" 
                      className={`${
                        isHighPriority 
                          ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                      } text-white shadow-md hover:shadow-lg transition-all`}
                    >
                      {insight.actionLabel}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        
        {insights.insights.length > 3 && (
          <div className="text-center pt-2">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
              🎯 +{insights.insights.length - 3} more personalized insights waiting for you
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
