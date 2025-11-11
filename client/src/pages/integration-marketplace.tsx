import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Star,
  Users,
  Zap,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Globe,
  Mail,
  Calendar,
  Video,
  Shield,
  ExternalLink,
  Settings
} from "lucide-react";
import { SiPaypal, SiStripe, SiOpenai, SiGoogle, SiLinkedin, SiZapier, SiSlack, SiNotion, SiAirtable } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  longDescription: string;
  rating: number;
  installs: string;
  status: 'active' | 'coming-soon' | 'beta';
  isPremium: boolean;
  features: string[];
  pricing?: string;
  setupTime?: string;
}

interface IntegrationFeature {
  name: string;
  path: string;
}

interface IntegrationFeatureMapping {
  name: string;
  features: IntegrationFeature[];
  requiresSetup: boolean;
  setupFields: string[];
}

interface UserIntegration {
  id: number;
  userId: string;
  integrationId: string;
  isEnabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  config?: any;
  features?: IntegrationFeature[];
  setupRequired?: boolean;
}

const integrations: Integration[] = [
  {
    id: "paypal",
    name: "PayPal",
    icon: <SiPaypal className="w-12 h-12 text-blue-600" />,
    category: "Payments",
    description: "Accept PayPal payments and subscriptions",
    longDescription: "Integrate PayPal to accept one-time payments and recurring subscriptions. Support for multiple currencies and instant payment notifications.",
    rating: 4.8,
    installs: "2.5k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "5 min",
    features: [
      "One-time payments",
      "Recurring subscriptions",
      "Multi-currency support",
      "Instant notifications",
      "Refund management"
    ]
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: <SiStripe className="w-12 h-12 text-blue-600" />,
    category: "Payments",
    description: "Process credit cards and manage subscriptions",
    longDescription: "Industry-leading payment processing with Stripe. Handle credit cards, subscriptions, and invoicing with ease.",
    rating: 4.9,
    installs: "5.2k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "5 min",
    features: [
      "Credit card processing",
      "Subscription billing",
      "Invoice management",
      "Advanced analytics",
      "PCI compliance"
    ]
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    icon: <SiGoogle className="w-12 h-12 text-red-600" />,
    category: "Productivity",
    description: "Sync with Google Calendar, Gmail, and Drive",
    longDescription: "Connect with Google Workspace to sync interviews with Calendar, send emails via Gmail, and store documents in Drive.",
    rating: 4.7,
    installs: "3.8k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "2 min",
    features: [
      "Calendar sync",
      "Gmail integration",
      "Google Drive storage",
      "OAuth authentication",
      "Contact sync"
    ]
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <SiLinkedin className="w-12 h-12 text-blue-700" />,
    category: "Social",
    description: "Import profiles and post job listings",
    longDescription: "Connect with LinkedIn to import candidate profiles, post job listings, and optimize LinkedIn profiles for better recruiter visibility.",
    rating: 4.6,
    installs: "6.3k",
    status: "active",
    isPremium: true,
    pricing: "Pro plan",
    setupTime: "5 min",
    features: [
      "Profile import",
      "Job posting",
      "Profile optimization",
      "Network insights",
      "OAuth login"
    ]
  },
  {
    id: "zapier",
    name: "Zapier",
    icon: <SiZapier className="w-12 h-12 text-orange-600" />,
    category: "Automation",
    description: "Automate workflows with 5000+ apps",
    longDescription: "Connect AutoJobr with 5000+ apps using Zapier. Automate repetitive tasks, sync data across platforms, and create custom workflows without code.",
    rating: 4.7,
    installs: "4.1k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "3 min",
    features: [
      "5000+ app integrations",
      "Custom workflows",
      "Multi-step automation",
      "Real-time triggers",
      "Data transformation"
    ]
  },
  {
    id: "slack",
    name: "Slack",
    icon: <SiSlack className="w-12 h-12 text-purple-600" />,
    category: "Communication",
    description: "Send notifications to your Slack workspace",
    longDescription: "Receive instant notifications in Slack for new applications, interview schedules, and important updates. Keep your team in sync.",
    rating: 4.8,
    installs: "7.2k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "2 min",
    features: [
      "Application alerts",
      "Interview reminders",
      "Team collaboration",
      "Custom channels",
      "Webhook support"
    ]
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: <SiOpenai className="w-12 h-12 text-gray-900 dark:text-white" />,
    category: "Productivity",
    description: "AI-powered resume and cover letter generation",
    longDescription: "Leverage GPT-4 to generate tailored resumes, cover letters, and interview responses. Get AI suggestions for profile optimization.",
    rating: 4.9,
    installs: "8.5k",
    status: "active",
    isPremium: true,
    pricing: "Premium plan",
    setupTime: "1 min",
    features: [
      "GPT-4 powered content",
      "Resume optimization",
      "Cover letter generation",
      "Interview prep",
      "Job description analysis"
    ]
  },
  {
    id: "notion",
    name: "Notion",
    icon: <SiNotion className="w-12 h-12 text-gray-900 dark:text-white" />,
    category: "Productivity",
    description: "Track applications in your Notion workspace",
    longDescription: "Sync your job applications, interview schedules, and notes directly to Notion. Keep all your career information organized in one place.",
    rating: 4.6,
    installs: "3.2k",
    status: "beta",
    isPremium: false,
    pricing: "Free",
    setupTime: "4 min",
    features: [
      "Two-way sync",
      "Custom databases",
      "Template support",
      "Automated updates",
      "Rich text notes"
    ]
  },
  {
    id: "airtable",
    name: "Airtable",
    icon: <SiAirtable className="w-12 h-12 text-yellow-600" />,
    category: "Database",
    description: "Manage recruitment data in Airtable",
    longDescription: "Export and sync candidate data, applications, and analytics to Airtable. Create custom views and collaborate with your hiring team.",
    rating: 4.5,
    installs: "2.8k",
    status: "active",
    isPremium: true,
    pricing: "Pro plan",
    setupTime: "5 min",
    features: [
      "Data export",
      "Real-time sync",
      "Custom views",
      "Team collaboration",
      "API access"
    ]
  },
  {
    id: "calendly",
    name: "Calendly",
    icon: <Calendar className="w-12 h-12 text-blue-500" />,
    category: "Scheduling",
    description: "Schedule interviews with Calendly",
    longDescription: "Integrate Calendly for seamless interview scheduling. Share availability, automate reminders, and eliminate scheduling conflicts.",
    rating: 4.7,
    installs: "5.6k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "3 min",
    features: [
      "Automated scheduling",
      "Calendar sync",
      "Email reminders",
      "Timezone detection",
      "Booking confirmations"
    ]
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    icon: <Mail className="w-12 h-12 text-blue-600" />,
    category: "Email",
    description: "Send professional emails at scale",
    longDescription: "Use SendGrid to send transactional emails, application updates, and marketing campaigns with high deliverability rates.",
    rating: 4.6,
    installs: "4.3k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "4 min",
    features: [
      "Email templates",
      "High deliverability",
      "Analytics dashboard",
      "A/B testing",
      "Webhook events"
    ]
  },
  {
    id: "zoom",
    name: "Zoom",
    icon: <Video className="w-12 h-12 text-blue-600" />,
    category: "Video",
    description: "Conduct virtual interviews via Zoom",
    longDescription: "Schedule and conduct video interviews directly through Zoom. Automatic meeting links, calendar integration, and recording capabilities.",
    rating: 4.8,
    installs: "9.1k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "2 min",
    features: [
      "Instant meeting links",
      "Interview recording",
      "Screen sharing",
      "Waiting rooms",
      "Calendar integration"
    ]
  }
];

