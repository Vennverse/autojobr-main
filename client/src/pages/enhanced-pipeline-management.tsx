import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Video,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Target,
  RefreshCw,
  MessageCircle,
  Filter,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  LayoutGrid,
  List,
  Brain,
  Zap,
  AlertTriangle
} from "lucide-react";

// Define types
interface Candidate {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  summary?: string;
  location?: string;
  education?: string;
}

interface Job {
  id: string;
  title: string;
  company?: string;
  location?: string;
}

interface Application {
  id: string;
  candidate: Candidate;
  job: Job;
  status: string;
  appliedAt: string;
  fitScore?: number;
  recruiterNotes?: string;
}

// Pipeline stages
const PIPELINE_STAGES = [
  { id: 'applied', name: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { id: 'screening', name: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'interview', name: 'Interview', color: 'bg-purple-100 text-purple-800' },
  { id: 'offer', name: 'Offer', color: 'bg-green-100 text-green-800' },
  { id: 'hired', name: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'rejected', name: 'Rejected', color: 'bg-red-100 text-red-800' }
];

// AI Analysis Functions
const extractSkills = (text: string): string[] => {
  const skillPatterns = [
    /\b(?:JavaScript|TypeScript|Python|React|Node\.js|SQL|HTML|CSS|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Kotlin|Swift)\b/gi,
    /\b(?:AWS|Azure|GCP|Docker|Kubernetes|Jenkins|Git|Linux|MongoDB|PostgreSQL|MySQL|Redis)\b/gi,
    /\b(?:Machine Learning|AI|Data Science|Analytics|Statistics|Excel|Tableau|PowerBI)\b/gi,
  ];
  
  const skills = new Set<string>();
  skillPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => skills.add(match));
  });
  
  return Array.from(skills).slice(0, 8);
};

const calculateExperience = (text: string): number => {
  const patterns = [
    /(\d+)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
    /(?:experience|exp).*?(\d+)\s*\+?\s*(?:years?|yrs?)/gi,
    /(\d+)\s*\+?\s*(?:years?|yrs?)/gi
  ];
  
  let maxExperience = 0;
  
  patterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      let years = parseInt(match[1]);
      if (!isNaN(years)) {
        const weight = match[0].includes('+') ? 1.2 : 1.0;
        years = years * weight;
        maxExperience = Math.max(maxExperience, years);
      }
    });
  });
  
  return Math.min(maxExperience, 30);
};

const detectSeniority = (experience: number, text: string): string => {
  const seniorKeywords = ['senior', 'lead', 'principal', 'architect', 'manager', 'director'];
  const hasSeniorTitle = seniorKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
  
  if (experience >= 8 || hasSeniorTitle) return 'Senior';
  if (experience >= 4) return 'Mid-level';
  if (experience >= 1) return 'Junior';
  return 'Entry-level';
};

const scoreEducation = (education: string): { score: number; degree: string } => {
  const educationLower = education.toLowerCase();
  
  let score = 50; // Base score
  let degree = 'Other';
  
  // Degree scoring
  if (educationLower.includes('phd') || educationLower.includes('doctorate')) {
    score += 30;
    degree = 'PhD';
  } else if (educationLower.includes('master') || educationLower.includes('mba')) {
    score += 20;
    degree = 'Master\'s';
  } else if (educationLower.includes('bachelor') || educationLower.includes('bs ') || educationLower.includes('ba ')) {
    score += 15;
    degree = 'Bachelor\'s';
  }
  
  // Institution prestige boost
  const prestigeInstitutions = [
    'mit', 'stanford', 'harvard', 'berkeley', 'caltech', 'princeton', 'yale',
    'columbia', 'university of chicago', 'cornell', 'pennsylvania', 'dartmouth'
  ];
  
  if (prestigeInstitutions.some(inst => educationLower.includes(inst))) {
    score += 15;
  }
  
  return { score: Math.min(score, 100), degree };
};

