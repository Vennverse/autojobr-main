import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { 
  insertBidderRegistrationSchema, 
  insertProjectSchema, 
  insertBidSchema,
  type SelectBidderRegistration,
  type SelectProject,
  type SelectBid
} from "@shared/schema";
import { 
  Plus, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Star, 
  Eye, 
  Edit, 
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

// Registration form component
function BidderRegistrationForm({ existingRegistration, onSuccess }: { 
  existingRegistration?: SelectBidderRegistration; 
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertBidderRegistrationSchema.extend({
      skills: insertBidderRegistrationSchema.shape.skills.optional(),
      hourlyRate: insertBidderRegistrationSchema.shape.hourlyRate.optional(),
    })),
    defaultValues: {
      userId: user?.id || "",
      businessName: existingRegistration?.businessName || "",
      skills: existingRegistration?.skills || "",
      hourlyRate: existingRegistration?.hourlyRate || 0,
      portfolioUrl: existingRegistration?.portfolioUrl || "",
      bio: existingRegistration?.bio || "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = existingRegistration 
        ? `/api/bidders/registration/${user?.id}`
        : '/api/bidders/registration';
      
      const response = await fetch(url, {
        method: existingRegistration ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save registration');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Registration saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/bidders/registration'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    registerMutation.mutate({
      ...data,
      hourlyRate: data.hourlyRate ? Math.round(data.hourlyRate * 100) : 0, // Convert to cents
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name (Optional)</FormLabel>
              <FormControl>
                <Input 
                  data-testid="input-business-name"
                  placeholder="Your company or freelance business name" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input 
                  data-testid="input-skills"
                  placeholder="e.g., React, Node.js, UI/UX Design" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate ($)</FormLabel>
              <FormControl>
                <Input 
                  data-testid="input-hourly-rate"
                  type="number"
                  placeholder="50"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="portfolioUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Portfolio URL</FormLabel>
              <FormControl>
                <Input 
                  data-testid="input-portfolio-url"
                  placeholder="https://your-portfolio.com" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea 
                  data-testid="textarea-bio"
                  placeholder="Tell potential clients about your experience and expertise..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormMessage>
          )}
        />

        <Button 
          data-testid="button-save-registration"
          type="submit" 
          disabled={registerMutation.isPending}
          className="w-full"
        >
          {registerMutation.isPending ? 'Saving...' : 'Save Registration'}
        </Button>
      </form>
    </Form>
  );
}

// Project form component
function ProjectForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertProjectSchema.extend({
      budget: insertProjectSchema.shape.budget.transform(val => Math.round(val * 100)),
    })),
    defaultValues: {
      userId: user?.id || "",
      title: "",
      description: "",
      type: "short_term",
      category: "",
      budget: 0,
      timeline: "",
      skillsRequired: "",
      status: "open",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Project created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    createProjectMutation.mutate({
      ...data,
      budget: Math.round(data.budget * 100), // Convert to cents
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input 
                  data-testid="input-project-title"
                  placeholder="e.g., Build a React Dashboard" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  data-testid="textarea-project-description"
                  placeholder="Describe your project requirements..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-project-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="short_term">Track A - Short Term</SelectItem>
                    <SelectItem value="long_term">Track B - Long Term</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-project-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="web_development">Web Development</SelectItem>
                    <SelectItem value="mobile_development">Mobile Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="data_science">Data Science</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget ($)</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="input-project-budget"
                    type="number"
                    placeholder="1000"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeline</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="input-project-timeline"
                    placeholder="2 weeks" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="skillsRequired"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills Required</FormLabel>
              <FormControl>
                <Input 
                  data-testid="input-skills-required"
                  placeholder="React, TypeScript, API Integration" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          data-testid="button-create-project"
          type="submit" 
          disabled={createProjectMutation.isPending}
          className="w-full"
        >
          {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
        </Button>
      </form>
    </Form>
  );
}

// Bid form component
function BidForm({ projectId, onSuccess }: { projectId: number; onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertBidSchema),
    defaultValues: {
      projectId,
      bidderId: user?.id || "",
      amount: 0,
      timeline: "",
      proposal: "",
    },
  });

  const createBidMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to submit bid');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Bid submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'bids'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'bids'] });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    createBidMutation.mutate({
      ...data,
      amount: Math.round(data.amount * 100), // Convert to cents
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bid Amount ($)</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="input-bid-amount"
                    type="number"
                    placeholder="500"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proposed Timeline</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="input-bid-timeline"
                    placeholder="1 week" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="proposal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proposal</FormLabel>
              <FormControl>
                <Textarea 
                  data-testid="textarea-bid-proposal"
                  placeholder="Explain why you're the best fit for this project..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          data-testid="button-submit-bid"
          type="submit" 
          disabled={createBidMutation.isPending}
          className="w-full"
        >
          {createBidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
        </Button>
      </form>
    </Form>
  );
}

export default function BidderDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showBidForm, setShowBidForm] = useState<{ show: boolean; projectId?: number }>({ show: false });

  // Get bidder registration
  const { data: bidderRegistration } = useQuery({
    queryKey: ['/api/bidders/registration', user?.id],
    queryFn: () => fetch(`/api/bidders/registration/${user?.id}`).then(res => res.ok ? res.json() : null),
    enabled: !!user?.id,
  });

  // Get projects (for browsing)
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => fetch('/api/projects').then(res => res.json()),
  });

  // Get user's projects (posted by user)
  const { data: userProjects = [] } = useQuery({
    queryKey: ['/api/users', user?.id, 'projects'],
    queryFn: () => fetch(`/api/users/${user?.id}/projects`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Get user's bids
  const { data: userBids = [] } = useQuery({
    queryKey: ['/api/users', user?.id, 'bids'],
    queryFn: () => fetch(`/api/users/${user?.id}/bids`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (!user) {
    return <div data-testid="text-loading">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Bidder Dashboard
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Manage your projects, bids, and freelance work
        </p>
      </div>

      {!bidderRegistration && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Complete Your Bidder Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              To start bidding on projects and posting your own, please complete your bidder profile.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-register-bidder">
                  Register as Bidder
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bidder Registration</DialogTitle>
                </DialogHeader>
                <BidderRegistrationForm 
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/bidders/registration'] });
                  }} 
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="browse" data-testid="tab-browse">Browse Projects</TabsTrigger>
          <TabsTrigger value="post" data-testid="tab-post" disabled={!bidderRegistration}>
            Post Project
          </TabsTrigger>
          <TabsTrigger value="bids" data-testid="tab-bids">My Bids</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">My Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-bids-count">
                  {userBids.filter((bid: SelectBid) => bid.status === 'pending').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posted Projects</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-posted-projects-count">
                  {userProjects.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-success-rate">
                  {bidderRegistration?.rating ? `${bidderRegistration.rating}/5.0` : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {bidderRegistration && (
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Business Name</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-business-name">
                      {bidderRegistration.businessName || 'Individual Freelancer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Hourly Rate</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-hourly-rate">
                      {bidderRegistration.hourlyRate ? formatCurrency(bidderRegistration.hourlyRate) : 'Not set'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Skills</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-skills">
                    {bidderRegistration.skills || 'No skills listed'}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-edit-profile">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Bidder Profile</DialogTitle>
                    </DialogHeader>
                    <BidderRegistrationForm 
                      existingRegistration={bidderRegistration}
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/bidders/registration'] });
                      }} 
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Available Projects</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-projects-count">
              {projects.length} projects available
            </p>
          </div>

          <div className="grid gap-6">
            {projects.map((project: SelectProject) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2" data-testid={`text-project-title-${project.id}`}>
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={project.type === 'short_term' ? 'default' : 'secondary'}
                          data-testid={`badge-project-type-${project.id}`}
                        >
                          {project.type === 'short_term' ? 'Track A' : 'Track B'}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-project-category-${project.id}`}>
                          {project.category}
                        </Badge>
                        <Badge 
                          variant={project.status === 'open' ? 'default' : 'secondary'}
                          data-testid={`badge-project-status-${project.id}`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600" data-testid={`text-project-budget-${project.id}`}>
                        {formatCurrency(project.budget)}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {project.timeline}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-project-description-${project.id}`}>
                    {project.description}
                  </p>
                  {project.skillsRequired && (
                    <div className="mb-4">
                      <p className="text-xs font-medium mb-2">Skills Required:</p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-project-skills-${project.id}`}>
                        {project.skillsRequired}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Posted {format(new Date(project.createdAt!), 'MMM d, yyyy')}
                    </p>
                    {project.status === 'open' && bidderRegistration && (
                      <Button 
                        size="sm"
                        onClick={() => setShowBidForm({ show: true, projectId: project.id })}
                        data-testid={`button-bid-project-${project.id}`}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Bid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="post" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Post a Project</h2>
            <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-project">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <ProjectForm onSuccess={() => setShowProjectForm(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to post your first project?</h3>
            <p className="text-muted-foreground mb-4">
              Get bids from talented freelancers for your project needs.
            </p>
            <Button 
              onClick={() => setShowProjectForm(true)}
              data-testid="button-get-started-project"
            >
              Get Started
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="bids" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Bids</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-bids-count">
              {userBids.length} bids submitted
            </p>
          </div>

          <div className="grid gap-4">
            {userBids.map((bid: SelectBid) => (
              <Card key={bid.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium mb-1" data-testid={`text-bid-project-${bid.id}`}>
                        Project #{bid.projectId}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-bid-proposal-${bid.id}`}>
                        {bid.proposal}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Amount: {formatCurrency(bid.amount)}</span>
                        <span>Timeline: {bid.timeline}</span>
                        <span>Submitted: {format(new Date(bid.submittedAt!), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        bid.status === 'accepted' ? 'default' : 
                        bid.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                      data-testid={`badge-bid-status-${bid.id}`}
                    >
                      {bid.status === 'accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {bid.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {bid.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {bid.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Projects</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-my-projects-count">
              {userProjects.length} projects posted
            </p>
          </div>

          <div className="grid gap-6">
            {userProjects.map((project: SelectProject) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle data-testid={`text-my-project-title-${project.id}`}>
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={project.type === 'short_term' ? 'default' : 'secondary'}
                          data-testid={`badge-my-project-type-${project.id}`}
                        >
                          {project.type === 'short_term' ? 'Track A' : 'Track B'}
                        </Badge>
                        <Badge 
                          variant={project.status === 'open' ? 'default' : 'secondary'}
                          data-testid={`badge-my-project-status-${project.id}`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" data-testid={`text-my-project-budget-${project.id}`}>
                        {formatCurrency(project.budget)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Posted {format(new Date(project.createdAt!), 'MMM d')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-my-project-description-${project.id}`}>
                    {project.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" data-testid={`button-view-bids-${project.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Bids
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-edit-project-${project.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    <Button variant="destructive" size="sm" data-testid={`button-delete-project-${project.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bid Form Dialog */}
      <Dialog open={showBidForm.show} onOpenChange={(show) => setShowBidForm({ show })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Bid</DialogTitle>
          </DialogHeader>
          {showBidForm.projectId && (
            <BidForm 
              projectId={showBidForm.projectId}
              onSuccess={() => setShowBidForm({ show: false })} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}