# Production 502 Fix for AutoJobr.com

## Issue
Production deployment at https://autojobr.com showing 502 Bad Gateway error due to missing dependencies and incorrect tsx path configuration.

## Root Cause
1. Missing `jsonwebtoken` dependency required by ssoService.ts
2. PM2 ecosystem.config.cjs pointing to non-existent tsx binary path
3. TypeScript compilation errors preventing server startup

## Solution Applied

### Files Modified
- `ecosystem.config.cjs` - Updated to use `npx tsx` instead of direct binary path
- `server/ssoService.ts` - Fixed TypeScript error handling for proper compilation
- Added missing dependencies: `jsonwebtoken`, `@types/jsonwebtoken`

### Production Fix Script
Run on your VM: `./vm-fix-502-production.sh`

### Manual Steps (if needed)
```bash
cd /home/ubuntu/autojobr-main
pm2 stop autojobr
pm2 delete autojobr
npm install jsonwebtoken @types/jsonwebtoken tsx
NODE_ENV=production pm2 start ecosystem.config.cjs
pm2 save
```

### Verification
1. Check PM2 status: `pm2 status` (should show "online")
2. Test local connectivity: `curl http://localhost:5000/api/user`
3. Test external site: `curl -I https://autojobr.com`
4. Monitor logs: `pm2 logs autojobr`

### Expected Results
- Application runs on port 5000
- Nginx successfully proxies to the application
- Google OAuth credentials properly loaded
- 502 Bad Gateway error resolved
- https://autojobr.com fully functional

## Configuration Changes Made

### ecosystem.config.cjs
```javascript
// Changed from:
script: './node_modules/.bin/tsx',

// To:
script: 'npx',
args: 'tsx server/index.ts',
```

This ensures tsx is found via npx regardless of the exact installation path.

### Dependencies Added
- `jsonwebtoken` - Required by SSO service
- `@types/jsonwebtoken` - TypeScript definitions
- `tsx` - Ensures TypeScript execution is available

## Production Environment
- Location: `/home/ubuntu/autojobr-main`
- User: `ubuntu`
- Process Manager: PM2
- Web Server: Nginx (proxy to port 5000)
- Domain: https://autojobr.com
- SSL: Handled by nginx/certbot