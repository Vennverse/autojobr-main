
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  Check,
  X,
  RefreshCw,
  Settings,
  Zap,
  Calendar,
  MessageSquare,
  Shield,
  BarChart3,
  Link as LinkIcon,
  ExternalLink,
  Globe,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function IntegrationsMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configData, setConfigData] = useState<any>({});

  // Fetch available integrations
  const { data: availableIntegrations = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ["/api/integrations/available", selectedCategory],
  });

  // Fetch user's active integrations
  const { data: activeIntegrations = [], isLoading: loadingActive } = useQuery({
    queryKey: ["/api/integrations/active"],
  });

  // Connect integration mutation
  const connectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/integrations/connect", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/active"] });
      setShowConfigDialog(false);
      setConfigData({});
      toast({
        title: "✅ Integration Connected",
        description: "Integration configured successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect integration. Please check your credentials.",
        variant: "destructive",
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/integrations/test", "POST", data);
    },
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "✅ Connection Successful" : "❌ Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    }
  });

  // Sync integration mutation
  const syncMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      return apiRequest(`/api/integrations/${integrationId}/sync`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/active"] });
      toast({
        title: "Sync Started",
        description: "Integration sync initiated successfully.",
      });
    }
  });

  // Disconnect integration mutation
  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      return apiRequest(`/api/integrations/${integrationId}/disconnect`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/active"] });
      toast({
        title: "Integration Disconnected",
        description: "Integration removed successfully.",
      });
    }
  });

  const categories = [
    { id: "all", name: "All Integrations", icon: Globe },
    { id: "ats", name: "ATS Platforms", icon: BarChart3 },
    { id: "job_board", name: "Job Boards", icon: LinkIcon },
    { id: "calendar", name: "Calendar", icon: Calendar },
    { id: "communication", name: "Communication", icon: MessageSquare },
    { id: "background_check", name: "Background Checks", icon: Shield },
    { id: "assessment", name: "Assessments", icon: Zap },
  ];

  const handleConnect = (integration: any) => {
    setSelectedIntegration(integration);
    setShowConfigDialog(true);
  };

  const handleSubmitConfig = () => {
    connectMutation.mutate({
      integrationId: selectedIntegration.id,
      config: configData
    });
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate({
      integrationId: selectedIntegration.id,
      config: configData
    });
  };

  const filteredIntegrations = availableIntegrations.filter((int: any) => {
    const matchesSearch = !searchTerm || 
      int.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      int.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || int.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const isIntegrationActive = (integrationId: string) => {
    return activeIntegrations.some((int: any) => int.platformName === integrationId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <RecruiterNavbar user={user} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Integrations Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your favorite tools and automate your recruiting workflow
          </p>
        </motion.div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid grid-cols-7 w-full">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                <cat.icon className="w-4 h-4" />
                <span className="hidden md:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Active Integrations */}
        {activeIntegrations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Active Integrations ({activeIntegrations.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeIntegrations.map((integration: any) => (
                <Card key={integration.id} className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{integration.config?.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {integration.syncStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncMutation.mutate(integration.id)}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Sync
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => disconnectMutation.mutate(integration.id)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Integrations */}
        <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration: any) => {
            const isActive = isIntegrationActive(integration.id);
            
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={isActive ? "border-green-200 dark:border-green-800" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <LinkIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {integration.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      {isActive && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {integration.description}
                    </CardDescription>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold">Features:</p>
                      <ul className="text-xs space-y-1">
                        {integration.features.slice(0, 3).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleConnect(integration)}
                      disabled={isActive}
                    >
                      {isActive ? "Connected" : "Connect"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Configuration Dialog */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {selectedIntegration?.fields?.map((field: any) => (
                <div key={field.name}>
                  <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={configData[field.name] || ''}
                    onChange={(e) => setConfigData({ ...configData, [field.name]: e.target.value })}
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending}
                  className="flex-1"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                <Button
                  onClick={handleSubmitConfig}
                  disabled={connectMutation.isPending}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
