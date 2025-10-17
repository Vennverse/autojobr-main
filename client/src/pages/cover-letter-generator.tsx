
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";

export default function CoverLetterGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    jobTitle: "",
    company: "",
    jobDescription: "",
    resume: ""
  });

  const [generatedLetter, setGeneratedLetter] = useState("");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: formData.jobTitle,
          companyName: formData.company,
          jobDescription: formData.jobDescription,
          resumeText: formData.resume
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate cover letter');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedLetter(data.coverLetter);
      toast({
        title: "Success!",
        description: "Cover letter generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate cover letter",
        variant: "destructive",
      });
    }
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Cover letter copied to clipboard",
    });
  };

  return (
    <>
      <SEOHead
        title="AI Cover Letter Generator - Create Professional Cover Letters"
        description="Generate personalized, ATS-optimized cover letters using AI. Free tool to create compelling cover letters that get interviews."
        keywords="AI cover letter generator, cover letter maker, free cover letter tool"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Cover Letter Generator
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Create personalized, professional cover letters in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>Enter the job information and your resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="jobDescription">Job Description *</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the job description here..."
                    value={formData.jobDescription}
                    onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="resume">Your Resume/Experience *</Label>
                  <Textarea
                    id="resume"
                    placeholder="Paste your resume or key achievements..."
                    value={formData.resume}
                    onChange={(e) => setFormData({...formData, resume: e.target.value})}
                    rows={6}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending || !formData.jobTitle || !formData.company || !formData.jobDescription || !formData.resume}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Cover Letter */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Cover Letter</CardTitle>
                <CardDescription>Your AI-generated personalized cover letter</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedLetter ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        value={generatedLetter}
                        onChange={(e) => setGeneratedLetter(e.target.value)}
                        className="min-h-[400px] font-serif"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Your generated cover letter will appear here
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
