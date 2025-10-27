
#!/usr/bin/env node

// Migration script for ACE features
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false, // Replit PostgreSQL doesn't need SSL
});

const db = drizzle(pool);

async function runMigration() {
  try {
    console.log('🚀 Starting ACE features migration...');

    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync('migrations/0002_ace_features.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
        console.log('✅ Executed migration statement');
      }
    }

    console.log('🎉 ACE features migration completed successfully!');
    console.log('📊 Created tables:');
    console.log('   - job_intelligence (crowd-sourced job insights)');
    console.log('   - viral_referrals (referral tracking)');
    console.log('   - success_predictions (AI prediction tracking)');
    console.log('   - viral_user_stats (user viral activity)');
    console.log('   - extension_applications (extension usage tracking)');
    console.log('   - job_application_stats (aggregated job stats)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
