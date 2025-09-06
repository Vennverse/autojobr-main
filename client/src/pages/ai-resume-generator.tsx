import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Wand2, 
  FileText, 
  Download, 
  Eye,
  Sparkles,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Languages,
  Heart,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const professions = [
  { value: "software-engineer", label: "Software Engineer" },
  { value: "data-scientist", label: "Data Scientist" },
  { value: "product-manager", label: "Product Manager" },
  { value: "marketing-manager", label: "Marketing Manager" },
  { value: "sales-representative", label: "Sales Representative" },
  { value: "business-analyst", label: "Business Analyst" },
  { value: "project-manager", label: "Project Manager" },
  { value: "ui-ux-designer", label: "UI/UX Designer" },
  { value: "devops-engineer", label: "DevOps Engineer" },
  { value: "full-stack-developer", label: "Full Stack Developer" }
];

export default function AIResumeGeneratorPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [profession, setProfession] = useState("");
  const [templateType, setTemplateType] = useState("professional");
  const [targetJobDescription, setTargetJobDescription] = useState("");
  
  // User Information State
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    location: "",
    summary: "",
    experience: "",
    education: "",
    skills: "",
    projects: "",
    certifications: "",
    languages: "",
    volunteer: "",
    achievements: ""
  });

  const { data: resumes } = useQuery({
    queryKey: ["/api/resumes"],
    retry: false,
  });

  const handleGenerateResume = async () => {
    if (!profession) {
      toast({
        title: "Missing Information",
        description: "Please select your profession before generating a resume.",
        variant: "destructive"
      });
      return;
    }

    if (!userInfo.fullName.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const requestBody = {
        templateType,
        profession,
        targetJobDescription: targetJobDescription.trim() || undefined,
        userInfo: {
          ...userInfo,
          fullName: userInfo.fullName.trim(),
          email: userInfo.email.trim() || user?.email || "",
          experience: userInfo.experience.trim(),
          education: userInfo.education.trim(),
          skills: userInfo.skills.trim()
        }
      };

      const response = await fetch('/api/resumes/generate-from-scratch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate AI resume');
      }

      const result = await response.json();
      if (result.success) {
        setGeneratedResume(result);
        toast({
          title: "Success!",
          description: "Your AI-optimized resume has been generated and saved.",
        });
      } else {
        throw new Error(result.message || 'Generation failed');
      }
    } catch (error: any) {
      console.error('AI Resume Generation Error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate AI resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadResume = () => {
    if (generatedResume?.downloadUrl) {
      window.open(generatedResume.downloadUrl, '_blank');
    }
  };

  const handleViewResume = () => {
    if (generatedResume?.viewUrl) {
      window.open(generatedResume.viewUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            AI Resume Generator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create professional, ATS-optimized resumes using advanced AI technology
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-6 w-6 text-purple-600" />
                  Resume Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {/* Profession Selection */}
                    <div>
                      <Label className="text-sm font-medium">Profession *</Label>
                      <Select value={profession} onValueChange={setProfession}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your profession" />
                        </SelectTrigger>
                        <SelectContent>
                          {professions.map((prof) => (
                            <SelectItem key={prof.value} value={prof.value}>
                              {prof.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Template Selection */}
                    <div>
                      <Label className="text-sm font-medium">Template Style</Label>
                      <Select value={templateType} onValueChange={setTemplateType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional Standard</SelectItem>
                          <SelectItem value="modern">Modern Clean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Personal Information */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={userInfo.fullName}
                            onChange={(e) => setUserInfo({...userInfo, fullName: e.target.value})}
                            data-testid="input-fullname"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={userInfo.email}
                            onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                            data-testid="input-email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            placeholder="+1 (555) 123-4567"
                            value={userInfo.phone}
                            onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                            data-testid="input-phone"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            placeholder="San Francisco, CA"
                            value={userInfo.location}
                            onChange={(e) => setUserInfo({...userInfo, location: e.target.value})}
                            data-testid="input-location"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Professional Summary */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Professional Summary
                      </h3>
                      <Textarea
                        placeholder="Brief professional summary highlighting your key skills and experience..."
                        value={userInfo.summary}
                        onChange={(e) => setUserInfo({...userInfo, summary: e.target.value})}
                        rows={4}
                        data-testid="textarea-summary"
                      />
                    </div>

                    {/* Work Experience */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Work Experience
                      </h3>
                      <Textarea
                        placeholder="List your work experience, including job titles, companies, dates, and key achievements..."
                        value={userInfo.experience}
                        onChange={(e) => setUserInfo({...userInfo, experience: e.target.value})}
                        rows={6}
                        data-testid="textarea-experience"
                      />
                    </div>

                    {/* Education */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education
                      </h3>
                      <Textarea
                        placeholder="Your educational background, degrees, institutions, graduation dates..."
                        value={userInfo.education}
                        onChange={(e) => setUserInfo({...userInfo, education: e.target.value})}
                        rows={4}
                        data-testid="textarea-education"
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Technical Skills
                      </h3>
                      <Textarea
                        placeholder="List your technical skills, programming languages, tools, frameworks..."
                        value={userInfo.skills}
                        onChange={(e) => setUserInfo({...userInfo, skills: e.target.value})}
                        rows={4}
                        data-testid="textarea-skills"
                      />
                    </div>

                    {/* Target Job Description */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Target Job Description (Optional)
                      </h3>
                      <Textarea
                        placeholder="Paste the job description you're applying for to optimize your resume for that specific role..."
                        value={targetJobDescription}
                        onChange={(e) => setTargetJobDescription(e.target.value)}
                        rows={6}
                        data-testid="textarea-job-description"
                      />
                    </div>

                    {/* Additional Sections */}
                    <details className="group">
                      <summary className="cursor-pointer font-semibold text-lg mb-4 flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                        Additional Information (Optional)
                      </summary>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="projects">Projects</Label>
                          <Textarea
                            id="projects"
                            placeholder="Notable projects, portfolio items..."
                            value={userInfo.projects}
                            onChange={(e) => setUserInfo({...userInfo, projects: e.target.value})}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="certifications">Certifications</Label>
                          <Textarea
                            id="certifications"
                            placeholder="Professional certifications, licenses..."
                            value={userInfo.certifications}
                            onChange={(e) => setUserInfo({...userInfo, certifications: e.target.value})}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="achievements">Achievements</Label>
                          <Textarea
                            id="achievements"
                            placeholder="Awards, recognitions, notable accomplishments..."
                            value={userInfo.achievements}
                            onChange={(e) => setUserInfo({...userInfo, achievements: e.target.value})}
                            rows={3}
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Generation Panel */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-8">
              {/* Generation Card */}
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-center">
                    <Sparkles className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    Generate Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isGenerating && (
                      <div className="text-center space-y-4">
                        <div className="animate-spin mx-auto">
                          <RefreshCw className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Generating your AI resume...</p>
                          <Progress value={75} className="w-full" />
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleGenerateResume}
                      disabled={isGenerating || !profession || !userInfo.fullName.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      data-testid="button-generate-resume"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate AI Resume
                        </>
                      )}
                    </Button>

                    {generatedResume && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Resume Generated Successfully!</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            onClick={handleViewResume}
                            variant="outline"
                            size="sm"
                            data-testid="button-view-resume"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            onClick={handleDownloadResume}
                            variant="outline"
                            size="sm"
                            data-testid="button-download-resume"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 Tips for Better Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Fill in all sections for best results</li>
                    <li>• Include specific achievements with numbers</li>
                    <li>• Add the target job description for optimization</li>
                    <li>• Use action verbs in your experience</li>
                    <li>• Keep information current and relevant</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}