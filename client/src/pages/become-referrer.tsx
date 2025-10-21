import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Mail, 
  Building, 
  User, 
  Shield, 
  DollarSign, 
  Clock, 
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';

const BecomeReferrer: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyEmail: '',
    companyName: '',
    jobTitle: '',
    department: '',
    linkedinProfile: '',
    isAnonymous: false,
    displayName: '',
    yearsAtCompany: '',
    bio: '',
    specialties: [] as string[],
    availableRoles: [] as string[],
    meetingScheduleLink: '',
    emailTemplate: ''
  });

  const [currentSpecialty, setCurrentSpecialty] = useState('');
  const [currentRole, setCurrentRole] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSpecialty = () => {
    if (currentSpecialty.trim() && !formData.specialties.includes(currentSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, currentSpecialty.trim()]
      }));
      setCurrentSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const addRole = () => {
    if (currentRole.trim() && !formData.availableRoles.includes(currentRole.trim())) {
      setFormData(prev => ({
        ...prev,
        availableRoles: [...prev.availableRoles, currentRole.trim()]
      }));
      setCurrentRole('');
    }
  };

  const removeRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      availableRoles: prev.availableRoles.filter(r => r !== role)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/auth-page';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/referral-marketplace/referrer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          yearsAtCompany: formData.yearsAtCompany ? parseInt(formData.yearsAtCompany) : undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(3); // Success step
      } else {
        alert('Failed to create referrer profile: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating referrer profile:', error);
      alert('Failed to create referrer profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to become a referrer</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/auth-page'}
              className="w-full"
            >
              Login / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Become a Referrer</h1>
            <p className="text-gray-600 text-lg mb-4">
              Help job seekers while earning money by sharing your company knowledge and network
            </p>

            {/* Navigation Submenu */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <Button
                asChild
                variant="outline" 
                size="sm"
              >
                <Link href="/referral-marketplace">Browse Services</Link>
              </Button>
              <Button
                asChild
                variant="outline" 
                size="sm"
              >
                <Link href="/my-bookings">My Bookings</Link>
              </Button>
              <Button
                asChild
                variant="outline" 
                size="sm"
                className="bg-blue-50 border-blue-200 text-blue-700"
              >
                <Link href="/become-referrer">Become a Referrer</Link>
              </Button>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Earn Money</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Set your own prices for career advice, interview prep, and referral services. 
                  Earn $50-200+ per session.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Stay Anonymous</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Choose to remain anonymous while still showcasing your company and role. 
                  Your privacy is protected.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Flexible Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Work on your own schedule. Set your availability and choose which 
                  sessions to accept.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Three simple steps to start earning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-medium mb-2">Verify Your Profile</h3>
                  <p className="text-sm text-gray-600">
                    Verify your company email and create your profile with the option to stay anonymous
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h3 className="font-medium mb-2">Create Service Listings</h3>
                  <p className="text-sm text-gray-600">
                    Set up your services: career advice, interview prep, or referral opportunities
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <h3 className="font-medium mb-2">Start Earning</h3>
                  <p className="text-sm text-gray-600">
                    Accept bookings, help job seekers, and earn money with secure escrow payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Types */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Service Types You Can Offer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">🤝 Intro Meeting + Optional Referral</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    20-30 min session sharing company culture, role expectations, and optionally submitting a referral if you feel the candidate is a good fit.
                  </p>
                  <p className="text-sm font-medium text-green-600">Typical earnings: $50-100</p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">📚 Interview Preparation</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Share real interview insights, typical questions, evaluation focus, and conduct mock interviews with detailed feedback.
                  </p>
                  <p className="text-sm font-medium text-green-600">Typical earnings: $80-150</p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">🎯 Ongoing Mentorship</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Multi-session package including resume feedback, networking tactics, application strategy, and continuous Q&A support.
                  </p>
                  <p className="text-sm font-medium text-green-600">Typical earnings: $150-300</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              onClick={() => setStep(2)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create Your Referrer Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Company Verification
                </CardTitle>
                <CardDescription>
                  We'll send a verification email to your company email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyEmail">Company Email *</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    placeholder="john@company.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be your official company email (not Gmail, Yahoo, etc.)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Microsoft"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      placeholder="Software Engineer"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Engineering"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearsAtCompany">Years at Company</Label>
                    <Input
                      id="yearsAtCompany"
                      type="number"
                      value={formData.yearsAtCompany}
                      onChange={(e) => handleInputChange('yearsAtCompany', e.target.value)}
                      placeholder="3"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="linkedinProfile">LinkedIn Profile (Optional)</Label>
                  <Input
                    id="linkedinProfile"
                    value={formData.linkedinProfile}
                    onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAnonymous"
                    checked={formData.isAnonymous}
                    onCheckedChange={(checked) => handleInputChange('isAnonymous', checked)}
                  />
                  <Label htmlFor="isAnonymous" className="text-sm">
                    Keep my identity anonymous (recommended)
                  </Label>
                </div>

                {formData.isAnonymous && (
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      placeholder="e.g., Microsoft Engineer, Google PM, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is how you'll appear to job seekers (company and role will still be shown)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell job seekers about your background and how you can help them..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Specialties</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentSpecialty}
                      onChange={(e) => setCurrentSpecialty(e.target.value)}
                      placeholder="e.g., System Design, Frontend, Data Science"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSpecialty(specialty)}>
                        {specialty} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Roles You Can Help With</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      placeholder="e.g., Software Engineer, Product Manager"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                    />
                    <Button type="button" onClick={addRole} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.availableRoles.map((role, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeRole(role)}>
                        {role} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Meeting Scheduling (Optional)
                </CardTitle>
                <CardDescription>
                  Set up your meeting scheduling link (Calendly, Cal.com, etc.) for automated booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meetingScheduleLink">Meeting Schedule Link</Label>
                  <Input
                    id="meetingScheduleLink"
                    value={formData.meetingScheduleLink}
                    onChange={(e) => handleInputChange('meetingScheduleLink', e.target.value)}
                    placeholder="https://calendly.com/your-link or https://cal.com/your-link"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Job seekers will use this link to schedule meetings with you
                  </p>
                </div>

                <div>
                  <Label htmlFor="emailTemplate">Default Meeting Email Template (Optional)</Label>
                  <Textarea
                    id="emailTemplate"
                    value={formData.emailTemplate}
                    onChange={(e) => handleInputChange('emailTemplate', e.target.value)}
                    placeholder="Hi! Looking forward to our meeting. Please use the link above to schedule a convenient time..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will be included when sending meeting invitations to job seekers
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating Profile...' : 'Create Profile & Send Verification'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardHeader>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle>Profile Created Successfully!</CardTitle>
              <CardDescription>
                We've sent a verification email to {formData.companyEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-left">
                    <h4 className="font-medium text-yellow-800">Next Steps:</h4>
                    <ol className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>1. Check your company email for our verification message</li>
                      <li>2. Click the verification link in the email</li>
                      <li>3. Once verified, you can create service listings</li>
                      <li>4. Start earning by helping job seekers!</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  asChild
                  className="w-full"
                >
                  <Link href="/referrer-dashboard">Go to Referrer Dashboard</Link>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/referral-marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default BecomeReferrer;