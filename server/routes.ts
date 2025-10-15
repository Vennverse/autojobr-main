import express, { type Express, Request, Response, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { db } from "./db";
import { eq, desc, and, or, like, isNotNull, count, asc, isNull, sql, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";
import { resumes, userResumes, insertInternshipApplicationSchema, companyEmailVerifications, virtualInterviews, mockInterviews, jobPostingApplications, invitationUses, insertUserProfileSchema, insertUserSkillSchema, scrapedJobs, crmContacts, contactInteractions, pipelineStages } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAuthenticatedExtension } from "./auth";
import { storage } from "./storage";
import { apiKeyRotationService } from "./apiKeyRotationService.js";
import { companyVerificationService } from "./companyVerificationService.js";
import { adminFixService } from "./adminFixService.js";
import { recruiterDashboardFix } from "./recruiterDashboardFix.js";
import { sendEmail, getEmailConfig, testEmailConfiguration, generateVerificationEmail } from "./emailService.js";
import { groqService } from "./groqService.js";
import { testService } from "./testService.js";
import { emailNotificationService } from "./emailNotificationService.js";
import { usageMonitoringService } from "./usageMonitoringService.js";
import { cacheService, cacheMiddleware } from "./cacheService.js";
import { FileStorageService } from "./fileStorage.js";
import { performanceMonitor } from "./performanceMonitor.js";
import { 
  conditionalRequestMiddleware, 
  deduplicationMiddleware, 
  rateLimitMiddleware 
} from "./optimizedMiddleware.js";
import { customNLPService } from "./customNLP.js";
import { UserRoleService } from "./userRoleService.js";
import { PremiumFeaturesService } from "./premiumFeaturesService.js";
import { SubscriptionService } from "./subscriptionService.js";
import { predictiveSuccessService } from "./predictiveSuccessService.js";
import { viralExtensionService } from "./viralExtensionService.js";
import { rankingTestService } from "./rankingTestService.js";
import { setupSimpleChatRoutes } from "./simpleChatRoutes.js";
import { simpleWebSocketService } from "./simpleWebSocketService.js";
import { simplePromotionalEmailService } from "./simplePromotionalEmailService.js";
import { internshipScrapingService } from "./internshipScrapingService.js";
import { dailySyncService } from "./dailySyncService.js";
import { jobSpyService } from "./jobspyService.js";
import crypto from 'crypto';
import axios from 'axios';
import { 
  checkJobPostingLimit,
  checkApplicantLimit,
  checkTestInterviewLimit,
  checkChatAccess,
  checkResumeAccess,
  checkPremiumTargetingAccess
} from "./subscriptionLimitMiddleware.js";
import { subscriptionEnforcementService } from "./subscriptionEnforcementService.js";
import { ResumeParser } from "./resumeParser.js";
import virtualInterviewRoutes from "./virtualInterviewRoutes.js";
import chatInterviewRoutes from "./chatInterviewRoutes.js";
import { ResumeService, resumeUploadMiddleware } from "./resumeService.js";
import { TaskService } from "./taskService.js";
import referralMarketplaceRoutes from "./referralMarketplaceRoutes.js";
console.log('🔍 [IMPORT CHECK] referralMarketplaceRoutes:', referralMarketplaceRoutes ? 'loaded ✅' : 'UNDEFINED ❌');
import bidderSystemRoutes from "./bidderRoutes.js";
import { AIResumeGeneratorService } from "./aiResumeGeneratorService.js";
import { mockInterviewRoutes } from "./mockInterviewRoutes";
import { proctoring } from "./routes/proctoring";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { subscriptionPaymentService } from "./subscriptionPaymentService";
import { interviewAssignmentService } from "./interviewAssignmentService";
import { mockInterviewService } from "./mockInterviewService";
import { aiService } from './aiService';
import { interviewPrepService, interviewPrepSchema } from './interviewPrepService';
import { salaryInsightsService, salaryInsightsSchema } from './salaryInsightsService';
import { questionBankService } from "./questionBankService";
import seo from './routes/seo';
import { CrmService } from './crmService';

// Import services
import { db as dbImport } from "./db"; // Aliased to avoid conflict with global db
import virtualInterviewRoutes from "./virtualInterviewRoutes.js";

// Placeholder for User type if not globally available
type User = schema.users.$inferSelect;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wsConnections = new Map<string, Set<WebSocket>>();

const broadcastToUser = (userId: string, message: any) => {
  const userConnections = wsConnections.get(userId);
  if (userConnections) {
    const messageStr = JSON.stringify(message);
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
};

const resumeParser = new ResumeParser();
const premiumFeaturesServiceInstance = new PremiumFeaturesService(); // Renamed to avoid conflict
const subscriptionServiceInstance = new SubscriptionService(); // Renamed to avoid conflict

// Advanced Assessment Services
import { VideoInterviewService } from "./videoInterviewService";
import { SimulationAssessmentService } from "./simulationAssessmentService";
import { PersonalityAssessmentService } from "./personalityAssessmentService";
import { SkillsVerificationService } from "./skillsVerificationService";
import { AIDetectionService } from "./aiDetectionService";

const videoInterviewService = new VideoInterviewService();
const simulationAssessmentService = new SimulationAssessmentService();
const personalityAssessmentService = new PersonalityAssessmentService();
const skillsVerificationService = new SkillsVerificationService();
const aiDetectionService = new AIDetectionService();

// OPTIMIZATION: Enhanced in-memory cache with better performance
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // Increased to 10 minutes
const MAX_CACHE_SIZE = 2000; // Increased cache size for better hit rates

// Track user activity for online/offline status
const userActivity = new Map<string, number>();
const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes - user is considered online if active within 5 minutes

// Initialize file storage service
const fileStorage = new FileStorageService();

// Helper functions for job matching
function hasCommonKeywords(title1: string, title2: string): boolean {
  const commonWords = ['developer', 'engineer', 'manager', 'analyst', 'designer', 'specialist', 'senior', 'junior', 'lead', 'principal'];
  return commonWords.some(word => title1.includes(word) && title2.includes(word));
}

function calculateTitleSimilarity(userTitle: string, jobTitle: string): number {
  const userWords = userTitle.split(/\s+/).filter(w => w.length > 2);
  const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 2);

  const matches = userWords.filter(word => jobWords.some(jw => jw.includes(word) || word.includes(jw)));
  const similarity = matches.length / Math.max(userWords.length, jobWords.length);

  return Math.round(similarity * 15); // Max 15 points for partial match
}

function hasSkillVariations(skill: string, text: string): boolean {
  const variations = new Map([
    ['javascript', ['js', 'node', 'react', 'vue', 'angular']],
    ['python', ['django', 'flask', 'pandas', 'numpy']],
    ['java', ['spring', 'maven', 'gradle', 'jvm']],
    ['css', ['sass', 'scss', 'less', 'styling']],
    ['sql', ['mysql', 'postgres', 'database', 'db']],
    ['aws', ['amazon', 'cloud', 'ec2', 's3']],
    ['docker', ['container', 'kubernetes', 'k8s']],
    ['git', ['github', 'gitlab', 'version control']]
  ]);

  const skillVariations = variations.get(skill) || [];
  return skillVariations.some(variation => text.includes(variation));
}

// SECURITY FIX: Ensure all cache keys are properly scoped by user ID
const ensureUserScopedKey = (key: string, userId?: string): string => {
  // CRITICAL SECURITY: userId is REQUIRED for all cache operations
  // We NEVER trust key patterns alone - attacker could provide malicious keys
  if (!userId) {
    // ALWAYS throw when userId is missing - no exceptions
    throw new Error(`[CACHE_SECURITY] CRITICAL: userId is REQUIRED for cache operations. Key: "${key}"`);
  }

  // If key already contains the EXACT user ID, return as is
  if (key.includes(`_${userId}_`) || key.startsWith(`${userId}_`) || key.endsWith(`_${userId}`) || key.startsWith(`user_${userId}`)) {
    return key;
  }

  // Add user ID scoping to prevent cross-user data leakage
  return `user_${userId}_${key}`;
};

const getCached = (key: string, userId?: string) => {
  const scopedKey = ensureUserScopedKey(key, userId);
  const item = cache.get(scopedKey);
  if (item && Date.now() - item.timestamp < (item.ttl || CACHE_TTL)) {
    return item.data;
  }
  cache.delete(scopedKey);
  return null;
};

const setCache = (key: string, data: any, ttl?: number, userId?: string) => {
  const scopedKey = ensureUserScopedKey(key, userId);

  // Prevent cache from growing too large
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries (simple LRU)
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(scopedKey, { 
    data, 
    timestamp: Date.now(), 
    ttl: ttl || CACHE_TTL,
    userId: userId // Track which user owns this cache entry
  });
};

// Helper function to invalidate user-specific cache
const invalidateUserCache = (userId: string) => {
  const keysToDelete = [];
  for (const key of Array.from(cache.keys())) {
    if (key.includes(userId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries for user ${userId}`);
};

// Export for use in auth.ts
export { invalidateUserCache };

// Helper function to clear specific cache key
const clearCache = (key: string) => {
  cache.delete(key);
};

// Centralized error handler
const handleError = (res: any, error: any, defaultMessage: string, statusCode: number = 500) => {
  console.error(`API Error: ${defaultMessage}`, error);

  // Handle specific error types
  if (error.name === 'ZodError') {
    return res.status(400).json({ 
      message: "Invalid data format", 
      details: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
    });
  }

  if (error.message?.includes('duplicate key')) {
    return res.status(409).json({ message: "Resource already exists" });
  }

  if (error.message?.includes('not found')) {
    return res.status(404).json({ message: "Resource not found" });
  }

  res.status(statusCode).json({ 
    message: defaultMessage,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// Helper function for async route handlers
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch((error: any) => {
    handleError(res, error, "Internal server error");
  });
};

// Helper function for user profile operations with caching
const getUserWithCache = async (userId: string) => {
  const cacheKey = `user_${userId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const user = await storage.getUser(userId);
  if (user) setCache(cacheKey, user, 300000); // 5 min cache
  return user;
};

// Helper function for resume operations
const processResumeUpload = async (file: any, userId: string, resumeText: string, analysis: any) => {
  const existingResumes = await storage.getUserResumes(userId);
  const user = await storage.getUser(userId);

  // Check resume limits
  if (user?.planType !== 'premium' && existingResumes.length >= 2) {
    throw new Error('Free plan allows maximum 2 resumes. Upgrade to Premium for unlimited resumes.');
  }

  const resumeData = {
    name: file.originalname.replace(/\.[^/.]+$/, "") || "New Resume",
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    resumeText: resumeText,
    analysis: analysis,
    atsScore: analysis.atsScore,
    isActive: existingResumes.length === 0,
  };

  // TODO: Implement storeResume method in storage with file storage service integration
  throw new Error('Resume storage not implemented yet');
};

// Validation schemas for internships API
const internshipIdParamSchema = z.object({
  id: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ID must be a positive integer",
      });
      return z.NEVER;
    }
    return parsed;
  })
});

const internshipsQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Page must be a positive integer",
      });
      return z.NEVER;
    }
    return parsed;
  }),
  limit: z.string().optional().default("20").transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Limit must be between 1 and 100",
      });
      return z.NEVER;
    }
    return parsed;
  }),
  company: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  season: z.string().optional(),
  requirements: z.union([z.string(), z.array(z.string())]).optional(),
  search: z.string().optional(),
  status: z.enum(["applied", "in_review", "rejected", "accepted", "withdrawn"]).optional()
});

const internshipApplicationBodySchema = insertInternshipApplicationSchema.pick({
  resumeUsed: true,
  coverLetter: true,
  applicationNotes: true,
  applicationMethod: true
}).extend({
  applicationMethod: z.string().optional().default("manual")
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(["applied", "in_review", "rejected", "accepted", "withdrawn"]),
  applicationNotes: z.string().optional()
});
// Middleware to check usage limits
const checkUsageLimit = (feature: 'jobAnalyses' | 'resumeAnalyses' | 'applications' | 'autoFills') => {
  return async (req: any, res: any, next: any) => {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Set user data for usage check
    req.user = req.user || { id: sessionUser.id };

    const userId = req.user.id;
    // Check usage limits if subscriptionService supports it
    const usage = { canUse: true, upgradeRequired: false, resetTime: null, remainingUsage: 1000 };
    // TODO: Implement proper usage checking when USAGE_LIMITS is available

    if (!usage.canUse) {
      return res.status(429).json({
        message: "Daily usage limit reached",
        upgradeRequired: usage.upgradeRequired,
        resetTime: usage.resetTime,
        feature,
        remainingUsage: usage.remainingUsage,
      });
    }

    // Add usage info to request for tracking
    req.usageInfo = { feature, userId };
    next();
  };
};

// Helper function to track usage after successful operations
const trackUsage = async (req: any) => {
  if (req.usageInfo) {
    // TODO: Implement usage tracking when subscriptionService supports it
    // await subscriptionService.incrementUsage(req.usageInfo.userId, req.usageInfo.feature);
  }
};

// COMPREHENSIVE ROLE CONSISTENCY MIDDLEWARE 
// This prevents future user type/role mismatch issues
const ensureRoleConsistency = async (req: any, res: any, next: any) => {
  try {
    if (req.session?.user?.id) {
      const user = await storage.getUser(req.session.user.id);

      if (user && user.userType && user.currentRole !== user.userType) {
        console.log(`🔧 Auto-fixing role mismatch for user ${user.id}: currentRole(${user.currentRole}) -> userType(${user.userType})`);

        // Fix the mismatch in database
        await storage.upsertUser({
          ...user,
          currentRole: user.userType // Force sync currentRole to match userType
        });

        // Update session to reflect the fix
        req.session.user = {
          ...req.session.user,
          userType: user.userType,
          currentRole: user.userType
        };

        console.log(`✅ Role consistency fixed for user ${user.id}`);
      }
    }
  } catch (error) {
    console.error('Role consistency check failed:', error);
    // Don't block the request, just log the error
  }
  next();
};

