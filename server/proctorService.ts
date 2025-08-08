import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { users, testSubmissions, mockInterviews } from "@shared/schema";

interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  colorDepth: number;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  cookieEnabled: boolean;
  doNotTrack: string;
  plugins: string[];
  webGL: string;
  canvas: string;
  audioContext: string;
  fonts: string[];
  connectionType?: string;
  platform: string;
  deviceMemory?: number;
  cpuClass?: string;
}

interface EnvironmentValidation {
  isVirtualMachine: boolean;
  hasRemoteDesktop: boolean;
  hasScreenSharing: boolean;
  hasMultipleMonitors: boolean;
  suspiciousProcesses: string[];
  networkLatency: number;
  cpuUsage: number;
  memoryUsage: number;
  activeApplications: string[];
}

interface BrowserSecurity {
  hasAdBlock: boolean;
  hasExtensions: boolean;
  extensionCount: number;
  devToolsOpen: boolean;
  isIncognito: boolean;
  hasVPN: boolean;
  ipAddress: string;
  geolocation: { lat: number; lng: number } | null;
}

interface ViolationEvent {
  type: 'tab_switch' | 'copy_attempt' | 'paste_attempt' | 'right_click' | 
        'dev_tools' | 'fullscreen_exit' | 'suspicious_network' | 
        'multiple_faces' | 'no_face' | 'eye_tracking' | 'audio_detection' |
        'window_blur' | 'mouse_leave' | 'keyboard_shortcut' | 'external_device';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  details: any;
  sessionId: string;
  userId: string;
}

interface ProctoringSummary {
  sessionId: string;
  totalViolations: number;
  riskScore: number; // 0-100, higher = more suspicious
  authenticity: number; // 0-100, higher = more authentic
  violations: ViolationEvent[];
  environmentChanges: number;
  suspiciousPatterns: string[];
  recommendation: 'accept' | 'review' | 'reject';
}

export class ProctorService {
  private violationWeights = {
    tab_switch: 5,
    copy_attempt: 8,
    paste_attempt: 10,
    right_click: 3,
    dev_tools: 15,
    fullscreen_exit: 7,
    suspicious_network: 12,
    multiple_faces: 20,
    no_face: 15,
    eye_tracking: 10,
    audio_detection: 8,
    window_blur: 4,
    mouse_leave: 6,
    keyboard_shortcut: 9,
    external_device: 11
  };

  // Advanced device fingerprinting
  async generateDeviceFingerprint(browserData: any): Promise<DeviceFingerprint> {
    return {
      userAgent: browserData.userAgent || '',
      screenResolution: `${browserData.screen?.width}x${browserData.screen?.height}`,
      timezone: browserData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: browserData.language || 'en-US',
      colorDepth: browserData.colorDepth || 24,
      hardwareConcurrency: browserData.hardwareConcurrency || 4,
      maxTouchPoints: browserData.maxTouchPoints || 0,
      cookieEnabled: browserData.cookieEnabled !== false,
      doNotTrack: browserData.doNotTrack || 'unspecified',
      plugins: browserData.plugins || [],
      webGL: browserData.webGL || '',
      canvas: browserData.canvas || '',
      audioContext: browserData.audioContext || '',
      fonts: browserData.fonts || [],
      connectionType: browserData.connection?.effectiveType,
      platform: browserData.platform || '',
      deviceMemory: browserData.deviceMemory,
      cpuClass: browserData.cpuClass
    };
  }

  // Environment validation for detecting VMs, remote desktop, etc.
  async validateEnvironment(environmentData: any): Promise<EnvironmentValidation> {
    const validation: EnvironmentValidation = {
      isVirtualMachine: this.detectVirtualMachine(environmentData),
      hasRemoteDesktop: this.detectRemoteDesktop(environmentData),
      hasScreenSharing: this.detectScreenSharing(environmentData),
      hasMultipleMonitors: environmentData.screenCount > 1,
      suspiciousProcesses: this.detectSuspiciousProcesses(environmentData.processes || []),
      networkLatency: environmentData.networkLatency || 0,
      cpuUsage: environmentData.cpuUsage || 0,
      memoryUsage: environmentData.memoryUsage || 0,
      activeApplications: environmentData.activeApps || []
    };

    return validation;
  }

  // Browser security analysis
  async analyzeBrowserSecurity(browserData: any): Promise<BrowserSecurity> {
    return {
      hasAdBlock: this.detectAdBlock(browserData),
      hasExtensions: browserData.extensions?.length > 0,
      extensionCount: browserData.extensions?.length || 0,
      devToolsOpen: this.detectDevTools(browserData),
      isIncognito: browserData.isIncognito || false,
      hasVPN: this.detectVPN(browserData),
      ipAddress: browserData.ipAddress || '',
      geolocation: browserData.geolocation || null
    };
  }

