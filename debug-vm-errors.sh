#!/bin/bash

echo "=== AutoJobr VM Error Debugging Script ==="
echo

echo "1. Checking PM2 Application Status"
pm2 status
echo

echo "2. Checking Application Logs (Last 20 lines)"
pm2 logs autojobr --lines 20
echo

echo "3. Checking if Node.js app is responding on port 5000"
curl -I http://localhost:5000
echo

echo "4. Testing database connection"
cd /home/ubuntu/autojobr-main
export $(cat .env | grep -v '^#' | xargs)
echo "DATABASE_URL is set: ${DATABASE_URL:0:30}..."
echo

echo "5. Testing signup endpoint directly"
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User","userType":"job_seeker"}' \
  -v
echo

echo "6. Testing signin endpoint directly"
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo.alexandra.chen@example.com","password":"demo123"}' \
  -v
echo

echo "7. Checking Nginx status and logs"
sudo systemctl status nginx --no-pager
echo

echo "8. Checking Nginx error logs (last 10 lines)"
sudo tail -10 /var/log/nginx/error.log
echo

echo "9. Testing if frontend is accessible"
curl -I http://localhost/auth
echo

echo "10. Environment variables check"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo

echo "=== Debug Complete ==="
echo "If you see errors above, they will help identify the issue."
echo "Common issues:"
echo "- Database connection failed"
echo "- Environment variables not loaded"
echo "- PM2 process crashed"
echo "- Nginx not proxying correctly"