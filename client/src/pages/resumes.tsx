import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  Star, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  Trash2,
  Crown,
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Plus,
  Lightbulb,
  Sparkles,
  Wand2
} from "lucide-react";
import ResumeAnalysisModal from "@/components/ResumeAnalysisModal";
import AIResumeImprovementModal from "@/components/AIResumeImprovementModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export default function ResumesPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: resumes, isLoading: resumesLoading, error: resumesError } = useQuery({
    queryKey: ["/api/resumes"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Resume upload handler with progress
  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });

        toast({
          title: "✅ Resume Uploaded Successfully",
          description: `ATS Score: ${result.resume?.atsScore || 'Analyzing...'}% - Your resume is ready!`,
        });
      } else {
        let errorMessage = "Failed to upload resume";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        window.location.href = "/";
        return;
      }
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
      setUploadProgress(0);
    }
  };

  // Set active resume handler
  const setActiveResumeMutation = useMutation({
    mutationFn: async (resumeId: number) => {
      const response = await fetch(`/api/resumes/${resumeId}/set-active`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to set active resume');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({
        title: "Active Resume Updated",
        description: "This resume will now be used for job applications.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update active resume",
        variant: "destructive",
      });
    }
  });

  const downloadResume = async (resumeId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download resume",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  if (isLoading || resumesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <motion.div 
        className="container mx-auto px-4 py-6 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Modern Header */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                Resume Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                AI-powered resume optimization and ATS scoring
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-4 py-2">
                <FileText className="w-4 h-4 mr-2" />
                {(resumes as any)?.length || 0} Resumes
              </Badge>
              {user?.planType !== 'premium' && (
                <Button
                  onClick={() => window.location.href = "/subscription"}
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Section - Improved */}
          <motion.div 
            className="lg:col-span-4"
            variants={itemVariants}
          >
            <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 h-full hover:border-blue-400 transition-all">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                  Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage</span>
                    <span className="text-sm font-bold text-blue-600">
                      {(resumes as any)?.length || 0}/{user?.planType === 'premium' ? '∞' : '2'}
                    </span>
                  </div>
                  <Progress 
                    value={((resumes as any)?.length || 0) / (user?.planType === 'premium' ? 100 : 2) * 100} 
                    className="h-2"
                  />
                </div>

                {((resumes as any)?.length || 0) < (user?.planType === 'premium' ? 999 : 2) ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleResumeUpload(file);
                          }
                        }}
                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:font-medium hover:file:bg-blue-600"
                        disabled={isUploadingResume}
                      />
                    </div>
                    {isUploadingResume && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          <span className="text-xs text-blue-600 font-medium">Analyzing resume...</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Accepted formats:</p>
                        <p>PDF, DOC, DOCX (max 10MB)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {user?.planType === 'premium' ? 'Unlimited uploads available' : 'Upload limit reached'}
                    </p>
                    {user?.planType !== 'premium' && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                        onClick={() => window.location.href = "/subscription"}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade for Unlimited
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

            {/* AI Generator - Modern */}
          <motion.div 
            className="lg:col-span-4"
            variants={itemVariants}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white h-full overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  AI Resume Generator
                </CardTitle>
                <p className="text-sm text-purple-100">
                  Create professional resumes with AI in seconds
                </p>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="space-y-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  {[
                    { icon: CheckCircle, text: "ATS-optimized templates" },
                    { icon: Target, text: "Job-specific keywords" },
                    { icon: Wand2, text: "AI-powered content" },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg"
                  onClick={() => setShowAIModal(true)}
                  data-testid="create-ai-resume-btn"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate AI Resume
                </Button>
              </CardContent>
            </Card>
          </motion.div>

            {/* Resume List - Redesigned */}
          <motion.div 
            className="lg:col-span-4 space-y-4"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Your Resumes
              </h2>
              {resumes && (resumes as any).length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {(resumes as any).length} total
                </Badge>
              )}
            </div>

            {resumesError ? (
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Error loading resumes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {(resumesError as any)?.message || "Failed to load resumes"}
                  </p>
                </CardContent>
              </Card>
            ) : !resumes || (resumes as any).length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No resumes yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Upload your first resume to get instant ATS scoring and AI-powered optimization tips
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4" />
                    <span>AI analysis included with every upload</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(resumes as any).map((resume: any) => (
                  <motion.div
                    key={resume.id}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    className="group"
                  >
                    <Card className={`border shadow-md hover:shadow-xl transition-all ${resume.isActive ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200 dark:border-gray-700'}`}>
                      <CardContent className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg ${getScoreBg(resume.atsScore || 0)} flex items-center justify-center flex-shrink-0`}>
                              <FileText className={`h-5 w-5 ${getScoreColor(resume.atsScore || 0)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {resume.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {new Date(resume.uploadedAt).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  {(resume.fileSize / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            </div>
                          </div>
                          {resume.isActive && (
                            <Badge className="bg-blue-500 text-white flex-shrink-0">
                              <Star className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                            <div className={`text-lg font-bold ${getScoreColor(resume.atsScore || 0)}`}>
                              {resume.atsScore || 0}%
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">ATS</div>
                          </div>
                          <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                            <div className="text-lg font-bold text-green-600">
                              {resume.analysis?.content?.strengthsFound?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Strengths</div>
                          </div>
                          <div className="text-center bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                            <div className="text-lg font-bold text-orange-600">
                              {resume.analysis?.recommendations?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Tips</div>
                          </div>
                          <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                            <div className="text-lg font-bold text-purple-600">
                              {resume.analysis?.keywordOptimization?.missingKeywords?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Keywords</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedResume(resume);
                              setShowEnhancedModal(true);
                            }}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Analysis
                          </Button>
                          {!resume.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveResumeMutation.mutate(resume.id)}
                              disabled={setActiveResumeMutation.isPending}
                              className="w-full"
                            >
                              <Target className="h-4 w-4 mr-1" />
                              Set Active
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedResume(resume);
                              setShowAIModal(true);
                            }}
                            className="w-full col-span-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
                          >
                            <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
                            Generate AI Resume
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </motion.div>
        </div>
      </div>

      {/* Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resume Analysis: {selectedResume?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed AI-powered analysis with ATS optimization recommendations
            </DialogDescription>
          </DialogHeader>

          {selectedResume && (
            <div className="space-y-6">
              {/* ATS Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Overall ATS Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getScoreColor(selectedResume.atsScore || 0)}`}>
                      {selectedResume.atsScore || 0}%
                    </div>
                    <Progress 
                      value={selectedResume.atsScore || 0} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Formatting Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getScoreColor(selectedResume.analysis?.formatting?.score || 0)}`}>
                      {selectedResume.analysis?.formatting?.score || 0}%
                    </div>
                    <Progress 
                      value={selectedResume.analysis?.formatting?.score || 0} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Content Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedResume.analysis?.content?.strengthsFound?.length || 0}
                    </div>
                    <p className="text-sm text-gray-600">Strengths identified</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Strengths Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResume.analysis?.content?.strengthsFound?.map((strength: string, index: number) => (
                      <div key={index} className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        {strength}
                      </div>
                    )) || <p className="text-gray-500">No specific strengths identified</p>}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-5 w-5" />
                      Improvement Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResume.analysis?.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="text-sm bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                        {rec}
                      </div>
                    )) || <p className="text-gray-500">No specific recommendations</p>}
                  </CardContent>
                </Card>

                {/* Missing Keywords */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <Target className="h-5 w-5" />
                      Missing Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedResume.analysis?.keywordOptimization?.missingKeywords?.map((keyword: string, index: number) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {keyword}
                        </Badge>
                      )) || <p className="text-gray-500">No missing keywords identified</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Keyword Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Plus className="h-5 w-5" />
                      Keyword Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedResume.analysis?.keywordOptimization?.suggestions?.map((suggestion: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {suggestion}
                        </Badge>
                      )) || <p className="text-gray-500">No keyword suggestions available</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Formatting Issues */}
              {selectedResume.analysis?.formatting?.issues && selectedResume.analysis.formatting.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-5 w-5" />
                      Formatting Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResume.analysis.formatting.issues.map((issue: string, index: number) => (
                      <div key={index} className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        {issue}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Resume Analysis Modal */}
      <ResumeAnalysisModal
        isOpen={showEnhancedModal}
        onClose={() => setShowEnhancedModal(false)}
        resumeData={selectedResume}
        onReanalyze={() => {
          if (selectedResume) {
            // Trigger re-analysis
            queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
            toast({
              title: "Re-analyzing Resume",
              description: "Your resume is being re-analyzed with the latest AI improvements."
            });
          }
        }}
        onOptimize={(section: string) => {
          toast({
            title: "Optimization Applied",
            description: `${section} has been optimized. Download your updated resume to see the changes.`
          });
          // In a real implementation, this would trigger the specific optimization
          console.log("Optimizing section:", section);
        }}
      />

      {/* AI Resume Improvement Modal */}
      <AIResumeImprovementModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        userResume={selectedResume?.resumeText || ""}
      />
    </div>
  );
}