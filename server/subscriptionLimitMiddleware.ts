import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from './subscriptionService';
import { db } from './db';
import { eq, count, and } from 'drizzle-orm';
import { 
  jobPostings, 
  jobPostingApplications, 
  testAssignments, 
  virtualInterviews, 
  mockInterviews 
} from '@shared/schema';

const subscriptionService = new SubscriptionService();

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    planType?: string;
    userType?: string;
  };
}

// Middleware to check job posting limits
export const checkJobPostingLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    
    // Count current active job postings
    const currentJobsResult = await db
      .select({ count: count() })
      .from(jobPostings)
      .where(and(eq(jobPostings.recruiterId, userId), eq(jobPostings.isActive, true)));
    
    const currentJobs = currentJobsResult[0]?.count || 0;
    
    // Check limit
    const limitCheck = await subscriptionService.checkNumericLimit(userId, 'jobPostings', currentJobs);
    
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'Job posting limit exceeded',
        message: `You have reached your limit of ${limitCheck.limit} active job postings. Upgrade to Premium for unlimited job postings.`,
        currentUsage: currentJobs,
        limit: limitCheck.limit,
        upgradeRequired: true
      });
    }
    
    // Add limit info to request for use in route handlers
    req.limitInfo = {
      currentUsage: currentJobs,
      limit: limitCheck.limit,
      remaining: limitCheck.remaining
    };
    
    next();
  } catch (error) {
    console.error('Job posting limit check failed:', error);
    res.status(500).json({ error: 'Failed to check subscription limits' });
  }
};

// Middleware to check applicants per job limit
export const checkApplicantLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const jobPostingId = parseInt(req.params.jobId || req.body.jobPostingId);
    if (!jobPostingId) {
      return next(); // Skip check if no job ID
    }
    
    // Count current applicants for this job
    const currentApplicantsResult = await db
      .select({ count: count() })
      .from(jobPostingApplications)
      .where(eq(jobPostingApplications.jobPostingId, jobPostingId));
    
    const currentApplicants = currentApplicantsResult[0]?.count || 0;
    
    // Get job owner to check their subscription
    const jobResult = await db
      .select({ recruiterId: jobPostings.recruiterId })
      .from(jobPostings)
      .where(eq(jobPostings.id, jobPostingId))
      .limit(1);
    
    if (!jobResult.length) {
      return res.status(404).json({ error: 'Job posting not found' });
    }
    
    const recruiterId = jobResult[0].recruiterId;
    
    // Check limit for the recruiter who owns the job
    const limitCheck = await subscriptionService.checkJobApplicationLimit(recruiterId, jobPostingId, currentApplicants);
    
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'Application limit exceeded for this job',
        message: `This job has reached its applicant limit of ${limitCheck.limit}. The recruiter needs to upgrade to Premium for unlimited applicants.`,
        currentUsage: currentApplicants,
        limit: limitCheck.limit
      });
    }
    
    next();
  } catch (error) {
    console.error('Applicant limit check failed:', error);
    res.status(500).json({ error: 'Failed to check application limits' });
  }
};

// Middleware to check test/interview assignment limits
export const checkTestInterviewLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    
    // Count current active test assignments
    const testAssignmentsResult = await db
      .select({ count: count() })
      .from(testAssignments)
      .where(eq(testAssignments.recruiterId, userId));
    
    // Count current virtual interviews assigned by this recruiter
    const virtualInterviewsResult = await db
      .select({ count: count() })
      .from(virtualInterviews)
      .where(eq(virtualInterviews.assignedBy, userId));
    
    // Count current mock interviews assigned by this recruiter
    const mockInterviewsResult = await db
      .select({ count: count() })
      .from(mockInterviews)
      .where(eq(mockInterviews.assignedBy, userId));
    
    const totalAssignments = 
      (testAssignmentsResult[0]?.count || 0) + 
      (virtualInterviewsResult[0]?.count || 0) + 
      (mockInterviewsResult[0]?.count || 0);
    
    // Check limit
    const limitCheck = await subscriptionService.checkTestInterviewLimit(userId, totalAssignments);
    
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'Test/Interview assignment limit exceeded',
        message: `You have reached your limit of ${limitCheck.limit} combined test and interview assignments. Upgrade to Premium for unlimited assignments.`,
        currentUsage: totalAssignments,
        limit: limitCheck.limit,
        upgradeRequired: true
      });
    }
    
    // Add limit info to request for use in route handlers
    req.limitInfo = {
      currentUsage: totalAssignments,
      limit: limitCheck.limit,
      remaining: limitCheck.remaining
    };
    
    next();
  } catch (error) {
    console.error('Test/Interview limit check failed:', error);
    res.status(500).json({ error: 'Failed to check assignment limits' });
  }
};

// Middleware to check chat access
export const checkChatAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    
    // Check if user can access chat
    const canChat = await subscriptionService.canAccessFeature(userId, 'chatMessages');
    
    if (!canChat) {
      return res.status(403).json({
        error: 'Chat access restricted',
        message: 'Chat functionality is available with Premium plans. Upgrade to start messaging candidates.',
        upgradeRequired: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Chat access check failed:', error);
    res.status(500).json({ error: 'Failed to check chat access' });
  }
};

// Middleware to check resume viewing access (with AI score restrictions)
export const checkResumeAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    
    // Check if user can view resumes
    const canViewResumes = await subscriptionService.canAccessFeature(userId, 'resumeViewing');
    
    if (!canViewResumes) {
      return res.status(403).json({
        error: 'Resume access restricted',
        message: 'Resume viewing is not available on your current plan.',
        upgradeRequired: true
      });
    }
    
    // Add feature flags to request
    const canUseBasicAI = await subscriptionService.canAccessFeature(userId, 'basicAIScore');
    const canUseAdvancedAnalytics = await subscriptionService.canAccessFeature(userId, 'advancedResumeAnalytics');
    
    req.featureFlags = {
      basicAIScore: canUseBasicAI,
      advancedResumeAnalytics: canUseAdvancedAnalytics
    };
    
    next();
  } catch (error) {
    console.error('Resume access check failed:', error);
    res.status(500).json({ error: 'Failed to check resume access' });
  }
};

// Middleware to check premium targeting access
export const checkPremiumTargetingAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    
    // Check if user can access premium targeting
    const canUsePremiumTargeting = await subscriptionService.canAccessFeature(userId, 'premiumTargeting');
    
    if (!canUsePremiumTargeting) {
      return res.status(403).json({
        error: 'Premium targeting access restricted',
        message: 'Advanced targeting and AI filters are available with Premium plans. Upgrade to access these features.',
        upgradeRequired: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Premium targeting access check failed:', error);
    res.status(500).json({ error: 'Failed to check premium targeting access' });
  }
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      limitInfo?: {
        currentUsage: number;
        limit: number;
        remaining: number;
      };
      featureFlags?: {
        basicAIScore: boolean;
        advancedResumeAnalytics: boolean;
      };
    }
  }
}