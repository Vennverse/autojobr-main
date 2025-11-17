# 🔧 How to Fix the Extension Tracking Issue

## Problem
You're seeing the error: `ConfigSyncService is not defined`

This happens because your browser is using an **older cached version** of the extension.

## Solution: Reload the Extension

### **Option 1: Quick Reload (Recommended)**
1. Go to `chrome://extensions/` in your browser
2. Find "AutoJobr Autopilot" extension
3. Click the **refresh/reload icon** (↻) for the extension
4. **Refresh all job application pages** you have open
5. Try applying to a job again

### **Option 2: Full Reinstall**
1. Go to `chrome://extensions/`
2. Find "AutoJobr Autopilot"
3. Click **Remove**
4. Click **Load unpacked** button
5. Select the `/workspace/extension` folder
6. Refresh all job application pages

### **Option 3: Hard Refresh**
1. On any job application page, press:
   - **Windows/Linux**: `Ctrl + Shift + R`
   - **Mac**: `Cmd + Shift + R`
2. This clears the cached scripts

---

## How to Verify It's Working

### 1. Check Console for Tracking Logs
When you click "Submit Application" on LinkedIn/Workday/Indeed, you should see:
```
[TRACK] Starting application tracking...
[TRACK] Extracted job data: {title: "...", company: "..."}
[TRACK] Sending to background script
[TRACK] Background response: {success: true}
[TRACK] ✅ Application saved to database
```

### 2. Check Background Script Logs
1. Go to `chrome://extensions/`
2. Find "AutoJobr Autopilot"
3. Click **"service worker"** link
4. Check the console for:
```
[TRACK APP] Starting application tracking
[TRACK APP] ✅ Application saved successfully
```

### 3. Verify in AutoJobr Dashboard
1. Go to https://autojobr.com/applications
2. Your submitted application should appear in the list
3. It will show "Source: Extension"

---

## Testing the Extension

### Test on LinkedIn
1. Find any job on LinkedIn
2. Click "Easy Apply"
3. Fill out the form
4. Click "Submit Application"
5. Watch the console - you should see tracking logs
6. Check AutoJobr dashboard to confirm

### Test on Workday
1. Find a job on any Workday-powered site (e.g., myworkdayjobs.com)
2. Start the application
3. Complete all steps
4. Click final "Submit" button
5. Check console and dashboard

---

## Still Having Issues?

### Check Authentication
The extension needs you to be **logged into AutoJobr**:
1. Go to https://autojobr.com
2. Sign in if you're not already
3. Keep the AutoJobr tab open
4. Now try applying to jobs

### Enable Debug Mode
Add this to your console on any job page:
```javascript
localStorage.setItem('autojobr_debug', 'true');
```

Then refresh and apply to a job. You'll see detailed logs.

---

## Current Tracking Flow

Here's how the extension tracks applications:

```
📝 You Click "Submit" on Job Site
    ↓
🔍 Extension detects form submission
    ↓
📊 Extracts job details (title, company, location, URL)
    ↓
📨 Sends to background script
    ↓
🌐 Background calls API: POST /api/track-application
    ↓
💾 Saves to database (job_applications table)
    ↓
✅ Shows confirmation notification
    ↓
📱 Updates AutoJobr dashboard
```

---

## Supported Job Sites

The extension automatically tracks applications on:
- ✅ LinkedIn (Easy Apply & Full Apply)
- ✅ Workday (all sites using myworkdayjobs.com)
- ✅ Indeed
- ✅ Glassdoor
- ✅ Greenhouse
- ✅ Lever
- ✅ ZipRecruiter
- ✅ Monster
- ✅ Dice
- ✅ AshbyHQ
- And many more!

---

## Need More Help?

If you're still having issues after reloading:
1. Check that you're logged into AutoJobr
2. Make sure the extension has permissions for the job site
3. Try disabling other extensions temporarily
4. Check your browser console for errors
