import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db';
import { scrapedJobs } from '@shared/schema';
import { eq, and, desc, notInArray } from 'drizzle-orm';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface JobSpyConfig {
  search_terms?: string[];
  locations?: string[];
  job_sites?: string[];
  results_wanted?: number;
  country?: string;
}

interface JobSpyResult {
  success: boolean;
  scraped_count?: number;
  saved_count?: number;
  search_terms?: string[];
  locations?: string[];
  job_sites?: string[];
  error?: string;
  timestamp: string;
}

interface JobScrapingResults {
  totalFound: number;
  newAdded: number;
  updated: number;
  deactivated: number;
}

interface JobSyncLogEntry {
  syncDate: string;
  totalJobsFound: number;
  newJobsAdded: number;
  jobsUpdated: number;
  jobsDeactivated: number;
  processingTimeMs: number;
  syncStatus: 'success' | 'failed';
  errorMessage?: string;
  searchTerms?: string[];
  jobSites?: string[];
}

export class JobSpyService {
  private pythonPath: string;
  private scriptPath: string;
  private readonly DEFAULT_SEARCH_TERMS = {
    // Technology roles - expanded for international markets
    tech: [
      // Core software development
      'software engineer', 'software developer', 'full stack developer', 'frontend developer', 'backend developer',
      'python developer', 'javascript developer', 'java developer', 'react developer', 'node.js developer',
      'angular developer', 'vue.js developer', 'php developer', 'ruby developer', 'golang developer',
      
      // Data and AI roles
      'data scientist', 'data engineer', 'data analyst', 'machine learning engineer', 'ai engineer',
      'deep learning engineer', 'nlp engineer', 'computer vision engineer', 'data architect',
      
      // Infrastructure and DevOps
      'devops engineer', 'cloud engineer', 'aws engineer', 'azure engineer', 'gcp engineer',
      'kubernetes engineer', 'docker engineer', 'site reliability engineer', 'platform engineer',
      
      // Mobile development
      'mobile developer', 'ios developer', 'android developer', 'react native developer', 'flutter developer',
      
      // Other tech roles
      'cybersecurity engineer', 'security analyst', 'database administrator', 'system administrator',
      'technical lead', 'software architect', 'engineering manager', 'tech lead'
    ],
    
    // Entry level roles - important for India and fresh graduates
    entry_level: [
      'junior software engineer', 'entry level developer', 'graduate trainee engineer', 'software intern',
      'trainee software developer', 'fresher developer', 'associate software engineer', 'campus hire',
      'junior data scientist', 'junior frontend developer', 'junior backend developer', 'graduate engineer',
      'trainee data analyst', 'associate developer', 'junior consultant', 'entry level analyst'
    ],

    // Sales roles
    sales: [
      'sales representative', 'account manager', 'business development manager', 'sales director',
      'sales engineer', 'key account manager', 'inside sales representative', 'outside sales representative',
      'sales coordinator', 'territory manager', 'channel sales manager', 'enterprise sales',
      'regional sales manager', 'sales executive', 'business development executive'
    ],
    
    // Marketing roles
    marketing: [
      'digital marketing manager', 'content marketing manager', 'social media manager', 'marketing manager',
      'brand manager', 'marketing coordinator', 'seo specialist', 'ppc specialist', 'sem specialist',
      'email marketing specialist', 'growth marketing manager', 'marketing analyst', 'performance marketing',
      'affiliate marketing manager', 'influencer marketing manager', 'product marketing manager'
    ],
    
    // Business roles
    business: [
      'business analyst', 'operations manager', 'project manager', 'consultant', 'management consultant',
      'strategy manager', 'business development', 'financial analyst', 'business intelligence analyst',
      'operations coordinator', 'process improvement manager', 'program manager', 'delivery manager',
      'client relationship manager', 'stakeholder manager', 'transformation manager'
    ],
    
    // Finance roles - important for major financial centers
    finance: [
      'financial analyst', 'accountant', 'finance manager', 'controller', 'financial controller',
      'treasury analyst', 'investment analyst', 'credit analyst', 'budget analyst', 'fp&a analyst',
      'financial planning manager', 'risk analyst', 'compliance officer', 'audit manager',
      'investment banking analyst', 'equity research analyst', 'financial advisor'
    ],
    
    // HR roles
    hr: [
      'hr manager', 'recruiter', 'talent acquisition specialist', 'hr business partner', 'hr generalist',
      'hr coordinator', 'training manager', 'l&d manager', 'compensation analyst', 'hr analyst',
      'employee relations manager', 'talent management specialist', 'workforce planning manager',
      'organizational development manager', 'hr operations manager'
    ],
    
    // Design roles
    design: [
      'ui/ux designer', 'product designer', 'graphic designer', 'web designer', 'visual designer',
      'creative director', 'brand designer', 'interaction designer', 'user experience designer',
      'user interface designer', 'design manager', 'art director', 'motion graphics designer',
      'design lead', 'senior designer'
    ],
    
    // Product roles
    product: [
      'product manager', 'senior product manager', 'product owner', 'product analyst', 
      'product marketing manager', 'associate product manager', 'product coordinator',
      'technical product manager', 'digital product manager', 'product strategy manager',
      'product operations manager', 'product growth manager'
    ]
  };
  
