class AutoJobrPopup {
  constructor() {
    this.isAuthenticated = false;
    this.currentTab = null;
    this.settings = {
      autoFill: true,
      trackApplications: true,
      showNotifications: true,
      autoProgress: true // Enable auto-progression by default for multi-step forms
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.checkConnection();
    await this.getCurrentTab();
    this.setupEventListeners();
    this.updateUI();
    this.checkFormStatus(); // Check for multi-step forms on initialization
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
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
    await this.checkIfJobBoard();
  }

  isJobBoardUrl(url) {
    // Standard job boards
    const standardJobBoards = [
      'linkedin.com/jobs',
      'indeed.com',
      'glassdoor.com/job',
      'careers.google.com',
      'jobs.lever.co',
      'boards.greenhouse.io',
      'smartrecruiters.com',
      'monster.com/jobs',
      'ziprecruiter.com'
    ];

    // Check standard job boards
    if (standardJobBoards.some(board => url.includes(board))) {
      return true;
    }

    // Special handling for Workday
    const workdayPatterns = [
      /\.workday\.com\/[^\/]+\/careers/i,         // Standard client subdomain pattern
      /\.myworkday\.com\/[^\/]+\/d\/careers/i,    // Alternate client subdomain pattern
      /careers\..*\.workday\.com/i,               // Careers subdomain pattern
      /wd5\.myworkday\.com\/[^\/]+\/d\/inst/i     // Institution-specific pattern
    ];

    return workdayPatterns.some(pattern => pattern.test(url));
  }

  async checkIfJobBoard() {
    if (!this.currentTab || !this.currentTab.url) {
      this.isJobBoard = false;
      return;
    }
    this.isJobBoard = this.isJobBoardUrl(this.currentTab.url);
    this.updateUI();
  }

  updateConnectionStatus() {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    
    if (this.isAuthenticated) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected to AutoJobr';
    } else {
      statusDot.classList.remove('connected');
      statusText.textContent = 'Not connected - Please login';
    }
  }

  setupEventListeners() {
    // Action buttons
    document.getElementById('analyzeJobBtn').addEventListener('click', () => this.analyzeJob());
    document.getElementById('saveJobBtn').addEventListener('click', () => this.saveJob());
    document.getElementById('fillFormBtn').addEventListener('click', () => this.fillForm());
    document.getElementById('viewApplicationsBtn').addEventListener('click', () => this.viewApplications());

    // Settings toggles
    document.getElementById('autoFillToggle').addEventListener('click', () => this.toggleSetting('autoFill'));
    document.getElementById('trackToggle').addEventListener('click', () => this.toggleSetting('trackApplications'));
    document.getElementById('notificationToggle').addEventListener('click', () => this.toggleSetting('showNotifications'));
  }

