# Complete VM Update Package for Redis/PgBouncer Integration

This package contains everything you need to update your VM deployment with the new Redis and PgBouncer enhancements.

## Step 1: Update Server Files on VM

Copy these files from your current Replit environment to your VM:

```bash
# Files to copy to your VM
scp server/redis.ts username@40.160.50.128:/home/username/autojobr-main/server/
scp server/sessionStore.ts username@40.160.50.128:/home/username/autojobr-main/server/
scp server/pgbouncer.ts username@40.160.50.128:/home/username/autojobr-main/server/
scp server/healthCheck.ts username@40.160.50.128:/home/username/autojobr-main/server/
scp server/routes.ts username@40.160.50.128:/home/username/autojobr-main/server/
scp server/auth.ts username@40.160.50.128:/home/username/autojobr-main/server/
scp vm-redis-pgbouncer-setup.sh username@40.160.50.128:/home/username/
scp VM_REDIS_PGBOUNCER_GUIDE.md username@40.160.50.128:/home/username/
```

## Step 2: Install and Configure Redis/PgBouncer

SSH into your VM and run the automated setup:

```bash
ssh username@40.160.50.128
chmod +x vm-redis-pgbouncer-setup.sh
./vm-redis-pgbouncer-setup.sh
```

## Step 3: Update Extension Files

The Chrome extension is already configured to use your VM URL (http://40.160.50.128:5000). 

Update these extension files if needed:
- extension/config.js ✅ (already updated)
- extension/popup.js ✅ (already updated) 
- extension/popup-old.js ✅ (already updated)
- extension/background.js ✅ (already updated)
- extension/manifest.json ✅ (already updated)

## Step 4: Test the Connection

After running the setup script:

1. **Test VM health endpoints:**
   ```bash
   curl http://40.160.50.128:5000/api/health
   curl http://40.160.50.128:5000/api/health/simple
   ```

2. **Test Redis connection:**
   ```bash
   redis-cli ping
   ```

3. **Test PgBouncer:**
   ```bash
   pg_isready -h 127.0.0.1 -p 6432
   ```

4. **Restart AutoJobr application:**
   ```bash
   cd /home/username/autojobr-main
   pm2 restart ecosystem.config.js
   pm2 logs autojobr
   ```

## Expected Environment Variables

After the setup script runs, your `.env` file should include:

```env
# Existing variables
DATABASE_URL=postgresql://username:password@localhost:6432/autojobr
GROQ_API_KEY=your_groq_key
RESEND_API_KEY=your_resend_key

# New Redis configuration
REDIS_URL=redis://:your_redis_password@127.0.0.1:6379/0
```

## Verification Steps

1. **Check services are running:**
   ```bash
   sudo systemctl status redis-server
   sudo systemctl status pgbouncer
   pm2 status
   ```

2. **Test extension connection:**
   - Open Chrome extension
   - Should show "Connected" status instead of "Could not connect to page"
   - Try using autofill features on a job site

3. **Test health endpoints:**
   ```bash
   curl http://40.160.50.128:5000/api/health
   # Should return detailed status including Redis and PgBouncer
   
   curl http://40.160.50.128:5000/api/health/simple
   # Should return simple OK status
   ```

## Performance Benefits You'll Get

After the update:
- ✅ **Session Storage**: Fast Redis-based sessions with memory fallback
- ✅ **Connection Pooling**: Efficient database connections via PgBouncer
- ✅ **Health Monitoring**: Real-time status monitoring at `/api/health`
- ✅ **Production Scale**: Enhanced performance for high-traffic usage
- ✅ **Extension Compatibility**: Chrome extension working with VM backend

## Troubleshooting

If the extension still shows connection errors:

1. **Check firewall:**
   ```bash
   sudo ufw allow 5000
   sudo ufw status
   ```

2. **Check application logs:**
   ```bash
   pm2 logs autojobr
   ```

3. **Test direct API call:**
   ```bash
   curl -X GET http://40.160.50.128:5000/api/user
   # Should return authentication error, not connection error
   ```

4. **Check Redis/PgBouncer logs:**
   ```bash
   sudo journalctl -u redis-server -f
   sudo journalctl -u pgbouncer -f
   ```

The setup script handles all the configuration automatically, so after running it and restarting your application, everything should work seamlessly with the enhanced infrastructure.