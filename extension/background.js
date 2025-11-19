// Enhanced AutoJobr Autopilot Background Service Worker
console.log('🚀 AutoJobr Autopilot v3.0 loading...');

// Import helper modules
importScripts('autopilot-engine.js', 'resume-optimizer.js', 'referral-finder.js', 'profile-cache.js', 'match-engine.js');

class AutoJobrBackground {
  constructor() {
    this.apiUrl = 'https://autojobr.com';
    this.cache = new Map();
    this.rateLimiter = new Map();
    this.autopilot = null;
    this.resumeOptimizer = null;
    this.referralFinder = null;
    this.profileCache = null;
    this.matchEngine = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.detectApiUrl();
    this.setupPeriodicTasks();

    // Initialize new modules
    this.autopilot = new AutopilotEngine();
    this.resumeOptimizer = new ResumeOptimizer();
    this.referralFinder = new ReferralFinder();
    this.profileCache = new ProfileCache();
    this.matchEngine = new MatchEngine();

    // Setup cookie synchronization for better auth
    this.setupCookieSync();

    // Load cached profile on startup
    await this.ensureCachedProfile();

    console.log('🚀 AutoJobr Autopilot v3.0 initialized with XPath ATS detection, alarms, webRequest monitoring, and cookie sync');
  }

  setupCookieSync() {
    if (!chrome.cookies) {
      console.log('[AutoJobr] cookies API not available');
      return;
    }

    try {
      // Monitor cookies for auth changes
      chrome.cookies.onChanged.addListener((changeInfo) => {
        this.handleCookieChange(changeInfo);
      });
      console.log('[AutoJobr] Cookie synchronization enabled');
    } catch (error) {
      console.error('[AutoJobr] Failed to setup cookie sync:', error);
    }
  }

  async handleCookieChange(changeInfo) {
    const { cookie, removed } = changeInfo;

    // Track authentication cookies from our API
    if (cookie.domain.includes('autojobr.com') && cookie.name === 'session') {
      if (removed) {
        console.log('[AutoJobr] User logged out - clearing cache');
        await this.profileCache.invalidate();
        this.cache.clear();
      } else {
        console.log('[AutoJobr] Session updated - refreshing profile');
        await this.ensureCachedProfile();
      }
    }
  }

  async getCookies(domain) {
    if (!chrome.cookies) return [];

    try {
      const cookies = await chrome.cookies.getAll({ domain });
      return cookies;
    } catch (error) {
      console.error('[AutoJobr] Failed to get cookies:', error);
      return [];
    }
  }

  async setCookie(cookie) {
    if (!chrome.cookies) return false;

    try {
      await chrome.cookies.set(cookie);
      return true;
    } catch (error) {
      console.error('[AutoJobr] Failed to set cookie:', error);
      return false;
    }
  }

