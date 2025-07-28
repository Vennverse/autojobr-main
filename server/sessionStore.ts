import session from 'express-session';
import * as ConnectRedis from 'connect-redis';
import MemoryStore from 'memorystore';
import { getRedisClient, checkRedisHealth } from './redis';

// Session store configuration
export async function createSessionStore(): Promise<session.Store> {
  // Try to use Redis first, fallback to memory store
  try {
    const isRedisHealthy = await checkRedisHealth();
    
    if (isRedisHealthy) {
      console.log('✅ Using Redis for session storage');
      const redisClient = getRedisClient();
      
      const RedisStore = ConnectRedis.RedisStore;
      return new RedisStore({
        client: redisClient,
        prefix: 'autojobr:sess:',
        ttl: 7 * 24 * 60 * 60, // 7 days in seconds
        touchAfter: 24 * 3600, // Touch session every 24 hours
        logErrors: (err: any) => {
          console.error('Redis session store error:', err);
        }
      });
    } else {
      throw new Error('Redis health check failed');
    }
  } catch (error: any) {
    console.warn('⚠️ Redis unavailable, falling back to memory store:', error.message);
    
    // Fallback to enhanced memory store for development
    const MemStore = MemoryStore(session);
    return new MemStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
      max: 1000, // Maximum number of sessions
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      dispose: (key: string) => {
        console.log(`🗑️ Session expired: ${key}`);
      }
    });
  }
}

// Session configuration factory
export async function createSessionConfig(secret: string) {
  const store = await createSessionStore();
  
  return {
    store,
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: false, // Allow HTTP for development
      httpOnly: true, // Standard security for web requests
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
<<<<<<< HEAD
      sameSite: 'lax', // Standard for same-site requests
      path: '/',
      domain: undefined,
=======
      sameSite: 'lax', // Changed from 'none' to 'lax' for better compatibility
      path: '/', // Ensure cookie path is set
      sameSite: 'none', // Required for cross-origin Chrome extension requests
      domain: undefined, // Don't restrict domain for Chrome extension
>>>>>>> 80128410164e37f6ee682124ad153f4273cd37be
    },
    name: 'autojobr.sid'
  };
}