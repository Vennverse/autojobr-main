import { db } from './db';
import { eq, count, and } from 'drizzle-orm';
import { 
  users, 
  jobPostings, 
  jobPostingApplications, 
  testAssignments, 
  virtualInterviews, 
  mockInterviews,
  chatMessages 
} from '@shared/schema';
import { SubscriptionService } from './subscriptionService';

interface UsageReport {
  subscription: {
    isActive: boolean;
    planType: string;
  };
  usage: {
    jobPostings: number;
    applicantsTotal: number;
    testInterviewAssignments: number;
    chatMessagesUsed: number;
  };
  limits: {
    jobPostings: number;
    applicantsPerJob: number;
    testInterviewAssignments: number;
    chatMessages: boolean;
  };
  percentages: Record<string, number>;
  upgradeRecommended: boolean;
  isFreeTier: boolean;
  features: {
    resumeViewing: boolean;
    basicAIScore: boolean;
    advancedResumeAnalytics: boolean;
    chatMessages: boolean;
    basicAnalytics: boolean;
    advancedAnalytics: boolean;
    premiumTargeting: boolean;
    apiAccess: boolean;
    backgroundChecks: boolean;
  };
}

class UsageMonitoringService {
  private subscriptionService = new SubscriptionService();

  async generateUsageReport(userId: string): Promise<UsageReport> {
    try {
      // Get user subscription data
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new Error('User not found');
      }

      const userData = user[0];
      const planType = userData.planType || 'free';
      const hasActiveSubscription = userData.subscriptionStatus === 'active';
      const userType = userData.userType || 'job_seeker';

      // Get subscription limits
      const subscription = await this.subscriptionService.getUserSubscription(userId);
      const limits = subscription.limits;

      let usage: UsageReport['usage'];
      let percentages: Record<string, number> = {};

      if (userType === 'recruiter') {
        // Get real recruiter usage data
        const jobPostingsResult = await db
          .select({ count: count() })
          .from(jobPostings)
          .where(and(eq(jobPostings.recruiterId, userId), eq(jobPostings.isActive, true)));

        const totalApplicantsResult = await db
          .select({ count: count() })
          .from(jobPostingApplications)
          .innerJoin(jobPostings, eq(jobPostingApplications.jobPostingId, jobPostings.id))
          .where(eq(jobPostings.recruiterId, userId));

        const testAssignmentsResult = await db
          .select({ count: count() })
          .from(testAssignments)
          .where(eq(testAssignments.recruiterId, userId));

        const virtualInterviewsResult = await db
          .select({ count: count() })
          .from(virtualInterviews)
          .where(eq(virtualInterviews.assignedBy, userId));

        const mockInterviewsResult = await db
          .select({ count: count() })
          .from(mockInterviews)
          .where(eq(mockInterviews.assignedBy, userId));

        const chatMessagesResult = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(eq(chatMessages.senderId, userId));

        usage = {
          jobPostings: jobPostingsResult[0]?.count || 0,
          applicantsTotal: totalApplicantsResult[0]?.count || 0,
          testInterviewAssignments: 
            (testAssignmentsResult[0]?.count || 0) + 
            (virtualInterviewsResult[0]?.count || 0) + 
            (mockInterviewsResult[0]?.count || 0),
          chatMessagesUsed: chatMessagesResult[0]?.count || 0
        };

        // Calculate percentages for numeric limits
        if (limits.jobPostings > 0) {
          percentages.jobPostings = Math.round((usage.jobPostings / limits.jobPostings) * 100);
        } else {
          percentages.jobPostings = 0; // Unlimited
        }

        if (limits.testInterviewAssignments > 0) {
          percentages.testInterviewAssignments = Math.round((usage.testInterviewAssignments / limits.testInterviewAssignments) * 100);
        } else {
          percentages.testInterviewAssignments = 0; // Unlimited
        }
      } else {
        // Job seeker usage (simplified for now)
        usage = {
          jobPostings: 0,
          applicantsTotal: 0,
          testInterviewAssignments: 0,
          chatMessagesUsed: 0
        };
      }

      // Determine if upgrade is recommended
      const upgradeRecommended = !hasActiveSubscription && 
        Object.values(percentages).some(p => p > 80);

      return {
        subscription: {
          isActive: hasActiveSubscription,
          planType
        },
        usage,
        limits: {
          jobPostings: limits.jobPostings,
          applicantsPerJob: limits.applicantsPerJob,
          testInterviewAssignments: limits.testInterviewAssignments,
          chatMessages: limits.chatMessages
        },
        percentages,
        upgradeRecommended,
        isFreeTier: !hasActiveSubscription,
        features: {
          resumeViewing: limits.resumeViewing,
          basicAIScore: limits.basicAIScore,
          advancedResumeAnalytics: limits.advancedResumeAnalytics,
          chatMessages: limits.chatMessages,
          basicAnalytics: limits.basicAnalytics,
          advancedAnalytics: limits.advancedAnalytics,
          premiumTargeting: limits.premiumTargeting,
          apiAccess: limits.apiAccess,
          backgroundChecks: limits.backgroundChecks
        }
      };
    } catch (error) {
      console.error('Error generating usage report:', error);
      
      // Return minimal usage report on error
      return {
        subscription: {
          isActive: false,
          planType: 'free'
        },
        usage: {
          jobPostings: 0,
          applicantsTotal: 0,
          testInterviewAssignments: 0,
          chatMessagesUsed: 0
        },
        limits: {
          jobPostings: 2,
          applicantsPerJob: 20,
          testInterviewAssignments: 10,
          chatMessages: false
        },
        percentages: {},
        upgradeRecommended: false,
        isFreeTier: true,
        features: {
          resumeViewing: true,
          basicAIScore: true,
          advancedResumeAnalytics: false,
          chatMessages: false,
          basicAnalytics: true,
          advancedAnalytics: false,
          premiumTargeting: false,
          apiAccess: false,
          backgroundChecks: false
        }
      };
    }
  }

  async checkUsageLimit(userId: string, feature: string): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
  }> {
    const report = await this.generateUsageReport(userId);
    const currentUsage = report.usage[feature] || 0;
    const limit = report.limits[feature] || 0;
    
    return {
      allowed: limit === -1 || currentUsage < limit,
      remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage),
      limit
    };
  }

  async enforceUsageLimit(userId: string, feature: string): Promise<{
    allowed: boolean;
    message?: string;
  }> {
    const check = await this.checkUsageLimit(userId, feature);
    
    if (!check.allowed) {
      return {
        allowed: false,
        message: `You have reached your limit for ${feature}. Please upgrade to continue.`
      };
    }
    
    return { allowed: true };
  }
}

export const usageMonitoringService = new UsageMonitoringService();