import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  TrendingUp,
  Globe,
  Home,
  Laptop,
  Code,
  Palette,
  BarChart3,
  Brain,
  Shield,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle,
  Award
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
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [savedInternships, setSavedInternships] = useState<Set<number>>(new Set());
  const [selectedInternship, setSelectedInternship] = useState<any>(null);
  const [showPromoAlert, setShowPromoAlert] = useState(true);
  const [currentPromo, setCurrentPromo] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const internshipsPerPage = 25;
  const [sortBy, setSortBy] = useState("relevance");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Advanced filters state
  const [filterPreferences, setFilterPreferences] = useState({
    company: "",
    location: "",
    category: [] as string[],
    season: [] as string[],
    requirements: "",
    workMode: [] as string[],
    sponsorship: [] as string[],
    datePosted: undefined as number | undefined,
    remoteOnly: false
  });

  // Debounced search update
  const debouncedUpdateSearch = useCallback((query: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      setSearchQuery(query);
      setCurrentPage(1);
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    debouncedUpdateSearch(value);
  }, [debouncedUpdateSearch]);

  // Fetch internships
  const { data: internshipsData, isLoading: internshipsLoading } = useQuery({
    queryKey: ["/api/internships", currentPage, searchQuery, filterPreferences, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', internshipsPerPage.toString());
      
      if (searchQuery) params.append('search', searchQuery);
      
      // Handle array filters
      if (filterPreferences.category.length > 0) {
        filterPreferences.category.forEach(cat => params.append('category', cat));
      }
      if (filterPreferences.season.length > 0) {
        filterPreferences.season.forEach(s => params.append('season', s));
      }
      if (filterPreferences.workMode.length > 0) {
        filterPreferences.workMode.forEach(mode => params.append('workMode', mode));
      }
      if (filterPreferences.sponsorship.length > 0) {
        filterPreferences.sponsorship.forEach(sp => params.append('sponsorship', sp));
      }
      
      // Handle other filters
      if (filterPreferences.company) params.append('company', filterPreferences.company);
      if (filterPreferences.location) params.append('location', filterPreferences.location);
      if (filterPreferences.requirements) params.append('requirements', filterPreferences.requirements);
      if (filterPreferences.remoteOnly) params.append('remoteOnly', 'true');
      if (filterPreferences.datePosted) params.append('datePosted', filterPreferences.datePosted.toString());
      
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/internships?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch internships');
      return response.json();
    }
  });

  const internships = internshipsData?.internships || [];
  const pagination = internshipsData?.pagination || {};

  // Calculate compatibility score for personalization
  const calculateCompatibility = useCallback((internship: any) => {
    if (!isAuthenticated || !user) return 50;

    let score = 50;

    // Check if user has saved similar internships
    if (savedInternships.has(internship.id)) score += 15;

    // Match by category
    if (internship.category?.toLowerCase().includes('tech')) score += 10;

    // Remote preference
    if (internship.location?.toLowerCase().includes('remote')) score += 10;

    // Recent posting bonus
    const daysOld = internship.datePosted 
      ? Math.floor((Date.now() - new Date(internship.datePosted).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    if (daysOld < 7) score += 10;
    else if (daysOld < 14) score += 5;

    // Add pseudo-random variation
    const pseudoRandom = (internship.id % 21) - 10;
    score += pseudoRandom;

    return Math.min(100, Math.max(45, score));
  }, [isAuthenticated, user, savedInternships]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (filterPreferences.company) count++;
    if (filterPreferences.location) count++;
    if (filterPreferences.category.length > 0) count++;
    if (filterPreferences.season.length > 0) count++;
    if (filterPreferences.workMode.length > 0) count++;
    if (filterPreferences.sponsorship.length > 0) count++;
    if (filterPreferences.requirements) count++;
    if (filterPreferences.remoteOnly) count++;
    if (filterPreferences.datePosted) count++;
    return count;
  }, [searchQuery, filterPreferences]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setFilterPreferences({
      company: "",
      location: "",
      category: [],
      season: [],
      requirements: "",
      workMode: [],
      sponsorship: [],
      datePosted: undefined,
      remoteOnly: false
    });
    setCurrentPage(1);
  }, []);

  // Update filter
  const updateFilter = useCallback((key: keyof typeof filterPreferences, value: any) => {
    setFilterPreferences(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

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
          <Input
            placeholder="City or location"
            value={filterPreferences.location}
            onChange={(e) => updateFilter('location', e.target.value)}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote-only"
              checked={filterPreferences.remoteOnly}
              onCheckedChange={(checked) => updateFilter('remoteOnly', checked)}
            />
            <Label htmlFor="remote-only" className="text-sm">Remote Only</Label>
          </div>
        </div>

        {/* Category Filters */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            Category
          </h3>
          <div className="space-y-2">
            {[
              { value: 'software-engineering', label: 'Software Engineering', icon: Code },
              { value: 'data-science', label: 'Data Science', icon: BarChart3 },
              { value: 'product-management', label: 'Product Management', icon: Target },
              { value: 'design', label: 'Design', icon: Palette },
              { value: 'marketing', label: 'Marketing', icon: TrendingUp },
              { value: 'finance', label: 'Finance', icon: Building2 }
            ].map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={filterPreferences.category.includes(category.value)}
                    onCheckedChange={(checked) => {
                      const updated = checked 
                        ? [...filterPreferences.category, category.value]
                        : filterPreferences.category.filter(c => c !== category.value);
                      updateFilter('category', updated);
                    }}
                  />
                  <Label htmlFor={`category-${category.value}`} className="text-sm flex items-center cursor-pointer">
                    <Icon className="w-3 h-3 mr-1" />
                    {category.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Season Filters */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Season
          </h3>
          <div className="space-y-2">
            {['Summer 2025', 'Fall 2025', 'Winter 2026', 'Spring 2026'].map((season) => (
              <div key={season} className="flex items-center space-x-2">
                <Checkbox
                  id={`season-${season}`}
                  checked={filterPreferences.season.includes(season)}
                  onCheckedChange={(checked) => {
                    const updated = checked 
                      ? [...filterPreferences.season, season]
                      : filterPreferences.season.filter(s => s !== season);
                    updateFilter('season', updated);
                  }}
                />
                <Label htmlFor={`season-${season}`} className="text-sm cursor-pointer">
                  {season}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Work Mode */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Laptop className="w-4 h-4 mr-2" />
            Work Mode
          </h3>
          <div className="space-y-2">
            {[
              { value: 'remote', label: 'Remote', icon: Globe },
              { value: 'hybrid', label: 'Hybrid', icon: Home },
              { value: 'onsite', label: 'On-site', icon: Building2 }
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <div key={mode.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`work-mode-${mode.value}`}
                    checked={filterPreferences.workMode.includes(mode.value)}
                    onCheckedChange={(checked) => {
                      const updated = checked 
                        ? [...filterPreferences.workMode, mode.value]
                        : filterPreferences.workMode.filter(m => m !== mode.value);
                      updateFilter('workMode', updated);
                    }}
                  />
                  <Label htmlFor={`work-mode-${mode.value}`} className="text-sm flex items-center cursor-pointer">
                    <Icon className="w-3 h-3 mr-1" />
                    {mode.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sponsorship */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Sponsorship
          </h3>
          <div className="space-y-2">
            {['U.S. Citizen', 'Visa Sponsor', 'No Restrictions'].map((sp) => (
              <div key={sp} className="flex items-center space-x-2">
                <Checkbox
                  id={`sponsorship-${sp}`}
                  checked={filterPreferences.sponsorship.includes(sp)}
                  onCheckedChange={(checked) => {
                    const updated = checked 
                      ? [...filterPreferences.sponsorship, sp]
                      : filterPreferences.sponsorship.filter(s => s !== sp);
                    updateFilter('sponsorship', updated);
                  }}
                />
                <Label htmlFor={`sponsorship-${sp}`} className="text-sm cursor-pointer">
                  {sp}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Posted */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Date Posted
          </h3>
          <RadioGroup
            value={filterPreferences.datePosted?.toString() || ''}
            onValueChange={(value) => updateFilter('datePosted', value ? parseInt(value) : undefined)}
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
            value={filterPreferences.company}
            onChange={(e) => updateFilter('company', e.target.value)}
          />
        </div>
      </div>
    );
  };

  // Valid schema.org structured data for better SEO rankings
  const totalInternshipsCount = pagination.total || 0;
  const enhancedStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "AutoJobR",
      "url": "https://autojobr.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://autojobr.com/internships?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Summer 2025 Tech Internships - AutoJobR",
      "description": "Find paid summer 2025 internships at Apple, Google, Netflix, OpenAI, NVIDIA, Meta, Amazon, Microsoft & top tech companies. Software engineering, data science, AI/ML, product management internships.",
      "url": "https://autojobr.com/internships",
      "keywords": "summer internships 2025, tech internships, software engineering internships, computer science internships, paid internships, google internships, apple internships, FAANG internships, remote internships, engineering internships, student opportunities",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Technology Internships",
        "description": "Comprehensive list of internship opportunities at top technology companies",
        "numberOfItems": totalInternshipsCount,
        "itemListElement": [
          {
            "@type": "JobPosting",
            "title": "Summer 2025 Software Engineering Internships",
            "description": "Paid software engineering internships at top tech companies including Apple, Google, Netflix, OpenAI, NVIDIA, Meta, Amazon",
            "datePosted": new Date().toISOString().split('T')[0],
            "validThrough": "2025-12-31",
            "employmentType": "INTERN",
            "jobLocation": {
              "@type": "Place",
              "address": "Multiple locations including Silicon Valley, Seattle, Austin, New York, Remote"
            },
            "hiringOrganization": {
              "@type": "Organization",
              "name": "Multiple Top Tech Companies",
              "url": "https://autojobr.com/internships"
            },
            "workHours": "Full-time",
            "baseSalary": {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": {
                "@type": "QuantitativeValue",
                "minValue": 5000,
                "maxValue": 10000,
                "unitText": "MONTH"
              }
            }
          }
        ]
      },
      "audience": {
        "@type": "EducationalAudience",
        "audienceType": "College Students, Graduate Students, Recent Graduates",
        "educationalRole": "student"
      },
      "provider": {
        "@type": "Organization",
        "name": "AutoJobR",
        "url": "https://autojobr.com",
        "logo": "https://autojobr.com/logo.png",
        "sameAs": [
          "https://linkedin.com/company/autojobr",
          "https://twitter.com/autojobr"
        ]
      }
    }
  ];

  // Promotional content
  const promoContent = [
    {
      icon: <GraduationCap className="w-5 h-5" />,
      title: "Summer 2025 Tech Internships",
      description: "2,500+ paid opportunities at FAANG & top startups",
      cta: "Apply Now",
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
        title={`${totalInternshipsCount}+ Summer 2025 Tech Internships - Apply to Apple, Google, NVIDIA | AutoJobR`}
        description={`Find ${totalInternshipsCount}+ paid summer 2025 internships at Apple, Google, Netflix, OpenAI, NVIDIA, Meta, Amazon, Microsoft & top tech companies. Software engineering, data science, AI/ML, product management internships. One-click applications.`}
        keywords="summer internships 2025, tech internships, software engineering internships, computer science internships, paid internships, google internships, apple internships, netflix internships, remote internships, engineering internships, college internships, student internships, data science internships, product management internships, design internships, startup internships, FAANG internships, silicon valley internships, internships for students, programming internships, AI internships, machine learning internships, cybersecurity internships, fintech internships, biotech internships, consulting internships, marketing internships, microsoft internships, amazon internships, meta internships, tesla internships, nvidia internships, openai internships"
        canonicalUrl="https://autojobr.com/internships"
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
                {isAuthenticated ? 'Your Summer 2025 Tech Internships' : 'Summer 2025 Tech Internships - Apply Now'}
              </h1>
              <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 mt-2">
                {isAuthenticated 
                  ? `Track and apply to ${totalInternshipsCount}+ paid internships at top tech companies`
                  : `${totalInternshipsCount}+ paid internships at Apple, Google, Netflix, OpenAI, NVIDIA, Meta, Amazon, Microsoft & top tech companies`}
              </p>
              <div className="hidden sm:block mt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  <strong>Popular searches:</strong> Software Engineering Internships • Data Science Internships • Product Management Internships • Remote Internships • FAANG Internships • AI/ML Internships • Cybersecurity Internships • Design Internships
                </p>
              </div>
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <Input
                      placeholder="Search internships by title, company, or skills..."
                      value={searchInput}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 touch-manipulation"
                      data-testid="input-search"
                    />
                  </div>
                  
                  {/* Mobile Filter Button */}
                  <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden relative h-10 sm:h-12">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0">
                      <SheetHeader className="p-4 border-b">
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-80px)]">
                        <div className="p-4">
                          <AdvancedFilterPanel />
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Sort and View Options */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="match">Best Match</SelectItem>
                        <SelectItem value="date">Latest</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Active Filter Tags */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <span>"{searchQuery}"</span>
                        <button onClick={() => { setSearchInput(''); setSearchQuery(''); }}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {filterPreferences.category.map(cat => (
                      <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                        <span>{cat}</span>
                        <button onClick={() => updateFilter('category', filterPreferences.category.filter(c => c !== cat))}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {filterPreferences.season.map(s => (
                      <Badge key={s} variant="secondary" className="flex items-center gap-1">
                        <span>{s}</span>
                        <button onClick={() => updateFilter('season', filterPreferences.season.filter(se => se !== s))}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {filterPreferences.remoteOnly && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <span>Remote Only</span>
                        <button onClick={() => updateFilter('remoteOnly', false)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="w-full mt-2"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear All Filters
              </Button>
            )}
          </div>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4">
              <AdvancedFilterPanel />
            </div>
          </ScrollArea>
        </div>

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
            {internships.map((internship: Internship) => {
              const compatibility = calculateCompatibility(internship);
              return (
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
                  <div className="flex items-center gap-2 ml-2">
                    {isAuthenticated && (
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
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveInternship(internship.id);
                      }}
                      className={`${savedInternships.has(internship.id) ? 'text-yellow-500' : 'text-gray-400'}`}
                      data-testid={`button-save-${internship.id}`}
                    >
                      <Bookmark className={`w-4 h-4 ${savedInternships.has(internship.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
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
            )}
            )}
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
                      External Application
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