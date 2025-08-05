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
import { Checkbox } from "@/components/ui/checkbox";
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
  applicantId: string;
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
    avatar?: string;
    professionalTitle?: string;
    summary?: string;
    yearsExperience?: number;
    skills?: string[];
    education?: string;
    resumeUrl?: string;
    profileImageUrl?: string;
  };
  job: {
    id: number;
    title: string;
    department?: string;
    location?: string;
    type?: string;
    company?: string;
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

// AI/NLP Analysis Function - Enhanced version from PipelineManagement.tsx
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

    // Check aliases for the skill
    const skillAliases = aliases[skill.toLowerCase().replace(/\s+/g, '')];
    if (skillAliases) {
      return skillAliases.some(alias => getPattern(alias, isLocation).test(text));
    }

    return false;
  }

  // Extract skills from both texts
  const extractedSkills = {
    profile: [] as string[],
    job: [] as string[],
  };

  // Process all skill categories
  Object.values(skillsDatabase).forEach(category => {
    Object.values(category).forEach(skillGroup => {
      skillGroup.forEach(skill => {
        const skillLower = skill.toLowerCase();
        if (fuzzyIncludes(profileText, skillLower)) {
          if (!extractedSkills.profile.includes(skillLower)) {
            extractedSkills.profile.push(skillLower);
          }
        }
        if (fuzzyIncludes(jobText, skillLower)) {
          if (!extractedSkills.job.includes(skillLower)) {
            extractedSkills.job.push(skillLower);
          }
        }
      });
    });
  });

  // Enhanced experience extraction
  let maxExperience = 0;
  const experiencePatterns = [
    /(\d+)[\s]*(?:\+)?[\s]*(?:years?|yrs?)[\s]*(?:of)?[\s]*(?:experience|exp)/gi,
    /(\d+)[\s]*(?:\+)?[\s]*(?:years?|yrs?)[\s]*(?:in|with|of)/gi,
    /experience[\s]*:?[\s]*(\d+)[\s]*(?:\+)?[\s]*(?:years?|yrs?)/gi,
    /(\d+)[\s]*(?:\+)?[\s]*(?:year|yr)[\s]*(?:experience|exp)/gi,
  ];

  [profileText, jobText].forEach(text => {
    experiencePatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const years = parseInt(match[1]);
        if (!isNaN(years)) {
          maxExperience = Math.max(maxExperience, years);
        }
      });
    });

    // Also check for ranges like "5-7 years", "3 to 5 years"
    const rangePatterns = [
      /(\d+)[\s]*(?:-|to)[\s]*(\d+)[\s]*(?:years?|yrs?)/gi,
      /between[\s]+(\d+)[\s]+(?:and|to)[\s]+(\d+)[\s]*(?:years?|yrs?)/gi,
    ];

    rangePatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const minYears = parseInt(match[1]);
        const maxYears = parseInt(match[2]);
        if (!isNaN(minYears) && !isNaN(maxYears)) {
          maxExperience = Math.max(maxExperience, maxYears);
        }
      });
    });

    // Check for seniority levels and infer experience
    const seniorityKeywords = [
      { terms: ["intern", "internship", "trainee"], years: 0, weight: 0.5 },
      { terms: ["junior", "entry level", "entry-level", "associate", "graduate"], years: 1, weight: 0.8 },
      { terms: ["mid level", "mid-level", "intermediate", "experienced"], years: 4, weight: 0.7 },
      { terms: ["senior", "sr.", "lead", "principal"], years: 7, weight: 0.9 },
      { terms: ["staff", "architect", "expert", "specialist"], years: 10, weight: 0.8 },
      { terms: ["director", "head of", "vp", "vice president", "chief"], years: 15, weight: 0.6 },
    ];

    seniorityKeywords.forEach(({ terms, years, weight }) => {
      terms.forEach(term => {
        const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (pattern.test(text)) {
          maxExperience = Math.max(maxExperience, years * weight);
        }
      });
    });

    // Enhanced pattern for "X+ years" or "X years+"
    const plusPattern = /(\d+)\s*\+?\s*(?:years?|yrs?)|(?:years?|yrs?)\s*(\d+)\s*\+?/gi;
    const plusMatches = [...text.matchAll(plusPattern)];
    plusMatches.forEach(match => {
      let years = parseInt(match[1] || match[2]);
      if (!isNaN(years)) {
        const weight = match[0].includes('+') ? 1.2 : 1.0; // Bonus for "+" indicating more experience
        years = years * weight;
      }
      
      maxExperience = Math.max(maxExperience, years);
    });
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

