# JobSpy Integration Guide for AutoJobr

## Overview

JobSpy has been successfully integrated into your AutoJobr application. This allows you to scrape jobs from multiple job boards (Indeed, LinkedIn, ZipRecruiter, Glassdoor) and automatically save them to your database.

## 🚀 Quick Start

### 1. Access the JobSpy Admin Panel
Visit: `https://your-app-url/admin/jobspy`

### 2. Test the Installation
- Go to the "Test & Setup" tab
- Click "Test JobSpy Installation" to verify everything is working

### 3. Start Scraping Jobs

#### Quick Actions (Recommended for beginners):
- **Tech Jobs**: Scrapes popular tech roles (software engineer, data scientist, etc.)
- **Remote Jobs**: Focuses on remote opportunities across different fields
- **Search by Role**: Enter a specific job title and location

#### Custom Scraping (For advanced users):
- Configure multiple search terms
- Set specific locations
- Choose job boards to scrape from
- Set number of results per search

## 📋 Available API Endpoints

### Test JobSpy
```
GET /api/jobspy/test
```

### Custom Scraping
```
POST /api/jobspy/scrape
Content-Type: application/json

{
  "search_terms": ["software engineer", "data scientist"],
  "locations": ["New York, NY", "San Francisco, CA", "Remote"],
  "job_sites": ["indeed", "linkedin"],
  "results_wanted": 25,
  "country": "USA"
}
```

### Quick Presets
```
POST /api/jobspy/scrape-tech     # Tech jobs
POST /api/jobspy/scrape-remote   # Remote jobs
POST /api/jobspy/scrape-role     # Specific role
```

### Get Configuration Options
```
GET /api/jobspy/config
```

### View Scraped Jobs
```
GET /api/scraped-jobs?category=tech&location=Remote&limit=50
```

## 🎯 Job Categories

Jobs are automatically categorized based on title and skills:

- **Tech**: Software engineering, data science, DevOps
- **Design**: UX/UI, product design, visual design  
- **Product**: Product management, product owner
- **Marketing**: Digital marketing, growth, content
- **Sales**: Business development, account management

## 🔧 Configuration Options

### Supported Job Sites
- Indeed
- LinkedIn  
- ZipRecruiter
- Glassdoor

### Experience Levels
- Entry-level (junior, intern, graduate)
- Mid-level (default)
- Senior (senior, lead, principal, staff)

### Work Modes
- Remote
- Hybrid
- On-site

## 📊 Database Schema

Jobs are saved to the `scraped_jobs` table with the following structure:

```sql
scraped_jobs:
- id (serial primary key)
- title (job title)
- company (company name)
- description (job description)
- location (job location)
- work_mode (remote/hybrid/onsite)
- job_type (full-time/part-time/contract)
- experience_level (entry/mid/senior)
- salary_range (formatted salary string)
- skills (array of skills)
- source_url (original job posting URL)
- source_platform (indeed/linkedin/etc)
- external_id (unique identifier from source)
- category (tech/design/marketing/etc)
- subcategory (frontend/backend/ux/etc)
- tags (array of tags)
- is_active (boolean)
- last_scraped (timestamp)
- expires_at (expiration date)
- created_at/updated_at (timestamps)
```

## 🚦 Usage Tips

### Best Practices
1. **Start Small**: Begin with 10-20 results per search to avoid rate limits
2. **Use Specific Terms**: "frontend developer" works better than just "developer"
3. **Combine Locations**: Include both specific cities and "Remote"
4. **Check Results**: Use the admin panel to monitor scraping results

### Rate Limiting
- JobSpy has built-in rate limiting to respect job board policies
- Recommended: 20-50 results per search term
- Wait between large scraping operations

### Error Handling
- The system automatically handles network errors and retries
- Failed jobs are logged but don't stop the entire process
- Check the admin panel for detailed error messages

## 🛠 Troubleshooting

### Common Issues

1. **"JobSpy test failed"**
   - Ensure Python 3.11+ is installed
   - Check DATABASE_URL environment variable
   - Verify python-jobspy package is installed

2. **"No jobs found"**
   - Try different search terms
   - Check if location is valid (use full format: "City, State")
   - Some job sites may be temporarily unavailable

3. **"Database connection error"**
   - Verify PostgreSQL is running
   - Check database permissions
   - Ensure scraped_jobs table exists

### Manual Testing

Test the Python script directly:
```bash
cd server
python3 jobspy_scraper.py '{"search_terms": ["software engineer"], "locations": ["Remote"], "job_sites": ["indeed"], "results_wanted": 5}'
```

## 🔄 Automation Ideas

### Scheduled Scraping
You can set up scheduled scraping by calling the API endpoints:

```javascript
// Example: Daily tech job scraping
setInterval(async () => {
  await fetch('/api/jobspy/scrape-tech', { method: 'POST' });
}, 24 * 60 * 60 * 1000); // Every 24 hours
```

### Integration with Playlists
Scraped jobs automatically integrate with your existing job playlist system, allowing users to discover and save jobs.

### Custom Categories
Add new categories by modifying the `categorize_job` function in `server/jobspy_scraper.py`.

## 📈 Monitoring

### Success Metrics
- Check `scraped_count` vs `saved_count` in API responses
- Monitor database growth in `scraped_jobs` table
- Track user engagement with scraped jobs

### Performance
- Average scraping time: 30-120 seconds per search term
- Memory usage: ~50-100MB per scraping operation
- Storage: ~1KB per job record

## 🎉 Next Steps

1. **Test the Integration**: Use the admin panel to run a small test
2. **Configure Regular Scraping**: Set up automated daily/weekly scraping
3. **Customize Categories**: Adjust job categorization for your specific needs
4. **Monitor Usage**: Track which jobs get the most applications
5. **Expand Sources**: Consider adding more job sites as needed

## 🐛 Getting Help

If you encounter issues:

1. Check the admin panel error messages
2. Review server logs for detailed error information
3. Test with smaller result sets
4. Verify your search terms and locations are valid

Happy job scraping! 🎯