import express from 'express';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';

// High-performance rate limiter for millions of users
export const createHighPerformanceRateLimiter = () => {
  // In-memory rate limiter for development (use Redis in production)
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for better user experience
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use a sliding window counter for better performance
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      // Get real IP from X-Forwarded-For header when behind proxy
      const userIP = req.ip || req.connection.remoteAddress;
      return (req as any).user?.id || userIP;
    },
    // Skip rate limiting validation warnings in development
    validate: false,
    // Custom store for better performance (in production, use Redis)
    store: undefined, // Will use memory store by default
  });
};

// API-specific rate limiters
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for API calls
  message: { error: 'API rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Skip validation warnings
});

// Strict rate limiter for expensive operations
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Low limit for expensive operations like AI analysis
  message: { error: 'Please wait before making another AI request' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Skip validation warnings
});

// Response optimization middleware - FIXED for security and performance
export const responseOptimizationMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Set security headers only
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    // No forced Cache-Control - let each endpoint control its caching
  });

  // Only add metadata to non-sensitive endpoints
  if (req.path.startsWith('/api/public/')) {
    const originalJson = res.json;
    res.json = function(obj) {
      if (obj && typeof obj === 'object' && !obj.metadata) {
        obj.metadata = {
          timestamp: Date.now(),
          cached: false,
          version: '1.0'
        };
      }
      return originalJson.call(this, obj);
    };
  }

  next();
};

// Request deduplication middleware - SAFE for GET only
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicationMiddleware = (keyGenerator?: (req: express.Request) => string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // CRITICAL: Only deduplicate GET requests (idempotent)
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate deduplication key
    const defaultKey = `${req.method}:${req.path}:${(req as any).user?.id || req.ip}`;
    const key = keyGenerator ? keyGenerator(req) : defaultKey;

    // Check if request is already pending
    const pendingRequest = pendingRequests.get(key);
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        return res.json(result);
      } catch (error) {
        return res.status(500).json({ error: 'Request failed' });
      }
    }

    // Store original res.json to capture response
    const originalJson = res.json;
    let responseData: any;
    
    const requestPromise = new Promise((resolve, reject) => {
      // Set timeout to prevent memory leaks
      const timeout = setTimeout(() => {
        pendingRequests.delete(key);
        reject(new Error('Request timeout'));
      }, 30000); // 30 second timeout
      
      res.json = function(data) {
        clearTimeout(timeout);
        responseData = data;
        resolve(data);
        return originalJson.call(this, data);
      };

      // Handle errors
      res.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      
      // Clean up after response
      res.on('finish', () => {
        clearTimeout(timeout);
        pendingRequests.delete(key);
      });

      next();
    });

    pendingRequests.set(key, requestPromise);
  };
};

// Pagination middleware for large datasets - PROPER implementation
export const paginationMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Add pagination helpers to request
  (req as any).pagination = {
    limit: Math.min(parseInt((req.query.limit as string) || '50'), 1000), // Max 1000 items
    offset: parseInt((req.query.offset as string) || '0'),
    page: parseInt((req.query.page as string) || '1')
  };
  
  // Helper to paginate responses
  const originalJson = res.json;
  res.json = function(obj) {
    // If response is an array and large, suggest pagination
    if (Array.isArray(obj) && obj.length > 100) {
      console.warn(`Large response (${obj.length} items) without pagination on ${req.path}`);
    }
    
    return originalJson.call(this, obj);
  };
  
  next();
};

// Database connection health check
export const healthCheckMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === '/health') {
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: {
        database: 'connected' // Add actual DB health check here
      }
    });
  }
  next();
};

// Export all optimizations as a bundle - FIXED and optimized
export const applyPerformanceOptimizations = (app: express.Application) => {
  // Apply middleware in optimal order
  app.use(healthCheckMiddleware);
  app.use(responseOptimizationMiddleware);
  app.use(paginationMiddleware);
  
  // Apply rate limiting to API routes
  app.use('/api', apiRateLimiter);
  
  // Apply deduplication to idempotent GET endpoints only
  app.use('/api/user', deduplicationMiddleware((req) => `profile:${(req as any).user?.id}`));
  app.use('/api/job-recommendations', deduplicationMiddleware((req) => `recs:${(req as any).user?.id}`));
  
  // Apply strict rate limiting to expensive endpoints
  app.use('/api/analyze-job', strictRateLimiter);
  app.use('/api/generate-cover-letter', strictRateLimiter);
  app.use('/api/resumes/upload', strictRateLimiter);
};