const categories = [
  "All",
  "Payments",
  "Productivity",
  "Communication",
  "Social",
  "Automation",
  "Database",
  "Scheduling",
  "Email",
  "Video"
];

export default function IntegrationMarketplace() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [configFields, setConfigFields] = useState<Record<string, string>>({});

  // Fetch user data to determine user type
  const { data: user } = useQuery<{userType?: string; planType?: string}>({
    queryKey: ['/api/user']
  });

  // Fetch user integrations
  const { data: userIntegrations = [] } = useQuery<UserIntegration[]>({
    queryKey: ['/api/integrations/user-integrations']
  });

  // Fetch integration feature mapping for selected integration
  const { data: integrationFeatures } = useQuery<IntegrationFeatureMapping>({
    queryKey: ['/api/integrations/integration-features', selectedIntegration?.id],
    enabled: !!selectedIntegration?.id
  });

  const isRecruiter = user?.userType === 'recruiter';
  const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise' || 
                     user?.planType === 'ultra-plan' || user?.planType === 'professional';

  // Check if integration is already enabled
  const isIntegrationEnabled = (integrationId: string) => {
    return userIntegrations.some(ui => ui.integrationId === integrationId && ui.isEnabled);
  };

  // Filter integrations
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Mutation to enable/configure integration
  const enableIntegrationMutation = useMutation({
    mutationFn: async (data: { integrationId: string; config: Record<string, string> }) => {
      return await apiRequest<any>('/api/integrations/user-integrations', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/user-integrations'] });
      toast({
        title: "Integration Enabled",
        description: `${selectedIntegration?.name} is now connected to your AutoJobr account.`,
      });
      setShowDialog(false);
      setConfigFields({});
    },
    onError: (error: any) => {
      toast({
        title: "Failed to enable integration",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const handleConnect = (integration: Integration) => {
    if (integration.isPremium && !isPremium) {
      toast({
        title: "Premium Feature",
        description: `${integration.name} integration requires a premium subscription. Upgrade to unlock!`,
        variant: "destructive"
      });
      return;
    }

    if (integration.status === 'coming-soon') {
      toast({
        title: "Coming Soon",
        description: `${integration.name} integration is coming soon! We'll notify you when it's ready.`,
      });
      return;
    }

    if (integration.status === 'beta') {
      toast({
        title: "Beta Feature",
        description: `${integration.name} is in beta. Connect to start testing!`,
      });
    }

    // Open detailed view
    setSelectedIntegration(integration);
    setShowDialog(true);
  };

  const installIntegration = () => {
    if (!selectedIntegration) return;

    // Payment integrations don't need setup
    if (selectedIntegration.id === 'paypal' || selectedIntegration.id === 'stripe') {
      enableIntegrationMutation.mutate({ 
        integrationId: selectedIntegration.id,
        config: {}
      });
      return;
    }

    // Other integrations that don't need setup
    if (!integrationFeatures?.requiresSetup) {
      enableIntegrationMutation.mutate({ 
        integrationId: selectedIntegration.id,
        config: {}
      });
      return;
    }

    // Validate required fields
    const missingFields = integrationFeatures.setupFields.filter(
      field => !configFields[field]?.trim()
    );

    if (missingFields.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    enableIntegrationMutation.mutate({
      integrationId: selectedIntegration.id,
      config: configFields
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {isRecruiter ? <RecruiterNavbar /> : <Navbar />}

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-10 h-10 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Integration Marketplace
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Connect AutoJobr with your favorite tools and supercharge your workflow
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>12 integrations available</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Secure connections</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Easy setup</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              data-testid="input-integration-search"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category.toLowerCase()}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Integration Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredIntegrations.map((integration) => (
            <Card 
              key={integration.id}
              className="relative hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleConnect(integration)}
              data-testid={`card-integration-${integration.id}`}
            >
              {integration.isPremium && (
                <Badge className="absolute top-4 right-4 bg-yellow-500 text-white">
                  Premium
                </Badge>
              )}
              {isIntegrationEnabled(integration.id) && (
                <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
              )}

              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {integration.icon}
                    <div>
                      <CardTitle className="text-xl">
                        {integration.name}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  {integration.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{integration.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{integration.installs} installs</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {integration.status === 'active' && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </Badge>
                    )}
                    {integration.status === 'coming-soon' && (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Coming Soon
                      </Badge>
                    )}
                    {integration.status === 'beta' && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Beta
                      </Badge>
                    )}
                  </div>
                  {integration.setupTime && (
                    <span className="text-xs text-muted-foreground">
                      {integration.setupTime} setup
                    </span>
                  )}
                </div>

                <Button 
                  className="w-full"
                  variant={integration.status === 'active' ? 'default' : 'outline'}
                  data-testid={`button-connect-${integration.id}`}
                >
                  {isIntegrationEnabled(integration.id) ? (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </>
                  ) : (
                    <>
                      {integration.status === 'active' ? 'Connect Now' : 'Learn More'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-16">
            <Globe className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No integrations found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Integration Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          {selectedIntegration && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedIntegration.icon}
                  <div>
                    <div className="text-2xl">{selectedIntegration.name}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {selectedIntegration.category}
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-base mt-4">
                  {selectedIntegration.longDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Features */}
                <div>
                  <h4 className="font-semibold mb-3">Key Features:</h4>
                  <div className="space-y-2">
                    {selectedIntegration.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AutoJobr Feature Links */}
                {integrationFeatures && integrationFeatures.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">AutoJobr Features Using This Integration:</h4>
                    <div className="space-y-2">
                      {integrationFeatures.features.map((feature, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => navigate(feature.path)}
                          data-testid={`button-feature-${feature.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span>{feature.name}</span>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Setup Form for integrations that require configuration */}
                {integrationFeatures?.requiresSetup && integrationFeatures.setupFields.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Configuration:</h4>
                    {integrationFeatures.setupFields.map((field) => {
                      const isSecret = ['apiKey', 'apiSecret', 'accessToken', 'refreshToken'].includes(field);
                      const fieldLabel = field
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim();
                      
                      return (
                        <div key={field} className="space-y-2">
                          <Label htmlFor={field}>{fieldLabel} *</Label>
                          <Input
                            id={field}
                            type={isSecret ? "password" : "text"}
                            placeholder={`Enter your ${fieldLabel.toLowerCase()}`}
                            value={configFields[field] || ''}
                            onChange={(e) => setConfigFields(prev => ({
                              ...prev,
                              [field]: e.target.value
                            }))}
                            data-testid={`input-${field}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CTA */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1"
                    onClick={installIntegration}
                    disabled={selectedIntegration.status !== 'active' || enableIntegrationMutation.isPending}
                    data-testid="button-install-integration"
                  >
                    {selectedIntegration.status === 'active' ? (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        {enableIntegrationMutation.isPending ? 'Connecting...' : 
                         isIntegrationEnabled(selectedIntegration.id) ? 'Update Configuration' : 'Install Integration'}
                      </>
                    ) : (
                      `Available ${selectedIntegration.status === 'beta' ? 'in Beta' : 'Soon'}`
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>

                {selectedIntegration.isPremium && !isPremium && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                          Premium Feature
                        </p>
                        <p className="text-yellow-800 dark:text-yellow-200">
                          This integration requires a premium subscription. 
                          <a href={isRecruiter ? "/recruiter/premium" : "/subscription"} className="underline ml-1">
                            Upgrade now
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
