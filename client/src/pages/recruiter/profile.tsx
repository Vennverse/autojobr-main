import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Camera, 
  Crown,
  Star,
  Calendar,
  Save
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyWebsite: string;
  profileImageUrl: string;
  planType: string;
  subscriptionStatus: string;
  phone?: string;
  location?: string;
  bio?: string;
  companyDescription?: string;
  companySize?: string;
  industry?: string;
  createdAt: string;
  companyLogoUrl?: string;
}

export default function RecruiterProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/recruiter/profile'],
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return await apiRequest('/api/recruiter/profile', 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/profile'] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setIsEditing(false);
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'premium':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        );
      case 'enterprise':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Star className="w-3 h-3 mr-1" />
            Enterprise
          </Badge>
        );
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your personal and company information
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.profileImageUrl || profile?.profileImageUrl} alt="Profile" />
                  <AvatarFallback className="text-xl">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    data-testid="button-upload-photo"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile?.firstName} {profile?.lastName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
                  </div>
                  {getPlanBadge(profile?.planType || 'free')}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    <span>{profile?.companyName || 'No company'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {profile?.createdAt && formatDate(profile.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  data-testid="input-first-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  data-testid="input-last-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    value={formData.email || ''}
                    disabled
                    className="flex-1"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                    className="flex-1"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                  placeholder="City, State, Country"
                  data-testid="input-location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                placeholder="Tell us about your professional background and recruiting experience..."
                rows={4}
                data-testid="textarea-bio"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-green-600" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  disabled={!isEditing}
                  data-testid="input-company-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  id="companyWebsite"
                  value={formData.companyWebsite || ''}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://company.com"
                  data-testid="input-company-website"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Technology, Healthcare, Finance..."
                  data-testid="input-industry"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Input
                  id="companySize"
                  value={formData.companySize || ''}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  disabled={!isEditing}
                  placeholder="1-10, 11-50, 51-200, 200+"
                  data-testid="input-company-size"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyDescription">Company Description</Label>
                <Textarea
                  id="companyDescription"
                  value={formData.companyDescription || ''}
                  onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Describe your company, its mission, and what makes it unique..."
                  rows={4}
                  data-testid="textarea-company-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyLogoUrl">Company Logo URL (Optional)</Label>
                <Input
                  id="companyLogoUrl"
                  value={formData.companyLogoUrl || ''}
                  onChange={(e) => handleInputChange('companyLogoUrl', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://example.com/logo.png"
                  data-testid="input-company-logo"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
