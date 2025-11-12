
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
  Send, Edit, Trash2, UserPlus, Link2
} from "lucide-react";

export default function NetworkingHub() {
  const { toast } = useToast();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [showFollowUpGenerator, setShowFollowUpGenerator] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [followUpStyle, setFollowUpStyle] = useState<"email" | "linkedin">("email");
  const [generatedMessage, setGeneratedMessage] = useState("");

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
            <TabsList className="grid w-full grid-cols-4">
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
            </TabsList>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Networking Events</h2>
                <Button onClick={() => setShowCreateEvent(!showCreateEvent)}>
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
                    <Input placeholder="Event Title" />
                    <Textarea placeholder="Event Description" />
                    <Input type="datetime-local" />
                    <Input placeholder="Location (Virtual/In-person)" />
                    <Button className="w-full">Create Event</Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Sample Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Join us for networking
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Coming Soon</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>Virtual</span>
                    </div>
                    <Button className="w-full" size="sm">
                      Register
                    </Button>
                  </CardContent>
                </Card>
              </div>
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
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
