import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Search,
  Filter,
  Download,
  RefreshCw,
  Send,
  Eye,
  Settings,
  Plus,
  Upload,
  Calendar,
  Building,
  Gavel,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Hash,
  Star,
  Activity,
  Users,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

interface BackgroundCheck {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  provider: "accurate" | "goodhire" | "certn" | "checkr";
  checkType: "basic" | "standard" | "comprehensive" | "custom";
  requestedAt: string;
  completedAt?: string;
  results?: {
    criminalHistory: {
      status: "clear" | "records_found" | "pending";
      details?: string[];
    };
    employmentVerification: {
      status: "verified" | "discrepancy" | "pending";
      details?: string[];
    };
    educationVerification: {
      status: "verified" | "discrepancy" | "pending";
      details?: string[];
    };
    creditCheck?: {
      status: "good" | "fair" | "poor" | "pending";
      score?: number;
    };
    drugTest?: {
      status: "negative" | "positive" | "pending";
      details?: string;
    };
    professionalLicenses?: {
      status: "verified" | "invalid" | "pending";
      licenses?: Array<{
        type: string;
        number: string;
        status: string;
        expirationDate: string;
      }>;
    };
  };
  cost: number;
  turnaroundTime: number; // in hours
  complianceFlags: string[];
  notes?: string;
}

interface BackgroundCheckProvider {
  id: string;
  name: string;
  logo: string;
  isConfigured: boolean;
  supportedChecks: string[];
  averageTurnaround: string;
  pricing: {
    basic: number;
    standard: number;
    comprehensive: number;
  };
  features: string[];
}

const BACKGROUND_CHECK_PROVIDERS: BackgroundCheckProvider[] = [
  {
    id: "accurate",
    name: "Accurate Background",
    logo: "/api/placeholder/accurate-logo.png",
    isConfigured: false,
    supportedChecks: ["criminal", "employment", "education", "credit", "drug", "licenses"],
    averageTurnaround: "24-72 hours",
    pricing: { basic: 25, standard: 45, comprehensive: 85 },
    features: ["Instant verification", "Compliance dashboard", "API integration", "Custom packages"]
  },
  {
    id: "goodhire",
    name: "GoodHire",
    logo: "/api/placeholder/goodhire-logo.png",
    isConfigured: false,
    supportedChecks: ["criminal", "employment", "education", "drug", "driving"],
    averageTurnaround: "1-3 business days",
    pricing: { basic: 29, standard: 49, comprehensive: 79 },
    features: ["Mobile-friendly", "Real-time updates", "Adverse action support", "FCRA compliance"]
  },
  {
    id: "certn",
    name: "Certn",
    logo: "/api/placeholder/certn-logo.png",
    isConfigured: false,
    supportedChecks: ["criminal", "employment", "education", "credit", "identity"],
    averageTurnaround: "24-48 hours",
    pricing: { basic: 30, standard: 50, comprehensive: 90 },
    features: ["Global coverage", "Blockchain verification", "Smart automation", "Candidate portal"]
  },
  {
    id: "checkr",
    name: "Checkr",
    logo: "/api/placeholder/checkr-logo.png",
    isConfigured: true, // Assume one is already configured
    supportedChecks: ["criminal", "employment", "education", "driving", "drug", "credit"],
    averageTurnaround: "1-2 business days",
    pricing: { basic: 35, standard: 55, comprehensive: 95 },
    features: ["AI-powered accuracy", "Fast turnaround", "Developer-friendly API", "Adjudication tools"]
  }
];

