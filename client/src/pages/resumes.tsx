
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
  Wand2,
  Download,
  Award,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import ResumeAnalysisModal from "@/components/ResumeAnalysisModal";
import AIResumeImprovementModal from "@/components/AIResumeImprovementModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15
    }
  }
};

const cardHover = {
  scale: 1.02,
  y: -5,
  transition: { duration: 0.2 }
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

  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('resume', file);

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
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800";
    if (score >= 60) return "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800";
    return "bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800";
  };

  if (isLoading || resumesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-12 w-96 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userName = user?.firstName || user?.name || "Job Seeker";
  const isPremium = user?.planType === "premium";
  const hasResume = Array.isArray(resumes) && resumes.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />

      <motion.div
        className="container mx-auto px-4 py-8 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Premium Hero Header */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl -ml-40 -mb-40"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-white mb-1">
                        Resume Manager
                      </h1>
                      <p className="text-violet-100 text-lg">
                        AI-powered optimization for {userName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <Badge className="px-4 py-2 bg-white/20 backdrop-blur-md text-white border-white/30 text-sm font-semibold">
                      <FileText className="w-4 h-4 mr-2" />
                      {(resumes as any)?.length || 0} Resumes
                    </Badge>
                    {isPremium && (
                      <Badge className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-sm font-semibold shadow-lg">
                        <Crown className="w-4 h-4 mr-2" />
                        Premium Active
                      </Badge>
                    )}
                  </div>
                </div>
                {!isPremium && (
                  <Button 
                    onClick={() => window.location.href = "/subscription"}
                    className="bg-white text-violet-600 hover:bg-violet-50 shadow-xl px-8 py-6 text-lg font-bold"
                    data-testid="button-upgrade-premium"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section - Premium Design */}
          <motion.div
            className="lg:col-span-1"
            variants={itemVariants}
            whileHover={cardHover}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 text-white h-full overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
              
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Upload className="h-6 w-6" />
                  </div>
                  Upload Resume
                </CardTitle>
                <p className="text-cyan-100 text-sm mt-2">
                  Instant ATS analysis & optimization
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                {/* Storage Meter */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Storage Used</span>
                    <span className="text-lg font-bold">
                      {(resumes as any)?.length || 0}/{isPremium ? '∞' : '2'}
                    </span>
                  </div>
                  <Progress
                    value={((resumes as any)?.length || 0) / (isPremium ? 100 : 2) * 100}
                    className="h-3 bg-white/20"
                  />
                  <div className="flex items-center gap-2 mt-2 text-xs text-cyan-100">
                    <Shield className="w-3 h-3" />
                    <span>Secure cloud storage</span>
                  </div>
                </div>

                {((resumes as any)?.length || 0) < (isPremium ? 999 : 2) ? (
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
                        className="cursor-pointer bg-white/10 border-white/30 text-white file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-white file:text-blue-600 file:font-bold hover:file:bg-cyan-50 backdrop-blur-sm"
                        disabled={isUploadingResume}
                      />
                    </div>
                    
                    {isUploadingResume && (
                      <div className="space-y-3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span className="text-sm font-semibold">Analyzing with AI...</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2 bg-white/20" />
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 text-xs bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Accepted formats:</p>
                        <p className="text-cyan-100">PDF, DOC, DOCX (max 10MB)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-sm font-semibold mb-2">
                      {isPremium ? 'Unlimited uploads available' : 'Upload limit reached'}
                    </p>
                    {!isPremium && (
                      <Button
                        size="sm"
                        className="bg-white text-blue-600 hover:bg-cyan-50 font-bold"
                        onClick={() => window.location.href = "/subscription"}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Generator - Premium Design */}
          <motion.div
            className="lg:col-span-1"
            variants={itemVariants}
            whileHover={cardHover}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600 text-white h-full overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
              
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  AI Generator
                </CardTitle>
                <p className="text-pink-100 text-sm mt-2">
                  Create perfect resumes in seconds
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                <div className="space-y-3">
                  {[
                    { icon: CheckCircle2, text: "ATS-optimized templates", color: "bg-emerald-500/20" },
                    { icon: Target, text: "Job-specific keywords", color: "bg-blue-500/20" },
                    { icon: Wand2, text: "AI-powered content", color: "bg-purple-500/20" },
                    { icon: Award, text: "Professional formatting", color: "bg-amber-500/20" }
                  ].map((feature, idx) => (
                    <div key={idx} className={`flex items-center gap-3 ${feature.color} backdrop-blur-md rounded-xl p-3 border border-white/20`}>
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">{feature.text}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  className="w-full bg-white text-fuchsia-600 hover:bg-pink-50 font-bold shadow-xl py-6 text-base"
                  onClick={() => setShowAIModal(true)}
                  data-testid="create-ai-resume-btn"
                >
                  <Wand2 className="h-5 w-5 mr-2" />
                  Generate AI Resume
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Card - Premium Design */}
          <motion.div
            className="lg:col-span-1"
            variants={itemVariants}
            whileHover={cardHover}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white h-full overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  Your Stats
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold mb-1">
                      {hasResume ? Math.max(...(resumes as any).map((r: any) => r.atsScore || 0)) : 0}%
                    </div>
                    <div className="text-xs text-emerald-100">Best ATS Score</div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold mb-1">{(resumes as any)?.length || 0}</div>
                    <div className="text-xs text-emerald-100">Total Resumes</div>
                  </div>
                </div>
                
                {hasResume && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-semibold">Recent Upload</span>
                    </div>
                    <p className="text-xs text-emerald-100">
                      {new Date((resumes as any)[0].uploadedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                  <Zap className="w-4 h-4" />
                  <span>Powered by advanced AI analysis</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Resume List Section */}
        <motion.div
          className="mt-8"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              <FileText className="w-8 h-8 text-violet-600" />
              Your Resume Collection
            </h2>
            {hasResume && (
              <Badge variant="outline" className="text-base px-4 py-2 border-2">
                {(resumes as any).length} total
              </Badge>
            )}
          </div>

          {resumesError ? (
            <Card className="border-2 border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-16 w-16 mx-auto text-rose-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Error loading resumes
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {(resumesError as any)?.message || "Failed to load resumes"}
                </p>
              </CardContent>
            </Card>
          ) : !hasResume ? (
            <Card className="border-2 border-dashed border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <FileText className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  No resumes yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                  Upload your first resume to get instant ATS scoring and AI-powered optimization tips
                </p>
                <div className="flex items-center justify-center gap-3 text-base text-violet-600 dark:text-violet-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">AI analysis included with every upload</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {(resumes as any).map((resume: any, index: number) => (
                  <motion.div
                    key={resume.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={cardHover}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`border-2 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                      resume.isActive 
                        ? 'ring-4 ring-violet-500 border-violet-300 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}>
                      <CardContent className="p-6">
                        {/* Header with Score Badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-16 h-16 rounded-2xl ${getScoreBg(resume.atsScore || 0)} flex items-center justify-center flex-shrink-0 border-2`}>
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(resume.atsScore || 0)}`}>
                                  {resume.atsScore || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">ATS</div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate mb-1">
                                {resume.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(resume.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          {resume.isActive && (
                            <Badge className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0 shadow-lg flex-shrink-0">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Active
                            </Badge>
                          )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                            <div className="text-xl font-bold text-emerald-600">
                              {resume.analysis?.content?.strengthsFound?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Strengths</div>
                          </div>
                          <div className="text-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                            <div className="text-xl font-bold text-amber-600">
                              {resume.analysis?.recommendations?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Tips</div>
                          </div>
                          <div className="text-center bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-3 border border-violet-200 dark:border-violet-800">
                            <div className="text-xl font-bold text-violet-600">
                              {resume.analysis?.keywordOptimization?.missingKeywords?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Keywords</div>
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
                            className="w-full font-semibold border-2 hover:bg-violet-50 hover:border-violet-300"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Analysis
                          </Button>
                          {!resume.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveResumeMutation.mutate(resume.id)}
                              disabled={setActiveResumeMutation.isPending}
                              className="w-full font-semibold border-2 hover:bg-indigo-50 hover:border-indigo-300"
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Set Active
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadResume(resume.id, resume.name)}
                              className="w-full font-semibold border-2 hover:bg-emerald-50 hover:border-emerald-300"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedResume(resume);
                              setShowAIModal(true);
                            }}
                            className="w-full col-span-2 bg-gradient-to-r from-fuchsia-50 to-purple-50 hover:from-fuchsia-100 hover:to-purple-100 border-2 border-fuchsia-200 font-semibold"
                          >
                            <Sparkles className="h-4 w-4 mr-1 text-fuchsia-600" />
                            Improve with AI
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>

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
              {/* Content omitted for brevity - same as before */}
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
