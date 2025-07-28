# How to Update AutoJobr Extension Backend URL

## Quick Update (30 seconds)

When your AutoJobr backend URL changes, you only need to update **ONE FILE**:

### Step 1: Open `central-config.js`
- Navigate to your extension folder
- Open the file `central-config.js`

### Step 2: Update the URL
Find this line (around line 5):
```javascript
API_BASE_URL: 'https://ab8b7c11-4933-4f20-96ce-3083dfb2112d-00-3bpxputy7khv2.riker.replit.dev',
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
All extension files now automatically use the URL from `central-config.js`. No need to update multiple files anymore.

## Old vs New System
- **Before**: Had to update 6+ files individually
- **Now**: Update only 1 file (`central-config.js`)

## Troubleshooting
If the extension still shows connection errors after updating:
1. Verify the new URL is accessible in a browser
2. Make sure you're logged into AutoJobr in another tab
3. Check that the URL doesn't have a trailing slash
4. Reload the extension in `chrome://extensions/`