  updateUI() {
    // Update toggle states
    this.updateToggle('autoFillToggle', this.settings.autoFill);
    this.updateToggle('trackToggle', this.settings.trackApplications);
    this.updateToggle('notificationToggle', this.settings.showNotifications);

    // Show message if not on a job board
    const notJobBoardMessage = document.getElementById('notJobBoardMessage');
    if (notJobBoardMessage) {
      notJobBoardMessage.style.display = this.isJobBoard ? 'none' : 'block';
    }

    // Enable/disable buttons based on authentication and job board status
    const buttons = ['analyzeJobBtn', 'saveJobBtn', 'fillFormBtn'];
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      button.disabled = !this.isAuthenticated || !this.isJobBoard;
      
      // Update button tooltip
      if (!this.isJobBoard) {
        button.title = 'Only available on supported job boards';
      } else if (!this.isAuthenticated) {
        button.title = 'Please login first';
      } else {
        button.title = '';
      }
    });

    // View applications button is always enabled when authenticated
    const viewApplicationsBtn = document.getElementById('viewApplicationsBtn');
    if (viewApplicationsBtn) {
      viewApplicationsBtn.disabled = !this.isAuthenticated;
    }
  }

  updateToggle(toggleId, isActive) {
    const toggle = document.getElementById(toggleId);
    if (isActive) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }

  async toggleSetting(settingKey) {
    this.settings[settingKey] = !this.settings[settingKey];
    await this.saveSettings();
    this.updateUI();
    
    // Send settings to content script
    try {
      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'UPDATE_SETTINGS',
        settings: this.settings
      });
    } catch (error) {
      console.error('Failed to update content script settings:', error);
    }
  }

  async checkFormStatus() {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'DETECT_FORM_STEPS'
      });

      if (response && response.success && response.steps > 1) {
        this.showFormNavigationUI(response.currentStep, response.steps);
      }
    } catch (error) {
      console.error('Form status check failed:', error);
    }
  }

  async analyzeJob() {
    if (!this.isAuthenticated || !this.isJobBoard) {
      if (!this.isAuthenticated) {
        this.showLoginPrompt();
      } else {
        this.showNotification('This feature is only available on supported job boards', 'warning');
      }
      return;
    }

    try {
      this.setButtonLoading('analyzeJobBtn', true);
      
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'ANALYZE_CURRENT_JOB'
      });

      if (response && response.success) {
        this.showNotification('Job analyzed successfully!');
      } else {
        this.showNotification('Failed to analyze job', 'error');
      }
    } catch (error) {
      console.error('Analyze job failed:', error);
      this.showNotification('Analysis failed', 'error');
    } finally {
      this.setButtonLoading('analyzeJobBtn', false);
    }
  }

  async saveJob() {
    if (!this.isAuthenticated || !this.isJobBoard) {
      if (!this.isAuthenticated) {
        this.showLoginPrompt();
      } else {
        this.showNotification('This feature is only available on supported job boards', 'warning');
      }
      return;
    }

    try {
      this.setButtonLoading('saveJobBtn', true);
      
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'SAVE_CURRENT_JOB'
      });

      if (response && response.success) {
        this.showNotification('Job saved successfully!');
      } else {
        this.showNotification('Failed to save job', 'error');
      }
    } catch (error) {
      console.error('Save job failed:', error);
      this.showNotification('Save failed', 'error');
    } finally {
      this.setButtonLoading('saveJobBtn', false);
    }
  }

  async fillForm() {
    if (!this.isAuthenticated || !this.isJobBoard) {
      if (!this.isAuthenticated) {
        this.showLoginPrompt();
      } else {
        this.showNotification('This feature is only available on supported job boards', 'warning');
      }
      return;
    }

    try {
      this.setButtonLoading('fillFormBtn', true);
      
      const autoProgress = this.settings.autoProgress;
      
      // Add timeout to prevent hanging
      const response = await Promise.race([
        chrome.tabs.sendMessage(this.currentTab.id, { 
          action: 'AUTO_FILL_FORM',
          autoProgress: autoProgress 
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: No response from content script')), 15000)
        )
      ]);

      if (response && response.success) {
        const message = response.type === 'multi-step' ? 
          `Multi-step form filled in ${response.result?.steps || 1} steps!` : 
          'Form filled successfully!';
        this.showNotification(message);
        
        // Refresh form status after filling
        setTimeout(() => this.checkFormStatus(), 2000);
      } else {
        this.showNotification(response?.error || 'Failed to fill form', 'error');
      }
    } catch (error) {
      console.error('Fill form failed:', error);
      if (error.message.includes('Timeout')) {
        this.showNotification('Content script not responding - try refreshing the page', 'error');
      } else if (error.message.includes('message channel closed')) {
        this.showNotification('Extension not loaded on this page - try refreshing', 'error');
      } else {
        this.showNotification('Fill failed: ' + error.message, 'error');
      }
    } finally {
      this.setButtonLoading('fillFormBtn', false);
    }
  }

  viewApplications() {
    const url = 'http://40.160.50.128/applications';
    chrome.tabs.create({ url: url });
  }

  showLoginPrompt() {
    const url = 'http://40.160.50.128/auth';
    chrome.tabs.create({ url: url });
  }

  setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const originalText = button.dataset.originalText || button.textContent;
    
    if (isLoading) {
      button.disabled = true;
      button.textContent = '⏳ Loading...';
      button.dataset.originalText = originalText;
    } else {
      button.disabled = !this.isAuthenticated;
      button.textContent = originalText;
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  async navigateForm(direction) {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'NAVIGATE_FORM',
        direction: direction
      });

      if (response && response.success) {
        this.showNotification(`Navigated to ${direction} step`);
        // Refresh form status after navigation
        setTimeout(() => this.checkFormStatus(), 2000);
      } else {
        this.showNotification(`No ${direction} step available`, 'error');
      }
    } catch (error) {
      console.error('Form navigation failed:', error);
      this.showNotification('Navigation failed', 'error');
    }
  }

  async askForUnknownData(fieldType) {
    const userInput = prompt(`Please provide ${fieldType}:`);
    if (userInput) {
      try {
        const response = await chrome.tabs.sendMessage(this.currentTab.id, {
          action: 'FILL_FIELD_DATA',
          fieldType: fieldType,
          data: userInput
        });

        if (response.success) {
          this.showNotification(`${fieldType} filled successfully`);
        } else {
          this.showNotification(`Failed to fill ${fieldType}`, 'error');
        }
      } catch (error) {
        console.error('Failed to fill field:', error);
        this.showNotification('Field fill failed', 'error');
      }
    }
  }

  showFormNavigationUI(currentStep, totalSteps) {
    const navigationDiv = document.createElement('div');
    navigationDiv.id = 'formNavigation';
    navigationDiv.innerHTML = `
      <div style="padding: 12px; border-top: 1px solid #e2e8f0; margin-top: 12px;">
        <div style="text-align: center; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
          Step ${currentStep} of ${totalSteps}
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="prevStepBtn" class="btn btn-secondary" style="flex: 1;" ${currentStep === 1 ? 'disabled' : ''}>← Previous</button>
          <button id="nextStepBtn" class="btn btn-primary" style="flex: 1;" ${currentStep === totalSteps ? 'disabled' : ''}>Next →</button>
        </div>
      </div>
    `;

    // Remove existing navigation
    const existing = document.getElementById('formNavigation');
    if (existing) existing.remove();

    document.querySelector('.content').appendChild(navigationDiv);

    // Add event listeners
    const prevBtn = document.getElementById('prevStepBtn');
    const nextBtn = document.getElementById('nextStepBtn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateForm('previous'));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateForm('next'));
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.autojobrPopup = new AutoJobrPopup();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UNKNOWN_FIELD_DATA') {
    const popup = window.autojobrPopup;
    if (popup) {
      popup.askForUnknownData(message.fieldType);
    }
  }
});