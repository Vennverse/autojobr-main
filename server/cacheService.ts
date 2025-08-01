import crypto from 'crypto';

export interface CacheEntry {
  data: any;
  etag: string;
  lastModified: Date;
  dependsOn?: string[]; // What this cache depends on (user profiles, jobs, etc.)
  expiresAt: number;
}

export interface CacheConfig {
  ttl?: number;
  maxSize?: number;
  staleWhileRevalidate?: number;
}

// High-performance LRU cache implementation with better eviction strategy
class OptimizedLRUCache<K, V> {
  private cache = new Map<K, V>();
  private usage = new Map<K, { lastAccess: number; frequency: number }>();
  private maxSize: number;
  private hitCount = 0;
  private missCount = 0;
  
  constructor(maxSize: number = 2000) {
    this.maxSize = maxSize;
  }
  
  set(key: K, value: V): void {
    const now = Date.now();
    
    if (this.cache.has(key)) {
      // Update existing entry
      this.cache.set(key, value);
      this.updateUsage(key, now);
    } else {
      // Add new entry
      if (this.cache.size >= this.maxSize) {
        this.evictLeastUsed();
      }
      this.cache.set(key, value);
      this.usage.set(key, { lastAccess: now, frequency: 1 });
    }
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    const now = Date.now();
    
    if (value !== undefined) {
      this.hitCount++;
      this.updateUsage(key, now);
      return value;
    } else {
      this.missCount++;
      return undefined;
    }
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  delete(key: K): boolean {
    this.usage.delete(key);
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
    this.usage.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
  
  get size(): number {
    return this.cache.size;
  }
  
  get max(): number {
    return this.maxSize;
  }
  
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
  
  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }
  
  private updateUsage(key: K, now: number): void {
    const current = this.usage.get(key);
    if (current) {
      this.usage.set(key, {
        lastAccess: now,
        frequency: current.frequency + 1
      });
    }
  }
  
  private evictLeastUsed(): void {
    let leastUsedKey: K | undefined;
    let lowestScore = Infinity;
    const now = Date.now();
    
    // Use combined score: frequency and recency
    for (const [key, usage] of this.usage) {
      const ageWeight = Math.max(1, (now - usage.lastAccess) / 60000); // Age in minutes
      const score = usage.frequency / ageWeight;
      
      if (score < lowestScore) {
        lowestScore = score;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey !== undefined) {
      this.delete(leastUsedKey);
    }
  }
  
  // Memory cleanup for expired entries
  cleanup(): number {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;
    
    for (const [key, usage] of this.usage) {
      if (now - usage.lastAccess > maxAge) {
        this.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

class EnhancedCacheService {
  private cache: OptimizedLRUCache<string, CacheEntry>;
  private dependencyMap: Map<string, Set<string>> = new Map(); // dependency -> cache keys
  private lastUpdated: Map<string, Date> = new Map(); // resource -> last update time
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    this.cache = new OptimizedLRUCache<string, CacheEntry>(2000);
    
    // Auto-cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cache.cleanup();
      if (cleaned > 0) {
        console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
      }
    }, 10 * 60 * 1000);
  }

  // Smart caching with dependency tracking
  set(key: string, data: any, config: CacheConfig = {}, dependsOn: string[] = []): void {
    const etag = this.generateEtag(data);
    const ttl = config.ttl || 5 * 60 * 1000; // 5 minutes default
    const entry: CacheEntry = {
      data,
      etag,
      lastModified: new Date(),
      dependsOn,
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);

    // Track dependencies
    dependsOn.forEach(dep => {
      if (!this.dependencyMap.has(dep)) {
        this.dependencyMap.set(dep, new Set());
      }
      this.dependencyMap.get(dep)!.add(key);
    });
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Check if dependencies have been updated
    if (entry.dependsOn) {
      for (const dep of entry.dependsOn) {
        const lastUpdate = this.lastUpdated.get(dep);
        if (lastUpdate && lastUpdate > entry.lastModified) {
          // Dependency updated, cache is stale
          this.cache.delete(key);
          return null;
        }
      }
    }

    return entry;
  }

  // Check if data has changed using etag
  hasChanged(key: string, newData: any): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    
    const newEtag = this.generateEtag(newData);
    return entry.etag !== newEtag;
  }

  // Invalidate cache when a resource is updated
  invalidateByDependency(dependency: string): void {
    this.lastUpdated.set(dependency, new Date());
    
    const dependentKeys = this.dependencyMap.get(dependency);
    if (dependentKeys) {
      dependentKeys.forEach(key => {
        this.cache.delete(key);
      });
      this.dependencyMap.delete(dependency);
    }
  }

  // Invalidate user-specific cache
  invalidateUser(userId: string): void {
    this.invalidateByDependency(`user:${userId}`);
    this.invalidateByDependency(`profile:${userId}`);
    
    // Also clear any keys containing the user ID
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    });
  }

  // Get comprehensive cache statistics
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      hitRate: this.cache.getHitRate(),
      dependencyCount: this.dependencyMap.size,
      lastUpdatedCount: this.lastUpdated.size,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    };
  }
  
  // Destroy cache service and cleanup intervals
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }

  // Generate etag for data
  private generateEtag(data: any): string {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.dependencyMap.clear();
    this.lastUpdated.clear();
  }

  // Helper for conditional requests
  checkIfModified(key: string, clientEtag?: string, clientLastModified?: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    if (clientEtag && entry.etag === clientEtag) return false;
    if (clientLastModified) {
      const clientDate = new Date(clientLastModified);
      if (entry.lastModified <= clientDate) return false;
    }

    return true;
  }
}

export const cacheService = new EnhancedCacheService();

// Cache middleware for Express routes
export const cacheMiddleware = (ttl: number = 5 * 60 * 1000, dependsOn: string[] = []) => {
  return (req: any, res: any, next: any) => {
    const key = `${req.method}:${req.originalUrl}:${req.user?.id || 'anon'}`;
    
    // Check cache
    const cached = cacheService.get(key);
    if (cached && !cacheService.hasChanged(key, cached.data)) {
      // Set cache headers
      res.set('ETag', cached.etag);
      res.set('Last-Modified', cached.lastModified.toUTCString());
      res.set('Cache-Control', `max-age=${Math.floor(ttl / 1000)}, must-revalidate`);
      
      // Check client cache
      if (!cacheService.checkIfModified(key, req.get('If-None-Match'), req.get('If-Modified-Since'))) {
        return res.status(304).send();
      }
      
      return res.json(cached.data);
    }

    // Intercept response
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      // Cache the response
      cacheService.set(key, data, { ttl }, dependsOn);
      
      const entry = cacheService.get(key);
      if (entry) {
        res.set('ETag', entry.etag);
        res.set('Last-Modified', entry.lastModified.toUTCString());
        res.set('Cache-Control', `max-age=${Math.floor(ttl / 1000)}, must-revalidate`);
      }
      
      return originalJson(data);
    };

    next();
  };
};