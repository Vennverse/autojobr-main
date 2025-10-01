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
    // Technology roles
    tech: [
      'software engineer', 'frontend developer', 'backend developer', 'full stack developer',
      'data scientist', 'devops engineer', 'mobile developer', 'machine learning engineer',
      'cloud engineer', 'python developer', 'javascript developer', 'react developer',
      'node.js developer', 'data engineer', 'ai engineer', 'ui/ux designer'
    ],
    // Sales roles
    sales: [
      'account manager', 'sales representative', 'business development manager', 'sales director',
      'sales engineer', 'key account manager', 'inside sales', 'outside sales',
      'sales coordinator', 'territory manager'
    ],
    // Marketing roles
    marketing: [
      'digital marketing manager', 'content marketing manager', 'social media manager',
      'brand manager', 'marketing coordinator', 'seo specialist', 'ppc specialist',
      'email marketing manager', 'growth marketing manager', 'marketing analyst'
    ],
    // Business roles
    business: [
      'business analyst', 'operations manager', 'project manager', 'consultant',
      'strategy manager', 'business development', 'financial analyst',
      'operations coordinator', 'process improvement manager', 'business intelligence analyst'
    ],
    // Operations roles
    operations: [
      'operations manager', 'supply chain manager', 'logistics coordinator', 'process manager',
      'quality assurance manager', 'operations analyst', 'facility manager',
      'vendor manager', 'operations coordinator'
    ],
    // Customer Success roles
    customer_success: [
      'customer success manager', 'account manager', 'customer support manager',
      'client relations manager', 'customer experience manager', 'success coordinator'
    ],
    // Finance roles
    finance: [
      'financial analyst', 'accountant', 'finance manager', 'controller',
      'treasury analyst', 'investment analyst', 'credit analyst', 'budget analyst',
      'financial planning manager'
    ],
    // HR roles
    hr: [
      'hr manager', 'recruiter', 'hr business partner', 'talent acquisition specialist',
      'hr coordinator', 'training manager', 'compensation analyst',
      'employee relations manager', 'hr generalist'
    ],
    // Design roles
    design: [
      'graphic designer', 'creative director', 'brand designer', 'web designer',
      'marketing designer', 'visual designer', 'design manager'
    ],
    // Product roles
    product: [
      'product manager', 'product owner', 'product analyst', 'product marketing manager',
      'product designer', 'product coordinator'
    ]
  };
  
  private readonly DEFAULT_LOCATIONS = {
    // United States
    US: [
      'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Austin, TX',
      'Seattle, WA', 'Chicago, IL', 'Boston, MA', 'Denver, CO', 'Atlanta, GA',
      'Miami, FL', 'Phoenix, AZ', 'Philadelphia, PA', 'Dallas, TX', 'Houston, TX', 'Remote'
    ],
    // India
    IN: [
      'Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India',
      'Chennai, India', 'Pune, India', 'Kolkata, India', 'Ahmedabad, India',
      'Gurgaon, India', 'Noida, India', 'Jaipur, India', 'Kochi, India',
      'Indore, India', 'Nagpur, India', 'Visakhapatnam, India'
    ],
    // United Kingdom
    GB: [
      'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Leeds, UK',
      'Glasgow, UK', 'Liverpool, UK', 'Bristol, UK', 'Edinburgh, UK',
      'Sheffield, UK', 'Cardiff, UK'
    ],
    // Germany
    DE: [
      'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Cologne, Germany',
      'Frankfurt, Germany', 'Stuttgart, Germany', 'Düsseldorf, Germany',
      'Dortmund, Germany', 'Leipzig, Germany', 'Bremen, Germany'
    ],
    // Australia
    AU: [
      'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia',
      'Perth, Australia', 'Adelaide, Australia', 'Canberra, Australia',
      'Gold Coast, Australia', 'Newcastle, Australia', 'Wollongong, Australia',
      'Geelong, Australia'
    ],
    // France
    FR: [
      'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France',
      'Nice, France', 'Nantes, France', 'Strasbourg, France', 'Montpellier, France',
      'Bordeaux, France', 'Lille, France'
    ],
    // Spain
    ES: [
      'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain',
      'Bilbao, Spain', 'Málaga, Spain', 'Murcia, Spain', 'Las Palmas, Spain',
      'Palma, Spain', 'Zaragoza, Spain'
    ],
    // UAE
    AE: [
      'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Ajman, UAE',
      'Ras Al Khaimah, UAE', 'Fujairah, UAE', 'Umm Al Quwain, UAE'
    ]
  };
  
  private readonly DEFAULT_JOB_SITES = {
    // Global job sites (work in most countries)
    global: ['indeed', 'linkedin'],
    // US-specific job sites
    US: ['indeed', 'linkedin', 'zip_recruiter', 'glassdoor'],
    // India-specific job sites
    IN: ['indeed', 'linkedin', 'naukri'],
    // UK-specific job sites
    GB: ['indeed', 'linkedin'],
    // Germany-specific job sites
    DE: ['indeed', 'linkedin'],
    // Australia-specific job sites
    AU: ['indeed', 'linkedin'],
    // France-specific job sites
    FR: ['indeed', 'linkedin'],
    // Spain-specific job sites
    ES: ['indeed', 'linkedin'],
    // UAE-specific job sites
    AE: ['indeed', 'linkedin']
  };

  constructor() {
    this.pythonPath = 'python3';
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

      const pythonProcess = spawn(this.pythonPath, [this.scriptPath, configJson], {
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
   * Quick scrape with predefined tech job searches
   */
  async scrapeTechJobs(): Promise<JobSpyResult> {
    const config: JobSpyConfig = {
      search_terms: [
        'software engineer',
        'frontend developer', 
        'backend developer',
        'full stack developer',
        'data scientist',
        'devops engineer'
      ],
      locations: [
        'New York, NY',
        'San Francisco, CA', 
        'Los Angeles, CA',
        'Austin, TX',
        'Seattle, WA',
        'Remote'
      ],
      job_sites: ['indeed', 'linkedin'],
      results_wanted: 30,
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
   * Optimized daily job scraping with focus on high-traffic locations and popular roles
   */
  async runOptimizedDailyJobScraping(): Promise<JobSpyResult> {
    const optimizedConfig: JobSpyConfig = {
      search_terms: [
        // Most in-demand tech roles
        'software engineer', 'frontend developer', 'backend developer', 'full stack developer',
        'data scientist', 'devops engineer', 'mobile developer', 'python developer', 
        'react developer', 'node.js developer', 'data engineer', 'machine learning engineer',
        
        // High-volume business roles  
        'account manager', 'sales representative', 'business development manager',
        'digital marketing manager', 'content marketing manager', 'product manager',
        'business analyst', 'operations manager', 'project manager',
        'customer success manager', 'hr manager', 'recruiter'
      ],
      locations: [
        // Top US job markets
        'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Austin, TX', 'Seattle, WA',
        'Chicago, IL', 'Boston, MA', 'Denver, CO', 'Atlanta, GA', 'Remote',
        
        // Top India job markets  
        'Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India', 'Chennai, India',
        
        // Top UK markets
        'London, UK', 'Manchester, UK', 'Birmingham, UK',
        
        // Remote opportunities
        'Anywhere'
      ],
      job_sites: ['indeed', 'linkedin'], // Most reliable and fastest
      results_wanted: 50, // Increased for more jobs
      country: 'USA' // Will be mapped properly in Python script
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