// AutoJobr Background Service Worker
console.log('🚀 AutoJobr background service worker loading...');

class AutoJobrBackground {
  constructor() {
    this.apiUrl = 'https://29ce8162-da3c-47aa-855b-eac2ee4b17cd-00-2uv34jdoe24cx.riker.replit.dev';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.detectApiUrl();
    console.log('🚀 AutoJobr background service worker initialized');
  }

  async detectApiUrl() {
    // Try to detect the correct API URL based on current environment
    const possibleUrls = [
      'https://29ce8162-da3c-47aa-855b-eac2ee4b17cd-00-2uv34jdoe24cx.riker.replit.dev',
    ];

    for (const url of possibleUrls) {
      try {
        const response = await fetch(`${url}/api/health`, { 
          method: 'GET',
          mode: 'cors'
        });
        
        if (response.ok) {
          this.apiUrl = url;
          console.log('✅ Connected to AutoJobr server:', this.apiUrl);
          break;
        }
      } catch (error) {
        // Continue trying other URLs
      }
    }
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

    // Handle navigation completed (only if webNavigation permission is available)
    if (chrome.webNavigation) {
      chrome.webNavigation.onCompleted.addListener((details) => {
        if (details.frameId === 0) { // Main frame only
          this.handleNavigationCompleted(details);
        }
      });
    }
  }

  async handleInstall() {
    // Set default settings
    const defaultSettings = {
      autofillEnabled: true,
      trackingEnabled: true,
      notificationsEnabled: true,
      apiUrl: this.apiUrl
    };

    await chrome.storage.sync.set(defaultSettings);

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr Installed!',
      message: 'Start auto-filling job applications on 100+ job boards. Click the extension icon to get started.'
    });

    // Open onboarding page
    chrome.tabs.create({
      url: `${this.apiUrl}/onboarding?source=extension`
    });
  }

  async handleUpdate(previousVersion) {
    console.log(`Updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    
    // Show update notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr Updated!',
      message: 'New features and improvements are now available.'
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'getApiUrl':
          sendResponse({ apiUrl: this.apiUrl });
          break;

        case 'trackApplication':
          await this.trackApplication(message.data);
          sendResponse({ success: true });
          break;

        case 'saveJob':
          await this.saveJob(message.data);
          sendResponse({ success: true });
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
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: message.title || 'AutoJobr',
            message: message.message
          });
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleTabUpdate(tabId, tab) {
    // Check if the tab is a supported job board
    const supportedDomains = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
      'monster.com', 'careerbuilder.com', 'dice.com', 'stackoverflow.com',
      'angel.co', 'wellfound.com', 'greenhouse.io', 'lever.co',
      'workday.com', 'myworkdayjobs.com', 'icims.com', 'smartrecruiters.com',
      'bamboohr.com', 'ashbyhq.com', 'careers.google.com', 'amazon.jobs'
    ];

    const isJobBoard = supportedDomains.some(domain => tab.url.includes(domain));

    if (isJobBoard) {
      // Update badge to indicate job board detection
      chrome.action.setBadgeText({
        tabId: tabId,
        text: '!'
      });

      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#22c55e'
      });

      // Inject content script if needed
      this.ensureContentScriptInjected(tabId);
    } else {
      // Clear badge
      chrome.action.setBadgeText({
        tabId: tabId,
        text: ''
      });
    }
  }

  async handleNavigationCompleted(details) {
    // Additional handling for SPA navigation
    const { tabId, url } = details;
    
    // Small delay to ensure page is fully loaded
    setTimeout(() => {
      this.handleTabUpdate(tabId, { url });
    }, 1000);
  }

  async ensureContentScriptInjected(tabId) {
    try {
      // Try to execute a test function
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.autojobrContentScriptLoaded
      });
    } catch (error) {
      // Content script not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-script.js']
        });

        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['popup-styles.css']
        });
      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError);
      }
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/api/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getUserProfile() {
    try {
      const response = await fetch(`${this.apiUrl}/api/extension/profile`, {
        credentials: 'include'
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  async trackApplication(data) {
    try {
      const response = await fetch(`${this.apiUrl}/api/extension/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to track application');
      }

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Application Tracked!',
        message: `Successfully tracked application to ${data.company}`
      });

    } catch (error) {
      console.error('Track application error:', error);
      throw error;
    }
  }

  async saveJob(data) {
    try {
      const response = await fetch(`${this.apiUrl}/api/saved-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to save job');
      }

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Job Saved!',
        message: `Saved "${data.jobTitle}" at ${data.company}`
      });

    } catch (error) {
      console.error('Save job error:', error);
      throw error;
    }
  }

  async generateCoverLetter(data) {
    try {
      const response = await fetch(`${this.apiUrl}/api/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const result = await response.json();

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Cover Letter Generated!',
        message: 'Cover letter has been generated and copied to clipboard'
      });

      return result.coverLetter;

    } catch (error) {
      console.error('Generate cover letter error:', error);
      throw error;
    }
  }

  async analyzeJob(data) {
    try {
      const response = await fetch(`${this.apiUrl}/api/analyze-job-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to analyze job');
      }

      const analysis = await response.json();

      // Show analysis notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Job Analysis Complete!',
        message: `Match Score: ${analysis.matchScore}% - ${analysis.matchScore >= 70 ? 'Great match!' : 'Consider tailoring your application'}`
      });

      return analysis;

    } catch (error) {
      console.error('Analyze job error:', error);
      throw error;
    }
  }
}

// Initialize background service
new AutoJobrBackground();