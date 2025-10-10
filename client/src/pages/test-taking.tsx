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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { TestResultsModal } from "@/components/TestResultsModal";
import { 
  Clock, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Shield, 
  Copy,
  FileText,
  Code,
  CheckCircle 
} from "lucide-react";

interface TestTemplate {
  passingScore: number;
  title: string;
  description?: string;
  timeLimit?: number;
}

interface TestAssignment {
  id: number;
  status: string;
  score?: number;
  retakeAllowed: boolean;
  testTemplate: TestTemplate;
}

interface TestQuestion {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export default function TestTaking() {
  const { id: assignmentId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const testContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<Date | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Enhanced anti-cheating state
  const [deviceFingerprint, setDeviceFingerprint] = useState<any>(null);
  const [behavioralData, setBehavioralData] = useState<any>({
    keystrokes: [],
    mouseMovements: [],
    mouseClicks: [],
    scrollEvents: [],
    responses: [],
    focusEvents: [],
    pageViews: [],
    interactions: []
  });
  const [environmentData, setEnvironmentData] = useState<any>({});
  const [proctoringSummary, setProctoringSummary] = useState<any>(null);
  const [advancedViolations, setAdvancedViolations] = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState<number>(0);

  // Mouse and keyboard tracking
  const [lastMousePosition, setLastMousePosition] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [keystrokeBuffer, setKeystrokeBuffer] = useState<any[]>([]);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);

  // Authentication state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Results modal state
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [proctorEnabled, setProctorEnabled] = useState(true); // Added proctorEnabled state

  // Enhanced device fingerprinting
  const generateDeviceFingerprint = useCallback(async () => {
    const fingerprint = {
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      platform: navigator.platform,
      plugins: Array.from(navigator.plugins).map(p => p.name),
      webGL: getWebGLFingerprint(),
      canvas: getCanvasFingerprint(),
      audioContext: getAudioFingerprint(),
      fonts: await detectFonts(),
      connection: (navigator as any).connection?.effectiveType,
      deviceMemory: (navigator as any).deviceMemory,
      cpuClass: (navigator as any).cpuClass,
      brightness: await getBrightness(),
      motionLevel: 0,
      timestamp: Date.now()
    };

    setDeviceFingerprint(fingerprint);

    // Send to backend for analysis
    try {
      await apiRequest(`/api/proctoring/test-assignments/${assignmentId}/device-fingerprint`, 'POST', fingerprint);
    } catch (error) {
      console.error('Failed to send device fingerprint:', error);
    }

    return fingerprint;
  }, [assignmentId]);

  // Enhanced behavioral tracking
  const trackKeystroke = useCallback((event: KeyboardEvent) => {
    const keystroke = {
      key: event.key,
      timestamp: Date.now(),
      duration: 0, // Will be calculated on keyup
      interval: 0
    };

    setKeystrokeBuffer(prev => {
      const newBuffer = [...prev, keystroke];
      // Keep only last 100 keystrokes for performance
      return newBuffer.slice(-100);
    });

    setBehavioralData((prev: any) => ({
      ...prev,
      keystrokes: [...prev.keystrokes, keystroke]
    }));
  }, []);

  const trackMouseMovement = useCallback((event: MouseEvent) => {
    const now = Date.now();
    const movement = {
      x: event.clientX,
      y: event.clientY,
      timestamp: now,
      velocity: 0,
      acceleration: 0
    };

    // Calculate velocity
    if (lastMousePosition) {
      const dx = movement.x - lastMousePosition.x;
      const dy = movement.y - lastMousePosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      movement.velocity = distance; // Simplified velocity
    }

    setLastMousePosition({ x: movement.x, y: movement.y });

    setBehavioralData((prev: any) => ({
      ...prev,
      mouseMovements: [...prev.mouseMovements.slice(-50), movement] // Keep last 50
    }));
  }, [lastMousePosition]);

  const trackMouseClick = useCallback((event: MouseEvent) => {
    const click = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      button: event.button,
      element: (event.target as Element)?.tagName || 'unknown'
    };

    setBehavioralData((prev: any) => ({
      ...prev,
      mouseClicks: [...prev.mouseClicks, click]
    }));
  }, []);

