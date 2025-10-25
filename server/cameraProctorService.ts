interface FaceDetectionResult {
  facesCount: number;
  primaryFace?: Face;
  additionalFaces?: Face[];
  confidence: number;
  suspiciousActivity: string[];
}

interface Face {
  id: string;
  boundingBox: BoundingBox;
  landmarks?: FaceLandmarks;
  emotions?: EmotionScores;
  eyeGaze?: EyeGaze;
  quality: number;
  isLookingAtScreen: boolean;
  attentionLevel: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceLandmarks {
  leftEye: Point;
  rightEye: Point;
  nose: Point;
  mouth: Point;
  chin: Point;
}

interface Point {
  x: number;
  y: number;
}

interface EmotionScores {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  neutral: number;
  fearful: number;
  disgusted: number;
}

interface EyeGaze {
  direction: { x: number; y: number };
  isLookingAtScreen: boolean;
  blinkRate: number;
  gazeDeviation: number;
}

interface AudioAnalysis {
  volumeLevel: number;
  frequencyAnalysis: number[];
  voiceDetected: boolean;
  multipleVoices: boolean;
  backgroundNoise: number;
  suspiciousAudio: string[];
}

interface EnvironmentAnalysis {
  lightingConditions: 'good' | 'poor' | 'inconsistent';
  backgroundChanges: number;
  movementDetection: MovementEvent[];
  objectsDetected: DetectedObject[];
  suspiciousEnvironment: string[];
}

interface MovementEvent {
  timestamp: number;
  type: 'head_movement' | 'body_movement' | 'background_movement';
  intensity: number;
  duration: number;
}

interface DetectedObject {
  type: string;
  confidence: number;
  boundingBox: BoundingBox;
  suspiciousScore: number;
}

interface CameraViolation {
  type: 'no_face' | 'multiple_faces' | 'looking_away' | 'suspicious_object' | 
        'poor_lighting' | 'camera_blocked' | 'multiple_voices' | 'background_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  evidence: any;
  confidence: number;
  description: string;
}

interface ProctoringSummary {
  sessionId: string;
  duration: number;
  averageAttention: number;
  faceVisibilityPercentage: number;
  violations: CameraViolation[];
  environmentStability: number;
  audioCompliance: number;
  overallCompliance: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export class CameraProctorService {
  private faceDetectionThreshold = 0.7;
  private gazeDeviationThreshold = 0.3;
  private attentionThreshold = 0.6;
  private lightingThreshold = 0.4;
  
  private sessionData: Map<string, any> = new Map();
  private analysisCache: Map<string, { result: FaceDetectionResult; timestamp: number }> = new Map();

  // Initialize proctoring session
  async initializeSession(sessionId: string, config: any = {}): Promise<void> {
    this.sessionData.set(sessionId, {
      startTime: Date.now(),
      config,
      violations: [],
      faceHistory: [],
      audioHistory: [],
      environmentHistory: [],
      statistics: {
        totalFrames: 0,
        framesWithFace: 0,
        framesWithMultipleFaces: 0,
        attentionScores: [],
        violations: []
      }
    });

    console.log(`🎥 Camera proctoring initialized for session ${sessionId}`);
  }

  // Analyze video frame for face detection and attention monitoring
  async analyzeVideoFrame(sessionId: string, frameData: any): Promise<FaceDetectionResult> {
    const session = this.sessionData.get(sessionId);
    if (!session) {
      throw new Error('Session not initialized');
    }

    // Smart frame sampling: Only analyze every 3rd frame (66% reduction)
    session.statistics.totalFrames++;
    if (session.statistics.totalFrames % 3 !== 0) {
      // Return cached result for skipped frames
      const lastResult = session.faceHistory[session.faceHistory.length - 1]?.result;
      if (lastResult) return lastResult;
    }

    // In a real implementation, this would use computer vision libraries like OpenCV, face-api.js, or TensorFlow.js
    // For now, we'll simulate the analysis based on the provided frame data
    
    const result = await this.simulateFaceDetection(frameData);
    
    // Update session statistics
    if (result.facesCount > 0) {
      session.statistics.framesWithFace++;
    }
    if (result.facesCount > 1) {
      session.statistics.framesWithMultipleFaces++;
    }

    // Add to face history (with size limit to prevent memory bloat)
    session.faceHistory.push({
      timestamp: Date.now(),
      result
    });
    
    // Keep only last 100 entries to prevent memory issues
    if (session.faceHistory.length > 100) {
      session.faceHistory.shift();
    }

    // Check for violations (only on critical changes)
    if (this.shouldCheckViolations(session, result)) {
      await this.checkForViolations(sessionId, result);
    }

    return result;
  }

  // Only check violations on significant changes
  private shouldCheckViolations(session: any, currentResult: FaceDetectionResult): boolean {
    const lastResult = session.faceHistory[session.faceHistory.length - 2]?.result;
    if (!lastResult) return true;
    
    // Check violations only if status changed
    return (
      lastResult.facesCount !== currentResult.facesCount ||
      (lastResult.primaryFace?.isLookingAtScreen !== currentResult.primaryFace?.isLookingAtScreen)
    );
  }

  // Analyze audio stream for voice detection and multiple speaker detection
  async analyzeAudioStream(sessionId: string, audioData: any): Promise<AudioAnalysis> {
    const session = this.sessionData.get(sessionId);
    if (!session) {
      throw new Error('Session not initialized');
    }

    // Simulate audio analysis (in real implementation, use Web Audio API or similar)
    const analysis = await this.simulateAudioAnalysis(audioData);
    
    // Add to audio history
    session.audioHistory.push({
      timestamp: Date.now(),
      analysis
    });

    // Check for audio-related violations
    if (analysis.multipleVoices) {
      await this.recordViolation(sessionId, {
        type: 'multiple_voices',
        severity: 'high',
        timestamp: new Date(),
        evidence: { voiceCount: 'multiple' },
        confidence: 0.8,
        description: 'Multiple voices detected in audio stream'
      });
    }

    return analysis;
  }

  // Analyze environment for stability and suspicious changes
  async analyzeEnvironment(sessionId: string, environmentData: any): Promise<EnvironmentAnalysis> {
    const session = this.sessionData.get(sessionId);
    if (!session) {
      throw new Error('Session not initialized');
    }

    const analysis = await this.simulateEnvironmentAnalysis(environmentData);
    
    // Add to environment history
    session.environmentHistory.push({
      timestamp: Date.now(),
      analysis
    });

    // Check for environment violations
    if (analysis.backgroundChanges > 5) {
      await this.recordViolation(sessionId, {
        type: 'background_change',
        severity: 'medium',
        timestamp: new Date(),
        evidence: { changes: analysis.backgroundChanges },
        confidence: 0.7,
        description: 'Frequent background changes detected'
      });
    }

    return analysis;
  }

  // Check for various types of violations
  private async checkForViolations(sessionId: string, faceResult: FaceDetectionResult): Promise<void> {
    // No face detected
    if (faceResult.facesCount === 0) {
      await this.recordViolation(sessionId, {
        type: 'no_face',
        severity: 'high',
        timestamp: new Date(),
        evidence: { facesCount: 0 },
        confidence: 0.9,
        description: 'No face detected in camera feed'
      });
    }

    // Multiple faces detected
    if (faceResult.facesCount > 1) {
      await this.recordViolation(sessionId, {
        type: 'multiple_faces',
        severity: 'critical',
        timestamp: new Date(),
        evidence: { facesCount: faceResult.facesCount },
        confidence: faceResult.confidence,
        description: `${faceResult.facesCount} faces detected in camera feed`
      });
    }

    // Looking away from screen
    if (faceResult.primaryFace && !faceResult.primaryFace.isLookingAtScreen) {
      await this.recordViolation(sessionId, {
        type: 'looking_away',
        severity: 'medium',
        timestamp: new Date(),
        evidence: { 
          eyeGaze: faceResult.primaryFace.eyeGaze,
          attentionLevel: faceResult.primaryFace.attentionLevel
        },
        confidence: 0.75,
        description: 'User not looking at screen'
      });
    }
  }

  // Record a violation
  private async recordViolation(sessionId: string, violation: CameraViolation): Promise<void> {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    session.violations.push(violation);
    session.statistics.violations.push(violation);

    console.log(`🚨 Camera violation: ${violation.type} (${violation.severity}) - ${violation.description}`);

    // Trigger real-time alerts for critical violations
    if (violation.severity === 'critical') {
      await this.triggerCriticalAlert(sessionId, violation);
    }
  }

  // Generate comprehensive proctoring summary
  async generateSummary(sessionId: string): Promise<ProctoringSummary> {
    const session = this.sessionData.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const duration = Date.now() - session.startTime;
    const stats = session.statistics;

    // Calculate metrics
    const faceVisibilityPercentage = stats.totalFrames > 0 ? 
      (stats.framesWithFace / stats.totalFrames) * 100 : 0;

    const averageAttention = stats.attentionScores.length > 0 ?
      stats.attentionScores.reduce((a: number, b: number) => a + b, 0) / stats.attentionScores.length : 0;

    // Calculate compliance scores
    const environmentStability = this.calculateEnvironmentStability(session.environmentHistory);
    const audioCompliance = this.calculateAudioCompliance(session.audioHistory);

    // Overall compliance score
    const overallCompliance = (
      (faceVisibilityPercentage * 0.4) +
      (averageAttention * 100 * 0.3) +
      (environmentStability * 0.2) +
      (audioCompliance * 0.1)
    );

    // Determine risk level
    const riskLevel = this.assessRiskLevel(session.violations, overallCompliance);

    // Generate recommendation
    const recommendation = this.generateRecommendation(riskLevel, session.violations, overallCompliance);

    return {
      sessionId,
      duration,
      averageAttention,
      faceVisibilityPercentage,
      violations: session.violations,
      environmentStability,
      audioCompliance,
      overallCompliance,
      riskLevel,
      recommendation
    };
  }

  // Simulate face detection (replace with real computer vision in production)
  private async simulateFaceDetection(frameData: any): Promise<FaceDetectionResult> {
    // In production, this would use actual face detection algorithms
    // For simulation, we'll create realistic results based on frame quality and conditions
    
    const hasGoodLighting = frameData.brightness > this.lightingThreshold;
    const hasMovement = frameData.motionLevel < 0.1;
    
    let facesCount = 1; // Default assumption
    
    // Simulate occasional violations
    if (Math.random() < 0.05) facesCount = 0; // 5% chance of no face
    if (Math.random() < 0.02) facesCount = 2; // 2% chance of multiple faces
    
    const primaryFace: Face | undefined = facesCount > 0 ? {
      id: 'primary_face',
      boundingBox: { x: 100, y: 50, width: 200, height: 250 },
      quality: hasGoodLighting ? 0.9 : 0.6,
      isLookingAtScreen: Math.random() > 0.1, // 90% looking at screen
      attentionLevel: Math.random() * 0.4 + 0.6, // 60-100%
      eyeGaze: {
        direction: { x: 0.1, y: 0.05 },
        isLookingAtScreen: Math.random() > 0.1,
        blinkRate: 15 + Math.random() * 10,
        gazeDeviation: Math.random() * 0.2
      }
    } : undefined;

    return {
      facesCount,
      primaryFace,
      additionalFaces: facesCount > 1 ? [primaryFace!] : undefined,
      confidence: hasGoodLighting && hasMovement ? 0.95 : 0.75,
      suspiciousActivity: []
    };
  }

  // Simulate audio analysis
  private async simulateAudioAnalysis(audioData: any): Promise<AudioAnalysis> {
    return {
      volumeLevel: audioData.volume || Math.random() * 100,
      frequencyAnalysis: Array.from({ length: 10 }, () => Math.random() * 100),
      voiceDetected: Math.random() > 0.3,
      multipleVoices: Math.random() < 0.05, // 5% chance
      backgroundNoise: Math.random() * 30,
      suspiciousAudio: []
    };
  }

  // Simulate environment analysis
  private async simulateEnvironmentAnalysis(environmentData: any): Promise<EnvironmentAnalysis> {
    return {
      lightingConditions: Math.random() > 0.8 ? 'poor' : 'good',
      backgroundChanges: Math.floor(Math.random() * 3),
      movementDetection: [],
      objectsDetected: [],
      suspiciousEnvironment: []
    };
  }

  // Calculate environment stability score
  private calculateEnvironmentStability(environmentHistory: any[]): number {
    if (environmentHistory.length === 0) return 100;
    
    const totalChanges = environmentHistory.reduce((total, env) => 
      total + env.analysis.backgroundChanges, 0);
    
    return Math.max(0, 100 - (totalChanges * 5));
  }

  // Calculate audio compliance score
  private calculateAudioCompliance(audioHistory: any[]): number {
    if (audioHistory.length === 0) return 100;
    
    const violationsCount = audioHistory.filter(audio => 
      audio.analysis.multipleVoices || audio.analysis.backgroundNoise > 50
    ).length;
    
    return Math.max(0, 100 - (violationsCount / audioHistory.length * 100));
  }

  // Assess overall risk level
  private assessRiskLevel(violations: CameraViolation[], compliance: number): 'low' | 'medium' | 'high' | 'critical' {
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high').length;
    
    if (criticalViolations > 0 || compliance < 40) return 'critical';
    if (highViolations > 3 || compliance < 60) return 'high';
    if (violations.length > 5 || compliance < 80) return 'medium';
    return 'low';
  }

  // Generate recommendation based on analysis
  private generateRecommendation(riskLevel: string, violations: CameraViolation[], compliance: number): string {
    const recommendations = {
      low: `Session shows high compliance (${compliance.toFixed(1)}%) with minimal violations. Proceed with confidence.`,
      medium: `Session shows moderate compliance (${compliance.toFixed(1)}%) with some concerns. Consider manual review.`,
      high: `Session shows concerning patterns (${compliance.toFixed(1)}% compliance) with multiple violations. Recommend thorough investigation.`,
      critical: `Session shows critical violations and poor compliance (${compliance.toFixed(1)}%). Strong recommendation to reject or require supervised retake.`
    };

    let recommendation = recommendations[riskLevel as keyof typeof recommendations];
    
    if (violations.length > 0) {
      const violationTypes = [...new Set(violations.map(v => v.type))];
      recommendation += `\n\nViolation types detected: ${violationTypes.join(', ')}`;
    }

    return recommendation;
  }

  // Trigger critical alert
  private async triggerCriticalAlert(sessionId: string, violation: CameraViolation): Promise<void> {
    console.log(`🚨 CRITICAL CAMERA ALERT: ${violation.type} detected in session ${sessionId}`);
    // In production: send notifications, trigger supervisor alerts, etc.
  }

  // Clean up session data
  async cleanup(sessionId: string): Promise<void> {
    this.sessionData.delete(sessionId);
    console.log(`🧹 Cleaned up camera proctoring data for session ${sessionId}`);
  }
}

export const cameraProctorService = new CameraProctorService();