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

  const { data: job, isLoading, error } = useQuery({
    queryKey: [`/api/jobs/postings/${jobId}`],
    enabled: !!jobId,
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
          <Button onClick={() => setLocation(user?.userType === 'recruiter' ? '/recruiter-dashboard' : '/')}>
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
          <Button onClick={() => setLocation(user?.userType === 'recruiter' ? '/recruiter-dashboard' : '/')}>
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
                onClick={() => setLocation(user?.userType === 'recruiter' ? '/recruiter-dashboard' : '/')}
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
                        {job.workMode}
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.jobType}
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
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Applications</span>
                    </div>
                    <span className="font-semibold">{job.applicationsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Views</span>
                    </div>
                    <span className="font-semibold">{job.viewsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Posted</span>
                    </div>
                    <span className="font-semibold text-sm">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
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
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {!user ? (
                // Unauthenticated user - enhanced call-to-action
                <>
                  <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <CardTitle className="text-green-800 dark:text-green-200">Apply Now - Limited Time!</CardTitle>
                      </div>
                      <CardDescription className="text-green-700 dark:text-green-300">
                        {job.applicationsCount > 50 ? 'High competition - Act fast!' : 
                         job.applicationsCount > 20 ? 'Popular position - Apply soon!' : 
                         'Early applicants have the best chance!'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Application Status</span>
                          <span className="text-xs text-gray-500">{job.applicationsCount || 0} applied</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{width: `${Math.min((job.applicationsCount || 0) * 2, 100)}%`}}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Join {job.applicationsCount || 0} other candidates competing for this role
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Free account creation</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>AI-powered resume analysis</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Access to 1000+ more jobs</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg transform transition-all duration-200 hover:scale-105" 
                        onClick={() => setLocation(`/auth?redirect=/jobs/${jobId}&action=apply`)}
                      >
                        🚀 Start Your Journey - Apply Free!
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                        onClick={() => setLocation(`/auth?redirect=/jobs/${jobId}`)}
                      >
                        Already have an account? Sign In
                      </Button>

                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Join 50,000+ job seekers already using AutoJobr
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Proof Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        Why Choose AutoJobr?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">3x Higher Success Rate</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">AI-optimized applications get noticed</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Instant Application</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Apply in under 2 minutes</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Perfect Match Scoring</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Know your compatibility before applying</p>
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
              
              ) : user?.userType === 'recruiter' ? (
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
                        // Apply to job functionality
                        if (job.id) {
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
                      }}
                    >
                      Apply Now
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