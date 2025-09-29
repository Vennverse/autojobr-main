import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import InterviewAssignmentModal from "@/components/InterviewAssignmentModal";
import AssignedInterviewsTable from "@/components/AssignedInterviewsTable";

interface StatsData {
  totalAssigned: number;
  completed: number;
  pending: number;
  averageScore: number;
  virtualInterviews: number;
  mockInterviews: number;
}

export default function InterviewAssignments() {
  const { toast } = useToast();
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedInterviewType, setSelectedInterviewType] = useState<'virtual' | 'mock' | 'skills-verification' | 'personality' | 'simulation' | 'video-interview'>('virtual');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);
  const [linkGeneration, setLinkGeneration] = useState({
    jobPostingId: '',
    interviewType: 'virtual' as 'virtual' | 'mock' | 'skills-verification' | 'personality' | 'simulation' | 'video-interview',
    role: '',
    company: '',
    difficulty: 'medium',
    expiresInDays: 7
  });

  // Fetch candidates (job seekers)
  const { data: candidates = [] } = useQuery({
    queryKey: ['/api/users/candidates'],
    queryFn: async () => {
      const response = await fetch('/api/users/candidates');
      if (!response.ok) throw new Error('Failed to fetch candidates');
      return response.json();
    }
  });

  // Fetch job postings
  const { data: jobPostings = [] } = useQuery({
    queryKey: ['/api/jobs/postings'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/postings');
      if (!response.ok) throw new Error('Failed to fetch job postings');
      return response.json();
    }
  });

  // Fetch interview assignment stats
  const { data: stats } = useQuery({
    queryKey: ['/api/interviews/stats', refreshKey],
    queryFn: async () => {
      const response = await fetch('/api/interviews/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const openAssignmentModal = (type: 'virtual' | 'mock' | 'skills-verification' | 'personality' | 'simulation' | 'video-interview') => {
    setSelectedInterviewType(type);
    setShowAssignmentModal(true);
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
      const response = await fetch('/api/interviews/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(linkGeneration)
      });

      const data = await response.json();

      if (response.ok) {
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
    mockInterviews: 0
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Assignments</h1>
          <p className="text-gray-600">Assign and manage virtual AI interviews and mock coding tests</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => openAssignmentModal('virtual')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Video className="h-4 w-4 mr-2" />
            Virtual Interview
          </Button>
          <Button 
            onClick={() => openAssignmentModal('mock')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Code className="h-4 w-4 mr-2" />
            Mock Interview
          </Button>
          <Button 
            onClick={() => openAssignmentModal('skills-verification')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Award className="h-4 w-4 mr-2" />
            Skills Test
          </Button>
          <Button 
            onClick={() => openAssignmentModal('personality')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Personality
          </Button>
          <Button 
            onClick={() => openAssignmentModal('simulation')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Simulation
          </Button>
          <Button 
            onClick={() => openAssignmentModal('video-interview')}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Video Interview
          </Button>
          <Button 
            onClick={() => setShowLinkModal(true)}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Shareable Link
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-2xl font-bold">{currentStats.totalAssigned}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{currentStats.completed}</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{currentStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold">{currentStats.averageScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interview Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              Virtual AI Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {currentStats.virtualInterviews}
            </div>
            <p className="text-sm text-gray-600">
              Conversational AI interviews with real-time feedback and scoring
            </p>
            <div className="mt-4">
              <Button 
                onClick={() => openAssignmentModal('virtual')}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Virtual Interview
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-600" />
              Mock Coding Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {currentStats.mockInterviews}
            </div>
            <p className="text-sm text-gray-600">
              Technical coding challenges with live code execution and AI evaluation
            </p>
            <div className="mt-4">
              <Button 
                onClick={() => openAssignmentModal('mock')}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Mock Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Assignment Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Recruiter-Only Results
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Detailed interview results are only visible to recruiters, candidates see limited summary
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Email Notifications
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Automatic email notifications sent to candidates with interview details and deadlines
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Shareable Links */}
      {generatedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Shareable Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{link.role || 'Interview'}</div>
                    <div className="text-sm text-gray-500">
                      Type: {link.interviewType} • Expires: {new Date(link.expiresAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-mono">
                      {link.shareableLink}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(link.shareableLink)}
                    variant="outline"
                  >
                    Copy Link
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Interviews Table */}
      <AssignedInterviewsTable key={refreshKey} />

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
            <DialogDescription>
              Create a shareable link that candidates can use to take interviews without being assigned directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job Posting (Optional)</Label>
              <Select
                value={linkGeneration.jobPostingId}
                onValueChange={(value) => {
                  const selectedJob = jobPostings.find(job => job.id === Number(value));
                  setLinkGeneration(prev => ({
                    ...prev,
                    jobPostingId: value,
                    role: selectedJob?.title || prev.role,
                    company: selectedJob?.company || prev.company
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job posting (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific job</SelectItem>
                  {jobPostings.map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.company}
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
              <Label>Role</Label>
              <Input
                value={linkGeneration.role}
                onChange={(e) => setLinkGeneration(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div>
              <Label>Company (Optional)</Label>
              <Input
                value={linkGeneration.company}
                onChange={(e) => setLinkGeneration(prev => ({ ...prev, company: e.target.value }))}
                placeholder="e.g., Tech Corp"
              />
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowLinkModal(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={generateShareableLink}>
                Generate Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}