# How to Update AutoJobr Extension Backend URL

## Quick Update (30 seconds)

When your AutoJobr backend URL changes, you only need to update **ONE LINE in ONE FILE**:

### Step 1: Open `central-config.js`
- Navigate to your extension folder
- Open the file `central-config.js`

### Step 2: Update the URL
Find this line (around line 5):
```javascript
API_BASE_URL: 'https://2850a2fc-4859-4c6a-8bf3-95d0268c34db-00-m8wfd8rzorjq.worf.replit.dev',
```

Replace with your new URL:
```javascript
API_BASE_URL: 'https://your-new-url-here.replit.dev',
```

### Step 3: Reload Extension
1. Go to `chrome://extensions/`
2. Find "AutoJobr" extension
3. Click the refresh/reload icon
4. Done!

## Example URLs
- **Replit**: `https://your-repl-name.replit.dev`
- **VM Server**: `http://40.160.50.128:5000`
- **Local Development**: `http://localhost:5000`

## That's It!
All extension files now automatically use the URL from `central-config.js`. **ZERO hardcoded fallback URLs anywhere**.

## Old vs New System
- **Before**: Had to update 6+ files individually with scattered fallback URLs
- **Now**: Update only 1 line in 1 file (`central-config.js` line 9)
- **Guarantee**: No fallback URLs exist anywhere - everything uses central config

## Troubleshooting
If the extension still shows connection errors after updating:
1. Verify the new URL is accessible in a browser
2. Make sure you're logged into AutoJobr in another tab
3. Check that the URL doesn't have a trailing slash
4. Reload the extension in `chrome://extensions/`