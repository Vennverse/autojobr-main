#!/bin/bash

cd ~/autojobr-main

echo "🔧 Comprehensive signup fix..."

# 1. Fix database WebSocket connection issue
echo "📋 Fixing database WebSocket configuration..."
cp server/db.ts server/db.ts.backup

cat > server/db.ts << 'EOF'
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

// Fix WebSocket configuration for production
if (DATABASE_URL.includes('localhost') || isProduction) {
  // Use standard PostgreSQL for localhost or production
  const pool = new PgPool({ connectionString: DATABASE_URL });
  db = drizzlePg(pool, { schema });
  console.log('Using standard PostgreSQL connection');
} else {
  // Use Neon serverless with WebSocket support for development
  try {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('Using Neon serverless connection');
  } catch (error) {
    console.log('Falling back to standard PostgreSQL connection');
    const pool = new PgPool({ connectionString: DATABASE_URL });
    db = drizzlePg(pool, { schema });
  }
}

export { db };
EOF

# 2. Update email service to handle VM environment
echo "📧 Updating email service configuration..."
cp server/emailService.ts server/emailService.ts.backup

# Update the email service to use correct domain
sed -i 's/localhost:5000/40.160.50.128/g' server/emailService.ts

# 3. Rebuild the application
echo "🔨 Rebuilding application..."
npm run build

# 4. Restart with proper environment
echo "🔄 Restarting application..."
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

echo "✅ Comprehensive signup fix applied"
sleep 5

# 5. Test the signup functionality
echo "🧪 Testing signup endpoints..."
curl -s -X GET http://localhost:5000/api/auth/providers
echo ""

echo "📊 Application status:"
pm2 status

echo ""
echo "🔍 Recent logs:"
pm2 logs autojobr --lines 10

echo ""
echo "✅ Signup should now work properly at http://40.160.50.128"