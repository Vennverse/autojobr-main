import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Bell,
  BellRing,
  Search,
  MapPin,
  Building,
  Clock,
  DollarSign,
  Star,
  Filter,
  Settings,
  Plus,
  Trash2,
  Eye,
  Briefcase,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  Globe,
  Zap,
  Heart,
  HeartIcon,
  BookmarkIcon,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

interface JobAlert {
  id: string;
  title: string;
  keywords: string[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
  experienceLevel: string;
  isActive: boolean;
  matchCount: number;
  createdAt: string;
  lastMatched?: string;
}

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedDate: string;
  description: string;
  requirements: string[];
  benefits: string[];
  matchScore: number;
  isRemote: boolean;
  isUrgent: boolean;
  companyLogo?: string;
  applicationUrl?: string;
}

export default function JobAlertsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("recommended");
  const [alertForm, setAlertForm] = useState({
    title: "",
    keywords: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    jobType: "all",
    experienceLevel: "all",
    isActive: true
  });

  // Fetch recommended jobs based on user profile and preferences
  const { data: recommendedJobs = [], isLoading: loadingRecommended } = useQuery<RecommendedJob[]>({
    queryKey: ["/api/jobs/recommended", user?.id],
    enabled: !!user?.id,
  });

  // Fetch user's job alerts
  const { data: jobAlerts = [], isLoading: loadingAlerts } = useQuery<JobAlert[]>({
    queryKey: ["/api/job-alerts", user?.id],
    enabled: !!user?.id,
  });

  // Fetch recent job matches for alerts
  const { data: recentMatches = [], isLoading: loadingMatches } = useQuery<RecommendedJob[]>({
    queryKey: ["/api/job-alerts/matches", user?.id],
    enabled: !!user?.id,
  });

  const handleSaveJob = async (jobId: string) => {
    // Implementation for saving jobs
    console.log("Saving job:", jobId);
  };

  const handleQuickApply = async (jobId: string, applicationUrl?: string) => {
    if (applicationUrl) {
      window.open(applicationUrl, '_blank');
    } else {
      // Navigate to job details page
      window.location.href = `/jobs/${jobId}`;
    }
  };

  const createJobAlert = async () => {
    // Implementation for creating job alerts
    console.log("Creating job alert:", alertForm);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (score >= 75) return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
  };

  const getJobTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'full-time': return <Briefcase className="w-4 h-4" />;
      case 'part-time': return <Clock className="w-4 h-4" />;
      case 'contract': return <Calendar className="w-4 h-4" />;
      case 'remote': return <Globe className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-8 h-8 text-blue-600" />
              Job Alerts & Recommendations
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Discover personalized job matches and set up smart alerts
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-job-settings">
              <Settings className="w-4 h-4 mr-2" />
              Alert Settings
            </Button>
            <Button data-testid="button-create-alert">
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">New Recommendations</p>
                  <p className="text-2xl font-bold text-blue-600">{recommendedJobs.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Alerts</p>
                  <p className="text-2xl font-bold text-green-600">{jobAlerts.filter(alert => alert.isActive).length}</p>
                </div>
                <BellRing className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Recent Matches</p>
                  <p className="text-2xl font-bold text-purple-600">{recentMatches.length}</p>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">This Week</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {recommendedJobs.filter(job => {
                      const posted = new Date(job.postedDate);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return posted >= weekAgo;
                    }).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recommended">Recommended Jobs</TabsTrigger>
                <TabsTrigger value="alerts">My Alerts</TabsTrigger>
                <TabsTrigger value="matches">Recent Matches</TabsTrigger>
              </TabsList>

              {/* Recommended Jobs Tab */}
              <TabsContent value="recommended" className="space-y-4 mt-6">
                {loadingRecommended ? (
                  <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : recommendedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recommendations yet</h3>
                    <p className="text-gray-500 mb-4">Complete your profile to get personalized job recommendations</p>
                    <Link href="/profile">
                      <Button>Complete Profile</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendedJobs.map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {job.title}
                              </h3>
                              <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getMatchScoreColor(job.matchScore)}`}>
                                {job.matchScore}% match
                              </Badge>
                              {job.isUrgent && (
                                <Badge variant="destructive" className="text-xs">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                {job.company}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                                {job.isRemote && <Badge variant="secondary" className="text-xs ml-1">Remote</Badge>}
                              </div>
                              <div className="flex items-center gap-1">
                                {getJobTypeIcon(job.type)}
                                {job.type}
                              </div>
                              {job.salary && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {job.salary}
                                </div>
                              )}
                            </div>
                            
                            <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                              {job.description}
                            </p>
                            
                            {job.requirements.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {job.requirements.slice(0, 4).map((req, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {req}
                                  </Badge>
                                ))}
                                {job.requirements.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{job.requirements.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            Posted {new Date(job.postedDate).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveJob(job.id)}
                              data-testid={`button-save-${job.id}`}
                            >
                              <BookmarkIcon className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleQuickApply(job.id, job.applicationUrl)}
                              data-testid={`button-apply-${job.id}`}
                            >
                              Quick Apply
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Job Alerts Tab */}
              <TabsContent value="alerts" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {jobAlerts.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No job alerts yet</h3>
                      <p className="text-gray-500 mb-4">Create your first job alert to get notified of relevant opportunities</p>
                    </div>
                  ) : (
                    jobAlerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{alert.title}</h3>
                                <Switch 
                                  checked={alert.isActive} 
                                  onCheckedChange={() => {}}
                                  data-testid={`switch-alert-${alert.id}`}
                                />
                                {alert.isActive ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Paused
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {alert.keywords.map((keyword, index) => (
                                  <Badge key={index} variant="outline">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                                <div>
                                  <span className="font-medium">Location:</span> {alert.location}
                                </div>
                                <div>
                                  <span className="font-medium">Type:</span> {alert.jobType}
                                </div>
                                <div>
                                  <span className="font-medium">Level:</span> {alert.experienceLevel}
                                </div>
                                <div>
                                  <span className="font-medium">Matches:</span> {alert.matchCount}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Recent Matches Tab */}
              <TabsContent value="matches" className="space-y-4 mt-6">
                {loadingMatches ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : recentMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recent matches</h3>
                    <p className="text-gray-500">Your job alerts haven't found any matches yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMatches.map((job) => (
                      <Card key={job.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{job.company} • {job.location}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">View</Button>
                              <Button size="sm">Apply</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}