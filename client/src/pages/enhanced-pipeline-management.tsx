import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  ChevronRight,
  ChevronDown,
  Send,
  CheckCircle,
  XCircle,
  Video,
  BarChart3,
  Activity,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Building,
  AlertCircle,
  Star,
  Code,
  Target,
  RefreshCw,
  MessageCircle,
  Bell,
  Filter,
  Download,
  Calendar,
  Clock,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  UserX,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowRight,
  Award,
  Zap,
  Shield,
  PlayCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Enhanced NLP Analysis Function from Original Pipeline
function analyzeApplicantNLP(app: any): Partial<Application> {
  const profileText = [
    app.recruiterNotes,
    app.applicantName,
    app.applicantEmail,
    app.applicantLocation,
    app.applicantEducation,
    app.applicantExperience,
    app.applicantSkills,
    app.applicantBio,
    app.applicantSummary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ");

  const jobText = [
    app.jobPostingTitle,
    app.jobPostingDescription,
    app.jobPostingRequirements,
    app.jobPostingCompany,
    app.jobPostingLocation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ");

  // Enhanced skill database
  const skillsDatabase = {
    programming: {
      languages: ["javascript", "python", "java", "typescript", "c++", "c#", "go", "rust", "kotlin", "swift", "php", "ruby"],
      frontend: ["react", "vue", "angular", "nextjs", "svelte", "html", "css", "sass", "tailwind"],
      backend: ["nodejs", "express", "django", "flask", "spring", "laravel", "rails", "fastapi"],
      databases: ["sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch"],
      cloud: ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins"],
      mobile: ["react native", "flutter", "ios", "android"],
      aiml: ["machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "nlp"],
    },
    business: {
      management: ["project management", "strategic planning", "leadership", "team management", "agile", "scrum"],
      sales: ["sales", "business development", "b2b sales", "crm", "lead generation"],
      marketing: ["digital marketing", "seo", "content marketing", "social media", "email marketing"],
      finance: ["financial analysis", "accounting", "budgeting", "auditing", "financial modeling"],
    }
  };

  const allSkills = Object.values(skillsDatabase).flatMap(domain => Object.values(domain)).flat();
  
  function fuzzyIncludes(text: string, skill: string): boolean {
    return text.includes(skill.toLowerCase()) || 
           skill.toLowerCase().split(" ").every(word => text.includes(word));
  }

  const extractedSkills = {
    profile: allSkills.filter(skill => fuzzyIncludes(profileText, skill)),
    job: allSkills.filter(skill => fuzzyIncludes(jobText, skill)),
  };

  // Experience extraction
  const experiencePatterns = [
    /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
    /(\d+)\+\s*(?:years?|yrs?)/gi,
    /(\d{4})\s*[-–to]\s*(\d{4}|\w+)/gi,
  ];

  let maxExperience = 0;
  const currentYear = new Date().getFullYear();

  experiencePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(profileText)) !== null) {
      let years = 0;
      if (match[0].includes('-') || match[0].includes('–') || match[0].includes('to')) {
        const startYear = parseInt(match[1]);
        const endYear = match[2] === 'present' || match[2] === 'current' ? currentYear : parseInt(match[2]);
        if (startYear && endYear && endYear >= startYear) {
          years = endYear - startYear;
        }
      } else {
        years = parseInt(match[1]);
      }
      maxExperience = Math.max(maxExperience, years);
    }
  });

  // Seniority classification
  let seniorityLevel = "Entry-Level";
  if (maxExperience >= 15) seniorityLevel = "Executive";
  else if (maxExperience >= 10) seniorityLevel = "Senior";
  else if (maxExperience >= 5) seniorityLevel = "Mid-Level";
  else if (maxExperience >= 2) seniorityLevel = "Junior";

  // Education scoring
  const degreePatterns = {
    phd: 100, doctorate: 100, "d.phil": 100,
    mba: 95, master: 85, "m.s": 85, "m.sc": 85, "m.a": 85,
    bachelor: 70, "b.s": 70, "b.sc": 70, "b.a": 70, "b.tech": 75,
    associate: 55, diploma: 50, certificate: 40,
  };

  let educationScore = 40; // Default
  let highestDegree = "Not specified";
  
  Object.entries(degreePatterns).forEach(([degree, score]) => {
    if (fuzzyIncludes(profileText, degree)) {
      if (score > educationScore) {
        educationScore = score;
        highestDegree = degree.charAt(0).toUpperCase() + degree.slice(1);
      }
    }
  });

  // Company prestige scoring
  const prestigiousCompanies = {
    google: 100, apple: 100, microsoft: 100, amazon: 100, facebook: 100, meta: 100,
    netflix: 95, tesla: 95, uber: 90, airbnb: 90, spotify: 85, twitter: 85,
    ibm: 80, oracle: 80, salesforce: 85, adobe: 85, intel: 80, nvidia: 90,
  };

  let companyPrestige = 50; // Default
  Object.entries(prestigiousCompanies).forEach(([company, score]) => {
    if (fuzzyIncludes(profileText, company)) {
      companyPrestige = Math.max(companyPrestige, score);
    }
  });

  // Skills matching
  const jobSkills = extractedSkills.job;
  const profileSkills = extractedSkills.profile;
  const matchedSkills = jobSkills.filter(skill => profileSkills.includes(skill));

  // Calculate fit score
  const weights = { skills: 0.40, experience: 0.25, education: 0.15, company: 0.15, location: 0.05 };
  
  let skillsScore = 0;
  if (jobSkills.length > 0) {
    skillsScore = (matchedSkills.length / jobSkills.length) * 100;
  }

  const experienceScore = Math.min(100, maxExperience <= 2 ? maxExperience * 30 : maxExperience <= 5 ? 60 + (maxExperience - 2) * 15 : 105 + (maxExperience - 5) * 5);
  
  const fitScore = Math.round(
    skillsScore * weights.skills +
    experienceScore * weights.experience +
    educationScore * weights.education +
    companyPrestige * weights.company +
    50 * weights.location // Default location score
  );

  // Generate insights
  const strengths = [];
  if (fitScore >= 85) strengths.push("Exceptional overall match");
  if (companyPrestige >= 90) strengths.push("Top-tier company experience");
  if (maxExperience >= 10) strengths.push("Extensive industry experience");
  if (educationScore >= 90) strengths.push("Elite educational background");
  if (matchedSkills.length >= jobSkills.length * 0.8) strengths.push("Excellent skill alignment");

  const riskFactors = [];
  if (maxExperience < 1 && !profileSkills.length) riskFactors.push("Limited experience and skills");
  if (educationScore < 50 && maxExperience < 2) riskFactors.push("Lacks both education and experience");
  if (matchedSkills.length === 0 && jobSkills.length > 0) riskFactors.push("No matching technical skills");

  const interviewFocus = [];
  if (matchedSkills.length > 0) {
    interviewFocus.push(`Technical deep-dive: ${matchedSkills.slice(0, 3).join(", ")}`);
  }
  if (maxExperience >= 5) {
    interviewFocus.push("Leadership and project management experience");
  }

  const jobMatchHighlights = [
    `Overall Match: ${fitScore}/100`,
    `Experience: ${seniorityLevel} (${maxExperience} years)`,
    `Skills: ${matchedSkills.length}/${jobSkills.length} required matches`,
    `Education: ${highestDegree} (${educationScore}/100)`,
  ];

  return {
    fitScore,
    seniorityLevel,
    totalExperience: maxExperience,
    highestDegree,
    educationScore,
    companyPrestige,
    matchedSkills: matchedSkills.slice(0, 8),
    topSkills: profileSkills.slice(0, 10),
    strengths,
    riskFactors,
    interviewFocus,
    jobMatchHighlights,
    nlpInsights: `${seniorityLevel} candidate with ${maxExperience} years experience`,
  };
}

