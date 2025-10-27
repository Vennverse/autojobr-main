interface TypingPattern {
  keystrokes: KeystrokeEvent[];
  averageInterval: number;
  variance: number;
  burstPatterns: number[];
  pausePatterns: number[];
  rhythm: 'human' | 'bot' | 'suspicious';
  confidence: number;
}

interface KeystrokeEvent {
  key: string;
  timestamp: number;
  duration: number;
  interval: number;
}

interface MousePattern {
  movements: MouseMovement[];
  clicks: ClickEvent[];
  scrolls: ScrollEvent[];
  trajectory: 'natural' | 'linear' | 'suspicious';
  velocity: number[];
  acceleration: number[];
  jitter: number;
  confidence: number;
}

interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
  velocity: number;
  acceleration: number;
}

interface ClickEvent {
  x: number;
  y: number;
  timestamp: number;
  button: number;
  element: string;
}

interface ScrollEvent {
  deltaX: number;
  deltaY: number;
  timestamp: number;
}

interface ResponseTiming {
  questionIndex: number;
  timeToFirstKeystroke: number;
  totalResponseTime: number;
  thinkingTime: number;
  typingTime: number;
  revisionsCount: number;
  pausesCount: number;
  averagePauseLength: number;
  responsePattern: 'natural' | 'instant' | 'delayed' | 'suspicious';
}

interface NavigationPattern {
  pageViews: PageView[];
  focusEvents: FocusEvent[];
  scrollBehavior: ScrollBehavior[];
  interactionSequence: InteractionEvent[];
  suspiciousNavigation: boolean;
  attentionScore: number;
}

interface PageView {
  url: string;
  timestamp: number;
  duration: number;
  scrollDepth: number;
}

interface FocusEvent {
  type: 'focus' | 'blur';
  timestamp: number;
  target: string;
  duration?: number;
}

interface ScrollBehavior {
  speed: number;
  direction: 'up' | 'down';
  pattern: 'smooth' | 'jumpy' | 'robotic';
  timestamp: number;
}

interface InteractionEvent {
  type: 'click' | 'keypress' | 'scroll' | 'focus' | 'selection';
  timestamp: number;
  details: any;
}

