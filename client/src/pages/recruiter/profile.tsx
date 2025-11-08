import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Save,
  Upload,
  Palette,
  Heart,
  Award,
  Users,
  ExternalLink,
  Briefcase,
  Sparkles
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
  companyHeroImageUrl?: string;
  companyPrimaryColor?: string;
  companySecondaryColor?: string;
  companyValues?: Array<{ icon: string; title: string; description: string }>;
  companyPerks?: Array<{ icon: string; title: string; description: string }>;
  companyCultureHighlights?: string;
  companyLinkedInUrl?: string;
  companyTwitterUrl?: string;
  companyFacebookUrl?: string;
  companyInstagramUrl?: string;
  careerPageSlug?: string;
}

export default function RecruiterProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoUploadRef = useRef<HTMLInputElement>(null);
  const heroUploadRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

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

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'hero') => {
    if (!file) return;

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingHero;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload/company-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const field = type === 'logo' ? 'companyLogoUrl' : 'companyHeroImageUrl';
      handleInputChange(field, data.url);

      toast({
        title: "Upload successful",
        description: `${type === 'logo' ? 'Logo' : 'Hero image'} uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addValue = () => {
    const current = formData.companyValues || [];
    handleInputChange('companyValues', [...current, { icon: 'Award', title: '', description: '' }]);
  };

  const updateValue = (index: number, field: string, value: string) => {
    const current = [...(formData.companyValues || [])];
    current[index] = { ...current[index], [field]: value };
    handleInputChange('companyValues', current);
  };

  const removeValue = (index: number) => {
    const current = [...(formData.companyValues || [])];
    current.splice(index, 1);
    handleInputChange('companyValues', current);
  };

  const addPerk = () => {
    const current = formData.companyPerks || [];
    handleInputChange('companyPerks', [...current, { icon: 'Heart', title: '', description: '' }]);
  };

  const updatePerk = (index: number, field: string, value: string) => {
    const current = [...(formData.companyPerks || [])];
    current[index] = { ...current[index], [field]: value };
    handleInputChange('companyPerks', current);
  };

  const removePerk = (index: number) => {
    const current = [...(formData.companyPerks || [])];
    current.splice(index, 1);
    handleInputChange('companyPerks', current);
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const careerPageUrl = formData.careerPageSlug 
    ? `/careers/${formData.careerPageSlug}`
    : formData.companyName 
    ? `/careers/${formData.companyName.toLowerCase().replace(/\s+/g, '-')}`
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {careerPageUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(careerPageUrl, '_blank')}
                data-testid="button-view-career-page"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Career Page
              </Button>
            )}
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                Edit Profile
              </Button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your personal information, company details, and career page customization
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6 flex-wrap">
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
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile?.firstName} {profile?.lastName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
                  </div>
                  {getPlanBadge(profile?.planType || 'free')}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
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

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <User className="w-4 h-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="company">
              <Building className="w-4 h-4 mr-2" />
              Company Details
            </TabsTrigger>
            <TabsTrigger value="career">
              <Sparkles className="w-4 h-4 mr-2" />
              Career Page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6 mt-6">
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
          </TabsContent>

          <TabsContent value="company" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-green-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyLogo">Company Logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {formData.companyLogoUrl && (
                        <img
                          src={formData.companyLogoUrl}
                          alt="Company logo"
                          className="w-20 h-20 object-contain border rounded"
                        />
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => logoUploadRef.current?.click()}
                          disabled={!isEditing || uploadingLogo}
                          data-testid="button-upload-logo"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                        <input
                          ref={logoUploadRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                        />
                        {formData.companyLogoUrl && isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInputChange('companyLogoUrl', '')}
                            data-testid="button-remove-logo"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Recommended: Square image, at least 200x200px</p>
                  </div>
                </div>

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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="career" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Career Page Customization
                  {profile?.planType === 'free' && (
                    <Badge variant="outline" className="ml-2">Premium Feature</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="heroImage">Hero Image</Label>
                    <div className="mt-2">
                      {formData.companyHeroImageUrl && (
                        <img
                          src={formData.companyHeroImageUrl}
                          alt="Hero"
                          className="w-full h-48 object-cover rounded border mb-2"
                        />
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => heroUploadRef.current?.click()}
                          disabled={!isEditing || uploadingHero}
                          data-testid="button-upload-hero"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingHero ? 'Uploading...' : 'Upload Hero Image'}
                        </Button>
                        <input
                          ref={heroUploadRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'hero')}
                        />
                        {formData.companyHeroImageUrl && isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInputChange('companyHeroImageUrl', '')}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Recommended: 1920x600px or larger</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">
                        <Palette className="w-4 h-4 inline mr-1" />
                        Primary Brand Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.companyPrimaryColor || '#3b82f6'}
                          onChange={(e) => handleInputChange('companyPrimaryColor', e.target.value)}
                          disabled={!isEditing}
                          className="w-20 h-10"
                        />
                        <Input
                          value={formData.companyPrimaryColor || '#3b82f6'}
                          onChange={(e) => handleInputChange('companyPrimaryColor', e.target.value)}
                          disabled={!isEditing}
                          placeholder="#3b82f6"
                          data-testid="input-primary-color"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">
                        <Palette className="w-4 h-4 inline mr-1" />
                        Secondary Brand Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={formData.companySecondaryColor || '#1e40af'}
                          onChange={(e) => handleInputChange('companySecondaryColor', e.target.value)}
                          disabled={!isEditing}
                          className="w-20 h-10"
                        />
                        <Input
                          value={formData.companySecondaryColor || '#1e40af'}
                          onChange={(e) => handleInputChange('companySecondaryColor', e.target.value)}
                          disabled={!isEditing}
                          placeholder="#1e40af"
                          data-testid="input-secondary-color"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Company Values</Label>
                    <div className="space-y-3">
                      {(formData.companyValues || []).map((value, index) => (
                        <div key={index} className="flex gap-2 p-3 border rounded">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Value title (e.g., Innovation)"
                              value={value.title}
                              onChange={(e) => updateValue(index, 'title', e.target.value)}
                              disabled={!isEditing}
                            />
                            <Input
                              placeholder="Description"
                              value={value.description}
                              onChange={(e) => updateValue(index, 'description', e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                          {isEditing && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeValue(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addValue}
                          className="w-full"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Add Value
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Company Perks & Benefits</Label>
                    <div className="space-y-3">
                      {(formData.companyPerks || []).map((perk, index) => (
                        <div key={index} className="flex gap-2 p-3 border rounded">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Perk title (e.g., Health Insurance)"
                              value={perk.title}
                              onChange={(e) => updatePerk(index, 'title', e.target.value)}
                              disabled={!isEditing}
                            />
                            <Input
                              placeholder="Description"
                              value={perk.description}
                              onChange={(e) => updatePerk(index, 'description', e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                          {isEditing && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePerk(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addPerk}
                          className="w-full"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Add Perk
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cultureHighlights">Culture Highlights</Label>
                    <Textarea
                      id="cultureHighlights"
                      value={formData.companyCultureHighlights || ''}
                      onChange={(e) => handleInputChange('companyCultureHighlights', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Describe your company culture, work environment, and what makes your team special..."
                      rows={4}
                      data-testid="textarea-culture-highlights"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                      <Input
                        id="linkedinUrl"
                        value={formData.companyLinkedInUrl || ''}
                        onChange={(e) => handleInputChange('companyLinkedInUrl', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://linkedin.com/company/..."
                        data-testid="input-linkedin-url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitterUrl">Twitter URL</Label>
                      <Input
                        id="twitterUrl"
                        value={formData.companyTwitterUrl || ''}
                        onChange={(e) => handleInputChange('companyTwitterUrl', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://twitter.com/..."
                        data-testid="input-twitter-url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl">Facebook URL</Label>
                      <Input
                        id="facebookUrl"
                        value={formData.companyFacebookUrl || ''}
                        onChange={(e) => handleInputChange('companyFacebookUrl', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://facebook.com/..."
                        data-testid="input-facebook-url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl">Instagram URL</Label>
                      <Input
                        id="instagramUrl"
                        value={formData.companyInstagramUrl || ''}
                        onChange={(e) => handleInputChange('companyInstagramUrl', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://instagram.com/..."
                        data-testid="input-instagram-url"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="careerSlug">Career Page URL Slug</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">/careers/</span>
                      <Input
                        id="careerSlug"
                        value={formData.careerPageSlug || ''}
                        onChange={(e) => handleInputChange('careerPageSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        disabled={!isEditing}
                        placeholder="your-company-name"
                        className="flex-1"
                        data-testid="input-career-slug"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Your career page will be available at: {window.location.origin}/careers/{formData.careerPageSlug || formData.companyName?.toLowerCase().replace(/\s+/g, '-') || 'your-company'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
