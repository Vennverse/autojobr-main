// Frontend performance optimization utilities
import { QueryClient } from '@tanstack/react-query';

class PerformanceOptimizer {
  private queryClient: QueryClient | null = null;
  private pendingInvalidations = new Set<string>();
  private batchTimeout: NodeJS.Timeout | null = null;

  setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  // Batched query invalidation to reduce compute load
  batchInvalidateQueries(queryKey: string) {
    this.pendingInvalidations.add(queryKey);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushInvalidations();
    }, 100); // Batch over 100ms
  }

  private flushInvalidations() {
    if (!this.queryClient) return;

    const keys = Array.from(this.pendingInvalidations);
    this.pendingInvalidations.clear();

    // Group similar query keys
    const groups = new Map<string, string[]>();
    keys.forEach(key => {
      const baseKey = key.split('/')[0];
      if (!groups.has(baseKey)) {
        groups.set(baseKey, []);
      }
      groups.get(baseKey)!.push(key);
    });

    // Invalidate by groups
    groups.forEach((keyGroup, baseKey) => {
      if (keyGroup.length === 1) {
        this.queryClient!.invalidateQueries({ queryKey: [keyGroup[0]] });
      } else {
        // Invalidate entire group if many similar keys
        this.queryClient!.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey.some(k => 
              typeof k === 'string' && k.startsWith(baseKey)
            )
        });
      }
    });
  }

  // Optimize component re-renders
  createStableCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: any[]
  ): T {
    const ref = { current: callback };
    ref.current = callback;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return ((...args: Parameters<T>) => ref.current(...args)) as T;
  }

  // Smart prefetching based on user behavior
  prefetchOnHover(queryKey: string[], queryFn: () => Promise<any>) {
    if (!this.queryClient) return;

    const prefetchTimeout = setTimeout(() => {
      this.queryClient!.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }, 300); // Delay to avoid unnecessary prefetches

    return () => clearTimeout(prefetchTimeout);
  }

  // Memory-conscious image loading
  optimizeImageLoading(src: string): string {
    // Add query parameters for optimized loading
    const url = new URL(src, window.location.origin);
    
    // Add WebP support detection
    if (this.supportsWebP()) {
      url.searchParams.set('format', 'webp');
    }
    
    // Add responsive sizing
    const screenWidth = window.innerWidth;
    if (screenWidth <= 768) {
      url.searchParams.set('w', '400');
    } else if (screenWidth <= 1200) {
      url.searchParams.set('w', '800');
    }
    
    return url.toString();
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Throttle expensive operations
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;

    return (...args: Parameters<T>) => {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  // Debounce user input
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Monitor and optimize WebSocket connections
  optimizeWebSocketUsage(ws: WebSocket) {
    let messageQueue: any[] = [];
    let flushTimeout: NodeJS.Timeout | null = null;

    const originalSend = ws.send.bind(ws);
    
    ws.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      // Batch non-critical messages
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (this.isCriticalMessage(message)) {
        originalSend(data);
      } else {
        messageQueue.push(data);
        
        if (flushTimeout) {
          clearTimeout(flushTimeout);
        }
        
        flushTimeout = setTimeout(() => {
          if (messageQueue.length > 0) {
            messageQueue.forEach(msg => originalSend(msg));
            messageQueue = [];
          }
        }, 50); // Batch over 50ms
      }
    };
  }

  private isCriticalMessage(message: any): boolean {
    // Define critical message types that shouldn't be batched
    return message.type === 'authenticate' || 
           message.type === 'urgent' || 
           message.priority === 'high';
  }

  // Optimize bundle size by lazy loading
  createLazyComponent<T>(importFn: () => Promise<{ default: T }>) {
    return importFn;
  }

  // Client-side caching for API responses
  createClientCache(maxSize: number = 100) {
    const cache = new Map();
    
    return {
      get: (key: string) => cache.get(key),
      set: (key: string, value: any) => {
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, {
          data: value,
          timestamp: Date.now()
        });
      },
      clear: () => cache.clear(),
      size: () => cache.size
    };
  }
}

export const performanceOptimizer = new PerformanceOptimizer();