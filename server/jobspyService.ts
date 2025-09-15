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
  private readonly DEFAULT_SEARCH_TERMS = [
    'software engineer',
    'frontend developer', 
    'backend developer',
    'full stack developer',
    'data scientist',
    'devops engineer',
    'product manager',
    'ux designer',
    'mobile developer',
    'machine learning engineer',
    'cloud engineer',
    'python developer',
    'javascript developer',
    'react developer',
    'node.js developer'
  ];
  
  private readonly DEFAULT_LOCATIONS = [
    'New York, NY',
    'San Francisco, CA', 
    'Los Angeles, CA',
    'Austin, TX',
    'Seattle, WA',
    'Chicago, IL',
    'Boston, MA',
    'Remote',
    'Mumbai, India',
    'Bangalore, India',
    'Delhi, India',
    'Hyderabad, India',
    'Pune, India'
  ];
  
  private readonly DEFAULT_JOB_SITES = ['indeed', 'linkedin', 'zip_recruiter', 'glassdoor', 'naukri'];

  constructor() {
    this.pythonPath = 'python3';
    this.scriptPath = path.join(__dirname, 'jobspy_scraper.py');
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
        search_terms: this.DEFAULT_SEARCH_TERMS,
        locations: this.DEFAULT_LOCATIONS,
        job_sites: this.DEFAULT_JOB_SITES,
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
   * Get available job sites supported by JobSpy
   */
  getAvailableJobSites(): string[] {
    return this.DEFAULT_JOB_SITES;
  }

  /**
   * Get common search terms for different categories
   */
  getSearchTermsByCategory(): Record<string, string[]> {
    return {
      'Software Engineering': [
        'software engineer',
        'software developer',
        'frontend developer',
        'backend developer',
        'full stack developer',
        'web developer',
        'mobile developer'
      ],
      'Data & AI': [
        'data scientist',
        'data engineer',
        'data analyst',
        'machine learning engineer',
        'ai engineer',
        'research scientist'
      ],
      'DevOps & Infrastructure': [
        'devops engineer',
        'site reliability engineer',
        'platform engineer',
        'cloud engineer',
        'infrastructure engineer'
      ],
      'Product & Design': [
        'product manager',
        'ux designer',
        'ui designer',
        'product designer',
        'design systems'
      ],
      'Marketing & Sales': [
        'marketing manager',
        'growth manager',
        'content marketing',
        'digital marketing',
        'sales engineer'
      ]
    };
  }
}

export const jobSpyService = new JobSpyService();