// Performance monitoring and optimization service
import { RequestHandler } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  memoryUsage: number;
  timestamp: number;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000;
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second

  // Middleware to track request performance
  trackRequest(): RequestHandler {
    return (req, res, next) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      // Override res.end to capture completion
      const originalEnd = res.end;
      res.end = function(...args) {
        const duration = Date.now() - startTime;
        const memoryUsage = process.memoryUsage().heapUsed - startMemory;

        // Log slow requests
        if (duration > this.SLOW_REQUEST_THRESHOLD) {
          console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }

        // Store metrics
        this.addMetric({
          endpoint: req.path,
          method: req.method,
          duration,
          memoryUsage,
          timestamp: Date.now(),
          userId: req.user?.id
        });

        return originalEnd.apply(this, args);
      }.bind(this);

      next();
    };
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  // Get performance insights
  getInsights() {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 3600000); // Last hour

    const slowEndpoints = this.getSlowEndpoints(recentMetrics);
    const memoryHogs = this.getMemoryHogs(recentMetrics);
    const frequentEndpoints = this.getFrequentEndpoints(recentMetrics);

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: this.calculateAverage(recentMetrics.map(m => m.duration)),
      slowEndpoints,
      memoryHogs,
      frequentEndpoints,
      recommendations: this.generateRecommendations(recentMetrics)
    };
  }

  private getSlowEndpoints(metrics: PerformanceMetrics[]) {
    const endpointStats = new Map<string, { total: number; count: number; max: number }>();

    metrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      const stats = endpointStats.get(key) || { total: 0, count: 0, max: 0 };
      stats.total += m.duration;
      stats.count++;
      stats.max = Math.max(stats.max, m.duration);
      endpointStats.set(key, stats);
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.total / stats.count,
        maxTime: stats.max,
        requestCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);
  }

  private getMemoryHogs(metrics: PerformanceMetrics[]) {
    return metrics
      .filter(m => m.memoryUsage > 1024 * 1024) // > 1MB
      .sort((a, b) => b.memoryUsage - a.memoryUsage)
      .slice(0, 5)
      .map(m => ({
        endpoint: `${m.method} ${m.endpoint}`,
        memoryUsage: Math.round(m.memoryUsage / 1024 / 1024), // MB
        timestamp: new Date(m.timestamp).toISOString()
      }));
  }

  private getFrequentEndpoints(metrics: PerformanceMetrics[]) {
    const frequency = new Map<string, number>();
    
    metrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      frequency.set(key, (frequency.get(key) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    const slowEndpoints = this.getSlowEndpoints(metrics);
    const memoryHogs = this.getMemoryHogs(metrics);

    if (slowEndpoints.length > 0 && slowEndpoints[0].averageTime > 500) {
      recommendations.push(`Consider optimizing ${slowEndpoints[0].endpoint} - average response time: ${Math.round(slowEndpoints[0].averageTime)}ms`);
    }

    if (memoryHogs.length > 0) {
      recommendations.push(`High memory usage detected on ${memoryHogs[0].endpoint} - ${memoryHogs[0].memoryUsage}MB`);
    }

    const averageMemory = this.calculateAverage(metrics.map(m => m.memoryUsage));
    if (averageMemory > 10 * 1024 * 1024) { // 10MB
      recommendations.push('Consider implementing response streaming for large payloads');
    }

    return recommendations;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  // Get real-time system metrics
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Math.round(process.uptime()),
      activeRequests: this.metrics.filter(m => Date.now() - m.timestamp < 5000).length
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();