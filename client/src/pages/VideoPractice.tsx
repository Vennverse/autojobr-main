
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Video, Mic, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function VideoPractice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/video-practice/start', 'POST', {
        role: 'Software Engineer',
        interviewType: 'technical',
        difficulty: 'medium'
      });
      setSession(response);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: "Error", description: "Speech recognition not supported", variant: "destructive" });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };

    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);

      try {
        setLoading(true);
        const response = await apiRequest(`/api/video-practice/${session.sessionId}/response`, 'POST', {
          questionId: session.questions[currentQuestion].id,
          transcript,
          duration: 60
        });

        if (response.isComplete) {
          const feedback = await apiRequest(`/api/video-practice/${session.sessionId}/complete`, 'POST');
          setLocation(`/video-practice/feedback/${session.sessionId}`);
        } else {
          setCurrentQuestion(prev => prev + 1);
          setTranscript('');
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const question = session.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / session.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">AI Video Practice</h1>
            <Badge variant="outline">Question {currentQuestion + 1}/{session.questions.length}</Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg min-h-[200px]">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Response (Auto-transcribed):</p>
              <p className="whitespace-pre-wrap">{transcript || 'Start speaking to see your transcript...'}</p>
            </div>

            <div className="flex gap-4">
              {!isRecording ? (
                <Button onClick={startRecording} className="flex-1" size="lg">
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="flex-1" size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Stop & Submit
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>💡 Tips:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Speak clearly and at a moderate pace</li>
                <li>Use the STAR method (Situation, Task, Action, Result)</li>
                <li>Keep responses between 100-150 words</li>
                <li>Minimize filler words (um, uh, like)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
