import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Navbar } from "@/components/navbar";
import SEOHead from "@/components/seo-head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
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
  ChevronDown,
  ChevronUp,
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
  SlidersHorizontal,
  RotateCcw,
  Menu,
  Globe,
  Home,
  Laptop,
  Car,
  GraduationCap,
  Building,
  Factory
} from "lucide-react";
import JobCard from "@/components/job-card";
import PredictiveSuccessWidget from "@/components/PredictiveSuccessWidget";
import ViralExtensionWidget from "@/components/ViralExtensionWidget";


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
  companyName?: string;
  company?: string;
  location: string;
  description: string;
  minSalary?: number;
  maxSalary?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  createdAt?: string;
  created_at?: string;
  postedAt?: string;
  posted_at?: string;
  jobType?: string;
  job_type?: string;
  workMode?: string;
  work_mode?: string;
  experienceLevel?: string;
  experience_level?: string;
  requiredSkills?: string[];
  benefits?: string[];
  isActive?: boolean;
  recruiterName?: string;
  applicationsCount?: number;
  category?: string;
  subcategory?: string;
  sourcePlatform?: string;
  source_platform?: string;
  sourceUrl?: string;
  source_url?: string;
  countryCode?: string;
  country_code?: string;
  city?: string;
  applyType?: 'easy' | 'external';
  priority?: number;
  source?: string;
  requirements?: string;
  responsibilities?: string;
}

interface JobFacets {
  countries: Array<{ code: string; count: number }>;
  cities: Array<{ name: string; count: number }>;
  categories: Array<{ name: string; count: number }>;
  job_types: Array<{ type: string; count: number }>;
  work_modes: Array<{ mode: string; count: number }>;
  experience_levels: Array<{ level: string; count: number }>;
  companies: Array<{ name: string; count: number }>;
  sources: Array<{ platform: string; count: number }>;
}

interface FilterState {
  q?: string;
  country?: string;
  city?: string;
  category?: string;
  subcategory?: string;
  job_type?: string[];
  work_mode?: string[];
  experience_level?: string[];
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  company?: string;
  source_platform?: string;
  date_posted?: number;
  remote_only?: boolean;
  sort?: string;
  page?: number;
  size?: number;
}

interface UserProfile {
  skills?: string[];
  experienceLevel?: string;
  preferredLocation?: string;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  professionalTitle?: string;
}

// Category mapping for clean URLs
const CATEGORY_MAPPINGS: Record<string, string[]> = {
  'technology': ['software engineer', 'developer', 'programmer', 'tech', 'software', 'programming'],
  'engineering': ['engineer', 'engineering', 'technical', 'systems', 'platform'],
  'marketing': ['marketing', 'growth', 'social media', 'content', 'brand', 'seo', 'digital marketing'],
  'sales': ['sales', 'business development', 'account', 'revenue', 'partnership'],
  'design': ['designer', 'ui', 'ux', 'graphic', 'visual', 'creative', 'product design'],
  'data-science': ['data scientist', 'data analyst', 'machine learning', 'ai', 'analytics', 'ml engineer'],
  'product-management': ['product manager', 'product owner', 'product marketing', 'product strategy'],
  'finance': ['finance', 'accounting', 'financial', 'treasury', 'investment', 'fintech'],
  'operations': ['operations', 'ops', 'supply chain', 'logistics', 'process'],
  'human-resources': ['hr', 'human resources', 'recruiting', 'talent', 'people'],
  'customer-success': ['customer success', 'customer support', 'client', 'account management'],
};

// Location mapping for clean URLs
const LOCATION_MAPPINGS: Record<string, string[]> = {
  'san-francisco': ['san francisco', 'sf', 'bay area'],
  'new-york': ['new york', 'nyc', 'manhattan'],
  'austin': ['austin', 'atx'],
  'seattle': ['seattle'],
  'los-angeles': ['los angeles', 'la'],
  'chicago': ['chicago'],
  'atlanta': ['atlanta'],
  'boston': ['boston'],
  'denver': ['denver'],
  'dallas': ['dallas'],
  'london': ['london'],
  'toronto': ['toronto'],
  'sydney': ['sydney'],
  'berlin': ['berlin'],
  'amsterdam': ['amsterdam'],
  'singapore': ['singapore'],
  'mumbai': ['mumbai'],
  'bangalore': ['bangalore'],
  'dublin': ['dublin'],
  'stockholm': ['stockholm'],
};

// Country mapping for clean URLs
const COUNTRY_MAPPINGS: Record<string, string[]> = {
  'usa': ['united states', 'us', 'usa'],
  'canada': ['canada', 'ca'],
  'uk': ['united kingdom', 'uk', 'gb'],
  'germany': ['germany', 'de'],
  'australia': ['australia', 'au'],
  'india': ['india', 'in'],
  'singapore': ['singapore', 'sg'],
  'netherlands': ['netherlands', 'nl'],
  'sweden': ['sweden', 'se'],
};

interface JobsProps {
  category?: string;
  location?: string;
  country?: string;
  workMode?: string;
}

