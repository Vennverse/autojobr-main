
// Enhanced lightweight face/video analysis using browser-based methods
// No heavy ML models - uses canvas-based heuristics and pattern detection

export class SimpleFaceAnalysis {
  private videoElement: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previousFrame: ImageData | null = null;
  private motionHistory: number[] = [];
  private brightnessHistory: number[] = [];
  
  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  // Comprehensive video analysis
  async analyzeFrame(): Promise<{
    isWellFramed: boolean;
    brightness: number;
    eyeContact: number; // 0-100
    posture: 'good' | 'slouching' | 'too_close' | 'too_far';
    motion: 'stable' | 'moderate' | 'excessive';
    facialExpression: 'neutral' | 'smiling' | 'serious' | 'concerned';
    recommendations: string[];
  }> {
    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;
    
    this.ctx.drawImage(this.videoElement, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate brightness
    const brightness = this.calculateBrightness(imageData);
    this.brightnessHistory.push(brightness);
    if (this.brightnessHistory.length > 30) this.brightnessHistory.shift();
    
    // Detect motion between frames
    const motion = this.detectMotion(imageData);
    this.motionHistory.push(motion);
    if (this.motionHistory.length > 30) this.motionHistory.shift();
    
    // Analyze face positioning (simple centering check)
    const facePosition = this.analyzeFacePosition(imageData);
    
    // Estimate eye contact (based on brightness patterns in upper face region)
    const eyeContact = this.estimateEyeContact(imageData);
    
    // Detect posture based on face size and position
    const posture = this.analyzePosture(imageData);
    
    // Basic facial expression detection
    const expression = this.detectExpression(imageData);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(brightness, motion, facePosition, posture);
    
    const avgMotion = this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length;
    const motionLevel = avgMotion < 15 ? 'stable' : avgMotion < 35 ? 'moderate' : 'excessive';
    
    return {
      isWellFramed: brightness > 80 && brightness < 200 && facePosition.centered,
      brightness: Math.round(brightness),
      eyeContact: Math.round(eyeContact),
      posture,
      motion: motionLevel,
      facialExpression: expression,
      recommendations
    };
  }
  
  // Legacy method for backward compatibility
  async analyzeFrameComposition(): Promise<{
    isWellFramed: boolean;
    brightness: number;
    recommendation: string;
  }> {
    const analysis = await this.analyzeFrame();
    return {
      isWellFramed: analysis.isWellFramed,
      brightness: analysis.brightness,
      recommendation: analysis.recommendations[0] || ''
    };
  }
  
  private calculateBrightness(imageData: ImageData): number {
    let totalBrightness = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      totalBrightness += avg;
    }
    return totalBrightness / (imageData.data.length / 4);
  }
  
  private detectMotion(currentFrame: ImageData): number {
    if (!this.previousFrame) {
      this.previousFrame = currentFrame;
      return 0;
    }
    
    let motionScore = 0;
    const sampleRate = 50; // Sample every 50th pixel for performance
    
    for (let i = 0; i < currentFrame.data.length; i += sampleRate * 4) {
      const diff = Math.abs(currentFrame.data[i] - this.previousFrame.data[i]);
      motionScore += diff;
    }
    
    this.previousFrame = currentFrame;
    return motionScore / (currentFrame.data.length / (sampleRate * 4));
  }
  
  private analyzeFacePosition(imageData: ImageData): { centered: boolean; x: number; y: number } {
    const width = imageData.width;
    const height = imageData.height;
    
    // Detect face by finding the brightest/most active region (simplified face detection)
    let maxBrightness = 0;
    let faceX = width / 2;
    let faceY = height / 2;
    
    const gridSize = 20;
    for (let y = 0; y < height; y += gridSize) {
      for (let x = 0; x < width; x += gridSize) {
        const i = (y * width + x) * 4;
        const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        
        if (brightness > maxBrightness && y > height * 0.2 && y < height * 0.8) {
          maxBrightness = brightness;
          faceX = x;
          faceY = y;
        }
      }
    }
    
    // Check if face is centered (within middle 60% of frame)
    const centerThreshold = 0.2;
    const centered = 
      faceX > width * centerThreshold && 
      faceX < width * (1 - centerThreshold) &&
      faceY > height * centerThreshold && 
      faceY < height * (1 - centerThreshold);
    
    return { centered, x: faceX / width, y: faceY / height };
  }
  
  private estimateEyeContact(imageData: ImageData): number {
    // Analyze upper third of frame (where eyes typically are)
    const width = imageData.width;
    const height = imageData.height;
    const eyeRegionStart = Math.floor(height * 0.25);
    const eyeRegionEnd = Math.floor(height * 0.45);
    
    let eyeRegionBrightness = 0;
    let pixelCount = 0;
    
    for (let y = eyeRegionStart; y < eyeRegionEnd; y++) {
      for (let x = Math.floor(width * 0.3); x < Math.floor(width * 0.7); x++) {
        const i = (y * width + x) * 4;
        eyeRegionBrightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        pixelCount++;
      }
    }
    
    const avgEyeBrightness = eyeRegionBrightness / pixelCount;
    
    // Estimate eye contact: higher brightness in eye region = looking at camera
    // This is a very simplified heuristic
    return Math.min(100, (avgEyeBrightness / 255) * 120);
  }
  
