import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCrmContactSchema } from "@shared/schema";
import {
  Users, Building2, Phone, Mail, Calendar, Clock, Plus,
  Search, Filter, Tag, TrendingUp, AlertCircle, CheckCircle,
  MoreVertical, Edit, Trash2, MessageSquare, ArrowRight, Target, Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function UnifiedCrmDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isRecruiter = user?.userType === 'recruiter' || user?.currentRole === 'recruiter';

  const [activeTab, setActiveTab] = useState("contacts");
  const [searchTerm, setSearchTerm] = useState("");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false); // State for email composer dialog
  const [emailSubject, setEmailSubject] = useState(''); // State for email subject
  const [emailBody, setEmailBody] = useState(''); // State for email body

  const contactForm = useForm({
    resolver: zodResolver(insertCrmContactSchema.extend({
      name: insertCrmContactSchema.shape.name,
      email: insertCrmContactSchema.shape.email.optional(),
      phone: insertCrmContactSchema.shape.phone.optional(),
      company: insertCrmContactSchema.shape.company.optional(),
      jobTitle: insertCrmContactSchema.shape.jobTitle.optional(),
      linkedinUrl: insertCrmContactSchema.shape.linkedinUrl.optional(),
      contactType: insertCrmContactSchema.shape.contactType,
      notes: insertCrmContactSchema.shape.notes.optional(),
      nextTouchDate: insertCrmContactSchema.shape.nextTouchDate.optional(),
    })),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      linkedinUrl: "",
      contactType: "recruiter",
      notes: "",
      nextTouchDate: "",
    },
  });

  const [interactionForm, setInteractionForm] = useState({
    interactionType: "email",
    subject: "",
    description: "",
    outcome: "neutral",
    followUpRequired: false,
    followUpDate: "",
  });

  // Fetch contacts
  const { data: contactsData } = useQuery({
    queryKey: ["/api/crm/contacts", searchTerm],
    queryFn: () => apiRequest(`/api/crm/contacts?search=${searchTerm}`, "GET"),
  });

  // Fetch dashboard stats
  const { data: statsData } = useQuery({
    queryKey: ["/api/crm/dashboard-stats"],
  });

  // Fetch pipeline data
  const pipelineType = isRecruiter ? 'recruitment' : 'job_search';
  const { data: pipelineData } = useQuery({
    queryKey: [`/api/crm/pipeline/stages?pipelineType=${pipelineType}`],
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm/contacts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard-stats"] });
      setShowContactDialog(false);
      contactForm.reset();
      toast({ title: "✅ Contact Created", description: "Contact added successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Error Creating Contact", 
        description: error.message || "Failed to create contact. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Log interaction mutation
  const logInteractionMutation = useMutation({
    mutationFn: ({ contactId, data }: any) => 
      apiRequest(`/api/crm/contacts/${contactId}/interactions`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      setShowInteractionDialog(false);
      resetInteractionForm();
      toast({ title: "✅ Interaction Logged", description: "Interaction recorded successfully" });
    },
  });

  // Handle mailto redirect for CRM emails
  const handleSendEmail = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch('/api/crm/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: selectedContact.email,
          subject: emailSubject,
          body: emailBody,
          contactId: selectedContact.id
        })
      });

      const data = await response.json();

      if (response.ok && data.mailtoUrl) {
        // Open user's email client with pre-filled email
        window.location.href = data.mailtoUrl;

        toast({
          title: "Opening Email Client",
          description: "Your default email client will open with the pre-filled email"
        });

        setShowEmailComposer(false);
        setEmailSubject('');
        setEmailBody('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to prepare email",
        variant: "destructive"
      });
    }
  };

  const resetInteractionForm = () => {
    setInteractionForm({
      interactionType: "email",
      subject: "",
      description: "",
      outcome: "neutral",
      followUpRequired: false,
      followUpDate: "",
    });
  };

  const handleCreateContact = contactForm.handleSubmit((data) => {
    createContactMutation.mutate(data);
  });

  const handleLogInteraction = () => {
    if (!selectedContact) return;
    logInteractionMutation.mutate({
      contactId: selectedContact.id,
      data: interactionForm,
    });
  };

  const contacts = (contactsData as any)?.contacts || [];
  const stats = (statsData as any)?.stats || {};
  const pipelineStages = (pipelineData as any)?.stages || [];

  const getContactTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      recruiter: "bg-blue-100 text-blue-800",
      hiring_manager: "bg-purple-100 text-purple-800",
      referral: "bg-green-100 text-green-800",
      colleague: "bg-yellow-100 text-yellow-800",
      company: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {isRecruiter ? <RecruiterNavbar user={user as any} /> : <Navbar />}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CRM Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage contacts, track interactions, and visualize your pipeline
            </p>
          </div>
          <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-contact">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <Form {...contactForm}>
                <form onSubmit={handleCreateContact} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={contactForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-contact-name"
                              placeholder="John Doe"
                              {...field}
                            />
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
                            <Input
                              data-testid="input-contact-email"
                              type="email"
                              placeholder="john@company.com"
                              {...field}
                            />
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
                            <Input
                              data-testid="input-contact-phone"
                              placeholder="+1 (555) 123-4567"
                              {...field}
                            />
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
                            <Input
                              data-testid="input-contact-company"
                              placeholder="Tech Corp"
                              {...field}
                            />
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
                            <Input
                              data-testid="input-contact-job-title"
                              placeholder="Senior Recruiter"
                              {...field}
                            />
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
                          <FormLabel>Contact Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contact-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="recruiter">Recruiter</SelectItem>
                              <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                              <SelectItem value="referral">Referral Contact</SelectItem>
                              <SelectItem value="colleague">Colleague</SelectItem>
                              <SelectItem value="company">Company Contact</SelectItem>
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
                            <Input
                              data-testid="input-contact-linkedin"
                              placeholder="https://linkedin.com/in/johndoe"
                              {...field}
                            />
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
                            <Input
                              data-testid="input-contact-followup-date"
                              type="datetime-local"
                              {...field}
                            />
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
                            <Textarea
                              data-testid="textarea-contact-notes"
                              placeholder="Additional context about this contact..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      data-testid="button-cancel-contact" 
                      type="button"
                      variant="outline" 
                      onClick={() => setShowContactDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      data-testid="button-create-contact" 
                      type="submit"
                      disabled={createContactMutation.isPending || !contactForm.formState.isValid}
                    >
                      {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contacts</p>
                  <p className="text-3xl font-bold">{stats.totalContacts || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Contacts</p>
                  <p className="text-3xl font-bold">{stats.activeContacts || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Follow-ups Due</p>
                  <p className="text-3xl font-bold">{stats.contactsNeedingFollowUp || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last 30 Days</p>
                  <p className="text-3xl font-bold">{stats.interactionsLast30Days || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="tasks">Tasks & Follow-ups</TabsTrigger>
          </TabsList>

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
                        data-testid="input-search-contacts"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
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
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{contact.name}</h3>
                            <Badge className={getContactTypeColor(contact.contactType)}>
                              {contact.contactType.replace('_', ' ')}
                            </Badge>
                            {contact.tags?.map((tag: string) => (
                              <Badge key={tag} variant="outline">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
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
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {contact.phone}
                              </div>
                            )}
                            {contact.lastContactDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Last: {new Date(contact.lastContactDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          {contact.nextTouchDate && (
                            <div className="mt-2 flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              <span>Follow-up: {new Date(contact.nextTouchDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            data-testid={`button-ai-insight-${contact.id}`}
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await apiRequest('/api/crm/ai/contact-insight', 'POST', { contact });
                                toast({
                                  title: "💡 AI Insight",
                                  description: response.insight,
                                });
                              } catch (error) {
                                console.error('AI insight error:', error);
                              }
                            }}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            AI Insight
                          </Button>
                          <Button
                            data-testid={`button-log-interaction-${contact.id}`}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowInteractionDialog(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Log Interaction
                          </Button>
                          <Button
                            data-testid={`button-send-email-${contact.id}`}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowEmailComposer(true);
                            }}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Send Email
                          </Button>
                          <Button data-testid={`button-contact-menu-${contact.id}`} size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No contacts yet
                      </h3>
                      <p className="text-gray-600">
                        Add your first contact to start building your network
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {pipelineStages.map((stage: any) => (
                    <div
                      key={stage.id}
                      className="min-w-[280px] bg-gray-50 rounded-lg p-4"
                      style={{ borderTop: `3px solid ${stage.stageColor}` }}
                    >
                      <h3 className="font-semibold mb-3">{stage.stageName}</h3>
                      <div className="space-y-2">
                        {/* Pipeline items will be rendered here */}
                        <p className="text-sm text-gray-500 text-center py-4">
                          Drag items here
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tasks & Follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Task management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Log Interaction Dialog */}
        <Dialog open={showInteractionDialog} onOpenChange={setShowInteractionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Interaction with {selectedContact?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Interaction Type</Label>
                <Select
                  value={interactionForm.interactionType}
                  onValueChange={(value) => setInteractionForm({ ...interactionForm, interactionType: value })}
                >
                  <SelectTrigger data-testid="select-interaction-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  data-testid="input-interaction-subject"
                  value={interactionForm.subject}
                  onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                  placeholder="Brief subject line"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  data-testid="textarea-interaction-description"
                  value={interactionForm.description}
                  onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })}
                  placeholder="What happened in this interaction?"
                  rows={4}
                />
              </div>
              <div>
                <Label>Outcome</Label>
                <Select
                  value={interactionForm.outcome}
                  onValueChange={(value) => setInteractionForm({ ...interactionForm, outcome: value })}
                >
                  <SelectTrigger data-testid="select-interaction-outcome">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  data-testid="checkbox-interaction-followup-required"
                  type="checkbox"
                  checked={interactionForm.followUpRequired}
                  onChange={(e) => setInteractionForm({ ...interactionForm, followUpRequired: e.target.checked })}
                  id="follow-up"
                />
                <Label htmlFor="follow-up">Requires follow-up</Label>
              </div>
              {interactionForm.followUpRequired && (
                <div>
                  <Label>Follow-up Date</Label>
                  <Input
                    data-testid="input-interaction-followup-date"
                    type="datetime-local"
                    value={interactionForm.followUpDate}
                    onChange={(e) => setInteractionForm({ ...interactionForm, followUpDate: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button data-testid="button-cancel-interaction" variant="outline" onClick={() => setShowInteractionDialog(false)}>
                Cancel
              </Button>
              <Button data-testid="button-submit-interaction" onClick={handleLogInteraction}>
                Log Interaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Composer Dialog */}
        <Dialog open={showEmailComposer} onOpenChange={setShowEmailComposer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compose Email to {selectedContact?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <Input value={selectedContact?.email || ''} readOnly />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  data-testid="input-email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea
                  data-testid="textarea-email-body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={10}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button data-testid="button-cancel-email" variant="outline" onClick={() => setShowEmailComposer(false)}>
                Cancel
              </Button>
              <Button data-testid="button-send-email" onClick={handleSendEmail}>
                Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}