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

// Configure pool for Replit PostgreSQL
const poolConfig = {
  connectionString: DATABASE_URL,
  // Replit PostgreSQL doesn't need SSL
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
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