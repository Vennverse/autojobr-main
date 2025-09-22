import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import compression from "compression";
import { simpleWebSocketService } from "./simpleWebSocketService.js";
import { aiService } from "./aiService.js";
import { applyPerformanceOptimizations, createHighPerformanceRateLimiter } from "./performanceOptimizations.js";
import { dailySyncService } from "./dailySyncService.js";

// Database URL should be provided via environment variables
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const app = express();

// Trust proxy - required when behind Nginx reverse proxy
// Only trust first proxy (Nginx) for security
app.set('trust proxy', 1);

// Optimized compression middleware for high throughput
app.use(compression({
  level: 6, // Balanced compression level for good ratio without CPU overhead
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req: any, res: any) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Compress JSON, CSS, JS, HTML, and text files
    return compression.filter(req, res);
  }
}));

// CORS configuration - FULLY SECURE for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    ['https://autojobr.com'] : // Production: only allow trusted domain (extension uses API keys)
    true, // Development: allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept', 'X-Requested-With', 'Origin'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request validation and performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Validate ID parameters to prevent the "ID must be a positive integer" error
  if (req.params) {
    for (const [key, value] of Object.entries(req.params)) {
      if (key.toLowerCase().includes('id') && value) {
        const numValue = parseInt(value as string);
        if (isNaN(numValue) || numValue <= 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid ${key}: must be a positive integer`,
            code: 'INVALID_ID_PARAMETER'
          });
        }
      }
    }
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    if (!capturedJsonResponse) {
      capturedJsonResponse = bodyJson;
    }
    return originalResJson.call(this, bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Skip logging health check requests to reduce noise
      if (req.method === "HEAD" && path === "/api") {
        return;
      }

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // Log slow requests for optimization
      if (duration > 500) {
        console.warn(`🐌 SLOW REQUEST: ${logLine}`);
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Apply high-performance optimizations BEFORE registering routes
  console.log("🚀 Applying performance optimizations for millions of users...");
  applyPerformanceOptimizations(app);
  
  const server = await registerRoutes(app);
  
  // Initialize WebSocket service for real-time chat
  simpleWebSocketService.initialize(server);
  
  // Initialize unified AI service (this will show available providers in console)
  console.log("AI Service initialized with Groq and OpenRouter support");
  
  // Initialize daily sync service for automated internship updates
  // This will automatically sync internship data every 24 hours
  console.log("Daily Sync Service for internships initialized");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
