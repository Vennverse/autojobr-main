// Performance benchmarking and measurement service
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  operation: string;
  beforeOptimization: number;
  afterOptimization: number;
  improvement: number;
  improvementPercent: number;
  timestamp: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private baselineMetrics = new Map<string, number>();

  // Record baseline performance before optimization
  recordBaseline(operation: string, duration: number) {
    this.baselineMetrics.set(operation, duration);
    console.log(`📊 Baseline recorded for ${operation}: ${duration}ms`);
  }

  // Measure and compare performance after optimization
  measureOptimization(operation: string, optimizedDuration: number): BenchmarkResult {
    const baseline = this.baselineMetrics.get(operation);
    if (!baseline) {
      throw new Error(`No baseline found for operation: ${operation}`);
    }

    const improvement = baseline - optimizedDuration;
    const improvementPercent = ((improvement / baseline) * 100);

    const result: BenchmarkResult = {
      operation,
      beforeOptimization: baseline,
      afterOptimization: optimizedDuration,
      improvement,
      improvementPercent,
      timestamp: Date.now()
    };

    this.results.push(result);
    
    console.log(`🚀 OPTIMIZATION RESULT for ${operation}:`);
    console.log(`   Before: ${baseline}ms`);
    console.log(`   After: ${optimizedDuration}ms`);
    console.log(`   Improvement: ${improvement}ms (${improvementPercent.toFixed(1)}% faster)`);

    return result;
  }

  // Benchmark database queries
  async benchmarkDatabaseQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
    iterations: number = 10
  ): Promise<{ avgTime: number; results: T[] }> {
    const results: T[] = [];
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = await queryFn();
      const end = performance.now();
      
      results.push(result);
      times.push(end - start);
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / iterations;
    console.log(`🔍 Database benchmark for ${operation}: ${avgTime.toFixed(2)}ms avg (${iterations} iterations)`);
    
    return { avgTime, results };
  }

  // Benchmark cache performance
  benchmarkCache(operation: string, cacheFn: () => any, iterations: number = 1000) {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      cacheFn();
    }
    
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    
    console.log(`💾 Cache benchmark for ${operation}: ${avgTime.toFixed(4)}ms per operation`);
    return avgTime;
  }

  // Memory usage benchmark
  benchmarkMemory(operation: string, fn: () => void): { heapBefore: number; heapAfter: number; difference: number } {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const heapBefore = process.memoryUsage().heapUsed;
    fn();
    const heapAfter = process.memoryUsage().heapUsed;
    
    const difference = heapAfter - heapBefore;
    
    console.log(`🧠 Memory benchmark for ${operation}:`);
    console.log(`   Before: ${(heapBefore / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   After: ${(heapAfter / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Difference: ${(difference / 1024 / 1024).toFixed(2)}MB`);
    
    return { heapBefore, heapAfter, difference };
  }

  // Get comprehensive performance report
  getPerformanceReport() {
    const totalImprovements = this.results.reduce((sum, result) => sum + result.improvement, 0);
    const avgImprovement = this.results.length > 0 ? totalImprovements / this.results.length : 0;
    const avgImprovementPercent = this.results.reduce((sum, result) => sum + result.improvementPercent, 0) / this.results.length;

    const report = {
      summary: {
        totalOptimizations: this.results.length,
        totalTimeImprovement: totalImprovements,
        averageImprovement: avgImprovement,
        averageImprovementPercent: avgImprovementPercent
      },
      optimizations: this.results.map(result => ({
        operation: result.operation,
        improvement: `${result.improvement.toFixed(2)}ms (${result.improvementPercent.toFixed(1)}% faster)`,
        before: `${result.beforeOptimization}ms`,
        after: `${result.afterOptimization}ms`
      })),
      topImprovements: this.results
        .sort((a, b) => b.improvementPercent - a.improvementPercent)
        .slice(0, 5)
        .map(result => ({
          operation: result.operation,
          improvementPercent: result.improvementPercent.toFixed(1) + '%'
        }))
    };

    return report;
  }

  // Real-time performance monitoring
  startRealTimeMonitoring(intervalMs: number = 30000) {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      console.log(`📈 System Performance Check:`);
      console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   External: ${(memUsage.external / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   CPU User: ${cpuUsage.user}μs`);
      console.log(`   CPU System: ${cpuUsage.system}μs`);
    }, intervalMs);
  }

  // Simulate load testing
  async simulateLoad(
    operation: string,
    asyncFn: () => Promise<any>,
    concurrentRequests: number = 100,
    duration: number = 10000
  ) {
    console.log(`🔥 Load testing ${operation} with ${concurrentRequests} concurrent requests for ${duration}ms`);
    
    const results: Array<{ success: boolean; duration: number; error?: Error }> = [];
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
      const batch = Array(concurrentRequests).fill(null).map(async () => {
        const reqStart = performance.now();
        try {
          await asyncFn();
          const reqEnd = performance.now();
          return { success: true, duration: reqEnd - reqStart };
        } catch (error) {
          const reqEnd = performance.now();
          return { success: false, duration: reqEnd - reqStart, error: error as Error };
        }
      });
      
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));
    const minDuration = Math.min(...results.map(r => r.duration));
    
    const loadTestResult = {
      operation,
      totalRequests: results.length,
      successCount,
      failureCount,
      successRate: (successCount / results.length) * 100,
      avgResponseTime: avgDuration,
      maxResponseTime: maxDuration,
      minResponseTime: minDuration,
      requestsPerSecond: results.length / (duration / 1000)
    };
    
    console.log(`📊 Load Test Results for ${operation}:`);
    console.log(`   Total Requests: ${loadTestResult.totalRequests}`);
    console.log(`   Success Rate: ${loadTestResult.successRate.toFixed(2)}%`);
    console.log(`   Avg Response Time: ${loadTestResult.avgResponseTime.toFixed(2)}ms`);
    console.log(`   Max Response Time: ${loadTestResult.maxResponseTime.toFixed(2)}ms`);
    console.log(`   Min Response Time: ${loadTestResult.minResponseTime.toFixed(2)}ms`);
    console.log(`   Requests/Second: ${loadTestResult.requestsPerSecond.toFixed(2)}`);
    
    return loadTestResult;
  }
}

export const performanceBenchmark = new PerformanceBenchmark();