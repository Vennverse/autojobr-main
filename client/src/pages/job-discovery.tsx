import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Heart, 
  ExternalLink, 
  MapPin, 
  Clock, 
  DollarSign, 
  Building2,
  Search,
  Filter,
  Bookmark,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

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

export default function JobDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    workMode: "all", 
    experienceLevel: "all"
  });

  // Fetch platform jobs (with Easy Apply)
  const { data: platformJobs = [], isLoading: platformJobsLoading } = useQuery({
    queryKey: ["/api/jobs/postings"],
  });

  // Fetch scraped jobs (with external Apply)
  const { data: scrapedJobs = [], isLoading: scrapedJobsLoading, error: scrapedJobsError } = useQuery({
    queryKey: ["/api/scraped-jobs?limit=2000"],
  });

  // Debug logging
  console.log('Platform jobs:', platformJobs.length);
  console.log('Scraped jobs:', scrapedJobs.length);
  console.log('Scraped jobs error:', scrapedJobsError);

  // Combine and process all jobs
  const allJobs = [
    ...(Array.isArray(platformJobs) ? platformJobs : []).map((job: any) => ({
      ...job,
      company: job.company_name || job.company,
      jobType: 'platform',
      applyType: 'easy'
    })),
    ...(Array.isArray(scrapedJobs) ? scrapedJobs : []).map((job: any) => ({
      ...job,
      company: job.company,
      jobType: job.jobType || job.job_type || 'full_time',
      source: 'scraped',
      applyType: 'external'
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
    if (filters.category && filters.category !== 'all') {
      return job.category === filters.category;
    }
    if (filters.workMode && filters.workMode !== 'all') {
      return job.workMode === filters.workMode || job.work_mode === filters.workMode;
    }
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      return job.experienceLevel === filters.experienceLevel || job.experience_level === filters.experienceLevel;
    }
    return true;
  });

  const isLoading = platformJobsLoading || scrapedJobsLoading;

  const handleSaveJob = async (jobId: number, type: 'scraped' | 'posting') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      if (response.ok) {
        // Show success feedback
        console.log('Job saved successfully');
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Discover Your Dream Job
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              Browse platform jobs with Easy Apply and external opportunities from top job boards
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs, companies, or skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.workMode} onValueChange={(value) => setFilters({...filters, workMode: value})}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Work Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Jobs Results Summary */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-gray-600 dark:text-gray-300">
              {isLoading ? 'Loading jobs...' : `Found ${allJobs.length} jobs (${Array.isArray(platformJobs) ? platformJobs.length : 0} platform jobs + ${Array.isArray(scrapedJobs) ? scrapedJobs.length : 0} external jobs)`}
            </p>
          </motion.div>

          {/* Unified Jobs List */}
          <motion.div variants={containerVariants} className="grid gap-4">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : allJobs.length > 0 ? (
              allJobs.map((job: any) => (
                <motion.div key={`${job.jobType}-${job.id}`} variants={itemVariants}>
                  <JobCard job={job} onSave={() => handleSaveJob(job.id, job.jobType)} />
                </motion.div>
              ))
            ) : (
              <motion.div variants={itemVariants} className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs found</h3>
                <p className="text-gray-600 dark:text-gray-300">Try adjusting your search criteria or filters</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({ job, onSave }: { job: any; onSave: () => void }) {
  const handleApply = () => {
    if (job.applyType === 'easy') {
      // For platform jobs, redirect to application page
      window.location.href = `/jobs/${job.id}/apply`;
    } else {
      // For scraped jobs, open external URL
      window.open(job.sourceUrl, '_blank');
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {job.title}
              </h3>
              {job.jobType === 'platform' ? (
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  Platform
                </Badge>
              ) : (
                <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs">
                  {job.site || 'External'}
                </Badge>
              )}
            </div>
            <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
              {job.company}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="flex items-center gap-1"
              data-testid="button-save"
            >
              <Bookmark className="h-4 w-4" />
              Save
            </Button>
            <Button
              variant={job.applyType === 'easy' ? 'default' : 'outline'}
              size="sm"
              onClick={handleApply}
              className="flex items-center gap-1"
              data-testid="button-apply"
            >
              {job.applyType === 'easy' ? (
                <>
                  <Heart className="h-4 w-4" />
                  Easy Apply
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Apply
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
          )}
          {job.workMode && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatWorkMode(job.workMode)}
            </span>
          )}
          {job.salaryRange && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {job.salaryRange}
            </span>
          )}
        </div>

        {job.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
            {job.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {job.skills?.slice(0, 5).map((skill: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {job.tags?.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <span className="text-xs text-gray-500">
            From {job.sourcePlatform}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}