  private analyzePosture(imageData: ImageData): 'good' | 'slouching' | 'too_close' | 'too_far' {
    const width = imageData.width;
    const height = imageData.height;
    
    // Detect face size by counting bright pixels in center region
    let brightPixelCount = 0;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    for (let y = Math.floor(centerY - radius); y < Math.floor(centerY + radius); y++) {
      for (let x = Math.floor(centerX - radius); x < Math.floor(centerX + radius); x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          if (brightness > 100) brightPixelCount++;
        }
      }
    }
    
    const faceAreaRatio = brightPixelCount / (Math.PI * radius * radius);
    
    if (faceAreaRatio > 0.7) return 'too_close';
    if (faceAreaRatio < 0.2) return 'too_far';
    if (faceAreaRatio < 0.35) return 'slouching';
    return 'good';
  }
  
  private detectExpression(imageData: ImageData): 'neutral' | 'smiling' | 'serious' | 'concerned' {
    const width = imageData.width;
    const height = imageData.height;
    
    // Analyze lower face region (mouth area) brightness patterns
    const mouthRegionY = Math.floor(height * 0.6);
    const mouthRegionHeight = Math.floor(height * 0.15);
    
    let mouthBrightness = 0;
    let pixelCount = 0;
    
    for (let y = mouthRegionY; y < mouthRegionY + mouthRegionHeight; y++) {
      for (let x = Math.floor(width * 0.35); x < Math.floor(width * 0.65); x++) {
        const i = (y * width + x) * 4;
        mouthBrightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        pixelCount++;
      }
    }
    
    const avgMouthBrightness = mouthBrightness / pixelCount;
    
    // Very basic expression detection based on brightness patterns
    if (avgMouthBrightness > 140) return 'smiling';
    if (avgMouthBrightness < 80) return 'serious';
    if (avgMouthBrightness < 100) return 'concerned';
    return 'neutral';
  }
  
  private generateRecommendations(
    brightness: number, 
    motion: number, 
    facePosition: { centered: boolean; x: number; y: number },
    posture: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (brightness < 80) {
      recommendations.push('Increase lighting - your face is too dark');
    } else if (brightness > 200) {
      recommendations.push('Reduce lighting or move away from bright background');
    }
    
    if (!facePosition.centered) {
      if (facePosition.x < 0.3) recommendations.push('Move to the right to center yourself');
      if (facePosition.x > 0.7) recommendations.push('Move to the left to center yourself');
      if (facePosition.y < 0.3) recommendations.push('Move down slightly');
      if (facePosition.y > 0.7) recommendations.push('Move up slightly or adjust camera');
    }
    
    if (posture === 'too_close') {
      recommendations.push('Move back from the camera');
    } else if (posture === 'too_far') {
      recommendations.push('Move closer to the camera');
    } else if (posture === 'slouching') {
      recommendations.push('Sit up straight - improve your posture');
    }
    
    const avgMotion = this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length;
    if (avgMotion > 35) {
      recommendations.push('Try to minimize excessive movement and stay steady');
    }
    
    return recommendations.length > 0 ? recommendations : ['Great setup! You\'re well-positioned'];
  }
}

// Enhanced audio analysis with speech pattern detection
export class SimpleAudioAnalysis {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeHistory: number[] = [];
  private speechPauses: number[] = [];
  private lastSpeechTime: number = 0;
  private maxHistoryLength = 100;
  
  constructor() {
    // Constructor without stream - will start manually
  }
  
  async start(stream?: MediaStream) {
    if (stream) {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      source.connect(this.analyser);
      this.analyser.fftSize = 256;
    }
  }
  
  getVolumeLevel(): number {
    if (!this.analyser) return 0;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalized = average / 255;
    
    // Track volume history
    this.volumeHistory.push(normalized);
    if (this.volumeHistory.length > this.maxHistoryLength) {
      this.volumeHistory.shift();
    }
    
    // Track speech pauses
    const now = Date.now();
    if (normalized > 0.15) {
      if (this.lastSpeechTime > 0 && now - this.lastSpeechTime > 1000) {
        this.speechPauses.push(now - this.lastSpeechTime);
        if (this.speechPauses.length > 20) this.speechPauses.shift();
      }
      this.lastSpeechTime = now;
    }
    
    return normalized;
  }
  
  isSpeaking(): boolean {
    return this.getVolumeLevel() > 0.15;
  }
  
  getAnalysis() {
    const avgVolume = this.volumeHistory.length > 0
      ? this.volumeHistory.reduce((a, b) => a + b) / this.volumeHistory.length
      : 0;
    
    const avgPause = this.speechPauses.length > 0
      ? this.speechPauses.reduce((a, b) => a + b) / this.speechPauses.length
      : 0;
    
    return {
      avgVolume,
      peakVolume: Math.max(...this.volumeHistory, 0),
      volumeConsistency: this.calculateConsistency(),
      speechClarity: avgVolume > 0.3 && avgVolume < 0.8 ? 'good' : avgVolume < 0.3 ? 'too_quiet' : 'too_loud',
      avgPauseDuration: avgPause,
      speakingPace: avgPause < 1500 ? 'fast' : avgPause > 3000 ? 'slow' : 'moderate'
    };
  }
  
  private calculateConsistency(): number {
    if (this.volumeHistory.length < 2) return 0;
    
    const avg = this.volumeHistory.reduce((a, b) => a + b) / this.volumeHistory.length;
    const variance = this.volumeHistory.reduce((sum, val) => {
      return sum + Math.pow(val - avg, 2);
    }, 0) / this.volumeHistory.length;
    
    return Math.max(0, 1 - variance);
  }
  
  stop() {
    // Cleanup but preserve analysis data
  }
  
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
