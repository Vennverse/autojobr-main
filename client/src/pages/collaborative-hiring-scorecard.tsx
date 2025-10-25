
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { useAuth } from "@/hooks/use-auth";
import { Star, Users, MessageSquare, CheckCircle, TrendingUp, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface ScorecardCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface InterviewerFeedback {
  interviewerId: string;
  interviewerName: string;
  ratings: { [criteriaId: string]: number };
  comments: string;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  submittedAt: string;
}

const defaultCriteria: ScorecardCriteria[] = [
  { id: 'technical', name: 'Technical Skills', description: 'Coding ability, problem-solving, technical knowledge', weight: 30 },
  { id: 'communication', name: 'Communication', description: 'Clarity, articulation, listening skills', weight: 20 },
  { id: 'culture', name: 'Culture Fit', description: 'Alignment with company values and team dynamics', weight: 20 },
  { id: 'experience', name: 'Relevant Experience', description: 'Past work experience and achievements', weight: 15 },
  { id: 'problem_solving', name: 'Problem Solving', description: 'Analytical thinking and approach to challenges', weight: 15 }
];

export default function CollaborativeHiringScorecard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState<string>("");

  // Fetch applications pending feedback
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/recruiter/applications"],
  });

  // Fetch candidate profiles with AI resume data
  const { data: candidateProfiles = {} } = useQuery({
    queryKey: ["/api/recruiter/candidate-profiles"],
    enabled: applications.length > 0,
  });

  // Submit scorecard feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/recruiter/scorecard-feedback", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Your interview feedback has been recorded.",
      });
      setRatings({});
      setComments("");
      setRecommendation("");
      setSelectedApplication(null);
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/applications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  });

  const calculateAverageScore = (feedback: InterviewerFeedback[]) => {
    if (!feedback || feedback.length === 0) return 0;
    const total = feedback.reduce((sum, fb) => {
      const fbScore = Object.values(fb.ratings).reduce((s, r) => s + r, 0) / Object.values(fb.ratings).length;
      return sum + fbScore;
    }, 0);
    return Math.round((total / feedback.length) * 10) / 10;
  };

  const handleSubmitFeedback = () => {
    if (!selectedApplication) return;
    
    submitFeedbackMutation.mutate({
      applicationId: selectedApplication.id,
      ratings,
      comments,
      recommendation,
      interviewerId: user?.id,
      interviewerName: user?.name || `${user?.firstName} ${user?.lastName}`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RecruiterNavbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RecruiterNavbar user={user} />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Interview Scorecards
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Collaborative candidate evaluation with AI resume insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Candidates to Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applications.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No applications to review</p>
                    </div>
                  ) : (
                    applications.map((app: any) => {
                      const profile = candidateProfiles[app.applicantId] || {};
                      const atsScore = profile.atsScore || app.applicantAtsScore || 0;
                      
                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApplication(app)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedApplication?.id === app.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {app.applicantName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{app.applicantName}</p>
                              <p className="text-sm text-gray-600 truncate">{app.jobPostingTitle}</p>
                              {atsScore > 0 && (
                                <div className="flex items-center gap-2 mt-1">
                                  <BarChart3 className="w-3 h-3 text-blue-500" />
                                  <span className="text-xs text-blue-600 font-medium">
                                    AI Score: {atsScore}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scorecard Form */}
          <div className="lg:col-span-2">
            {selectedApplication ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Interview Scorecard - {selectedApplication.applicantName}
                  </CardTitle>
                  {/* AI Resume Score Display */}
                  {(candidateProfiles[selectedApplication.applicantId]?.atsScore || selectedApplication.applicantAtsScore) && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            AI Resume Analysis Score
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Based on automated resume screening
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600">
                            {candidateProfiles[selectedApplication.applicantId]?.atsScore || selectedApplication.applicantAtsScore}%
                          </div>
                          <Progress 
                            value={candidateProfiles[selectedApplication.applicantId]?.atsScore || selectedApplication.applicantAtsScore || 0} 
                            className="w-32 mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rating Criteria */}
                  {defaultCriteria.map((criteria) => (
                    <div key={criteria.id}>
                      <Label className="text-base font-semibold">{criteria.name}</Label>
                      <p className="text-sm text-gray-600 mb-2">{criteria.description}</p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setRatings({ ...ratings, [criteria.id]: rating })}
                            className={`w-12 h-12 rounded-lg border-2 transition-all ${
                              ratings[criteria.id] === rating
                                ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/20'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <Star
                              className={`w-6 h-6 mx-auto ${
                                ratings[criteria.id] >= rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-gray-400'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Comments */}
                  <div>
                    <Label>Additional Comments</Label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Share your detailed feedback about the candidate..."
                      rows={4}
                    />
                  </div>

                  {/* Recommendation */}
                  <div>
                    <Label>Your Recommendation</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {[
                        { value: 'strong_hire', label: 'Strong Hire', color: 'bg-green-600' },
                        { value: 'hire', label: 'Hire', color: 'bg-blue-600' },
                        { value: 'no_hire', label: 'No Hire', color: 'bg-orange-600' },
                        { value: 'strong_no_hire', label: 'Strong No Hire', color: 'bg-red-600' }
                      ].map((rec) => (
                        <Button
                          key={rec.value}
                          variant={recommendation === rec.value ? "default" : "outline"}
                          onClick={() => setRecommendation(rec.value)}
                          className={recommendation === rec.value ? rec.color : ''}
                        >
                          {rec.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={Object.keys(ratings).length < defaultCriteria.length || !recommendation || submitFeedbackMutation.isPending}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select a candidate to provide feedback</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
