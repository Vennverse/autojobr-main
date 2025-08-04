import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Legacy interface - keeping for backward compatibility
export interface LegacySubscriptionLimits {
  jobPostings: number;
  applications: number;
  customTests: number;
  premiumTargeting: boolean;
  analytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  dedicatedManager: boolean;
}

export interface SubscriptionLimits {
  // Job management
  jobPostings: number; // -1 for unlimited
  applicantsPerJob: number; // -1 for unlimited
  
  // Testing & interviews
  testInterviewAssignments: number; // Combined virtual/mock/test assignments
  preBuiltTestTemplates: number; // Access to pre-built templates
  customTests: boolean; // Can create custom tests
  
  // Resume & candidate features
  resumeViewing: boolean; // Can view resumes
  basicAIScore: boolean; // Basic AI resume scoring
  advancedResumeAnalytics: boolean; // Advanced parsing and analytics
  
  // Communication
  chatMessages: boolean; // Can use chat system
  
  // Analytics & insights
  basicAnalytics: boolean; // Views, application count
  advancedAnalytics: boolean; // Full analytics suite
  
  // Premium features
  premiumTargeting: boolean; // Advanced targeting and AI filters
  apiAccess: boolean; // ATS/API integrations
  backgroundChecks: boolean; // Background verification
  prioritySupport: boolean;
  whiteLabel: boolean;
  dedicatedManager: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    // Job management - FREE TIER LIMITS
    jobPostings: 2, // Max 2 active job posts
    applicantsPerJob: 20, // Max 20 applicants per job
    
    // Testing & interviews - FREE TIER LIMITS
    testInterviewAssignments: 10, // Max 10 combined test/interview assignments
    preBuiltTestTemplates: 1, // Allow 1 pre-built test template
    customTests: false, // No custom test creation
    
    // Resume & candidate features - FREE TIER
    resumeViewing: true, // Resume viewing allowed
    basicAIScore: true, // Basic AI score allowed
    advancedResumeAnalytics: false, // No advanced parsing
    
    // Communication - FREE TIER
    chatMessages: false, // No chat for free tier
    
    // Analytics - FREE TIER
    basicAnalytics: true, // Basic analytics (views, application count)
    advancedAnalytics: false, // No advanced analytics
    
    // Premium features - LOCKED
    premiumTargeting: false,
    apiAccess: false,
    backgroundChecks: false,
    prioritySupport: false,
    whiteLabel: false,
    dedicatedManager: false
  },
  premium: {
    // Job management - PREMIUM UNLIMITED
    jobPostings: -1, // Unlimited jobs
    applicantsPerJob: -1, // Unlimited applicants
    
    // Testing & interviews - PREMIUM UNLIMITED
    testInterviewAssignments: -1, // Unlimited tests/interviews
    preBuiltTestTemplates: -1, // Full test library
    customTests: true, // Custom test creation allowed
    
    // Resume & candidate features - PREMIUM ADVANCED
    resumeViewing: true,
    basicAIScore: true,
    advancedResumeAnalytics: true, // Advanced resume parsing and analytics
    
    // Communication - PREMIUM UNLIMITED
    chatMessages: true, // Unlimited chat
    
    // Analytics - PREMIUM ADVANCED
    basicAnalytics: true,
    advancedAnalytics: true, // Full analytics suite
    
    // Premium features - UNLOCKED
    premiumTargeting: true, // Advanced targeting and AI filters
    apiAccess: true, // ATS/API integrations
    backgroundChecks: true, // Background checks
    prioritySupport: true,
    whiteLabel: false,
    dedicatedManager: false
  },
  enterprise: {
    // Job management - ENTERPRISE UNLIMITED
    jobPostings: -1,
    applicantsPerJob: -1,
    
    // Testing & interviews - ENTERPRISE UNLIMITED
    testInterviewAssignments: -1,
    preBuiltTestTemplates: -1,
    customTests: true,
    
    // Resume & candidate features - ENTERPRISE ADVANCED
    resumeViewing: true,
    basicAIScore: true,
    advancedResumeAnalytics: true,
    
    // Communication - ENTERPRISE UNLIMITED
    chatMessages: true,
    
    // Analytics - ENTERPRISE ADVANCED
    basicAnalytics: true,
    advancedAnalytics: true,
    
    // Premium features - FULL ACCESS
    premiumTargeting: true,
    apiAccess: true,
    backgroundChecks: true,
    prioritySupport: true,
    whiteLabel: true, // White label branding
    dedicatedManager: true // Dedicated account manager
  }
};

