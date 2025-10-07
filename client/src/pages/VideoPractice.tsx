import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Video, Mic, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SimpleFaceAnalysis, SimpleAudioAnalysis } from '@/lib/faceAnalysis';

export default function VideoPractice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioAnalysisRef = useRef<SimpleAudioAnalysis | null>(null);
  const [videoFeedback, setVideoFeedback] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const analyzeVideo = async (blob: Blob, questionId: string) => {
    console.log('Analyzing video for question:', questionId);

    // Lightweight browser-based analysis
    const videoElement = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    videoElement.src = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const analysis = {
          duration: videoElement.duration,
          resolution: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
          fileSize: blob.size,
          // Sample frames for basic brightness/quality check
          videoQuality: blob.size / videoElement.duration > 50000 ? 'good' : 'low'
        };

        resolve(analysis);
      };
    });
  };

  useEffect(() => {
    // Check browser support for Web Speech API
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Browser Not Supported",
        description: "Please use Chrome, Edge, or Safari for speech recognition",
        variant: "destructive"
      });
      return;
    }
    
    // Initialize video stream
    initializeVideoStream();
    startSession();
  }, []);

  const initializeVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsVideoReady(true);
      }
    } catch (error) {
      console.error('Failed to access camera/microphone:', error);
      toast({
        title: "Camera Access Required",
        description: "Please allow camera and microphone access to continue",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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
      toast({
        title: "Error",
        description: "Speech recognition not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    if (!streamRef.current) {
      toast({
        title: "Video Not Ready",
        description: "Please wait for camera initialization",
        variant: "destructive"
      });
      return;
    }

    // Start video recording
    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Capture data every second
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Failed to start video recording:', error);
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    let finalTranscriptText = '';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      toast({ title: "Recording Started", description: "Speak clearly and confidently" });
    };

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptText += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscriptText + interimTranscript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'no-speech') {
        toast({
          title: "No Speech Detected",
          description: "Please speak into your microphone",
          variant: "destructive"
        });
      } else if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to continue",
          variant: "destructive"
        });
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (isRecording) {
        // Automatically restart if still recording (handles speech pauses)
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
        }
      }
    };

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setVideoFeedback(''); // Clear previous feedback
      setAudioLevel(0); // Reset audio level

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 90 seconds (max recommended)
          if (newTime >= 90) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

      // Initialize audio analysis
      audioAnalysisRef.current = new SimpleAudioAnalysis();
      audioAnalysisRef.current.start();

    } catch (error) {
      console.error('Failed to start recognition:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Stop video recording
    let videoBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => {
          videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          resolve();
        };
        mediaRecorderRef.current!.stop();
      });
    }

    // Stop audio analysis and get feedback
    if (audioAnalysisRef.current) {
      audioAnalysisRef.current.stop();
      const audioAnalysisResult = audioAnalysisRef.current.getAnalysis();
      setAudioLevel(audioAnalysisResult.avgVolume);
      // Basic audio feedback
      if (audioAnalysisResult.avgVolume < 0.2) {
        setVideoFeedback('Your audio level is very low. Please speak louder.');
      } else if (audioAnalysisResult.avgVolume > 0.8) {
        setVideoFeedback('Your audio level is very high. You may be shouting.');
      }
    }

    const wordCount = transcript.trim().split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount < 50) {
      toast({
        title: "Response Too Short",
        description: `Your response has only ${wordCount} words. Aim for 100-150 words for better feedback.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      // In a real scenario, you would send the recorded blob to the backend for full video analysis
      // For now, we'll just use the placeholder analyzeVideo function
      // const videoBlob = await getRecordedVideoBlob(); // Assuming you have a way to get the video blob
      // const videoAnalysis = await analyzeVideo(videoBlob, session.questions[currentQuestion].id);
      // console.log('Video Analysis:', videoAnalysis);

      const response = await apiRequest(`/api/video-practice/${session.sessionId}/response`, 'POST', {
        questionId: session.questions[currentQuestion].id,
        transcript: transcript.trim(),
        duration: recordingTime,
        // audioAnalysis: audioAnalysisRef.current?.getAnalysis(),
        // videoAnalysis: videoAnalysis, // Include video analysis results if available
      });

      if (response.isComplete) {
        await apiRequest(`/api/video-practice/${session.sessionId}/complete`, 'POST');
        setLocation(`/video-practice/feedback/${session.sessionId}`);
      } else {
        setCurrentQuestion(prev => prev + 1);
        setTranscript('');
        setRecordingTime(0);
        toast({ title: "Response Submitted", description: "Great! Moving to next question." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const question = session.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / session.questions.length) * 100;
  const wordCount = transcript.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">AI Video Interview Practice</h1>
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
            {question.type === 'technical' && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                💡 Explain your thought process verbally - no code execution needed
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Preview */}
            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg min-h-[200px] relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Auto-Transcribed Response (Web Speech API):
                </p>
                <div className="flex items-center gap-3">
                  <Badge variant={wordCount >= 100 && wordCount <= 150 ? "default" : "secondary"}>
                    {wordCount} words
                  </Badge>
                  {isRecording && (
                    <Badge variant="destructive" className="animate-pulse">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </Badge>
                  )}
                </div>
              </div>

              {isListening && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-2 text-red-500 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-medium">Listening...</span>
                  </div>
                </div>
              )}

              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {transcript || 'Click "Start Recording" and speak your answer. Your speech will be automatically transcribed here in real-time.'}
              </p>
            </div>

            {videoFeedback && (
              <div className="flex items-start gap-2 text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{videoFeedback}</p>
              </div>
            )}

            <div className="flex gap-4">
              {!isRecording ? (
                <Button onClick={startRecording} className="flex-1" size="lg" disabled={session?.paymentStatus === 'pending'}>
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

            {session?.paymentStatus === 'pending' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  💳 Payment required to unlock this practice session ($5)
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
                  Get instant AI-powered feedback on your interview performance, body language, and communication skills
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // Integrate with PayPal or other payment gateway
                    window.location.href = `/payment/video-practice/${session.sessionId}`;
                  }}
                >
                  Pay $5 to Continue
                </Button>
              </div>
            )}

            {wordCount > 0 && wordCount < 100 && !isRecording && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Aim for 100-150 words for optimal feedback. Current: {wordCount} words</p>
              </div>
            )}

            <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
              <p className="font-medium mb-2">💡 Interview Tips:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Speak clearly at a moderate pace (not too fast or slow)</li>
                <li>Use the STAR method: Situation, Task, Action, Result</li>
                <li>Target 100-150 words for each response</li>
                <li>Minimize filler words like "um", "uh", "like"</li>
                <li>For technical questions: Explain your reasoning, not just code</li>
                <li>Take a brief pause to organize your thoughts before speaking</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}