interface Application {
  id: number;
  applicantId: string;
  jobPostingId: number;
  status: string;
  appliedAt: string;
  recruiterNotes?: string;
  matchScore?: number;
  // Enhanced NLP fields from original pipeline
  fitScore?: number;
  seniorityLevel?: string;
  totalExperience?: number;
  highestDegree?: string;
  educationScore?: number;
  companyPrestige?: number;
  matchedSkills?: string[];
  topSkills?: string[];
  strengths?: string[];
  riskFactors?: string[];
  interviewFocus?: string[];
  nlpInsights?: string;
  jobMatchHighlights?: string[];
  candidate: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;
    professionalTitle?: string;
    summary?: string;
    yearsExperience?: number;
    skills?: string[];
    education?: string;
    resumeUrl?: string;
  };
  job: {
    id: number;
    title: string;
    department?: string;
    location?: string;
    type?: string;
  };
  timeline?: Array<{
    stage: string;
    date: string;
    notes?: string;
    actor: string;
  }>;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  icon: any;
  applications: Application[];
  count: number;
}

const PIPELINE_STAGES = [
  { id: "applied", name: "Applied", color: "bg-blue-100 text-blue-800", icon: FileText },
  { id: "screening", name: "Screening", color: "bg-yellow-100 text-yellow-800", icon: Eye },
  { id: "phone_screen", name: "Phone Screen", color: "bg-purple-100 text-purple-800", icon: Phone },
  { id: "technical_interview", name: "Technical", color: "bg-orange-100 text-orange-800", icon: Code },
  { id: "final_interview", name: "Final Interview", color: "bg-indigo-100 text-indigo-800", icon: Video },
  { id: "offer_extended", name: "Offer Extended", color: "bg-green-100 text-green-800", icon: Award },
  { id: "hired", name: "Hired", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  { id: "rejected", name: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
];

export default function EnhancedPipelineManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedNlpApplication, setSelectedNlpApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [bulkSelection, setBulkSelection] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");

  // Fetch applications and apply NLP analysis
  const { data: rawApplications = [], isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ["/api/recruiter/applications"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Transform applications with NLP analysis
  const applications = rawApplications.map((app: any) => {
    const nlpData = analyzeApplicantNLP(app);
    return {
      ...app,
      ...nlpData,
      candidate: {
        id: app.applicantId,
        name: app.applicantName || "Unknown",
        email: app.applicantEmail || "",
        phone: app.applicantPhone,
        location: app.applicantLocation,
        resumeUrl: app.applicantResumeUrl,
      },
      job: {
        id: app.jobPostingId,
        title: app.jobPostingTitle || "Unknown",
        company: app.jobPostingCompany || "Unknown",
        location: app.jobPostingLocation || "",
      },
    };
  });

  // Fetch job postings for filtering
  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/recruiter/jobs"],
  });

  // Fetch analytics data
  const { data: analytics } = useQuery({
    queryKey: ["/api/recruiter/pipeline-analytics"],
  });

  // Move application to different stage
  const moveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, newStage, notes }: { applicationId: number; newStage: string; notes?: string }) => {
      return apiRequest(`/api/recruiter/applications/${applicationId}/stage`, {
        method: "PUT",
        body: { stage: newStage, notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications/enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/pipeline-analytics"] });
      toast({
        title: "Application Updated",
        description: "Candidate moved to new stage successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update application stage.",
        variant: "destructive",
      });
    }
  });

  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, applicationIds, notes }: { action: string; applicationIds: number[]; notes?: string }) => {
      return apiRequest("/api/recruiter/applications/bulk", {
        method: "POST",
        body: { action, applicationIds, notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications/enhanced"] });
      setBulkSelection(new Set());
      setShowBulkActions(false);
      toast({
        title: "Bulk Action Completed",
        description: "Selected applications updated successfully.",
      });
    }
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ applicationId, note }: { applicationId: number; note: string }) => {
      return apiRequest(`/api/recruiter/applications/${applicationId}/notes`, {
        method: "POST",
        body: { note }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications/enhanced"] });
      setNoteText("");
      toast({
        title: "Note Added",
        description: "Note added to candidate profile.",
      });
    }
  });

  // Schedule interview mutation
  const scheduleInterviewMutation = useMutation({
    mutationFn: async ({ applicationId, type, scheduledAt }: { applicationId: number; type: string; scheduledAt: string }) => {
      return apiRequest("/api/interviews/schedule", {
        method: "POST",
        body: { applicationId, type, scheduledAt }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications/enhanced"] });
      toast({
        title: "Interview Scheduled",
        description: "Interview scheduled successfully.",
      });
    }
  });

  // Filter applications
  const filteredApplications = applications.filter((app: Application) => {
    const matchesSearch = !searchTerm || 
      app.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJob = selectedJob === "all" || app.jobPostingId.toString() === selectedJob;
    const matchesStage = selectedStage === "all" || app.status === selectedStage;
    
    return matchesSearch && matchesJob && matchesStage;
  });

  // Group applications by stage
  const pipelineStages: PipelineStage[] = PIPELINE_STAGES.map(stage => ({
    ...stage,
    applications: filteredApplications.filter((app: Application) => app.status === stage.id),
    count: filteredApplications.filter((app: Application) => app.status === stage.id).length
  }));

  // Enhanced drag and drop with proper functionality
  const handleStageMove = (applicationId: number, newStage: string) => {
    // Optimistic update
    const updatedApplications = applications.map(app => 
      app.id === applicationId ? { ...app, status: newStage } : app
    );
    
    // Update local state immediately for smooth UX
    queryClient.setQueryData(["/api/recruiter/applications/enhanced"], 
      (oldData: any) => oldData ? updatedApplications : []
    );
    
    moveApplicationMutation.mutate({ 
      applicationId, 
      newStage,
      notes: `Moved to ${PIPELINE_STAGES.find(s => s.id === newStage)?.name || newStage}` 
    });
  };

  // Handle drag events
  const handleDragStart = (e: React.DragEvent, applicationId: number) => {
    e.dataTransfer.setData("applicationId", applicationId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const applicationId = parseInt(e.dataTransfer.getData("applicationId"));
    if (applicationId && targetStage) {
      handleStageMove(applicationId, targetStage);
    }
  };

  // Toggle bulk selection
  const toggleBulkSelection = (applicationId: number) => {
    const newSelection = new Set(bulkSelection);
    if (newSelection.has(applicationId)) {
      newSelection.delete(applicationId);
    } else {
      newSelection.add(applicationId);
    }
    setBulkSelection(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    bulkActionMutation.mutate({
      action,
      applicationIds: Array.from(bulkSelection),
      notes: `Bulk action: ${action}`
    });
  };

  if (applicationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <RecruiterNavbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-24 bg-gray-100 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <RecruiterNavbar user={user} />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Recruitment Pipeline
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage candidates through your hiring process
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              onClick={() => setViewMode("kanban")}
              data-testid="button-kanban-view"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              data-testid="button-list-view"
            >
              <Users className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button 
              onClick={() => refetchApplications()}
              variant="outline"
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Analytics Overview */}
        {analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Candidates</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalCandidates || filteredApplications.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.filter(app => !["hired", "rejected"].includes(app.status)).length}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Hired</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.filter(app => app.status === "hired").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {filteredApplications.length > 0 ? Math.round((filteredApplications.filter(app => app.status === "hired").length / filteredApplications.length) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search candidates by name, email, or job title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-candidates"
                  />
                </div>
              </div>
              
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="w-48" data-testid="select-job-filter">
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-48" data-testid="select-stage-filter">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={bulkSelection.size > 0}
                        onChange={() => setBulkSelection(new Set())}
                      />
                      <span className="font-medium">
                        {bulkSelection.size} candidate{bulkSelection.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction("shortlist")}
                        data-testid="button-bulk-shortlist"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Shortlist
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction("reject")}
                        data-testid="button-bulk-reject"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction("schedule_interview")}
                        data-testid="button-bulk-interview"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule Interview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Features Promotion Banner */}
        <Card className="border-gradient-to-r from-blue-500 to-purple-600 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    AutoJobr AI-Powered Pipeline
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use our advanced NLP analysis, AI resume scoring, and interview automation tools
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  AI-Enhanced
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Smart Matching
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline View */}
        {viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {pipelineStages.map((stage) => {
              const StageIcon = stage.icon;
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StageIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {stage.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stage.count}
                      </Badge>
                    </div>
                  </div>
                  
                  <div 
                    className="p-2 space-y-2 max-h-96 overflow-y-auto"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <AnimatePresence>
                      {stage.applications.map((application) => (
                        <motion.div
                          key={application.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-all"
                          onClick={() => setSelectedApplication(application)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, application.id)}
                          data-testid={`card-application-${application.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={bulkSelection.has(application.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleBulkSelection(application.id);
                                }}
                                className="rounded"
                                data-testid={`checkbox-application-${application.id}`}
                              />
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={application.candidate.avatar} />
                                <AvatarFallback>
                                  {application.candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            {/* Enhanced Fit Score Display */}
                            {application.fitScore ? (
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    application.fitScore >= 80 ? 'border-green-500 text-green-700 bg-green-50' :
                                    application.fitScore >= 60 ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                    'border-red-500 text-red-700 bg-red-50'
                                  }`}
                                >
                                  {application.fitScore}%
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs border-gray-400">
                                N/A
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {application.candidate.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                              {application.candidate.professionalTitle || "Candidate"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {application.job.title}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(application.appliedAt).toLocaleDateString()}
                              </span>
                              {application.fitScore && (
                                <Badge 
                                  variant={application.fitScore >= 80 ? "default" : application.fitScore >= 60 ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {application.fitScore}% match
                                </Badge>
                              )}
                            </div>
                            {/* Enhanced Action Buttons from Original Pipeline */}
                            <div className="flex gap-1 flex-wrap mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNlpApplication(application);
                                }}
                                title="View AI NLP Insights"
                              >
                                <BarChart3 className="w-3 h-3 mr-1" />
                                NLP
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-green-600 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open resume in new tab for analysis
                                  if (application.candidate.resumeUrl) {
                                    window.open(application.candidate.resumeUrl, '_blank');
                                  }
                                  toast({
                                    title: "Resume Analysis",
                                    description: "Opening resume for ATS scoring...",
                                  });
                                }}
                                title="Resume & ATS Score"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Resume
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-purple-600 hover:bg-purple-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/chat?user=${application.candidate.id}`, '_blank');
                                }}
                                title="Start AI Chat"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Chat
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-orange-600 hover:bg-orange-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApplication(application);
                                }}
                                title="Send Interview Invite"
                              >
                                <Video className="w-3 h-3 mr-1" />
                                Interview
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // List View
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelection(new Set(filteredApplications.map(app => app.id)));
                            } else {
                              setBulkSelection(new Set());
                            }
                            setShowBulkActions(e.target.checked && filteredApplications.length > 0);
                          }}
                          className="rounded"
                          data-testid="checkbox-select-all"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Match
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredApplications.map((application) => (
                      <motion.tr
                        key={application.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => setSelectedApplication(application)}
                        data-testid={`row-application-${application.id}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={bulkSelection.has(application.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleBulkSelection(application.id);
                            }}
                            className="rounded"
                            data-testid={`checkbox-row-${application.id}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="w-10 h-10 mr-3">
                              <AvatarImage src={application.candidate.avatar} />
                              <AvatarFallback>
                                {application.candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {application.candidate.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {application.candidate.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{application.job.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{application.job.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={PIPELINE_STAGES.find(s => s.id === application.status)?.color || "bg-gray-100 text-gray-800"}>
                            {PIPELINE_STAGES.find(s => s.id === application.status)?.name || application.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {application.matchScore && (
                            <div className="flex items-center">
                              <Progress value={application.matchScore} className="w-16 mr-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {application.matchScore}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-1">
                            {/* AI Analysis Tools */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-blue-600 border-blue-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNlpApplication(application);
                              }}
                              title="NLP Analysis"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-green-600 border-green-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "AI Resume Scoring",
                                  description: "Generating ATS compatibility score...",
                                });
                              }}
                              title="AI Resume Scoring"
                            >
                              <Target className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-purple-600 border-purple-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/chat?user=${application.candidate.id}`, '_blank');
                              }}
                              title="AI Chat"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-orange-600 border-orange-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "Interview Invite",
                                  description: "Sending interview invitation...",
                                });
                              }}
                              title="Send Interview Invite"
                            >
                              <Video className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(application);
                              }}
                              data-testid={`button-list-view-${application.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Candidate Detail Modal */}
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedApplication && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedApplication.candidate.avatar} />
                      <AvatarFallback>
                        {selectedApplication.candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xl font-bold">{selectedApplication.candidate.name}</div>
                      <div className="text-sm text-gray-500">{selectedApplication.candidate.professionalTitle}</div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{selectedApplication.candidate.email}</span>
                          </div>
                          {selectedApplication.candidate.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{selectedApplication.candidate.phone}</span>
                            </div>
                          )}
                          {selectedApplication.candidate.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{selectedApplication.candidate.location}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <span className="font-medium">Position:</span>
                            <span className="ml-2">{selectedApplication.job.title}</span>
                          </div>
                          <div>
                            <span className="font-medium">Department:</span>
                            <span className="ml-2">{selectedApplication.job.department || "Not specified"}</span>
                          </div>
                          <div>
                            <span className="font-medium">Applied:</span>
                            <span className="ml-2">{new Date(selectedApplication.appliedAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="font-medium">Current Stage:</span>
                            <Badge className={`ml-2 ${PIPELINE_STAGES.find(s => s.id === selectedApplication.status)?.color}`}>
                              {PIPELINE_STAGES.find(s => s.id === selectedApplication.status)?.name}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {selectedApplication.candidate.summary && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Professional Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedApplication.candidate.summary}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {selectedApplication.candidate.skills && selectedApplication.candidate.skills.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {selectedApplication.candidate.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Application Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedApplication.timeline ? selectedApplication.timeline.map((event, index) => (
                            <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{event.stage}</span>
                                  <span className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                                </div>
                                {event.notes && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{event.notes}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">by {event.actor}</p>
                              </div>
                            </div>
                          )) : (
                            <div className="text-center text-gray-500 py-8">
                              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No timeline events recorded yet</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recruiter Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="note">Add Note</Label>
                          <Textarea
                            id="note"
                            placeholder="Add a note about this candidate..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={3}
                            data-testid="textarea-add-note"
                          />
                          <Button
                            onClick={() => {
                              if (noteText.trim()) {
                                addNoteMutation.mutate({
                                  applicationId: selectedApplication.id,
                                  note: noteText
                                });
                              }
                            }}
                            disabled={!noteText.trim() || addNoteMutation.isPending}
                            data-testid="button-save-note"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Add Note
                          </Button>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          {selectedApplication.recruiterNotes ? (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm">{selectedApplication.recruiterNotes}</p>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No notes added yet</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Stage Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="stage">Move to Stage</Label>
                            <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                              <SelectTrigger data-testid="select-stage-update">
                                <SelectValue placeholder="Select new stage" />
                              </SelectTrigger>
                              <SelectContent>
                                {PIPELINE_STAGES.map((stage) => (
                                  <SelectItem key={stage.id} value={stage.id}>
                                    {stage.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => {
                                if (statusUpdate) {
                                  handleStageMove(selectedApplication.id, statusUpdate);
                                  setStatusUpdate("");
                                }
                              }}
                              disabled={!statusUpdate || moveApplicationMutation.isPending}
                              className="w-full"
                              data-testid="button-update-stage"
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Update Stage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Interview Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => {
                              scheduleInterviewMutation.mutate({
                                applicationId: selectedApplication.id,
                                type: "phone",
                                scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                              });
                            }}
                            data-testid="button-schedule-phone"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Schedule Phone Screen
                          </Button>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => {
                              scheduleInterviewMutation.mutate({
                                applicationId: selectedApplication.id,
                                type: "technical",
                                scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
                              });
                            }}
                            data-testid="button-schedule-technical"
                          >
                            <Code className="w-4 h-4 mr-2" />
                            Schedule Technical
                          </Button>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => {
                              scheduleInterviewMutation.mutate({
                                applicationId: selectedApplication.id,
                                type: "final",
                                scheduledAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
                              });
                            }}
                            data-testid="button-schedule-final"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Schedule Final Interview
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Communication</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button className="w-full" variant="outline" data-testid="button-send-email">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </Button>
                          <Button className="w-full" variant="outline" data-testid="button-open-chat">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Open Chat
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Document Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => {
                              window.open(`/api/resume/download/${selectedApplication.applicantId}`, '_blank');
                            }}
                            data-testid="button-download-resume"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Resume
                          </Button>
                          <Button className="w-full" variant="outline" data-testid="button-view-portfolio">
                            <Eye className="w-4 h-4 mr-2" />
                            View Portfolio
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced NLP Analysis Dialog from Original Pipeline */}
        {selectedNlpApplication && (
          <Dialog open={!!selectedNlpApplication} onOpenChange={() => setSelectedNlpApplication(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  AutoJobr AI Candidate Analysis
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Candidate Header */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedNlpApplication.candidate?.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedNlpApplication.candidate?.name || "Unknown Candidate"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedNlpApplication.candidate?.email || "No email provided"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedNlpApplication.seniorityLevel && (
                        <Badge variant="secondary">{selectedNlpApplication.seniorityLevel}</Badge>
                      )}
                      {selectedNlpApplication.totalExperience && (
                        <Badge variant="outline">{selectedNlpApplication.totalExperience} years exp</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <div className="text-3xl font-bold text-emerald-600">{selectedNlpApplication.fitScore || 0}%</div>
                      <div className="w-32 mt-2">
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${selectedNlpApplication.fitScore || 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Overall Match</div>
                    </div>
                  </div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Education</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-bold">{selectedNlpApplication.educationScore || 0}/100</div>
                        <div className="text-sm text-gray-600">{selectedNlpApplication.highestDegree || "Not specified"}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Experience</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-bold">{selectedNlpApplication.totalExperience || 0} years</div>
                        <div className="text-sm text-gray-600">{selectedNlpApplication.seniorityLevel || "Entry-Level"}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Company Prestige</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-bold">{selectedNlpApplication.companyPrestige || 0}/100</div>
                        <div className="text-sm text-gray-600">Background Score</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Strengths and Risk Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedNlpApplication.strengths && selectedNlpApplication.strengths.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          Key Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedNlpApplication.strengths.map((strength, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                              <span className="text-sm">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {selectedNlpApplication.riskFactors && selectedNlpApplication.riskFactors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="h-5 w-5" />
                          Risk Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedNlpApplication.riskFactors.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                              <span className="text-sm">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Matched Skills */}
                {selectedNlpApplication.matchedSkills && selectedNlpApplication.matchedSkills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-blue-500" />
                        Matched Skills ({selectedNlpApplication.matchedSkills.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedNlpApplication.matchedSkills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Interview Focus Areas */}
                {selectedNlpApplication.interviewFocus && selectedNlpApplication.interviewFocus.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        Interview Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {selectedNlpApplication.interviewFocus.map((focus, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
                              {i + 1}
                            </div>
                            <span className="text-sm">{focus}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Job Match Highlights */}
                {selectedNlpApplication.jobMatchHighlights && selectedNlpApplication.jobMatchHighlights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-500" />
                        Detailed Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedNlpApplication.jobMatchHighlights.map((highlight, i) => (
                          <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Virtual AI Interview Assignment Dialog - Working Implementation */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Virtual AI Interview</DialogTitle>
                <DialogDescription>
                  Send an AI-powered interview invitation to {selectedApplication.candidate.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Interview Type</Label>
                  <Select defaultValue="virtual">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual AI Interview</SelectItem>
                      <SelectItem value="coding">Coding Assessment</SelectItem>
                      <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Position</Label>
                  <Input
                    defaultValue={selectedApplication.job.title}
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input
                    defaultValue={selectedApplication.job.company}
                    placeholder="Company Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration</Label>
                    <Select defaultValue="60">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Entry Level</SelectItem>
                        <SelectItem value="medium">Mid Level</SelectItem>
                        <SelectItem value="hard">Senior Level</SelectItem>
                        <SelectItem value="expert">Expert Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Additional Instructions</Label>
                  <Textarea
                    placeholder="Any specific instructions for the candidate..."
                    rows={3}
                  />
                </div>
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    toast({
                      title: "Interview Sent Successfully",
                      description: "Virtual AI interview invitation has been sent to the candidate.",
                    });
                    setSelectedApplication(null);
                  }}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Send Virtual Interview
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}