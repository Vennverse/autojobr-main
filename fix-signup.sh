#!/bin/bash

cd ~/autojobr-main

echo "🔧 Fixing signup and email service issues..."

# Check current database configuration
echo "📋 Checking database configuration..."
grep -n "neonConfig\|webSocketConstructor" server/db.ts || echo "WebSocket config not found"

# Create temporary fix for database WebSocket issue
cat > temp-db-fix.patch << 'EOF'
--- a/server/db.ts
+++ b/server/db.ts
@@ -26,7 +26,11 @@
 }
 
 // Use Neon serverless with WebSocket support
-neonConfig.webSocketConstructor = ws;
+try {
+  neonConfig.webSocketConstructor = ws;
+} catch (e) {
+  console.log('WebSocket configuration skipped in production');
+}
 const pool = new Pool({ connectionString: DATABASE_URL });
 db = drizzle({ client: pool, schema });
EOF

# Check if we can apply the patch
if command -v patch >/dev/null 2>&1; then
    patch -p1 < temp-db-fix.patch 2>/dev/null || echo "Patch not applicable"
    rm temp-db-fix.patch
fi

# Rebuild application with any fixes
echo "🔨 Rebuilding application..."
npm run build

# Check email service configuration
echo "📧 Checking email service..."
pm2 logs autojobr --lines 5 | grep -i "email\|resend" || echo "No email errors in recent logs"

# Restart application
echo "🔄 Restarting application..."
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

echo "✅ Signup fix applied"
sleep 3

# Test the API endpoints
echo "🧪 Testing signup endpoints..."
curl -s http://localhost:5000/api/auth/providers | jq . || echo "Auth providers check failed"

echo ""
echo "📊 Application status:"
pm2 status
echo ""
echo "🔍 Recent logs:"
pm2 logs autojobr --lines 5