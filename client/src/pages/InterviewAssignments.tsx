import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Video, 
  Code, 
  Users, 
  Clock, 
  Award,
  TrendingUp,
  Calendar,
  Brain,
  Zap,
  Share2,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Send,
  Link,
  Settings,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Timer,
  Link2,
  Copy,
  ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import InterviewAssignmentModal from "@/components/InterviewAssignmentModal";
import AssignedInterviewsTable from "@/components/AssignedInterviewsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface StatsData {
  totalAssigned: number;
  completed: number;
  pending: number;
  averageScore: number;
  virtualInterviews: number;
  mockInterviews: number;
  virtual: {
    count: number;
    completed: number;
    pending: number;
    avgScore: number;
  };
  mock: {
    count: number;
    completed: number;
    pending: number;
    avgScore: number;
  };
  video: {
    count: number;
    completed: number;
    pending: number;
    avgScore: number;
  };
  personality: {
    count: number;
    completed: number;
    pending: number;
    avgScore: number;
  };
  skills: {
    count: number;
    completed: number;
    pending: number;
    avgScore: number;
  };
  simulation: {
    count: number;
    completed: number;
    pending: number;
    avgScore: number;
  };
}

interface InterviewType {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  features: string[];
}

const interviewTypes: InterviewType[] = [
  {
    id: 'virtual',
    name: 'Virtual AI Interview',
    description: 'AI-powered conversational interviews with real-time feedback',
    icon: Video,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    features: ['Real-time AI feedback', 'Multiple interview styles', 'Automated scoring']
  },
  {
    id: 'mock',
    name: 'Mock Coding Test',
    description: 'Technical coding challenges with live execution environment',
    icon: Code,
    color: 'text-green-600',
    bgColor: 'bg-green-600',
    features: ['Live code execution', 'Multiple languages', 'Automated testing']
  },
  {
    id: 'skills-verification',
    name: 'Skills Assessment',
    description: 'Comprehensive project-based skill verification',
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-600',
    features: ['Project deliverables', 'Real-world scenarios', 'Portfolio review']
  },
  {
    id: 'personality',
    name: 'Personality Test',
    description: 'Big Five personality assessment for cultural fit',
    icon: Brain,
    color: 'text-orange-600',
    bgColor: 'bg-orange-600',
    features: ['Big Five model', 'Cultural fit analysis', 'Team compatibility']
  },
  {
    id: 'simulation',
    name: 'Work Simulation',
    description: 'Interactive workplace scenario simulations',
    icon: TrendingUp,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600',
    features: ['Virtual workplace', 'Decision making', 'Performance tracking']
  },
  {
    id: 'video-interview',
    name: 'Video Interview',
    description: 'Asynchronous video interview with AI analysis',
    icon: Calendar,
    color: 'text-pink-600',
    bgColor: 'bg-pink-600',
    features: ['Video responses', 'Speech analysis', 'Flexible timing']
  }
];