  async detectApiUrl() {
    // Try multiple URLs in order: development (localhost/Replit) first, then production
    const urlsToTry = [
      'http://localhost:5000',  // Local development
      'https://autojobr.com'     // Production
    ];

    // Check if we're on a Replit domain and add it to the list
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        const hostname = new URL(tabs[0].url).hostname;
        if (hostname.includes('.replit.dev') || hostname.includes('.replit.app')) {
          // Extract the Replit domain from current tab or construct from known patterns
          const replitUrl = `https://${hostname}`;
          urlsToTry.unshift(replitUrl);
        }
      }
    } catch (e) {
      console.log('Could not detect Replit URL from tabs');
    }

    // Try each URL until one works
    for (const url of urlsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${url}/api/health`, { 
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok' || data.message) {
            this.apiUrl = url;
            console.log('✅ Connected to AutoJobr server:', this.apiUrl);

            // Update stored API URL
            await chrome.storage.sync.set({ apiUrl: this.apiUrl });

            // Notify content scripts of successful connection
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach(tab => {
                if (tab.id) {
                  chrome.tabs.sendMessage(tab.id, {
                    action: 'apiConnected',
                    apiUrl: this.apiUrl
                  }).catch(() => {}); // Ignore errors for tabs without content script
                }
              });
            });

            return; // Successfully connected, exit
          }
        }
      } catch (error) {
        console.log(`Failed to connect to ${url}:`, error.message);
      }
    }

    // If no URLs worked, use production as default
    this.apiUrl = 'https://autojobr.com';
    console.log('⚠️ Could not connect to any server, using default:', this.apiUrl);
  }

  setupEventListeners() {
    // Handle extension install/update
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
      // Setup context menus
      this.setupContextMenus();
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indicates async response
    });

    // Handle tab updates to detect job pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Handle navigation completed
    if (chrome.webNavigation) {
      chrome.webNavigation.onCompleted.addListener((details) => {
        if (details.frameId === 0) {
          this.handleNavigationCompleted(details);
        }
      });
    }

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  setupPeriodicTasks() {
    // Use Alarms API for reliable scheduled tasks (better than setInterval for extensions)
    this.setupAlarms();

    // Setup webRequest monitoring for application tracking
    this.setupWebRequestMonitoring();

    // Legacy intervals as fallback
    setInterval(() => this.cleanCache(), 5 * 60 * 1000);
    setInterval(() => this.cleanRateLimiter(), 60 * 1000);
  }

  setupAlarms() {
    // Daily resume optimization check (9 AM)
    chrome.alarms.create('dailyResumeCheck', {
      when: this.getNextScheduledTime(9, 0),
      periodInMinutes: 1440 // 24 hours
    });

    // Application reminder check (every 4 hours)
    chrome.alarms.create('applicationReminder', {
      periodInMinutes: 240
    });

    // Cache cleanup (every 30 minutes)
    chrome.alarms.create('cacheCleanup', {
      periodInMinutes: 30
    });

    // User data sync (every 10 minutes)
    chrome.alarms.create('userDataSync', {
      periodInMinutes: 10
    });

    // Handle alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });
  }

  getNextScheduledTime(hour, minute) {
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hour, minute, 0, 0);

    if (scheduled < now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    return scheduled.getTime();
  }

  async handleAlarm(alarm) {
    console.log('[AutoJobr] Alarm triggered:', alarm.name);

    switch (alarm.name) {
      case 'dailyResumeCheck':
        await this.performDailyResumeCheck();
        break;
      case 'applicationReminder':
        await this.checkApplicationReminders();
        break;
      case 'cacheCleanup':
        this.cleanCache();
        break;
      case 'userDataSync':
        await this.syncUserData();
        break;
    }
  }

  async performDailyResumeCheck() {
    try {
      const profile = await this.getCachedProfile();
      if (!profile || !profile.authenticated) return;

      // Notify user about resume optimization opportunities
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Daily Resume Check',
        message: 'Review your resume optimization opportunities for today.',
        priority: 1
      });
    } catch (error) {
      console.error('[AutoJobr] Daily resume check failed:', error);
    }
  }

  async checkApplicationReminders() {
    try {
      // Check for pending applications that need follow-up
      const response = await fetch(`${this.apiUrl}/api/applications/pending-reminders`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reminders && data.reminders.length > 0) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Application Reminders',
            message: `You have ${data.reminders.length} pending follow-ups.`,
            priority: 2
          });
        }
      }
    } catch (error) {
      console.error('[AutoJobr] Application reminder check failed:', error);
    }
  }

  setupWebRequestMonitoring() {
    if (!chrome.webRequest) {
      console.log('[AutoJobr] webRequest API not available');
      return;
    }

    try {
      // Monitor application submissions to track success/failure - SCOPED to known ATS domains
      chrome.webRequest.onCompleted.addListener(
        (details) => {
          this.handleApplicationSubmission(details);
        },
        {
          urls: [
            '*://boards.greenhouse.io/*/jobs/*/application*',
            '*://boards.eu.greenhouse.io/*/jobs/*/application*',
            '*://jobs.lever.co/*/apply*',
            '*://jobs.eu.lever.co/*/apply*',
            '*://*.myworkdayjobs.com/*/application*',
            '*://*.taleo.net/*/jobapply*',
            '*://*.icims.com/jobs/*/apply*',
            '*://*.smartrecruiters.com/*/jobs/*/application*',
            '*://jobs.ashbyhq.com/*/application*',
            '*://*.bamboohr.com/jobs/apply*',
            '*://jobs.jobvite.com/*/apply*'
          ],
          types: ['xmlhttprequest']
        }
      );

      // Monitor for errors during application submission - SCOPED to ATS domains only
      chrome.webRequest.onErrorOccurred.addListener(
        (details) => {
          this.handleApplicationError(details);
        },
        {
          urls: [
            '*://boards.greenhouse.io/*',
            '*://jobs.lever.co/*',
            '*://*.myworkdayjobs.com/*',
            '*://*.taleo.net/*',
            '*://*.icims.com/*',
            '*://*.smartrecruiters.com/*'
          ],
          types: ['xmlhttprequest']
        }
      );

      console.log('[AutoJobr] WebRequest monitoring enabled for ATS domains');
    } catch (error) {
      console.error('[AutoJobr] Failed to setup webRequest monitoring:', error);
    }
  }

  async handleApplicationSubmission(details) {
    if (details.statusCode >= 200 && details.statusCode < 300) {
      console.log('[AutoJobr] Application submission detected:', details.url);

      // Track successful submission
      try {
        await fetch(`${this.apiUrl}/api/applications/track-submission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            url: details.url,
            timestamp: new Date().toISOString(),
            statusCode: details.statusCode
          })
        });
      } catch (error) {
        console.error('[AutoJobr] Failed to track submission:', error);
      }
    }
  }

  async handleApplicationError(details) {
    console.warn('[AutoJobr] Application submission error:', details);

    // Notify content script about the error
    try {
      chrome.tabs.sendMessage(details.tabId, {
        action: 'submissionError',
        error: details.error
      });
    } catch (error) {
      // Tab might not have content script
    }
  }

  async handleInstall() {
    // Set default settings
    const defaultSettings = {
      autofillEnabled: true,
      trackingEnabled: true,
      notificationsEnabled: true,
      smartAnalysis: true,
      autoSaveJobs: false,
      apiUrl: this.apiUrl,
      theme: 'light',
      shortcuts: {
        autofill: 'Ctrl+Shift+A',
        analyze: 'Ctrl+Shift+J',
        saveJob: 'Ctrl+Shift+S'
      }
    };

    await chrome.storage.sync.set(defaultSettings);

    // Create context menus
    this.createContextMenus();

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr Installed! 🎉',
      message: 'Start auto-filling job applications on 100+ job boards. Click the extension icon to get started.',
      buttons: [
        { title: 'Get Started' },
        { title: 'View Tutorial' }
      ]
    });

    // Open onboarding page
    chrome.tabs.create({
      url: `${this.apiUrl}/onboarding?source=extension&version=2.0`
    });
  }

  async handleUpdate(previousVersion) {
    console.log(`Updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);

    // Migration logic for different versions
    if (previousVersion < '2.0.0') {
      await this.migrateToV2();
    }

    // Show update notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr Updated! ✨',
      message: 'New features: Enhanced UI, better job matching, and improved auto-fill accuracy.',
      buttons: [
        { title: 'See What\'s New' },
        { title: 'Dismiss' }
      ]
    });
  }

  async migrateToV2() {
    // Migrate old settings to new format
    const oldSettings = await chrome.storage.sync.get();
    const newSettings = {
      ...oldSettings,
      smartAnalysis: true,
      autoSaveJobs: false,
      theme: 'light'
    };

    await chrome.storage.sync.set(newSettings);
    console.log('✅ Migrated settings to v2.0');
  }

  setupContextMenus() {
    this.createContextMenus();
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'autofill-form':
        chrome.tabs.sendMessage(tab.id, { action: 'autofillForm' });
        break;
      case 'analyze-job':
        chrome.tabs.sendMessage(tab.id, { action: 'analyzeJob' });
        break;
      case 'save-job':
        chrome.tabs.sendMessage(tab.id, { action: 'saveJob' });
        break;
      case 'generate-cover-letter':
        chrome.tabs.sendMessage(tab.id, { action: 'generateCoverLetter' });
        break;
      case 'bulk-apply':
        chrome.tabs.sendMessage(tab.id, { action: 'startBulkApply' });
        break;
      case 'open-dashboard':
        chrome.tabs.create({ url: `${this.apiUrl}/dashboard` });
        break;
    }
  }

  async ensureOffscreenDocument() {
    if (!chrome.offscreen) {
      console.log('[AutoJobr] offscreen API not available - processing in background');
      return false;
    }

    try {
      const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
      });

      if (existingContexts.length > 0) {
        return true;
      }

      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['WORKERS'],
        justification: 'Heavy AI processing for resume optimization and cover letter generation'
      });

      console.log('[AutoJobr] Offscreen document created');
      return true;
    } catch (error) {
      console.error('[AutoJobr] Failed to create offscreen document:', error);
      return false;
    }
  }

  async sendToOffscreen(type, data) {
    const offscreenAvailable = await this.ensureOffscreenDocument();

    if (!offscreenAvailable) {
      // Fallback: process in background (slower but functional)
      console.log('[AutoJobr] Processing in background - no offscreen available');
      return await this.processInBackground(type, data);
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[AutoJobr] Offscreen message error:', chrome.runtime.lastError);
          // Fallback to background processing
          this.processInBackground(type, data).then(resolve).catch(reject);
        } else if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Unknown offscreen error'));
        }
      });
    });
  }

  async processInBackground(type, data) {
    // Fallback processing when offscreen is not available
    console.log('[AutoJobr] Background fallback for:', type);

    switch (type) {
      case 'OPTIMIZE_RESUME':
      case 'GENERATE_COVER_LETTER':
      case 'ANALYZE_JOB_MATCH':
        // Make direct API call from background
        const endpoint = type === 'OPTIMIZE_RESUME' ? '/api/ai/optimize-resume' :
                        type === 'GENERATE_COVER_LETTER' ? '/api/ai/generate-cover-letter' :
                        '/api/ai/analyze-match';

        const response = await fetch(`${this.apiUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();

      default:
        throw new Error(`Unknown offscreen task type: ${type}`);
    }
  }

  createContextMenus() {
    // Remove all existing context menus first to prevent duplicates
    chrome.contextMenus.removeAll(() => {
      // Define consistent job site patterns (matches manifest.json)
      const jobSitePatterns = [
      '*://*.linkedin.com/jobs/*',
      '*://*.indeed.com/viewjob*',
      '*://*.indeed.com/jobs/*',
      '*://*.glassdoor.com/Job/*',
      '*://*.glassdoor.com/job-listing/*',
      '*://*.ziprecruiter.com/jobs/*',
      '*://*.monster.com/job-openings/*',
      '*://*.dice.com/jobs/*',
      '*://*.greenhouse.io/*/jobs/*',
      '*://*.lever.co/*/jobs/*',
      '*://*.workday.com/*/job/*',
      '*://*.myworkdayjobs.com/*/job/*',
      '*://*.naukri.com/job-listings/*',
      '*://*.naukri.com/*/jobs*',
      '*://*.shine.com/jobs/*',
      '*://*.timesjobs.com/job-detail/*',
      '*://*.freshersjobs.com/*/jobs/*',
      '*://*.instahyre.com/jobs/*',
      '*://*.angel.co/jobs/*',
      '*://*.wellfound.com/jobs/*',
      '*://*.stackoverflow.com/jobs/*',
      '*://*.remoteok.io/remote-jobs/*',
      '*://*.weworkremotely.com/remote-jobs/*'
    ];

    const applicationPatterns = [
      '*://*.linkedin.com/jobs/apply/*',
      '*://*.indeed.com/apply/*',
      '*://*.glassdoor.com/job/apply/*',
      '*://*.greenhouse.io/*/application/*',
      '*://*.lever.co/*/apply/*',
      '*://*.workday.com/*/apply/*',
      '*://*.myworkdayjobs.com/*/application/*',
      '*://*.boards.greenhouse.io/*/jobs/*/application/*',
      '*://*.jobs.lever.co/*/apply/*',
      '*://*.apply.workable.com/*/*',
      '*://*.taleo.net/careersection/*/jobapply/*',
      '*://*.icims.com/jobs/*/apply/*'
    ];

    chrome.contextMenus.create({
      id: 'autofill-form',
      title: 'Auto-fill this form',
      contexts: ['page'],
      documentUrlPatterns: [...applicationPatterns, ...jobSitePatterns]
    });

    chrome.contextMenus.create({
      id: 'analyze-job',
      title: 'Analyze job match',
      contexts: ['page'],
      documentUrlPatterns: jobSitePatterns
    });

    chrome.contextMenus.create({
      id: 'save-job',
      title: 'Save this job',
      contexts: ['page'],
      documentUrlPatterns: jobSitePatterns
    });

    chrome.contextMenus.create({
      id: 'generate-cover-letter',
      title: 'Generate cover letter',
      contexts: ['page'],
      documentUrlPatterns: [...jobSitePatterns, ...applicationPatterns]
    });

    chrome.contextMenus.create({
      id: 'bulk-apply',
      title: 'Start bulk apply mode',
      contexts: ['page'],
      documentUrlPatterns: jobSitePatterns
    });

    chrome.contextMenus.create({
      id: 'separator-1',
      type: 'separator',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'open-dashboard',
      title: 'Open AutoJobr Dashboard',
      contexts: ['page']
    });
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      // Allow messages from popup (no tab) and content scripts (has tab)
      // Only block if it's from a content script with an invalid/detached tab
      if (sender && sender.tab && !sender.tab.id) {
        console.log('Message from detached content script context, ignoring');
        sendResponse({ success: false, error: 'Detached context' });
        return;
      }

      // Rate limiting (use tab ID if available, otherwise use 'popup' or 'unknown')
      const rateLimitKey = sender.tab?.id || (sender.id ? 'popup' : 'unknown');
      if (!this.checkRateLimit(rateLimitKey, message.action)) {
        sendResponse({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      switch (message.action) {
        case 'getApiUrl':
          sendResponse({ apiUrl: this.apiUrl });
          break;

        case 'trackApplication':
          const trackResult = await this.trackApplication(message.data);
          sendResponse(trackResult);
          break;

        case 'saveJob':
          const savedJob = await this.saveJob(message.data);
          sendResponse({ success: true, job: savedJob });
          break;

        case 'generateCoverLetter':
          try {
            const { jobTitle, company, jobDescription, requirements, location } = message.data;

            // Validate inputs
            if (!jobDescription || jobDescription.length < 50) {
              throw new Error('Job description is required and must be at least 50 characters');
            }

            if (!jobTitle || !company) {
              throw new Error('Job title and company are required');
            }

            // Use internal helper functions or await this.getUserProfile() if not available from message
            const profile = await this.getUserProfile();

            if (!profile || !profile.professionalTitle) {
              throw new Error('Please complete your profile before generating cover letters');
            }

            console.log('[Background] Generating cover letter for:', { jobTitle, company, descLength: jobDescription.length });

            const coverLetter = await this.generateCoverLetter(
              jobTitle,
              company,
              jobDescription,
              profile,
              requirements,
              location
            );

            sendResponse({ success: true, coverLetter });
          } catch (error) {
            console.error('Cover letter generation failed:', error);
            sendResponse({ success: false, error: error.message || 'Failed to generate cover letter' });
          }
          break;

        case 'analyzeJob':
          const analysis = await this.analyzeJob(message.data);
          sendResponse({ success: true, analysis });
          break;

        case 'getUserProfile':
          const profile = await this.getUserProfile();
          sendResponse({ success: true, profile });
          break;

        case 'syncProfile':
          const syncedProfile = await this.profileCache.ensureFresh(this.apiUrl, true);
          sendResponse({ success: true, profile: syncedProfile });
          break;

        case 'invalidateProfileCache':
          await this.profileCache.invalidate();
          sendResponse({ success: true });
          break;

        case 'updateProfile':
          if (message.profile) {
            await this.profileCache.setProfile(message.profile);
            this.cache.delete('user_profile');
            sendResponse({ success: true });
          }
          break;

        case 'testConnection':
          const connected = await this.testConnection();
          sendResponse({ success: true, connected });
          break;

        case 'showNotification':
          await this.showAdvancedNotification(message.title, message.message, message.type);
          sendResponse({ success: true });
          break;

        case 'getJobSuggestions':
          const suggestions = await this.getJobSuggestions(message.data);
          sendResponse({ success: true, suggestions });
          break;

        case 'updateUserPreferences':
          await this.updateUserPreferences(message.data);
          sendResponse({ success: true });
          break;

        case 'openPopup':
          await this.openExtensionPopup();
          sendResponse({ success: true });
          break;

        // Autopilot features
        case 'toggleAutopilot':
          if (this.autopilot) {
            await this.autopilot.toggleAutopilot(message.enabled);
            sendResponse({ success: true, status: this.autopilot.getStatus() });
          }
          break;

        case 'getAutopilotStatus':
          if (this.autopilot) {
            sendResponse({ success: true, status: this.autopilot.getStatus() });
          }
          break;

        case 'updateAutopilotPreferences':
          if (this.autopilot) {
            await this.autopilot.updatePreferences(message.preferences);
            sendResponse({ success: true });
          }
          break;

        // Resume optimizer features
        case 'optimizeResume':
          if (this.resumeOptimizer) {
            const optimization = await this.resumeOptimizer.optimizeResume(
              message.resume,
              message.jobDescription
            );
            sendResponse({ success: true, optimization });
          }
          break;

        case 'analyzeJobDescription':
          if (this.resumeOptimizer) {
            const analysis = await this.resumeOptimizer.analyzeJobDescription(
              message.jobDescription
            );
            sendResponse({ success: true, analysis });
          }
          break;

        case 'createResumeVersion':
          if (this.resumeOptimizer) {
            const version = await this.resumeOptimizer.createOptimizedVersion(
              message.resume,
              message.jobTitle,
              message.company,
              message.optimizations
            );
            sendResponse({ success: true, version });
          }
          break;

        case 'getResumeVersions':
          if (this.resumeOptimizer) {
            const versions = await this.resumeOptimizer.getVersions();
            sendResponse({ success: true, versions });
          }
          break;

        // Referral finder features
        case 'findReferrals':
          if (this.referralFinder) {
            const referrals = await this.referralFinder.findReferrals(
              message.jobData,
              message.userProfile
            );
            sendResponse({ success: true, ...referrals });
          }
          break;

        case 'generateReferralMessage':
          if (this.referralFinder) {
            const msg = this.referralFinder.generateMessage(
              message.referral,
              message.jobData,
              message.userProfile
            );
            sendResponse({ success: true, message: msg });
          }
          break;

        case 'sendReferralRequest':
          if (this.referralFinder) {
            const result = await this.referralFinder.sendReferralRequest(
              message.referral,
              message.message,
              message.jobData
            );
            sendResponse(result);
          }
          break;

        case 'getReferralAnalytics':
          if (this.referralFinder) {
            const analytics = await this.referralFinder.getReferralAnalytics();
            sendResponse({ success: true, analytics });
          }
          break;

        // Interview Preparation
        case 'getInterviewPrep':
          const prep = await this.getInterviewPrep(message.data?.jobData || message.jobData);
          sendResponse({ success: true, prep });
          break;

        // Salary Insights
        case 'getSalaryInsights':
          const insights = await this.getSalaryInsights(message.data?.jobData || message.jobData);
          sendResponse({ success: true, insights });
          break;

        // Application Orchestrator
        case 'scheduleApplication':
          if (this.applicationOrchestrator) {
            const result = await this.applicationOrchestrator.scheduleApplication(message.jobData, message.userProfile);
            sendResponse({ success: true, ...result });
          }
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async getSalaryInsights(jobData) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${this.apiUrl}/api/salary-insights`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          jobTitle: jobData.title,
          company: jobData.company,
          location: jobData.location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get salary insights');
      }

      return await response.json();
    } catch (error) {
      console.error('Salary insights error:', error);
      throw error;
    }
  }

  checkRateLimit(identifier, action) {
    const key = `${identifier}_${action}`;
    const now = Date.now();
    const limit = this.rateLimiter.get(key) || { count: 0, resetTime: now + 60000 };

    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 60000;
    }

    if (limit.count >= 10) { // 10 requests per minute
      return false;
    }

    limit.count++;
    this.rateLimiter.set(key, limit);
    return true;
  }

  async handleTabUpdate(tabId, tab) {
    const supportedDomains = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
      'monster.com', 'careerbuilder.com', 'dice.com', 'stackoverflow.com',
      'angel.co', 'wellfound.com', 'greenhouse.io', 'lever.co',
      'workday.com', 'myworkdayjobs.com', 'icims.com', 'smartrecruiters.com',
      'bamboohr.com', 'ashbyhq.com', 'careers.google.com', 'amazon.jobs',
      'autojobr.com'
    ];

    const isJobBoard = supportedDomains.some(domain => tab.url.includes(domain));

    if (isJobBoard) {
      // Update badge with enhanced styling
      chrome.action.setBadgeText({
        tabId: tabId,
        text: '✓'
      });

      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#22c55e'
      });

      // Inject content script if needed
      await this.ensureContentScriptInjected(tabId);

      // Auto-detect job postings
      setTimeout(() => {
        this.detectJobPosting(tabId);
      }, 2000);

    } else {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: ''
      });
    }
  }

  async handleNavigationCompleted(details) {
    const { tabId, url } = details;

    // Delay to ensure page is fully loaded
    setTimeout(() => {
      this.handleTabUpdate(tabId, { url });
    }, 1500);
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'autofill-form':
        await this.triggerAutofill(tab.id);
        break;
      case 'analyze-job':
        await this.triggerJobAnalysis(tab.id);
        break;
      case 'save-job':
        await this.triggerSaveJob(tab.id);
        break;
    }
  }

  async handleCommand(command) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    switch (command) {
      case 'autofill':
        await this.triggerAutofill(activeTab.id);
        break;
      case 'analyze':
        await this.triggerJobAnalysis(activeTab.id);
        break;
      case 'save-job':
        await this.triggerSaveJob(activeTab.id);
        break;
    }
  }

  async ensureContentScriptInjected(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.autojobrContentScriptLoaded
      });
    } catch (error) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-script.js']
        });

        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['popup-styles.css']
        });

        console.log('✅ Content script injected successfully');
      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError);
      }
    }
  }

  async detectJobPosting(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'detectJobPosting'
      });

      if (response && response.success && response.jobData) {
        // Cache job data
        this.cache.set(`job_${tabId}`, {
          data: response.jobData,
          timestamp: Date.now()
        });

        // Show smart notification if enabled
        const settings = await chrome.storage.sync.get(['smartAnalysis']);
        if (settings.smartAnalysis) {
          await this.showJobDetectedNotification(response.jobData);
        }
      }
    } catch (error) {
      console.error('Job detection failed:', error);
    }
  }

  async showJobDetectedNotification(jobData) {
    // REMOVED - No auto-notifications to prevent Chrome message spam
    console.log('Job detected silently:', jobData.title, 'at', jobData.company);
  }

  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.apiUrl}/api/health`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async ensureCachedProfile() {
    try {
      const cachedProfile = await this.profileCache.getProfile();
      if (!cachedProfile) {
        console.log('📥 No cached profile - attempting to fetch from server');
        await this.profileCache.ensureFresh(this.apiUrl);
      }
    } catch (error) {
      console.error('Ensure cached profile error:', error);
    }
  }

  async getUserProfile() {
    try {
      // First try to get from ProfileCache
      const cachedProfile = await this.profileCache.getProfile();
      if (cachedProfile) {
        return cachedProfile;
      }

      // Check in-memory cache
      const cacheKey = 'user_profile';
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
        return cached.data;
      }

      // Use session-based authentication (cookies) instead of Bearer tokens
      const response = await fetch(`${this.apiUrl}/api/extension/profile`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // This sends session cookies
        mode: 'cors'
      });

      if (response.ok) {
        const profile = await response.json();

        // Only cache if user is authenticated
        if (profile.authenticated) {
          this.cache.set(cacheKey, {
            data: profile,
            timestamp: Date.now()
          });

          // Also save to ProfileCache for future use
          await this.profileCache.setProfile(profile);
        }

        return profile;
      } else if (response.status === 401) {
        // Expected when user is not logged in - don't treat as error
        console.log('User not authenticated - extension will work in limited mode');
        return null;
      }

      console.warn('Profile fetch failed with status:', response.status);
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  async trackApplication(data) {
    try {
      console.log('[TRACK APP] Starting application tracking:', {
        jobTitle: data.jobTitle,
        company: data.company,
        location: data.location,
        jobUrl: data.jobUrl,
        platform: data.platform
      });

      // Use session-based authentication instead of Bearer tokens
      const headers = {
        'Content-Type': 'application/json'
      };

      const requestBody = {
        jobTitle: data.jobTitle,
        company: data.company,
        location: data.location || '',
        jobUrl: data.jobUrl || window.location?.href || '',
        status: data.status || 'applied',
        source: 'extension',
        platform: data.platform || 'extension',
        appliedDate: data.appliedDate || new Date().toISOString(),
        jobType: data.jobType || null,
        workMode: data.workMode || null
      };

      console.log('[TRACK APP] Request body:', requestBody);

      // Use the correct endpoint that saves to job_applications table
      const response = await fetch(`${this.apiUrl}/api/track-application`, {
        method: 'POST',
        headers,
        credentials: 'include', // Send session cookies
        mode: 'cors',
        body: JSON.stringify(requestBody)
      });

      console.log('[TRACK APP] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[TRACK APP] User not authenticated');
          throw new Error('Please log in to AutoJobr to track applications');
        }
        const errorText = await response.text();
        console.error('[TRACK APP] Server error:', errorText);
        throw new Error(`Failed to track application: ${errorText}`);
      }

      const result = await response.json();
      console.log('[TRACK APP] ✅ Success - Application tracked:', {
        success: result.success,
        applicationId: result.applicationId || result.application?.id,
        duplicate: result.duplicate
      });

      // Don't show notifications to reduce spam - just log to console
      // Users can check their dashboard for tracked applications

      return { success: true, application: result.application || result, duplicate: result.duplicate };

    } catch (error) {
      console.error('[TRACK APP] ❌ Error:', error);
      console.error('[TRACK APP] Error details:', {
        message: error.message,
        stack: error.stack
      });

      // Show error notification
      await this.showAdvancedNotification(
        'Tracking Failed ❌',
        error.message || 'Failed to track application',
        'error'
      );

      throw error;
    }
  }

  async saveJob(data) {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;

      const headers = {
        'Content-Type': 'application/json'
      };

      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`${this.apiUrl}/api/saved-jobs`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          title: data.jobTitle,
          company: data.company,
          description: data.description,
          location: data.location,
          url: data.jobUrl,
          platform: data.source || 'extension_v2',
          extractedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          await chrome.storage.local.remove(['sessionToken', 'userId']);
        }
        throw new Error('Failed to save job');
      }

      const savedJob = await response.json();

      await this.showAdvancedNotification(
        'Job Saved! 💾',
        `Saved "${data.jobTitle}" at ${data.company}`,
        'success'
      );

      return savedJob;

    } catch (error) {
      console.error('Save job error:', error);
      throw error;
    }
  }

  async generateCoverLetter(jobTitle, company, jobDescription, profile, requirements = '', location = '') {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${this.apiUrl}/api/generate-cover-letter`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          jobTitle,
          companyName: company,
          jobDescription,
          requirements,
          location,
          profile,
          requestedAt: new Date().toISOString(),
          source: 'extension_v2'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          await chrome.storage.local.remove(['sessionToken', 'userId']);
        }
        throw new Error(`Failed to generate cover letter: ${response.statusText}`);
      }

      const result_data = await response.json();

      await this.showAdvancedNotification(
        'Cover Letter Generated! 📝',
        'Cover letter has been generated and copied to clipboard',
        'success'
      );

      return result_data.coverLetter;

    } catch (error) {
      console.error('Generate cover letter error:', error);
      throw error;
    }
  }

  async getInterviewPrep(jobData) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${this.apiUrl}/api/interview-prep`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          jobTitle: jobData.title,
          company: jobData.company,
          jobDescription: jobData.description,
          requestedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get interview prep');
      }

      const prep = await response.json();

      await this.showAdvancedNotification(
        'Interview Prep Ready! 🎯',
        `Generated ${prep.questions?.length || 0} practice questions`,
        'success'
      );

      return prep;
    } catch (error) {
      console.error('Interview prep error:', error);
      throw error;
    }
  }

  async analyzeJob(data) {
    try {
      // Get user profile if not provided by content script
      let userProfile = data.userProfile;
      if (!userProfile) {
        console.log('Background script: Getting user profile for job analysis');
        userProfile = await this.getUserProfile();
        if (!userProfile || !userProfile.authenticated) {
          console.log('User not authenticated - cannot analyze job');
          throw new Error('Please log in to AutoJobr to analyze jobs');
        }
      }

      console.log('🎯 Analyzing job with client-side matching engine:', {
        jobTitle: data.jobData?.title,
        company: data.jobData?.company,
        userSkills: userProfile?.skills?.length || 0,
        userProfessionalTitle: userProfile?.professionalTitle,
        userYearsExperience: userProfile?.yearsExperience
      });

      // Try local matching first (fast and free)
      const localAnalysis = await this.matchEngine.analyzeJobMatch(data.jobData, userProfile);

      // Check if we should use API for deep analysis
      const shouldUseAPI = 
        data.requestDeepAnalysis === true ||
        localAnalysis.confidence === 'low' ||
        localAnalysis.confidenceLevel < this.matchEngine.MIN_CONFIDENCE_THRESHOLD;

      let analysis = localAnalysis;

      // Use API only when necessary
      if (shouldUseAPI) {
        console.log('⚡ Using API for deep analysis (low confidence or explicit request)');

        try {
          const response = await fetch(`${this.apiUrl}/api/analyze-job-match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify({
              jobData: data.jobData,
              userProfile: userProfile,
              analyzedAt: new Date().toISOString(),
              source: 'extension_deep_analysis'
            })
          });

          if (response.ok) {
            const apiAnalysis = await response.json();
            apiAnalysis.source = 'api';
            analysis = apiAnalysis;
            console.log('✅ API analysis received:', { matchScore: apiAnalysis.matchScore });
          } else {
            console.log('⚠️ API call failed, using local analysis');
          }
        } catch (apiError) {
          console.log('⚠️ API error, falling back to local analysis:', apiError.message);
        }
      } else {
        console.log('✅ Using local analysis (high confidence, fast):', {
          matchScore: localAnalysis.matchScore,
          executionMs: localAnalysis.executionTimeMs,
          source: localAnalysis.source
        });
      }

      const matchLevel = analysis.matchScore >= 80 ? 'Excellent' : 
                        analysis.matchScore >= 60 ? 'Good' : 
                        analysis.matchScore >= 40 ? 'Fair' : 'Poor';

      // Only show notification for manual analysis, not automatic ones, and throttle duplicates
      if (data.source !== 'extension_automatic_popup') {
        const jobKey = `${data.jobData?.title}_${data.jobData?.company}`.replace(/\s/g, '');
        const now = Date.now();

        // Don't show notification if same job was analyzed in last 30 seconds
        if (!this.lastNotifications) this.lastNotifications = {};
        const lastNotificationTime = this.lastNotifications[jobKey];

        if (!lastNotificationTime || (now - lastNotificationTime) > 30000) { // 30 seconds throttle
          this.lastNotifications[jobKey] = now;
          const sourceLabel = analysis.source === 'local' ? '⚡ Fast' : '🔍 Deep';
          await this.showAdvancedNotification(
            `${sourceLabel} Analysis Complete! 🎯`,
            `Match Score: ${analysis.matchScore}% (${matchLevel} match)`,
            analysis.matchScore >= 60 ? 'success' : 'warning'
          );
        } else {
          console.log('Skipping duplicate notification for same job');
        }
      }

      return analysis;

    } catch (error) {
      console.error('Analyze job error:', error);
      throw error;
    }
  }

  async getJobSuggestions(data) {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;

      if (!sessionToken) return [];

      const headers = {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${this.apiUrl}/api/job-suggestions`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        return await response.json();
      }

      return [];
    } catch (error) {
      console.error('Get job suggestions error:', error);
      return [];
    }
  }

  async updateUserPreferences(data) {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;

      if (!sessionToken) return;

      const headers = {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      };

      await fetch(`${this.apiUrl}/api/user/preferences`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(data)
      });

      // Clear profile cache to force refresh
      this.cache.delete('user_profile');

    } catch (error) {
      console.error('Update user preferences error:', error);
    }
  }

  async showAdvancedNotification(title, message, type = 'basic') {
    const iconMap = {
      success: 'icons/icon48.png',
      warning: 'icons/icon48.png',
      error: 'icons/icon48.png',
      info: 'icons/icon48.png'
    };

    chrome.notifications.create({
      type: 'basic',
      iconUrl: iconMap[type] || iconMap.basic,
      title,
      message,
      priority: type === 'error' ? 2 : 1
    });
  }

  async triggerAutofill(tabId) {
    try {
      const profile = await this.getUserProfile();
      if (!profile) {
        await this.showAdvancedNotification(
          'Authentication Required',
          'Please sign in to use auto-fill',
          'warning'
        );
        return;
      }

      await chrome.tabs.sendMessage(tabId, {
        action: 'startAutofill',
        userProfile: profile
      });
    } catch (error) {
      console.error('Trigger autofill error:', error);
    }
  }

  async triggerJobAnalysis(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'analyzeJob'
      });
    } catch (error) {
      console.error('Trigger job analysis error:', error);
    }
  }

  async triggerSaveJob(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'saveCurrentJob'
      });
    } catch (error) {
      console.error('Trigger save job error:', error);
    }
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 600000) { // 10 minutes
        this.cache.delete(key);
      }
    }
  }

  cleanRateLimiter() {
    const now = Date.now();
    for (const [key, value] of this.rateLimiter.entries()) {
      if (now > value.resetTime) {
        this.rateLimiter.delete(key);
      }
    }
  }

  async syncUserData() {
    try {
      // Refresh user profile cache using ProfileCache
      console.log('🔄 Periodic profile sync starting...');
      await this.profileCache.ensureFresh(this.apiUrl);
      this.cache.delete('user_profile');
      console.log('✅ Profile sync complete');
    } catch (error) {
      console.error('Sync user data error:', error);
    }
  }

  async openExtensionPopup() {
    try {
      // Get current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (activeTab) {
        // Open extension popup programmatically
        chrome.action.openPopup();
      }
    } catch (error) {
      console.error('Failed to open popup:', error);
      // Fallback: try to open popup using different method
      try {
        chrome.browserAction.openPopup();
      } catch (fallbackError) {
        console.error('Fallback popup open failed:', fallbackError);
      }
    }
  }
}

// Advanced interview preparation with AI-powered insights
const interviewPrepData = {
  companyInsights: "Research the company's recent news, products, and culture. Check their LinkedIn, Glassdoor reviews, and recent press releases.",
  questions: [
    "Tell me about yourself and your experience",
    "Why are you interested in this role?",
    "What are your greatest strengths?",
    "Describe a challenging project you worked on",
    "Where do you see yourself in 5 years?"
  ],
  tips: "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions. Prepare specific examples from your experience."
};

// Intelligent application orchestrator
class ApplicationOrchestrator {
  constructor() {
    this.applicationQueue = [];
    this.processingLock = false;
    this.successPatterns = new Map();
    this.failurePatterns = new Map();
  }

  async scheduleApplication(jobData, userProfile) {
    const priority = await this.calculatePriority(jobData, userProfile);
    const timing = await this.optimizeTiming(jobData);

    this.applicationQueue.push({
      job: jobData,
      profile: userProfile,
      priority,
      scheduledFor: timing.optimalTime,
      strategy: timing.strategy
    });

    this.applicationQueue.sort((a, b) => b.priority - a.priority);

    return {
      position: this.applicationQueue.findIndex(app => app.job.url === jobData.url) + 1,
      totalQueued: this.applicationQueue.length,
      estimatedTime: timing.optimalTime
    };
  }

