
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, 
  Target, 
  BarChart3, 
  Users, 
  Clock, 
  Award, 
  TrendingUp, 
  Lightbulb,
  MessageSquare,
  DollarSign,
  Search,
  Filter,
  Download,
  Star,
  Zap,
  Bot,
  ChartBar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";

interface AIInsight {
  metric: string;
  finding: string;
  recommendation: string;
  impact: string;
}

interface CandidateScore {
  candidateId: string;
  overallScore: number;
  recommendation: string;
  topSkills: string[];
  skillGaps: string[];
  experienceLevel: string;
  interviewFocus: string[];
  riskFactors: any;
}

export default function AIRecruiterDashboard() {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState("");

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  // Fetch job postings
  const { data: jobPostings = [] } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Fetch AI insights
  const { data: aiInsights } = useQuery({
    queryKey: ['/api/recruiter/ai-recruitment-insights'],
    enabled: user?.userType === 'recruiter'
  });

  // Fetch candidate scores for selected job
  const { data: candidateScores } = useQuery({
    queryKey: ['/api/recruiter/ai-candidate-scoring', selectedJob],
    enabled: !!selectedJob,
    queryFn: () => apiRequest(`/api/recruiter/ai-candidate-scoring?jobId=${selectedJob}`)
  });

  const handleJobOptimization = async () => {
    if (!selectedJob || !jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please select a job and provide the description.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const selectedJobData = jobPostings.find(job => job.id === selectedJob);
      const response = await apiRequest('/api/recruiter/ai-job-optimization', 'POST', {
        jobTitle: selectedJobData?.title,
        jobDescription,
        targetRole: selectedJobData?.title,
        industry: "Technology",
        experienceLevel: "Mid-level"
      });

      toast({
        title: "Job Description Optimized!",
        description: "AI has analyzed and optimized your job description.",
      });

      // You can display the optimization results in a modal or update the form
      console.log("Optimization results:", response.optimization);
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize job description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateInterviewQuestions = async () => {
    if (!selectedJob || !candidateProfile) {
      toast({
        title: "Missing Information",
        description: "Please select a job and provide candidate profile.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const selectedJobData = jobPostings.find(job => job.id === selectedJob);
      const response = await apiRequest('/api/recruiter/ai-interview-questions', 'POST', {
        jobTitle: selectedJobData?.title,
        candidateProfile: JSON.parse(candidateProfile || '{}'),
        focusAreas: ["technical skills", "problem solving", "team collaboration"],
        interviewType: "technical"
      });

      toast({
        title: "Interview Questions Generated!",
        description: "AI has created personalized interview questions.",
      });

      console.log("Interview questions:", response.questions);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate interview questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (user?.userType !== 'recruiter') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Access denied. Recruiter account required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RecruiterNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-600" />
                AI Recruiter Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Leverage artificial intelligence to revolutionize your hiring process
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2">
              <Bot className="w-4 h-4 mr-2" />
              AI-Powered
            </Badge>
          </div>

          {/* AI Insights Overview */}
          {aiInsights && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">Performance Score</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round((aiInsights.dataPoints?.averageApplicationsPerJob || 0) * 10)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on application rates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">AI Accuracy</span>
                  </div>
                  <div className="text-2xl font-bold">92%</div>
                  <p className="text-xs text-muted-foreground">
                    Candidate matching precision
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium">Time Saved</span>
                  </div>
                  <div className="text-2xl font-bold">18hrs</div>
                  <p className="text-xs text-muted-foreground">
                    Per week with AI automation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium">Quality Improvement</span>
                  </div>
                  <div className="text-2xl font-bold">+45%</div>
                  <p className="text-xs text-muted-foreground">
                    Better hire quality
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Tools Tabs */}
          <Tabs defaultValue="scoring" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="scoring" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Candidate Scoring
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Job Optimization
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Interview Questions
              </TabsTrigger>
              <TabsTrigger value="salary" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Salary Insights
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <ChartBar className="w-4 h-4" />
                AI Insights
              </TabsTrigger>
            </TabsList>

            {/* Candidate Scoring Tab */}
            <TabsContent value="scoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    AI Candidate Scoring & Ranking
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered scores and rankings for all candidates applying to your jobs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="job-select">Select Job Posting</Label>
                      <Select value={selectedJob} onValueChange={setSelectedJob}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a job posting to analyze candidates" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobPostings.map((job: any) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.title} ({job.applicationsCount || 0} applications)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {candidateScores && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">
                            AI Analysis Results ({candidateScores.totalCandidates} candidates)
                          </h3>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export Results
                          </Button>
                        </div>

                        <div className="grid gap-4">
                          {candidateScores.analyses?.slice(0, 5).map((analysis: CandidateScore) => (
                            <Card key={analysis.candidateId} className="border-l-4 border-l-blue-500">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold">Candidate #{analysis.candidateId}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {analysis.experienceLevel} level candidate
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {analysis.overallScore}%
                                    </div>
                                    <Badge 
                                      variant={
                                        analysis.recommendation === 'hire' ? 'default' :
                                        analysis.recommendation === 'interview' ? 'secondary' : 'outline'
                                      }
                                    >
                                      {analysis.recommendation}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium mb-2">Matching Skills</p>
                                    <div className="flex flex-wrap gap-1">
                                      {analysis.topSkills?.slice(0, 3).map((skill, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-2">Skill Gaps</p>
                                    <div className="flex flex-wrap gap-1">
                                      {analysis.skillGaps?.slice(0, 3).map((gap, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {gap}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <Separator className="my-3" />
                                
                                <div>
                                  <p className="text-sm font-medium mb-1">Interview Focus Areas</p>
                                  <p className="text-sm text-muted-foreground">
                                    {analysis.interviewFocus?.join(', ')}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Job Optimization Tab */}
            <TabsContent value="optimization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    AI Job Description Optimization
                  </CardTitle>
                  <CardDescription>
                    Optimize your job descriptions for better candidate attraction and ATS compatibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="job-select-opt">Select Job to Optimize</Label>
                      <Select value={selectedJob} onValueChange={setSelectedJob}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a job posting to optimize" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobPostings.map((job: any) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="job-description">Current Job Description</Label>
                      <Textarea
                        id="job-description"
                        placeholder="Paste your current job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={8}
                      />
                    </div>

                    <Button 
                      onClick={handleJobOptimization}
                      disabled={isOptimizing || !selectedJob}
                      className="w-full"
                    >
                      {isOptimizing ? (
                        <>
                          <Bot className="w-4 h-4 mr-2 animate-spin" />
                          AI Optimizing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Optimize with AI
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interview Questions Tab */}
            <TabsContent value="questions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    AI Interview Question Generator
                  </CardTitle>
                  <CardDescription>
                    Generate personalized interview questions based on candidate profiles and job requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="job-select-questions">Select Job Position</Label>
                      <Select value={selectedJob} onValueChange={setSelectedJob}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a job position" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobPostings.map((job: any) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="candidate-profile">Candidate Profile (JSON)</Label>
                      <Textarea
                        id="candidate-profile"
                        placeholder='{"skills": ["JavaScript", "React"], "experience": "3 years", "education": "Computer Science"}'
                        value={candidateProfile}
                        onChange={(e) => setCandidateProfile(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleGenerateInterviewQuestions}
                      disabled={isGeneratingQuestions || !selectedJob}
                      className="w-full"
                    >
                      {isGeneratingQuestions ? (
                        <>
                          <Bot className="w-4 h-4 mr-2 animate-spin" />
                          Generating Questions...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Generate AI Questions
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Salary Insights Tab */}
            <TabsContent value="salary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    AI Salary Benchmarking
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered salary insights and competitive analysis for your job positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Salary benchmarking feature coming soon. Get real-time market data and competitive analysis.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartBar className="h-5 w-5 text-purple-500" />
                    AI Recruitment Insights
                  </CardTitle>
                  <CardDescription>
                    Strategic insights and recommendations powered by artificial intelligence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiInsights?.insights?.performanceInsights && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
                        <div className="grid gap-4">
                          {aiInsights.insights.performanceInsights.map((insight: AIInsight, idx: number) => (
                            <Card key={idx} className="border-l-4 border-l-purple-500">
                              <CardContent className="pt-4">
                                <h4 className="font-semibold mb-2">{insight.metric}</h4>
                                <p className="text-sm text-muted-foreground mb-3">{insight.finding}</p>
                                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    💡 Recommendation: {insight.recommendation}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                    Expected Impact: {insight.impact}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
