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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Key,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Link,
  Globe,
  Lock,
  UserCheck,
  Activity,
  Building,
  Mail,
  Clock,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface SSOProvider {
  id: string;
  name: string;
  type: "saml" | "oidc" | "oauth";
  isActive: boolean;
  configuration: {
    entityId?: string;
    singleSignOnServiceUrl?: string;
    x509Certificate?: string;
    clientId?: string;
    clientSecret?: string;
    discoveryUrl?: string;
    scopes?: string[];
    attributeMappings: {
      email: string;
      firstName: string;
      lastName: string;
      groups?: string;
      department?: string;
    };
  };
  lastUsed?: string;
  totalUsers: number;
  status: "active" | "inactive" | "error";
  errorMessage?: string;
}

interface SSOSession {
  id: string;
  userId: string;
  userEmail: string;
  provider: string;
  loginAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export default function SSOConfiguration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [showNewProviderDialog, setShowNewProviderDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [providerType, setProviderType] = useState<"saml" | "oidc" | "oauth">("saml");
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  // Fetch SSO providers
  const { data: ssoProviders = [], isLoading: providersLoading, refetch: refetchProviders } = useQuery<SSOProvider[]>({
    queryKey: ["/api/admin/sso/providers"],
  });

  // Fetch SSO sessions
  const { data: ssoSessions = [], isLoading: sessionsLoading } = useQuery<SSOSession[]>({
    queryKey: ["/api/admin/sso/sessions"],
    refetchInterval: 30000,
  });

  // Fetch SSO analytics
  const { data: ssoAnalytics } = useQuery({
    queryKey: ["/api/admin/sso/analytics"],
  });

  // Create/Update SSO provider mutation
  const providerMutation = useMutation({
    mutationFn: async (providerData: any) => {
      const endpoint = providerData.id 
        ? `/api/admin/sso/providers/${providerData.id}`
        : "/api/admin/sso/providers";
      const method = providerData.id ? "PUT" : "POST";
      
      return apiRequest(endpoint, {
        method,
        body: providerData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sso/providers"] });
      setShowNewProviderDialog(false);
      setSelectedProvider(null);
      toast({
        title: "SSO Provider Saved",
        description: "SSO provider configuration updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save SSO provider configuration.",
        variant: "destructive",
      });
    }
  });

  // Toggle provider status mutation
  const toggleProviderMutation = useMutation({
    mutationFn: async ({ providerId, isActive }: { providerId: string; isActive: boolean }) => {
      return apiRequest(`/api/admin/sso/providers/${providerId}/toggle`, {
        method: "POST",
        body: { isActive }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sso/providers"] });
      toast({
        title: "Provider Status Updated",
        description: "SSO provider status changed successfully.",
      });
    }
  });

  // Test SSO connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (providerId: string) => {
      return apiRequest(`/api/admin/sso/providers/${providerId}/test`, {
        method: "POST"
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Test",
        description: data.success ? "SSO connection successful!" : "SSO connection failed.",
        variant: data.success ? "default" : "destructive",
      });
    }
  });

  // Revoke SSO session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest(`/api/admin/sso/sessions/${sessionId}/revoke`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sso/sessions"] });
      toast({
        title: "Session Revoked",
        description: "SSO session has been revoked successfully.",
      });
    }
  });

  // Delete provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      return apiRequest(`/api/admin/sso/providers/${providerId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sso/providers"] });
      toast({
        title: "Provider Deleted",
        description: "SSO provider has been deleted successfully.",
      });
    }
  });

  // Generate metadata for SAML
  const generateMetadata = async () => {
    try {
      const response = await fetch("/api/admin/sso/saml/metadata");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sp-metadata.xml';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate SAML metadata.",
        variant: "destructive",
      });
    }
  };

  // Copy configuration value
  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied",
      description: "Value copied to clipboard.",
    });
  };

  if (providersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <RecruiterNavbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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
              Single Sign-On (SSO) Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage enterprise authentication and identity providers
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowNewProviderDialog(true)}
              data-testid="button-add-sso-provider"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
            <Button 
              onClick={generateMetadata}
              variant="outline"
              data-testid="button-download-metadata"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Metadata
            </Button>
            <Button 
              onClick={() => refetchProviders()}
              variant="outline"
              data-testid="button-refresh-sso"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* SSO Analytics */}
        {ssoAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Providers</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{ssoProviders.length}</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Sessions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {ssoSessions.filter(session => session.isActive).length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">SSO Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {ssoProviders.reduce((total, provider) => total + provider.totalUsers, 0)}
                    </p>
                  </div>
                  <UserCheck className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {ssoAnalytics.successRate || 99}%
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">SSO Providers</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            {/* SSO Providers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ssoProviders.map((provider) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`cursor-pointer hover:shadow-lg transition-all ${
                    provider.status === "error" ? "border-red-200 bg-red-50/50 dark:bg-red-900/10" :
                    provider.isActive ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : ""
                  }`} data-testid={`card-provider-${provider.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            provider.type === "saml" ? "bg-blue-100 dark:bg-blue-900/20" :
                            provider.type === "oidc" ? "bg-green-100 dark:bg-green-900/20" :
                            "bg-purple-100 dark:bg-purple-900/20"
                          }`}>
                            {provider.type === "saml" ? <Shield className="w-5 h-5 text-blue-600" /> :
                             provider.type === "oidc" ? <Key className="w-5 h-5 text-green-600" /> :
                             <Globe className="w-5 h-5 text-purple-600" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{provider.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 uppercase">
                              {provider.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={provider.isActive}
                            onCheckedChange={(checked) => {
                              toggleProviderMutation.mutate({
                                providerId: provider.id,
                                isActive: checked
                              });
                            }}
                            data-testid={`switch-provider-${provider.id}`}
                          />
                          <Badge 
                            variant={provider.status === "active" ? "default" : 
                                    provider.status === "error" ? "destructive" : "secondary"}
                          >
                            {provider.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Users:</span>
                          <p className="font-medium">{provider.totalUsers}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Last Used:</span>
                          <p className="font-medium">
                            {provider.lastUsed ? new Date(provider.lastUsed).toLocaleDateString() : "Never"}
                          </p>
                        </div>
                      </div>

                      {provider.status === "error" && provider.errorMessage && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 dark:text-red-300">
                            {provider.errorMessage}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Configuration</h4>
                        <div className="space-y-1 text-xs">
                          {provider.type === "saml" && provider.configuration.entityId && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span>Entity ID:</span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono truncate max-w-32">
                                  {provider.configuration.entityId}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(provider.configuration.entityId!)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {provider.type === "oidc" && provider.configuration.clientId && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span>Client ID:</span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono truncate max-w-32">
                                  {provider.configuration.clientId}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(provider.configuration.clientId!)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedProvider(provider)}
                          data-testid={`button-edit-${provider.id}`}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testConnectionMutation.mutate(provider.id)}
                          disabled={testConnectionMutation.isPending}
                          data-testid={`button-test-${provider.id}`}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${provider.name}?`)) {
                              deleteProviderMutation.mutate(provider.id);
                            }
                          }}
                          data-testid={`button-delete-${provider.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {ssoProviders.length === 0 && (
                <div className="col-span-2">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No SSO Providers Configured
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Set up your first SSO provider to enable enterprise authentication.
                      </p>
                      <Button onClick={() => setShowNewProviderDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add SSO Provider
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Active SSO Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">User</th>
                        <th className="text-left py-3 px-4 font-medium">Provider</th>
                        <th className="text-left py-3 px-4 font-medium">Login Time</th>
                        <th className="text-left py-3 px-4 font-medium">Last Activity</th>
                        <th className="text-left py-3 px-4 font-medium">IP Address</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ssoSessions.map((session) => (
                        <tr key={session.id} className="border-b">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{session.userEmail}</div>
                              <div className="text-sm text-gray-500">{session.userId}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="uppercase">
                              {session.provider}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(session.loginAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(session.lastActivity).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm font-mono">
                            {session.ipAddress}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={session.isActive ? "default" : "secondary"}>
                              {session.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {session.isActive && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => revokeSessionMutation.mutate(session.id)}
                                data-testid={`button-revoke-${session.id}`}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Revoke
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {ssoSessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No active SSO sessions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global SSO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Default Login Method</Label>
                    <Select defaultValue="mixed">
                      <SelectTrigger data-testid="select-default-login">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sso_only">SSO Only</SelectItem>
                        <SelectItem value="password_only">Password Only</SelectItem>
                        <SelectItem value="mixed">SSO + Password</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Session Timeout (minutes)</Label>
                    <Input type="number" defaultValue="480" min="30" max="1440" />
                  </div>
                  
                  <div>
                    <Label>Concurrent Sessions</Label>
                    <Select defaultValue="unlimited">
                      <SelectTrigger data-testid="select-concurrent-sessions">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">One session only</SelectItem>
                        <SelectItem value="3">Up to 3 sessions</SelectItem>
                        <SelectItem value="5">Up to 5 sessions</SelectItem>
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Auto-provision Users</Label>
                    <Select defaultValue="enabled">
                      <SelectTrigger data-testid="select-auto-provision">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="admin_approval">Require Admin Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Force SSO for specific domains</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Automatically redirect users with these email domains to SSO
                      </p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable audit logging</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Log all SSO authentication events for compliance
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow password fallback</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Let users sign in with password if SSO is unavailable
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New/Edit Provider Dialog */}
        <Dialog 
          open={showNewProviderDialog || !!selectedProvider} 
          onOpenChange={(open) => {
            if (!open) {
              setShowNewProviderDialog(false);
              setSelectedProvider(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProvider ? `Edit ${selectedProvider.name}` : "Add New SSO Provider"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Provider Name</Label>
                  <Input 
                    placeholder="e.g., Azure AD, Okta, Google Workspace"
                    defaultValue={selectedProvider?.name}
                    data-testid="input-provider-name"
                  />
                </div>
                
                <div>
                  <Label>Provider Type</Label>
                  <Select 
                    value={selectedProvider?.type || providerType} 
                    onValueChange={(value: "saml" | "oidc" | "oauth") => setProviderType(value)}
                  >
                    <SelectTrigger data-testid="select-provider-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saml">SAML 2.0</SelectItem>
                      <SelectItem value="oidc">OpenID Connect</SelectItem>
                      <SelectItem value="oauth">OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SAML Configuration */}
              {(selectedProvider?.type === "saml" || providerType === "saml") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">SAML Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Entity ID (Issuer)</Label>
                      <Input 
                        placeholder="https://your-idp.com/entity-id"
                        defaultValue={selectedProvider?.configuration.entityId}
                        data-testid="input-entity-id"
                      />
                    </div>
                    
                    <div>
                      <Label>Single Sign-On Service URL</Label>
                      <Input 
                        placeholder="https://your-idp.com/sso"
                        defaultValue={selectedProvider?.configuration.singleSignOnServiceUrl}
                        data-testid="input-sso-url"
                      />
                    </div>
                    
                    <div>
                      <Label>X.509 Certificate</Label>
                      <Textarea 
                        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                        rows={6}
                        defaultValue={selectedProvider?.configuration.x509Certificate}
                        data-testid="textarea-x509-certificate"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => setShowCertificateDialog(true)}>
                          <Upload className="w-3 h-3 mr-1" />
                          Upload Certificate
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          Validate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* OIDC Configuration */}
              {(selectedProvider?.type === "oidc" || providerType === "oidc") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">OpenID Connect Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Discovery URL</Label>
                      <Input 
                        placeholder="https://your-oidc-provider.com/.well-known/openid-configuration"
                        defaultValue={selectedProvider?.configuration.discoveryUrl}
                        data-testid="input-discovery-url"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Client ID</Label>
                        <Input 
                          placeholder="your-client-id"
                          defaultValue={selectedProvider?.configuration.clientId}
                          data-testid="input-client-id"
                        />
                      </div>
                      
                      <div>
                        <Label>Client Secret</Label>
                        <div className="relative">
                          <Input 
                            type={showSecrets.clientSecret ? "text" : "password"}
                            placeholder="your-client-secret"
                            defaultValue={selectedProvider?.configuration.clientSecret}
                            data-testid="input-client-secret"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-1 top-1 h-8 w-8 p-0"
                            onClick={() => setShowSecrets(prev => ({ 
                              ...prev, 
                              clientSecret: !prev.clientSecret 
                            }))}
                          >
                            {showSecrets.clientSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Scopes</Label>
                      <Input 
                        placeholder="openid profile email groups"
                        defaultValue={selectedProvider?.configuration.scopes?.join(' ')}
                        data-testid="input-scopes"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Attribute Mappings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attribute Mappings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email Attribute</Label>
                      <Input 
                        placeholder="email or http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                        defaultValue={selectedProvider?.configuration.attributeMappings.email}
                        data-testid="input-email-attribute"
                      />
                    </div>
                    
                    <div>
                      <Label>First Name Attribute</Label>
                      <Input 
                        placeholder="given_name or http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
                        defaultValue={selectedProvider?.configuration.attributeMappings.firstName}
                        data-testid="input-firstname-attribute"
                      />
                    </div>
                    
                    <div>
                      <Label>Last Name Attribute</Label>
                      <Input 
                        placeholder="family_name or http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
                        defaultValue={selectedProvider?.configuration.attributeMappings.lastName}
                        data-testid="input-lastname-attribute"
                      />
                    </div>
                    
                    <div>
                      <Label>Groups Attribute (Optional)</Label>
                      <Input 
                        placeholder="groups or http://schemas.xmlsoap.org/claims/Group"
                        defaultValue={selectedProvider?.configuration.attributeMappings.groups}
                        data-testid="input-groups-attribute"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewProviderDialog(false);
                    setSelectedProvider(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Handle form submission
                    const formData = {
                      // Collect form data here
                    };
                    providerMutation.mutate(formData);
                  }}
                  disabled={providerMutation.isPending}
                  data-testid="button-save-provider"
                >
                  {providerMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Provider
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