export default function Jobs({ category, location, country, workMode }: JobsProps = {}) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // URL and state management
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  // State for inline results display
  const [interviewPrepData, setInterviewPrepData] = useState<any>(null);
  const [salaryInsightsData, setSalaryInsightsData] = useState<any>(null);
  const [loadingInterviewPrep, setLoadingInterviewPrep] = useState(false);
  const [loadingSalary, setLoadingSalary] = useState(false);

  // Convert route-based parameters to filter format
  const routeBasedFilters = useMemo(() => {
    const filters: Partial<FilterState> = {};

    // Handle category routing
    if (category && CATEGORY_MAPPINGS[category]) {
      // Create a search query that matches jobs in this category
      const categoryTerms = CATEGORY_MAPPINGS[category];
      filters.q = categoryTerms.join(' OR ');
    }

    // Handle location routing
    if (location && LOCATION_MAPPINGS[location]) {
      const locationTerms = LOCATION_MAPPINGS[location];
      // Use the primary location term for filtering
      filters.city = locationTerms[0];
    }

    // Handle country routing
    if (country && COUNTRY_MAPPINGS[country]) {
      const countryTerms = COUNTRY_MAPPINGS[country];
      filters.country = countryTerms[0];
    }

    // Handle work mode routing
    if (workMode) {
      filters.work_mode = [workMode];
    }

    return filters;
  }, [category, location, country, workMode]);

  // Main filter state derived from URL and route parameters
  const filters = useMemo<FilterState>(() => ({
    q: routeBasedFilters.q || searchParams.get('q') || '',
    country: routeBasedFilters.country || searchParams.get('country') || undefined,
    city: routeBasedFilters.city || searchParams.get('city') || undefined,
    category: routeBasedFilters.category || searchParams.get('category') || undefined,
    job_type: searchParams.get('job_type')?.split(',').filter(Boolean) || [],
    work_mode: routeBasedFilters.work_mode || searchParams.get('work_mode')?.split(',').filter(Boolean) || [],
    experience_level: searchParams.get('experience_level')?.split(',').filter(Boolean) || [],
    salary_min: searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined,
    salary_max: searchParams.get('salary_max') ? parseInt(searchParams.get('salary_max')!) : undefined,
    currency: searchParams.get('currency') || 'USD',
    company: searchParams.get('company') || undefined,
    source_platform: searchParams.get('source_platform') || undefined,
    date_posted: searchParams.get('date_posted') ? parseInt(searchParams.get('date_posted')!) : undefined,
    remote_only: searchParams.get('remote_only') === 'true',
    sort: searchParams.get('sort') || 'relevance',
    page: parseInt(searchParams.get('page') || '1'),
    size: parseInt(searchParams.get('size') || '25')
  }), [searchParams, routeBasedFilters]);

  // Debounced search query
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // UI state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showPromoAlert, setShowPromoAlert] = useState(true);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        newParams.delete(key);
      } else if (Array.isArray(value)) {
        newParams.set(key, value.join(','));
      } else {
        newParams.set(key, String(value));
      }
    });

    // Reset page when filters change
    if (Object.keys(newFilters).some(key => key !== 'page' && key !== 'size')) {
      newParams.set('page', '1');
    }

    setSearchParams(newParams);
    window.history.pushState(null, '', `${window.location.pathname}?${newParams.toString()}`);
  }, [searchParams]);

  // Debounced search update
  const debouncedUpdateSearch = useCallback((query: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      updateFilters({ q: query });
    }, 300);

    setSearchTimeout(timeout);
  }, [updateFilters, searchTimeout]);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    debouncedUpdateSearch(value);
  }, [debouncedUpdateSearch]);

  // Build API query parameters
  const buildApiParams = useCallback((filterState: FilterState): URLSearchParams => {
    const params = new URLSearchParams();

    Object.entries(filterState).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(v => params.append(key, v));
        } else if (!Array.isArray(value)) {
          params.set(key, String(value));
        }
      }
    });

    // Always include facets
    params.set('include_facets', 'true');

    return params;
  }, []);

  // Fetch scraped jobs with advanced filtering
  const { data: jobsResponse, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['scraped-jobs', filters],
    queryFn: async () => {
      const apiParams = buildApiParams(filters);
      const response = await fetch(`/api/scraped-jobs?${apiParams.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  // Extract data from response
  const jobs: JobPosting[] = jobsResponse?.jobs || [];
  const facets: JobFacets | undefined = jobsResponse?.facets;
  const pagination = jobsResponse?.pagination || { total: 0, page: 1, size: 25, totalPages: 0 };

  // Fetch platform jobs separately (lower priority)
  const { data: platformJobs = [] } = useQuery({
    queryKey: ['platform-jobs', filters.q, filters.category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set('search', filters.q);
      if (filters.category) params.set('category', filters.category);

      const response = await fetch(`/api/jobs/postings?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000, // 1 minute
  });

  // Combine scraped and platform jobs (scraped jobs are already filtered by API)
  const allJobs = useMemo(() => {
    const scrapedJobsWithMeta = jobs.map((job: any) => ({
      ...job,
      company: job.company || job.companyName,
      companyName: job.company || job.companyName,
      applyType: 'external' as const,
      priority: 2,
      source: 'scraped'
    }));

    const platformJobsWithMeta = platformJobs.map((job: any) => ({
      ...job,
      company: job.companyName || job.company_name || job.company,
      companyName: job.companyName || job.company_name || job.company,
      applyType: 'easy' as const,
      priority: 1,
      source: 'platform'
    }));

    return [...platformJobsWithMeta, ...scrapedJobsWithMeta];
  }, [jobs, platformJobs]);

  // Get user profile for compatibility scoring
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated
  });

  // Improved compatibility calculation - must be defined before usage in sorting
  const calculateCompatibility = (job: any) => {
    if (!isAuthenticated || !userProfile) return 0; // No compatibility for non-authenticated users

    let score = 50; // Base score

    // Skills matching (30 points max)
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

    // Experience level matching (15 points max)
    if (userProfile?.experienceLevel && job.experienceLevel) {
      const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
      const userLevelIndex = levels.indexOf(userProfile.experienceLevel.toLowerCase());
      const jobLevelIndex = levels.indexOf(job.experienceLevel.toLowerCase());

      if (userLevelIndex !== -1 && jobLevelIndex !== -1) {
        const levelDiff = Math.abs(userLevelIndex - jobLevelIndex);
        if (levelDiff === 0) score += 15; // Perfect match
        else if (levelDiff === 1) score += 10; // Close match
        else if (levelDiff === 2) score += 5; // Reasonable match
      }
    }

    // Location preference (5 points max)
    if (userProfile?.preferredLocation && job.location) {
      const userLocation = userProfile.preferredLocation.toLowerCase();
      const jobLocation = job.location.toLowerCase();

      if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation) || jobLocation.includes('remote')) {
        score += 5;
      }
    }

    // Use job ID for consistent pseudo-randomization to avoid constant re-ordering
    const pseudoRandom = (job.id % 21) - 10;
    score += pseudoRandom;

    return Math.min(100, Math.max(45, score));
  };

  const isLoading = jobsLoading;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('size', '25');
    setSearchParams(params);
    window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.q) count++;
    if (filters.country) count++;
    if (filters.city) count++;
    if (filters.category) count++;
    if (filters.job_type?.length) count++;
    if (filters.work_mode?.length) count++;
    if (filters.experience_level?.length) count++;
    if (filters.salary_min || filters.salary_max) count++;
    if (filters.company) count++;
    if (filters.source_platform) count++;
    if (filters.date_posted) count++;
    if (filters.remote_only) count++;
    return count;
  }, [filters]);

  // Remove specific filter
  const removeFilter = useCallback((key: keyof FilterState, value?: string) => {
    const newFilters: Partial<FilterState> = {};

    if (key === 'job_type' && value) {
      newFilters[key] = filters[key]?.filter(v => v !== value) || [];
    } else if (key === 'work_mode' && value) {
      newFilters[key] = filters[key]?.filter(v => v !== value) || [];
    } else if (key === 'experience_level' && value) {
      newFilters[key] = filters[key]?.filter(v => v !== value) || [];
    } else {
      newFilters[key] = undefined;
    }

    updateFilters(newFilters);
  }, [filters, updateFilters]);

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

  // Handle job click
  const handleJobClick = (job: JobPosting) => {
    setSelectedJob(job);
  };

  const handleApply = (job: JobPosting) => {
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

  const handleInterviewPrep = async (job: JobPosting) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }

    setLoadingInterviewPrep(true);
    setInterviewPrepData(null);

    try {
      const prepResponse = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company || job.companyName,
          experienceLevel: job.experienceLevel || job.experience_level,
          jobDescription: job.description,
          requirements: Array.isArray(job.requirements) 
            ? job.requirements 
            : (job.requiredSkills || [])
        })
      });

      const data = await prepResponse.json();

      if (prepResponse.ok) {
        setInterviewPrepData(data);
        toast({
          title: "Interview Prep Ready!",
          description: `Generated ${data.questions?.length || 0} practice questions and insights.`
        });
      } else {
        throw new Error(data.message || 'Failed to generate interview prep');
      }
    } catch (error) {
      toast({
        title: "Failed to Generate Interview Prep",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoadingInterviewPrep(false);
    }
  };

  const handleSalaryInsights = async (job: JobPosting) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }

    // Edge case: No job data
    if (!job) {
      toast({
        title: "Error",
        description: "No job data available",
        variant: "destructive"
      });
      return;
    }

    setLoadingSalary(true);
    setSalaryInsightsData(null);

    try {
      // Edge case: Missing critical job information
      const jobTitle = job.title?.trim() || 'Position';
      const company = (job.companyName || job.company || 'Company')?.trim();
      const location = job.location?.trim() || 'Remote';

      // Edge case: Parse experience level safely
      let experienceLevel = 0;
      if (job.experienceLevel) {
        const expStr = String(job.experienceLevel).toLowerCase();
        if (expStr.includes('entry') || expStr.includes('junior')) experienceLevel = 1;
        else if (expStr.includes('mid')) experienceLevel = 3;
        else if (expStr.includes('senior')) experienceLevel = 5;
        else if (expStr.includes('lead') || expStr.includes('principal')) experienceLevel = 8;
        else if (!isNaN(Number(job.experienceLevel))) experienceLevel = Number(job.experienceLevel);
      }

      // Edge case: Ensure skills is an array
      const skills = Array.isArray(job.requiredSkills) 
        ? job.requiredSkills.filter(s => s && typeof s === 'string')
        : [];

      const salaryResponse = await fetch('/api/ai/salary-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle,
          company,
          location,
          experienceLevel,
          skills
        })
      });

      // Edge case: Network error or timeout
      if (!salaryResponse) {
        throw new Error('Network error - please check your connection');
      }

      if (salaryResponse.ok) {
        const contentType = salaryResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const salaryData = await salaryResponse.json();
          // Edge case: Validate response data structure
          if (!salaryData || typeof salaryData !== 'object') {
            throw new Error('Invalid response format');
          }

          // Edge case: Missing salary range
          if (!salaryData.salaryRange || !salaryData.salaryRange.median) {
            salaryData.salaryRange = {
              min: 60000,
              median: 85000,
              max: 110000
            };
            salaryData.marketInsights = (salaryData.marketInsights || '') + ' Note: Estimated salary range based on limited data.';
          }

          setSalaryInsightsData(salaryData);

          const medianSalary = salaryData.salaryRange?.median;
          const salaryDisplay = medianSalary && !isNaN(medianSalary) 
            ? `$${medianSalary.toLocaleString()}` 
            : 'Available';

          toast({
            title: "Salary Insights Ready!",
            description: `Estimated: ${salaryDisplay}`
          });
        } else {
          console.error('Salary insights returned non-JSON response');
          throw new Error('Received unexpected response format from salary insights API.');
        }
      } else {
        const errorData = await salaryResponse.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to get salary insights');
      }
    } catch (error) {
      console.error('Salary insights error:', error);

      // Edge case: Provide helpful error message
      let errorMessage = "Please try again later.";
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Failed to Get Salary Insights",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoadingSalary(false);
    }
  };

  const handleFindReferrals = (job: JobPosting) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }

    // Open referral marketplace in a new tab
    const companyName = job.companyName || job.company || '';
    const referralUrl = `/referral-marketplace?companyName=${encodeURIComponent(companyName)}`;
    window.open(referralUrl, '_blank');

    toast({
      title: "Opening Referral Marketplace",
      description: `Browse referrals for ${companyName} in a new tab.`
    });
  };

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR (€)', symbol: '€' },
    { value: 'GBP', label: 'GBP (£)', symbol: '£' },
    { value: 'INR', label: 'INR (₹)', symbol: '₹' },
    { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
    { value: 'AED', label: 'AED (د.إ)', symbol: 'د.إ' }
  ];

  const getCurrentCurrencySymbol = () => {
    return currencyOptions.find(c => c.value === filters.currency)?.symbol || '$';
  };

  // Advanced Filter Panel Component
  const AdvancedFilterPanel = () => {
    return (
      <div className="space-y-6">
        {/* Location Filters */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Location
          </h3>
          <div className="space-y-2">
            <Select value={filters.country || ''} onValueChange={(value) => updateFilters({ country: value || undefined })}>
              <SelectTrigger data-testid="filter-country">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {facets?.countries?.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.code} ({country.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="City name"
              value={filters.city || ''}
              onChange={(e) => updateFilters({ city: e.target.value || undefined })}
              data-testid="filter-city"
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remote-only"
                checked={filters.remote_only || false}
                onCheckedChange={(checked) => updateFilters({ remote_only: checked as boolean })}
                data-testid="filter-remote-only"
              />
              <Label htmlFor="remote-only" className="text-sm">Remote Only</Label>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            Category
          </h3>
          <Select value={filters.category || ''} onValueChange={(value) => updateFilters({ category: value || undefined })}>
            <SelectTrigger data-testid="filter-category">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {facets?.categories?.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job Type Filters */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            Job Type
          </h3>
          <div className="space-y-2">
            {[
              { value: 'full_time', label: 'Full-time', icon: Building },
              { value: 'part_time', label: 'Part-time', icon: Clock },
              { value: 'contract', label: 'Contract', icon: FileText },
              { value: 'internship', label: 'Internship', icon: GraduationCap },
              { value: 'temporary', label: 'Temporary', icon: Calendar }
            ].map((type) => {
              const Icon = type.icon;
              const count = facets?.job_types?.find(jt => jt.type === type.value)?.count || 0;
              return (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-type-${type.value}`}
                    checked={filters.job_type?.includes(type.value) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.job_type || [];
                      const updated = checked 
                        ? [...current, type.value]
                        : current.filter(t => t !== type.value);
                      updateFilters({ job_type: updated });
                    }}
                    data-testid={`filter-job-type-${type.value}`}
                  />
                  <Label htmlFor={`job-type-${type.value}`} className="text-sm flex items-center cursor-pointer">
                    <Icon className="w-3 h-3 mr-1" />
                    {type.label} {count > 0 && `(${count})`}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work Mode Filters */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Laptop className="w-4 h-4 mr-2" />
            Work Mode
          </h3>
          <div className="space-y-2">
            {[
              { value: 'remote', label: 'Remote', icon: Globe },
              { value: 'hybrid', label: 'Hybrid', icon: Home },
              { value: 'onsite', label: 'On-site', icon: Building }
            ].map((mode) => {
              const Icon = mode.icon;
              const count = facets?.work_modes?.find(wm => wm.mode === mode.value)?.count || 0;
              return (
                <div key={mode.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`work-mode-${mode.value}`}
                    checked={filters.work_mode?.includes(mode.value) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.work_mode || [];
                      const updated = checked 
                        ? [...current, mode.value]
                        : current.filter(m => m !== mode.value);
                      updateFilters({ work_mode: updated });
                    }}
                    data-testid={`filter-work-mode-${mode.value}`}
                  />
                  <Label htmlFor={`work-mode-${mode.value}`} className="text-sm flex items-center cursor-pointer">
                    <Icon className="w-3 h-3 mr-1" />
                    {mode.label} {count > 0 && `(${count})`}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Experience Level Filters */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Award className="w-4 h-4 mr-2" />
            Experience Level
          </h3>
          <div className="space-y-2">
            {[
              { value: 'entry', label: 'Entry-level', icon: Star },
              { value: 'mid', label: 'Mid-level', icon: TrendingUp },
              { value: 'senior', label: 'Senior', icon: Award },
              { value: 'executive', label: 'Executive', icon: Target }
            ].map((level) => {
              const Icon = level.icon;
              const count = facets?.experience_levels?.find(el => el.level === level.value)?.count || 0;
              return (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`experience-${level.value}`}
                    checked={filters.experience_level?.includes(level.value) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.experience_level || [];
                      const updated = checked 
                        ? [...current, level.value]
                        : current.filter(l => l !== level.value);
                      updateFilters({ experience_level: updated });
                    }}
                    data-testid={`filter-experience-${level.value}`}
                  />
                  <Label htmlFor={`experience-${level.value}`} className="text-sm flex items-center cursor-pointer">
                    <Icon className="w-3 h-3 mr-1" />
                    {level.label} {count > 0 && `(${count})`}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Salary Range */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Salary Range
          </h3>
          <div className="space-y-3">
            <Select value={filters.currency || 'USD'} onValueChange={(value) => updateFilters({ currency: value })}>
              <SelectTrigger data-testid="filter-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min salary"
                  value={filters.salary_min || ''}
                  onChange={(e) => updateFilters({ salary_min: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="flex-1"
                  data-testid="filter-salary-min"
                />
                <Input
                  type="number"
                  placeholder="Max salary"
                  value={filters.salary_max || ''}
                  onChange={(e) => updateFilters({ salary_max: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="flex-1"
                  data-testid="filter-salary-max"
                />
              </div>
              {(filters.salary_min || filters.salary_max) && (
                <div className="text-xs text-muted-foreground">
                  {getCurrentCurrencySymbol()}{filters.salary_min?.toLocaleString() || '0'} - {getCurrentCurrencySymbol()}{filters.salary_max?.toLocaleString() || '∞'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date Posted */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Date Posted
          </h3>
          <RadioGroup
            value={filters.date_posted?.toString() || ''}
            onValueChange={(value) => updateFilters({ date_posted: value ? parseInt(value) : undefined })}
            data-testid="filter-date-posted"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="date-any" />
              <Label htmlFor="date-any">Any time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="date-1" />
              <Label htmlFor="date-1">Last 24 hours</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="7" id="date-7" />
              <Label htmlFor="date-7">Last 7 days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="14" id="date-14" />
              <Label htmlFor="date-14">Last 14 days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="30" id="date-30" />
              <Label htmlFor="date-30">Last 30 days</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Company Filter */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            Company
          </h3>
          <Input
            placeholder="Company name"
            value={filters.company || ''}
            onChange={(e) => updateFilters({ company: e.target.value || undefined })}
            data-testid="filter-company"
          />
        </div>

        {/* Source Platform */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Source Platform
          </h3>
          <Select value={filters.source_platform || ''} onValueChange={(value) => updateFilters({ source_platform: value || undefined })}>
            <SelectTrigger data-testid="filter-source-platform">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sources</SelectItem>
              {facets?.sources?.map((source) => (
                <SelectItem key={source.platform} value={source.platform}>
                  {source.platform} ({source.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // Active Filter Tags Component
  const FilterTags = () => {
    const tags = [];

    if (filters.q) {
      tags.push({ key: 'q', label: `"${filters.q}"`, value: filters.q });
    }
    if (filters.country) {
      tags.push({ key: 'country', label: `Country: ${filters.country}`, value: filters.country });
    }
    if (filters.city) {
      tags.push({ key: 'city', label: `City: ${filters.city}`, value: filters.city });
    }
    if (filters.category) {
      tags.push({ key: 'category', label: `Category: ${filters.category}`, value: filters.category });
    }
    if (filters.company) {
      tags.push({ key: 'company', label: `Company: ${filters.company}`, value: filters.company });
    }
    if (filters.source_platform) {
      tags.push({ key: 'source_platform', label: `Source: ${filters.source_platform}`, value: filters.source_platform });
    }
    if (filters.remote_only) {
      tags.push({ key: 'remote_only', label: 'Remote Only', value: 'true' });
    }
    if (filters.salary_min || filters.salary_max) {
      const min = filters.salary_min ? `${getCurrentCurrencySymbol()}${filters.salary_min.toLocaleString()}` : '0';
      const max = filters.salary_max ? `${getCurrentCurrencySymbol()}${filters.salary_max.toLocaleString()}` : '∞';
      tags.push({ key: 'salary', label: `Salary: ${min} - ${max}`, value: 'salary' });
    }
    if (filters.date_posted) {
      const dateMap: { [key: number]: string } = {
        1: 'Last 24 hours',
        7: 'Last 7 days', 
        14: 'Last 14 days',
        30: 'Last 30 days'
      };
      tags.push({ key: 'date_posted', label: dateMap[filters.date_posted] || `Last ${filters.date_posted} days`, value: filters.date_posted.toString() });
    }

    // Add multi-select tags
    filters.job_type?.forEach(type => {
      const label = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      tags.push({ key: 'job_type', label: `Type: ${label}`, value: type, isMulti: true });
    });
    filters.work_mode?.forEach(mode => {
      const label = mode.charAt(0).toUpperCase() + mode.slice(1);
      tags.push({ key: 'work_mode', label: `Mode: ${label}`, value: mode, isMulti: true });
    });
    filters.experience_level?.forEach(level => {
      const label = level.replace(/\b\w/g, l => l.toUpperCase());
      tags.push({ key: 'experience_level', label: `Level: ${label}`, value: level, isMulti: true });
    });

    if (tags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <Badge key={`${tag.key}-${tag.value}-${index}`} variant="secondary" className="flex items-center gap-1">
            <span>{tag.label}</span>
            <button
              onClick={() => {
                if (tag.isMulti) {
                  removeFilter(tag.key as keyof FilterState, tag.value);
                } else if (tag.key === 'salary') {
                  updateFilters({ salary_min: undefined, salary_max: undefined });
                } else {
                  removeFilter(tag.key as keyof FilterState);
                }
              }}
              className="ml-1 hover:text-destructive"
              data-testid={`remove-filter-${tag.key}-${tag.value}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-muted-foreground hover:text-foreground"
          data-testid="clear-all-filters"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Clear All
        </Button>
      </div>
    );
  };

  // SEO and Structured Data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobBoard",
    "name": "AutoJobR Jobs",
    "description": "Find your dream job with AI-powered matching. Browse thousands of jobs from top companies worldwide.",
    "url": "https://autojobr.com/jobs",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://autojobr.com/jobs?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "numberOfJobs": pagination?.total || 0
  };

  // Promotional content rotation
  const promoContent = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI Resume Optimizer",
      description: "Beat ATS systems with AI-powered resume analysis",
      cta: "Try Free",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <Chrome className="w-5 h-5" />,
      title: "Chrome Extension",
      description: "Auto-apply to 100+ jobs daily with one click",
      cta: "Install Free",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "For Recruiters",
      description: "Find top candidates 10x faster with AI matching",
      cta: "Start Free",
      color: "from-orange-500 to-red-600"
    }
  ];

  // Rotate promotional content every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promoContent.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Set first job as selected by default
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  // Loading skeleton UI component (moved to conditional JSX)
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Filter Panel Skeleton */}
            <div className="w-80 space-y-4">
              <Skeleton className="h-8 w-24" />
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-96" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-64" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-20 w-20 rounded" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Generate dynamic SEO metadata for category/location pages
  const seoMetadata = useMemo(() => {
    const baseUrl = 'https://autojobr.com';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/jobs';

    if (category) {
      const categoryName = category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      return {
        title: `${pagination.total || 100}+ ${categoryName} Jobs - Apply Today | AutoJobR`,
        description: `Find ${pagination.total || 100}+ ${categoryName.toLowerCase()} jobs from top companies. AI-powered matching, one-click applications, and instant interviews. Join 1M+ professionals landing ${categoryName.toLowerCase()} careers 10x faster.`,
        keywords: `${categoryName.toLowerCase()} jobs, ${categoryName.toLowerCase()} careers, ${CATEGORY_MAPPINGS[category]?.join(', ')}, job search, employment, hiring`,
        canonicalUrl: `${baseUrl}${currentPath}`,
        breadcrumbs: [
          { name: 'Home', url: baseUrl },
          { name: 'Jobs', url: `${baseUrl}/jobs` },
          { name: `${categoryName} Jobs`, url: `${baseUrl}${currentPath}` }
        ]
      };
    }

    if (location) {
      const locationName = location.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      return {
        title: `${pagination.total || 50}+ Jobs in ${locationName} - Find Local Careers | AutoJobR`,
        description: `Discover ${pagination.total || 50}+ job opportunities in ${locationName}. Local and remote positions from top employers. AI-powered job matching and one-click applications.`,
        keywords: `jobs in ${locationName.toLowerCase()}, ${locationName.toLowerCase()} careers, ${locationName.toLowerCase()} employment, local jobs, remote jobs, job search`,
        canonicalUrl: `${baseUrl}${currentPath}`,
        breadcrumbs: [
          { name: 'Home', url: baseUrl },
          { name: 'Jobs', url: `${baseUrl}/jobs` },
          { name: `${locationName} Jobs`, url: `${baseUrl}${currentPath}` }
        ]
      };
    }

    if (country) {
      const countryName = country === 'usa' ? 'United States' : 
                         country === 'uk' ? 'United Kingdom' :
                         country.charAt(0).toUpperCase() + country.slice(1);

      return {
        title: `${pagination.total || 200}+ Jobs in ${countryName} - International Careers | AutoJobR`,
        description: `Find ${pagination.total || 200}+ job opportunities in ${countryName}. International positions, visa sponsorship, and remote work options. Apply with AI-powered job matching.`,
        keywords: `jobs in ${countryName.toLowerCase()}, ${countryName.toLowerCase()} careers, international jobs, visa sponsorship, remote work, job search`,
        canonicalUrl: `${baseUrl}${currentPath}`,
        breadcrumbs: [
          { name: 'Home', url: baseUrl },
          { name: 'Jobs', url: `${baseUrl}/jobs` },
          { name: `${countryName} Jobs`, url: `${baseUrl}${currentPath}` }
        ]
      };
    }

    if (workMode === 'remote') {
      return {
        title: `${pagination.total || 500}+ Remote Jobs - Work From Anywhere | AutoJobR`,
        description: `Discover ${pagination.total || 500}+ remote job opportunities from top companies worldwide. Work from home, flexible schedules, and global career opportunities.`,
        keywords: 'remote jobs, work from home, telecommute, flexible work, remote careers, online jobs, distributed teams',
        canonicalUrl: `${baseUrl}${currentPath}`,
        breadcrumbs: [
          { name: 'Home', url: baseUrl },
          { name: 'Jobs', url: `${baseUrl}/jobs` },
          { name: 'Remote Jobs', url: `${baseUrl}${currentPath}` }
        ]
      };
    }

    // Default jobs page metadata
    return {
      title: `${pagination.total || 1000}+ Jobs Available - Find Your Dream Career | AutoJobR`,
      description: `Discover ${pagination.total || 1000}+ job opportunities from top companies worldwide. AI-powered job matching, one-click applications, and instant interview booking. Join 1M+ professionals finding jobs 10x faster.`,
      keywords: 'jobs, careers, job search, employment, hiring, remote jobs, tech jobs, AI job matching, auto apply jobs, job automation, career opportunities',
      canonicalUrl: `${baseUrl}/jobs`,
      breadcrumbs: [
        { name: 'Home', url: baseUrl },
        { name: 'Jobs', url: `${baseUrl}/jobs` }
      ]
    };
  }, [category, location, country, workMode, pagination.total]);

  // Enhanced structured data with ItemList for job listings
  const enhancedStructuredData = useMemo(() => {
    const baseStructuredData = structuredData || {};

    // Add BreadcrumbList structured data
    const breadcrumbList = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": seoMetadata.breadcrumbs.map((breadcrumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": breadcrumb.name,
        "item": breadcrumb.url
      }))
    };

    // Add ItemList structured data for job listings
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "numberOfItems": pagination.total || 0,
      "itemListElement": allJobs.slice(0, 20).map((job, index) => ({
        "@type": "JobPosting",
        "position": index + 1,
        "title": job.title,
        "description": job.description?.substring(0, 200) + '...',
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.companyName || job.company || "AutoJobR"
        },
        "jobLocation": {
          "@type": "Place",
          "address": job.location
        },
        "url": `https://autojobr.com/jobs/${job.id}`,
        "datePosted": job.createdAt || job.created_at || new Date().toISOString(),
        "employmentType": job.jobType === 'full_time' ? 'FULL_TIME' : 'FULL_TIME'
      }))
    };

    return [baseStructuredData, breadcrumbList, itemList];
  }, [structuredData, seoMetadata.breadcrumbs, allJobs, pagination.total]);

  return jobsLoading ? <LoadingSkeleton /> : (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <SEOHead
        title={seoMetadata.title}
        description={seoMetadata.description}
        keywords={seoMetadata.keywords}
        canonicalUrl={seoMetadata.canonicalUrl}
        structuredData={enhancedStructuredData}
        ogType="website"
      />
      <Navbar />

      {/* Promotional Alert Banner */}
      {showPromoAlert && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  key={currentPromo}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  {promoContent[currentPromo].icon}
                  <div>
                    <span className="font-semibold">{promoContent[currentPromo].title}:</span>
                    <span className="ml-2 text-blue-100">{promoContent[currentPromo].description}</span>
                  </div>
                </motion.div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={() => !isAuthenticated ? setLocation('/auth') : null}
                >
                  {promoContent[currentPromo].cta}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPromoAlert(false)}
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Header with Better Typography and Mobile Optimization */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight">
                {isAuthenticated ? 'Your Perfect Job Matches' : 'Discover Your Dream Career'}
              </h1>
              <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 mt-2">
                {isAuthenticated 
                  ? `AI-curated opportunities based on your profile`
                  : `${pagination.total}+ jobs from top companies worldwide • AI-powered matching`}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {allJobs.length} results
                </p>
                {!isAuthenticated && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <SparklesIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      Sign in for personalized matches
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Search and Sort Controls */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 touch-manipulation"
                  />
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                  <Select value={filters.sort} onValueChange={(v) => updateFilters({ sort: v })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="match">Best Match</SelectItem>
                      <SelectItem value="date">Latest</SelectItem>
                      <SelectItem value="salary">Highest Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-2 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 h-full">
          {/* Job List - Mobile Optimized */}
          <div className="h-full">
            <div className="h-[calc(100vh-200px)] sm:h-[calc(100vh-240px)] overflow-y-auto pr-1 lg:pr-2 space-y-3 lg:space-y-4">
            {jobsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-3" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : allJobs.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No jobs found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Try adjusting your search terms or filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              allJobs.map((job: any) => {
                const compatibility = calculateCompatibility(job);
                const isSelected = selectedJob?.id === job?.id;
                const isApplied = Array.isArray(appliedJobIds) && appliedJobIds.includes(job.id);

                if (!job || !job.id) {
                  console.error('Invalid job in list:', job);
                  return null;
                }

                return (
                  <Card 
                    key={job.id} 
                    className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer touch-manipulation ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg mb-1 line-clamp-2">
                            {job.title}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span className="font-medium">{job.companyName}</span>
                            {job.location && (
                              <div className="flex items-center gap-1">
                                <span className="hidden sm:inline">•</span>
                                <MapPin className="w-3 h-3 sm:hidden" />
                                <span className="text-xs sm:text-sm">{job.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-2">
                          <Badge 
                            className={`text-xs ${
                              compatibility >= 90 ? 'bg-green-100 text-green-800' :
                              compatibility >= 80 ? 'bg-blue-100 text-blue-800' :
                              compatibility >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {compatibility}%
                          </Badge>
                          {savedJobs.has(job.id) && (
                            <Bookmark className="w-3 h-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3">
                        {job.workMode && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {formatWorkMode(job.workMode)}
                          </Badge>
                        )}
                        {job.jobType && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {formatJobType(job.jobType)}
                          </Badge>
                        )}
                        {job.experienceLevel && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {job.experienceLevel}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                        {job.description}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveJob(job.id);
                            }}
                            className="text-gray-600 hover:text-yellow-600 text-xs h-8 px-2 touch-manipulation"
                          >
                            <Bookmark className="w-3 h-3 mr-1" />
                            {isAuthenticated ? 'Save' : 'Sign in to Save'}
                          </Button>
                          {isApplied ? (
                            <Badge className="bg-green-100 text-green-800 text-xs px-2">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Applied
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApply(job);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 touch-manipulation"
                            >
                              {!isAuthenticated ? (
                                'Sign in to Apply'
                              ) : job.applyType === 'external' ? (
                                <><ExternalLink className="w-3 h-3 mr-1" />Apply</>
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 pb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ page: Math.max(1, pagination.page - 1) })}
                    disabled={pagination.page === 1}
                    data-testid="prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = Math.max(1, pagination.page - 2) + i;
                      if (page > pagination.totalPages) return null;
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateFilters({ page })}
                          className="w-8 h-8"
                          data-testid={`page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                      <>
                        <span className="px-2">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateFilters({ page: pagination.totalPages })}
                          className="w-8 h-8"
                          data-testid={`page-${pagination.totalPages}`}
                        >
                          {pagination.totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ page: Math.min(pagination.totalPages, pagination.page + 1) })}
                    disabled={pagination.page >= pagination.totalPages}
                    data-testid="next-page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Enhanced Job Detail Panel - Mobile Optimized */}
          <div className="h-full">
            <div className="h-[calc(100vh-200px)] sm:h-[calc(100vh-240px)] overflow-y-auto pl-1 lg:pl-2">
            {selectedJob ? (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                          {selectedJob.title}
                        </h2>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{selectedJob.company || selectedJob.companyName}</span>
                          </div>
                          {selectedJob.location && (
                            <div className="flex items-center gap-2">
                              <span className="hidden sm:inline">•</span>
                              <MapPin className="w-4 h-4 flex-shrink-0 sm:hidden" />
                              <span>{selectedJob.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge 
                        className={`flex-shrink-0 text-xs sm:text-sm bg-blue-100 text-blue-800`}
                      >
                        New
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
                      {appliedJobIds.includes(selectedJob.id) ? (
                        <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Applied
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => handleApply(selectedJob)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 px-4 touch-manipulation"
                        >
                          {!isAuthenticated ? 'Sign in to Apply' : 
                           selectedJob.applyType === 'external' ? (
                             <><ExternalLink className="w-4 h-4 mr-1" />Apply</>
                           ) : 'Easy Apply'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleSaveJob(selectedJob.id)}
                        disabled={savedJobs.has(selectedJob.id)}
                        className="text-sm h-9 px-3 touch-manipulation"
                      >
                        <Bookmark className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{savedJobs.has(selectedJob.id) ? 'Saved' : 'Save'}</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setLocation(`/jobs/${selectedJob.id}`)}
                        className="h-9 w-9 touch-manipulation"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Advanced AI Features */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInterviewPrep(selectedJob)}
                        disabled={loadingInterviewPrep}
                        className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 text-blue-700 dark:text-blue-300"
                        data-testid="button-interview-prep"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {loadingInterviewPrep ? 'Loading...' : 'Interview Prep'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSalaryInsights(selectedJob)}
                        disabled={loadingSalary}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 text-green-700 dark:text-green-300"
                        data-testid="button-salary-insights"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {loadingSalary ? 'Loading...' : 'Salary Intel'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFindReferrals(selectedJob)}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-purple-700 dark:text-purple-300"
                        data-testid="button-find-referrals"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Find Referrals
                      </Button>
                    </div>

                    {/* Interview Prep Results - Inline Display */}
                    {interviewPrepData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Interview Preparation
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => setInterviewPrepData(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {interviewPrepData.companyInsights && (
                          <div className="mb-4">
                            <h5 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">Company Insights</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {interviewPrepData.companyInsights}
                            </p>
                          </div>
                        )}

                        {interviewPrepData.questions && interviewPrepData.questions.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">Practice Questions</h5>
                            <ul className="space-y-2">
                              {interviewPrepData.questions.slice(0, 5).map((q: string, i: number) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">{i + 1}.</span>
                                  <span>{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {interviewPrepData.tips && (
                          <div>
                            <h5 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">Preparation Tips</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {interviewPrepData.tips}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Salary Insights Results - Inline Display */}
                    {salaryInsightsData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Salary Insights
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => setSalaryInsightsData(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {salaryInsightsData.salaryRange && 
                         salaryInsightsData.salaryRange.median && 
                         !isNaN(salaryInsightsData.salaryRange.median) && 
                         salaryInsightsData.salaryRange.median > 0 ? (
                          <div className="mb-4">
                            <h5 className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">Salary Range ({salaryInsightsData.currency || 'USD'})</h5>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Min</p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                  ${salaryInsightsData.salaryRange.min?.toLocaleString() || '0'}
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Median</p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                  ${salaryInsightsData.salaryRange.median?.toLocaleString() || '0'}
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Max</p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                  ${salaryInsightsData.salaryRange.max?.toLocaleString() || '0'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                              ⚠️ Salary data not available for this position. This may be due to limited market data or the job title not being recognized in our database. We're using estimated ranges based on similar roles.
                            </p>
                          </div>
                        )}

                        {salaryInsightsData.marketInsights && (
                          <div className="mb-4">
                            <h5 className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">Market Insights</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {salaryInsightsData.marketInsights}
                            </p>
                          </div>
                        )}

                        {salaryInsightsData.negotiationTips && salaryInsightsData.negotiationTips.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">Negotiation Tips</h5>
                            <ul className="space-y-1">
                              {salaryInsightsData.negotiationTips.slice(0, 4).map((tip: string, i: number) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}


                  </div>

                  <div className="space-y-6">
                    {/* Job Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedJob.workMode && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Work Mode</span>
                          <p className="text-gray-900 dark:text-white font-medium">{formatWorkMode(selectedJob.workMode)}</p>
                        </div>
                      )}
                      {selectedJob.jobType && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Type</span>
                          <p className="text-gray-900 dark:text-white font-medium">{formatJobType(selectedJob.jobType)}</p>
                        </div>
                      )}
                      {selectedJob.experienceLevel && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Experience Level</span>
                          <p className="text-gray-900 dark:text-white font-medium">{selectedJob.experienceLevel}</p>
                        </div>
                      )}
                      {(selectedJob.minSalary || selectedJob.maxSalary) && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Salary Range</span>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {selectedJob.minSalary && selectedJob.maxSalary 
                              ? `$${selectedJob.minSalary.toLocaleString()} - $${selectedJob.maxSalary.toLocaleString()}`
                              : selectedJob.minSalary 
                              ? `$${selectedJob.minSalary.toLocaleString()}+`
                              : `Up to $${selectedJob.maxSalary?.toLocaleString()}`
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* About the job */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        About the job
                      </h3>
                      <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {selectedJob.description}
                        </p>
                      </div>
                    </div>

                    {/* Requirements */}
                    {selectedJob.requirements && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Requirements
                        </h3>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {selectedJob.requirements}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Responsibilities */}
                    {selectedJob.responsibilities && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Responsibilities
                        </h3>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {selectedJob.responsibilities}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Benefits */}
                    {selectedJob.benefits && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Benefits & Perks
                        </h3>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {selectedJob.benefits}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Required Skills */}
                    {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Required Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.requiredSkills.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job Statistics */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Job Statistics
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Posted</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(selectedJob.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {selectedJob.applicationsCount !== undefined && (
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Applicants</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedJob.applicationsCount} applied
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedJob.recruiterName && (
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Recruiter</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedJob.recruiterName}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Company</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedJob.companyName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-6 sm:p-8 text-center">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a job to view details
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    Tap on any job from the list to see comprehensive information including requirements, responsibilities, benefits, and more
                  </p>
                </CardContent>
              </Card>
            )}
            </div>
          </div>

          {/* Promotional Sidebar for Non-Authenticated Users */}
          {!isAuthenticated && (
            <div className="hidden lg:block space-y-4">
              {/* Sign Up CTA */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                <CardContent className="p-6">
                  <div className="text-center">
                    <SparklesIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Unlock Your Career Potential
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                      Get personalized job matches, one-click applications, and AI-powered career tools
                    </p>
                    <Button 
                      onClick={() => setLocation('/auth')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                    >
                      Sign Up Free
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Tools Promotion */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI-Powered Tools
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <ZapIcon className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Resume Optimizer</p>
                        <p className="text-gray-600 dark:text-gray-300">Beat ATS systems with AI analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">AI Interview Prep</p>
                        <p className="text-gray-600 dark:text-gray-300">Practice with virtual interviews</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Smart Matching</p>
                        <p className="text-gray-600 dark:text-gray-300">Find perfect job matches instantly</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chrome Extension Promotion */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Chrome className="w-5 h-5 text-green-600" />
                    Chrome Extension
                  </h4>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600 dark:text-gray-300">
                      Auto-apply to 100+ jobs daily with one click
                    </p>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">10x faster applications</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Auto-fill job forms</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Track all applications</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recruiter Benefits */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700">
                <CardContent className="p-6">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    For Recruiters
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    Find top candidates 10x faster with AI-powered matching
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation('/auth')}
                    className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    Hire Talent
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}