import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  X,
} from "lucide-react";

// TypeScript Interfaces
interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  achievements: string[];
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

interface Skills {
  technical: string[];
  soft: string[];
}

interface ResumeData {
  personal: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: Skills;
}

type TemplateType = "classic" | "modern" | "compact";

const STEPS = [
  { id: 1, name: "Personal Info", icon: FileText },
  { id: 2, name: "Experience", icon: Briefcase },
  { id: 3, name: "Education", icon: GraduationCap },
  { id: 4, name: "Skills", icon: Award },
];

const initialData: ResumeData = {
  personal: {
    name: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
  },
};

export default function ResumeBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeData, setResumeData] = useState<ResumeData>(initialData);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("modern");
  const [newSkill, setNewSkill] = useState({ technical: "", soft: "" });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("resumeBuilderData");
    if (savedData) {
      try {
        setResumeData(JSON.parse(savedData));
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("resumeBuilderData", JSON.stringify(resumeData));
  }, [resumeData]);

  // Form validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          resumeData.personal.name &&
          resumeData.personal.email &&
          resumeData.personal.title
        );
      case 2:
        return resumeData.experience.length > 0;
      case 3:
        return resumeData.education.length > 0;
      case 4:
        return resumeData.skills.technical.length > 0 || resumeData.skills.soft.length > 0;
      default:
        return true;
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Personal info handlers
  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
  };

  // Experience handlers
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      achievements: [""],
    };
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  const addAchievement = (expId: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === expId ? { ...exp, achievements: [...exp.achievements, ""] } : exp
      ),
    }));
  };

  const updateAchievement = (expId: string, index: number, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              achievements: exp.achievements.map((ach, i) => (i === index ? value : ach)),
            }
          : exp
      ),
    }));
  };

  const removeAchievement = (expId: string, index: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === expId
          ? { ...exp, achievements: exp.achievements.filter((_, i) => i !== index) }
          : exp
      ),
    }));
  };

  // Education handlers
  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      current: false,
    };
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  // Skills handlers
  const addSkill = (type: "technical" | "soft") => {
    const skill = newSkill[type].trim();
    if (skill && !resumeData.skills[type].includes(skill)) {
      setResumeData((prev) => ({
        ...prev,
        skills: { ...prev.skills, [type]: [...prev.skills[type], skill] },
      }));
      setNewSkill((prev) => ({ ...prev, [type]: "" }));
    }
  };

  const removeSkill = (type: "technical" | "soft", skill: string) => {
    setResumeData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [type]: prev.skills[type].filter((s) => s !== skill) },
    }));
  };

  // PDF Generation
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const html = previewRef.current?.innerHTML || "";
      
      const response = await fetch("/api/generate-resume-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          html, 
          template: selectedTemplate,
          resumeData 
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.personal.name || "resume"}_${selectedTemplate}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: "Your resume has been downloaded as PDF.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-resume-builder">
            Resume Builder
          </h1>
          <p className="text-muted-foreground">
            Create a professional resume in minutes with our easy-to-use builder
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${
                    currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid={`step-indicator-${step.id}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">{step.name}</span>
                </div>
              );
            })}
          </div>
          <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle data-testid={`heading-step-${currentStep}`}>
                  {STEPS[currentStep - 1].name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentStep === 1 && (
                      <PersonalInfoForm
                        data={resumeData.personal}
                        onChange={updatePersonalInfo}
                      />
                    )}
                    {currentStep === 2 && (
                      <ExperienceForm
                        experience={resumeData.experience}
                        onAdd={addExperience}
                        onUpdate={updateExperience}
                        onRemove={removeExperience}
                        onAddAchievement={addAchievement}
                        onUpdateAchievement={updateAchievement}
                        onRemoveAchievement={removeAchievement}
                      />
                    )}
                    {currentStep === 3 && (
                      <EducationForm
                        education={resumeData.education}
                        onAdd={addEducation}
                        onUpdate={updateEducation}
                        onRemove={removeEducation}
                      />
                    )}
                    {currentStep === 4 && (
                      <SkillsForm
                        skills={resumeData.skills}
                        newSkill={newSkill}
                        onNewSkillChange={setNewSkill}
                        onAddSkill={addSkill}
                        onRemoveSkill={removeSkill}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    data-testid="button-previous"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button onClick={handleNext} data-testid="button-next">
                    {currentStep === 4 ? "Finish" : "Next"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <CardTitle>Preview</CardTitle>
                  <Button
                    onClick={generatePDF}
                    disabled={isGeneratingPDF}
                    data-testid="button-download-pdf"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isGeneratingPDF ? "Generating..." : "Download PDF"}
                  </Button>
                </div>
                {/* ATS Compatibility Score */}
                <div className={`p-3 rounded-lg border ${
                  atsScore >= 80 ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                  atsScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                  'bg-red-50 dark:bg-red-900/20 border-red-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">ATS Compatibility</span>
                    <span className={`text-xl font-bold ${
                      atsScore >= 80 ? 'text-green-600' :
                      atsScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{atsScore}%</span>
                  </div>
                  <Progress value={atsScore} className="h-2" />
                  <p className="text-xs mt-2">
                    {atsScore >= 80 ? '✅ Excellent! Resume is ATS-friendly' :
                     atsScore >= 60 ? '⚠️ Good, but can be improved' :
                     '🚨 Add more details and quantified achievements'}
                  </p>
                </div>
                {/* Template Selector */}
                <Tabs
                  value={selectedTemplate}
                  onValueChange={(v) => setSelectedTemplate(v as TemplateType)}
                  className="mt-4"
                >
                  <TabsList className="grid grid-cols-3 w-full" data-testid="template-selector">
                    <TabsTrigger value="classic" data-testid="template-classic">
                      Classic
                    </TabsTrigger>
                    <TabsTrigger value="modern" data-testid="template-modern">
                      Modern
                    </TabsTrigger>
                    <TabsTrigger value="compact" data-testid="template-compact">
                      Compact
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewRef}
                  className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-inner overflow-auto max-h-[800px]"
                  data-testid="preview-container"
                >
                  {selectedTemplate === "classic" && <ClassicTemplate data={resumeData} />}
                  {selectedTemplate === "modern" && <ModernTemplate data={resumeData} />}
                  {selectedTemplate === "compact" && <CompactTemplate data={resumeData} />}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form Components
function PersonalInfoForm({
  data,
  onChange,
}: {
  data: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Full Name <span className="text-destructive">*</span>
        </label>
        <Input
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="John Doe"
          data-testid="input-name"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Email <span className="text-destructive">*</span>
        </label>
        <Input
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="john@example.com"
          data-testid="input-email"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Phone</label>
        <Input
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+1 (555) 123-4567"
          data-testid="input-phone"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Location</label>
        <Input
          value={data.location}
          onChange={(e) => onChange("location", e.target.value)}
          placeholder="San Francisco, CA"
          data-testid="input-location"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Professional Title <span className="text-destructive">*</span>
        </label>
        <Input
          value={data.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Senior Software Engineer"
          data-testid="input-title"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Professional Summary</label>
        <Textarea
          value={data.summary}
          onChange={(e) => onChange("summary", e.target.value)}
          placeholder="Brief overview of your professional background and key achievements..."
          rows={4}
          data-testid="textarea-summary"
        />
      </div>
    </div>
  );
}

function ExperienceForm({
  experience,
  onAdd,
  onUpdate,
  onRemove,
  onAddAchievement,
  onUpdateAchievement,
  onRemoveAchievement,
}: {
  experience: WorkExperience[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof WorkExperience, value: any) => void;
  onRemove: (id: string) => void;
  onAddAchievement: (expId: string) => void;
  onUpdateAchievement: (expId: string, index: number, value: string) => void;
  onRemoveAchievement: (expId: string, index: number) => void;
}) {
  return (
    <div className="space-y-6">
      {experience.map((exp) => (
        <Card key={exp.id} className="p-4" data-testid={`experience-entry-${exp.id}`}>
          <div className="flex justify-between mb-4">
            <h3 className="font-medium">Work Experience</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(exp.id)}
              data-testid={`button-remove-experience-${exp.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              value={exp.company}
              onChange={(e) => onUpdate(exp.id, "company", e.target.value)}
              placeholder="Company Name"
              data-testid={`input-company-${exp.id}`}
            />
            <Input
              value={exp.position}
              onChange={(e) => onUpdate(exp.id, "position", e.target.value)}
              placeholder="Job Title"
              data-testid={`input-position-${exp.id}`}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="month"
                value={exp.startDate}
                onChange={(e) => onUpdate(exp.id, "startDate", e.target.value)}
                data-testid={`input-start-date-${exp.id}`}
              />
              <Input
                type="month"
                value={exp.endDate}
                onChange={(e) => onUpdate(exp.id, "endDate", e.target.value)}
                disabled={exp.current}
                placeholder="Present"
                data-testid={`input-end-date-${exp.id}`}
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => onUpdate(exp.id, "current", e.target.checked)}
                className="rounded"
                data-testid={`checkbox-current-${exp.id}`}
              />
              <span className="text-sm">I currently work here</span>
            </label>
            <div>
              <label className="text-sm font-medium mb-2 block">Key Achievements</label>
              {exp.achievements.map((achievement, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Textarea
                    value={achievement}
                    onChange={(e) => onUpdateAchievement(exp.id, idx, e.target.value)}
                    placeholder="Describe your achievement or responsibility..."
                    rows={2}
                    data-testid={`textarea-achievement-${exp.id}-${idx}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAchievement(exp.id, idx)}
                    data-testid={`button-remove-achievement-${exp.id}-${idx}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddAchievement(exp.id)}
                data-testid={`button-add-achievement-${exp.id}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Achievement
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <Button onClick={onAdd} className="w-full" data-testid="button-add-experience">
        <Plus className="w-4 h-4 mr-2" />
        Add Work Experience
      </Button>
    </div>
  );
}

function EducationForm({
  education,
  onAdd,
  onUpdate,
  onRemove,
}: {
  education: Education[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Education, value: any) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {education.map((edu) => (
        <Card key={edu.id} className="p-4" data-testid={`education-entry-${edu.id}`}>
          <div className="flex justify-between mb-4">
            <h3 className="font-medium">Education</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(edu.id)}
              data-testid={`button-remove-education-${edu.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              value={edu.school}
              onChange={(e) => onUpdate(edu.id, "school", e.target.value)}
              placeholder="School/University Name"
              data-testid={`input-school-${edu.id}`}
            />
            <Input
              value={edu.degree}
              onChange={(e) => onUpdate(edu.id, "degree", e.target.value)}
              placeholder="Degree (e.g., Bachelor's, Master's)"
              data-testid={`input-degree-${edu.id}`}
            />
            <Input
              value={edu.field}
              onChange={(e) => onUpdate(edu.id, "field", e.target.value)}
              placeholder="Field of Study"
              data-testid={`input-field-${edu.id}`}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="month"
                value={edu.startDate}
                onChange={(e) => onUpdate(edu.id, "startDate", e.target.value)}
                data-testid={`input-edu-start-date-${edu.id}`}
              />
              <Input
                type="month"
                value={edu.endDate}
                onChange={(e) => onUpdate(edu.id, "endDate", e.target.value)}
                disabled={edu.current}
                placeholder="Present"
                data-testid={`input-edu-end-date-${edu.id}`}
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={edu.current}
                onChange={(e) => onUpdate(edu.id, "current", e.target.checked)}
                className="rounded"
                data-testid={`checkbox-edu-current-${edu.id}`}
              />
              <span className="text-sm">I currently study here</span>
            </label>
          </div>
        </Card>
      ))}
      <Button onClick={onAdd} className="w-full" data-testid="button-add-education">
        <Plus className="w-4 h-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}

function SkillsForm({
  skills,
  newSkill,
  onNewSkillChange,
  onAddSkill,
  onRemoveSkill,
}: {
  skills: Skills;
  newSkill: { technical: string; soft: string };
  onNewSkillChange: (skill: { technical: string; soft: string }) => void;
  onAddSkill: (type: "technical" | "soft") => void;
  onRemoveSkill: (type: "technical" | "soft", skill: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Technical Skills</label>
        <div className="flex gap-2 mb-3">
          <Input
            value={newSkill.technical}
            onChange={(e) => onNewSkillChange({ ...newSkill, technical: e.target.value })}
            placeholder="e.g., React, Python, AWS"
            onKeyPress={(e) => e.key === "Enter" && onAddSkill("technical")}
            data-testid="input-technical-skill"
          />
          <Button onClick={() => onAddSkill("technical")} data-testid="button-add-technical-skill">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.technical.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="px-3 py-1 cursor-pointer"
              data-testid={`badge-technical-${skill}`}
            >
              {skill}
              <X
                className="w-3 h-3 ml-2"
                onClick={() => onRemoveSkill("technical", skill)}
              />
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Soft Skills</label>
        <div className="flex gap-2 mb-3">
          <Input
            value={newSkill.soft}
            onChange={(e) => onNewSkillChange({ ...newSkill, soft: e.target.value })}
            placeholder="e.g., Leadership, Communication"
            onKeyPress={(e) => e.key === "Enter" && onAddSkill("soft")}
            data-testid="input-soft-skill"
          />
          <Button onClick={() => onAddSkill("soft")} data-testid="button-add-soft-skill">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.soft.map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="px-3 py-1 cursor-pointer"
              data-testid={`badge-soft-${skill}`}
            >
              {skill}
              <X className="w-3 h-3 ml-2" onClick={() => onRemoveSkill("soft", skill)} />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// Template Components
function ClassicTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="text-gray-900 dark:text-gray-100 font-sans" style={{ fontSize: "16px" }}>
      <div className="grid grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">{data.personal.name || "Your Name"}</h1>
            <p className="text-primary font-medium">{data.personal.title || "Professional Title"}</p>
          </div>



  // Calculate ATS compatibility score
  const calculateATSScore = (): number => {
    let score = 0;
    
    // Check required fields (40 points)
    if (resumeData.personal.name) score += 10;
    if (resumeData.personal.email) score += 10;
    if (resumeData.personal.phone) score += 10;
    if (resumeData.personal.summary) score += 10;
    
    // Check experience (30 points)
    if (resumeData.experience.length > 0) {
      score += 15;
      const hasQuantifiedAchievements = resumeData.experience.some(exp => 
        exp.achievements.some(ach => /\d+[%$kK]/.test(ach))
      );
      if (hasQuantifiedAchievements) score += 15;
    }
    
    // Check education (15 points)
    if (resumeData.education.length > 0) score += 15;
    
    // Check skills (15 points)
    if (resumeData.skills.technical.length >= 5) score += 10;
    if (resumeData.skills.soft.length >= 3) score += 5;
    
    return Math.min(100, score);
  };

  const atsScore = calculateATSScore();

          {/* Contact */}
          <div>
            <h2 className="text-lg font-bold mb-3 border-b-2 border-primary pb-1">CONTACT</h2>
            <div className="space-y-2 text-sm">
              {data.personal.email && <p>{data.personal.email}</p>}
              {data.personal.phone && <p>{data.personal.phone}</p>}
              {data.personal.location && <p>{data.personal.location}</p>}
            </div>
          </div>

          {/* Skills */}
          {(data.skills.technical.length > 0 || data.skills.soft.length > 0) && (
            <div>
              <h2 className="text-lg font-bold mb-3 border-b-2 border-primary pb-1">SKILLS</h2>
              {data.skills.technical.length > 0 && (
                <div className="mb-3">
                  <h3 className="font-semibold text-sm mb-2">Technical</h3>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.technical.map((skill) => (
                      <span key={skill} className="text-xs bg-primary/10 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.skills.soft.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Soft Skills</h3>
                  <div className="flex flex-wrap gap-1">
                    {data.skills.soft.map((skill) => (
                      <span key={skill} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Summary */}
          {data.personal.summary && (
            <div>
              <h2 className="text-xl font-bold mb-2 text-primary">PROFESSIONAL SUMMARY</h2>
              <p className="text-sm leading-relaxed">{data.personal.summary}</p>
            </div>
          )}

          {/* Experience */}
          {data.experience.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3 text-primary">WORK EXPERIENCE</h2>
              <div className="space-y-4">
                {data.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold">{exp.position}</h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {exp.company}
                    </p>
                    {exp.achievements.filter((a) => a).length > 0 && (
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {exp.achievements.filter((a) => a).map((achievement, idx) => (
                          <li key={idx}>{achievement}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3 text-primary">EDUCATION</h2>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{edu.degree} {edu.field && `in ${edu.field}`}</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{edu.school}</p>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModernTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="text-gray-900 dark:text-gray-100 font-sans" style={{ fontSize: "16px" }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-4 border-primary">
        <h1 className="text-4xl font-bold mb-2">{data.personal.name || "Your Name"}</h1>
        <p className="text-xl text-primary font-medium mb-3">
          {data.personal.title || "Professional Title"}
        </p>
        <div className="flex justify-center gap-4 text-sm">
          {data.personal.email && <span>{data.personal.email}</span>}
          {data.personal.phone && <span>•</span>}
          {data.personal.phone && <span>{data.personal.phone}</span>}
          {data.personal.location && <span>•</span>}
          {data.personal.location && <span>{data.personal.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.personal.summary && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3 text-primary">About</h2>
          <p className="text-sm leading-relaxed">{data.personal.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-primary">Experience</h2>
          <div className="space-y-5">
            {data.experience.map((exp) => (
              <div key={exp.id} className="border-l-4 border-primary pl-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-bold">{exp.position}</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap ml-4">
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <p className="text-sm font-medium text-primary mb-2">{exp.company}</p>
                {exp.achievements.filter((a) => a).length > 0 && (
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {exp.achievements.filter((a) => a).map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-primary">Education</h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="border-l-4 border-primary pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{edu.school}</p>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap ml-4">
                    {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {(data.skills.technical.length > 0 || data.skills.soft.length > 0) && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-primary">Skills</h2>
          <div className="space-y-3">
            {data.skills.technical.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills.technical.map((skill) => (
                    <span
                      key={skill}
                      className="bg-primary text-white px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.skills.soft.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills.soft.map((skill) => (
                    <span
                      key={skill}
                      className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CompactTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="text-gray-900 dark:text-gray-100 font-sans" style={{ fontSize: "14px" }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{data.personal.name || "Your Name"}</h1>
        <p className="text-primary font-semibold">{data.personal.title || "Professional Title"}</p>
        <div className="flex gap-3 text-xs mt-1">
          {data.personal.email && <span>{data.personal.email}</span>}
          {data.personal.phone && <span>|</span>}
          {data.personal.phone && <span>{data.personal.phone}</span>}
          {data.personal.location && <span>|</span>}
          {data.personal.location && <span>{data.personal.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.personal.summary && (
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase mb-1 border-b border-gray-300 dark:border-gray-700">
            Summary
          </h2>
          <p className="text-xs leading-relaxed">{data.personal.summary}</p>
        </div>
      )}

      {/* Skills */}
      {(data.skills.technical.length > 0 || data.skills.soft.length > 0) && (
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase mb-1 border-b border-gray-300 dark:border-gray-700">
            Skills
          </h2>
          {data.skills.technical.length > 0 && (
            <p className="text-xs mb-1">
              <span className="font-semibold">Technical:</span>{" "}
              {data.skills.technical.join(", ")}
            </p>
          )}
          {data.skills.soft.length > 0 && (
            <p className="text-xs">
              <span className="font-semibold">Soft Skills:</span> {data.skills.soft.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase mb-1 border-b border-gray-300 dark:border-gray-700">
            Experience
          </h2>
          <div className="space-y-2">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start">
                  <p className="font-bold text-sm">{exp.position}</p>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <p className="text-xs italic mb-1">{exp.company}</p>
                {exp.achievements.filter((a) => a).length > 0 && (
                  <ul className="list-disc list-inside text-xs space-y-0.5 ml-2">
                    {exp.achievements.filter((a) => a).map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase mb-1 border-b border-gray-300 dark:border-gray-700">
            Education
          </h2>
          <div className="space-y-1">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </p>
                  <p className="text-xs">{edu.school}</p>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