  // Record violation with intelligent severity assessment
  async recordViolation(violation: Omit<ViolationEvent, 'timestamp'>): Promise<void> {
    const timestamp = new Date();
    const fullViolation: ViolationEvent = {
      ...violation,
      timestamp
    };

    console.log(`🚨 Violation detected: ${violation.type} (${violation.severity}) for user ${violation.userId}`);

    // Store in database (you can create a violations table)
    // For now, we'll log and potentially trigger actions
    await this.processViolation(fullViolation);
  }

  // Process violation and determine automated responses
  private async processViolation(violation: ViolationEvent): Promise<void> {
    const recentViolations = await this.getRecentViolations(violation.sessionId, 300); // Last 5 minutes
    const riskScore = this.calculateRiskScore(recentViolations);

    // Automated responses based on severity and frequency
    if (riskScore > 80) {
      await this.triggerHighRiskAlert(violation);
    } else if (riskScore > 60) {
      await this.triggerMediumRiskAlert(violation);
    }

    // Pattern detection
    const patterns = this.detectSuspiciousPatterns(recentViolations);
    if (patterns.length > 0) {
      console.log(`🔍 Suspicious patterns detected: ${patterns.join(', ')}`);
    }
  }

  // Advanced pattern detection
  private detectSuspiciousPatterns(violations: ViolationEvent[]): string[] {
    const patterns: string[] = [];
    
    // Pattern 1: Rapid succession violations (bot-like behavior)
    const rapidViolations = violations.filter(v => 
      Date.now() - v.timestamp.getTime() < 10000 // Last 10 seconds
    );
    if (rapidViolations.length > 5) {
      patterns.push('rapid_succession_violations');
    }

    // Pattern 2: Cyclical tab switching (external help pattern)
    const tabSwitches = violations.filter(v => v.type === 'tab_switch');
    if (tabSwitches.length > 3) {
      const intervals = [];
      for (let i = 1; i < tabSwitches.length; i++) {
        intervals.push(tabSwitches[i].timestamp.getTime() - tabSwitches[i-1].timestamp.getTime());
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (intervals.every(interval => Math.abs(interval - avgInterval) < 5000)) {
        patterns.push('cyclical_tab_switching');
      }
    }

    // Pattern 3: Copy-paste sequence (external resource copying)
    const copyPasteSequence = violations.filter(v => 
      v.type === 'copy_attempt' || v.type === 'paste_attempt'
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (let i = 1; i < copyPasteSequence.length; i++) {
      const timeDiff = copyPasteSequence[i].timestamp.getTime() - copyPasteSequence[i-1].timestamp.getTime();
      if (timeDiff < 2000 && copyPasteSequence[i-1].type === 'copy_attempt' && copyPasteSequence[i].type === 'paste_attempt') {
        patterns.push('rapid_copy_paste_sequence');
        break;
      }
    }

    // Pattern 4: Environment manipulation
    const envViolations = violations.filter(v => 
      v.type === 'dev_tools' || v.type === 'fullscreen_exit' || v.type === 'external_device'
    );
    if (envViolations.length > 2) {
      patterns.push('environment_manipulation');
    }

    return patterns;
  }

  // Calculate overall risk score
  private calculateRiskScore(violations: ViolationEvent[]): number {
    let totalScore = 0;
    const frequencyMultiplier = Math.min(violations.length / 10, 2); // Max 2x multiplier

    for (const violation of violations) {
      const baseWeight = this.violationWeights[violation.type] || 5;
      const severityMultiplier = this.getSeverityMultiplier(violation.severity);
      totalScore += baseWeight * severityMultiplier;
    }

    return Math.min(totalScore * frequencyMultiplier, 100);
  }

  private getSeverityMultiplier(severity: string): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 1.5;
      case 'high': return 2;
      case 'critical': return 3;
      default: return 1;
    }
  }

  // Generate comprehensive proctoring summary
  async generateProctoringSummary(sessionId: string): Promise<ProctoringSummary> {
    const violations = await this.getAllSessionViolations(sessionId);
    const riskScore = this.calculateRiskScore(violations);
    const patterns = this.detectSuspiciousPatterns(violations);
    
    // Calculate authenticity score (inverse of risk)
    const authenticity = Math.max(0, 100 - riskScore);
    
    // Determine recommendation
    let recommendation: 'accept' | 'review' | 'reject';
    if (riskScore < 30 && patterns.length === 0) {
      recommendation = 'accept';
    } else if (riskScore < 70) {
      recommendation = 'review';
    } else {
      recommendation = 'reject';
    }

    return {
      sessionId,
      totalViolations: violations.length,
      riskScore,
      authenticity,
      violations,
      environmentChanges: violations.filter(v => 
        v.type === 'fullscreen_exit' || v.type === 'window_blur' || v.type === 'dev_tools'
      ).length,
      suspiciousPatterns: patterns,
      recommendation
    };
  }