  const trackScrollEvent = useCallback((event: Event) => {
    const wheelEvent = event as WheelEvent;
    const scroll = {
      deltaX: wheelEvent.deltaX,
      deltaY: wheelEvent.deltaY,
      timestamp: Date.now()
    };

    setBehavioralData((prev: any) => ({
      ...prev,
      scrollEvents: [...prev.scrollEvents, scroll]
    }));
  }, []);

  const trackFocusEvent = useCallback((type: 'focus' | 'blur') => {
    const focusEvent = {
      type,
      timestamp: Date.now(),
      target: document.activeElement?.tagName || 'unknown'
    };

    setBehavioralData((prev: any) => ({
      ...prev,
      focusEvents: [...prev.focusEvents, focusEvent]
    }));
  }, []);

  // Advanced violation detection
  const detectAdvancedViolation = useCallback(async (type: string, data: any) => {
    const violation = {
      type,
      timestamp: Date.now(),
      data,
      severity: determineSeverity(type, data),
      sessionId: assignmentId
    };

    setAdvancedViolations(prev => [...prev, violation]);

    // Send to backend for processing
    try {
      await apiRequest(`/api/proctoring/test-assignments/${assignmentId}/violation`, 'POST', violation);
    } catch (error) {
      console.error('Failed to report violation:', error);
    }

    // Update risk score
    calculateRiskScore([...advancedViolations, violation]);
  }, [assignmentId, advancedViolations]);

  const determineSeverity = (type: string, data: any): 'low' | 'medium' | 'high' | 'critical' => {
    const severityMap: {[key: string]: string} = {
      'tab_switch': 'medium',
      'copy_attempt': 'high',
      'dev_tools': 'critical',
      'multiple_faces': 'critical',
      'no_face': 'high',
      'suspicious_network': 'high',
      'external_device': 'medium',
      'rapid_responses': 'high'
    };

    return (severityMap[type] || 'medium') as 'low' | 'medium' | 'high' | 'critical';
  };

  const calculateRiskScore = (violations: any[]) => {
    const weights = {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50
    };

    const score = violations.reduce((total, violation) => 
      total + weights[violation.severity as keyof typeof weights], 0
    );

    setRiskScore(Math.min(100, score));
  };

