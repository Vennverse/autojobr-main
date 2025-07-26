#!/bin/bash

# AutoJobr VM Cover Letter Fix Script
# This script fixes the cover letter generation issue on VM deployment

set -e

echo "🔧 Starting AutoJobr VM Cover Letter Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the AutoJobr project root directory"
    exit 1
fi

print_status "Stopping PM2 processes..."
pm2 stop all || true

print_status "Pulling latest changes from GitHub..."
git pull origin main || print_warning "Git pull failed, continuing with existing code"

print_status "Installing/updating dependencies..."
npm install

print_status "Fixing database schema for resume uploads..."
node -e "
const { Client } = require('pg');

async function fixDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Add file_data column if it doesn't exist
    try {
      await client.query(\`
        ALTER TABLE resumes 
        ADD COLUMN IF NOT EXISTS file_data TEXT;
      \`);
      console.log('✅ Added file_data column to resumes table');
    } catch (err) {
      console.log('file_data column may already exist:', err.message);
    }
    
    // Make file_path optional
    try {
      await client.query(\`
        ALTER TABLE resumes 
        ALTER COLUMN file_path DROP NOT NULL;
      \`);
      console.log('✅ Made file_path column optional');
    } catch (err) {
      console.log('file_path constraint may already be modified:', err.message);
    }
    
    console.log('✅ Database schema fixes completed');
    
  } catch (error) {
    console.error('Database fix error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDatabase();
"

print_status "Building the application with optimizations..."
# Set environment variable to suppress chunk size warnings
export VITE_CHUNK_SIZE_WARNING_LIMIT=600
npm run build

print_status "Restarting PM2 processes..."
pm2 restart all || pm2 start ecosystem.config.cjs

print_status "Checking application status..."
sleep 5
pm2 status

print_status "Testing cover letter generation endpoint..."
curl -X POST http://localhost:5000/api/generate-cover-letter \
  -H "Content-Type: application/json" \
  -d '{"jobDescription":"Test job", "companyName":"Test Company", "jobTitle":"Test Position"}' \
  -w "\nHTTP Status: %{http_code}\n" || print_warning "Endpoint test failed - may need authentication"

print_status "Checking Nginx configuration..."
sudo nginx -t && sudo systemctl reload nginx || print_warning "Nginx reload failed"

echo ""
print_status "✅ VM Cover Letter Fix completed!"
echo ""
echo "Next steps:"
echo "1. Check PM2 logs: pm2 logs"
echo "2. Test the application in browser"
echo "3. Try cover letter generation after logging in"
echo ""
echo "If issues persist:"
echo "1. Check application logs: pm2 logs autojobr"
echo "2. Check database connection: npm run db:push"
echo "3. Verify environment variables are set correctly"