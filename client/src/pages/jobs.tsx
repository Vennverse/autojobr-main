import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
  X
} from "lucide-react";

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
}

interface UserProfile {
  skills?: string[];
  experienceLevel?: string;
  preferredLocation?: string;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  professionalTitle?: string;
}

export default function Jobs() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showPromoAlert, setShowPromoAlert] = useState(true);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 25; // Show more jobs per page
  const [sortBy, setSortBy] = useState("relevance"); // relevance, date, salary, match
  const [filterPreferences, setFilterPreferences] = useState({
    location: "",
    jobType: "",
    workMode: "",
    experienceLevel: "",
    salaryRange: "",
    company: "",
    skills: [] as string[],
    category: ""
  });

  // Fetch platform jobs (recruiter postings) - now public
  const { data: platformJobs = [], isLoading: platformJobsLoading } = useQuery({
    queryKey: ["/api/jobs/postings", searchQuery, filterPreferences],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      Object.entries(filterPreferences).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value !== 'all') params.append(key, value);
      });
      
      const response = await fetch(`/api/jobs/postings?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    }
    // Removed enabled: isAuthenticated - now loads for everyone
  });

  // Fetch scraped jobs - now public
  const { data: scrapedJobs = [], isLoading: scrapedJobsLoading } = useQuery({
    queryKey: ["/api/scraped-jobs?limit=2000"],
    queryFn: async () => {
      const response = await fetch("/api/scraped-jobs?limit=2000", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch scraped jobs');
      return response.json();
    }
    // Removed enabled: isAuthenticated - now loads for everyone
  });

  // Combine and prioritize platform jobs first, then scraped jobs
  const allJobsUnsorted = [
    ...platformJobs.map((job: any) => ({
      ...job,
      company: job.companyName || job.company_name || job.company,
      companyName: job.companyName || job.company_name || job.company,
      jobType: 'platform',
      applyType: 'easy',
      priority: 1 // Platform jobs get higher priority
    })),
    ...scrapedJobs.map((job: any) => ({
      ...job,
      company: job.company,
      companyName: job.company,
      jobType: 'scraped',
      applyType: 'external',
      priority: 2, // Scraped jobs get lower priority
      sourceUrl: job.source_url // Map the database field
    }))
  ].filter((job: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return job.title?.toLowerCase().includes(query) || 
             job.company?.toLowerCase().includes(query) ||
             job.location?.toLowerCase().includes(query);
    }
    return true;
  }).filter((job: any) => {
    // Apply filters
    if (filterPreferences.category && filterPreferences.category !== 'all') {
      return job.category === filterPreferences.category;
    }
    if (filterPreferences.workMode && filterPreferences.workMode !== 'all') {
      return job.workMode === filterPreferences.workMode || job.work_mode === filterPreferences.workMode;
    }
    if (filterPreferences.experienceLevel && filterPreferences.experienceLevel !== 'all') {
      return job.experienceLevel === filterPreferences.experienceLevel || job.experience_level === filterPreferences.experienceLevel;
    }
    return true;
  });

  // Get user profile for compatibility scoring (only if authenticated) - must be before calculateCompatibility
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

  // Sort jobs based on selected criteria
  const allJobs = [...allJobsUnsorted].sort((a, b) => {
    // First, always prioritize platform jobs over scraped jobs
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // For non-authenticated users, just sort by date
    if (!isAuthenticated) {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA; // Newer first
    }

    // Then apply secondary sorting for authenticated users
    switch (sortBy) {
      case "match":
        const matchA = calculateCompatibility(a);
        const matchB = calculateCompatibility(b);
        return matchB - matchA; // Higher match first
      
      case "date":
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA; // Newer first
        
      case "salary":
        const salaryA = a.maxSalary || a.minSalary || 0;
        const salaryB = b.maxSalary || b.minSalary || 0;
        return salaryB - salaryA; // Higher salary first
        
      default: // relevance
        const relevanceA = calculateCompatibility(a);
        const relevanceB = calculateCompatibility(b);
        return relevanceB - relevanceA; // Higher relevance first
    }
  });

  const jobsLoading = platformJobsLoading || scrapedJobsLoading;

  // User profile query already defined above



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

  // Apply to job mutation (for platform jobs only)
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
      // Redirect to auth page instead of showing error
      setLocation('/auth');
      return;
    }

    // Handle external scraped jobs
    if (job.jobType === 'scraped' && job.sourceUrl) {
      window.open(job.sourceUrl, '_blank');
      toast({
        title: "Redirected to External Site",
        description: "Complete your application on the company's website."
      });
      return;
    }

    // Handle platform jobs
    if (job.jobType === 'platform') {
      applyMutation.mutate(job.id);
      return;
    }

    // Fallback for platform jobs without explicit type
    applyMutation.mutate(job.id);
  };

  const handleSaveJob = (jobId: number) => {
    if (!isAuthenticated) {
      // Redirect to auth page instead of showing error
      setLocation('/auth');
      return;
    }
    saveJobMutation.mutate(jobId);
  };

  const handleJobClick = (job: any) => {
    console.log('Job clicked:', job?.id, job?.title);
    if (job && job.id) {
      setSelectedJob(job);
    } else {
      console.error('Invalid job clicked:', job);
    }
  };

  // Filter jobs (allJobs is already sorted above)
  const filteredJobs = allJobs.filter((job: any) => {
    if (!searchQuery?.trim()) return true;
    const searchLower = searchQuery.toLowerCase().trim();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.companyName?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower) ||
      (job.requiredSkills && job.requiredSkills.some((skill: string) => 
        skill?.toLowerCase().includes(searchLower)
      ))
    );
  });

  // Use filteredJobs directly as allJobs is already sorted
  const sortedJobs = filteredJobs;

  // SEO and Structured Data (after data is loaded)
  const totalJobsCount = (Array.isArray(platformJobs) ? platformJobs.length : 0) + (Array.isArray(scrapedJobs) ? scrapedJobs.length : 0);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobBoard",
    "name": "AutoJobR Jobs",
    "description": "Find your dream job with AI-powered matching. Browse 1000+ jobs from top companies worldwide.",
    "url": "https://autojobr.com/jobs",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://autojobr.com/jobs?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "numberOfJobs": totalJobsCount,
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
      "employmentType": job.jobType?.toUpperCase() || "FULL_TIME",
      "workHours": job.workMode === 'remote' ? "REMOTE" : "FULL_TIME",
      "datePosted": job.createdAt || job.created_at
    }))
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

  // Pagination - safely handle empty arrays
  const totalJobs = Array.isArray(sortedJobs) ? sortedJobs.length : 0;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = Array.isArray(sortedJobs) ? sortedJobs.slice(startIndex, startIndex + jobsPerPage) : [];

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPreferences]);

  // Set first job as selected by default
  useEffect(() => {
    if (Array.isArray(paginatedJobs) && paginatedJobs.length > 0 && !selectedJob) {
      console.log('Setting default selected job:', paginatedJobs[0]?.id, paginatedJobs[0]?.title);
      setSelectedJob(paginatedJobs[0]);
    }
  }, [paginatedJobs, selectedJob]);


  // Show loading while data is being fetched
  if (jobsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <SEOHead
        title={`${totalJobsCount}+ Jobs Available - Find Your Dream Career | AutoJobR`}
        description={`Discover ${totalJobsCount}+ job opportunities from top companies worldwide. AI-powered job matching, one-click applications, and instant interview booking. Join 1M+ professionals finding jobs 10x faster.`}
        keywords="jobs, careers, job search, employment, hiring, remote jobs, tech jobs, AI job matching, auto apply jobs, job automation, career opportunities"
        canonicalUrl="https://autojobr.com/jobs"
        structuredData={structuredData}
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
                  : `${totalJobsCount}+ jobs from top companies worldwide • AI-powered matching`}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {totalJobs} results
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 touch-manipulation"
                  />
                </div>
                
                {/* Sort Options */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6 h-full">
          {/* Job List - Mobile Optimized */}
          <div className="lg:col-span-2 h-full">
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
            ) : paginatedJobs.length === 0 ? (
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
              paginatedJobs.map((job: any) => {
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
                            {job.workMode}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8"
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-2">...</span>
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
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
                            <span className="font-medium">{selectedJob.companyName}</span>
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
                        className={`flex-shrink-0 text-xs sm:text-sm ${
                          calculateCompatibility(selectedJob) >= 90 ? 'bg-green-100 text-green-800' :
                          calculateCompatibility(selectedJob) >= 80 ? 'bg-blue-100 text-blue-800' :
                          calculateCompatibility(selectedJob) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {calculateCompatibility(selectedJob)}% match
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
                  </div>
                  
                  <div className="space-y-6">
                    {/* Job Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedJob.workMode && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Work Mode</span>
                          <p className="text-gray-900 dark:text-white font-medium">{selectedJob.workMode}</p>
                        </div>
                      )}
                      {selectedJob.jobType && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Type</span>
                          <p className="text-gray-900 dark:text-white font-medium">{selectedJob.jobType}</p>
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