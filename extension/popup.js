// Popup script for AutoJobr Extension
class AutoJobrPopup {
  constructor() {
    this.isAuthenticated = false;
    this.userProfile = null;
    this.currentJobData = null;
    this.settings = {
      autoFill: true,
      autoAnalyze: true,
      showNotifications: true
    };
    
    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      await this.checkAuthenticationStatus();
      this.setupEventListeners();
      this.updateUI();
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showErrorState();
    }
  }

  async loadSettings() {
    const result = await chrome.storage.local.get('autojobr_settings');
    if (result.autojobr_settings) {
      this.settings = { ...this.settings, ...result.autojobr_settings };
    }
  }

  async saveSettings() {
    await chrome.storage.local.set({ autojobr_settings: this.settings });
  }

  async checkAuthenticationStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
      
      if (response.success && response.authenticated) {
        this.isAuthenticated = true;
        await this.loadUserProfile();
      } else {
        this.isAuthenticated = false;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      this.isAuthenticated = false;
    }
  }

  async loadUserProfile() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_PROFILE' });
      if (response.success) {
        this.userProfile = response.profile;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  setupEventListeners() {
    // Authentication actions
    document.getElementById('open-platform')?.addEventListener('click', () => {
      this.openAutoJobrPlatform();
    });

    document.getElementById('refresh-auth')?.addEventListener('click', () => {
      this.refreshAuthentication();
    });

    document.getElementById('retry-connection')?.addEventListener('click', () => {
      this.retryConnection();
    });

    // Main actions
    document.getElementById('fill-forms')?.addEventListener('click', () => {
      this.fillForms();
    });

    document.getElementById('generate-cover-letter')?.addEventListener('click', () => {
      this.generateCoverLetter();
    });

    document.getElementById('analyze-job')?.addEventListener('click', () => {
      this.analyzeJob();
    });

    document.getElementById('refresh-profile')?.addEventListener('click', () => {
      this.refreshProfile();
    });

    // Settings toggles
    document.getElementById('toggle-autofill')?.addEventListener('click', (e) => {
      this.toggleSetting('autoFill', e.target);
    });

    document.getElementById('toggle-analyze')?.addEventListener('click', (e) => {
      this.toggleSetting('autoAnalyze', e.target);
    });

    document.getElementById('toggle-notifications')?.addEventListener('click', (e) => {
      this.toggleSetting('showNotifications', e.target);
    });

    // Footer links
    document.getElementById('open-dashboard')?.addEventListener('click', () => {
      this.openPage('/dashboard');
    });

    document.getElementById('open-help')?.addEventListener('click', () => {
      this.openPage('/help');
    });

    document.getElementById('open-settings')?.addEventListener('click', () => {
      this.openPage('/settings');
    });
  }

  updateUI() {
    this.hideAllStates();

    if (this.isAuthenticated) {
      this.showAuthenticatedState();
    } else {
      this.showUnauthenticatedState();
    }

    this.updateSettings();
  }

  hideAllStates() {
    document.getElementById('loading-state')?.classList.add('hidden');
    document.getElementById('error-state')?.classList.add('hidden');
    document.getElementById('authenticated-state')?.classList.add('hidden');
    document.getElementById('unauthenticated-state')?.classList.add('hidden');
  }

  showLoadingState() {
    this.hideAllStates();
    document.getElementById('loading-state')?.classList.remove('hidden');
  }

  showErrorState() {
    this.hideAllStates();
    document.getElementById('error-state')?.classList.remove('hidden');
  }

  showAuthenticatedState() {
    document.getElementById('authenticated-state')?.classList.remove('hidden');
    this.updateProfileInfo();
    this.updateJobAnalysis();
  }

  showUnauthenticatedState() {
    document.getElementById('unauthenticated-state')?.classList.remove('hidden');
  }

  updateProfileInfo() {
    if (!this.userProfile?.profile) return;

    const profile = this.userProfile.profile;
    const avatar = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U';
    
    document.getElementById('user-avatar').textContent = avatar;
    document.getElementById('user-name').textContent = profile.fullName || 'User';
    document.getElementById('user-title').textContent = profile.jobTitle || 'Job Seeker';

    // Update stats (placeholder for now - can be enhanced with real data)
    document.getElementById('applications-count').textContent = '12';
    document.getElementById('success-rate').textContent = '85%';
  }

  updateJobAnalysis() {
    // This would be populated with actual job analysis data
    // For now, we'll hide it unless we have real data
    const jobAnalysisElement = document.getElementById('job-analysis');
    if (this.currentJobData?.analysis) {
      const analysis = this.currentJobData.analysis;
      const score = analysis.matchScore || 0;
      const scoreClass = score >= 80 ? 'score-high' : score >= 60 ? 'score-medium' : 'score-low';
      
      document.getElementById('match-score-circle').className = `score-circle ${scoreClass}`;
      document.getElementById('match-score-circle').textContent = `${score}%`;
      document.getElementById('analysis-summary').textContent = analysis.summary || 'Job requirements analyzed';
      
      jobAnalysisElement?.classList.remove('hidden');
    } else {
      jobAnalysisElement?.classList.add('hidden');
    }
  }

  updateSettings() {
    const toggles = {
      'toggle-autofill': this.settings.autoFill,
      'toggle-analyze': this.settings.autoAnalyze,
      'toggle-notifications': this.settings.showNotifications
    };

    for (const [elementId, isActive] of Object.entries(toggles)) {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.toggle('active', isActive);
      }
    }
  }

  async openAutoJobrPlatform() {
    const url = 'https://ab8b7c11-4933-4f20-96ce-3083dfb2112d-00-3bpxputy7khv2.riker.replit.dev/login';
    await chrome.tabs.create({ url });
    window.close();
  }

  async openPage(path) {
    const url = `https://ab8b7c11-4933-4f20-96ce-3083dfb2112d-00-3bpxputy7khv2.riker.replit.dev${path}`;
    await chrome.tabs.create({ url });
    window.close();
  }

  async refreshAuthentication() {
    this.showLoadingState();
    await this.checkAuthenticationStatus();
    this.updateUI();
  }

  async retryConnection() {
    this.showLoadingState();
    setTimeout(() => {
      this.checkAuthenticationStatus().then(() => {
        this.updateUI();
      });
    }, 1000);
  }

  async fillForms() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'FILL_FORMS',
        userProfile: this.userProfile
      });

      this.showSuccessMessage('Form filling initiated');
      window.close();
    } catch (error) {
      console.error('Failed to fill forms:', error);
      this.showErrorMessage('Failed to fill forms');
    }
  }

  async generateCoverLetter() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'GENERATE_COVER_LETTER'
      });

      this.showSuccessMessage('Cover letter generation started');
      window.close();
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
      this.showErrorMessage('Failed to generate cover letter');
    }
  }

  async analyzeJob() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.tabs.sendMessage(tab.id, {
        action: 'ANALYZE_JOB'
      });

      this.showSuccessMessage('Job analysis started');
      window.close();
    } catch (error) {
      console.error('Failed to analyze job:', error);
      this.showErrorMessage('Failed to analyze job');
    }
  }

  async refreshProfile() {
    try {
      this.showLoadingState();
      
      const response = await chrome.runtime.sendMessage({ action: 'REFRESH_PROFILE' });
      
      if (response.success) {
        this.userProfile = response.profile;
        this.showSuccessMessage('Profile refreshed');
      } else {
        this.showErrorMessage('Failed to refresh profile');
      }
      
      this.updateUI();
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      this.showErrorMessage('Failed to refresh profile');
      this.updateUI();
    }
  }

  toggleSetting(settingName, element) {
    this.settings[settingName] = !this.settings[settingName];
    element.classList.toggle('active', this.settings[settingName]);
    this.saveSettings();

    // Also send message to content script to update settings
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'UPDATE_SETTINGS',
          settings: this.settings
        }).catch(() => {
          // Content script might not be loaded, which is fine
        });
      }
    });
  }

  showSuccessMessage(message) {
    // Could implement a toast notification system here
    console.log('Success:', message);
  }

  showErrorMessage(message) {
    // Could implement a toast notification system here
    console.error('Error:', message);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AutoJobrPopup();
});