export default function InterviewAssignments() {
  const { toast } = useToast();
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedInterviewType, setSelectedInterviewType] = useState<'virtual' | 'mock' | 'skills-verification' | 'personality' | 'simulation' | 'video-interview'>('virtual');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [linkGeneration, setLinkGeneration] = useState({
    jobPostingId: '',
    interviewType: 'virtual' as 'virtual' | 'mock' | 'test' | 'skills-verification' | 'personality' | 'simulation' | 'video-interview',
    role: '',
    company: '',
    difficulty: 'medium',
    expiresInDays: 7,
    testTemplateId: ''
  });

  // Fetch candidates (job seekers)
  const { data: candidates = [] } = useQuery({
    queryKey: ['/api/users/candidates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users/candidates', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Candidates fetch error:', errorText);
          throw new Error('Failed to fetch candidates');
        }

        const data = await response.json();
        console.log('Candidates fetched:', data);
        return data;
      } catch (error) {
        console.error('Candidates query error:', error);
        throw error;
      }
    },
    retry: 1
  });

  // Fetch job postings
  const { data: jobPostings = [] } = useQuery({
    queryKey: ['/api/recruiter/jobs'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/recruiter/jobs', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Job postings fetch error:', errorText);
          throw new Error('Failed to fetch job postings');
        }

        const data = await response.json();
        console.log('Job postings fetched:', data);
        return data;
      } catch (error) {
        console.error('Job postings query error:', error);
        throw error;
      }
    },
    retry: 1
  });

  // Fetch interview assignment stats
  const { data: stats } = useQuery({
    queryKey: ['/api/interviews/stats', refreshKey],
    queryFn: async () => {
      try {
        const response = await fetch('/api/interviews/stats', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Stats fetch error:', errorText);
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        console.log('Stats fetched:', data);
        return data;
      } catch (error) {
        console.error('Stats query error:', error);
        throw error;
      }
    },
    retry: 1
  });

  const openAssignmentModal = (type: 'virtual' | 'mock' | 'skills-verification' | 'personality' | 'simulation' | 'video-interview') => {
    setSelectedInterviewType(type);
    setShowAssignmentModal(true);
  };

  const openLinkModal = (type: 'virtual' | 'mock' | 'skills-verification' | 'personality' | 'simulation' | 'video-interview') => {
    setSelectedInterviewType(type);
    setLinkGeneration(prev => ({ ...prev, interviewType: type }));
    setShowLinkModal(true);
  };

  const handleAssignmentSuccess = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Success",
      description: "Interview assigned successfully and email sent to candidate",
    });
  };

  const generateShareableLink = async () => {
    try {
      // Transform the data to match backend expectations
      const payload = {
        jobPostingId: linkGeneration.jobPostingId ? Number(linkGeneration.jobPostingId) : null,
        interviewType: linkGeneration.interviewType,
        interviewConfig: JSON.stringify({
          role: linkGeneration.role,
          company: linkGeneration.company,
          difficulty: linkGeneration.difficulty
        }),
        expiryDays: linkGeneration.expiresInDays || 7
      };

      const response = await fetch('/api/interviews/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new link to the beginning of the generatedLinks array
        setGeneratedLinks(prev => [data, ...prev]);
        toast({
          title: "Success",
          description: "Shareable interview link generated successfully!",
        });
        setShowLinkModal(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate link",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating link:', error);
      toast({
        title: "Error",
        description: "Failed to generate shareable link",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const defaultStats: StatsData = {
    totalAssigned: 0,
    completed: 0,
    pending: 0,
    averageScore: 0,
    virtualInterviews: 0,
    mockInterviews: 0,
    virtual: { count: 0, completed: 0, pending: 0, avgScore: 0 },
    mock: { count: 0, completed: 0, pending: 0, avgScore: 0 },
    video: { count: 0, completed: 0, pending: 0, avgScore: 0 },
    personality: { count: 0, completed: 0, pending: 0, avgScore: 0 },
    skills: { count: 0, completed: 0, pending: 0, avgScore: 0 },
    simulation: { count: 0, completed: 0, pending: 0, avgScore: 0 }
  };

  const currentStats = stats || defaultStats;

  const getStatsForType = (typeId: string) => {
    if (!currentStats) {
      return { count: 0, completed: 0, pending: 0, avgScore: 0 };
    }
    
    switch (typeId) {
      case 'virtual': return currentStats.virtual || { count: 0, completed: 0, pending: 0, avgScore: 0 };
      case 'mock': return currentStats.mock || { count: 0, completed: 0, pending: 0, avgScore: 0 };
      case 'video-interview': return currentStats.video || { count: 0, completed: 0, pending: 0, avgScore: 0 };
      case 'personality': return currentStats.personality || { count: 0, completed: 0, pending: 0, avgScore: 0 };
      case 'skills-verification': return currentStats.skills || { count: 0, completed: 0, pending: 0, avgScore: 0 };
      case 'simulation': return currentStats.simulation || { count: 0, completed: 0, pending: 0, avgScore: 0 };
      default: return { count: 0, completed: 0, pending: 0, avgScore: 0 };
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Interview Assignments
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Assign AI-powered interviews and assessments to candidates
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-3xl font-bold text-blue-600">{currentStats.totalAssigned || currentStats.virtual.count + currentStats.mock.count}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{currentStats.completed || currentStats.virtual.completed + currentStats.mock.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{currentStats.pending || currentStats.virtual.pending + currentStats.mock.pending}</p>
              </div>
              <Timer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-3xl font-bold text-purple-600">{Math.round(currentStats.averageScore || (currentStats.virtual.avgScore + currentStats.mock.avgScore) / 2)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Interview Types</TabsTrigger>
          <TabsTrigger value="assigned">Assigned Interviews</TabsTrigger>
          <TabsTrigger value="links">Shareable Links</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Interview Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviewTypes.map((type) => {
              const typeStats = getStatsForType(type.id);
              const Icon = type.icon;

              return (
                <Card key={type.id} className="hover:shadow-lg transition-all duration-200 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${type.bgColor.replace('bg-', 'bg-').replace('600', '100')}`}>
                        <Icon className={`h-6 w-6 ${type.color}`} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {typeStats.count} assigned
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{type.name}</CardTitle>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="space-y-2">
                      {type.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-600">{typeStats.completed}</p>
                        <p className="text-xs text-gray-500">Done</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-orange-600">{typeStats.pending}</p>
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-blue-600">{typeStats.avgScore}%</p>
                        <p className="text-xs text-gray-500">Avg Score</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => openAssignmentModal(type.id as any)}
                        className={`flex-1 ${type.bgColor} hover:opacity-90`}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                      <Button 
                        onClick={() => openLinkModal(type.id as any)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Share Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Need Help Getting Started?</h3>
                  <p className="text-gray-600 mt-1">
                    Learn how to effectively use our interview assignment system
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    📚 View Guide
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    🎯 Quick Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="virtual">Virtual AI</SelectItem>
                <SelectItem value="mock">Mock Coding</SelectItem>
                <SelectItem value="skills">Skills Test</SelectItem>
                <SelectItem value="personality">Personality</SelectItem>
                <SelectItem value="simulation">Simulation</SelectItem>
                <SelectItem value="video">Video Interview</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Interviews Table */}
          <AssignedInterviewsTable key={refreshKey} />
        </TabsContent>

        <TabsContent value="links" className="space-y-6">
          {/* Generated Shareable Links */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Shareable Interview Links</h3>
            <Button onClick={() => setShowLinkModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Link
            </Button>
          </div>

          {generatedLinks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shareable Links Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create shareable links for interviews that candidates can access directly
                </p>
                <Button onClick={() => setShowLinkModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Your First Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {generatedLinks.map((link, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="capitalize">{link.interviewType}</Badge>
                          <span className="font-medium">{link.role || 'Interview'}</span>
                          {link.company && (
                            <span className="text-gray-500">at {link.company}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Expires: {new Date(link.expiresAt).toLocaleDateString()}</p>
                          <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                            {link.shareableLink}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(link.shareableLink)}
                          variant="outline"
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assignment Modal */}
      <InterviewAssignmentModal
        open={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        interviewType={selectedInterviewType}
        candidates={candidates}
        jobPostings={jobPostings}
        onAssignmentSuccess={handleAssignmentSuccess}
      />

      {/* Shareable Link Generation Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Shareable Interview Link</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Create a shareable link that candidates can use to take interviews without being assigned directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job Posting (Optional)</Label>
              <Select
                value={linkGeneration.jobPostingId}
                onValueChange={(value) => {
                  if (value === "no-job") {
                    setLinkGeneration(prev => ({
                      ...prev,
                      jobPostingId: "",
                      role: "",
                      company: ""
                    }));
                  } else {
                    const selectedJob = jobPostings.find(job => job.id === Number(value));
                    setLinkGeneration(prev => ({
                      ...prev,
                      jobPostingId: value,
                      role: selectedJob?.title || "",
                      company: selectedJob?.companyName || selectedJob?.company || ""
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job posting (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="no-job">No specific job</SelectItem>
                  {jobPostings.map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.companyName || job.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Interview Type</Label>
              <Select
                value={linkGeneration.interviewType}
                onValueChange={(value: any) => setLinkGeneration(prev => ({ ...prev, interviewType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">Virtual AI Interview</SelectItem>
                  <SelectItem value="mock">Mock Coding Test</SelectItem>
                  <SelectItem value="skills-verification">Skills Test</SelectItem>
                  <SelectItem value="personality">Personality Assessment</SelectItem>
                  <SelectItem value="simulation">Simulation Test</SelectItem>
                  <SelectItem value="video-interview">Video Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Role {linkGeneration.interviewType === 'virtual' ? '*' : ''}</Label>
              <Input
                value={linkGeneration.role}
                onChange={(e) => setLinkGeneration(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
                required={linkGeneration.interviewType === 'virtual'}
                disabled={!!linkGeneration.jobPostingId && linkGeneration.jobPostingId !== "no-job"}
              />
              {linkGeneration.interviewType === 'virtual' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Role is required for virtual interviews to provide context to the AI interviewer
                </p>
              )}
            </div>

            <div>
              <Label>Company</Label>
              <Input
                value={linkGeneration.company}
                onChange={(e) => setLinkGeneration(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Your company name"
                disabled={!!linkGeneration.jobPostingId && linkGeneration.jobPostingId !== "no-job"}
              />
              {!!linkGeneration.jobPostingId && linkGeneration.jobPostingId !== "no-job" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-filled from selected job posting
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={linkGeneration.difficulty}
                  onValueChange={(value) => setLinkGeneration(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Expires In (Days)</Label>
                <Input
                  type="number"
                  value={linkGeneration.expiresInDays}
                  onChange={(e) => setLinkGeneration(prev => ({ ...prev, expiresInDays: Number(e.target.value) }))}
                  min="1"
                  max="30"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={generateShareableLink}
              disabled={!linkGeneration.role || !linkGeneration.interviewType}
              className="w-full"
            >
              Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Links Table */}
      {generatedLinks.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Generated Shareable Links
            </CardTitle>
            <CardDescription>
              Recently generated interview links for sharing with candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedLinks.map((link, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{link.role} - {link.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {link.interviewType} • {link.difficulty} difficulty
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(link.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(link.link);
                          toast({
                            title: "Link Copied!",
                            description: "Interview link copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(link.link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Input 
                      value={link.link} 
                      readOnly 
                      className="text-xs bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}