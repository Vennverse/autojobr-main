// --- Enhanced, insightful NLP analysis utility ---
function analyzeApplicantNLP(app: any): Partial<Application> {
  // Combine all available text fields
  const text = [
    app.recruiterNotes,
    app.applicantName,
    app.applicantEmail,
    app.applicantLocation,
    app.applicantEducation,
    app.applicantExperience,
    app.applicantSkills,
    app.jobPostingTitle,
    app.jobPostingCompany,
    app.jobPostingLocation
  ].filter(Boolean).join(" ").toLowerCase();

  // Skills extraction
  const skillsList = [
    "javascript", "typescript", "react", "node", "python", "java", "c++", "sql", "aws", "docker", "css", "html", "machine learning", "data", "api", "cloud", "devops", "testing", "leadership", "communication", "project management", "design", "sales", "marketing", "finance", "security", "linux", "windows", "mobile", "android", "ios"
  ];
  const foundSkills = skillsList.filter(skill => text.includes(skill));

  // Education extraction (simple match)
  const educationList = ["bachelor", "master", "phd", "b.sc", "m.sc", "mba", "btech", "mtech", "b.e", "m.e", "ba", "ma"];
  const foundEducation = educationList.filter(edu => text.includes(edu));

  // Experience extraction (look for years)
  let yearsExp = 0;
  const expMatch = text.match(/(\d+)\s*(\+)?\s*(years|yrs|year|yr)/);
  if (expMatch) {
    yearsExp = parseInt(expMatch[1], 10);
  }

  // Location match (city/state/country)
  let locationMatch = false;
  if (app.applicantLocation && app.jobPostingLocation) {
    locationMatch = app.jobPostingLocation.toLowerCase().includes(app.applicantLocation.toLowerCase()) || app.applicantLocation.toLowerCase().includes(app.jobPostingLocation.toLowerCase());
  }

  // Company match (current or previous)
  let companyMatch = false;
  if (app.jobPostingCompany && text.includes(app.jobPostingCompany.toLowerCase())) {
    companyMatch = true;
  }

  // Simulate fit score: skills, education, experience, location, company
  let fitScore = 0;
  fitScore += foundSkills.length * 12; // up to 60
  fitScore += foundEducation.length > 0 ? 10 : 0;
  fitScore += yearsExp >= 5 ? 10 : yearsExp >= 2 ? 5 : 0;
  fitScore += locationMatch ? 10 : 0;
  fitScore += companyMatch ? 10 : 0;
  fitScore = Math.min(100, fitScore);

  // Insights
  let nlpInsights = [];
  if (foundSkills.length > 0) nlpInsights.push(`Skills: ${foundSkills.join(", ")}`);
  if (foundEducation.length > 0) nlpInsights.push(`Education: ${foundEducation.join(", ")}`);
  if (yearsExp > 0) nlpInsights.push(`Experience: ${yearsExp} years`);
  if (locationMatch) nlpInsights.push("Location matches job");
  if (companyMatch) nlpInsights.push("Has experience at target company");
  if (fitScore >= 80) nlpInsights.push("Excellent overall fit");
  else if (fitScore >= 60) nlpInsights.push("Good fit");
  else if (fitScore > 0) nlpInsights.push("Some relevant background");
  else nlpInsights.push("No strong match detected");

  // Job match highlights
  const jobMatchHighlights = [];
  if (foundSkills.length > 0) jobMatchHighlights.push(`Skills matched: ${foundSkills.join(", ")}`);
  if (foundEducation.length > 0) jobMatchHighlights.push(`Education matched: ${foundEducation.join(", ")}`);
  if (yearsExp > 0) jobMatchHighlights.push(`Experience: ${yearsExp} years`);
  if (locationMatch) jobMatchHighlights.push("Location is a match");
  if (companyMatch) jobMatchHighlights.push("Company experience match");
  if (fitScore >= 80) jobMatchHighlights.push("Profile closely matches job requirements.");
  if (fitScore < 40) jobMatchHighlights.push("Consider for other roles or further screening.");

  return {
    fitScore,
    nlpInsights: nlpInsights.join(". "),
    topSkills: foundSkills,
    jobMatchHighlights
  };
}
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import {
  Users,
  Search,
  Filter,
  Calendar,
  Clock,
  Star,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Video,
  Code,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  UserCheck,
  Briefcase,
  Award,
  Target,
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  ArrowRight,
  PlayCircle,
  StopCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

interface Application {
  id: number;
  userId: string;
  jobPostingId: number;
  status: string;
  appliedAt: string;
  recruiterNotes?: string;
  stage: string;
  score?: number;
  lastActivity: string;
  fitScore?: number; // NLP fit score 0-100
  nlpInsights?: string; // NLP summary/insights
  topSkills?: string[]; // NLP extracted skills
  jobMatchHighlights?: string[]; // NLP job match highlights
  candidate: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profileImageUrl?: string;
  };
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
  };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  description: string;
  applications: Application[];
  count: number;
}

