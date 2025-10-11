import express from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { storage } from "./storage";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Express, RequestHandler } from "express";
import { sendEmail, generatePasswordResetEmail, generateVerificationEmail } from "./emailService";
import crypto from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pg from "pg";
import jwt from "jsonwebtoken";
// UserRoleService removed - role detection is now inline
// Simple auth configuration
const authConfig = {
  session: {
    secret: process.env.NEXTAUTH_SECRET || 'default-secret-key',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
  providers: {
    google: {
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID || '886940582280-c77j4n2r4mjdss6k9sus58l0qbc1lrh3.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    linkedin: {
      enabled: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    },
    email: {
      enabled: true, // Enable email login by default
    }
  }
};

export async function setupAuth(app: Express) {
  // Setup session middleware with PostgreSQL store for multi-instance support
  console.log('🔑 Setting up session middleware with PostgreSQL store...');

  const PgStore = ConnectPgSimple(session);

  // Create PostgreSQL connection pool for sessions
  const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Create session store with PostgreSQL
  const sessionStore = new PgStore({
    pool: pgPool,
    tableName: 'session', // Use default table name
    createTableIfMissing: true, // Create table if it doesn't exist
  });

  // Enhanced production configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = process.env.BASE_URL || process.env.REPL_URL || 'http://localhost:5000';
  const isSecure = isProduction && (baseUrl.startsWith('https://') || process.env.HTTPS === 'true');

  console.log(`🔒 Session config: production=${isProduction}, secure=${isSecure}, baseUrl=${baseUrl}`);

  app.use(session({
    store: sessionStore,
    secret: authConfig.session.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset maxAge on every request
    cookie: {
      secure: isSecure, // Enable for HTTPS in production
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year for persistent auth
      sameSite: isProduction ? 'strict' : 'lax', // Stricter in production
      domain: isProduction ? undefined : undefined, // Let browser handle domain
    },
    name: 'autojobr.session', // Consistent session name
    proxy: true // Trust proxy for production deployments
  }));
  console.log('✅ Session middleware configured successfully with PostgreSQL store for multi-instance support');

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth Strategy (force enable for production)
  if (authConfig.providers.google.clientId) {
    // Use HTTPS callback URL for production deployment
    const callbackURL = 'https://autojobr.com/api/auth/google/callback';
    console.log('🔑 Setting up Google OAuth strategy with callback URL:', callbackURL);
    console.log('🔑 Using Google Client ID:', authConfig.providers.google.clientId?.substring(0, 20) + '...');

    passport.use(new GoogleStrategy({
      clientID: authConfig.providers.google.clientId!,
      clientSecret: authConfig.providers.google.clientSecret || 'temp-secret-placeholder',
      callbackURL: callbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found'), false);
        }

        // Check if user exists
        let user = await storage.getUserByEmail(email);

        if (!user) {
          // Create new user with intelligent role detection
          const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Advanced role detection logic
          const emailLower = email.toLowerCase();
          const emailDomain = emailLower.split('@')[1] || '';
          const emailPrefix = emailLower.split('@')[0];

          let userType = 'job_seeker'; // Default

          // FIRST: Public email providers - always job seekers
          const publicProviders = [
            'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
            'live.com', 'msn.com', 'icloud.com', 'me.com',
            'aol.com', 'protonmail.com', 'mail.com', 'zoho.com'
          ];

          if (publicProviders.includes(emailDomain)) {
            userType = 'job_seeker';
          }
          // SECOND: Educational institutions (.edu, .ac.in, .edu.*, .ac.*)
          else if (
            emailDomain.endsWith('.edu') ||
            emailDomain.endsWith('.ac.in') ||
            emailDomain.includes('.edu.') ||
            emailDomain.includes('.ac.')
          ) {
            // Check if university HR/placement staff (they should be recruiters)
            const recruiterKeywords = ['hr', 'talent', 'recruiting', 'careers', 'hiring', 'placement'];

            if (recruiterKeywords.some(keyword => emailPrefix.includes(keyword))) {
              userType = 'recruiter'; // University career services/HR staff
            } else {
              userType = 'job_seeker'; // Regular students and faculty
            }
          }
          // THIRD: Corporate emails - check for recruiter indicators
          else {
            const recruiterDomains = ['hr.', 'talent.', 'recruiting.', 'careers.'];
            const recruiterKeywords = ['hr', 'talent', 'recruiting', 'careers', 'hiring'];

            // Check domain patterns
            if (recruiterDomains.some(domain => emailLower.includes(domain))) {
              userType = 'recruiter';
            }
            // Check email prefix for recruiting keywords (only for corporate emails)
            else if (recruiterKeywords.some(keyword => emailPrefix.includes(keyword))) {
              userType = 'recruiter';
            }
          }

          user = await storage.upsertUser({
            id: userId,
            email: email,
            firstName: profile.name?.givenName || 'User',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value || null,
            userType: userType,
            currentRole: userType,
            emailVerified: true,
            password: null,
          });

          // Create user profile with proper error handling
          try {
            await storage.upsertUserProfile({
              userId: userId,
              fullName: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
              freeRankingTestsRemaining: 1,
              freeInterviewsRemaining: 5,
              premiumInterviewsRemaining: 50,
              totalInterviewsUsed: 0,
              totalRankingTestsUsed: 0,
              onboardingCompleted: false,
              profileCompletion: 25,
            });
            console.log('✅ User profile created successfully for:', email);
          } catch (profileError) {
            console.error('Error creating user profile:', profileError);
            // Continue with authentication even if profile creation fails
          }
        } else {
          // Update existing user with better data preservation
          user = await storage.upsertUser({
            ...user,
            profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
            emailVerified: true,
            // Preserve existing names if they exist, otherwise use Google profile data
            firstName: user.firstName || profile.name?.givenName || 'User',
            lastName: user.lastName || profile.name?.familyName || '',
          });
        }

        console.log('✅ Google OAuth user authenticated:', user.email);
        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, false);
      }
    }));
  } else {
    console.log('⚠️  Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log(`🔍 Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      if (user) {
        const userData = {
          id: user.id,
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          userType: user.userType || 'job_seeker',
          currentRole: user.currentRole || user.userType || 'job_seeker',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        };
        console.log(`✅ User deserialized successfully: ${userData.email}`);
        done(null, userData);
      } else {
        console.log(`❌ User not found for ID: ${id}`);
        done(null, false);
      }
    } catch (error) {
      console.error(`❌ Error deserializing user ${id}:`, error);
      done(error, false);
    }
  });

  // Auth status endpoint with caching
  const providersCache = {
    providers: {
      google: authConfig.providers.google.enabled,
      github: authConfig.providers.github.enabled,
      linkedin: authConfig.providers.linkedin.enabled,
      email: authConfig.providers.email.enabled,
    },
  };

  app.get('/api/auth/providers', (req, res) => {
    // Set cache headers for better performance
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    res.json(providersCache);
  });

  // Login route
  app.post('/api/auth/signin', async (req, res) => {
    const { provider, email, password } = req.body;

    if (provider === 'credentials' && authConfig.providers.email.enabled) {
      try {
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }

        const [user] = await db.select().from(users).where(eq(users.email, email));

        if (!user || !user.password) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // CRITICAL: Regenerate session to prevent session reuse
        const oldSessionId = req.sessionID;
        (req as any).session.regenerate((regenerateErr: any) => {
          if (regenerateErr) {
            console.error('❌ Session regeneration failed:', regenerateErr);
            return res.status(500).json({ message: 'Login failed - session error' });
          }

          const newSessionId = req.sessionID;
          console.log(`🔄 [LOGIN] Session regenerated: ${oldSessionId.substring(0, 8)}... → ${newSessionId.substring(0, 8)}...`);

          // CRITICAL: Generate and store session fingerprint with NEW session ID
          const userAgent = req.headers['user-agent'] || 'unknown';
          const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

          sessionFingerprints.set(newSessionId, {
            userAgent,
            ipAddress,
            createdAt: Date.now()
          });

          // Set session with complete user data
          (req as any).session.user = {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            currentRole: user.currentRole || user.userType
          };

          // Track user session with NEW session ID
          trackUserSession(user.id, newSessionId);

          // Save session before responding with enhanced logging
          (req as any).session.save((err: any) => {
            if (err) {
              console.error('❌ Session save error during login:', err);
              sessionFingerprints.delete(newSessionId);
              removeUserSession(user.id, newSessionId);
              return res.status(500).json({ message: 'Login failed - session error' });
            }

            console.log(`✅ Secure session created for user: ${user.email} (${user.userType}) - Session: ${newSessionId.substring(0, 8)}...`);

            res.json({ 
              message: "Login successful", 
              user: {
                id: user.id,
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                userType: user.userType,
                currentRole: user.currentRole || user.userType
              }
            });
          });
        });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
      }
    } else {
      // For OAuth providers, redirect to proper Passport.js endpoints
      if (provider === 'google' && authConfig.providers.google.enabled) {
        res.json({ redirectUrl: '/api/auth/google' });
      } else if (provider === 'github' && authConfig.providers.github.enabled) {
        const baseUrl = process.env.BASE_URL || process.env.REPL_URL || 'http://localhost:5000';
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${authConfig.providers.github.clientId}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/github`)}&scope=user:email`;
        res.json({ redirectUrl: authUrl });
      } else if (provider === 'linkedin' && authConfig.providers.linkedin.enabled) {
        const baseUrl = process.env.BASE_URL || process.env.REPL_URL || 'http://localhost:5000';
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${authConfig.providers.linkedin.clientId}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/linkedin`)}&scope=r_liteprofile%20r_emailaddress`;
        res.json({ redirectUrl: authUrl });
      } else {
        res.status(400).json({ message: "Provider not supported or not configured" });
      }
    }
  });


  // Session refresh endpoint
  app.post('/api/auth/refresh-session', async (req: any, res) => {
    try {
      const sessionUser = req.session?.user;

      if (!sessionUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Fetch fresh user data from database
      const { storage } = await import("./storage");
      const fullUser = await storage.getUser(sessionUser.id);

      if (fullUser) {
        // Update session with fresh database data
        req.session.user = {
          id: fullUser.id,
          email: fullUser.email,
          name: `${fullUser.firstName || ''} ${fullUser.lastName || ''}`.trim(),
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          userType: fullUser.userType
        };

        // Save session
        req.session.save((err: any) => {
          if (err) {
            console.error('Session refresh save error:', err);
            return res.status(500).json({ message: 'Session refresh failed' });
          }

          res.json({ 
            message: 'Session refreshed successfully',
            user: {
              id: fullUser.id,
              email: fullUser.email,
              name: `${fullUser.firstName || ''} ${fullUser.lastName || ''}`.trim(),
              userType: fullUser.userType
            }
          });
        });
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Session refresh error:", error);
      res.status(500).json({ message: "Failed to refresh session" });
    }
  });

  // Logout - ENTERPRISE-GRADE SECURITY WITH COMPLETE CLEANUP
  app.post('/api/auth/signout', async (req: any, res) => {
    const userId = req.session?.user?.id;
    const sessionId = req.sessionID;

    console.log(`🚪 [LOGOUT] User ${userId} logging out, session: ${sessionId}`);

    // CRITICAL: Clear route cache FIRST (synchronously)
    if (userId) {
      try {
        const { invalidateUserCache } = await import('./routes.js');
        invalidateUserCache(userId);
        console.log(`✅ [LOGOUT] Route cache cleared for user: ${userId}`);
      } catch (cacheError) {
        console.error('❌ [LOGOUT] Route cache clear error:', cacheError);
      }
    }

    // CRITICAL: Remove from session tracking and clear ALL caches
    if (userId && sessionId) {
      removeUserSession(userId, sessionId);
      
      // Clear ALL cache entries for this user across ALL sessions
      const allCacheKeys = Array.from(userSessionCache.keys());
      allCacheKeys.forEach(key => {
        if (key.startsWith(`${userId}:`)) {
          userSessionCache.delete(key);
          console.log(`🗑️ [LOGOUT] Deleted cache key: ${key}`);
        }
      });

      // DEFENSIVE: Explicitly clear session fingerprint again
      sessionFingerprints.delete(sessionId);
      console.log(`✅ [LOGOUT] Session fingerprint cleared: ${sessionId}`);
    }

    // CRITICAL: Destroy session and wait for completion
    req.session.destroy((err: any) => {
      if (err) {
        console.error('❌ [LOGOUT] Session destroy failed:', err);
        // Force manual cleanup even if destroy fails
        delete (req as any).session;
      }

      console.log(`✅ [LOGOUT] Session ${sessionId} destroyed`);

      // CRITICAL: Clear ALL session cookies with multiple strategies
      const cookieNames = [
        'autojobr.session',
        'autojobr.sid', 
        'connect.sid'
      ];

      const cookieSettings = [
        { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const },
        { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const },
        { path: '/', httpOnly: true, secure: false, sameSite: 'lax' as const },
        { path: '/' }
      ];

      cookieNames.forEach(name => {
        cookieSettings.forEach(settings => {
          res.clearCookie(name, settings);
        });
      });

      // CRITICAL: Strict anti-cache headers
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Clear-Site-Data': '"cache", "cookies", "storage"'
      });

      console.log(`✅ [LOGOUT] Complete cleanup for user: ${userId}, session: ${sessionId}`);

      res.json({ 
        message: "Logged out successfully",
        logout: true,
        redirectTo: "/auth",
        clearCache: true,
        forceReload: true,
        timestamp: Date.now()
      });
    });
  });

  // Google OAuth Routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    })
  );

  // Handle Google OAuth callback route - MUST match the callbackURL in strategy
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth?error=oauth_failed' }),
    (req: any, res) => {
      console.log(`✅ Google OAuth successful for user: ${req.user?.email}`);

      const userData = {
        id: req.user.id,
        email: req.user.email,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        userType: req.user.userType,
        currentRole: req.user.currentRole || req.user.userType
      };

      // CRITICAL: Regenerate session to prevent session reuse
      const oldSessionId = req.sessionID;
      req.session.regenerate((regenerateErr: any) => {
        if (regenerateErr) {
          console.error('❌ Session regeneration failed after Google OAuth:', regenerateErr);
          return res.redirect('/auth?error=session_error');
        }

        const newSessionId = req.sessionID;
        console.log(`🔄 [GOOGLE_OAUTH] Session regenerated: ${oldSessionId.substring(0, 8)}... → ${newSessionId.substring(0, 8)}...`);

        // Generate and store session fingerprint with NEW session ID
        const userAgent = req.headers['user-agent'] || 'unknown';
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

        sessionFingerprints.set(newSessionId, {
          userAgent,
          ipAddress,
          createdAt: Date.now()
        });

        // Set session user data with regenerated session
        req.session.user = userData;

        // Track user session with NEW session ID
        trackUserSession(userData.id, newSessionId);

        // Save session FIRST, then redirect
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error('❌ Session save error after Google OAuth:', saveErr);
            sessionFingerprints.delete(newSessionId);
            removeUserSession(userData.id, newSessionId);
            return res.redirect('/auth?error=session_save_failed');
          }

          console.log(`✅ Google OAuth session saved successfully for user: ${req.user.email}`);
          console.log(`📝 Session data:`, {
            sessionId: newSessionId,
            userId: userData.id,
            email: userData.email,
            userType: userData.userType
          });

          // Redirect to home page after successful login
          res.redirect('/?auth=google_success');
        });
      });
    }
  );

  // Old callback handler (to be removed)
  app.get('/api/auth/callback/google-old', async (req, res) => {
    try {
      const { code, error } = req.query;

      if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect('/login?error=google_oauth_failed');
      }

      if (!code) {
        return res.redirect('/login?error=missing_code');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: authConfig.providers.google.clientId!,
          client_secret: authConfig.providers.google.clientSecret!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: (() => {
            const host = req.get('host');
            if (host && (host.includes('repl.co') || host.includes('replit.dev'))) {
              return `https://${host}/api/auth/callback/google`;
            } else if (host === 'autojobr.com') {
              return 'https://autojobr.com/api/auth/callback/google';
            } else {
              return `${req.protocol}://${host}/api/auth/callback/google`;
            }
          })(),
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        console.error('Failed to get access token:', tokens);
        console.error('Request host:', req.get('host'));
        console.error('Redirect URI used:', (() => {
          const host = req.get('host');
          if (host && (host.includes('repl.co') || host.includes('replit.dev'))) {
            return `https://${host}/api/auth/callback/google`;
          } else if (host === 'autojobr.com') {
            return 'https://autojobr.com/api/auth/callback/google';
          } else {
            return `${req.protocol}://${host}/api/auth/callback/google`;
          }
        })());
        return res.redirect('/login?error=token_exchange_failed');
      }

      // Get user profile from Google
      const profileResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
      );
      const profile = await profileResponse.json();

      if (!profile.email) {
        return res.redirect('/login?error=no_email');
      }

      // Create or find user
      let user;
      try {
        // Try to find existing user by email
        const [existingUser] = await db.select().from(users).where(eq(users.email, profile.email));

        if (existingUser) {
          // Update existing user with Google data
          user = await storage.upsertUser({
            ...existingUser,
            profileImageUrl: profile.picture || existingUser.profileImageUrl,
            emailVerified: true, // Google emails are pre-verified
          });
        } else {
          // Create new user from Google profile
          const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          user = await storage.upsertUser({
            id: userId,
            email: profile.email,
            firstName: profile.given_name || 'User',
            lastName: profile.family_name || '',
            profileImageUrl: profile.picture,
            userType: 'job_seeker', // Default to job seeker
            emailVerified: true,
            password: null, // OAuth users don't have passwords
          });

          // Create user profile for new OAuth users
          try {
            await storage.upsertUserProfile({
              userId: userId,
              fullName: `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
              freeRankingTestsRemaining: 1,
              freeInterviewsRemaining: 5,
              premiumInterviewsRemaining: 50,
              totalInterviewsUsed: 0,
              totalRankingTestsUsed: 0,
              onboardingCompleted: false,
              profileCompletion: 25, // OAuth signup gives more completion
            });
          } catch (profileError) {
            console.error('Error creating OAuth user profile:', profileError);
          }
        }
      } catch (dbError) {
        console.error('Database error during Google OAuth:', dbError);
        return res.redirect('/login?error=database_error');
      }

      // Set session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Save session and redirect
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error during Google OAuth:', err);
          return res.redirect('/login?error=session_error');
        }

        console.log('✅ Google OAuth login successful for:', user.email);
        res.redirect('/?auth=google_success');
      });

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/login?error=oauth_callback_failed');
    }
  });

  // Email authentication routes
  app.post('/api/auth/email/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Advanced role detection logic (same as Google OAuth)
      const emailLower = email.toLowerCase();
      const emailDomain = emailLower.split('@')[1] || '';
      const emailPrefix = emailLower.split('@')[0];

      let userType = 'job_seeker'; // Default

      // FIRST: Public email providers - always job seekers
      const publicProviders = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
        'live.com', 'msn.com', 'icloud.com', 'me.com',
        'aol.com', 'protonmail.com', 'mail.com', 'zoho.com'
      ];

      if (publicProviders.includes(emailDomain)) {
        userType = 'job_seeker';
      }
      // SECOND: Educational institutions (.edu, .ac.in, .edu.*, .ac.*)
      else if (
        emailDomain.endsWith('.edu') ||
        emailDomain.endsWith('.ac.in') ||
        emailDomain.includes('.edu.') ||
        emailDomain.includes('.ac.')
      ) {
        // Check if university HR/placement staff (they should be recruiters)
        const recruiterKeywords = ['hr', 'talent', 'recruiting', 'careers', 'hiring', 'placement'];

        if (recruiterKeywords.some(keyword => emailPrefix.includes(keyword))) {
          userType = 'recruiter'; // University career services/HR staff
        } else {
          userType = 'job_seeker'; // Regular students and faculty
        }
      }
      // THIRD: Corporate emails - check for recruiter indicators
      else {
        const recruiterDomains = ['hr.', 'talent.', 'recruiting.', 'careers.'];
        const recruiterKeywords = ['hr', 'talent', 'recruiting', 'careers', 'hiring'];

        // Check domain patterns
        if (recruiterDomains.some(domain => emailLower.includes(domain))) {
          userType = 'recruiter';
        }
        // Check email prefix for recruiting keywords (only for corporate emails)
        else if (recruiterKeywords.some(keyword => emailPrefix.includes(keyword))) {
          userType = 'recruiter';
        }
      }

      // Create new user (not verified yet)
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        userType: userType,
        currentRole: userType,
        emailVerified: false, // User needs to verify email
        profileImageUrl: null,
        companyName: null,
        companyWebsite: null
      });

      // Create user profile with free practice test allocation
      try {
        await storage.upsertUserProfile({
          userId: userId,
          fullName: `${firstName} ${lastName}`,
          freeRankingTestsRemaining: 1, // New users get 1 free ranking test
          freeInterviewsRemaining: 5,   // New users get 5 free interviews
          premiumInterviewsRemaining: 50,
          totalInterviewsUsed: 0,
          totalRankingTestsUsed: 0,
          onboardingCompleted: false,
          profileCompletion: 15, // Basic info completed
        });
        console.log(`✅ Created user profile with free practice allocation for user: ${userId}`);
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // Continue with signup even if profile creation fails
      }

      // Generate verification token
      const verificationToken = Math.random().toString(36).substr(2, 32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Store verification token
      await storage.createEmailVerificationToken({
        token: verificationToken,
        email,
        userId,
        expiresAt,
        verified: false
      });

      // Send verification email
      try {
        const { sendEmail, generateVerificationEmail } = await import('./emailService');
        const emailHtml = generateVerificationEmail(verificationToken, `${firstName} ${lastName}`, 'job_seeker');

        await sendEmail({
          to: email,
          subject: 'Verify your AutoJobr account',
          html: emailHtml,
        });

        res.status(201).json({ 
          message: 'Account created successfully. Please check your email to verify your account.',
          requiresVerification: true,
          email: email
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // If email fails, still create account but notify user
        res.status(201).json({ 
          message: 'Account created but verification email could not be sent. Please contact support.',
          requiresVerification: true,
          email: email
        });
      }
    } catch (error) {
      console.error('Email signup error:', error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post('/api/auth/email/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check if email is verified (only for email signup users)
      if (!user.emailVerified) {
        return res.status(403).json({ 
          message: 'Please verify your email address before logging in. Check your inbox for the verification email.',
          requiresVerification: true,
          email: user.email
        });
      }

      // Store session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Force session save before responding
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }

        console.log('Session saved successfully for user:', user.id);
        res.json({ 
          message: 'Login successful', 
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            userType: user.userType
          }
        });
      });
    } catch (error) {
      console.error('Email login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Demo login endpoint for testing with enhanced debugging
  app.post('/api/auth/demo-login', async (req, res) => {
    try {
      console.log('🎭 [DEMO LOGIN] Starting demo login process...');

      // Get the existing user
      const [user] = await db.select().from(users).where(eq(users.email, 'shubhamdubeyskd2001@gmail.com'));
      if (!user) {
        console.log('❌ [DEMO LOGIN] Demo user not found in database');
        return res.status(404).json({ message: 'Demo user not found' });
      }

      console.log(`✅ [DEMO LOGIN] Found demo user: ${user.email} (${user.userType})`);

      // Store session with comprehensive user data
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType || 'job_seeker'
      };

      // Force session save before responding
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }

        console.log('Demo session saved successfully for user:', user.id);
        res.json({ 
          message: 'Demo login successful', 
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            userType: user.userType || 'job_seeker'
          }
        });
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ message: 'Demo login failed' });
    }
  });

  // Email verification endpoint
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      // Get token from database
      const tokenRecord = await storage.getEmailVerificationToken(token as string);

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      // Find user by email from the token record
      let [user] = await db.select().from(users).where(eq(users.email, tokenRecord.email));

      if (!user && tokenRecord.userType === 'recruiter') {
        // For recruiters, create the user account during verification
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newUser = await storage.upsertUser({
          id: userId,
          email: tokenRecord.email,
          firstName: tokenRecord.companyName || 'Recruiter',
          lastName: '',
          password: null, // Recruiter accounts don't use password initially
          userType: 'recruiter',
          emailVerified: true, // Verified during this process
          profileImageUrl: null,
          companyName: tokenRecord.companyName,
          companyWebsite: tokenRecord.companyWebsite
        });
        user = newUser;
      } else if (user) {
        // Update existing user's verification status
        await storage.upsertUser({
          ...user,
          emailVerified: true,
        });
      }

      if (user) {
        // Delete used token
        await storage.deleteEmailVerificationToken(token as string);

        // Auto-login the user
        (req as any).session.user = {
          id: user.id,
          email: user.email,
          name: user.userType === 'recruiter' 
            ? (user.companyName || 'Recruiter')
            : `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType
        };

        // Force session save before redirecting
        (req as any).session.save((err: any) => {
          if (err) {
            console.error('Session save error during verification:', err);
            return res.status(500).json({ message: 'Verification failed - session error' });
          }

          console.log('Verification session saved successfully for user:', user.id);

          // Redirect based on user type - always redirect to /auth after verification
          if (user.userType === 'recruiter') {
            res.redirect('/auth?verified=true&type=recruiter&message=Email verified successfully! Welcome to AutoJobr.');
          } else {
            res.redirect('/auth?verified=true&message=Email verified successfully! Please sign in to continue.');
          }
        });
      } else {
        return res.status(400).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Email verification failed' });
    }
  });

  // OAuth callback handlers
  app.get('/api/auth/callback/google', async (req, res) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const baseUrl = 'https://autojobr.com';
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: authConfig.providers.google.clientId!,
          client_secret: authConfig.providers.google.clientSecret!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${baseUrl}/api/auth/callback/google`,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        return res.status(400).json({ message: 'Failed to get access token' });
      }

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const googleUser = await userResponse.json();

      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));

      if (!user) {
        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        user = await storage.upsertUser({
          id: userId,
          email: googleUser.email,
          firstName: googleUser.given_name || 'User',
          lastName: googleUser.family_name || '',
          password: null,
          userType: 'job_seeker',
          emailVerified: true,
          profileImageUrl: googleUser.picture,
          companyName: null,
          companyWebsite: null
        });
      }

      // Create session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Save session and redirect
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }

        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.status(500).json({ message: 'Google login failed' });
    }
  });

  app.get('/api/auth/callback/github', async (req, res) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: authConfig.providers.github.clientId!,
          client_secret: authConfig.providers.github.clientSecret!,
          code: code as string,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        return res.status(400).json({ message: 'Failed to get access token' });
      }

      // Get user info from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokens.access_token}`,
          'User-Agent': 'AutoJobr',
        },
      });

      const githubUser = await userResponse.json();

      // Get user emails
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${tokens.access_token}`,
          'User-Agent': 'AutoJobr',
        },
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find((email: any) => email.primary)?.email || githubUser.email;

      if (!primaryEmail) {
        return res.status(400).json({ message: 'No email found in GitHub account' });
      }

      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, primaryEmail));

      if (!user) {
        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const name = githubUser.name || githubUser.login;
        const nameParts = name.split(' ');

        user = await storage.upsertUser({
          id: userId,
          email: primaryEmail,
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
          password: null,
          userType: 'job_seeker',
          emailVerified: true,
          profileImageUrl: githubUser.avatar_url,
          companyName: null,
          companyWebsite: null
        });
      }

      // Create session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Save session and redirect
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }

        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      res.status(500).json({ message: 'GitHub login failed' });
    }
  });

  app.get('/api/auth/callback/linkedin', async (req, res) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const baseUrl = 'https://autojobr.com';
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: `${baseUrl}/api/auth/callback/linkedin`,
          client_id: authConfig.providers.linkedin.clientId!,
          client_secret: authConfig.providers.linkedin.clientSecret!,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        return res.status(400).json({ message: 'Failed to get access token' });
      }

      // Get user info from LinkedIn
      const userResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const linkedinUser = await userResponse.json();

      // Get user email
      const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const emailData = await emailResponse.json();
      const email = emailData.elements?.[0]?.['handle~']?.emailAddress;

      if (!email) {
        return res.status(400).json({ message: 'No email found in LinkedIn account' });
      }

      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, email));

      if (!user) {
        // Create new user
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const firstName = linkedinUser.firstName?.localized?.en_US || 'User';
        const lastName = linkedinUser.lastName?.localized?.en_US || '';

        user = await storage.upsertUser({
          id: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          password: null,
          userType: 'job_seeker',
          emailVerified: true,
          profileImageUrl: linkedinUser.profilePicture?.displayImage?.['~']?.elements?.[0]?.identifiers?.[0]?.identifier,
          companyName: null,
          companyWebsite: null
        });
      }

      // Create session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };

      // Save session and redirect
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Login failed - session error' });
        }

        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      res.status(500).json({ message: 'LinkedIn login failed' });
    }
  });

  // Send verification email for job seekers
  app.post('/api/auth/send-user-verification', async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;

      if (!email || !firstName) {
        return res.status(400).json({ message: 'Email and first name are required' });
      }

      // Generate verification token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      try {
        // Save verification token
        await storage.createEmailVerificationToken({
          email,
          token,
          expiresAt,
          userId: `pending-jobseeker-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          userType: "job_seeker",
        });

        // Send email with appropriate template
        const userName = `${firstName} ${lastName || ''}`.trim();
        const emailHtml = generateVerificationEmail(token, userName, "job_seeker");
        const emailSent = await sendEmail({
          to: email,
          subject: 'Verify Your Email - AutoJobr',
          html: emailHtml,
        });

        if (emailSent) {
          res.json({ 
            message: 'Verification email sent successfully',
            email: email
          });
        } else {
          res.status(500).json({ message: 'Failed to send verification email' });
        }
      } catch (error) {
        console.error('Database error during verification:', error);
        res.status(500).json({ message: 'Database connection issue. Please try again later.' });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      // Generate new verification token
      const verificationToken = Math.random().toString(36).substr(2, 32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Delete old tokens for this user
      try {
        await storage.deleteEmailVerificationTokensByUserId(user.id);
      } catch (error) {
        console.log('No old tokens to delete');
      }

      // Store new verification token
      await storage.createEmailVerificationToken({
        token: verificationToken,
        email,
        userId: user.id,
        expiresAt,
        verified: false
      });

      // Send verification email
      try {
        const { sendEmail, generateVerificationEmail } = await import('./emailService');
        const emailHtml = generateVerificationEmail(verificationToken, `${user.firstName} ${user.lastName}`, user.userType || 'job_seeker');

        await sendEmail({
          to: email,
          subject: 'Verify your AutoJobr account',
          html: emailHtml,
        });

        res.json({ 
          message: 'Verification email sent successfully. Please check your inbox.'
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        res.status(500).json({ 
          message: 'Failed to send verification email. Please try again later.'
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification email' });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        // For security, don't reveal if email exists or not
        return res.json({ 
          message: 'If an account with this email exists, you will receive a password reset email shortly.' 
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      // Store reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false,
      });

      // Send reset email
      const resetEmailHtml = generatePasswordResetEmail(resetToken, user.email!);
      const emailSent = await sendEmail({
        to: user.email!,
        subject: 'Reset Your AutoJobr Password',
        html: resetEmailHtml,
      });

      if (emailSent) {
        res.json({ 
          message: 'If an account with this email exists, you will receive a password reset email shortly.' 
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to send password reset email. Please try again later.' 
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Reset password endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Get token from database
      const tokenRecord = await storage.getPasswordResetToken(token);

      if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user's password
      await storage.updateUserPassword(tokenRecord.userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      // Clean up expired tokens
      await storage.deleteExpiredPasswordResetTokens();

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Extension-specific authentication routes
  app.get('/auth/extension-login', (req, res) => {
    // Render a simple login page for extension
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AutoJobr Extension Login</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 400px; 
            margin: 50px auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          input { 
            width: 100%; 
            padding: 12px; 
            margin: 10px 0; 
            border: none;
            border-radius: 5px;
            background: rgba(255,255,255,0.9);
            color: #333;
          }
          button { 
            width: 100%; 
            padding: 12px; 
            background: #ff6b6b; 
            color: white; 
            border: none; 
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
          }
          button:hover { background: #ff5252; }
          .error { color: #ffcdd2; margin: 10px 0; }
          h2 { text-align: center; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🚀 AutoJobr Extension</h2>
          <p>Sign in to access your profile data for job applications</p>
          <form id="loginForm">
            <input type="email" id="email" placeholder="Email" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Sign In</button>
          </form>
          <div id="error" class="error"></div>
        </div>

        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error');

            try {
              const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'credentials', email, password }),
                credentials: 'include'
              });

              const data = await response.json();

              if (response.ok) {
                // Success - redirect to success page
                window.location.href = '/auth/extension-success';
              } else {
                errorDiv.textContent = data.message || 'Login failed';
              }
            } catch (error) {
              errorDiv.textContent = 'Login failed - please try again';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  app.get('/auth/extension-success', (req: any, res) => {
    // Check if user is authenticated
    if (!req.session?.user) {
      return res.redirect('/auth/extension-login');
    }

    try {
      // Generate JWT token for extension
      const user = req.session.user;
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          userType: user.userType || 'job_seeker'
        },
        authConfig.session.secret,
        {
          expiresIn: '30d', // Extension tokens last longer
          issuer: 'autojobr',
          audience: 'extension'
        }
      );

      // Redirect with token and user ID as URL parameters (as expected by extension)
      const redirectUrl = `/auth/extension-success?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(user.id)}`;

      // Check if we already have URL parameters (prevent infinite redirect)
      if (req.query.token && req.query.userId) {
        // Display success page with the token
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>AutoJobr Extension - Success</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 400px; 
                margin: 50px auto; 
                padding: 20px;
                background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
                color: white;
                text-align: center;
              }
              .container {
                background: rgba(255,255,255,0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
              h2 { margin-bottom: 20px; }
              .success { font-size: 48px; margin: 20px 0; }
              p { margin: 15px 0; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✅</div>
              <h2>Extension Connected!</h2>
              <p>Authentication successful! Your Chrome extension is now connected.</p>
              <p>You can close this tab and return to the extension.</p>
            </div>

            <script>
              // Auto-close after 3 seconds
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </body>
          </html>
        `);
      } else {
        // Redirect to add token parameters for extension to pick up
        res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Extension token generation error:', error);
      res.status(500).send('Failed to generate extension token');
    }
  });


}

// ENTERPRISE-GRADE SESSION MANAGEMENT
interface SessionFingerprint {
  userAgent: string;
  ipAddress: string;
  createdAt: number;
}

const sessionFingerprints = new Map<string, SessionFingerprint>();
const activeUserSessions = new Map<string, Set<string>>(); // userId -> Set of sessionIds
const USER_CACHE_TTL = 2 * 60 * 1000; // Reduced to 2 minutes for security

// Generate session fingerprint
function generateFingerprint(req: any): string {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `${userAgent}|${ip}`;
}

// Validate session fingerprint
function validateFingerprint(req: any, sessionId: string): boolean {
  const storedFingerprint = sessionFingerprints.get(sessionId);
  if (!storedFingerprint) return false;
  
  // In development (Replit), be more lenient with fingerprint validation
  // since IP addresses can change when viewing through iframe/proxy
  if (process.env.NODE_ENV !== 'production') {
    // Only validate user-agent in development
    const currentUserAgent = req.headers['user-agent'] || 'unknown';
    return currentUserAgent === storedFingerprint.userAgent;
  }
  
  const currentFingerprint = generateFingerprint(req);
  const storedStr = `${storedFingerprint.userAgent}|${storedFingerprint.ipAddress}`;
  
  return currentFingerprint === storedStr;
}

// Track user session
function trackUserSession(userId: string, sessionId: string): void {
  if (!activeUserSessions.has(userId)) {
    activeUserSessions.set(userId, new Set());
  }
  activeUserSessions.get(userId)!.add(sessionId);
}

// Remove user session
function removeUserSession(userId: string, sessionId: string): void {
  const sessions = activeUserSessions.get(userId);
  if (sessions) {
    sessions.delete(sessionId);
    if (sessions.size === 0) {
      activeUserSessions.delete(userId);
    }
  }
  sessionFingerprints.delete(sessionId);
}

// Clear all user sessions (for security - logout all devices)
function clearAllUserSessions(userId: string): void {
  const sessions = activeUserSessions.get(userId);
  if (sessions) {
    sessions.forEach(sid => sessionFingerprints.delete(sid));
    activeUserSessions.delete(userId);
  }
}

// STRICT session cache with isolation
const userSessionCache = new Map<string, { 
  user: any; 
  lastCheck: number;
  sessionId: string; // Bind cache to specific session
}>();

// Middleware to check authentication - ENTERPRISE-GRADE
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const sessionId = req.sessionID;
    const sessionUser = req.session?.user || req.user;

    // CRITICAL: No session or session user
    if (!sessionUser || !sessionId) {
      console.log(`🚫 [AUTH] No session/user - ${req.method} ${req.path}`);
      return res.status(401).json({ message: "Not authenticated" });
    }

    // NOTE: Fingerprint validation disabled to prevent false positives
    // IP addresses can change frequently due to mobile networks, VPNs, proxies, load balancers, etc.
    // Session cookie security and HTTPS provide sufficient protection
    // Keep the fingerprint tracking for monitoring, but don't block users
    if (sessionFingerprints.has(sessionId)) {
      const storedFingerprint = sessionFingerprints.get(sessionId);
      const currentUserAgent = req.headers['user-agent'] || 'unknown';
      const currentIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      if (storedFingerprint && (currentUserAgent !== storedFingerprint.userAgent || currentIp !== storedFingerprint.ipAddress)) {
        console.log(`⚠️ [AUTH] Fingerprint changed for session ${sessionId.substring(0, 8)}... (UA or IP changed, but allowing access)`);
      }
    }

    // CRITICAL: Check cache with session binding
    const cacheKey = `${sessionUser.id}:${sessionId}`;
    const cached = userSessionCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.lastCheck) < USER_CACHE_TTL && cached.sessionId === sessionId) {
      // Cached data is valid and bound to current session
      req.user = cached.user;
      return next();
    }

    // Fetch fresh data from database
    const currentUser = await storage.getUser(sessionUser.id);

    if (!currentUser) {
      console.log(`🚫 [AUTH] User ${sessionUser.id} not found in DB`);
      req.session.destroy(() => {
        removeUserSession(sessionUser.id, sessionId);
      });
      return res.status(401).json({ message: "User not found" });
    }

    // Build ISOLATED user object
    const userObj = {
      id: currentUser.id,
      email: currentUser.email,
      name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      firstName: currentUser.firstName || 'User',
      lastName: currentUser.lastName || 'Name',
      userType: currentUser.userType || 'job_seeker',
      currentRole: currentUser.currentRole || currentUser.userType || 'job_seeker',
      sessionId: sessionId // Bind to session
    };

    // Cache with SESSION BINDING
    userSessionCache.set(cacheKey, {
      user: userObj,
      lastCheck: now,
      sessionId: sessionId
    });

    // Track active session
    trackUserSession(currentUser.id, sessionId);

    req.user = userObj;
    next();
  } catch (error) {
    console.error("🚨 [AUTH] Critical authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Authentication middleware for interview access that redirects instead of 401
export const requireAuthForInterview: RequestHandler = async (req: any, res, next) => {
  console.log(`🎭 [INTERVIEW AUTH] ${req.method} ${req.originalUrl}: checking authentication`);
  try {
    const sessionUser = req.session?.user;

    if (sessionUser) {
      try {
        // Try to get user from database
        const [dbUser] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
        if (dbUser) {
          req.user = dbUser;
          return next();
        }
      } catch (dbError) {
        console.warn('DB lookup failed, falling back to session user:', dbError);
      }

      // Fallback to session user if DB lookup fails (for resilience)
      req.user = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name || `${sessionUser.firstName || ''} ${sessionUser.lastName || ''}`.trim(),
        firstName: sessionUser.firstName || 'User',
        lastName: sessionUser.lastName || 'Name',
        userType: sessionUser.userType || 'job_seeker'
      };
      return next();
    }

    // If not authenticated, prepare redirect
    // Extract sessionId from URL to build proper page redirect
    const sessionIdMatch = req.originalUrl.match(/\/chat-interview\/([^/]+)/);
    const pageUrl = sessionIdMatch ? `/chat-interview/${sessionIdMatch[1]}` : req.originalUrl;
    const authUrl = `/auth-page?redirect=${encodeURIComponent(pageUrl)}`;

    console.log(`🎭 [INTERVIEW AUTH] Redirecting unauthenticated user. Original: ${req.originalUrl}, Page: ${pageUrl}, Auth: ${authUrl}`);

    // Check if this is an API request by looking at originalUrl or baseUrl
    const isApiRequest = req.originalUrl.startsWith('/api/') || (req.baseUrl && req.baseUrl.includes('/api'));

    if (isApiRequest) {
      // For API requests, return JSON with redirect URL
      return res.status(401).json({ 
        message: 'Authentication required', 
        redirectUrl: authUrl,
        requiresAuth: true
      });
    } else {
      // For page requests, redirect directly
      return res.redirect(authUrl);
    }
  } catch (error) {
    console.error('Interview auth middleware error:', error);

    // Extract sessionId from URL to build proper page redirect  
    const sessionIdMatch = req.originalUrl.match(/\/chat-interview\/([^/]+)/);
    const pageUrl = sessionIdMatch ? `/chat-interview/${sessionIdMatch[1]}` : req.originalUrl;
    const authUrl = `/auth-page?redirect=${encodeURIComponent(pageUrl)}`;

    const isApiRequest = req.originalUrl.startsWith('/api/') || (req.baseUrl && req.baseUrl.includes('/api'));

    if (isApiRequest) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        redirectUrl: authUrl,
        requiresAuth: true
      });
    } else {
      return res.redirect(authUrl);
    }
  }
};

// Extension-compatible authentication middleware for JWT + session support
export const isAuthenticatedExtension: RequestHandler = async (req: any, res, next) => {
  try {
    // Try session authentication first (webapp)
    const sessionUser = req.session?.user;
    if (sessionUser) {
      req.user = sessionUser;
      return next();
    }

    // Try JWT authentication (extension)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, authConfig.session.secret, {
          issuer: 'autojobr',
          audience: 'extension'
        }) as any;

        // Set user data for request
        req.user = {
          id: decoded.id,
          email: decoded.email,
          userType: decoded.userType
        };
        return next();
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError);
      }
    }

    return res.status(401).json({ message: "Not authenticated" });
  } catch (error) {
    console.error("Extension authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

// ENTERPRISE-GRADE: Automatic session cleanup and security monitoring
setInterval(() => {
  const now = Date.now();
  
  // Clean up stale cache entries
  const cacheEntries = Array.from(userSessionCache.entries());
  for (const [key, cached] of cacheEntries) {
    if ((now - cached.lastCheck) > USER_CACHE_TTL * 2) {
      userSessionCache.delete(key);
    }
  }
  
  // Clean up expired session fingerprints (older than 24 hours)
  const fingerprintEntries = Array.from(sessionFingerprints.entries());
  for (const [sessionId, fingerprint] of fingerprintEntries) {
    if ((now - fingerprint.createdAt) > 24 * 60 * 60 * 1000) {
      sessionFingerprints.delete(sessionId);
      console.log(`🧹 [CLEANUP] Removed expired fingerprint for session: ${sessionId.substring(0, 8)}...`);
    }
  }
  
  // Monitor for suspicious activity (multiple sessions from same user)
  const userSessionCounts = new Map<string, number>();
  activeUserSessions.forEach((sessions, userId) => {
    userSessionCounts.set(userId, sessions.size);
    if (sessions.size > 5) {
      console.warn(`⚠️ [SECURITY] User ${userId} has ${sessions.size} active sessions - possible account sharing`);
    }
  });
  
  console.log(`🔍 [SESSION MONITOR] Active: ${activeUserSessions.size} users, ${cacheEntries.length} cache entries, ${fingerprintEntries.length} fingerprints`);
}, USER_CACHE_TTL);

// Export session management functions for admin use
export const sessionManagement = {
  getActiveSessionCount: () => activeUserSessions.size,
  getUserSessionCount: (userId: string) => activeUserSessions.get(userId)?.size || 0,
  forceLogoutUser: (userId: string) => clearAllUserSessions(userId),
  getSessionFingerprint: (sessionId: string) => sessionFingerprints.get(sessionId)
};