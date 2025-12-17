import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Building2, Users, Briefcase } from "lucide-react";
import { useLocation } from "wouter";

const DEPARTMENT_OPTIONS = [
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "legal", label: "Legal" },
  { value: "customer_success", label: "Customer Success" },
  { value: "data", label: "Data/Analytics" },
  { value: "other", label: "Other" }
];

const POSITION_OPTIONS = [
  { value: "recruiter", label: "Recruiter" },
  { value: "senior_recruiter", label: "Senior Recruiter" },
  { value: "talent_acquisition_manager", label: "Talent Acquisition Manager" },
  { value: "talent_acquisition_director", label: "Talent Acquisition Director" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "hr_director", label: "HR Director" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "head_of_people", label: "Head of People" },
  { value: "vp_hr", label: "VP of HR" },
  { value: "other", label: "Other" }
];

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "Never hired before" },
  { value: "1", label: "Less than 1 year" },
  { value: "2", label: "1-2 years" },
  { value: "5", label: "3-5 years" },
  { value: "10", label: "5-10 years" },
  { value: "15", label: "10+ years" }
];

const recruiterOnboardingSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyWebsite: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  recruiterPosition: z.string().min(1, "Please select your position"),
  recruiterDepartment: z.string().min(1, "Please select your department"),
  hasHiredBefore: z.enum(["yes", "no"], { required_error: "Please indicate if you have hired before" }),
  yearsHiringExperience: z.string().optional()
});

type RecruiterOnboardingFormData = z.infer<typeof recruiterOnboardingSchema>;

export default function RecruiterOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<RecruiterOnboardingFormData>({
    resolver: zodResolver(recruiterOnboardingSchema),
    defaultValues: {
      companyName: "",
      companyWebsite: "",
      recruiterPosition: "",
      recruiterDepartment: "",
      hasHiredBefore: undefined,
      yearsHiringExperience: "0"
    },
    mode: "onChange"
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  useEffect(() => {
    if (profile) {
      form.setValue("recruiterPosition", profile.recruiterPosition || "");
      form.setValue("recruiterDepartment", profile.recruiterDepartment || "");
      form.setValue("hasHiredBefore", profile.hasHiredBefore ? "yes" : "no");
      form.setValue("yearsHiringExperience", String(profile.yearsHiringExperience || "0"));
    }
    if (user) {
      form.setValue("companyName", user.companyName || "");
      form.setValue("companyWebsite", user.companyWebsite || "");
    }
  }, [profile, user, form]);

  const profileMutation = useMutation({
    mutationFn: async (data: Partial<RecruiterOnboardingFormData>) => {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    }
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: RecruiterOnboardingFormData) => {
      const payload = {
        ...data,
        hasHiredBefore: data.hasHiredBefore === "yes",
        yearsHiringExperience: parseInt(data.yearsHiringExperience || "0")
      };
      const response = await fetch("/api/recruiter/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete onboarding");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Welcome aboard!",
        description: "Your recruiter profile is all set up."
      });
      setLocation("/recruiter-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive"
      });
    }
  });

  const getStepFields = (step: number): (keyof RecruiterOnboardingFormData)[] => {
    switch (step) {
      case 0:
        return ["companyName", "companyWebsite"];
      case 1:
        return ["recruiterPosition", "recruiterDepartment"];
      case 2:
        return ["hasHiredBefore", "yearsHiringExperience"];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const fields = getStepFields(currentStep);
    const isValid = await form.trigger(fields);
    
    if (!isValid) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep < 2) {
      const values = form.getValues();
      await profileMutation.mutateAsync(values);
      setCurrentStep(currentStep + 1);
    } else {
      const values = form.getValues();
      await completeOnboardingMutation.mutateAsync(values);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      title: "Company Information",
      description: "Tell us about your company",
      icon: Building2
    },
    {
      title: "Your Role",
      description: "Tell us about your position",
      icon: Briefcase
    },
    {
      title: "Hiring Experience",
      description: "Tell us about your hiring experience",
      icon: Users
    }
  ];

  const hasHiredBefore = form.watch("hasHiredBefore");

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-onboarding-title">Welcome, Recruiter!</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base px-2" data-testid="text-onboarding-description">
            Let's set up your recruiter profile to start finding great candidates
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium" data-testid="text-progress-label">Progress</span>
            <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-step-indicator">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" data-testid="progress-bar" />
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  index <= currentStep ? "text-primary" : "text-gray-400"
                }`}
                data-testid={`step-indicator-${index}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                      ? "border-2 border-primary bg-background"
                      : "border-2 border-gray-300 bg-background"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <Card className="mb-8" data-testid="card-onboarding-step">
              <CardHeader>
                <CardTitle data-testid="text-step-title">{steps[currentStep]?.title}</CardTitle>
                <CardDescription data-testid="text-step-description">{steps[currentStep]?.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Acme Corporation"
                              data-testid="input-company-name"
                            />
                          </FormControl>
                          <FormMessage data-testid="error-company-name" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://www.example.com"
                              data-testid="input-company-website"
                            />
                          </FormControl>
                          <FormMessage data-testid="error-company-website" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="recruiterPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Position *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-position">
                                <SelectValue placeholder="Select your position" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {POSITION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} data-testid={`option-position-${option.value}`}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage data-testid="error-position" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recruiterDepartment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department You Hire For *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-department">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DEPARTMENT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} data-testid={`option-department-${option.value}`}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage data-testid="error-department" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="hasHiredBefore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Have you hired before? *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="mt-3 space-y-3"
                            >
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value="yes" id="hired-yes" data-testid="radio-hired-yes" />
                                <label htmlFor="hired-yes" className="font-normal cursor-pointer">
                                  Yes, I have hired candidates before
                                </label>
                              </div>
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value="no" id="hired-no" data-testid="radio-hired-no" />
                                <label htmlFor="hired-no" className="font-normal cursor-pointer">
                                  No, this is my first time hiring
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage data-testid="error-hired-before" />
                        </FormItem>
                      )}
                    />

                    {hasHiredBefore === "yes" && (
                      <FormField
                        control={form.control}
                        name="yearsHiringExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Hiring Experience</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-experience">
                                  <SelectValue placeholder="Select experience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EXPERIENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value} data-testid={`option-experience-${option.value}`}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage data-testid="error-experience" />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mt-6" data-testid="info-next-steps">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What happens next?</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>Post job openings and reach qualified candidates</li>
                        <li>Review applications and schedule interviews</li>
                        <li>Use AI-powered tools to streamline your hiring process</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="w-full sm:w-auto"
                data-testid="button-previous"
              >
                Previous
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={profileMutation.isPending || completeOnboardingMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-next"
              >
                {profileMutation.isPending || completeOnboardingMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : currentStep === steps.length - 1 ? (
                  "Complete Setup"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
