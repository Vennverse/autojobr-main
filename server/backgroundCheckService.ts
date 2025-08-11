import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '@shared/schema';
import crypto from 'crypto';

// Background Check Provider Interfaces
export interface BackgroundCheckProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  isConfigured: boolean;
  supportedChecks: string[];
  pricing: {
    basic: number;
    standard: number;
    comprehensive: number;
  };
}

export interface BackgroundCheck {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  provider: "accurate" | "goodhire" | "certn" | "checkr";
  checkType: "basic" | "standard" | "comprehensive" | "custom";
  requestedAt: string;
  completedAt?: string;
  results?: {
    criminalHistory: {
      status: "clear" | "records_found" | "pending";
      details?: string[];
    };
    employmentVerification: {
      status: "verified" | "discrepancy" | "pending";
      details?: string[];
    };
    educationVerification: {
      status: "verified" | "discrepancy" | "pending";
      details?: string[];
    };
    creditCheck?: {
      status: "good" | "fair" | "poor" | "pending";
      score?: number;
    };
    drugTest?: {
      status: "negative" | "positive" | "pending";
      details?: string;
    };
    professionalLicenses?: {
      status: "verified" | "invalid" | "pending";
      licenses?: Array<{
        type: string;
        number: string;
        status: string;
        expirationDate: string;
      }>;
    };
  };
  cost: number;
  turnaroundTime: number;
  complianceFlags: string[];
  notes?: string;
}

export class BackgroundCheckService {
  private providers: Map<string, BackgroundCheckProvider> = new Map();
  private checks: Map<string, BackgroundCheck> = new Map();

  constructor() {
    this.initializeProviders();
  }

  // Initialize background check providers
  private initializeProviders(): void {
    const providers: BackgroundCheckProvider[] = [
      {
        id: "accurate",
        name: "Accurate Background",
        apiUrl: "https://api.accuratebackground.com/v3",
        apiKey: process.env.ACCURATE_API_KEY || "",
        isConfigured: !!process.env.ACCURATE_API_KEY,
        supportedChecks: ["criminal", "employment", "education", "credit", "drug", "licenses"],
        pricing: { basic: 25, standard: 45, comprehensive: 85 }
      },
      {
        id: "goodhire",
        name: "GoodHire",
        apiUrl: "https://api.goodhire.com/v1",
        apiKey: process.env.GOODHIRE_API_KEY || "",
        isConfigured: !!process.env.GOODHIRE_API_KEY,
        supportedChecks: ["criminal", "employment", "education", "drug", "driving"],
        pricing: { basic: 29, standard: 49, comprehensive: 79 }
      },
      {
        id: "certn",
        name: "Certn",
        apiUrl: "https://api.certn.co/hr/v1",
        apiKey: process.env.CERTN_API_KEY || "",
        isConfigured: !!process.env.CERTN_API_KEY,
        supportedChecks: ["criminal", "employment", "education", "credit", "identity"],
        pricing: { basic: 30, standard: 50, comprehensive: 90 }
      },
      {
        id: "checkr",
        name: "Checkr",
        apiUrl: "https://api.checkr.com/v1",
        apiKey: process.env.CHECKR_API_KEY || "",
        isConfigured: !!process.env.CHECKR_API_KEY,
        supportedChecks: ["criminal", "employment", "education", "driving", "drug", "credit"],
        pricing: { basic: 35, standard: 55, comprehensive: 95 }
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });

    // Set at least one provider as configured for demo
    if (!providers.some(p => p.isConfigured)) {
      const checkrProvider = this.providers.get("checkr");
      if (checkrProvider) {
        checkrProvider.isConfigured = true;
        checkrProvider.apiKey = "demo_api_key";
      }
    }
  }

  // Get all background check providers
  async getProviders(): Promise<BackgroundCheckProvider[]> {
    return Array.from(this.providers.values());
  }

  // Get configured providers only
  async getConfiguredProviders(): Promise<BackgroundCheckProvider[]> {
    return Array.from(this.providers.values()).filter(p => p.isConfigured);
  }

  // Configure a background check provider
  async configureProvider(providerId: string, configuration: { apiKey: string; webhook?: string }): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    provider.apiKey = configuration.apiKey;
    provider.isConfigured = true;