export default function BackgroundCheckIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [showNewCheckDialog, setShowNewCheckDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [checkType, setCheckType] = useState("standard");
  const [customChecks, setCustomChecks] = useState<string[]>([]);

  // Fetch background checks (using FREE public service)
  const { data: backgroundChecks = [], isLoading: checksLoading, refetch: refetchChecks } = useQuery<BackgroundCheck[]>({
    queryKey: ["/api/public-background-checks"],
    refetchInterval: 30000,
  });

  // Fetch candidates eligible for background checks
  const { data: candidates = [] } = useQuery({
    queryKey: ["/api/recruiter/candidates/background-eligible"],
  });

  // Fetch provider configurations
  const { data: providerConfigs = [] } = useQuery({
    queryKey: ["/api/background-checks/providers"],
  });

  // Start background check mutation (FREE public service)
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
      toast({
        title: "FREE Background Check Started",
        description: "Public background verification initiated - no cost!",
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

  // Configure provider mutation
  const configureProviderMutation = useMutation({
    mutationFn: async (providerData: any) => {
      return apiRequest("/api/background-checks/configure-provider", {
        method: "POST",
        body: providerData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/background-checks/providers"] });
      toast({
        title: "Provider Configured",
        description: "Background check provider configured successfully.",
      });
    }
  });

  // Cancel check mutation
  const cancelCheckMutation = useMutation({
    mutationFn: async (checkId: string) => {
      return apiRequest(`/api/background-checks/${checkId}/cancel`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/background-checks"] });
      toast({
        title: "Check Cancelled",
        description: "Background check has been cancelled.",
      });
    }
  });

  // Export results mutation (FREE public service)
  const exportResultsMutation = useMutation({
    mutationFn: async (checkId: string) => {
      const response = await fetch(`/api/public-background-checks/${checkId}/export`, {
        method: "GET",
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `public-background-check-${checkId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });

  // Filter background checks
  const filteredChecks = backgroundChecks.filter((check) => {
    const matchesSearch = !searchTerm || 
      check.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || check.status === statusFilter;
    const matchesProvider = providerFilter === "all" || check.provider === providerFilter;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Get status color and icon
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
      case "cancelled":
        return { color: "bg-gray-100 text-gray-800", icon: XCircle };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: Clock };
    }
  };

  // Handle starting a new background check
  const handleStartCheck = () => {
    if (!selectedCandidate || !selectedProvider || !checkType) {
      toast({
        title: "Missing Information",
        description: "Please select a candidate, provider, and check type.",
        variant: "destructive",
      });
      return;
    }

    const checkData = {
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
      candidateEmail: selectedCandidate.email,
      jobTitle: selectedCandidate.jobTitle,
      provider: selectedProvider,
      checkType,
      customChecks: checkType === "custom" ? customChecks : []
    };

    startCheckMutation.mutate(checkData);
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
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Background Check Integration
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Streamline background verification and compliance screening
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowNewCheckDialog(true)}
              data-testid="button-new-background-check"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Check
            </Button>
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

        {/* Overview Stats */}
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {backgroundChecks.length > 0 ? 
                      Math.round((backgroundChecks.filter(check => check.status === "completed").length / backgroundChecks.length) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="checks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checks">Background Checks</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="checks" className="space-y-6">
            {/* Filters */}
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
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="w-48" data-testid="select-provider-filter">
                      <SelectValue placeholder="All Providers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {BACKGROUND_CHECK_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Background Checks List */}
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
                            <span className="text-gray-600 dark:text-gray-300">Provider:</span>
                            <p className="font-medium capitalize">{check.provider}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-300">Type:</span>
                            <p className="font-medium capitalize">{check.checkType}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-300">Requested:</span>
                            <p className="font-medium">{new Date(check.requestedAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-300">Cost:</span>
                            <p className="font-medium">${check.cost}</p>
                          </div>
                        </div>

                        {check.results && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Results Summary:</h4>
                            <div className="space-y-1">
                              {check.results.criminalHistory && (
                                <div className="flex items-center justify-between text-xs">
                                  <span>Criminal History:</span>
                                  <Badge variant={check.results.criminalHistory.status === "clear" ? "default" : "destructive"} className="text-xs">
                                    {check.results.criminalHistory.status}
                                  </Badge>
                                </div>
                              )}
                              {check.results.employmentVerification && (
                                <div className="flex items-center justify-between text-xs">
                                  <span>Employment:</span>
                                  <Badge variant={check.results.employmentVerification.status === "verified" ? "default" : "secondary"} className="text-xs">
                                    {check.results.employmentVerification.status}
                                  </Badge>
                                </div>
                              )}
                              {check.results.educationVerification && (
                                <div className="flex items-center justify-between text-xs">
                                  <span>Education:</span>
                                  <Badge variant={check.results.educationVerification.status === "verified" ? "default" : "secondary"} className="text-xs">
                                    {check.results.educationVerification.status}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {check.complianceFlags && check.complianceFlags.length > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs text-yellow-700 dark:text-yellow-300">
                              {check.complianceFlags.length} compliance flag{check.complianceFlags.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setSelectedCandidate(check)}
                            data-testid={`button-view-${check.id}`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>

                          {check.status === "completed" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => exportResultsMutation.mutate(check.id)}
                              data-testid={`button-export-${check.id}`}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Export
                            </Button>
                          )}

                          {["pending", "in_progress"].includes(check.status) && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => cancelCheckMutation.mutate(check.id)}
                              data-testid={`button-cancel-${check.id}`}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {filteredChecks.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Background Checks Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Start your first background check by clicking the "New Check" button above.
                  </p>
                  <Button onClick={() => setShowNewCheckDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Start Background Check
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {BACKGROUND_CHECK_PROVIDERS.map((provider) => (
                <Card key={provider.id} className={provider.isConfigured ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{provider.averageTurnaround}</p>
                        </div>
                      </div>
                      <Badge variant={provider.isConfigured ? "default" : "secondary"}>
                        {provider.isConfigured ? "Configured" : "Not Configured"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Pricing</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <p className="font-medium">${provider.pricing.basic}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Basic</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <p className="font-medium">${provider.pricing.standard}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Standard</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <p className="font-medium">${provider.pricing.comprehensive}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Comprehensive</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Supported Checks</h4>
                      <div className="flex flex-wrap gap-1">
                        {provider.supportedChecks.map((check) => (
                          <Badge key={check} variant="outline" className="text-xs">
                            {check}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <ul className="text-sm space-y-1">
                        {provider.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      className="w-full" 
                      variant={provider.isConfigured ? "outline" : "default"}
                      onClick={() => {
                        // Open configuration dialog
                        toast({
                          title: "Provider Configuration",
                          description: `Configure ${provider.name} integration`,
                        });
                      }}
                      data-testid={`button-configure-${provider.id}`}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {provider.isConfigured ? "Reconfigure" : "Configure"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Check Type</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger data-testid="select-default-check-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Auto-approval Threshold</Label>
                  <Select defaultValue="low">
                    <SelectTrigger data-testid="select-auto-approval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No auto-approval</SelectItem>
                      <SelectItem value="low">Low risk only</SelectItem>
                      <SelectItem value="medium">Low-medium risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>FCRA Compliance Mode</Label>
                  <Select defaultValue="strict">
                    <SelectTrigger data-testid="select-fcra-compliance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Background Check Dialog */}
        <Dialog open={showNewCheckDialog} onOpenChange={setShowNewCheckDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Start New Background Check</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Candidate</Label>
                  <Select onValueChange={(value) => {
                    const candidate = candidates.find(c => c.id === value);
                    setSelectedCandidate(candidate);
                  }}>
                    <SelectTrigger data-testid="select-candidate">
                      <SelectValue placeholder="Choose a candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate: any) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.name} - {candidate.jobTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Background Check Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger data-testid="select-provider">
                      <SelectValue placeholder="Choose a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKGROUND_CHECK_PROVIDERS.filter(p => p.isConfigured).map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Check Type</Label>
                <Select value={checkType} onValueChange={setCheckType}>
                  <SelectTrigger data-testid="select-check-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic ($25) - Criminal history only</SelectItem>
                    <SelectItem value="standard">Standard ($45) - Criminal + Employment + Education</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive ($85) - All checks included</SelectItem>
                    <SelectItem value="custom">Custom - Select specific checks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {checkType === "custom" && (
                <div>
                  <Label>Custom Checks</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["criminal", "employment", "education", "credit", "drug", "licenses"].map((check) => (
                      <label key={check} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={customChecks.includes(check)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCustomChecks([...customChecks, check]);
                            } else {
                              setCustomChecks(customChecks.filter(c => c !== check));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{check.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowNewCheckDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleStartCheck}
                  disabled={startCheckMutation.isPending}
                  data-testid="button-start-check"
                >
                  {startCheckMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Start Check
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}