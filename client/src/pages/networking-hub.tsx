
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, Calendar, MapPin, Clock, Share2, Plus, 
  Mail, Linkedin, Copy, CheckCircle, Building, 
  Phone, Globe, Bell, CalendarDays, CheckSquare,
  Send, Edit, Trash2, UserPlus, Link2, Sparkles, Zap
} from "lucide-react";

export default function NetworkingHub() {
  const { toast } = useToast();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [showFollowUpGenerator, setShowFollowUpGenerator] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [followUpStyle, setFollowUpStyle] = useState<"email" | "linkedin">("email");
  const [generatedMessage, setGeneratedMessage] = useState("");

  // Event form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventType, setEventType] = useState("virtual");
  const [eventCapacity, setEventCapacity] = useState("");
  const [eventRegUrl, setEventRegUrl] = useState("");

  // Connection note generator states
  const [connectionReason, setConnectionReason] = useState("");
  const [connectionContext, setConnectionContext] = useState("");
  const [generatedNote, setGeneratedNote] = useState("");

  // Fetch networking events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/networking/events'],
  });
  const events = eventsData?.events || [];

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/networking/contacts'],
  });

  // Fetch applications for follow-up
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/applications'],
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Fetch AI usage stats for quota display
  const { data: aiUsageStats } = useQuery({
    queryKey: ['/api/ai-usage-stats'],
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      return apiRequest('/api/networking/contacts', 'POST', contactData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/networking/contacts'] });
      setShowCreateContact(false);
      toast({
        title: "Contact Added",
        description: "New contact has been added to your network",
      });
    },
  });

  // Generate connection note mutation
  const generateConnectionNoteMutation = useMutation({
    mutationFn: async (data: { reason: string; context: string }) => {
      return apiRequest('/api/networking/generate-connection-note', 'POST', data);
    },
    onSuccess: (data) => {
      setGeneratedNote(data.note);
      // Update quota display
      queryClient.invalidateQueries({ queryKey: ['/api/ai-usage-stats'] });
      toast({
        title: "Note Generated!",
        description: data.quota ? `Used ${data.quota.used}/${data.quota.limit} this month` : "Your personalized connection note is ready",
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to generate note. Please try again.";
      toast({
        title: error?.quotaExceeded ? "Quota Exceeded" : "Generation Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Create networking event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest('/api/networking/events', 'POST', eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/networking/events'] });
      setShowCreateEvent(false);
      // Reset form
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventLocation("");
      setEventType("virtual");
      setEventCapacity("");
      setEventRegUrl("");
      toast({
        title: "Event Created!",
        description: "Your networking event has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Register for event mutation
  const registerForEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest(`/api/networking/events/${eventId}/register`, 'POST', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/networking/events'] });
      toast({
        title: "Registered!",
        description: "You've successfully registered for the event",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error?.message || "Failed to register for event.",
        variant: "destructive",
      });
    },
  });

  // Generate follow-up message
  const generateFollowUp = (application: any, style: "email" | "linkedin") => {
    const companyName = application.company || application.companyName;
    const jobTitle = application.jobTitle;
    const appliedDate = new Date(application.appliedAt || application.appliedDate).toLocaleDateString();

    if (style === "email") {
      return `Subject: Following Up on ${jobTitle} Application

Dear Hiring Manager,

I hope this email finds you well. I am writing to follow up on my application for the ${jobTitle} position at ${companyName}, which I submitted on ${appliedDate}.

I remain very interested in this opportunity and believe my skills and experience align well with your requirements. I would welcome the chance to discuss how I can contribute to your team's success.

Would it be possible to schedule a brief call to discuss my application? I am available at your convenience and can be reached at this email address.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
[Your Name]`;
    } else {
      return `Hi [Hiring Manager Name],

I recently applied for the ${jobTitle} role at ${companyName} (${appliedDate}), and I wanted to reach out directly to express my continued interest.

I'm particularly excited about this opportunity because [specific reason about the company/role]. With my background in [your key skills], I believe I could make meaningful contributions to your team.

Would you be open to a brief conversation about the role? I'd love to learn more about your team's priorities and share how my experience aligns.

Looking forward to connecting!

Best,
[Your Name]`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Networking Hub</h1>
            <p className="text-lg text-muted-foreground">
              Manage your professional network and follow-ups
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="events">
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger value="contacts">
                <Users className="h-4 w-4 mr-2" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="followups">
                <Send className="h-4 w-4 mr-2" />
                Follow-ups
              </TabsTrigger>
              <TabsTrigger value="connection-notes" data-testid="tab-connection-notes">
                <Linkedin className="h-4 w-4 mr-2" />
                Connection Notes
              </TabsTrigger>
            </TabsList>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4" data-testid="tab-events">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Networking Events</h2>
                <Button onClick={() => setShowCreateEvent(!showCreateEvent)} data-testid="button-create-event">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>

              {showCreateEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create Networking Event</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Event Title *</Label>
                      <Input 
                        placeholder="Tech Meetup 2025" 
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        data-testid="input-event-title"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Join us for an evening of networking and learning..." 
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        data-testid="input-event-description"
                      />
                    </div>
                    <div>
                      <Label>Event Date & Time *</Label>
                      <Input 
                        type="datetime-local" 
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        data-testid="input-event-date"
                      />
                    </div>
                    <div>
                      <Label>Event Type *</Label>
                      <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger data-testid="select-event-type">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="in_person">In-Person</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input 
                        placeholder="Zoom link or venue address" 
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        data-testid="input-event-location"
                      />
                    </div>
                    <div>
                      <Label>Capacity (optional)</Label>
                      <Input 
                        type="number" 
                        placeholder="50" 
                        value={eventCapacity}
                        onChange={(e) => setEventCapacity(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Registration URL (optional)</Label>
                      <Input 
                        placeholder="https://eventbrite.com/..." 
                        value={eventRegUrl}
                        onChange={(e) => setEventRegUrl(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        if (!eventTitle || !eventDate) {
                          toast({
                            title: "Missing Required Fields",
                            description: "Please fill in title and date",
                            variant: "destructive"
                          });
                          return;
                        }
                        createEventMutation.mutate({
                          title: eventTitle,
                          description: eventDescription || null,
                          eventDate: new Date(eventDate).toISOString(),
                          locationName: eventLocation || null,
                          eventType: eventType,
                          capacity: eventCapacity ? parseInt(eventCapacity) : null,
                          registrationUrl: eventRegUrl || null,
                        });
                      }}
                      disabled={createEventMutation.isPending}
                      data-testid="button-submit-event"
                    >
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {eventsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">No Events Yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first networking event to get started
                    </p>
                    <Button onClick={() => setShowCreateEvent(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event: any) => (
                    <Card key={event.id} className="hover-elevate" data-testid={`card-event-${event.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {event.title}
                          </CardTitle>
                          {event.isFeatured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                        </div>
                        {event.description && (
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.eventDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span className="capitalize">{event.eventType}</span>
                          {event.locationName && ` - ${event.locationName}`}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.attendeesCount} registered
                            {event.capacity && ` / ${event.capacity} capacity`}
                          </span>
                        </div>
                        {event.registrationUrl ? (
                          <Button 
                            className="w-full" 
                            size="sm" 
                            onClick={() => window.open(event.registrationUrl, '_blank')}
                            data-testid={`button-register-external-${event.id}`}
                          >
                            Register on External Site
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => registerForEventMutation.mutate(event.id)}
                            disabled={registerForEventMutation.isPending || (event.capacity && event.attendeesCount >= event.capacity)}
                            data-testid={`button-register-${event.id}`}
                          >
                            {event.capacity && event.attendeesCount >= event.capacity 
                              ? "Event Full" 
                              : registerForEventMutation.isPending 
                              ? "Registering..." 
                              : "Register"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Contact Management</h2>
                <Dialog open={showCreateContact} onOpenChange={setShowCreateContact}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Contact</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input placeholder="John Doe" />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input placeholder="Company Name" />
                      </div>
                      <div>
                        <Label>Job Title</Label>
                        <Input placeholder="Hiring Manager" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" placeholder="john@company.com" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input placeholder="+1 (555) 123-4567" />
                      </div>
                      <div>
                        <Label>LinkedIn URL</Label>
                        <Input placeholder="https://linkedin.com/in/johndoe" />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea placeholder="Met at career fair..." rows={3} />
                      </div>
                      <Button className="w-full">Add Contact</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Contacts Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your professional network
                    </p>
                    <Button onClick={() => setShowCreateContact(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Your First Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Networking Tasks</h2>
                <Button onClick={() => window.location.href = '/job-seeker-tasks'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create tasks to stay organized
                      </p>
                      <Button onClick={() => window.location.href = '/job-seeker-tasks'}>
                        <Plus className="h-4 w-4 mr-2" />
                        Go to Task Manager
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {tasks.slice(0, 5).map((task: any) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {task.dueDateTime && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.dueDateTime).toLocaleDateString()}
                                </span>
                              )}
                              <Badge variant="outline">{task.status}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" onClick={() => window.location.href = '/job-seeker-tasks'}>
                    View All Tasks
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Follow-ups Tab */}
            <TabsContent value="followups" className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Application Follow-ups</h2>
                <p className="text-muted-foreground">
                  Generate personalized follow-up messages for your applications
                </p>
              </div>

              <div className="grid gap-4">
                {applications.length === 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                        <p className="text-muted-foreground">
                          Apply to jobs to generate follow-up messages
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  applications.map((app: any) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{app.jobTitle}</h3>
                            <p className="text-sm text-muted-foreground">
                              {app.company || app.companyName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Applied: {new Date(app.appliedAt || app.appliedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedApplication(app)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Generate Follow-up
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Follow-up Message Generator</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Message Style</Label>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      variant={followUpStyle === "email" ? "default" : "outline"}
                                      onClick={() => setFollowUpStyle("email")}
                                      className="flex-1"
                                    >
                                      <Mail className="h-4 w-4 mr-2" />
                                      Email
                                    </Button>
                                    <Button
                                      variant={followUpStyle === "linkedin" ? "default" : "outline"}
                                      onClick={() => setFollowUpStyle("linkedin")}
                                      className="flex-1"
                                    >
                                      <Linkedin className="h-4 w-4 mr-2" />
                                      LinkedIn Message
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <Label>Generated Message</Label>
                                  <Textarea
                                    value={generateFollowUp(app, followUpStyle)}
                                    readOnly
                                    rows={12}
                                    className="mt-2 font-mono text-sm"
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => copyToClipboard(generateFollowUp(app, followUpStyle))}
                                    className="flex-1"
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Message
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      if (followUpStyle === "email") {
                                        window.open(`mailto:?subject=Following Up on ${app.jobTitle} Application&body=${encodeURIComponent(generateFollowUp(app, followUpStyle))}`);
                                      }
                                    }}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    {followUpStyle === "email" ? "Open in Email" : "Copy for LinkedIn"}
                                  </Button>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-800 dark:text-blue-200">
                                      <p className="font-semibold mb-1">Email & Calendar Integration</p>
                                      <p>Connect Google or Outlook in Settings → Integrations for one-click sending and automatic calendar reminders.</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Connection Notes Tab */}
            <TabsContent value="connection-notes" className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  AI Connection Note Generator
                </h2>
                <p className="text-muted-foreground">
                  Create personalized LinkedIn connection requests (200 characters) that get accepted
                </p>
              </div>

              <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    Generate Your Connection Note
                  </CardTitle>
                  <CardDescription>
                    Tell us why you want to connect, and our AI will craft a perfect message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="connection-reason">
                      Why do you want to connect? *
                    </Label>
                    <Select value={connectionReason} onValueChange={setConnectionReason}>
                      <SelectTrigger id="connection-reason" data-testid="select-connection-reason">
                        <SelectValue placeholder="Choose a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job_opportunity" data-testid="option-job-opportunity">
                          Interested in Job Opportunities
                        </SelectItem>
                        <SelectItem value="industry_networking" data-testid="option-industry-networking">
                          Industry Networking & Learning
                        </SelectItem>
                        <SelectItem value="career_advice" data-testid="option-career-advice">
                          Seeking Career Advice
                        </SelectItem>
                        <SelectItem value="collaboration" data-testid="option-collaboration">
                          Potential Collaboration/Partnership
                        </SelectItem>
                        <SelectItem value="alumni_connection" data-testid="option-alumni">
                          Fellow Alumni/School Connection
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="connection-context">
                      Add context (Optional but recommended)
                    </Label>
                    <Textarea
                      id="connection-context"
                      placeholder="Example: I saw your post about AI in healthcare and found it fascinating. I'm a recent graduate interested in this field..."
                      value={connectionContext}
                      onChange={(e) => setConnectionContext(e.target.value)}
                      rows={4}
                      data-testid="input-connection-context"
                    />
                    <p className="text-xs text-muted-foreground">
                      More context helps create a more personalized note
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      if (!connectionReason) {
                        toast({
                          title: "Missing Information",
                          description: "Please select a reason for connecting",
                          variant: "destructive",
                        });
                        return;
                      }
                      generateConnectionNoteMutation.mutate({
                        reason: connectionReason,
                        context: connectionContext,
                      });
                    }}
                    disabled={generateConnectionNoteMutation.isPending || !connectionReason}
                    className="w-full"
                    size="lg"
                    data-testid="button-generate-note"
                  >
                    {generateConnectionNoteMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Generate Connection Note
                      </div>
                    )}
                  </Button>

                  {generatedNote && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 pt-4 border-t"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Your Personalized Note
                        </Label>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ready to Use
                        </Badge>
                      </div>
                      <Textarea
                        value={generatedNote}
                        readOnly
                        rows={6}
                        className="font-sans text-sm resize-none"
                        data-testid="output-generated-note"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            copyToClipboard(generatedNote);
                          }}
                          className="flex-1"
                          data-testid="button-copy-note"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Note
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setGeneratedNote("");
                            setConnectionReason("");
                            setConnectionContext("");
                          }}
                          data-testid="button-generate-new"
                        >
                          Generate New
                        </Button>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Linkedin className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-semibold mb-1">Pro Tip</p>
                            <p>LinkedIn limits connection notes to 200 characters. Our AI generates concise, personalized messages that fit perfectly within this limit.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Tips Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Be Specific</p>
                      <p className="text-sm text-muted-foreground">
                        Mention something from their profile or a shared interest
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Keep it Short</p>
                      <p className="text-sm text-muted-foreground">
                        Aim for 200-300 characters for best results
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Value First</p>
                      <p className="text-sm text-muted-foreground">
                        Show how the connection is mutually beneficial
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Professional Tone</p>
                      <p className="text-sm text-muted-foreground">
                        Be friendly but maintain professionalism
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
