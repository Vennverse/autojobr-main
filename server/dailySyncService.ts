import { internshipScrapingService } from './internshipScrapingService.js';

/**
 * Daily Synchronization Service
 * Handles automated daily synchronization of internship data
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
   * Perform the daily synchronization
   */
  private async performDailySync() {
    if (this.isRunning) {
      console.log('⏳ Daily sync already running - skipping this cycle');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting daily internship synchronization...');

    try {
      const startTime = Date.now();
      const results = await internshipScrapingService.scrapeInternships();
      const duration = Date.now() - startTime;

      this.lastSyncTime = new Date();

      console.log(`✅ Daily sync completed successfully in ${duration}ms:`, {
        totalFound: results.totalFound,
        newAdded: results.newAdded,
        updated: results.updated,
        deactivated: results.deactivated
      });

      // Log success to help with monitoring
      this.logSyncSuccess(results, duration);

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
        totalFound: results.totalFound,
        newAdded: results.newAdded,
        updated: results.updated,
        deactivated: results.deactivated
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