    // In a real implementation, test the API key and save to database
    console.log(`Configured ${provider.name} with API key`);
  }

  // Start a background check
  async startBackgroundCheck(checkData: {
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    provider: string;
    checkType: string;
    customChecks?: string[];
  }): Promise<BackgroundCheck> {
    const provider = this.providers.get(checkData.provider);
    if (!provider || !provider.isConfigured) {
      throw new Error('Provider not configured');
    }

    const checkId = crypto.randomUUID();
    const pricing = provider.pricing;
    const cost = pricing[checkData.checkType as keyof typeof pricing] || pricing.standard;

    const backgroundCheck: BackgroundCheck = {
      id: checkId,
      candidateId: checkData.candidateId,
      candidateName: checkData.candidateName,
      candidateEmail: checkData.candidateEmail,
      jobTitle: checkData.jobTitle,
      status: "pending",
      provider: checkData.provider as any,
      checkType: checkData.checkType as any,
      requestedAt: new Date().toISOString(),
      cost,
      turnaroundTime: this.calculateTurnaroundTime(checkData.checkType),
      complianceFlags: [],
    };

    this.checks.set(checkId, backgroundCheck);

    // Simulate API call to background check provider
    this.simulateBackgroundCheck(checkId);

    return backgroundCheck;
  }

  // Get all background checks
  async getBackgroundChecks(): Promise<BackgroundCheck[]> {
    return Array.from(this.checks.values()).sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  // Get background check by ID
  async getBackgroundCheck(checkId: string): Promise<BackgroundCheck | null> {
    return this.checks.get(checkId) || null;
  }

  // Cancel background check
  async cancelBackgroundCheck(checkId: string): Promise<void> {
    const check = this.checks.get(checkId);
    if (!check) {
      throw new Error('Background check not found');
    }

    if (!["pending", "in_progress"].includes(check.status)) {
      throw new Error('Cannot cancel completed background check');
    }

    check.status = "cancelled";
    
    // In a real implementation, call provider API to cancel
    console.log(`Cancelled background check ${checkId}`);
  }

  // Export background check results
  async exportResults(checkId: string): Promise<Buffer> {
    const check = this.checks.get(checkId);
    if (!check || check.status !== "completed") {
      throw new Error('Background check not completed');
    }

    // Generate PDF report (simplified)
    const reportContent = this.generateTextReport(check);
    return Buffer.from(reportContent, 'utf-8');
  }

  // Get candidates eligible for background checks
  async getEligibleCandidates(): Promise<any[]> {
    try {
      // Get applications that are in offer or hired stage
      const applications = await db.select({
        id: schema.jobPostingApplications.id,
        applicantId: schema.jobPostingApplications.applicantId,
        jobPostingId: schema.jobPostingApplications.jobPostingId,
        status: schema.jobPostingApplications.status,
      })
      .from(schema.jobPostingApplications)
      .where(
        and(
          eq(schema.jobPostingApplications.status, 'offer_extended'),
          // or eq(schema.jobPostingApplications.status, 'hired')
        )
      );

      // Get user details for these applications
      const candidates = [];
      for (const app of applications) {
        try {
          const user = await db.select()
            .from(schema.users)
            .where(eq(schema.users.id, app.applicantId))
            .limit(1);

          if (user.length > 0) {
            const userData = user[0];
            candidates.push({
              id: userData.id,
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email,
              email: userData.email,
              jobTitle: 'Position', // Would get from job posting
              applicationId: app.id,
              status: app.status
            });
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }

      return candidates;
    } catch (error) {
      console.error('Error fetching eligible candidates:', error);
      return [];
    }
  }

  // Calculate turnaround time based on check type
  private calculateTurnaroundTime(checkType: string): number {
    switch (checkType) {
      case "basic":
        return 24; // 24 hours
      case "standard":
        return 48; // 48 hours
      case "comprehensive":
        return 72; // 72 hours
      default:
        return 48;
    }
  }

  // Simulate background check process
  private async simulateBackgroundCheck(checkId: string): Promise<void> {
    const check = this.checks.get(checkId);
    if (!check) return;

    // Simulate initial processing
    setTimeout(() => {
      check.status = "in_progress";
    }, 2000);

    // Simulate completion
    setTimeout(() => {
      check.status = "completed";
      check.completedAt = new Date().toISOString();
      check.results = this.generateMockResults(check.checkType);
      
      // Add compliance flags if necessary
      if (check.results.criminalHistory.status === "records_found") {
        check.complianceFlags.push("Criminal records found - manual review required");
      }
      
    }, 10000); // Complete after 10 seconds for demo
  }

  // Generate mock background check results
  private generateMockResults(checkType: string): BackgroundCheck['results'] {
    const base = {
      criminalHistory: {
        status: Math.random() > 0.1 ? "clear" : "records_found" as const,
        details: Math.random() > 0.1 ? [] : ["Minor traffic violation from 2019"]
      },
      employmentVerification: {
        status: Math.random() > 0.05 ? "verified" : "discrepancy" as const,
        details: Math.random() > 0.05 ? ["Employment at TechCorp verified"] : ["Unable to verify employment at StartupXYZ"]
      },
      educationVerification: {
        status: Math.random() > 0.05 ? "verified" : "discrepancy" as const,
        details: Math.random() > 0.05 ? ["Bachelor's degree verified"] : ["Degree verification pending"]
      }
    };

    if (checkType === "comprehensive") {
      return {
        ...base,
        creditCheck: {
          status: ["good", "fair", "poor"][Math.floor(Math.random() * 3)] as const,
          score: 650 + Math.floor(Math.random() * 200)
        },
        drugTest: {
          status: Math.random() > 0.02 ? "negative" : "positive" as const,
          details: Math.random() > 0.02 ? "All substances negative" : "Positive for THC"
        },
        professionalLicenses: {
          status: "verified" as const,
          licenses: [
            {
              type: "Professional Engineer",
              number: "PE-123456",
              status: "Active",
              expirationDate: "2025-12-31"
            }
          ]
        }
      };
    }

    return base;
  }

  // Generate text report for export
  private generateTextReport(check: BackgroundCheck): string {
    return `
BACKGROUND CHECK REPORT
======================

Candidate: ${check.candidateName}
Email: ${check.candidateEmail}
Position: ${check.jobTitle}
Check ID: ${check.id}
Provider: ${check.provider.toUpperCase()}
Type: ${check.checkType.toUpperCase()}
Status: ${check.status.toUpperCase()}
Requested: ${new Date(check.requestedAt).toLocaleString()}
Completed: ${check.completedAt ? new Date(check.completedAt).toLocaleString() : 'N/A'}
Cost: $${check.cost}

RESULTS
=======

Criminal History: ${check.results?.criminalHistory.status.toUpperCase()}
${check.results?.criminalHistory.details?.map(d => `- ${d}`).join('\n') || ''}

Employment Verification: ${check.results?.employmentVerification.status.toUpperCase()}
${check.results?.employmentVerification.details?.map(d => `- ${d}`).join('\n') || ''}

Education Verification: ${check.results?.educationVerification.status.toUpperCase()}
${check.results?.educationVerification.details?.map(d => `- ${d}`).join('\n') || ''}

${check.results?.creditCheck ? `Credit Check: ${check.results.creditCheck.status.toUpperCase()} (Score: ${check.results.creditCheck.score})` : ''}

${check.results?.drugTest ? `Drug Test: ${check.results.drugTest.status.toUpperCase()}` : ''}

${check.complianceFlags.length > 0 ? `
COMPLIANCE NOTES
================
${check.complianceFlags.map(flag => `- ${flag}`).join('\n')}
` : ''}

Generated on: ${new Date().toLocaleString()}
    `.trim();
  }

  // Get background check analytics
  async getAnalytics(): Promise<any> {
    const checks = Array.from(this.checks.values());
    const completed = checks.filter(c => c.status === "completed");
    const inProgress = checks.filter(c => ["pending", "in_progress"].includes(c.status));

    return {
      totalChecks: checks.length,
      completedChecks: completed.length,
      inProgressChecks: inProgress.length,
      successRate: checks.length > 0 ? Math.round((completed.length / checks.length) * 100) : 0,
      averageTurnaroundTime: completed.length > 0 
        ? Math.round(completed.reduce((sum, check) => {
            const requested = new Date(check.requestedAt).getTime();
            const completed = new Date(check.completedAt!).getTime();
            return sum + (completed - requested) / (1000 * 60 * 60); // hours
          }, 0) / completed.length)
        : 0,
      providerUsage: this.getProviderUsageStats(checks),
      complianceFlags: checks.reduce((total, check) => total + check.complianceFlags.length, 0)
    };
  }

  // Get provider usage statistics
  private getProviderUsageStats(checks: BackgroundCheck[]): any[] {
    const usage = new Map<string, number>();
    
    checks.forEach(check => {
      const count = usage.get(check.provider) || 0;
      usage.set(check.provider, count + 1);
    });

    return Array.from(usage.entries()).map(([provider, count]) => ({
      provider,
      count,
      percentage: checks.length > 0 ? Math.round((count / checks.length) * 100) : 0
    }));
  }
}

// Export singleton instance
export const backgroundCheckService = new BackgroundCheckService();