export class SubscriptionService {
  async getUserSubscription(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('User not found');

    return {
      planType: user.planType || 'free',
      subscriptionStatus: user.subscriptionStatus || 'free',
      limits: SUBSCRIPTION_LIMITS[user.planType || 'free']
    };
  }

  async canAccessFeature(userId: string, feature: keyof SubscriptionLimits): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    const limit = subscription.limits[feature];
    
    if (typeof limit === 'boolean') {
      return limit;
    }
    
    // For numeric limits, -1 means unlimited (true), 0 means not allowed (false)
    if (typeof limit === 'number') {
      return limit !== 0;
    }
    
    return false;
  }

  async checkNumericLimit(userId: string, feature: keyof Pick<SubscriptionLimits, 'jobPostings' | 'applicantsPerJob' | 'testInterviewAssignments' | 'preBuiltTestTemplates'>, currentCount: number): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    const subscription = await this.getUserSubscription(userId);
    const limit = subscription.limits[feature] as number;
    
    if (limit === -1) {
      return { allowed: true, limit: -1, remaining: -1 };
    }
    
    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount < limit;
    
    return { allowed, limit, remaining };
  }

  // Enhanced method to check job application limits per job
  async checkJobApplicationLimit(userId: string, jobPostingId: number, currentApplicants: number): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    return this.checkNumericLimit(userId, 'applicantsPerJob', currentApplicants);
  }

  // Enhanced method to check test/interview assignment limits
  async checkTestInterviewLimit(userId: string, currentAssignments: number): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    return this.checkNumericLimit(userId, 'testInterviewAssignments', currentAssignments);
  }

  // Legacy method for backward compatibility
  async checkLimit(userId: string, feature: 'jobPostings' | 'applications' | 'customTests', currentCount: number): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    // Map legacy features to new structure
    const featureMap = {
      'jobPostings': 'jobPostings' as const,
      'applications': 'applicantsPerJob' as const,
      'customTests': 'preBuiltTestTemplates' as const
    };
    
    const mappedFeature = featureMap[feature];
    if (mappedFeature) {
      return this.checkNumericLimit(userId, mappedFeature, currentCount);
    }
    
    return { allowed: false, limit: 0, remaining: 0 };
  }

  async updateSubscription(userId: string, updates: {
    planType?: string;
    subscriptionStatus?: string;
    paymentProvider?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    paypalSubscriptionId?: string;
    amazonPayPaymentId?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }) {
    await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async processSuccessfulPayment(userId: string, paymentData: {
    planType: string;
    paymentProvider: 'paypal' | 'amazon_pay';
    paymentId: string;
    billingCycle: 'monthly' | 'annual';
    amount: number;
  }) {
    const endDate = new Date();
    if (paymentData.billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const updates: any = {
      planType: paymentData.planType,
      subscriptionStatus: 'active',
      paymentProvider: paymentData.paymentProvider,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: endDate
    };

    switch (paymentData.paymentProvider) {
      case 'paypal':
        updates.paypalSubscriptionId = paymentData.paymentId;
        break;
      case 'amazon_pay':
        updates.amazonPayPaymentId = paymentData.paymentId;
        break;
    }

    await this.updateSubscription(userId, updates);
  }

  async getUsageStats(userId: string) {
    // Get current usage counts from database
    // This would typically involve counting records from various tables
    // For now, we'll return mock data - implement actual counting as needed
    
    return {
      jobPostings: 0, // Count from job_postings table
      applications: 0, // Count from applications table  
      customTests: 0, // Count from test_templates table
    };
  }

  async isFeatureAccessible(userId: string, feature: keyof SubscriptionLimits): Promise<{ accessible: boolean; reason?: string; upgradeRequired?: boolean }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const hasAccess = await this.canAccessFeature(userId, feature);
      
      if (hasAccess) {
        return { accessible: true };
      }
      
      const currentPlan = subscription.planType;
      let requiredPlan = '';
      
      // Determine required plan for feature
      if (SUBSCRIPTION_LIMITS.premium[feature]) {
        requiredPlan = 'premium';
      } else if (SUBSCRIPTION_LIMITS.enterprise[feature]) {
        requiredPlan = 'enterprise';
      }
      
      return {
        accessible: false,
        reason: `This feature requires a ${requiredPlan} plan. You are currently on the ${currentPlan} plan.`,
        upgradeRequired: true
      };
    } catch (error) {
      return {
        accessible: false,
        reason: 'Unable to verify subscription status'
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();