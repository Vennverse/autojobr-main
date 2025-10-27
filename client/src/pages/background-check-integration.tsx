import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Search,
  Download,
  RefreshCw,
  Plus,
  Activity,
  TrendingUp,
  Github,
  Linkedin,
  Mail,
  Phone
} from "lucide-react";
import { motion } from "framer-motion";

interface PublicBackgroundCheck {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateLinkedIn?: string;
  candidateGithub?: string;
  jobTitle: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  requestedAt: string;
  completedAt?: string;
  results: {
    emailVerification: {
      isValid: boolean;
      isDisposable: boolean;
      isFreeEmail: boolean;
      domain: string;
      mxRecords: boolean;
    };
    linkedInProfile?: {
      exists: boolean;
      profileUrl?: string;
      headline?: string;
    };
    githubProfile?: {
      exists: boolean;
      username?: string;
      publicRepos?: number;
      followers?: number;
      accountAge?: number;
      topLanguages?: string[];
    };
    emailDomainReputation?: {
      isLegit: boolean;
      hasWebsite: boolean;
      sslCertificate: boolean;
    };
    phoneValidation?: {
      isValid: boolean;
      country?: string;
      lineType?: string;
    };
    professionalVerification?: {
      hasLinkedIn: boolean;
      hasGithub: boolean;
      hasPortfolio: boolean;
      emailDomainMatch: boolean;
    };
    redFlags: string[];
    trustScore: number;
    recommendation: "hire" | "proceed_with_caution" | "reject";
  };
  cost: number;
}

