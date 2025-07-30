// Configuration
const API_BASE_URL = 'https://29ce8162-da3c-47aa-855b-eac2ee4b17cd-00-2uv34jdoe24cx.riker.replit.dev';

class AutoJobrPopup {
  constructor() {
    this.currentTab = null;
    this.userProfile = null;
    this.jobData = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Initialize UI
      this.initializeEventListeners();
      await this.checkConnection();
      await this.analyzeCurrentPage();
      await this.loadUserProfile();
      
    } catch (error) {
      console.error('Popup initialization error:', error);
      this.showError('Failed to initialize extension');
    }
  }

  initializeEventListeners() {
    // Action buttons
    document.getElementById('autofillBtn').addEventListener('click', () => this.handleAutofill());
    document.getElementById('analyzeBtn').addEventListener('click', () => this.handleAnalyze());
    document.getElementById('saveJobBtn').addEventListener('click', () => this.handleSaveJob());
    document.getElementById('coverLetterBtn').addEventListener('click', () => this.handleGenerateCoverLetter());
    document.getElementById('openDashboard').addEventListener('click', () => this.openDashboard());

    // Settings toggles
    this.initializeToggle('autofillToggle', 'autofillEnabled');
    this.initializeToggle('trackingToggle', 'trackingEnabled');
    this.initializeToggle('notificationsToggle', 'notificationsEnabled');
  }

  initializeToggle(elementId, storageKey) {
    const toggle = document.getElementById(elementId);
    
    // Load current state
    chrome.storage.sync.get([storageKey], (result) => {
      const isEnabled = result[storageKey] !== false; // Default to true
      toggle.classList.toggle('active', isEnabled);
    });

    // Handle clicks
    toggle.addEventListener('click', () => {
      const isActive = toggle.classList.contains('active');
      const newState = !isActive;
      
      toggle.classList.toggle('active', newState);
      chrome.storage.sync.set({ [storageKey]: newState });
    });
  }

  async checkConnection() {
    try {
      // First check health endpoint
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!healthResponse.ok) {
        throw new Error('Server not reachable');
      }
      
      // Then check authentication
      const authResponse = await fetch(`${API_BASE_URL}/api/user`, {
        method: 'GET',
        credentials: 'include'
      });
      
      this.isConnected = healthResponse.ok;
      const isAuthenticated = authResponse.ok;
      
      this.updateConnectionStatus(this.isConnected, isAuthenticated);
      
    } catch (error) {
      console.error('Connection check failed:', error);
      this.isConnected = false;
      this.updateConnectionStatus(false, false);
    }
  }

  updateConnectionStatus(connected, authenticated = false) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('connectionStatus');
    
    if (connected && authenticated) {
      statusDot.classList.remove('disconnected');
      statusText.textContent = 'Connected to AutoJobr';
      this.enableActionButtons();
    } else if (connected && !authenticated) {
      statusDot.classList.add('disconnected');
      statusText.innerHTML = 'Connected but not logged in - <a href="' + API_BASE_URL + '/auth" target="_blank" style="color: #3b82f6; text-decoration: underline;">Sign In</a>';
      this.disableActionButtons();
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Disconnected - Check internet connection';
      this.disableActionButtons();
    }
  }

  async analyzeCurrentPage() {
    const pageInfo = document.getElementById('pageInfo');
    const url = this.currentTab?.url || '';
    
    // Check if current page is a supported job board
    const supportedSites = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
      'monster.com', 'careerbuilder.com', 'dice.com', 'stackoverflow.com',
      'angel.co', 'wellfound.com', 'greenhouse.io', 'lever.co',
      'workday.com', 'myworkdayjobs.com', 'icims.com', 'smartrecruiters.com',
      'bamboohr.com', 'ashbyhq.com', 'careers.google.com', 'amazon.jobs',
      'microsoft.com', 'apple.com', 'meta.com'
    ];

    const isSupported = supportedSites.some(site => url.includes(site));
    
    if (isSupported) {
      pageInfo.className = 'page-info supported';
      pageInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 16px; height: 16px; color: #22c55e;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
          </svg>
          <strong>Supported job board detected</strong>
        </div>
        <div style="margin-top: 4px; font-size: 12px;">Auto-fill and job analysis available</div>
      `;
      
      // Try to detect job details
      await this.detectJobDetails();
      
    } else {
      pageInfo.className = 'page-info unsupported';
      pageInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 16px; height: 16px; color: #ef4444;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
          </svg>
          <strong>Page not supported for auto-fill</strong>
        </div>
        <div style="margin-top: 4px; font-size: 12px;">Navigate to a job application page to enable features</div>
      `;
      
      // Disable action buttons
      this.disableActionButtons();
    }
  }

  async detectJobDetails() {
    try {
      // Send message to content script to extract job details
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'extractJobDetails'
      });

      if (response && response.success) {
        this.jobData = response.jobData;
        
        if (this.jobData.title) {
          // Show job analysis score if available
          await this.showJobAnalysis();
        }
      }
    } catch (error) {
      console.error('Failed to detect job details:', error);
    }
  }

  async showJobAnalysis() {
    if (!this.jobData || !this.userProfile) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-job-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobData: this.jobData,
          userProfile: this.userProfile
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        const scoreSection = document.getElementById('scoreSection');
        const matchScore = document.getElementById('matchScore');
        const scoreFill = document.getElementById('scoreFill');

        matchScore.textContent = `${analysis.matchScore}%`;
        scoreFill.style.width = `${analysis.matchScore}%`;
        scoreSection.style.display = 'block';

        // Update score color based on value
        const score = analysis.matchScore;
        let color = '#ef4444'; // Red for low scores
        if (score >= 70) color = '#22c55e'; // Green for high scores
        else if (score >= 50) color = '#f59e0b'; // Yellow for medium scores

        scoreFill.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
        matchScore.style.color = color;
      }
    } catch (error) {
      console.error('Job analysis failed:', error);
    }
  }

  async loadUserProfile() {
    // Always try to load profile for testing
    try {
      const response = await fetch(`${API_BASE_URL}/api/extension/profile`, {
        credentials: 'include'
      });

      if (response.ok) {
        this.userProfile = await response.json();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  disableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'coverLetterBtn'];
    buttons.forEach(btnId => {
      document.getElementById(btnId).disabled = true;
    });
  }

  showLoading(show = true) {
    const content = document.querySelector('.content');
    const loading = document.getElementById('loading');
    
    if (show) {
      content.style.display = 'none';
      loading.style.display = 'block';
    } else {
      content.style.display = 'block';
      loading.style.display = 'none';
    }
  }

  showError(message) {
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.className = 'page-info unsupported';
    pageInfo.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg style="width: 16px; height: 16px; color: #ef4444;" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
        </svg>
        <strong>Error</strong>
      </div>
      <div style="margin-top: 4px; font-size: 12px;">${message}</div>
    `;
  }

  async handleAutofill() {
    if (!this.isConnected) {
      this.showError('Please connect to AutoJobr first');
      return;
    }

    this.showLoading(true);

    try {
      // Send message to content script to start auto-fill
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'startAutofill',
        userProfile: this.userProfile
      });

      if (response && response.success) {
        this.showNotification('✅ Auto-fill completed successfully!');
        
        // Track the application
        await this.trackApplication();
      } else {
        throw new Error(response?.error || 'Auto-fill failed');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      this.showError('Auto-fill failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleAnalyze() {
    if (!this.isConnected) {
      this.showError('Please connect to AutoJobr first');
      return;
    }

    this.showLoading(true);

    try {
      await this.detectJobDetails();
      await this.showJobAnalysis();
      this.showNotification('✅ Job analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError('Job analysis failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleSaveJob() {
    if (!this.isConnected || !this.jobData) {
      this.showError('Please ensure you\'re on a job page and connected to AutoJobr');
      return;
    }

    this.showLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/saved-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: this.jobData.title,
          company: this.jobData.company,
          location: this.jobData.location,
          jobUrl: this.currentTab.url,
          description: this.jobData.description,
          source: 'extension'
        })
      });

      if (response.ok) {
        this.showNotification('✅ Job saved successfully!');
      } else {
        throw new Error('Failed to save job');
      }
    } catch (error) {
      console.error('Save job error:', error);
      this.showError('Failed to save job. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleGenerateCoverLetter() {
    if (!this.isConnected || !this.jobData) {
      this.showError('Please ensure you\'re on a job page and connected to AutoJobr');
      return;
    }

    this.showLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobData: this.jobData,
          userProfile: this.userProfile
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Copy to clipboard
        await navigator.clipboard.writeText(result.coverLetter);
        
        this.showNotification('✅ Cover letter generated and copied to clipboard!');
        
        // Try to fill cover letter field if exists
        chrome.tabs.sendMessage(this.currentTab.id, {
          action: 'fillCoverLetter',
          coverLetter: result.coverLetter
        });
        
      } else {
        throw new Error('Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Cover letter error:', error);
      this.showError('Failed to generate cover letter. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async trackApplication() {
    if (!this.jobData) return;

    try {
      await fetch(`${API_BASE_URL}/api/extension/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: this.jobData.title,
          company: this.jobData.company,
          location: this.jobData.location,
          jobUrl: this.currentTab.url,
          source: 'extension',
          status: 'applied'
        })
      });
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }

  showNotification(message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AutoJobr',
      message: message
    });
  }

  openDashboard() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/applications`
    });
  }

  enableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'saveJobBtn', 'coverLetterBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    });
  }

  disableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'saveJobBtn', 'coverLetterBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }
    });
  }

  showLoading(show) {
    // Implement loading state UI updates here
    const loadingElements = document.querySelectorAll('.loading-indicator');
    loadingElements.forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });
  }

  showError(message) {
    // Simple error notification - could be enhanced with proper UI
    console.error(message);
    this.showNotification(`❌ ${message}`);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AutoJobrPopup();
});