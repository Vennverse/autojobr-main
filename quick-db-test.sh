#!/bin/bash

cd ~/autojobr-main

echo "Testing database connection with different passwords..."

# Test with common passwords that might have been set during deployment
passwords=("autojobr_secure_1753438835" "autojobr_2025_secure" "password" "autojobr" "")

for pwd in "${passwords[@]}"; do
    echo "Testing password: ${pwd:-'(empty)'}"
    PGPASSWORD="$pwd" psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ SUCCESS! Password is: $pwd"
        
        # Update .env with working password
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://autojobr_user:$pwd@localhost:5432/autojobr\"|" .env
        
        echo "Updated .env file with working password"
        
        # Test schema push
        source .env
        npm run db:push
        
        # Restart application
        export $(cat .env | grep -v '^#' | xargs)
        pm2 restart autojobr
        
        echo "Application restarted. Check logs:"
        sleep 2
        pm2 logs autojobr --lines 5
        
        exit 0
    fi
done

echo "❌ None of the common passwords worked"
echo "Let's check what the actual password should be from deployment logs..."

# Check the original deployment script for password
if [ -f vm-deploy.sh ]; then
    grep -n "PASSWORD\|password" vm-deploy.sh | head -5
fi