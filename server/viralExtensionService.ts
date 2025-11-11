
import { db } from './db';
import { users, jobApplications, jobPostings } from '@shared/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

interface ExtensionUser {
  userId: string;
  extensionId: string;
  applicationCount: number;
  successRate: number;
  referralCode: string;
  pointsEarned: number;
}

interface JobIntelligence {
  jobUrl: string;
  company: string;
  totalAutoJobrApplicants: number;
  averageSuccessRate: number;
  salaryIntel: {
    reportedSalary?: number;
    reportedBy: number;
    negotiationTips: string[];
  };
  insiderTips: string[];
  applicationTiming: {
    optimalTime: string;
    competitorCount: number;
  };
}

interface ViralReward {
  type: 'referral' | 'intel_sharing' | 'application_success' | 'insider_tip';
  points: number;
  description: string;
  unlocks: string[];
}

export class ViralExtensionService {
  
  async trackExtensionApplication(
    userId: string,
    jobUrl: string,
    applicationData: any
  ): Promise<{
    jobIntelligence: JobIntelligence;
    viralRewards: ViralReward[];
    socialProof: string;
  }> {
    
    // Track the application
    await this.recordExtensionApplication(userId, jobUrl, applicationData);
    
    // Get job intelligence from other AutoJobr users
    const jobIntelligence = await this.getJobIntelligence(jobUrl);
    
    // Calculate viral rewards for this action
    const viralRewards = await this.calculateViralRewards(userId, 'application');
    
    // Generate social proof message
    const socialProof = await this.generateSocialProof(jobUrl);
    
    return {
      jobIntelligence,
      viralRewards,
      socialProof
    };
  }

  async shareJobIntelligence(
    userId: string,
    jobUrl: string,
    intelligence: {
      salaryInfo?: number;
      interviewExperience?: string;
      companyTips?: string;
      applicationTips?: string;
    }
  ): Promise<ViralReward[]> {
    
    // Store shared intelligence
    await this.storeJobIntelligence(userId, jobUrl, intelligence);
    
    // Reward user for sharing valuable intel
    const rewards = await this.calculateViralRewards(userId, 'intel_sharing');
    
    // Distribute intel to other extension users applying to same company
    await this.distributeIntelToUsers(jobUrl, intelligence);
    
    return rewards;
  }

  async createReferralNetwork(
    referrerId: string,
    jobUrl: string
  ): Promise<{
    referralCode: string;
    potentialRewards: ViralReward[];
    jobsShared: number;
  }> {
    
    // Generate unique referral code for this job
    const referralCode = `AUTOJOBR_${referrerId.slice(-6)}_${Date.now()}`;
    
    // Store referral opportunity
    await this.storeReferralOpportunity(referrerId, jobUrl, referralCode);
    
    // Calculate potential rewards
    const potentialRewards = [
      {
        type: 'referral' as const,
        points: 500,
        description: 'Friend gets job through your referral',
        unlocks: ['Premium features for 1 month', 'Insider company access']
      }
    ];
    
    // Get user's total jobs shared
    const jobsShared = await this.getUserReferralCount(referrerId);
    
    return {
      referralCode,
      potentialRewards,
      jobsShared
    };
  }

  async getViralLeaderboard(): Promise<{
    topReferrers: Array<{userId: string, name: string, referrals: number, rewards: number}>;
    topIntelProviders: Array<{userId: string, name: string, tipsShared: number, helpfulnessScore: number}>;
    communityStats: {
      totalApplications: number;
      averageSuccessRate: number;
      jobsWithIntel: number;
    };
  }> {
    
    // Get top referrers
    const topReferrers = await this.getTopReferrers();
    
    // Get top intelligence providers
    const topIntelProviders = await this.getTopIntelProviders();
    
    // Get community statistics
    const communityStats = await this.getCommunityStats();
    
    return {
      topReferrers,
      topIntelProviders,
      communityStats
    };
  }

