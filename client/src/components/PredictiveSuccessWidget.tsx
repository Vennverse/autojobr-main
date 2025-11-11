
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Target, 
  Users, 
  Clock, 
  DollarSign, 
  Lightbulb,
  Trophy,
  Zap,
  ChevronRight
} from "lucide-react";

interface SuccessPrediction {
  interviewProbability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  improvementSuggestions: string[];
  optimalApplyTime: string;
  competitorAnalysis: {
    expectedApplicants: number;
    yourRanking: number;
    strengthsVsCompetition: string[];
  };
  salaryNegotiationPower: number;
}

interface PredictiveSuccessWidgetProps {
  jobId: number;
  resumeContent: string;
  onPredictionComplete?: (prediction: SuccessPrediction) => void;
}

export default function PredictiveSuccessWidget({ 
  jobId, 
  resumeContent, 
  onPredictionComplete 
}: PredictiveSuccessWidgetProps) {
  const [showDetails, setShowDetails] = useState(false);

  const { data: prediction, isLoading, error } = useQuery<{
    success: boolean;
    prediction: SuccessPrediction;
  }>({
    queryKey: ['prediction', jobId],
    queryFn: async () => {
      const response = await fetch('/api/ai/predict-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, resumeContent })
      });
      
      if (!response.ok) throw new Error('Failed to get prediction');
      return response.json();
    },
    enabled: !!jobId && !!resumeContent
  });

  useEffect(() => {
    if (prediction?.prediction && onPredictionComplete) {
      onPredictionComplete(prediction.prediction);
    }
  }, [prediction, onPredictionComplete]);

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">
              🎯 Analyzing your success probability...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction?.success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-700">Failed to generate success prediction</p>
        </CardContent>
      </Card>
    );
  }

  const pred = prediction.prediction;
  const confidenceColor = {
    high: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100', 
    low: 'text-red-600 bg-red-100'
  }[pred.confidenceLevel];

  const probabilityColor = pred.interviewProbability >= 70 ? 'text-green-600' : 
                          pred.interviewProbability >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Target className="h-5 w-5" />
          🎯 ACE Intelligence: Success Prediction
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Prediction */}
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <div className={`text-4xl font-bold ${probabilityColor} mb-2`}>
            {pred.interviewProbability}%
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Interview Probability
          </p>
          <Badge className={confidenceColor}>
            {pred.confidenceLevel.toUpperCase()} Confidence
          </Badge>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Your Ranking</span>
            </div>
            <div className="text-xl font-bold text-orange-600">
              #{pred.competitorAnalysis.yourRanking}
            </div>
            <p className="text-xs text-gray-500">out of top 10</p>
          </div>

          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Competition</span>
            </div>
            <div className="text-xl font-bold text-purple-600">
              {pred.competitorAnalysis.expectedApplicants}
            </div>
            <p className="text-xs text-gray-500">expected applicants</p>
          </div>
        </div>

        {/* Optimal Timing */}
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
          <Clock className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              {pred.optimalApplyTime}
            </p>
            <p className="text-sm text-green-600 dark:text-green-300">
              Optimal application timing
            </p>
          </div>
        </div>

        {/* Salary Negotiation Power */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Salary Negotiation Power
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                Your leverage in negotiations
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {pred.salaryNegotiationPower}%
          </div>
        </div>

        {/* Competitive Advantages */}
        {pred.competitorAnalysis.strengthsVsCompetition.length > 0 && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-indigo-800 dark:text-indigo-200">
                Your Competitive Advantages
              </span>
            </div>
            <div className="space-y-1">
              {pred.competitorAnalysis.strengthsVsCompetition.map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-indigo-700 dark:text-indigo-300">
                    {strength}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {pred.improvementSuggestions.length > 0 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800 dark:text-orange-200">
                Success Optimization Tips
              </span>
            </div>
            <div className="space-y-2">
              {pred.improvementSuggestions.slice(0, showDetails ? undefined : 2).map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    {suggestion}
                  </span>
                </div>
              ))}
              
              {pred.improvementSuggestions.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-orange-600 hover:text-orange-700 p-0 h-auto"
                >
                  {showDetails ? 'Show Less' : `+${pred.improvementSuggestions.length - 2} More Tips`}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Success Probability Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Success Probability</span>
            <span className={`font-medium ${probabilityColor}`}>
              {pred.interviewProbability}%
            </span>
          </div>
          <Progress 
            value={pred.interviewProbability} 
            className="h-3"
          />
          <p className="text-xs text-gray-500 text-center">
            Based on AI analysis of 100K+ successful applications
          </p>
        </div>

        {/* Call to Action */}
        <div className="pt-2 border-t">
          <p className="text-xs text-center text-gray-500 mb-3">
            🎯 <strong>AutoJobr ACE Intelligence</strong> - Industry's first predictive success system
          </p>
          
          {pred.interviewProbability >= 70 ? (
            <div className="text-center p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-green-800 dark:text-green-200 font-medium">
                🚀 Excellent match! Apply now for maximum success.
              </p>
            </div>
          ) : pred.interviewProbability >= 50 ? (
            <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                💡 Good potential! Follow the optimization tips above.
              </p>
            </div>
          ) : (
            <div className="text-center p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                🎯 Consider optimizing your application before applying.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
