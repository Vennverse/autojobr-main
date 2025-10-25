import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

// Helper functions to extract data from AI resume analysis
function determineSeniorityFromAnalysis(analysis: any, app: any): string {
  // Check analysis for seniority indicators
  const content = analysis.content || analysis;
  const strengths = content.strengthsFound || content.strengths || [];
  
  const strengthsText = strengths.join(' ').toLowerCase();
  
  if (strengthsText.includes('executive') || strengthsText.includes('c-level')) return 'Executive';
  if (strengthsText.includes('senior') || strengthsText.includes('lead')) return 'Senior';
  if (strengthsText.includes('mid-level') || strengthsText.includes('intermediate')) return 'Mid-Level';
  if (strengthsText.includes('junior') || strengthsText.includes('entry')) return 'Junior';
  
  // Fallback to experience years if available
  const years = extractExperienceYears(analysis, app);
  if (years >= 10) return 'Senior';
  if (years >= 5) return 'Mid-Level';
  if (years >= 2) return 'Junior';
  return 'Entry-Level';
}

function extractExperienceYears(analysis: any, app: any): number {
  // Try to get from app data first
  if (app.applicantYearsExperience) return app.applicantYearsExperience;
  
  // Parse from analysis
  const content = analysis.content || analysis;
  const text = JSON.stringify(content).toLowerCase();
  
  const yearMatches = text.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
  if (yearMatches) return parseInt(yearMatches[1]);
  
  return 0;
}

function extractDegree(analysis: any, app: any): string {
  // Try from app data first
  if (app.applicantEducation) {
    const edu = app.applicantEducation.toLowerCase();
    if (edu.includes('phd') || edu.includes('doctorate')) return 'PhD';
    if (edu.includes('master') || edu.includes('mba')) return 'Master\'s';
    if (edu.includes('bachelor')) return 'Bachelor\'s';
  }
  
  // Parse from analysis
  const content = analysis.content || analysis;
  const text = JSON.stringify(content).toLowerCase();
  
  if (text.includes('phd') || text.includes('doctorate')) return 'PhD';
  if (text.includes('master') || text.includes('mba')) return 'Master\'s';
  if (text.includes('bachelor')) return 'Bachelor\'s';
  
  return 'Not specified';
}

function calculateEducationScore(analysis: any, app: any): number {
  const degree = extractDegree(analysis, app);
  
  if (degree.includes('PhD')) return 100;
  if (degree.includes('Master')) return 90;
  if (degree.includes('Bachelor')) return 75;
  return 60;
}

function extractMatchedSkills(analysis: any, app: any): string[] {
  const content = analysis.content || analysis;
  
  // Get skills from keyword optimization
  const keywords = analysis.keywordOptimization?.suggestions || [];
  
  // Get skills from app data
  const appSkills = app.applicantSkills ? app.applicantSkills.split(',').map((s: string) => s.trim()) : [];
  
  // Combine and deduplicate
  const allSkills = [...keywords, ...appSkills].filter(Boolean);
  return [...new Set(allSkills)].slice(0, 8);
}

function extractTopSkills(analysis: any, app: any): string[] {
  return extractMatchedSkills(analysis, app).slice(0, 10);
}

function generateJobMatchHighlights(atsScore: number, analysis: any, app: any): string[] {
  const highlights = [
    `ATS Score: ${atsScore}/100`,
  ];
  
  const seniority = determineSeniorityFromAnalysis(analysis, app);
  const years = extractExperienceYears(analysis, app);
  if (years > 0) {
    highlights.push(`Experience: ${seniority} (${years} years)`);
  }
  
  const skills = extractMatchedSkills(analysis, app);
  if (skills.length > 0) {
    highlights.push(`Skills: ${skills.length} relevant matches`);
  }
  
  const degree = extractDegree(analysis, app);
  if (degree !== 'Not specified') {
    highlights.push(`Education: ${degree}`);
  }
  
  return highlights;
}

