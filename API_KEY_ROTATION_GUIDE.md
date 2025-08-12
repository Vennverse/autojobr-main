# API Key Rotation System - Setup Guide

Your AutoJobr platform now includes an intelligent API key rotation system that automatically switches between multiple API keys when rate limits or errors occur. This ensures uninterrupted service even if one key hits its limits.

## How to Add Multiple API Keys

### Step 1: Add Multiple Groq API Keys

In your Replit Secrets, add additional Groq keys with numbered suffixes:

```
GROQ_API_KEY      = gsk_your_first_key_here
GROQ_API_KEY_2    = gsk_your_second_key_here  
GROQ_API_KEY_3    = gsk_your_third_key_here
GROQ_API_KEY_4    = gsk_your_fourth_key_here
```

### Step 2: Add Multiple Resend API Keys

Similarly, add multiple Resend keys:

```
RESEND_API_KEY    = re_your_first_key_here
RESEND_API_KEY_2  = re_your_second_key_here
RESEND_API_KEY_3  = re_your_third_key_here
```

### Step 3: How the System Works

**Automatic Detection:**
- The system automatically detects all numbered API keys (up to 10 per service)
- It initializes clients for each valid key
- Keys are load-balanced and rotated for optimal usage

**Intelligent Failover:**
- When a key hits rate limits (429 errors), it's automatically marked as failed
- The system switches to the next available key instantly
- Failed keys go into a cooldown period (1 minute for Groq, 5 minutes for Resend)
- After cooldown, keys are automatically restored to the rotation

**Error Handling:**
- Rate limit errors: Automatic key rotation with retry
- Server errors (5xx): Temporary key marking with automatic recovery
- Authentication errors: Permanent key marking (requires manual reset)

## System Features

### Real-time Monitoring
- Track which keys are active vs failed
- Monitor usage patterns across all keys
- View current rotation status and cooldown periods

### Admin Endpoints
Access API key status (admin only):
```
GET /api/admin/api-keys/status
```

Reset failed keys (admin only):
```
POST /api/admin/api-keys/reset
Body: { "service": "groq" } // or "resend" or omit for all
```

### Automatic Recovery
- Failed keys automatically return to rotation after cooldown
- No manual intervention needed for temporary failures
- Smart retry logic prevents cascading failures

## Benefits

1. **Zero Downtime**: Instant failover when keys hit limits
2. **Cost Distribution**: Spread usage across multiple accounts/keys
3. **Higher Throughput**: Effectively multiply your rate limits
4. **Automatic Management**: No manual key switching required
5. **Intelligent Recovery**: Failed keys automatically recover

## Best Practices

1. **Use Different Accounts**: Get keys from separate Groq/Resend accounts for higher combined limits
2. **Monitor Usage**: Check the admin endpoints to track key health
3. **Gradual Scaling**: Start with 2-3 keys per service, add more as needed
4. **Key Naming**: Always use the numbered format (SERVICE_API_KEY_2, SERVICE_API_KEY_3, etc.)

## Example Configuration

For a high-traffic setup, consider:
- **Groq**: 3-5 keys from different accounts
- **Resend**: 2-3 keys from different accounts
- This gives you 3-5x the rate limits with automatic management

## Monitoring Output Example

The system logs show real-time key usage:
```
🤖 Using Groq key: gsk_abc123... (attempt 1/3)
📧 Using Resend key: re_def456... (attempt 1/2)
🚨 API key marked as failed: gsk_abc123... (1/3 failed)
🔄 Groq failed keys reset
```

## Current Status

Your platform is now running with the rotation system active. You can add additional keys anytime by:
1. Adding them to Replit Secrets with numbered suffixes
2. Restarting the application (the system auto-detects new keys on startup)

The rotation system is production-ready and will significantly improve your platform's reliability and scalability!