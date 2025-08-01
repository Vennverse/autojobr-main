// pages/PipelineManagement.tsx
import React, { useState, useEffect } from "react";
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
// Placeholder: Replace with actual import
// import { InterviewAssignmentModal } from "@/components/InterviewAssignmentModal";
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
} from "lucide-react";

interface RawApplication {
  id: number;
  applicantId: string;
  jobPostingId: number;
  status: string;
  appliedAt: string;
  recruiterNotes?: string;
  stage?: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantLocation?: string;
  applicantEducation?: string;
  applicantExperience?: string;
  applicantSkills?: string;
  applicantBio?: string;
  applicantSummary?: string;
  applicantProfileImageUrl?: string;
  jobPostingTitle?: string;
  jobPostingDescription?: string;
  jobPostingRequirements?: string;
  jobPostingCompany?: string;
  jobPostingLocation?: string;
  updatedAt?: string;
}

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
  fitScore?: number;
  nlpInsights?: string;
  topSkills?: string[];
  jobMatchHighlights?: string[];
  seniorityLevel?: string;
  totalExperience?: number;
  highestDegree?: string;
  educationScore?: number;
  companyPrestige?: number;
  matchedSkills?: string[];
  strengths?: string[];
  riskFactors?: string[];
  interviewFocus?: string[];
  workHistory?: Array<{ company: string; prestige: number }>;
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
    count: 0,
  },
  {
    id: "phone_screen",
    name: "Phone Screen",
    color: "bg-yellow-500",
    description: "Initial phone screening",
    applications: [],
    count: 0,
  },
  {
    id: "technical_interview",
    name: "Technical Interview",
    color: "bg-purple-500",
    description: "Technical assessment",
    applications: [],
    count: 0,
  },
  {
    id: "final_interview",
    name: "Final Interview",
    color: "bg-green-500",
    description: "Final round interviews",
    applications: [],
    count: 0,
  },
  {
    id: "offer_extended",
    name: "Offer Extended",
    color: "bg-emerald-500",
    description: "Offer sent to candidate",
    applications: [],
    count: 0,
  },
  {
    id: "hired",
    name: "Hired",
    color: "bg-green-600",
    description: "Successfully hired",
    applications: [],
    count: 0,
  },
  {
    id: "rejected",
    name: "Rejected",
    color: "bg-red-500",
    description: "Not moving forward",
    applications: [],
    count: 0,
  },
];

