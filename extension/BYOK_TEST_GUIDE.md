# 🔑 BYOK (Bring Your Own API Key) Testing Guide

## Overview
The extension now supports **Bring Your Own API Key** (BYOK) for unlimited resume and cover letter generation! Users can add their own free Groq API keys (or OpenAI, Anthropic, Google AI) directly in the extension.

## 🎁 Getting a FREE Groq API Key

1. Go to https://console.groq.com
2. Sign up for a free account
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy your key (starts with `gsk_...`)

**Note**: Groq offers generous free tier with fast LLaMA 3.3 models - perfect for unlimited use!

## 🧪 Testing Flow

### Step 1: Install Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. Pin the AutoJobr extension to your toolbar

### Step 2: Login to AutoJobr
1. Visit https://autojobr.com (or your local dev URL)
2. Login or create an account
3. Make sure you have a complete profile with skills, experience, etc.

### Step 3: Add Your API Key
1. Click the AutoJobr extension icon in Chrome
2. Wait for the popup to load
3. Scroll down to **"🤖 Premium Features (BYOK)"** section
4. Click the **"Manage"** button
5. In the modal:
   - Select **"🚀 Groq (Free)"** provider (pre-selected)
   - Paste your Groq API key
   - Click **"Save Key"**
6. You should see a success notification
7. The status should update to show: "Active: 🚀 Groq"

### Step 4: Test Resume Generation
1. Open a job posting on LinkedIn, Indeed, or any job site
2. Click the AutoJobr extension icon
3. Click the **"Cover Letter"** button (which uses the same generation system)
4. The system will use **your own API key** to generate content
5. Verify the generation works and uses your key

### Step 5: Verify Key Usage
1. Open the extension popup again
2. Click "Manage" under API Keys
3. Check "Last used" timestamp - it should be updated

### Step 6: Test Multiple Providers (Optional)
1. Get an OpenAI API key from https://platform.openai.com
2. Add it in the extension: Select "🤖 OpenAI", paste key, save
3. Now you have both Groq and OpenAI configured
4. The system will use Groq by default (you can change this later)

### Step 7: Delete a Key
1. Open "Manage API Keys" modal
2. Click **"Delete"** button next to a provider
3. Confirm deletion
4. Verify the key is removed from the list

## ✅ Expected Behavior

**When API Key is Added:**
- ✅ Status shows "Active: 🚀 Groq"
- ✅ Cover letter generation uses your key
- ✅ Resume generation uses your key (future)
- ✅ No limits on generation (uses your API quota)

**When NO API Key:**
- ℹ️ Status shows "No API keys configured"
- ℹ️ Generation may use platform keys (limited) or show error

## 🐛 Troubleshooting

### "Failed to save API key"
- **Check**: Are you logged in to AutoJobr?
- **Fix**: Login at https://autojobr.com first

### "No API key found" error
- **Check**: Did you save the key successfully?
- **Fix**: Re-add the key in the extension

### Generation fails
- **Check**: Is your API key valid?
- **Fix**: Verify key at https://console.groq.com
- **Fix**: Try deleting and re-adding the key

### Key not showing up
- **Check**: Browser console for errors (F12)
- **Fix**: Reload the extension (chrome://extensions → click reload)

## 🔒 Security Notes

- ✅ API keys are stored securely in your database (not localStorage)
- ✅ Keys are encrypted and only accessible to your account
- ✅ Keys are never exposed in logs or UI (hidden in password field)
- ✅ Keys are only used for YOUR requests, not shared

## 📊 API Providers Supported

| Provider | Free Tier | Best For | Get Key |
|----------|-----------|----------|---------|
| 🚀 Groq | ✅ Generous | Fast, unlimited resume/CL | https://console.groq.com |
| 🤖 OpenAI | Limited ($5 credit) | High quality, versatile | https://platform.openai.com |
| 🧠 Anthropic | Limited ($5 credit) | Claude models, detailed | https://console.anthropic.com |
| 🌐 Google AI | ✅ Generous | Gemini models, free | https://makersuite.google.com |

**Recommendation**: Start with **Groq** for free unlimited access!

## 🚀 Next Steps

After successful testing:
1. ✅ API key management works
2. 🔄 Resume generation (coming next)
3. 🔄 Cover letter generation (coming next)
4. 🔄 Provider selection in UI
5. 🔄 Usage statistics per key

---

**Questions?** Check the console logs or reach out for help!
