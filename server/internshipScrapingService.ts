import axios from 'axios';
import { load } from 'cheerio';
import { db } from './db';
import { scrapedInternships, internshipSyncLog } from '@shared/schema';
import { eq, and, desc, notInArray } from 'drizzle-orm';

export interface GitHubInternshipEntry {
  company: string;
  role: string;
  location: string;
  applicationUrl?: string;
  requirements?: string[];
  season?: string;
  simplifyApplyUrl?: string;
}

export class InternshipScrapingService {
  private readonly GITHUB_REPO_URL = 'https://api.github.com/repos/SimplifyJobs/Summer2026-Internships/contents/README.md';
  private readonly RAW_GITHUB_URL = 'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md';

  /**
   * Main scraping function that processes the SimplifyJobs GitHub repository
   * Returns the number of internships processed
   */
  async scrapeInternships(): Promise<{
    totalFound: number;
    newAdded: number;
    updated: number;
    deactivated: number;
  }> {
    console.log('🔄 Starting internship scraping from SimplifyJobs GitHub repository...');
    const startTime = Date.now();

    try {
      // Fetch the README content from GitHub
      const markdownContent = await this.fetchGitHubReadme();
      
      // Parse internships from content (auto-detect format)
      const internships = this.parseInternshipsFromContent(markdownContent);
      
      console.log(`📊 Found ${internships.length} internships in GitHub repository`);

      // Process internships and update database
      const results = await this.processInternships(internships, markdownContent);

      // Log sync results
      await this.logSyncResults(results, Date.now() - startTime);

      console.log(`✅ Internship scraping completed: ${results.newAdded} new, ${results.updated} updated, ${results.deactivated} deactivated`);
      
      return results;

    } catch (error) {
      console.error('❌ Error during internship scraping:', error);
      await this.logSyncError(error as Error, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Fetch README content from GitHub repository
   */
  private async fetchGitHubReadme(): Promise<string> {
    try {
      // Try raw GitHub URL first (faster)
      const response = await axios.get(this.RAW_GITHUB_URL, {
        timeout: 30000,
        headers: {
          'User-Agent': 'AutoJobr-InternshipScraper/1.0'
        }
      });
      
      return response.data;
    } catch (error) {
      console.log('⚠️ Raw URL failed, trying GitHub API...');
      
      // Fallback to GitHub API
      const response = await axios.get(this.GITHUB_REPO_URL, {
        timeout: 30000,
        headers: {
          'User-Agent': 'AutoJobr-InternshipScraper/1.0',
          'Accept': 'application/vnd.github.v3.raw'
        }
      });

      // GitHub API returns base64 encoded content
      if (typeof response.data === 'object' && response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      return response.data;
    }
  }

  /**
   * Parse internships from content with auto-detection
   * Handles both HTML tables (new format) and markdown tables (legacy)
   */
  private parseInternshipsFromContent(content: string): GitHubInternshipEntry[] {
    // Auto-detect format based on content
    if (content.includes('<table')) {
      console.log('🔍 Detected HTML table format - using HTML parser');
      return this.parseInternshipsFromHtml(content);
    } else {
      console.log('🔍 Detected markdown format - using markdown parser');
      return this.parseInternshipsFromMarkdown(content);
    }
  }

  /**
   * Parse internships from HTML tables (new Summer2026 format)
   * Handles styled HTML tables with multiple sections
   */
  private parseInternshipsFromHtml(content: string): GitHubInternshipEntry[] {
    const internships: GitHubInternshipEntry[] = [];
    
    try {
      const $ = load(content);
      let lastCompany = '';

      // Find all table rows in tbody sections
      $('table tbody tr').each((_, row) => {
        try {
          const tds = $(row).find('td');
          
          // Skip if not enough columns
          if (tds.length < 3) return;

          // Extract company (handle continuation rows with ↳)
          const companyText = $(tds[0]).text().trim();
          let company: string;
          
          if (companyText === '↳' || companyText === '') {
            company = lastCompany; // Use previous company
          } else {
            // Extract company name, removing HTML links if present
            company = $(tds[0]).find('strong').text().trim() || companyText;
            lastCompany = company;
          }

          // Extract role
          const role = $(tds[1]).text().trim();

          // Extract location (handle <br> tags)
          let location = $(tds[2]).html() || '';
          location = location.replace(/<br\s*\/?>/gi, ', ').replace(/<[^>]*>/g, '').trim();

          // Skip if essential data is missing
          if (!company || !role || company === 'Company' || role === 'Role') {
            return;
          }

          // Extract application URLs
          let applicationUrl: string | undefined;
          let simplifyApplyUrl: string | undefined;

          // Check role column for links first
          const roleLink = $(tds[1]).find('a').first();
          if (roleLink.length && roleLink.attr('href')) {
            applicationUrl = roleLink.attr('href');
          }

          // Check application column (usually tds[3])
          if (tds.length > 3) {
            $(tds[3]).find('a').each((_, link) => {
              const href = $(link).attr('href');
              if (href) {
                if (href.includes('simplify.jobs')) {
                  simplifyApplyUrl = href;
                } else if (!applicationUrl) {
                  applicationUrl = href;
                }
              }
            });
          }

          // Extract requirements by scanning all row text
          const requirements: string[] = [];
          const fullRowText = $(row).text().toLowerCase();
          const requirementKeywords = ['citizen', 'visa', 'sponsor', 'clearance', '🛂'];
          
          for (const keyword of requirementKeywords) {
            if (fullRowText.includes(keyword)) {
              requirements.push(keyword);
            }
          }

          // Determine season from URLs
          let season: string | undefined;
          const allUrls = [applicationUrl, simplifyApplyUrl].filter(Boolean);
          for (const url of allUrls) {
            if (url?.includes('2025')) {
              season = 'Summer 2025';
              break;
            } else if (url?.includes('2026')) {
              season = 'Summer 2026';
              break;
            }
          }

          // Create internship entry
          const internship: GitHubInternshipEntry = {
            company: company.substring(0, 255),
            role: role.substring(0, 255),
            location: location.substring(0, 255),
            applicationUrl,
            requirements: requirements.length > 0 ? requirements : undefined,
            season,
            simplifyApplyUrl
          };

          internships.push(internship);

        } catch (error) {
          console.warn(`⚠️ Failed to parse HTML table row:`, error);
        }
      });

    } catch (error) {
      console.error(`❌ Error parsing HTML content:`, error);
    }

    if (internships.length === 0) {
      console.warn('⚠️ Could not find internship HTML table in README');
    }

    return internships;
  }

  /**
   * Parse internships from markdown table (legacy format)
   * Handles the complex table format used by SimplifyJobs
   */
  private parseInternshipsFromMarkdown(content: string): GitHubInternshipEntry[] {
    const internships: GitHubInternshipEntry[] = [];
    
    // Find the table section (usually starts after "| Company | Role | Location |")
    const lines = content.split('\n');
    let tableStartIndex = -1;
    
    // Look for table header
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('| Company |') && line.includes('| Role |') && line.includes('| Location |')) {
        tableStartIndex = i + 2; // Skip header and separator line
        break;
      }
    }

    if (tableStartIndex === -1) {
      console.warn('⚠️ Could not find internship table in README');
      return internships;
    }

    // Process each table row
    for (let i = tableStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Stop at end of table or empty lines
      if (!line || !line.startsWith('|') || line === '|---|---|---|---|---|---|---|') {
        if (internships.length > 0) break; // End of table
        continue;
      }

      try {
        const internship = this.parseTableRow(line);
        if (internship) {
          internships.push(internship);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse line: ${line}`, error);
        continue;
      }
    }

    return internships;
  }

  /**
   * Parse a single table row into an internship entry
   */
  private parseTableRow(line: string): GitHubInternshipEntry | null {
    // Split by | and clean up
    const columns = line.split('|').map(col => col.trim()).filter(col => col);
    
    if (columns.length < 3) {
      return null; // Need at least company, role, location
    }

    // CRITICAL FIX: Extract URLs BEFORE cleaning markdown text
    let applicationUrl: string | undefined;
    let simplifyApplyUrl: string | undefined;

    // Look for links in role column (before cleaning)
    const roleMatch = columns[1]?.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (roleMatch) {
      applicationUrl = roleMatch[2];
    }

    // Look for Simplify link in additional columns (before cleaning)
    for (let i = 3; i < columns.length; i++) {
      const col = columns[i];
      if (col.includes('simplify.jobs') || col.includes('Simplify')) {
        const simplifyMatch = col.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (simplifyMatch) {
          simplifyApplyUrl = simplifyMatch[2];
        }
      }
    }

    // Now clean the text for display purposes
    const company = this.cleanMarkdownText(columns[0]);
    const role = this.cleanMarkdownText(columns[1]);
    const location = this.cleanMarkdownText(columns[2]);

    // Skip if essential data is missing
    if (!company || !role || company === 'Company' || role === 'Role') {
      return null;
    }

    // Extract requirements and other metadata
    const requirements: string[] = [];
    
    // Look for citizenship/visa requirements
    for (const col of columns) {
      if (col.toLowerCase().includes('citizen') || 
          col.toLowerCase().includes('visa') || 
          col.toLowerCase().includes('sponsor')) {
        requirements.push(this.cleanMarkdownText(col));
      }
    }

    // Determine season (could be in URL or inferred from current date)
    let season: string | undefined;
    if (applicationUrl?.includes('2025') || simplifyApplyUrl?.includes('2025')) {
      season = 'Summer 2025';
    } else if (applicationUrl?.includes('2026') || simplifyApplyUrl?.includes('2026')) {
      season = 'Summer 2026';
    }

    return {
      company: company.substring(0, 255), // Ensure it fits in varchar
      role: role.substring(0, 255),
      location: location.substring(0, 255),
      applicationUrl,
      requirements: requirements.length > 0 ? requirements : undefined,
      season,
      simplifyApplyUrl
    };
  }

  /**
   * Clean markdown text by removing formatting
   */
  private cleanMarkdownText(text: string): string {
    return text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code formatting
      .replace(/^\s*\*\s*/, '') // Remove bullet points
      .trim();
  }

  /**
   * Process scraped internships and update database
   */
  private async processInternships(
    internships: GitHubInternshipEntry[],
    rawMarkdown: string
  ): Promise<{
    totalFound: number;
    newAdded: number;
    updated: number;
    deactivated: number;
  }> {
    let newAdded = 0;
    let updated = 0;

    for (const internship of internships) {
      try {
        // Generate external ID for deduplication
        const externalId = this.generateExternalId(internship);

        // Check if internship already exists
        const existing = await db
          .select()
          .from(scrapedInternships)
          .where(
            and(
              eq(scrapedInternships.sourcePlatform, 'github_simplifyjobs'),
              eq(scrapedInternships.externalId, externalId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing internship
          await db
            .update(scrapedInternships)
            .set({
              company: internship.company,
              role: internship.role,
              location: internship.location,
              applicationUrl: internship.applicationUrl,
              requirements: internship.requirements,
              season: internship.season,
              simplifyApplyUrl: internship.simplifyApplyUrl,
              isActive: true,
              updatedAt: new Date(),
              rawMarkdownData: rawMarkdown.substring(0, 50000) // Limit size
            })
            .where(eq(scrapedInternships.id, existing[0].id));
          
          updated++;
        } else {
          // Insert new internship
          await db.insert(scrapedInternships).values({
            company: internship.company,
            role: internship.role,
            location: internship.location,
            applicationUrl: internship.applicationUrl,
            requirements: internship.requirements,
            season: internship.season,
            simplifyApplyUrl: internship.simplifyApplyUrl,
            sourcePlatform: 'github_simplifyjobs',
            sourceUrl: this.RAW_GITHUB_URL,
            externalId,
            isActive: true,
            datePosted: new Date(),
            rawMarkdownData: rawMarkdown.substring(0, 50000),
            viewsCount: 0,
            clicksCount: 0
          });
          
          newAdded++;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to process internship: ${internship.company} - ${internship.role}`, error);
        continue;
      }
    }

    // CRITICAL FIX: Properly deactivate internships that are no longer in the source
    const currentExternalIds = internships.map(i => this.generateExternalId(i));
    let deactivated = 0;
    
    if (currentExternalIds.length > 0) {
      const deactivatedResult = await db
        .update(scrapedInternships)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(scrapedInternships.sourcePlatform, 'github_simplifyjobs'),
            eq(scrapedInternships.isActive, true),
            notInArray(scrapedInternships.externalId, currentExternalIds)
          )
        );
      
      deactivated = deactivatedResult.rowCount || 0;
    } else {
      // If no internships found, deactivate all from this source
      const deactivatedResult = await db
        .update(scrapedInternships)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(scrapedInternships.sourcePlatform, 'github_simplifyjobs'),
            eq(scrapedInternships.isActive, true)
          )
        );
      
