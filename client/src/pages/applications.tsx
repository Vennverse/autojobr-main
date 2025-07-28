import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import PremiumGate from "@/components/PremiumGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Building,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Star,
  Grid3X3,
  List,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: string;
  appliedDate: string;
  source: string;
  matchScore?: number;
  notes?: string;
}

interface SavedJob {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  datePosted: string;
  matchScore?: number;
}

const statusColors = {
  applied: "bg-blue-100 text-blue-800",
  interview: "bg-yellow-100 text-yellow-800", 
  offered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  saved: "bg-gray-100 text-gray-800"
};

const statusIcons = {
  applied: <Clock className="h-4 w-4" />,
  interview: <Users className="h-4 w-4" />,
  offered: <Award className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  saved: <Star className="h-4 w-4" />
};

export default function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [activeTab, setActiveTab] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch applications data
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
  });

  const { data: savedJobs = [], isLoading: savedJobsLoading } = useQuery({
    queryKey: ["/api/saved-jobs"],
  });

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/applications/stats"],
  });

  // Filter applications based on search and status
  const filteredApplications = applications.filter((app: Application) => {
    const matchesSearch = !searchTerm || 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredSavedJobs = savedJobs.filter((job: SavedJob) => {
    return !searchTerm || 
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const allJobs = [...applications, ...savedJobs];

  // Statistics
  const totalApplications = applications.length;
  const totalSaved = savedJobs.length;
  const responseRate = Math.round((stats.responseRate || 0) * 100);
  const avgMatchScore = Math.round(stats.avgMatchScore || 0);

  if (applicationsLoading || savedJobsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <PremiumGate feature="job_applications" blockOnLimit={true}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Job Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track and manage your job application journey
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/saved-jobs"] });
                  toast({
                    title: "Synced",
                    description: "Application data refreshed.",
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalApplications}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Total Applied
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalSaved}
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Saved Jobs
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                    <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {responseRate}%
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Response Rate
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {avgMatchScore}%
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Avg Match Score
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    All ({allJobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="applied" className="flex items-center gap-2">
                    Applied ({applications.length})
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="flex items-center gap-2">
                    Saved ({savedJobs.length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-3 items-center">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <Button
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                      className="h-8 px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search jobs, companies, or locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="saved">Saved</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offered">Offered</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>

            <TabsContent value="all" className="space-y-6">
              <ApplicationsList 
                applications={allJobs} 
                viewMode={viewMode}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
              />
            </TabsContent>

            <TabsContent value="applied" className="space-y-6">
              <ApplicationsList 
                applications={filteredApplications} 
                viewMode={viewMode}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
              />
            </TabsContent>

            <TabsContent value="saved" className="space-y-6">
              <SavedJobsList 
                jobs={filteredSavedJobs} 
                viewMode={viewMode}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PremiumGate>
    </div>
  );
}

// Applications List Component
function ApplicationsList({ applications, viewMode }: { applications: Application[], viewMode: string }) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Start tracking your job applications</p>
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Match Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map((app: Application) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {app.jobTitle}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {app.location}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-white">{app.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={statusColors[app.status as keyof typeof statusColors] || statusColors.applied}>
                      <span className="flex items-center gap-1">
                        {statusIcons[app.status as keyof typeof statusIcons]}
                        {app.status}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(app.appliedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {app.matchScore && (
                      <span className={`font-medium ${
                        app.matchScore >= 80 ? 'text-green-600' : 
                        app.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {app.matchScore}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {applications.map((app: Application, index: number) => (
        <motion.div
          key={app.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2">
                    {app.jobTitle}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {app.company}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <MapPin className="h-3 w-3" />
                    {app.location}
                  </div>
                </div>
                <Badge className={statusColors[app.status as keyof typeof statusColors] || statusColors.applied}>
                  <span className="flex items-center gap-1">
                    {statusIcons[app.status as keyof typeof statusIcons]}
                    {app.status}
                  </span>
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(app.appliedDate).toLocaleDateString()}
                </div>
                {app.matchScore && (
                  <span className={`font-medium ${
                    app.matchScore >= 80 ? 'text-green-600' : 
                    app.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {app.matchScore}% match
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Saved Jobs List Component  
function SavedJobsList({ jobs, viewMode }: { jobs: SavedJob[], viewMode: string }) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved jobs yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Use the Chrome extension to save jobs while browsing</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job: SavedJob, index: number) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 mb-2">
                    {job.jobTitle}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {job.company}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </div>
                </div>
                <Badge className={statusColors.saved}>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Saved
                  </span>
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(job.datePosted).toLocaleDateString()}
                </div>
                {job.matchScore && (
                  <span className={`font-medium ${
                    job.matchScore >= 80 ? 'text-green-600' : 
                    job.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {job.matchScore}% match
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}