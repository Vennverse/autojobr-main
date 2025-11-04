// Enhanced AutoJobr Autopilot Background Service Worker
console.log('🚀 AutoJobr Autopilot v3.0 loading...');

// Import helper modules
importScripts('autopilot-engine.js', 'resume-optimizer.js', 'referral-finder.js', 'followup-automation.js');

// Background service worker for AutoJobr Chrome Extension

let isAuthenticated = false;
let currentUser = null;

// Daily engagement notifications
chrome.alarms.create('morningReminder', { 
  when: Date.now() + 1000,
  periodInMinutes: 1440 // Daily
});

chrome.alarms.create('eveningReminder', { 
  when: Date.now() + 1000,
  periodInMinutes: 1440
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'morningReminder') {
    const hour = new Date().getHours();
    if (hour === 8) { // 8 AM
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🌅 Good Morning! Time to Job Hunt',
        message: 'Check your new job matches and today\'s tasks',
        buttons: [{ title: 'Open Dashboard' }]
      });
    }
  }

  if (alarm.name === 'eveningReminder') {
    const hour = new Date().getHours();
    if (hour === 18) { // 6 PM
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '📊 Daily Progress Update',
        message: 'Review today\'s achievements and plan tomorrow',
        buttons: [{ title: 'View Summary' }]
      });
    }
  }
});

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  chrome.tabs.create({ url: 'https://autojobr.com/dashboard' });
});

class AutoJobrBackground {
  constructor() {
    this.apiUrl = 'https://autojobr.com';
    this.cache = new Map();
    this.rateLimiter = new Map();
    this.autopilot = null;
    this.resumeOptimizer = null;
    this.referralFinder = null;
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

    console.log('🚀 AutoJobr Autopilot v3.0 initialized with advanced features');
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
    // Clean cache every 5 minutes
    setInterval(() => {
      this.cleanCache();
    }, 5 * 60 * 1000);

    // Clean rate limiter every minute
    setInterval(() => {
      this.cleanRateLimiter();
    }, 60 * 1000);

    // Sync user data every 10 minutes if authenticated
    setInterval(() => {
      this.syncUserData();
    }, 10 * 60 * 1000);

    // Process application queue every minute
    setInterval(() => {
      if (this.applicationOrchestrator) {
        this.applicationOrchestrator.processQueue();
      }
    }, 60000);
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

  createContextMenus() {
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
          const coverLetter = await this.generateCoverLetter(message.data);
          sendResponse({ success: true, coverLetter });
          break;

        case 'analyzeJob':
          const analysis = await this.analyzeJob(message.data);
          sendResponse({ success: true, analysis });
          break;

        case 'getUserProfile':
          const profile = await this.getUserProfile();
          sendResponse({ success: true, profile });
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


  formatFollowUpContacts(hiringTeam) {
    if (!hiringTeam) return [];

    const contacts = [];

    // Prioritize recruiters first (primary contact)
    if (hiringTeam.recruiters && hiringTeam.recruiters.length > 0) {
      hiringTeam.recruiters.forEach(recruiter => {
        if (recruiter.profileUrl && recruiter.name) {
          contacts.push({
            name: recruiter.name,
            title: recruiter.title,
            profileUrl: recruiter.profileUrl,
            contactType: 'recruiter',
            priority: 'high',
            followUpMessage: `Hi ${recruiter.name.split(' ')[0]}, I recently applied for the position and wanted to express my strong interest...`
          });
        }
      });
    }

    // Then hiring managers (secondary contact)
    if (hiringTeam.hiringManagers && hiringTeam.hiringManagers.length > 0) {
      hiringTeam.hiringManagers.forEach(manager => {
        if (manager.profileUrl && manager.name) {
          contacts.push({
            name: manager.name,
            title: manager.title,
            profileUrl: manager.profileUrl,
            contactType: 'hiring_manager',
            priority: 'medium',
            followUpMessage: `Hi ${manager.name.split(' ')[0]}, I'm excited about the opportunity to join your team...`
          });
        }
      });
    }

    // Finally team members (tertiary contact)
    if (hiringTeam.teamMembers && hiringTeam.teamMembers.length > 0) {
      hiringTeam.teamMembers.forEach(member => {
        if (member.profileUrl && member.name) {
          contacts.push({
            name: member.name,
            title: member.title,
            profileUrl: member.profileUrl,
            contactType: 'team_member',
            priority: 'low',
            followUpMessage: `Hi ${member.name.split(' ')[0]}, I'd love to learn more about the team culture...`
          });
        }
      });
    }

    return contacts;
  }

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
    // Throttle duplicate notifications for the same job
    const jobKey = `${jobData?.title}_${jobData?.company}`.replace(/\s/g, '');
    const now = Date.now();

    // Initialize notifications tracker if it doesn't exist
    if (!this.lastDetectionNotifications) this.lastDetectionNotifications = {};
    const lastNotificationTime = this.lastDetectionNotifications[jobKey];

    // Don't show notification if same job was detected in last 60 seconds
    if (!lastNotificationTime || (now - lastNotificationTime) > 60000) { // 60 seconds throttle
      this.lastDetectionNotifications[jobKey] = now;
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🎯 Job Detected!',
        message: `${jobData.title} at ${jobData.company}`,
        buttons: [
          { title: 'Analyze Match' },
          { title: 'Auto-fill' }
        ]
      });
    } else {
      console.log('Skipping duplicate job detection notification for same job');
    }
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

