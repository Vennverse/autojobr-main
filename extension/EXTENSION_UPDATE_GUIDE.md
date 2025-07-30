# AutoJobr Extension URL Update Guide

## Quick Update Instructions

To update the backend URL for the Chrome extension, you only need to change **ONE FILE**:

### 📁 `extension/config.js`

```javascript
const AUTOJOBR_CONFIG = {
  // UPDATE THIS URL WHEN REPLIT ENVIRONMENT CHANGES
  API_URL: 'https://e3d8b3db-2c8e-4107-8058-625851bb3dc7-00-1r96d8sk4fqju.kirk.replit.dev',
  
  // ... rest of config
};
```

## What This Updates Automatically

✅ **background.js** - Service worker API calls
✅ **popup.js** - Popup interface API requests  
✅ **content-script.js** - Form filling and job analysis
✅ **popup.html** - Loads config for popup interface

## Files That Use Centralized Config

1. **config.js** - Main configuration file (EDIT THIS ONLY)
2. **background.js** - Imports config via `importScripts('config.js')`
3. **popup.html** - Loads config via `<script src="config.js"></script>`
4. **popup.js** - Uses `AUTOJOBR_CONFIG.API_URL`
5. **content-script.js** - Uses hardcoded config constant

## Current URL
```
https://e3d8b3db-2c8e-4107-8058-625851bb3dc7-00-1r96d8sk4fqju.kirk.replit.dev
```

## Previous URLs (for reference)
- Old: `https://ccc06d53-240e-4267-9893-b843005070da-00-2ahfje86xai73.spock.replit.dev`
- VM: `http://40.160.50.128:5000`

## Testing the Update

After updating the URL in `config.js`:

1. **Reload the extension** in Chrome (chrome://extensions -> Click reload)
2. **Test connection** - Open popup on any job site
3. **Verify API calls** - Check if "Connected to AutoJobr" appears
4. **Test features** - Try auto-fill, job analysis, and application tracking

## Troubleshooting

If extension doesn't connect:
- Check if new URL is accessible in browser
- Verify CORS is configured for new domain in server
- Check browser console for errors
- Ensure all files are saved and extension reloaded

## Extension Features Status
✅ **Centralized Configuration** - One file to change URLs
✅ **Auto-Fill System** - Works across 100+ job boards
✅ **Job Analysis** - AI-powered job matching
✅ **Application Tracking** - Automatic submission detection
✅ **Cover Letter Generation** - AI-powered personalization
✅ **Real User Authentication** - Proper session handling