// Enhanced NLP Analysis Function - Uses Actual AI Resume Analysis Data
function analyzeApplicantNLP(app: any): Partial<Application> {
  // PRIORITY 1: Use existing AI resume analysis data if available
  const existingAtsScore = app.applicantAtsScore || app.atsScore;
  const existingResumeAnalysis = app.applicantResumeAnalysis;
  
  // Log what we're working with
  console.log(`[NLP] Analyzing ${app.applicantName} - ATS: ${existingAtsScore}, HasAnalysis: ${!!existingResumeAnalysis}`);
  
  // If we have AI analysis data, use it directly - even if score is 0
  if (existingResumeAnalysis || existingAtsScore > 0) {
    console.log(`[NLP] ✅ Using AI resume data for ${app.applicantName}:`, {
      atsScore: existingAtsScore,
      hasAnalysis: !!existingResumeAnalysis
    });

    return {
      fitScore: existingAtsScore || 0,
      seniorityLevel: determineSeniorityFromAnalysis(existingResumeAnalysis, app),
      totalExperience: extractExperienceYears(existingResumeAnalysis, app),
      highestDegree: extractDegree(existingResumeAnalysis, app),
      educationScore: calculateEducationScore(existingResumeAnalysis, app),
      companyPrestige: 75, // Default - could be enhanced
      matchedSkills: extractMatchedSkills(existingResumeAnalysis, app),
      topSkills: extractTopSkills(existingResumeAnalysis, app),
      strengths: existingResumeAnalysis?.content?.strengthsFound || 
                 existingResumeAnalysis?.strengths || 
                 ['Professional background'],
      riskFactors: (existingResumeAnalysis?.content?.weaknesses || 
                    existingResumeAnalysis?.weaknesses || 
                    []).map((w: string) => `${w}`),
      interviewFocus: (existingResumeAnalysis?.recommendations || []).slice(0, 3),
      jobMatchHighlights: generateJobMatchHighlights(existingAtsScore || 0, existingResumeAnalysis, app),
      nlpInsights: existingAtsScore ? `AI Analysis: ${existingAtsScore}/100 ATS Score` : 'Resume pending analysis'
    };
  }
  
  console.log(`[NLP] ⚠️ No AI data for ${app.applicantName}, using fallback analysis`);
  
  // FALLBACK: If no AI data, use basic profile analysis
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

  // Use actual AI-based ATS score if available, otherwise calculate
  let fitScore = existingAtsScore || 0;
  
  if (!fitScore || fitScore < 20) {
    // Fallback calculation if no AI score available
    const weights = { skills: 0.40, experience: 0.25, education: 0.15, company: 0.15, location: 0.05 };
    
    let skillsScore = 0;
    if (jobSkills.length > 0) {
      skillsScore = (matchedSkills.length / jobSkills.length) * 100;
    }

    const experienceScore = Math.min(100, maxExperience <= 2 ? maxExperience * 30 : maxExperience <= 5 ? 60 + (maxExperience - 2) * 15 : 105 + (maxExperience - 5) * 5);
    
    fitScore = Math.round(
      skillsScore * weights.skills +
      experienceScore * weights.experience +
      educationScore * weights.education +
      companyPrestige * weights.company +
      50 * weights.location // Default location score
    );
  }

  // Extract insights from AI resume analysis if available
  let strengths = [];
  let riskFactors = [];
  let interviewFocus = [];
  
  if (existingResumeAnalysis) {
    // Use AI-generated strengths and weaknesses from job seeker's resume analysis
    strengths = existingResumeAnalysis.content?.strengthsFound || 
                existingResumeAnalysis.strengths || [];
    
    // Convert weaknesses to risk factors
    const weaknesses = existingResumeAnalysis.content?.weaknesses || 
                       existingResumeAnalysis.weaknesses || [];
    riskFactors = weaknesses.map((w: string) => `Resume Issue: ${w}`);
    
    // Use AI recommendations as interview focus
    const recommendations = existingResumeAnalysis.recommendations || [];
    interviewFocus = recommendations.slice(0, 3).map((r: string) => `Focus: ${r}`);
  }
  
  // Fallback to basic analysis if no AI data
  if (strengths.length === 0) {
    if (fitScore >= 85) strengths.push("Exceptional overall match");
    if (companyPrestige >= 90) strengths.push("Top-tier company experience");
    if (maxExperience >= 10) strengths.push("Extensive industry experience");
    if (educationScore >= 90) strengths.push("Elite educational background");
    if (matchedSkills.length >= jobSkills.length * 0.8) strengths.push("Excellent skill alignment");
  }
  
  if (riskFactors.length === 0) {
    if (maxExperience < 1 && !profileSkills.length) riskFactors.push("Limited experience and skills");
    if (educationScore < 50 && maxExperience < 2) riskFactors.push("Lacks both education and experience");
    if (matchedSkills.length === 0 && jobSkills.length > 0) riskFactors.push("No matching technical skills");
  }
  
  if (interviewFocus.length === 0) {
    if (matchedSkills.length > 0) {
      interviewFocus.push(`Technical deep-dive: ${matchedSkills.slice(0, 3).join(", ")}`);
    }
    if (maxExperience >= 5) {
      interviewFocus.push("Leadership and project management experience");
    }
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
  communications?: Array<{
    id: number;
    type: 'email' | 'phone' | 'sms' | 'note';
    subject?: string;
    message: string;
    sentAt: string;
    sentBy: string;
    template?: string;
  }>;
  tags?: string[];
  rating?: number;
  source?: string;
  referredBy?: string;
  lastContactedAt?: string;
  nextFollowUpDate?: string;
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
  const [advancedFilters, setAdvancedFilters] = useState({
    skills: [] as string[],
    experience: { min: 0, max: 50 },
    education: [] as string[],
    location: [] as string[],
    scoreMin: 0,
    source: [] as string[],
    tags: [] as string[]
  });
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [bulkSelection, setBulkSelection] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [interviewAssignmentData, setInterviewAssignmentData] = useState({
    candidateId: "",
    jobPostingId: "",
    interviewType: "virtual",
    assignmentType: "virtual",
    role: "",
    company: "",
    difficulty: "medium",
    duration: 60,
    dueDate: "",
    instructions: "",
  });

  // Schedule appointment state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    applicationId: null as number | null,
    candidateName: "",
    candidateEmail: "",
    jobTitle: "",
    schedulingLink: "",
    appointmentType: "interview", // interview, meeting, phone_screen
    message: "",
    useTemplate: true,
    includeRecruiterContact: false,
    recruiterPhone: "",
    recruiterEmail: "",
    appointmentDate: "",
    appointmentTime: "",
    timezone: "America/New_York"
  });
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewContent, setEmailPreviewContent] = useState("");

  // Fetch applications and apply NLP analysis
  const { data: rawApplications = [], isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ["/api/recruiter/applications"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch candidate profiles with AI analysis data
  const { data: candidateProfiles = {} } = useQuery({
    queryKey: ["/api/recruiter/candidate-profiles"],
    enabled: rawApplications.length > 0,
  });

  // Transform applications with NLP analysis and AI resume data
  const applications = rawApplications.map((app: any) => {
    // Get candidate's AI resume analysis if available
    const candidateProfile = candidateProfiles[app.applicantId] || {};
    const enhancedApp = {
      ...app,
      applicantAtsScore: candidateProfile.atsScore,
      applicantResumeAnalysis: candidateProfile.resumeAnalysis,
    };
    
    const nlpData = analyzeApplicantNLP(enhancedApp);
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
      return apiRequest(`/api/recruiter/applications/${applicationId}/status`, "PATCH", {
        status: newStage,
        notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
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
      return apiRequest("/api/recruiter/applications/bulk", "POST", {
        action, applicationIds, notes
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
      return apiRequest(`/api/recruiter/applications/${applicationId}/notes`, "POST", {
        note
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
      return apiRequest("/api/interviews/schedule", "POST", {
        applicationId, type, scheduledAt
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

  // Send interview invite mutation
  const sendInterviewInviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint =
        data.assignmentType === "virtual"
          ? "/api/interviews/virtual/assign"
          : data.assignmentType === "mock"
          ? "/api/interviews/mock/assign"
          : "/api/test-assignments";
      return apiRequest(endpoint, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
      toast({
        title: "Interview Assigned",
        description: "Interview invitation sent successfully",
      });
      setShowInterviewDialog(false);
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

  // Schedule appointment mutation
  const scheduleAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/recruiter/schedule-appointment", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Appointment Scheduled",
        description: "Appointment email sent successfully to the candidate.",
      });
      setShowScheduleDialog(false);
      setShowEmailPreview(false);
      resetAppointmentForm();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to schedule appointment.",
        variant: "destructive",
      });
    },
  });

  // Handle send interview invite
  const handleSendInterviewInvite = () => {
    if (!selectedApplication) return;
    try {
      const assignmentData = {
        ...interviewAssignmentData,
        candidateId: selectedApplication.candidate.id,
        jobPostingId: selectedApplication.job.id,
        dueDate: new Date(interviewAssignmentData.dueDate).toISOString(),
      };
      sendInterviewInviteMutation.mutate(assignmentData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send interview invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset appointment form
  const resetAppointmentForm = () => {
    setAppointmentData({
      applicationId: null,
      candidateName: "",
      candidateEmail: "",
      jobTitle: "",
      schedulingLink: "",
      appointmentType: "interview",
      message: "",
      useTemplate: true,
      includeRecruiterContact: false,
      recruiterPhone: "",
      recruiterEmail: "",
      appointmentDate: "",
      appointmentTime: "",
      timezone: "America/New_York"
    });
  };

  // Handle schedule appointment
  const handleScheduleAppointment = (application: Application) => {
    setAppointmentData({
      ...appointmentData,
      applicationId: application.id,
      candidateName: application.candidate.name,
      candidateEmail: application.candidate.email,
      jobTitle: application.job.title,
    });
    setShowScheduleDialog(true);
  };

  // Generate email template
  const generateAppointmentTemplate = () => {
    const { candidateName, jobTitle, appointmentType, schedulingLink, appointmentDate, appointmentTime, timezone } = appointmentData;
    
    let appointmentTypeText = "appointment";
    if (appointmentType === "interview") appointmentTypeText = "interview";
    else if (appointmentType === "phone_screen") appointmentTypeText = "phone screening";
    else if (appointmentType === "meeting") appointmentTypeText = "meeting";

    const dateTimeInfo = appointmentDate && appointmentTime 
      ? `\n\nScheduled for: ${new Date(appointmentDate + 'T' + appointmentTime).toLocaleDateString()} at ${appointmentTime} (${timezone})`
      : "";

    const contactInfo = appointmentData.includeRecruiterContact 
      ? `\n\nIf you have any questions, please contact me:\n${appointmentData.recruiterEmail ? `📧 Email: ${appointmentData.recruiterEmail}` : ''}${appointmentData.recruiterPhone ? `\n📞 Phone: ${appointmentData.recruiterPhone}` : ''}`
      : "";

    return `Dear ${candidateName},

I hope this email finds you well. I'm reaching out regarding your application for the ${jobTitle} position.

I'd like to schedule an ${appointmentTypeText} with you to discuss your background and the opportunity in more detail.${dateTimeInfo}

Please use the following link to schedule a convenient time for our ${appointmentTypeText}:
🗓️ ${schedulingLink}

Looking forward to speaking with you soon!${contactInfo}

Best regards,\n${user?.name || 'The Recruiting Team'}\nAutoJobr`;
  };

  // Handle preview email
  const handlePreviewEmail = () => {
    const content = appointmentData.useTemplate ? generateAppointmentTemplate() : appointmentData.message;
    setEmailPreviewContent(content);
    setShowEmailPreview(true);
  };

  // Handle send appointment email
  const handleSendAppointmentEmail = () => {
    const emailContent = appointmentData.useTemplate ? generateAppointmentTemplate() : appointmentData.message;
    
    const emailData = {
      ...appointmentData,
      finalEmailContent: emailContent,
    };
    
    scheduleAppointmentMutation.mutate(emailData);
  };

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
    // Find the application being moved
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;
    
    // Optimistic update
    queryClient.setQueryData(["/api/recruiter/applications"], 
      (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((application: any) => 
          application.id === applicationId 
            ? { ...application, status: newStage } 
            : application
        );
      }
    );
    
    // Execute mutation
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
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    if (bulkSelection.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select applications to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }
    try {
      bulkActionMutation.mutate({
        action,
        applicationIds: Array.from(bulkSelection),
        notes: `Bulk action: ${action}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (filteredApplications.length === 0) {
      toast({
        title: "No Data",
        description: "No candidates to export. Please adjust your filters.",
        variant: "destructive",
      });
      return;
    }

    try {
      // CSV Headers
      const headers = [
        "Candidate Name",
        "Email",
        "Phone",
        "Position",
        "Current Stage",
        "Fit Score",
        "Experience",
        "Education",
        "Skills",
        "Applied Date",
        "Notes"
      ];

      // Convert applications to CSV rows
      const rows = filteredApplications.map((app: Application) => {
        const stageName = PIPELINE_STAGES.find(s => s.id === app.status)?.name || app.status;
        const skills = app.matchedSkills?.join("; ") || "";
        const appliedDate = new Date(app.appliedAt).toLocaleDateString();
        const experience = app.seniorityLevel 
          ? `${app.seniorityLevel} (${app.totalExperience || 0} years)`
          : `${app.totalExperience || 0} years`;
        
        return [
          app.candidate.name || "",
          app.candidate.email || "",
          app.candidate.phone || "",
          app.job.title || "",
          stageName,
          app.fitScore?.toString() || "",
          experience,
          app.highestDegree || "",
          skills,
          appliedDate,
          app.recruiterNotes || ""
        ];
      });

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value: string) => {
        if (!value) return '""';
        const stringValue = value.toString();
        if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return `"${stringValue}"`;
      };

      // Build CSV content
      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row: string[]) => row.map(escapeCSV).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `candidates-export-${date}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredApplications.length} candidates to ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV. Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-gray-50 dark:from-gray-900 dark:to-gray-800">
      <RecruiterNavbar user={user} />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Simplified Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Recruitment Pipeline
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {filteredApplications.length} candidates • Drag & drop to move between stages
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  onClick={() => setViewMode("kanban")}
                  size="sm"
                  className="px-3"
                  data-testid="button-kanban-view"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Board
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  size="sm"
                  className="px-3"
                  data-testid="button-list-view"
                >
                  <Users className="w-4 h-4 mr-1" />
                  List
                </Button>
              </div>
              
              <Button 
                onClick={() => refetchApplications()}
                variant="outline"
                size="sm"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Simplified Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {filteredApplications.length}
                  </p>
                </div>
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {filteredApplications.filter(app => !["hired", "rejected"].includes(app.status)).length}
                  </p>
                </div>
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Hired</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {filteredApplications.filter(app => app.status === "hired").length}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Success</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {filteredApplications.length > 0 ? Math.round((filteredApplications.filter(app => app.status === "hired").length / filteredApplications.length) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clearer Filters */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Name, email, or job..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                    data-testid="input-search-candidates"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Job Position</Label>
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger className="h-9" data-testid="select-job-filter">
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
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Stage</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="h-9" data-testid="select-stage-filter">
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
                        disabled={bulkActionMutation.isPending}
                        data-testid="button-bulk-shortlist"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Shortlist
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction("reject")}
                        disabled={bulkActionMutation.isPending}
                        data-testid="button-bulk-reject"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction("schedule_interview")}
                        disabled={bulkActionMutation.isPending}
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

        {/* Improved Pipeline View */}
        {viewMode === "kanban" ? (
          <div className="overflow-x-auto">
            <div className="inline-flex gap-4 pb-4 min-w-full">
            {pipelineStages.map((stage) => {
              const StageIcon = stage.icon;
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-gray-200 dark:border-gray-700 flex flex-col"
                  style={{ maxHeight: 'calc(100vh - 400px)' }}
                >
                  <div className="p-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${stage.color} bg-opacity-20 flex items-center justify-center`}>
                          <StageIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {stage.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-bold">
                        {stage.count}
                      </Badge>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 p-2 space-y-2 overflow-y-auto"
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
                          whileHover={{ scale: 1.01, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                          className="p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-100 dark:border-gray-600 cursor-move hover:border-blue-300 transition-all"
                          onClick={() => setSelectedApplication(application)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, application.id)}
                          onDragEnd={handleDragEnd}
                          data-testid={`card-application-${application.id}`}
                        >
                          {/* Candidate Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Avatar className="w-9 h-9 border-2 border-gray-200">
                                <AvatarImage src={application.candidate.avatar} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                                  {application.candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                  {application.candidate.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {application.job.title}
                                </p>
                              </div>
                            </div>
                            {application.fitScore && (
                              <Badge 
                                className={`text-xs font-bold ${
                                  application.fitScore >= 80 ? 'bg-green-100 text-green-700' :
                                  application.fitScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}
                              >
                                {application.fitScore}%
                              </Badge>
                            )}
                          </div>
                          
                          {/* Quick Info Tags */}
                          {(application.seniorityLevel || application.totalExperience) && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {application.seniorityLevel && (
                                <Badge variant="secondary" className="text-xs py-0">
                                  {application.seniorityLevel}
                                </Badge>
                              )}
                              {application.totalExperience && application.totalExperience > 0 && (
                                <Badge variant="outline" className="text-xs py-0">
                                  {application.totalExperience}y
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Action Buttons - Simplified */}
                          <div className="flex gap-1 pt-2 border-t border-gray-100 dark:border-gray-600">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(application);
                              }}
                              title="View Details"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(application);
                                setShowInterviewDialog(true);
                                setInterviewAssignmentData((prev) => ({
                                  ...prev,
                                  role: application.job?.title || "",
                                  candidateId: application.candidate.id,
                                  jobPostingId: application.job.id.toString(),
                                }));
                              }}
                              title="Interview"
                              data-testid={`button-interview-kanban-${application.id}`}
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Meet
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduleAppointment(application);
                              }}
                              title="Schedule"
                              data-testid={`button-schedule-kanban-${application.id}`}
                            >
                              <Calendar className="w-3 h-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                      {stage.applications.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">No candidates</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
                          <div className="space-y-2">
                            {application.fitScore && (
                              <div className="flex items-center">
                                <Progress value={application.fitScore} className="w-16 mr-2" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {application.fitScore}%
                                </span>
                              </div>
                            )}
                            {/* Enhanced Analytics Display for List View */}
                            <div className="flex flex-wrap gap-1">
                              {application.seniorityLevel && (
                                <Badge variant="secondary" className="text-xs">
                                  {application.seniorityLevel}
                                </Badge>
                              )}
                              {application.totalExperience && application.totalExperience > 0 && (
                                <Badge variant="outline" className="text-xs text-blue-600">
                                  {application.totalExperience}y
                                </Badge>
                              )}
                              {application.highestDegree && application.highestDegree !== "High School" && (
                                <Badge variant="outline" className="text-xs text-purple-600">
                                  {application.highestDegree}
                                </Badge>
                              )}
                            </div>
                          </div>
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
                              data-testid={`button-nlp-analysis-${application.id}`}
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
                              data-testid={`button-resume-scoring-${application.id}`}
                            >
                              <Target className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-purple-600 border-purple-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(application);
                                setShowInterviewDialog(true);
                                setInterviewAssignmentData((prev) => ({
                                  ...prev,
                                  role: application.job?.title || "",
                                  candidateId: application.candidate.id,
                                  jobPostingId: application.job.id.toString(),
                                }));
                              }}
                              title="Assign AI Interview"
                              data-testid={`button-assign-interview-${application.id}`}
                            >
                              <Video className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-orange-600 border-orange-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(application);
                                setShowInterviewDialog(true);
                                setInterviewAssignmentData((prev) => ({
                                  ...prev,
                                  assignmentType: "test",
                                  role: application.job?.title || "",
                                  candidateId: application.candidate.id,
                                  jobPostingId: application.job.id.toString(),
                                }));
                              }}
                              title="Assign Test"
                              data-testid={`button-assign-test-${application.id}`}
                            >
                              <Code className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-indigo-600 border-indigo-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduleAppointment(application);
                              }}
                              title="Schedule Appointment"
                              data-testid={`button-schedule-list-${application.id}`}
                            >
                              <Calendar className="w-4 h-4" />
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
                          <Button 
                            className="w-full" 
                            variant="outline" 
                            onClick={() => {
                              const emailSubject = `Regarding your application for ${selectedApplication.jobPostingTitle}`;
                              const emailBody = `Dear ${selectedApplication.applicantFirstName || 'Candidate'},\n\nThank you for your application for the ${selectedApplication.jobPostingTitle} position.\n\nBest regards,\nThe Recruitment Team`;
                              const mailto = `mailto:${selectedApplication.applicantEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                              window.open(mailto, '_blank');
                            }}
                            data-testid="button-send-email"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </Button>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                // Create or find existing conversation with this applicant
                                const response = await fetch('/api/simple-chat/conversations', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    participantId: selectedApplication.applicantId,
                                    initialMessage: `Hi ${selectedApplication.applicantFirstName || 'there'}, I wanted to discuss your application for the ${selectedApplication.jobPostingTitle} position.`
                                  }),
                                });
                                
                                if (response.ok) {
                                  const { conversationId } = await response.json();
                                  // Redirect to simple chat page with the conversation ID
                                  window.open(`/simple-chat?conversation=${conversationId}`, '_blank');
                                } else {
                                  console.error('Failed to create conversation');
                                  toast({
                                    title: "Error",
                                    description: "Failed to start chat. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              } catch (error) {
                                console.error('Error starting chat:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to start chat. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            data-testid="button-open-chat"
                          >
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

        {/* Interview Assignment Dialog */}
        <Dialog open={showInterviewDialog} onOpenChange={setShowInterviewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Interview Invitation</DialogTitle>
              <DialogDescription>
                {selectedApplication && `Assign interview or test to ${selectedApplication.candidate.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Assignment Type</Label>
                <Select
                  value={interviewAssignmentData.assignmentType}
                  onValueChange={(value) =>
                    setInterviewAssignmentData((prev) => ({ ...prev, assignmentType: value }))
                  }
                >
                  <SelectTrigger data-testid="select-assignment-type">
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
                    setInterviewAssignmentData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  placeholder="e.g., Senior Frontend Developer"
                  data-testid="input-role"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="datetime-local"
                  value={interviewAssignmentData.dueDate}
                  onChange={(e) =>
                    setInterviewAssignmentData((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  data-testid="input-due-date"
                />
              </div>
              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={interviewAssignmentData.instructions}
                  onChange={(e) =>
                    setInterviewAssignmentData((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  placeholder="Additional instructions for the candidate..."
                  rows={3}
                  data-testid="textarea-instructions"
                />
              </div>
              <Button
                onClick={handleSendInterviewInvite}
                className="w-full"
                disabled={sendInterviewInviteMutation.isPending}
                data-testid="button-send-invitation"
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

          {/* Schedule Appointment Dialog */}
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>📅 Schedule Appointment</DialogTitle>
                <DialogDescription>
                  Schedule an appointment with {appointmentData.candidateName} for the {appointmentData.jobTitle} position
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Candidate Name</Label>
                    <Input
                      value={appointmentData.candidateName}
                      readOnly
                      className="bg-gray-50"
                      data-testid="input-candidate-name"
                    />
                  </div>
                  <div>
                    <Label>Candidate Email</Label>
                    <Input
                      value={appointmentData.candidateEmail}
                      readOnly
                      className="bg-gray-50"
                      data-testid="input-candidate-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      value={appointmentData.jobTitle}
                      readOnly
                      className="bg-gray-50"
                      data-testid="input-job-title"
                    />
                  </div>
                  <div>
                    <Label>Appointment Type</Label>
                    <Select
                      value={appointmentData.appointmentType}
                      onValueChange={(value) => setAppointmentData(prev => ({ ...prev, appointmentType: value }))}
                    >
                      <SelectTrigger data-testid="select-appointment-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="phone_screen">Phone Screen</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Scheduling Link *</Label>
                  <Input
                    value={appointmentData.schedulingLink}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, schedulingLink: e.target.value }))}
                    placeholder="e.g., https://calendly.com/yourname or https://calendar.google.com/..."
                    data-testid="input-scheduling-link"
                  />
                  <p className="text-sm text-gray-500 mt-1">Calendly, Google Calendar, or any other scheduling link</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Date (Optional)</Label>
                    <Input
                      type="date"
                      value={appointmentData.appointmentDate}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                      data-testid="input-appointment-date"
                    />
                  </div>
                  <div>
                    <Label>Time (Optional)</Label>
                    <Input
                      type="time"
                      value={appointmentData.appointmentTime}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                      data-testid="input-appointment-time"
                    />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Select
                      value={appointmentData.timezone}
                      onValueChange={(value) => setAppointmentData(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger data-testid="select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Email Content</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-template"
                      checked={appointmentData.useTemplate}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, useTemplate: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="use-template" className="font-normal">Use email template</Label>
                  </div>
                  
                  {!appointmentData.useTemplate && (
                    <Textarea
                      value={appointmentData.message}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Write your custom email message here..."
                      rows={6}
                      data-testid="textarea-custom-message"
                    />
                  )}
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="include-contact"
                      checked={appointmentData.includeRecruiterContact}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, includeRecruiterContact: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="include-contact" className="font-medium">Include your contact information</Label>
                  </div>
                  
                  {appointmentData.includeRecruiterContact && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Your Email</Label>
                        <Input
                          value={appointmentData.recruiterEmail}
                          onChange={(e) => setAppointmentData(prev => ({ ...prev, recruiterEmail: e.target.value }))}
                          placeholder="your.email@company.com"
                          data-testid="input-recruiter-email"
                        />
                      </div>
                      <div>
                        <Label>Your Phone</Label>
                        <Input
                          value={appointmentData.recruiterPhone}
                          onChange={(e) => setAppointmentData(prev => ({ ...prev, recruiterPhone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                          data-testid="input-recruiter-phone"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowScheduleDialog(false);
                      resetAppointmentForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePreviewEmail}
                    disabled={!appointmentData.schedulingLink}
                    data-testid="button-preview-email"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Email
                  </Button>
                  <Button
                    onClick={handleSendAppointmentEmail}
                    disabled={!appointmentData.schedulingLink || scheduleAppointmentMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    data-testid="button-send-appointment"
                  >
                    {scheduleAppointmentMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Appointment Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Email Preview Dialog */}
          <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>📧 Email Preview</DialogTitle>
                <DialogDescription>
                  Review the email that will be sent to {appointmentData.candidateName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="border-b pb-3 mb-4">
                    <div className="text-sm text-gray-600">To: {appointmentData.candidateEmail}</div>
                    <div className="text-sm text-gray-600">
                      Subject: Schedule {appointmentData.appointmentType === 'interview' ? 'Interview' : appointmentData.appointmentType === 'phone_screen' ? 'Phone Screen' : 'Meeting'} - {appointmentData.jobTitle}
                    </div>
                  </div>
                  
                  <div className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded border">
                    {emailPreviewContent}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailPreview(false)}
                  >
                    Close Preview
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEmailPreview(false);
                      handleSendAppointmentEmail();
                    }}
                    disabled={scheduleAppointmentMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    data-testid="button-send-from-preview"
                  >
                    {scheduleAppointmentMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}