function analyzeApplicantNLP(app: RawApplication): Partial<Application> {
  // Optimized text preprocessing with caching
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
    .replace(/[^\w\s.-]/g, " ") // Clean special chars
    .replace(/\s+/g, " "); // Normalize whitespace

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

  // Enhanced skill database with global professions
  const skillsDatabase = {
    // Technology & Engineering
    programming: {
      languages: ["javascript", "python", "java", "typescript", "c++", "c#", "go", "rust", "kotlin", "swift", "php", "ruby", "scala", "r"],
      frontend: ["react", "vue", "angular", "nextjs", "svelte", "html", "css", "sass", "tailwind", "bootstrap", "jquery"],
      backend: ["nodejs", "express", "django", "flask", "spring", "laravel", "rails", "fastapi", "nestjs"],
      databases: ["sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "oracle"],
      cloud: ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "github actions", "ci/cd"],
      mobile: ["react native", "flutter", "ios", "android", "xamarin", "ionic"],
      aiml: ["machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "sklearn", "nlp", "computer vision"],
      devops: ["docker", "kubernetes", "jenkins", "ansible", "terraform", "monitoring", "logging"],
    },
    
    // Business & Management
    business: {
      management: ["project management", "strategic planning", "operations management", "leadership", "team management", "change management", "agile", "scrum", "six sigma"],
      sales: ["sales", "business development", "b2b sales", "crm", "lead generation", "sales strategy", "account management", "pipeline management"],
      marketing: ["digital marketing", "seo", "sem", "content marketing", "social media", "email marketing", "marketing automation", "brand management", "campaign management"],
      finance: ["financial analysis", "accounting", "budgeting", "forecasting", "auditing", "taxation", "financial modeling", "investment analysis", "risk management"],
      hr: ["recruitment", "talent acquisition", "performance management", "employee relations", "compensation", "benefits", "training", "organizational development"],
      operations: ["supply chain", "logistics", "inventory management", "process improvement", "quality assurance", "vendor management", "procurement"],
      consulting: ["strategy consulting", "management consulting", "process optimization", "business analysis", "stakeholder management"],
    },

    // Healthcare & Life Sciences
    healthcare: {
      clinical: ["nursing", "patient care", "diagnostics", "surgery", "pharmacy", "physiotherapy", "radiology", "laboratory", "emergency medicine"],
      administration: ["healthcare management", "medical billing", "health informatics", "clinical research", "regulatory affairs", "quality assurance"],
      specialties: ["cardiology", "oncology", "pediatrics", "psychiatry", "dermatology", "orthopedics", "neurology"],
    },

    // Education & Training
    education: {
      teaching: ["teaching", "curriculum development", "pedagogy", "classroom management", "e-learning", "instructional design", "educational technology"],
      administration: ["education administration", "academic advising", "student counseling", "admissions", "educational leadership"],
      specialties: ["early childhood", "special education", "higher education", "vocational training", "corporate training"],
    },

    // Creative & Media
    creative: {
      design: ["graphic design", "ui/ux design", "web design", "product design", "interior design", "industrial design", "photoshop", "illustrator", "figma"],
      media: ["video editing", "photography", "content creation", "copywriting", "journalism", "public relations", "broadcasting"],
      arts: ["animation", "3d modeling", "game design", "music production", "film production"],
    },

    // Legal & Compliance
    legal: {
      practice: ["corporate law", "litigation", "contract law", "intellectual property", "employment law", "tax law", "regulatory compliance"],
      support: ["paralegal", "legal research", "document review", "case management", "compliance monitoring"],
    },

    // Manufacturing & Engineering
    engineering: {
      disciplines: ["mechanical engineering", "electrical engineering", "civil engineering", "chemical engineering", "software engineering", "industrial engineering"],
      manufacturing: ["lean manufacturing", "quality control", "production planning", "safety management", "maintenance", "automation"],
      construction: ["project management", "site management", "cost estimation", "safety compliance", "blueprints", "surveying"],
    },

    // Customer Service & Support
    service: {
      support: ["customer service", "technical support", "help desk", "call center", "customer success", "account management"],
      hospitality: ["hotel management", "restaurant management", "event planning", "tourism", "guest relations"],
      retail: ["retail management", "merchandising", "inventory", "sales associate", "store operations"],
    },

    // Research & Analytics
    research: {
      data: ["data analysis", "data science", "statistics", "research methodology", "survey design", "market research", "business intelligence"],
      scientific: ["laboratory research", "clinical trials", "scientific writing", "grant writing", "protocol development"],
    },
  };

  // More efficient fuzzy matching with optimized regex
  const compiledPatterns = new Map<string, RegExp>();
  
  function getPattern(skill: string, isLocation = false): RegExp {
    const key = `${skill}-${isLocation}`;
    if (!compiledPatterns.has(key)) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = isLocation 
        ? new RegExp(`\\b${escaped}(?:\\s+(?:city|state|province|region|area))?\\b`, 'i')
        : new RegExp(`\\b${escaped}(?:js|css|html|api|framework|library)?\\b`, 'i');
      compiledPatterns.set(key, pattern);
    }
    return compiledPatterns.get(key)!;
  }

  function fuzzyIncludes(text: string, skill: string, isLocation = false): boolean {
    // Check direct match first (fastest)
    const pattern = getPattern(skill, isLocation);
    if (pattern.test(text)) return true;

    // Enhanced aliases with global variations
    const aliases: Record<string, string[]> = {
      javascript: ["js", "javascript", "ecmascript", "node.js", "nodejs"],
      typescript: ["ts", "typescript"],
      python: ["py", "python", "python3"],
      react: ["react", "reactjs", "react.js", "react native"],
      angular: ["angular", "angularjs", "angular2+"],
      vue: ["vue", "vuejs", "vue.js"],
      sql: ["sql", "mysql", "postgresql", "postgres", "sqlite", "database", "db"],
      marketing: ["marketing", "digital marketing", "online marketing", "internet marketing", "growth marketing"],
      sales: ["sales", "selling", "business development", "bd", "account executive", "ae"],
      management: ["management", "managing", "leadership", "team lead", "supervisor"],
      finance: ["finance", "financial", "accounting", "bookkeeping", "cpa"],
      hr: ["hr", "human resources", "people operations", "talent", "recruitment", "recruiting"],
      // Location aliases
      newyork: ["new york", "ny", "nyc", "new york city", "manhattan", "brooklyn"],
      london: ["london", "london uk", "greater london"],
      mumbai: ["mumbai", "bombay", "maharashtra"],
      bangalore: ["bangalore", "bengaluru", "karnataka"],
      singapore: ["singapore", "sg"],
      toronto: ["toronto", "gta", "ontario"],
      sydney: ["sydney", "nsw", "new south wales"],
      remote: ["remote", "work from home", "wfh", "telecommute", "distributed", "anywhere"],
    };

    const normalized = skill.replace(/\s+/g, "").toLowerCase();
    if (aliases[normalized]) {
      return aliases[normalized].some(alias => getPattern(alias, isLocation).test(text));
    }
    return false;
  }

  // Flatten skills more efficiently
  const allSkills = Object.values(skillsDatabase)
    .flatMap(domain => Object.values(domain))
    .flat();

  const extractedSkills = {
    profile: allSkills.filter(skill => fuzzyIncludes(profileText, skill)),
    job: allSkills.filter(skill => fuzzyIncludes(jobText, skill)),
  };

  // Enhanced experience extraction with multiple patterns
  const experiencePatterns = [
    { pattern: /(\d+)(?:\+|plus)?\s*(?:to\s*\d+\s*)?(?:years?|yrs?|y)\s*(?:of\s*)?(?:experience|exp)/gi, weight: 1.0 },
    { pattern: /(?:over|more\s*than|above)\s*(\d+)\s*(?:years?|yrs?)/gi, weight: 1.1 },
    { pattern: /(\d+)(?:\+|plus)\s*(?:years?|yrs?)/gi, weight: 1.2 },
    { pattern: /(\d{4})\s*[-–to]\s*(\d{4}|\w+)/gi, weight: 1.0 }, // Date ranges
    { pattern: /(?:since|from)\s*(\d{4})/gi, weight: 0.9 },
  ];

  let maxExperience = 0;
  const currentYear = new Date().getFullYear();

  experiencePatterns.forEach(({ pattern, weight }) => {
    let match;
    while ((match = pattern.exec(profileText)) !== null) {
      let years = 0;
      
      if (match[0].includes('-') || match[0].includes('–') || match[0].includes('to')) {
        // Handle date ranges
        const startYear = parseInt(match[1]);
        const endYear = match[2] === 'present' || match[2] === 'current' ? currentYear : parseInt(match[2]);
        if (startYear && endYear && endYear >= startYear) {
          years = (endYear - startYear) * weight;
        }
      } else if (match[0].includes('since') || match[0].includes('from')) {
        // Handle "since year" patterns
        const startYear = parseInt(match[1]);
        if (startYear && startYear <= currentYear) {
          years = (currentYear - startYear) * weight;
        }
      } else {
        // Handle explicit year mentions
        years = parseInt(match[1]) * weight;
      }
      
      maxExperience = Math.max(maxExperience, years);
    }
  });

  // Improved seniority classification
  let seniorityLevel = "Entry-Level";
  if (maxExperience >= 15) seniorityLevel = "Executive";
  else if (maxExperience >= 10) seniorityLevel = "Senior";
  else if (maxExperience >= 5) seniorityLevel = "Mid-Level";
  else if (maxExperience >= 2) seniorityLevel = "Junior";

  // Enhanced education scoring with global institutions
  const educationData = {
    degrees: {
      phd: { score: 100, level: "PhD/Doctorate" },
      doctorate: { score: 100, level: "PhD/Doctorate" },
      "d.phil": { score: 100, level: "PhD/Doctorate" },
      mba: { score: 95, level: "MBA" },
      "master": { score: 85, level: "Master's" },
      "m.s": { score: 85, level: "Master's" },
      "m.sc": { score: 85, level: "Master's" },
      "m.a": { score: 85, level: "Master's" },
      "m.eng": { score: 90, level: "Master's" },
      "bachelor": { score: 70, level: "Bachelor's" },
      "b.s": { score: 70, level: "Bachelor's" },
      "b.sc": { score: 70, level: "Bachelor's" },
      "b.a": { score: 70, level: "Bachelor's" },
      "b.tech": { score: 75, level: "Bachelor's" },
      "b.e": { score: 75, level: "Bachelor's" },
      "associate": { score: 55, level: "Associate" },
      "diploma": { score: 50, level: "Diploma" },
      "certificate": { score: 40, level: "Certificate" },
    },
    institutions: {
      // Top Global Universities
      mit: 100, stanford: 100, harvard: 100, caltech: 100, oxford: 100, cambridge: 100,
      eth: 95, imperial: 95, ucl: 95, princeton: 100, yale: 95, columbia: 90,
      // Top Asian Universities
      tsinghua: 95, peking: 95, nus: 95, ntu: 95, "university of tokyo": 95, kyoto: 90,
      iit: 90, iim: 90, iisc: 90, "chinese university": 85,
      // Top European Universities
      sorbonne: 90, "eth zurich": 95, "technical university": 85, epfl: 90,
      // Top Australian Universities
      melbourne: 85, sydney: 85, anu: 85, "university of queensland": 80,
      // Top Canadian Universities
      toronto: 90, mcgill: 85, waterloo: 90, ubc: 85,
      // Other notable institutions
      berkeley: 95, michigan: 85, carnegie: 90, cornell: 90, "georgia tech": 85,
    },
  };

  let educationScore = 0;
  let highestDegree = "High School";
  
  // Check degrees
  Object.entries(educationData.degrees).forEach(([degree, data]) => {
    if (fuzzyIncludes(profileText, degree)) {
      if (data.score > educationScore) {
        educationScore = data.score;
        highestDegree = data.level;
      }
    }
  });

  // Check institutions with better scoring
  Object.entries(educationData.institutions).forEach(([inst, score]) => {
    if (fuzzyIncludes(profileText, inst)) {
      educationScore = Math.max(educationScore, educationScore * 0.6 + score * 0.4);
    }
  });

  // Enhanced company prestige with global companies
  const prestigiousCompanies = {
    // Tech Giants
    google: 100, microsoft: 100, apple: 100, amazon: 100, meta: 95, facebook: 95,
    netflix: 90, tesla: 95, nvidia: 95, salesforce: 85, adobe: 80,
    // Asian Tech
    tencent: 95, alibaba: 95, baidu: 85, bytedance: 90, didi: 80, xiaomi: 80,
    samsung: 90, sk: 85, lg: 80, sony: 85, softbank: 85,
    // Financial Services
    jpmorgan: 90, "goldman sachs": 95, "morgan stanley": 90, blackrock: 90,
    citi: 85, "bank of america": 85, wells: 80, hsbc: 85, ubs: 85,
    // Consulting
    mckinsey: 100, bain: 95, bcg: 95, deloitte: 85, pwc: 85, ey: 85, kpmg: 80,
    // Traditional Companies
    ibm: 80, oracle: 80, sap: 85, siemens: 85, ge: 80, boeing: 85,
    toyota: 85, volkswagen: 80, bmw: 85, mercedes: 85,
    // Unicorns & High-growth
    stripe: 90, airbnb: 85, uber: 80, spotify: 80, zoom: 80, slack: 80,
  };

  let companyPrestige = 0;
  let workHistory: Array<{ company: string; prestige: number }> = [];
  
  Object.entries(prestigiousCompanies).forEach(([company, score]) => {
    if (fuzzyIncludes(profileText, company)) {
      companyPrestige = Math.max(companyPrestige, score);
      workHistory.push({ company, prestige: score });
    }
  });

  // Optimized scoring algorithm
  const weights = {
    skills: 0.40,      // Increased weight for skills
    experience: 0.25,
    education: 0.15,
    company: 0.15,
    location: 0.05,    // Reduced weight for location
  };

  // Skills scoring with context awareness
  const jobSkills = extractedSkills.job;
  const profileSkills = extractedSkills.profile;
  const matchedSkills = jobSkills.filter(skill => profileSkills.includes(skill));
  
  // Enhanced skills scoring with domain clustering
  let skillsScore = 0;
  if (jobSkills.length > 0) {
    const baseMatch = (matchedSkills.length / jobSkills.length) * 100;
    // Bonus for having more skills than required (shows depth)
    const skillDepthBonus = Math.min(20, (profileSkills.length - matchedSkills.length) * 2);
    skillsScore = Math.min(100, baseMatch + skillDepthBonus);
  }

  // Experience scoring with diminishing returns
  const experienceScore = Math.min(100, 
    maxExperience <= 2 ? maxExperience * 30 :
    maxExperience <= 5 ? 60 + (maxExperience - 2) * 15 :
    maxExperience <= 10 ? 105 + (maxExperience - 5) * 5 :
    130 + (maxExperience - 10) * 2
  );

  // Location scoring optimization
  let locationScore = 50; // Default neutral score
  if (app.applicantLocation && app.jobPostingLocation) {
    const jobLoc = app.jobPostingLocation.toLowerCase();
    const appLoc = app.applicantLocation.toLowerCase();
    
    if (jobLoc.includes("remote") || appLoc.includes("remote")) {
      locationScore = 100;
    } else if (fuzzyIncludes(jobLoc, appLoc, true) || fuzzyIncludes(appLoc, jobLoc, true)) {
      locationScore = 100;
    } else {
      // Check for same country/region
      const regions = ["usa", "uk", "eu", "asia", "canada", "australia"];
      const sameRegion = regions.some(region => 
        jobLoc.includes(region) && appLoc.includes(region)
      );
      locationScore = sameRegion ? 60 : 30;
    }
  }

  // Final weighted score
  const fitScore = Math.round(
    skillsScore * weights.skills +
    experienceScore * weights.experience +
    educationScore * weights.education +
    companyPrestige * weights.company +
    locationScore * weights.location
  );

  // Enhanced soft skills detection
  const softSkillsMap = {
    leadership: ["leadership", "lead", "manager", "supervisor", "director", "head of", "team lead"],
    communication: ["communication", "presentation", "public speaking", "writing", "documentation"],
    analytical: ["analysis", "analytical", "problem solving", "critical thinking", "research"],
    collaboration: ["teamwork", "collaboration", "cross-functional", "stakeholder", "partnership"],
    adaptability: ["adaptability", "flexible", "agile", "change management", "learning"],
    customer: ["customer service", "client relations", "customer success", "account management"],
  };

  const foundSoftSkills = Object.entries(softSkillsMap)
    .filter(([skill, keywords]) => keywords.some(kw => fuzzyIncludes(profileText, kw)))
    .map(([skill]) => skill);

  // Smart risk assessment
  const riskFactors = [];
  if (maxExperience < 1 && !profileSkills.length) riskFactors.push("Limited experience and skills");
  if (educationScore < 50 && maxExperience < 2) riskFactors.push("Lacks both education and experience");
  if (locationScore < 40) riskFactors.push("Geographic mismatch");
  if (matchedSkills.length === 0 && jobSkills.length > 0) riskFactors.push("No matching technical skills");
  if (profileSkills.length < 3) riskFactors.push("Limited skill diversity");

  // Dynamic strengths identification
  const strengths = [];
  if (fitScore >= 90) strengths.push("Exceptional overall match");
  else if (fitScore >= 75) strengths.push("Strong candidate profile");
  
  if (companyPrestige >= 90) strengths.push("Top-tier company experience");
  if (maxExperience >= 10) strengths.push("Extensive industry experience");
  if (educationScore >= 90) strengths.push("Elite educational background");
  if (matchedSkills.length >= jobSkills.length * 0.8) strengths.push("Excellent skill alignment");
  if (foundSoftSkills.length >= 3) strengths.push(`Strong soft skills: ${foundSoftSkills.slice(0,3).join(", ")}`);

  // Context-aware interview focus
  const interviewFocus = [];
  if (matchedSkills.length > 0) {
    interviewFocus.push(`Technical deep-dive: ${matchedSkills.slice(0, 3).join(", ")}`);
  }
  if (maxExperience >= 5) {
    interviewFocus.push("Leadership and project management experience");
  }
  if (companyPrestige >= 85) {
    interviewFocus.push("Scalability and enterprise-level thinking");
  }
  if (riskFactors.length > 0) {
    interviewFocus.push(`Address: ${riskFactors[0]}`);
  }
  if (foundSoftSkills.includes("leadership")) {
    interviewFocus.push("Team dynamics and mentoring approach");
  }

  // Generate comprehensive insights
  const nlpInsights = [
    `${seniorityLevel} candidate with ${maxExperience.toFixed(1)} years experience`,
    `Education: ${highestDegree} (${educationScore}/100)`,
    `${matchedSkills.length}/${jobSkills.length} required skills matched`,
    companyPrestige > 0 ? `Prestigious company background (${companyPrestige}/100)` : "Diverse work experience",
    `Location compatibility: ${locationScore}/100`,
    foundSoftSkills.length > 0 ? `Soft skills: ${foundSoftSkills.join(", ")}` : "Focus on technical capabilities",
  ].join(" • ");

  const matchQuality = fitScore >= 85 ? "Excellent" : fitScore >= 70 ? "Strong" : fitScore >= 55 ? "Good" : fitScore >= 40 ? "Fair" : "Limited";

  return {
    fitScore,
    seniorityLevel,
    totalExperience: Number(maxExperience.toFixed(1)),
    highestDegree,
    educationScore,
    companyPrestige,
    matchedSkills: matchedSkills.slice(0, 8) as string[],
    topSkills: profileSkills.slice(0, 10) as string[],
    strengths,
    riskFactors,
    interviewFocus,
    workHistory,
    nlpInsights,
    jobMatchHighlights: [
      `Overall Match: ${fitScore}/100 (${matchQuality})`,
      `Experience: ${seniorityLevel} (${maxExperience.toFixed(1)} years)`,
      `Skills: ${matchedSkills.length}/${jobSkills.length} required matches`,
      `Education: ${highestDegree} (${educationScore}/100)`,
      ...strengths.slice(0, 2),
      ...interviewFocus.slice(0, 2),
    ],
  };
}

