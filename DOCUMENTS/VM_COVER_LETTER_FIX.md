# VM Cover Letter Generation Fix Guide

## Quick Fix Commands

Run these commands on your VM to fix the cover letter generation issue:

```bash
# 1. Navigate to your project directory
cd /home/ubuntu/autojobr-main

# 2. Download the fix script
wget https://raw.githubusercontent.com/Vennverse/autojobr-main/main/fix-vm-cover-letter.sh

# 3. Make it executable and run
chmod +x fix-vm-cover-letter.sh
./fix-vm-cover-letter.sh
```

## Manual Fix Steps (if script fails)

### 1. Update the Code
```bash
cd /home/ubuntu/autojobr-main
git pull origin main
npm install
```

### 2. Fix Database Schema
```bash
# Connect to PostgreSQL
sudo -u postgres psql -d autojobr

# Run these SQL commands:
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data TEXT;
ALTER TABLE resumes ALTER COLUMN file_path DROP NOT NULL;
\q
```

### 3. Update Environment Variables
Make sure your `.env` file has:
```bash
DATABASE_URL=postgresql://autojobr_user:autojobr123@localhost:5432/autojobr
GROQ_API_KEY=your_groq_key_here
RESEND_API_KEY=your_resend_key_here
```

### 4. Rebuild and Restart
```bash
npm run build
pm2 restart all
```

## Root Cause of the Issue

The error was caused by:

1. **Database Driver Mismatch**: VM was using Neon serverless driver for regular PostgreSQL
2. **Missing Schema Columns**: `file_data` column was missing from resumes table
3. **API Endpoint Inconsistencies**: Frontend and backend had mismatched endpoints
4. **Request Format Issues**: Fetch requests weren't properly formatted

## Verification Steps

After running the fixes:

1. **Check PM2 Status**:
   ```bash
   pm2 status
   pm2 logs autojobr
   ```

2. **Test Database Connection**:
   ```bash
   npm run db:push
   ```

3. **Test API Endpoints**:
   ```bash
   # Test cover letter endpoint (should return 401 without auth)
   curl -X POST http://localhost:5000/api/generate-cover-letter \
     -H "Content-Type: application/json" \
     -d '{"jobDescription":"test"}'
   ```

4. **Check Application in Browser**:
   - Go to your domain
   - Log in as a user
   - Try generating a cover letter
   - Upload a resume to test database fixes

## Troubleshooting

### If Cover Letter Generation Still Fails:

1. **Check Groq API Key**:
   ```bash
   echo $GROQ_API_KEY
   # Should show your API key
   ```

2. **Check Database Connection**:
   ```bash
   sudo -u postgres psql -d autojobr -c "\dt"
   # Should list all tables including resumes with file_data column
   ```

3. **Check Application Logs**:
   ```bash
   pm2 logs autojobr --lines 50
   ```

### If Resume Upload Still Fails:

1. **Verify Database Schema**:
   ```bash
   sudo -u postgres psql -d autojobr -c "\d resumes"
   # Should show file_data column as TEXT and file_path as nullable
   ```

2. **Check File Permissions**:
   ```bash
   ls -la /home/ubuntu/autojobr-main/uploads/
   # Should be writable by application user
   ```

## Success Indicators

You'll know the fix worked when:

- ✅ PM2 shows all processes running
- ✅ No database connection errors in logs
- ✅ Cover letter generation works in the app
- ✅ Resume uploads work without errors
- ✅ No "file_data" or "file_path" database errors

## Support

If you still have issues after trying these fixes:

1. Check the full error logs: `pm2 logs autojobr`
2. Verify your API keys are correct
3. Ensure PostgreSQL is running: `sudo systemctl status postgresql`
4. Check Nginx is properly configured: `sudo nginx -t`

The application should now work exactly like it does on Replit, with both resume uploads and cover letter generation fully functional.