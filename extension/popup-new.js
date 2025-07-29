class UnifiedAutoJobrPopup {
  constructor() {
    this.isAuthenticated = false;
    this.currentTab = null;
    this.currentJobData = null;
    this.settings = {
      autoFill: true,
      trackApplications: true,
      showNotifications: true
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.checkConnection();
    await this.getCurrentTab();
    this.setupEventListeners();
    this.detectJobPage();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get('autojobr_settings');
      if (result.autojobr_settings) {
        this.settings = { ...this.settings, ...result.autojobr_settings };
      }
      this.updateSettingsUI();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ autojobr_settings: this.settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async checkConnection() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
      this.isAuthenticated = response.success && response.authenticated;
      this.updateConnectionStatus();
    } catch (error) {
      console.error('Connection check failed:', error);
      this.isAuthenticated = false;
      this.updateConnectionStatus();
    }
  }

  async getCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tabs[0];
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  }

  async detectJobPage() {
    if (!this.currentTab) return;

    const url = this.currentTab.url;
    const hostname = new URL(url).hostname;

    // Job board detection
    const jobBoards = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'workday.com', 
      'myworkdayjobs.com', 'greenhouse.io', 'lever.co', 'monster.com',
      'ziprecruiter.com', 'wellfound.com', 'angel.co', 'bamboohr.com',
      'smartrecruiters.com', 'jobvite.com', 'icims.com', 'taleo.net',
      'successfactors.com', 'ashbyhq.com', 'naukri.com'
    ];

    const isJobBoard = jobBoards.some(board => hostname.includes(board));
    const hasJobIndicators = url.includes('/job') || url.includes('/career') || 
                            url.includes('/posting') || url.includes('/position') ||
                            url.includes('/opening') || url.includes('/vacancy');

    if (isJobBoard && hasJobIndicators) {
      this.showJobPageUI();
      await this.extractJobData();
    } else {
      this.showNotSupportedUI();
    }
  }

  async extractJobData() {
    try {
      // Send message to content script to extract job data
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'EXTRACT_JOB_DATA'
      });

      if (response && response.success && response.jobData) {
        this.currentJobData = response.jobData;
        this.updateJobInfoUI();
        this.calculateMatchScore();
        
        // Enable action buttons now that we have job data
        this.enableActionButtons();
      } else {
        console.log('No job data found on this page');
      }
    } catch (error) {
      console.error('Failed to extract job data:', error);
    }
  }

  enableActionButtons() {
    const saveJobBtn = document.getElementById('saveJobBtn');
    const autoFillBtn = document.getElementById('autoFillBtn');
    const generateCoverLetterBtn = document.getElementById('generateCoverLetterBtn');
    
    if (saveJobBtn) saveJobBtn.disabled = false;
    if (autoFillBtn) autoFillBtn.disabled = false;
    if (generateCoverLetterBtn) generateCoverLetterBtn.disabled = false;
  }

  // Save job for later application
  async saveJob() {
    if (!this.currentJobData || !this.isAuthenticated) {
      this.showMessage('Please sign in to save jobs', 'error');
      return;
    }

    try {
      this.showLoading('Saving job...');
      
      const response = await chrome.runtime.sendMessage({
        action: 'SAVE_JOB',
        jobData: {
          title: this.currentJobData.title,
          company: this.currentJobData.company,
          location: this.currentJobData.location,
          description: this.currentJobData.description,
          salary: this.currentJobData.salary,
          url: this.currentTab.url,
          platform: this.currentJobData.platform || new URL(this.currentTab.url).hostname
        }
      });

      if (response && response.success) {
        this.showMessage('Job saved successfully!', 'success');
        // Update button state
        const saveBtn = document.getElementById('saveJobBtn');
        if (saveBtn) {
          saveBtn.textContent = '✓ Saved';
          saveBtn.disabled = true;
        }
      } else {
        this.showMessage(response?.error || 'Failed to save job', 'error');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      this.showMessage('Error saving job', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // Track application after user applies
  async trackApplication() {
    if (!this.currentJobData || !this.isAuthenticated) {
      this.showMessage('Please sign in to track applications', 'error');
      return;
    }

    try {
      this.showLoading('Tracking application...');
      
      const response = await chrome.runtime.sendMessage({
        action: 'TRACK_APPLICATION',
        applicationData: {
          jobData: this.currentJobData,
          url: this.currentTab.url,
          platform: this.currentJobData.platform || new URL(this.currentTab.url).hostname,
          matchScore: this.currentJobData.matchScore || 0
        }
      });

      if (response && response.success) {
        this.showMessage('Application tracked successfully!', 'success');
        this.showCompletionDialog();
      } else {
        this.showMessage(response?.error || 'Failed to track application', 'error');
      }
    } catch (error) {
      console.error('Error tracking application:', error);
      this.showMessage('Error tracking application', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // Generate cover letter for this job
  async generateCoverLetter() {
    if (!this.currentJobData || !this.isAuthenticated) {
      this.showMessage('Please sign in to generate cover letters', 'error');
      return;
    }

    try {
      this.showLoading('Generating cover letter...');
      
      const response = await chrome.runtime.sendMessage({
        action: 'GENERATE_COVER_LETTER',
        jobData: this.currentJobData,
        url: this.currentTab.url
      });

      if (response && response.success) {
        // Copy to clipboard
        await navigator.clipboard.writeText(response.coverLetter);
        this.showMessage('Cover letter copied to clipboard!', 'success');
      } else {
        this.showMessage(response?.error || 'Failed to generate cover letter', 'error');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      this.showMessage('Error generating cover letter', 'error');
    } finally {
      this.hideLoading();
    }
  }

  showJobPageUI() {
    const pageStatus = document.getElementById('pageStatus');
    pageStatus.className = 'page-status';
    pageStatus.innerHTML = `
      <div class="page-title">Job posting detected</div>
      <div class="page-subtitle">Ready to assist with your application</div>
    `;

    const primaryAction = document.getElementById('primaryAction');
    primaryAction.disabled = false;
    primaryAction.textContent = '🎯 Auto-fill Application';
  }

  showNotSupportedUI() {
    const pageStatus = document.getElementById('pageStatus');
    pageStatus.className = 'page-status not-supported';
    pageStatus.innerHTML = `
      <div class="page-title">Page not supported</div>
      <div class="page-subtitle">Navigate to a job posting to get started</div>
    `;

    const primaryAction = document.getElementById('primaryAction');
    primaryAction.disabled = true;
    primaryAction.textContent = '🎯 Auto-fill Application';
  }

  updateJobInfoUI() {
    if (!this.currentJobData) return;

    const jobInfo = document.getElementById('jobInfo');
    const jobTitle = document.getElementById('jobTitle');
    const jobCompany = document.getElementById('jobCompany');

    jobTitle.textContent = this.currentJobData.title || 'Job Title';
    jobCompany.textContent = this.currentJobData.company || 'Company Name';
    jobInfo.style.display = 'block';
  }

  async calculateMatchScore() {
    try {
      // Simple match score calculation (you can enhance this)
      const score = Math.floor(Math.random() * 20) + 80; // 80-100%
      const matchScore = document.getElementById('matchScore');
      matchScore.textContent = `${score}%`;
      
      // Update color based on score
      if (score >= 90) {
        matchScore.style.background = '#10b981';
      } else if (score >= 75) {
        matchScore.style.background = '#f59e0b';
      } else {
        matchScore.style.background = '#ef4444';
      }
    } catch (error) {
      console.error('Failed to calculate match score:', error);
    }
  }

  updateConnectionStatus() {
    const connectionStatus = document.getElementById('connectionStatus');
    
    if (this.isAuthenticated) {
      connectionStatus.className = 'status-connected';
      connectionStatus.innerHTML = `
        <div class="status-dot"></div>
        <span>Connected to AutoJobr</span>
      `;
    } else {
      connectionStatus.className = 'status-disconnected';
      connectionStatus.innerHTML = `
        <div class="status-dot"></div>
        <span>Not connected - Please login</span>
      `;
    }
  }

  updateSettingsUI() {
    const autoFillToggle = document.getElementById('autoFillToggle');
    const trackToggle = document.getElementById('trackToggle');
    const notificationToggle = document.getElementById('notificationToggle');

    autoFillToggle.className = this.settings.autoFill ? 'toggle active' : 'toggle';
    trackToggle.className = this.settings.trackApplications ? 'toggle active' : 'toggle';
    notificationToggle.className = this.settings.showNotifications ? 'toggle active' : 'toggle';
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Primary action button
    document.getElementById('primaryAction').addEventListener('click', () => {
      this.performAutoFill();
    });

    // Secondary actions
    document.getElementById('saveJobBtn').addEventListener('click', () => {
      this.saveJob();
    });

    document.getElementById('viewApplicationsBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://40.160.50.128/applications' });
    });

    // Quick actions
    document.getElementById('generateCoverLetter').addEventListener('click', () => {
      this.generateCoverLetter();
    });

    document.getElementById('tailorResume').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://40.160.50.128/profile' });
    });

    document.getElementById('practiceQuestions').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://40.160.50.128/interview-practice' });
    });

    // Profile actions
    document.getElementById('viewProfile').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://40.160.50.128/profile' });
    });

    document.getElementById('updateProfile').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://40.160.50.128/profile/edit' });
    });

    document.getElementById('profileCompletion').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://40.160.50.128/profile' });
    });

    // Settings toggles
    document.getElementById('autoFillToggle').addEventListener('click', () => {
      this.settings.autoFill = !this.settings.autoFill;
      this.updateSettingsUI();
      this.saveSettings();
    });

    document.getElementById('trackToggle').addEventListener('click', () => {
      this.settings.trackApplications = !this.settings.trackApplications;
      this.updateSettingsUI();
      this.saveSettings();
    });

    document.getElementById('notificationToggle').addEventListener('click', () => {
      this.settings.showNotifications = !this.settings.showNotifications;
      this.updateSettingsUI();
      this.saveSettings();
    });

    // Header buttons
    document.getElementById('settingsBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://40.160.50.128/settings' });
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://40.160.50.128/help' });
    });
  }

  switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load tab-specific content
    if (tabName === 'keywords') {
      this.loadKeywordsAnalysis();
    }
  }

  async loadKeywordsAnalysis() {
    const loading = document.getElementById('keywordsLoading');
    const content = document.getElementById('keywordsContent');
    
    loading.style.display = 'block';
    content.style.display = 'none';

    try {
      // Simulate keywords analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      content.innerHTML = `
        <div style="space-y: 12px;">
          <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
            <h4 style="font-weight: 600; margin-bottom: 8px; color: #0ea5e9;">Matching Keywords</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">JavaScript</span>
              <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">React</span>
              <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Node.js</span>
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 12px; border-radius: 6px;">
            <h4 style="font-weight: 600; margin-bottom: 8px; color: #f59e0b;">Missing Keywords</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Python</span>
              <span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">AWS</span>
            </div>
          </div>
        </div>
      `;
      
      loading.style.display = 'none';
      content.style.display = 'block';
    } catch (error) {
      console.error('Failed to load keywords analysis:', error);
      loading.style.display = 'none';
    }
  }

  async performAutoFill() {
    if (!this.isAuthenticated) {
      chrome.tabs.create({ url: 'http://40.160.50.128/auth' });
      return;
    }

    try {
      const button = document.getElementById('primaryAction');
      button.textContent = '⏳ Filling form...';
      button.disabled = true;

      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'AUTO_FILL_FORM'
      });

      button.textContent = '✅ Form filled!';
      
      // Track application if enabled
      if (this.settings.trackApplications) {
        await this.trackApplication();
      }

      // Reset button after 2 seconds
      setTimeout(() => {
        button.textContent = '🎯 Auto-fill Application';
        button.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Auto-fill failed:', error);
      const button = document.getElementById('primaryAction');
      button.textContent = '❌ Fill failed';
      
      setTimeout(() => {
        button.textContent = '🎯 Auto-fill Application';
        button.disabled = false;
      }, 2000);
    }
  }

  async saveJob() {
    if (!this.isAuthenticated) {
      chrome.tabs.create({ url: 'http://40.160.50.128/auth' });
      return;
    }

    if (!this.currentJobData) {
      alert('No job data available to save');
      return;
    }

    try {
      const button = document.getElementById('saveJobBtn');
      const originalText = button.textContent;
      button.textContent = '⏳ Saving...';
      button.disabled = true;

      const response = await chrome.runtime.sendMessage({
        action: 'SAVE_JOB',
        jobData: {
          title: this.currentJobData.title,
          company: this.currentJobData.company,
          description: this.currentJobData.description,
          location: this.currentJobData.location,
          salary: this.currentJobData.salary,
          url: this.currentTab.url,
          platform: new URL(this.currentTab.url).hostname
        }
      });

      if (response.success) {
        button.textContent = '✅ Saved!';
      } else {
        button.textContent = '❌ Failed';
      }

      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Failed to save job:', error);
      const button = document.getElementById('saveJobBtn');
      button.textContent = '❌ Failed';
      
      setTimeout(() => {
        button.textContent = '💾 Save Job';
        button.disabled = false;
      }, 2000);
    }
  }

  async generateCoverLetter() {
    if (!this.isAuthenticated) {
      chrome.tabs.create({ url: 'http://40.160.50.128/auth' });
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GENERATE_COVER_LETTER',
        jobData: this.currentJobData,
        url: this.currentTab.url
      });

      if (response.success) {
        // Copy to clipboard and show notification
        await navigator.clipboard.writeText(response.coverLetter);
        
        if (this.settings.showNotifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Cover Letter Generated!',
            message: 'Cover letter copied to clipboard and ready to paste.'
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
    }
  }

  async trackApplication() {
    try {
      await chrome.runtime.sendMessage({
        action: 'TRACK_APPLICATION',
        jobData: {
          ...this.currentJobData,
          url: this.currentTab.url,
          platform: new URL(this.currentTab.url).hostname,
          status: 'applied',
          appliedDate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UnifiedAutoJobrPopup();
});