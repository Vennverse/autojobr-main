import { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// PgBouncer connection configuration
const createConnectionPool = (): Pool => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse the database URL to get connection details
  const url = new URL(databaseUrl);
  
  const poolConfig: PoolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1), // Remove leading slash
    user: url.username,
    password: url.password,
    
    // Connection pooling configuration for better performance
    max: 20, // Maximum number of connections in the pool
    min: 2,  // Minimum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Wait 10 seconds before timing out when connecting
    acquireTimeoutMillis: 30000, // Wait 30 seconds before timing out when acquiring a connection
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    
    // Statement timeout
    statement_timeout: 30000, // 30 seconds
    query_timeout: 30000, // 30 seconds
    
    // Connection lifecycle
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000, // 10 seconds
  };

  console.log('🔧 Creating PostgreSQL connection pool...');
  console.log(`📊 Pool config: max=${poolConfig.max}, min=${poolConfig.min}, host=${poolConfig.host}`);

  const pool = new Pool(poolConfig);

  // Pool event listeners for monitoring
  pool.on('connect', (client) => {
    console.log('✅ New client connected to PostgreSQL pool');
  });

  pool.on('acquire', (client) => {
    console.log('🔗 Client acquired from pool');
  });

  pool.on('remove', (client) => {
    console.log('🗑️ Client removed from pool');
  });

  pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle client:', err.message);
  });

  return pool;
};

// Create the connection pool
let pool: Pool | null = null;

export function getConnectionPool(): Pool {
  if (!pool) {
    pool = createConnectionPool();
  }
  return pool;
}

// Create Drizzle instance with connection pool
export function getDrizzleWithPool() {
  const connectionPool = getConnectionPool();
  return drizzle(connectionPool, { schema });
}

// Health check for database connection
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const pool = getConnectionPool();
    const client = await pool.connect();
    
    // Simple query to check connectivity
    const result = await client.query('SELECT 1 as health_check');
    client.release();
    
    console.log('✅ Database health check passed');
    return result.rows[0].health_check === 1;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Get pool statistics
export async function getPoolStats() {
  if (!pool) {
    return null;
  }

  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Graceful shutdown
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    console.log('🔄 Closing database connection pool...');
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

// Export for monitoring
export { pool };