  async calculatePriority(jobData, userProfile) {
    let priority = 50; // Base priority

    // Recency boost (newer jobs get priority)
    const daysOld = this.calculateDaysOld(jobData.datePosted);
    if (daysOld < 2) priority += 20;
    else if (daysOld < 7) priority += 10;

    // Match score boost
    const matchScore = await this.quickMatchScore(jobData, userProfile);
    priority += matchScore * 0.3;

    // Company size/prestige boost
    if (this.isTopCompany(jobData.company)) priority += 15;

    // Salary boost
    if (jobData.salary && this.meetsExpectedSalary(jobData.salary, userProfile)) {
      priority += 10;
    }

    return Math.min(priority, 100);
  }

  async optimizeTiming(jobData) {
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    // Optimal application times based on data
    const optimalHours = [9, 10, 11, 14, 15]; // 9-11 AM, 2-3 PM
    const optimalDays = [1, 2, 3, 4]; // Monday-Thursday

    let strategy = 'immediate';
    let optimalTime = now;

    // If it's not optimal time, schedule for next optimal slot
    if (!optimalHours.includes(hourOfDay) || !optimalDays.includes(dayOfWeek)) {
      strategy = 'scheduled';
      optimalTime = this.getNextOptimalTime(now);
    }

    // Avoid weekend applications
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      strategy = 'scheduled';
      optimalTime = this.getNextWeekday(now);
      optimalTime.setHours(10, 0, 0, 0); // 10 AM on next weekday
    }

