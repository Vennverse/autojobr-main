
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Clock, 
  AlertTriangle, 
  Shield,
  FileText,
  Code,
  CheckCircle,
  Trophy
} from "lucide-react";

export default function RankingTestTaking() {
  const { id: testId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const startTimeRef = useRef<Date | null>(null);

  const { data: test, isLoading } = useQuery({
    queryKey: [`/api/ranking-tests/${testId}`],
    enabled: !!testId,
  });

  const submitTestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/ranking-tests/${testId}/submit`, "POST", data);
    },
    onSuccess: (response: any) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: [`/api/ranking-tests/${testId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/ranking-tests/history'] });

      toast({ 
        title: "Test Submitted Successfully!", 
        description: `Score: ${response.percentageScore}% | Rank: #${response.rank}`,
        variant: "default" 
      });

      setTimeout(() => {
        setLocation('/ranking-tests');
      }, 2000);
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast({ 
        title: "Submission Failed", 
        description: error.message || "Failed to submit test. Please try again.",
        variant: "destructive" 
      });
    },
  });

  // Timer
  useEffect(() => {
    if (!testStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  const startTest = () => {
    setTimeLeft(60 * 60); // 60 minutes default
    setTestStarted(true);
    startTimeRef.current = new Date();

    toast({
      title: "Test Started",
      description: "Good luck!",
      duration: 3000
    });
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setTestStarted(false);

    const timeSpent = startTimeRef.current ? Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000) : 0;

    submitTestMutation.mutate({
      answers,
      timeSpent
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'coding': return <Code className="w-5 h-5" />;
      case 'multiple_choice': return <CheckCircle className="w-5 h-5" />;
      case 'multiple_select': return <CheckCircle className="w-5 h-5" />;
      case 'short_answer': return <FileText className="w-5 h-5" />;
      case 'long_answer': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test Not Found</h1>
          <Button onClick={() => setLocation("/ranking-tests")}>
            Back to Ranking Tests
          </Button>
        </div>
      </div>
    );
  }

  const questions = test.questions || [];

  if (!testStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              {test.testTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold">60 Minutes</div>
                <div className="text-sm text-gray-600">Time Limit</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold">Expert Level</div>
                <div className="text-sm text-gray-600">Difficulty</div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ranking Test Rules:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Complete all {questions.length} questions</li>
                  <li>• Your score determines your rank</li>
                  <li>• Top performers get recruiter visibility</li>
                  <li>• One attempt per test</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button onClick={startTest} size="lg" className="px-8">
                Start Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">{test.testTitle}</h1>
              <Badge variant="secondary">
                Question {currentQuestion + 1} of {questions.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className={`font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto p-6">
        {currentQ && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getQuestionIcon(currentQ.type)}
                Question {currentQuestion + 1}
                <Badge className="ml-2">{currentQ.points} points</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <p className="text-lg">{currentQ.question}</p>
              </div>

              {/* Answer Input */}
              <div className="space-y-4">
                {currentQ.type === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[currentQ.id]?.toString()}
                    onValueChange={(value) => handleAnswerChange(currentQ.id, parseInt(value))}
                  >
                    {currentQ.options?.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <label htmlFor={`option-${index}`} className="cursor-pointer">
                          {String.fromCharCode(65 + index)}. {option}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQ.type === 'multiple_select' && (
                  <div className="space-y-2">
                    {currentQ.options?.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`option-${index}`}
                          checked={answers[currentQ.id]?.includes(index)}
                          onCheckedChange={(checked) => {
                            const current = answers[currentQ.id] || [];
                            if (checked) {
                              handleAnswerChange(currentQ.id, [...current, index]);
                            } else {
                              handleAnswerChange(currentQ.id, current.filter((i: number) => i !== index));
                            }
                          }}
                        />
                        <label htmlFor={`option-${index}`} className="cursor-pointer">
                          {String.fromCharCode(65 + index)}. {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {currentQ.type === 'true_false' && (
                  <RadioGroup
                    value={answers[currentQ.id]?.toString()}
                    onValueChange={(value) => handleAnswerChange(currentQ.id, value === 'true')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="true" />
                      <label htmlFor="true" className="cursor-pointer">True</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="false" />
                      <label htmlFor="false" className="cursor-pointer">False</label>
                    </div>
                  </RadioGroup>
                )}

                {['short_answer', 'long_answer', 'coding', 'essay'].includes(currentQ.type) && (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className="min-h-32 w-full p-3 border border-gray-300 rounded-md"
                    rows={currentQ.type === 'short_answer' ? 3 : 8}
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {currentQuestion < questions.length - 1 ? (
                    <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitTest}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Test"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
