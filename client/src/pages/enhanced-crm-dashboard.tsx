import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import {
  Users, Building2, Phone, Mail, Calendar, Clock, Plus,
  Search, Target, Zap, TrendingUp, AlertCircle, CheckCircle,
  BarChart3, Activity, Sparkles, Brain, Send, ListTodo,
  Star, MessageSquare, ArrowRight, Award, Briefcase
} from "lucide-react";
import { motion } from "framer-motion";

export default function EnhancedCrmDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isRecruiter = user?.userType === 'recruiter' || user?.currentRole === 'recruiter';

  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/crm/analytics"],
  });

  // Fetch contacts
  const { data: contactsData } = useQuery({
    queryKey: ["/api/crm/contacts", searchTerm],
    queryFn: () => apiRequest(`/api/crm/contacts?search=${searchTerm}`, "GET"),
  });

  // Fetch next best actions
  const { data: nextActionsData } = useQuery({
    queryKey: ["/api/crm/actions/next-best"],
  });

  // Fetch dashboard stats
  const { data: statsData } = useQuery({
    queryKey: ["/api/crm/dashboard-stats"],
  });

  // Auto-create tasks mutation
  const autoCreateTasksMutation = useMutation({
    mutationFn: () => apiRequest("/api/crm/tasks/auto-create", "POST"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/actions/next-best"] });
      toast({
        title: "✅ Tasks Created",
        description: `Created ${data.tasks?.length || 0} follow-up tasks`
      });
    }
  });

  // Generate email mutation
  const generateEmailMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/email/generate", "POST", data),
    onSuccess: (data: any) => {
      toast({
        title: "✉️ Email Generated",
        description: "AI-generated email ready to send"
      });
    }
  });

  // Score contact mutation
  const scoreContactMutation = useMutation({
    mutationFn: (contactId: number) => 
      apiRequest(`/api/crm/contacts/${contactId}/score`, "GET"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      toast({
        title: `📊 Contact Scored: ${data.score?.engagementScore}/100`,
        description: data.score?.insight
      });
    }
  });

  const analytics = analyticsData?.analytics || {};
  const contacts = contactsData?.contacts || [];
  const nextActions = nextActionsData?.actions || [];
  const stats = statsData?.stats || {};

  const getContactTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      recruiter: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      candidate: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      hiring_manager: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      referral: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      colleague: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      client: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <Star className="h-4 w-4 text-red-500 fill-red-500" />;
    if (priority === 'medium') return <Star className="h-4 w-4 text-yellow-500" />;
    return <Star className="h-4 w-4 text-gray-300" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {isRecruiter ? <RecruiterNavbar user={user as any} /> : <Navbar />}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-600" />
              {isRecruiter ? 'Recruitment' : 'Relationship'} CRM
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered contact management • Built for {isRecruiter ? 'recruiters' : 'job seekers'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => autoCreateTasksMutation.mutate()}
              variant="outline"
              data-testid="button-auto-tasks"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Auto-Create Tasks
            </Button>
            <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-contact">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>Create a new contact in your CRM</DialogDescription>
                </DialogHeader>
                {/* Contact form will go here */}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="contacts" data-testid="tab-contacts">
              <Users className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">
              <Zap className="h-4 w-4 mr-2" />
              Next Actions
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <Activity className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="card-total-contacts">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {analytics.overview?.totalContacts || 0}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-active-contacts">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active (30d)</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {analytics.overview?.activeContacts || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-follow-ups">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Follow-ups Due</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {analytics.overview?.followUpDue || 0}
                      </p>
                    </div>
                    <AlertCircle className="h-10 w-10 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-response-rate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Response Rate</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {analytics.overview?.responseRate || 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Role-Specific Metrics */}
            {isRecruiter && analytics.roleSpecific && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card data-testid="card-candidates">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Recruitment Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Candidates in Pipeline</span>
                        <span className="font-bold">{analytics.roleSpecific.candidatesInPipeline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Placements This Month</span>
                        <span className="font-bold text-green-600">{analytics.roleSpecific.placementsThisMonth}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!isRecruiter && analytics.roleSpecific && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card data-testid="card-applications">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Job Search Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Applications in Pipeline</span>
                        <span className="font-bold">{analytics.roleSpecific.applicationsInPipeline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Interviews This Week</span>
                        <span className="font-bold text-blue-600">{analytics.roleSpecific.interviewsThisWeek}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contact List</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search-contacts"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contacts.map((contact: any) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`card-contact-${contact.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getPriorityIcon(contact.priority)}
                            <h3 className="font-semibold text-lg">{contact.name}</h3>
                            <Badge className={getContactTypeColor(contact.contactType)}>
                              {contact.contactType.replace('_', ' ')}
                            </Badge>
                            {contact.customFields?.engagementScore && (
                              <Badge variant="outline">
                                <Activity className="h-3 w-3 mr-1" />
                                Score: {contact.customFields.engagementScore}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            {contact.company && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {contact.company}
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {contact.email}
                              </div>
                            )}
                            {contact.interactionCount > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {contact.interactionCount} interactions
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => scoreContactMutation.mutate(contact.id)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                            data-testid={`button-score-${contact.id}`}
                          >
                            <Brain className="h-4 w-4 mr-1" />
                            AI Score
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowEmailDialog(true);
                            }}
                            data-testid={`button-email-${contact.id}`}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No contacts yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Add your first contact to start building your network
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Next Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI-Recommended Next Actions
                </CardTitle>
                <CardDescription>
                  Smart suggestions based on your contacts and interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nextActions.map((action: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      data-testid={`action-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          action.priority === 'high' ? 'bg-red-100' : 
                          action.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          {action.type === 'follow_up' && <Phone className="h-5 w-5" />}
                          {action.type === 'engage' && <MessageSquare className="h-5 w-5" />}
                          {action.type === 'pipeline_action' && <TrendingUp className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold">{action.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" data-testid={`button-action-${index}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {nextActions.length === 0 && (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        All caught up!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No urgent actions at the moment
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interaction Analytics</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.interactionsByType?.map((item: any) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="capitalize">{item.type}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-64 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.count / (analytics.overview?.interactionsLast30Days || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="font-bold w-12 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
