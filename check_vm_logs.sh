#!/bin/bash

echo "=== AutoJobr VM Resume Upload Debug Script ==="
echo "Timestamp: $(date)"
echo "Server: $(hostname)"
echo "User: $(whoami)"
echo ""

# Check if AutoJobr is running
echo "=== Process Check ==="
if pgrep -f "autojobr" > /dev/null; then
    echo "✓ AutoJobr process is running"
    echo "Process details:"
    ps aux | grep -E "(autojobr|node.*server)" | grep -v grep
else
    echo "✗ AutoJobr process not found"
fi
echo ""

# Check PM2 status
echo "=== PM2 Status Check ==="
if command -v pm2 &> /dev/null; then
    echo "PM2 is installed"
    pm2 list
    echo ""
    echo "PM2 AutoJobr logs (last 50 lines):"
    pm2 logs autojobr --lines 50 --nostream
else
    echo "PM2 not found"
fi
echo ""

# Check ports
echo "=== Port Check ==="
echo "Checking port 5000 (AutoJobr default):"
if netstat -tln | grep -q ":5000 "; then
    echo "✓ Port 5000 is listening"
    netstat -tln | grep ":5000 "
else
    echo "✗ Port 5000 not listening"
fi

echo ""
echo "Checking port 80 (Nginx):"
if netstat -tln | grep -q ":80 "; then
    echo "✓ Port 80 is listening"
else
    echo "✗ Port 80 not listening"
fi

echo ""
echo "Checking port 443 (HTTPS):"
if netstat -tln | grep -q ":443 "; then
    echo "✓ Port 443 is listening"
else
    echo "✗ Port 443 not listening"
fi
echo ""

# Check Nginx status
echo "=== Nginx Status Check ==="
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
    echo "Nginx configuration test:"
    nginx -t
    echo ""
    echo "Nginx error log (last 20 lines):"
    tail -20 /var/log/nginx/error.log 2>/dev/null || echo "Cannot read Nginx error log"
    echo ""
    echo "Nginx access log (last 10 lines):"
    tail -10 /var/log/nginx/access.log 2>/dev/null || echo "Cannot read Nginx access log"
else
    echo "✗ Nginx is not running"
fi
echo ""

# Check disk space
echo "=== Disk Space Check ==="
df -h
echo ""

# Check memory usage
echo "=== Memory Usage Check ==="
free -h
echo ""

# Check environment variables (if running as same user)
echo "=== Environment Variables Check ==="
if [ -f ".env" ]; then
    echo "Found .env file"
    echo "Environment variables (sensitive values hidden):"
    grep -E "^[A-Z_]+" .env | sed 's/=.*/=***HIDDEN***/' || echo "Cannot read .env"
else
    echo "No .env file found in current directory"
fi
echo ""

# Check AutoJobr application files
echo "=== Application Files Check ==="
files_to_check=(
    "package.json"
    "server/index.ts"
    "server/routes.ts"
    "server/storage.ts"
    "shared/schema.ts"
    "node_modules"
)

for file in "${files_to_check[@]}"; do
    if [ -e "$file" ]; then
        if [ -d "$file" ]; then
            echo "✓ $file (directory exists)"
        else
            size=$(stat -c%s "$file" 2>/dev/null || echo "unknown")
            echo "✓ $file (file exists, size: $size bytes)"
        fi
    else
        echo "✗ $file (missing)"
    fi
done
echo ""

# Check recent application logs
echo "=== Recent Application Logs ==="
log_files=(
    "/var/log/autojobr.log"
    "./logs/app.log"
    "./autojobr.log"
    "./app.log"
)

found_logs=false
for log_file in "${log_files[@]}"; do
    if [ -f "$log_file" ]; then
        echo "Found log file: $log_file"
        echo "Last 20 lines:"
        tail -20 "$log_file"
        found_logs=true
        echo ""
        break
    fi
done

if [ "$found_logs" = false ]; then
    echo "No standard log files found"
    echo "Try checking PM2 logs with: pm2 logs autojobr"
fi
echo ""

# Check curl test to the application
echo "=== Local API Test ==="
echo "Testing local connection to AutoJobr..."

# Test port 5000 directly
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ --connect-timeout 5 --max-time 10; then
    status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/)
    echo "✓ Port 5000 responds with status: $status_code"
else
    echo "✗ Port 5000 not responding"
fi

# Test through Nginx (port 80)
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ --connect-timeout 5 --max-time 10; then
    status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
    echo "✓ Port 80 (Nginx) responds with status: $status_code"
else
    echo "✗ Port 80 (Nginx) not responding"
fi

# Test API endpoint
echo ""
echo "Testing API endpoint..."
api_response=$(curl -s http://localhost:5000/api/user --connect-timeout 5 --max-time 10 2>&1)
if [ $? -eq 0 ]; then
    echo "✓ API endpoint responded:"
    echo "$api_response"
else
    echo "✗ API endpoint failed:"
    echo "$api_response"
fi
echo ""

# Check systemd services
echo "=== Systemd Services Check ==="
services_to_check=("nginx" "postgresql" "redis")

for service in "${services_to_check[@]}"; do
    if systemctl list-unit-files | grep -q "^$service.service"; then
        status=$(systemctl is-active $service)
        echo "$service: $status"
    else
        echo "$service: not installed"
    fi
done
echo ""

# Final recommendations
echo "=== Debug Summary & Recommendations ==="
echo ""
echo "If resume upload is failing, check:"
echo "1. PM2 logs for JavaScript errors: pm2 logs autojobr --lines 100"
echo "2. Nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo "3. File upload size limits in Nginx config"
echo "4. Database connection issues"
echo "5. Environment variables are properly loaded"
echo ""
echo "To test resume upload manually:"
echo "1. Run: node debug_resume_upload.js"
echo "2. Run: node test_upload_api.js"
echo "3. Check browser developer tools for client-side errors"
echo ""
echo "=== End Debug Report ==="