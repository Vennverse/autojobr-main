# AutoJobr Extension Development Setup

## Quick Start (Development Mode)

### 1. Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/` folder from this project

### 2. Configure API URL (Automatic)

The extension automatically detects the API URL:
- **Local Development**: Tries `http://localhost:5000` first
- **Replit Dev**: Auto-detects `.replit.dev` or `.replit.app` domains
- **Production**: Falls back to `https://autojobr.com`

No manual configuration needed! The background script tests each URL and uses the first one that responds.

### 3. Using the Extension

#### Prerequisites
- Server must be running (`npm run dev`)
- You must be logged in to the web app
- Navigate to a job site (LinkedIn, Indeed, etc.)

#### Features Available

**🚀 Quick Actions**
- **Auto-fill**: Automatically fills job application forms with your profile data
- **Analyze**: Analyzes job match score and compatibility
- **Save Job**: Saves job to your dashboard
- **Cover Letter**: Generates AI-powered cover letter

**💼 Advanced Features** (Shown in extension popup)
- **Interview Prep**: AI-generated interview questions and company insights
- **Salary Intel**: Salary insights and negotiation tips
- **Find Referrals**: Find employees who can refer you

**📋 Quick Links**
- **Resume**: View resume optimization (coming soon)
- **Profile**: Opens your profile page
- **History**: Opens your applications history
- **Open Dashboard**: Quick link to applications dashboard

## Troubleshooting

### Extension Not Connecting

1. **Check Server Status**
   ```bash
   # Make sure the development server is running
   npm run dev
   ```

2. **Check API URL**
   - Open the extension popup
   - Open browser console (F12)
   - Look for "Using configured API URL" message
   - Should show `http://localhost:5000` in development

3. **CORS Issues**
   - Make sure you're using the updated backend code
   - CORS is configured to allow job sites and extension origins
   - Check browser console for CORS errors

### Buttons Not Working

**Most common reasons:**

1. **Not Authenticated**
   - You must be logged in to the web app first
   - Go to `http://localhost:5000` and sign in
   - Then navigate to job sites

2. **Not on a Job Page**
   - Some features only work on job listing pages
   - Make sure you're on LinkedIn Jobs, Indeed, etc.
   - Check that the URL matches patterns in `manifest.json`

3. **Missing Job Data**
   - Features like "Interview Prep" need job data
   - Make sure you're on a specific job listing (not search results)
   - Click on a job posting to view details

### Authentication Issues

If you get "Not authenticated" errors:

1. **Sign in to the web app**
   ```
   http://localhost:5000
   ```

2. **Create an account** if you don't have one

3. **Refresh the extension**
   - Click the extension icon
   - Close and reopen the popup
   - Or reload the current page

### Checking Extension Logs

**Background Script Logs:**
```
1. Go to chrome://extensions/
2. Find "AutoJobr Autopilot"
3. Click "service worker" link
4. View console logs
```

**Content Script Logs:**
```
1. Navigate to a job site
2. Open browser console (F12)
3. Look for "🚀 AutoJobr extension" messages
```

**Popup Logs:**
```
1. Click extension icon to open popup
2. Right-click anywhere in popup
3. Select "Inspect"
4. View console in DevTools
```

## Development Workflow

### Making Changes

1. **Edit Extension Code**
   - Make changes to `popup.js`, `content-script.js`, `background.js`, etc.

2. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click reload button on "AutoJobr Autopilot"
   - Or use the keyboard shortcut: `Ctrl+R` (when extensions page is focused)

3. **Test Changes**
   - Navigate to a job site
   - Open extension popup
   - Check browser console for errors

### Common Development Tasks

**Update Popup UI:**
```
1. Edit extension/popup.html or extension/popup-styles.css
2. Reload extension
3. Close and reopen popup
```

**Update Content Script:**
```
1. Edit extension/content-script.js
2. Reload extension
3. Refresh the job site page
```

**Update Background Script:**
```
1. Edit extension/background.js
2. Reload extension (this restarts the service worker)
3. No page refresh needed
```

## API Endpoints Used

The extension makes requests to these API endpoints:

- `GET /api/health` - Check server status
- `GET /api/user` - Check authentication
- `GET /api/user/profile` - Get user profile data
- `POST /api/applications/track` - Track job applications
- `POST /api/jobs/save` - Save jobs
- `POST /api/cover-letters/generate` - Generate cover letters
- `POST /api/jobs/analyze` - Analyze job matches
- `GET /api/resumes/active` - Get active resume
- `GET /api/reminders/pending` - Get pending tasks/reminders

All endpoints require authentication (session cookies).

## Security Notes

- Extension requests include credentials (cookies)
- CORS is configured to allow job sites
- API requests use session-based authentication
- No API keys stored in extension (uses server-side keys)

## Need Help?

Check the main project README or extension documentation:
- `extension/README.md` - Feature documentation
- `extension/QUICK_REFERENCE.md` - API reference
- Server logs for API errors
