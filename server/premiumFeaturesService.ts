import { db } from './db';
import { users, jobPostings, jobApplications, resumes } from '@shared/schema';
import { eq, count, and, desc, gte } from 'drizzle-orm';

export interface PremiumUsageStats {
  resumeUploads: number;
  jobApplications: number;
  aiAnalyses: number;
  jobPostings: number;
  candidateSearches: number;
  customTests: number;
  resumeDownloads: number;
  bulkMessages: number;
}

export interface PremiumFeatureAccess {
  canUploadResume: boolean;
  canApplyToJob: boolean;
  canUseAIAnalysis: boolean;
  canPostJob: boolean;
  canSearchCandidates: boolean;
  canUsePremiumTargeting: boolean;
  canAccessAnalytics: boolean;
  canCreateCustomTests: boolean;
  canAccessAPI: boolean;
  canDownloadResumes: boolean;
  canSendBulkMessages: boolean;
  hasPrioritySupport: boolean;
}

export interface PremiumLimits {
  resumeUploads: number | 'unlimited';
  jobApplications: number | 'unlimited';
  aiAnalyses: number | 'unlimited';
  jobPostings: number | 'unlimited';
  candidateSearches: number | 'unlimited';
  customTests: number | 'unlimited';
  resumeDownloads: number | 'unlimited';
  bulkMessages: number | 'unlimited';
}

const PLAN_LIMITS: Record<string, PremiumLimits> = {
  free: {
    resumeUploads: 2,
    jobApplications: 50,
    aiAnalyses: 3, // per day
    jobPostings: 2,
    candidateSearches: 10, // per day
    customTests: 0,
    resumeDownloads: 10, // per month
    bulkMessages: 5 // per day
  },
  premium: {
    resumeUploads: 'unlimited',
    jobApplications: 'unlimited',
    aiAnalyses: 'unlimited',
    jobPostings: 'unlimited',
    candidateSearches: 'unlimited',
    customTests: 50,
    resumeDownloads: 'unlimited',
    bulkMessages: 'unlimited'
  },
  enterprise: {
    resumeUploads: 'unlimited',
    jobApplications: 'unlimited',
    aiAnalyses: 'unlimited',
    jobPostings: 'unlimited',
    candidateSearches: 'unlimited',
    customTests: 'unlimited',
    resumeDownloads: 'unlimited',
    bulkMessages: 'unlimited'
  }
};

export class PremiumFeaturesService {
  
