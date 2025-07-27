# Chrome Extension Test Steps for VM Connection

## Prerequisites
- VM deployment completed using VM_FINAL_PACKAGE.sh
- Chrome extension installed and configured

## Step 1: Verify VM is Running
```bash
curl http://40.160.50.128:5000/api/health/simple
# Should return JSON health status, not HTML
```

## Step 2: Test Chrome Extension Connection

1. **Open Chrome Extension**
   - Click on AutoJobr extension icon
   - Should show "Connected" status instead of "Could not connect to page"

2. **Check Extension Popup**
   - Extension should load without errors
   - Should show your profile information
   - Connection status should be green/connected

## Step 3: Test Extension Features

1. **Go to a Job Site**
   - Visit LinkedIn, Indeed, or another supported job board
   - Navigate to a job posting

2. **Test Job Analysis**
   - Extension should automatically detect the job page
   - Should show job analysis overlay or popup

3. **Test Autofill**
   - Click "Autofill Application" button
   - Should populate form fields with your profile data

## Step 4: Troubleshooting

### If Extension Shows "Could not connect to page":

1. **Check VM Status**
   ```bash
   ssh username@40.160.50.128
   pm2 status
   pm2 logs autojobr
   ```

2. **Check Health Endpoints**
   ```bash
   curl http://40.160.50.128:5000/api/health/simple
   curl http://40.160.50.128:5000/api/user
   # First should return health JSON, second should return auth error JSON
   ```

3. **Check Extension Configuration**
   - Verify config.js has correct VM URL: `http://40.160.50.128:5000`
   - Check manifest.json permissions include VM domain

### If Autofill Not Working:

1. **Check Authentication**
   - Try logging into VM AutoJobr website first
   - Extension should authenticate with your session

2. **Check Console Logs**
   - Open browser developer tools
   - Check console for extension errors

## Expected Working State

✅ **Extension Popup**: Shows "Connected" with user profile
✅ **Job Detection**: Automatically detects job pages  
✅ **Form Autofill**: Fills application forms with profile data
✅ **API Communication**: All extension API calls working
✅ **Session Management**: Maintains login session across browser

## Success Criteria

- Extension connects to VM without errors
- Profile data loads correctly
- Autofill works on at least one major job board
- No console errors in browser developer tools
- Health endpoints return proper JSON responses