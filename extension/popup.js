// Fixed Popup Script for AutoJobr Extension
class AutoJobrPopup {
  constructor() {
    // Always use central config - no fallbacks
    this.apiBase = window.AUTOJOBR_CONFIG.getApiBaseURL();
    this.isAuthenticated = false;
    this.userProfile = null;
    this.currentJobData = null;
    this.isJobPage = false;
    this.extensionToken = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing AutoJobr popup...');
    
    try {
      // Show loading state
      this.showLoadingState();
      
      // Check authentication status
      await this.checkAuthentication();
      
      // Check current page for job detection
      await this.checkCurrentPage();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Update UI based on connection status
      this.updateUI();
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showErrorState();
    }
  }

  async checkAuthentication() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
      
      if (response && response.success && response.authenticated) {
        this.isAuthenticated = true;
        this.userProfile = response.profile;
        console.log('✅ Connected to VM successfully');
      } else {
        this.isAuthenticated = false;
        console.log('❌ VM connection failed');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      this.isAuthenticated = false;
    }
  }

  async checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url) {
        const isJobBoard = this.isJobBoardUrl(tab.url);
        
        if (isJobBoard) {
          try {
            const response = await chrome.tabs.sendMessage(tab.id, {
              action: 'GET_JOB_DATA'
            });
            
            if (response && response.success) {
              this.isJobPage = response.isJobPage;
              this.currentJobData = response.jobData;
            }
          } catch (messageError) {
            console.log('Content script not ready');
            this.isJobPage = false;
          }
        } else {
          this.isJobPage = false;
        }
      }
    } catch (error) {
      console.log('Error checking current page:', error);
      this.isJobPage = false;
    }
  }

  isJobBoardUrl(url) {
    const jobBoardDomains = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com',
      'ziprecruiter.com', 'wellfound.com', 'angel.co', 'workday.com',
      'lever.co', 'greenhouse.io', 'bamboohr.com', 'smartrecruiters.com'
    ];
    
    return jobBoardDomains.some(domain => url.includes(domain));
  }

  setupEventListeners() {
    // Sign in button
    const signInBtn = document.getElementById('sign-in-btn');
    if (signInBtn) {
      signInBtn.addEventListener('click', () => this.openSignIn());
    }

    // Refresh auth button
    const refreshAuthBtn = document.getElementById('refresh-auth');
    if (refreshAuthBtn) {
      refreshAuthBtn.addEventListener('click', () => this.refreshAuth());
    }

    // Retry connection button
    const retryBtn = document.getElementById('retry-connection');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.retryConnection());
    }

    // Main action buttons
    const autofillBtn = document.getElementById('autofill-btn');
    if (autofillBtn) {
      autofillBtn.addEventListener('click', () => this.autofillApplication());
    }

    const coverLetterBtn = document.getElementById('cover-letter-btn');
    if (coverLetterBtn) {
      coverLetterBtn.addEventListener('click', () => this.generateCoverLetter());
    }

    const analyzeJobBtn = document.getElementById('analyze-job-btn');
    if (analyzeJobBtn) {
      analyzeJobBtn.addEventListener('click', () => this.analyzeJobMatch());
    }

    const saveJobBtn = document.getElementById('save-job-btn');
    if (saveJobBtn) {
      saveJobBtn.addEventListener('click', () => this.saveJob());
    }

    // Dashboard link
    const dashboardLink = document.getElementById('open-dashboard');
    if (dashboardLink) {
      dashboardLink.addEventListener('click', () => this.openDashboard());
    }
  }

  updateUI() {
    if (this.isAuthenticated && this.userProfile) {
      this.showAuthenticatedState();
    } else {
      this.showUnauthenticatedState();
    }
  }

  showLoadingState() {
    this.hideAllStates();
    document.getElementById('loading-state').classList.remove('hidden');
  }

  showErrorState() {
    this.hideAllStates();
    document.getElementById('error-state').classList.remove('hidden');
  }

  showAuthenticatedState() {
    this.hideAllStates();
    document.getElementById('authenticated-state').classList.remove('hidden');
    
    // Update user info
    if (this.userProfile) {
      const userAvatar = document.getElementById('user-avatar');
      const userName = document.getElementById('user-name');
      const userTitle = document.getElementById('user-title');
      
      if (userAvatar) {
        userAvatar.textContent = this.userProfile.firstName ? this.userProfile.firstName.charAt(0) : 'U';
      }
      
      if (userName) {
        userName.textContent = `${this.userProfile.firstName || 'User'} ${this.userProfile.lastName || ''}`.trim();
      }
      
      if (userTitle) {
        userTitle.textContent = this.userProfile.professionalTitle || 'Job Seeker';
      }
    }

    // Update job detection status
    if (this.isJobPage) {
      document.getElementById('job-detected').classList.remove('hidden');
      document.getElementById('no-job-detected').classList.add('hidden');
    } else {
      document.getElementById('job-detected').classList.add('hidden');
      document.getElementById('no-job-detected').classList.remove('hidden');
    }
  }

  showUnauthenticatedState() {
    this.hideAllStates();
    document.getElementById('unauthenticated-state').classList.remove('hidden');
  }

  hideAllStates() {
    const states = ['loading-state', 'error-state', 'unauthenticated-state', 'authenticated-state'];
    states.forEach(stateId => {
      const element = document.getElementById(stateId);
      if (element) {
        element.classList.add('hidden');
      }
    });
  }

  async refreshAuth() {
    this.showLoadingState();
    await this.checkAuthentication();
    this.updateUI();
  }

  async retryConnection() {
    this.showLoadingState();
    await this.init();
  }

  openSignIn() {
    chrome.tabs.create({
      url: `${this.apiBase}/auth`
    });
  }

  openDashboard() {
    chrome.tabs.create({
      url: `${this.apiBase}/dashboard`
    });
  }

  async autofillApplication() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'AUTOFILL_APPLICATION',
          profile: this.userProfile
        });
        
        console.log('✅ Autofill triggered');
      }
    } catch (error) {
      console.error('Autofill failed:', error);
    }
  }

  async generateCoverLetter() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'GENERATE_COVER_LETTER'
        });
        
        console.log('✅ Cover letter generation triggered');
      }
    } catch (error) {
      console.error('Cover letter generation failed:', error);
    }
  }

  async analyzeJobMatch() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'ANALYZE_JOB_MATCH'
        });
        
        console.log('✅ Job analysis triggered');
      }
    } catch (error) {
      console.error('Job analysis failed:', error);
    }
  }

  async saveJob() {
    if (this.currentJobData) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'SAVE_JOB',
          jobData: this.currentJobData
        });
        
        if (response.success) {
          console.log('✅ Job saved successfully');
        }
      } catch (error) {
        console.error('Save job failed:', error);
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AutoJobrPopup());
} else {
  new AutoJobrPopup();
}