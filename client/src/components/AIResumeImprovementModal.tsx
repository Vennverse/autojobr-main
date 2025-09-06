import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, RefreshCw, CheckCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIResumeImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userResume?: string;
  targetJob?: string;
}

export default function AIResumeImprovementModal({
  isOpen,
  onClose,
  userResume = "",
  targetJob = ""
}: AIResumeImprovementModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [improvements, setImprovements] = useState<any>(null);
  const [resumeText, setResumeText] = useState(userResume);
  const [jobDescription, setJobDescription] = useState(targetJob);

  const generateImprovements = async () => {
    if (!resumeText.trim()) {
      toast({
        title: "Missing Resume",
        description: "Please paste your resume content to get AI suggestions.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/resume-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate improvements');
      }

      const result = await response.json();
      setImprovements(result);
      
      toast({
        title: "AI Analysis Complete!",
        description: "Your resume improvements are ready to copy and use.",
      });
    } catch (error: any) {
      console.error('AI Resume Improvement Error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${section} copied to clipboard.`,
    });
  };

  const handleClose = () => {
    setImprovements(null);
    setResumeText(userResume);
    setJobDescription(targetJob);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Resume Improvement Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!improvements ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your Resume Content *
                </label>
                <Textarea
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Target Job Description (Optional)
                </label>
                <Textarea
                  placeholder="Paste the job description you're targeting for better optimization..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <Button 
                onClick={generateImprovements}
                disabled={isGenerating || !resumeText.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Your Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Improvements
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">AI Analysis Complete! Copy the sections you want to use:</span>
              </div>

              {improvements.professionalSummary && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Improved Professional Summary
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(improvements.professionalSummary, "Professional Summary")}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                      {improvements.professionalSummary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {improvements.improvedSkills && improvements.improvedSkills.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Enhanced Skills Section</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(improvements.improvedSkills.join(", "), "Skills")}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {improvements.improvedSkills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {improvements.bulletPointImprovements && improvements.bulletPointImprovements.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Improved Experience Bullets</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(
                          improvements.bulletPointImprovements.join("\n• "), 
                          "Experience Bullets"
                        )}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {improvements.bulletPointImprovements.map((bullet: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span className="flex-1 bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                            {bullet}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(bullet, "Bullet Point")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {improvements.recommendations && improvements.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {improvements.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setImprovements(null)}>
                  Start Over
                </Button>
                <Button onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}