  private readonly DEFAULT_LOCATIONS = {
    // United States - Major tech and business hubs
    US: [
      'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Austin, TX',
      'Seattle, WA', 'Chicago, IL', 'Boston, MA', 'Denver, CO', 'Atlanta, GA',
      'Miami, FL', 'Phoenix, AZ', 'Philadelphia, PA', 'Dallas, TX', 'Houston, TX',
      'San Jose, CA', 'Washington, DC', 'Portland, OR', 'Nashville, TN', 'Charlotte, NC',
      'Minneapolis, MN', 'Pittsburgh, PA', 'Raleigh, NC', 'United States', 'Remote USA'
    ],
    
    // India - Major IT hubs and emerging cities
    IN: [
      'Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India',
      'Chennai, India', 'Pune, India', 'Kolkata, India', 'Ahmedabad, India',
      'Gurgaon, India', 'Noida, India', 'Jaipur, India', 'Kochi, India',
      'Indore, India', 'Nagpur, India', 'Lucknow, India', 'Coimbatore, India',
      'Vadodara, India', 'Chandigarh, India', 'Mysore, India', 'Thiruvananthapuram, India',
      'Bhubaneswar, India', 'Vizag, India', 'India', 'Remote India', 'Work from Home India'
    ],
    
    // United Kingdom
    GB: [
      'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Leeds, UK',
      'Glasgow, UK', 'Liverpool, UK', 'Bristol, UK', 'Edinburgh, UK',
      'Sheffield, UK', 'Cardiff, UK', 'Belfast, UK', 'Nottingham, UK',
      'Newcastle, UK', 'Reading, UK', 'Cambridge, UK', 'United Kingdom', 'Remote UK'
    ],
    
    // Germany - Major tech and financial centers
    DE: [
      'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Cologne, Germany',
      'Frankfurt, Germany', 'Stuttgart, Germany', 'Düsseldorf, Germany',
      'Dortmund, Germany', 'Leipzig, Germany', 'Bremen, Germany', 'Hannover, Germany',
      'Nuremberg, Germany', 'Dresden, Germany', 'Germany', 'Remote Germany'
    ],
    
    // France
    FR: [
      'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France',
      'Nice, France', 'Nantes, France', 'Strasbourg, France', 'Montpellier, France',
      'Bordeaux, France', 'Lille, France', 'Rennes, France', 'Reims, France',
      'France', 'Remote France'
    ],
    
    // Spain
    ES: [
      'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain',
      'Bilbao, Spain', 'Málaga, Spain', 'Murcia, Spain', 'Las Palmas, Spain',
      'Palma, Spain', 'Zaragoza, Spain', 'Alicante, Spain', 'Spain', 'Remote Spain'
    ],
    
    // Italy
    IT: [
      'Milan, Italy', 'Rome, Italy', 'Naples, Italy', 'Turin, Italy',
      'Florence, Italy', 'Bologna, Italy', 'Bari, Italy', 'Catania, Italy',
      'Venice, Italy', 'Verona, Italy', 'Italy', 'Remote Italy'
    ],
    
    // Netherlands
    NL: [
      'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands',
      'Utrecht, Netherlands', 'Eindhoven, Netherlands', 'Tilburg, Netherlands',
      'Groningen, Netherlands', 'Netherlands', 'Remote Netherlands'
    ],
    
    // Other European countries
    EU_OTHER: [
      'Dublin, Ireland', 'Stockholm, Sweden', 'Copenhagen, Denmark', 'Oslo, Norway',
      'Helsinki, Finland', 'Zurich, Switzerland', 'Geneva, Switzerland', 'Vienna, Austria',
      'Brussels, Belgium', 'Prague, Czech Republic', 'Warsaw, Poland', 'Lisbon, Portugal',
      'Remote Europe', 'European Union'
    ],
    
    // Canada
    CA: [
      'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Calgary, Canada',
      'Ottawa, Canada', 'Edmonton, Canada', 'Mississauga, Canada', 'Winnipeg, Canada',
      'Quebec City, Canada', 'Hamilton, Canada', 'Canada', 'Remote Canada'
    ],
    
    // Australia
    AU: [
      'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia',
      'Perth, Australia', 'Adelaide, Australia', 'Canberra, Australia',
      'Gold Coast, Australia', 'Newcastle, Australia', 'Australia', 'Remote Australia'
    ],
    
    // UAE and Middle East
    AE: [
      'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Ajman, UAE',
      'UAE', 'Remote UAE', 'Middle East'
    ],
    
    // Singapore and Asia-Pacific
    APAC: [
      'Singapore', 'Hong Kong', 'Tokyo, Japan', 'Seoul, South Korea',
      'Kuala Lumpur, Malaysia', 'Bangkok, Thailand', 'Manila, Philippines',
      'Jakarta, Indonesia', 'Remote Asia Pacific'
    ]
  };
  
