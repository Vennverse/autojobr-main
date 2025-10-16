
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

  // Show loading state
  if (isLoading) {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <Lightbulb className="h-5 w-5 animate-pulse" />
            💡 Loading Career Insights...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Don't show if no insights
  if (!insights?.insights?.length) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <Lightbulb className="h-5 w-5" />
          💡 Career Co-Pilot Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.insights.slice(0, 3).map((insight, index) => {
          const Icon = iconMap[insight.type as keyof typeof iconMap] || Lightbulb;
          
          return (
            <div 
              key={index}
              className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Icon className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {insight.title}
                    </h4>
                    <Badge className={priorityColors[insight.priority]} variant="outline">
                      {insight.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                    {insight.message}
                  </p>
                  
                  <Link href={insight.actionUrl}>
                    <Button size="sm" variant="outline" className="text-xs">
                      {insight.actionLabel}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        
        {insights.insights.length > 3 && (
          <p className="text-xs text-center text-purple-600 dark:text-purple-300">
            +{insights.insights.length - 3} more insights available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
