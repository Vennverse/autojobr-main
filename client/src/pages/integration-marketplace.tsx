import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  FileText,
  CreditCard,
  MessageSquare,
  Video,
  Database,
  Shield
} from "lucide-react";
import { SiPaypal, SiStripe, SiOpenai, SiGoogle, SiLinkedin, SiZapier, SiSlack, SiNotion, SiAirtable } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

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
    id: "openai",
    name: "OpenAI",
    icon: <SiOpenai className="w-12 h-12 text-black dark:text-white" />,
    category: "AI/ML",
    description: "Power your app with GPT-4 and AI capabilities",
    longDescription: "Integrate OpenAI's powerful language models for resume analysis, cover letter generation, interview preparation, and more.",
    rating: 5.0,
    installs: "8.1k",
    status: "active",
    isPremium: true,
    pricing: "Usage-based",
    setupTime: "3 min",
    features: [
      "GPT-4 integration",
      "Resume analysis",
      "Cover letter generation",
      "Interview prep",
      "Career coaching AI"
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
    description: "Connect with 5,000+ apps via Zapier",
    longDescription: "Unlock unlimited automation possibilities by connecting AutoJobr with 5,000+ apps through Zapier. Create custom workflows without code.",
    rating: 4.8,
    installs: "1.9k",
    status: "coming-soon",
    isPremium: true,
    pricing: "Coming Soon",
    setupTime: "10 min",
    features: [
      "5,000+ app connections",
      "Custom workflows",
      "No-code automation",
      "Trigger-based actions",
      "Real-time sync"
    ]
  },
  {
    id: "slack",
    name: "Slack",
    icon: <SiSlack className="w-12 h-12 text-purple-600" />,
    category: "Communication",
    description: "Get notifications and collaborate in Slack",
    longDescription: "Receive real-time notifications in Slack for new applications, interviews, and candidate updates. Enable team collaboration directly in your workspace.",
    rating: 4.7,
    installs: "2.1k",
    status: "coming-soon",
    isPremium: false,
    pricing: "Free",
    setupTime: "3 min",
    features: [
      "Real-time notifications",
      "Team collaboration",
      "Custom alerts",
      "Slash commands",
      "Bot integration"
    ]
  },
  {
    id: "notion",
    name: "Notion",
    icon: <SiNotion className="w-12 h-12 text-black dark:text-white" />,
    category: "Productivity",
    description: "Sync candidates and jobs to Notion databases",
    longDescription: "Integrate with Notion to manage your recruitment pipeline, candidate notes, and job descriptions in your Notion workspace.",
    rating: 4.9,
    installs: "1.5k",
    status: "coming-soon",
    isPremium: true,
    pricing: "Pro plan",
    setupTime: "8 min",
    features: [
      "Database sync",
      "Pipeline management",
      "Note taking",
      "Template library",
      "Two-way sync"
    ]
  },
  {
    id: "airtable",
    name: "Airtable",
    icon: <SiAirtable className="w-12 h-12 text-yellow-600" />,
    category: "Database",
    description: "Export data to Airtable bases",
    longDescription: "Export your candidate data, applications, and analytics to Airtable for advanced reporting and custom views.",
    rating: 4.6,
    installs: "980",
    status: "beta",
    isPremium: true,
    pricing: "Pro plan",
    setupTime: "6 min",
    features: [
      "Data export",
      "Custom views",
      "Advanced filtering",
      "Collaboration",
      "API access"
    ]
  },
  {
    id: "calendly",
    name: "Calendly",
    icon: <Calendar className="w-12 h-12 text-blue-600" />,
    category: "Scheduling",
    description: "Schedule interviews with Calendly integration",
    longDescription: "Streamline interview scheduling with Calendly. Let candidates book interview slots automatically based on your availability.",
    rating: 4.8,
    installs: "3.2k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "4 min",
    features: [
      "Auto scheduling",
      "Calendar sync",
      "Email reminders",
      "Custom availability",
      "Time zone detection"
    ]
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    icon: <Mail className="w-12 h-12 text-blue-600" />,
    category: "Email",
    description: "Send transactional and marketing emails",
    longDescription: "Integrate SendGrid for reliable email delivery. Send application confirmations, interview invites, and marketing campaigns.",
    rating: 4.5,
    installs: "4.1k",
    status: "active",
    isPremium: false,
    pricing: "Free",
    setupTime: "5 min",
    features: [
      "Transactional emails",
      "Email templates",
      "Delivery analytics",
      "A/B testing",
      "SMTP relay"
    ]
  },
  {
    id: "zoom",
    name: "Zoom",
    icon: <Video className="w-12 h-12 text-blue-600" />,
    category: "Video",
    description: "Conduct video interviews via Zoom",
    longDescription: "Host virtual interviews with Zoom integration. Automatically create meeting links and send invites to candidates.",
    rating: 4.7,
    installs: "5.6k",
    status: "coming-soon",
    isPremium: true,
    pricing: "Pro plan",
    setupTime: "5 min",
    features: [
      "Meeting creation",
      "Auto invites",
      "Recording",
      "Screen sharing",
      "Waiting rooms"
    ]
  }
];

