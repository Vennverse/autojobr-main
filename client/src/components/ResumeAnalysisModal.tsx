import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Target,
  Zap,
  ArrowRight,
  Copy,
  Download,
  Edit3,
  BarChart3,
  BookOpen,
  Lightbulb,
  RefreshCw,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ResumeAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: any;
  onReanalyze?: () => void;
  onOptimize?: (section: string) => void;
}

interface ScoreBreakdownProps {
  breakdown: {
    keywords: { score: number; maxScore: number; details: string };
    formatting: { score: number; maxScore: number; details: string };
    content: { score: number; maxScore: number; details: string };
    atsCompatibility: { score: number; maxScore: number; details: string };
  };
}

interface InteractiveImprovementProps {
  recommendations: string[];
  rewriteSuggestions: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  onOptimize: (section: string) => void;
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ breakdown }) => {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreTextColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(breakdown).map(([key, data]) => {
        const percentage = (data.score / data.maxScore) * 100;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                  <span className={`text-lg font-bold ${getScoreTextColor(data.score, data.maxScore)}`}>
                    {data.score}/{data.maxScore}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{
                      background: `linear-gradient(to right, ${getScoreColor(data.score, data.maxScore)} 0%, ${getScoreColor(data.score, data.maxScore)} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
                    }}
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-300">{data.details}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

const InteractiveImprovement: React.FC<InteractiveImprovementProps> = ({ 
  recommendations, 
  rewriteSuggestions, 
  onOptimize 
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Quick Fix Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.slice(0, 4).map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              className="w-full text-left justify-between p-4 h-auto border-orange-200 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              onClick={() => onOptimize(`recommendation-${index}`)}
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{rec}</span>
              </div>
              <Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
            </Button>
          </motion.div>
        ))}
      </div>

      {/* AI Rewrite Suggestions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
          AI-Powered Rewrites
        </h4>
        {rewriteSuggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      Improvement #{index + 1}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSuggestion(
                        expandedSuggestion === index ? null : index
                      )}
                    >
                      {expandedSuggestion === index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    {expandedSuggestion === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Before:</p>
                          <p className="text-sm text-red-700 dark:text-red-300">{suggestion.original}</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">After:</p>
                          <p className="text-sm text-green-700 dark:text-green-300">{suggestion.improved}</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Why this works:</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">{suggestion.reason}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1" onClick={() => onOptimize(`rewrite-${index}`)}>
                            <Copy className="h-3 w-3 mr-1" />
                            Apply This Change
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const JobSpecificOptimization: React.FC<{ industryData: any; onOptimize: (section: string) => void }> = ({ 
  industryData, 
  onOptimize 
}) => {
  const [targetRole, setTargetRole] = useState("");

  // Safely access industryData properties with fallbacks
  const detectedIndustry = industryData?.detectedIndustry || "Technology";
  const industryKeywords = industryData?.industryKeywords || ["JavaScript", "React", "Node.js"];
  const industryStandards = industryData?.industryStandards || [];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
          <Target className="h-4 w-4 mr-2 text-blue-500" />
          Industry Analysis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Detected Industry</p>
            <Badge variant="outline" className="mt-1">{detectedIndustry}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Industry Keywords</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {industryKeywords.slice(0, 3).map((keyword: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">{keyword}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Standards Met</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {industryStandards.length}/5 Standards
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
            Optimize for Specific Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter target job title (e.g., Senior Frontend Developer)"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={() => onOptimize(`role-${targetRole}`)}>
              <Target className="h-4 w-4 mr-1" />
              Optimize
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Frontend Developer", "Product Manager", "Data Scientist", "UX Designer"].map((role, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetRole(role);
                  onOptimize(`preset-role-${role}`);
                }}
                className="justify-start"
              >
                <ArrowRight className="h-3 w-3 mr-2" />
                {role}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BeforeAfterComparison: React.FC<{ resumeData: any }> = ({ resumeData }) => {
  const improvements = {
    scoreIncrease: 39, // Example: 39% → 78%
    keywordsAdded: 12,
    achievementsEnhanced: 5,
    formattingFixed: 8
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="text-lg flex items-center text-red-700 dark:text-red-300">
              <XCircle className="h-5 w-5 mr-2" />
              Before Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ATS Score</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">39%</span>
              </div>
              <Progress value={39} className="h-2 bg-red-100" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Keywords</span>
                  <span className="text-red-600">8/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantified Achievements</span>
                  <span className="text-red-600">2/10</span>
                </div>
                <div className="flex justify-between">
                  <span>ATS Compatibility</span>
                  <span className="text-red-600">Poor</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* After */}
        <Card className="border-green-200">
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="text-lg flex items-center text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5 mr-2" />
              After Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ATS Score</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">78%</span>
              </div>
              <Progress value={78} className="h-2 bg-green-100" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Keywords</span>
                  <span className="text-green-600">18/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantified Achievements</span>
                  <span className="text-green-600">9/10</span>
                </div>
                <div className="flex justify-between">
                  <span>ATS Compatibility</span>
                  <span className="text-green-600">Excellent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Optimization Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+{improvements.scoreIncrease}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Score Increase</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{improvements.keywordsAdded}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Keywords Added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{improvements.achievementsEnhanced}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Achievements Enhanced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{improvements.formattingFixed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Issues Fixed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ResumeAnalysisModal: React.FC<ResumeAnalysisModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  onReanalyze,
  onOptimize = () => {}
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const analysis = resumeData?.analysis;

  if (!analysis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Resume Analysis - Enhanced Report
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-6 flex-shrink-0">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Score Breakdown</span>
            </TabsTrigger>
            <TabsTrigger value="improvements" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Quick Fixes</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Before/After</span>
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Job-Specific</span>
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Generate AI Resume</span>
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Detailed Analysis</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {analysis.atsScore}%
                      </div>
                      <p className="text-lg text-gray-600 dark:text-gray-300">Overall ATS Score</p>
                    </div>
                    
                    {analysis.scoreBreakdown && (
                      <ScoreBreakdown breakdown={analysis.scoreBreakdown} />
                    )}
                    
                    <div className="flex justify-center space-x-4">
                      <Button onClick={onReanalyze} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Re-analyze
                      </Button>
                      <Button variant="outline">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get Pro Tips
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="improvements" className="mt-0">
                  <InteractiveImprovement
                    recommendations={analysis.recommendations || []}
                    rewriteSuggestions={analysis.rewriteSuggestions || []}
                    onOptimize={onOptimize}
                  />
                </TabsContent>

                <TabsContent value="comparison" className="mt-0">
                  <BeforeAfterComparison resumeData={resumeData} />
                </TabsContent>

                <TabsContent value="optimization" className="mt-0">
                  <JobSpecificOptimization
                    industryData={analysis.industrySpecific || {}}
                    onOptimize={onOptimize}
                  />
                </TabsContent>

                <TabsContent value="detailed" className="mt-0">
                  <div className="space-y-6">
                    {/* Existing detailed analysis content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Strengths Found
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {(analysis.content?.strengthsFound || []).map((strength: string, index: number) => (
                              <div key={index} className="flex items-start space-x-2">
                                <Star className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{strength}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Areas for Improvement */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center text-orange-600">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Areas for Improvement
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {(analysis.recommendations || []).map((rec: string, index: number) => (
                              <div key={index} className="flex items-start space-x-2">
                                <Lightbulb className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Keywords Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Award className="h-5 w-5 mr-2 text-blue-500" />
                          Keyword Optimization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Missing Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                              {(analysis.keywordOptimization?.missingKeywords || []).map((keyword: string, index: number) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Suggested Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                              {(analysis.keywordOptimization?.suggestions || []).map((suggestion: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeAnalysisModal;