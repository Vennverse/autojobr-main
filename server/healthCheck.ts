import { Request, Response } from 'express';
import { checkDatabaseHealth, getPoolStats } from './pgbouncer';
import { checkRedisHealth } from './redis';

// Health check endpoint
export async function healthCheck(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Run health checks in parallel
    const [dbHealthy, redisHealthy, poolStats] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      getPoolStats()
    ]);
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected'
      },
      connectionPool: poolStats ? {
        totalConnections: poolStats.totalConnections,
        idleConnections: poolStats.idleConnections,
        waitingCount: poolStats.waitingCount
      } : null,
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown'
    };
    
    // Return 503 if any critical service is down
    const statusCode = dbHealthy ? 200 : 503;
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    });
  }
}

// Simplified health check for load balancers
export async function simpleHealthCheck(req: Request, res: Response) {
  try {
    const dbHealthy = await checkDatabaseHealth();
    
    if (dbHealthy) {
      res.status(200).send('OK');
    } else {
      res.status(503).send('Service Unavailable');
    }
  } catch (error) {
    res.status(503).send('Service Unavailable');
  }
}