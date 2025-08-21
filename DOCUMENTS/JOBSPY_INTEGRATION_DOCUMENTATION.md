# JobSpy Integration Documentation
## AutoJobr Platform - AI-Powered Job Scraping System

### Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Current Implementation](#current-implementation)
5. [Usage Guide](#usage-guide)
6. [API Endpoints](#api-endpoints)
7. [Database Integration](#database-integration)
8. [Deployment](#deployment)
9. [Adding New Job Sites](#adding-new-job-sites)
10. [Future Improvements](#future-improvements)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The JobSpy integration enables AutoJobr to automatically scrape real job postings from major job boards like Indeed and LinkedIn, enriching the platform with fresh job data for AI-powered matching and analysis.

### Key Features
- **Multi-Platform Scraping**: Indeed, LinkedIn (ZipRecruiter and Glassdoor removed due to anti-bot protection)
- **Intelligent Categorization**: Automatic job categorization and skill extraction
- **Experience Level Detection**: Smart parsing of job requirements
- **Salary Processing**: Clean salary range formatting with NaN handling
- **Real-time Admin Interface**: Web-based control panel for scraping operations
- **Database Integration**: Direct PostgreSQL storage with deduplication

### Technology Stack
- **Python**: JobSpy library for web scraping
- **Node.js/TypeScript**: Service layer and API integration
- **PostgreSQL**: Database storage with Drizzle ORM
- **React/TypeScript**: Admin interface
- **Express.js**: API server

---

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin UI      │    │   Node.js API   │    │   Python        │
│   (React/TS)    │◄──►│   (Express/TS)  │◄──►│   JobSpy        │
│                 │    │                 │    │   Scraper       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │   Job Sites     │
                       │   Database      │    │ (Indeed/LinkedIn)│
                       └─────────────────┘    └─────────────────┘
```

### Component Overview

#### 1. **Python JobSpy Scraper** (`server/jobspy_scraper.py`)
- Core scraping logic using JobSpy library
- Job categorization and skill extraction
- Data cleaning and validation
- Database persistence

#### 2. **Node.js Service Layer** (`server/jobspyService.ts`)
- Bridge between frontend and Python scraper
- Process management for Python scripts
- API endpoint handling
- Configuration management

#### 3. **Admin Interface** (`client/src/pages/admin-jobspy.tsx`)
- User-friendly control panel
- Real-time scraping status
- Configuration options
- Quick action buttons

#### 4. **Database Schema** (`shared/schema.ts`)
- Structured job data storage
- Category and skill tracking
- Source attribution and deduplication

---

## Installation & Setup

### Prerequisites
- Node.js 18+ with npm
- Python 3.11+
- PostgreSQL database
- Replit environment (recommended)

### Step 1: Install Python Dependencies
```bash
# Install Python JobSpy library
pip install python-jobspy psycopg2-binary
```

### Step 2: Environment Configuration
Ensure these environment variables are set:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=development
```

### Step 3: Database Schema
The system uses the existing `scraped_jobs` table with these key fields:
- `title`, `company`, `description`
- `location`, `work_mode`, `job_type`
- `experience_level`, `salary_range`
- `skills`, `category`, `subcategory`
- `source_platform`, `source_url`, `external_id`

### Step 4: Admin User Setup
Create an admin user to access the JobSpy interface:
```sql
INSERT INTO users (email, password_hash, user_type, email_verified) 
VALUES ('admin@company.com', 'hashed_password', 'admin', true);
```

---

## Current Implementation

### Supported Job Sites
- ✅ **Indeed**: Primary source, stable scraping
- ✅ **LinkedIn**: Secondary source, good coverage
- ❌ **ZipRecruiter**: Disabled (Cloudflare protection)
- ❌ **Glassdoor**: Disabled (Rate limiting issues)

### Job Categories Supported
- **Tech**: Frontend, Backend, Full-stack, DevOps, Mobile, Data Science
- **Design**: UX, UI, Product Design, Visual Design
- **Product**: Product Management
- **Marketing**: Digital Marketing, Growth
- **Sales**: Business Development
- **General**: Other categories

### Experience Levels
- **Entry**: Junior, Graduate, Intern positions
- **Mid**: Mid-level, Intermediate roles
- **Senior**: Senior, Lead, Principal, Staff positions

---

## Usage Guide

### Accessing the Admin Panel
1. **Login** with admin credentials
2. **Navigate** to `/admin/jobspy`
3. **Choose** from available options:
   - Test Installation
   - Quick Tech Jobs Scrape
   - Quick Remote Jobs Scrape
   - Custom Configuration

### Quick Actions

#### Tech Jobs Scrape
```javascript
// Searches for popular tech roles across major cities
search_terms: ['software engineer', 'frontend developer', 'backend developer', 
               'full stack developer', 'data scientist', 'devops engineer']
locations: ['New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 
           'Austin, TX', 'Seattle, WA', 'Remote']
```

#### Remote Jobs Scrape
```javascript
// Focuses on remote-specific searches
search_terms: ['remote software engineer', 'remote developer', 
               'remote data scientist', 'remote product manager']
locations: ['Remote', 'United States']
```

### Custom Configuration
The admin interface allows configuration of:
- **Search Terms**: Job titles and keywords
- **Locations**: Cities, states, or "Remote"
- **Job Sites**: Choose from available platforms
- **Results Count**: Number of jobs per search (max 20 per query)
- **Country**: Target country for searches

---

## API Endpoints

### JobSpy Scraping Endpoints

#### `POST /api/jobspy/scrape`
Main scraping endpoint with custom configuration
```typescript
interface JobSpyConfig {
  search_terms: string[];
  locations: string[];
  job_sites: string[];
  results_wanted: number;
  country: string;
}

// Response
interface JobSpyResult {
  success: boolean;
  message?: string;
  error?: string;
  jobs: Job[];
  jobsFound: number;
  jobsSaved: number;
}
```

#### `GET /api/jobspy/test`
Test JobSpy installation and connectivity
```typescript
// Response
{
  success: boolean;
  message: string;
  version?: string;
}
```

#### `POST /api/jobspy/scrape-tech`
Quick tech jobs scraping with predefined configuration
```typescript
// Uses default tech job configuration
// Returns: JobSpyResult
```

#### `POST /api/jobspy/scrape-remote`
Quick remote jobs scraping
```typescript
// Uses default remote job configuration  
// Returns: JobSpyResult
```

#### `GET /api/jobspy/config`
Get available configuration options
```typescript
// Response
{
  availableJobSites: string[];
  commonSearchTerms: { [category: string]: string[] };
  commonLocations: string[];
}
```

---

## Database Integration

### Job Storage Process
1. **Scraping**: JobSpy retrieves job data from job sites
2. **Processing**: Python script cleans and categorizes data
3. **Validation**: Data validation and duplicate checking
4. **Storage**: Insert into PostgreSQL `scraped_jobs` table
5. **Indexing**: External ID prevents duplicates

### Data Flow
```sql
-- Example job insertion
INSERT INTO scraped_jobs (
  title, company, description, location, work_mode, job_type,
  experience_level, salary_range, skills, category, subcategory,
  source_platform, source_url, external_id, tags, created_at
) VALUES (
  'Senior Software Engineer', 'TechCorp', 'Job description...',
  'San Francisco, CA', 'onsite', 'full-time', 'senior',
  '$120,000 - $180,000', ['Python', 'React', 'AWS'], 'tech', 'software-engineering',
  'indeed', 'https://indeed.com/job/123', 'indeed_hash123',
  ['Python', 'React'], NOW()
);
```

### Database Schema Details
```typescript
export const scrapedJobs = pgTable('scraped_jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  description: text('description'),
  location: text('location'),
  workMode: text('work_mode'),
  jobType: text('job_type'),
  experienceLevel: text('experience_level'),
  salaryRange: text('salary_range'),
  skills: text('skills').array(),
  category: text('category'),
  subcategory: text('subcategory'),
  sourcePlatform: text('source_platform'),
  sourceUrl: text('source_url'),
  externalId: text('external_id').unique(),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

---

## Deployment

### Replit Deployment
The system is designed for Replit's environment:

1. **Python Environment**: Automatically managed by Replit
2. **Node.js Application**: Main application server
3. **PostgreSQL**: Replit's managed database service
4. **File System**: Local storage for temporary files

### Environment Setup
```bash
# Replit automatically provides:
DATABASE_URL=postgresql://replit_db_url
NODE_ENV=development

# Required packages are auto-installed:
python-jobspy
psycopg2-binary
```

### Workflow Configuration
```yaml
# .replit
[workflows]
[[workflows.workflow]]
name = "Start application"
command = "npm run dev"
```

### Production Considerations
- **Rate Limiting**: Implement delays between scraping requests
- **Error Handling**: Robust error recovery and logging
- **Monitoring**: Track scraping success rates and failures
- **Data Quality**: Validation and cleaning pipelines

---

## Adding New Job Sites

### Step 1: Check JobSpy Support
First, verify if JobSpy supports the new site:
```python
from jobspy import scrape_jobs

# Available sites in JobSpy library
supported_sites = ['indeed', 'linkedin', 'zip_recruiter', 'glassdoor']
```

### Step 2: Update Configuration Files

#### A. Python Scraper (`server/jobspy_scraper.py`)
```python
# Add new site to default configuration
if job_sites is None:
    job_sites = ['indeed', 'linkedin', 'new_site']

# Update available sites list
def get_available_sites():
    return ['indeed', 'linkedin', 'new_site']
```

#### B. Node.js Service (`server/jobspyService.ts`)
```typescript
// Update available sites method
getAvailableJobSites(): string[] {
  return ['indeed', 'linkedin', 'new_site'];
}

// Update default configurations
job_sites: ['indeed', 'linkedin', 'new_site']
```

#### C. Admin Interface (`client/src/pages/admin-jobspy.tsx`)
```tsx
// Add new option to job site selector
<SelectContent>
  <SelectItem value="indeed">Indeed</SelectItem>
  <SelectItem value="linkedin">LinkedIn</SelectItem>
  <SelectItem value="new_site">New Site</SelectItem>
</SelectContent>
```

### Step 3: Test Integration
```python
# Test scraping from new site
jobs = scrape_jobs(
    site_name=['new_site'],
    search_term='software engineer',
    location='Remote',
    results_wanted=5
)
```

### Step 4: Handle Site-Specific Issues

#### Rate Limiting
```python
# Add delays between requests
import time
time.sleep(2)  # Wait 2 seconds between searches
```

#### Anti-Bot Protection
```python
# Use rotating user agents or proxy rotation
# Some sites may require additional headers
```

#### Data Format Differences
```python
# Handle site-specific data formats
def normalize_job_data(job, site_name):
    if site_name == 'new_site':
        # Handle specific data format
        return {
            'title': job.get('job_title', job.get('title')),
            'company': job.get('employer', job.get('company')),
            # ... other mappings
        }
```

---

## Future Improvements

### 1. Enhanced Data Quality

#### Duplicate Detection
```python
# Implement fuzzy matching for job deduplication
from difflib import SequenceMatcher

def is_duplicate(job1, job2, threshold=0.8):
    title_similarity = SequenceMatcher(None, job1['title'], job2['title']).ratio()
    company_similarity = SequenceMatcher(None, job1['company'], job2['company']).ratio()
    return (title_similarity + company_similarity) / 2 > threshold
```

#### AI-Powered Categorization
```python
# Use AI for better job categorization
def ai_categorize_job(title, description):
    # Integration with OpenAI or local models
    # More accurate category detection
    pass
```

### 2. Advanced Scheduling

#### Cron-Based Scraping
```typescript
// Implement scheduled scraping
import cron from 'node-cron';

// Daily scraping at 2 AM
cron.schedule('0 2 * * *', () => {
  jobspyService.scrapeTechJobs();
});
```

#### Smart Scheduling
```python
# Adjust scraping frequency based on job posting patterns
def get_optimal_scraping_time(job_site, category):
    # Analyze historical data to find best scraping times
    pass
```

### 3. Performance Optimization

#### Parallel Processing
```python
import asyncio
import aiohttp

async def scrape_multiple_sites_parallel(config):
    # Parallel scraping from multiple sites
    tasks = []
    for site in config['job_sites']:
        task = asyncio.create_task(scrape_site_async(site, config))
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    return results
```

#### Caching Layer
```typescript
// Implement Redis caching for frequently accessed data
import Redis from 'redis';

const redis = new Redis(process.env.REDIS_URL);

// Cache job search results
async function getCachedJobs(searchKey: string) {
  const cached = await redis.get(searchKey);
  return cached ? JSON.parse(cached) : null;
}
```

### 4. Enhanced User Interface

#### Real-time Updates
```typescript
// WebSocket integration for live scraping updates
import { WebSocket } from 'ws';

// Send progress updates to frontend
ws.send(JSON.stringify({
  type: 'scraping_progress',
  completed: 5,
  total: 20,
  currentSite: 'indeed'
}));
```

#### Advanced Filtering
```tsx
// Add more sophisticated filtering options
interface AdvancedFilters {
  salaryRange: [number, number];
  experienceLevel: string[];
  workMode: string[];
  companySize: string[];
  benefits: string[];
}
```

### 5. Analytics and Monitoring

#### Scraping Metrics
```python
# Track scraping performance metrics
class ScrapingMetrics:
    def __init__(self):
        self.sites_scraped = {}
        self.success_rates = {}
        self.error_types = {}
    
    def log_scraping_result(self, site, success, error_type=None):
        # Track success rates and common errors
        pass
```

#### Job Market Analysis
```sql
-- Analyze job market trends
SELECT 
    category,
    COUNT(*) as job_count,
    AVG(CAST(SUBSTRING(salary_range FROM '[\d,]+') AS INTEGER)) as avg_salary,
    date_trunc('week', created_at) as week
FROM scraped_jobs 
WHERE created_at >= NOW() - INTERVAL '3 months'
GROUP BY category, week
ORDER BY week DESC;
```

### 6. Machine Learning Integration

#### Job Matching Algorithm
```python
# ML-based job recommendation
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def find_similar_jobs(target_job, all_jobs, threshold=0.7):
    # Use TF-IDF and cosine similarity for job matching
    pass
```

#### Salary Prediction
```python
# Predict salary ranges for jobs without salary data
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

def predict_salary(job_title, location, experience_level, skills):
    # ML model to predict salary based on job attributes
    pass
```

### 7. API Rate Management

#### Intelligent Rate Limiting
```python
class AdaptiveRateLimit:
    def __init__(self):
        self.site_limits = {
            'indeed': {'requests_per_minute': 10, 'burst': 5},
            'linkedin': {'requests_per_minute': 8, 'burst': 3}
        }
    
    async def wait_if_needed(self, site_name):
        # Dynamic rate limiting based on site response
        pass
```

### 8. Data Export and Integration

#### API for External Access
```typescript
// RESTful API for accessing scraped data
app.get('/api/jobs/export', async (req, res) => {
  const { format, filters } = req.query;
  
  if (format === 'csv') {
    // Export as CSV
  } else if (format === 'json') {
    // Export as JSON
  }
});
```

#### Third-party Integrations
```typescript
// Integration with external services
interface JobBoard {
  postJob(job: Job): Promise<string>;
  updateJob(id: string, job: Job): Promise<void>;
  removeJob(id: string): Promise<void>;
}

class IndeedIntegration implements JobBoard {
  // Implementation for posting to Indeed
}
```

---

## Troubleshooting

### Common Issues

#### 1. "JobSpy Installation Failed"
```bash
# Solution: Reinstall with specific version
pip uninstall python-jobspy
pip install python-jobspy==2024.1.2
```

#### 2. "Cannot convert float NaN to integer"
```python
# Solution: Enhanced data validation (already implemented)
def safe_convert_salary(value):
    try:
        if pd.isna(value) or value is None:
            return None
        return int(float(value))
    except (ValueError, TypeError, OverflowError):
        return None
```

#### 3. "Cloudflare Blocking"
```python
# Solution: Remove problematic sites or use proxy
BLOCKED_SITES = ['zip_recruiter', 'glassdoor']
job_sites = [site for site in job_sites if site not in BLOCKED_SITES]
```

#### 4. "Database Connection Error"
```python
# Solution: Check database URL and connectivity
import psycopg2

try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    print("Database connection successful")
except Exception as e:
    print(f"Database error: {e}")
```

#### 5. "Python Process Timeout"
```typescript
// Solution: Increase timeout or reduce batch size
const timeout = setTimeout(() => {
  pythonProcess.kill('SIGTERM');
  reject(new Error('Timeout increased to 15 minutes'));
}, 15 * 60 * 1000); // Increased timeout
```

### Performance Issues

#### Slow Scraping
1. **Reduce batch size**: Lower `results_wanted` per search
2. **Increase delays**: Add `time.sleep()` between requests
3. **Optimize database queries**: Use batch inserts
4. **Parallel processing**: Scrape multiple sites simultaneously

#### Memory Usage
1. **Process jobs in batches**: Don't store all jobs in memory
2. **Clear data structures**: Delete processed jobs from memory
3. **Database streaming**: Use cursor-based pagination

### Debugging Steps

1. **Check logs**: Monitor console output for errors
2. **Test individual components**: Use test endpoints
3. **Validate data**: Check database entries
4. **Monitor network**: Watch for rate limiting responses
5. **Resource usage**: Monitor CPU and memory consumption

---

## Conclusion

The JobSpy integration provides AutoJobr with powerful job scraping capabilities, enabling real-time job data collection from major job boards. The modular architecture allows for easy expansion and maintenance, while the admin interface provides user-friendly control over scraping operations.

The system is designed for scalability and can be enhanced with advanced features like AI-powered categorization, predictive analytics, and intelligent scheduling. Regular monitoring and maintenance ensure optimal performance and data quality.

For additional support or feature requests, refer to the JobSpy library documentation and the AutoJobr development team.

---

*Last Updated: August 2025*
*Version: 1.0.0*
*Maintainer: AutoJobr Development Team*