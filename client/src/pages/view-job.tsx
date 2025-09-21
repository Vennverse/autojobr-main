import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building, MapPin, DollarSign, Users, Clock, Briefcase, Eye, Calendar, Share2, Copy, ExternalLink, CheckCircle, Star, TrendingUp, Zap, Target, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";

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

// Schema.org employment type mapping
const mapEmploymentType = (jobType?: string): string => {
  if (!jobType) return 'FULL_TIME';
  
  const employmentTypeMap: { [key: string]: string } = {
    'platform': 'FULL_TIME',
    'scraped': 'FULL_TIME',
    'full_time': 'FULL_TIME',
    'part_time': 'PART_TIME',
    'contract': 'CONTRACTOR',
    'freelance': 'CONTRACTOR',
    'temporary': 'TEMPORARY',
    'internship': 'INTERN'
  };
  
  return employmentTypeMap[jobType.toLowerCase()] || 'FULL_TIME';
};

// Parse location string into address components
const parseLocation = (location?: string) => {
  if (!location) return {
    addressLocality: '',
    addressRegion: '',
    addressCountry: 'US'
  };

  // Common location patterns:
  // "New York, NY, United States" -> city, region, country
  // "London, United Kingdom" -> city, country  
  // "San Francisco, CA" -> city, region
  // "Remote" -> handle as remote
  
  if (location.toLowerCase().includes('remote')) {
    return {
      addressLocality: 'Remote',
      addressRegion: '',
      addressCountry: 'US'
    };
  }

  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    // Format: City, State, Country
    return {
      addressLocality: parts[0],
      addressRegion: parts[1],
      addressCountry: getCountryCode(parts[2])
    };
  } else if (parts.length === 2) {
    // Could be City, State or City, Country
    const secondPart = parts[1].toLowerCase();
    const usStates = ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy'];
    
    if (usStates.includes(secondPart) || parts[1].length === 2) {
      // Likely US state
      return {
        addressLocality: parts[0],
        addressRegion: parts[1],
        addressCountry: 'US'
      };
    } else {
      // Likely City, Country
      return {
        addressLocality: parts[0],
        addressRegion: '',
        addressCountry: getCountryCode(parts[1])
      };
    }
  } else {
    // Single part - assume it's a city
    return {
      addressLocality: parts[0],
      addressRegion: '',
      addressCountry: 'US'
    };
  }
};

// Convert country name to ISO country code
const getCountryCode = (country: string): string => {
  const countryMap: { [key: string]: string } = {
    'united states': 'US',
    'usa': 'US',
    'us': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'canada': 'CA',
    'australia': 'AU',
    'germany': 'DE',
    'france': 'FR',
    'india': 'IN',
    'singapore': 'SG',
    'netherlands': 'NL',
    'ireland': 'IE',
    'spain': 'ES',
    'italy': 'IT',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'belgium': 'BE',
    'switzerland': 'CH',
    'austria': 'AT',
    'poland': 'PL',
    'czech republic': 'CZ',
    'portugal': 'PT'
  };
  
  return countryMap[country.toLowerCase()] || 'US';
};

// Calculate validThrough date (30 days from posted date)
const calculateValidThrough = (createdAt?: string | Date): string => {
  const postedDate = createdAt ? new Date(createdAt) : new Date();
  const validThrough = new Date(postedDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
  return validThrough.toISOString();
};

// Generate JobPosting structured data
const generateJobPostingStructuredData = (job: any, jobId: string) => {
  if (!job) return null;

  const address = parseLocation(job.location);
  const employmentType = mapEmploymentType(job.jobType);
  const validThrough = calculateValidThrough(job.createdAt);
  const currentUrl = `${window.location.origin}/jobs/${jobId}`;

  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description || "Join our team in this exciting opportunity.",
    "datePosted": job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
    "validThrough": validThrough,
    "employmentType": employmentType,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.companyName || "AutoJobr",
      "logo": "https://autojobr.com/logo.png",
      "sameAs": job.companyWebsite || "https://autojobr.com"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": address.addressLocality,
        "addressRegion": address.addressRegion,
        "addressCountry": address.addressCountry
      }
    },
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": address.addressCountry === 'US' ? 'United States' : address.addressCountry
    },
    "url": currentUrl,
    ...(job.minSalary || job.maxSalary ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": job.currency || "USD",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.minSalary,
          "maxValue": job.maxSalary,
          "unitText": "YEAR"
        }
      }
    } : {}),
    ...(job.requirements ? {
      "qualifications": job.requirements
    } : {}),
    ...(job.responsibilities ? {
      "responsibilities": job.responsibilities
    } : {})
  };
};

