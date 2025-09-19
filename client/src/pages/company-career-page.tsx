import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { Navbar } from "@/components/navbar";
import SEOHead from "@/components/seo-head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign,
  Eye,
  Send,
  Briefcase,
  Filter,
  Star,
  Heart,
  ExternalLink,
  Bookmark,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  Award,
  ChevronRight,
  Layers,
  BarChart3,
  CheckCircle,
  User,
  FileText,
  Settings,
  Grid3X3,
  List,
  SortDesc,
  MapIcon,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  MessageCircle,
  Share2,
  ThumbsUp,
  Plus,
  Sparkles as SparklesIcon,
  Zap as ZapIcon,
  Chrome,
  Brain,
  Target,
  X,
  Globe,
  Copy
} from "lucide-react";

// Helper function for consistent share functionality
const shareCareerPage = {
  getShareUrl: () => window.location.href,
  
  native: (companyName: string, jobCount: number, onFallback: () => void) => {
    if (navigator.share) {
      navigator.share({
        title: `${companyName} Careers`,
        text: `Check out career opportunities at ${companyName}. ${jobCount} open positions available!`,
        url: shareCareerPage.getShareUrl()
      }).catch(onFallback);
    } else {
      onFallback();
    }
  },
  
  twitter: (companyName: string, jobCount: number) => {
    const url = encodeURIComponent(shareCareerPage.getShareUrl());
    const text = encodeURIComponent(`Check out career opportunities at ${companyName}! ${jobCount} open positions available. Apply now:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  },
  
  linkedin: (companyName: string, jobCount: number) => {
    const url = encodeURIComponent(shareCareerPage.getShareUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  },
  
  copyLink: (onSuccess: () => void) => {
    navigator.clipboard.writeText(shareCareerPage.getShareUrl());
    onSuccess();
  }
};

// Utility function to normalize company names for comparison
const normalizeCompany = (companyName: string): string => {
  if (!companyName) return '';
  
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/[&.,]/g, '') // Remove common punctuation
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '') // Remove business suffixes
    .trim();
};

// Utility function to check if company names match
const isCompanyMatch = (companyName: string, targetCompany: string): boolean => {
  const normalized1 = normalizeCompany(companyName);
  const normalized2 = normalizeCompany(targetCompany);
  
  return normalized1.includes(normalized2) || normalized2.includes(normalized1) || 
         normalized1 === normalized2;
};

// Utility functions for professional job formatting
const formatJobType = (jobType?: string) => {
  if (!jobType) return '';
  
  const typeMap: { [key: string]: string } = {
    'platform': 'Full-time',
    'scraped': 'Full-time', 
    'full_time': 'Full-time',
    'part_time': 'Part-time',
    'contract': 'Contract-based',
    'freelance': 'Freelance', 
    'temporary': 'Temporary',
    'internship': 'Internship'
  };
  
  return typeMap[jobType.toLowerCase()] || 'Full-time';
};

const formatWorkMode = (workMode?: string) => {
  if (!workMode) return '';
  
  const modeMap: { [key: string]: string } = {
    'onsite': 'On-site',
    'remote': 'Remote',
    'hybrid': 'Hybrid', 
    'field': 'Field-based'
  };
  
  return modeMap[workMode.toLowerCase()] || workMode;
};

interface JobPosting {
  id: number;
  title: string;
  companyName: string;
  location: string;
  description: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  createdAt: string;
  jobType?: string;
  workMode?: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  benefits?: string[];
  isActive: boolean;
  recruiterName?: string;
  applicationsCount?: number;
  companyLogo?: string;
}

interface UserProfile {
  skills?: string[];
  experienceLevel?: string;
  preferredLocation?: string;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  professionalTitle?: string;
}

interface CompanyInfo {
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  totalJobs: number;
}

export default function CompanyCareerPage() {
  const params = useParams();
  // Handle company name from URL with proper slug conversion
  const rawCompanyName = params?.companyName ? decodeURIComponent(params.companyName) : '';
  const companyName = rawCompanyName
    .replace(/-/g, ' ') // Convert kebab-case to spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Title case
    .trim();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 25;
  const [sortBy, setSortBy] = useState("relevance");
  const [filterPreferences, setFilterPreferences] = useState({
    location: "",
    jobType: "",
    workMode: "",
    experienceLevel: "",
    salaryRange: "",
    skills: [] as string[],
    category: ""
  });

  // Fetch platform jobs filtered by company (no auth required)
  const { data: platformJobs = [], isLoading: platformJobsLoading } = useQuery({
    queryKey: ["/api/jobs/postings", searchQuery, JSON.stringify(filterPreferences), companyName],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (companyName) params.append('company', companyName);
      
      Object.entries(filterPreferences).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value !== 'all') params.append(key, value);
      });
      
      const response = await fetch(`/api/jobs/postings?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const jobs = await response.json();
      
      // Filter by company name
      return jobs.filter((job: any) => {
        const jobCompany = job.companyName || job.company_name || job.company || '';
        return isCompanyMatch(jobCompany, companyName);
      });
    },
    enabled: !!companyName
  });


  // Use only platform jobs with additional filtering
  const allJobsUnsorted = platformJobs.map((job: any) => ({
    ...job,
    company: job.companyName || job.company_name || job.company,
    companyName: job.companyName || job.company_name || job.company,
    jobType: 'platform',
    applyType: 'easy',
    priority: 1
  })).filter((job: any) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return job.title?.toLowerCase().includes(query) || 
             job.location?.toLowerCase().includes(query) ||
             job.description?.toLowerCase().includes(query);
    }
    return true;
  }).filter((job: any) => {
    // Apply additional filters
    if (filterPreferences.workMode && filterPreferences.workMode !== 'all') {
      return job.workMode === filterPreferences.workMode || job.work_mode === filterPreferences.workMode;
    }
    if (filterPreferences.experienceLevel && filterPreferences.experienceLevel !== 'all') {
      return job.experienceLevel === filterPreferences.experienceLevel || job.experience_level === filterPreferences.experienceLevel;
    }
    return true;
  });

  // Get company info from the first job with improved logo resolution
  const companyInfo: CompanyInfo = {
    name: companyName,
    logo: allJobsUnsorted[0]?.companyLogo || 
          allJobsUnsorted[0]?.company_logo || 
          allJobsUnsorted[0]?.logo ||
          // Check other jobs for logos if first job doesn't have one
          allJobsUnsorted.find(job => job.companyLogo || job.company_logo || job.logo)?.companyLogo ||
          allJobsUnsorted.find(job => job.companyLogo || job.company_logo || job.logo)?.company_logo ||
          allJobsUnsorted.find(job => job.companyLogo || job.company_logo || job.logo)?.logo,
    totalJobs: allJobsUnsorted.length
  };

  // Get user profile for compatibility scoring (only if authenticated)
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await fetch('/api/profile', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Calculate compatibility
  const calculateCompatibility = (job: any) => {
    if (!isAuthenticated || !userProfile) return 0;
    
    let score = 50;
    
    // Skills matching
    const userSkills = userProfile?.skills || [];
    const jobSkills = job.requiredSkills || [];
    
    if (jobSkills.length > 0 && userSkills.length > 0) {
      const skillsMatch = jobSkills.filter((skill: string) => 
        userSkills.some((userSkill: string) => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      ).length;
      
      const skillMatchPercentage = skillsMatch / jobSkills.length;
      score += Math.round(skillMatchPercentage * 30);
    }
    
    // Experience level matching
    if (userProfile?.experienceLevel && job.experienceLevel) {
      const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
      const userLevelIndex = levels.indexOf(userProfile.experienceLevel.toLowerCase());
      const jobLevelIndex = levels.indexOf(job.experienceLevel.toLowerCase());
      
      if (userLevelIndex !== -1 && jobLevelIndex !== -1) {
        const levelDiff = Math.abs(userLevelIndex - jobLevelIndex);
        if (levelDiff === 0) score += 15;
        else if (levelDiff === 1) score += 10;
        else if (levelDiff === 2) score += 5;
      }
    }
    
    // Location preference
    if (userProfile?.preferredLocation && job.location) {
      const userLocation = userProfile.preferredLocation.toLowerCase();
      const jobLocation = job.location.toLowerCase();
      
      if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation) || jobLocation.includes('remote')) {
        score += 5;
      }
    }
    
    const pseudoRandom = (job.id % 21) - 10;
    score += pseudoRandom;
    
    return Math.min(100, Math.max(45, score));
  };

  // Sort jobs
  const allJobs = [...allJobsUnsorted].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    if (!isAuthenticated) {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    }

    switch (sortBy) {
      case "match":
        const matchA = calculateCompatibility(a);
        const matchB = calculateCompatibility(b);
        return matchB - matchA;
      
      case "date":
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
        
      case "salary":
        const salaryA = a.maxSalary || a.minSalary || 0;
        const salaryB = b.maxSalary || b.minSalary || 0;
        return salaryB - salaryA;
        
      default: // relevance
        const relevanceA = calculateCompatibility(a);
        const relevanceB = calculateCompatibility(b);
        return relevanceB - relevanceA;
    }
  });

  const jobsLoading = platformJobsLoading;

  // Check applied jobs
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated
  });

  // Save job mutation
  const saveJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: "POST",
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to save job');
      return response.json();
    },
    onSuccess: (_, jobId) => {
      setSavedJobs(prev => new Set([...Array.from(prev), jobId]));
      toast({ title: "Job Saved", description: "Job added to your saved list!" });
    }
  });

  // Apply to job mutation
  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/jobs/postings/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ resumeId: null, coverLetter: "" })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply to job');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted", 
        description: "Your application has been sent to the recruiter!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const appliedJobIds = Array.isArray(applications) ? applications.map((app: any) => app.jobPostingId) : [];
  
  const handleApply = (job: any) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }

    // Handle external scraped jobs
    if (job.source === 'scraped' || job.applyType === 'external') {
      const externalUrl = job.sourceUrl || job.source_url;
      if (externalUrl) {
        window.open(externalUrl, '_blank');
        toast({
          title: "Redirected to External Site",
          description: "Complete your application on the company's website."
        });
        return;
      } else {
        toast({
          title: "No External URL",
          description: "This job doesn't have a valid application URL.",
          variant: "destructive"
        });
        return;
      }
    }

    // Handle platform jobs
    applyMutation.mutate(job.id);
  };

  const handleSaveJob = (jobId: number) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    saveJobMutation.mutate(jobId);
  };

  const handleJobClick = (job: any) => {
    if (job && job.id) {
      setSelectedJob(job);
    }
  };

  // Filter and paginate jobs
  const filteredJobs = allJobs.filter((job: any) => {
    if (!searchQuery?.trim()) return true;
    const searchLower = searchQuery.toLowerCase().trim();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower) ||
      (job.requiredSkills && job.requiredSkills.some((skill: string) => 
        skill?.toLowerCase().includes(searchLower)
      ))
    );
  });

  // Pagination
  const totalJobs = filteredJobs.length;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPreferences]);

  // Set first job as selected by default
  useEffect(() => {
    if (paginatedJobs.length > 0 && !selectedJob) {
      setSelectedJob(paginatedJobs[0]);
    }
  }, [paginatedJobs, selectedJob]);

  // SEO and Structured Data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobBoard", 
    "name": `${companyInfo.name} Careers`,
    "description": `Explore career opportunities at ${companyInfo.name}. Find ${totalJobs} open positions and join their team.`,
    "url": `https://autojobr.com/career/${encodeURIComponent(companyName)}`,
    "hiringOrganization": {
      "@type": "Organization",
      "name": companyInfo.name,
      "logo": companyInfo.logo
    },
    "numberOfJobs": totalJobs,
    "jobPosting": allJobs.slice(0, 10).map((job: any) => ({
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company
      },
      "jobLocation": {
        "@type": "Place",
        "address": job.location
      },
      "employmentType": (() => {
        const type = formatJobType(job.jobType).toLowerCase().replace('-', '_');
        const validTypes = { 
          'full_time': 'FULL_TIME', 
          'part_time': 'PART_TIME', 
          'contract_based': 'CONTRACTOR', 
          'freelance': 'CONTRACTOR', 
          'temporary': 'TEMPORARY', 
          'internship': 'INTERN' 
        };
        return validTypes[type as keyof typeof validTypes] || 'FULL_TIME';
      })(),
      "workHours": job.workMode === 'remote' ? "REMOTE" : "FULL_TIME",
      "datePosted": job.createdAt || job.created_at
    }))
  };

  // Show loading while data is being fetched
  if (jobsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading {companyName} careers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <SEOHead
        title={`${companyInfo.name} Careers - ${totalJobs} Open Positions | AutoJobR`}
        description={`Join ${companyInfo.name} team! Discover ${totalJobs} career opportunities, apply instantly, and grow your career with one of the industry leaders.`}
        keywords={`${companyInfo.name} careers, ${companyInfo.name} jobs, ${companyInfo.name} hiring, work at ${companyInfo.name}, ${companyInfo.name} opportunities`}
        canonicalUrl={`https://autojobr.com/career/${encodeURIComponent(companyName)}`}
        structuredData={structuredData}
        ogType="website"
      />
      <Navbar />
      
      {/* Company Header */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              {companyInfo.logo ? (
                <div className="relative">
                  <img 
                    src={companyInfo.logo} 
                    alt={`${companyInfo.name} logo`}
                    className="w-20 h-20 rounded-lg object-contain bg-white shadow-md border"
                    onError={(e) => {
                      // Hide broken image and show fallback
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.logo-fallback') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="logo-fallback w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md absolute top-0 left-0" style={{display: 'none'}}>
                    <span className="text-white font-bold text-lg">
                      {companyInfo.name.split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">
                    {companyInfo.name.split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Company Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {companyInfo.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                Career Opportunities
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{totalJobs} Open Positions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Join Our Team</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span>Global Opportunities</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(companyInfo.name)}`, '_blank')}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Learn More
              </Button>
              
              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                data-testid="button-share-native"
                aria-label="Share career page"
                onClick={() => {
                  shareCareerPage.native(companyInfo.name, totalJobs, () => {
                    shareCareerPage.copyLink(() => {
                      toast({
                        title: "Link Copied!",
                        description: "Career page URL copied to clipboard"
                      });
                    });
                  });
                }}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (paginatedJobs.length > 0) {
                    setSelectedJob(paginatedJobs[0]);
                    document.getElementById('job-details')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Search className="w-4 h-4" />
                View Jobs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${companyInfo.name} positions...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
            
            {/* Share Buttons */}
            <div className="flex gap-2" data-testid="share-buttons-container">
              <Button
                variant="outline"
                size="sm"
                data-testid="button-share-twitter"
                aria-label="Share on Twitter"
                onClick={() => shareCareerPage.twitter(companyInfo.name, totalJobs)}
                className="h-12 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                data-testid="button-share-linkedin"
                aria-label="Share on LinkedIn"
                onClick={() => shareCareerPage.linkedin(companyInfo.name, totalJobs)}
                className="h-12 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                data-testid="button-copy-link"
                aria-label="Copy link to clipboard"
                onClick={() => {
                  shareCareerPage.copyLink(() => {
                    toast({
                      title: "Link Copied!",
                      description: "Career page URL copied to clipboard"
                    });
                  });
                }}
                className="h-12 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              <Select value={filterPreferences.workMode} onValueChange={(value) => 
                setFilterPreferences(prev => ({ ...prev, workMode: value }))
              }>
                <SelectTrigger className="w-[150px] h-12">
                  <SelectValue placeholder="Work Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPreferences.experienceLevel} onValueChange={(value) => 
                setFilterPreferences(prev => ({ ...prev, experienceLevel: value }))
              }>
                <SelectTrigger className="w-[150px] h-12">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px] h-12">
                  <SortDesc className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date Posted</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  {isAuthenticated && <SelectItem value="match">Best Match</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        {totalJobs === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No positions found at {companyInfo.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There are currently no open positions matching your criteria. Check back later or explore other companies.
            </p>
            <Button onClick={() => setLocation('/jobs')} className="bg-blue-600 hover:bg-blue-700">
              Browse All Jobs
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Jobs List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Open Positions ({totalJobs})
                </h2>
              </div>
              
              <div className="space-y-3">
                {paginatedJobs.map((job) => (
                  <Card 
                    key={job.id}
                    className={`cursor-pointer transition-all hover:shadow-md border ${
                      selectedJob?.id === job.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location || 'Remote'}</span>
                            {job.workMode && (
                              <>
                                <span>•</span>
                                <span>{formatWorkMode(job.workMode)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAuthenticated && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveJob(job.id);
                              }}
                              className={`p-1 h-8 w-8 ${savedJobs.has(job.id) ? 'text-red-500' : 'text-gray-400'}`}
                            >
                              <Heart className={`w-4 h-4 ${savedJobs.has(job.id) ? 'fill-current' : ''}`} />
                            </Button>
                          )}
                          {isAuthenticated && (
                            <div className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {calculateCompatibility(job)}% match
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {formatJobType(job.jobType)}
                        </Badge>
                        {job.experienceLevel && (
                          <Badge variant="outline" className="text-xs">
                            {job.experienceLevel}
                          </Badge>
                        )}
                        {(job.minSalary || job.maxSalary) && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {job.minSalary && job.maxSalary 
                              ? `$${(job.minSalary / 1000).toFixed(0)}k - $${(job.maxSalary / 1000).toFixed(0)}k`
                              : job.maxSalary 
                                ? `Up to $${(job.maxSalary / 1000).toFixed(0)}k`
                                : `From $${(job.minSalary / 1000).toFixed(0)}k`
                            }
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(job.createdAt || job.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(job);
                          }}
                          disabled={appliedJobIds.includes(job.id)}
                          className={`h-8 text-xs ${
                            appliedJobIds.includes(job.id)
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {appliedJobIds.includes(job.id) ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Applied
                            </>
                          ) : job.applyType === 'external' ? (
                            <>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Apply
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 mr-1" />
                              Apply
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div id="job-details" className="lg:sticky lg:top-6">
              {selectedJob ? (
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          {selectedJob.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{selectedJob.companyName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedJob.location || 'Remote'}</span>
                        </div>
                      </div>
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveJob(selectedJob.id)}
                          className={`p-2 ${savedJobs.has(selectedJob.id) ? 'text-red-500' : 'text-gray-400'}`}
                        >
                          <Heart className={`w-5 h-5 ${savedJobs.has(selectedJob.id) ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="secondary">
                        {formatJobType(selectedJob.jobType)}
                      </Badge>
                      {selectedJob.workMode && (
                        <Badge variant="outline">
                          {formatWorkMode(selectedJob.workMode)}
                        </Badge>
                      )}
                      {selectedJob.experienceLevel && (
                        <Badge variant="outline">
                          {selectedJob.experienceLevel}
                        </Badge>
                      )}
                      {(selectedJob.minSalary || selectedJob.maxSalary) && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {selectedJob.minSalary && selectedJob.maxSalary 
                            ? `$${(selectedJob.minSalary / 1000).toFixed(0)}k - $${(selectedJob.maxSalary / 1000).toFixed(0)}k`
                            : selectedJob.maxSalary 
                              ? `Up to $${(selectedJob.maxSalary / 1000).toFixed(0)}k`
                              : `From $${(selectedJob.minSalary / 1000).toFixed(0)}k`
                          }
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Job Description</h4>
                        <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400">
                          <p className="whitespace-pre-wrap">{selectedJob.description}</p>
                        </div>
                      </div>

                      {selectedJob.requiredSkills && Array.isArray(selectedJob.requiredSkills) && selectedJob.requiredSkills.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedJob.requiredSkills.map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const benefits = Array.isArray(selectedJob.benefits) 
                          ? selectedJob.benefits 
                          : typeof selectedJob.benefits === 'string' 
                            ? selectedJob.benefits.split(',').map((s: string) => s.trim()).filter(Boolean)
                            : [];
                        return benefits.length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Benefits</h4>
                          <div className="space-y-1">
                            {benefits.map((benefit: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        ) : null;
                      })()}

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          onClick={() => handleApply(selectedJob)}
                          disabled={appliedJobIds.includes(selectedJob.id)}
                          className={`w-full h-12 text-base ${
                            appliedJobIds.includes(selectedJob.id)
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                          }`}
                        >
                          {appliedJobIds.includes(selectedJob.id) ? (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Applied Successfully
                            </>
                          ) : selectedJob.applyType === 'external' ? (
                            <>
                              <ExternalLink className="w-5 h-5 mr-2" />
                              Apply on Company Website
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Apply Now
                            </>
                          )}
                        </Button>
                        
                        {!isAuthenticated && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                            <button 
                              onClick={() => setLocation('/auth')} 
                              className="text-blue-600 hover:text-blue-700 underline"
                            >
                              Sign in
                            </button>
                            {' '}to apply with one click
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a Position
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a job from the list to view details and apply
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}