export default function PipelineManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedNlpApplication, setSelectedNlpApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(defaultStages);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(["applied", "phone_screen"]));
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

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: any };

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/recruiter/applications"],
    refetchInterval: 30000,
  }) as { data: RawApplication[]; isLoading: boolean };

  const { data: jobPostings = [] } = useQuery({
    queryKey: ["/api/recruiter/jobs"],
  }) as { data: any[] };

  useEffect(() => {
    if (Array.isArray(applications) && applications.length > 0) {
      const transformedApplications = applications.map((app: RawApplication) => {
        const nlp = analyzeApplicantNLP(app);
        return {
          ...app,
          ...nlp,
          candidate: {
            id: app.applicantId,
            name: app.applicantName || "Unknown",
            email: app.applicantEmail || "",
            phone: app.applicantPhone,
            location: app.applicantLocation,
            profileImageUrl: app.applicantProfileImageUrl,
          },
          job: {
            id: app.jobPostingId,
            title: app.jobPostingTitle || "Unknown",
            company: app.jobPostingCompany || "Unknown",
            location: app.jobPostingLocation || "",
          },
          stage: app.stage || "applied",
          lastActivity: app.updatedAt || app.appliedAt,
          userId: app.applicantId,
          appliedAt: app.appliedAt,
        };
      });

      const updatedStages = defaultStages.map((stage) => ({
        ...stage,
        applications: transformedApplications.filter((app: Application) =>
          app.stage === stage.id || (!app.stage && stage.id === "applied")
        ),
        count: transformedApplications.filter((app: Application) =>
          app.stage === stage.id || (!app.stage && stage.id === "applied")
        ).length,
      }));
      setPipelineStages(updatedStages);
    }
  }, [applications]);

  const moveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, newStage, notes }: { applicationId: number; newStage: string; notes?: string }) => {
      return await apiRequest("PUT", `/api/recruiter/applications/${applicationId}/stage`, {
        stage: newStage,
        notes,
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

  const sendInterviewInviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint =
        data.assignmentType === "virtual"
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
      ...interviewAssignmentData,
      candidateId: selectedApplication.userId,
      jobPostingId: selectedApplication.jobPostingId,
      dueDate: new Date(interviewAssignmentData.dueDate).toISOString(),
    };
    sendInterviewInviteMutation.mutate(assignmentData);
  };

  const [showTopMatches, setShowTopMatches] = useState(false);
  const filteredStages = pipelineStages
    .map((stage: PipelineStage) => ({
      ...stage,
      applications: stage.applications
        .filter((app: Application) => {
          if (!app.candidate || !app.job) return false;
          const matchesSearch =
            searchTerm === "" ||
            app.candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.job.title?.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesJob = selectedJobFilter === "all" || app.jobPostingId.toString() === selectedJobFilter;
          return matchesSearch && matchesJob;
        })
        .sort((a: Application, b: Application) => {
          if (showTopMatches) {
            return (b.fitScore || 0) - (a.fitScore || 0);
          }
          return 0;
        }),
    }))
    .filter((stage: PipelineStage) => selectedStageFilter === "all" || stage.id === selectedStageFilter);

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
                        const isTopMatch = showTopMatches && idx < 3 && (application.fitScore || 0) > 0;
                        return (
                          <div
                            key={application.id}
                            className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              isTopMatch ? "ring-2 ring-emerald-400 bg-emerald-50 dark:bg-emerald-900" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {application.candidate?.name?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {application.candidate?.name || "Unknown Candidate"}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {application.candidate?.email || "No email provided"}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                                    <span className="text-sm text-gray-500">
                                      Applied to: {application.job?.title || "Unknown Position"}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(application.appliedAt).toLocaleDateString()}
                                    </span>
                                    {application.topSkills && application.topSkills.length > 0 && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">
                                        Top Skills: {application.topSkills.slice(0, 3).join(", ")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {application.fitScore !== undefined && (
                                  <Badge
                                    variant={application.fitScore > 80 ? "default" : application.fitScore > 60 ? "secondary" : "outline"}
                                    className="mr-2 cursor-pointer"
                                    onClick={() => setSelectedNlpApplication(application)}
                                  >
                                    Fit Score: {application.fitScore}%
                                  </Badge>
                                )}
                                {application.nlpInsights && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="View AI Insights"
                                    onClick={() => setSelectedNlpApplication(application)}
                                  >
                                    <BarChart3 className="h-4 w-4 text-blue-500" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="View Resume (Opens in new tab)"
                                  onClick={() => {
                                    window.open(`/api/recruiter/resume/view/${application.id}`, '_blank');
                                  }}
                                >
                                  <GraduationCap className="h-4 w-4 text-green-600" />
                                </Button>
                                {application.score && (
                                  <Badge variant="outline" className="mr-2">
                                    Score: {application.score}%
                                  </Badge>
                                )}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedApplication(application);
                                        setInterviewAssignmentData((prev) => ({
                                          ...prev,
                                          role: application.job?.title || "",
                                          candidateId: application.userId || "",
                                          jobPostingId: application.jobPostingId?.toString() || "",
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
                                            setInterviewAssignmentData((prev) => ({ ...prev, assignmentType: value }))
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
                                            setInterviewAssignmentData((prev) => ({ ...prev, role: e.target.value }))
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
                                            setInterviewAssignmentData((prev) => ({ ...prev, dueDate: e.target.value }))
                                          }
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
                                <Select
                                  value={application.stage || "applied"}
                                  onValueChange={(newStage) =>
                                    moveApplicationMutation.mutate({
                                      applicationId: application.id,
                                      newStage,
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
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

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
                            title={`Fit Score: ${selectedNlpApplication.fitScore || 0}%`}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Overall Match</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        <span className="font-medium" title="Education score is based on degree and institution prestige.">
                          Education
                          <span className="ml-1 text-xs text-gray-400" title="How strong is the candidate's education background?">
                            ⓘ
                          </span>
                        </span>
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
                        <span className="font-medium" title="Experience score is based on years and seniority.">
                          Experience
                          <span className="ml-1 text-xs text-gray-400" title="How much relevant experience does the candidate have?">
                            ⓘ
                          </span>
                        </span>
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
                        <span className="font-medium" title="Company prestige is based on work history at top companies.">
                          Company Prestige
                          <span className="ml-1 text-xs text-gray-400" title="Has the candidate worked at well-known companies?">
                            ⓘ
                          </span>
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xl font-bold">{selectedNlpApplication.companyPrestige || 0}/100</div>
                        <div className="text-sm text-gray-600">Background Score</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

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

        {selectedApplication && (
          // Placeholder: Replace with actual InterviewAssignmentModal component
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
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
                      setInterviewAssignmentData((prev) => ({ ...prev, assignmentType: value }))
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
                      setInterviewAssignmentData((prev) => ({ ...prev, role: e.target.value }))
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
                      setInterviewAssignmentData((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
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
        )}
      </div>
    </div>
  );
}