  async getUserProfile() {
    try {
      // Check cache first to prevent excessive requests
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
      // Use session-based authentication instead of Bearer tokens
      const headers = {
        'Content-Type': 'application/json'
      };

      // Prepare application data with hiring team information
      const applicationData = {
        jobTitle: data.jobTitle,
        company: data.company,
        location: data.location || '',
        jobUrl: data.jobUrl || '',
        status: 'applied',
        source: 'extension',
        notes: `Applied via ${data.platform || 'extension'} on ${new Date().toLocaleDateString()}`,
        hiringTeam: data.hiringTeam || null, // NEW: Include hiring team data
        followUpContacts: this.formatFollowUpContacts(data.hiringTeam) // NEW: Format contacts for easy follow-up
      };

      // Use the main applications endpoint that updates job_applications table
      const response = await fetch(`${this.apiUrl}/api/applications`, {
        method: 'POST',
        headers,
        credentials: 'include', // Send session cookies
        mode: 'cors',
        body: JSON.stringify(applicationData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated - cannot track application');
          throw new Error('Please log in to AutoJobr to track applications');
        }
        const errorText = await response.text();
        throw new Error(`Failed to track application: ${errorText}`);
      }

      const application = await response.json();

      // Schedule follow-up if hiring team data is available
      if (data.hiringTeam) {
        try {
          await followUpAutomation.scheduleFollowUp({
            id: application.id || Date.now().toString(),
            jobTitle: data.jobTitle,
            company: data.company,
            hiringTeam: data.hiringTeam,
            appliedAt: data.appliedAt || new Date().toISOString()
          });
          const contactCount = applicationData.followUpContacts?.length || 0;
          console.log(`✅ Follow-up scheduled for ${data.jobTitle} at ${data.company} with ${contactCount} contacts`);
        } catch (error) {
          console.warn('Failed to schedule follow-up:', error);
        }
      }

      const contactCount = applicationData.followUpContacts?.length || 0;
      await this.showAdvancedNotification(
        'Application Tracked! 📊',
        `Tracked: ${data.jobTitle} at ${data.company}${contactCount > 0 ? `\n✅ ${contactCount} follow-up contacts saved!` : ''}`,
        'success'
      );

      return { success: true, application };

    } catch (error) {
      console.error('Track application error:', error);
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

  async generateCoverLetter(data) {
    try {
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;

      const headers = {
        'Content-Type': 'application/json'
      };

      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`${this.apiUrl}/api/generate-cover-letter`, {
        method: 'POST',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          ...data,
          requestedAt: new Date().toISOString(),
          source: 'extension_v2'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          await chrome.storage.local.remove(['sessionToken', 'userId']);
        }
        throw new Error('Failed to generate cover letter');
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

      console.log('Background script analyzing job with fresh API call:', {
        jobTitle: data.jobData?.title,
        company: data.jobData?.company,
        userSkills: userProfile?.skills?.length || 0,
        userProfessionalTitle: userProfile?.professionalTitle,
        userYearsExperience: userProfile?.yearsExperience,
        userAuthenticated: userProfile?.authenticated
      });

      const headers = {
        'Content-Type': 'application/json'
      };

      // Always make fresh API call - don't use any cached data
      const response = await fetch(`${this.apiUrl}/api/analyze-job-match`, {
        method: 'POST',
        headers,
        credentials: 'include', // Use session cookies
        mode: 'cors',
        body: JSON.stringify({
          jobData: data.jobData,
          userProfile: userProfile,
          analyzedAt: new Date().toISOString(),
          source: 'extension_automatic_popup'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated - cannot analyze job');
          throw new Error('Please log in to AutoJobr to analyze jobs');
        }
        throw new Error('Failed to analyze job');
      }

      const analysis = await response.json();

      console.log('Background script received fresh analysis:', {
        matchScore: analysis.matchScore,
        factors: analysis.factors?.length || 0
      });

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
          await this.showAdvancedNotification(
            'Job Analysis Complete! 🎯',
            `Match Score: ${analysis.matchScore}% (${matchLevel} match)`,
            analysis.matchScore >= 60 ? 'success' : 'warning'
          );
        } else {
          console.log('Skipping duplicate notification for same job');
        }
      }

      // Return the fresh analysis data directly from server
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
      const result = await chrome.storage.local.get(['sessionToken']);
      if (result.sessionToken) {
        // Refresh user profile cache
        this.cache.delete('user_profile');
        await this.getUserProfile();
      }
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