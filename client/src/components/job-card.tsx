import { useState, useEffect, useMemo, memo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Bookmark, 
  ExternalLink, 
  Clock,
  Loader2,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobCardProps {
  job: {
    id: number;
    jobTitle: string;
    company: string;
    location?: string;
    jobUrl?: string;
    salary?: string;
    jobType?: string;
    workMode?: string;
    matchScore?: number;
    matchingSkills?: string[];
    missingSkills?: string[];
    jobDescription?: string;
    isBookmarked?: boolean;
    isApplied?: boolean;
  };
}

// Utility function to format job types professionally
const formatJobType = (jobType?: string): string => {
  if (!jobType) return '';
  
  const typeMap: Record<string, string> = {
    'platform': 'Full-time',
    'scraped': 'Full-time',
    'full_time': 'Full-time',
    'part_time': 'Part-time', 
    'contract': 'Contract',
    'freelance': 'Freelance',
    'temporary': 'Temporary',
    'internship': 'Internship'
  };
  
  return typeMap[jobType.toLowerCase()] || 'Full-time';
};

// Utility function to format work modes professionally
const formatWorkMode = (workMode?: string): string => {
  if (!workMode) return '';
  
  const modeMap: Record<string, string> = {
    'onsite': 'On-site',
    'remote': 'Remote', 
    'hybrid': 'Hybrid',
    'field': 'Field-based'
  };
  
  return modeMap[workMode.toLowerCase()] || workMode;
};

// Utility function to get match score styling
const getMatchScoreVariant = (score?: number) => {
  if (!score) return { color: "bg-gray-100 text-gray-600", text: "No Match", icon: null };
  if (score >= 90) return { color: "bg-emerald-100 text-emerald-700", text: `${score}% Match`, icon: "excellent" };
  if (score >= 75) return { color: "bg-blue-100 text-blue-700", text: `${score}% Match`, icon: "good" };
  if (score >= 60) return { color: "bg-amber-100 text-amber-700", text: `${score}% Match`, icon: "fair" };
  return { color: "bg-red-100 text-red-700", text: `${score}% Match`, icon: "poor" };
};

// Validate URL utility
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const JobCard = memo(({ job }: JobCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(job.isBookmarked || false);

  // Sync with prop changes
  useEffect(() => {
    setIsBookmarked(job.isBookmarked || false);
  }, [job.isBookmarked]);

  // Memoized values
  const matchScoreVariant = useMemo(() => getMatchScoreVariant(job.matchScore), [job.matchScore]);
  const formattedJobType = useMemo(() => formatJobType(job.jobType), [job.jobType]);
  const formattedWorkMode = useMemo(() => formatWorkMode(job.workMode), [job.workMode]);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/recommendations/${job.id}/bookmark`);
    },
    onMutate: async () => {
      // Optimistic update
      const previousValue = isBookmarked;
      setIsBookmarked(!isBookmarked);
      return { previousValue };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: isBookmarked ? "Bookmark removed" : "Job bookmarked",
        description: isBookmarked 
          ? "Removed from your saved jobs" 
          : "Added to your saved jobs",
      });
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousValue !== undefined) {
        setIsBookmarked(context.previousValue);
      }
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBookmark = () => {
    bookmarkMutation.mutate();
  };

  const handleApply = () => {
    if (!job.jobUrl) {
      toast({
        title: "Error",
        description: "Job application link is not available",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(job.jobUrl)) {
      toast({
        title: "Error",
        description: "Invalid job application link",
        variant: "destructive",
      });
      return;
    }

    // Track analytics (if you have analytics)
    // analytics.track('job_apply_clicked', { jobId: job.id, company: job.company });
    
    window.open(job.jobUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Building className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate cursor-help">
                      {job.company}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{job.company}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {job.location && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center cursor-help">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{job.location}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          {/* Match Score Badge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "text-xs sm:text-sm font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap ml-2 flex items-center gap-1 cursor-help transition-all",
                  matchScoreVariant.color
                )}>
                  {matchScoreVariant.icon === "excellent" && <TrendingUp className="w-3 h-3" />}
                  {matchScoreVariant.icon === "poor" && <AlertCircle className="w-3 h-3" />}
                  {matchScoreVariant.text}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {job.matchScore 
                    ? `Your profile matches ${job.matchScore}% with this job`
                    : "Match score not available"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Job Title */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2 line-clamp-2 cursor-help leading-snug">
                {job.jobTitle}
              </h4>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{job.jobTitle}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Job Description */}
        {job.jobDescription && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 cursor-help leading-relaxed">
                  {job.jobDescription}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p className="whitespace-pre-wrap">{job.jobDescription}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Job Details */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
          {formattedJobType && (
            <span className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-md">
              <Briefcase className="w-3.5 h-3.5" />
              {formattedJobType}
            </span>
          )}
          {formattedWorkMode && (
            <span className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-md">
              <MapPin className="w-3.5 h-3.5" />
              {formattedWorkMode}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-md font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              {job.salary}
            </span>
          )}
        </div>
        
        {/* Skills Section */}
        {(job.matchingSkills?.length || job.missingSkills?.length) ? (
          <div className="space-y-2 mb-4">
            {job.matchingSkills && job.matchingSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.matchingSkills.slice(0, 4).map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
                {job.matchingSkills.length > 4 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-emerald-100 text-emerald-700 cursor-help"
                        >
                          +{job.matchingSkills.length - 4} more
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Matching Skills:</p>
                        <p>{job.matchingSkills.slice(4).join(", ")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            {job.missingSkills && job.missingSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.missingSkills.slice(0, 3).map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs text-amber-700 border-amber-300 bg-amber-50"
                  >
                    {skill}
                  </Badge>
                ))}
                {job.missingSkills.length > 3 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className="text-xs text-amber-700 border-amber-300 bg-amber-50 cursor-help"
                        >
                          +{job.missingSkills.length - 3} missing
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Missing Skills:</p>
                        <p>{job.missingSkills.slice(3).join(", ")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
        ) : null}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 text-sm sm:text-base group/btn" 
            onClick={handleApply}
            disabled={job.isApplied || !job.jobUrl}
            size="sm"
            aria-label={job.isApplied 
              ? `Already applied to ${job.jobTitle}` 
              : `Apply for ${job.jobTitle} at ${job.company}`
            }
          >
            {job.isApplied ? (
              <>
                <Clock className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Applied</span>
                <span className="sm:hidden">Applied</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-1.5 sm:mr-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                <span className="hidden sm:inline">Apply Now</span>
                <span className="sm:hidden">Apply</span>
              </>
            )}
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={bookmarkMutation.isPending}
                  className={cn(
                    "transition-all",
                    isBookmarked && "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                  )}
                  aria-label={isBookmarked 
                    ? `Remove ${job.jobTitle} from bookmarks` 
                    : `Bookmark ${job.jobTitle}`
                  }
                  aria-pressed={isBookmarked}
                >
                  {bookmarkMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bookmark 
                      className={cn(
                        "w-4 h-4 transition-transform hover:scale-110", 
                        isBookmarked && "fill-current"
                      )} 
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBookmarked ? "Remove bookmark" : "Save for later"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
});

JobCard.displayName = "JobCard";