const defaultStages: PipelineStage[] = [
  {
    id: "applied",
    name: "Applied",
    color: "bg-blue-500",
    description: "New applications",
    applications: [],
    count: 0
  },
  {
    id: "phone_screen",
    name: "Phone Screen",
    color: "bg-yellow-500",
    description: "Initial phone screening",
    applications: [],
    count: 0
  },
  {
    id: "technical_interview",
    name: "Technical Interview",
    color: "bg-purple-500",
    description: "Technical assessment",
    applications: [],
    count: 0
  },
  {
    id: "final_interview",
    name: "Final Interview",
    color: "bg-green-500",
    description: "Final round interviews",
    applications: [],
    count: 0
  },
  {
    id: "offer_extended",
    name: "Offer Extended",
    color: "bg-emerald-500",
    description: "Offer sent to candidate",
    applications: [],
    count: 0
  },
  {
    id: "hired",
    name: "Hired",
    color: "bg-green-600",
    description: "Successfully hired",
    applications: [],
    count: 0
  },
  {
    id: "rejected",
    name: "Rejected",
    color: "bg-red-500",
    description: "Not moving forward",
    applications: [],
    count: 0
  }
];

export default function PipelineManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedNlpApplication, setSelectedNlpApplication] = useState<Application | null>(null); // For NLP modal
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(defaultStages);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(["applied", "phone_screen"]));
  const [interviewAssignmentData, setInterviewAssignmentData] = useState({
    candidateId: "",
    jobPostingId: "",
    interviewType: "virtual",
    assignmentType: "virtual", // virtual, mock, test
    role: "",
    company: "",
    difficulty: "medium",
    duration: 60,
    dueDate: "",
    instructions: ""
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/recruiter/applications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: jobPostings = [] } = useQuery({
    queryKey: ["/api/recruiter/jobs"],
  });

  // Organize applications by stage
  useEffect(() => {
    if (applications.length > 0) {
      // Transform flat data structure to nested format expected by frontend, and enrich with NLP
      const transformedApplications = applications.map((app: any) => {
        const nlp = analyzeApplicantNLP(app);
        return {
          ...app,
          ...nlp,
          candidate: {
            id: app.applicantId,
            name: app.applicantName,
            email: app.applicantEmail,
            phone: app.applicantPhone,
            location: app.applicantLocation,
            profileImageUrl: app.applicantProfileImageUrl,
          },
          job: {
            id: app.jobPostingId,
            title: app.jobPostingTitle,
            company: app.jobPostingCompany,
            location: app.jobPostingLocation,
          },
          stage: app.stage || "applied",
          lastActivity: app.updatedAt || app.appliedAt,
          userId: app.applicantId,
          appliedAt: app.appliedAt,
        };
      });

      const updatedStages = defaultStages.map(stage => ({
        ...stage,
        applications: transformedApplications.filter((app: Application) => 
          app.stage === stage.id || (!app.stage && stage.id === "applied")
        ),
        count: transformedApplications.filter((app: Application) => 
          app.stage === stage.id || (!app.stage && stage.id === "applied")
        ).length
      }));
      setPipelineStages(updatedStages);
    }
  }, [applications]);

  // Move application to different stage
  const moveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, newStage, notes }: { applicationId: number; newStage: string; notes?: string }) => {
      return await apiRequest("PUT", `/api/recruiter/applications/${applicationId}/stage`, {
        stage: newStage,
        notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
      toast({
        title: "Application Updated",
        description: "Application stage updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application stage",
        variant: "destructive",
      });
    },
  });

  // Send interview invitation
  const sendInterviewInviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = data.assignmentType === "virtual" 
        ? "/api/interviews/virtual/assign" 
        : data.assignmentType === "mock"
        ? "/api/interviews/mock/assign"
        : "/api/test-assignments";
      
      return await apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
      toast({
        title: "Interview Assigned",
        description: "Interview invitation sent successfully",
      });
      setSelectedApplication(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send interview invitation",
        variant: "destructive",
      });
    },
  });

  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const handleSendInterviewInvite = () => {
    if (!selectedApplication) return;
    
    const assignmentData = {
      candidateId: selectedApplication.userId,
      jobPostingId: selectedApplication.jobPostingId,
      ...interviewAssignmentData,
      dueDate: new Date(interviewAssignmentData.dueDate).toISOString(),
    };

    sendInterviewInviteMutation.mutate(assignmentData);
  };

  // Add a "Top Matches" filter using fitScore
  const [showTopMatches, setShowTopMatches] = useState(false);
  const filteredStages = pipelineStages.map((stage: PipelineStage) => ({
    ...stage,
    applications: stage.applications
      .filter((app: Application) => {
        if (!app.candidate || !app.job) return false;
        const matchesSearch = searchTerm === "" || 
          app.candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesJob = selectedJobFilter === "all" || 
          app.jobPostingId.toString() === selectedJobFilter;
        return matchesSearch && matchesJob;
      })
      .sort((a: Application, b: Application) => {
        // Sort by fitScore descending if showTopMatches is enabled
        if (showTopMatches) {
          return (b.fitScore || 0) - (a.fitScore || 0);
        }
        return 0;
      })
  })).filter((stage: PipelineStage) => 
    selectedStageFilter === "all" || stage.id === selectedStageFilter
  );

  const getStageStats = () => {
    const totalApplications = applications.length;
    const hiredCount = pipelineStages.find((s: PipelineStage) => s.id === "hired")?.count || 0;
    const rejectedCount = pipelineStages.find((s: PipelineStage) => s.id === "rejected")?.count || 0;
    const activeCount = totalApplications - hiredCount - rejectedCount;
    const conversionRate = totalApplications > 0 ? ((hiredCount / totalApplications) * 100).toFixed(1) : "0";
    return { totalApplications, hiredCount, rejectedCount, activeCount, conversionRate };
  };

  const stats = getStageStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <RecruiterNavbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pipeline Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your recruitment pipeline with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Search className="h-5 w-5 text-gray-400" />
            </div>
              <Select value={selectedJobFilter} onValueChange={(v: string) => setSelectedJobFilter(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobPostings.map((job: any) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              <Select value={selectedStageFilter} onValueChange={(v: string) => setSelectedStageFilter(v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {defaultStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showTopMatches ? "default" : "outline"}
              onClick={() => setShowTopMatches((v) => !v)}
              className="ml-2"
            >
              {showTopMatches ? "Showing Top Matches" : "Top Matches"}
            </Button>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalApplications}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeCount}</p>
                  <p className="text-sm text-gray-600">Active Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hiredCount}</p>
                  <p className="text-sm text-gray-600">Hired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejectedCount}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-6">
          {filteredStages.map((stage) => (
            <Card key={stage.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleStageExpansion(stage.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {expandedStages.has(stage.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                    <div>
                      <h3 className="text-lg font-semibold">{stage.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{stage.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {stage.applications.length} candidates
                  </Badge>
                </div>
              </CardHeader>
              
              {expandedStages.has(stage.id) && (
                <CardContent className="p-0">
                  {stage.applications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No candidates in this stage</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stage.applications.map((application: Application, idx: number) => {
                        // Highlight top 3 matches if showTopMatches is enabled
                        const isTopMatch = showTopMatches && idx < 3 && (application.fitScore || 0) > 0;
                        return (
                          <div
                            key={application.id}
                            className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isTopMatch ? 'ring-2 ring-emerald-400 bg-emerald-50 dark:bg-emerald-900' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {application.candidate?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {application.candidate?.name || 'Unknown Candidate'}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {application.candidate?.email || 'No email provided'}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                                    <span className="text-sm text-gray-500">
                                      Applied to: {application.job?.title || 'Unknown Position'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(application.appliedAt).toLocaleDateString()}
                                    </span>
                                    {application.topSkills && application.topSkills.length > 0 && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">
                                        Top Skills: {application.topSkills.slice(0, 3).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* NLP Fit Score */}
                                {application.fitScore !== undefined && (
                                  <Badge variant={application.fitScore > 80 ? "success" : application.fitScore > 60 ? "default" : "outline"} className="mr-2 cursor-pointer" onClick={() => setSelectedNlpApplication(application)}>
                                    Fit Score: {application.fitScore}%
                                  </Badge>
                                )}
                                {/* NLP Insights Tooltip */}
                                {application.nlpInsights && (
                                  <Button variant="ghost" size="icon" title="View AI Insights" onClick={() => setSelectedNlpApplication(application)}>
                                    <BarChart3 className="h-4 w-4 text-blue-500" />
                                  </Button>
                                )}
                                {/* Score (legacy) */}
                                {application.score && (
                                  <Badge variant="outline" className="mr-2">
                                    Score: {application.score}%
                                  </Badge>
                                )}
                                {/* Interview Invite */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedApplication(application)}
                                    >
                                      <Video className="h-4 w-4 mr-2" />
                                      Send Interview Invite
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Send Interview Invitation</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Assignment Type</Label>
                                        <Select 
                                          value={interviewAssignmentData.assignmentType} 
                                          onValueChange={(value) => 
                                            setInterviewAssignmentData(prev => ({ ...prev, assignmentType: value }))
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="virtual">Virtual AI Interview</SelectItem>
                                            <SelectItem value="mock">Mock Coding Test</SelectItem>
                                            <SelectItem value="test">Test Assignment</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Role</Label>
                                        <Input 
                                          value={interviewAssignmentData.role}
                                          onChange={(e) => 
                                            setInterviewAssignmentData(prev => ({ ...prev, role: e.target.value }))
                                          }
                                          placeholder="e.g., Senior Frontend Developer"
                                        />
                                      </div>
                                      <div>
                                        <Label>Due Date</Label>
                                        <Input 
                                          type="datetime-local"
                                          value={interviewAssignmentData.dueDate}
                                          onChange={(e) => 
                                            setInterviewAssignmentData(prev => ({ ...prev, dueDate: e.target.value }))
                                          }
                                        />
                                      </div>
                                      <div>
                                        <Label>Instructions</Label>
                                        <Textarea 
                                          value={interviewAssignmentData.instructions}
                                          onChange={(e) => 
                                            setInterviewAssignmentData(prev => ({ ...prev, instructions: e.target.value }))
                                          }
                                          placeholder="Additional instructions for the candidate..."
                                          rows={3}
                                        />
                                      </div>
                                      <Button 
                                        onClick={handleSendInterviewInvite}
                                        className="w-full"
                                        disabled={sendInterviewInviteMutation.isPending}
                                      >
                                        {sendInterviewInviteMutation.isPending ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Invitation
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                {/* Move Stage */}
                                <Select 
                                  value={application.stage || "applied"}
                                  onValueChange={(newStage) => 
                                    moveApplicationMutation.mutate({
                                      applicationId: application.id,
                                      newStage
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {defaultStages.map((stage) => (
                                      <SelectItem key={stage.id} value={stage.id}>
                                        {stage.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
        {/* NLP Analysis Modal */}
        {selectedNlpApplication && (
          <Dialog open={!!selectedNlpApplication} onOpenChange={() => setSelectedNlpApplication(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>AI Candidate Analysis</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedNlpApplication.candidate?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {selectedNlpApplication.candidate?.name || 'Unknown Candidate'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedNlpApplication.candidate?.email || 'No email provided'}
                    </p>
                  </div>
                </div>
                {selectedNlpApplication.fitScore !== undefined && (
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedNlpApplication.fitScore > 80 ? "success" : selectedNlpApplication.fitScore > 60 ? "default" : "outline"}>
                      Fit Score: {selectedNlpApplication.fitScore}%
                    </Badge>
                  </div>
                )}
                {selectedNlpApplication.nlpInsights && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                    <strong>AI Insights:</strong> {selectedNlpApplication.nlpInsights}
                  </div>
                )}
                {selectedNlpApplication.topSkills && selectedNlpApplication.topSkills.length > 0 && (
                  <div>
                    <strong>Top Skills:</strong> {selectedNlpApplication.topSkills.join(', ')}
                  </div>
                )}
                {selectedNlpApplication.jobMatchHighlights && selectedNlpApplication.jobMatchHighlights.length > 0 && (
                  <div>
                    <strong>Job Match Highlights:</strong>
                    <ul className="list-disc ml-6">
                      {selectedNlpApplication.jobMatchHighlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button className="w-full mt-2" onClick={() => setSelectedNlpApplication(null)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}