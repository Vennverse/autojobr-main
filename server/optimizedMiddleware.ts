// Optimized middleware for compute reduction
import { RequestHandler } from 'express';

// Response compression middleware
export const compressionMiddleware: RequestHandler = (req, res, next) => {
  // Add compression headers for JSON responses
  if (req.accepts('json')) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  next();
};

// Request deduplication middleware
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicationMiddleware: RequestHandler = (req, res, next) => {
  // Only deduplicate GET requests with query parameters
  if (req.method !== 'GET' || !Object.keys(req.query).length) {
    return next();
  }

  const key = `${req.path}?${new URLSearchParams(req.query as any).toString()}`;
  
  if (pendingRequests.has(key)) {
    // Wait for existing request to complete
    pendingRequests.get(key)!.then((result) => {
      res.json(result);
    }).catch(() => {
      next(); // Fallback to normal processing
    });
    return;
  }

  // Store the request
  const promise = new Promise((resolve, reject) => {
    const originalSend = res.send;
    res.send = function(data) {
      resolve(data);
      pendingRequests.delete(key);
      return originalSend.call(this, data);
    };
    
    // Clean up after 30 seconds
    setTimeout(() => {
      pendingRequests.delete(key);
      reject(new Error('Request timeout'));
    }, 30000);
  });
  
  pendingRequests.set(key, promise);
  next();
};

// Rate limiting middleware for compute-intensive operations
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (maxRequests: number = 10, windowMs: number = 60000): RequestHandler => {
  return (req, res, next) => {
    const clientId = req.ip || req.session?.user?.id || 'anonymous';
    const now = Date.now();
    
    let limit = rateLimits.get(clientId);
    if (!limit || now > limit.resetTime) {
      limit = { count: 0, resetTime: now + windowMs };
      rateLimits.set(clientId, limit);
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({ 
        message: 'Too many requests',
        retryAfter: Math.ceil((limit.resetTime - now) / 1000)
      });
    }
    
    limit.count++;
    next();
  };
};

// Memory monitoring middleware
export const memoryMonitoringMiddleware: RequestHandler = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Log memory usage for high-memory requests
  if (heapUsedMB > 100) {
    console.log(`⚠️ High memory usage: ${heapUsedMB}MB on ${req.method} ${req.path}`);
  }
  
  // Add memory usage to response headers (for monitoring)
  res.setHeader('X-Memory-Usage', heapUsedMB);
  next();
};

// Conditional request middleware using ETags
export const conditionalRequestMiddleware: RequestHandler = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    const etag = require('crypto').createHash('md5').update(JSON.stringify(data)).digest('hex');
    
    // Check if client has the same ETag
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'max-age=300'); // 5 minutes
    return originalJson.call(this, data);
  };
  
  next();
};