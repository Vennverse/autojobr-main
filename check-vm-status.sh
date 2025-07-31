#!/bin/bash

echo "=== AutoJobr VM Status Check ==="
echo ""

# Check PM2 status
echo "PM2 Status:"
pm2 status

echo ""
echo "PM2 Logs (last 20 lines):"
pm2 logs autojobr --lines 20

echo ""
echo "Application Health Check:"
curl -s http://localhost:5000/api/health || echo "Health check failed"

echo ""
echo "Port 5000 Status:"
netstat -tulpn | grep :5000 || echo "Nothing listening on port 5000"

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "Environment Variables Check:"
if [ -f ".env" ]; then
    echo "DATABASE_URL exists: $(grep -q DATABASE_URL .env && echo "Yes" || echo "No")"
    echo "GROQ_API_KEY exists: $(grep -q GROQ_API_KEY .env && echo "Yes" || echo "No")"
    echo "RESEND_API_KEY exists: $(grep -q RESEND_API_KEY .env && echo "Yes" || echo "No")"
else
    echo ".env file not found"
fi

echo ""
echo "Database Connection Test:"
if [ -f ".env" ]; then
    source .env
    psql "$DATABASE_URL" -c "SELECT 1;" 2>/dev/null && echo "Database connection: OK" || echo "Database connection: FAILED"
else
    echo "Cannot test - .env file missing"
fi