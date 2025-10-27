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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { 
  insertBidderRegistrationSchema, 
  type SelectBidderRegistration 
} from "@shared/schema";
import { 
  User, 
  Camera, 
  Upload, 
  CreditCard, 
  DollarSign, 
  Building2, 
  Globe, 
  Phone, 
  MapPin,
  Star,
  Shield,
  ExternalLink,
  Settings,
  Trash2,
  Edit3,
  Save,
  CheckCircle,
  Building,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";

// Enhanced profile form with all new fields
function BidderProfileForm({ existingRegistration, onSuccess }: { 
  existingRegistration?: SelectBidderRegistration; 
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const form = useForm({
    resolver: zodResolver(insertBidderRegistrationSchema.extend({
      skills: insertBidderRegistrationSchema.shape.skills.optional(),
      hourlyRate: insertBidderRegistrationSchema.shape.hourlyRate.optional(),
      profilePhotoUrl: insertBidderRegistrationSchema.shape.profilePhotoUrl.optional(),
      businessLogoUrl: insertBidderRegistrationSchema.shape.businessLogoUrl.optional(),
      preferredPaymentMethod: insertBidderRegistrationSchema.shape.preferredPaymentMethod.optional(),
      paypalEmail: insertBidderRegistrationSchema.shape.paypalEmail.optional(),
      stripeAccountId: insertBidderRegistrationSchema.shape.stripeAccountId.optional(),
      taxId: insertBidderRegistrationSchema.shape.taxId.optional(),
      address: insertBidderRegistrationSchema.shape.address.optional(),
      phone: insertBidderRegistrationSchema.shape.phone.optional(),
      websiteUrl: insertBidderRegistrationSchema.shape.websiteUrl.optional(),
    })),
    defaultValues: {
      userId: user?.id || "",
      businessName: existingRegistration?.businessName || "",
      skills: existingRegistration?.skills || "",
      hourlyRate: existingRegistration?.hourlyRate || 0,
      portfolioUrl: existingRegistration?.portfolioUrl || "",
      bio: existingRegistration?.bio || "",
      profilePhotoUrl: existingRegistration?.profilePhotoUrl || "",
      businessLogoUrl: existingRegistration?.businessLogoUrl || "",
      preferredPaymentMethod: existingRegistration?.preferredPaymentMethod || "paypal",
      paypalEmail: existingRegistration?.paypalEmail || "",
      stripeAccountId: existingRegistration?.stripeAccountId || "",
      taxId: existingRegistration?.taxId || "",
      address: existingRegistration?.address || "",
      phone: existingRegistration?.phone || "",
      websiteUrl: existingRegistration?.websiteUrl || "",
    },
  });

  const handleFileUpload = async (file: File, type: 'profile' | 'logo') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    try {
      const response = await fetch('/api/upload/bidder-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
      return null;
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Handle file uploads first
      if (profilePhotoFile) {
        const photoUrl = await handleFileUpload(profilePhotoFile, 'profile');
        if (photoUrl) data.profilePhotoUrl = photoUrl;
      }
      
      if (logoFile) {
        const logoUrl = await handleFileUpload(logoFile, 'logo');
        if (logoUrl) data.businessLogoUrl = logoUrl;
      }
      
      const url = existingRegistration 
        ? `/api/bidders/registration/${user?.id}`
        : '/api/bidders/registration';
      
      const response = await fetch(url, {
        method: existingRegistration ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save profile');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/bidders/registration'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate({
      ...data,
      hourlyRate: data.hourlyRate ? Math.round(data.hourlyRate * 100) : 0,
    });
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Profile Photos Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Photo */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={form.watch('profilePhotoUrl')} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProfilePhotoFile(file);
                        }}
                        data-testid="input-profile-photo"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload a professional headshot
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Logo */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">Business Logo</label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={form.watch('businessLogoUrl')} />
                      <AvatarFallback>
                        <Building2 className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setLogoFile(file);
                        }}
                        data-testid="input-business-logo"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional business or brand logo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-phone"
                          placeholder="+1 (555) 123-4567" 
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="textarea-address"
                        placeholder="Your business address for invoicing and contracts" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-website"
                          placeholder="https://your-website.com" 
                          {...field} 
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
                          data-testid="input-portfolio"
                          placeholder="https://your-portfolio.com" 
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
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="textarea-bio"
                        placeholder="Tell potential clients about your experience and expertise..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Skills & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Skills & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills & Expertise</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-skills"
                        placeholder="e.g., React, Node.js, UI/UX Design, Digital Marketing" 
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
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="preferredPaymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('preferredPaymentMethod') === 'paypal' && (
                <FormField
                  control={form.control}
                  name="paypalEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PayPal Email</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-paypal-email"
                          placeholder="your.paypal@email.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID / EIN (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-tax-id"
                        placeholder="For business invoicing" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              data-testid="button-save-profile"
              type="submit" 
              disabled={updateProfileMutation.isPending}
              className="min-w-[150px]"
              size="lg"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function BidderProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Get bidder registration
  const { data: bidderRegistration, isLoading } = useQuery({
    queryKey: ['/api/bidders/registration', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/bidders/registration/${user?.id}`);
      if (!res.ok) {
        console.warn('Failed to fetch bidder registration:', res.status);
        return null;
      }
      return res.json();
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <div data-testid="text-loading">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Bidder Profile
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Manage your professional profile, payment settings, and business information
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <BidderProfileForm 
            existingRegistration={bidderRegistration}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/bidders/registration'] });
            }} 
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${((bidderRegistration?.totalEarnings || 0) / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Earnings</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {bidderRegistration?.completedProjects || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed Projects</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    {bidderRegistration?.rating || '0.00'}
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bidderRegistration?.preferredPaymentMethod === 'paypal' && bidderRegistration?.paypalEmail && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">PayPal</div>
                        <div className="text-sm text-muted-foreground">{bidderRegistration.paypalEmail}</div>
                      </div>
                    </div>
                    <Badge variant="default">Primary</Badge>
                  </div>
                )}
                {(!bidderRegistration?.preferredPaymentMethod || !bidderRegistration?.paypalEmail) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No payment methods configured</p>
                    <p className="text-sm">Add your payment information in the Profile tab</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-5 w-5 ${bidderRegistration?.verified ? 'text-green-500' : 'text-gray-400'}`} />
                    <span>Profile Verification</span>
                  </div>
                  <Badge variant={bidderRegistration?.verified ? 'default' : 'outline'}>
                    {bidderRegistration?.verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Account Active</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Profile Completion</span>
                  <span className="font-medium">
                    {bidderRegistration ? '85%' : '15%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: bidderRegistration ? '85%' : '15%' }}
                  ></div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Complete your profile to attract more clients and increase your earning potential.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}