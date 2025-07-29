// Universal Content Script for AutoJobr Extension
// Works across all job sites with comprehensive form filling, navigation, and application tracking

// Import CONFIG from config.js
if (typeof window.CONFIG === 'undefined') {
  // Load config if not already loaded
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('config.js');
  document.head.appendChild(script);
}

(function() {
  'use strict';

  class UniversalJobAssistant {
    constructor() {
      this.isInitialized = false;
      this.userProfile = null;
      this.currentJobData = null;
      this.isTracking = false;
      this.formSteps = [];
      this.currentStep = 0;
      this.savedJobs = new Set();
      this.applications = new Map();
      this.autoFillEnabled = true;
      this.api = new window.AutoJobrAPI();
      this.settings = {
        autoDetect: true,
        autoFill: true,
        confirmBeforeFill: true,
        trackApplications: true,
        showNotifications: true
      };
      
      this.init();
    }

    async init() {
      if (this.isInitialized) return;
      
      try {
        await this.loadSettings();
        await this.loadUserProfile();
        await this.detectJobPage();
        await this.setupFormWatchers();
        await this.setupSubmissionDetection();
        await this.setupAutoSubmissionTracking();
        
        this.isInitialized = true;
        console.log('AutoJobr Universal Assistant initialized on:', window.location.hostname);
      } catch (error) {
        console.error('Failed to initialize AutoJobr Universal Assistant:', error);
      }
    }

    async loadSettings() {
      const result = await chrome.storage.local.get('autojobr_settings');
      if (result.autojobr_settings) {
        this.settings = { ...this.settings, ...result.autojobr_settings };
      }
    }

    async loadUserProfile() {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_PROFILE' });
        if (response.success) {
          this.userProfile = response.profile;
          console.log('User profile loaded successfully');
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    }

    async detectJobPage() {
      const hostname = window.location.hostname;
      const url = window.location.href;
      const pageText = document.body?.textContent || '';
      
      // Use CONFIG.JOB_BOARDS for detection
      const isJobSite = window.CONFIG?.JOB_BOARDS?.some(board => 
        hostname.includes(board) || url.includes(board)
      ) || false;
      
      if (isJobSite || this.detectJobContent(pageText)) {
        await this.analyzeJobPage();
        await this.createJobWidget();
      }
    }

    detectJobContent(pageText) {
      const jobKeywords = [
        'apply now', 'submit application', 'job description',
        'requirements', 'qualifications', 'responsibilities',
        'salary', 'benefits', 'employment type', 'location',
        'experience required', 'skills required'
      ];
      
      const keywordCount = jobKeywords.filter(keyword => 
        pageText.toLowerCase().includes(keyword)
      ).length;
      
      return keywordCount >= 3;
    }

    async analyzeJobPage() {
      try {
        const jobData = await this.extractJobData();
        if (jobData) {
          this.currentJobData = jobData;
          
          // Show quick analysis if enabled
          if (this.settings.autoDetect) {
            await this.showJobAnalysis(jobData);
          }
        }
      } catch (error) {
        console.error('Failed to analyze job page:', error);
      }
    }

    async extractJobData() {
      const selectors = window.CONFIG?.JOB_SELECTORS || {
        title: ['h1', '.job-title', '.position-title'],
        company: ['.company-name', '[class*="company"]'],
        location: ['.job-location', '[class*="location"]'],
        description: ['.job-description', '[class*="description"]']
      };

      const jobData = {};
      
      for (const [field, sels] of Object.entries(selectors)) {
        for (const selector of sels) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            jobData[field] = element.textContent.trim();
            break;
          }
        }
      }

      // Add URL and timestamp
      jobData.url = window.location.href;
      jobData.timestamp = Date.now();
      jobData.platform = this.detectPlatform();

      return Object.keys(jobData).length > 2 ? jobData : null;
    }

    detectPlatform() {
      const hostname = window.location.hostname;
      if (hostname.includes('linkedin.com')) return 'LinkedIn';
      if (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com')) return 'Workday';
      if (hostname.includes('indeed.com')) return 'Indeed';
      if (hostname.includes('glassdoor.com')) return 'Glassdoor';
      if (hostname.includes('greenhouse.io')) return 'Greenhouse';
      if (hostname.includes('lever.co')) return 'Lever';
      return 'Other';
    }

    async createJobWidget() {
      // Remove existing widget
      const existing = document.getElementById('autojobr-universal-widget');
      if (existing) existing.remove();

      const widget = document.createElement('div');
      widget.id = 'autojobr-universal-widget';
      widget.innerHTML = `
        <div class="autojobr-widget">
          <div class="autojobr-header">
            <span class="autojobr-logo">📋 AutoJobr</span>
            <button class="autojobr-close">×</button>
          </div>
          <div class="autojobr-content">
            <div class="autojobr-actions">
              <button class="autojobr-btn save-job" title="Save this job">💾 Save Job</button>
              <button class="autojobr-btn fill-form" title="Auto-fill application form">✏️ Fill Form</button>
              <button class="autojobr-btn analyze-job" title="Analyze job match">📊 Analyze</button>
            </div>
            <div class="autojobr-status">Ready</div>
          </div>
        </div>
      `;

      // Add styles
      this.addWidgetStyles();
      
      // Add event listeners
      widget.querySelector('.autojobr-close').onclick = () => widget.remove();
      widget.querySelector('.save-job').onclick = () => this.saveCurrentJob();
      widget.querySelector('.fill-form').onclick = () => this.autoFillForm();
      widget.querySelector('.analyze-job').onclick = () => this.analyzeCurrentJob();

      document.body.appendChild(widget);
    }

    addWidgetStyles() {
      if (document.getElementById('autojobr-universal-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'autojobr-universal-styles';
      styles.textContent = `
        .autojobr-widget {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 280px;
          background: white;
          border: 2px solid #4f46e5;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
        }
        .autojobr-header {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          padding: 12px 16px;
          border-radius: 10px 10px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .autojobr-logo {
          font-weight: bold;
          font-size: 16px;
        }
        .autojobr-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .autojobr-close:hover {
          background: rgba(255,255,255,0.2);
        }
        .autojobr-content {
          padding: 16px;
        }
        .autojobr-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        .autojobr-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          text-align: center;
        }
        .autojobr-btn:hover {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }
        .autojobr-status {
          padding: 8px 12px;
          background: #f0fdf4;
          color: #166534;
          border-radius: 6px;
          text-align: center;
          font-size: 12px;
        }
        .autojobr-notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          z-index: 10001;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          font-weight: 500;
        }
      `;
      document.head.appendChild(styles);
    }

    async saveCurrentJob() {
      if (!this.currentJobData) return;
      
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'SAVE_JOB',
          jobData: this.currentJobData
        });
        
        if (response.success) {
          this.showNotification('Job saved successfully!');
          this.savedJobs.add(this.currentJobData.url);
        } else {
          this.showNotification('Failed to save job', 'error');
        }
      } catch (error) {
        console.error('Failed to save job:', error);
        this.showNotification('Error saving job', 'error');
      }
    }

    async autoFillForm() {
      if (!this.userProfile) {
        this.showNotification('Please login to AutoJobr first', 'warning');
        return;
      }

      if (this.settings.confirmBeforeFill) {
        if (!confirm('Auto-fill the application form with your profile data?')) {
          return;
        }
      }

      try {
        await this.fillFormFields();
        this.showNotification('Form filled successfully!');
      } catch (error) {
        console.error('Auto-fill failed:', error);
        this.showNotification('Auto-fill failed', 'error');
      }
    }

    async fillFormFields() {
      if (!this.userProfile?.profile) return;

      const profile = this.userProfile.profile;
      const fieldMappings = this.getUniversalFieldMappings();
      
      // Create mapping of profile data to form fields
      const dataMapping = {
        firstName: profile.fullName?.split(' ')[0] || '',
        lastName: profile.fullName?.split(' ').slice(1).join(' ') || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        yearsExperience: this.calculateExperience(),
        university: this.getLatestEducation()?.institution || '',
        degree: this.getLatestEducation()?.degree || '',
        major: this.getLatestEducation()?.fieldOfStudy || ''
      };

      // Fill fields with enhanced timing and event handling
      for (const [dataKey, value] of Object.entries(dataMapping)) {
        if (!value) continue;
        
        const selectors = fieldMappings[dataKey] || [];
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (this.shouldFillField(element)) {
              await this.fillField(element, value);
              await this.delay(300); // Spacing between fields
            }
          }
        }
      }
    }

    getUniversalFieldMappings() {
      return window.CONFIG?.FIELD_MAPPINGS || {};
    }

    shouldFillField(element) {
      // Don't fill if already has content
      if (element.value && element.value.trim()) return false;
      
      // Don't fill hidden fields
      if (!element.offsetParent) return false;
      
      // Don't fill disabled fields
      if (element.disabled || element.readonly) return false;
      
      return true;
    }

    async fillField(element, value) {
      try {
        // Focus the field
        element.focus();
        await this.delay(100);
        
        // Clear existing value
        element.value = '';
        
        // For select elements, try to find matching option
        if (element.tagName === 'SELECT') {
          const options = Array.from(element.options);
          const match = options.find(option => 
            option.text.toLowerCase().includes(value.toLowerCase()) ||
            option.value.toLowerCase().includes(value.toLowerCase())
          );
          if (match) {
            element.selectedIndex = match.index;
            this.triggerEvents(element, ['change']);
          }
          return;
        }
        
        // Type the value character by character for better compatibility
        for (const char of value) {
          element.value += char;
          this.triggerEvents(element, ['input', 'keydown', 'keyup']);
          await this.delay(20);
        }
        
        // Trigger final events
        this.triggerEvents(element, ['input', 'change', 'blur']);
        
      } catch (error) {
        console.error('Error filling field:', error);
      }
    }

    triggerEvents(element, eventTypes) {
      eventTypes.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
      });
    }

    async setupFormWatchers() {
      // Watch for form submissions
      document.addEventListener('submit', this.handleFormSubmission.bind(this), true);
      
      // Watch for navigation away from page (indicating submission)
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
      
      // Watch for URL changes (SPA navigation)
      let currentUrl = window.location.href;
      setInterval(() => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          this.handleUrlChange();
        }
      }, 1000);
    }

    async setupSubmissionDetection() {
      const submissionIndicators = window.CONFIG?.SUBMISSION_SELECTORS || [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[data-automation-id*="submit"]',
        'button[data-automation-id*="apply"]'
      ];

      submissionIndicators.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            element.addEventListener('click', this.handleSubmissionClick.bind(this));
          });
        } catch (error) {
          // Ignore invalid selectors
        }
      });
    }

    async handleFormSubmission(event) {
      if (!this.settings.trackApplications) return;
      
      const form = event.target;
      if (this.isJobApplicationForm(form)) {
        await this.trackApplication('form_submission');
      }
    }

    async handleSubmissionClick(event) {
      if (!this.settings.trackApplications) return;
      
      const button = event.target;
      const text = button.textContent?.toLowerCase() || '';
      
      if (text.includes('apply') || text.includes('submit')) {
        await this.trackApplication('button_click');
      }
    }

    isJobApplicationForm(form) {
      const formText = form.textContent?.toLowerCase() || '';
      const indicators = ['apply', 'application', 'submit', 'resume', 'cover letter'];
      return indicators.some(indicator => formText.includes(indicator));
    }

    async trackApplication(method) {
      try {
        const applicationData = {
          jobData: this.currentJobData,
          method: method,
          timestamp: Date.now(),
          url: window.location.href,
          platform: this.detectPlatform()
        };

        const response = await chrome.runtime.sendMessage({
          action: 'TRACK_APPLICATION',
          applicationData: applicationData
        });

        if (response.success) {
          await this.showApplicationTrackedConfirmation();
        }
      } catch (error) {
        console.error('Failed to track application:', error);
      }
    }

    async showApplicationTrackedConfirmation() {
      // Create confirmation popup
      const popup = document.createElement('div');
      popup.innerHTML = `
        <div class="autojobr-confirmation-popup">
          <div class="autojobr-popup-content">
            <h3>✅ Application Tracked!</h3>
            <p>Your job application has been saved to AutoJobr.</p>
            <div class="autojobr-popup-actions">
              <a href="${window.CONFIG?.API_BASE_URL || ''}/applications" target="_blank" class="autojobr-btn-primary">
                View Applications
              </a>
              <button class="autojobr-btn-secondary" onclick="this.closest('.autojobr-confirmation-popup').remove()">
                Close
              </button>
            </div>
          </div>
        </div>
      `;

      // Add popup styles
      this.addPopupStyles();
      document.body.appendChild(popup);

      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (popup.parentNode) {
          popup.remove();
        }
      }, 10000);
    }

    addPopupStyles() {
      if (document.getElementById('autojobr-popup-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'autojobr-popup-styles';
      styles.textContent = `
        .autojobr-confirmation-popup {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10002;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .autojobr-popup-content {
          background: white;
          padding: 24px;
          border-radius: 16px;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .autojobr-popup-content h3 {
          margin: 0 0 12px 0;
          color: #10b981;
          font-size: 20px;
        }
        .autojobr-popup-content p {
          margin: 0 0 20px 0;
          color: #6b7280;
          line-height: 1.5;
        }
        .autojobr-popup-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .autojobr-btn-primary {
          background: #4f46e5;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .autojobr-btn-primary:hover {
          background: #4338ca;
        }
        .autojobr-btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .autojobr-btn-secondary:hover {
          background: #e5e7eb;
        }
      `;
      document.head.appendChild(styles);
    }

    showNotification(message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = 'autojobr-notification';
      notification.textContent = message;
      
      if (type === 'error') {
        notification.style.background = '#ef4444';
      } else if (type === 'warning') {
        notification.style.background = '#f59e0b';
      }
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 4000);
    }

    calculateExperience() {
      if (!this.userProfile?.workExperience) return '0';
      
      const experiences = this.userProfile.workExperience;
      let totalYears = 0;
      
      experiences.forEach(exp => {
        const startYear = new Date(exp.startDate).getFullYear();
        const endYear = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
        totalYears += endYear - startYear;
      });
      
      return totalYears.toString();
    }

    getLatestEducation() {
      if (!this.userProfile?.education?.length) return null;
      
      return this.userProfile.education.sort((a, b) => 
        new Date(b.endDate || '2099') - new Date(a.endDate || '2099')
      )[0];
    }

    async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async handlePageUnload() {
      // Save any pending tracking data
      if (this.isTracking) {
        await this.trackApplication('page_unload');
      }
    }

    async handleUrlChange() {
      // Re-analyze page if URL changed (SPA navigation)
      setTimeout(() => {
        this.detectJobPage();
      }, 1000);
    }

    async analyzeCurrentJob() {
      if (!this.currentJobData) {
        this.showNotification('No job data available', 'warning');
        return;
      }

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'ANALYZE_JOB',
          jobData: this.currentJobData
        });

        if (response.success) {
          this.showJobAnalysis(response.analysis);
        } else {
          this.showNotification('Analysis failed', 'error');
        }
      } catch (error) {
        console.error('Job analysis failed:', error);
        this.showNotification('Analysis error', 'error');
      }
    }

    async showJobAnalysis(analysis) {
      // Update widget status
      const statusElement = document.querySelector('.autojobr-status');
      if (statusElement) {
        statusElement.innerHTML = `Match: ${analysis.matchScore || 'N/A'}%`;
        statusElement.style.background = this.getScoreColor(analysis.matchScore);
      }
    }

    getScoreColor(score) {
      if (score >= 80) return '#dcfce7';
      if (score >= 60) return '#fef3c7';
      return '#fee2e2';
    }

    // Enhanced form navigation for multi-step forms
    async navigateFormStep(direction) {
      const nextButtons = document.querySelectorAll('button[type="submit"], button:contains("Next"), button:contains("Continue"), input[type="submit"]');
      const prevButtons = document.querySelectorAll('button:contains("Previous"), button:contains("Back"), a:contains("Back")');

      if (direction === 'next' && nextButtons.length > 0) {
        nextButtons[0].click();
        await this.delay(1000);
        return { success: true, navigated: 'next' };
      } else if (direction === 'previous' && prevButtons.length > 0) {
        prevButtons[0].click();
        await this.delay(1000);
        return { success: true, navigated: 'previous' };
      }

      return { success: false, error: 'Navigation button not found' };
    }

    // Fill specific field with user-provided data
    async fillSpecificField(fieldType, data) {
      const mappings = this.getUniversalFieldMappings();
      const selectors = mappings[fieldType] || [];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (this.shouldFillField(element)) {
            await this.fillField(element, data);
            return { success: true, filled: fieldType };
          }
        }
      }

      return { success: false, error: 'Field not found' };
    }

    // Detect form steps for multi-step forms
    detectFormSteps() {
      // Look for step indicators
      const stepIndicators = document.querySelectorAll('.step, .stepper, [class*="step"], [data-step]');
      const progressBars = document.querySelectorAll('.progress, [role="progressbar"]');
      const pageNumbers = document.querySelectorAll('[class*="page"]');

      let totalSteps = 1;
      let currentStep = 1;

      if (stepIndicators.length > 0) {
        totalSteps = stepIndicators.length;
        const activeStep = document.querySelector('.step.active, .step.current, [class*="step"][class*="active"]');
        if (activeStep) {
          currentStep = Array.from(stepIndicators).indexOf(activeStep) + 1;
        }
      } else if (progressBars.length > 0) {
        const progressBar = progressBars[0];
        const ariaValueNow = progressBar.getAttribute('aria-valuenow');
        const ariaValueMax = progressBar.getAttribute('aria-valuemax');
        if (ariaValueNow && ariaValueMax) {
          currentStep = parseInt(ariaValueNow);
          totalSteps = parseInt(ariaValueMax);
        }
      }

      return { total: totalSteps, current: currentStep };
    }

    // Enhanced submission detection that works across all platforms
    async detectApplicationSubmission() {
      // Watch for URL changes that indicate successful submission
      const originalUrl = window.location.href;
      
      // Look for success indicators
      const successIndicators = [
        'thank you', 'thanks', 'submitted', 'received', 'confirmation',
        'application sent', 'application submitted', 'success'
      ];

      const pageText = document.body.textContent.toLowerCase();
      const hasSuccessText = successIndicators.some(indicator => pageText.includes(indicator));

      if (hasSuccessText || window.location.href !== originalUrl) {
        await this.trackApplication('automatic_detection');
        await this.showApplicationTrackedConfirmation();
      }
    }

    // Auto-detection for form submissions without user interaction
    async setupAutoSubmissionTracking() {
      // Monitor for form submissions
      document.addEventListener('submit', async (event) => {
        if (this.isJobApplicationForm(event.target)) {
          setTimeout(async () => {
            await this.detectApplicationSubmission();
          }, 3000); // Wait 3 seconds for page redirect/content change
        }
      });

      // Monitor for button clicks that might submit applications
      document.addEventListener('click', async (event) => {
        const button = event.target;
        const buttonText = button.textContent?.toLowerCase() || '';
        
        if (buttonText.includes('apply') || buttonText.includes('submit')) {
          setTimeout(async () => {
            await this.detectApplicationSubmission();
          }, 3000);
        }
      });

      // Monitor for URL changes (SPA navigation)
      let currentUrl = window.location.href;
      setInterval(async () => {
        if (window.location.href !== currentUrl) {
          const newUrl = window.location.href;
          currentUrl = newUrl;
          
          // Check if URL suggests successful submission
          if (newUrl.includes('thank') || newUrl.includes('success') || newUrl.includes('confirm')) {
            await this.trackApplication('url_change_detection');
            await this.showApplicationTrackedConfirmation();
          }
        }
      }, 1000);
    }
  }

  // Global instance for message handling
  let assistantInstance = null;

  // Message listener for popup communication
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!assistantInstance) return;

    switch (message.action) {
      case 'ANALYZE_CURRENT_JOB':
        assistantInstance.analyzeCurrentJob().then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        break;

      case 'SAVE_CURRENT_JOB':
        assistantInstance.saveCurrentJob().then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        break;

      case 'FILL_FORM':
        assistantInstance.autoFillForm().then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        break;

      case 'UPDATE_SETTINGS':
        assistantInstance.settings = { ...assistantInstance.settings, ...message.settings };
        assistantInstance.saveSettings();
        sendResponse({ success: true });
        break;

      case 'NAVIGATE_FORM':
        assistantInstance.navigateFormStep(message.direction).then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        break;

      case 'FILL_FIELD_DATA':
        assistantInstance.fillSpecificField(message.fieldType, message.data).then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        break;

      case 'DETECT_FORM_STEPS':
        const steps = assistantInstance.detectFormSteps();
        sendResponse({ success: true, steps: steps.total, currentStep: steps.current });
        break;
    }

    return true; // Keep message channel open for async responses
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      assistantInstance = new UniversalJobAssistant();
    });
  } else {
    assistantInstance = new UniversalJobAssistant();
  }

  // Handle dynamic content loading
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(() => {
        if (assistantInstance) {
          assistantInstance.detectJobPage();
        } else {
          assistantInstance = new UniversalJobAssistant();
        }
      }, 2000);
    }
  }).observe(document, { subtree: true, childList: true });

})();