export default function EnhancedPipelineManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [bulkSelection, setBulkSelection] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");

  // Fetch applications with enhanced data and AI/NLP processing
  const { data: rawApplications = [], isLoading: applicationsLoading, refetch: refetchApplications } = useQuery<RawApplication[]>({
    queryKey: ["/api/recruiter/applications"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Process applications with AI/NLP analysis
  const applications: Application[] = rawApplications.map((rawApp: RawApplication) => {
    const nlpAnalysis = analyzeApplicantNLP(rawApp);
    
    return {
      id: rawApp.id,
      userId: rawApp.applicantId,
      applicantId: rawApp.applicantId,
      jobPostingId: rawApp.jobPostingId,
      status: rawApp.status,
      appliedAt: rawApp.appliedAt,
      recruiterNotes: rawApp.recruiterNotes,
      stage: rawApp.stage || rawApp.status,
      lastActivity: rawApp.updatedAt || rawApp.appliedAt,
      ...nlpAnalysis,
      candidate: {
        id: rawApp.applicantId,
        name: rawApp.applicantName || 'Unknown',
        email: rawApp.applicantEmail || '',
        phone: rawApp.applicantPhone,
        location: rawApp.applicantLocation,
        profileImageUrl: rawApp.applicantProfileImageUrl,
        summary: rawApp.applicantSummary,
        education: rawApp.applicantEducation,
        skills: rawApp.applicantSkills?.split(',').map(s => s.trim()) || [],
      },
      job: {
        id: rawApp.jobPostingId,
        title: rawApp.jobPostingTitle || 'Unknown Position',
        company: rawApp.jobPostingCompany,
        location: rawApp.jobPostingLocation,
      },
    } as Application;
  });

  // Fetch job postings for filtering
  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/recruiter/jobs"],
  });

  // Fetch analytics data
  const { data: analytics = {} } = useQuery<any>({
    queryKey: ["/api/recruiter/pipeline-analytics"],
  });

  // Move application to different stage
  const moveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, newStage, notes }: { applicationId: number; newStage: string; notes?: string }) => {
      return apiRequest(`/api/recruiter/applications/${applicationId}/stage`, 'PUT', { stage: newStage, notes });
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
      return apiRequest("/api/recruiter/applications/bulk", 'POST', { action, applicationIds, notes });
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
      return apiRequest(`/api/recruiter/applications/${applicationId}/notes`, 'POST', { note });
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
      return apiRequest("/api/interviews/schedule", 'POST', { applicationId, type, scheduledAt });
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

  // Handle drag and drop (simplified version)
  const handleStageMove = (applicationId: number, newStage: string) => {
    moveApplicationMutation.mutate({ applicationId, newStage });
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
        <RecruiterNavbar user={user || undefined} />
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
      <RecruiterNavbar user={user || undefined} />
      
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
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{(analytics as any)?.totalCandidates || filteredApplications.length}</p>
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
                      {filteredApplications.filter((app: Application) => !["hired", "rejected"].includes(app.status)).length}
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
                      {filteredApplications.filter((app: Application) => app.status === "hired").length}
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
                      {filteredApplications.length > 0 ? Math.round((filteredApplications.filter((app: Application) => app.status === "hired").length / filteredApplications.length) * 100) : 0}%
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
                        onCheckedChange={() => setBulkSelection(new Set())}
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

        {/* Pipeline View */}
        {viewMode === "kanban" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-8 gap-4">
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
                  
                  <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                    <AnimatePresence>
                      {stage.applications.map((application) => (
                        <motion.div
                          key={application.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-all"
                          onClick={() => setSelectedApplication(application)}
                          data-testid={`card-application-${application.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={bulkSelection.has(application.id)}
                                onCheckedChange={() => toggleBulkSelection(application.id)}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                data-testid={`checkbox-application-${application.id}`}
                              />
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={application.candidate.profileImageUrl} />
                                <AvatarFallback>
                                  {application.candidate.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            {application.fitScore && (
                              <Badge variant="outline" className="text-xs">
                                {application.fitScore}% match
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {application.candidate.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                              {application.candidate.summary || "Candidate"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {application.job.title}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApplication(application);
                                }}
                                data-testid={`button-view-${application.id}`}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Schedule interview
                                }}
                                data-testid={`button-interview-${application.id}`}
                              >
                                <Video className="w-3 h-3" />
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
                        <Checkbox
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkSelection(new Set(filteredApplications.map((app: Application) => app.id)));
                            } else {
                              setBulkSelection(new Set());
                            }
                            setShowBulkActions(!!checked && filteredApplications.length > 0);
                          }}
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
                    {filteredApplications.map((application: Application) => (
                      <motion.tr
                        key={application.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => setSelectedApplication(application)}
                        data-testid={`row-application-${application.id}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={bulkSelection.has(application.id)}
                            onCheckedChange={() => toggleBulkSelection(application.id)}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            data-testid={`checkbox-row-${application.id}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="w-10 h-10 mr-3">
                              <AvatarImage src={application.candidate.profileImageUrl} />
                              <AvatarFallback>
                                {application.candidate.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
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
                          {application.fitScore && (
                            <div className="flex items-center">
                              <Progress value={application.fitScore} className="w-16 mr-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {application.fitScore}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Schedule interview
                              }}
                              data-testid={`button-list-interview-${application.id}`}
                            >
                              <Video className="w-4 h-4" />
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
      </div>
    </div>
  );
}