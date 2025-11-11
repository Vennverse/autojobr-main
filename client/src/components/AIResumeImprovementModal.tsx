import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  RefreshCw,
  CheckCircle,
  Copy,
  FileText,
  Download
} from "lucide-react";

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
  const [pageFormat, setPageFormat] = useState<'1-page' | '2-page'>('2-page');
  const [showFormatSelection, setShowFormatSelection] = useState(false);

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
          jobDescription: jobDescription.trim() || undefined,
          pageFormat: pageFormat // Include page format in the request
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
    setShowFormatSelection(false); // Reset format selection state
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
                  placeholder="Paste your current resume text here..."
                  className="min-h-[200px] font-mono text-sm"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
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

              <div className="space-y-4">
                {showFormatSelection && !improvements && (
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                    <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      📄 Resume Format (Harvard/Stanford Standard)
                    </Label>
                    <RadioGroup
                      value={pageFormat}
                      onValueChange={(value) => setPageFormat(value as '1-page' | '2-page')}
                      className="space-y-2"
                    >
                      <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white dark:bg-gray-800 hover:border-blue-500 transition-colors">
                        <RadioGroupItem value="1-page" id="format-1page" className="mt-0.5" />
                        <Label htmlFor="format-1page" className="cursor-pointer flex-1">
                          <div className="font-semibold text-sm">1-Page Resume (Compact)</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            ✓ McKinsey/Goldman Sachs standard • Optimized spacing • Best for MBA/entry-level
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white dark:bg-gray-800 hover:border-blue-500 transition-colors">
                        <RadioGroupItem value="2-page" id="format-2page" className="mt-0.5" />
                        <Label htmlFor="format-2page" className="cursor-pointer flex-1">
                          <div className="font-semibold text-sm">2-Page Resume (Professional)</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            ✓ Recommended for 5+ years experience • Better readability • More white space
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

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
                  ) : showFormatSelection && !improvements ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Continue with {pageFormat === '1-page' ? '1-Page' : '2-Page'} Format
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Improvements
                    </>
                  )}
                </Button>

                {showFormatSelection && !improvements && (
                  <Button
                    variant="outline"
                    onClick={() => setShowFormatSelection(false)}
                    className="w-full"
                  >
                    Back to Resume Input
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">AI Analysis Complete! Copy the sections you want to use:</span>
              </div>

              {improvements.summary && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Overall Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                      {improvements.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {improvements.atsScore && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">ATS Compatibility Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-blue-600">{improvements.atsScore}%</div>
                      <div className="text-sm text-gray-600">
                        {improvements.atsScore >= 80 ? "Excellent! Your resume is well-optimized for ATS systems." :
                         improvements.atsScore >= 60 ? "Good, but there's room for improvement." :
                         "Needs work to pass ATS screening."}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {improvements.strengths && improvements.strengths.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Resume Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {improvements.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {improvements.improvements && improvements.improvements.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Improvement Suggestions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {improvements.improvements.map((item: any, index: number) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <div className="font-semibold text-sm mb-1">{item.section}</div>
                          <div className="text-sm text-gray-600 mb-2">{item.issue}</div>
                          <div className="text-sm mb-2">{item.suggestion}</div>
                          {item.example && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border relative">
                              <div className="text-xs text-gray-500 mb-1">Improved version:</div>
                              <div className="text-sm">{item.example}</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(item.example, `${item.section} improvement`)}
                                data-testid={`button-copy-improvement-${index}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {improvements.keywordSuggestions && improvements.keywordSuggestions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Keyword Suggestions</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(improvements.keywordSuggestions.join(", "), "Keywords")}
                        data-testid="button-copy-keywords"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {improvements.keywordSuggestions.map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setImprovements(null)}>
                  Start Over
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/resumes/download-generated', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          resumeData: {
                            fullName: resumeText.split('\n')[0] || 'Your Name',
                            email: resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/)?.[0] || '',
                            phone: resumeText.match(/\d{10}/)?.[0] || '',
                            location: '',
                            summary: improvements.improvements?.[0]?.example || resumeText.substring(0, 200),
                            experience: [],
                            education: [],
                            skills: improvements.keywordSuggestions || [],
                            projects: [],
                            certifications: []
                          },
                          templateType: pageFormat === '1-page' ? 'harvard' : 'stanford' // Use selected page format for template
                        })
                      });

                      if (!response.ok) throw new Error('Download failed');

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `AI_Improved_Resume_${Date.now()}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);

                      toast({
                        title: "Downloaded!",
                        description: "Your improved resume has been downloaded.",
                      });
                    } catch (error) {
                      toast({
                        title: "Download Failed",
                        description: "Could not download resume. Try copying the text instead.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
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