const analyzeCandidate = (candidate: Candidate, application: Application) => {
  const fullText = `${candidate.summary || ''} ${candidate.education || ''}`.toLowerCase();
  
  // Extract skills
  const topSkills = extractSkills(fullText);
  
  // Calculate experience
  const totalExperience = calculateExperience(fullText);
  const seniorityLevel = detectSeniority(totalExperience, fullText);
  
  // Education analysis
  const { score: educationScore, degree: highestDegree } = candidate.education 
    ? scoreEducation(candidate.education) 
    : { score: 50, degree: 'Not specified' };
  
  // Calculate fit score based on multiple factors
  const skillScore = Math.min(topSkills.length * 8, 40); // Max 40 points for skills
  const experienceScore = Math.min(totalExperience * 3, 30); // Max 30 points for experience
  const educationWeight = Math.min(educationScore * 0.3, 30); // Max 30 points for education
  
  const fitScore = Math.round(skillScore + experienceScore + educationWeight);
  
  // Generate insights
  const strengths = [];
  const riskFactors = [];
  const interviewFocus = [];
  
  if (topSkills.length >= 5) strengths.push('Strong technical skill set');
  if (totalExperience >= 5) strengths.push('Extensive experience');
  if (educationScore >= 80) strengths.push('Excellent educational background');
  
  if (topSkills.length < 3) riskFactors.push('Limited technical skills mentioned');
  if (totalExperience < 2) riskFactors.push('Entry-level experience');
  
  interviewFocus.push('Technical competency assessment');
  if (seniorityLevel === 'Senior') interviewFocus.push('Leadership capabilities');
  interviewFocus.push('Cultural fit evaluation');
  
  const nlpInsights = `AI Analysis: ${seniorityLevel} professional with ${totalExperience} years of experience. 
    ${topSkills.length > 0 ? `Strong in ${topSkills.slice(0, 3).join(', ')}.` : 'Technical skills need clarification.'} 
    ${educationScore >= 70 ? 'Excellent educational background.' : 'Standard educational qualifications.'}`;
  
  return {
    ...application,
    fitScore,
    totalExperience,
    seniorityLevel,
    topSkills,
    highestDegree,
    educationScore,
    strengths,
    riskFactors,
    interviewFocus,
    nlpInsights,
    matchedSkills: topSkills.slice(0, 5) // Simulated job match
  };
};

