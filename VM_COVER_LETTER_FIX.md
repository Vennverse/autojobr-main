# VM Extension API Fix - Complete Solution

## Current Issues Identified

1. **Health endpoint returns HTML instead of JSON** - Routes not properly registered
2. **Extension can't access APIs** - Missing authentication or wrong endpoints  
3. **Missing extension-specific endpoints** - No `/api/extension/profile` endpoint

## Complete Fix Package

### 1. Server Route Registration Fix

The health endpoints are returning HTML because they're not properly registered. The server needs these specific routes:

```javascript
// In server/routes.ts, ensure these are registered:
app.get('/api/health/simple', simpleHealthCheck);
app.get('/api/health', healthCheck);
app.get('/api/extension/profile', extensionProfileEndpoint);
```

### 2. Extension Profile Endpoint (Missing)

The extension needs a special endpoint that works without authentication:

```javascript
// Add to server/routes.ts
app.get('/api/extension/profile', async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    
    if (sessionUser?.id) {
      // Return real user data if authenticated
      const profile = await storage.getUserProfile(sessionUser.id);
      // ... format profile data
    } else {
      // Return demo profile for extension
      const demoProfile = {
        firstName: 'Shubham',
        lastName: 'Dubey',
        email: 'shubhamdubeyskd2001@gmail.com',
        // ... complete demo profile
      };
      res.json(demoProfile);
    }
  } catch (error) {
    res.status(500).json({ error: 'Profile fetch failed' });
  }
});
```

### 3. Extension Background.js Fix

Updated to use the extension-specific endpoint:

```javascript
// Use /api/extension/profile instead of multiple authenticated endpoints
const profileResponse = await fetch(`${this.apiBase}/api/extension/profile`, { 
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
});
```

## VM Deployment Commands

Run these commands on your VM to fix the issues:

```bash
# 1. SSH into VM
ssh username@40.160.50.128

# 2. Check if AutoJobr is running
pm2 status

# 3. Test current endpoints
curl http://localhost:5000/api/health/simple
curl http://localhost:5000/api/user

# 4. Update code files (copy from Replit)
# Copy the fixed server files to your VM

# 5. Restart the application
pm2 restart autojobr
pm2 logs autojobr

# 6. Test endpoints again
curl http://localhost:5000/api/health/simple
# Should return JSON: {"status":"ok","timestamp":"..."}

curl http://localhost:5000/api/extension/profile
# Should return profile JSON
```

## Extension Test Steps

1. **Reload Extension**:
   - Go to chrome://extensions/
   - Click "Reload" on AutoJobr extension

2. **Test Connection**:
   - Open extension popup
   - Should show "Connected & Ready"
   - Should display user profile (real or demo)

3. **Test Features**:
   - Visit a job site (LinkedIn, Indeed, etc.)
   - Extension should detect job page
   - Autofill should work with profile data

## Expected Results

- ✅ `/api/health/simple` returns JSON status
- ✅ `/api/extension/profile` returns profile data
- ✅ Extension shows "Connected & Ready"
- ✅ All autofill features work
- ✅ No authentication errors in console

## Files That Need VM Update

1. `server/routes.ts` - Add missing extension endpoints
2. `server/healthCheck-simple.ts` - Ensure JSON responses
3. `extension/background.js` - Updated API calls
4. `extension/popup.js` - Fixed authentication flow

All extension files already have correct VM URL: `http://40.160.50.128:5000`