const categories = [
  "All",
  "Payments",
  "AI/ML",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [activeIntegrations, setActiveIntegrations] = useState<any[]>([]); // Assuming this state will hold connected integrations

  // Fetch user data to determine user type
  const { data: user } = useQuery<{userType?: string; planType?: string}>({
    queryKey: ['/api/user']
  });

  const isRecruiter = user?.userType === 'recruiter';
  const isPremium = user?.planType === 'premium' || user?.planType === 'enterprise' || 
                     user?.planType === 'ultra-plan' || user?.planType === 'professional';

  // Filter integrations
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = (integration: Integration) => {
    // Check if already connected
    const isConnected = activeIntegrations.some((int: any) => 
      int.platformName === integration.id || int.integrationId === integration.id
    );

    if (isConnected) {
      toast({
        title: "Already Connected",
        description: `${integration.name} is already connected to your account.`,
      });
      return;
    }

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

    toast({
      title: "🎉 Integration Connected!",
      description: `${selectedIntegration.name} has been added to your account. Configure it in Settings.`,
    });
    // Add the integration to activeIntegrations state
    setActiveIntegrations(prev => [...prev, selectedIntegration]);
    setShowDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {isRecruiter ? <RecruiterNavbar /> : <Navbar />}

      <div className="container mx-auto px-4 py-12 space-y-8" data-testid="integration-marketplace-page">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-10 h-10 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent" data-testid="text-page-title">
              Integration Marketplace
            </h1>
          </div>
          <p className="text-xl text-muted-foreground" data-testid="text-page-description">
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
              data-testid="input-search"
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

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground mt-1">Integrations</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">9</div>
                <div className="text-sm text-muted-foreground mt-1">Active</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">2</div>
                <div className="text-sm text-muted-foreground mt-1">Beta</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">3</div>
                <div className="text-sm text-muted-foreground mt-1">Coming Soon</div>
              </div>
            </CardContent>
          </Card>
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

              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {integration.icon}
                    <div>
                      <CardTitle className="text-xl" data-testid={`text-integration-name-${integration.id}`}>
                        {integration.name}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription data-testid={`text-description-${integration.id}`}>
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
                  {integration.status === 'active' ? 'Connect Now' : 'Learn More'}
                  <ArrowRight className="w-4 h-4 ml-2" />
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
        <DialogContent className="sm:max-w-2xl" data-testid="dialog-integration-detail">
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
                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{selectedIntegration.rating} rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedIntegration.installs} installs</span>
                  </div>
                  {selectedIntegration.pricing && (
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <span>{selectedIntegration.pricing}</span>
                    </div>
                  )}
                  {selectedIntegration.setupTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span>{selectedIntegration.setupTime} setup</span>
                    </div>
                  )}
                </div>

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

                {/* CTA */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1"
                    onClick={installIntegration}
                    disabled={selectedIntegration.status !== 'active'}
                    data-testid="button-install-integration"
                  >
                    {selectedIntegration.status === 'active' ? (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Install Integration
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