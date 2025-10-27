import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Mail, Lock, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  applicationAlerts: boolean;
  weeklyReports: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
}

export default function RecruiterSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    applicationAlerts: true,
    weeklyReports: false,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 60,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { notifications?: NotificationSettings; security?: SecuritySettings }) => {
      return await apiRequest('/api/recruiter/settings', 'PUT', settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    setNotificationSettings(newSettings);
    updateSettingsMutation.mutate({ notifications: newSettings });
  };

  const handleSecurityChange = (key: keyof SecuritySettings, value: boolean | number) => {
    const newSettings = {
      ...securitySettings,
      [key]: value,
    };
    setSecuritySettings(newSettings);
    updateSettingsMutation.mutate({ security: newSettings });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and security settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive email updates about your account
                </p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={() => handleNotificationChange('emailNotifications')}
                data-testid="switch-email-notifications"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Application Alerts</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when candidates apply to your jobs
                </p>
              </div>
              <Switch
                checked={notificationSettings.applicationAlerts}
                onCheckedChange={() => handleNotificationChange('applicationAlerts')}
                data-testid="switch-application-alerts"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Weekly Reports</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive weekly analytics reports
                </p>
              </div>
              <Switch
                checked={notificationSettings.weeklyReports}
                onCheckedChange={() => handleNotificationChange('weeklyReports')}
                data-testid="switch-weekly-reports"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <CardTitle>Security & Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                data-testid="switch-two-factor"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label className="text-base font-medium">Session Timeout (minutes)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value) || 60)}
                  className="w-32"
                  min="15"
                  max="480"
                  data-testid="input-session-timeout"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically log out after this period of inactivity
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              <CardTitle>Password & Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                For security reasons, password changes require email verification.
              </p>
              <Button variant="outline" data-testid="button-change-password">
                <Mail className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Changes */}
        <div className="flex justify-end">
          <Button 
            onClick={() => updateSettingsMutation.mutate({ 
              notifications: notificationSettings, 
              security: securitySettings 
            })}
            disabled={updateSettingsMutation.isPending}
            data-testid="button-save-settings"
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}