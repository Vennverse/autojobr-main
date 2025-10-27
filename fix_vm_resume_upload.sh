#!/bin/bash

echo "=== AutoJobr Resume Upload Fix for VM ==="
echo "This script fixes the resume upload issue on VM deployment"
echo "Timestamp: $(date)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in AutoJobr root directory"
    echo "Please run this script from the AutoJobr project root"
    exit 1
fi

echo "✅ Found package.json - we're in the right directory"

# Check if database URL is available
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "Please ensure your environment variables are loaded"
    echo "Try: source .env (if using .env file)"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Run the database schema migration
echo ""
echo "=== Applying Database Schema Fix ==="
echo "Adding file_data column to resumes table..."

# Apply the SQL fix using psql
if command -v psql &> /dev/null; then
    echo "Using psql to apply schema changes..."
    psql "$DATABASE_URL" -f fix_resume_schema_vm.sql
    if [ $? -eq 0 ]; then
        echo "✅ Database schema updated successfully"
    else
        echo "❌ Database schema update failed"
        echo "Trying alternative method with npm run db:push..."
        npm run db:push
    fi
else
    echo "psql not found, using npm run db:push..."
    npm run db:push
    if [ $? -eq 0 ]; then
        echo "✅ Database schema updated successfully"
    else
        echo "❌ Database schema update failed"
        exit 1
    fi
fi

# Restart PM2 process
echo ""
echo "=== Restarting Application ==="
if command -v pm2 &> /dev/null; then
    echo "Restarting AutoJobr with PM2..."
    pm2 restart autojobr
    if [ $? -eq 0 ]; then
        echo "✅ Application restarted successfully"
    else
        echo "❌ Failed to restart application"
        echo "Try manually: pm2 restart autojobr"
    fi
else
    echo "PM2 not found - please manually restart your application"
fi

# Test the fix
echo ""
echo "=== Testing the Fix ==="
echo "Waiting 5 seconds for application to start..."
sleep 5

# Test if the API endpoint is responding
if curl -s -f "http://localhost:5000/api/user" > /dev/null; then
    echo "✅ Application is responding"
    echo ""
    echo "🎉 Resume upload fix completed!"
    echo ""
    echo "Next steps:"
    echo "1. Try uploading a resume through the web interface"
    echo "2. Check PM2 logs if issues persist: pm2 logs autojobr"
    echo "3. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
else
    echo "⚠️  Application may not be fully started yet"
    echo "Please check PM2 status: pm2 status"
    echo "And check logs: pm2 logs autojobr"
fi

echo ""
echo "=== Fix Complete ==="