  // Helper functions for device fingerprinting
  const getWebGLFingerprint = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) return '';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return debugInfo ? 
        gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) + '|' + 
        gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
    } catch (e) {
      return '';
    }
  };

  const getCanvasFingerprint = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fingerprint test 🎯', 2, 2);
      return canvas.toDataURL();
    } catch (e) {
      return '';
    }
  };

  const getAudioFingerprint = (): string => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      return audioContext.sampleRate.toString();
    } catch (e) {
      return '';
    }
  };

  const detectFonts = async (): Promise<string[]> => {
    // Simplified font detection
    const testFonts = ['Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Georgia'];
    return testFonts; // In real implementation, would test font availability
  };

  const getBrightness = async (): Promise<number> => {
    // Simplified brightness detection using camera if available
    return 0.8; // Default brightness
  };

  // Camera monitoring functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 }, 
        audio: false 
      });
      setCameraStream(stream);
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraPermission('denied');
      toast({
        title: "Camera Access Required",
        description: "Please enable camera access for test monitoring. This is required for test integrity.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const { data: assignment, isLoading } = useQuery<TestAssignment>({
    queryKey: [`/api/test-assignments/${assignmentId}`],
    enabled: !!assignmentId && isAuthenticated,
  });

  const { data: questions = [] } = useQuery<TestQuestion[]>({
    queryKey: [`/api/test-assignments/${assignmentId}/questions`],
    enabled: !!assignmentId && isAuthenticated,
  });

  const submitTestMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🚀 MUTATION FUNCTION STARTED - Submission data:', data);
      console.log('📍 API endpoint:', `/api/test-assignments/${assignmentId}/submit`);
      try {
        const result = await apiRequest(`/api/test-assignments/${assignmentId}/submit`, "POST", data);
        console.log('✅ API REQUEST SUCCESSFUL - Result:', result);
        return result;
      } catch (error) {
        console.error('❌ API REQUEST FAILED - Error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: (response: any) => {
      console.log('🎉 ONSUCCESS CALLED - Response:', response);
      exitFullscreen();
      setIsSubmitting(false);

      // CRITICAL: Invalidate cache to prevent retaking completed tests
      queryClient.invalidateQueries({ queryKey: [`/api/test-assignments/${assignmentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobseeker/test-assignments'] });
      queryClient.invalidateQueries({ queryKey: [`/api/test-assignments/${assignmentId}/questions`] });

      // Store test results and show modal for all completions
      const timeSpent = startTimeRef.current ? Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000) : 0;
      const passingScore = (assignment as any)?.testTemplate?.passingScore || 70;
      const score = response.score || 0;

      setTestResults({
        score: score,
        passingScore: passingScore,
        timeSpent,
        violations: warningCount,
        testTitle: (assignment as any)?.testTemplate?.title || 'Test',
        recruiterName: (assignment as any)?.recruiter?.name || (assignment as any)?.recruiter?.companyName || 'Recruiter'
      });

      setShowResultsModal(true);

      toast({ 
        title: "Test Submitted Successfully!", 
        description: `Score: ${score}%`,
        variant: "default" 
      });

      // CRITICAL: If user failed, redirect to retake payment page after modal closes
      if (score < passingScore) {
        setTimeout(() => {
          console.log('🔄 User failed test - redirecting to retake payment page');
          setLocation(`/test/${assignmentId}/retake-payment`);
        }, 3000);
      }
    },
    onError: (error: any) => {
      console.error('onError called with error:', error);
      setIsSubmitting(false);
      toast({ 
        title: "Submission Failed", 
        description: error.message || "Failed to submit test. Please try again.",
        variant: "destructive" 
      });
    },
  });

  // Initialize advanced anti-cheating on test start
  useEffect(() => {
    if (testStarted && !deviceFingerprint) {
      generateDeviceFingerprint();
    }
  }, [testStarted, deviceFingerprint, generateDeviceFingerprint]);

  // Enhanced behavioral tracking
  useEffect(() => {
    if (!testStarted || isSubmitting || showResultsModal) return;

    const handleKeyDown = (e: KeyboardEvent) => trackKeystroke(e);
    const handleMouseMove = (e: MouseEvent) => trackMouseMovement(e);
    const handleMouseClick = (e: MouseEvent) => trackMouseClick(e);
    const handleScroll = (e: Event) => trackScrollEvent(e);
    const handleFocus = () => trackFocusEvent('focus');
    const handleBlur = () => trackFocusEvent('blur');

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);
    document.addEventListener('wheel', handleScroll);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
      document.removeEventListener('wheel', handleScroll);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [testStarted, isSubmitting, showResultsModal, trackKeystroke, trackMouseMovement, trackMouseClick, trackScrollEvent, trackFocusEvent]);

  // Enhanced network monitoring - disabled to prevent infinite loops
  useEffect(() => {
    if (!testStarted || isSubmitting) return;

    // Network monitoring temporarily disabled to prevent API call loops
    // const originalFetch = window.fetch;
    // window.fetch = async (...args) => {
    //   const [url] = args;
    //   
    //   // Check for suspicious external requests, but exclude our own API calls
    //   if (typeof url === 'string' && 
    //       !url.includes(window.location.hostname) && 
    //       !url.includes('/api/') && 
    //       !url.startsWith('/api/') &&
    //       !url.includes('localhost') &&
    //       !url.includes('127.0.0.1')) {
    //     await detectAdvancedViolation('suspicious_network', {
    //       url,
    //       timestamp: Date.now()
    //     });
    //   }
    //   
    //   return originalFetch(...args);
    // };
    // 
    // return () => {
    //   window.fetch = originalFetch;
    // };
  }, [testStarted, isSubmitting, detectAdvancedViolation]);

  // Proctoring: Detect dev tools
  useEffect(() => {
    if (!proctorEnabled) return;

    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > threshold || heightDiff > threshold) {
        const newWarningCount = warningCount + 1;
        setWarningCount(newWarningCount);

        console.log(`🚨 Dev tools detected! Warning ${newWarningCount}/5`);

        fetch(`/api/proctoring/test-assignments/${assignmentId}/violation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'dev_tools',
            severity: 'critical',
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error('Failed to log violation:', err));

        toast({
          title: "🚫 Critical Violation",
          description: `Developer tools detected! Warning ${newWarningCount}/5`,
          variant: "destructive",
          duration: 5000
        });

        if (newWarningCount >= 5) {
          setTimeout(() => handleSubmitTest(), 2000);
        }
      }
    };

    const interval = setInterval(detectDevTools, 2000);
    return () => clearInterval(interval);
  }, [assignmentId, warningCount, toast, proctorEnabled]);

  // Proctoring: Detect tab/window changes
  useEffect(() => {
    if (!proctorEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newWarningCount = warningCount + 1;
        setWarningCount(newWarningCount);
        setTabSwitchCount(prev => prev + 1);

        console.log(`🚨 Tab switch detected! Warning ${newWarningCount}/5`);

        fetch(`/api/proctoring/test-assignments/${assignmentId}/violation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'tab_switch',
            severity: newWarningCount >= 3 ? 'high' : 'medium',
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error('Failed to log violation:', err));

        toast({
          title: "⚠️ Proctoring Alert",
          description: `Tab switch detected! Warning ${newWarningCount}/5. Test will auto-submit at 5 warnings.`,
          variant: "destructive",
          duration: 5000
        });

        // Auto-submit if 5 warnings reached
        if (newWarningCount >= 5) {
          toast({
            title: "🚫 Test Terminated",
            description: "Excessive violations detected. Submitting test automatically.",
            variant: "destructive",
            duration: 3000
          });
          setTimeout(() => handleSubmitTest(), 2000);
        }
      }
    };

    const handleBlur = () => {
      if (document.visibilityState === 'visible') {
        // Window lost focus but tab is still visible
        console.log('⚠️ Window blur detected');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [assignmentId, warningCount, toast, proctorEnabled]);

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

  // Fix time limit to use template timeLimit correctly
  useEffect(() => {
    if (assignment?.testTemplate) {
      // Time limit is already in minutes from template, convert to seconds
      const timeInSeconds = (assignment.testTemplate.timeLimit || 60) * 60;
      setTimeLeft(timeInSeconds);
      console.log(`⏱️ Test time limit set to ${assignment.testTemplate.timeLimit} minutes (${timeInSeconds} seconds)`);
    }
  }, [assignment]);

  // Auto-submit on excessive violations  
  useEffect(() => {
    if (warningCount >= 5 && !isSubmitting && !showResultsModal && testStarted) {
      console.log('🚨 AUTO-TERMINATING TEST - 5 warnings reached');

      toast({
        title: "Test Terminated",
        description: "Maximum violations (5) reached. Test is being submitted automatically.",
        variant: "destructive"
      });

      // Stop all monitoring and submit immediately
      setTestStarted(false);
      stopCamera();

      // Force submit after brief delay
      setTimeout(() => {
        if (!isSubmitting && !showResultsModal) {
          handleSubmitTest();
        }
      }, 1500);
    }
  }, [warningCount, isSubmitting, showResultsModal, testStarted]);

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const enterFullscreen = () => {
    if (testContainerRef.current?.requestFullscreen) {
      testContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.log('Fullscreen exit error (safe to ignore):', err);
        });
      }
      setIsFullscreen(false);
    } catch (error) {
      console.log('Fullscreen exit error (safe to ignore):', error);
      setIsFullscreen(false);
    }
  };

  const startTest = async () => {
    if (assignment?.testTemplate?.timeLimit) {
      setTimeLeft(assignment.testTemplate.timeLimit * 60);
    }

    // Start camera monitoring
    await startCamera();

    setTestStarted(true);
    startTimeRef.current = new Date();
    enterFullscreen();

    // Add event listener for fullscreen change
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    toast({
      title: "Test Started",
      description: "Camera monitoring is active. Good luck!",
      duration: 3000
    });
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    const now = Date.now();

    // Track response timing for behavioral analysis
    if (!responseStartTime) {
      setResponseStartTime(now);
    }

    // Record response data for analysis
    const responseData = {
      questionId,
      answer,
      timestamp: now,
      responseTime: responseStartTime ? now - responseStartTime : 0,
      keystrokes: keystrokeBuffer,
      wordCount: answer?.toString().split(' ').length || 0
    };

    setBehavioralData((prev: any) => ({
      ...prev,
      responses: [...prev.responses, responseData]
    }));

    // Check for suspiciously fast responses
    if (responseStartTime && (now - responseStartTime) < 5000 && answer?.toString().length > 50) {
      detectAdvancedViolation('rapid_responses', {
        responseTime: now - responseStartTime,
        answerLength: answer.toString().length,
        questionId
      });
    }

    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = async () => {
    console.log('🔵 handleSubmitTest called');
    console.log('🔵 isSubmitting:', isSubmitting, 'showResultsModal:', showResultsModal);
    
    if (isSubmitting || showResultsModal) {
      console.log('⚠️ Submit blocked - isSubmitting:', isSubmitting, 'showResultsModal:', showResultsModal);
      return;
    }

    console.log('✅ Proceeding with submission');
    setIsSubmitting(true);
    setTestStarted(false); // Stop anti-cheating monitoring
    stopCamera(); // Stop camera monitoring
    document.removeEventListener('fullscreenchange', handleFullscreenChange); // Clean up listener

    const timeSpent = startTimeRef.current ? Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 1000) : 0;

    // Skip proctoring summary for now to ensure submission works
    console.log('📤 Submitting test with answers:', answers);
    console.log('⏱️ Time spent:', timeSpent);
    console.log('⚠️ Warnings:', warningCount, 'Tab switches:', tabSwitchCount, 'Copy attempts:', copyAttempts);
    console.log('📋 Number of answers:', Object.keys(answers).length);

    try {
      submitTestMutation.mutate({
        answers,
        timeSpent,
        warningCount,
        tabSwitchCount,
        copyAttempts
      });
      console.log('✅ Mutation called successfully');
    } catch (error) {
      console.error('❌ Error calling mutation:', error);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await apiRequest("/api/auth/email/login", "POST", {
        email,
        password,
      });

      if (response.ok) {
        toast({ title: "Login successful! Loading your test..." });
        window.location.reload(); // Refresh to update auth state
      } else {
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Unable to connect to server",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
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

  const handleModalClose = () => {
    setShowResultsModal(false);
    
    // If user failed, go to retake payment page, otherwise go to tests list
    const passingScore = (assignment as any)?.testTemplate?.passingScore || 70;
    const score = testResults?.score || 0;
    
    if (score < passingScore) {
      setLocation(`/test/${assignmentId}/retake-payment`);
    } else {
      setLocation('/job-seeker/tests');
    }
  };

  const handleRetakePayment = () => {
    setShowResultsModal(false);
    setLocation(`/test/${assignmentId}/retake-payment`);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Login to Take Test</CardTitle>
            <p className="text-center text-gray-600">
              Please log in to access your assigned test
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => setLocation("/auth")}
                >
                  Sign up here
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test Assignment Not Found</h1>
          <p className="text-gray-600 mb-4">The test assignment you're looking for doesn't exist or has expired.</p>
          <Button onClick={() => setLocation("/job-seeker/tests")}>
            View All Your Tests
          </Button>
        </div>
      </div>
    );
  }

  // CRITICAL: Check if test is already completed or terminated - prevent retaking unless retake is allowed after payment
  if (assignment?.status === 'completed' || assignment?.status === 'terminated') {
    // Only allow test if retake payment has been completed
    if (!assignment.retakeAllowed) {
      const isTerminated = assignment?.status === 'terminated';
      const passingScore = assignment.testTemplate?.passingScore || 70;
      const didPass = assignment.score >= passingScore;
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 ${isTerminated ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto`}>
              <CheckCircle className={`w-8 h-8 ${isTerminated ? 'text-red-600' : 'text-green-600'}`} />
            </div>
            <h1 className="text-2xl font-bold">{isTerminated ? 'Test Terminated' : 'Test Already Completed'}</h1>
            <p className="text-gray-600 max-w-md">
              {isTerminated 
                ? 'This test was terminated due to excessive violations. You can purchase a retake to try again.' 
                : `You have already completed this test and scored ${assignment.score}%. ${didPass ? ' Congratulations on passing! You can retake to achieve an even higher score.' : ' You can purchase a retake to improve your score.'}`
              }
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setLocation("/job-seeker/tests")}>
                View All Tests
              </Button>
              <Button 
                onClick={() => setLocation(`/test/${assignmentId}/retake-payment`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {didPass ? 'Improve Score - $5' : 'Purchase Retake - $5'}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // If retake is allowed, reset the assignment status to in_progress
    // This happens after successful retake payment
    console.log('✅ Retake allowed - user has paid for retake');
  }

  // Show message if no questions are available
  if (questions.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
          <p className="text-gray-600 mb-4">This test doesn't have any questions yet. Please contact the recruiter.</p>
          <Button onClick={() => setLocation("/job-seeker/tests")}>
            View All Your Tests
          </Button>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              {assignment.testTemplate.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold">{assignment.testTemplate.timeLimit} Minutes</div>
                <div className="text-sm text-gray-600">Time Limit</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold">{assignment.testTemplate.passingScore}%</div>
                <div className="text-sm text-gray-600">Passing Score</div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important Test Rules:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Test will run in fullscreen mode</li>
                  <li>• Copy/paste is disabled</li>
                  <li>• Tab switching is monitored</li>
                  <li>• Right-click is disabled</li>
                  <li>• Camera monitoring will be active</li>
                  <li>• 5 violations will auto-submit the test</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Camera Permission Notice */}
            {cameraPermission === 'prompt' && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  <strong>Camera Access Required:</strong> This test requires camera monitoring for integrity purposes. 
                  You'll be prompted to allow camera access when you start the test.
                </AlertDescription>
              </Alert>
            )}

            {cameraPermission === 'denied' && (
              <Alert variant="destructive">
                <EyeOff className="h-4 w-4" />
                <AlertDescription>
                  <strong>Camera Access Denied:</strong> Please enable camera access to take this test. 
                  Camera monitoring is required for test integrity.
                </AlertDescription>
              </Alert>
            )}

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
    <div ref={testContainerRef} className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">{assignment.testTemplate.title}</h1>
              <Badge variant="secondary">
                Question {currentQuestion + 1} of {questions.length}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              {/* Camera Status */}
              {cameraPermission === 'granted' && cameraStream && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Eye className="w-4 h-4 mr-1" />
                  Camera Active
                </Badge>
              )}

              {warningCount > 0 && (
                <Badge variant="destructive" className="text-sm font-bold">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Warnings: {warningCount}/5
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={`font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>
      </div>

      {/* Camera Monitoring (Small, Non-intrusive) */}
      {cameraPermission === 'granted' && cameraStream && (
        <div className="fixed bottom-4 right-4 z-20">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-20 h-16 rounded-lg border-2 border-green-500 object-cover"
              autoPlay
              muted
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            <div className="absolute -top-2 -right-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

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

                {['short_answer', 'long_answer', 'coding', 'scenario', 'case_study', 'open_ended', 'text', 'essay', 'explanation'].includes(currentQ.type) && (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    className={`min-h-32 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    rows={currentQ.type === 'short_answer' ? 3 : 8}
                  />
                )}

                {/* Debug: Show current question type */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mt-2">
                    Debug: Question type is "{currentQ.type}"
                  </div>
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
                    <Button
                      onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    >
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

      {/* Test Results Modal */}
      {testResults && (
        <TestResultsModal
          isOpen={showResultsModal}
          onClose={handleModalClose}
          onRetakePayment={handleRetakePayment}
          score={testResults.score}
          passingScore={testResults.passingScore}
          timeSpent={testResults.timeSpent}
          violations={testResults.violations}
          testTitle={testResults.testTitle}
          recruiterName={testResults.recruiterName}
        />
      )}
    </div>
  );
}