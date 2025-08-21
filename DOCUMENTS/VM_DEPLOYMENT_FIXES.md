# AutoJobr VM Deployment - Complete Fix Guide

This document contains all the critical fixes and solutions for common AutoJobr VM deployment issues.

## Critical Issues Solved

### 1. Database Permission Issues
**Problem**: PostgreSQL permission errors preventing application from accessing database

**Solution**: Grant superuser privileges to application user
```bash
sudo -u postgres psql -d autojobr << EOF
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;
ALTER USER autojobr_user WITH SUPERUSER;
\q
EOF
```

### 2. Environment Variable Loading Issues
**Problem**: PM2 not properly loading environment variables from .env file

**Solution**: Enhanced environment loading
```bash
# Proper .env loading
set -a
source .env
set +a
export $(cat .env | grep -v '^#' | grep -v '^$' | cut -d= -f1)

# PM2 ecosystem configuration with env_file
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    env_file: './.env'  // CRITICAL: This loads .env file
  }]
}
EOF
```

### 3. Nginx Reverse Proxy Configuration
**Problem**: Nginx not properly forwarding requests to application

**Solution**: Correct Nginx configuration
```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 4. Virtual Interview System Issues
**Problem**: Virtual interviews not showing input fields for last question and missing feedback

**Solution**: Fixed in code
- Input field now appears for all questions including the last one
- Proper feedback generation for both completed and incomplete interviews
- Enhanced database schema with proper column references

### 5. Resume Upload Issues
**Problem**: Resume uploads failing due to missing database columns

**Solution**: Database schema update
```sql
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data TEXT;
ALTER TABLE resumes ALTER COLUMN file_path DROP NOT NULL;
```

## Quick Fix Script

Use the automated fix script:
```bash
chmod +x fix-vm-deployment.sh
./fix-vm-deployment.sh
```

## One-Command Deployment

For fresh deployments, use the updated vm-deploy.sh:
```bash
chmod +x vm-deploy.sh
./vm-deploy.sh
```

## Troubleshooting Commands

### Check Application Status
```bash
pm2 status
pm2 logs autojobr
```

### Check Database Connection
```bash
PGPASSWORD=your_password psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;"
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Restart All Services
```bash
pm2 restart autojobr
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

## Environment Variables Template

Minimum required .env file:
```bash
# Database Configuration
DATABASE_URL="postgresql://autojobr_user:your_password@localhost:5432/autojobr"

# Server Configuration
NODE_ENV="production"
PORT="5000"
SESSION_SECRET="your_session_secret_here"

# Optional API Keys
GROQ_API_KEY=""
RESEND_API_KEY=""
```

## Deployment Verification

After deployment, verify:

1. **Application Health**: Visit `http://your-server-ip` 
2. **Database**: Can create accounts and login
3. **Virtual Interviews**: Can start and complete interviews
4. **Resume Upload**: Can upload and view resumes
5. **Job Applications**: Can apply to jobs

## Common Error Solutions

### "Permission denied for schema public"
Run database permission fix script

### "Failed to fetch" on virtual interviews
Check PM2 logs and restart application

### "502 Bad Gateway" 
Check if application is running: `pm2 status`

### "Cannot connect to database"
Verify DATABASE_URL in .env file and PostgreSQL service status

## Files Updated

- `vm-deploy.sh` - Main deployment script with all fixes
- `fix-vm-deployment.sh` - Troubleshooting and fix script  
- `ecosystem.config.cjs` - PM2 configuration with proper env loading
- Virtual interview routes and service files
- Database schema with proper permissions

## Success Indicators

✅ PM2 shows "autojobr" running
✅ Nginx responds on port 80
✅ PostgreSQL accepts connections
✅ Application responds to HTTP requests
✅ Virtual interviews work end-to-end
✅ Resume uploads function properly
✅ Database operations complete successfully

All deployment issues have been systematically identified and resolved in these scripts and configurations.