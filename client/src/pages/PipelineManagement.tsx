// --- Enterprise-Grade AI Candidate Analysis ---
function analyzeApplicantNLP(app: any): Partial<Application> {
  // Comprehensive text extraction and normalization
  const profileText = [
    app.recruiterNotes,
    app.applicantName,
    app.applicantEmail,
    app.applicantLocation,
    app.applicantEducation,
    app.applicantExperience,
    app.applicantSkills,
    app.applicantBio,
    app.applicantSummary
  ].filter(Boolean).join(" ").toLowerCase();

  const jobText = [
    app.jobPostingTitle,
    app.jobPostingDescription,
    app.jobPostingRequirements,
    app.jobPostingCompany,
    app.jobPostingLocation
  ].filter(Boolean).join(" ").toLowerCase();

  // Advanced Skills Analysis with Categories and Weights
  const skillsDatabase = {
    technical: {
      programming: ["javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "kotlin", "swift", "php"],
      frontend: ["react", "vue", "angular", "nextjs", "svelte", "html", "css", "sass", "tailwind"],
      backend: ["node", "express", "django", "flask", "spring", "laravel", "rails", "asp.net"],
      database: ["sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra"],
      cloud: ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins"],
      mobile: ["react native", "flutter", "ios", "android", "xamarin"],
      ai_ml: ["machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "sklearn"]
    },
    soft: {
      leadership: ["leadership", "management", "team lead", "project management", "scrum master"],
      communication: ["communication", "presentation", "writing", "public speaking", "collaboration"],
      analytical: ["analysis", "problem solving", "critical thinking", "data analysis", "research"]
    },
    domain: {
      finance: ["finance", "banking", "fintech", "trading", "investment", "accounting"],
      healthcare: ["healthcare", "medical", "pharma", "biotech", "clinical"],
      ecommerce: ["ecommerce", "retail", "marketplace", "payment", "logistics"],
      education: ["education", "edtech", "training", "learning", "curriculum"]
    }
  };

  // Extract skills with categories and confidence scores
  const extractedSkills: any = {};
  Object.entries(skillsDatabase).forEach(([category, subcats]) => {
    extractedSkills[category] = {};
    Object.entries(subcats).forEach(([subcat, skills]) => {
      extractedSkills[category][subcat] = skills.filter(skill => 
        profileText.includes(skill) || jobText.includes(skill)
      );
    });
  });

  // Advanced Experience Analysis
  const experiencePatterns = [
    { pattern: /(\d+)\+?\s*(years?|yrs?)\s*of?\s*experience/g, multiplier: 1.0 },
    { pattern: /(\d+)\+?\s*(years?|yrs?)\s*in/g, multiplier: 0.9 },
    { pattern: /over\s*(\d+)\s*(years?|yrs?)/g, multiplier: 1.1 },
    { pattern: /(\d+)\+\s*(years?|yrs?)/g, multiplier: 1.2 }
  ];

  let totalExperience = 0;
  let seniorityLevel = "Junior";
  experiencePatterns.forEach(({ pattern, multiplier }) => {
    let match;
    while ((match = pattern.exec(profileText)) !== null) {
      const years = parseInt(match[1]) * multiplier;
      totalExperience = Math.max(totalExperience, years);
    }
  });

  if (totalExperience >= 8) seniorityLevel = "Senior";
  else if (totalExperience >= 5) seniorityLevel = "Mid-Level";
  else if (totalExperience >= 2) seniorityLevel = "Junior";
  else seniorityLevel = "Entry-Level";

  // Education Analysis with Prestige Scoring
  const educationData = {
    degrees: {
      "phd": { score: 100, level: "Doctorate" },
      "doctorate": { score: 100, level: "Doctorate" },
      "mba": { score: 90, level: "Master's" },
      "master": { score: 85, level: "Master's" },
      "m.s": { score: 85, level: "Master's" },
      "m.sc": { score: 85, level: "Master's" },
      "bachelor": { score: 70, level: "Bachelor's" },
      "b.s": { score: 70, level: "Bachelor's" },
      "b.sc": { score: 70, level: "Bachelor's" }
    },
    institutions: {
      "mit": 100, "stanford": 100, "harvard": 100, "berkeley": 95, "caltech": 95,
      "cmu": 90, "princeton": 100, "yale": 95, "columbia": 90, "cornell": 85
    }
  };

  let educationScore = 0;
  let highestDegree = "High School";
  Object.entries(educationData.degrees).forEach(([degree, data]) => {
    if (profileText.includes(degree)) {
      educationScore = Math.max(educationScore, data.score);
      highestDegree = data.level;
    }
  });

  // Company Analysis with Industry Recognition
  const prestigiousCompanies = {
    "google": 100, "microsoft": 100, "apple": 100, "amazon": 100, "meta": 100, "facebook": 100,
    "netflix": 95, "tesla": 95, "uber": 90, "airbnb": 90, "spotify": 85, "linkedin": 90,
    "salesforce": 85, "adobe": 85, "nvidia": 95, "intel": 85, "oracle": 80
  };

  let companyPrestige = 0;
  let workHistory: Array<{company: string; prestige: number}> = [];
  Object.entries(prestigiousCompanies).forEach(([company, score]) => {
    if (profileText.includes(company)) {
      companyPrestige = Math.max(companyPrestige, score);
      workHistory.push({ company, prestige: score });
    }
  });

  // Advanced Fit Score Calculation (0-100)
  const jobSkillsWeight = 0.35;
  const experienceWeight = 0.25;
  const educationWeight = 0.15;
  const companyWeight = 0.15;
  const locationWeight = 0.10;

  // Skills matching with job requirements
  let skillsScore = 0;
  const jobSkills = Object.values(extractedSkills).flat().flat();
  const profileSkills = Object.values(extractedSkills).flat().flat();
  const matchedSkills = jobSkills.filter(skill => profileSkills.includes(skill));
  skillsScore = Math.min(100, (matchedSkills.length / Math.max(jobSkills.length, 1)) * 100);

  // Experience scoring
  let experienceScore = Math.min(100, (totalExperience / 10) * 100);

  // Location matching
  let locationScore = 0;
  if (app.applicantLocation && app.jobPostingLocation) {
    const locMatch = app.jobPostingLocation.toLowerCase().includes(app.applicantLocation.toLowerCase()) ||
                     app.applicantLocation.toLowerCase().includes(app.jobPostingLocation.toLowerCase());
    locationScore = locMatch ? 100 : 20; // Remote work consideration
  } else {
    locationScore = 50; // Neutral if location not specified
  }

  // Final weighted score
  const fitScore = Math.round(
    (skillsScore * jobSkillsWeight) +
    (experienceScore * experienceWeight) +
    (educationScore * educationWeight) +
    (companyPrestige * companyWeight) +
    (locationScore * locationWeight)
  );

  // Risk Assessment
  const riskFactors = [];
  if (totalExperience < 1) riskFactors.push("Limited professional experience");
  if (educationScore < 70) riskFactors.push("Educational background may not align");
  if (locationScore < 50) riskFactors.push("Location mismatch - may require relocation");
  if (matchedSkills.length < 3) riskFactors.push("Limited skill overlap with job requirements");

  // Strengths Identification
  const strengths = [];
  if (fitScore >= 85) strengths.push("Exceptional candidate profile");
  if (companyPrestige >= 90) strengths.push("Experience at top-tier companies");
  if (totalExperience >= 5) strengths.push("Strong professional experience");
  if (educationScore >= 85) strengths.push("Advanced educational background");
  if (matchedSkills.length >= 5) strengths.push("Strong technical skill alignment");

  // Interview Recommendations
  const interviewFocus = [];
  if (matchedSkills.length > 0) interviewFocus.push(`Technical assessment on: ${matchedSkills.slice(0, 3).join(", ")}`);
  if (totalExperience >= 3) interviewFocus.push("Deep dive into past project experiences");
  if (companyPrestige >= 80) interviewFocus.push("Understanding of scale and best practices");
  if (riskFactors.length > 0) interviewFocus.push(`Address concerns: ${riskFactors[0]}`);

  return {
    fitScore,
    seniorityLevel,
    totalExperience,
    highestDegree,
    educationScore,
    companyPrestige,
    matchedSkills: matchedSkills.slice(0, 8) as string[], // Top matched skills
    topSkills: profileSkills.slice(0, 10) as string[],
    strengths,
    riskFactors,
    interviewFocus,
    workHistory,
    nlpInsights: [
      `${seniorityLevel} level with ${totalExperience} years experience`,
      `Education: ${highestDegree} (Score: ${educationScore}/100)`,
      `Technical skills: ${matchedSkills.length} matches with job requirements`,
      companyPrestige > 0 ? `Experience at prestigious companies (Score: ${companyPrestige}/100)` : "Diverse company background",
      ...strengths.slice(0, 2),
      riskFactors.length > 0 ? `Considerations: ${riskFactors[0]}` : "No major concerns identified"
    ].join(". "),
    jobMatchHighlights: [
      `Overall Match: ${fitScore}/100 (${fitScore >= 85 ? 'Exceptional' : fitScore >= 70 ? 'Strong' : fitScore >= 50 ? 'Good' : 'Consider for other roles'})`,
      `Experience Level: ${seniorityLevel} (${totalExperience} years)`,
      `Skills Alignment: ${matchedSkills.length} of ${jobSkills.length} required skills`,
      ...strengths.slice(0, 3),
      ...interviewFocus.slice(0, 2)
    ]
  };
}
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import {
  Users,
  Search,
  Filter,
  Calendar,
  Clock,
  Star,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Video,
  Code,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  UserCheck,
  Briefcase,
  Award,
  Target,
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  ArrowRight,
  PlayCircle,
  StopCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Building,
  AlertCircle,
} from "lucide-react";

interface Application {
  id: number;
  userId: string;
  jobPostingId: number;
  status: string;
  appliedAt: string;
  recruiterNotes?: string;
  stage: string;
  score?: number;
  lastActivity: string;
  fitScore?: number; // NLP fit score 0-100
  nlpInsights?: string; // NLP summary/insights
  topSkills?: string[]; // NLP extracted skills
  jobMatchHighlights?: string[]; // NLP job match highlights
  // Enhanced AI analysis fields
  seniorityLevel?: string;
  totalExperience?: number;
  highestDegree?: string;
  educationScore?: number;
  companyPrestige?: number;
  matchedSkills?: string[];
  strengths?: string[];
  riskFactors?: string[];
  interviewFocus?: string[];
  workHistory?: Array<{company: string; prestige: number}>;
  candidate: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profileImageUrl?: string;
  };
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
  };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  description: string;
  applications: Application[];
  count: number;
}