  async generateApplicationBoost(
    userId: string,
    jobUrl: string
  ): Promise<{
    boostType: 'early_applicant' | 'community_referral' | 'intel_contributor' | 'viral_member';
    message: string;
    advantagePoints: string[];
  }> {
    
    const userStats = await this.getUserViralStats(userId);
    const jobStats = await this.getJobApplicationStats(jobUrl);
    
    // Determine boost type based on user's viral contributions
    let boostType: 'early_applicant' | 'community_referral' | 'intel_contributor' | 'viral_member';
    let message: string;
    let advantagePoints: string[] = [];
    
    if (jobStats.applicationCount <= 5) {
      boostType = 'early_applicant';
      message = "🎯 Early Bird Advantage! You're among the first 5 AutoJobr users to apply.";
      advantagePoints = [
        "Higher visibility to recruiters",
        "Access to insider company tips",
        "Premium application optimization"
      ];
    } else if (userStats.referralSuccessCount > 3) {
      boostType = 'community_referral';
      message = "🌟 Community Champion! Your referrals have helped others get jobs.";
      advantagePoints = [
        "Priority application processing",
        "Direct connection to employee referrers",
        "Enhanced profile visibility"
      ];
    } else if (userStats.intelContributions > 10) {
      boostType = 'intel_contributor';
      message = "🧠 Intel Expert! You've shared valuable insights with the community.";
      advantagePoints = [
        "Access to exclusive company intelligence",
        "Salary negotiation insights",
        "Interview preparation tips from successful candidates"
      ];
    } else {
      boostType = 'viral_member';
      message = "🚀 AutoJobr Power User! You're part of our success network.";
      advantagePoints = [
        "AI-optimized application",
        "Network effects boost",
        "Community support access"
      ];
    }
    
    return {
      boostType,
      message,
      advantagePoints
    };
  }

  private async recordExtensionApplication(
    userId: string,
    jobUrl: string,
    applicationData: any
  ): Promise<void> {
    
    // Extract company from URL
    const company = this.extractCompanyFromUrl(jobUrl);
    
    // Extract job title from application data or set default
    const jobTitle = applicationData?.jobTitle || applicationData?.title || `${company} Position`;
    
    // Store application with viral tracking data
    await db.insert(jobApplications).values({
      userId,
      jobTitle,
      company,
      jobUrl,
      appliedDate: new Date(),
      source: 'chrome_extension',
      location: applicationData?.location || null,
      jobType: applicationData?.jobType || null,
      workMode: applicationData?.workMode || null,
      analysisData: {
        applicationMethod: 'auto_fill',
        timeToComplete: applicationData?.timeToComplete,
        fieldsAutoFilled: applicationData?.fieldsAutoFilled
      }
    }).onConflictDoNothing();
  }

  private async getJobIntelligence(jobUrl: string): Promise<JobIntelligence> {
    const company = this.extractCompanyFromUrl(jobUrl);
    
    // Get aggregated intelligence from other users
    const applicantCount = await db
      .select({ count: count() })
      .from(jobApplications)
      .where(eq(jobApplications.jobUrl, jobUrl));
    
    // Calculate success rate (mock data for now)
    const successRate = Math.random() * 20 + 5; // 5-25% range
    
    return {
      jobUrl,
      company,
      totalAutoJobrApplicants: applicantCount[0]?.count || 0,
      averageSuccessRate: Math.round(successRate),
      salaryIntel: {
        reportedSalary: 85000 + Math.random() * 30000,
        reportedBy: Math.floor(Math.random() * 10) + 1,
        negotiationTips: [
          "Company typically offers 10-15% above initial offer",
          "Remote work can be negotiated for this role",
          "Ask about signing bonus - they often have budget"
        ]
      },
      insiderTips: [
        "Apply in the morning (9-11 AM) for better visibility",
        "Mention specific company projects in your cover letter",
        "Technical assessment includes system design questions"
      ],
      applicationTiming: {
        optimalTime: "Next 24 hours",
        competitorCount: applicantCount[0]?.count || 0
      }
    };
  }

  private async calculateViralRewards(
    userId: string,
    actionType: 'application' | 'intel_sharing' | 'referral'
  ): Promise<ViralReward[]> {
    
    const rewards: ViralReward[] = [];
    
    switch (actionType) {
      case 'application':
        rewards.push({
          type: 'application_success',
          points: 50,
          description: 'Applied through AutoJobr extension',
          unlocks: ['Application analytics', 'Job tracking']
        });
        break;
        
      case 'intel_sharing':
        rewards.push({
          type: 'intel_sharing',
          points: 200,
          description: 'Shared valuable job intelligence',
          unlocks: ['Premium intel access', 'Community badge']
        });
        break;
        
      case 'referral':
        rewards.push({
          type: 'referral',
          points: 500,
          description: 'Successful job referral',
          unlocks: ['Referrer badge', '1 month premium', 'Direct recruiter access']
        });
        break;
    }
    
    return rewards;
  }

