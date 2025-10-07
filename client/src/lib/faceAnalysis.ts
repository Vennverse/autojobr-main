
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

// For audio analysis
export class SimpleAudioAnalysis {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  
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
    return Math.round(average);
  }
  
  isSpeaking(): boolean {
    return this.getVolumeLevel() > 30;
  }
  
  cleanup() {
    this.audioContext.close();
  }
}