  private readonly DEFAULT_JOB_SITES = {
    // Global job sites (work in most countries) - most reliable
    global: ['indeed', 'linkedin'],
    
    // US-specific job sites - comprehensive coverage
    US: ['indeed', 'linkedin', 'zip_recruiter'],
    
    // India-specific job sites - includes local platforms
    IN: ['indeed', 'linkedin', 'naukri'],
    
    // European countries - focus on indeed and linkedin for reliability
    GB: ['indeed', 'linkedin'],
    DE: ['indeed', 'linkedin'],
    FR: ['indeed', 'linkedin'],
    ES: ['indeed', 'linkedin'],
    IT: ['indeed', 'linkedin'],
    NL: ['indeed', 'linkedin'],
    
    // Other regions
    CA: ['indeed', 'linkedin'],
    AU: ['indeed', 'linkedin'],
    AE: ['indeed', 'linkedin'],
    APAC: ['indeed', 'linkedin']
  };

  constructor() {
    this.pythonPath = 'uv';
    // Always use the server directory path since Python files are not compiled
    // This works for both development and production
    this.scriptPath = path.join(process.cwd(), 'server', 'jobspy_scraper.py');
  }

  /**
   * Run JobSpy scraping with custom configuration
   */
  async scrapeJobs(config: JobSpyConfig = {}): Promise<JobSpyResult> {
    return new Promise((resolve, reject) => {
      const configJson = JSON.stringify(config);
      
      console.log('[JOBSPY_SERVICE] Starting JobSpy scraping...');
      console.log('[JOBSPY_SERVICE] Config:', config);

      const pythonProcess = spawn(this.pythonPath, ['run', 'python', this.scriptPath, configJson], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: process.env.PYTHONPATH || '',
          PYTHONUNBUFFERED: '1'
        }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Log real-time output from Python script
        console.log('[JOBSPY_PYTHON]', output.trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        console.error('[JOBSPY_PYTHON_ERROR]', error.trim());
      });

      pythonProcess.on('close', (code) => {
        console.log(`[JOBSPY_SERVICE] Python process exited with code ${code}`);
        
        if (code === 0) {
          try {
            // Parse the JSON result from stdout - find JSON block
            const lines = stdout.trim().split('\n');
            let jsonResult = null;
            
            // Look for JSON result starting from the end
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('{')) {
                // Try to parse potential JSON lines
                try {
                  // If it's a single line JSON
                  if (line.endsWith('}')) {
                    const parsed = JSON.parse(line);
                    // Verify it's our expected result structure
                    if (parsed && typeof parsed === 'object' && ('success' in parsed || 'scraped_count' in parsed)) {
                      jsonResult = parsed;
                      break;
                    }
                  } else {
                    // Multi-line JSON - collect all lines from this point
                    const jsonLines = lines.slice(i);
                    const jsonString = jsonLines.join('\n');
                    const parsed = JSON.parse(jsonString);
                    if (parsed && typeof parsed === 'object' && ('success' in parsed || 'scraped_count' in parsed)) {
                      jsonResult = parsed;
                      break;
                    }
                  }
                } catch (e) {
                  // Continue looking for valid JSON
                  continue;
                }
              }
            }
            
            if (jsonResult) {
              console.log('[JOBSPY_SERVICE] Scraping completed successfully');
              console.log('[JOBSPY_SERVICE] Result:', jsonResult);
              resolve(jsonResult);
            } else {
              console.error('[JOBSPY_SERVICE] No valid JSON found in output');
              console.error('[JOBSPY_SERVICE] Full stdout:', stdout);
              reject(new Error('No valid JSON result found in JobSpy output'));
            }
          } catch (parseError) {
            console.error('[JOBSPY_SERVICE] Failed to parse result:', parseError instanceof Error ? parseError.message : String(parseError));
            console.error('[JOBSPY_SERVICE] Full stdout:', stdout);
            reject(new Error(`Failed to parse JobSpy result: ${parseError instanceof Error ? parseError.message : String(parseError)}`));
          }
        } else {
          const errorMessage = stderr || 'JobSpy script failed with unknown error';
          console.error('[JOBSPY_SERVICE] JobSpy script failed:', errorMessage);
          reject(new Error(errorMessage));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[JOBSPY_SERVICE] Failed to start Python process:', error);
        reject(new Error(`Failed to start JobSpy: ${error.message}`));
      });

      // Set a timeout for long-running scraping operations
      const timeout = setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        reject(new Error('JobSpy scraping timed out after 10 minutes'));
      }, 10 * 60 * 1000); // 10 minutes timeout

      pythonProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Quick scrape with predefined tech job searches - Global coverage
   */
  async scrapeTechJobs(): Promise<JobSpyResult> {
    const config: JobSpyConfig = {
      search_terms: [
        // Core Tech Roles
        'software engineer',
        'frontend developer', 
        'backend developer',
        'full stack developer',
        'data scientist',
        'devops engineer',
        'mobile developer',
        'cloud engineer',
        'data engineer',
        'machine learning engineer',
        'product manager',
        'qa engineer',
        'security engineer',
        'site reliability engineer',
        
        // Finance Roles
        'financial analyst',
        'investment banker',
        'accountant',
        'financial advisor',
        'portfolio manager',
        'risk analyst',
        'compliance officer',
        'treasury analyst',
        'fp&a analyst',
        'tax accountant',
        'audit manager',
        'credit analyst',
        
        // Sales Roles
        'sales representative',
        'account executive',
        'business development manager',
        'sales manager',
        'account manager',
        'sales engineer',
        'sales director',
        'inside sales representative',
        'territory manager',
        'channel sales manager',
        
        // Marketing Roles
        'marketing manager',
        'digital marketing manager',
        'content marketing manager',
        'social media manager',
        'brand manager',
        'marketing coordinator',
        'seo specialist',
        'growth marketing manager',
        'product marketing manager',
        'email marketing specialist',
        
        // Law Roles
        'corporate lawyer',
        'legal counsel',
        'paralegal',
        'contract manager',
        'compliance manager',
        'legal assistant',
        'intellectual property lawyer',
        'litigation attorney',
        'employment lawyer',
        'general counsel'
      ],
      locations: [
        // USA - Top tech hubs
        'New York, NY',
        'San Francisco, CA', 
        'Los Angeles, CA',
        'Austin, TX',
        'Seattle, WA',
        
        // India - Major tech cities
        'Bangalore, India',
        'Mumbai, India',
        'Delhi, India',
        'Hyderabad, India',
        'Pune, India',
        
        // UK
        'London, UK',
        'Manchester, UK',
        'Edinburgh, UK',
        
        // Europe
        'Berlin, Germany',
        'Amsterdam, Netherlands',
        'Paris, France',
        'Barcelona, Spain',
        
        // Australia
        'Sydney, Australia',
        'Melbourne, Australia',
        
        // Remote
        'Remote',
        'Remote India',
        'Remote USA',
        'Remote Europe'
      ],
      job_sites: ['indeed', 'linkedin'],
      results_wanted: 100,
      country: 'USA'
    };

    return this.scrapeJobs(config);
  }

  /**
   * Scrape remote jobs specifically
   */
  async scrapeRemoteJobs(): Promise<JobSpyResult> {
    const config: JobSpyConfig = {
      search_terms: [
        'remote software engineer',
        'remote developer',
        'remote data scientist',
        'remote product manager',
        'remote designer'
      ],
      locations: ['Remote', 'Anywhere'],
      job_sites: ['indeed', 'linkedin'],
      results_wanted: 40,
      country: 'USA'
    };

    return this.scrapeJobs(config);
  }

  /**
   * Scrape jobs by specific role
   */
  async scrapeJobsByRole(role: string, location?: string): Promise<JobSpyResult> {
    const config: JobSpyConfig = {
      search_terms: [role],
      locations: location ? [location] : ['New York, NY', 'San Francisco, CA', 'Remote'],
      job_sites: ['indeed', 'linkedin'],
      results_wanted: 25,
      country: 'USA'
    };

    return this.scrapeJobs(config);
  }

  /**
   * Test JobSpy installation and basic functionality
   */
  async testJobSpy(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[JOBSPY_SERVICE] Testing JobSpy installation...');
      
      const testConfig: JobSpyConfig = {
        search_terms: ['software engineer'],
        locations: ['San Francisco, CA'],
        job_sites: ['indeed'],
        results_wanted: 5,
        country: 'USA'
      };

      const result = await this.scrapeJobs(testConfig);
      
      if (result.success) {
        return {
          success: true,
          message: `JobSpy is working correctly. Found ${result.scraped_count} jobs, saved ${result.saved_count}.`
        };
      } else {
        return {
          success: false,
          message: `JobSpy test failed: ${result.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `JobSpy test error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Main daily scraping function that processes jobs from multiple sources
   * Returns detailed results similar to internship scraper
   */
  async scrapeJobsDaily(): Promise<JobScrapingResults> {
    console.log('🔄 Starting daily job scraping from multiple job sites...');
    const startTime = Date.now();

    try {
      // Use comprehensive configuration for daily scraping
      const config: JobSpyConfig = {
        search_terms: this.getAllSearchTerms(),
        locations: this.getAllLocations(),
        job_sites: this.DEFAULT_JOB_SITES.global,
        results_wanted: 50, // Balanced number to avoid rate limits
        country: 'USA'
      };

      console.log(`📊 Scraping with ${config.search_terms?.length} search terms across ${config.job_sites?.length} job sites`);
      
      // Execute the Python scraper
      const result = await this.scrapeJobs(config);
      
      if (!result.success) {
        throw new Error(result.error || 'JobSpy scraping failed');
      }

      console.log(`📊 Found ${result.scraped_count} jobs, ${result.saved_count} saved to database`);

      // Calculate results in the format expected by daily sync
      const results: JobScrapingResults = {
        totalFound: result.scraped_count || 0,
        newAdded: result.saved_count || 0,
        updated: 0, // The Python script handles deduplication
        deactivated: 0 // Could be enhanced in future
      };

      // Log sync results
      await this.logSyncResults(results, Date.now() - startTime, config);

      console.log(`✅ Daily job scraping completed: ${results.newAdded} new jobs added`);
      
      return results;

    } catch (error) {
      console.error('❌ Error during daily job scraping:', error);
      await this.logSyncError(error as Error, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Log successful sync results to database
   */
  private async logSyncResults(
    results: JobScrapingResults,
    processingTimeMs: number,
    config: JobSpyConfig
  ): Promise<void> {
    try {
      // Note: We would create a job_sync_log table similar to internship_sync_log
      // For now, just log to console for monitoring
      const logData: JobSyncLogEntry = {
        syncDate: new Date().toISOString().split('T')[0],
        totalJobsFound: results.totalFound,
        newJobsAdded: results.newAdded,
        jobsUpdated: results.updated,
        jobsDeactivated: results.deactivated,
        processingTimeMs,
        syncStatus: 'success',
        searchTerms: config.search_terms,
        jobSites: config.job_sites
      };
      
      console.log('📊 Job sync metrics:', JSON.stringify(logData, null, 2));
      
      // TODO: Save to job_sync_log table when implemented
    } catch (error) {
      console.error('Failed to log job sync results:', error);
    }
  }

  /**
   * Log sync error to database
   */
  private async logSyncError(error: Error, processingTimeMs: number): Promise<void> {
    try {
      const logData: JobSyncLogEntry = {
        syncDate: new Date().toISOString().split('T')[0],
        totalJobsFound: 0,
        newJobsAdded: 0,
        jobsUpdated: 0,
        jobsDeactivated: 0,
        processingTimeMs,
        syncStatus: 'failed',
        errorMessage: error.message
      };
      
      console.error('🚨 Job sync error log:', JSON.stringify(logData, null, 2));
      
      // TODO: Save to job_sync_log table when implemented
    } catch (logError) {
      console.error('Failed to log job sync error:', logError);
    }
  }

  /**
   * Get latest sync statistics from database
   */
  async getLatestSyncStats(): Promise<any> {
    try {
      // TODO: Implement when job_sync_log table is added
      // For now, return from scraped_jobs table
      const latest = await db
        .select({
          lastScraped: scrapedJobs.lastScraped,
          totalJobs: scrapedJobs.id
        })
        .from(scrapedJobs)
        .orderBy(desc(scrapedJobs.lastScraped))
        .limit(1);

      return latest[0] || null;
    } catch (error) {
      console.error('Failed to get job sync stats:', error);
      return null;
    }
  }

  /**
   * Get all search terms flattened from all categories
   */
  private getAllSearchTerms(): string[] {
    return Object.values(this.DEFAULT_SEARCH_TERMS).flat();
  }

  /**
   * Get all locations flattened from all countries
   */
  private getAllLocations(): string[] {
    return Object.values(this.DEFAULT_LOCATIONS).flat();
  }

  /**
   * Get search terms for a specific category
   */
  getSearchTermsByJobCategory(category: keyof typeof this.DEFAULT_SEARCH_TERMS): string[] {
    return this.DEFAULT_SEARCH_TERMS[category] || [];
  }

  /**
   * Get locations for a specific country
   */
  getLocationsByCountry(country: keyof typeof this.DEFAULT_LOCATIONS): string[] {
    return this.DEFAULT_LOCATIONS[country] || [];
  }

  /**
   * Get job sites for a specific country
   */
  getJobSitesByCountry(country: keyof typeof this.DEFAULT_JOB_SITES): string[] {
    return this.DEFAULT_JOB_SITES[country] || this.DEFAULT_JOB_SITES.global;
  }

  /**
   * Scrape jobs by category for specific country
   */
  async scrapeJobsByCategory(
    category: keyof typeof this.DEFAULT_SEARCH_TERMS,
    country: keyof typeof this.DEFAULT_LOCATIONS = 'US',
    resultsWanted: number = 25
  ): Promise<JobSpyResult> {
    const config: JobSpyConfig = {
      search_terms: this.getSearchTermsByJobCategory(category),
      locations: this.getLocationsByCountry(country),
      job_sites: this.getJobSitesByCountry(country),
      results_wanted: resultsWanted,
      country: country
    };

    return this.scrapeJobs(config);
  }

  /**
   * Enhanced international daily job scraping with comprehensive coverage
   */
  async runOptimizedDailyJobScraping(): Promise<JobSpyResult> {
    const optimizedConfig: JobSpyConfig = {
      search_terms: [
        // Core tech roles - high demand globally
        'software engineer', 'full stack developer', 'frontend developer', 'backend developer',
        'python developer', 'javascript developer', 'java developer', 'react developer',
        'data scientist', 'data engineer', 'data analyst', 'machine learning engineer',
        'devops engineer', 'cloud engineer', 'mobile developer', 'ai engineer',
        
        // Entry level for India market
        'junior software engineer', 'entry level developer', 'graduate trainee', 'fresher developer',
        'trainee software developer', 'associate software engineer', 'campus hire',
        
        // Business roles - international demand  
        'product manager', 'business analyst', 'project manager', 'account manager',
        'sales representative', 'digital marketing manager', 'operations manager',
        'financial analyst', 'consultant', 'hr manager', 'recruiter'
      ],
      locations: [
        // Top Indian tech hubs - major focus
        'Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India', 'Chennai, India',
        'Pune, India', 'Gurgaon, India', 'Noida, India', 'Kolkata, India', 'Ahmedabad, India',
        'India', 'Remote India',
        
        // Top US job markets
        'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Austin, TX', 'Seattle, WA',
        'Chicago, IL', 'Boston, MA', 'Denver, CO', 'Atlanta, GA', 'United States', 'Remote USA',
        
        // Major European tech hubs
        'London, UK', 'Manchester, UK', 'Berlin, Germany', 'Munich, Germany', 'Paris, France',
        'Amsterdam, Netherlands', 'Madrid, Spain', 'Barcelona, Spain', 'Milan, Italy', 'Dublin, Ireland',
        'Stockholm, Sweden', 'Copenhagen, Denmark', 'Remote Europe',
        
        // Global remote
        'Remote', 'Anywhere', 'Work from Home'
      ],
      job_sites: ['indeed', 'linkedin'], // Most reliable globally
      results_wanted: 100, // Increased for better coverage
      country: 'USA' // Will handle multiple countries in Python script
    };

    return this.scrapeJobs(optimizedConfig);
  }

  /**
   * Scrape jobs globally with intelligent rotation
   */
  async scrapeJobsGlobal(
    categories: (keyof typeof this.DEFAULT_SEARCH_TERMS)[] = ['tech', 'sales', 'marketing'],
    countries: (keyof typeof this.DEFAULT_LOCATIONS)[] = ['US', 'IN', 'GB'],
    resultsPerCategory: number = 25 // Increased from 20
  ): Promise<JobSpyResult[]> {
    const results: JobSpyResult[] = [];
    
    // Rotate through countries and categories to distribute load
    for (const country of countries) {
      for (const category of categories) {
        try {
          console.log(`🌍 Scraping ${category} jobs in ${country}...`);
          const result = await this.scrapeJobsByCategory(category, country, resultsPerCategory);
          results.push(result);
          
          // Add delay between requests to be respectful to job sites
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Failed to scrape ${category} jobs in ${country}:`, error);
          // Continue with other combinations even if one fails
        }
      }
    }
    
    return results;
  }

  /**
   * Get available job sites supported by JobSpy
   */
  getAvailableJobSites(): string[] {
    return this.DEFAULT_JOB_SITES.global;
  }

  /**
   * Get all job categories with their search terms
   */
  getAllJobCategories(): Record<string, string[]> {
    return {
      'Technology': this.DEFAULT_SEARCH_TERMS.tech,
      'Sales': this.DEFAULT_SEARCH_TERMS.sales,
      'Marketing': this.DEFAULT_SEARCH_TERMS.marketing,
      'Business': this.DEFAULT_SEARCH_TERMS.business,
      'Operations': this.DEFAULT_SEARCH_TERMS.operations,
      'Customer Success': this.DEFAULT_SEARCH_TERMS.customer_success,
      'Finance': this.DEFAULT_SEARCH_TERMS.finance,
      'Human Resources': this.DEFAULT_SEARCH_TERMS.hr,
      'Design': this.DEFAULT_SEARCH_TERMS.design,
      'Product': this.DEFAULT_SEARCH_TERMS.product
    };
  }

  /**
   * Get all countries with their locations
   */
  getAllCountries(): Record<string, string[]> {
    return {
      'United States': this.DEFAULT_LOCATIONS.US,
      'India': this.DEFAULT_LOCATIONS.IN,
      'United Kingdom': this.DEFAULT_LOCATIONS.GB,
      'Germany': this.DEFAULT_LOCATIONS.DE,
      'Australia': this.DEFAULT_LOCATIONS.AU,
      'France': this.DEFAULT_LOCATIONS.FR,
      'Spain': this.DEFAULT_LOCATIONS.ES,
      'UAE': this.DEFAULT_LOCATIONS.AE
    };
  }
}

export const jobSpyService = new JobSpyService();