import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

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

export class JobSpyService {
  private pythonPath: string;
  private scriptPath: string;

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
            // Parse the JSON result from stdout
            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const result = JSON.parse(lastLine);
            
            console.log('[JOBSPY_SERVICE] Scraping completed successfully');
            console.log('[JOBSPY_SERVICE] Result:', result);
            resolve(result);
          } catch (parseError) {
            console.error('[JOBSPY_SERVICE] Failed to parse result:', parseError);
            reject(new Error(`Failed to parse JobSpy result: ${parseError.message}`));
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
        message: `JobSpy test error: ${error.message}`
      };
    }
  }

  /**
   * Get available job sites supported by JobSpy
   */
  getAvailableJobSites(): string[] {
    return ['indeed', 'linkedin'];
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