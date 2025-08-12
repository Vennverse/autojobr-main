# AutoJobr Email Configuration Guide

## Overview

AutoJobr supports two email providers for sending verification emails, password resets, and notifications:

✅ **Resend** - Modern transactional email API (default)
✅ **Nodemailer with Postal SMTP** - Self-hosted SMTP solution

## Configuration

### Environment Variables

Add these environment variables to configure your preferred email provider:

```bash
# Choose email provider: 'resend' or 'nodemailer'
EMAIL_PROVIDER=resend

# Optional: Custom from address (defaults to 'AutoJobr <noreply@vennverse.com>')
EMAIL_FROM="Your App <noreply@yourdomain.com>"
```

### Option 1: Resend Configuration

```bash
# Resend API Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_resend_api_key_here

# Optional
EMAIL_FROM="AutoJobr <noreply@yourdomain.com>"
```

### Option 2: Postal SMTP Configuration

```bash
# Postal SMTP Configuration
EMAIL_PROVIDER=nodemailer
POSTAL_SMTP_HOST=postal.yourdomain.com
POSTAL_SMTP_PORT=587
POSTAL_SMTP_USER=your-smtp-username
POSTAL_SMTP_PASS=your-smtp-password

# Optional SMTP settings
POSTAL_SMTP_SECURE=false                        # true for port 465, false for 587
POSTAL_SMTP_TLS_REJECT_UNAUTHORIZED=true        # SSL/TLS verification
EMAIL_FROM="AutoJobr <noreply@yourdomain.com>"
```

## Features

### 🔄 Automatic Fallback
- If primary email service fails, system automatically tries the other provider
- Development mode shows email simulation when no providers are configured

### 🎯 Smart Provider Selection
- **Primary**: Uses provider specified in `EMAIL_PROVIDER`
- **Fallback**: Switches to alternative if primary fails
- **Simulation**: Shows email content in logs for development/testing

### 🔍 Connection Testing
- Built-in SMTP connection verification for Postal
- API key validation for Resend
- Test email functionality via admin endpoints

## API Endpoints

### Get Email Configuration Status
```bash
GET /api/admin/email/config
Authorization: Required (admin only)
```

Response:
```json
{
  "currentProvider": "resend",
  "fromAddress": "AutoJobr <noreply@vennverse.com>",
  "status": {
    "provider": "resend",
    "status": "connected",
    "details": "Available keys: 1"
  },
  "availableProviders": ["resend", "nodemailer"],
  "environmentVars": {
    "resend": {
      "required": ["RESEND_API_KEY"],
      "optional": ["EMAIL_FROM"]
    },
    "nodemailer": {
      "required": ["POSTAL_SMTP_HOST", "POSTAL_SMTP_USER", "POSTAL_SMTP_PASS"],
      "optional": ["POSTAL_SMTP_PORT", "POSTAL_SMTP_SECURE", "EMAIL_FROM"]
    }
  }
}
```

### Send Test Email
```bash
POST /api/admin/email/test
Authorization: Required (admin only)
Content-Type: application/json

{
  "testEmail": "test@example.com"
}
```

Response:
```json
{
  "success": true,
  "provider": "resend",
  "status": "connected",
  "details": "Available keys: 1",
  "message": "Test email sent successfully"
}
```

## Provider Comparison

| Feature | Resend | Postal SMTP |
|---------|--------|-------------|
| **Setup Complexity** | Easy | Moderate |
| **Cost** | Pay per email | Self-hosted |
| **Reliability** | High | Depends on setup |
| **Deliverability** | Excellent | Good |
| **API Features** | Modern REST API | Standard SMTP |
| **Analytics** | Built-in dashboard | Postal dashboard |

## Troubleshooting

### Resend Issues
- **No API Keys**: Check `RESEND_API_KEY` environment variable
- **Rate Limits**: System automatically rotates through multiple keys if configured
- **Domain Verification**: Ensure sending domain is verified in Resend dashboard

### Postal SMTP Issues
- **Connection Failed**: Verify SMTP host, port, and credentials
- **SSL/TLS Errors**: Adjust `POSTAL_SMTP_SECURE` and `POSTAL_SMTP_TLS_REJECT_UNAUTHORIZED`
- **Authentication**: Ensure SMTP user has sending permissions

### Development Mode
- **Email Simulation**: When no providers are configured, emails are logged to console
- **Manual Verification**: System logs verification URLs for manual testing
- **Fallback Mode**: Always shows email content even when sending fails

## Example Configurations

### Production with Resend
```bash
NODE_ENV=production
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_AbCdEf123456_YourActualKeyHere
EMAIL_FROM="AutoJobr <noreply@yourdomain.com>"
```

### Production with Postal
```bash
NODE_ENV=production
EMAIL_PROVIDER=nodemailer
POSTAL_SMTP_HOST=postal.yourdomain.com
POSTAL_SMTP_PORT=587
POSTAL_SMTP_USER=autojobr
POSTAL_SMTP_PASS=your-secure-password
POSTAL_SMTP_SECURE=false
EMAIL_FROM="AutoJobr <noreply@yourdomain.com>"
```

### Development (Email Simulation)
```bash
NODE_ENV=development
# No email provider configured - uses simulation mode
```

## Security Best Practices

1. **Environment Variables**: Never commit API keys or passwords to version control
2. **SMTP Security**: Use secure connections (TLS/SSL) for SMTP
3. **Key Rotation**: Regularly rotate API keys and SMTP passwords
4. **From Address**: Use a verified domain for better deliverability
5. **Rate Limiting**: Monitor email usage to prevent abuse

## Migration Between Providers

To switch from Resend to Postal SMTP:
1. Add Postal SMTP environment variables
2. Change `EMAIL_PROVIDER=nodemailer`
3. Restart application
4. Test email functionality

To switch from Postal to Resend:
1. Add Resend API key
2. Change `EMAIL_PROVIDER=resend`
3. Restart application
4. Test email functionality