  // Helper methods for detection
  private detectVirtualMachine(data: any): boolean {
    const vmIndicators = [
      'VMware', 'VirtualBox', 'QEMU', 'Xen', 'Parallels', 'Hyper-V',
      'Virtual', 'VM', 'vbox', 'vmware'
    ];
    
    const systemInfo = (data.userAgent || '').toLowerCase() + 
                      (data.platform || '').toLowerCase() + 
                      (data.vendor || '').toLowerCase();
    
    return vmIndicators.some(indicator => systemInfo.includes(indicator.toLowerCase()));
  }

  private detectRemoteDesktop(data: any): boolean {
    const rdpIndicators = ['mstsc', 'remote desktop', 'teamviewer', 'anydesk', 'chrome remote desktop'];
    const processes = (data.processes || []).map((p: string) => p.toLowerCase());
    return rdpIndicators.some(indicator => 
      processes.some(process => process.includes(indicator))
    );
  }

  private detectScreenSharing(data: any): boolean {
    const sharingIndicators = ['zoom', 'teams', 'skype', 'discord', 'obs', 'streamlabs'];
    const processes = (data.processes || []).map((p: string) => p.toLowerCase());
    return sharingIndicators.some(indicator => 
      processes.some(process => process.includes(indicator))
    );
  }

  private detectSuspiciousProcesses(processes: string[]): string[] {
    const suspicious = [
      'cheat engine', 'wireshark', 'fiddler', 'burp suite', 'postman',
      'auto clicker', 'macro recorder', 'selenium', 'puppeteer',
      'ide', 'visual studio', 'notepad++', 'sublime', 'atom'
    ];
    
    return processes.filter(process => 
      suspicious.some(sus => process.toLowerCase().includes(sus))
    );
  }

  private detectAdBlock(data: any): boolean {
    return data.adBlockDetected || false;
  }

  private detectDevTools(data: any): boolean {
    return data.devToolsOpen || false;
  }

  private detectVPN(data: any): boolean {
    // This would typically involve IP geolocation checking
    // For now, we'll use basic indicators
    return data.vpnDetected || false;
  }

  // Placeholder methods for violation retrieval (implement with actual database)
  private async getRecentViolations(sessionId: string, seconds: number): Promise<ViolationEvent[]> {
    // Implement database query to get recent violations
    // For now, return empty array
    return [];
  }

  private async getAllSessionViolations(sessionId: string): Promise<ViolationEvent[]> {
    // Implement database query to get all session violations
    return [];
  }

  private async triggerHighRiskAlert(violation: ViolationEvent): Promise<void> {
    console.log(`🚨 HIGH RISK ALERT: User ${violation.userId} in session ${violation.sessionId}`);
    // Implement alert system (email, slack, database flag, etc.)
  }

  private async triggerMediumRiskAlert(violation: ViolationEvent): Promise<void> {
    console.log(`⚠️ MEDIUM RISK ALERT: User ${violation.userId} in session ${violation.sessionId}`);
    // Implement alert system
  }

  // Advanced network monitoring
  async monitorNetworkActivity(networkData: any): Promise<{
    suspiciousRequests: any[];
    externalConnections: any[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const suspiciousRequests = [];
    const externalConnections = [];
    
    // Analyze network requests for suspicious patterns
    if (networkData.requests) {
      for (const request of networkData.requests) {
        if (this.isSuspiciousRequest(request)) {
          suspiciousRequests.push(request);
        }
        if (this.isExternalConnection(request)) {
          externalConnections.push(request);
        }
      }
    }

    const riskLevel = this.assessNetworkRisk(suspiciousRequests, externalConnections);
    
    return {
      suspiciousRequests,
      externalConnections,
      riskLevel
    };
  }

  private isSuspiciousRequest(request: any): boolean {
    const suspiciousDomains = [
      'stackoverflow.com', 'github.com', 'leetcode.com', 'geeksforgeeks.org',
      'chatgpt.com', 'claude.ai', 'bard.google.com'
    ];
    
    return suspiciousDomains.some(domain => 
      request.url && request.url.includes(domain)
    );
  }

  private isExternalConnection(request: any): boolean {
    // Check if request goes to external domains
    const allowedDomains = ['localhost', '127.0.0.1', window.location.hostname];
    return !allowedDomains.some(domain => 
      request.url && request.url.includes(domain)
    );
  }

  private assessNetworkRisk(suspicious: any[], external: any[]): 'low' | 'medium' | 'high' {
    if (suspicious.length > 5 || external.length > 20) return 'high';
    if (suspicious.length > 2 || external.length > 10) return 'medium';
    return 'low';
  }
}

export const proctorService = new ProctorService();