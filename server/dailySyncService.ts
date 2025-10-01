import { internshipScrapingService } from './internshipScrapingService.js';
import { jobSpyService } from './jobspyService.js';

/**
 * Daily Synchronization Service
 * Handles automated daily synchronization of internship and job data
 */
export class DailySyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastSyncTime: Date | null = null;

  constructor() {
    this.init();
  }

  private init() {
    console.log('🔄 Daily Sync Service initialized');
    console.log('📋 Services configured:');
    console.log('   - Internship scraping from SimplifyJobs GitHub');
    console.log('   - Job scraping from major job sites (Indeed, LinkedIn, Naukri, etc.)');
    
    // Start the daily sync cycle
    this.startDailySync();
  }

  /**
   * Start the daily synchronization interval
   * Runs every 24 hours (86400000 ms)
   */
  private startDailySync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Run immediately on startup if no sync has happened today
    this.checkAndRunInitialSync();

    // Set up daily interval (24 hours)
    this.syncInterval = setInterval(() => {
      this.performDailySync();
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('📅 Daily sync interval started - will run every 24 hours');
  }

  /**
   * Check if we need to run initial sync on startup
   */
  private async checkAndRunInitialSync() {
    try {
      const latestSync = await internshipScrapingService.getLatestSyncStats();
      
      if (!latestSync) {
        console.log('🚀 No previous sync found - running initial sync');
        await this.performDailySync();
        return;
      }

      const lastSyncDate = new Date(latestSync.syncDate);
      const now = new Date();
      const hoursSinceLastSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

      // If last sync was more than 23 hours ago, run sync
      if (hoursSinceLastSync >= 23) {
        console.log(`🔄 Last sync was ${Math.round(hoursSinceLastSync)} hours ago - running sync`);
        await this.performDailySync();
      } else {
        console.log(`✅ Recent sync found (${Math.round(hoursSinceLastSync)} hours ago) - skipping initial sync`);
        this.lastSyncTime = lastSyncDate;
      }
    } catch (error) {
      console.error('❌ Error checking initial sync status:', error);
      // Run sync anyway to be safe
      await this.performDailySync();
    }
  }

  /**
   * Perform the daily synchronization for both internships and jobs
   */
  private async performDailySync() {
    if (this.isRunning) {
      console.log('⏳ Daily sync already running - skipping this cycle');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting daily data synchronization (internships + jobs)...');

    const overallStartTime = Date.now();
    const syncResults = {
      internships: null as any,
      jobs: null as any,
      errors: [] as string[]
    };

    try {
      // 1. Scrape internships first
      console.log('📚 Phase 1: Scraping internships...');
      try {
        const internshipResults = await internshipScrapingService.scrapeInternships();
        syncResults.internships = internshipResults;
        console.log(`✅ Internships: ${internshipResults.newAdded} new, ${internshipResults.updated} updated`);
      } catch (error) {
        const errorMsg = `Internship scraping failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error('❌', errorMsg);
        syncResults.errors.push(errorMsg);
      }

      // 2. Scrape jobs second - Enhanced international scraping
      console.log('💼 Phase 2: Scraping jobs from major international job sites...');
      try {
        // Use the enhanced optimized scraping for better international coverage
        const jobResults = await jobSpyService.runOptimizedDailyJobScraping();
        
        // Convert JobSpyResult to JobScrapingResults format
        const formattedResults = {
          totalFound: jobResults.scraped_count || 0,
          newAdded: jobResults.saved_count || 0,
          updated: 0,
          deactivated: 0
        };
        
        syncResults.jobs = formattedResults;
        console.log(`✅ Jobs: ${formattedResults.newAdded} new from India, USA, and Europe via ${jobSpyService.getAvailableJobSites().join(', ')}`);
        
        // Log geographic coverage if available
        if (jobResults.coverage) {
          console.log(`📍 Geographic coverage - India: ${jobResults.coverage.india_jobs}, USA: ${jobResults.coverage.usa_jobs}, Europe: ${jobResults.coverage.europe_jobs}`);
        }
      } catch (error) {
        const errorMsg = `Job scraping failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error('❌', errorMsg);
        syncResults.errors.push(errorMsg);
      }

      const totalDuration = Date.now() - overallStartTime;
      this.lastSyncTime = new Date();

      // Calculate combined metrics
      const combinedResults = {
        internships: syncResults.internships || { totalFound: 0, newAdded: 0, updated: 0, deactivated: 0 },
        jobs: syncResults.jobs || { totalFound: 0, newAdded: 0, updated: 0, deactivated: 0 },
        totalDuration,
        errors: syncResults.errors
      };

      if (syncResults.errors.length === 0) {
        console.log(`🎉 Daily sync completed successfully in ${totalDuration}ms`);
      } else {
        console.log(`⚠️ Daily sync completed with ${syncResults.errors.length} error(s) in ${totalDuration}ms`);
      }

      // Log success to help with monitoring
      this.logSyncSuccess(combinedResults, totalDuration);

    } catch (error) {
      console.error('❌ Daily sync failed:', error);
      this.logSyncError(error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Log successful sync for monitoring
   */
  private logSyncSuccess(results: any, duration: number) {
    const logData = {
      timestamp: new Date().toISOString(),
      status: 'success',
      duration: `${duration}ms`,
      metrics: {
        internships: {
          totalFound: results.internships?.totalFound || 0,
          newAdded: results.internships?.newAdded || 0,
          updated: results.internships?.updated || 0,
          deactivated: results.internships?.deactivated || 0
        },
        jobs: {
          totalFound: results.jobs?.totalFound || 0,
          newAdded: results.jobs?.newAdded || 0,
          updated: results.jobs?.updated || 0,
          deactivated: results.jobs?.deactivated || 0
        },
        errors: results.errors || [],
        totalNewData: (results.internships?.newAdded || 0) + (results.jobs?.newAdded || 0)
      }
    };

    console.log('📊 Daily sync metrics:', JSON.stringify(logData, null, 2));
  }

  /**
   * Log sync errors for monitoring
   */
  private logSyncError(error: any) {
    const logData = {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    };

    console.error('🚨 Daily sync error log:', JSON.stringify(logData, null, 2));
  }

  /**
   * Manually trigger a sync (for admin use)
   */
  public async triggerManualSync(): Promise<any> {
    if (this.isRunning) {
      throw new Error('Sync already running - please wait for completion');
    }

    console.log('🔧 Manual sync triggered');
    await this.performDailySync();
    return this.getStatus();
  }

  /**
   * Get current sync status
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      nextSyncTime: this.lastSyncTime ? 
        new Date(this.lastSyncTime.getTime() + 24 * 60 * 60 * 1000) : 
        'Unknown',
      intervalActive: !!this.syncInterval
    };
  }

  /**
   * Stop the daily sync service
   */
  public stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('🛑 Daily sync service stopped');
  }

  /**
   * Restart the daily sync service
   */
  public restart() {
    console.log('🔄 Restarting daily sync service...');
    this.stop();
    this.startDailySync();
  }
}

// Export singleton instance
export const dailySyncService = new DailySyncService();