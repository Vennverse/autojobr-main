# Microsoft Clarity Setup Guide

Microsoft Clarity has been successfully integrated into your AutoJobr application! This guide will help you complete the setup.

## What is Microsoft Clarity?

Microsoft Clarity is a **free** behavioral analytics tool from Microsoft that provides:
- 🎥 **Session Replays** - Watch exactly how users interact with your site
- 🔥 **Heatmaps** - See where users click, scroll, and engage
- 📊 **User Insights** - Understand user behavior patterns
- 🚫 **Privacy-First** - GDPR compliant with content masking options

## Setup Steps

### 1. Create Your Clarity Project

1. Go to **https://clarity.microsoft.com**
2. Sign in with your Microsoft account (or create one)
3. Click **"Add new project"**
4. Enter your website details:
   - **Project name**: AutoJobr
   - **Website URL**: Your production domain (e.g., `https://autojobr.com`)
5. Click **"Add project"**

### 2. Get Your Project ID

1. In your Clarity dashboard, navigate to **Settings → Setup**
2. Look for the tracking code snippet
3. Copy the **Project ID** - it looks like this: `ck4z2e1j5x`
4. You'll find it in this part of the script:
   ```javascript
   clarity.init("ck4z2e1j5x"); // <-- This is your project ID
   ```

### 3. Configure Environment Variables

Add your Clarity Project ID to your environment variables:

**For Development:**
Create or update your `.env` file in the root directory:
```bash
VITE_CLARITY_ID=your_clarity_project_id_here
```

**For Production (Replit):**
1. Go to the **Secrets** tab in your Replit environment
2. Add a new secret:
   - **Key**: `VITE_CLARITY_ID`
   - **Value**: Your Clarity project ID (e.g., `ck4z2e1j5x`)

### 4. Restart Your Application

After setting the environment variable, restart your application:
```bash
npm run dev
```

### 5. Verify Installation

1. Open your application in a browser
2. Open the browser's Developer Console (F12)
3. Look for this message: `"Microsoft Clarity initialized successfully"`
4. Visit your Clarity dashboard at https://clarity.microsoft.com
5. Within a few minutes, you should see live sessions appearing

## Advanced Features

The integration supports these advanced Clarity features:

### User Identification
Track specific users across sessions:
```javascript
import { clarity } from 'react-microsoft-clarity';

clarity.identify('user-123', {
  userName: 'John Doe',
  email: 'john@example.com',
  plan: 'premium'
});
```

### Custom Tags
Filter sessions by custom tags:
```javascript
clarity.setTag('userType', 'premium');
clarity.setTag('feature', 'job-search');
```

### Custom Events
Track specific user actions:
```javascript
clarity.setEvent('job_application_submitted');
clarity.setEvent('resume_uploaded');
```

### Content Masking
Hide sensitive data in session replays by adding data attributes:
```html
<!-- This will be masked in replays -->
<div data-clarity-mask="true">
  Sensitive user data here
</div>

<!-- This will be shown even if parent is masked -->
<div data-clarity-unmask="true">
  Public information
</div>
```

## Privacy & GDPR Compliance

If you need to comply with GDPR or require user consent:

```javascript
import { clarity } from 'react-microsoft-clarity';

// After user accepts cookies/analytics
clarity.consent();

// To stop tracking
clarity.stop();

// To resume tracking
clarity.start();
```

## Troubleshooting

### "VITE_CLARITY_ID not found" Warning
This means the environment variable isn't set. Make sure:
1. Your `.env` file contains `VITE_CLARITY_ID=your_project_id`
2. You've restarted the application after adding the variable
3. For Replit, you've added the secret and restarted the workflow

### No Sessions Appearing in Dashboard
- Wait 2-3 minutes for data to appear
- Check browser console for errors
- Verify your Project ID is correct
- Make sure you're visiting the correct project in Clarity dashboard
- Check Network tab for POST requests to `https://www.clarity.ms/collect`

### Production-Only Tracking
If you want to only track in production, modify `client/src/main.tsx`:
```javascript
if (import.meta.env.PROD && clarityId) {
  clarity.init(clarityId);
}
```

## Resources

- **Clarity Dashboard**: https://clarity.microsoft.com
- **Official Documentation**: https://learn.microsoft.com/en-us/clarity/
- **API Reference**: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
- **NPM Package**: https://www.npmjs.com/package/react-microsoft-clarity

## Support

For issues specific to Microsoft Clarity integration, check:
1. Browser console for error messages
2. Clarity dashboard for project status
3. Environment variables are properly set

---

**Note**: Microsoft Clarity is completely free with no usage limits, making it an excellent analytics solution for startups and growing applications.
