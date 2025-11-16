// AutoJobr Extension Popup - Fixed version with working buttons
let API_BASE_URL = 'https://autojobr.com';
let popupInstance = null;

// Get API URL from background
async function getApiUrl() {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ action: 'getApiUrl' }, (response) => {
        if (chrome.runtime.lastError || !response?.apiUrl) {
          console.log('Using fallback API URL:', API_BASE_URL);
          resolve(API_BASE_URL);
        } else {
          API_BASE_URL = response.apiUrl;
          console.log('Using API URL from background:', API_BASE_URL);
          resolve(response.apiUrl);
        }
      });
    } catch (error) {
      console.log('Error getting API URL:', error);
      resolve(API_BASE_URL);
    }
  });
}

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.isAuthenticated = false;
    this.userProfile = null;
  }

  async init() {
    console.log('🚀 Initializing AutoJobr popup...');
    
    try {
      // Wait for API URL
      await getApiUrl();
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Setup everything
      this.setupTabs();
      this.setupEventListeners();
      await this.checkStatus();
      await this.loadUserProfile();
      this.analyzePage();
      this.loadTasks();
      
      console.log('✅ Popup initialized successfully');
    } catch (error) {
      console.error('❌ Init error:', error);
    }
  }

  setupTabs() {
    console.log('Setting up tabs...');
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Tab clicked:', tab.dataset.tab);
        
        // Remove active from all
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        // Add active to clicked
        tab.classList.add('active');
        const targetId = tab.dataset.tab;
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Close button
    this.safeAddListener('closePopup', () => this.closePopup());
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closePopup();
      }
    });
    
    // Apply tab buttons - using safe click handlers
    this.safeAddListener('autofillBtn', () => this.handleAutofill());
    this.safeAddListener('analyzeBtn', () => this.handleAnalyze());
    this.safeAddListener('saveJobBtn', () => this.handleSaveJob());
    this.safeAddListener('coverLetterBtn', () => this.handleCoverLetter());

    // Tasks tab
    this.safeAddListener('addTaskBtn', () => this.handleAddTask());

    // AI tab
    this.safeAddListener('aiSendBtn', () => this.handleAIChat());
    
    // AI input enter key
    const aiInput = document.getElementById('aiInput');
    if (aiInput) {
      aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleAIChat();
        }
      });
    }

    // Settings tab
    this.safeAddListener('profileBtn', () => this.openDashboardTab('/profile'));
    this.safeAddListener('historyBtn', () => this.openDashboardTab('/applications'));
    this.safeAddListener('manageKeysBtn', () => this.openDashboardTab('/profile#integrations'));

    // Footer
    this.safeAddListener('openDashboard', () => this.openDashboardTab('/'));

    // Toggles
    this.setupToggle('autofillToggle', 'autofillEnabled');
    this.setupToggle('trackingToggle', 'trackingEnabled');
    this.setupToggle('notificationsToggle', 'notificationsEnabled');
    
    console.log('✅ Event listeners set up');
  }

  safeAddListener(id, handler) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Button clicked:', id);
        try {
          handler();
        } catch (error) {
          console.error(`Error in ${id} handler:`, error);
          this.showNotification('An error occurred. Please try again.');
        }
      });
      console.log(`✓ Listener added for ${id}`);
    } else {
      console.warn(`⚠ Element not found: ${id}`);
    }
  }

  closePopup() {
    // Close the popup properly - this works in Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.action) {
      // For MV3, just close by setting popup to empty
      window.close();
    } else {
      // Fallback
      window.close();
    }
  }

  setupToggle(elementId, storageKey) {
    const toggle = document.getElementById(elementId);
    if (!toggle) {
      console.warn(`Toggle not found: ${elementId}`);
      return;
    }

    // Load current state
    chrome.storage.sync.get([storageKey], (result) => {
      const isEnabled = result[storageKey] !== false;
      toggle.classList.toggle('active', isEnabled);
    });

    // Handle clicks
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isActive = toggle.classList.contains('active');
      const newState = !isActive;
      toggle.classList.toggle('active', newState);
      chrome.storage.sync.set({ [storageKey]: newState });
      const label = storageKey.replace('Enabled', '');
      this.showNotification(`${label} ${newState ? 'enabled' : 'disabled'}`);
    });
  }

  async loadUserProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        this.userProfile = await response.json();
        console.log('User profile loaded:', this.userProfile);
      }
    } catch (error) {
      console.log('Could not load user profile:', error);
    }
  }

  async checkStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        mode: 'cors'
      });
      
      const isConnected = response.ok;
      const statusDot = document.getElementById('statusDot');
      const statusText = document.getElementById('statusText');
      
      if (statusDot && statusText) {
        if (isConnected) {
          statusDot.classList.remove('disconnected');
          statusText.textContent = 'Connected';
          
          // Check auth
          try {
            const authResponse = await fetch(`${API_BASE_URL}/api/user`, {
              credentials: 'include',
              mode: 'cors'
            });
            this.isAuthenticated = authResponse.ok;
            if (this.isAuthenticated) {
              statusText.textContent = 'Authenticated';
            }
          } catch {}
        } else {
          statusDot.classList.add('disconnected');
          statusText.textContent = 'Offline';
        }
      }
    } catch (error) {
      console.log('Status check failed:', error);
      const statusDot = document.getElementById('statusDot');
      const statusText = document.getElementById('statusText');
      if (statusDot) statusDot.classList.add('disconnected');
      if (statusText) statusText.textContent = 'Offline';
    }
  }

  async analyzePage() {
    const url = this.currentTab?.url || '';
    const pageInfo = document.getElementById('pageInfo');
    const pageStatus = document.getElementById('pageStatus');

    if (!pageInfo || !pageStatus) return;

    const supportedSites = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 
      'ziprecruiter.com', 'monster.com', 'dice.com',
      'greenhouse.io', 'lever.co', 'workday.com'
    ];

    const isSupported = supportedSites.some(site => url.includes(site));

    if (isSupported) {
      pageInfo.className = 'info-card success';
      pageStatus.textContent = '✓ Supported job board detected';
      this.detectJobDetails();
    } else {
      pageInfo.className = 'info-card';
      pageStatus.textContent = 'Navigate to a supported job board';
    }
  }

  async detectJobDetails() {
    try {
      const response = await this.sendMessageToTab({ action: 'extractJobDetails' });
      if (response?.success && response.jobData) {
        const jobInfo = document.getElementById('jobInfo');
        const jobTitle = document.getElementById('jobTitle');
        const jobCompany = document.getElementById('jobCompany');
        
        if (jobInfo && jobTitle && jobCompany) {
          jobTitle.textContent = response.jobData.title || 'Job Position';
          jobCompany.textContent = response.jobData.company || 'Company';
          jobInfo.classList.remove('hidden');
        }
      }
    } catch (error) {
      console.log('Could not detect job details:', error);
    }
  }

  async sendMessageToTab(message) {
    return new Promise((resolve) => {
      if (!this.currentTab || !this.currentTab.id) {
        resolve(null);
        return;
      }
      
      try {
        chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Tab message error:', chrome.runtime.lastError.message);
            resolve(null);
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        console.log('Send message error:', error);
        resolve(null);
      }
    });
  }

  async handleAutofill() {
    console.log('🎯 Handle autofill called');
    this.showLoading(true);
    try {
      const response = await this.sendMessageToTab({ action: 'autofillApplication' });
      if (response?.success) {
        this.showNotification('✅ Auto-fill completed successfully!');
      } else {
        this.showNotification('⚠ Auto-fill failed. Please check your profile.');
      }
    } catch (error) {
      console.error('Autofill error:', error);
      this.showNotification('❌ Auto-fill failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleAnalyze() {
    console.log('📊 Handle analyze called');
    this.showLoading(true);
    try {
      const response = await this.sendMessageToTab({ action: 'analyzeJob' });
      if (response?.success) {
        const score = response.matchScore || response.analysis?.matchScore || 'N/A';
        this.showNotification(`Match Score: ${score}%`);
      } else {
        this.showNotification('Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Analyze error:', error);
      this.showNotification('Analysis failed.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleSaveJob() {
    console.log('💾 Handle save job called');
    this.showLoading(true);
    try {
      const response = await this.sendMessageToTab({ action: 'saveJob' });
      if (response?.success) {
        this.showNotification('✅ Job saved successfully!');
      } else {
        this.showNotification('❌ Failed to save job.');
      }
    } catch (error) {
      console.error('Save job error:', error);
      this.showNotification('❌ Failed to save job.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleCoverLetter() {
    console.log('📝 Handle cover letter called');
    this.showLoading(true);
    try {
      const response = await this.sendMessageToTab({ action: 'generateCoverLetter' });
      if (response?.success) {
        this.showNotification('✅ Cover letter generated!');
      } else {
        this.showNotification('❌ Failed to generate cover letter.');
      }
    } catch (error) {
      console.error('Cover letter error:', error);
      this.showNotification('❌ Failed to generate cover letter.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleAddTask() {
    console.log('➕ Handle add task called');
    const title = prompt('Task title:');
    if (title && title.trim()) {
      const task = {
        id: Date.now().toString(),
        title: title.trim(),
        createdAt: Date.now()
      };
      
      chrome.storage.local.get(['tasks'], (result) => {
        const tasks = result.tasks || [];
        tasks.push(task);
        chrome.storage.local.set({ tasks }, () => {
          this.loadTasks();
          this.showNotification('✅ Task added!');
        });
      });
    }
  }

  loadTasks() {
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      const tasksList = document.getElementById('tasksList');
      const tasksCount = document.getElementById('tasksCount');
      
      if (tasksCount) {
        tasksCount.textContent = tasks.length;
      }
      
      if (tasksList) {
        if (tasks.length === 0) {
          tasksList.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 20px; font-size: 13px;">No tasks yet</div>';
        } else {
          tasksList.innerHTML = tasks.map((task, index) => `
            <div class="task-item">
              <span>${this.escapeHtml(task.title)}</span>
              <button onclick="window.deleteTask(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Delete</button>
            </div>
          `).join('');
        }
      }
    });
  }

  async handleAIChat() {
    console.log('💬 Handle AI chat called');
    const input = document.getElementById('aiInput');
    const messages = document.getElementById('aiMessages');
    
    if (!input || !messages) {
      console.error('AI input or messages element not found');
      return;
    }
    
    const question = input.value.trim();
    
    if (!question) return;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'margin-bottom: 12px; padding: 8px; background: #eff6ff; border-radius: 6px;';
    userMsg.innerHTML = `<strong>You:</strong> ${this.escapeHtml(question)}`;
    messages.appendChild(userMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    this.showLoading(true);
    try {
      // Try to send to content script first
      const response = await this.sendMessageToTab({ 
        action: 'askAI', 
        question 
      });
      
      let answer = null;
      
      if (response?.success && response.answer) {
        answer = response.answer;
      } else {
        // Fallback to API
        const apiResponse = await fetch(`${API_BASE_URL}/api/extension/ai-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify({ question })
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          answer = data.answer;
        }
      }
      
      const aiMsg = document.createElement('div');
      aiMsg.style.cssText = 'margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 6px; color: #374151;';
      
      if (answer) {
        aiMsg.innerHTML = `<strong style="color: #3b82f6;">AI:</strong> ${this.escapeHtml(answer)}`;
      } else {
        aiMsg.innerHTML = `<strong style="color: #ef4444;">AI:</strong> Service temporarily unavailable. Please try again.`;
      }
      
      messages.appendChild(aiMsg);
      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = 'margin-bottom: 12px; padding: 8px; background: #fef2f2; border-radius: 6px; color: #ef4444;';
      errorMsg.innerHTML = `<strong>AI:</strong> Error occurred. Please try again.`;
      messages.appendChild(errorMsg);
    } finally {
      this.showLoading(false);
    }
  }

  openDashboardTab(path = '/') {
    console.log('Opening dashboard:', path);
    chrome.tabs.create({ url: `${API_BASE_URL}${path}` });
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'block' : 'none';
    }
  }

  showNotification(message) {
    console.log('Notification:', message);
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global function for task deletion
window.deleteTask = function(index) {
  chrome.storage.local.get(['tasks'], (result) => {
    const tasks = result.tasks || [];
    tasks.splice(index, 1);
    chrome.storage.local.set({ tasks }, () => {
      if (popupInstance) {
        popupInstance.loadTasks();
        popupInstance.showNotification('Task deleted!');
      }
    });
  });
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}

function initPopup() {
  console.log('🎬 DOM ready, initializing popup...');
  popupInstance = new PopupManager();
  window.popupManager = popupInstance;
  popupInstance.init();
}
