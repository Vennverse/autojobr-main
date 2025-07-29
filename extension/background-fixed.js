// Background script for AutoJobr Extension - Fixed Version
class AutoJobrBackground {
  constructor() {
    this.apiBase = 'http://40.160.50.128';
    this.isAuthenticated = false;
    this.userProfile = null;
    this.initRetries = 0;
    this.maxRetries = 3;
    this.features = {
      AUTO_FILL: true,
      AUTO_TRACKING: true,
      COVER_LETTER: true,
      JOB_ANALYSIS: true
    };
    
    this.init().catch(this.handleInitError.bind(this));
  }

  async init() {
    try {
      // Load configuration
      await this.loadConfiguration();

      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize features
      await this.initializeFeatures();
      
      console.log('AutoJobr Universal background script initialized successfully');
    } catch (error) {
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  async loadConfiguration() {
    try {
      // Load stored configuration
      const stored = await chrome.storage.local.get('autojobr_config');
      if (stored.autojobr_config) {
        this.config = { ...stored.autojobr_config };
      } else {
        this.config = {
          API_BASE_URL: 'http://40.160.50.128',
          SUPPORTED_JOB_BOARDS: ['linkedin.com', 'indeed.com', 'glassdoor.com', 'workday.com', 'myworkdayjobs.com']
        };
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.config = { API_BASE_URL: 'http://40.160.50.128' };
    }
  }

  setupEventListeners() {
    // Listen for tab updates to detect job pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        this.checkJobPage(tab).catch(error => {
          console.log('Error detecting job page:', error.message);
        });
      }
    });

    // Listen for messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Initialize authentication check
    this.checkAuthentication().catch(error => {
      console.log('Authentication check failed:', error.message);
    });
    
    console.log('AutoJobr Universal background script initialized');
  }

  async initializeFeatures() {
    try {
      // Initialize features that don't require external dependencies
      console.log('Features initialized successfully');
    } catch (error) {
      console.error('Feature initialization failed:', error);
    }
  }

  async checkJobPage(tab) {
    try {
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return;
      }

      const hostname = new URL(tab.url).hostname;
      const supportedSites = [
        'linkedin.com', 'indeed.com', 'glassdoor.com', 'workday.com', 
        'myworkdayjobs.com', 'greenhouse.io', 'lever.co'
      ];

      const isJobSite = supportedSites.some(site => hostname.includes(site));
      
      if (isJobSite) {
        console.log('Job site detected:', hostname);
        // Could add badge or notification here
      }
    } catch (error) {
      console.log('Error checking job page:', error.message);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'CHECK_AUTH':
          const authStatus = await this.checkAuthentication();
          sendResponse({ success: true, authenticated: authStatus });
          break;

        case 'GET_PROFILE':
          await this.loadUserProfile();
          sendResponse({ 
            success: true, 
            profile: this.userProfile 
          });
          break;

        case 'SAVE_JOB':
          const saveResult = await this.saveJob(message.jobData);
          sendResponse(saveResult);
          break;

        case 'TRACK_APPLICATION':
          const trackResult = await this.trackApplication(message.applicationData);
          sendResponse(trackResult);
          break;

        case 'ANALYZE_JOB':
          const analysisResult = await this.analyzeJob(message.jobData);
          sendResponse(analysisResult);
          break;

        case 'GENERATE_COVER_LETTER':
          const coverLetterResult = await this.generateCoverLetter(message.jobData);
          sendResponse(coverLetterResult);
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async checkAuthentication() {
    try {
      const response = await fetch(`${this.apiBase}/api/user`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const userData = await response.json();
        this.isAuthenticated = true;
        this.userProfile = userData;
        console.log('User authenticated:', userData.firstName || 'User');
        return true;
      } else if (response.status === 401) {
        this.isAuthenticated = false;
        this.userProfile = null;
        console.log('User not authenticated');
        return false;
      } else {
        throw new Error(`Authentication check failed: ${response.status}`);
      }
    } catch (error) {
      console.log('Authentication check failed:', error.message);
      this.isAuthenticated = false;
      this.userProfile = null;
      return false;
    }
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) {
      await this.checkAuthentication();
      return;
    }
    
    try {
      const profileResponse = await fetch(`${this.apiBase}/api/extension/profile`, { 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        this.userProfile = { ...this.userProfile, ...profileData };
        console.log('Profile loaded successfully');
      }
    } catch (error) {
      console.log('Profile loading failed:', error.message);
    }
  }

  async saveJob(jobData) {
    try {
      if (!jobData || typeof jobData !== 'object') {
        return { success: false, error: 'Invalid job data' };
      }

      const response = await fetch(`${this.apiBase}/api/saved-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: jobData.title || jobData.jobTitle || 'Unknown Title',
          company: jobData.company || 'Unknown Company',
          location: jobData.location || '',
          description: jobData.description || jobData.jobDescription || '',
          url: jobData.url || jobData.jobUrl || window.location?.href || '',
          platform: jobData.platform || 'Unknown',
          salary: jobData.salary || jobData.salaryRange || '',
          jobType: jobData.jobType || '',
          workMode: jobData.workMode || '',
          extractedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Job saved successfully');
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('Failed to save job:', response.status);
        return { success: false, error: `Server error: ${response.status}` };
      }
    } catch (error) {
      console.error('Error saving job:', error);
      return { success: false, error: error.message };
    }
  }

  async trackApplication(applicationData) {
    try {
      if (!applicationData || typeof applicationData !== 'object') {
        return { success: false, error: 'Invalid application data' };
      }

      const response = await fetch(`${this.apiBase}/api/extension/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: applicationData.jobData?.title || applicationData.jobTitle || 'Unknown Position',
          company: applicationData.jobData?.company || applicationData.company || 'Unknown Company',
          location: applicationData.jobData?.location || applicationData.location || '',
          jobUrl: applicationData.jobData?.url || applicationData.url || '',
          platform: applicationData.platform || 'Unknown',
          source: 'extension',
          status: 'applied',
          appliedDate: new Date().toISOString(),
          notes: `Applied via extension`,
          matchScore: applicationData.matchScore || 0,
          jobType: applicationData.jobData?.jobType || '',
          workMode: applicationData.jobData?.workMode || '',
          salaryRange: applicationData.jobData?.salary || ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Application tracked successfully');
        return { success: true, data: result };
      } else {
        console.error('Failed to track application:', response.status);
        return { success: false, error: `Server error: ${response.status}` };
      }
    } catch (error) {
      console.error('Error tracking application:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzeJob(jobData) {
    try {
      if (!jobData || typeof jobData !== 'object') {
        return { success: false, error: 'Invalid job data' };
      }

      const response = await fetch(`${this.apiBase}/api/jobs/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobDescription: jobData.description || '',
          jobTitle: jobData.title || '',
          company: jobData.company || ''
        })
      });

      if (!response.ok) {
        return { success: false, error: `API Error: ${response.status}` };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: false, error: 'Server error - please check authentication' };
      }

      const result = await response.json();
      return { success: true, analysis: result };
    } catch (error) {
      console.error('Error analyzing job:', error);
      return { success: false, error: error.message };
    }
  }

  async generateCoverLetter(jobData) {
    try {
      if (!jobData || typeof jobData !== 'object') {
        return { success: false, error: 'Invalid job data' };
      }

      const response = await fetch(`${this.apiBase}/api/generate-cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        return { success: false, error: `API Error: ${response.status}` };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: false, error: 'Server error - please check authentication' };
      }

      const result = await response.json();
      return { success: true, coverLetter: result };
    } catch (error) {
      console.error('Error generating cover letter:', error);
      return { success: false, error: error.message };
    }
  }

  handleInitError(error) {
    console.error('AutoJobr initialization failed:', error);
    this.initRetries++;
    
    if (this.initRetries < this.maxRetries) {
      console.log(`Retrying initialization (${this.initRetries}/${this.maxRetries})...`);
      setTimeout(() => {
        this.init().catch(this.handleInitError.bind(this));
      }, 2000 * this.initRetries);
    } else {
      console.error('Maximum initialization retries reached');
    }
  }
}

// Initialize the background script
try {
  new AutoJobrBackground();
} catch (error) {
  console.error('Failed to initialize AutoJobr background script:', error);
}