# Simple VM Deployment (No Redis/PgBouncer)

This is a clean deployment package for your VM without Redis dependencies, ensuring the basic functionality works first.

## Files to Copy to VM

Copy these simplified files to your VM:

```bash
# Core files
scp server/sessionStore-simple.ts username@40.160.50.128:/home/username/autojobr-main/server/sessionStore.ts
scp server/healthCheck-simple.ts username@40.160.50.128:/home/username/autojobr-main/server/healthCheck.ts

# Extension files (already configured for VM)
# No changes needed - extension is pointing to http://40.160.50.128:5000
```

## Steps to Deploy

1. **SSH into your VM:**
   ```bash
   ssh username@40.160.50.128
   ```

2. **Update the session store file:**
   ```bash
   cd /home/username/autojobr-main
   # Replace the complex sessionStore.ts with the simple version
   cp server/sessionStore.ts server/sessionStore-backup.ts
   # Copy the simple version you uploaded
   ```

3. **Update routes to use simple health check:**
   ```bash
   # Edit server/routes.ts to import from healthCheck-simple
   nano server/routes.ts
   # Change: import { healthCheck, simpleHealthCheck } from "./healthCheck-simple";
   ```

4. **Restart the application:**
   ```bash
   pm2 restart ecosystem.config.js
   pm2 logs autojobr
   ```

## Test the Connection

1. **Test health endpoints:**
   ```bash
   curl http://40.160.50.128:5000/api/health/simple
   curl http://40.160.50.128:5000/api/health
   ```

2. **Test Chrome extension:**
   - Open the extension popup
   - Should show "Connected" instead of "Could not connect to page"
   - Try the autofill features on a job site

## Expected Result

- ✅ No Redis connection errors in logs
- ✅ Clean startup with memory-only session storage
- ✅ Health endpoints responding properly
- ✅ Chrome extension connecting successfully
- ✅ All core features working without Redis dependencies

## Simplified Architecture

```
Chrome Extension -----> VM Server (40.160.50.128:5000)
                           |
                           ├── Memory Session Storage
                           ├── PostgreSQL Database
                           ├── Health Check Endpoints
                           └── All API Routes
```

This removes the Redis complexity and gets you a working baseline. Once this is stable, we can add Redis back as an enhancement.