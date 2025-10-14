import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Building2, Phone, Mail, Calendar, Clock, Plus,
  Search, Target, Zap, TrendingUp, AlertCircle, CheckCircle,
  BarChart3, Activity, Sparkles, Brain, Send, ListTodo,
  Star, MessageSquare, ArrowRight, Award, Briefcase, FileText,
  Settings, Workflow, DollarSign, Video, Upload, Download,
  Edit, Trash2, Filter, MoreVertical, Tag, Globe
} from "lucide-react";
import { motion } from "framer-motion";

// Form schemas
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  contactType: z.string().min(1, "Contact type is required"),
  linkedinUrl: z.string().optional(),
  nextTouchDate: z.string().optional(),
  notes: z.string().optional(),
});

const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  linkedinUrl: z.string().optional(),
  description: z.string().optional(),
});

const dealFormSchema = z.object({
  dealName: z.string().min(1, "Deal name is required"),
  dealValue: z.string().optional(),
  stage: z.string().min(1, "Stage is required"),
  expectedCloseDate: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  notes: z.string().optional(),
});

const emailTemplateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  category: z.string().optional(),
});

const meetingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  meetingType: z.string().min(1, "Meeting type is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  contactId: z.string().optional(),
});

export default function EnhancedCrmDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isRecruiter = user?.userType === 'recruiter' || user?.currentRole === 'recruiter';

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [showEmailTemplateDialog, setShowEmailTemplateDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<any>(null);

  // Forms
  const contactForm = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      contactType: "recruiter",
      linkedinUrl: "",
      nextTouchDate: "",
      notes: "",
    },
  });

  const companyForm = useForm({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      domain: "",
      industry: "",
      size: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      linkedinUrl: "",
      description: "",
    },
  });

  const dealForm = useForm({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      dealName: "",
      dealValue: "",
      stage: "prospecting",
      expectedCloseDate: "",
      companyId: "",
      contactId: "",
      notes: "",
    },
  });

  const emailTemplateForm = useForm({
    resolver: zodResolver(emailTemplateFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      category: "follow-up",
    },
  });

  const meetingForm = useForm({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      meetingType: "video",
      startTime: "",
      endTime: "",
      location: "",
      contactId: "",
    },
  });

  // Queries
  const { data: statsData } = useQuery({
    queryKey: ["/api/crm/dashboard-stats"],
  });

  const { data: contactsData } = useQuery({
    queryKey: ["/api/crm/contacts", searchTerm],
    queryFn: () => apiRequest(`/api/crm/contacts?search=${searchTerm}`, "GET"),
  });

  const { data: companiesData } = useQuery({
    queryKey: ["/api/crm/companies"],
  });

  const { data: dealsData } = useQuery({
    queryKey: ["/api/crm/deals"],
  });

  const { data: emailTemplatesData } = useQuery({
    queryKey: ["/api/crm/email-templates"],
  });

  const { data: meetingsData } = useQuery({
    queryKey: ["/api/crm/meetings"],
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["/api/crm/activities"],
  });

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/contacts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/crm/contacts" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard-stats"] });
      setShowContactDialog(false);
      contactForm.reset();
      toast({ title: "✅ Contact created successfully" });
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/companies", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard-stats"] });
      setShowCompanyDialog(false);
      companyForm.reset();
      toast({ title: "✅ Company created successfully" });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/deals", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard-stats"] });
      setShowDealDialog(false);
      dealForm.reset();
      toast({ title: "✅ Deal created successfully" });
    },
  });

  const createEmailTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/email-templates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/email-templates"] });
      setShowEmailTemplateDialog(false);
      emailTemplateForm.reset();
      toast({ title: "✅ Email template created successfully" });
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/meetings", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      setShowMeetingDialog(false);
      meetingForm.reset();
      toast({ title: "✅ Meeting scheduled successfully" });
    },
  });

  const generateEmailWithAIMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/email/generate-ai", "POST", data),
    onSuccess: (data: any) => {
      emailTemplateForm.setValue("body", data.emailBody);
      toast({ title: "🤖 AI email generated!", description: "Review and customize the email" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/email/send", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      toast({ title: "✉️ Email sent successfully" });
    },
  });

  const stats = (statsData as any)?.stats || {};
  const contacts = (contactsData as any)?.contacts || [];
  const companies = (companiesData as any)?.companies || [];
  const deals = (dealsData as any)?.deals || [];
  const emailTemplates = (emailTemplatesData as any)?.templates || [];
  const meetings = (meetingsData as any)?.meetings || [];
  const activities = (activitiesData as any)?.activities || [];

  const handleContactSubmit = contactForm.handleSubmit((data) => {
    createContactMutation.mutate(data);
  });

  const handleCompanySubmit = companyForm.handleSubmit((data) => {
    createCompanyMutation.mutate(data);
  });

  const handleDealSubmit = dealForm.handleSubmit((data) => {
    createDealMutation.mutate({
      ...data,
      dealValue: data.dealValue ? parseFloat(data.dealValue) : null,
      companyId: data.companyId ? parseInt(data.companyId) : null,
      contactId: data.contactId ? parseInt(data.contactId) : null,
    });
  });

  const handleEmailTemplateSubmit = emailTemplateForm.handleSubmit((data) => {
    createEmailTemplateMutation.mutate(data);
  });

  const handleMeetingSubmit = meetingForm.handleSubmit((data) => {
    createMeetingMutation.mutate({
      ...data,
      contactId: data.contactId ? parseInt(data.contactId) : null,
    });
  });

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

  const getDealStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospecting: "bg-gray-500",
      qualification: "bg-blue-500",
      proposal: "bg-indigo-500",
      negotiation: "bg-purple-500",
      "closed-won": "bg-green-500",
      "closed-lost": "bg-red-500",
    };
    return colors[stage] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {isRecruiter ? <RecruiterNavbar user={user as any} /> : <Navbar />}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-10 w-10 text-blue-600" />
              TouchBase CRM
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              HubSpot-level CRM • Built for {isRecruiter ? 'recruiters' : 'job seekers'} • AI-powered automation
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="contacts" data-testid="tab-contacts">
              <Users className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="companies" data-testid="tab-companies">
              <Building2 className="h-4 w-4 mr-2" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="deals" data-testid="tab-deals">
              <DollarSign className="h-4 w-4 mr-2" />
              Deals
            </TabsTrigger>
            <TabsTrigger value="emails" data-testid="tab-emails">
              <Mail className="h-4 w-4 mr-2" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="meetings" data-testid="tab-meetings">
              <Video className="h-4 w-4 mr-2" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="workflows" data-testid="tab-workflows">
              <Workflow className="h-4 w-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="activities" data-testid="tab-activities">
              <Activity className="h-4 w-4 mr-2" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="card-total-contacts">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.totalContacts || 0}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-companies">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Companies</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.totalCompanies || 0}
                      </p>
                    </div>
                    <Building2 className="h-10 w-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-active-deals">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Deals</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.activeDeals || 0}
                      </p>
                    </div>
                    <DollarSign className="h-10 w-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-upcoming-meetings">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Meetings</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.upcomingMeetings || 0}
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => setShowContactDialog(true)} className="h-20" data-testid="button-quick-add-contact">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-6 w-6" />
                      <span>Add Contact</span>
                    </div>
                  </Button>
                  <Button onClick={() => setShowCompanyDialog(true)} className="h-20" variant="outline" data-testid="button-quick-add-company">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-6 w-6" />
                      <span>Add Company</span>
                    </div>
                  </Button>
                  <Button onClick={() => setShowDealDialog(true)} className="h-20" variant="outline" data-testid="button-quick-add-deal">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="h-6 w-6" />
                      <span>Create Deal</span>
                    </div>
                  </Button>
                  <Button onClick={() => setShowMeetingDialog(true)} className="h-20" variant="outline" data-testid="button-quick-schedule-meeting">
                    <div className="flex flex-col items-center gap-2">
                      <Video className="h-6 w-6" />
                      <span>Schedule Meeting</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <p className="text-sm text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No activities yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-contacts"
                />
              </div>
              <Button onClick={() => setShowContactDialog(true)} data-testid="button-add-contact">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact: any) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  data-testid={`card-contact-${contact.id}`}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{contact.name}</h3>
                          <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                        </div>
                        <Badge className={getContactTypeColor(contact.contactType)}>
                          {contact.contactType}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        {contact.company && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="h-4 w-4" />
                            {contact.company}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1" data-testid={`button-email-contact-${contact.id}`}>
                          <Send className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-more-contact-${contact.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {contacts.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
                  <p className="text-gray-600 mb-4">Start building your network by adding your first contact</p>
                  <Button onClick={() => setShowContactDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Companies</h2>
              <Button onClick={() => setShowCompanyDialog(true)} data-testid="button-add-company">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company: any) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow" data-testid={`card-company-${company.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{company.name}</h3>
                        {company.industry && (
                          <p className="text-sm text-gray-600">{company.industry}</p>
                        )}
                      </div>
                      <Building2 className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="space-y-2 text-sm">
                      {company.domain && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Globe className="h-4 w-4" />
                          {company.domain}
                        </div>
                      )}
                      {company.size && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          {company.size} employees
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          {company.phone}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {companies.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
                  <p className="text-gray-600 mb-4">Add companies to track your relationships</p>
                  <Button onClick={() => setShowCompanyDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Deals Pipeline</h2>
              <Button onClick={() => setShowDealDialog(true)} data-testid="button-add-deal">
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
              {['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'].map((stage) => (
                <div key={stage} className="space-y-3">
                  <div className={`p-3 rounded-lg ${getDealStageColor(stage)} text-white font-semibold text-center`}>
                    {stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                  <div className="space-y-2">
                    {deals.filter((deal: any) => deal.stage === stage).map((deal: any) => (
                      <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-deal-${deal.id}`}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-sm">{deal.dealName}</h4>
                          {deal.dealValue && (
                            <p className="text-green-600 font-bold text-lg">${deal.dealValue.toLocaleString()}</p>
                          )}
                          {deal.expectedCloseDate && (
                            <p className="text-xs text-gray-600 mt-2">
                              Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {deals.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No deals yet</h3>
                <p className="text-gray-600 mb-4">Create your first deal to start tracking opportunities</p>
                <Button onClick={() => setShowDealDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deal
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="emails" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Email Templates</h2>
              <Button onClick={() => setShowEmailTemplateDialog(true)} data-testid="button-add-email-template">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emailTemplates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow" data-testid={`card-email-template-${template.id}`}>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">Subject: {template.subject}</p>
                    <Badge variant="outline">{template.category}</Badge>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedEmailTemplate(template)} data-testid={`button-use-template-${template.id}`}>
                        <Send className="h-4 w-4 mr-1" />
                        Use
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-edit-template-${template.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {emailTemplates.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No email templates yet</h3>
                  <p className="text-gray-600 mb-4">Create templates to streamline your outreach</p>
                  <Button onClick={() => setShowEmailTemplateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Meetings</h2>
              <Button onClick={() => setShowMeetingDialog(true)} data-testid="button-add-meeting">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>

            <div className="space-y-3">
              {meetings.map((meeting: any) => (
                <Card key={meeting.id} data-testid={`card-meeting-${meeting.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{meeting.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(meeting.startTime).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <Badge>{meeting.meetingType}</Badge>
                        </div>
                      </div>
                      <Video className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {meetings.length === 0 && (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No meetings scheduled</h3>
                  <p className="text-gray-600 mb-4">Schedule your first meeting</p>
                  <Button onClick={() => setShowMeetingDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-6 w-6" />
                  Workflow Automation
                </CardTitle>
                <CardDescription>
                  Automate your CRM with triggers and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Automation Coming Soon</h3>
                  <p className="text-gray-600 mb-6">
                    Set up automated workflows to save time and never miss a follow-up
                  </p>
                  <Button variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg" data-testid={`activity-${index}`}>
                      <div className="p-2 rounded-full bg-blue-100">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{activity.title}</h4>
                          <p className="text-sm text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        {activity.activityType && (
                          <Badge variant="outline" className="mt-2">{activity.activityType}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No activities yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Analytics & Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-gray-600 mb-6">
                    Get insights into your CRM performance with detailed reports and analytics
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>Create a new contact in your CRM</DialogDescription>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contactForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="input-contact-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@company.com" {...field} data-testid="input-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-contact-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Corp" {...field} data-testid="input-contact-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Recruiter" {...field} data-testid="input-contact-job-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="contactType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="colleague">Colleague</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="candidate">Candidate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/johndoe" {...field} data-testid="input-contact-linkedin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="nextTouchDate"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Next Follow-up Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-contact-followup" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes..." rows={3} {...field} data-testid="textarea-contact-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowContactDialog(false)} data-testid="button-cancel-contact">
                  Cancel
                </Button>
                <Button type="submit" disabled={createContactMutation.isPending} data-testid="button-submit-contact">
                  {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Company Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>Create a new company record</DialogDescription>
          </DialogHeader>
          <Form {...companyForm}>
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="acmecorp.com" {...field} data-testid="input-company-domain" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="Technology" {...field} data-testid="input-company-industry" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-size">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="201-500">201-500</SelectItem>
                          <SelectItem value="501-1000">501-1000</SelectItem>
                          <SelectItem value="1000+">1000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-company-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} data-testid="input-company-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" {...field} data-testid="input-company-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} data-testid="input-company-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/company/acmecorp" {...field} data-testid="input-company-linkedin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Company description..." rows={3} {...field} data-testid="textarea-company-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCompanyDialog(false)} data-testid="button-cancel-company">
                  Cancel
                </Button>
                <Button type="submit" disabled={createCompanyMutation.isPending} data-testid="button-submit-company">
                  {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Deal Dialog */}
      <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <DialogDescription>Track a new sales opportunity</DialogDescription>
          </DialogHeader>
          <Form {...dealForm}>
            <form onSubmit={handleDealSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={dealForm.control}
                  name="dealName"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Deal Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Q4 Partnership Deal" {...field} data-testid="input-deal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dealForm.control}
                  name="dealValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Value ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} data-testid="input-deal-value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dealForm.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-deal-stage">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prospecting">Prospecting</SelectItem>
                          <SelectItem value="qualification">Qualification</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="closed-won">Closed Won</SelectItem>
                          <SelectItem value="closed-lost">Closed Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dealForm.control}
                  name="expectedCloseDate"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Expected Close Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-deal-close-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dealForm.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-deal-company">
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company: any) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dealForm.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-deal-contact">
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts.map((contact: any) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dealForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Deal notes..." rows={3} {...field} data-testid="textarea-deal-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDealDialog(false)} data-testid="button-cancel-deal">
                  Cancel
                </Button>
                <Button type="submit" disabled={createDealMutation.isPending} data-testid="button-submit-deal">
                  {createDealMutation.isPending ? "Creating..." : "Create Deal"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Email Template Dialog */}
      <Dialog open={showEmailTemplateDialog} onOpenChange={setShowEmailTemplateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>Create a reusable email template with AI assistance</DialogDescription>
          </DialogHeader>
          <Form {...emailTemplateForm}>
            <form onSubmit={handleEmailTemplateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={emailTemplateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Follow-up Email" {...field} data-testid="input-template-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailTemplateForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-template-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="introduction">Introduction</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="thank-you">Thank You</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailTemplateForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Subject *</FormLabel>
                      <FormControl>
                        <Input placeholder="Following up on our conversation" {...field} data-testid="input-template-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailTemplateForm.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <div className="flex items-center justify-between">
                        <FormLabel>Email Body *</FormLabel>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const prompt = `Generate a professional ${emailTemplateForm.watch("category")} email template`;
                            generateEmailWithAIMutation.mutate({ prompt, context: emailTemplateForm.watch() });
                          }}
                          disabled={generateEmailWithAIMutation.isPending}
                          data-testid="button-generate-ai-email"
                        >
                          <Brain className="h-4 w-4 mr-1" />
                          {generateEmailWithAIMutation.isPending ? "Generating..." : "Generate with AI"}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Dear {{firstName}},&#10;&#10;I wanted to follow up on...&#10;&#10;Best regards,&#10;{{senderName}}" 
                          rows={10} 
                          {...field} 
                          data-testid="textarea-template-body"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">Use {'{firstName}'}, {'{company}'}, etc. for personalization</p>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEmailTemplateDialog(false)} data-testid="button-cancel-template">
                  Cancel
                </Button>
                <Button type="submit" disabled={createEmailTemplateMutation.isPending} data-testid="button-submit-template">
                  {createEmailTemplateMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>Create a new meeting</DialogDescription>
          </DialogHeader>
          <Form {...meetingForm}>
            <form onSubmit={handleMeetingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={meetingForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Meeting Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Interview with John Doe" {...field} data-testid="input-meeting-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingForm.control}
                  name="meetingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-meeting-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="in-person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingForm.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-meeting-contact">
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts.map((contact: any) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-meeting-start" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-meeting-end" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Location / Meeting Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://zoom.us/j/123456789" {...field} data-testid="input-meeting-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={meetingForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Meeting agenda..." rows={3} {...field} data-testid="textarea-meeting-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowMeetingDialog(false)} data-testid="button-cancel-meeting">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMeetingMutation.isPending} data-testid="button-submit-meeting">
                  {createMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
