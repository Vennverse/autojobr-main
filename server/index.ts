import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import compression from "compression";

// Database URL should be provided via environment variables
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const app = express();

// Add compression middleware for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req: any, res: any) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// CORS configuration for Chrome extension and external sites
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      /^chrome-extension:\/\/.*$/,
      /^moz-extension:\/\/.*$/,
      /^https?:\/\/localhost:\d+$/,
      /^https?:\/\/127\.0\.0\.1:\d+$/,
      /^https?:\/\/40\.160\.50\.128:\d+$/,
      /^http:\/\/40\.160\.50\.128$/,
      /^https?:\/\/.*\.replit\.app$/,
      /^https?:\/\/.*\.replit\.dev$/,
      /^https?:\/\/.*\.vercel\.app$/,
      /^https?:\/\/.*\.railway\.app$/,
      /^https?:\/\/.*\.netlify\.app$/,
      // Job sites where the extension operates
      /^https?:\/\/(www\.)?linkedin\.com$/,
      /^https?:\/\/(www\.)?indeed\.com$/,
      /^https?:\/\/(www\.)?glassdoor\.com$/,
      /^https?:\/\/(www\.)?monster\.com$/,
      /^https?:\/\/(www\.)?ziprecruiter\.com$/,
      /^https?:\/\/(www\.)?stackoverflow\.com$/,
      /^https?:\/\/(www\.)?angel\.co$/,
      /^https?:\/\/(www\.)?wellfound\.com$/,
      // Workday domains
      /^https?:\/\/.*\.workday\.com$/,
      /^https?:\/\/.*\.myworkdayjobs\.com$/,
      // Greenhouse and other ATS
      /^https?:\/\/.*\.greenhouse\.io$/,
      /^https?:\/\/.*\.lever\.co$/,
      /^https?:\/\/.*\.ashbyhq\.com$/,
      /^https?:\/\/.*\.smartrecruiters\.com$/,
      /^https?:\/\/.*\.jobvite\.com$/,
      /^https?:\/\/.*\.icims\.com$/,
      /^https?:\/\/.*\.taleo\.net$/,
      /^https?:\/\/.*\.successfactors\.com$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });
    
    if (isAllowed || process.env.PRODUCTION_DOMAIN === origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for Chrome extension compatibility
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept', 'X-Requested-With', 'Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Additional CORS headers for Chrome extension and VM server
app.use((req, res, next) => {
  const origin = req.get('Origin');
  
  // Allow Chrome extension origins and VM server origins
  if (origin && (
    origin.startsWith('chrome-extension://') || 
    origin.startsWith('moz-extension://') ||
    origin === 'http://40.160.50.128' ||
    origin === 'http://40.160.50.128:5000' ||
    origin === 'http://127.0.0.1:5000' ||
    origin === 'http://localhost:5000'
  )) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, Set-Cookie');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
// Additional CORS headers for Chrome extension
app.use((req, res, next) => {
  const origin = req.get('Origin');
  
  // Allow Chrome extension origins
  if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
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
  const server = await registerRoutes(app);

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