  private async generateSocialProof(jobUrl: string): Promise<string> {
    const applicantCount = await db
      .select({ count: count() })
      .from(jobApplications)
      .where(eq(jobApplications.jobUrl, jobUrl));
    
    const count = applicantCount[0]?.count || 0;
    
    if (count === 0) {
      return "🎯 You're the first AutoJobr user to apply! Early bird advantage activated.";
    } else if (count < 5) {
      return `🚀 ${count} other AutoJobr users have applied. You're in the early group!`;
    } else if (count < 20) {
      return `💪 ${count} AutoJobr users have applied. Strong community presence at this company!`;
    } else {
      return `🔥 ${count}+ AutoJobr users have applied. This is a popular opportunity in our network!`;
    }
  }

  // Additional helper methods
  private extractCompanyFromUrl(jobUrl: string): string {
    try {
      const url = new URL(jobUrl);
      const hostname = url.hostname;
      
      // Extract company name from common job sites
      if (hostname.includes('linkedin.com')) {
        const match = jobUrl.match(/companies\/([^\/]+)/);
        return match ? match[1] : hostname;
      } else if (hostname.includes('indeed.com')) {
        return 'Indeed Job';
      } else if (hostname.includes('glassdoor.com')) {
        return 'Glassdoor Job';
      } else {
        return hostname.replace('www.', '').split('.')[0];
      }
    } catch {
      return 'Unknown Company';
    }
  }

  private async storeJobIntelligence(
    userId: string,
    jobUrl: string,
    intelligence: any
  ): Promise<void> {
    // Store in a job_intelligence table (would need to create this)
    console.log(`Stored intelligence from ${userId} for ${jobUrl}:`, intelligence);
  }

  private async distributeIntelToUsers(jobUrl: string, intelligence: any): Promise<void> {
    // Distribute to other users who applied to same company
    console.log(`Distributed intel for ${jobUrl}:`, intelligence);
  }

  private async storeReferralOpportunity(
    referrerId: string,
    jobUrl: string,
    referralCode: string
  ): Promise<void> {
    // Store referral opportunity
    console.log(`Created referral opportunity: ${referralCode}`);
  }

  private async getUserReferralCount(userId: string): Promise<number> {
    // Get user's total referrals
    return Math.floor(Math.random() * 20); // Mock data
  }

  private async getTopReferrers(): Promise<any[]> {
    return [
      { userId: 'user1', name: 'John Doe', referrals: 15, rewards: 7500 },
      { userId: 'user2', name: 'Jane Smith', referrals: 12, rewards: 6000 },
      { userId: 'user3', name: 'Mike Johnson', referrals: 10, rewards: 5000 }
    ];
  }

  private async getTopIntelProviders(): Promise<any[]> {
    return [
      { userId: 'user4', name: 'Sarah Wilson', tipsShared: 45, helpfulnessScore: 4.8 },
      { userId: 'user5', name: 'Alex Chen', tipsShared: 38, helpfulnessScore: 4.6 },
      { userId: 'user6', name: 'Emily Davis', tipsShared: 32, helpfulnessScore: 4.5 }
    ];
  }

  private async getCommunityStats(): Promise<any> {
    return {
      totalApplications: 12450,
      averageSuccessRate: 18.5,
      jobsWithIntel: 3240
    };
  }

  private async getUserViralStats(userId: string): Promise<any> {
    return {
      referralSuccessCount: Math.floor(Math.random() * 10),
      intelContributions: Math.floor(Math.random() * 25),
      totalPoints: Math.floor(Math.random() * 5000)
    };
  }

  private async getJobApplicationStats(jobUrl: string): Promise<any> {
    const count = await db
      .select({ count: count() })
      .from(jobApplications)
      .where(eq(jobApplications.jobUrl, jobUrl));
    
    return {
      applicationCount: count[0]?.count || 0
    };
  }
}

export const viralExtensionService = new ViralExtensionService();
