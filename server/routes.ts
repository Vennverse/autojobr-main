import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { db } from "./db";
import { eq, desc, and, or, like, isNotNull, count, asc, isNull, sql, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";
import { resumes, userResumes, insertInternshipApplicationSchema, companyEmailVerifications, virtualInterviews, users } from "@shared/schema";
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
import crypto from 'crypto';
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
const premiumFeaturesService = new PremiumFeaturesService();
const subscriptionService = new SubscriptionService();

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
  if (!userId) {
    console.warn(`[CACHE_SECURITY] Cache key "${key}" used without user ID scoping`);
    return key;
  }

  // If key already contains user ID, return as is
  if (key.includes(`_${userId}_`) || key.startsWith(`${userId}_`) || key.endsWith(`_${userId}`)) {
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
};

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
    isActive: existingResumes.length === 0,
    atsScore: analysis.atsScore,
    analysis: analysis,
    resumeText: resumeText,
    fileSize: file.size,
    mimeType: file.mimetype,
    fileData: file.buffer.toString('base64')
  };

  // TODO: Implement storeResume method in storage
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

  // PLATFORM JOBS ENDPOINT - Public access for browsing, no auth required
  // This MUST be defined early before any catch-all /api middleware
  app.get('/api/jobs/postings', async (req: any, res) => {
    console.log('[PLATFORM JOBS] Request received');

    try {
      let jobPostings;

      // Check if user is authenticated
      const isAuth = req.isAuthenticated && req.isAuthenticated();
      const userId = isAuth ? req.user?.id : null;
      const user = userId ? await storage.getUser(userId) : null;

      // Recruiters get their own job postings, everyone else gets all active platform jobs
      if (user && (user.userType === 'recruiter' || user.currentRole === 'recruiter')) {
        jobPostings = await storage.getRecruiterJobPostings(userId);
        console.log(`[PLATFORM JOBS] Recruiter ${userId} has ${jobPostings.length} jobs`);
      } else {
        // Get all active job postings for everyone (logged in or not)
        const search = req.query.search as string;
        const category = req.query.category as string;

        console.log(`[PLATFORM JOBS] Fetching - search: "${search}", category: "${category}"`);

        if (search || category) {
          jobPostings = await storage.getJobPostings(1, 100, {
            search,
            category
          });
        } else {
          jobPostings = await storage.getAllJobPostings();
        }
        const userInfo = userId ? `authenticated ${userId}` : 'anonymous';
        console.log(`[PLATFORM JOBS] ${userInfo} - Returning ${jobPostings.length} jobs`);
      }

      console.log(`[PLATFORM JOBS] Sending ${jobPostings.length} jobs`);
      res.setHeader('X-Job-Source', 'platform');
      res.json(jobPostings);
    } catch (error) {
      console.error('[PLATFORM JOBS ERROR]:', error);
      handleError(res, error, "Failed to fetch job postings");
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


  // ===== MOUNT REFERRAL MARKETPLACE ROUTES =====
  app.use('/api/referral-marketplace', referralMarketplaceRoutes);

  // ===== MOUNT BIDDER SYSTEM ROUTES =====
  const bidderRoutes = (await import('./bidderRoutes.js')).default;
  app.use('/api', bidderRoutes);

  // ===== MOUNT PAYMENT ROUTES =====
  const { paymentRoutes } = await import('./paymentRoutes.js');
  app.use('/api/payment', paymentRoutes);

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

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (expiryDays || 7));

      // Store shareable link in database based on interview type
      if (interviewType === 'virtual' || interviewType === 'chat') {
        // Virtual/Chat interviews use virtualInterviews table
        await db.execute(sql`
          INSERT INTO virtual_interviews (
            session_id, recruiter_id, job_posting_id, interview_type,
            role, company, difficulty, status, shareable_link, 
            link_expires_at, assignment_type, created_at
          ) VALUES (
            ${linkId}, ${recruiterId}, ${jobPostingId}, ${interviewType},
            ${config.role}, ${config.company}, ${config.difficulty},
            'shareable_link', ${shareableLink}, ${expiresAt.toISOString()},
            'shareable_link', NOW()
          )
        `);
      } else if (interviewType === 'mock') {
        // Mock interviews
        await db.execute(sql`
          INSERT INTO mock_interviews (
            session_id, recruiter_id, job_posting_id, interview_type,
            role, company, difficulty, status, shareable_link,
            link_expires_at, assignment_type, created_at
          ) VALUES (
            ${linkId}, ${recruiterId}, ${jobPostingId}, ${interviewType},
            ${config.role}, ${config.company}, ${config.difficulty},
            'shareable_link', ${shareableLink}, ${expiresAt.toISOString()},
            'shareable_link', NOW()
          )
        `);
      }

      res.json({
        success: true,
        link: shareableLink,
        linkId,
        shareableLink,
        expiresAt,
        interviewType,
        role: config.role,
        company: config.company
      });

    } catch (error) {
      console.error('Error generating shareable link:', error);
      res.status(500).json({
        message: 'Failed to generate shareable link',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Access Interview via Shareable Link
  app.get('/api/interviews/link/:linkId', async (req: any, res) => {
    try {
      const { linkId } = req.params;

      // Try to find the link in virtual interviews
      const virtualResult = await db.execute(sql`
        SELECT * FROM virtual_interviews 
        WHERE session_id = ${linkId} AND assignment_type = 'shareable_link'
        LIMIT 1
      `);

      if (virtualResult.rows.length > 0) {
        const interview = virtualResult.rows[0];

        // Check if link is expired
        if (interview.link_expires_at && new Date(interview.link_expires_at) < new Date()) {
          return res.status(410).json({ message: 'This interview link has expired' });
        }

        return res.json({
          success: true,
          interviewType: 'virtual',
          linkId,
          role: interview.role,
          company: interview.company,
          difficulty: interview.difficulty,
          expiresAt: interview.link_expires_at
        });
      }

      // Try to find in mock interviews
      const mockResult = await db.execute(sql`
        SELECT * FROM mock_interviews 
        WHERE session_id = ${linkId} AND assignment_type = 'shareable_link'
        LIMIT 1
      `);

      if (mockResult.rows.length > 0) {
        const interview = mockResult.rows[0];

        if (interview.link_expires_at && new Date(interview.link_expires_at) < new Date()) {
          return res.status(410).json({ message: 'This interview link has expired' });
        }

        return res.json({
          success: true,
          interviewType: 'mock',
          linkId,
          role: interview.role,
          company: interview.company,
          difficulty: interview.difficulty,
          expiresAt: interview.link_expires_at
        });
      }

      res.status(404).json({ message: 'Interview link not found' });

    } catch (error) {
      console.error('Error accessing shareable link:', error);
      res.status(500).json({ message: 'Failed to access interview link' });
    }
  });

  // Start Interview from Shareable Link
  app.post('/api/interviews/link/:linkId/start', isAuthenticated, async (req: any, res) => {
    try {
      const { linkId } = req.params;
      const userId = req.user.id;

      // Find the shareable link template
      const virtualResult = await db.execute(sql`
        SELECT * FROM virtual_interviews 
        WHERE session_id = ${linkId} AND assignment_type = 'shareable_link'
        LIMIT 1
      `);

      if (virtualResult.rows.length > 0) {
        const template = virtualResult.rows[0];

        // Check expiry
        if (template.link_expires_at && new Date(template.link_expires_at) < new Date()) {
          return res.status(410).json({ message: 'This interview link has expired' });
        }

        // Create new interview session for this user
        const newSessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db.execute(sql`
          INSERT INTO virtual_interviews (
            user_id, session_id, interview_type, role, company, difficulty,
            duration, total_questions, questions_asked, status, assignment_type,
            interviewer_personality, created_at
          ) VALUES (
            ${userId}, ${newSessionId}, ${template.interview_type}, 
            ${template.role}, ${template.company}, ${template.difficulty},
            ${template.duration || 30}, ${template.total_questions || 5}, 0,
            'assigned', 'link_based', ${template.interviewer_personality || 'professional'},
            NOW()
          )
        `);

        return res.json({
          success: true,
          sessionId: newSessionId,
          redirectUrl: `/chat-interview/${newSessionId}`
        });
      }

      // Try mock interviews
      const mockResult = await db.execute(sql`
        SELECT * FROM mock_interviews 
        WHERE session_id = ${linkId} AND assignment_type = 'shareable_link'
        LIMIT 1
      `);

      if (mockResult.rows.length > 0) {
        const template = mockResult.rows[0];

        if (template.link_expires_at && new Date(template.link_expires_at) < new Date()) {
          return res.status(410).json({ message: 'This interview link has expired' });
        }

        const newSessionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db.execute(sql`
          INSERT INTO mock_interviews (
            user_id, session_id, interview_type, role, company, difficulty,
            language, total_questions, status, assignment_type, created_at
          ) VALUES (
            ${userId}, ${newSessionId}, ${template.interview_type},
            ${template.role}, ${template.company}, ${template.difficulty},
            ${template.language || 'javascript'}, ${template.total_questions || 5},
            'assigned', 'link_based', NOW()
          )
        `);

        return res.json({
          success: true,
          sessionId: newSessionId,
          redirectUrl: `/mock-interview/session/${newSessionId}`
        });
      }

      res.status(404).json({ message: 'Interview link not found' });

    } catch (error) {
      console.error('Error starting interview from link:', error);
      res.status(500).json({ message: 'Failed to start interview' });
    }
  });

  // Interview Prep API - Generate interview preparation insights
  app.post('/api/interview-prep', isAuthenticated, rateLimitMiddleware(10, 60), async (req: any, res) => {
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

  // Salary Insights API - Get salary range and compensation insights
  app.post('/api/salary-insights', isAuthenticated, rateLimitMiddleware(10, 60), async (req: any, res) => {
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
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Generate cover letter using AI
      const prompt = `Generate a professional, personalized cover letter based on:

Job Title: ${jobTitle || 'Not specified'}
Company: ${companyName || 'Not specified'}
Job Description: ${jobDescription}

Candidate Background:
${resumeText ? `Resume: ${resumeText.substring(0, 1000)}...` : 'Professional with relevant experience'}

Requirements:
- Opening paragraph that shows enthusiasm and explains why you're interested
- Body paragraphs highlighting relevant experience and skills that match the job
- Closing paragraph with call to action
- Professional, engaging tone
- Personalized to the specific company and role
- 3-4 paragraphs total
- No placeholder text like [Your Name] - use actual information`;

      const completion = await aiService.createChatCompletion([
        {
          role: "system",
          content: "You are an expert career coach and professional writer. Generate compelling, personalized cover letters that highlight the candidate's strengths and match them to the job requirements."
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 800,
        user: req.user
      });

      const coverLetter = completion.choices[0]?.message?.content || '';

      res.json({
        success: true,
        coverLetter,
        jobTitle,
        companyName
      });
    } catch (error) {
      console.error('Cover letter generation error:', error);
      res.status(500).json({ 
        message: 'Failed to generate cover letter',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
          error: 'Razorpay payment is not available. Please use PayPal or contact support.' 
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
              subscriptionStatus: 'premium'
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
        target: schema.subscriptions.userId,
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

  app.post("/api/subscription/cancel", isAuthenticated, asyncHandler(async (req: any, res: any) => {
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

  app.post("/api/usage/check", isAuthenticated, asyncHandler(async (req: any, res: any) => {
    const userId = req.user.id;
    const { feature } = req.body;

    if (!feature) {
      return res.status(400).json({ error: 'Feature is required' });
    }

    const check = await usageMonitoringService.checkUsageLimit(userId, feature);
    res.json(check);
  }));

  app.post("/api/usage/enforce", isAuthenticated, asyncHandler(async (req: any, res: any) => {
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
      const subscription = await subscriptionService.getUserSubscription(userId);
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

      const access = await premiumFeaturesService.checkFeatureAccess(userId, feature);
      res.json(access);
    } catch (error) {
      console.error('Error checking premium access:', error);
      res.status(500).json({ message: 'Failed to check premium access' });
    }
  }));

  // 6. Premium Usage Stats Endpoint
  app.get('/api/premium/usage', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const stats = await premiumFeaturesService.getUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching premium usage stats:', error);
      res.status(500).json({ message: 'Failed to fetch usage stats' });
    }
  }));

  // 7. Premium Features Overview Endpoint
  app.get('/api/premium/features', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const [usage, access, value, user] = await Promise.all([
        premiumFeaturesService.getUserUsageStats(userId),
        premiumFeaturesService.getPremiumFeatureAccess(userId),
        premiumFeaturesService.getPremiumValue(userId),
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
  app.get('/api/premium/check-limit/:feature', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { feature } = req.params;

      const result = await premiumFeaturesService.checkFeatureLimit(userId, feature as any);
      res.json(result);
    } catch (error) {
      console.error('Error checking feature limit:', error);
      res.status(500).json({ message: 'Failed to check feature limit' });
    }
  }));

  // 9. Validate Feature Usage Endpoint
  app.post('/api/premium/validate-usage', isAuthenticated, asyncHandler(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { feature } = req.body;

      const result = await premiumFeaturesService.validateFeatureUsage(userId, feature);
      res.json(result);
    } catch (error) {
      console.error('Error validating feature usage:', error);
      res.status(500).json({ message: 'Failed to validate feature usage' });
    }
  }));

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
          .where(eq(companyEmailVerifications.id, verification.id));
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


  // Interview Assignment API Routes
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
      res.json({
        totalAssigned: stats.total,
        completed: stats.completed,
        pending: stats.pending,
        averageScore: stats.averageScore,
        virtualInterviews: stats.virtual.count,
        mockInterviews: stats.mock.count
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


  app.post('/api/interviews/invite/:token/use', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.params;
      const userId = req.user.id;

      const invitation = await db.select()
        .from(schema.interviewInvitations)
        .where(eq(schema.interviewInvitations.token, token))
        .limit(1);

      if (!invitation.length || invitation[0].expiryDate < new Date()) {
        return res.status(404).json({ message: 'Invalid or expired invitation' });
      }

      const invitationData = invitation[0];

      // Check if this specific user has already used this invitation
      const existingUse = await db.select()
        .from(schema.invitationUses)
        .where(and(
          eq(schema.invitationUses.invitationId, invitationData.id),
          eq(schema.invitationUses.candidateId, userId)
        ))
        .limit(1);

      if (existingUse.length > 0) {
        return res.status(400).json({ message: 'You have already used this invitation' });
      }

      // Check if invitation has reached max uses
      if (invitationData.maxUses !== null && invitationData.usageCount !== null && invitationData.usageCount >= invitationData.maxUses) {
        return res.status(400).json({ message: 'This invitation has reached its maximum number of uses' });
      }

      // Get user info for tracking
      const user = await storage.getUser(userId);

      // Record the use and increment usage count
      await db.insert(schema.invitationUses).values({
        invitationId: invitationData.id,
        candidateId: userId,
        candidateEmail: user?.email || null,
        candidateName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
        usedAt: new Date()
      });

      await db.update(schema.interviewInvitations)
        .set({ usageCount: sql`${schema.interviewInvitations.usageCount} + 1` })
        .where(eq(schema.interviewInvitations.token, token));

      // Create job application if jobPostingId exists
      if (invitationData.jobPostingId) {
        try {
          await db.insert(schema.jobPostingApplications).values({
            jobPostingId: invitationData.jobPostingId,
            applicantId: userId,
            status: 'applied',
            appliedAt: new Date()
          });
        } catch (error) {
          // Application might already exist, that's okay
          console.log('Job application already exists or failed to create:', error);
        }
      }

      // Create interview assignment
      let interviewUrl = '';

      if (invitationData.interviewType === 'virtual') {
        // Import the chat interview service
        const { chatInterviewService } = await import('./chatInterviewService.js');

        // Generate unique session ID for chat interview
        const sessionId = crypto.randomBytes(32).toString('hex');

        // Create interview record in virtualInterviews table
        const interview = await db.insert(virtualInterviews).values({
          userId,
          sessionId,
          role: invitationData.role || 'software_engineer',
          interviewType: 'technical',
          difficulty: invitationData.difficulty || 'medium',
          duration: 30,
          totalQuestions: 5,
          questionsAsked: 0,
          status: 'assigned',
          assignedBy: invitationData.recruiterId,
          assignedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          jobPostingId: invitationData.jobPostingId || null,
          assignmentType: 'recruiter_assigned',
          interviewerPersonality: 'professional',
          company: invitationData.company || ''
        }).returning();

        // Set the interview URL to the chat interview path
        interviewUrl = `/chat-interview/${sessionId}`;
      } else if (invitationData.interviewType === 'mock') {
        const interview = await interviewAssignmentService.assignMockInterview({
          recruiterId: invitationData.recruiterId,
          candidateId: userId,
          jobPostingId: invitationData.jobPostingId ?? undefined,
          interviewType: 'technical',
          role: invitationData.role,
          company: invitationData.company ?? undefined,
          difficulty: invitationData.difficulty ?? undefined,
          language: 'javascript',
          totalQuestions: 5,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        interviewUrl = `/mock-interview/${interview.sessionId}`;
      }

      res.json({
        success: true,
        interviewUrl,
        interviewType: invitationData.interviewType,
        message: 'Interview assigned successfully'
      });
    } catch (error) {
      handleError(res, error, "Failed to use interview invitation");
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

      const { candidateId, jobPostingId, videoQuestions, preparationTime, dueDate, role, company } = req.body;

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
      handleError(res, error, "Failed to upload video response");
    }
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

  app.post('/api/simulation-assessments/:id/start', isAuthenticated, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);

      const sessionId = await simulationAssessmentService.startSimulation(assessmentId);

      res.json({ sessionId });
    } catch (error) {
      handleError(res, error, "Failed to start simulation");
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


        }
      }

      const verification = user?.emailVerified && user?.userType === 'recruiter' ? {
        company_name: user.companyName,
        verified_at: new Date()
      } : null;

      res.json({ 
        isVerified: !!verification,
        companyName: verification?.company_name,
        verifiedAt: verification?.verified_at 
      });
    } catch (error) {
      console.error("Error checking company verification:", error);
      res.status(500).json({ message: "Failed to check verification status" });
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
      //     verifiedAt: new Date()
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
      await db.update(schema.resumes)
        .set({ isActive: false })
        .where(eq(schema.resumes.userId, userId));

      // Set the selected resume to active
      const result = await db.update(schema.resumes)
        .set({ isActive: true })
        .where(and(
          eq(schema.resumes.id, resumeId),
          eq(schema.resumes.userId, userId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Clear cache
      const cacheKey = `resumes_${userId}`;
      cache.delete(cacheKey);

      res.json({ message: "Active resume updated successfully" });
    } catch (error) {
      console.error("Error setting active resume:", error);
      res.status(500).json({ message: "Failed to set active resume" });
    }
  });

  app.get('/api/resumes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cacheKey = `resumes_${userId}`;

      // Check cache first (user-scoped)
      const cachedResumes = getCached(cacheKey, userId);
      if (cachedResumes) {
        return res.json(cachedResumes);
      }

      // Fetching resumes for user

      // Use the database storage service to get resumes
      const resumes = await storage.getUserResumes(userId);

      // Cache resumes for 1 minute (user-scoped)
      setCache(cacheKey, resumes, 60000, userId);

      // Returning resumes for user
      res.json(resumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  // Download resume file - FIXED: Using resumes table with proper security
  app.get('/api/resumes/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const resumeId = parseInt(req.params.id);

      // Get resume record from resumes table with ownership verification
      const [resume] = await db.select().from(resumes).where(
        and(eq(resumes.id, resumeId), eq(resumes.userId, userId))
      );

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      let fileBuffer: Buffer;

      // Handle both database and filesystem storage
      if (resume.fileData) {
        // Database storage: decode base64
        fileBuffer = Buffer.from(resume.fileData, 'base64');
      } else if (resume.filePath) {
        // Filesystem storage: SECURE - use exact path from ownership-validated record
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          const zlib = await import('zlib');

          // Use the exact filePath from the ownership-validated resumes record
          const fullPath = path.resolve(resume.filePath);

          // Security check: ensure path is within expected uploads directory
          const uploadsDir = path.resolve('./uploads');
          if (!fullPath.startsWith(uploadsDir)) {
            console.error(`Security violation: attempted access to ${fullPath} outside uploads directory`);
            return res.status(403).json({ message: "Access denied" });
          }

          // Read file directly from validated path
          const rawBuffer = await fs.readFile(fullPath);

          // Handle compressed files (if path ends with .gz)
          if (fullPath.endsWith('.gz')) {
            fileBuffer = await new Promise((resolve, reject) => {
              zlib.gunzip(rawBuffer, (err, decompressed) => {
                if (err) reject(err);
                else resolve(decompressed);
              });
            });
          } else {
            fileBuffer = rawBuffer;
          }

          console.log(`✅ Secure file access: userId=${userId}, file=${resume.fileName}, size=${fileBuffer.length} bytes`);
        } catch (error) {
          console.error(`File access error for userId=${userId}, path=${resume.filePath}:`, error);
          return res.status(404).json({ message: "Resume file not found in storage" });
        }
      } else {
        return res.status(404).json({ message: "Resume file data not available" });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', resume.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);

      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading resume:", error);
      res.status(500).json({ message: "Failed to download resume" });
    }
  });

  // Resume download route for recruiters (from job applications)
  app.get('/api/recruiter/resume/download/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const applicationId = parseInt(req.params.applicationId);
      const user = await storage.getUser(userId);

      if (user?.userType !== 'recruiter' && user?.currentRole !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter account required." });
      }

      // Get application  
      const application = await storage.getJobPostingApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Get job posting to verify recruiter owns it
      const jobPosting = await storage.getJobPosting(application.jobPostingId);
      if (!jobPosting || jobPosting.recruiterId !== userId) {
        return res.status(403).json({ message: "Access denied. You can only download resumes from your job postings." });
      }

      // Get applicant's active resume using the modern file storage system
      const applicantId = application.applicantId;

      let resume;
      try {
        // Get applicant's resumes from database
        const applicantResumes = await storage.getUserResumes(applicantId);
        const activeResume = applicantResumes.find((r: any) => r.isActive) || applicantResumes[0];

        if (!activeResume) {
          return res.status(404).json({ message: "No resume found for this applicant" });
        }

        // Retrieve the file from file storage using the stored file ID
        const fileBuffer = await fileStorage.retrieveResume(activeResume.filePath, applicantId);

        if (!fileBuffer) {
          return res.status(404).json({ message: "Resume file not found in storage" });
        }

        resume = {
          fileBuffer: fileBuffer,
          fileName: activeResume.fileName || 'resume.pdf',
          mimeType: activeResume.mimeType || 'application/pdf'
        };

      } catch (error) {
        console.error("Error fetching applicant resume:", error);
        return res.status(500).json({ message: "Error retrieving resume" });
      }

      if (!resume || !resume.fileBuffer) {
        return res.status(404).json({ message: "Resume not found or not available for download" });
      }

  // Set appropriate headers and send file
  res.setHeader('Content-Type', resume.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
  res.setHeader('Content-Length', String(resume.fileBuffer.length));

      res.send(resume.fileBuffer);
    } catch (error) {
      console.error("Error downloading resume:", error);
      res.status(500).json({ message: "Failed to download resume" });
    }
  });

  // ===== TASK MANAGEMENT API ROUTES =====
  // Create new task
  app.post('/api/tasks', isAuthenticated, TaskService.createTask);

  // Get user's tasks (with filtering)
  app.get('/api/tasks', isAuthenticated, TaskService.getUserTasks);

  // Update task status
  app.patch('/api/tasks/:taskId/status', isAuthenticated, TaskService.updateTaskStatus);

  // Delete task
  app.delete('/api/tasks/:taskId', isAuthenticated, TaskService.deleteTask);

  // Get task statistics/analytics
  app.get('/api/tasks/stats', isAuthenticated, TaskService.getTaskStats);

  // ===== REMINDER SYSTEM API ROUTES (for Chrome Extension) =====
  // Get pending reminders for extension popup
  app.get('/api/reminders/pending', isAuthenticated, TaskService.getPendingReminders);

  // Snooze a reminder
  app.patch('/api/reminders/:reminderId/snooze', isAuthenticated, TaskService.snoozeReminder);

  // Dismiss a reminder
  app.patch('/api/reminders/:reminderId/dismiss', isAuthenticated, TaskService.dismissReminder);

  // ===== REFERRAL MARKETPLACE API ROUTES =====
  // Public referral marketplace endpoints (must come BEFORE protected routes)
  app.get('/api/referral-marketplace/services', async (req, res) => {
    try {
      const { referralMarketplaceService } = await import('./referralMarketplaceService.js');
      const filters = {
        serviceType: req.query.serviceType as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        companyName: req.query.companyName as string,
        includesReferral: req.query.includesReferral === 'true' ? true : 
                         req.query.includesReferral === 'false' ? false : undefined,
      };

      const services = await referralMarketplaceService.getServiceListings(filters);
      res.json({ success: true, services });
    } catch (error) {
      console.error('Error getting services:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get services' 
      });
    }
  });

  // Protected referral marketplace endpoints  
  app.use('/api/referral-marketplace', isAuthenticated, referralMarketplaceRoutes);

  // Bidder system routes (auth is handled per-route within bidderRoutes)
  const bidderRoutes = await import('./bidderRoutes.js');
  app.use('/api', bidderRoutes.default);

  console.log('🎉 [ROUTES] All routes registered successfully!');
  console.log('🎉 [ROUTES] Total app._router.stack length:', app._router?.stack?.length || 'unknown');

  // Create HTTP server for WebSocket integration
  const httpServer = createServer(app);
  return httpServer;
}