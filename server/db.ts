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
  // Optimized pool settings for high performance
  max: 10, // Smaller pool with connection reuse
  min: 2, // Minimal idle connections
  idleTimeoutMillis: 30000, // 30 seconds - faster cleanup
  connectionTimeoutMillis: 3000, // Faster timeout
  statement_timeout: 10000, // 10 second query timeout
  query_timeout: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 3000,
  allowExitOnIdle: false,
  // Critical: Connection reuse settings
  application_name: 'autojobr_api',
  // Use prepared statements for common queries
  max_prepared_statements: 100,
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