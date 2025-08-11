import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  Award,
  Calendar,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Zap,
  Activity,
  PieChart,
  LineChart,
  MapPin,
  Building,
  Briefcase,
  UserCheck,
  Timer,
  Percent,
  Hash
} from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsData {
  overview: {
    totalJobs: number;
    totalApplications: number;
    totalViews: number;
    averageTimeToHire: number;
    successRate: number;
    monthlyGrowth: number;
    weeklyGrowth: number;
    thisWeekInterviews: number;
  };
  applicationsByStatus: {
    [key: string]: number;
  };
  recentActivity: {
    last30Days: number;
    thisWeek: number;
  };
  sourceEffectiveness: Array<{
    source: string;
    applications: number;
    hires: number;
    conversionRate: number;
    cost: number;
    roi: number;
  }>;
  timeToHire: Array<{
    stage: string;
    averageDays: number;
    minDays: number;
    maxDays: number;
  }>;
  salaryAnalytics: {
    averageOffered: number;
    acceptanceRate: number;
    ranges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  };
  diversityMetrics: {
    genderDistribution: Array<{
      gender: string;
      count: number;
      percentage: number;
    }>;
    ageDistribution: Array<{
      ageRange: string;
      count: number;
      percentage: number;
    }>;
    locationDistribution: Array<{
      location: string;
      count: number;
      percentage: number;
    }>;
  };
  performanceMetrics: {
    topPerformingJobs: Array<{
      jobTitle: string;
      applications: number;
      quality: number;
      timeToFill: number;
    }>;
    recruiterPerformance: Array<{
      recruiterId: string;
      recruiterName: string;
      jobsPosted: number;
      applications: number;
      hires: number;
      averageTimeToHire: number;
    }>;
  };
  complianceReporting: {
    eeocCompliance: {
      reportingPeriod: string;
      totalApplications: number;
      diversityScore: number;
      complianceStatus: string;
    };
    auditTrail: Array<{
      action: string;
      user: string;
      timestamp: string;
      details: string;
    }>;
  };
}

