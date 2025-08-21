# Promotional Email System Setup Guide

## Overview
The AutoJobr platform now includes a simple promotional email system that sends automated promotional content to job seekers and recruiters to drive premium conversions. The system uses basic templates with random statistics (80-100% success rates, 15-35 job matches) as requested.

## Features
- **Simple Templates**: Basic promotional email templates with random performance statistics
- **Targeted Content**: Different content for job seekers (job opportunities) vs recruiters (platform services)
- **Random Statistics**: Generates random success rates, job match counts, and performance metrics
- **Spam Prevention**: Configurable intervals, daily limits, and email tracking
- **Existing Infrastructure**: Uses current Resend/Postal email setup

## Configuration

### Environment Variables
Add these to your `.env` file to enable promotional emails:

```env
# Enable promotional email service
PROMOTIONAL_EMAILS_ENABLED=true

# Email frequency (default: every 72 hours)
PROMO_EMAIL_INTERVAL_HOURS=72

# Batch size per run (default: 50 users)
PROMO_EMAIL_BATCH_SIZE=50

# Maximum emails per user per day (default: 500)
PROMO_EMAIL_MAX_PER_DAY=500
```

### Quick Start
1. Set `PROMOTIONAL_EMAILS_ENABLED=true` in your environment
2. Restart the application
3. Check service status: `GET /api/admin/promotional-email/status`

## Email Content

### Job Seeker Emails
- Subject: Curated job match counts (e.g., "4 Perfect Job Matches Found for You!")
- Content: Random statistics (80-100% compatibility, 4-5 hand-picked job matches)
- Features: AutoJobr AI tool promotion, premium upgrade CTAs
- Random elements: Job counts (4-5), match rates, new opportunities

### Recruiter Emails  
- Subject: New candidate alerts (e.g., "15 New Qualified Candidates This Week!")
- Content: Random platform statistics (30-80 candidates, 85-100% quality rates)
- Features: Premium recruitment tools, competitive urgency
- Random elements: Candidate counts, quality scores, weekly stats

## API Endpoints

### Check Service Status
```bash
GET /api/admin/promotional-email/status
```

Response:
```json
{
  "enabled": true,
  "intervalHours": 72,
  "batchSize": 50,
  "maxEmailsPerDay": 500,
  "emailsSentToday": 0
}
```

## Technical Details

### Target Audience
- **Job Seekers**: Non-premium users with verified emails
- **Recruiters**: Free tier users with verified emails
- **Exclusions**: Premium users, unverified emails, recent email recipients

### Sending Logic
- Runs every 72 hours by default (configurable)
- Processes users in batches of 50 (configurable)
- 2-second delay between individual emails
- Tracks email frequency to prevent spam

### Email Tracking
- Prevents duplicate emails within configured interval
- Daily sending limits per user
- Automatic cleanup of tracking data

## Monitoring

The service automatically logs:
- Email sending attempts and results
- User eligibility filtering
- Batch processing status
- Error handling and retries

## Security & Compliance

- Uses existing email infrastructure (Resend/Postal)
- Includes unsubscribe links in all emails
- Respects user email verification status
- Prevents spam with frequency controls
- No personal data exposure in promotional content

## Sample Email Statistics

The system generates random statistics for promotional appeal:
- Compatibility scores: 80-100%
- Job match counts: 4-5 hand-picked opportunities
- Candidate counts: 30-80 available
- Quality rates: 85-100%
- Weekly growth: 10-25 new signups

All statistics are randomly generated for promotional purposes and do not reflect actual platform data.