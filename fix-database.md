# Database Authentication Fix Guide

## Issue Identified
The signup failure is due to PostgreSQL authentication error: `password authentication failed for user "autojobr_user"`

## Root Cause
The database user password doesn't match what's configured in the .env file during deployment.

## Solution Steps

### 1. Run the Database Fix Script
```bash
cd ~/autojobr-main
./fix-database.sh
```

### 2. Manual Fix (if script fails)
```bash
# 1. Reset PostgreSQL user
sudo -u postgres psql
DROP USER IF EXISTS autojobr_user;
CREATE USER autojobr_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
\c autojobr
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
\q

# 2. Update .env file
nano .env
# Update: DATABASE_URL="postgresql://autojobr_user:your_secure_password_here@localhost:5432/autojobr"

# 3. Test connection
PGPASSWORD="your_secure_password_here" psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;"

# 4. Push schema and restart
npm run db:push
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr
```

### 3. Verify Fix
```bash
# Check application logs
pm2 logs autojobr --lines 10

# Test signup endpoint
curl -X POST http://localhost:5000/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","user_type":"job_seeker"}'
```

## Expected Results
- Database connection should work without authentication errors
- Signup should complete successfully
- User should receive email verification (or see simulation in logs)
- Application should be accessible at http://40.160.50.128

## Troubleshooting
If issues persist:
1. Check PostgreSQL service: `sudo systemctl status postgresql`
2. Check database exists: `sudo -u postgres psql -l | grep autojobr`
3. Check user permissions: `sudo -u postgres psql -c "\du"`
4. Review application logs: `pm2 logs autojobr --lines 20`