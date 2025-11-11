import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from './subscriptionService';
import { db } from './db';
import { eq, count, and } from 'drizzle-orm';
import { 
  jobPostings, 
  jobPostingApplications, 
  testAssignments, 
  virtualInterviews, 
  mockInterviews,
  chatMessages 
} from '@shared/schema';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    planType?: string;
    userType?: string;
  };
}

export class SubscriptionEnforcementService {
  private subscriptionService = new SubscriptionService();

  // Comprehensive plan enforcement for all recruiter features
  async enforceAllLimits(userId: string): Promise<{
    jobPostings: { allowed: boolean; current: number; limit: number; message?: string };
    applicantsPerJob: { allowed: boolean; limit: number; message?: string };
    testInterviewAssignments: { allowed: boolean; current: number; limit: number; message?: string };
    chatMessages: { allowed: boolean; message?: string };
    resumeViewing: { allowed: boolean; basicAI: boolean; advancedAnalytics: boolean; message?: string };
    premiumFeatures: { 
      targeting: boolean; 
      apiAccess: boolean; 
      backgroundChecks: boolean; 
      customTests: boolean;
      message?: string;
    };
  }> {
    try {
      const subscription = await this.subscriptionService.getUserSubscription(userId);
      const limits = subscription.limits;
      const planType = subscription.planType;

      // Check current usage
      const [
        currentJobsResult,
        totalTestInterviewAssignments
      ] = await Promise.all([
        // Active job postings count
        db.select({ count: count() })
          .from(jobPostings)
          .where(and(eq(jobPostings.recruiterId, userId), eq(jobPostings.isActive, true))),
        
        // Combined test/interview assignments count
        this.getTotalTestInterviewAssignments(userId)
      ]);

      const currentJobs = currentJobsResult[0]?.count || 0;

      return {
        jobPostings: {
          allowed: limits.jobPostings === -1 || currentJobs < limits.jobPostings,
          current: currentJobs,
          limit: limits.jobPostings,
          message: limits.jobPostings === -1 ? undefined : 
            currentJobs >= limits.jobPostings ? 
              `You've reached your limit of ${limits.jobPostings} active job postings. Upgrade to Premium for unlimited jobs.` : 
              undefined
        },
        applicantsPerJob: {
          allowed: limits.applicantsPerJob === -1 || limits.applicantsPerJob > 0,
          limit: limits.applicantsPerJob,
          message: limits.applicantsPerJob === -1 ? undefined :
            `Each job can have up to ${limits.applicantsPerJob} applicants. Upgrade to Premium to remove this limit.`
        },
        testInterviewAssignments: {
          allowed: limits.testInterviewAssignments === -1 || totalTestInterviewAssignments < limits.testInterviewAssignments,
          current: totalTestInterviewAssignments,
          limit: limits.testInterviewAssignments,
          message: limits.testInterviewAssignments === -1 ? undefined :
            totalTestInterviewAssignments >= limits.testInterviewAssignments ?
              `You've reached your limit of ${limits.testInterviewAssignments} combined test/interview assignments. Upgrade to Premium for unlimited assignments.` :
              undefined
        },
        chatMessages: {
          allowed: limits.chatMessages,
          message: limits.chatMessages ? undefined : 
            'Chat functionality is available with Premium plans. Upgrade to start messaging candidates.'
        },
        resumeViewing: {
          allowed: limits.resumeViewing,
          basicAI: limits.basicAIScore,
          advancedAnalytics: limits.advancedResumeAnalytics,
          message: !limits.resumeViewing ? 'Resume viewing requires a premium subscription.' : undefined
        },
        premiumFeatures: {
          targeting: limits.premiumTargeting,
          apiAccess: limits.apiAccess,
          backgroundChecks: limits.backgroundChecks,
          customTests: limits.customTests,
          message: planType === 'free' ? 
            'Advanced features like premium targeting, API access, and background checks are available with Premium plans.' : 
            undefined
        }
      };
    } catch (error) {
      console.error('Error enforcing subscription limits:', error);
      // Return restrictive defaults on error
      return {
        jobPostings: { allowed: false, current: 0, limit: 0, message: 'Unable to verify subscription limits.' },
        applicantsPerJob: { allowed: false, limit: 0, message: 'Unable to verify subscription limits.' },
        testInterviewAssignments: { allowed: false, current: 0, limit: 0, message: 'Unable to verify subscription limits.' },
        chatMessages: { allowed: false, message: 'Unable to verify subscription limits.' },
        resumeViewing: { allowed: false, basicAI: false, advancedAnalytics: false, message: 'Unable to verify subscription limits.' },
        premiumFeatures: { targeting: false, apiAccess: false, backgroundChecks: false, customTests: false, message: 'Unable to verify subscription limits.' }
      };
    }
  }

  private async getTotalTestInterviewAssignments(userId: string): Promise<number> {
    const [testAssignmentsResult, virtualInterviewsResult, mockInterviewsResult] = await Promise.all([
      db.select({ count: count() }).from(testAssignments).where(eq(testAssignments.recruiterId, userId)),
      db.select({ count: count() }).from(virtualInterviews).where(eq(virtualInterviews.assignedBy, userId)),
      db.select({ count: count() }).from(mockInterviews).where(eq(mockInterviews.assignedBy, userId))
    ]);

    return (testAssignmentsResult[0]?.count || 0) + 
           (virtualInterviewsResult[0]?.count || 0) + 
           (mockInterviewsResult[0]?.count || 0);
  }

  // Middleware creator for specific feature enforcement
  createFeatureMiddleware(feature: 'jobPostings' | 'testInterviewAssignments' | 'chatMessages' | 'resumeViewing') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user.id;
        const enforcement = await this.enforceAllLimits(userId);
        
        const featureEnforcement = enforcement[feature];
        
        if ('allowed' in featureEnforcement && !featureEnforcement.allowed) {
          return res.status(403).json({
            error: `Access to ${feature} restricted`,
            message: featureEnforcement.message,
            upgradeRequired: true,
            feature
          });
        }

        // Add enforcement info to request for use in route handlers
        req.subscriptionLimits = enforcement;
        next();
      } catch (error) {
        console.error(`${feature} enforcement failed:`, error);
        res.status(500).json({ error: 'Failed to check subscription limits' });
      }
    };
  }
}

// Create service instance
export const subscriptionEnforcementService = new SubscriptionEnforcementService();

// Export middleware functions
export const enforceJobPostingLimits = subscriptionEnforcementService.createFeatureMiddleware('jobPostings');
export const enforceTestInterviewLimits = subscriptionEnforcementService.createFeatureMiddleware('testInterviewAssignments');
export const enforceChatLimits = subscriptionEnforcementService.createFeatureMiddleware('chatMessages');
export const enforceResumeLimits = subscriptionEnforcementService.createFeatureMiddleware('resumeViewing');

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      subscriptionLimits?: Awaited<ReturnType<SubscriptionEnforcementService['enforceAllLimits']>>;
    }
  }
}