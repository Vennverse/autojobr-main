import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Plus
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
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 25; // Show more jobs per page
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

  // Fetch all jobs without pagination limit
  const { data: allJobs = [], isLoading: jobsLoading } = useQuery({
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
    },
    enabled: isAuthenticated
  });

  // Get user profile for compatibility scoring
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated
  });

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
  
  const handleApply = (jobId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for jobs."
      });
      return;
    }
    applyMutation.mutate(jobId);
  };

  const handleSaveJob = (jobId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save jobs."
      });
      return;
    }
    saveJobMutation.mutate(jobId);
  };

  const handleJobClick = (job: any) => {
    setSelectedJob(job);
  };

  // Improved compatibility calculation
  const calculateCompatibility = (job: any) => {
    if (!userProfile) return Math.floor(Math.random() * 30 + 65); // Random score between 65-95
    
    let score = 50; // Base score
    
    // Skills matching (30 points max)
    const userSkills = userProfile.skills || [];
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
    if (userProfile.experienceLevel && job.experienceLevel) {
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
    if (userProfile.preferredLocation && job.location) {
      const userLocation = userProfile.preferredLocation.toLowerCase();
      const jobLocation = job.location.toLowerCase();
      
      if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation) || jobLocation.includes('remote')) {
        score += 5;
      }
    }
    
    // Add some randomization for variety (+/- 10 points)
    score += Math.floor(Math.random() * 21) - 10;
    
    return Math.min(100, Math.max(45, score));
  };

  // Filter and sort jobs
  const filteredJobs = allJobs.filter((job: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.companyName.toLowerCase().includes(searchLower) ||
      job.description.toLowerCase().includes(searchLower) ||
      (job.requiredSkills && job.requiredSkills.some((skill: string) => 
        skill.toLowerCase().includes(searchLower)
      ))
    );
  });

  // Sort by profile compatibility first, then by date
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const scoreA = calculateCompatibility(a);
    const scoreB = calculateCompatibility(b);
    if (scoreB !== scoreA) return scoreB - scoreA; // Higher score first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Pagination
  const totalJobs = sortedJobs.length;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = sortedJobs.slice(startIndex, startIndex + jobsPerPage);

  // Set first job as selected by default
  useEffect(() => {
    if (paginatedJobs.length > 0 && !selectedJob) {
      setSelectedJob(paginatedJobs[0]);
    }
  }, [paginatedJobs, selectedJob]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Please log in to view jobs</h1>
            <Button onClick={() => window.location.href = "/api/login"}>
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      
      {/* Fixed Header */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Top job picks for you
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Based on your profile, preferences, and activity like applies, searches, and saves
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {totalJobs} results
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by title, company, or keywords"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content - Full Height with Independent Scrolling */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Job List - Scrollable */}
          <div className="h-full">
            <div className="h-[calc(100vh-240px)] overflow-y-auto pr-2 space-y-4">
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
                const isSelected = selectedJob?.id === job.id;
                const isApplied = appliedJobIds.includes(job.id);
                
                return (
                  <Card 
                    key={job.id} 
                    className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 truncate">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                            <span className="font-medium">{job.companyName}</span>
                            {job.location && (
                              <>
                                <span>•</span>
                                <span>{job.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge 
                            className={`${
                              compatibility >= 90 ? 'bg-green-100 text-green-800' :
                              compatibility >= 80 ? 'bg-blue-100 text-blue-800' :
                              compatibility >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {compatibility}% match
                          </Badge>
                          {savedJobs.has(job.id) && (
                            <Bookmark className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        {job.workMode && (
                          <Badge variant="secondary" className="text-xs">
                            {job.workMode}
                          </Badge>
                        )}
                        {job.jobType && (
                          <Badge variant="secondary" className="text-xs">
                            {job.jobType}
                          </Badge>
                        )}
                        {job.experienceLevel && (
                          <Badge variant="outline" className="text-xs">
                            {job.experienceLevel}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                        {job.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
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
                            className="text-gray-600 hover:text-yellow-600"
                          >
                            Save
                          </Button>
                          {isApplied ? (
                            <Badge className="bg-green-100 text-green-800">
                              Applied
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApply(job.id);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Easy Apply
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

          {/* Enhanced Job Detail Panel - Comprehensive Information */}
          <div className="h-full">
            <div className="h-[calc(100vh-240px)] overflow-y-auto pl-2">
            {selectedJob ? (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {selectedJob.title}
                        </h2>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-3">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{selectedJob.companyName}</span>
                          {selectedJob.location && (
                            <>
                              <span>•</span>
                              <MapPin className="w-4 h-4" />
                              <span>{selectedJob.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge 
                        className={`${
                          calculateCompatibility(selectedJob) >= 90 ? 'bg-green-100 text-green-800' :
                          calculateCompatibility(selectedJob) >= 80 ? 'bg-blue-100 text-blue-800' :
                          calculateCompatibility(selectedJob) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {calculateCompatibility(selectedJob)}% match
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-6">
                      {appliedJobIds.includes(selectedJob.id) ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Applied
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => handleApply(selectedJob.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Easy Apply
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleSaveJob(selectedJob.id)}
                        disabled={savedJobs.has(selectedJob.id)}
                      >
                        <Bookmark className="w-4 h-4 mr-2" />
                        {savedJobs.has(selectedJob.id) ? 'Saved' : 'Save'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setLocation(`/jobs/${selectedJob.id}`)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Job Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        About the job
                      </h3>
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Job Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a job to view details
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Click on any job from the list to see comprehensive information including requirements, responsibilities, benefits, and more
                  </p>
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}