const defaultStages: PipelineStage[] = [
  {
    id: "applied",
    name: "Applied",
    color: "bg-blue-500",
    description: "New applications",
    applications: [],
    count: 0
  },
  {
    id: "phone_screen",
    name: "Phone Screen",
    color: "bg-yellow-500",
    description: "Initial phone screening",
    applications: [],
    count: 0
  },
  {
    id: "technical_interview",
    name: "Technical Interview",
    color: "bg-purple-500",
    description: "Technical assessment",
    applications: [],
    count: 0
  },
  {
    id: "final_interview",
    name: "Final Interview",
    color: "bg-green-500",
    description: "Final round interviews",
    applications: [],
    count: 0
  },
  {
    id: "offer_extended",
    name: "Offer Extended",
    color: "bg-emerald-500",
    description: "Offer sent to candidate",
    applications: [],
    count: 0
  },
  {
    id: "hired",
    name: "Hired",
    color: "bg-green-600",
    description: "Successfully hired",
    applications: [],
    count: 0
  },
  {
    id: "rejected",
    name: "Rejected",
    color: "bg-red-500",
    description: "Not moving forward",
    applications: [],
    count: 0
  }
];

export default function PipelineManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedNlpApplication, setSelectedNlpApplication] = useState<Application | null>(null); // For NLP modal
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(defaultStages);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(["applied", "phone_screen"]));
  const [interviewAssignmentData, setInterviewAssignmentData] = useState({
    candidateId: "",
    jobPostingId: "",
    interviewType: "virtual",
    assignmentType: "virtual", // virtual, mock, test
    role: "",
    company: "",
    difficulty: "medium",
    duration: 60,
    dueDate: "",
    instructions: ""
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/recruiter/applications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: jobPostings = [] } = useQuery({
    queryKey: ["/api/recruiter/jobs"],
  });

  // Organize applications by stage
  useEffect(() => {
    if (applications.length > 0) {
      // Transform flat data structure to nested format expected by frontend, and enrich with NLP
      const transformedApplications = applications.map((app: any) => {
        const nlp = analyzeApplicantNLP(app);
        return {
          ...app,
          ...nlp,
          candidate: {
            id: app.applicantId,
            name: app.applicantName,
            email: app.applicantEmail,
            phone: app.applicantPhone,
            location: app.applicantLocation,
            profileImageUrl: app.applicantProfileImageUrl,
          },
          job: {
            id: app.jobPostingId,
            title: app.jobPostingTitle,
            company: app.jobPostingCompany,
            location: app.jobPostingLocation,
          },
          stage: app.stage || "applied",
          lastActivity: app.updatedAt || app.appliedAt,
          userId: app.applicantId,
          appliedAt: app.appliedAt,
        };
      });

      const updatedStages = defaultStages.map(stage => ({
        ...stage,
        applications: transformedApplications.filter((app: Application) => 
          app.stage === stage.id || (!app.stage && stage.id === "applied")
        ),
        count: transformedApplications.filter((app: Application) => 
          app.stage === stage.id || (!app.stage && stage.id === "applied")
        ).length
      }));
      setPipelineStages(updatedStages);
    }
  }, [applications]);

  // Move application to different stage
  const moveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, newStage, notes }: { applicationId: number; newStage: string; notes?: string }) => {
      return await apiRequest("PUT", `/api/recruiter/applications/${applicationId}/stage`, {
        stage: newStage,
        notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
      toast({
        title: "Application Updated",
        description: "Application stage updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application stage",
        variant: "destructive",
      });
    },
  });

  // Send interview invitation
  const sendInterviewInviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = data.assignmentType === "virtual" 
        ? "/api/interviews/virtual/assign" 
        : data.assignmentType === "mock"
        ? "/api/interviews/mock/assign"
        : "/api/test-assignments";
      
      return await apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
      toast({
        title: "Interview Assigned",
        description: "Interview invitation sent successfully",
      });
      setSelectedApplication(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send interview invitation",
        variant: "destructive",
      });
    },
  });

  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const handleSendInterviewInvite = () => {
    if (!selectedApplication) return;
    
    const assignmentData = {
      candidateId: selectedApplication.userId,
      jobPostingId: selectedApplication.jobPostingId,
      ...interviewAssignmentData,
      dueDate: new Date(interviewAssignmentData.dueDate).toISOString(),
    };

    sendInterviewInviteMutation.mutate(assignmentData);
  };

  // Add a "Top Matches" filter using fitScore
  const [showTopMatches, setShowTopMatches] = useState(false);
  const filteredStages = pipelineStages.map((stage: PipelineStage) => ({
    ...stage,
    applications: stage.applications
      .filter((app: Application) => {
        if (!app.candidate || !app.job) return false;
        const matchesSearch = searchTerm === "" || 
          app.candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesJob = selectedJobFilter === "all" || 
          app.jobPostingId.toString() === selectedJobFilter;
        return matchesSearch && matchesJob;
      })
      .sort((a: Application, b: Application) => {
        // Sort by fitScore descending if showTopMatches is enabled
        if (showTopMatches) {
          return (b.fitScore || 0) - (a.fitScore || 0);
        }
        return 0;
      })
  })).filter((stage: PipelineStage) => 
    selectedStageFilter === "all" || stage.id === selectedStageFilter
  );

  const getStageStats = () => {
    const totalApplications = applications.length;
    const hiredCount = pipelineStages.find((s: PipelineStage) => s.id === "hired")?.count || 0;
    const rejectedCount = pipelineStages.find((s: PipelineStage) => s.id === "rejected")?.count || 0;
    const activeCount = totalApplications - hiredCount - rejectedCount;
    const conversionRate = totalApplications > 0 ? ((hiredCount / totalApplications) * 100).toFixed(1) : "0";
    return { totalApplications, hiredCount, rejectedCount, activeCount, conversionRate };
  };

  const stats = getStageStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <RecruiterNavbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pipeline Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your recruitment pipeline with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Search className="h-5 w-5 text-gray-400" />
            </div>
              <Select value={selectedJobFilter} onValueChange={(v: string) => setSelectedJobFilter(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobPostings.map((job: any) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              <Select value={selectedStageFilter} onValueChange={(v: string) => setSelectedStageFilter(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {defaultStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showTopMatches ? "default" : "outline"}
              onClick={() => setShowTopMatches((v) => !v)}
              className="ml-2"
            >
              {showTopMatches ? "Showing Top Matches" : "Top Matches"}
            </Button>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalApplications}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeCount}</p>
                  <p className="text-sm text-gray-600">Active Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hiredCount}</p>
                  <p className="text-sm text-gray-600">Hired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejectedCount}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-6">
          {filteredStages.map((stage) => (
            <Card key={stage.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleStageExpansion(stage.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {expandedStages.has(stage.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                    <div>
                      <h3 className="text-lg font-semibold">{stage.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{stage.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {stage.applications.length} candidates
                  </Badge>
                </div>
              </CardHeader>
              
              {expandedStages.has(stage.id) && (
                <CardContent className="p-0">
                  {stage.applications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No candidates in this stage</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stage.applications.map((application: Application, idx: number) => {
                        // Highlight top 3 matches if showTopMatches is enabled
                        const isTopMatch = showTopMatches && idx < 3 && (application.fitScore || 0) > 0;
                        return (
                          <div
                            key={application.id}
                            className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isTopMatch ? 'ring-2 ring-emerald-400 bg-emerald-50 dark:bg-emerald-900' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {application.candidate?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {application.candidate?.name || 'Unknown Candidate'}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {application.candidate?.email || 'No email provided'}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                                    <span className="text-sm text-gray-500">
                                      Applied to: {application.job?.title || 'Unknown Position'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(application.appliedAt).toLocaleDateString()}
                                    </span>
                                    {application.topSkills && application.topSkills.length > 0 && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">
                                        Top Skills: {application.topSkills.slice(0, 3).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* NLP Fit Score */}
                                {application.fitScore !== undefined && (
                                  <Badge variant={application.fitScore > 80 ? "default" : application.fitScore > 60 ? "secondary" : "outline"} className="mr-2 cursor-pointer" onClick={() => setSelectedNlpApplication(application)}>
                                    Fit Score: {application.fitScore}%
                                  </Badge>
                                )}
                                {/* NLP Insights Tooltip */}
                                {application.nlpInsights && (
                                  <Button variant="ghost" size="icon" title="View AI Insights" onClick={() => setSelectedNlpApplication(application)}>
                                    <BarChart3 className="h-4 w-4 text-blue-500" />
                                  </Button>
                                )}
                                {/* Score (legacy) */}
                                {application.score && (
                                  <Badge variant="outline" className="mr-2">
                                    Score: {application.score}%
                                  </Badge>
                                )}
                                {/* Interview Invite */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedApplication(application);
                                        setInterviewAssignmentData(prev => ({
                                          ...prev,
                                          role: application.job?.title || "",
                                          candidateId: application.userId || "",
                                          jobPostingId: application.jobPostingId?.toString() || ""
                                        }));
                                      }}
                                    >
                                      <Video className="h-4 w-4 mr-2" />
                                      Send Interview Invite
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Send Interview Invitation</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Assignment Type</Label>
                                        <Select 
                                          value={interviewAssignmentData.assignmentType} 
                                          onValueChange={(value) => 
                                            setInterviewAssignmentData(prev => ({ ...prev, assignmentType: value }))
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="virtual">Virtual AI Interview</SelectItem>
                                            <SelectItem value="mock">Mock Coding Test</SelectItem>
                                            <SelectItem value="test">Test Assignment</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Role</Label>
                                        <Input 
                                          value={interviewAssignmentData.role}
                                          onChange={(e) => 
                                            setInterviewAssignmentData(prev => ({ ...prev, role: e.target.value }))
                                          }
                                          placeholder="e.g., Senior Frontend Developer"
                                        />
                                      </div>
                                      <div>
                                        <Label>Due Date</Label>
                                        <Input 
                                          type="datetime-local"
                                          value={interviewAssignmentData.dueDate}
                                          onChange={(e) => 
                                            setInterviewAssignmentData(prev => ({ ...prev, dueDate: e.target.value }))
                                          }
                                        />
                                      </div>
                                      <div>
                                        <Label>Instructions</Label>
                                        <Textarea 
                                          value={interviewAssignmentData.instructions}
                                          onChange={(e) => 
                                            setInterviewAssignmentData(prev => ({ ...prev, instructions: e.target.value }))
                                          }
                                          placeholder="Additional instructions for the candidate..."
                                          rows={3}
                                        />
                                      </div>
                                      <Button 
                                        onClick={handleSendInterviewInvite}
                                        className="w-full"
                                        disabled={sendInterviewInviteMutation.isPending}
                                      >
                                        {sendInterviewInviteMutation.isPending ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Invitation
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                {/* Move Stage */}
                                <Select 
                                  value={application.stage || "applied"}
                                  onValueChange={(newStage) => 
                                    moveApplicationMutation.mutate({
                                      applicationId: application.id,
                                      newStage
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {defaultStages.map((stage) => (
                                      <SelectItem key={stage.id} value={stage.id}>
                                        {stage.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
        {/* Enhanced AI Analysis Modal */}
        {selectedNlpApplication && (
          <Dialog open={!!selectedNlpApplication} onOpenChange={() => setSelectedNlpApplication(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Enterprise AI Candidate Analysis
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Candidate Header */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedNlpApplication.candidate?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedNlpApplication.candidate?.name || 'Unknown Candidate'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedNlpApplication.candidate?.email || 'No email provided'}
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
                    <div className="text-3xl font-bold text-emerald-600">
                      {selectedNlpApplication.fitScore || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Match</div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Education</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-bold">{selectedNlpApplication.educationScore || 0}/100</div>
                        <div className="text-sm text-gray-600">{selectedNlpApplication.highestDegree || 'Not specified'}</div>
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
                        <div className="text-sm text-gray-600">{selectedNlpApplication.seniorityLevel || 'Entry-Level'}</div>
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

                {/* Strengths & Risks */}
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

                {/* Skills Analysis */}
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

                {/* Interview Recommendations */}
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

                {/* Job Match Details */}
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

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedNlpApplication(null)}>
                    Close Analysis
                  </Button>
                  <Button className="flex-1">
                    <Video className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}