export default function AdvancedAnalyticsDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("30d");
  const [selectedJob, setSelectedJob] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("overview");

  // Fetch comprehensive analytics data
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/recruiter/advanced-analytics", dateRange, selectedJob],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch job postings for filtering
  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/recruiter/jobs"],
  });

  // Generate report mutation would go here
  const generateReport = async (type: string) => {
    try {
      const response = await fetch(`/api/recruiter/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, dateRange, jobId: selectedJob }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${dateRange}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  };

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <RecruiterNavbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <RecruiterNavbar user={user} />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Advanced Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Comprehensive hiring insights and performance metrics
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32" data-testid="select-date-range">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-48" data-testid="select-job-filter">
                <SelectValue placeholder="All Jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job: any) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => refetchAnalytics()}
              variant="outline"
              data-testid="button-refresh-analytics"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button 
              onClick={() => generateReport("comprehensive")}
              data-testid="button-download-report"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics?.overview.totalApplications || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    {analytics?.overview.weeklyGrowth && analytics.overview.weeklyGrowth > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${analytics?.overview.weeklyGrowth && analytics.overview.weeklyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(analytics?.overview.weeklyGrowth || 0)}% vs last week
                    </span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics?.overview.successRate || 0}%
                  </p>
                  <div className="flex items-center mt-2">
                    <Target className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Industry avg: 3-5%
                    </span>
                  </div>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg. Time to Hire</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics?.overview.averageTimeToHire || 0} days
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Target: 14 days
                    </span>
                  </div>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Job Views</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics?.overview.totalViews || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <Eye className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">
                      +{analytics?.overview.monthlyGrowth || 0}% this month
                    </span>
                  </div>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Analytics Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="diversity">Diversity</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Application Status Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(analytics?.applicationsByStatus || {}).map(([status, count]) => {
                          const total = Object.values(analytics?.applicationsByStatus || {}).reduce((a, b) => a + b, 0);
                          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                          
                          return (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                                <span className="capitalize text-sm font-medium">{status.replace('_', ' ')}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Progress value={percentage} className="w-20" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-right">
                                  {count}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Recent Activity Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div>
                            <p className="font-medium">Applications This Week</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {analytics?.recentActivity.thisWeek || 0}
                            </p>
                          </div>
                          <Calendar className="w-8 h-8 text-blue-500" />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div>
                            <p className="font-medium">Applications Last 30 Days</p>
                            <p className="text-2xl font-bold text-green-600">
                              {analytics?.recentActivity.last30Days || 0}
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div>
                            <p className="font-medium">Interviews This Week</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {analytics?.overview.thisWeekInterviews || 0}
                            </p>
                          </div>
                          <Video className="w-8 h-8 text-purple-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="sources" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Source Effectiveness & ROI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Source</th>
                            <th className="text-left py-3 px-4 font-medium">Applications</th>
                            <th className="text-left py-3 px-4 font-medium">Hires</th>
                            <th className="text-left py-3 px-4 font-medium">Conversion Rate</th>
                            <th className="text-left py-3 px-4 font-medium">Cost per Hire</th>
                            <th className="text-left py-3 px-4 font-medium">ROI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics?.sourceEffectiveness?.map((source, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-3 px-4 font-medium">{source.source}</td>
                              <td className="py-3 px-4">{source.applications}</td>
                              <td className="py-3 px-4">{source.hires}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Progress value={source.conversionRate} className="w-16" />
                                  <span>{source.conversionRate}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">${source.cost}</td>
                              <td className="py-3 px-4">
                                <Badge variant={source.roi > 200 ? "default" : source.roi > 100 ? "secondary" : "destructive"}>
                                  {source.roi}%
                                </Badge>
                              </td>
                            </tr>
                          )) || (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-gray-500">
                                No source data available for the selected period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="w-5 h-5" />
                      Time-to-Hire Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.timeToHire?.map((stage, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium">{stage.stage}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Range: {stage.minDays}-{stage.maxDays} days
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{stage.averageDays}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">avg days</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-8">
                          <Timer className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No timeline data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="diversity" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gender Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics?.diversityMetrics?.genderDistribution?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{item.gender}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={item.percentage} className="w-16" />
                              <span className="text-sm w-12 text-right">{item.percentage}%</span>
                            </div>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-center py-4">No data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Age Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics?.diversityMetrics?.ageDistribution?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{item.ageRange}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={item.percentage} className="w-16" />
                              <span className="text-sm w-12 text-right">{item.percentage}%</span>
                            </div>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-center py-4">No data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Location Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics?.diversityMetrics?.locationDistribution?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{item.location}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={item.percentage} className="w-16" />
                              <span className="text-sm w-12 text-right">{item.percentage}%</span>
                            </div>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-center py-4">No data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Top Performing Jobs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics?.performanceMetrics?.topPerformingJobs?.map((job, index) => (
                          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{job.jobTitle}</h4>
                              <Badge>{job.applications} applications</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Quality Score:</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress value={job.quality} className="flex-1" />
                                  <span>{job.quality}%</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Time to Fill:</span>
                                <p className="font-medium">{job.timeToFill} days</p>
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center text-gray-500 py-8">
                            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No performance data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        Recruiter Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics?.performanceMetrics?.recruiterPerformance?.map((recruiter, index) => (
                          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{recruiter.recruiterName}</h4>
                              <Badge variant="outline">{recruiter.hires} hires</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Jobs:</span>
                                <p className="font-medium">{recruiter.jobsPosted}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Applications:</span>
                                <p className="font-medium">{recruiter.applications}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Avg. Time:</span>
                                <p className="font-medium">{recruiter.averageTimeToHire}d</p>
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center text-gray-500 py-8">
                            <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No recruiter performance data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        EEOC Compliance Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics?.complianceReporting?.eeocCompliance ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Compliance Status</span>
                              <Badge 
                                variant={analytics.complianceReporting.eeocCompliance.complianceStatus === 'Compliant' ? 'default' : 'destructive'}
                              >
                                {analytics.complianceReporting.eeocCompliance.complianceStatus}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Reporting Period:</span>
                                <p className="font-medium">{analytics.complianceReporting.eeocCompliance.reportingPeriod}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-300">Total Applications:</span>
                                <p className="font-medium">{analytics.complianceReporting.eeocCompliance.totalApplications}</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <span className="text-gray-600 dark:text-gray-300">Diversity Score:</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={analytics.complianceReporting.eeocCompliance.diversityScore} className="flex-1" />
                                <span>{analytics.complianceReporting.eeocCompliance.diversityScore}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No compliance data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Audit Trail
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {analytics?.complianceReporting?.auditTrail?.map((audit, index) => (
                          <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{audit.action}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(audit.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{audit.details}</p>
                            <p className="text-xs text-gray-500 mt-1">by {audit.user}</p>
                          </div>
                        )) || (
                          <div className="text-center text-gray-500 py-8">
                            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No audit trail available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => generateReport("diversity")}
                variant="outline" 
                className="h-20 flex-col gap-2"
                data-testid="button-diversity-report"
              >
                <Users className="w-6 h-6" />
                <span>Generate Diversity Report</span>
              </Button>
              
              <Button 
                onClick={() => generateReport("performance")}
                variant="outline" 
                className="h-20 flex-col gap-2"
                data-testid="button-performance-report"
              >
                <BarChart3 className="w-6 h-6" />
                <span>Generate Performance Report</span>
              </Button>
              
              <Button 
                onClick={() => generateReport("compliance")}
                variant="outline" 
                className="h-20 flex-col gap-2"
                data-testid="button-compliance-report"
              >
                <Shield className="w-6 h-6" />
                <span>Generate Compliance Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get status colors
function getStatusColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    'applied': 'bg-blue-500',
    'screening': 'bg-yellow-500',
    'phone_screen': 'bg-purple-500',
    'technical_interview': 'bg-orange-500',
    'final_interview': 'bg-indigo-500',
    'offer_extended': 'bg-green-500',
    'hired': 'bg-emerald-500',
    'rejected': 'bg-red-500',
  };
  return colorMap[status] || 'bg-gray-500';
}