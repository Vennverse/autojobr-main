import { db } from './db';
import { eq, count, and } from 'drizzle-orm';
import { 
  users, 
  jobPostings, 
  jobPostingApplications, 
  testAssignments, 
  virtualInterviews, 
  mockInterviews,
  messages,
  resumes,
  jobApplications
} from '@shared/schema';
import { SubscriptionService } from './subscriptionService';

interface RecruiterUsage {
  jobPostings: number;
  applicantsTotal: number;
  testInterviewAssignments: number;
  messagesUsed: number;
}

interface JobSeekerUsage {
  resumeUploads: number;
  jobApplications: number;
  testAssignmentsReceived: number;
  messagesUsed: number;
}

interface RecruiterLimits {
  jobPostings: number;
  applicantsPerJob: number;
  testInterviewAssignments: number;
  messages: boolean;
}

interface JobSeekerLimits {
  resumeUploads: number;
  jobApplications: number;
  testAssignmentsReceived: number;
  messages: boolean;
}

interface UsageReport {
  subscription: {
    isActive: boolean;
    planType: string;
  };
  usage: RecruiterUsage | JobSeekerUsage;
  limits: RecruiterLimits | JobSeekerLimits;
  percentages: Record<string, number>;
  upgradeRecommended: boolean;
  isFreeTier: boolean;
  features: {
    resumeViewing: boolean;
    basicAIScore: boolean;
    advancedResumeAnalytics: boolean;
    messages: boolean;
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

      let usage: RecruiterUsage | JobSeekerUsage;
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

        const messagesResult = await db
          .select({ count: count() })
          .from(messages)
          .where(eq(messages.senderId, userId));

        usage = {
          jobPostings: jobPostingsResult[0]?.count || 0,
          applicantsTotal: totalApplicantsResult[0]?.count || 0,
          testInterviewAssignments: 
            (testAssignmentsResult[0]?.count || 0) + 
            (virtualInterviewsResult[0]?.count || 0) + 
            (mockInterviewsResult[0]?.count || 0),
          messagesUsed: messagesResult[0]?.count || 0
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
        // Job seeker usage - track relevant metrics for job seekers
        const resumesResult = await db
          .select({ count: count() })
          .from(resumes)
          .where(eq(resumes.userId, userId));

        const applicationsResult = await db
          .select({ count: count() })
          .from(jobApplications)
          .where(eq(jobApplications.userId, userId));

        const testAssignmentsReceivedResult = await db
          .select({ count: count() })
          .from(testAssignments)
          .where(eq(testAssignments.jobSeekerId, userId));

        const messagesResult = await db
          .select({ count: count() })
          .from(messages)
          .where(eq(messages.senderId, userId));

        // Get cover letter generation count for job seekers
        const coverLettersResult = await db
          .select({ count: count() })
          .from(messages) // Assuming cover letters are tracked somewhere, we'll use messages as placeholder
          .where(eq(messages.senderId, userId));

        usage = {
          resumeUploads: resumesResult[0]?.count || 0,
          jobApplications: applicationsResult[0]?.count || 0,
          testAssignmentsReceived: testAssignmentsReceivedResult[0]?.count || 0,
          messagesUsed: messagesResult[0]?.count || 0,
          coverLetterGenerations: 0 // TODO: Implement actual cover letter tracking
        };

        // Calculate percentages for job seeker limits (access properties from subscription limits)
        const subscriptionLimits = subscription.limits as any;
        const jobSeekerUsage = usage as JobSeekerUsage;
        
        if (subscriptionLimits.resumeUploads && subscriptionLimits.resumeUploads > 0) {
          percentages.resumeUploads = Math.round((jobSeekerUsage.resumeUploads / subscriptionLimits.resumeUploads) * 100);
        }

        if (subscriptionLimits.jobApplications && subscriptionLimits.jobApplications > 0) {
          percentages.jobApplications = Math.round((jobSeekerUsage.jobApplications / subscriptionLimits.jobApplications) * 100);
        }
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
        limits: userType === 'recruiter' ? {
          jobPostings: limits.jobPostings,
          applicantsPerJob: limits.applicantsPerJob,
          testInterviewAssignments: limits.testInterviewAssignments,
          messages: (limits as any).chatMessages || false
        } : {
          resumeUploads: (limits as any).resumeUploads || 3,
          jobApplications: -1, // Unlimited job applications for everyone
          testAssignmentsReceived: -1, // Unlimited for job seekers
          coverLetterGenerations: (limits as any).coverLetterGenerations || 2, // 2 free cover letters
          messages: (limits as any).chatMessages || false
        },
        percentages,
        upgradeRecommended,
        isFreeTier: !hasActiveSubscription,
        features: {
          resumeViewing: limits.resumeViewing,
          basicAIScore: limits.basicAIScore,
          advancedResumeAnalytics: limits.advancedResumeAnalytics,
          messages: limits.messages,
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
          messagesUsed: 0
        },
        limits: {
          jobPostings: 2,
          applicantsPerJob: 20,
          testInterviewAssignments: 10,
          messages: false
        },
        percentages: {},
        upgradeRecommended: false,
        isFreeTier: true,
        features: {
          resumeViewing: true,
          basicAIScore: true,
          advancedResumeAnalytics: false,
          messages: false,
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
    const currentUsage = (report.usage as any)[feature] || 0;
    const limit = (report.limits as any)[feature] || 0;
    
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