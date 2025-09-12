import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from "@shared/schema";

const { Pool } = pkg;

// Use Replit's PostgreSQL database
console.log('Using Replit PostgreSQL database');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Optimized pool configuration for production deployment
const poolConfig = {
  connectionString: DATABASE_URL,
  ssl: false, // Replit PostgreSQL doesn't need SSL
  // Right-sized pool for single instance (use pgBouncer for scaling)
  max: 20, // Reduced for better resource management per instance
  min: 5, // Keep minimum connections alive
  idleTimeoutMillis: 60000, // 1 minute - longer to reduce connection churn
  connectionTimeoutMillis: 5000, // Reduced for faster failover
  statement_timeout: 15000, // Reduced for better responsiveness
  query_timeout: 15000, // Faster query timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  // Performance optimizations
  allowExitOnIdle: false, // Keep pool alive
};

const pgPool = new Pool(poolConfig);

// Test connection on startup
pgPool.on('connect', () => {
  console.log('✅ Connected to Replit PostgreSQL database');
});

pgPool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

const db = drizzle(pgPool, { schema });
console.log('Using PostgreSQL driver for Replit database');

export { db };