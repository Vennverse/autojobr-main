import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import SEOHead from "@/components/seo-head";
import { Card, CardContent } from "@/components/ui/card";
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
  Calendar,
  ExternalLink,
  Bookmark,
  Eye,
  Filter,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Clock,
  Star,
  Briefcase,
  X,
  GraduationCap,
  Target,
  TrendingUp
} from "lucide-react";

interface Internship {
  id: number;
  company: string;
  role: string;
  location: string;
  applicationUrl?: string;
  simplifyUrl?: string;
  category?: string;
  season?: string;
  requirements?: string[];
  datePosted?: string;
  sponsorship?: string;
  viewsCount?: number;
  clicksCount?: number;
  sourcePlatform: string;
  externalId: string;
  isActive: boolean;
}

interface SavedInternship extends Internship {
  savedAt: string;
}

interface Application {
  id: number;
  internshipId: number;
  status: string;
  appliedAt: string;
  company: string;
  role: string;
  location: string;
}

export default function Internships() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [savedInternships, setSavedInternships] = useState<Set<number>>(new Set());
  const [selectedInternship, setSelectedInternship] = useState<any>(null);
  const [showPromoAlert, setShowPromoAlert] = useState(true);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const internshipsPerPage = 25;
  const [sortBy, setSortBy] = useState("date");
  const [filterPreferences, setFilterPreferences] = useState({
    company: "",
    location: "",
    category: "",
    season: "",
    requirements: ""
  });

  // Fetch internships
  const { data: internshipsData, isLoading: internshipsLoading } = useQuery({
    queryKey: ["/api/internships", currentPage, searchQuery, filterPreferences],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', internshipsPerPage.toString());
      
      if (searchQuery) params.append('search', searchQuery);
      Object.entries(filterPreferences).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      
      const response = await fetch(`/api/internships?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch internships');
      return response.json();
    }
  });

  const internships = internshipsData?.internships || [];
  const pagination = internshipsData?.pagination || {};

  // Fetch saved internships for authenticated users
  const { data: savedData } = useQuery({
    queryKey: ["/api/internships/saved"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch("/api/internships/saved", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch saved internships');
      return response.json();
    }
  });

  // Fetch applications for authenticated users
  const { data: applicationsData } = useQuery({
    queryKey: ["/api/internships/applications"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch("/api/internships/applications", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    }
  });

  const applications = applicationsData?.applications || [];
  const appliedInternshipIds = applications.map((app: Application) => app.internshipId);

  // Update saved internships when data loads
  useEffect(() => {
    if (savedData?.savedInternships) {
      const savedIds = new Set<number>(savedData.savedInternships.map((saved: any) => saved.id));
      setSavedInternships(savedIds);
    }
  }, [savedData]);

  // Save internship mutation
  const saveInternshipMutation = useMutation({
    mutationFn: async (internshipId: number) => {
      const response = await fetch(`/api/internships/${internshipId}/save`, {
        method: "POST",
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save internship');
      }
      return response.json();
    },
    onSuccess: (_, internshipId) => {
      setSavedInternships(prev => new Set([...Array.from(prev), internshipId]));
      toast({ title: "Internship Saved", description: "Internship added to your saved list!" });
      queryClient.invalidateQueries({ queryKey: ["/api/internships/saved"] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Unsave internship mutation
  const unsaveInternshipMutation = useMutation({
    mutationFn: async (internshipId: number) => {
      const response = await fetch(`/api/internships/${internshipId}/save`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to unsave internship');
      return response.json();
    },
    onSuccess: (_, internshipId) => {
      setSavedInternships(prev => {
        const newSet = new Set(prev);
        newSet.delete(internshipId);
        return newSet;
      });
      toast({ title: "Internship Unsaved", description: "Internship removed from your saved list!" });
      queryClient.invalidateQueries({ queryKey: ["/api/internships/saved"] });
    }
  });

  // Apply to internship mutation
  const applyMutation = useMutation({
    mutationFn: async (internshipId: number) => {
      const response = await fetch(`/api/internships/${internshipId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          applicationMethod: 'manual',
          applicationNotes: ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record application');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Recorded", 
        description: "Your application has been tracked!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/internships/applications"] });
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
  const handleApply = (internship: Internship) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }

    // Open external URL and record application
    const applicationUrl = internship.applicationUrl || internship.simplifyUrl;
    if (applicationUrl) {
      window.open(applicationUrl, '_blank');
      applyMutation.mutate(internship.id);
      toast({
        title: "Redirected to Application",
        description: "Complete your application on the company's website."
      });
    } else {
      toast({
        title: "No Application URL",
        description: "This internship doesn't have a valid application URL.",
        variant: "destructive"
      });
    }
  };

  const handleSaveInternship = (internshipId: number) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    
    if (savedInternships.has(internshipId)) {
      unsaveInternshipMutation.mutate(internshipId);
    } else {
      saveInternshipMutation.mutate(internshipId);
    }
  };

  const handleInternshipClick = (internship: Internship) => {
    setSelectedInternship(internship);
  };

  // SEO and Structured Data
  const totalInternshipsCount = pagination.total || 0;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobBoard",
    "name": "AutoJobR Internships",
    "description": "Find your perfect internship opportunity. Browse 1000+ internships from top companies worldwide.",
    "url": "https://autojobr.com/internships",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://autojobr.com/internships?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "numberOfJobs": totalInternshipsCount
  };

  // Promotional content
  const promoContent = [
    {
      icon: <GraduationCap className="w-5 h-5" />,
      title: "Summer 2026 Internships",
      description: "1,976+ opportunities from Apple, Google, Netflix & more",
      cta: "Explore Now",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Smart Application Tracking",
      description: "Never lose track of your applications again",
      cta: "Get Started",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Trending Companies",
      description: "Apply to top-tier tech companies hiring now",
      cta: "View All",
      color: "from-orange-500 to-red-600"
    }
  ];

  // Rotate promotional content
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promoContent.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPreferences]);

  // Set first internship as selected by default
  useEffect(() => {
    if (internships.length > 0 && !selectedInternship) {
      setSelectedInternship(internships[0]);
    }
  }, [internships, selectedInternship]);

  // Loading state
  if (internshipsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading internships...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <SEOHead
        title={`${totalInternshipsCount}+ Internships Available - Find Your Perfect Opportunity | AutoJobR`}
        description={`Discover ${totalInternshipsCount}+ internship opportunities from Apple, Google, Netflix, OpenAI, NVIDIA and other top tech companies. Smart application tracking, one-click applications, and comprehensive internship database.`}
        keywords="internships, summer internships, tech internships, software engineering internships, student opportunities, career development, Apple, Google, Netflix, OpenAI, NVIDIA"
        canonicalUrl="https://autojobr.com/internships"
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
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
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
                    <span className="ml-2 text-purple-100">{promoContent[currentPromo].description}</span>
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
      
      {/* Header */}
      <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent leading-tight">
                {isAuthenticated ? 'Your Internship Opportunities' : 'Discover Amazing Internships'}
              </h1>
              <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 mt-2">
                {isAuthenticated 
                  ? `Track and apply to the best internship opportunities`
                  : `${totalInternshipsCount}+ internships from Apple, Google, Netflix, OpenAI, NVIDIA & more`}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {totalInternshipsCount} results
                </p>
                {!isAuthenticated && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      Sign in to save and track applications
                    </span>
                  </div>
                )}
              </div>
            </div>
          
            {/* Search and Controls */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <Input
                    placeholder="Search internships..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 touch-manipulation"
                    data-testid="input-search"
                  />
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <Select
                    value={filterPreferences.category}
                    onValueChange={(value) => setFilterPreferences(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="h-10 text-sm" data-testid="select-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="software-engineering">Software Engineering</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="product-management">Product Management</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterPreferences.season}
                    onValueChange={(value) => setFilterPreferences(prev => ({ ...prev, season: value }))}
                  >
                    <SelectTrigger className="h-10 text-sm" data-testid="select-season">
                      <SelectValue placeholder="Season" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Seasons</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                      <SelectItem value="spring">Spring</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Location"
                    value={filterPreferences.location}
                    onChange={(e) => setFilterPreferences(prev => ({ ...prev, location: e.target.value }))}
                    className="h-10 text-sm"
                    data-testid="input-location"
                  />

                  <Input
                    placeholder="Company"
                    value={filterPreferences.company}
                    onChange={(e) => setFilterPreferences(prev => ({ ...prev, company: e.target.value }))}
                    className="h-10 text-sm"
                    data-testid="input-company"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Internships List */}
        <div className="w-full lg:w-1/2 xl:w-2/5 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Internships
              </h2>
              <Badge variant="secondary" className="text-sm">
                {totalInternshipsCount} total
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {internships.map((internship: Internship) => (
              <motion.div
                key={internship.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedInternship?.id === internship.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                }`}
                onClick={() => handleInternshipClick(internship)}
                data-testid={`card-internship-${internship.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {internship.role}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {internship.company}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveInternship(internship.id);
                    }}
                    className={`ml-2 ${savedInternships.has(internship.id) ? 'text-yellow-500' : 'text-gray-400'}`}
                    data-testid={`button-save-${internship.id}`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedInternships.has(internship.id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{internship.location}</span>
                  </div>
                  {internship.season && (
                    <Badge variant="outline" className="text-xs">
                      {internship.season}
                    </Badge>
                  )}
                </div>

                {internship.requirements && internship.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {internship.requirements.slice(0, 3).map((req, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                    {internship.requirements.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{internship.requirements.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {internship.viewsCount && (
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{internship.viewsCount}</span>
                      </div>
                    )}
                    {internship.datePosted && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(internship.datePosted).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {appliedInternshipIds.includes(internship.id) && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Applied
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Internship Details */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-white dark:bg-gray-800 overflow-y-auto">
          {selectedInternship ? (
            <div className="w-full p-6">
              <div className="max-w-3xl">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedInternship.role}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        <span className="text-lg font-medium">{selectedInternship.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span>{selectedInternship.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {selectedInternship.category && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</h3>
                      <p className="text-gray-900 dark:text-white">{selectedInternship.category}</p>
                    </div>
                  )}
                  {selectedInternship.season && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Season</h3>
                      <p className="text-gray-900 dark:text-white capitalize">{selectedInternship.season}</p>
                    </div>
                  )}
                  {selectedInternship.sponsorship && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Sponsorship</h3>
                      <p className="text-gray-900 dark:text-white">{selectedInternship.sponsorship}</p>
                    </div>
                  )}
                  {selectedInternship.datePosted && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date Posted</h3>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedInternship.datePosted).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedInternship.requirements && selectedInternship.requirements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedInternship.requirements.map((req: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApply(selectedInternship)}
                    className="flex-1 sm:flex-none"
                    disabled={appliedInternshipIds.includes(selectedInternship.id)}
                    data-testid={`button-apply-${selectedInternship.id}`}
                  >
                    {appliedInternshipIds.includes(selectedInternship.id) ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Applied
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Apply Now
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleSaveInternship(selectedInternship.id)}
                    className={savedInternships.has(selectedInternship.id) ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : ''}
                    data-testid={`button-save-detail-${selectedInternship.id}`}
                  >
                    <Bookmark className={`w-4 h-4 mr-2 ${savedInternships.has(selectedInternship.id) ? 'fill-current' : ''}`} />
                    {savedInternships.has(selectedInternship.id) ? 'Saved' : 'Save'}
                  </Button>
                </div>

                {selectedInternship.simplifyUrl && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedInternship.simplifyUrl, '_blank')}
                      className="w-full sm:w-auto"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Apply via Simplify
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Select an internship to view details</p>
                <p className="text-sm">Click on any internship from the list to see more information</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}