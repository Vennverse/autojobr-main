import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import {
  Mail,
  Calendar,
  CheckSquare,
  Users,
  TrendingUp,
  Send,
  Clock,
  Star,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UnifiedAtsPlatform() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [bulkEmailTemplate, setBulkEmailTemplate] = useState<string>("rejection");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedApplicationForSchedule, setSelectedApplicationForSchedule] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewType, setInterviewType] = useState("video");
  const [interviewDuration, setInterviewDuration] = useState("60");
  const [meetingLink, setMeetingLink] = useState("");
  const [filterJob, setFilterJob] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/ats/unified-dashboard"],
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/recruiter/applications"],
  });

  const bulkEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/ats/bulk-email", "POST", data);
    },
    onSuccess: (result) => {
      toast({
        title: "Bulk Email Sent",
        description: `Successfully sent ${result.sent} emails. ${result.failed} failed.`,
      });
      setSelectedApplications([]);
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send bulk emails",
        variant: "destructive",
      });
    },
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/ats/schedule-interview", "POST", data);
    },
    onSuccess: (result) => {
      toast({
        title: "Interview Scheduled",
        description: result.calendarEventCreated
          ? "Interview scheduled and added to your calendar!"
          : "Interview scheduled successfully!",
      });
      setScheduleDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule interview",
        variant: "destructive",
      });
    },
  });

  const handleSelectApplication = (appId: number) => {
    setSelectedApplications(prev =>
      prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredApplications.map((app: any) => app.id);
    if (selectedApplications.length === filteredIds.length && filteredIds.length > 0) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredIds);
    }
  };

  const handleBulkEmail = () => {
    if (selectedApplications.length === 0) {
      toast({
        title: "No Candidates Selected",
        description: "Please select at least one candidate to send emails",
        variant: "destructive",
      });
      return;
    }

    bulkEmailMutation.mutate({
      applicationIds: selectedApplications,
      template: bulkEmailTemplate,
      customSubject: bulkEmailTemplate === "custom" ? customSubject : undefined,
      customBody: bulkEmailTemplate === "custom" ? customBody : undefined,
    });
  };

  const handleScheduleInterview = () => {
    if (!selectedApplicationForSchedule || !interviewDate || !interviewTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const dateTime = new Date(`${interviewDate}T${interviewTime}`);

    scheduleInterviewMutation.mutate({
      applicationId: selectedApplicationForSchedule.id,
      interviewDate: dateTime.toISOString(),
      interviewType,
      duration: parseInt(interviewDuration),
      meetingLink: meetingLink || undefined,
      interviewers: [user?.id],
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "interview_scheduled":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "screening":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "interview_scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "screening":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <RecruiterNavbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};

  const filteredApplications = applications.filter((app: any) => {
    if (filterJob !== "all" && app.jobTitle !== filterJob) return false;
    if (filterStatus !== "all" && app.status !== filterStatus) return false;
    return true;
  });

  const uniqueJobs = Array.from(new Set(applications.map((app: any) => app.jobTitle).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(applications.map((app: any) => app.status).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <RecruiterNavbar user={user} />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-8 h-8 text-blue-600" />
              Unified ATS Platform
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              All your recruitment tools in one place - better than Greenhouse & Workday
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalApplications || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                New Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.newApplications || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Interviews Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.interviewsScheduled || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Offers Extended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats.offersExtended || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="applications" data-testid="tab-applications">
              <Users className="w-4 h-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="bulk-email" data-testid="tab-bulk-email">
              <Mail className="w-4 h-4 mr-2" />
              Bulk Email
            </TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="scorecards" data-testid="tab-scorecards">
              <CheckSquare className="w-4 h-4 mr-2" />
              Scorecards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>All Applications</CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <Label>Select All</Label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Filter by Job</Label>
                    <Select value={filterJob} onValueChange={setFilterJob}>
                      <SelectTrigger data-testid="select-filter-job">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {uniqueJobs.map((job: string) => (
                          <SelectItem key={job} value={job}>{job}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filter by Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger data-testid="select-filter-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map((status: string) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredApplications.map((app: any) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      data-testid={`application-${app.id}`}
                    >
                      <Checkbox
                        checked={selectedApplications.includes(app.id)}
                        onCheckedChange={() => handleSelectApplication(app.id)}
                        data-testid={`checkbox-application-${app.id}`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {app.candidateName || "Unknown Candidate"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {app.jobTitle || "Unknown Position"} • Applied {new Date(app.appliedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={getStatusColor(app.status || "new")}>
                        {getStatusIcon(app.status || "new")}
                        <span className="ml-1">{app.status || "new"}</span>
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApplicationForSchedule(app);
                          setScheduleDialogOpen(true);
                        }}
                        data-testid={`button-schedule-${app.id}`}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  ))}
                  {filteredApplications.length === 0 && applications.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No applications yet
                    </div>
                  )}
                  {filteredApplications.length === 0 && applications.length > 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No applications match the selected filters. Try adjusting your filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Bulk Emails</CardTitle>
                <CardDescription>
                  Send professional emails to multiple candidates at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Selected Candidates: {selectedApplications.length}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Select candidates from the Applications tab first
                  </p>
                </div>

                <div>
                  <Label>Email Template</Label>
                  <Select value={bulkEmailTemplate} onValueChange={setBulkEmailTemplate}>
                    <SelectTrigger data-testid="select-email-template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rejection">Rejection Email</SelectItem>
                      <SelectItem value="acceptance">Acceptance/Offer Email</SelectItem>
                      <SelectItem value="interview_invite">Interview Invitation</SelectItem>
                      <SelectItem value="custom">Custom Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkEmailTemplate === "custom" && (
                  <>
                    <div>
                      <Label>Subject Line</Label>
                      <Input
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Email subject"
                        data-testid="input-custom-subject"
                      />
                    </div>
                    <div>
                      <Label>Email Body</Label>
                      <Textarea
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        placeholder="Email content..."
                        rows={6}
                        data-testid="textarea-custom-body"
                      />
                    </div>
                  </>
                )}

                <Button
                  onClick={handleBulkEmail}
                  disabled={selectedApplications.length === 0 || bulkEmailMutation.isPending}
                  className="w-full"
                  data-testid="button-send-bulk-email"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {bulkEmailMutation.isPending ? "Sending..." : `Send to ${selectedApplications.length} Candidates`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendar Integration</CardTitle>
                <CardDescription>
                  Sync interviews with Gmail/Outlook calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-blue-900 dark:text-blue-200">
                        Google Calendar Connected
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Interviews are automatically synced to your calendar
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    When you schedule an interview from the Applications tab, it will automatically
                    be added to your Google Calendar with all the details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorecards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collaborative Scorecards</CardTitle>
                <CardDescription>
                  Team-based candidate evaluation integrated with your pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Scorecards Connected</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your collaborative scorecard system is integrated with the candidate pipeline.
                    Scorecard results automatically update candidate status.
                  </p>
                  <Button
                    onClick={() => window.location.href = "/collaborative-hiring-scorecard"}
                    data-testid="button-view-scorecards"
                  >
                    View Scorecards
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent data-testid="dialog-schedule-interview">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Set up an interview and sync it with your calendar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Candidate</Label>
              <Input
                value={selectedApplicationForSchedule?.candidateName || ""}
                disabled
                data-testid="input-candidate-name"
              />
            </div>
            <div>
              <Label>Interview Type</Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger data-testid="select-interview-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone Screen</SelectItem>
                  <SelectItem value="video">Video Interview</SelectItem>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="technical">Technical Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  data-testid="input-interview-date"
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  data-testid="input-interview-time"
                />
              </div>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Select value={interviewDuration} onValueChange={setInterviewDuration}>
                <SelectTrigger data-testid="select-interview-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meeting Link (optional)</Label>
              <Input
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                data-testid="input-meeting-link"
              />
            </div>
            <Button
              onClick={handleScheduleInterview}
              disabled={scheduleInterviewMutation.isPending}
              className="w-full"
              data-testid="button-confirm-schedule"
            >
              {scheduleInterviewMutation.isPending ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
