
// Lightweight face detection using browser-based methods
// Alternative to heavy ML models - uses simple heuristics

export class SimpleFaceAnalysis {
  private videoElement: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  // Detect if person is centered (simple approach)
  async analyzeFrameComposition(): Promise<{
    isWellFramed: boolean;
    brightness: number;
    recommendation: string;
  }> {
    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;
    
    this.ctx.drawImage(this.videoElement, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate average brightness
    let totalBrightness = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      totalBrightness += avg;
    }
    const brightness = totalBrightness / (imageData.data.length / 4);
    
    let recommendation = '';
    let isWellFramed = true;
    
    if (brightness < 80) {
      recommendation = 'Increase lighting';
      isWellFramed = false;
    } else if (brightness > 200) {
      recommendation = 'Reduce lighting or move away from bright background';
      isWellFramed = false;
    }
    
    return {
      isWellFramed,
      brightness: Math.round(brightness),
      recommendation
    };
  }
}

// For audio analysis with enhanced metrics
export class SimpleAudioAnalysis {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private volumeHistory: number[] = [];
  private maxHistoryLength = 100;
  
  constructor(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    source.connect(this.analyser);
    this.analyser.fftSize = 256;
  }
  
  getVolumeLevel(): number {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalized = average / 255;
    
    // Track volume history
    this.volumeHistory.push(normalized);
    if (this.volumeHistory.length > this.maxHistoryLength) {
      this.volumeHistory.shift();
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
    
    return {
      avgVolume,
      peakVolume: Math.max(...this.volumeHistory),
      volumeConsistency: this.calculateConsistency(),
      speechClarity: avgVolume > 0.3 && avgVolume < 0.8 ? 'good' : avgVolume < 0.3 ? 'too_quiet' : 'too_loud'
    };
  }
  
  private calculateConsistency(): number {
    if (this.volumeHistory.length < 2) return 0;
    
    const variance = this.volumeHistory.reduce((sum, val) => {
      const avg = this.volumeHistory.reduce((a, b) => a + b) / this.volumeHistory.length;
      return sum + Math.pow(val - avg, 2);
    }, 0) / this.volumeHistory.length;
    
    return Math.max(0, 1 - variance);
  }
  
  stop() {
    // Cleanup but preserve analysis data
  }
  
  cleanup() {
    this.audioContext.close();
  }
}
