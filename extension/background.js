// Background script for AutoJobr Extension
importScripts('config.js');

class BackgroundService {
  constructor() {
    this.api = new AutoJobrAPI();
    this.isInitialized = false;
    this.userProfile = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check authentication status on startup
      const user = await this.api.checkAuthStatus();
      if (user) {
        console.log('User authenticated:', user.email);
        await this.loadUserProfile();
      }
      
      this.isInitialized = true;
      console.log('AutoJobr background service initialized');
    } catch (error) {
      console.error('Background service initialization failed:', error);
    }
  }

  async loadUserProfile() {
    try {
      this.userProfile = await this.api.getUserProfile();
      console.log('User profile loaded and cached');
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'CHECK_AUTH':
          const user = await this.api.checkAuthStatus();
          return { success: true, authenticated: !!user, user };

        case 'GET_PROFILE':
          const profile = await this.api.getUserProfile();
          return { success: true, profile };

        case 'GENERATE_COVER_LETTER':
          const coverLetter = await this.api.generateCoverLetter(
            request.jobDescription,
            request.companyName
          );
          return { success: true, coverLetter };

        case 'ANALYZE_JOB':
          const analysis = await this.api.analyzeJob(request.jobData);
          return { success: true, analysis };

        case 'CLEAR_CACHE':
          await this.api.clearStoredAuth();
          this.userProfile = null;
          return { success: true };

        case 'REFRESH_PROFILE':
          this.userProfile = null;
          this.api.userProfile = null;
          const refreshedProfile = await this.api.getUserProfile();
          return { success: true, profile: refreshedProfile };

        default:
          throw new Error(`Unknown action: ${request.action}`);
      }
    } catch (error) {
      console.error('Background message handler error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Event listeners
chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoJobr extension installed');
  backgroundService.initialize();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('AutoJobr extension startup');
  backgroundService.initialize();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  backgroundService.handleMessage(request, sender, sendResponse)
    .then(response => sendResponse(response))
    .catch(error => sendResponse({ success: false, error: error.message }));
  
  return true; // Indicates we will send a response asynchronously
});

// Tab update listener for job board detection
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    const isJobBoard = CONFIG.JOB_BOARDS.some(domain => url.hostname.includes(domain));
    
    if (isJobBoard) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      } catch (error) {
        console.error('Failed to inject content script:', error);
      }
    }
  }
});

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    // Port disconnected, but service worker stays alive
  });
});