export default function ViewJob() {
  const params = useParams();
  const jobId = params.id;
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Share functionality
  const shareJob = async (platform?: string) => {
    const jobUrl = `${window.location.origin}/jobs/${jobId}`;
    const shareText = `Check out this ${job?.title} position at ${job?.companyName}!`;
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(jobUrl);
        toast({
          title: "Link Copied!",
          description: "Job link has been copied to your clipboard.",
        });
      } catch (error) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = jobUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "Link Copied!",
          description: "Job link has been copied to your clipboard.",
        });
      }
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(jobUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`, '_blank');
    } else if (navigator.share) {
      // Native share API for mobile devices
      try {
        await navigator.share({
          title: `${job?.title} - ${job?.companyName}`,
          text: shareText,
          url: jobUrl,
        });
      } catch (error) {
        console.log('Share canceled');
      }
    } else {
      shareJob('copy');
    }
  };

  // Determine if this is a scraped job (heuristic: scraped jobs have larger IDs)
  const isScrapedJob = jobId && (parseInt(jobId) > 100000);
  
  // Fetch platform job details
  const { data: platformJob, isLoading: platformLoading, error: platformError } = useQuery({
    queryKey: [`/api/jobs/postings/${jobId}`],
    enabled: !!jobId && !isScrapedJob,
    queryFn: async () => {
      const response = await fetch(`/api/jobs/postings/${jobId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found');
        }
        throw new Error(`Failed to fetch job: ${response.status}`);
      }
      
      return response.json();
    }
  });
  
  // Fetch scraped jobs when needed
  const { data: scrapedJobs, isLoading: scrapedLoading } = useQuery({
    queryKey: ['/api/scraped-jobs?limit=2000'],
    enabled: Boolean(jobId && isScrapedJob),
    queryFn: async () => {
      const response = await fetch('/api/scraped-jobs?limit=2000', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch scraped jobs');
      }
      return response.json();
    }
  });
  
  // Find the scraped job by ID
  const scrapedJob = Array.isArray(scrapedJobs) ? 
    scrapedJobs.find((job: any) => job.id?.toString() === jobId) : null;
  
  // Use the appropriate job data
  const job = isScrapedJob ? scrapedJob : platformJob;
  const isLoading = isScrapedJob ? scrapedLoading : platformLoading;
  const error = isScrapedJob ? 
    (scrapedJob ? null : (scrapedJobs ? new Error('Scraped job not found') : null)) : 
    platformError;

  console.log('ViewJob - jobId:', jobId, 'job:', job, 'error:', error);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error.message === 'Job not found' ? 'Job Not Found' : 'Error Loading Job'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message === 'Job not found' 
              ? "The job posting you're looking for doesn't exist or may have been removed."
              : `Failed to load job details: ${error.message}`
            }
          </p>
          <Button onClick={() => setLocation(user?.currentRole === 'recruiter' ? '/recruiter-dashboard' : '/')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The job posting you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation(user?.currentRole === 'recruiter' ? '/recruiter-dashboard' : '/')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(user?.currentRole === 'recruiter' ? '/recruiter-dashboard' : '/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                  {job.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {job.companyName}
                </p>
              </div>
            </div>
            
            {/* Share Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareJob()}
                className="hidden sm:flex"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Job
              </Button>
              
              {/* Share Dropdown for Desktop */}
              <div className="relative hidden md:block group">
                <Button variant="ghost" size="sm" className="p-2">
                  <Share2 className="w-4 h-4" />
                </Button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareJob('copy')}
                      className="w-full justify-start text-left"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareJob('linkedin')}
                      className="w-full justify-start text-left text-blue-600"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      LinkedIn
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareJob('twitter')}
                      className="w-full justify-start text-left text-blue-400"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareJob('facebook')}
                      className="w-full justify-start text-left text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Facebook
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="text-base mt-1">{job.companyName}</CardDescription>
                    </div>
                    <Badge variant={job.isActive ? "default" : "secondary"}>
                      {job.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                    )}
                    {job.workMode && (
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {formatWorkMode(job.workMode)}
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatJobType(job.jobType)}
                      </div>
                    )}
                    {(job.minSalary || job.maxSalary) && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.minSalary && job.maxSalary 
                          ? `${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()} ${job.currency || 'USD'}`
                          : job.minSalary 
                          ? `${job.minSalary.toLocaleString()}+ ${job.currency || 'USD'}`
                          : `Up to ${job.maxSalary?.toLocaleString()} ${job.currency || 'USD'}`
                        }
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {job.description}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              {job.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {job.requirements}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Responsibilities */}
              {job.responsibilities && (
                <Card>
                  <CardHeader>
                    <CardTitle>Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {job.responsibilities}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {job.benefits && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits & Perks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {job.benefits}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Posted</span>
                    </div>
                    <span className="font-semibold text-sm">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Location</span>
                    </div>
                    <span className="font-semibold text-sm">{job.location}</span>
                  </div>
                  {job.experienceLevel && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Experience</span>
                      </div>
                      <span className="font-semibold text-sm">{job.experienceLevel}</span>
                    </div>
                  )}
                  {job.workMode && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Work Mode</span>
                      </div>
                      <span className="font-semibold text-sm capitalize">{job.workMode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {!user ? (
                // Clean, professional application card for unauthenticated users
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Interested in this position?</CardTitle>
                      <CardDescription>
                        Create a free account to apply and get matched with relevant opportunities.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Quick application process</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Get personalized job recommendations</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Track all your applications in one place</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-11 font-medium bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={() => setLocation(`/auth?redirect=/jobs/${jobId}&action=apply`)}
                      >
                        Apply for this Position
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation(`/auth?redirect=/jobs/${jobId}`)}
                      >
                        Already have an account? Sign In
                      </Button>

                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Free to join • No spam • Secure platform
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Platform Features Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">About AutoJobr</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Smart Matching</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Find positions that match your skills and experience</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Application Tracking</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Keep track of all your job applications</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Career Tools</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Resume analysis and interview preparation</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Share This Job Card */}
                  <Card className="md:hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-blue-500" />
                        Share This Job
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareJob('copy')}
                        className="w-full justify-start"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareJob('linkedin')}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          LinkedIn
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareJob('twitter')}
                          className="text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Twitter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              
              ) : user?.currentRole === 'recruiter' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Job</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation(`/recruiter/edit-job/${job.id}`)}
                    >
                      Edit Job
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation('/recruiter-dashboard')}
                    >
                      View Applications
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Apply to this Job</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        // Handle scraped vs platform jobs differently
                        if (job.id) {
                          if (isScrapedJob) {
                            // For scraped jobs, open external URL
                            const externalUrl = job?.sourceUrl || job?.source_url;
                            if (externalUrl) {
                              window.open(externalUrl, '_blank');
                              toast({
                                title: "Redirected to External Site",
                                description: "Complete your application on the company's website."
                              });
                            } else {
                              toast({
                                title: "No Application URL",
                                description: "This job doesn't have a valid application URL.",
                                variant: "destructive"
                              });
                            }
                          } else {
                            // For platform jobs, use internal API
                            fetch(`/api/jobs/postings/${job.id}/apply`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                            })
                            .then(response => response.json())
                            .then(data => {
                              if (data.id) {
                                toast({
                                  title: "Application Submitted",
                                  description: "Your application has been submitted successfully!",
                                });
                              } else {
                                toast({
                                  title: "Application Failed",
                                  description: data.message || "Failed to submit application",
                                  variant: "destructive",
                                });
                              }
                            })
                            .catch(error => {
                              toast({
                                title: "Application Failed",
                                description: "An error occurred while submitting your application",
                                variant: "destructive",
                              });
                            });
                          }
                        }
                      }}
                    >
                      {isScrapedJob ? 'Apply on Company Site' : 'Apply Now'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation('/')}
                    >
                      Back to Dashboard
                    </Button>
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