  async getUserUsageStats(userId: string): Promise<PremiumUsageStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    try {
      // Get resume uploads count
      const resumeUploadsResult = await db
        .select({ count: count() })
        .from(resumes)
        .where(eq(resumes.userId, userId));
      
      // Get job applications count
      const jobApplicationsResult = await db
        .select({ count: count() })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));
      
      // Get job postings count (for recruiters)
      const jobPostingsResult = await db
        .select({ count: count() })
        .from(jobPostings)
        .where(eq(jobPostings.recruiterId, userId));

      return {
        resumeUploads: resumeUploadsResult[0]?.count || 0,
        jobApplications: jobApplicationsResult[0]?.count || 0,
        aiAnalyses: 0, // TODO: Implement AI analysis tracking
        jobPostings: jobPostingsResult[0]?.count || 0,
        candidateSearches: 0, // TODO: Implement search tracking
        customTests: 0, // TODO: Implement custom tests tracking
        resumeDownloads: 0, // TODO: Implement download tracking
        bulkMessages: 0 // TODO: Implement messaging tracking
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        resumeUploads: 0,
        jobApplications: 0,
        aiAnalyses: 0,
        jobPostings: 0,
        candidateSearches: 0,
        customTests: 0,
        resumeDownloads: 0,
        bulkMessages: 0
      };
    }
  }

  async getUserPlanType(userId: string): Promise<string> {
    try {
      const [user] = await db
        .select({ planType: users.planType })
        .from(users)
        .where(eq(users.id, userId));
      
      return user?.planType || 'free';
    } catch (error) {
      console.error('Error getting user plan:', error);
      return 'free';
    }
  }

  async getPremiumFeatureAccess(userId: string): Promise<PremiumFeatureAccess> {
    const planType = await this.getUserPlanType(userId);
    const isPremium = planType === 'premium' || planType === 'enterprise';
    const isEnterprise = planType === 'enterprise';
    
    return {
      canUploadResume: true, // All users can upload at least 2 resumes
      canApplyToJob: true, // All users can apply to jobs
      canUseAIAnalysis: true, // All users get basic AI analysis
      canPostJob: true, // All users can post at least 2 jobs
      canSearchCandidates: true, // All users get basic search
      canUsePremiumTargeting: isPremium,
      canAccessAnalytics: isPremium,
      canCreateCustomTests: isPremium,
      canAccessAPI: isPremium,
      canDownloadResumes: true, // All users get some downloads
      canSendBulkMessages: true, // All users get some bulk messages
      hasPrioritySupport: isPremium
    };
  }

  async checkFeatureLimit(userId: string, feature: keyof PremiumLimits): Promise<{
    allowed: boolean;
    current: number;
    limit: number | 'unlimited';
    remaining: number | 'unlimited';
    planType: string;
  }> {
    const planType = await this.getUserPlanType(userId);
    const limits = PLAN_LIMITS[planType] || PLAN_LIMITS.free;
    const limit = limits[feature];
    
    if (limit === 'unlimited') {
      return {
        allowed: true,
        current: 0,
        limit: 'unlimited',
        remaining: 'unlimited',
        planType
      };
    }
    
    const usage = await this.getUserUsageStats(userId);
    const current = usage[feature as keyof PremiumUsageStats] || 0;
    const remaining = Math.max(0, (limit as number) - current);
    const allowed = current < (limit as number);
    
    return {
      allowed,
      current,
      limit,
      remaining,
      planType
    };
  }

  async validateFeatureUsage(userId: string, feature: keyof PremiumLimits): Promise<{
    valid: boolean;
    message?: string;
    upgradeRequired?: boolean;
  }> {
    const check = await this.checkFeatureLimit(userId, feature);
    
    if (!check.allowed) {
      const featureName = this.getFeatureDisplayName(feature);
      return {
        valid: false,
        message: `You've reached your ${featureName} limit of ${check.limit}. Upgrade to Premium for unlimited access.`,
        upgradeRequired: true
      };
    }
    
    return { valid: true };
  }

  private getFeatureDisplayName(feature: keyof PremiumLimits): string {
    const displayNames: Record<keyof PremiumLimits, string> = {
      resumeUploads: 'resume uploads',
      jobApplications: 'job applications',
      aiAnalyses: 'AI analyses',
      jobPostings: 'job postings',
      candidateSearches: 'candidate searches',
      customTests: 'custom tests',
      resumeDownloads: 'resume downloads',
      bulkMessages: 'bulk messages'
    };
    
    return displayNames[feature] || feature;
  }

  async getPremiumValue(userId: string): Promise<{
    totalSavings: number;
    featuresUsed: string[];
    premiumBenefits: string[];
  }> {
    const planType = await this.getUserPlanType(userId);
    const usage = await this.getUserUsageStats(userId);
    const access = await this.getPremiumFeatureAccess(userId);
    
    if (planType === 'free') {
      return {
        totalSavings: 0,
        featuresUsed: [],
        premiumBenefits: [
          'Unlimited resume uploads',
          'Unlimited job applications',
          'Advanced AI analysis',
          'Premium candidate targeting',
          'Detailed analytics',
          'Priority support'
        ]
      };
    }

    // Calculate value for premium users
    const featuresUsed = [];
    let totalSavings = 0;
    
    if (usage.resumeUploads > 2) {
      featuresUsed.push(`${usage.resumeUploads} resume uploads`);
      totalSavings += (usage.resumeUploads - 2) * 5; // $5 per extra resume
    }
    
    if (usage.jobApplications > 50) {
      featuresUsed.push(`${usage.jobApplications} job applications`);
      totalSavings += (usage.jobApplications - 50) * 2; // $2 per extra application
    }
    
    if (access.canUsePremiumTargeting) {
      featuresUsed.push('Premium targeting');
      totalSavings += 50; // $50 value
    }
    
    if (access.canAccessAnalytics) {
      featuresUsed.push('Advanced analytics');
      totalSavings += 30; // $30 value
    }
    
    return {
      totalSavings,
      featuresUsed,
      premiumBenefits: [
        'Unlimited everything',
        'Advanced AI features',
        'Priority support',
        'Premium targeting',
        'Detailed analytics',
        'API access'
      ]
    };
  }

  async upgradeUserToPremium(userId: string, planType: 'premium' | 'enterprise'): Promise<void> {
    try {
      const subscriptionStartDate = new Date();
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month subscription
      
      await db
        .update(users)
        .set({
          planType,
          subscriptionStatus: 'active',
          subscriptionStartDate,
          subscriptionEndDate,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
        
      console.log(`User ${userId} upgraded to ${planType} plan`);
    } catch (error) {
      console.error('Error upgrading user to premium:', error);
      throw new Error('Failed to upgrade user subscription');
    }
  }

  async downgradeUserToFree(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          planType: 'free',
          subscriptionStatus: 'canceled',
          subscriptionEndDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
        
      console.log(`User ${userId} downgraded to free plan`);
    } catch (error) {
      console.error('Error downgrading user to free:', error);
      throw new Error('Failed to downgrade user subscription');
    }
  }
}

export const premiumFeaturesService = new PremiumFeaturesService();