interface BehavioralProfile {
  userId: string;
  sessionId: string;
  typingPattern: TypingPattern;
  mousePattern: MousePattern;
  responseTiming: ResponseTiming[];
  navigationPattern: NavigationPattern;
  overallAuthenticity: number;
  suspiciousIndicators: string[];
  riskAssessment: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export class BehavioralAnalyzer {
  private humanTypingBenchmarks = {
    averageInterval: { min: 80, max: 250 }, // ms between keystrokes
    variance: { min: 20, max: 100 }, // variation in timing
    burstLength: { min: 3, max: 8 }, // characters in rapid succession
    pauseLength: { min: 500, max: 3000 } // thinking pauses
  };

  private humanMouseBenchmarks = {
    velocity: { min: 50, max: 1500 }, // pixels per second
    acceleration: { min: -500, max: 500 }, // pixels per second squared
    jitter: { min: 2, max: 15 }, // natural hand tremor
    trajectoryDeviation: { min: 0.1, max: 0.4 } // deviation from straight line
  };

  // Analyze typing patterns for authenticity
  analyzeTypingPattern(keystrokes: KeystrokeEvent[]): TypingPattern {
    if (keystrokes.length < 10) {
      return {
        keystrokes,
        averageInterval: 0,
        variance: 0,
        burstPatterns: [],
        pausePatterns: [],
        rhythm: 'suspicious',
        confidence: 0
      };
    }

    const intervals = this.calculateIntervals(keystrokes);
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = this.calculateVariance(intervals, averageInterval);
    const burstPatterns = this.detectBurstPatterns(keystrokes);
    const pausePatterns = this.detectPausePatterns(keystrokes);

    // Determine if typing pattern is human-like
    const isHumanInterval = averageInterval >= this.humanTypingBenchmarks.averageInterval.min && 
                           averageInterval <= this.humanTypingBenchmarks.averageInterval.max;
    
    const isHumanVariance = variance >= this.humanTypingBenchmarks.variance.min &&
                           variance <= this.humanTypingBenchmarks.variance.max;

    const hasNaturalPauses = pausePatterns.some(pause => 
      pause >= this.humanTypingBenchmarks.pauseLength.min &&
      pause <= this.humanTypingBenchmarks.pauseLength.max
    );

    let rhythm: 'human' | 'bot' | 'suspicious';
    let confidence: number;

    if (isHumanInterval && isHumanVariance && hasNaturalPauses) {
      rhythm = 'human';
      confidence = 0.9;
    } else if (variance < 10 || averageInterval < 30) {
      rhythm = 'bot';
      confidence = 0.8;
    } else {
      rhythm = 'suspicious';
      confidence = 0.6;
    }

    return {
      keystrokes,
      averageInterval,
      variance,
      burstPatterns,
      pausePatterns,
      rhythm,
      confidence
    };
  }

  // Analyze mouse movement patterns
  analyzeMousePattern(movements: MouseMovement[], clicks: ClickEvent[], scrolls: ScrollEvent[]): MousePattern {
    if (movements.length < 5) {
      return {
        movements,
        clicks,
        scrolls,
        trajectory: 'suspicious',
        velocity: [],
        acceleration: [],
        jitter: 0,
        confidence: 0
      };
    }

    const velocity = this.calculateVelocity(movements);
    const acceleration = this.calculateAcceleration(velocity);
    const jitter = this.calculateJitter(movements);
    const trajectory = this.analyzeTrajectory(movements);

    // Determine if mouse pattern is human-like
    const avgVelocity = velocity.reduce((a, b) => a + b, 0) / velocity.length;
    const isHumanVelocity = avgVelocity >= this.humanMouseBenchmarks.velocity.min &&
                           avgVelocity <= this.humanMouseBenchmarks.velocity.max;

    const isHumanJitter = jitter >= this.humanMouseBenchmarks.jitter.min &&
                         jitter <= this.humanMouseBenchmarks.jitter.max;

    let trajectoryType: 'natural' | 'linear' | 'suspicious';
    let confidence: number;

    if (isHumanVelocity && isHumanJitter && trajectory.deviation > 0.1) {
      trajectoryType = 'natural';
      confidence = 0.85;
    } else if (trajectory.deviation < 0.05 || jitter < 1) {
      trajectoryType = 'linear';
      confidence = 0.9;
    } else {
      trajectoryType = 'suspicious';
      confidence = 0.7;
    }

    return {
      movements,
      clicks,
      scrolls,
      trajectory: trajectoryType,
      velocity,
      acceleration,
      jitter,
      confidence
    };
  }

  // Analyze response timing patterns
  analyzeResponseTiming(responses: any[]): ResponseTiming[] {
    return responses.map((response, index) => {
      const timeToFirstKeystroke = response.firstKeystroke - response.questionStartTime;
      const totalResponseTime = response.submitTime - response.questionStartTime;
      const typingTime = this.calculateTypingTime(response.keystrokes || []);
      const thinkingTime = totalResponseTime - typingTime;
      
      const revisionsCount = this.countRevisions(response.keystrokes || []);
      const pausesCount = this.countPauses(response.keystrokes || []);
      const averagePauseLength = this.calculateAveragePauseLength(response.keystrokes || []);

      let responsePattern: 'natural' | 'instant' | 'delayed' | 'suspicious';
      
      if (timeToFirstKeystroke < 500) {
        responsePattern = 'instant';
      } else if (timeToFirstKeystroke > 30000) {
        responsePattern = 'delayed';
      } else if (thinkingTime > typingTime * 2 && pausesCount > 2) {
        responsePattern = 'natural';
      } else {
        responsePattern = 'suspicious';
      }

      return {
        questionIndex: index,
        timeToFirstKeystroke,
        totalResponseTime,
        thinkingTime,
        typingTime,
        revisionsCount,
        pausesCount,
        averagePauseLength,
        responsePattern
      };
    });
  }

  // Analyze navigation patterns
  analyzeNavigationPattern(sessionData: any): NavigationPattern {
    const pageViews: PageView[] = sessionData.pageViews || [];
    const focusEvents: FocusEvent[] = sessionData.focusEvents || [];
    const scrollBehavior: ScrollBehavior[] = this.analyzeScrollBehavior(sessionData.scrollEvents || []);
    const interactionSequence: InteractionEvent[] = sessionData.interactions || [];

    // Detect suspicious navigation patterns
    const suspiciousNavigation = this.detectSuspiciousNavigation(pageViews, focusEvents);
    
    // Calculate attention score based on focus duration and interaction quality
    const attentionScore = this.calculateAttentionScore(focusEvents, interactionSequence);

    return {
      pageViews,
      focusEvents,
      scrollBehavior,
      interactionSequence,
      suspiciousNavigation,
      attentionScore
    };
  }

  // Generate comprehensive behavioral profile
  generateBehavioralProfile(sessionData: any): BehavioralProfile {
    const typingPattern = this.analyzeTypingPattern(sessionData.keystrokes || []);
    const mousePattern = this.analyzeMousePattern(
      sessionData.mouseMovements || [],
      sessionData.mouseClicks || [],
      sessionData.scrollEvents || []
    );
    const responseTiming = this.analyzeResponseTiming(sessionData.responses || []);
    const navigationPattern = this.analyzeNavigationPattern(sessionData);

    // Calculate overall authenticity score
    const authenticityScores = [
      typingPattern.confidence * 100,
      mousePattern.confidence * 100,
      navigationPattern.attentionScore,
      this.assessResponseTimingAuthenticity(responseTiming)
    ];

    const overallAuthenticity = authenticityScores.reduce((a, b) => a + b, 0) / authenticityScores.length;

    // Identify suspicious indicators
    const suspiciousIndicators: string[] = [];
    
    if (typingPattern.rhythm === 'bot') suspiciousIndicators.push('Robotic typing pattern');
    if (mousePattern.trajectory === 'linear') suspiciousIndicators.push('Non-human mouse movement');
    if (navigationPattern.suspiciousNavigation) suspiciousIndicators.push('Suspicious navigation pattern');
    if (responseTiming.some(rt => rt.responsePattern === 'instant')) suspiciousIndicators.push('Instant responses detected');

    // Determine risk assessment
    let riskAssessment: 'low' | 'medium' | 'high' | 'critical';
    if (overallAuthenticity > 80 && suspiciousIndicators.length === 0) {
      riskAssessment = 'low';
    } else if (overallAuthenticity > 60 && suspiciousIndicators.length < 2) {
      riskAssessment = 'medium';
    } else if (overallAuthenticity > 40 || suspiciousIndicators.length < 4) {
      riskAssessment = 'high';
    } else {
      riskAssessment = 'critical';
    }

    // Generate recommendation
    const recommendation = this.generateRecommendation(riskAssessment, suspiciousIndicators);

    return {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId,
      typingPattern,
      mousePattern,
      responseTiming,
      navigationPattern,
      overallAuthenticity,
      suspiciousIndicators,
      riskAssessment,
      recommendation
    };
  }

  // Helper methods
  private calculateIntervals(keystrokes: KeystrokeEvent[]): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].timestamp - keystrokes[i-1].timestamp);
    }
    return intervals;
  }

  private calculateVariance(intervals: number[], average: number): number {
    const squaredDiffs = intervals.map(interval => Math.pow(interval - average, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / intervals.length;
  }

  private detectBurstPatterns(keystrokes: KeystrokeEvent[]): number[] {
    const bursts: number[] = [];
    let currentBurst = 0;
    
    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
      if (interval < 100) { // Fast typing
        currentBurst++;
      } else {
        if (currentBurst > 0) {
          bursts.push(currentBurst);
          currentBurst = 0;
        }
      }
    }
    
    return bursts;
  }

  private detectPausePatterns(keystrokes: KeystrokeEvent[]): number[] {
    const pauses: number[] = [];
    
    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
      if (interval > 500) { // Pause
        pauses.push(interval);
      }
    }
    
    return pauses;
  }

  private calculateVelocity(movements: MouseMovement[]): number[] {
    const velocities: number[] = [];
    
    for (let i = 1; i < movements.length; i++) {
      const dx = movements[i].x - movements[i-1].x;
      const dy = movements[i].y - movements[i-1].y;
      const dt = movements[i].timestamp - movements[i-1].timestamp;
      const distance = Math.sqrt(dx*dx + dy*dy);
      const velocity = dt > 0 ? distance / dt * 1000 : 0; // pixels per second
      velocities.push(velocity);
    }
    
    return velocities;
  }

  private calculateAcceleration(velocities: number[]): number[] {
    const accelerations: number[] = [];
    
    for (let i = 1; i < velocities.length; i++) {
      const acceleration = velocities[i] - velocities[i-1];
      accelerations.push(acceleration);
    }
    
    return accelerations;
  }

  private calculateJitter(movements: MouseMovement[]): number {
    if (movements.length < 3) return 0;
    
    let totalJitter = 0;
    
    for (let i = 1; i < movements.length - 1; i++) {
      const angle1 = Math.atan2(movements[i].y - movements[i-1].y, movements[i].x - movements[i-1].x);
      const angle2 = Math.atan2(movements[i+1].y - movements[i].y, movements[i+1].x - movements[i].x);
      const angleChange = Math.abs(angle2 - angle1);
      totalJitter += Math.min(angleChange, 2 * Math.PI - angleChange);
    }
    
    return totalJitter / (movements.length - 2);
  }

  private analyzeTrajectory(movements: MouseMovement[]): { deviation: number; smoothness: number } {
    if (movements.length < 3) return { deviation: 0, smoothness: 0 };
    
    let totalDeviation = 0;
    let smoothness = 0;
    
    // Calculate deviation from expected path
    for (let i = 1; i < movements.length - 1; i++) {
      const expectedX = movements[i-1].x + (movements[i+1].x - movements[i-1].x) / 2;
      const expectedY = movements[i-1].y + (movements[i+1].y - movements[i-1].y) / 2;
      const deviation = Math.sqrt(Math.pow(movements[i].x - expectedX, 2) + Math.pow(movements[i].y - expectedY, 2));
      totalDeviation += deviation;
    }
    
    const avgDeviation = totalDeviation / (movements.length - 2);
    
    return {
      deviation: avgDeviation / 100, // Normalized
      smoothness: 1 - Math.min(avgDeviation / 50, 1) // Inverse relationship
    };
  }

  private calculateTypingTime(keystrokes: KeystrokeEvent[]): number {
    if (keystrokes.length < 2) return 0;
    return keystrokes[keystrokes.length - 1].timestamp - keystrokes[0].timestamp;
  }

  private countRevisions(keystrokes: KeystrokeEvent[]): number {
    return keystrokes.filter(k => k.key === 'Backspace' || k.key === 'Delete').length;
  }

  private countPauses(keystrokes: KeystrokeEvent[]): number {
    let pauses = 0;
    for (let i = 1; i < keystrokes.length; i++) {
      if (keystrokes[i].timestamp - keystrokes[i-1].timestamp > 1000) {
        pauses++;
      }
    }
    return pauses;
  }

  private calculateAveragePauseLength(keystrokes: KeystrokeEvent[]): number {
    const pauses: number[] = [];
    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
      if (interval > 1000) {
        pauses.push(interval);
      }
    }
    return pauses.length > 0 ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0;
  }

  private analyzeScrollBehavior(scrollEvents: any[]): ScrollBehavior[] {
    return scrollEvents.map(event => {
      const speed = Math.abs(event.deltaY);
      const direction = event.deltaY > 0 ? 'down' : 'up';
      
      let pattern: 'smooth' | 'jumpy' | 'robotic';
      if (speed < 50) {
        pattern = 'smooth';
      } else if (speed > 200) {
        pattern = 'jumpy';
      } else {
        pattern = 'robotic';
      }
      
      return {
        speed,
        direction,
        pattern,
        timestamp: event.timestamp
      };
    });
  }

  private detectSuspiciousNavigation(pageViews: PageView[], focusEvents: FocusEvent[]): boolean {
    // Detect patterns like rapid tab switching, minimal page engagement, etc.
    const shortViews = pageViews.filter(view => view.duration < 2000);
    const rapidFocusChanges = focusEvents.filter((event, index) => {
      if (index === 0) return false;
      return event.timestamp - focusEvents[index - 1].timestamp < 500;
    });
    
    return shortViews.length > pageViews.length * 0.5 || rapidFocusChanges.length > 5;
  }

  private calculateAttentionScore(focusEvents: FocusEvent[], interactions: InteractionEvent[]): number {
    const totalFocusTime = focusEvents
      .filter(event => event.type === 'focus')
      .reduce((total, event) => total + (event.duration || 0), 0);
    
    const totalSessionTime = focusEvents.length > 0 ? 
      focusEvents[focusEvents.length - 1].timestamp - focusEvents[0].timestamp : 0;
    
    const focusRatio = totalSessionTime > 0 ? totalFocusTime / totalSessionTime : 0;
    const interactionDensity = totalSessionTime > 0 ? interactions.length / (totalSessionTime / 60000) : 0;
    
    return Math.min((focusRatio * 70) + (Math.min(interactionDensity, 5) * 6), 100);
  }

  private assessResponseTimingAuthenticity(responseTiming: ResponseTiming[]): number {
    const naturalResponses = responseTiming.filter(rt => rt.responsePattern === 'natural');
    const instantResponses = responseTiming.filter(rt => rt.responsePattern === 'instant');
    
    const naturalRatio = responseTiming.length > 0 ? naturalResponses.length / responseTiming.length : 0;
    const instantPenalty = instantResponses.length * 20;
    
    return Math.max(0, (naturalRatio * 100) - instantPenalty);
  }

  private generateRecommendation(riskAssessment: string, indicators: string[]): string {
    const recommendations = {
      low: "Session appears authentic with natural behavioral patterns. Proceed with confidence.",
      medium: "Some irregular patterns detected. Consider manual review of session data.",
      high: "Multiple suspicious indicators present. Recommend thorough investigation before proceeding.",
      critical: "Highly suspicious behavioral patterns detected. Strong likelihood of automated or assisted responses. Recommend rejection or re-testing under supervised conditions."
    };
    
    let recommendation = recommendations[riskAssessment as keyof typeof recommendations];
    
    if (indicators.length > 0) {
      recommendation += `\n\nSpecific concerns: ${indicators.join(', ')}`;
    }
    
    return recommendation;
  }
}

export const behavioralAnalyzer = new BehavioralAnalyzer();