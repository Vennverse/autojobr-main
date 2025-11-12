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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { SiPaypal, SiStripe, SiOpenai, SiGoogle, SiLinkedin, SiZapier, SiSlack, SiNotion, SiAirtable } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserIntegration {
  id: number;
  userId: string;
  integrationId: string;
  isEnabled: boolean;
  config?: any;
  hasApiKey?: boolean;
  hasApiSecret?: boolean;
  hasAccessToken?: boolean;
  hasRefreshToken?: boolean;
  features?: { name: string; path: string }[];
  setupRequired?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface IntegrationFeatureMapping {
  name: string;
  features: { name: string; path: string }[];
  requiresSetup: boolean;
  setupFields: string[];
}

const getIntegrationIcon = (id: string) => {
  const iconMap: Record<string, JSX.Element> = {
    "paypal": <SiPaypal className="w-8 h-8 text-blue-600" />,
    "stripe": <SiStripe className="w-8 h-8 text-blue-600" />,
    "openai": <SiOpenai className="w-8 h-8 text-gray-900 dark:text-white" />,
    "google-workspace": <SiGoogle className="w-8 h-8 text-red-600" />,
    "linkedin": <SiLinkedin className="w-8 h-8 text-blue-700" />,
    "zapier": <SiZapier className="w-8 h-8 text-orange-600" />,
    "slack": <SiSlack className="w-8 h-8 text-purple-600" />,
    "notion": <SiNotion className="w-8 h-8 text-gray-900 dark:text-white" />,
    "airtable": <SiAirtable className="w-8 h-8 text-yellow-600" />,
    "microsoft-calendar": <Zap className="w-8 h-8 text-blue-600" />,
  };
  return iconMap[id] || <Zap className="w-8 h-8" />;
};

const getIntegrationName = (id: string) => {
  const nameMap: Record<string, string> = {
    "paypal": "PayPal",
    "stripe": "Stripe",
    "openai": "OpenAI",
    "google-workspace": "Google Workspace",
    "linkedin": "LinkedIn",
    "zapier": "Zapier",
    "slack": "Slack",
    "notion": "Notion",
    "airtable": "Airtable",
    "calendly": "Calendly",
    "sendgrid": "SendGrid",
    "zoom": "Zoom",
    "microsoft-calendar": "Microsoft Outlook Calendar"
  };
  return nameMap[id] || id;
};

export default function IntegrationSettings() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [editingIntegration, setEditingIntegration] = useState<UserIntegration | null>(null);
  const [deletingIntegration, setDeletingIntegration] = useState<UserIntegration | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [configFields, setConfigFields] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Fetch user data to determine user type
  const { data: user } = useQuery<{userType?: string}>({
    queryKey: ['/api/user']
  });

  // Fetch user integrations
  const { data: userIntegrations = [], isLoading } = useQuery<UserIntegration[]>({
    queryKey: ['/api/integrations/user-integrations']
  });

  // Fetch integration features for editing integration
  const { data: integrationFeatures } = useQuery<IntegrationFeatureMapping>({
    queryKey: ['/api/integrations/integration-features', editingIntegration?.integrationId],
    enabled: !!editingIntegration?.integrationId
  });

  const isRecruiter = user?.userType === 'recruiter';

  // Toggle integration mutation
  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ integrationId, isEnabled }: { integrationId: string; isEnabled: boolean }) => {
      return await apiRequest(`/api/integrations/user-integrations/${integrationId}/toggle`, 'PATCH', { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/user-integrations'] });
      toast({
        title: "Integration Updated",
        description: "Integration status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update integration status.",
        variant: "destructive"
      });
    }
  });

  // Update integration mutation
  const updateIntegrationMutation = useMutation({
    mutationFn: async (data: { integrationId: string; config: Record<string, string> }) => {
      return await apiRequest('/api/integrations/user-integrations', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/user-integrations'] });
      toast({
        title: "Integration Updated",
        description: "Your integration credentials have been updated successfully.",
      });
      setShowDialog(false);
      setEditingIntegration(null);
      setConfigFields({});
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update integration",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return await apiRequest(`/api/integrations/user-integrations/${integrationId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/user-integrations'] });
      toast({
        title: "Integration Removed",
        description: "The integration has been removed from your account.",
      });
      setDeletingIntegration(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove integration.",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (integration: UserIntegration) => {
    setEditingIntegration(integration);
    setShowDialog(true);
  };

  const handleUpdate = () => {
    if (!editingIntegration || !integrationFeatures) return;

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

    updateIntegrationMutation.mutate({
      integrationId: editingIntegration.integrationId,
      config: configFields
    });
  };

  const handleDelete = (integration: UserIntegration) => {
    setDeletingIntegration(integration);
  };

  const confirmDelete = () => {
    if (deletingIntegration) {
      deleteIntegrationMutation.mutate(deletingIntegration.integrationId);
    }
  };

  // Install integration mutation
  const installMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return await apiRequest('/api/integrations/user-integrations', 'POST', {
        integrationId,
        config: {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/user-integrations'] });
      toast({
        title: "Integration Installed",
        description: "Integration has been installed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to install integration",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {isRecruiter ? <RecruiterNavbar /> : <Navbar />}

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-bold">Integration Settings</h1>
              </div>
              <p className="text-muted-foreground mt-2">
                Manage your connected integrations and API credentials
              </p>
            </div>
            <Button
              onClick={() => navigate('/integration-marketplace')}
              data-testid="button-browse-integrations"
            >
              <Zap className="w-4 h-4 mr-2" />
              Browse Marketplace
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Your credentials are secure
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  All API keys and secrets are encrypted before storage. They're only decrypted when needed for API calls and are never exposed to your browser or logs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your integrations...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && userIntegrations.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Integrations Installed</h3>
              <p className="text-muted-foreground mb-6">
                Connect your favorite tools to supercharge your AutoJobr experience
              </p>
              <Button onClick={() => navigate('/integration-marketplace')} data-testid="button-get-started">
                Browse Integration Marketplace
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Integrations List */}
        {!isLoading && userIntegrations.length > 0 && (
          <div className="space-y-4">
            {userIntegrations.map((integration) => (
              <Card key={integration.id} data-testid={`card-integration-${integration.integrationId}`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      {getIntegrationIcon(integration.integrationId)}
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">
                            {getIntegrationName(integration.integrationId)}
                          </CardTitle>
                          <Badge variant={integration.isEnabled ? "default" : "secondary"}>
                            {integration.isEnabled ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Disabled
                              </>
                            )}
                          </Badge>
                        </div>
                        <CardDescription>
                          {integration.features && integration.features.length > 0 ? (
                            <span>Used by {integration.features.length} feature{integration.features.length !== 1 ? 's' : ''}</span>
                          ) : (
                            <span>Payment integration - no configuration needed</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integration.isEnabled}
                        onCheckedChange={(checked) => 
                          toggleIntegrationMutation.mutate({ 
                            integrationId: integration.integrationId, 
                            isEnabled: checked 
                          })
                        }
                        disabled={toggleIntegrationMutation.isPending}
                        data-testid={`switch-enable-${integration.integrationId}`}
                      />
                      {integration.setupRequired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(integration)}
                          data-testid={`button-edit-${integration.integrationId}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(integration)}
                        data-testid={`button-delete-${integration.integrationId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {integration.features && integration.features.length > 0 && (
                  <CardContent className="space-y-4">
                    {/* Credentials Status */}
                    {integration.setupRequired && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 text-sm">Credentials Status:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {integration.hasApiKey !== undefined && (
                            <div className="flex items-center gap-2">
                              {integration.hasApiKey ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                              <span>API Key {integration.hasApiKey ? 'Configured' : 'Missing'}</span>
                            </div>
                          )}
                          {integration.hasApiSecret !== undefined && (
                            <div className="flex items-center gap-2">
                              {integration.hasApiSecret ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                              <span>API Secret {integration.hasApiSecret ? 'Configured' : 'Missing'}</span>
                            </div>
                          )}
                          {integration.hasAccessToken !== undefined && (
                            <div className="flex items-center gap-2">
                              {integration.hasAccessToken ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                              <span>Access Token {integration.hasAccessToken ? 'Configured' : 'Missing'}</span>
                            </div>
                          )}
                          {integration.hasRefreshToken !== undefined && (
                            <div className="flex items-center gap-2">
                              {integration.hasRefreshToken ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                              <span>Refresh Token {integration.hasRefreshToken ? 'Configured' : 'Missing'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Features Using This Integration */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">AutoJobr Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {integration.features.map((feature, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(feature.path)}
                            data-testid={`button-feature-${feature.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {feature.name}
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Integration Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          {editingIntegration && integrationFeatures && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {getIntegrationIcon(editingIntegration.integrationId)}
                  <div>
                    <div className="text-2xl">Edit {getIntegrationName(editingIntegration.integrationId)}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Update your API credentials
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-base mt-4">
                  Enter your new credentials. Leave fields empty to keep existing values.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {integrationFeatures.setupFields.map((field) => {
                  const isSecret = ['apiKey', 'apiSecret', 'accessToken', 'refreshToken', 'webhookUrl'].includes(field);
                  const fieldLabel = field
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim();

                  const fieldKey = `${editingIntegration.integrationId}-${field}`;

                  return (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field} className="flex items-center gap-2">
                        {fieldLabel}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id={field}
                          type={isSecret && !showSecrets[fieldKey] ? "password" : "text"}
                          placeholder={`Enter new ${fieldLabel.toLowerCase()}`}
                          value={configFields[field] || ''}
                          onChange={(e) => setConfigFields(prev => ({
                            ...prev,
                            [field]: e.target.value
                          }))}
                          data-testid={`input-edit-${field}`}
                        />
                        {isSecret && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => setShowSecrets(prev => ({
                              ...prev,
                              [fieldKey]: !prev[fieldKey]
                            }))}
                            data-testid={`button-toggle-visibility-${field}`}
                          >
                            {showSecrets[fieldKey] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isSecret && "Existing value is encrypted and hidden for security"}
                      </p>
                    </div>
                  );
                })}

                <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                  <Shield className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Your credentials are encrypted before storage. We never display existing values for security reasons.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingIntegration(null);
                    setConfigFields({});
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateIntegrationMutation.isPending}
                  data-testid="button-save-integration"
                >
                  {updateIntegrationMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingIntegration} onOpenChange={() => setDeletingIntegration(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Integration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingIntegration && getIntegrationName(deletingIntegration.integrationId)}? 
              This will delete all stored credentials and disable features that depend on this integration.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Remove Integration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}