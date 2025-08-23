import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Upload, FileText, AlertCircle, Star, TrendingUp, Zap, Target } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

interface OnboardingStatus {
  onboardingCompleted: boolean;
  profileCompleteness: number;
  completedSteps: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    completed: boolean;
    label: string;
  }>;
  hasResume: boolean;
  atsScore: number | null;
}

interface ResumeAnalysis {
  atsScore: number;
  analysis: {
    recommendations: string[];
    keywordOptimization: {
      missingKeywords: string[];
      overusedKeywords: string[];
      suggestions: string[];
    };
    formatting: {
      score: number;
      issues: string[];
      improvements: string[];
    };
    content: {
      strengthsFound: string[];
      weaknesses: string[];
      suggestions: string[];
    };
  };
}

const WORK_AUTH_OPTIONS = [
  { value: "citizen", label: "US Citizen" },
  { value: "permanent_resident", label: "Permanent Resident (Green Card)" },
  { value: "visa_required", label: "Require Visa Sponsorship" }
];

const WORK_MODE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" }
];

const NOTICE_PERIOD_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "1_month", label: "1 Month" },
  { value: "2_months", label: "2 Months" }
];

const DEGREE_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "associates", label: "Associate's Degree" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "phd", label: "Ph.D." },
  { value: "other", label: "Other" }
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" }
];

const VETERAN_STATUS_OPTIONS = [
  { value: "not_veteran", label: "Not a veteran" },
  { value: "veteran", label: "Veteran" },
  { value: "disabled_veteran", label: "Disabled veteran" }
];

const HEAR_ABOUT_US_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "company_website", label: "Company Website" },
  { value: "referral", label: "Employee Referral" },
  { value: "job_board", label: "Job Board" },
  { value: "social_media", label: "Social Media" },
  { value: "search_engine", label: "Search Engine" },
  { value: "other", label: "Other" }
];

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" }
];