export default function EnhancedPipelineManagement() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <RecruiterNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">Please log in to access the pipeline management.</p>
            <Button onClick={() => window.location.href = '/auth'} className="mt-4">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch applications
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['/api/recruiter/applications'],
    enabled: !!isAuthenticated
  });

  // Process applications with AI analysis
  const processedApplications = applications.map((app: Application) => 
    analyzeCandidate(app.candidate, app)
  );

  // Filter applications
  const filteredApplications = processedApplications.filter((app: Application) => {
    const matchesSearch = !searchTerm || 
      app.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || app.status === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  // Group applications by stage for Kanban view
  const applicationsByStage = PIPELINE_STAGES.map(stage => ({
    ...stage,
    applications: filteredApplications.filter(app => app.status === stage.id),
    count: filteredApplications.filter(app => app.status === stage.id).length
  }));

  // Bulk selection handlers
  const toggleBulkSelection = (applicationId: string) => {
    const newSelection = new Set(bulkSelection);
    if (newSelection.has(applicationId)) {
      newSelection.delete(applicationId);
    } else {
      newSelection.add(applicationId);
    }
    setBulkSelection(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  // Mutations
  const moveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, newStage, notes }: { applicationId: string; newStage: string; notes?: string }) => {
      return apiRequest(`/api/recruiter/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: { status: newStage, notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/applications'] });
      toast({ title: "Application status updated successfully" });
    }
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ applicationId, note }: { applicationId: string; note: string }) => {
      return apiRequest(`/api/recruiter/applications/${applicationId}/notes`, {
        method: 'POST',
        body: { note }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/applications'] });
      setNoteText('');
      toast({ title: "Note added successfully" });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <RecruiterNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <RecruiterNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-600">Error loading applications. Please try again.</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/recruiter/applications'] })} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <RecruiterNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Brain className="w-8 h-8 text-blue-500" />
                Enhanced Pipeline Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                AI-powered candidate analysis and recruitment pipeline management
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search candidates or jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Applications</p>
                    <p className="text-2xl font-bold">{processedApplications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">High-Fit Candidates</p>
                    <p className="text-2xl font-bold">
                      {processedApplications.filter((app: any) => app.fitScore >= 80).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Hired This Month</p>
                    <p className="text-2xl font-bold">
                      {applicationsByStage.find(s => s.id === 'hired')?.count || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Avg. AI Score</p>
                    <p className="text-2xl font-bold">
                      {Math.round(processedApplications.reduce((acc: number, app: any) => acc + (app.fitScore || 0), 0) / processedApplications.length) || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={bulkSelection.size > 0}
                    onCheckedChange={() => setBulkSelection(new Set())}
                  />
                  <span className="font-medium">
                    {bulkSelection.size} candidate{bulkSelection.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message All
                  </Button>
                  <Button size="sm" variant="outline">
                    <Video className="w-4 h-4 mr-2" />
                    Bulk Interview
                  </Button>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Move to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {viewMode === 'kanban' ? (
          // Kanban View
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {applicationsByStage.map((stage) => {
              const StageIcon = stage.id === 'applied' ? Users :
                              stage.id === 'screening' ? Search :
                              stage.id === 'interview' ? Video :
                              stage.id === 'offer' ? MessageCircle :
                              stage.id === 'hired' ? CheckCircle : RefreshCw;
              
              return (
                <Card key={stage.id} className="h-fit">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StageIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {stage.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stage.count}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                    {stage.applications.map((application: any) => (
                      <div
                        key={application.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => setSelectedApplication(application)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={bulkSelection.has(application.id)}
                              onCheckedChange={() => toggleBulkSelection(application.id)}
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            />
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={application.candidate.profileImageUrl} />
                              <AvatarFallback>
                                {application.candidate.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          {application.fitScore && (
                            <Badge variant="outline" className="text-xs">
                              {application.fitScore}% match
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {application.candidate.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                            {application.candidate.summary || "Candidate"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {application.job.title}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(application.appliedAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(application);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Schedule interview
                              }}
                            >
                              <Video className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          // List View
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <Checkbox
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkSelection(new Set(filteredApplications.map((app: Application) => app.id)));
                            } else {
                              setBulkSelection(new Set());
                            }
                            setShowBulkActions(!!checked && filteredApplications.length > 0);
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        AI Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredApplications.map((application: any) => (
                      <tr
                        key={application.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => setSelectedApplication(application)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={bulkSelection.has(application.id)}
                            onCheckedChange={() => toggleBulkSelection(application.id)}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="w-10 h-10 mr-3">
                              <AvatarImage src={application.candidate.profileImageUrl} />
                              <AvatarFallback>
                                {application.candidate.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {application.candidate.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {application.candidate.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{application.job.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{application.job.company || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={PIPELINE_STAGES.find(s => s.id === application.status)?.color || "bg-gray-100 text-gray-800"}>
                            {PIPELINE_STAGES.find(s => s.id === application.status)?.name || application.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {application.fitScore && (
                            <div className="flex items-center">
                              <Progress value={application.fitScore} className="w-16 mr-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {application.fitScore}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(application);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Schedule interview
                              }}
                            >
                              <Video className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Application Dialog with AI Insights */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedApplication.candidate.name} - Application Details
                  {(selectedApplication as any).fitScore && (
                    <Badge variant="outline" className="ml-auto">
                      {(selectedApplication as any).fitScore}% AI Match
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* AI Insights Section */}
                {(selectedApplication as any).nlpInsights && (
                  <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-900/10">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-500" />
                        AI Analysis & Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {(selectedApplication as any).nlpInsights}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {(selectedApplication as any).strengths && (selectedApplication as any).strengths.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-green-700 dark:text-green-300">Strengths</Label>
                            <div className="space-y-1 mt-1">
                              {(selectedApplication as any).strengths.map((strength: string, index: number) => (
                                <div key={index} className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {strength}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(selectedApplication as any).riskFactors && (selectedApplication as any).riskFactors.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-orange-700 dark:text-orange-300">Risk Factors</Label>
                            <div className="space-y-1 mt-1">
                              {(selectedApplication as any).riskFactors.map((risk: string, index: number) => (
                                <div key={index} className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {risk}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(selectedApplication as any).interviewFocus && (selectedApplication as any).interviewFocus.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Interview Focus</Label>
                            <div className="space-y-1 mt-1">
                              {(selectedApplication as any).interviewFocus.map((focus: string, index: number) => (
                                <div key={index} className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {focus}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Candidate Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Candidate Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={selectedApplication.candidate.profileImageUrl} />
                          <AvatarFallback>
                            {selectedApplication.candidate.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold">{selectedApplication.candidate.name}</h3>
                          <p className="text-gray-600 dark:text-gray-300">{selectedApplication.candidate.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {(selectedApplication as any).seniorityLevel && (
                              <Badge variant="secondary" className="text-xs">
                                {(selectedApplication as any).seniorityLevel}
                              </Badge>
                            )}
                            {(selectedApplication as any).totalExperience !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {(selectedApplication as any).totalExperience} years exp
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {selectedApplication.candidate.location && (
                        <div>
                          <Label className="text-sm font-medium">Location</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {selectedApplication.candidate.location}
                          </p>
                        </div>
                      )}
                      
                      {selectedApplication.candidate.summary && (
                        <div>
                          <Label className="text-sm font-medium">Professional Summary</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {selectedApplication.candidate.summary}
                          </p>
                        </div>
                      )}

                      {selectedApplication.candidate.education && (
                        <div>
                          <Label className="text-sm font-medium">Education</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {selectedApplication.candidate.education}
                          </p>
                          {(selectedApplication as any).highestDegree && (selectedApplication as any).educationScore && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {(selectedApplication as any).highestDegree}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Score: {(selectedApplication as any).educationScore}/100
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {(selectedApplication as any).topSkills && (selectedApplication as any).topSkills.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Top Skills (AI Detected)</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(selectedApplication as any).topSkills.map((skill: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant={(selectedApplication as any).matchedSkills?.includes(skill) ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {skill}
                                {(selectedApplication as any).matchedSkills?.includes(skill) && (
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                )}
                              </Badge>
                            ))}
                          </div>
                          {(selectedApplication as any).matchedSkills && (
                            <p className="text-xs text-gray-500 mt-1">
                              {(selectedApplication as any).matchedSkills.length} skills match job requirements
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Application Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Current Stage</Label>
                        <div className="mt-2">
                          <Badge className={PIPELINE_STAGES.find(s => s.id === selectedApplication.status)?.color || "bg-gray-100 text-gray-800"}>
                            {PIPELINE_STAGES.find(s => s.id === selectedApplication.status)?.name || selectedApplication.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Applied Date</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {(selectedApplication as any).fitScore && (
                        <div>
                          <Label className="text-sm font-medium">AI Compatibility Score</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={(selectedApplication as any).fitScore} className="flex-1" />
                            <span className="text-sm font-medium">{(selectedApplication as any).fitScore}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Based on skills, experience, education, and job requirements
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-sm font-medium">Job Position</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {selectedApplication.job.title}
                        </p>
                        {selectedApplication.job.company && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedApplication.job.company}
                          </p>
                        )}
                        {selectedApplication.job.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedApplication.job.location}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recruiter Notes & Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedApplication.recruiterNotes && (
                      <div>
                        <Label className="text-sm font-medium">Current Notes</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {selectedApplication.recruiterNotes}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-sm font-medium">Add Note</Label>
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note about this candidate..."
                        className="mt-1"
                        rows={3}
                      />
                      <Button
                        onClick={() => addNoteMutation.mutate({ applicationId: selectedApplication.id, note: noteText })}
                        disabled={!noteText.trim() || addNoteMutation.isPending}
                        className="mt-2"
                        size="sm"
                      >
                        {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Select
                      value={statusUpdate}
                      onValueChange={setStatusUpdate}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {statusUpdate && statusUpdate !== selectedApplication.status && (
                      <Button
                        onClick={() => {
                          moveApplicationMutation.mutate({
                            applicationId: selectedApplication.id,
                            newStage: statusUpdate,
                            notes: `Status updated to ${PIPELINE_STAGES.find(s => s.id === statusUpdate)?.name}`
                          });
                          setStatusUpdate("");
                        }}
                        disabled={moveApplicationMutation.isPending}
                        size="sm"
                      >
                        {moveApplicationMutation.isPending ? "Updating..." : "Update Status"}
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Schedule interview
                      }}
                      size="sm"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Schedule Interview
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/chat?user=${selectedApplication.candidate.id}`, '_blank')}
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/api/recruiter/applications/${selectedApplication.id}/resume`, '_blank')}
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Resume
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}