      deactivated = deactivatedResult.rowCount || 0;
    }

    return {
      totalFound: internships.length,
      newAdded,
      updated,
      deactivated
    };
  }

  /**
   * Generate a unique external ID for deduplication
   */
  private generateExternalId(internship: GitHubInternshipEntry): string {
    // Create a hash-like ID from company + role + location
    const key = `${internship.company}-${internship.role}-${internship.location}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return key.substring(0, 100); // Limit length
  }

  /**
   * Log successful sync results
   */
  private async logSyncResults(
    results: { totalFound: number; newAdded: number; updated: number; deactivated: number },
    processingTimeMs: number
  ): Promise<void> {
    try {
      await db.insert(internshipSyncLog).values({
        syncDate: new Date().toISOString().split('T')[0],
        totalInternshipsFound: results.totalFound,
        newInternshipsAdded: results.newAdded,
        internshipsUpdated: results.updated,
        internshipsDeactivated: results.deactivated,
        processingTimeMs,
        syncStatus: 'success'
      });
    } catch (error) {
      console.error('Failed to log sync results:', error);
    }
  }

  /**
   * Log sync error
   */
  private async logSyncError(error: Error, processingTimeMs: number): Promise<void> {
    try {
      await db.insert(internshipSyncLog).values({
        syncDate: new Date().toISOString().split('T')[0],
        totalInternshipsFound: 0,
        newInternshipsAdded: 0,
        internshipsUpdated: 0,
        internshipsDeactivated: 0,
        processingTimeMs,
        syncStatus: 'failed',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }
  }

  /**
   * Get latest sync statistics
   */
  async getLatestSyncStats(): Promise<any> {
    try {
      const latest = await db
        .select()
        .from(internshipSyncLog)
        .orderBy(desc(internshipSyncLog.createdAt))
        .limit(1);

      return latest[0] || null;
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const internshipScrapingService = new InternshipScrapingService();