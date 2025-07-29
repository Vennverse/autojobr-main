// Popup script for AutoJobr Universal Extension
class AutoJobrPopup {
  constructor() {
    this.isAuthenticated = false;
    this.currentTab = null;
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
    this.updateUI();
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

    // Enable/disable buttons based on authentication
    const buttons = ['analyzeJobBtn', 'saveJobBtn', 'fillFormBtn'];
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      button.disabled = !this.isAuthenticated;
    });
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
      // Content script might not be loaded
    }
  }

  async analyzeJob() {
    if (!this.isAuthenticated) {
      this.showLoginPrompt();
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
    if (!this.isAuthenticated) {
      this.showLoginPrompt();
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
    if (!this.isAuthenticated) {
      this.showLoginPrompt();
      return;
    }

    try {
      this.setButtonLoading('fillFormBtn', true);
      
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'FILL_FORM'
      });

      if (response && response.success) {
        this.showNotification('Form filled successfully!');
      } else {
        this.showNotification('Form fill failed', 'error');
      }
    } catch (error) {
      console.error('Fill form failed:', error);
      this.showNotification('Fill failed', 'error');
    } finally {
      this.setButtonLoading('fillFormBtn', false);
    }
  }

  viewApplications() {
    const url = 'http://40.160.50.128/applications';
    chrome.tabs.create({ url: url });
  }

  showLoginPrompt() {
    const url = 'http://40.160.50.128/login';
    chrome.tabs.create({ url: url });
  }

  setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const originalText = button.textContent;
    
    if (isLoading) {
      button.disabled = true;
      button.textContent = '⏳ Loading...';
      button.dataset.originalText = originalText;
    } else {
      button.disabled = !this.isAuthenticated;
      button.textContent = button.dataset.originalText || originalText;
    }
  }

  showNotification(message, type = 'success') {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
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

  // Enhanced form navigation helpers
  async navigateForm(direction) {
    try {
      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'NAVIGATE_FORM',
        direction: direction
      });
    } catch (error) {
      console.error('Form navigation failed:', error);
    }
  }

  async askForUnknownData(fieldType) {
    const userInput = prompt(`Please provide ${fieldType}:`);
    if (userInput) {
      try {
        await chrome.tabs.sendMessage(this.currentTab.id, {
          action: 'FILL_FIELD_DATA',
          fieldType: fieldType,
          data: userInput
        });
      } catch (error) {
        console.error('Failed to fill field:', error);
      }
    }
  }

  // Multi-step form handling
  async handleMultiStepForm() {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'DETECT_FORM_STEPS'
      });

      if (response && response.steps > 1) {
        this.showFormNavigationUI(response.currentStep, response.steps);
      }
    } catch (error) {
      console.error('Multi-step form detection failed:', error);
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
          <button id="prevStepBtn" class="btn btn-secondary" style="flex: 1;">← Previous</button>
          <button id="nextStepBtn" class="btn btn-primary" style="flex: 1;">Next →</button>
        </div>
      </div>
    `;

    // Remove existing navigation
    const existing = document.getElementById('formNavigation');
    if (existing) existing.remove();

    document.querySelector('.content').appendChild(navigationDiv);

    // Add event listeners
    document.getElementById('prevStepBtn').addEventListener('click', () => this.navigateForm('previous'));
    document.getElementById('nextStepBtn').addEventListener('click', () => this.navigateForm('next'));
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AutoJobrPopup();
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