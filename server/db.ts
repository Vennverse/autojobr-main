import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import ws from "ws";

const { Pool: PgPool } = pkg;
import * as schema from "@shared/schema";

// Configure database based on environment
const isProduction = process.env.NODE_ENV === 'production';
const hasReplitDb = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost');
const hasExternalDb = process.env.DATABASE_URL && 
  (process.env.DATABASE_URL.includes('neon') || 
   process.env.DATABASE_URL.includes('supabase') ||
   process.env.DATABASE_URL.includes('planetscale'));

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePg>;

// Use the database URL from environment variable
console.log('Using database from environment variable');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Determine if this is a Replit internal database or external
const isReplitInternal = DATABASE_URL.includes('localhost') || 
                        (process.env.PGHOST && !DATABASE_URL.includes('neon') && !DATABASE_URL.includes('supabase'));

// Configure pool based on database type
const poolConfig = isReplitInternal ? {
  connectionString: DATABASE_URL,
  ssl: false, // Replit's internal database doesn't need SSL
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
} : {
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // External databases need SSL
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

const pgPool = new PgPool(poolConfig);

// Test connection on startup
pgPool.on('connect', () => {
  console.log('✅ Connected to Replit PostgreSQL database');
});

pgPool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

db = drizzlePg(pgPool, { schema });
console.log(`Using PostgreSQL driver for ${isReplitInternal ? 'Replit internal' : 'external'} database`);

export { db };