const RELATIONSHIP_OPTIONS = [
  { value: "supervisor", label: "Supervisor/Manager" },
  { value: "colleague", label: "Colleague/Peer" },
  { value: "client", label: "Client/Customer" },
  { value: "mentor", label: "Mentor" },
  { value: "other", label: "Other" }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch onboarding status
  const { data: onboardingStatus, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    retry: false,
  });

  // Fetch existing profile data
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  // Fetch resume analysis
  const { data: resumeAnalysis } = useQuery<ResumeAnalysis>({
    queryKey: ["/api/resume/analysis"],
    retry: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  // Redirect if onboarding is already completed
  // Get redirect URL from query params
  const getRedirectUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) {
      return decodeURIComponent(redirect);
    }
    return '/';
  };

  useEffect(() => {
    if (onboardingStatus?.onboardingCompleted) {
      setLocation(getRedirectUrl());
    }
  }, [onboardingStatus, setLocation]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/profile", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Resume upload function with auto-fill
  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('resume', file);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: uploadFormData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      
      // Auto-fill form data from parsed resume if available
      if (result.parsedData) {
        const parsedData = result.parsedData;
        const newFormData = { ...formData };
        
        // Auto-fill basic information
        if (parsedData.fullName) newFormData.fullName = parsedData.fullName;
        if (parsedData.email) newFormData.email = parsedData.email;
        if (parsedData.phone) newFormData.phone = parsedData.phone;
        if (parsedData.professionalTitle) newFormData.professionalTitle = parsedData.professionalTitle;
        if (parsedData.yearsExperience) newFormData.yearsExperience = parsedData.yearsExperience;
        if (parsedData.summary) newFormData.summary = parsedData.summary;
        if (parsedData.linkedinUrl) newFormData.linkedinUrl = parsedData.linkedinUrl;
        
        // Auto-fill location
        if (parsedData.city) newFormData.city = parsedData.city;
        if (parsedData.state) newFormData.state = parsedData.state;
        
        // Auto-fill education if available
        if (parsedData.education && parsedData.education.length > 0) {
          const highestDegree = parsedData.education[0];
          if (highestDegree.degree) {
            const degreeMap: {[key: string]: string} = {
              'bachelor': 'bachelors',
              'master': 'masters',
              'phd': 'phd',
              'doctorate': 'phd',
              'associate': 'associates',
              'diploma': 'other',
              'certificate': 'other'
            };
            const mappedDegree = degreeMap[highestDegree.degree.toLowerCase()] || 'other';
            newFormData.highestDegree = mappedDegree;
          }
        }
        
        setFormData(newFormData);
        
        toast({
          title: "Resume Analyzed & Profile Auto-filled",
          description: `ATS Score: ${result.resume?.atsScore || 'N/A'}/100. Please review the auto-filled information.`,
        });
      } else {
        toast({
          title: "Resume Uploaded Successfully",
          description: `ATS Score: ${result.resume?.atsScore || 'Analyzing...'}/100 - Your resume has been analyzed and optimized.`,
        });
      }

      // Refresh queries and force refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      // Force refetch onboarding status to ensure hasResume is updated
      await queryClient.refetchQueries({ queryKey: ["/api/onboarding/status"] });
      
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Validation functions for each step
  const validateStep = (stepId: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    switch (stepId) {
      case "basic_info":
        if (!formData.fullName?.trim()) errors.push("Full Name is required");
        if (!formData.phone?.trim()) errors.push("Phone Number is required");
        if (!formData.professionalTitle?.trim()) errors.push("Professional Title is required");
        break;
        
      case "work_auth":
        if (!formData.workAuthorization) errors.push("Work Authorization Status is required");
        break;
        
      case "location":
        if (!formData.city?.trim()) errors.push("City is required");
        if (!formData.state?.trim()) errors.push("State is required");
        break;
        
      case "preferences":
        if (!formData.desiredSalaryMin || formData.desiredSalaryMin <= 0) errors.push("Minimum Salary is required");
        if (!formData.desiredSalaryMax || formData.desiredSalaryMax <= 0) errors.push("Maximum Salary is required");
        if (!formData.noticePeriod) errors.push("Notice Period is required");
        if (!formData.highestDegree) errors.push("Highest Degree is required");
        break;
        
      case "resume":
        if (!onboardingStatus?.hasResume) errors.push("Please upload your resume to continue");
        break;
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleNext = async () => {
    const currentStepData = steps[currentStep];
    const validation = validateStep(currentStepData.id);
    
    if (!validation.isValid) {
      toast({
        title: "Please complete required fields",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < steps.length - 1) {
      // Save current step data
      await profileMutation.mutateAsync(formData);
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await profileMutation.mutateAsync({ ...formData, onboardingCompleted: true });
      
      // Invalidate queries to refresh user auth state
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      // Force refetch user data to ensure onboarding status is updated
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Onboarding Complete!",
        description: "Your profile is ready for job applications.",
      });
      
      // Small delay to ensure all queries are updated before redirect
      setTimeout(() => {
        setLocation(getRedirectUrl());
      }, 1000);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      id: "resume_upload",
      title: "Upload Your Resume",
      description: "Let us analyze your resume and auto-fill your profile",
      content: (
        <div className="space-y-6">
          {!onboardingStatus?.hasResume ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
              <p className="text-gray-600 mb-4">
                Upload a PDF file and we'll automatically fill your profile information
              </p>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setResumeFile(file);
                    handleResumeUpload(file);
                  }
                }}
                disabled={isUploadingResume}
                className="max-w-xs mx-auto"
                data-testid="input-resume-upload"
              />
              {isUploadingResume && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Analyzing resume and auto-filling profile...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Resume uploaded and analyzed</span>
              </div>
              
              {resumeAnalysis && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">ATS Score:</span>
                      <Badge variant={(onboardingStatus?.atsScore || 0) >= 80 ? "default" : (onboardingStatus?.atsScore || 0) >= 60 ? "secondary" : "destructive"}>
                        {onboardingStatus?.atsScore || 'N/A'}/100
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                    Profile information has been auto-filled from your resume. Please review and complete any missing fields in the next steps.
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setResumeFile(file);
                        handleResumeUpload(file);
                      }
                    };
                    input.click();
                  }}
                  disabled={isUploadingResume}
                  data-testid="button-upload-new-resume"
                >
                  Upload New Resume
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: "basic_info",
      title: "Basic Information",
      description: "Review and complete your profile details",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName || ""}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="professionalTitle">Professional Title *</Label>
            <Input
              id="professionalTitle"
              value={formData.professionalTitle || ""}
              onChange={(e) => handleInputChange("professionalTitle", e.target.value)}
              placeholder="Software Engineer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={formData.yearsExperience || ""}
                onChange={(e) => handleInputChange("yearsExperience", parseInt(e.target.value) || 0)}
                placeholder="5"
              />
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
              <Input
                id="linkedinUrl"
                value={formData.linkedinUrl || ""}
                onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary || ""}
              onChange={(e) => handleInputChange("summary", e.target.value)}
              placeholder="Brief description of your professional background and goals..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      )
    },
    {
      id: "work_auth",
      title: "Work Authorization",
      description: "Employment eligibility information",
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="workAuthorization">Work Authorization Status *</Label>
            <Select
              value={formData.workAuthorization || ""}
              onValueChange={(value) => handleInputChange("workAuthorization", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your work authorization status" />
              </SelectTrigger>
              <SelectContent>
                {WORK_AUTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.workAuthorization === "visa_required" && (
            <div>
              <Label htmlFor="visaStatus">Current Visa Status</Label>
              <Input
                id="visaStatus"
                value={formData.visaStatus || ""}
                onChange={(e) => handleInputChange("visaStatus", e.target.value)}
                placeholder="F-1, H-1B, etc."
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresSponsorship"
              checked={formData.requiresSponsorship || false}
              onCheckedChange={(checked) => handleInputChange("requiresSponsorship", checked)}
            />
            <Label htmlFor="requiresSponsorship">
              I require visa sponsorship for employment
            </Label>
          </div>
        </div>
      )
    },
    {
      id: "location",
      title: "Location Details",
      description: "Where are you located and willing to work?",
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentAddress">Current Address</Label>
            <Textarea
              id="currentAddress"
              value={formData.currentAddress || ""}
              onChange={(e) => handleInputChange("currentAddress", e.target.value)}
              placeholder="123 Main St, Apt 4B"
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="San Francisco"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state || ""}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="CA"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode || ""}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="94102"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredWorkMode">Preferred Work Mode</Label>
              <Select
                value={formData.preferredWorkMode || ""}
                onValueChange={(value) => handleInputChange("preferredWorkMode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work preference" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-0 sm:pt-6">
              <Checkbox
                id="willingToRelocate"
                checked={formData.willingToRelocate || false}
                onCheckedChange={(checked) => handleInputChange("willingToRelocate", checked)}
              />
              <Label htmlFor="willingToRelocate">
                Willing to relocate
              </Label>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "resume",
      title: "Resume Upload & Analysis",
      description: "Upload your resume for ATS optimization",
      content: (
        <div className="space-y-6">
          {!onboardingStatus?.hasResume ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
              <p className="text-gray-600 mb-4">
                Upload a PDF file to get instant ATS optimization feedback
              </p>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setResumeFile(file);
                    handleResumeUpload(file);
                  }
                }}
                disabled={isUploadingResume}
                className="max-w-xs mx-auto"
              />
              {isUploadingResume && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Analyzing resume...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Resume uploaded and analyzed</span>
              </div>
              
              {resumeAnalysis && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">ATS Score:</span>
                      <Badge variant={(onboardingStatus?.atsScore || 0) >= 80 ? "default" : (onboardingStatus?.atsScore || 0) >= 60 ? "secondary" : "destructive"}>
                        {onboardingStatus?.atsScore || 'N/A'}/100
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {resumeAnalysis.analysis.content.strengthsFound.slice(0, 3).map((strength, index) => (
                          <div key={index} className="text-sm text-green-700 bg-green-50 p-2 rounded">
                            {strength}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Improvements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {resumeAnalysis.analysis.recommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                            {rec}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: "preferences",
      title: "Job Preferences",
      description: "Set your salary expectations and availability",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="desiredSalaryMin">Minimum Salary (USD)</Label>
              <Input
                id="desiredSalaryMin"
                type="number"
                value={formData.desiredSalaryMin || ""}
                onChange={(e) => handleInputChange("desiredSalaryMin", parseInt(e.target.value) || 0)}
                placeholder="80000"
              />
            </div>
            <div>
              <Label htmlFor="desiredSalaryMax">Maximum Salary (USD)</Label>
              <Input
                id="desiredSalaryMax"
                type="number"
                value={formData.desiredSalaryMax || ""}
                onChange={(e) => handleInputChange("desiredSalaryMax", parseInt(e.target.value) || 0)}
                placeholder="120000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="noticePeriod">Notice Period</Label>
            <Select
              value={formData.noticePeriod || ""}
              onValueChange={(value) => handleInputChange("noticePeriod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your availability" />
              </SelectTrigger>
              <SelectContent>
                {NOTICE_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="highestDegree">Highest Degree</Label>
            <Select
              value={formData.highestDegree || ""}
              onValueChange={(value) => handleInputChange("highestDegree", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your highest degree" />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="majorFieldOfStudy">Field of Study</Label>
              <Input
                id="majorFieldOfStudy"
                value={formData.majorFieldOfStudy || ""}
                onChange={(e) => handleInputChange("majorFieldOfStudy", e.target.value)}
                placeholder="Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input
                id="graduationYear"
                type="number"
                value={formData.graduationYear || ""}
                onChange={(e) => handleInputChange("graduationYear", parseInt(e.target.value) || 0)}
                placeholder="2020"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "extension",
      title: "Get the AutoJobr Extension",
      description: "Download our browser extension for seamless job applications",
      content: (
        <div className="space-y-6 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">AutoJobr Browser Extension</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Install our browser extension to automatically fill job applications using your profile data. 
              Save hours of repetitive form filling and apply to more jobs faster.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Auto-Fill Forms</h4>
                <p className="text-sm text-muted-foreground">Instantly populate job applications with your saved data</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Save Time</h4>
                <p className="text-sm text-muted-foreground">Apply to 10x more jobs in the same amount of time</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Track Applications</h4>
                <p className="text-sm text-muted-foreground">Automatically track and manage all your applications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3"
                onClick={() => window.open("https://chrome.google.com/webstore", "_blank")}
              >
                <Upload className="w-5 h-5 mr-2" />
                Download Chrome Extension
              </Button>
              <p className="text-sm text-muted-foreground">
                Available for Chrome, Firefox, and Edge browsers
              </p>
            </div>
          </div>
          
          <div className="text-left bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
            <h4 className="font-semibold mb-3">How to use the extension:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Install the extension from your browser's web store</li>
              <li>2. Sign in with your AutoJobr account</li>
              <li>3. Navigate to any job application page</li>
              <li>4. Click the AutoJobr icon to auto-fill the form</li>
              <li>5. Review and submit your application</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: "personal_details",
      title: "Personal Details",
      description: "Optional personal information for diversity and compliance",
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Gender</Label>
            <p className="text-sm text-gray-600 mb-3">Optional - Select your gender identity</p>
            <RadioGroup
              value={formData.gender || ""}
              onValueChange={(value) => handleInputChange("gender", value)}
              data-testid="radio-gender"
            >
              {GENDER_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
                  <Label htmlFor={`gender-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">Veteran Status</Label>
            <p className="text-sm text-gray-600 mb-3">Required for compliance reporting</p>
            <RadioGroup
              value={formData.veteranStatus || ""}
              onValueChange={(value) => handleInputChange("veteranStatus", value)}
              data-testid="radio-veteran-status"
            >
              {VETERAN_STATUS_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`veteran-${option.value}`} />
                  <Label htmlFor={`veteran-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="twitterUrl">Twitter Profile</Label>
              <Input
                id="twitterUrl"
                value={formData.twitterUrl || ""}
                onChange={(e) => handleInputChange("twitterUrl", e.target.value)}
                placeholder="https://twitter.com/username"
                data-testid="input-twitter"
              />
            </div>
            <div>
              <Label htmlFor="personalWebsiteUrl">Personal Website</Label>
              <Input
                id="personalWebsiteUrl"
                value={formData.personalWebsiteUrl || ""}
                onChange={(e) => handleInputChange("personalWebsiteUrl", e.target.value)}
                placeholder="https://yourwebsite.com"
                data-testid="input-personal-website"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "work_screening",
      title: "Work Screening Questions",
      description: "Common questions asked by employers",
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Are you currently employed?</Label>
            <RadioGroup
              value={formData.currentlyEmployed ? "yes" : "no"}
              onValueChange={(value) => handleInputChange("currentlyEmployed", value === "yes")}
              className="mt-3"
              data-testid="radio-currently-employed"
            >
              {YES_NO_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`employed-${option.value}`} />
                  <Label htmlFor={`employed-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">May we contact your current employer?</Label>
            <RadioGroup
              value={formData.canContactCurrentEmployer ? "yes" : "no"}
              onValueChange={(value) => handleInputChange("canContactCurrentEmployer", value === "yes")}
              className="mt-3"
              data-testid="radio-contact-employer"
            >
              {YES_NO_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`contact-employer-${option.value}`} />
                  <Label htmlFor={`contact-employer-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">Are you willing to work overtime when needed?</Label>
            <RadioGroup
              value={formData.willingToWorkOvertime ? "yes" : "no"}
              onValueChange={(value) => handleInputChange("willingToWorkOvertime", value === "yes")}
              className="mt-3"
              data-testid="radio-overtime"
            >
              {YES_NO_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`overtime-${option.value}`} />
                  <Label htmlFor={`overtime-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">Are you willing to travel for work?</Label>
            <RadioGroup
              value={formData.willingToTravel ? "yes" : "no"}
              onValueChange={(value) => handleInputChange("willingToTravel", value === "yes")}
              className="mt-3"
              data-testid="radio-travel"
            >
              {YES_NO_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`travel-${option.value}`} />
                  <Label htmlFor={`travel-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {formData.willingToTravel && (
            <div>
              <Label htmlFor="maxTravelPercentage">Maximum travel percentage you're comfortable with</Label>
              <Input
                id="maxTravelPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.maxTravelPercentage || ""}
                onChange={(e) => handleInputChange("maxTravelPercentage", parseInt(e.target.value) || 0)}
                placeholder="25"
                className="mt-2"
                data-testid="input-travel-percentage"
              />
              <p className="text-sm text-gray-600 mt-1">Enter percentage (0-100%)</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: "application_questions",
      title: "Application Questions",
      description: "Common questions asked in job applications",
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">How did you hear about us?</Label>
            <RadioGroup
              value={formData.howDidYouHearAboutUs || ""}
              onValueChange={(value) => handleInputChange("howDidYouHearAboutUs", value)}
              className="mt-3"
              data-testid="radio-hear-about-us"
            >
              {HEAR_ABOUT_US_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`hear-${option.value}`} />
                  <Label htmlFor={`hear-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="whyInterestedInRole">Why are you interested in this role?</Label>
            <Textarea
              id="whyInterestedInRole"
              value={formData.whyInterestedInRole || ""}
              onChange={(e) => handleInputChange("whyInterestedInRole", e.target.value)}
              placeholder="Describe what attracts you to this specific position..."
              className="min-h-[100px] mt-2"
              data-testid="textarea-interested-role"
            />
          </div>

          <div>
            <Label htmlFor="whyInterestedInCompany">Why do you want to work for this company?</Label>
            <Textarea
              id="whyInterestedInCompany"
              value={formData.whyInterestedInCompany || ""}
              onChange={(e) => handleInputChange("whyInterestedInCompany", e.target.value)}
              placeholder="What interests you about this company and its mission..."
              className="min-h-[100px] mt-2"
              data-testid="textarea-interested-company"
            />
          </div>

          <div>
            <Label htmlFor="careerGoals">What are your career goals?</Label>
            <Textarea
              id="careerGoals"
              value={formData.careerGoals || ""}
              onChange={(e) => handleInputChange("careerGoals", e.target.value)}
              placeholder="Describe your short-term and long-term career objectives..."
              className="min-h-[100px] mt-2"
              data-testid="textarea-career-goals"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredStartDate">Preferred Start Date</Label>
              <Input
                id="preferredStartDate"
                value={formData.preferredStartDate || ""}
                onChange={(e) => handleInputChange("preferredStartDate", e.target.value)}
                placeholder="mm/dd/yyyy or 'Flexible'"
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="gpa">GPA (if recent graduate)</Label>
              <Input
                id="gpa"
                value={formData.gpa || ""}
                onChange={(e) => handleInputChange("gpa", e.target.value)}
                placeholder="3.75"
                data-testid="input-gpa"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 text-sm sm:text-base px-2">
            Set up your profile to enable smart job matching and auto-fill features
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{steps[currentStep]?.title}</CardTitle>
            <CardDescription>{steps[currentStep]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {steps[currentStep]?.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={profileMutation.isPending}
            className="w-full sm:w-auto"
          >
            {profileMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : currentStep === steps.length - 1 ? (
              "Complete Setup"
            ) : (
              "Next"
            )}
          </Button>
        </div>

        {/* Completion Status */}
        {onboardingStatus && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Profile Completion Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {onboardingStatus.steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={`text-sm ${step.completed ? 'text-green-700' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}