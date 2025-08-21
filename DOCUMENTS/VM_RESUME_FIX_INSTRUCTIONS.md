# Resume Upload Fix for VM Deployment

## Problem
Resume upload is failing on VM because the database schema expects a `file_path` column but the application code is trying to store `fileData` (base64). This causes a database constraint error.

## Solution
Run these commands on your VM to fix the issue:

### Step 1: Download the fix files
```bash
# If you're using the GitHub repository, pull the latest changes
cd /path/to/your/autojobr-main
git pull origin main

# Or manually create the SQL fix file
cat > fix_resume_schema_vm.sql << 'EOF'
-- SQL script to fix resume upload schema issue on VM
-- Add the file_data column to store base64 encoded files
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data TEXT;

-- Make file_path optional (in case it was required before)
ALTER TABLE resumes ALTER COLUMN file_path DROP NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resumes' 
AND column_name IN ('file_path', 'file_data')
ORDER BY column_name;
EOF
```

### Step 2: Apply the database schema fix
```bash
# Make sure your DATABASE_URL is set (should be in your .env file)
source .env

# Apply the SQL fix directly to your database
psql "$DATABASE_URL" -f fix_resume_schema_vm.sql
```

### Step 3: Restart the application
```bash
# Restart with PM2
pm2 restart autojobr

# Or if using a different process manager
sudo systemctl restart autojobr
```

### Step 4: Test the fix
```bash
# Check if the application is running
pm2 status

# Check the logs
pm2 logs autojobr --lines 20

# Test the API endpoint
curl http://localhost:5000/api/user
```

## Alternative Method (if psql is not available)

If you don't have `psql` installed on your VM, you can run the SQL commands through your database management interface or use this Node.js script:

```bash
# Create a quick fix script
cat > fix_db_schema.js << 'EOF'
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixSchema() {
  try {
    console.log('Adding file_data column...');
    await pool.query('ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data TEXT');
    
    console.log('Making file_path optional...');
    await pool.query('ALTER TABLE resumes ALTER COLUMN file_path DROP NOT NULL');
    
    console.log('Verifying changes...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'resumes' 
      AND column_name IN ('file_path', 'file_data')
      ORDER BY column_name
    `);
    
    console.log('Schema updated successfully:', result.rows);
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

fixSchema();
EOF

# Run the fix
source .env
node fix_db_schema.js
```

## Verification

After applying the fix, try uploading a resume again. The error should be resolved and you should see successful upload logs like:

```
[DEBUG] Storing resume for user: xxx, file: filename.pdf
POST /api/resumes/upload 200 in XXXms
```

## Troubleshooting

If the issue persists:

1. **Check PM2 logs**: `pm2 logs autojobr --lines 50`
2. **Check Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
3. **Verify database schema**: 
   ```sql
   \d resumes  -- in psql to see table structure
   ```
4. **Check if the column was added**:
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'resumes';
   ```

## What This Fix Does

1. **Adds `file_data` column**: Allows storing base64 encoded resume files directly in the database
2. **Makes `file_path` optional**: Removes the NOT NULL constraint so the app can work with either file storage or database storage
3. **Maintains backward compatibility**: Existing resumes with file paths continue to work

The application will now be able to store resumes in the database using base64 encoding, which is more reliable for VM deployments where file system permissions might be an issue.