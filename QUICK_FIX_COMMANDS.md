# Quick Fix Commands for AutoJobr Signup Issue

Run these commands on your VM in order:

## Option 1: Automated Fix
```bash
cd ~/autojobr-main
./simple-fix.sh
```

## Option 2: Manual Step-by-Step

### Step 1: Check Application Logs
```bash
pm2 logs autojobr --lines 15
```

### Step 2: Fix Database Password
```bash
cd ~/autojobr-main
source .env

# Test current connection
psql "$DATABASE_URL" -c "SELECT 1;"

# If it fails, try this password:
PGPASSWORD="autojobr_2025_secure" psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;"

# If that works, update .env:
sed -i 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://autojobr_user:autojobr_2025_secure@localhost:5432/autojobr"|' .env
```

### Step 3: Check Database Schema
```bash
source .env
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
```

### Step 4: If Database is Corrupted, Clean and Rebuild
```bash
psql "$DATABASE_URL" << 'EOF'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO autojobr_user;
\q
EOF

npm run db:push
```

### Step 5: Restart Application
```bash
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr
```

### Step 6: Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"newtest@example.com","password":"password123","user_type":"job_seeker","firstName":"Test","lastName":"User"}'
```

## Common Issues and Solutions

1. **Database Password Wrong**: Use `autojobr_2025_secure` or `autojobr_secure_2025`
2. **Database Corrupted**: Run the clean and rebuild commands above
3. **Application Not Starting**: Check `pm2 logs autojobr` for TypeScript errors
4. **Port Issues**: Make sure port 5000 is not blocked by firewall

## After Fix is Working
Test your application at: http://40.160.50.128