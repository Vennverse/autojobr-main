import Redis from 'ioredis';

// Redis configuration for session storage and caching
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    // Use Redis from Replit environment or fallback to local instance
    const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL || 'redis://localhost:6379';
    
    console.log('🔧 Initializing Redis client...');
    
    redis = new Redis(redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4, // Force IPv4
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      retryConnect: (times) => {
        if (times > 3) {
          console.log('🛑 Redis: Maximum retry attempts reached, stopping reconnection');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('✅ Redis ready for operations');
    });

    redis.on('error', (err: any) => {
      console.error('❌ Redis connection error:', err.message);
      // Don't crash the app in development if Redis is unavailable
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Continuing without Redis in development mode');
      }
    });

    redis.on('close', () => {
      console.log('⚠️ Redis connection closed');
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
  }

  return redis;
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    console.log('🔄 Closing Redis connection...');
    await redis.quit();
    redis = null;
    console.log('✅ Redis connection closed');
  }
}

// Cache utilities
export class RedisCache {
  private redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async flushall(): Promise<boolean> {
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Redis FLUSHALL error:', error);
      return false;
    }
  }
}

export const redisCache = new RedisCache();