export default function BackgroundCheckIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewCheckDialog, setShowNewCheckDialog] = useState(false);
  
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateLinkedIn, setCandidateLinkedIn] = useState("");
  const [candidateGithub, setCandidateGithub] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const { data: backgroundChecks = [], isLoading: checksLoading, refetch: refetchChecks } = useQuery<PublicBackgroundCheck[]>({
    queryKey: ["/api/public-background-checks"],
    refetchInterval: 30000,
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["/api/recruiter/candidates/background-eligible"],
  });

  const startCheckMutation = useMutation({
    mutationFn: async (checkData: any) => {
      return apiRequest("/api/public-background-checks/start", {
        method: "POST",
        body: checkData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public-background-checks"] });
      setShowNewCheckDialog(false);
      resetForm();
      toast({
        title: "✅ FREE Background Check Started",
        description: "Public background verification initiated - completely free!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start background check.",
        variant: "destructive",
      });
    }
  });

  const exportResultsMutation = useMutation({
    mutationFn: async (checkId: string) => {
      const response = await fetch(`/api/public-background-checks/${checkId}/export`, {
        method: "GET",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `background-check-${checkId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });

  const resetForm = () => {
    setCandidateName("");
    setCandidateEmail("");
    setCandidateLinkedIn("");
    setCandidateGithub("");
    setCandidatePhone("");
    setJobTitle("");
  };

  const filteredChecks = backgroundChecks.filter((check) => {
    const matchesSearch = !searchTerm || 
      check.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || check.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case "in_progress":
        return { color: "bg-blue-100 text-blue-800", icon: Activity };
      case "completed":
        return { color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "failed":
        return { color: "bg-red-100 text-red-800", icon: XCircle };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: Clock };
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "hire":
        return <Badge className="bg-green-100 text-green-800">✓ Hire</Badge>;
      case "proceed_with_caution":
        return <Badge className="bg-yellow-100 text-yellow-800">⚠ Proceed with Caution</Badge>;
      case "reject":
        return <Badge className="bg-red-100 text-red-800">✗ Reject</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleStartCheck = () => {
    if (!candidateName || !candidateEmail || !jobTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide candidate name, email, and job title.",
        variant: "destructive",
      });
      return;
    }

    const checkData = {
      candidateId: `candidate-${Date.now()}`,
      candidateName,
      candidateEmail,
      candidateLinkedIn: candidateLinkedIn || undefined,
      candidateGithub: candidateGithub || undefined,
      candidatePhone: candidatePhone || undefined,
      jobTitle,
    };

    startCheckMutation.mutate(checkData);
  };

  const selectCandidate = (candidate: any) => {
    setCandidateName(candidate.name);
    setCandidateEmail(candidate.email);
    setJobTitle(candidate.jobTitle || "");
  };

  if (checksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <RecruiterNavbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Background Checks
              </h1>
              <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                100% FREE
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Verify candidates using our own free background check service
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Dialog open={showNewCheckDialog} onOpenChange={setShowNewCheckDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-background-check">
                  <Plus className="w-4 h-4 mr-2" />
                  New Check
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Start Free Background Check</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {candidates.length > 0 && (
                    <div>
                      <Label>Or select from eligible candidates:</Label>
                      <Select onValueChange={(value) => {
                        const candidate = candidates.find((c: any) => c.id === value);
                        if (candidate) selectCandidate(candidate);
                      }}>
                        <SelectTrigger data-testid="select-candidate">
                          <SelectValue placeholder="Select a candidate" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidates.map((candidate: any) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.name} - {candidate.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Candidate Name *</Label>
                    <Input
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="John Doe"
                      data-testid="input-candidate-name"
                    />
                  </div>

                  <div>
                    <Label>Candidate Email *</Label>
                    <Input
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="john@example.com"
                      data-testid="input-candidate-email"
                    />
                  </div>

                  <div>
                    <Label>Job Title *</Label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Software Engineer"
                      data-testid="input-job-title"
                    />
                  </div>

                  <div>
                    <Label>LinkedIn Profile (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      <Input
                        value={candidateLinkedIn}
                        onChange={(e) => setCandidateLinkedIn(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        data-testid="input-linkedin"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>GitHub Username (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      <Input
                        value={candidateGithub}
                        onChange={(e) => setCandidateGithub(e.target.value)}
                        placeholder="username or github.com/username"
                        data-testid="input-github"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Phone Number (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <Input
                        value={candidatePhone}
                        onChange={(e) => setCandidatePhone(e.target.value)}
                        placeholder="+1234567890"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>What we check (100% FREE):</strong>
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                      <li>✓ Email verification & domain reputation</li>
                      <li>✓ LinkedIn profile verification</li>
                      <li>✓ GitHub activity analysis (for tech roles)</li>
                      <li>✓ Professional presence validation</li>
                      <li>✓ Trust score calculation</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewCheckDialog(false);
                        resetForm();
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStartCheck}
                      disabled={startCheckMutation.isPending}
                      data-testid="button-start-check"
                    >
                      {startCheckMutation.isPending ? "Starting..." : "Start Free Check"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={() => refetchChecks()}
              variant="outline"
              data-testid="button-refresh-checks"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Checks</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {backgroundChecks.length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {backgroundChecks.filter(check => check.status === "completed").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {backgroundChecks.filter(check => ["pending", "in_progress"].includes(check.status)).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Cost</p>
                  <p className="text-3xl font-bold text-green-600">
                    $0
                  </p>
                  <p className="text-xs text-gray-500">Always free!</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search candidates or jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-checks"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredChecks.map((check) => {
            const statusDisplay = getStatusDisplay(check.status);
            const StatusIcon = statusDisplay.icon;

            return (
              <motion.div
                key={check.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all" data-testid={`card-check-${check.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {check.candidateName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm">{check.candidateName}</h3>
                          <p className="text-xs text-gray-500">{check.jobTitle}</p>
                        </div>
                      </div>
                      <Badge className={statusDisplay.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {check.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Requested:</span>
                        <p className="font-medium">{new Date(check.requestedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Cost:</span>
                        <p className="font-medium text-green-600">${check.cost} (FREE)</p>
                      </div>
                    </div>

                    {check.status === "completed" && check.results && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Trust Score:</span>
                          <span className={`text-2xl font-bold ${getTrustScoreColor(check.results.trustScore)}`}>
                            {check.results.trustScore}/100
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Recommendation:</span>
                          {getRecommendationBadge(check.results.recommendation)}
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Verification Results:</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span>Email Valid:</span>
                              <Badge variant={check.results.emailVerification.isValid ? "default" : "destructive"}>
                                {check.results.emailVerification.isValid ? "Yes" : "No"}
                              </Badge>
                            </div>
                            
                            {check.results.linkedInProfile && (
                              <div className="flex items-center justify-between">
                                <span>LinkedIn:</span>
                                <Badge variant={check.results.linkedInProfile.exists ? "default" : "secondary"}>
                                  {check.results.linkedInProfile.exists ? "Found" : "Not Found"}
                                </Badge>
                              </div>
                            )}
                            
                            {check.results.githubProfile && (
                              <div className="flex items-center justify-between">
                                <span>GitHub:</span>
                                <Badge variant={check.results.githubProfile.exists ? "default" : "secondary"}>
                                  {check.results.githubProfile.exists ? 
                                    `${check.results.githubProfile.publicRepos} repos` : 
                                    "Not Found"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        {check.results.redFlags.length > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs text-yellow-800 dark:text-yellow-200">
                              {check.results.redFlags.length} warning{check.results.redFlags.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => exportResultsMutation.mutate(check.id)}
                          disabled={exportResultsMutation.isPending}
                          data-testid={`button-export-${check.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Report
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filteredChecks.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No background checks found. Start your first free check!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