    return { strategy, optimalTime };
  }

  async quickMatchScore(jobData, userProfile) {
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
    const jobDescription = (jobData.description || '').toLowerCase();

    let score = 0;
    let matchedSkills = 0;

    userSkills.forEach(skill => {
      if (jobDescription.includes(skill)) {
        matchedSkills++;
      }
    });

    if (userSkills.length > 0) {
      score = (matchedSkills / userSkills.length) * 100;
    }

    return score;
  }

  calculateDaysOld(datePosted) {
    if (!datePosted) return 30; // Assume old if no date
    const posted = new Date(datePosted);
    const now = new Date();
    return Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  }

  isTopCompany(companyName) {
    const topCompanies = ['google', 'amazon', 'microsoft', 'apple', 'meta', 'netflix', 'tesla', 'nvidia'];
    return topCompanies.some(top => companyName?.toLowerCase().includes(top));
  }

  meetsExpectedSalary(jobSalary, userProfile) {
    const minSalary = userProfile.desiredSalaryMin || 0;
    const salaryMatch = jobSalary.match(/\$?([\d,]+)/);
    if (salaryMatch) {
      const salary = parseInt(salaryMatch[1].replace(/,/g, ''));
      return salary >= minSalary;
    }
    return true; // If salary not parseable, assume it's okay
  }

  getNextOptimalTime(currentTime) {
    const next = new Date(currentTime);
    const hour = next.getHours();

    // If before 9 AM, schedule for 10 AM today
    if (hour < 9) {
      next.setHours(10, 0, 0, 0);
    } 
    // If between 9-11 AM, schedule for 2 PM today
    else if (hour >= 9 && hour < 11) {
      next.setHours(14, 0, 0, 0);
    }
    // If after 3 PM, schedule for 10 AM next day
    else {
      next.setDate(next.getDate() + 1);
      next.setHours(10, 0, 0, 0);
    }

    return next;
  }

  getNextWeekday(currentTime) {
    const next = new Date(currentTime);
    const day = next.getDay();

    if (day === 0) next.setDate(next.getDate() + 1); // Sunday -> Monday
    else if (day === 6) next.setDate(next.getDate() + 2); // Saturday -> Monday

    return next;
  }

  async processQueue() {
    if (this.processingLock || this.applicationQueue.length === 0) return;

    this.processingLock = true;
    const app = this.applicationQueue.shift();

    try {
      await this.executeApplication(app);
    } catch (error) {
      console.error('Application failed:', error);
      this.failurePatterns.set(app.job.url, error.message);
    } finally {
      this.processingLock = false;
    }
  }

  async executeApplication(app) {
    // Send message to content script to execute application
    const tabs = await chrome.tabs.query({ url: app.job.url });
    if (tabs.length > 0) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        action: 'executeScheduledApplication',
        jobData: app.job,
        userProfile: app.profile,
        strategy: app.strategy
      });
    }
  }
}

// Initialize orchestrator
const applicationOrchestrator = new ApplicationOrchestrator();

// Initialize background service
new AutoJobrBackground();