
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Send, 
  Users,
  Briefcase,
  Link2,
  Copy,
  CheckCircle,
  AlertCircle,
  Mail,
  MessageCircle
} from "lucide-react";
import { SiLinkedin } from "react-icons/si";

interface ScheduleFormData {
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  interviewType: 'virtual' | 'mock' | 'video-interview' | 'personality' | 'skills-verification' | 'simulation';
  jobPostingId?: number;
  role: string;
  company: string;
  scheduledDate?: Date;
  scheduledTime: string;
  duration: number;
  meetingLink: string;
  difficulty: 'easy' | 'medium' | 'hard';
  instructions: string;
  sendCalendarInvite: boolean;
  postToLinkedIn: boolean;
}

export default function InterviewScheduling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  
  const [scheduleData, setScheduleData] = useState<ScheduleFormData>({
    candidateId: "",
    candidateEmail: "",
    candidateName: "",
    interviewType: "virtual",
    role: "",
    company: "",
    scheduledTime: "",
    duration: 30,
    meetingLink: "",
    difficulty: "medium",
    instructions: "",
    sendCalendarInvite: true,
    postToLinkedIn: false
  });

  // Fetch candidates
  const { data: candidates = [] } = useQuery({
    queryKey: ['/api/users/candidates'],
    queryFn: () => apiRequest('/api/users/candidates', 'GET')
  });

  // Fetch job postings
  const { data: jobPostings = [] } = useQuery({
    queryKey: ['/api/recruiter/jobs'],
    queryFn: () => apiRequest('/api/recruiter/jobs', 'GET')
  });

  // Fetch scheduled interviews
  const { data: scheduledInterviews = [] } = useQuery({
    queryKey: ['/api/interviews/scheduled'],
    queryFn: () => apiRequest('/api/interviews/scheduled', 'GET')
  });

  // Schedule interview mutation
  const scheduleInterviewMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const endpoint = data.interviewType === 'virtual' 
        ? '/api/chat-interview/assign'
        : data.interviewType === 'mock'
        ? '/api/interviews/mock/assign'
        : '/api/interviews/assign';

      const payload = {
        candidateId: data.candidateId,
        jobPostingId: data.jobPostingId,
        interviewType: data.interviewType,
        role: data.role,
        company: data.company,
        difficulty: data.difficulty,
        duration: data.duration,
        dueDate: selectedDate ? new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          parseInt(data.scheduledTime.split(':')[0]),
          parseInt(data.scheduledTime.split(':')[1])
        ).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: data.instructions,
        meetingLink: data.meetingLink,
        sendCalendarInvite: data.sendCalendarInvite
      };

      return await apiRequest(endpoint, 'POST', payload);
    },
    onSuccess: async (result, variables) => {
      toast({
        title: "Interview Scheduled",
        description: "Interview has been scheduled and notification sent to candidate"
      });

      // Post to LinkedIn if requested
      if (variables.postToLinkedIn) {
        try {
          await apiRequest('/api/integrations/post/linkedin', 'POST', {
            title: `${variables.role} Interview Scheduled`,
            description: `We're excited to announce an interview opportunity for ${variables.role} at ${variables.company}. Our hiring process includes cutting-edge AI interviews to ensure the best candidate experience.`,
            location: variables.company,
            company: variables.company
          });
          
          toast({
            title: "Posted to LinkedIn",
            description: "Interview announcement shared on LinkedIn"
          });
        } catch (error) {
          console.error('LinkedIn posting failed:', error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/interviews/scheduled'] });
      setShowScheduleDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule interview",
        variant: "destructive"
      });
    }
  });

  // Generate shareable link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/interviews/generate-link', 'POST', {
        interviewType: scheduleData.interviewType,
        interviewConfig: JSON.stringify({
          role: scheduleData.role,
          company: scheduleData.company,
          difficulty: scheduleData.difficulty,
          duration: scheduleData.duration
        }),
        expiryDays: 7,
        jobPostingId: scheduleData.jobPostingId
      });
    },
    onSuccess: (data) => {
      setGeneratedLink(data.link);
      toast({
        title: "Link Generated",
        description: "Shareable interview link created successfully"
      });
    }
  });

  const resetForm = () => {
    setScheduleData({
      candidateId: "",
      candidateEmail: "",
      candidateName: "",
      interviewType: "virtual",
      role: "",
      company: "",
      scheduledTime: "",
      duration: 30,
      meetingLink: "",
      difficulty: "medium",
      instructions: "",
      sendCalendarInvite: true,
      postToLinkedIn: false
    });
    setSelectedDate(undefined);
    setSelectedTime("");
    setGeneratedLink("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard"
    });
  };

  const handleCandidateSelect = (candidateId: string) => {
    const candidate = candidates.find((c: any) => c.id === candidateId);
    if (candidate) {
      setScheduleData(prev => ({
        ...prev,
        candidateId: candidate.id,
        candidateEmail: candidate.email,
        candidateName: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim()
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <RecruiterNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Interview Scheduling</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Schedule interviews, generate shareable links, and manage your interview calendar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule New Interview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6" />
                  Schedule New Interview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Candidate Selection */}
                  <div>
                    <Label>Select Candidate</Label>
                    <Select 
                      value={scheduleData.candidateId} 
                      onValueChange={handleCandidateSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map((candidate: any) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.firstName || candidate.email} - {candidate.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interview Type */}
                  <div>
                    <Label>Interview Type</Label>
                    <Select 
                      value={scheduleData.interviewType} 
                      onValueChange={(value: any) => setScheduleData(prev => ({ ...prev, interviewType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">🤖 Virtual AI Interview</SelectItem>
                        <SelectItem value="mock">💻 Mock Coding Test</SelectItem>
                        <SelectItem value="video-interview">📹 Video Interview</SelectItem>
                        <SelectItem value="personality">🧠 Personality Assessment</SelectItem>
                        <SelectItem value="skills-verification">🎯 Skills Verification</SelectItem>
                        <SelectItem value="simulation">🎮 Work Simulation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Role */}
                    <div>
                      <Label>Role</Label>
                      <Input
                        value={scheduleData.role}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>

                    {/* Company */}
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={scheduleData.company}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={scheduleData.scheduledTime}
                          onChange={(e) => setScheduleData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Select
                          value={scheduleData.duration.toString()}
                          onValueChange={(value) => setScheduleData(prev => ({ ...prev, duration: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Difficulty</Label>
                        <Select
                          value={scheduleData.difficulty}
                          onValueChange={(value: any) => setScheduleData(prev => ({ ...prev, difficulty: value }))}
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
                    </div>
                  </div>

                  {/* Meeting Link */}
                  <div>
                    <Label>Meeting Link (Optional)</Label>
                    <Input
                      value={scheduleData.meetingLink}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, meetingLink: e.target.value }))}
                      placeholder="Google Meet / Zoom / Teams link"
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <Label>Instructions for Candidate</Label>
                    <Textarea
                      value={scheduleData.instructions}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="Additional instructions or preparation notes..."
                      rows={3}
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="calendar"
                        checked={scheduleData.sendCalendarInvite}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, sendCalendarInvite: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="calendar" className="cursor-pointer">
                        Send Google Calendar Invite
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="linkedin"
                        checked={scheduleData.postToLinkedIn}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, postToLinkedIn: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="linkedin" className="cursor-pointer">
                        Post announcement to LinkedIn
                      </Label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => scheduleInterviewMutation.mutate(scheduleData)}
                      disabled={!scheduleData.candidateId || !scheduleData.role || scheduleInterviewMutation.isPending}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {scheduleInterviewMutation.isPending ? "Scheduling..." : "Schedule & Send Invite"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateLinkMutation.mutate()}
                      disabled={!scheduleData.role || generateLinkMutation.isPending}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Generate Link
                    </Button>
                  </div>

                  {/* Generated Link */}
                  {generatedLink && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-green-800 dark:text-green-200">Shareable Interview Link</Label>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedLink)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input value={generatedLink} readOnly className="font-mono text-sm" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Interviews */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Upcoming Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduledInterviews.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No scheduled interviews
                    </p>
                  ) : (
                    scheduledInterviews.map((interview: any) => (
                      <div key={interview.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{interview.candidateName}</p>
                            <p className="text-xs text-gray-500">{interview.role}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {interview.interviewType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(interview.scheduledAt).toLocaleDateString()}
                          <Clock className="w-3 h-3 ml-2" />
                          {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {interview.meetingLink && (
                          <Button size="sm" variant="ghost" className="w-full text-xs" asChild>
                            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                              <Video className="w-3 h-3 mr-1" />
                              Join Meeting
                            </a>
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Scheduled</span>
                    <Badge>{scheduledInterviews.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Week</span>
                    <Badge variant="outline">
                      {scheduledInterviews.filter((i: any) => 
                        new Date(i.scheduledAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      ).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