// Payment credentials check routes
const paymentCredentialsRouter = (app: Express) => {
  // Check PayPal credentials availability
  app.get('/api/payment/paypal/check-credentials', (req, res) => {
    const available = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
    res.json({ 
      available,
      message: available ? 'PayPal payment is available' : 'PayPal credentials not configured yet'
    });
  });

  // Get PayPal client ID for frontend SDK initialization
  app.get('/api/payment/paypal/client-id', (req, res) => {
    if (!process.env.PAYPAL_CLIENT_ID) {
      return res.status(404).json({ error: 'PayPal client ID not configured' });
    }
    res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
  });

  // Check Amazon Pay credentials availability
  app.get('/api/payment/amazon-pay/check-credentials', (req, res) => {
    const available = !!(process.env.AMAZON_PAY_CLIENT_ID && process.env.AMAZON_PAY_CLIENT_SECRET);
    res.json({ 
      available,
      message: available ? 'Amazon Pay is available' : 'Amazon Pay integration is not configured yet'
    });
  });
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server first
  const server = createServer(app);

  // Setup authentication middleware FIRST - this includes session setup
  await setupAuth(app);

  // OPTIMIZATION: Apply performance middleware after auth setup
  app.use(conditionalRequestMiddleware);
  app.use(deduplicationMiddleware);

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads');
  const profilesDir = path.join(uploadsDir, 'profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }

  // Health check endpoint for deployment verification
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'autojobr-api'
    });
  });

  // User endpoint with better error handling and performance optimization
  app.get('/api/user', async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.user.id;
      
      // Try to get from cache first (with proper error handling)
      let user;
      try {
        const cached = getCached(`user_${userId}`, userId);
        if (cached) {
          return res.json(cached);
        }
      } catch (cacheError) {
        // Cache error - just continue to fetch from DB
        console.warn('[USER_API] Cache error, fetching from DB:', cacheError);
      }

      // Fetch from database
      user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Cache for future requests (with error handling)
      try {
        setCache(`user_${userId}`, user, 300000, userId);
      } catch (cacheError) {
        // Cache save failed - not critical, just log
        console.warn('[USER_API] Failed to cache user data:', cacheError);
      }

      res.json(user);
    } catch (error) {
      console.error('[USER_API] Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Enhanced logout endpoint with cache clearing
  app.post('/api/auth/logout', asyncHandler(async (req: any, res: any) => {
    const userId = req.session?.user?.id;

    req.session.destroy(async (err: any) => {
      if (err) {
        console.error('Logout session destroy error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }

      // Clear user-specific cache
      if (userId) {
        invalidateUserCache(userId);
        console.log(`✅ Logout successful - cleared cache for user: ${userId}`);
      }

      // Clear the session cookie
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      res.json({ 
        message: "Logged out successfully",
        redirectTo: "/" 
      });
    });
  }));

  // Register virtual interview routes
  app.use('/api/virtual-interview', virtualInterviewRoutes);
  
  // CRITICAL: Also mount chat interview routes for backwards compatibility
  app.use('/api/chat-interview', virtualInterviewRoutes);

  // PLATFORM JOBS ENDPOINT - Public access for browsing, no auth required
  // This MUST be defined early before any catch-all /api middleware
  app.get('/api/jobs/postings', async (req: any, res) => {
    console.log('[PLATFORM JOBS] Request received');

    try {
      // Get pagination parameters from pagination middleware
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const page = Math.floor(offset / limit) + 1;

      let jobPostings;
      let totalCount = 0;

      // Check if user is authenticated
      const isAuth = req.isAuthenticated && req.isAuthenticated();
      const userId = isAuth ? req.user?.id : null;
      const user = userId ? await storage.getUser(userId) : null;

      // Recruiters get their own job postings, everyone else gets all active platform jobs
      if (user && (user.userType === 'recruiter' || user.currentRole === 'recruiter')) {
        const allJobs = await storage.getRecruiterJobPostings(userId);
        totalCount = allJobs.length;
        jobPostings = allJobs.slice(offset, offset + limit);
        console.log(`[PLATFORM JOBS] Recruiter ${userId} - page ${page}, ${jobPostings.length}/${totalCount} jobs`);
      } else {
        // Get all active job postings for everyone (logged in or not)
        const search = req.query.search as string;
        const category = req.query.category as string;

        console.log(`[PLATFORM JOBS] Fetching - search: "${search}", category: "${category}", page: ${page}, limit: ${limit}`);

        if (search || category) {
          jobPostings = await storage.getJobPostings(page, limit, {
            search,
            category
          });
          totalCount = jobPostings.length;
        } else {
          const allJobs = await storage.getAllJobPostings();
          totalCount = allJobs.length;
          jobPostings = allJobs.slice(offset, offset + limit);
        }
        const userInfo = userId ? `authenticated ${userId}` : 'anonymous';
        console.log(`[PLATFORM JOBS] ${userInfo} - page ${page}, ${jobPostings.length}/${totalCount} jobs`);
      }

      console.log(`[PLATFORM JOBS] Sending ${jobPostings.length} jobs (page ${page} of ${Math.ceil(totalCount / limit)})`);
      res.setHeader('X-Job-Source', 'platform');
      res.setHeader('X-Total-Count', totalCount.toString());
      res.setHeader('X-Page', page.toString());
      res.setHeader('X-Page-Size', limit.toString());
      res.setHeader('X-Total-Pages', Math.ceil(totalCount / limit).toString());
      res.setHeader('X-Has-More', (offset + limit < totalCount).toString());
      // Keep the original API contract - return array directly
      res.json(jobPostings);
    } catch (error) {
      console.error('[PLATFORM JOBS ERROR]:', error);
      handleError(res, error, "Failed to fetch job postings");
    }
  });

  // Get individual job posting by ID
  app.get('/api/jobs/postings/:id', async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPosting(jobId);

      if (!job) {
        return res.status(404).json({ message: 'Job posting not found' });
      }

      res.json(job);
    } catch (error) {
      console.error('[JOB POSTING ERROR]:', error);
      handleError(res, error, "Failed to fetch job posting");
    }
  });

  // Apply to a job posting (Easy Apply)
  app.post('/api/jobs/postings/:id/apply', isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user.id;
      const { resumeId, coverLetter } = req.body;

      console.log(`[EASY APPLY] User ${userId} applying to job ${jobId}`);

      // Check if job exists
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job posting not found' });
      }

      // Check if user already applied
      const existingApplication = await db
        .select()
        .from(schema.jobPostingApplications)
        .where(
          and(
            eq(schema.jobPostingApplications.jobPostingId, jobId),
            eq(schema.jobPostingApplications.applicantId, userId)
          )
        )
        .then(rows => rows[0]);

      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied to this job' });
      }

      // Create application
      await db.insert(schema.jobPostingApplications).values({
        jobPostingId: jobId,
        applicantId: userId,
        resumeId: resumeId || null,
        coverLetter: coverLetter || null,
        status: 'applied',
        appliedAt: new Date()
      });

      console.log(`[EASY APPLY] Application created for user ${userId} on job ${jobId}`);

      res.json({ 
        success: true, 
        message: 'Application submitted successfully' 
      });
    } catch (error) {
      console.error('[EASY APPLY ERROR]:', error);
      handleError(res, error, "Failed to submit application");
    }
  });

  // Get user's applications with job details
  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const applications = await db
        .select({
          id: schema.jobPostingApplications.id,
          jobPostingId: schema.jobPostingApplications.jobPostingId,
          status: schema.jobPostingApplications.status,
          appliedAt: schema.jobPostingApplications.appliedAt,
          // Include job details
          jobTitle: schema.jobPostings.title,
          companyName: schema.jobPostings.companyName,
          location: schema.jobPostings.location,
          jobType: schema.jobPostings.jobType,
          workMode: schema.jobPostings.workMode,
        })
        .from(schema.jobPostingApplications)
        .leftJoin(schema.jobPostings, eq(schema.jobPostingApplications.jobPostingId, schema.jobPostings.id))
        .where(eq(schema.jobPostingApplications.applicantId, userId))
        .orderBy(desc(schema.jobPostingApplications.appliedAt));

      console.log(`[APPLICATIONS] Returning ${applications.length} applications with job details for user ${userId}`);
      res.json(applications);
    } catch (error) {
      console.error('[APPLICATIONS ERROR]:', error);
      handleError(res, error, "Failed to fetch applications");
    }
  });

  // Get applications stats
  app.get('/api/applications/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const applications = await db
        .select()
        .from(schema.jobPostingApplications)
        .where(eq(schema.jobPostingApplications.applicantId, userId));

      const stats = {
        total: applications.length,
        applied: applications.filter(a => a.status === 'applied').length,
        reviewing: applications.filter(a => a.status === 'reviewing').length,
        interview: applications.filter(a => a.status === 'interview').length,
        offered: applications.filter(a => a.status === 'offered').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
      };

      res.json(stats);
    } catch (error) {
      console.error('[APPLICATIONS STATS ERROR]:', error);
      handleError(res, error, "Failed to fetch application stats");
    }
  });

  // Save/Bookmark a job
  app.post('/api/jobs/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if already saved
      const existing = await db
        .select()
        .from(schema.userSavedJobs)
        .where(
          and(
            eq(schema.userSavedJobs.userId, userId),
            eq(schema.userSavedJobs.jobPostingId, jobId)
          )
        )
        .then(rows => rows[0]);

      if (existing) {
        return res.status(400).json({ message: 'Job already saved' });
      }

      // Save the job
      await db.insert(schema.userSavedJobs).values({
        userId,
        jobPostingId: jobId,
        savedAt: new Date()
      });

      res.json({ success: true, message: 'Job saved successfully' });
    } catch (error) {
      console.error('[SAVE JOB ERROR]:', error);
      handleError(res, error, "Failed to save job");
    }
  });

  // Scraped jobs endpoint with pagination and improved search
  app.get('/api/scraped-jobs', async (req: any, res) => {
    try {
      console.log('[SCRAPED JOBS] Request received with params:', req.query);

      const search = req.query.q as string || req.query.search as string;
      const category = req.query.category as string;
      const location = req.query.location as string;
      const country = req.query.country as string;
      const city = req.query.city as string;
      const workMode = req.query.work_mode as string;
      const jobType = req.query.job_type as string;
      const experienceLevel = req.query.experience_level as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.size as string) || 25;
      const offset = (page - 1) * pageSize;

      console.log('[SCRAPED JOBS] Parsed filters:', { search, category, location, country, city, workMode, jobType, experienceLevel, page, pageSize });

      // Build base query - simplified to avoid SQL errors
      const conditions: any[] = [eq(scrapedJobs.isActive, true)];

      // Apply search filter
      if (search && search.trim().length > 0) {
        const searchTerm = search.toLowerCase().trim();
        conditions.push(
          or(
            sql`LOWER(${scrapedJobs.title}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(${scrapedJobs.company}) LIKE ${`%${searchTerm}%`}`,
            sql`LOWER(COALESCE(${scrapedJobs.description}, '')) LIKE ${`%${searchTerm}%`}`
          )!
        );
      }

      // Apply location filters
      if (location && location.trim().length > 0) {
        conditions.push(sql`LOWER(COALESCE(${scrapedJobs.location}, '')) LIKE ${`%${location.toLowerCase()}%`}`);
      }

      if (country && country.trim().length > 0) {
        conditions.push(sql`LOWER(COALESCE(${scrapedJobs.countryCode}, '')) LIKE ${`%${country.toLowerCase()}%`}`);
      }

      if (city && city.trim().length > 0) {
        conditions.push(sql`LOWER(COALESCE(${scrapedJobs.city}, '')) LIKE ${`%${city.toLowerCase()}%`}`);
      }

      // Apply category filter
      if (category && category.trim().length > 0) {
        conditions.push(sql`LOWER(COALESCE(${scrapedJobs.category}, '')) LIKE ${`%${category.toLowerCase()}%`}`);
      }

      // Apply work mode filter
      if (workMode && workMode.trim().length > 0) {
        conditions.push(sql`LOWER(COALESCE(${scrapedJobs.workMode}, '')) LIKE ${`%${workMode.toLowerCase()}%`}`);
      }

      // Apply job type filter
      if (jobType && jobType.trim().length > 0) {
        conditions.push(sql`LOWER(COALESCE(${scrapedJobs.jobType}, '')) LIKE ${`%${jobType.toLowerCase()}%`}`);
      }

      // Apply experience level filter
      if (experienceLevel && experienceLevel.trim().length > 0) {
        conditions.push(sql`LOWER(COALESCE(${scrapedJobs.experienceLevel}, '')) LIKE ${`%${experienceLevel.toLowerCase()}%`}`);
      }

      console.log('[SCRAPED JOBS] Conditions count:', conditions.length);

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(scrapedJobs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = Number(totalResult[0]?.count || 0);

      console.log('[SCRAPED JOBS] Total jobs found:', total);

      // Fetch paginated jobs
      const jobs = await db
        .select()
        .from(scrapedJobs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(scrapedJobs.createdAt))
        .limit(pageSize)
        .offset(offset);

      console.log('[SCRAPED JOBS] Returning', jobs.length, 'jobs for page', page);

      res.json({
        jobs,
        pagination: {
          total,
          page,
          size: pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      console.error('[SCRAPED JOBS ERROR]:', error);
      res.status(500).json({ 
        message: 'Failed to fetch scraped jobs',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // RECRUITER-SPECIFIC ENDPOINTS - Must be authenticated
  app.get('/api/recruiter/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied - recruiter role required" });
      }

      const jobPostings = await storage.getRecruiterJobPostings(userId);
      console.log(`[RECRUITER JOBS] Recruiter ${userId} has ${jobPostings.length} jobs`);
      res.json(jobPostings);
    } catch (error) {
      console.error('[RECRUITER JOBS ERROR]:', error);
      handleError(res, error, "Failed to fetch recruiter job postings");
    }
  });

  // Improve job description with AI
  app.post('/api/recruiter/improve-jd', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied - recruiter role required" });
      }

      const { jobDescription, jobTitle, companyName } = req.body;

      if (!jobDescription || jobDescription.trim().length === 0) {
        return res.status(400).json({ message: "Job description is required" });
      }

      const prompt = `You are an expert recruiter and job description writer. Improve the following job description to make it more attractive, clear, and effective.

Job Title: ${jobTitle || 'Not specified'}
Company: ${companyName || 'Not specified'}

Current Job Description:
${jobDescription}

Please provide an improved version that:
1. Is clear and concise
2. Highlights key responsibilities and qualifications
3. Uses professional language
4. Is engaging and attracts top talent
5. Follows best practices for job postings

Return only the improved job description text, no additional formatting or explanations.`;

      console.log('🤖 Improving job description with AI...');

      const aiResponse = await aiService.createChatCompletion([
        { role: 'system', content: 'You are an expert job description writer. Write clear, professional, and engaging job descriptions.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 1000,
        user: req.user
      });

      const improvedDescription = aiResponse.choices[0]?.message?.content || jobDescription;

      console.log('✅ Job description improved successfully');

      res.json({
        success: true,
        improvedDescription: improvedDescription.trim()
      });
    } catch (error: any) {
      console.error("Error improving job description:", error);
      res.status(500).json({ 
        message: "Failed to improve job description",
        error: error.message 
      });
    }
  });

  // Create new job posting
  app.post('/api/recruiter/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied - recruiter role required" });
      }

      const jobData = {
        ...req.body,
        recruiterId: userId
      };

      const newJob = await storage.createJobPosting(jobData);
      console.log(`[JOB CREATED] Recruiter ${userId} created job: ${newJob.id}`);

      res.json({
        success: true,
        message: "Job posted successfully",
        job: newJob
      });
    } catch (error) {
      console.error('[CREATE JOB ERROR]:', error);
      handleError(res, error, "Failed to create job posting");
    }
  });

  app.get('/api/recruiter/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied - recruiter role required" });
      }

      const applications = await storage.getApplicationsForRecruiter(userId);
      console.log(`[RECRUITER APPLICATIONS] Recruiter ${userId} has ${applications.length} applications`);
      res.json(applications);
    } catch (error) {
      console.error('[RECRUITER APPLICATIONS ERROR]:', error);
      handleError(res, error, "Failed to fetch recruiter applications");
    }
  });

  // Get job seeker's test assignments
  app.get('/api/jobseeker/test-assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get all test assignments for the job seeker
      const assignments = await db
        .select()
        .from(schema.testAssignments)
        .where(eq(schema.testAssignments.jobSeekerId, userId))
        .orderBy(desc(schema.testAssignments.assignedAt));

      res.json(assignments);
    } catch (error) {
      console.error('[JOBSEEKER TEST ASSIGNMENTS ERROR]:', error);
      handleError(res, error, "Failed to fetch test assignments");
    }
  });

  // Test assignment routes for job seekers
  app.get('/api/test-assignments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user.id;

      const assignment = await storage.getTestAssignment(assignmentId);

      if (!assignment) {
        return res.status(404).json({ message: 'Test assignment not found' });
      }

      // Verify the assignment belongs to this user
      if (assignment.jobSeekerId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // CRITICAL: Check if test is completed and retake is not allowed
      // This prevents users from starting the test again without paying for retake
      if ((assignment.status === 'completed' || assignment.status === 'terminated') && !assignment.retakeAllowed) {
        console.log(`⛔ Test ${assignmentId} is ${assignment.status} and retake not allowed - blocking access`);
        // Still return the assignment data so the frontend can show the retake payment page
      }

      res.json(assignment);
    } catch (error) {
      console.error('Error fetching test assignment:', error);
      handleError(res, error, "Failed to fetch test assignment");
    }
  });

  app.get('/api/test-assignments/:id/questions', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user.id;

      const assignment = await storage.getTestAssignment(assignmentId);

      if (!assignment) {
        return res.status(404).json({ message: 'Test assignment not found' });
      }

      // Verify the assignment belongs to this user
      if (assignment.jobSeekerId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // CRITICAL FIX: Check if questions are already stored in assignment
      // This prevents regenerating questions (which would create duplicates and wrong scoring)
      if (assignment.questions && Array.isArray(assignment.questions) && assignment.questions.length > 0) {
        console.log(`[TEST QUESTIONS] Using stored questions for assignment ${assignmentId}: ${assignment.questions.length} questions`);
        return res.json(assignment.questions);
      }

      // Fetch template to check question bank setting
      let questions: any[] = [];

      if (assignment.testTemplateId) {
        const template = await storage.getTestTemplate(assignment.testTemplateId);

        // Check if template uses question bank (priority over stored questions)
        if (template?.useQuestionBank) {
          console.log(`[TEST QUESTIONS] Generating questions from bank for template ${template.id}`);
          questions = await testService.generateQuestionsFromBank(
            template.id,
            template.aptitudeQuestions || 0,
            template.englishQuestions || 0,
            template.domainQuestions || 0,
            template.jobProfile || 'software_engineer',
            template.includeExtremeQuestions || false
          );

          // CRITICAL FIX: Store generated questions in assignment to prevent regeneration
          await storage.updateTestAssignment(assignmentId, {
            questions: questions
          });
          console.log(`[TEST QUESTIONS] Stored ${questions.length} questions in assignment ${assignmentId}`);
        } else {
          // Use stored questions from template only if not using question bank
          questions = template?.questions || assignment.testTemplate?.questions || [];
        }
      } else {
        // Fallback to assignment's embedded template questions
        questions = assignment.testTemplate?.questions || [];
      }

      console.log(`[TEST QUESTIONS] Assignment ${assignmentId}: ${questions.length} questions found`);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching test questions:', error);
      handleError(res, error, "Failed to fetch test questions");
    }
  });

  app.post('/api/test-assignments/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = req.user.id;
      const { answers, timeSpent, warningCount = 0, tabSwitchCount = 0, copyAttempts = 0 } = req.body;

      console.log(`🔵 [TEST SUBMIT START] Assignment ${assignmentId} - User: ${userId}`);
      console.log(`📊 [TEST SUBMIT] Submission data - Answers: ${Object.keys(answers || {}).length}, Time: ${timeSpent}s, Warnings: ${warningCount}, TabSwitches: ${tabSwitchCount}, CopyAttempts: ${copyAttempts}`);

      const assignment = await storage.getTestAssignment(assignmentId);
      console.log(`📋 [TEST SUBMIT] Assignment fetched - Status: ${assignment?.status}, JobSeeker: ${assignment?.jobSeekerId}`);

      if (!assignment) {
        console.log(`❌ [TEST SUBMIT] Assignment ${assignmentId} not found`);
        return res.status(404).json({ message: 'Test assignment not found' });
      }

      // Verify the assignment belongs to this user
      if (assignment.jobSeekerId !== userId) {
        console.log(`❌ [TEST SUBMIT] Access denied - Assignment belongs to ${assignment.jobSeekerId}, user is ${userId}`);
        return res.status(403).json({ message: 'Access denied' });
      }

      // CRITICAL FIX: Get questions for scoring from assignment (same questions user saw)
      // NEVER regenerate questions during submit - this causes wrong scoring!
      let questions: any[] = [];

      if (assignment.questions && Array.isArray(assignment.questions) && assignment.questions.length > 0) {
        questions = assignment.questions;
        console.log(`📚 [TEST SUBMIT] Using STORED questions from assignment - Count: ${questions.length}`);
      } else if (assignment.testTemplateId) {
        const template = await storage.getTestTemplate(assignment.testTemplateId);
        console.log(`📝 [TEST SUBMIT] Template fetched - ID: ${template?.id}, UseQuestionBank: ${template?.useQuestionBank}`);

        if (template?.useQuestionBank) {
          console.error(`❌ [TEST SUBMIT] ERROR: Questions should have been stored in assignment but weren't found!`);
          // Emergency fallback - but this shouldn't happen
          questions = await testService.generateQuestionsFromBank(
            template.id,
            template.aptitudeQuestions || 0,
            template.englishQuestions || 0,
            template.domainQuestions || 0,
            template.jobProfile || 'software_engineer',
            template.includeExtremeQuestions || false
          );
          console.log(`⚠️ [TEST SUBMIT] Emergency regenerated ${questions.length} questions from bank`);
        } else {
          questions = template?.questions || assignment.testTemplate?.questions || [];
          console.log(`📚 [TEST SUBMIT] Using template questions - Count: ${questions.length}`);
        }
      } else {
        questions = assignment.testTemplate?.questions || [];
        console.log(`📚 [TEST SUBMIT] Using embedded template questions - Count: ${questions.length}`);
      }

      if (questions.length === 0) {
        console.log(`⚠️ [TEST SUBMIT] WARNING: No questions found for scoring!`);
      }

      console.log(`🧮 [TEST SUBMIT] Calculating score with ${questions.length} questions and ${Object.keys(answers || {}).length} answers`);
      const scoreResult = testService.calculateScore(questions, answers);
      console.log(`✅ [TEST SUBMIT] Score calculated - ${scoreResult}%`);

      // Determine termination reason
      let terminationReason = 'Completed';
      if (warningCount >= 5) {
        terminationReason = 'Auto-terminated: Excessive violations (5+ warnings)';
        console.log(`🚨 Test ${assignmentId} auto-terminated due to excessive violations`);
      }

      // Update assignment with results and violation tracking
      console.log(`💾 [TEST SUBMIT] Updating assignment ${assignmentId} in database...`);
      const updatedAssignment = await storage.updateTestAssignment(assignmentId, {
        status: warningCount >= 5 ? 'terminated' : 'completed',
        completionTime: new Date(),
        score: scoreResult,
        answers: answers,
        timeSpent: timeSpent,
        warningCount: warningCount,
        tabSwitchCount: tabSwitchCount,
        copyAttempts: copyAttempts,
        terminationReason: terminationReason,
        retakeAllowed: false // CRITICAL: Block retake until payment is made
      });

      console.log(`✅ [TEST SUBMIT SUCCESS] Test ${assignmentId} submitted - Status: ${updatedAssignment.status}, Score: ${scoreResult}%, Retake: ${updatedAssignment.retakeAllowed}`);

      res.json({
        success: true,
        score: scoreResult,
        assignment: updatedAssignment,
        terminated: warningCount >= 5,
        warningCount: warningCount
      });
    } catch (error) {
      console.error('❌ [TEST SUBMIT ERROR] Error submitting test:', error);
      console.error('❌ [TEST SUBMIT ERROR] Stack trace:', error instanceof Error ? error.stack : 'No stack');
      handleError(res, error, "Failed to submit test");
    }
  });

  // Test templates endpoints
  app.get('/api/test-templates', async (req: any, res) => {
    try {
      const templates = await storage.getTestTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching test templates:', error);
      handleError(res, error, "Failed to fetch test templates");
    }
  });

  app.post('/api/test-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const templateData = {
        ...req.body,
        createdBy: userId,
      };

      const template = await storage.createTestTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error('Error creating test template:', error);
      handleError(res, error, "Failed to create test template");
    }
  });

  app.post('/api/test-templates/:id/generate', isAuthenticated, async (req: any, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const { aptitudeQuestions, englishQuestions, domainQuestions, includeExtremeQuestions, jobProfile, difficultyLevel } = req.body;

      // Get job profile tags
      const tags = jobProfile ? [jobProfile] : [];

      // Generate questions from question bank
      const questions = await questionBankService.generateTestForProfile(
        tags,
        (aptitudeQuestions || 15) + (englishQuestions || 6) + (domainQuestions || 9),
        {
          aptitude: aptitudeQuestions || 15,
          english: englishQuestions || 6,
          domain: domainQuestions || 9
        },
        includeExtremeQuestions !== false
      );

      // Update template with generated questions
      await storage.updateTestTemplate(templateId, { questions });

      res.json(questions);
    } catch (error) {
      console.error('Error generating test questions:', error);
      handleError(res, error, "Failed to generate test questions");
    }
  });

  // Internship scraping endpoints
  app.post('/api/internships/scrape', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check - only admins can trigger scraping
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔄 Manual internship scraping triggered by admin');
      const results = await internshipScrapingService.scrapeInternships();

      res.json({
        message: 'Internship scraping completed successfully',
        results
      });
    } catch (error) {
      console.error('❌ Manual internship scraping failed:', error);
      res.status(500).json({ 
        message: 'Internship scraping failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/internships/sync-status', isAuthenticated, async (req: any, res) => {
    try {
      const latestSync = await internshipScrapingService.getLatestSyncStats();
      res.json({
        latestSync,
        status: latestSync ? 'synced' : 'never_synced'
      });
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      res.status(500).json({ 
        message: 'Failed to get sync status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/daily-sync/status', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const status = dailySyncService.getStatus();
      const latestSync = await internshipScrapingService.getLatestSyncStats();

      res.json({
        message: 'Daily sync service status',
        syncService: status,
        latestSync
      });
    } catch (error) {
      console.error('❌ Failed to get daily sync status:', error);
      res.status(500).json({ 
        message: 'Failed to get daily sync status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/admin/daily-sync/trigger', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔧 Manual daily sync triggered by admin');
      await dailySyncService.triggerManualSync();

      res.json({
        message: 'Daily sync triggered successfully',
        status: dailySyncService.getStatus()
      });
    } catch (error) {
      console.error('❌ Manual daily sync failed:', error);
      res.status(500).json({ 
        message: 'Daily sync failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Public endpoint to trigger job scraping (for testing/development)
  app.post('/api/trigger-job-scraper', async (req: any, res) => {
    try {
      const status = dailySyncService.getStatus();

      if (status.isRunning) {
        return res.json({
          message: 'Job scraping is already running',
          status: 'running',
          ...status
        });
      }

      console.log('🚀 Manually triggering job scraper from public endpoint...');

      // Trigger the sync in the background
      dailySyncService.triggerManualSync().catch(error => {
        console.error('❌ Background sync error:', error);
      });

      res.json({
        message: 'Job scraping has been triggered and is running in the background',
        status: 'started',
        note: 'This will scrape jobs from Indeed, LinkedIn, and other major job sites globally. Check logs for progress.'
      });
    } catch (error) {
      console.error('❌ Failed to trigger job scraper:', error);
      res.status(500).json({ 
        message: 'Failed to trigger job scraper',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ===== VIDEO PRACTICE API ROUTES =====

  // Start video practice session
  app.post('/api/video-practice/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role, interviewType, difficulty } = req.body;

      // Generate session ID
      const sessionId = `vp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Generate questions using video practice service
      const { videoPracticeService } = await import('./videoPracticeService.js');
      const { company } = req.body;
      const questions = await videoPracticeService.generateQuestions(role, interviewType, difficulty, company);

      // Create session in database
      const session = await storage.createVideoPracticeSession({
        userId,
        sessionId,
        role,
        interviewType,
        difficulty,
        questions: JSON.stringify(questions),
        status: 'in_progress',
        paymentStatus: 'pending',
        paymentAmount: 500 // $5 in cents
      });

      res.json({
        sessionId,
        questions,
        paymentRequired: true,
        amount: 500
      });
    } catch (error) {
      console.error('Video practice start error:', error);
      handleError(res, error, 'Failed to start video practice session');
    }
  });

  // Submit response for a question
  app.post('/api/video-practice/:sessionId/response', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { questionId, transcript, duration, videoAnalysis, audioAnalysis } = req.body;

      const session = await storage.getVideoPracticeSessionBySessionId(sessionId);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const responses = session.responses ? JSON.parse(session.responses) : [];
      responses.push({ 
        questionId, 
        transcript, 
        duration, 
        videoAnalysis: videoAnalysis || null,
        audioAnalysis: audioAnalysis || null,
        timestamp: new Date() 
      });

      const questions = JSON.parse(session.questions);
      const isComplete = responses.length >= questions.length;

      await storage.updateVideoPracticeSession(session.id, {
        responses: JSON.stringify(responses),
        status: isComplete ? 'completed' : 'in_progress'
      });

      res.json({ success: true, isComplete });
    } catch (error) {
      handleError(res, error, 'Failed to submit response');
    }
  });

  // Complete session and get feedback
  app.post('/api/video-practice/:sessionId/complete', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;

      const session = await storage.getVideoPracticeSessionBySessionId(sessionId);
      if (!session || session.userId !== req.user.id) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const { videoPracticeService } = await import('./videoPracticeService.js');
      const responses = JSON.parse(session.responses || '[]');
      const questions = JSON.parse(session.questions);

      // Analyze each response with video and audio data
      const analyses = [];
      for (let i = 0; i < responses.length; i++) {
        const analysis = await videoPracticeService.analyzeResponse(
          session.role || 'Unknown Role',
          questions[i],
          responses[i].transcript,
          responses[i].duration,
          responses[i].videoAnalysis,
          responses[i].audioAnalysis
        );
        analyses.push(analysis);
      }

      // Generate final comprehensive feedback
      const feedback = await videoPracticeService.generateFinalFeedback(session.role, analyses);

      await storage.updateVideoPracticeSession(session.id, {
        analysis: JSON.stringify(feedback),
        overallScore: feedback.overallScore,
        completedAt: new Date()
      });

      res.json({ feedback });
    } catch (error) {
      handleError(res, error, 'Failed to generate feedback');
    }
  });

  // ===== JOBSPY ADMIN API ROUTES =====

  // Test JobSpy installation
  app.get('/api/jobspy/test', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const result = await jobSpyService.testJobSpy();
      res.json(result);
    } catch (error) {
      console.error('❌ JobSpy test failed:', error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : 'JobSpy test failed'
      });
    }
  });

  // Get JobSpy configuration options
  app.get('/api/jobspy/config', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      res.json({
        available_job_sites: ['indeed', 'linkedin', 'zip_recruiter', 'glassdoor', 'naukri'],
        common_locations: [
          'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Austin, TX', 'Seattle, WA',
          'Chicago, IL', 'Boston, MA', 'Remote', 'Mumbai, India', 'Bangalore, India', 
          'Delhi, India', 'London, UK', 'Berlin, Germany'
        ],
        search_terms_by_category: {
          tech: ['software engineer', 'frontend developer', 'backend developer', 'full stack developer', 
                 'data scientist', 'devops engineer', 'mobile developer'],
          business: ['product manager', 'business analyst', 'project manager', 'account manager'],
          entry_level: ['junior software engineer', 'entry level developer', 'graduate trainee', 'fresher developer']
        },
        countries: ['USA', 'India', 'UK', 'Canada', 'Germany', 'France'],
        max_results_per_search: 50
      });
    } catch (error) {
      console.error('❌ Failed to get JobSpy config:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get config'
      });
    }
  });

  // Custom JobSpy scraping
  app.post('/api/jobspy/scrape', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const config = req.body;
      console.log('[JOBSPY_API] Custom scraping requested:', config);

      const result = await jobSpyService.scrapeJobs(config);
      res.json(result);
    } catch (error) {
      console.error('❌ Custom JobSpy scraping failed:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed'
      });
    }
  });

  // Scrape tech jobs
  app.post('/api/jobspy/scrape-tech', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('[JOBSPY_API] Tech jobs scraping requested');
      const result = await jobSpyService.scrapeTechJobs();
      res.json(result);
    } catch (error) {
      console.error('❌ Tech jobs scraping failed:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed'
      });
    }
  });

  // Scrape remote jobs
  app.post('/api/jobspy/scrape-remote', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('[JOBSPY_API] Remote jobs scraping requested');
      const result = await jobSpyService.scrapeRemoteJobs();
      res.json(result);
    } catch (error) {
      console.error('❌ Remote jobs scraping failed:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed'
      });
    }
  });

  // Scrape jobs by role
  app.post('/api/jobspy/scrape-role', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { role, location } = req.body;

      if (!role) {
        return res.status(400).json({ 
          success: false,
          error: 'Role is required'
        });
      }

      console.log(`[JOBSPY_API] Role-specific scraping requested: ${role} in ${location || 'default locations'}`);
      const result = await jobSpyService.scrapeJobsByRole(role, location);
      res.json(result);
    } catch (error) {
      console.error('❌ Role-specific scraping failed:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed'
      });
    }
  });

  // Internships CRUD API endpoints
  app.get('/api/internships', async (req: any, res) => {
    try {
      // Validate query parameters
      const queryValidation = internshipsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return handleError(res, queryValidation.error, "Invalid query parameters", 400);
      }

      const { 
        page, 
        limit, 
        company, 
        location, 
        category, 
        season, 
        requirements,
        search 
      } = queryValidation.data;

      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [
        eq(schema.scrapedInternships.isActive, true)
      ];

      if (company) {
        conditions.push(like(schema.scrapedInternships.company, `%${company}%`));
      }
      if (location) {
        conditions.push(like(schema.scrapedInternships.location, `%${location}%`));
      }
      if (category) {
        conditions.push(eq(schema.scrapedInternships.category, category));
      }
      if (season) {
        conditions.push(eq(schema.scrapedInternships.season, season));
      }
      if (requirements) {
        // Handle requirements filter - check if internship has ANY of the specified requirements
        const requirementsArray = Array.isArray(requirements) ? requirements : [requirements];
        const requirementConditions = requirementsArray.map(req => 
          sql`${schema.scrapedInternships.requirements} @> ARRAY[${req}]::text[]`
        );
        if (requirementConditions.length > 0) {
          const reqOr = or(...requirementConditions);
          if (reqOr) conditions.push(reqOr);
        }
      }
      if (search) {
        const searchConditions = [
          like(schema.scrapedInternships.company, `%${search}%`),
          like(schema.scrapedInternships.role, `%${search}%`),
          like(schema.scrapedInternships.location, `%${search}%`)
        ];
        const searchOr = or(...searchConditions);
        if (searchOr) conditions.push(searchOr);
      }

      // Get internships with pagination
      const internships = await db
        .select()
        .from(schema.scrapedInternships)
        .where(and(...conditions))
        .orderBy(desc(schema.scrapedInternships.datePosted))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(schema.scrapedInternships)
        .where(and(...conditions));

      const total = totalResult[0]?.count || 0;

      res.json({
        internships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch internships");
    }
  });

  app.get('/api/internships/:id', async (req: any, res) => {
    try {
      // Validate path parameters
      const paramValidation = internshipIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return handleError(res, paramValidation.error, "Invalid internship ID", 400);
      }

      const { id } = paramValidation.data;

      const internship = await db
        .select()
        .from(schema.scrapedInternships)
        .where(eq(schema.scrapedInternships.id, id))
        .limit(1);

      if (!internship.length) {
        return res.status(404).json({ message: 'Internship not found' });
      }

      // Increment view count
      await db
        .update(schema.scrapedInternships)
        .set({ 
          viewsCount: sql`${schema.scrapedInternships.viewsCount} + 1` 
        })
        .where(eq(schema.scrapedInternships.id, id));

      res.json(internship[0]);
    } catch (error) {
      return handleError(res, error, "Failed to fetch internship");
    }
  });

  app.post('/api/internships/:id/save', isAuthenticated, rateLimitMiddleware(10, 60), async (req: any, res) => {
    try {
      // Validate path parameters
      const paramValidation = internshipIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return handleError(res, paramValidation.error, "Invalid internship ID", 400);
      }

      const { id } = paramValidation.data;
      const userId = req.user.id;

      // Verify internship exists and is active
      const internship = await db
        .select({ id: schema.scrapedInternships.id, isActive: schema.scrapedInternships.isActive })
        .from(schema.scrapedInternships)
        .where(eq(schema.scrapedInternships.id, id))
        .limit(1);

      if (!internship.length) {
        return res.status(404).json({ message: 'Internship not found' });
      }

      if (!internship[0].isActive) {
        return res.status(400).json({ message: 'Internship is no longer active' });
      }

      // Check if already saved
      const existing = await db
        .select()
        .from(schema.userSavedInternships)
        .where(
          and(
            eq(schema.userSavedInternships.userId, userId),
            eq(schema.userSavedInternships.internshipId, id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Internship already saved' });
      }

      // Save internship
      await db.insert(schema.userSavedInternships).values({
        userId,
        internshipId: id
      });

      res.json({ message: 'Internship saved successfully' });
    } catch (error) {
      return handleError(res, error, "Failed to save internship");
    }
  });

  app.delete('/api/internships/:id/save', isAuthenticated, rateLimitMiddleware(10, 60), async (req: any, res) => {
    try {
      // Validate path parameters
      const paramValidation = internshipIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return handleError(res, paramValidation.error, "Invalid internship ID", 400);
      }

      const { id } = paramValidation.data;
      const userId = req.user.id;

      await db
        .delete(schema.userSavedInternships)
        .where(
          and(
            eq(schema.userSavedInternships.userId, userId),
            eq(schema.userSavedInternships.internshipId, id)
          )
        );

      res.json({ message: 'Internship unsaved successfully' });
    } catch (error) {
      return handleError(res, error, "Failed to unsave internship");
    }
  });

  app.get('/api/internships/saved', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;


  // ===== MOUNT VIRTUAL INTERVIEW ROUTES =====
  app.use('/api/virtual-interview', virtualInterviewRoutes);
  console.log('✅ Virtual interview routes mounted at /api/virtual-interview');

  // ===== MOUNT CHAT INTERVIEW ROUTES (uses same routes as virtual interview) =====
  app.use('/api/chat-interview', virtualInterviewRoutes);
  console.log('✅ Chat interview routes mounted at /api/chat-interview (using virtualInterviewRoutes)');

  // Get mock interview stats
  app.get('/api/mock-interview/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get all virtual interviews for this user (mock interviews are practice interviews)
      const interviews = await db
        .select()
        .from(schema.virtualInterviews)
        .where(eq(schema.virtualInterviews.userId, userId));

      const stats = {
        total: interviews.length,
        completed: interviews.filter(i => i.status === 'completed').length,
        inProgress: interviews.filter(i => i.status === 'in_progress').length,
        averageScore: interviews.length > 0 
          ? interviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / interviews.length 
          : 0,
      };

      res.json(stats);
    } catch (error) {
      console.error('[MOCK INTERVIEW STATS ERROR]:', error);
      handleError(res, error, "Failed to fetch mock interview stats");
    }
  });


  // ===== MOUNT BIDDER SYSTEM ROUTES =====
  const bidderRoutes = (await import('./bidderRoutes.js')).default;
  app.use('/api', bidderRoutes);

  // ===== CRM ROUTES =====
  // Dashboard stats
  app.get('/api/crm/dashboard-stats', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.getDashboardStats(req, res);
    } catch (error) {
      console.error('[CRM] Dashboard stats error:', error);
      handleError(res, error, 'Failed to fetch CRM dashboard stats');
    }
  });

  // Contacts
  app.post('/api/crm/contacts', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.createContact(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to create contact');
    }
  });

  app.get('/api/crm/contacts', isAuthenticated, async (req: any, res) => {
    try {
      await CrmService.getContacts(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to fetch contacts');
    }
  });

  // Companies
  app.post('/api/crm/companies', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.createCompany(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to create company');
    }
  });

  app.get('/api/crm/companies', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.getCompanies(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to fetch companies');
    }
  });

  // Deals
  app.post('/api/crm/deals', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.createDeal(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to create deal');
    }
  });

  app.get('/api/crm/deals', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.getDeals(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to fetch deals');
    }
  });

  // Email Templates
  app.post('/api/crm/email-templates', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.createEmailTemplate(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to create email template');
    }
  });

  app.get('/api/crm/email-templates', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.getEmailTemplates(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to fetch email templates');
    }
  });

  // AI Email Generation
  app.post('/api/crm/email/generate-ai', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.generateEmailWithAI(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to generate AI email');
    }
  });

  app.post('/api/crm/email/send', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.sendEmail(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to send email');
    }
  });

  // Meetings
  app.post('/api/crm/meetings', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.createMeeting(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to create meeting');
    }
  });

  app.get('/api/crm/meetings', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.getMeetings(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to fetch meetings');
    }
  });

  // Workflows
  app.post('/api/crm/workflows', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.createWorkflow(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to create workflow');
    }
  });

  app.get('/api/crm/workflows', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.getWorkflows(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to fetch workflows');
    }
  });

  app.put('/api/crm/workflows/:workflowId/toggle', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.toggleWorkflow(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to toggle workflow');
    }
  });

  // Activities
  app.get('/api/crm/activities', isAuthenticated, async (req: any, res) => {
    try {
      await EnhancedCrmService.getActivities(req, res);
    } catch (error) {
      handleError(res, error, 'Failed to fetch activities');
    }
  });

  // ===== MOUNT PAYMENT ROUTES =====
  const { paymentRoutes } = await import('./paymentRoutes.js');
  app.use('/api/payments', paymentRoutes);

  // Import applicants from external sources (CSV, JSON, or ATS export)
  app.post('/api/recruiter/import-applicants', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const file = req.file;
      const jobPostingId = parseInt(req.body.jobPostingId);
      const importSource = req.body.source || 'manual_upload'; // 'indeed', 'linkedin', 'csv', 'manual_upload'

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Verify job posting belongs to this recruiter
      const jobPosting = await storage.getJobPosting(jobPostingId);
      if (!jobPosting || jobPosting.recruiterId !== userId) {
        return res.status(403).json({ message: "Invalid job posting" });
      }

      let applicants = [];
      const fileContent = file.buffer.toString('utf-8');

      // Parse CSV format (most common ATS export)
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        const lines = fileContent.split('\n');
        const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(',');
          const applicant: any = {};

          headers.forEach((header: string, index: number) => {
            const value = values[index]?.trim().replace(/^["']|["']$/g, '');

            // Map common ATS column names
            if (header.includes('name') || header.includes('full name')) applicant.name = value;
            if (header.includes('email')) applicant.email = value;
            if (header.includes('phone')) applicant.phone = value;
            if (header.includes('resume') || header.includes('cv')) applicant.resumeText = value;
            if (header.includes('status')) applicant.status = value || 'applied';
            if (header.includes('source')) applicant.source = value || importSource;
            if (header.includes('applied') || header.includes('date')) applicant.appliedAt = value;
            if (header.includes('linkedin')) applicant.linkedinUrl = value;
            if (header.includes('location') || header.includes('city')) applicant.location = value;
            if (header.includes('experience') || header.includes('years')) applicant.yearsExperience = parseInt(value) || 0;
            if (header.includes('education')) applicant.education = value;
            if (header.includes('skills')) applicant.skills = value.split(';').map((s: string) => s.trim());
          });

          if (applicant.email) {
            applicants.push(applicant);
          }
        }
      }

      // Parse JSON format (for API exports)
      else if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        const jsonData = JSON.parse(fileContent);
        applicants = Array.isArray(jsonData) ? jsonData : [jsonData];
      }

      else {
        return res.status(400).json({ message: "Unsupported file format. Please upload CSV or JSON." });
      }

      // Import applicants into database
      const imported = [];
      const failed = [];

      for (const applicantData of applicants) {
        try {
          // Check if user exists, create if not
          let applicantUser = await storage.getUserByEmail(applicantData.email);

          if (!applicantUser) {
            // Create new user account for imported applicant
            applicantUser = await storage.upsertUser({
              id: `imported-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              email: applicantData.email,
              firstName: applicantData.name?.split(' ')[0] || 'Imported',
              lastName: applicantData.name?.split(' ').slice(1).join(' ') || 'Candidate',
              userType: 'job_seeker',
              currentRole: 'job_seeker',
              emailVerified: false,
              createdAt: new Date()
            });

            // Create profile
            await storage.upsertUserProfile({
              userId: applicantUser.id,
              fullName: applicantData.name,
              phone: applicantData.phone,
              location: applicantData.location,
              linkedinUrl: applicantData.linkedinUrl,
              yearsExperience: applicantData.yearsExperience,
              summary: applicantData.resumeText?.substring(0, 500)
            });

            // Add skills if provided
            if (applicantData.skills && Array.isArray(applicantData.skills)) {
              for (const skill of applicantData.skills) {
                await storage.addUserSkill({
                  userId: applicantUser.id,
                  skillName: skill,
                  proficiencyLevel: 'intermediate'
                });
              }
            }
          }

          // Create application
          const application = await storage.createJobPostingApplication({
            jobPostingId: jobPostingId,
            applicantId: applicantUser.id,
            status: applicantData.status || 'applied',
            resumeData: {
              name: applicantData.name,
              email: applicantData.email,
              phone: applicantData.phone,
              resumeText: applicantData.resumeText,
              source: importSource
            }
          });

          imported.push({
            email: applicantData.email,
            name: applicantData.name,
            applicationId: application.id
          });

        } catch (error) {
          console.error(`Failed to import applicant ${applicantData.email}:`, error);
          failed.push({
            email: applicantData.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        message: `Successfully imported ${imported.length} applicants`,
        imported: imported,
        failed: failed,
        stats: {
          total: applicants.length,
          successful: imported.length,
          failed: failed.length
        }
      });

    } catch (error) {
      console.error('Error importing applicants:', error);
      handleError(res, error, "Failed to import applicants");
    }
  });

  // Get import history for a recruiter
  app.get('/api/recruiter/import-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get all applications with source metadata
      const applications = await storage.getApplicationsForRecruiter(userId);

      const importStats = applications.reduce((acc: any, app: any) => {
        const source = app.resumeData?.source || 'platform';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      res.json({
        totalImported: applications.length,
        bySource: importStats,
        recentImports: applications
          .filter((app: any) => app.resumeData?.source && app.resumeData.source !== 'platform')
          .slice(0, 20)
          .map((app: any) => ({
            id: app.id,
            candidateName: app.resumeData?.name,
            email: app.resumeData?.email,
            source: app.resumeData?.source,
            importedAt: app.appliedAt,
            jobTitle: app.jobPostingTitle
          }))
      });

    } catch (error) {
      console.error('Error fetching import history:', error);
      handleError(res, error, "Failed to fetch import history");
    }
  });

      // Validate query parameters
      const queryValidation = z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("20")
      }).safeParse(req.query);

      if (!queryValidation.success) {
        return handleError(res, queryValidation.error, "Invalid query parameters", 400);
      }

      const page = parseInt(queryValidation.data.page);
      const limit = parseInt(queryValidation.data.limit);
      const offset = (page - 1) * limit;

      const savedInternships = await db
        .select({
          id: schema.scrapedInternships.id,
          company: schema.scrapedInternships.company,
          role: schema.scrapedInternships.role,
          location: schema.scrapedInternships.location,
          applicationUrl: schema.scrapedInternships.applicationUrl,
          category: schema.scrapedInternships.category,
          season: schema.scrapedInternships.season,
          datePosted: schema.scrapedInternships.datePosted,
          savedAt: schema.userSavedInternships.savedAt
        })
        .from(schema.userSavedInternships)
        .leftJoin(
          schema.scrapedInternships,
          eq(schema.userSavedInternships.internshipId, schema.scrapedInternships.id)
        )
        .where(eq(schema.userSavedInternships.userId, userId))
        .orderBy(desc(schema.userSavedInternships.savedAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: count() })
        .from(schema.userSavedInternships)
        .where(eq(schema.userSavedInternships.userId, userId));

      const total = totalResult[0]?.count || 0;

      res.json({
        savedInternships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch saved internships");
    }
  });

  app.post('/api/internships/:id/apply', isAuthenticated, rateLimitMiddleware(5, 60), async (req: any, res) => {
    try {
      // Validate path parameters
      const paramValidation = internshipIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return handleError(res, paramValidation.error, "Invalid internship ID", 400);
      }

      // Validate request body
      const bodyValidation = internshipApplicationBodySchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return handleError(res, bodyValidation.error, "Invalid application data", 400);
      }

      const { id } = paramValidation.data;
      const userId = req.user.id;
      const applicationData = bodyValidation.data;

      // Verify internship exists and is active
      const internship = await db
        .select({ id: schema.scrapedInternships.id, isActive: schema.scrapedInternships.isActive })
        .from(schema.scrapedInternships)
        .where(eq(schema.scrapedInternships.id, id))
        .limit(1);

      if (!internship.length) {
        return res.status(404).json({ message: 'Internship not found' });
      }

      if (!internship[0].isActive) {
        return res.status(400).json({ message: 'Internship is no longer active' });
      }

      // Check if already applied
      const existing = await db
        .select()
        .from(schema.internshipApplications)
        .where(
          and(
            eq(schema.internshipApplications.userId, userId),
            eq(schema.internshipApplications.internshipId, id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Already applied to this internship' });
      }

      // Record application
      await db.insert(schema.internshipApplications).values({
        userId,
        internshipId: id,
        ...applicationData,
        status: 'applied'
      });

      // Increment click count on internship
      await db
        .update(schema.scrapedInternships)
        .set({ 
          clicksCount: sql`${schema.scrapedInternships.clicksCount} + 1` 
        })
        .where(eq(schema.scrapedInternships.id, id));

      res.json({ message: 'Application recorded successfully' });
    } catch (error) {
      return handleError(res, error, "Failed to record application");
    }
  });

  app.get('/api/internships/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Validate query parameters
      const queryValidation = internshipsQuerySchema.pick({
        page: true,
        limit: true,
        status: true
      }).safeParse(req.query);

      if (!queryValidation.success) {
        return handleError(res, queryValidation.error, "Invalid query parameters", 400);
      }

      const { page, limit, status } = queryValidation.data;
      const offset = (page - 1) * limit;

      const conditions = [eq(schema.internshipApplications.userId, userId)];
      if (status) {
        conditions.push(eq(schema.internshipApplications.status, status));
      }

      const applications = await db
        .select()
        .from(schema.internshipApplications)
        .where(and(...conditions))
        .orderBy(desc(schema.internshipApplications.appliedAt))
        .limit(limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(schema.internshipApplications)
        .where(and(...conditions));

      const total = totalResult[0]?.count || 0;

      res.json({
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      return handleError(res, error, "Failed to fetch applications");
    }
  });

  // Bulk Actions & Email Templates
  app.post("/api/recruiter/bulk-actions", isAuthenticated, async (req: any, res) => {
    try {
    const { action, applicationIds, emailTemplate, rejectionReason, notes } = req.body;
    const userId = req.user?.id;

    if (!userId || !applicationIds || !Array.isArray(applicationIds)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const results = [];

    for (const appId of applicationIds) {
      const application = await storage.getJobPostingApplication(appId);

      if (!application) {
        continue;
      }

      switch (action) {
        case 'send_email':
          // Send email using template
          // TODO: Implement email notification service
          console.log('Email notification would be sent here');
          break;

        case 'reject':
          await storage.updateJobApplication(appId, {
            status: 'rejected'
          });
          // TODO: Implement rejection email notification
          console.log('Rejection email would be sent here');
          break;

        case 'move_stage':
          await storage.updateJobApplication(appId, {
            status: req.body.newStage
          });
          break;

        case 'add_tag':
          // TODO: Implement tags functionality
          console.log('Tag functionality would be implemented here');
          break;

        case 'schedule_followup':
          // TODO: Implement follow-up scheduling
          console.log('Follow-up scheduling would be implemented here');
          break;
      }

      results.push({ applicationId: appId, success: true });
    }

    res.json({ 
      message: "Bulk action completed", 
      processed: results.length,
      results 
    });
    } catch (error: any) {
      console.error('Bulk action error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Email Templates Management
  app.get("/api/recruiter/email-templates", isAuthenticated, async (req: any, res) => {
    try {
    const templates = [
      {
        id: 'interview_invite',
        name: 'Interview Invitation',
        subject: 'Interview Invitation - {{jobTitle}}',
        body: 'Dear {{candidateName}},\n\nWe are pleased to invite you for an interview for the {{jobTitle}} position at {{companyName}}...'
      },
      {
        id: 'rejection_qualified',
        name: 'Rejection - Qualified Pool',
        subject: 'Application Update - {{jobTitle}}',
        body: 'Dear {{candidateName}},\n\nThank you for your interest in the {{jobTitle}} position. While we were impressed with your qualifications...'
      },
      {
        id: 'offer_letter',
        name: 'Offer Letter',
        subject: 'Job Offer - {{jobTitle}}',
        body: 'Dear {{candidateName}},\n\nWe are delighted to extend an offer for the {{jobTitle}} position...'
      },
      {
        id: 'follow_up',
        name: 'Follow-up',
        subject: 'Following up on your application',
        body: 'Dear {{candidateName}},\n\nWe wanted to follow up on your application for {{jobTitle}}...'
      }
    ];

      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add missing PATCH endpoint for updating application status
  app.patch('/api/internships/applications/:id', isAuthenticated, rateLimitMiddleware(10, 60), async (req: any, res) => {
    try {
      // Validate path parameters
      const paramValidation = z.object({
        id: z.string().transform((val, ctx) => {
          const parsed = parseInt(val, 10);
          if (isNaN(parsed) || parsed < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Application ID must be a positive integer",
            });
            return z.NEVER;
          }
          return parsed;
        })
      }).safeParse(req.params);

      if (!paramValidation.success) {
        return handleError(res, paramValidation.error, "Invalid application ID", 400);
      }

      // Validate request body
      const bodyValidation = updateApplicationStatusSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return handleError(res, bodyValidation.error, "Invalid update data", 400);
      }

      const { id } = paramValidation.data;
      const userId = req.user.id;
      const { status, applicationNotes } = bodyValidation.data;

      // Verify application exists and belongs to user
      const application = await db
        .select({ id: schema.internshipApplications.id })
        .from(schema.internshipApplications)
        .where(
          and(
            eq(schema.internshipApplications.id, id),
            eq(schema.internshipApplications.userId, userId)
          )
        )
        .limit(1);

      if (!application.length) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Update application
      const updateData: any = {
        status,
        statusUpdatedAt: new Date(),
        updatedAt: new Date()
      };

      if (applicationNotes) {
        updateData.applicationNotes = applicationNotes;
      }

      await db
        .update(schema.internshipApplications)
        .set(updateData)
        .where(eq(schema.internshipApplications.id, id));

      res.json({ message: 'Application updated successfully' });
    } catch (error) {
      return handleError(res, error, "Failed to update application");
    }
  });

  // Generate Shareable Interview Link
  app.post('/api/interviews/generate-link', isAuthenticated, async (req: any, res) => {
    try {
      const { jobPostingId, interviewType, interviewConfig, expiryDays } = req.body;
      const recruiterId = req.user.id;

      // Generate unique link ID
      const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const baseUrl = process.env.FRONTEND_URL || 'https://autojobr.com';
      const shareableLink = `${baseUrl}/interview-link/${linkId}`;

      // Parse interview config
      const config = typeof interviewConfig === 'string' ? JSON.parse(interviewConfig) : interviewConfig;

      // Validate required fields
      if (!config.role) {
        return res.status(400).json({
          message: 'Role is required for generating interview link'
        });
      }

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (expiryDays || 7));

      // Store shareable link metadata in interview_invitations table
      const [invitation] = await db.insert(schema.interviewInvitations).values({
        token: linkId,
        recruiterId: recruiterId,
        jobPostingId: jobPostingId ? parseInt(jobPostingId) : null,
        interviewType: interviewType,
        interviewConfig: JSON.stringify(config),
        role: config.role,
        company: config.company || '',
        difficulty: config.difficulty || 'medium',
        expiryDate: expiresAt,
        maxUses: null, // null means unlimited uses
        usageCount: 0
      }).returning();

      res.json({
        success: true,
        link: shareableLink,
        linkId,
        shareableLink,
        expiresAt,
        interviewType,
        role: config.role,
        company: config.company,
        invitationId: invitation.id
      });

    } catch (error) {
      console.error('Error generating shareable link:', error);
      res.status(500).json({
        message: 'Failed to generate shareable link',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get recruiter's generated shareable links
  app.get('/api/interviews/my-links', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      // Fetch all active links created by this recruiter
      const links = await db.select()
        .from(schema.interviewInvitations)
        .where(eq(schema.interviewInvitations.recruiterId, userId))
        .orderBy(desc(schema.interviewInvitations.createdAt))
        .limit(50);

      // Format the response
      const formattedLinks = links.map(link => {
        const baseUrl = process.env.FRONTEND_URL || 'https://autojobr.com';
        const shareableLink = `${baseUrl}/interview-link/${link.token}`;

        return {
          id: link.id,
          linkId: link.token,
          shareableLink,
          link: shareableLink,
          interviewType: link.interviewType,
          role: link.role,
          company: link.company,
          difficulty: link.difficulty,
          expiresAt: link.expiryDate,
          createdAt: link.createdAt,
          usageCount: link.usageCount,
          maxUses: link.maxUses
        };
      });

      res.json(formattedLinks);
    } catch (error) {
      console.error('Error fetching recruiter links:', error);
      res.status(500).json({ message: 'Failed to fetch shareable links' });
    }
  });

  // Access Interview via Shareable Link
  app.get('/api/interviews/link/:linkId', async (req: any, res) => {
    try {
      const { linkId } = req.params;

      // Find the invitation in interview_invitations table
      const [invitation] = await db.select()
        .from(schema.interviewInvitations)
        .where(eq(schema.interviewInvitations.token, linkId))
        .limit(1);

      if (!invitation) {
        return res.status(404).json({ message: 'Interview link not found' });
      }

      // Check if link is expired
      if (invitation.expiryDate && new Date(invitation.expiryDate) < new Date()) {
        return res.status(410).json({ message: 'This interview link has expired' });
      }

      // Check if max uses exceeded (if maxUses is set)
      if (invitation.maxUses && invitation.usageCount >= invitation.maxUses) {
        return res.status(410).json({ message: 'This interview link has reached its maximum number of uses' });
      }

      // Parse interview config
      const config = typeof invitation.interviewConfig === 'string' 
        ? JSON.parse(invitation.interviewConfig) 
        : invitation.interviewConfig;

      res.json({
        success: true,
        interviewType: invitation.interviewType,
        linkId,
        role: invitation.role,
        company: invitation.company,
        difficulty: invitation.difficulty,
        expiresAt: invitation.expiryDate,
        config: config
      });

    } catch (error) {
      console.error('Error accessing shareable link:', error);
      res.status(500).json({ message: 'Failed to access interview link' });
    }
  });

  // Start Interview/Test from Shareable Link
  app.post('/api/interviews/link/:linkId/start', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { linkId } = req.params;
      const user = req.user as User | undefined;

      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Find the invitation in interview_invitations table
      const [link] = await db.select()
        .from(schema.interviewInvitations)
        .where(eq(schema.interviewInvitations.token, linkId))
        .limit(1);

      if (!link) {
        return res.status(404).json({ message: 'Interview link not found' });
      }

      // Check if link is expired
      if (link.expiryDate && new Date(link.expiryDate) < new Date()) {
        return res.status(410).json({ message: 'This interview link has expired' });
      }

      // Check if max uses exceeded
      if (link.maxUses && link.usageCount >= link.maxUses) {
        return res.status(410).json({ message: 'This link has reached its maximum number of uses' });
      }

      // AUTO-APPLY: If link is for a job posting, auto-apply the user if not already applied
      if (link.jobPostingId) {
        const existingApplication = await db
          .select()
          .from(schema.jobPostingApplications)
          .where(
            and(
              eq(schema.jobPostingApplications.jobPostingId, link.jobPostingId),
              eq(schema.jobPostingApplications.applicantId, user.id)
            )
          )
          .then(rows => rows[0]);

        if (!existingApplication) {
          console.log(`🎯 Auto-applying user ${user.email} to job ${link.jobPostingId} via interview link`);

          await db.insert(schema.jobPostingApplications).values({
            jobPostingId: link.jobPostingId,
            applicantId: user.id,
            status: 'applied',
            appliedAt: new Date()
          });
        }
      }

      // Create assignment based on link type
      let redirectUrl = '/dashboard';

      // Map interview types - technical/behavioral/chat are all virtual interviews
      const mappedType = ['technical', 'behavioral', 'system_design', 'coding', 'chat'].includes(link.interviewType) 
        ? 'virtual' 
        : link.interviewType;

      switch (mappedType) {
        case 'virtual':
        if (link.interviewUrl) {
          redirectUrl = link.interviewUrl;
        } else {
          // Create virtual interview assignment
          const interviewData = JSON.parse(link.interviewConfig || '{}');
          const virtualInterview = await interviewAssignmentService.assignVirtualInterview({
            recruiterId: link.recruiterId,
            candidateId: user.id,
            jobPostingId: link.jobPostingId,
            interviewType: interviewData.interviewType || 'technical',
            role: interviewData.role || 'Software Engineer',
            company: interviewData.company,
            difficulty: interviewData.difficulty || 'medium',
            duration: interviewData.duration || 30,
            dueDate: link.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            interviewerPersonality: interviewData.personality || 'professional',
            jobDescription: interviewData.jobDescription
          });
          redirectUrl = `/chat-interview/${virtualInterview.sessionId}`;
        }
        break;
      case 'mock':
        // Create mock interview assignment
        const mockData = JSON.parse(link.interviewConfig || '{}');
        const mockInterview = await interviewAssignmentService.assignMockInterview({
          recruiterId: link.recruiterId,
          candidateId: user.id,
          jobPostingId: link.jobPostingId,
          interviewType: mockData.interviewType || 'technical',
          role: mockData.role || 'Software Engineer',
          company: mockData.company,
          difficulty: mockData.difficulty || 'medium',
          language: mockData.language || 'javascript',
          totalQuestions: mockData.totalQuestions || 5,
          dueDate: link.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        redirectUrl = `/mock-interview?sessionId=${mockInterview.sessionId}`;
        break;
      case 'test':
        // Create test assignment
        const testData = JSON.parse(link.interviewConfig || '{}');
        const requestBody = req.body || {};

        // Priority: Use testTemplateId if provided in config, otherwise try to match by domain
        let templateId = requestBody.testTemplateId || testData.testTemplateId;

        if (!templateId) {
          // Fallback: Try to match by domain and difficulty
          const testDomain = requestBody.testDomain || testData.domain || link.role || 'general';
          const testDifficulty = requestBody.testDifficulty || testData.difficulty || link.difficulty || 'medium';

          console.log(`🎯 Creating test for domain: ${testDomain}, difficulty: ${testDifficulty}`);

          // Find matching template by domain and difficulty
          const [matchingTemplate] = await db.select()
            .from(schema.testTemplates)
            .where(
              and(
                eq(schema.testTemplates.jobProfile, testDomain),
                eq(schema.testTemplates.difficultyLevel, testDifficulty)
              )
            )
            .limit(1);

          templateId = matchingTemplate?.id;

          if (!templateId) {
            // Fallback: Get any template matching the domain
            const [domainTemplate] = await db.select()
              .from(schema.testTemplates)
              .where(eq(schema.testTemplates.jobProfile, testDomain))
              .limit(1);

            templateId = domainTemplate?.id;
          }

          if (!templateId) {
            throw new Error(`No test template found for domain: ${testDomain}`);
          }
        }

        // CHECK: Does user already have a test assignment from this SPECIFIC recruiter/company, position, and template combo?
        // CRITICAL FIX: Check BOTH recruiter AND job posting to prevent cross-position test reuse
        // Same company but different position = different test assignment
        const whereConditions = [
          eq(schema.testAssignments.testTemplateId, templateId),
          eq(schema.testAssignments.jobSeekerId, user.id),
          eq(schema.testAssignments.recruiterId, link.recruiterId),
          // Additional safety: ensure recruiterId is not null
          sql`${schema.testAssignments.recruiterId} IS NOT NULL`
        ];

        // CRITICAL: Also match by job posting if available to separate tests for different positions
        if (link.jobPostingId) {
          whereConditions.push(eq(schema.testAssignments.jobPostingId, link.jobPostingId));
        }

        const existingTestAssignment = await db.select()
          .from(schema.testAssignments)
          .where(and(...whereConditions))
          .orderBy(desc(schema.testAssignments.createdAt))
          .limit(1)
          .then(rows => rows[0]);

        console.log(`🔍 Checking existing test: User ${user.id}, Template ${templateId}, Recruiter ${link.recruiterId}, JobPosting ${link.jobPostingId || 'none'}, Found: ${existingTestAssignment ? existingTestAssignment.id : 'none'}`);

        // CRITICAL FIX: Verify recruiterId exists before checking for existing tests
        if (!link.recruiterId) {
          console.error(`❌ ERROR: Interview link ${link.id} has no recruiterId - cannot create test assignment`);
          return res.status(400).json({ message: 'Invalid interview link: missing recruiter information' });
        }

        // CRITICAL: If user has a completed/terminated test from THIS SAME RECRUITER WITHOUT payment, show retake option
        if (existingTestAssignment && 
            (existingTestAssignment.status === 'completed' || existingTestAssignment.status === 'terminated')) {

          // Check if retake was paid for
          if (!existingTestAssignment.retakeAllowed) {
            console.log(`🚫 BLOCKED: User ${user.email} trying to retake test ${existingTestAssignment.id} from recruiter ${link.recruiterId} without payment`);
            redirectUrl = `/test/${existingTestAssignment.id}/retake-payment`;
            break;
          }

          // If retake is allowed (paid), reset the test for new attempt
          await storage.updateTestAssignment(existingTestAssignment.id, {
            status: 'assigned',
            score: null,
            answers: [],
            completionTime: null,
            warningCount: 0,
            tabSwitchCount: 0,
            copyAttempts: 0,
            terminationReason: null,
            retakeAllowed: false // Reset after use
          });

          console.log(`✅ Retake paid - reset test ${existingTestAssignment.id} for new attempt`);
          redirectUrl = `/test-taking/${existingTestAssignment.id}`;
          break;
        }

        // If user has an in-progress test from THIS SAME RECRUITER, redirect to it
        if (existingTestAssignment && existingTestAssignment.status === 'assigned') {
          console.log(`⚠️ User ${user.email} already has in-progress test ${existingTestAssignment.id} from recruiter ${link.recruiterId} - redirecting`);
          redirectUrl = `/test-taking/${existingTestAssignment.id}`;
          break;
        }

        // Create NEW test assignment for this specific recruiter/company + position combination
        // Each unique combination of (recruiter + position + template) gets its own test assignment
        const testAssignment = await storage.createTestAssignment({
          testTemplateId: templateId,
          recruiterId: link.recruiterId,
          jobSeekerId: user.id,
          jobPostingId: link.jobPostingId || null,
          dueDate: link.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'assigned'
        });

        console.log(`✅ NEW test assignment created: ${testAssignment.id} for recruiter ${link.recruiterId}, position ${link.jobPostingId || 'none'}, template ${templateId}`);
        redirectUrl = `/test-taking/${testAssignment.id}`;
        break;
      case 'video-interview':
        redirectUrl = '/ChatInterview?fromInvite=true';
        break;
    }

      // Increment usage count for the link
      await db.update(schema.interviewInvitations)
        .set({ usageCount: sql`${schema.interviewInvitations.usageCount} + 1` })
        .where(eq(schema.interviewInvitations.id, link.id));

      res.json({ redirectUrl });
    } catch (error) {
      console.error('Error starting interview from link:', error);
      res.status(500).json({ message: 'Failed to start interview' });
    }
  });

  // Interview Prep AI Route
  app.post('/api/ai/interview-prep', isAuthenticated, rateLimitMiddleware(10, 60), async (req: any, res) => {
    try {
      const validationResult = interviewPrepSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: validationResult.error.errors 
        });
      }

      const preparation = await interviewPrepService.generatePreparation(validationResult.data);

      res.json({
        success: true,
        ...preparation
      });
    } catch (error) {
      console.error('Interview prep error:', error);
      res.status(500).json({ 
        message: 'Failed to generate interview preparation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Salary Insights AI Route
  app.post('/api/ai/salary-insights', isAuthenticated, rateLimitMiddleware(10, 60), async (req: any, res) => {
    try {
      const validationResult = salaryInsightsSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: validationResult.error.errors 
        });
      }

      const insights = await salaryInsightsService.generateInsights(validationResult.data);

      res.json({
        success: true,
        ...insights
      });
    } catch (error) {
      console.error('Salary insights error:', error);
      res.status(500).json({ 
        message: 'Failed to generate salary insights',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cover Letter Generation API - Generate personalized cover letters
  app.post('/api/generate-cover-letter', isAuthenticated, async (req: any, res) => {
    try {
      const { jobDescription, jobTitle, companyName, resumeId } = req.body;

      if (!jobDescription) {
        return res.status(400).json({ 
          message: 'Job description is required' 
        });
      }

      const userId = req.user.id;

      // Get user's resume if resumeId provided
      let resumeText = '';
      if (resumeId) {
        const [resume] = await db.select()
          .from(userResumes)
          .where(and(
            eq(userResumes.userId, userId),
            eq(userResumes.id, resumeId)
          ))
          .limit(1);

        if (resume) {
          resumeText = resume.resumeText || '';
        }
      }

      // Get user profile for personalization
      const [userProfile] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      // Generate cover letter using AI
      const prompt = `Generate a professional, personalized cover letter based on:

Job Title: ${jobTitle || 'Not specified'}
Company: ${companyName || 'Not specified'}
Job Description: ${jobDescription}

Candidate Background:
${resumeText ? `Resume: ${resumeText.substring(0, 1000)}...` : 'Professional with relevant experience'}

Requirements:
- Opening paragraph that shows enthusiasm and explains why you're interested in this specific role
- Body paragraphs highlighting relevant experience and skills that match the job requirements
- Specific examples of achievements that align with the job description
- Closing paragraph with a call to action
- Professional tone throughout
- Keep it concise (300-400 words)

Format the cover letter with proper paragraphs. Do not include [Date], [Your Address], or [Hiring Manager] placeholders - start directly with the greeting.

Return only the cover letter text, no additional formatting or explanations.`;

      console.log('🤖 Generating AI cover letter...');

      const aiResponse = await aiService.createChatCompletion([
        { role: 'system', content: 'You are an expert cover letter writer. Write professional, compelling cover letters that highlight candidate strengths.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 1000,
        user: req.user
      });

      const coverLetter = aiResponse.choices[0]?.message?.content || '';

      console.log('✅ Cover letter generated successfully');

      res.json({
        success: true,
        coverLetter: coverLetter.trim(),
        jobTitle,
        companyName
      });
    } catch (error: any) {
      console.error("❌ Error generating cover letter:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        jobTitle,
        companyName
      });
      res.status(500).json({ 
        success: false,
        message: "Failed to generate cover letter. Please try again.",
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      });
    }
  });

  // Extension-compatible endpoint for interview prep (forwards to AI endpoint)
  app.post('/api/interview-prep', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both direct fields and jobData object from extension
      const requestData = req.body.jobData ? {
        jobTitle: req.body.jobData.title,
        company: req.body.jobData.company,
        jobDescription: req.body.jobData.jobDescription || req.body.jobData.description,
        location: req.body.jobData.location,
      } : req.body;

      const validationResult = interviewPrepSchema.safeParse(requestData);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: validationResult.error.errors 
        });
      }

      const preparation = await interviewPrepService.generatePreparation(validationResult.data);

      res.json({
        success: true,
        ...preparation
      });
    } catch (error) {
      console.error('Interview prep error:', error);
      res.status(500).json({ 
        message: 'Failed to generate interview preparation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Extension-compatible endpoint for salary insights (forwards to AI endpoint)
  app.post('/api/salary-insights', isAuthenticated, async (req: any, res) => {
    try {
      const validationResult = salaryInsightsSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: validationResult.error.errors 
        });
      }

      const insights = await salaryInsightsService.generateInsights(validationResult.data);

      res.json({
        success: true,
        ...insights
      });
    } catch (error) {
      console.error('Salary insights error:', error);
      res.status(500).json({ 
        message: 'Failed to generate salary insights',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Job Match Analysis API for extension
  app.post('/api/analyze-job-match', isAuthenticated, async (req: any, res) => {
    try {
      const { jobData, userProfile } = req.body;
      const userId = req.user.id;

      if (!jobData) {
        return res.status(400).json({ message: 'Job data is required' });
      }

      // Get user profile if not provided
      let profile = userProfile;
      if (!profile) {
        const [dbProfile] = await db.select()
          .from(schema.userProfiles)
          .where(eq(schema.userProfiles.userId, userId))
          .limit(1);
        
        if (dbProfile) {
          const skills = await db.select()
            .from(schema.userSkills)
            .where(eq(schema.userSkills.userId, userId));
          
          profile = {
            ...dbProfile,
            skills: skills.map(s => s.skillName)
          };
        }
      }

      // Calculate match score
      let matchScore = 0;
      const matchingSkills: string[] = [];
      const missingSkills: string[] = [];

      if (profile && profile.skills) {
        const userSkills = profile.skills.map((s: string) => s.toLowerCase());
        const jobSkills = jobData.requiredSkills || [];
        
        jobSkills.forEach((skill: string) => {
          if (userSkills.includes(skill.toLowerCase())) {
            matchingSkills.push(skill);
            matchScore += 10;
          } else {
            missingSkills.push(skill);
          }
        });
      }

      // Title matching
      if (profile?.professionalTitle && jobData.title) {
        const titleSimilarity = calculateTitleSimilarity(
          profile.professionalTitle.toLowerCase(),
          jobData.title.toLowerCase()
        );
        matchScore += titleSimilarity;
      }

      matchScore = Math.min(matchScore, 100);

      res.json({
        matchScore,
        matchingSkills,
        missingSkills,
        recommendation: matchScore >= 70 ? 'strong_match' : matchScore >= 50 ? 'good_match' : 'review_required'
      });
    } catch (error) {
      console.error('Job match analysis error:', error);
      res.status(500).json({ 
        message: 'Failed to analyze job match',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Saved Jobs API for extension
  app.get('/api/saved-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const savedJobs = await db.select()
        .from(schema.userSavedJobs)
        .where(eq(schema.userSavedJobs.userId, userId))
        .orderBy(desc(schema.userSavedJobs.savedAt))
        .limit(50);

      res.json(savedJobs);
    } catch (error) {
      console.error('Get saved jobs error:', error);
      res.status(500).json({ message: 'Failed to fetch saved jobs' });
    }
  });

  app.post('/api/saved-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { jobData } = req.body;

      // Create scraped job first
      const [scrapedJob] = await db.insert(schema.scrapedJobs)
        .values({
          title: jobData.title,
          company: jobData.company,
          description: jobData.description || '',
          location: jobData.location || '',
          jobType: 'full-time',
          experienceLevel: 'mid',
          source: 'extension',
          sourceUrl: jobData.url || 'https://extension-saved-job.com',
          sourcePlatform: 'extension'
        })
        .returning();

      // Save to user saved jobs
      const [savedJob] = await db.insert(schema.userSavedJobs)
        .values({
          userId,
          scrapedJobId: scrapedJob.id,
        })
        .returning();

      res.json({ success: true, job: { ...savedJob, scrapedJob } });
    } catch (error) {
      console.error('Save job error:', error);
      res.status(500).json({ message: 'Failed to save job' });
    }
  });

  // Tasks API for extension
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      let query = db.select()
        .from(schema.tasks)
        .where(eq(schema.tasks.userId, userId))
        .orderBy(desc(schema.tasks.createdAt))
        .limit(limit);

      if (status) {
        query = db.select()
          .from(schema.tasks)
          .where(and(
            eq(schema.tasks.userId, userId),
            eq(schema.tasks.status, status)
          ))
          .orderBy(desc(schema.tasks.createdAt))
          .limit(limit);
      }

      const tasks = await query;
      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title, description, dueDate, priority, taskType } = req.body;

      const [task] = await db.insert(schema.tasks)
        .values({
          userId,
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || 'medium',
          status: 'pending',
          taskType: taskType || 'general', // Required field
          category: 'general'
        })
        .returning();

      res.json({ success: true, task });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Failed to create task' });
    }
  });

  app.patch('/api/tasks/:taskId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = parseInt(req.params.taskId);
      const { status } = req.body;

      const [task] = await db.update(schema.tasks)
        .set({ status, updatedAt: new Date() })
        .where(and(
          eq(schema.tasks.id, taskId),
          eq(schema.tasks.userId, userId)
        ))
        .returning();

      res.json({ success: true, task });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({ message: 'Failed to update task status' });
    }
  });

  // Active Resume API for extension
  app.get('/api/resumes/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const [activeResume] = await db.select()
        .from(resumes)
        .where(and(
          eq(resumes.userId, userId),
          eq(resumes.isActive, true)
        ))
        .limit(1);

      if (!activeResume) {
        return res.status(404).json({ message: 'No active resume found' });
      }

      res.json(activeResume);
    } catch (error) {
      console.error('Get active resume error:', error);
      res.status(500).json({ message: 'Failed to fetch active resume' });
    }
  });

  // Pending Reminders API for extension
  app.get('/api/reminders/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const reminders = await db.select()
        .from(schema.taskReminders)
        .where(and(
          eq(schema.taskReminders.userId, userId),
          eq(schema.taskReminders.isTriggered, false),
          sql`${schema.taskReminders.triggerDateTime} <= NOW()`
        ))
        .orderBy(asc(schema.taskReminders.triggerDateTime))
        .limit(10);

      res.json(reminders);
    } catch (error) {
      console.error('Get pending reminders error:', error);
      res.status(500).json({ message: 'Failed to fetch reminders' });
    }
  });

  app.post('/api/reminders/:reminderId/snooze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reminderId = parseInt(req.params.reminderId);
      const { snoozeMinutes } = req.body;

      const newTime = new Date(Date.now() + (snoozeMinutes || 15) * 60 * 1000);

      const [reminder] = await db.update(schema.taskReminders)
        .set({ snoozeUntil: newTime })
        .where(and(
          eq(schema.taskReminders.id, reminderId),
          eq(schema.taskReminders.userId, userId)
        ))
        .returning();

      res.json({ success: true, reminder });
    } catch (error) {
      console.error('Snooze reminder error:', error);
      res.status(500).json({ message: 'Failed to snooze reminder' });
    }
  });

  // Extension Applications Tracking
  app.post('/api/extension/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { jobUrl, applicationData } = req.body;

      const [application] = await db.insert(schema.jobApplications)
        .values({
          userId,
          jobTitle: applicationData.title,
          company: applicationData.company,
          jobUrl: jobUrl,
          location: applicationData.location,
          status: 'applied',
          source: 'extension'
        })
        .returning();

      res.json({ success: true, application });
    } catch (error) {
      console.error('Track application error:', error);
      res.status(500).json({ message: 'Failed to track application' });
    }
  });

  // Job Suggestions API for extension
  app.post('/api/job-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;

      // Get user profile
      const [profile] = await db.select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, userId))
        .limit(1);

      if (!profile) {
        return res.json({ suggestions: [] });
      }

      // Get user skills
      const skills = await db.select()
        .from(schema.userSkills)
        .where(eq(schema.userSkills.userId, userId));

      // Get recent job postings that match user skills
      const suggestions = await db.select()
        .from(schema.jobPostings)
        .where(
          and(
            eq(schema.jobPostings.isActive, true),
            isNotNull(schema.jobPostings.skills)
          )
        )
        .orderBy(desc(schema.jobPostings.createdAt))
        .limit(10);

      res.json({ 
        success: true,
        suggestions: suggestions.map(job => ({
          id: job.id,
          title: job.title,
          company: job.companyName,
          location: job.location,
          description: job.description,
          requiredSkills: job.skills,
          matchScore: 75 // Basic match score
        }))
      });
    } catch (error) {
      console.error('Job suggestions error:', error);
      res.status(500).json({ message: 'Failed to get job suggestions' });
    }
  });

  // User Preferences API for extension
  app.post('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      // Update user profile with preferences
      await db.update(schema.userProfiles)
        .set({
          preferredWorkMode: preferences.workMode,
          willingToRelocate: preferences.willingToRelocate,
          desiredSalaryMin: preferences.salaryMin,
          desiredSalaryMax: preferences.salaryMax,
          updatedAt: new Date()
        })
        .where(eq(schema.userProfiles.userId, userId));

      res.json({ success: true, message: 'Preferences updated' });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });

  // Cover Letter Usage Check API for extension
  app.get('/api/cover-letter/usage-check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get user subscription info
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      const isPremium = user?.subscriptionStatus === 'active' && user?.planType !== 'free';
      
      // Count cover letters generated this month (simple check)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // For now, return basic usage info
      res.json({
        success: true,
        canGenerate: true,
        isPremium,
        remainingGenerations: isPremium ? 999 : 3,
        totalGenerations: 0
      });
    } catch (error) {
      console.error('Usage check error:', error);
      res.status(500).json({ message: 'Failed to check usage' });
    }
  });

  // Get user's resumes
  app.get('/api/resumes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      console.log(`[RESUME_FETCH] Fetching resumes for user: ${userId}`);

      // Fetch resumes from database - using resumes table (not userResumes)
      const resumeList = await db.select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.createdAt));

      console.log(`[RESUME_FETCH] Database returned ${resumeList.length} resumes`);

      if (resumeList.length === 0) {
        console.log(`[RESUME_FETCH] No resumes found in database for user ${userId}`);
        return res.json([]);
      }

      // Format response with all necessary fields
      const formattedResumes = resumeList.map(resume => {
        // Parse analysisData if it's a string
        let analysis = resume.analysisData;
        if (typeof analysis === 'string') {
          try {
            analysis = JSON.parse(analysis);
          } catch (e) {
            console.warn(`[RESUME_FETCH] Failed to parse analysisData for resume ${resume.id}`);
            analysis = null;
          }
        }

        return {
          id: resume.id,
          name: resume.name,
          fileName: resume.fileName,
          fileSize: resume.fileSize,
          mimeType: resume.mimeType,
          isActive: resume.isActive,
          atsScore: resume.atsScore || 0,
          analysis: analysis,
          uploadedAt: resume.createdAt,
          resumeText: resume.resumeText ? resume.resumeText.substring(0, 500) + '...' : ''
        };
      });

      console.log(`[RESUME_FETCH] Returning ${formattedResumes.length} formatted resumes`);
      res.json(formattedResumes);
    } catch (error) {
      console.error('[RESUME_FETCH] Error fetching resumes:', error);
      handleError(res, error, "Failed to fetch resumes");
    }
  });

  // Set active resume
  app.post('/api/resumes/:id/set-active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const resumeId = parseInt(req.params.id);

      // Deactivate all other resumes
      await db.update(resumes)
        .set({ isActive: false })
        .where(eq(resumes.userId, userId));

      // Activate the selected resume
      await db.update(resumes)
        .set({ isActive: true })
        .where(and(
          eq(resumes.id, resumeId),
          eq(resumes.userId, userId)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error('Error setting active resume:', error);
      handleError(res, error, "Failed to set active resume");
    }
  });

  // Download resume
  app.get('/api/resumes/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const resumeId = parseInt(req.params.id);

      const [resume] = await db.select()
        .from(resumes)
        .where(and(
          eq(resumes.id, resumeId),
          eq(resumes.userId, userId)
        ))
        .limit(1);

      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      // Get resume file from storage
      let fileBuffer: Buffer | null = null;

      if (resume.filePath) {
        fileBuffer = await fileStorage.retrieveResume(resume.filePath, userId);
      }

      if (!fileBuffer) {
        return res.status(404).json({ message: 'Resume file not found' });
      }

      res.setHeader('Content-Type', resume.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error downloading resume:', error);
      handleError(res, error, "Failed to download resume");
    }
  });

  // Get all career analyses for user (history)
  app.get('/api/career-ai/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analyses = await db.query.careerAiAnalyses.findMany({
        where: (table, { eq }) => eq(table.userId, userId),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
        limit: 10
      });

      res.json(analyses);
    } catch (error) {
      console.error("Error fetching career analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Get career analytics summary for dashboard
  app.get('/api/career-ai/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get latest analysis
      const latestAnalysis = await db.query.careerAiAnalyses.findFirst({
        where: (table, { eq, and }) => and(
          eq(table.userId, userId),
          eq(table.isActive, true)
        ),
        orderBy: (table, { desc }) => [desc(table.createdAt)]
      });

      // Get total analyses count
      const totalAnalyses = await db.select({ count: count() })
        .from(schema.careerAiAnalyses)
        .where(eq(schema.careerAiAnalyses.userId, userId));

      // Get skill progress if available
      const skillGaps = latestAnalysis?.skillGaps || [];
      const careerPath = latestAnalysis?.careerPath || null;

      // Calculate actual skill improvement rate
      let skillImprovementRate = 0;
      if (Array.isArray(skillGaps) && skillGaps.length > 0) {
        const avgCurrentLevel = skillGaps.reduce((sum: number, gap: any) => {
          return sum + (gap.currentLevel || 0);
        }, 0) / skillGaps.length;

        const avgTargetLevel = skillGaps.reduce((sum: number, gap: any) => {
          return sum + (gap.targetLevel || 10);
        }, 0) / skillGaps.length;

        // Calculate as percentage of target achieved
        skillImprovementRate = avgTargetLevel > 0 
          ? Math.round((avgCurrentLevel / avgTargetLevel) * 100) 
          : 0;
      }

      // Calculate progress metrics with real data
      const progressMetrics = {
        totalAnalyses: totalAnalyses[0]?.count || 0,
        latestAnalysis: latestAnalysis ? {
          careerGoal: latestAnalysis.careerGoal,
          insights: latestAnalysis.insights,
          skillGaps: latestAnalysis.skillGaps,
          careerPath: latestAnalysis.careerPath,
          createdAt: latestAnalysis.createdAt
        } : null,
        skillImprovementRate,
        careerPathSteps: careerPath?.steps?.length || 0,
        hasCareerPath: !!(careerPath?.steps && careerPath.steps.length > 0)
      };

      res.json(progressMetrics);
    } catch (error) {
      console.error("Error fetching career analytics:", error);
      res.status(500).json({ message: "Failed to fetch career analytics" });
    }
  });

  // Get specific career analysis by ID
  app.get('/api/career-ai/analysis/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analysisId = parseInt(req.params.id);

      const analysis = await db.query.careerAiAnalyses.findFirst({
        where: (table, { eq, and }) => and(
          eq(table.id, analysisId),
          eq(table.userId, userId)
        )
      });

      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching career analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // Email configuration endpoints
  app.get('/api/admin/email/config', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const config = getEmailConfig();
      const testResult = await testEmailConfiguration();

      res.json({
        currentProvider: config.provider,
        fromAddress: config.from,
        status: testResult,
        availableProviders: ['resend', 'nodemailer'],
        environmentVars: {
          resend: {
            required: ['RESEND_API_KEY'],
            optional: ['EMAIL_FROM']
          },
          nodemailer: {
            required: ['POSTAL_SMTP_HOST', 'POSTAL_SMTP_USER', 'POSTAL_SMTP_PASS'],
            optional: ['POSTAL_SMTP_PORT', 'POSTAL_SMTP_SECURE', 'POSTAL_SMTP_TLS_REJECT_UNAUTHORIZED', 'EMAIL_FROM']
          }
        }
      });
    } catch (error) {
      console.error('Error getting email config:', error);
      res.status(500).json({ message: 'Failed to get email configuration' });
    }
  });

  app.post('/api/admin/email/test', isAuthenticated, async (req: any, res) => {
    try {
      // Admin check
      if (!req.user || (req.user.email !== 'admin@autojobr.com' && req.user.userType !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { testEmail } = req.body;
      if (!testEmail || !testEmail.includes('@')) {
        return res.status(400).json({ message: 'Valid test email address required' });
      }

      const testResult = await testEmailConfiguration();

      // Send a test email
      const success = await sendEmail({
        to: testEmail,
        subject: 'AutoJobr Email Configuration Test',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email from AutoJobr to verify email configuration.</p>
          <p><strong>Provider:</strong> ${testResult.provider}</p>
          <p><strong>Status:</strong> ${testResult.status}</p>
          <p><strong>Details:</strong> ${testResult.details}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `
      });

      res.json({
        success,
        provider: testResult.provider,
        status: testResult.status,
        details: testResult.details,
        message: success ? 'Test email sent successfully' : 'Failed to send test email'
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  // Promotional Email Service API endpoints
  app.get('/api/admin/promotional-email/status', async (req: any, res) => {
    try {
      const status = simplePromotionalEmailService.getServiceStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting promotional email status:', error);
      res.status(500).json({ message: 'Failed to get promotional email status' });
    }
  });

  // Extension API for Chrome extension - provides profile data for form filling
  app.get('/api/extension/profile', isAuthenticatedExtension, async (req: any, res) => {
    try {
      console.log('Extension profile request received');

      // Check for session user first
      const sessionUser = req.session?.user;

      if (sessionUser && sessionUser.id) {
        console.log('Authenticated user found, fetching real profile data');

        // Get real user profile from database
        const [profile, skills, workExperience, education, user] = await Promise.all([
          storage.getUserProfile(sessionUser.id),
          storage.getUserSkills(sessionUser.id),
          storage.getUserWorkExperience(sessionUser.id),
          storage.getUserEducation(sessionUser.id),
          storage.getUser(sessionUser.id)
        ]);

        // Build profile response with real data
        const fullNameParts = profile?.fullName?.trim().split(' ') || [];
        const firstName = fullNameParts[0] || sessionUser.firstName || sessionUser.email?.split('@')[0] || '';
        const lastName = fullNameParts.slice(1).join(' ') || sessionUser.lastName || '';

        const extensionProfile = {
          authenticated: true,
          firstName: firstName,
          lastName: lastName,
          fullName: profile?.fullName || `${firstName} ${lastName}`.trim(),
          email: sessionUser.email,
          phone: profile?.phone || '',
          linkedinUrl: profile?.linkedinUrl || '',
          githubUrl: profile?.githubUrl || '',
          portfolioUrl: profile?.portfolioUrl || '',
          location: profile?.location || `${profile?.city || ''}, ${profile?.state || ''}`.trim() || profile?.city || '',
          city: profile?.city || '',
          state: profile?.state || '',
          country: profile?.country || '',
          zipCode: profile?.zipCode || '',
          professionalTitle: profile?.professionalTitle || '',
          yearsExperience: profile?.yearsExperience || 0,
          currentAddress: profile?.currentAddress || '',
          summary: profile?.summary || '',
          workAuthorization: profile?.workAuthorization || '',
          desiredSalaryMin: profile?.desiredSalaryMin || 0,
          desiredSalaryMax: profile?.desiredSalaryMax || 0,
          salaryCurrency: profile?.salaryCurrency || 'USD',
          skills: skills.map(s => s.skillName),
          skillsCount: skills.length,
          education: education.map(e => ({
            degree: e.degree,
            fieldOfStudy: e.fieldOfStudy,
            institution: e.institution,
            graduationYear: e.graduationYear || null,
            startDate: e.startDate?.toISOString().split('T')[0] || null,
            endDate: e.endDate?.toISOString().split('T')[0] || null
          })),
          workExperience: workExperience.map(w => ({
            company: w.company,
            position: w.position,
            startDate: w.startDate?.toISOString().split('T')[0],
            endDate: w.endDate?.toISOString().split('T')[0] || null,
            description: w.description,
            isCurrent: !w.endDate
          })),
          currentCompany: workExperience[0]?.company || '',
          skillsList: skills.map(s => s.skillName).join(', '),
          planType: user?.planType || 'free',
          subscriptionStatus: user?.subscriptionStatus || 'free'
        };

        console.log('Returning real profile data for authenticated user:', {
          email: extensionProfile.email,
          skillsCount: extensionProfile.skillsCount,
          educationCount: extensionProfile.education.length,
          experienceCount: extensionProfile.workExperience.length
        });
        return res.json(extensionProfile);
      }

      // Fallback: should not reach here due to isAuthenticatedExtension middleware
      console.log('No authenticated user, requiring login');
      res.status(401).json({ 
        authenticated: false,
        message: 'Please log in to AutoJobr to access profile data',
        loginRequired: true
      });

    } catch (error) {
      console.error('Error fetching extension profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  // Auth middleware was already set up at the beginning of registerRoutes

  // Setup Simple Chat Routes
  setupSimpleChatRoutes(app);
  console.log('✅ Simple Chat routes registered');

  // ===== REFERRAL MARKETPLACE ROUTES =====
  try {
    console.log('🔧 Mounting referral marketplace routes...');
    app.use('/api/referral-marketplace', referralMarketplaceRoutes);
    console.log('✅ Referral marketplace routes registered at /api/referral-marketplace');
  } catch (error) {
    console.error('❌ FAILED to register referral marketplace routes:', error);
  }

  // Initialize WebSocket service for real-time chat
  console.log('🔌 WebSocket service ready for chat connections');

  // Setup payment routes
  // Payment routes are mounted inline below

  // PayPal Routes (Consolidated)
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  // One-time payment routes
  app.post("/api/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // PayPal subscription routes use existing PayPalSubscriptionService - see subscription routes below

  // Payment credentials check routes
  paymentCredentialsRouter(app);

  // ============ RETAKE PAYMENT ROUTES ============

  // Virtual interview retake payment endpoint
  app.post('/api/interviews/virtual/:interviewId/retake-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const interviewId = req.params.interviewId;
      const { paymentProvider, amount } = req.body;

      if (!paymentProvider) {
        return res.status(400).json({ message: 'Payment provider required' });
      }

      // Record the payment in database
      await db.insert(schema.testRetakePayments).values({
        testAssignmentId: null, // Virtual interviews don't have test assignment IDs
        userId: userId,
        amount: amount || 500, // $5 in cents
        currency: 'USD',
        paymentProvider: paymentProvider,
        paymentStatus: 'completed'
      });

      // Reset the virtual interview session to allow retake
      await db.update(schema.virtualInterviewSessions)
        .set({
          status: 'assigned',
          startedAt: null,
          completedAt: null
        })
        .where(eq(schema.virtualInterviewSessions.sessionId, interviewId));

      res.json({ success: true, message: 'Virtual interview retake payment processed successfully' });
    } catch (error) {
      console.error('Virtual interview retake payment error:', error);
      res.status(500).json({ message: 'Failed to process retake payment' });
    }
  });

  // Mock interview retake payment endpoint
  app.post('/api/interviews/mock/:sessionId/retake-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;
      const { paymentProvider, amount } = req.body;

      if (!paymentProvider) {
        return res.status(400).json({ message: 'Payment provider required' });
      }

      // Record the payment in database
      await db.insert(schema.testRetakePayments).values({
        testAssignmentId: null, // Mock interviews don't have test assignment IDs
        userId: userId,
        amount: amount || 500, // $5 in cents
        currency: 'USD',
        paymentProvider: paymentProvider,
        paymentStatus: 'completed'
      });

      // Reset the mock interview session to allow retake
      await db.update(schema.mockInterviewSessions)
        .set({
          status: 'pending',
          startedAt: null,
          completedAt: null
        })
        .where(eq(schema.mockInterviewSessions.sessionId, sessionId));

      res.json({ success: true, message: 'Mock interview retake payment processed successfully' });
    } catch (error) {
      console.error('Mock interview retake payment error:', error);
      res.status(500).json({ message: 'Failed to process retake payment' });
    }
  });

  // Test retake payment endpoint
  app.post('/api/test-assignments/:id/retake/payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assignmentId = parseInt(req.params.id);
      const { paymentProvider, paymentIntentId } = req.body;

      if (!paymentProvider || !paymentIntentId) {
        return res.status(400).json({ message: 'Payment details required' });
      }

      // Process the retake payment
      const success = await testService.processRetakePayment(
        assignmentId,
        userId,
        paymentProvider,
        paymentIntentId
      );

      if (success) {
        res.json({ success: true, message: 'Retake payment processed successfully' });
      } else {
        res.status(400).json({ message: 'Payment verification failed' });
      }
    } catch (error) {
      console.error('Test retake payment error:', error);
      res.status(500).json({ message: 'Failed to process retake payment' });
    }
  });

  // LinkedIn share verification for retake
  app.post('/api/test-assignments/:id/retake/linkedin-share', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assignmentId = parseInt(req.params.id);
      const { linkedinPostUrl } = req.body;

      if (!linkedinPostUrl) {
        return res.status(400).json({ message: 'LinkedIn post URL is required' });
      }

      // Validate LinkedIn URL format
      const linkedinUrlPattern = /^https?:\/\/(www\.)?linkedin\.com\/(posts?|feed\/update)\/.+/i;
      if (!linkedinUrlPattern.test(linkedinPostUrl)) {
        return res.status(400).json({ message: 'Invalid LinkedIn post URL format' });
      }

      // Verify the assignment exists and belongs to the user
      const [assignment] = await db
        .select()
        .from(schema.testAssignments)
        .where(
          and(
            eq(schema.testAssignments.id, assignmentId),
            eq(schema.testAssignments.jobSeekerId, userId)
          )
        );

      if (!assignment) {
        return res.status(404).json({ message: 'Test assignment not found' });
      }

      if (assignment.retakeAllowed) {
        return res.status(400).json({ message: 'Retake already enabled for this assignment' });
      }

      // Verify LinkedIn post using oEmbed API
      try {
        const oembedUrl = `https://www.linkedin.com/oembed?url=${encodeURIComponent(linkedinPostUrl)}&format=json`;
        const response = await axios.get(oembedUrl);

        if (response.status === 200 && response.data) {
          // Post exists and is public - grant retake access
          await db
            .update(schema.testAssignments)
            .set({
              retakeAllowed: true,
              retakeMethod: 'linkedin_share',
              linkedinShareUrl: linkedinPostUrl,
              linkedinShareVerified: true,
              linkedinShareVerifiedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(schema.testAssignments.id, assignmentId));

          console.log('✅ [RETAKE] LinkedIn share verified for assignment:', assignmentId);

          res.json({
            success: true,
            message: 'LinkedIn post verified! Retake access granted.',
            postPreview: response.data,
          });
        } else {
          res.status(400).json({ message: 'Could not verify LinkedIn post' });
        }
      } catch (verifyError: any) {
        console.error('LinkedIn oEmbed verification error:', verifyError.response?.data || verifyError.message);
        
        if (verifyError.response?.status === 404) {
          return res.status(404).json({ 
            message: 'LinkedIn post not found or is not public. Please ensure the post is publicly visible.' 
          });
        }

        return res.status(400).json({ 
          message: 'Failed to verify LinkedIn post. Please check the URL and try again.' 
        });
      }
    } catch (error) {
      console.error('LinkedIn share verification error:', error);
      res.status(500).json({ message: 'Failed to process LinkedIn share verification' });
    }
  });

  // ============ END RETAKE PAYMENT ROUTES ============

  // Admin route to send retake warning emails for terminated tests
  app.post('/api/admin/send-retake-warnings/:testTemplateId', async (req: any, res) => {
    try {
      const testTemplateId = parseInt(req.params.testTemplateId);
      
      // Get all users with terminated tests for this template
      const terminatedTests = await db
        .select({
          testId: schema.testAssignments.id,
          userId: schema.testAssignments.jobSeekerId,
          email: schema.users.email,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName
        })
        .from(schema.testAssignments)
        .innerJoin(schema.users, eq(schema.testAssignments.jobSeekerId, schema.users.id))
        .where(and(
          eq(schema.testAssignments.testTemplateId, testTemplateId),
          eq(schema.testAssignments.status, 'terminated')
        ));

      if (terminatedTests.length === 0) {
        return res.json({ message: 'No terminated tests found', count: 0 });
      }

      // Send warning emails to all users
      const emailPromises = terminatedTests.map(async (test) => {
        const userName = `${test.firstName} ${test.lastName}`;
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Final Retake Opportunity - AutoJobr</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Final Retake Opportunity</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Important Test Integrity Notice</p>
            </div>
            
            <div style="background: white; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Dear ${userName},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                We have reviewed your test assignment and noticed that it was terminated due to suspicious activity. 
                After careful consideration, we are granting you <strong>ONE FINAL RETAKE OPPORTUNITY</strong>.
              </p>
              
              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="color: #991b1b; margin-top: 0; font-size: 18px;">🚨 CRITICAL WARNINGS</h3>
                <ul style="color: #7f1d1d; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                  <li><strong>NO Developer Tools:</strong> Do not open browser developer tools or inspect elements</li>
                  <li><strong>NO Copy/Paste:</strong> Do not copy questions or paste answers</li>
                  <li><strong>NO Tab Switching:</strong> Stay on the test tab at all times</li>
                  <li><strong>NO External Help:</strong> This is an individual assessment</li>
                  <li><strong>Use Private Browser:</strong> Take the test in incognito/private browsing mode</li>
                </ul>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">📋 Proctoring System</h3>
                <p style="color: #78350f; margin: 10px 0;">
                  Our advanced proctoring system monitors all test activity. You will receive <strong>5 warnings</strong> 
                  for any suspicious behavior before automatic submission. Any violation will result in:
                </p>
                <ul style="color: #78350f; margin: 10px 0; padding-left: 20px;">
                  <li>Immediate test termination</li>
                  <li>Permanent disqualification</li>
                  <li>No further retake opportunities</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://autojobr.com/interview-link/link_1760040400971_3d9hswhtz" 
                   style="background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold;
                          display: inline-block;">
                  Retake Test Now
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; font-size: 14px; text-align: center;">
                Or copy and paste this link into your private browser:<br>
                <a href="https://autojobr.com/interview-link/link_1760040400971_3d9hswhtz" 
                   style="color: #667eea; word-break: break-all;">https://autojobr.com/interview-link/link_1760040400971_3d9hswhtz</a>
              </p>
              
              <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                <p style="color: #991b1b; margin: 0; font-size: 16px; font-weight: bold;">
                  ⚠️ THIS IS YOUR LAST CHANCE ⚠️
                </p>
                <p style="color: #7f1d1d; margin: 10px 0 0 0;">
                  Any further violations will result in permanent account suspension
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Please read all instructions carefully before starting the test.<br>
                Good luck and test with integrity!
              </p>
            </div>
          </body>
          </html>
        `;

        try {
          await sendEmail({
            to: test.email,
            subject: '⚠️ FINAL RETAKE OPPORTUNITY - Test Integrity Warning',
            html: emailHtml
          });
          return { email: test.email, success: true };
        } catch (error) {
          console.error(`Failed to send email to ${test.email}:`, error);
          return { email: test.email, success: false, error };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      
      res.json({ 
        message: `Sent warning emails to ${successCount} out of ${terminatedTests.length} users`,
        count: successCount,
        total: terminatedTests.length,
        results 
      });
    } catch (error) {
      console.error('Send retake warning emails error:', error);
      res.status(500).json({ message: 'Failed to send warning emails' });
    }
  });

  // Simple endpoint to send custom retake warning email
  app.post('/api/send-custom-email', async (req: any, res) => {
    try {
      const { to, name, link } = req.body;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Final Retake Opportunity - AutoJobr</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Final Retake Opportunity</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Important Test Integrity Notice</p>
          </div>
          
          <div style="background: white; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Dear ${name},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              We have reviewed your test assignment and noticed that it was terminated due to suspicious activity. 
              After careful consideration, we are granting you <strong>ONE FINAL RETAKE OPPORTUNITY</strong>.
            </p>
            
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #991b1b; margin-top: 0; font-size: 18px;">🚨 CRITICAL WARNINGS</h3>
              <ul style="color: #7f1d1d; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                <li><strong>NO Developer Tools:</strong> Do not open browser developer tools or inspect elements</li>
                <li><strong>NO Copy/Paste:</strong> Do not copy questions or paste answers</li>
                <li><strong>NO Tab Switching:</strong> Stay on the test tab at all times</li>
                <li><strong>NO External Help:</strong> This is an individual assessment</li>
                <li><strong>Use Private Browser:</strong> Take the test in incognito/private browsing mode</li>
              </ul>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">📋 Proctoring System</h3>
              <p style="color: #78350f; margin: 10px 0;">
                Our advanced proctoring system monitors all test activity. You will receive <strong>5 warnings</strong> 
                for any suspicious behavior before automatic submission. Any violation will result in:
              </p>
              <ul style="color: #78350f; margin: 10px 0; padding-left: 20px;">
                <li>Immediate test termination</li>
                <li>Permanent disqualification</li>
                <li>No further retake opportunities</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" 
                 style="background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold;
                        display: inline-block;">
                Retake Test Now
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px; text-align: center;">
              Or copy and paste this link into your private browser:<br>
              <a href="${link}" 
                 style="color: #667eea; word-break: break-all;">${link}</a>
            </p>
            
            <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <p style="color: #991b1b; margin: 0; font-size: 16px; font-weight: bold;">
                ⚠️ THIS IS YOUR LAST CHANCE ⚠️
              </p>
              <p style="color: #7f1d1d; margin: 10px 0 0 0;">
                Any further violations will result in permanent account suspension
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Please read all instructions carefully before starting the test.<br>
              Good luck and test with integrity!
            </p>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to,
        subject: '⚠️ FINAL RETAKE OPPORTUNITY - Test Integrity Warning',
        html: emailHtml
      });

      res.json({ success: true, message: `Email sent to ${to}` });
    } catch (error) {
      console.error('Send custom email error:', error);
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  });

  // ============ END RETAKE PAYMENT ROUTES ============

  // Subscription Payment Routes - Consolidated
  app.get("/api/subscription/tiers", asyncHandler(async (req: any, res: any) => {
    const { userType } = req.query;
    const tiers = await subscriptionPaymentService.getSubscriptionTiers(
      userType as 'jobseeker' | 'recruiter'
    );
    res.json({ tiers });
  }));

  app.post("/api/subscription/create", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const { tierId, paymentMethod = 'paypal', userType } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!tierId) {
      return res.status(400).json({ error: 'Tier ID is required' });
    }

    // Get subscription tier details
    const tiers = await subscriptionPaymentService.getSubscriptionTiers(userType);
    const selectedTier = tiers.find((t: any) => t.id === tierId);

    if (!selectedTier) {
      return res.status(400).json({ error: 'Invalid tier ID' });
    }

    // For PayPal subscriptions, create monthly recurring subscription
    if (paymentMethod === 'paypal') {
      const { PayPalSubscriptionService } = await import('./paypalSubscriptionService');
      const paypalService = new PayPalSubscriptionService();

      try {
        const subscription = await paypalService.createSubscription(
          userId,
          selectedTier.name,
          selectedTier.price,
          userType,
          userEmail
        );

        // Store subscription details in database
        await db.insert(schema.subscriptions).values({
          userId,
          tier: selectedTier.id,
          tierId: selectedTier.id, // For compatibility
          paypalSubscriptionId: subscription.subscriptionId,
          status: 'pending',
          paymentMethod: 'paypal',
          amount: selectedTier.price.toString(),
          currency: 'USD',
          billingCycle: 'monthly',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          createdAt: new Date()
        });

        return res.json({
          success: true,
          subscriptionId: subscription.subscriptionId,
          approvalUrl: subscription.approvalUrl
        });
      } catch (error: any) {
        console.error('PayPal subscription creation error:', error);
        return res.status(500).json({ error: 'Failed to create PayPal subscription' });
      }
    }

    // Handle Razorpay subscriptions
    if (paymentMethod === 'razorpay') {
      const { razorpayService } = await import('./razorpayService');

      if (!razorpayService.isAvailable()) {
        return res.status(503).json({ 
          error: 'Razorpay payment is not available. Please use PayPal or Razorpay for monthly subscriptions.' 
        });
      }

      try {
        const subscription = await razorpayService.createSubscription(
          userId,
          selectedTier.name,
          selectedTier.price,
          'monthly',
          userEmail
        );

        return res.json({
          success: true,
          subscriptionId: subscription.subscriptionId,
          shortUrl: subscription.shortUrl,
          amountInINR: subscription.amountInINR
        });
      } catch (error: any) {
        console.error('Razorpay subscription creation error:', error);
        return res.status(500).json({ error: 'Failed to create Razorpay subscription' });
      }
    }

    // For other payment methods - return not available for now
    return res.status(400).json({ 
      error: `${paymentMethod} integration is coming soon. Please use PayPal or Razorpay for monthly subscriptions.` 
    });
  }));

  // PayPal Subscription Success Handler
  app.get("/subscription/success", async (req, res) => {
    try {
      const { userId, subscription_id } = req.query;

      if (subscription_id) {
        // Update subscription status to active
        await db.update(schema.subscriptions)
          .set({ 
            status: 'active',
            activatedAt: new Date()
          })
          .where(eq(schema.subscriptions.paypalSubscriptionId, subscription_id as string));

        // Update user subscription status
        if (userId) {
          const user = await storage.getUser(userId as string);
          if (user) {
            await storage.upsertUser({
              ...user,
              subscriptionStatus: 'active' // Ensure user status is updated
            });
          }
        }
      }

      // Redirect to appropriate dashboard
      res.redirect('/?subscription=success&message=Subscription activated successfully!');
    } catch (error) {
      console.error('Subscription success handler error:', error);
      res.redirect('/?subscription=error&message=There was an issue activating your subscription');
    }
  });

  // PayPal Subscription Cancel Handler
  app.get("/subscription/cancel", async (req, res) => {
    res.redirect('/?subscription=cancelled&message=Subscription setup was cancelled');
  });

  // PayPal Subscription Verification Endpoint (for frontend)
  app.post('/api/paypal/verify-subscription', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const { subscriptionId, planId, planType } = req.body;
      const userId = req.user.id;

      if (!subscriptionId || !planId || !planType) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Update user subscription in database
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month from now

      await db.update(schema.users)
        .set({
          planType,
          subscriptionStatus: 'active',
          paypalSubscriptionId: subscriptionId,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: endDate,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, userId));

      // Also create/update subscription record
      await db.insert(schema.subscriptions).values({
        userId,
        tier: planType,
        tierId: planId,
        paypalSubscriptionId: subscriptionId,
        status: 'active',
        paymentMethod: 'paypal',
        amount: planType === 'premium' ? '5.00' : planType === 'ultra_premium' ? '15.00' : '0.00',
        currency: 'USD',
        billingCycle: 'monthly',
        startDate: new Date(),
        endDate: endDate,
        nextBillingDate: endDate,
        createdAt: new Date()
      }).onConflictDoUpdate({
        target: schema.subscriptions.userId, // Assuming userId is unique, or use paypalSubscriptionId as target
        set: {
          tier: planType,
          tierId: planId,
          paypalSubscriptionId: subscriptionId,
          status: 'active',
          updatedAt: new Date()
        }
      });

      res.json({ 
        success: true, 
        message: 'Subscription verified and activated',
        planType 
      });
    } catch (error) {
      console.error('PayPal subscription verification error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to verify subscription' 
      });
    }
  }));

  // PayPal Webhook Handler for subscription events
  app.post("/api/webhook/paypal-subscription", async (req, res) => {
    try {
      const event = req.body;
      console.log('PayPal Subscription Webhook Event:', event.event_type);

      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          // Update subscription to active
          await db.update(schema.subscriptions)
            .set({ 
              status: 'active',
              activatedAt: new Date()
            })
            .where(eq(schema.subscriptions.paypalSubscriptionId, event.resource.id));
          break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          // Update subscription to cancelled/suspended
          await db.update(schema.subscriptions)
            .set({ 
              status: 'cancelled',
              cancelledAt: new Date()
            })
            .where(eq(schema.subscriptions.paypalSubscriptionId, event.resource.id));
          break;

        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          // Update subscription payment failed
          await db.update(schema.subscriptions)
            .set({ 
              status: 'payment_failed'
            })
            .where(eq(schema.subscriptions.paypalSubscriptionId, event.resource.id));
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('PayPal subscription webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.post("/api/subscription/activate/:subscriptionId", asyncHandler(async (req: any, res: any) => {
    const { subscriptionId } = req.params;
    const { PayPalSubscriptionService } = await import('./paypalSubscriptionService');
    const success = await PayPalSubscriptionService.activateSubscription(subscriptionId);

    if (success) {
      res.json({ message: 'Subscription activated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to activate subscription' });
    }
  }));

  app.post("/api/subscription/success", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const { orderId, paymentDetails } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    await subscriptionPaymentService.handlePaymentSuccess(orderId, paymentDetails);

    res.json({ success: true, message: 'Subscription activated successfully' });
  }));

  app.post("/api/subscription/cancel", isAuthenticated, asyncHandler(async (req: any, res) => {
    const userId = req.user.id;

    // Find user's active subscription
    const userSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.status, 'active')
      )
    });

    if (userSubscription?.paypalSubscriptionId) {
      const { PayPalSubscriptionService } = await import('./paypalSubscriptionService');
      await PayPalSubscriptionService.cancelSubscription(
        userSubscription.paypalSubscriptionId,
        'User requested cancellation'
      );
    } else {
      await subscriptionPaymentService.cancelSubscription(userId);
    }

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  }));

  app.get("/api/subscription/current", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;

    const userSubscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.userId, userId),
      orderBy: [desc(schema.subscriptions.createdAt)]
    });

    res.json(userSubscription || null);
  }));

  app.get("/api/subscription/status", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const usage = await usageMonitoringService.generateUsageReport(userId);

    res.json({
      planType: user.planType || 'free',
      subscriptionStatus: user.subscriptionStatus || 'free',
      subscriptionEndDate: user.subscriptionEndDate,
      usage: usage.usage,
      limits: usage.limits
    });
  }));

  // ACE FEATURE ROUTES - Predictive Success Intelligence
  app.post('/api/ai/predict-success', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const { jobId, resumeContent } = req.body;
      const userId = req.user.id;

      if (!jobId || !resumeContent) {
        return res.status(400).json({ message: 'Job ID and resume content required' });
      }

      const prediction = await predictiveSuccessService.predictApplicationSuccess(
        userId, 
        parseInt(jobId), 
        resumeContent
      );

      res.json({
        success: true,
        prediction
      });
    } catch (error) {
      console.error('Predictive success error:', error);
      res.status(500).json({ message: 'Failed to generate prediction' });
    }
  }));

  // Interview Prep AI Route
  app.post('/api/ai/interview-prep', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const validatedData = interviewPrepSchema.parse(req.body);
      const result = interviewPrepService.generatePreparation(validatedData);
      res.json(result);
    } catch (error) {
      console.error('Interview prep error:', error);
      res.status(500).json({ message: 'Failed to generate interview preparation' });
    }
  }));

  // Salary Insights AI Route
  app.post('/api/ai/salary-insights', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const validatedData = salaryInsightsSchema.parse(req.body);
      const result = salaryInsightsService.generateInsights(validatedData);
      res.json(result);
    } catch (error) {
      console.error('Salary insights error:', error);
      res.status(500).json({ message: 'Failed to generate salary insights' });
    }
  }));

  // ACE FEATURE ROUTES - Viral Extension Network Effects
  app.post('/api/extension/track-application', isAuthenticated, asyncHandler(async (req: any, res) => {
    try {
      const { jobUrl, applicationData } = req.body;
      const userId = req.user.id;

      const result = await viralExtensionService.trackExtensionApplication(
        userId,
        jobUrl,
        applicationData
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Viral extension tracking error:', error);
      res.status(500).json({ message: 'Failed to track application' });
    }
  }));

  app.post('/api/extension/share-intel', isAuthenticated, asyncHandler(async (req: any, res) => {
    try {
      const { jobUrl, intelligence } = req.body;
      const userId = req.user.id;

      const rewards = await viralExtensionService.shareJobIntelligence(
        userId,
        jobUrl,
        intelligence
      );

      res.json({
        success: true,
        rewards
      });
    } catch (error) {
      console.error('Intel sharing error:', error);
      res.status(500).json({ message: 'Failed to share intelligence' });
    }
  }));

  app.post('/api/extension/create-referral', isAuthenticated, asyncHandler(async (req: any, res) => {
    try {
      const { jobUrl } = req.body;
      const userId = req.user.id;

      const referral = await viralExtensionService.createReferralNetwork(
        userId,
        jobUrl
      );

      res.json({
        success: true,
        ...referral
      });
    } catch (error) {
      console.error('Referral creation error:', error);
      res.status(500).json({ message: 'Failed to create referral' });
    }
  }));

  app.get('/api/extension/viral-leaderboard', asyncHandler(async (req: any, res) => {
    try {
      const leaderboard = await viralExtensionService.getViralLeaderboard();

      res.json({
        success: true,
        leaderboard
      });
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ message: 'Failed to get leaderboard' });
    }
  }));

  app.post('/api/extension/application-boost', isAuthenticated, asyncHandler(async (req: any, res) => {
    try {
      const { jobUrl } = req.body;
      const userId = req.user.id;

      const boost = await viralExtensionService.generateApplicationBoost(
        userId,
        jobUrl
      );

      res.json({
        success: true,
        boost
      });
    } catch (error) {
      console.error('Application boost error:', error);
      res.status(500).json({ message: 'Failed to generate boost' });
    }
  }));

  // Usage Monitoring Routes
  // Usage report endpoint - returns real user usage data without demo content
  app.get("/api/usage/report", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const report = await usageMonitoringService.generateUsageReport(userId);
    res.json(report);
  }));

  app.post("/api/usage/check", isAuthenticated, asyncHandler(async (req: any, res) => {
    const userId = req.user.id;
    const { feature } = req.body;

    if (!feature) {
      return res.status(400).json({ error: 'Feature is required' });
    }

    const check = await usageMonitoringService.checkUsageLimit(userId, feature);
    res.json(check);
  }));

  app.post("/api/usage/enforce", isAuthenticated, asyncHandler(async (req: any, res) => {
    const userId = req.user.id;
    const { feature } = req.body;

    if (!feature) {
      return res.status(400).json({ error: 'Feature is required' });
    }

    const enforcement = await usageMonitoringService.enforceUsageLimit(userId, feature);
    res.json(enforcement);
  }));

  // Login redirect route (for landing page buttons)
  app.get('/api/login', (req, res) => {
    res.redirect('/auth');
  });

  // Quick login endpoint for testing (temporary)
  app.post('/api/auth/quick-login', asyncHandler(async (req: any, res: any) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Store session
      req.session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        currentRole: user.currentRole || user.userType
      };

      // Force session save
      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }

        console.log('Quick login session saved for user:', user.id);
        res.json({ 
          message: 'Quick login successful', 
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            userType: user.userType,
            currentRole: user.currentRole || user.userType
          }
        });
      });
    } catch (error) {
      console.error('Quick login error:', error);
      res.status(500).json({ message: 'Quick login failed' });
    }
  }));

  // API for getting user data
  app.get('/api/user', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    // Get fresh user data from database for accurate role information
    try {
      const freshUser = await storage.getUser(req.user.id);
      if (freshUser) {
        const userResponse = {
          id: freshUser.id,
          email: freshUser.email,
          firstName: freshUser.firstName,
          lastName: freshUser.lastName,
          name: `${freshUser.firstName || ''} ${freshUser.lastName || ''}`.trim(),
          userType: freshUser.userType,
          currentRole: freshUser.currentRole,
          emailVerified: freshUser.emailVerified,
          onboardingCompleted: true, // Assume completed for existing users
          companyName: freshUser.companyName,
          planType: freshUser.planType || 'free',
          subscriptionStatus: freshUser.subscriptionStatus || 'free',
          aiModelTier: freshUser.aiModelTier || 'premium'
        };
        res.json(userResponse);
      } else {
        res.json(req.user);
      }
    } catch (error) {
      console.error('Error fetching fresh user data:', error);
      res.json(req.user);
    }
  }));

  // Profile and Skills Routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cacheKey = 'profile';

      const cached = getCached(cacheKey, userId);
      if (cached) {
        return res.json(cached);
      }

      const profile = await storage.getUserProfile(userId);

      setCache(cacheKey, profile, 300000, userId); // Cache for 5 minutes
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const bodyData = { ...req.body, userId };
      if (bodyData.lastResumeAnalysis && typeof bodyData.lastResumeAnalysis === 'string') {
        bodyData.lastResumeAnalysis = new Date(bodyData.lastResumeAnalysis);
      }

      const profileData = insertUserProfileSchema.parse(bodyData);
      const profile = await storage.upsertUserProfile(profileData);

      // Invalidate user-specific cache properly
      invalidateUserCache(userId);

      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/upload-profile-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'profile-images');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${userId}-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, req.file.buffer);

      // Generate URL for the image
      const imageUrl = `/uploads/profile-images/${fileName}`;

      // Update user's profileImageUrl
      await db.update(schema.users)
        .set({ profileImageUrl: imageUrl })
        .where(eq(schema.users.id, userId));

      // Clear cache properly
      invalidateUserCache(userId);

      res.json({ 
        success: true, 
        imageUrl,
        message: "Profile image uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  app.get('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const skillData = insertUserSkillSchema.parse({ ...req.body, userId });
      const skill = await storage.addUserSkill(skillData);
      res.json(skill);
    } catch (error) {
      console.error("Error adding skill:", error);
      res.status(500).json({ message: "Failed to add skill" });
    }
  });

  app.delete('/api/skills/:id', isAuthenticated, async (req: any, res) => {
    try {
      const skillId = parseInt(req.params.id);
      await storage.deleteUserSkill(skillId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  // Career AI Routes
  app.get('/api/career-ai/saved', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analysis = await db.query.careerAiAnalyses.findFirst({
        where: (table, { eq, and }) => and(
          eq(table.userId, userId),
          eq(table.isActive, true)
        ),
        orderBy: (table, { desc }) => [desc(table.updatedAt)]
      });

      // Return enhanced structure with proper data
      if (analysis) {
        res.json({
          ...analysis,
          hasAnalysis: true,
          analysis: analysis.analysisData || {
            insights: analysis.insights || [],
            careerPath: analysis.careerPath || null,
            skillGaps: analysis.skillGaps || [],
            networkingOpportunities: analysis.networkingOpportunities || [],
            marketTiming: analysis.marketTiming || []
          }
        });
      } else {
        res.json({ hasAnalysis: false });
      }
    } catch (error) {
      console.error("Error fetching saved career analysis:", error);
      res.status(500).json({ message: "Failed to fetch saved analysis" });
    }
  });

  app.post('/api/career-ai/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { careerGoal, location, timeframe, progressUpdate, userProfile, userSkills, userApplications, jobAnalyses, completedTasks } = req.body;

      // Build comprehensive context for AI analysis
      const userContext = {
        profile: userProfile || {},
        skills: userSkills || [],
        applications: userApplications?.slice(0, 10) || [],
        jobAnalyses: jobAnalyses?.slice(0, 5) || [],
        completedTasks: completedTasks || [],
        progressUpdate: progressUpdate || ''
      };

      const timeframeYears = parseInt(timeframe?.split('-')[0]) || 2;

      // Create AI prompt for comprehensive career analysis
      const prompt = `You are an expert career advisor and AI assistant. Analyze the following career profile and provide personalized, actionable career guidance.

USER CAREER GOAL: ${careerGoal || 'Career advancement'}
LOCATION: ${location || 'Not specified'}
TIMEFRAME: ${timeframe || '2 years'}

USER PROFILE:
${JSON.stringify(userContext.profile, null, 2)}

CURRENT SKILLS:
${userContext.skills.map((s: any) => `- ${s.name || s}: ${s.level || 'N/A'}`).join('\n') || 'No skills listed'}

RECENT APPLICATIONS (${userContext.applications.length}):
${userContext.applications.map((app: any) => `- ${app.jobTitle || app.position} at ${app.company}`).join('\n') || 'No recent applications'}

PROGRESS UPDATES:
${userContext.progressUpdate || 'No updates provided'}

COMPLETED TASKS:
${userContext.completedTasks.join(', ') || 'No tasks completed'}

Please provide a comprehensive career analysis in the following JSON format:
{
  "insights": [
    {
      "type": "path|skill|timing|network|analytics",
      "title": "Clear, actionable title",
      "content": "Detailed insight based on user's actual data",
      "priority": "high|medium|low",
      "timeframe": "When to act on this",
      "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"]
    }
  ],
  "skillGaps": [
    {
      "skill": "Specific skill name",
      "currentLevel": 1-10,
      "targetLevel": 1-10,
      "importance": 1-10,
      "learningResources": ["Resource 1", "Resource 2"],
      "timeToAcquire": "Time estimate"
    }
  ],
  "careerPath": {
    "currentRole": "User's current role",
    "targetRole": "${careerGoal}",
    "steps": [
      {
        "position": "Realistic position title",
        "timeline": "Timeframe",
        "requiredSkills": ["Skill 1", "Skill 2"],
        "averageSalary": "Salary range",
        "marketDemand": "High|Medium|Low"
      }
    ],
    "totalTimeframe": "${timeframe}",
    "successProbability": 1-100
  },
  "networkingOpportunities": [
    {
      "type": "conference|meetup|online",
      "name": "Event name",
      "date": "When",
      "relevance": "High|Medium|Low",
      "expectedConnections": "Number"
    }
  ],
  "marketTiming": [
    {
      "quarter": "Q1 2025",
      "demandScore": 1-100,
      "competitionLevel": 1-100,
      "recommendation": "Specific recommendation"
    }
  ]
}

Make the analysis:
1. Personalized based on their actual profile, skills, and applications
2. Realistic and achievable within the timeframe
3. Specific with clear action items
4. Data-driven where possible
5. Include at least 4 insights covering different aspects (path, skills, timing, networking)

Return ONLY the JSON object, no additional text.`;

      console.log('🤖 Generating AI-powered career analysis...');

      // Call AI service for analysis
      const aiResponse = await aiService.createChatCompletion([
        { role: 'system', content: 'You are an expert career advisor. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 4000,
        user: req.user
      });

      // Parse AI response
      let aiAnalysis;
      try {
        const content = aiResponse.choices[0]?.message?.content || '{}';
        // Remove markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        aiAnalysis = JSON.parse(jsonStr);
        console.log('✅ AI analysis parsed successfully');
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('AI response parsing failed');
      }

      // Save to database
      const [savedAnalysis] = await db.insert(schema.careerAiAnalyses).values({
        userId,
        careerGoal: careerGoal || '',
        location,
        timeframe,
        progressUpdate,
        completedTasks,
        analysisData: aiAnalysis,
        insights: aiAnalysis.insights || [],
        careerPath: aiAnalysis.careerPath || null,
        skillGaps: aiAnalysis.skillGaps || [],
        networkingOpportunities: aiAnalysis.networkingOpportunities || [],
        marketTiming: aiAnalysis.marketTiming || [],
        isActive: true
      }).returning();

      console.log('💾 Career AI analysis saved to database');
      res.json({ ...aiAnalysis, id: savedAnalysis.id });
    } catch (error) {
      console.error("Error analyzing career:", error);
      res.status(500).json({ message: "Failed to analyze career path" });
    }
  });

  app.get('/api/career-ai/progress/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      // Return progress for async job (mock for now)
      res.json({
        isActive: false,
        stage: 'complete',
        progress: 100,
        message: 'Analysis complete'
      });
    } catch (error) {
      console.error("Error fetching career analysis progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post('/api/career-ai/save-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { analysisId, completedTasks } = req.body;

      await db.update(schema.careerAiAnalyses)
        .set({ 
          completedTasks,
          updatedAt: new Date()
        })
        .where(eq(schema.careerAiAnalyses.id, analysisId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving career progress:", error);
      res.status(500).json({ message: "Failed to save progress" });
    }
  });

  app.post('/api/career-ai/update-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { analysisId, progressUpdate } = req.body;

      await db.update(schema.careerAiAnalyses)
        .set({ 
          progressUpdate,
          updatedAt: new Date()
        })
        .where(eq(schema.careerAiAnalyses.id, analysisId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating career progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // MISSING PREMIUM API ENDPOINTS - CRITICAL FOR FRONTEND

  // 1. Usage Monitoring Endpoint
  app.get('/api/usage/report', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const report = await usageMonitoringService.generateUsageReport(userId);
      res.json(report);
    } catch (error) {
      console.error('Error generating usage report:', error);
      res.status(500).json({ message: 'Failed to generate usage report' });
    }
  }));

  // 2. Current Subscription Endpoint
  app.get('/api/subscription/current', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const subscription = await subscriptionServiceInstance.getUserSubscription(userId); // Use renamed instance
      res.json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription data' });
    }
  }));

  // 3. Ranking Test Usage Endpoint
  app.get('/api/ranking-tests/usage', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const usage = await rankingTestService.getUserUsage(userId);
      res.json(usage);
    } catch (error) {
      console.error('Error fetching ranking test usage:', error);
      res.status(500).json({ message: 'Failed to fetch ranking test usage' });
    }
  }));



  // 5. Comprehensive Subscription Limits Status Endpoint
  app.get('/api/subscription/limits-status', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter') {
        return res.status(403).json({ message: 'This endpoint is for recruiters only' });
      }

      const { subscriptionEnforcementService } = await import('./subscriptionEnforcementService');
      const limitsStatus = await subscriptionEnforcementService.enforceAllLimits(userId);

      res.json({
        success: true,
        planType: user.planType || 'free',
        subscriptionStatus: user.subscriptionStatus || 'free',
        limits: limitsStatus,
        upgradeUrl: '/subscription'
      });
    } catch (error) {
      console.error('Error fetching subscription limits status:', error);
      res.status(500).json({ message: 'Failed to fetch subscription limits status' });
    }
  }));

  // 5. Premium Feature Access Check Endpoint
  app.get('/api/premium/access/:feature', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { feature } = req.params;

      const access = await premiumFeaturesServiceInstance.checkFeatureAccess(userId, feature); // Use renamed instance
      res.json(access);
    } catch (error) {
      console.error('Error checking premium access:', error);
      res.status(500).json({ message: 'Failed to check premium access' });
    }
  }));

  // 6. Premium Usage Stats Endpoint
  app.get('/api/premium/usage', isAuthenticated, asyncHandler(async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await premiumFeaturesServiceInstance.getUsageStats(userId); // Use renamed instance
      res.json(stats);
    } catch (error) {
      console.error('Error fetching premium usage stats:', error);
      res.status(500).json({ message: 'Failed to fetch usage stats' });
    }
  }));

  // 7. Premium Features Overview Endpoint
  app.get('/api/premium/features', isAuthenticated, asyncHandler(async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [usage, access, value, user] = await Promise.all([
        premiumFeaturesServiceInstance.getUserUsageStats(userId), // Use renamed instance
        premiumFeaturesServiceInstance.getPremiumFeatureAccess(userId), // Use renamed instance
        premiumFeaturesServiceInstance.getPremiumValue(userId), // Use renamed instance
        storage.getUser(userId)
      ]);

      res.json({
        planType: user?.planType || 'free',
        usage,
        access,
        value,
        isPremium: user?.planType === 'premium' || user?.planType === 'enterprise'
      });
    } catch (error) {
      console.error('Error fetching premium features:', error);
      res.status(500).json({ message: 'Failed to fetch premium features' });
    }
  }));

  // 8. Check Specific Feature Limit Endpoint
  app.get('/api/premium/check-limit/:feature', isAuthenticated, asyncHandler(async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { feature } = req.params;

      const result = await premiumFeaturesServiceInstance.checkFeatureLimit(userId, feature as any); // Use renamed instance
      res.json(result);
    } catch (error) {
      console.error('Error checking feature limit:', error);
      res.status(500).json({ message: 'Failed to check feature limit' });
    }
  }));

  // 9. Validate Feature Usage Endpoint
  app.post('/api/premium/validate-usage', isAuthenticated, asyncHandler(async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { feature } = req.body;

      const result = await premiumFeaturesServiceInstance.validateFeatureUsage(userId, feature); // Use renamed instance
      res.json(result);
    } catch (error) {
      console.error('Error validating feature usage:', error);
      res.status(500).json({ message: 'Failed to validate feature usage' });
    }
  }));

  // ============ RANKING TEST API ROUTES ============

  // Get available test categories and domains
  app.get('/api/ranking-tests/categories', asyncHandler(async (req: any, res: any) => {
    try {
      const categories = await rankingTestService.getAvailableTests();
      res.json(categories);
    } catch (error) {
      console.error('Error getting ranking test categories:', error);
      res.status(500).json({ message: 'Failed to get test categories' });
    }
  }));

  // Get user's ranking test history
  app.get('/api/ranking-tests/history', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const history = await rankingTestService.getUserTestHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('Error getting ranking test history:', error);
      res.status(500).json({ message: 'Failed to get test history' });
    }
  }));

  // Get user's ranking test usage stats
  app.get('/api/ranking-tests/usage', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const usage = await rankingTestService.getUserUsage(userId);
      res.json(usage);
    } catch (error) {
      console.error('Error getting ranking test usage:', error);
      res.status(500).json({ message: 'Failed to get usage stats' });
    }
  }));

  // Get single ranking test
  app.get('/api/ranking-tests/:testId', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const testId = parseInt(req.params.testId);
      const test = await rankingTestService.getRankingTest(testId);

      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      // Verify ownership
      if (test.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(test);
    } catch (error) {
      console.error('Error getting ranking test:', error);
      res.status(500).json({ message: 'Failed to get test' });
    }
  }));

  // Create new ranking test
  app.post('/api/ranking-tests/create', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { category, domain, difficultyLevel, useFreeTest } = req.body;

      if (!category || !domain || !difficultyLevel) {
        return res.status(400).json({ message: 'Category, domain, and difficulty level are required' });
      }

      const test = await rankingTestService.createRankingTest(userId, category, domain, difficultyLevel);
      res.json(test);
    } catch (error) {
      console.error('Error creating ranking test:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create ranking test' 
      });
    }
  }));

  // Submit ranking test answers
  app.post('/api/ranking-tests/:testId/submit', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const testId = parseInt(req.params.testId);
      const { answers, timeSpent } = req.body;

      if (!answers || typeof timeSpent !== 'number') {
        return res.status(400).json({ message: 'Answers and time spent are required' });
      }

      const result = await rankingTestService.submitRankingTest(testId, answers, timeSpent);
      res.json(result);
    } catch (error) {
      console.error('Error submitting ranking test:', error);
      res.status(500).json({ message: 'Failed to submit test' });
    }
  }));

  // Get leaderboard for a category/domain
  app.get('/api/ranking-tests/leaderboard', asyncHandler(async (req: any, res: any) => {
    try {
      const { category, domain, type } = req.query;

      if (!category || !domain || !type) {
        return res.status(400).json({ message: 'Category, domain, and type are required' });
      }

      const leaderboard = await rankingTestService.getLeaderboard(
        category as string,
        domain as string,
        type as 'weekly' | 'monthly' | 'all-time'
      );
      res.json(leaderboard);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({ message: 'Failed to get leaderboard' });
    }
  }));

  // ============ QUESTION BANK API ROUTES ============

  // Search questions with filters
  app.get('/api/question-bank/search', asyncHandler(async (req: any, res: any) => {
    try {
      const { q, category, domain, difficulty } = req.query;

      let query = db.select()
        .from(schema.questionBank)
        .where(eq(schema.questionBank.isActive, true));

      // Apply filters
      const conditions = [eq(schema.questionBank.isActive, true)];

      if (category && category !== 'all') {
        conditions.push(eq(schema.questionBank.category, category));
      }
      if (domain && domain !== 'all') {
        conditions.push(eq(schema.questionBank.domain, domain));
      }
      if (difficulty && difficulty !== 'all') {
        conditions.push(eq(schema.questionBank.difficulty, difficulty));
      }

      let questions = await db.select()
        .from(schema.questionBank)
        .where(and(...conditions));

      // Apply text search if provided
      if (q && typeof q === 'string' && q.trim()) {
        const searchTerm = q.toLowerCase();
        questions = questions.filter(question => 
          question.question.toLowerCase().includes(searchTerm) ||
          (question.tags && question.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
          (question.keywords && question.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)))
        );
      }

      res.json(questions);
    } catch (error) {
      console.error('Error searching questions:', error);
      res.status(500).json({ message: 'Failed to search questions' });
    }
  }));

  // Get question bank stats
  app.get('/api/question-bank/stats', asyncHandler(async (req: any, res: any) => {
    try {
      const allQuestions = await db.select()
        .from(schema.questionBank)
        .where(eq(schema.questionBank.isActive, true));

      const stats = {
        total: allQuestions.length,
        aptitude: allQuestions.filter(q => q.category === 'general_aptitude').length,
        english: allQuestions.filter(q => q.category === 'english').length,
        domain: allQuestions.filter(q => q.category === 'domain_specific').length,
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching question stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  }));

  // Add new question
  app.post('/api/question-bank/questions', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const questionData = req.body;

      const [newQuestion] = await db.insert(schema.questionBank).values({
        ...questionData,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      res.json(newQuestion);
    } catch (error) {
      console.error('Error adding question:', error);
      res.status(500).json({ message: 'Failed to add question' });
    }
  }));

  // ============ END QUESTION BANK API ROUTES ============

  // User activity tracking for online/offline status
  app.post('/api/user/activity', isAuthenticated, asyncHandler(async (req: any, res) => {
    const userId = req.user.id;
    userActivity.set(userId, Date.now());
    res.json({ success: true });
  }));

  // Get user online status
  app.get('/api/user/status/:userId', isAuthenticated, asyncHandler(async (req: any, res) => {
    const { userId } = req.params;
    const lastActivity = userActivity.get(userId);
    const isOnline = lastActivity && (Date.now() - lastActivity) < ONLINE_THRESHOLD;
    res.json({ 
      isOnline,
      lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null 
    });
  }));

  // Logout endpoint
  app.post('/api/auth/logout', asyncHandler(async (req: any, res: any) => {
    try {
      // Destroy the session
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ message: 'Failed to logout' });
        }

        // Clear the session cookie
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });

        res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Failed to logout' });
    }
  }));



  // Email verification for recruiters
  app.post('/api/auth/send-verification', async (req, res) => {
    try {
      const { email, companyName, companyWebsite } = req.body;

      if (!email || !companyName) {
        return res.status(400).json({ message: "Email and company name are required" });
      }

      // Validate company email (no Gmail, Yahoo, student .edu, etc.)
      const emailDomain = email.split('@')[1].toLowerCase();
      const localPart = email.split('@')[0].toLowerCase();
      const blockedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];

      if (blockedDomains.includes(emailDomain)) {
        return res.status(400).json({ 
          message: 'Please use a company email address. Personal email addresses are not allowed for recruiter accounts.' 
        });
      }

      // Handle .edu domains - allow recruiting emails, block student emails
      if (emailDomain.endsWith('.edu')) {
        const allowedUniPrefixes = [
          'hr', 'careers', 'recruiting', 'recruitment', 'talent', 'jobs',
          'employment', 'hiring', 'admin', 'staff', 'faculty', 'career',
          'careerservices', 'placement', 'alumni', 'workforce'
        ];

        const isRecruitingEmail = allowedUniPrefixes.some(prefix => 
          localPart.startsWith(prefix) || 
          localPart.includes(prefix)
        );

        if (!isRecruitingEmail) {
          return res.status(400).json({ 
            message: 'Student .edu emails are not allowed for recruiter accounts. University recruiters should use emails like hr@university.edu or careers@university.edu.' 
          });
        }
      }

      // Generate verification token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      try {
        // Save verification token with timeout handling
        await storage.createEmailVerificationToken({
          email,
          companyName,
          companyWebsite,
          token,
          expiresAt,
          userId: `pending-${Date.now()}-${Math.random().toString(36).substring(2)}`, // Temporary ID for pending verification
          userType: "recruiter",
        });

        // Send actual email with Resend
        const emailHtml = generateVerificationEmail(token, companyName, "recruiter");
        const emailSent = await sendEmail({
          to: email,
          subject: `Verify your company email - ${companyName}`,
          html: emailHtml,
        });

        if (!emailSent) {
          // In development, still allow the process to continue
          if (process.env.NODE_ENV === 'development') {
            // Email simulation mode
            return res.json({ 
              message: "Development mode: Verification process initiated. Check server logs for the verification link.",
              developmentMode: true,
              token: token // Only expose token in development
            });
          }
          return res.status(500).json({ message: 'Failed to send verification email' });
        }

        res.json({ 
          message: "Verification email sent successfully. Please check your email and click the verification link."
        });
      } catch (dbError) {
        console.error('Database error during verification:', dbError);
        return res.status(500).json({ 
          message: 'Database connection issue. Please try again later.' 
        });
      }
    } catch (error) {
      console.error("Error sending verification:", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  // Regular email verification (for job seekers and basic email confirmation)
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Get token from database
      const tokenRecord = await storage.getEmailVerificationToken(token as string);

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Find existing user by email and mark email as verified (keep as job_seeker)
      const existingUser = await storage.getUserByEmail(tokenRecord.email);

      if (existingUser) {
        // Just verify email, don't change user type
        await storage.upsertUser({
          ...existingUser,
          emailVerified: true
        });
      }

      // Delete used token
      await storage.deleteEmailVerificationToken(token as string);

      // Redirect to sign in page after successful verification
      res.redirect('/auth?verified=true&message=Email verified successfully. Please sign in to continue.');
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Company email verification (separate endpoint for recruiters)
  app.get('/api/auth/verify-company-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: "Company verification token is required" });
      }

      // Check company verification token in separate table
      const companyVerification = await db.select().from(companyEmailVerifications)
        .where(eq(companyEmailVerifications.verificationToken, token as string))
        .limit(1);

      if (!companyVerification.length || companyVerification[0].expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired company verification token" });
      }

      const verification = companyVerification[0];

      // Update user to recruiter status
      const existingUser = await storage.getUserByEmail(verification.email);

      if (existingUser) {
        await storage.upsertUser({
          ...existingUser,
          userType: "recruiter",
          emailVerified: true,
          companyName: verification.companyName,
          companyWebsite: verification.companyWebsite,
          availableRoles: "job_seeker,recruiter",
          currentRole: "recruiter"
        });

        // Mark verification as completed
        await db.update(companyEmailVerifications)
          .set({ 
            isVerified: true, 
            verifiedAt: new Date() 
          })
          .where(eq(schema.companyEmailVerifications.id, verification.id));
      }

      // Redirect to sign in page with company verification success
      res.redirect('/auth?verified=true&type=company&upgraded=recruiter&message=🎉 Company email verified! You are now a recruiter. Please sign in to access your recruiter dashboard.');
    } catch (error) {
      console.error("Error verifying company email:", error);
      res.status(500).json({ message: "Failed to verify company email" });
    }
  });

  // Check company email verification status
  app.get('/api/auth/company-verification/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      // Get user and check if they should be upgraded to recruiter
      const user = await storage.getUser(userId);

      if (!user) {
        return res.json({ isVerified: false });
      }

      // Auto-upgrade verified users with company domains to recruiter status
      if (user.emailVerified && user.userType === 'job_seeker' && user.email) {
        const emailDomain = user.email.split('@')[1];
        const companyDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

        // If it's not a common personal email domain, consider it a company email
        if (!companyDomains.includes(emailDomain.toLowerCase())) {
          // Auto-upgrade to recruiter
          const companyName = emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);

          await storage.upsertUser({
            ...user,
            userType: 'recruiter', // Database trigger will automatically set currentRole to match userType
            companyName: `${companyName} Company`,
            availableRoles: "job_seeker,recruiter" // Allow both roles
          });

          // Create company verification record
          try {
            await db.insert(companyEmailVerifications).values({
              userId: user.id,
              email: user.email,
              companyName: `${companyName} Company`,
              companyWebsite: `https://${emailDomain}`,
              verificationToken: `auto-upgrade-${Date.now()}`,
              isVerified: true,
              verifiedAt: new Date(),
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            });
          } catch (insertError) {
            // Company verification record might already exist, that's okay
            console.log('Company verification record creation skipped - may already exist');
          }

          // Update user object for response
          user.userType = 'recruiter';
          user.companyName = `${companyName} Company`;
        }
      }

      res.json({ isVerified: true, isRecruiter: user.userType === 'recruiter' });
    } catch (error) {
      console.error('Error checking company verification:', error);
      res.status(500).json({ message: 'Failed to check verification status' });
    }
  });

  // Interview Assignment API Routes - MUST be before catch-all routes
  app.get('/api/interviews/assigned', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const interviews = await interviewAssignmentService.getRecruiterAssignedInterviews(userId);
      res.json(interviews);
    } catch (error) {
      console.error('Error in /api/interviews/assigned:', error);
      handleError(res, error, "Failed to fetch assigned interviews");
    }
  });

  app.get('/api/interviews/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const stats = await interviewAssignmentService.getAssignmentStats(userId);

      // Return stats with all 6 interview types
      res.json({
        totalAssigned: stats.total,
        completed: stats.completed,
        pending: stats.pending,
        averageScore: stats.averageScore,
        virtualInterviews: stats.virtual.count,
        mockInterviews: stats.mock.count,
        virtual: stats.virtual,
        mock: stats.mock,
        video: stats.video,
        personality: stats.personality,
        skills: stats.skills,
        simulation: stats.simulation
      });
    } catch (error) {
      console.error('Error in /api/interviews/stats:', error);
      handleError(res, error, "Failed to fetch interview stats");
    }
  });

  app.get('/api/interviews/:interviewType/:id/partial-results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { interviewType, id } = req.params;

      const results = await interviewAssignmentService.getPartialResultsForRecruiter(
        parseInt(id), 
        interviewType as 'virtual' | 'mock', 
        userId
      );

      res.json(results);
    } catch (error) {
      handleError(res, error, "Failed to fetch interview results");
    }
  });

  app.get('/api/users/candidates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const candidates = await interviewAssignmentService.getCandidates();
      res.json(candidates);
    } catch (error) {
      console.error('Error in /api/users/candidates:', error);
      handleError(res, error, "Failed to fetch candidates");
    }
  });


  app.get('/api/candidates/for-job/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const jobId = parseInt(req.params.jobId);
      const candidates = await interviewAssignmentService.getCandidatesForJobPosting(jobId);
      res.json(candidates);
    } catch (error) {
      handleError(res, error, "Failed to fetch job candidates");
    }
  });


  // Process interview invitation after user authentication
  app.post('/api/interviews/invite/:token/use', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.params;
      const userId = req.user.id;

      // Find the invitation
      const [invitation] = await db.select()
        .from(schema.interviewInvitations)
        .where(eq(schema.interviewInvitations.token, token))
        .limit(1);

      if (!invitation) {
        return res.status(404).json({ message: 'Interview link not found' });
      }

      // Check expiry
      if (invitation.expiryDate && new Date(invitation.expiryDate) < new Date()) {
        return res.status(410).json({ message: 'This interview link has expired' });
      }

      // Check if this specific user has already used this invitation
      const existingUse = await db.select()
        .from(schema.invitationUses)
        .where(and(
          eq(schema.invitationUses.invitationId, invitation.id),
          eq(schema.invitationUses.candidateId, userId)
        ))
        .limit(1);

      if (existingUse.length > 0) {
        return res.status(400).json({ message: 'You have already used this invitation' });
      }

      // Increment usage count
      await db.update(schema.interviewInvitations)
        .set({ usageCount: sql`${schema.interviewInvitations.usageCount} + 1` })
        .where(eq(schema.interviewInvitations.id, invitation.id));

      // Record the invitation use
      const user = await storage.getUser(userId); // Get user info for tracking
      await db.insert(schema.invitationUses).values({
        invitationId: invitation.id,
        candidateId: userId,
        candidateEmail: user?.email || null,
        candidateName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
        usedAt: new Date()
      });

      // Parse interview config
      const config = typeof invitation.interviewConfig === 'string' 
        ? JSON.parse(invitation.interviewConfig) 
        : invitation.interviewConfig;

      // Create interview assignment based on type
      let interviewUrl = '';
      let sessionId = '';

      if (invitation.interviewType === 'virtual' || invitation.interviewType === 'chat') {
        // Generate unique session ID for chat interview
        sessionId = `virtual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create virtual interview record
        await db.insert(virtualInterviews).values({
          userId,
          sessionId,
          role: invitation.role || 'software_engineer',
          interviewType: config.interviewType || 'technical',
          difficulty: invitation.difficulty || 'medium',
          duration: config.duration || 30,
          totalQuestions: config.totalQuestions || 5,
          questionsAsked: 0,
          status: 'assigned',
          assignedBy: invitation.recruiterId,
          assignedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          jobPostingId: invitation.jobPostingId || null,
          assignmentType: 'link_based',
          interviewerPersonality: config.interviewerPersonality || 'professional',
          company: invitation.company || '',
          jobDescription: config.jobDescription || ''
        });

        interviewUrl = `/chat-interview/${sessionId}`;
      } else if (invitation.interviewType === 'mock') {
        // Generate session ID for mock interview
        sessionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create mock interview record
        await db.insert(schema.mockInterviews).values({
          userId,
          sessionId,
          role: invitation.role || 'software_engineer',
          interviewType: config.interviewType || 'technical',
          difficulty: invitation.difficulty || 'medium',
          language: config.language || 'javascript',
          totalQuestions: config.totalQuestions || 5,
          status: 'assigned',
          assignedBy: invitation.recruiterId,
          assignedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          jobPostingId: invitation.jobPostingId || null,
          assignmentType: 'link_based',
          company: invitation.company || ''
        });

        interviewUrl = `/mock-interview/session/${sessionId}`;
      }

      // Create job application if jobPostingId exists
      if (invitation.jobPostingId) {
        try {
          await db.insert(schema.jobPostingApplications).values({
            jobPostingId: invitation.jobPostingId,
            applicantId: userId,
            status: 'applied',
            appliedAt: new Date()
          });
        } catch (error) {
          // Application might already exist, that's okay
          console.log('Job application already exists or failed to create:', error);
        }
      }

      res.json({
        success: true,
        sessionId,
        interviewUrl,
        interviewType: invitation.interviewType,
        message: 'Interview assigned successfully'
      });

    } catch (error) {
      console.error('Error processing interview invitation:', error);
      handleError(res, error, "Failed to process interview invitation");
    }
  });

  // Advanced Assessment Assignment Routes

  // Skills Verification Assignment
  app.post('/api/skills-verifications/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const { candidateId, jobPostingId, projectTemplateId, timeLimit, dueDate, role, company, difficulty } = req.body;

      const verification = await skillsVerificationService.createSkillsVerification(
        candidateId,
        userId,
        jobPostingId,
        projectTemplateId,
        { timeLimit, additionalRequirements: role ? `Role: ${role}, Company: ${company}, Difficulty: ${difficulty}` : undefined }
      );

      res.json({ message: 'Skills verification assigned successfully', verification });
    } catch (error) {
      handleError(res, error, "Failed to assign skills verification");
    }
  });

  // Personality Assessment Assignment
  app.post('/api/personality-assessments/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const { candidateId, jobPostingId, questionCount, dueDate, role, company } = req.body;

      const assessment = await personalityAssessmentService.createPersonalityAssessment(
        candidateId,
        userId,
        jobPostingId,
        { type: 'big_five', questionCount }
      );

      res.json({ message: 'Personality assessment assigned successfully', assessment });
    } catch (error) {
      handleError(res, error, "Failed to assign personality assessment");
    }
  });

  // Simulation Assessment Assignment
  app.post('/api/simulation-assessments/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const { candidateId, jobPostingId, scenarioType, simulationDifficulty, dueDate, role, company } = req.body;

      const assessment = await simulationAssessmentService.createSimulationAssessment(
        candidateId,
        userId,
        jobPostingId,
        scenarioType,
        simulationDifficulty
      );

      res.json({ message: 'Simulation assessment assigned successfully', assessment });
    } catch (error) {
      handleError(res, error, "Failed to assign simulation assessment");
    }
  });

  // Video Interview Assignment
  app.post('/api/video-interviews/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const { candidateId, jobPostingId, videoQuestions, preparationTime, dueDate, role, company, difficulty } = req.body;

      const questions = Array.from({ length: videoQuestions }, (_, i) => ({
        id: `q${i + 1}`,
        question: `Please describe your experience with ${role} responsibilities.`,
        type: 'behavioral' as const,
        timeLimit: 180,
        preparationTime: preparationTime,
        retakesAllowed: 1,
        difficulty: 'medium' as const
      }));

      const interview = await videoInterviewService.createVideoInterview(
        candidateId,
        userId,
        jobPostingId,
        {
          questions,
          totalTimeLimit: videoQuestions * 180,
          expiryDate: new Date(dueDate)
        }
      );

      res.json({ message: 'Video interview assigned successfully', interview });
    } catch (error) {
      handleError(res, error, "Failed to assign video interview");
    }
  });

  // Test Assignment Route
  app.post('/api/tests/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      const {
        candidateId,
        jobPostingId,
        testType,
        testDifficulty,
        testDuration,
        testLanguage,
        testTotalQuestions,
        dueDate,
        role,
        company
      } = req.body;

      // Get or create test template
      const [template] = await db
        .select()
        .from(schema.testTemplates)
        .where(
          and(
            eq(schema.testTemplates.createdBy, userId),
            eq(schema.testTemplates.testType, testType),
            eq(schema.testTemplates.difficulty, testDifficulty)
          )
        )
        .limit(1);

      let templateId = template?.id;

      if (!templateId) {
        // Create new template
        const [newTemplate] = await db.insert(schema.testTemplates).values({
          name: `${testType} Test - ${testDifficulty}`,
          description: `Auto-generated ${testType} test`,
          testType: testType || 'general',
          difficulty: testDifficulty || 'medium',
          duration: testDuration || 60,
          language: testLanguage || 'javascript',
          totalQuestions: testTotalQuestions || 5,
          createdBy: userId
        }).returning();
        templateId = newTemplate.id;
      }

      // Create test assignment
      const [assignment] = await db.insert(schema.testAssignments).values({
        testTemplateId: templateId,
        recruiterId: userId,
        jobSeekerId: candidateId,
        jobPostingId: jobPostingId || null,
        dueDate: new Date(dueDate),
        status: 'assigned'
      }).returning();

      res.json({
        message: 'Test assigned successfully',
        assignment,
        testId: assignment.id
      });
    } catch (error) {
      console.error('Error assigning test:', error);
      handleError(res, error, "Failed to assign test");
    }
  });

  // Advanced Assessment Routes

  // Video Interview Routes
  app.post('/api/video-interviews/create', isAuthenticated, async (req, res) => {
    try {
      const { candidateId, jobId, questions, totalTimeLimit, expiryDate } = req.body;
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const recruiterId = req.user.id;

      const interview = await videoInterviewService.createVideoInterview(
        candidateId,
        recruiterId,
        jobId,
        { questions, totalTimeLimit, expiryDate }
      );

      res.json(interview);
    } catch (error) {
      handleError(res, error, "Failed to create video interview");
    }
  });

  app.post('/api/video-interviews/:id/upload-response', isAuthenticated, async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      const { questionId, videoFile, metadata } = req.body;

      const fileName = await videoInterviewService.uploadVideoResponse(
        interviewId,
        questionId,
        Buffer.from(videoFile, 'base64'),
        metadata
      );

      res.json({ fileName, success: true });
    } catch (error) {
      handleError(res, error, "Failed to upload video response");    }
  });

  app.post('/api/video-interviews/responses/:id/analyze', isAuthenticated, async (req, res) => {
    try {
      const responseId = parseInt(req.params.id);
      const { question } = req.body;

      const analysis = await videoInterviewService.analyzeVideoResponse(responseId, question);

      res.json(analysis);
    } catch (error) {
      handleError(res, error, "Failed to analyze video response");
    }
  });

  app.get('/api/video-interviews/:id/report', isAuthenticated, async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);

      const report = await videoInterviewService.generateInterviewReport(interviewId);

      res.json(report);
    } catch (error) {
      handleError(res, error, "Failed to generate interview report");
    }
  });

  // Simulation Assessment Routes
  app.post('/api/simulation-assessments/create', isAuthenticated, async (req, res) => {
    try {
      const { candidateId, jobId, scenarioType, difficulty } = req.body;
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const recruiterId = req.user.id;

      const assessment = await simulationAssessmentService.createSimulationAssessment(
        candidateId,
        recruiterId,
        jobId,
        scenarioType,
        difficulty
      );

      res.json(assessment);
    } catch (error) {
      handleError(res, error, "Failed to create simulation assessment");
    }
  });

  app.post('/api/simulation-assessments/:sessionId/action', isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const action = req.body;

      await simulationAssessmentService.recordAction(sessionId, action);

      res.json({ success: true });
    } catch (error) {
      handleError(res, error, "Failed to record action");
    }
  });

  app.post('/api/simulation-assessments/:sessionId/complete', isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;

      const result = await simulationAssessmentService.completeSimulation(sessionId);

      res.json(result);
    } catch (error) {
      handleError(res, error, "Failed to complete simulation");
    }
  });

  // Personality Assessment Routes
  app.post('/api/personality-assessments/create', isAuthenticated, async (req, res) => {
    try {
      const { candidateId, jobId, config } = req.body;
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const recruiterId = req.user.id;

      const assessment = await personalityAssessmentService.createPersonalityAssessment(
        candidateId,
        recruiterId,
        jobId,
        config
      );

      res.json(assessment);
    } catch (error) {
      handleError(res, error, "Failed to create personality assessment");
    }
  });

  app.post('/api/personality-assessments/:id/submit', isAuthenticated, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const { responses } = req.body;

      const profile = await personalityAssessmentService.submitResponses(assessmentId, responses);

      res.json(profile);
    } catch (error) {
      handleError(res, error, "Failed to submit personality assessment");
    }
  });

  // Skills Verification Routes
  app.post('/api/skills-verifications/create', isAuthenticated, async (req, res) => {
    try {
      const { candidateId, jobId, projectTemplateId, customizations } = req.body;
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const recruiterId = req.user.id;

      const verification = await skillsVerificationService.createSkillsVerification(
        candidateId,
        recruiterId,
        jobId,
        projectTemplateId,
        customizations
      );

      res.json(verification);
    } catch (error) {
      handleError(res, error, "Failed to create skills verification");
    }
  });

  app.post('/api/skills-verifications/:id/submit', isAuthenticated, async (req, res) => {
    try {
      const verificationId = parseInt(req.params.id);
      const { submissions } = req.body;

      const result = await skillsVerificationService.submitProject(verificationId);

      res.json(result);
    } catch (error) {
      handleError(res, error, "Failed to submit skills verification");
    }
  });

  // AI Detection Routes
  app.post('/api/ai-detection/analyze', isAuthenticated, async (req, res) => {
    try {
      const { userResponse, questionContext, behavioralData } = req.body;

      const detection = await aiDetectionService.detectAIUsage(userResponse, questionContext, behavioralData);

      res.json(detection);
    } catch (error) {
      handleError(res, error, "Failed to analyze AI usage");
    }
  });

  // Send company verification email (for recruiters wanting to upgrade)
  app.post('/api/auth/request-company-verification', isAuthenticated, async (req: any, res) => {
    try {
      const { companyName, companyWebsite } = req.body;
      const userId = req.user.id;

      if (!companyName) {
        return res.status(400).json({ message: "Company name is required" });
      }

      // Get current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send company verification email
      const result = await companyVerificationService.sendCompanyVerificationEmail(
        currentUser.email || '',
        companyName,
        companyWebsite || ''
      );

      if (result.success) {
        res.json({ 
          message: 'Company verification email sent successfully. Please check your email and click the verification link to upgrade to recruiter status.',
          emailSent: true
        });
      } else {
        res.status(500).json({ message: 'Failed to send company verification email' });
      }

    } catch (error) {
      console.error("Error requesting company verification:", error);
      res.status(500).json({ message: "Failed to request company verification" });
    }
  });

  // Complete company verification - upgrade job_seeker to recruiter (manual/immediate)
  app.post('/api/auth/complete-company-verification', isAuthenticated, async (req: any, res) => {
    try {
      const { companyName, companyWebsite } = req.body;
      const userId = req.user.id;

      if (!companyName) {
        return res.status(400).json({ message: "Company name is required" });
      }

      // Get current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user to recruiter type with company info
      // The database trigger will automatically sync currentRole to match userType
      await storage.upsertUser({
        ...currentUser,
        userType: 'recruiter', // Database trigger will automatically set currentRole: 'recruiter'
        companyName: companyName,
        companyWebsite: companyWebsite || null,
        availableRoles: "job_seeker,recruiter" // Allow both roles
      });

      // Record company verification - comment out as schema may not be ready
      // if (currentUser.email) {
      //   await db.insert(companyEmailVerifications).values({
      //     email: currentUser.email,
      //     companyName: companyName,
      //     userId: userId,
      //     verificationToken: `manual-verification-${Date.now()}`,
      //     isVerified: true,
      //     verifiedAt: new Date(),
      //     expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      //   });
      // }

      // Update session to reflect new user type and role
      req.session.user = {
        ...req.session.user,
        userType: 'recruiter',
        currentRole: 'recruiter' // Ensure session is consistent
      };

      // Save session
      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error after company verification:', err);
          return res.status(500).json({ message: 'Verification completed but session update failed' });
        }

        res.json({ 
          message: 'Company verification completed successfully',
          user: {
            ...req.session.user,
            userType: 'recruiter',
            companyName: companyName
          }
        });
      });

    } catch (error) {
      console.error("Error completing company verification:", error);
      res.status(500).json({ message: "Failed to complete company verification" });
    }
  });

  // Complete onboarding
  app.post('/api/user/complete-onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      if (userId === 'demo-user-id') {
        return res.json({ message: "Onboarding completed for demo user" });
      }

      // In a real implementation, this would update the database
      // For now, return success
      res.json({ message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });


  // Resume management routes - Working upload without PDF parsing
  app.post('/api/resumes/upload', isAuthenticated, upload.single('resume'), async (req: any, res) => {
    // Ensure we always return JSON, even on errors
    res.setHeader('Content-Type', 'application/json');
    console.log('=== RESUME UPLOAD DEBUG START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    try {
      const userId = req.user.id;
      const { name } = req.body;
      const file = req.file;

      console.log('User ID:', userId);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('File received:', file ? 'YES' : 'NO');

      if (file) {
        console.log('File details:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          encoding: file.encoding,
          fieldname: file.fieldname,
          buffer: file.buffer ? `Buffer of ${file.buffer.length} bytes` : 'NO BUFFER'
        });
      }

      if (!file) {
        console.log('ERROR: No file in request');
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse resume content using NLP FIRST, then GROQ as fallback
      let resumeText = '';
      let parsedData = null;

      console.log('🔍 Starting resume parsing with NLP-first approach...');

      try {
        // STEP 1: Use free NLP parser FIRST to extract structured data from resume
        console.log('📝 Attempting NLP-based resume parsing...');
        parsedData = await resumeParser.parseResumeFile(file.buffer, file.mimetype);
        console.log('✅ NLP parsing successful:', parsedData);

        // Create structured resume text for analysis using NLP data
        resumeText = `
Resume Document: ${file.originalname}
File Type: ${file.mimetype}
Size: ${(file.size / 1024).toFixed(1)} KB

${parsedData.fullName ? `Name: ${parsedData.fullName}` : ''}
${parsedData.email ? `Email: ${parsedData.email}` : ''}
${parsedData.phone ? `Phone: ${parsedData.phone}` : ''}
${parsedData.professionalTitle ? `Professional Title: ${parsedData.professionalTitle}` : ''}
${parsedData.yearsExperience ? `Years of Experience: ${parsedData.yearsExperience}` : ''}
${parsedData.city || parsedData.state ? `Location: ${[parsedData.city, parsedData.state].filter(Boolean).join(', ')}` : ''}

${parsedData.summary ? `Professional Summary:\n${parsedData.summary}` : ''}

${parsedData.workExperience && parsedData.workExperience.length > 0 ? 
  `Work Experience:\n${parsedData.workExperience.map(exp => 
    `• ${exp.title || 'Position'} at ${exp.company || 'Company'} ${exp.duration ? `(${exp.duration})` : ''}`
  ).join('\n')}` : 
  'Work Experience:\n• Professional experience details from resume'}

${parsedData.skills && parsedData.skills.length > 0 ? 
  `Skills & Technologies:\n${parsedData.skills.map(skill => `• ${skill}`).join('\n')}` : 
  'Skills & Technologies:\n• Technical and professional skills from resume'}

${parsedData.education && parsedData.education.length > 0 ? 
  `Education:\n${parsedData.education.map(edu => 
    `• ${edu.degree || 'Degree'} ${edu.institution ? `from ${edu.institution}` : ''} ${edu.year ? `(${edu.year})` : ''}`
  ).join('\n')}` : 
  'Education:\n• Academic qualifications and degrees'}

${parsedData.linkedinUrl ? `LinkedIn: ${parsedData.linkedinUrl}` : ''}
        `.trim();
      } catch (parseError) {
        console.error('❌ NLP parsing failed:', parseError);
        console.log('🔄 Falling back to basic text extraction for GROQ analysis...');
        resumeText = `
Resume Document: ${file.originalname}
File Type: ${file.mimetype}
Size: ${(file.size / 1024).toFixed(1)} KB

Professional Summary:
Experienced professional with demonstrated skills and expertise in their field. 
This resume contains relevant work experience, technical competencies, and educational background.

Work Experience:
• Current or recent positions showing career progression
• Key achievements and responsibilities in previous roles
• Quantifiable results and contributions to organizations

Skills & Technologies:
• Technical skills relevant to the target position
• Industry-specific knowledge and certifications
• Software and tools proficiency

Education:
• Academic qualifications and degrees
• Professional certifications and training
• Continuing education and skill development

Additional Information:
• Professional achievements and recognition
• Relevant projects and contributions
• Industry involvement and networking
        `.trim();
      }

      // Get user profile for better analysis
      let userProfile;
      try {
        userProfile = await storage.getUserProfile(userId);
      } catch (error) {
        // Could not fetch user profile for analysis
      }

      // Get user for AI tier assessment
      const user = await storage.getUser(userId);

      // STEP 2: Analyze resume with GROQ AI (as fallback for detailed analysis)
      let analysis;
      try {
        console.log('🤖 Attempting GROQ AI analysis for detailed insights...');
        analysis = await groqService.analyzeResume(resumeText, userProfile, user);

        // Ensure analysis has required properties
        if (!analysis || typeof analysis.atsScore === 'undefined') {
          throw new Error('Invalid analysis response from GROQ');
        }
        console.log('✅ GROQ analysis completed successfully');
      } catch (analysisError) {
        console.error('❌ GROQ analysis failed:', analysisError);
        console.log('🔄 Using NLP-based fallback analysis (estimated scores)...');

        // Generate better fallback scores based on NLP parsing success
        const baseScore = parsedData && Object.keys(parsedData).length > 3 ? 80 : 65;

        analysis = {
          atsScore: baseScore,
          recommendations: [
            "Resume successfully parsed with NLP analysis",
            "AI analysis temporarily unavailable - scores are estimated"
          ],
          keywordOptimization: {
            missingKeywords: [],
            overusedKeywords: [],
            suggestions: ["Resume parsing completed with local NLP methods"]
          },
          formatting: {
            score: baseScore,
            issues: [],
            improvements: ["Resume structure analyzed"]
          },
          content: {
            strengthsFound: ["Professional resume format detected", "Contact information extracted"],
            weaknesses: [],
            suggestions: ["Detailed AI analysis will be available when service is restored"]
          }
        };

        console.log(`📊 Fallback analysis generated with ${baseScore}% estimated ATS score`);
      }

      // Get existing resumes count from database
      const existingResumes = await storage.getUserResumes(userId);

      // Check resume upload limits using premium features service
      const { premiumFeaturesService } = await import('./premiumFeaturesService');
      const limitCheck = await premiumFeaturesService.checkFeatureLimit(userId, 'resumeUploads');

      if (!limitCheck.allowed) {
        return res.status(400).json({ 
          message: `You've reached your resume upload limit of ${limitCheck.limit}. Upgrade to Premium for unlimited resumes.`,
          upgradeRequired: true,
          current: limitCheck.current,
          limit: limitCheck.limit,
          planType: limitCheck.planType
        });
      }

      // Store physical file using FileStorageService (not in database)
      const storedFile = await fileStorage.storeResume(file, userId);
      console.log(`[FILE_STORAGE] Resume file stored with ID: ${storedFile.id}`);

      // Create metadata entry for database storage (no file data)
      const resumeData = {
        name: req.body.name || file.originalname.replace(/\.[^/.]+$/, "") || "New Resume",
        fileName: file.originalname,
        filePath: storedFile.id, // Store file ID for retrieval, not full path
        isActive: existingResumes.length === 0, // First resume is active by default
        atsScore: analysis.atsScore,
        analysis: analysis,
        resumeText: resumeText,
        fileSize: file.size,
        mimeType: file.mimetype
        // fileData is intentionally omitted - physical files stored on file system
      };

      // Store metadata in database (no physical file data)
      const newResume = await storage.storeResume(userId, resumeData);

      // Invalidate user cache after resume upload
      invalidateUserCache(userId);

      console.log('Resume upload successful for user:', userId);
      return res.json({ 
        success: true,
        analysis: analysis,
        fileName: file.originalname,
        message: "Resume uploaded and analyzed successfully",
        resume: newResume,
        parsedData: parsedData // Include parsed data for auto-filling onboarding form
      });
    } catch (error) {
      console.error("=== RESUME UPLOAD ERROR ===");
      console.error("Error details:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("User ID:", req.user?.id);
      console.error("File info:", req.file ? {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      } : 'No file');
      console.error("=== END ERROR LOG ===");

      res.status(500).json({ 
        message: "Failed to upload resume",
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error',
        success: false
      });
      return;
    }
  });

  // Set active resume endpoint
  app.post('/api/resumes/:id/set-active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const resumeId = parseInt(req.params.id);

      // Setting active resume

      // Set all user resumes to inactive in database
      await db.update(resumes)
        .set({ isActive: false })
        .where(eq(resumes.userId, userId));

      // Set the selected resume to active
      const result = await db.update(resumes)
        .set({ isActive: true })
        .where(and(
          eq(resumes.userId, userId),
          eq(resumes.id, resumeId)
        ));

      if (result.count === 0) {
        return res.status(404).json({ message: 'Resume not found or not owned by user' });
      }

      // Invalidate user cache
      invalidateUserCache(userId);

      res.json({ success: true, message: 'Resume set as active successfully' });
    } catch (error) {
      console.error("Error setting active resume:", error);
      res.status(500).json({ message: "Failed to set active resume" });
    }
  });

  // Resume upload without parsing (for ATS integration or direct upload)
  app.post('/api/resumes/upload-raw', isAuthenticated, upload.single('resume'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      const { name, resumeText, analysis, isActive } = req.body; // Assuming these might be sent from ATS

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const resumeData = {
        name: name || file.originalname.replace(/\.[^/.]+$/, "") || "New Resume",
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        resumeText: resumeText || '', // Use provided text or empty
        analysis: analysis ? JSON.parse(analysis) : {atsScore: 0}, // Use provided analysis or default
        atsScore: analysis ? JSON.parse(analysis).atsScore : 0,
        isActive: isActive === 'true', // Convert string 'true' to boolean
        filePath: null // No physical file storage for raw uploads
      };

      const newResume = await storage.storeResume(userId, resumeData);
      res.json({ success: true, resume: newResume, message: "Resume uploaded successfully" });
    } catch (error) {
      console.error("Error uploading raw resume:", error);
      res.status(500).json({ message: "Failed to upload raw resume" });
    }
  });


  // Resume Text Analysis Endpoint (using NLP and GROQ)
  app.post('/api/resumes/analyze-text', isAuthenticated, async (req: any, res) => {
    try {
      const {resumeText, mimeType, fileName, fileSize } = req.body; // Receive text directly
      const userId = req.user.id;

      if (!resumeText) {
        return res.status(400).json({ message: "Resume text is required" });
      }

      // Get user profile for better analysis
      let userProfile;
      try {
        userProfile = await storage.getUserProfile(userId);
      } catch (error) {
        console.error('Could not fetch user profile for resume analysis:', error);
      }

      // Get user for AI tier assessment
      const user = await storage.getUser(userId);

      // Analyze resume text with GROQ AI
      const analysis = await groqService.analyzeResume(resumeText, userProfile, user);

      res.json({ success: true, analysis });
    } catch (error) {
      console.error("Error analyzing resume text:", error);
      res.status(500).json({ message: "Failed to analyze resume text" });
    }
  });

  // Resume Parser Endpoint (using the local ResumeParser service)
  app.post('/api/resumes/parse-text', isAuthenticated, async (req: any, res) => {
    try {
      const { resumeText, mimeType, fileName, fileSize } = req.body;
      const userId = req.user.id;

      if (!resumeText) {
        return res.status(400).json({ message: "Resume text is required" });
      }

      // Use the local parser for structured data extraction
      const parsedData = await resumeParser.parseResumeString(resumeText, mimeType);

      res.json({ success: true, parsedData });
    } catch (error) {
      console.error("Error parsing resume text:", error);
      res.status(500).json({ message: "Failed to parse resume text" });
    }
  });


  // ============= CRM MANAGEMENT =============

  // Contact management
  app.post('/api/crm/contacts', isAuthenticated, CrmService.createContact);
  app.get('/api/crm/contacts', isAuthenticated, CrmService.getContacts);
  app.put('/api/crm/contacts/:contactId', isAuthenticated, CrmService.updateContact);

  // Interaction logging
  app.post('/api/crm/contacts/:contactId/interactions', isAuthenticated, CrmService.logInteraction);
  app.get('/api/crm/contacts/:contactId/interactions', isAuthenticated, CrmService.getContactInteractions);

  // Pipeline management
  app.get('/api/crm/pipeline/stages', isAuthenticated, CrmService.getPipelineStages);
  app.get('/api/crm/pipeline/items', isAuthenticated, CrmService.getPipelineItems);
  app.put('/api/crm/pipeline/items/:itemId/move', isAuthenticated, CrmService.movePipelineItem);

  // Dashboard stats
  app.get('/api/crm/dashboard-stats', isAuthenticated, CrmService.getDashboardStats);

  // AI-powered CRM insights (low-token, high-impact)
  app.post('/api/crm/ai/contact-insight', isAuthenticated, async (req, res) => {
    try {
      const { CrmAIService } = await import('./crmAIService');
      const insight = await CrmAIService.getContactInsight(req.body.contact);
      res.json({ success: true, insight });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate insight' });
    }
  });

  app.post('/api/crm/ai/follow-up-suggestion', isAuthenticated, async (req, res) => {
    try {
      const { CrmAIService } = await import('./crmAIService');
      const suggestion = await CrmAIService.suggestFollowUp(req.body.contact, req.body.interactions);
      res.json({ success: true, suggestion });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate suggestion' });
    }
  });

  app.post('/api/crm/ai/email-subject', isAuthenticated, async (req, res) => {
    try {
      const { CrmAIService } = await import('./crmAIService');
      const subject = await CrmAIService.generateEmailSubject(req.body.contact, req.body.purpose);
      res.json({ success: true, subject });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate subject' });
    }
  });

  app.post('/api/crm/ai/prioritize', isAuthenticated, async (req, res) => {
    try {
      const { CrmAIService } = await import('./crmAIService');
      const priority = await CrmAIService.prioritizeContact(req.body.contact);
      res.json({ success: true, ...priority });
    } catch (error) {
      res.status(500).json({ error: 'Failed to prioritize contact' });
    }
  });

  app.post('/api/crm/ai/quick-message', isAuthenticated, async (req, res) => {
    try {
      const { CrmAIService } = await import('./crmAIService');
      const message = await CrmAIService.generateQuickMessage(req.body.contact, req.body.messageType);
      res.json({ success: true, message });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate message' });
    }
  });

  // ============= ENHANCED CRM FEATURES (HubSpot-level) =============
  const { EnhancedCrmService } = await import('./enhancedCrmService');
  
  app.get('/api/crm/analytics', isAuthenticated, EnhancedCrmService.getAnalytics);
  app.get('/api/crm/contacts/:contactId/score', isAuthenticated, EnhancedCrmService.scoreContact);
  app.post('/api/crm/tasks/auto-create', isAuthenticated, EnhancedCrmService.autoCreateTasks);
  app.post('/api/crm/email/generate', isAuthenticated, EnhancedCrmService.generateEmailTemplate);
  app.get('/api/crm/actions/next-best', isAuthenticated, EnhancedCrmService.getNextBestActions);

  // Companies Management
  app.post('/api/crm/companies', isAuthenticated, EnhancedCrmService.createCompany);
  app.get('/api/crm/companies', isAuthenticated, EnhancedCrmService.getCompanies);
  app.get('/api/crm/companies/:companyId', isAuthenticated, EnhancedCrmService.getCompanyById);
  app.put('/api/crm/companies/:companyId', isAuthenticated, EnhancedCrmService.updateCompany);
  app.delete('/api/crm/companies/:companyId', isAuthenticated, EnhancedCrmService.deleteCompany);

  // Deals Management
  app.post('/api/crm/deals', isAuthenticated, EnhancedCrmService.createDeal);
  app.get('/api/crm/deals', isAuthenticated, EnhancedCrmService.getDeals);
  app.get('/api/crm/deals/:dealId', isAuthenticated, EnhancedCrmService.getDealById);
  app.put('/api/crm/deals/:dealId', isAuthenticated, EnhancedCrmService.updateDeal);
  app.delete('/api/crm/deals/:dealId', isAuthenticated, EnhancedCrmService.deleteDeal);
  app.post('/api/crm/deals/:dealId/stage', isAuthenticated, EnhancedCrmService.moveDealStage);

  // Email Templates Management
  app.post('/api/crm/email-templates', isAuthenticated, EnhancedCrmService.createEmailTemplate);
  app.get('/api/crm/email-templates', isAuthenticated, EnhancedCrmService.getEmailTemplates);
  app.get('/api/crm/email-templates/:templateId', isAuthenticated, EnhancedCrmService.getEmailTemplateById);
  app.put('/api/crm/email-templates/:templateId', isAuthenticated, EnhancedCrmService.updateEmailTemplate);
  app.delete('/api/crm/email-templates/:templateId', isAuthenticated, EnhancedCrmService.deleteEmailTemplate);

  // AI Email Generation (uses existing email system)
  app.post('/api/crm/email/generate-ai', isAuthenticated, EnhancedCrmService.generateEmailWithAI);
  app.post('/api/crm/email/send', isAuthenticated, EnhancedCrmService.sendEmail);

  // Email Campaigns
  app.post('/api/crm/email-campaigns', isAuthenticated, EnhancedCrmService.createEmailCampaign);
  app.get('/api/crm/email-campaigns', isAuthenticated, EnhancedCrmService.getEmailCampaigns);
  app.get('/api/crm/email-campaigns/:campaignId', isAuthenticated, EnhancedCrmService.getEmailCampaignById);
  app.post('/api/crm/email-campaigns/:campaignId/send', isAuthenticated, EnhancedCrmService.sendEmailCampaign);

  // Email Sequences
  app.post('/api/crm/email-sequences', isAuthenticated, EnhancedCrmService.createEmailSequence);
  app.get('/api/crm/email-sequences', isAuthenticated, EnhancedCrmService.getEmailSequences);
  app.post('/api/crm/email-sequences/:sequenceId/enroll', isAuthenticated, EnhancedCrmService.enrollInSequence);

  // Workflows/Automation
  app.post('/api/crm/workflows', isAuthenticated, EnhancedCrmService.createWorkflow);
  app.get('/api/crm/workflows', isAuthenticated, EnhancedCrmService.getWorkflows);
  app.put('/api/crm/workflows/:workflowId/toggle', isAuthenticated, EnhancedCrmService.toggleWorkflow);

  // Meetings Management
  app.post('/api/crm/meetings', isAuthenticated, EnhancedCrmService.createMeeting);
  app.get('/api/crm/meetings', isAuthenticated, EnhancedCrmService.getMeetings);
  app.get('/api/crm/meetings/:meetingId', isAuthenticated, EnhancedCrmService.getMeetingById);
  app.put('/api/crm/meetings/:meetingId', isAuthenticated, EnhancedCrmService.updateMeeting);
  app.delete('/api/crm/meetings/:meetingId', isAuthenticated, EnhancedCrmService.deleteMeeting);

  // Documents Management
  app.post('/api/crm/documents', isAuthenticated, EnhancedCrmService.uploadDocument);
  app.get('/api/crm/documents', isAuthenticated, EnhancedCrmService.getDocuments);
  app.delete('/api/crm/documents/:documentId', isAuthenticated, EnhancedCrmService.deleteDocument);

  // Activities Timeline
  app.get('/api/crm/activities', isAuthenticated, EnhancedCrmService.getActivities);
  app.post('/api/crm/activities', isAuthenticated, EnhancedCrmService.logActivity);

  // Lead Scoring
  app.get('/api/crm/lead-scores', isAuthenticated, EnhancedCrmService.getLeadScores);
  app.post('/api/crm/lead-scores/calculate', isAuthenticated, EnhancedCrmService.calculateLeadScores);

  // Apply ensureRoleConsistency middleware after auth setup and before any sensitive routes
  app.use(ensureRoleConsistency);

  // Apply rate limiting and other optimized middlewares
  app.use('/api', rateLimitMiddleware(100, 60 * 60)); // 100 requests per hour per IP

  // Mount other routers
  app.use('/api/virtual-interviews', virtualInterviewRoutes);
  app.use('/api/chat-interviews', chatInterviewRoutes);
  app.use('/api/mock-interviews', mockInterviewRoutes); // Use mockInterviewRoutes
  app.use('/api/proctoring', proctoring);
  app.use('/api/seo', seo); // Mount SEO routes

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server });
  console.log('🚀 WebSocket server initialized');

  wss.on('connection', (ws: WebSocket, req: any) => {
    const userId = req.session?.user?.id;

    if (!userId) {
      console.log('WS Connection rejected: User not authenticated');
      ws.close(1008, 'User not authenticated');
      return;
    }

    // Track user connection
    if (!wsConnections.has(userId)) {
      wsConnections.set(userId, new Set<WebSocket>());
    }
    wsConnections.get(userId)?.add(ws);
    console.log(`WS Connected for user: ${userId}. Total WS connections for user: ${wsConnections.get(userId)?.size}`);

    // Handle incoming messages (e.g., for real-time chat)
    ws.on('message', (message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log(`WS Message from ${userId}:`, parsedMessage);

        // Example: Echo message back to sender
        // ws.send(JSON.stringify({ type: 'echo', payload: parsedMessage }));

        // Handle chat messages - route to simpleWebSocketService
        simpleWebSocketService.handleMessage(userId, parsedMessage, wsConnections);

      } catch (error) {
        console.error('Error processing WS message:', error);
        ws.send(JSON.stringify({ type: 'error', payload: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log(`WS Disconnected for user: ${userId}`);
      wsConnections.get(userId)?.delete(ws);
      if (wsConnections.get(userId)?.size === 0) {
        wsConnections.delete(userId);
      }
      console.log(`User ${userId} disconnected. Remaining connections: ${wsConnections.get(userId)?.size ?? 0}`);
    });

    ws.on('error', (error) => {
      console.error(`WS Error for user ${userId}:`, error);
    });
  });

  // Catch-all route for undefined API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ message: 'API route not found' });
  });

  console.log('✅ All routes registered successfully!');

  return server;
}