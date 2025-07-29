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
      this.pendingSubmission = false;
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
            <div class="autojobr-header-content">
              <div class="autojobr-icon">🚀</div>
              <span class="autojobr-title">AutoJobr Assistant</span>
            </div>
            <button class="autojobr-close">✕</button>
          </div>
          <div class="autojobr-content">
            <p class="autojobr-subtitle">Enhanced AI-powered job analysis</p>
            
            <div class="autojobr-auth-notice" id="autojobr-auth-notice" style="display: none;">
              🔴 Please Sign In
            </div>

            <div class="autojobr-analysis-result" id="autojobr-analysis-result" style="display: none;">
              <div class="autojobr-match-header">
                <span class="autojobr-match-label">AI Job Match Analysis</span>
                <div class="autojobr-match-score" id="autojobr-match-score">--</div>
              </div>
              <div class="autojobr-match-details">
                <div class="autojobr-profile-note">Complete your skills profile for better analysis</div>
                <div class="autojobr-match-stats">
                  <span id="autojobr-skills-match">0/0 Skills Match</span>
                  <span id="autojobr-experience">0y Experience</span>
                </div>
              </div>
            </div>

            <div class="autojobr-actions">
              <button class="autojobr-btn analyze-job primary">🧠 AI Job Analysis</button>
              <button class="autojobr-btn fill-form success">⚡ Smart Auto-fill</button>
              <div class="autojobr-secondary-actions">
                <button class="autojobr-btn cover-letter secondary">📝 Generate Cover Letter</button>
                <button class="autojobr-btn save-job secondary">💾 Save Job</button>
              </div>
            </div>
            
            <div class="autojobr-footer">
              <a href="#" class="autojobr-premium-link">🔄 Try Premium</a>
            </div>
          </div>
        </div>
      `;

      // Add styles
      this.addWidgetStyles();
      
      // Add event listeners
      widget.querySelector('.autojobr-close').onclick = () => {
        widget.style.transform = 'translateX(350px)';
        setTimeout(() => widget.remove(), 300);
      };
      widget.querySelector('.save-job').onclick = () => this.saveCurrentJob();
      widget.querySelector('.fill-form').onclick = () => this.autoFillForm();
      widget.querySelector('.analyze-job').onclick = () => this.analyzeCurrentJob();
      
      const coverLetterBtn = widget.querySelector('.cover-letter');
      if (coverLetterBtn) {
        coverLetterBtn.onclick = () => this.generateCoverLetter();
      }

      document.body.appendChild(widget);
      this.updateWidgetAuthStatus();

      // Auto-hide after 15 seconds
      setTimeout(() => {
        if (widget && widget.parentNode) {
          widget.style.transform = 'translateX(350px)';
          setTimeout(() => {
            if (widget.parentNode) widget.remove();
          }, 300);
        }
      }, 15000);
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
          width: 320px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          color: white;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.2);
          transform: translateX(0);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .autojobr-header {
          padding: 20px;
          border-radius: 16px 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .autojobr-header-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .autojobr-icon {
          width: 24px;
          height: 24px;
          background: rgba(255,255,255,0.2);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .autojobr-title {
          font-size: 17px;
          font-weight: 600;
          margin: 0;
        }
        .autojobr-logo {
          font-weight: bold;
          font-size: 16px;
        }
        .autojobr-close {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 6px;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .autojobr-close:hover {
          background: rgba(255,255,255,0.2);
        }
        .autojobr-content {
          padding: 0 20px 20px 20px;
        }
        .autojobr-subtitle {
          margin: 0 0 16px 0;
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.4;
        }
        .autojobr-auth-notice {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          font-size: 13px;
        }
        .autojobr-analysis-result {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 13px;
        }
        .autojobr-match-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .autojobr-match-label {
          font-weight: 500;
        }
        .autojobr-match-score {
          background: rgba(34, 197, 94, 0.8);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .autojobr-profile-note {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 8px;
        }
        .autojobr-match-stats {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .autojobr-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .autojobr-secondary-actions {
          display: flex;
          gap: 8px;
        }
        .autojobr-btn {
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }
        .autojobr-btn.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 12px 20px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .autojobr-btn.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 12px 20px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .autojobr-btn.secondary {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 10px 16px;
          font-size: 12px;
          flex: 1;
        }
        .autojobr-footer {
          margin-top: 12px;
          text-align: center;
        }
        .autojobr-premium-link {
          color: rgba(255,255,255,0.7);
          font-size: 11px;
          text-decoration: none;
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

    async autoFillForm(autoProgress = false) {
      console.log('🤖 Starting enhanced auto-fill...', autoProgress ? 'with auto-progression' : 'single step');
      
      if (!this.userProfile) {
        this.showNotification('Please login to AutoJobr first', 'warning');
        return { success: false, error: 'No user profile' };
      }

      if (this.settings.confirmBeforeFill) {
        if (!confirm('Auto-fill the application form with your profile data?')) {
          return { success: false, error: 'User cancelled' };
        }
      }

      // Check if this is a multi-step form
      const formStructure = this.detectFormSteps();
      
      if (autoProgress && formStructure.isMultiStep) {
        // Use auto-progression for multi-step forms
        this.showNotification('Auto-filling multi-step form...', 'info');
        return await this.autoProgressForm();
      } else {
        // Use single-step fill for simple forms
        this.showNotification('Auto-filling form...', 'info');
        try {
          await this.fillFormFields();
          this.showNotification('Form filled successfully!');
          return { success: true, type: 'single-step' };
        } catch (error) {
          console.error('Auto-fill failed:', error);
          this.showNotification('Auto-fill failed', 'error');
          return { success: false, error: error.message };
        }
      }
    }

    async fillFormFields() {
      if (!this.userProfile?.profile) {
        console.log('❌ No user profile available');
        return;
      }

      console.log('🚀 Starting form fill with profile:', this.userProfile.profile);
      
      // Check if this is a Workday form for specialized handling
      if (this.isWorkdayForm()) {
        console.log('🏢 Detected Workday form, using specialized filling');
        return await this.fillWorkdayForm();
      }

      const profile = this.userProfile.profile;
      const fieldMappings = this.getUniversalFieldMappings();
      
      // Create comprehensive mapping of profile data to form fields
      const latestEducation = this.getLatestEducation();
      const latestWork = this.getLatestWorkExperience();
      const skillsList = this.getSkillsList();
      
      const dataMapping = {
        // Basic Information
        firstName: profile.fullName?.split(' ')[0] || '',
        lastName: profile.fullName?.split(' ').slice(1).join(' ') || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || 'United States',
        
        // Professional Links
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || profile.website || '',
        
        // Work Authorization (Use onboarding data)
        workAuthorization: profile.workAuthorization || 'Yes',
        requireSponsorship: profile.requiresSponsorship || 'No',
        
        // Education Information
        university: latestEducation?.institution || '',
        degree: latestEducation?.degree || '',
        major: latestEducation?.fieldOfStudy || '',
        gpa: latestEducation?.gpa || '',
        graduationYear: latestEducation?.endDate ? new Date(latestEducation.endDate).getFullYear().toString() : '',
        
        // Professional Experience
        yearsExperience: this.calculateExperience().toString(),
        currentCompany: latestWork?.company || '',
        currentTitle: latestWork?.position || profile.professionalTitle || '',
        
        // Skills and Technical Information
        programmingLanguages: skillsList.technical.join(', '),
        certifications: skillsList.certifications.join(', '),
        
        // Salary and Preferences (From onboarding)
        expectedSalary: profile.expectedSalary || profile.currentSalary || '',
        salaryRange: profile.salaryRange || this.formatSalaryRange(profile.expectedSalary),
        availableStartDate: profile.availableStartDate || this.getAvailableStartDate(),
        willingToRelocate: profile.willingToRelocate || profile.relocateWillingness || 'Open to discuss',
        preferredWorkLocation: profile.preferredWorkLocation || profile.workLocationPreference || 'Remote/Hybrid',
        
        // Additional Information (From onboarding & resume analysis)
        coverLetter: profile.preferredCoverLetter || this.generateQuickCoverLetter(),
        whyInterested: profile.careerObjective || this.generateInterestStatement(),
        additionalInfo: profile.summary || profile.professionalSummary || profile.resumeSummary || '',
        
        // References (From onboarding)
        referenceName: profile.referenceName || this.getReference('name'),
        referenceEmail: profile.referenceEmail || this.getReference('email'),
        referencePhone: profile.referencePhone || this.getReference('phone'),
        
        // Demographics (From onboarding responses if provided)
        gender: profile.gender || '',
        ethnicity: profile.ethnicity || '',
        veteranStatus: profile.veteranStatus || profile.militaryService || '',
        disability: profile.disabilityStatus || '',
        
        // Additional fields from resume analysis
        achievements: this.getAchievements(),
        projectExperience: this.getProjectExperience(),
        languages: profile.spokenLanguages || this.getLanguages(),
        industries: this.getIndustryExperience(),
        managementExperience: profile.managementExperience || this.hasManagementExperience(),
        teamSize: profile.teamSize || this.getTeamSizeExperience(),
        
        // Workday-specific mappings (use same data but different selectors)
        workdayFirstName: profile.fullName?.split(' ')[0] || '',
        workdayLastName: profile.fullName?.split(' ').slice(1).join(' ') || '',
        workdayEmail: profile.email || '',
        workdayPhone: profile.phone || '',
        workdayAddress: profile.address || '',
        workdayCity: profile.city || '',
        workdayState: profile.state || '',
        workdayZip: profile.zipCode || '',
        workdayCountry: profile.country || 'United States'
      };

      // Fill fields with enhanced timing and event handling
      console.log('📝 Starting to fill fields...');
      let fieldsFilledCount = 0;
      
      for (const [dataKey, value] of Object.entries(dataMapping)) {
        if (!value) continue;
        
        const selectors = fieldMappings[dataKey] || [];
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (this.shouldFillField(element)) {
              console.log(`🎯 Filling ${dataKey} with "${value}" using selector: ${selector}`);
              await this.fillField(element, value);
              fieldsFilledCount++;
              await this.delay(300); // Spacing between fields
            }
          }
        }
      }
      
      console.log(`✅ Form filling complete: ${fieldsFilledCount} fields filled`);
    }

    isWorkdayForm() {
      return window.location.hostname.includes('workday') || 
             window.location.hostname.includes('myworkdayjobs') ||
             document.querySelector('[data-automation-id]') !== null;
    }

    async fillWorkdayForm() {
      console.log('🏢 Filling Workday form with specialized logic');
      const profile = this.userProfile.profile;
      let fieldsFilledCount = 0;

      // Workday-specific field mapping with enhanced selectors
      const workdayFields = [
        { key: 'firstName', value: profile.fullName?.split(' ')[0] || '', selectors: [
          'input[data-automation-id*="firstName"]',
          'input[data-automation-id*="legalNameSection_firstName"]',
          'input[aria-label*="first name" i]',
          'input[placeholder*="first name" i]',
          'input[name*="first" i]'
        ]},
        { key: 'lastName', value: profile.fullName?.split(' ').slice(1).join(' ') || '', selectors: [
          'input[data-automation-id*="lastName"]',
          'input[data-automation-id*="legalNameSection_lastName"]',
          'input[aria-label*="last name" i]',
          'input[placeholder*="last name" i]',
          'input[name*="last" i]'
        ]},
        { key: 'email', value: profile.email || '', selectors: [
          'input[data-automation-id*="email"]',
          'input[type="email"]',
          'input[aria-label*="email" i]',
          'input[placeholder*="email" i]'
        ]},
        { key: 'phone', value: profile.phone || '', selectors: [
          'input[data-automation-id*="phone"]',
          'input[type="tel"]',
          'input[aria-label*="phone" i]',
          'input[placeholder*="phone" i]'
        ]},
        { key: 'country', value: profile.country || 'India', selectors: [
          'select[data-automation-id*="country"]',
          'select[aria-label*="country" i]',
          'input[data-automation-id*="country"]'
        ]}
      ];

      // Fill each Workday field
      for (const field of workdayFields) {
        if (!field.value) continue;
        
        for (const selector of field.selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`🎯 Found ${elements.length} elements for ${field.key} using: ${selector}`);
            
            for (const element of elements) {
              if (this.shouldFillField(element)) {
                console.log(`✏️ Filling ${field.key} with "${field.value}"`);
                await this.fillField(element, field.value);
                fieldsFilledCount++;
                await this.delay(500); // Longer delay for Workday
                break; // Only fill the first matching element
              }
            }
            break; // Break if we found elements with this selector
          }
        }
      }

      console.log(`✅ Workday form filling complete: ${fieldsFilledCount} fields filled`);
      return fieldsFilledCount;
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

    getLatestWorkExperience() {
      if (!this.userProfile?.workExperience?.length) return null;
      return this.userProfile.workExperience.sort((a, b) => 
        new Date(b.endDate || '2030') - new Date(a.endDate || '2030')
      )[0];
    }

    getSkillsList() {
      const skills = this.userProfile?.skills || [];
      const technical = skills.filter(s => 
        ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Git']
        .some(tech => s.skillName?.toLowerCase().includes(tech.toLowerCase()))
      ).map(s => s.skillName);
      
      const certifications = skills.filter(s => 
        s.skillName?.toLowerCase().includes('certified') || 
        s.skillName?.toLowerCase().includes('certification')
      ).map(s => s.skillName);
      
      return { technical, certifications };
    }

    getAvailableStartDate() {
      const date = new Date();
      date.setDate(date.getDate() + 14); // 2 weeks notice
      return date.toISOString().split('T')[0];
    }

    generateQuickCoverLetter() {
      const profile = this.userProfile?.profile;
      if (!profile || !this.currentJobData) return '';
      
      return `Dear Hiring Manager,

I am excited to apply for the ${this.currentJobData.title || 'position'} at ${this.currentJobData.company || 'your company'}. With ${this.calculateExperience()} years of experience in ${profile.professionalTitle || 'my field'}, I am confident I would be a valuable addition to your team.

${profile.summary || 'I have a strong background in technology and am passionate about delivering excellent results.'}

I look forward to discussing how my skills and experience can contribute to your team's success.

Best regards,
${profile.fullName || 'Your Name'}`;
    }

    generateInterestStatement() {
      if (!this.currentJobData) return '';
      
      return `I am particularly interested in this ${this.currentJobData.title || 'position'} because it aligns perfectly with my career goals and technical expertise. The opportunity to work with ${this.currentJobData.company || 'your team'} would allow me to contribute my skills while continuing to grow professionally in an innovative environment.`;
    }

    // Helper methods to extract onboarding and resume analysis data
    formatSalaryRange(expectedSalary) {
      if (!expectedSalary) return '';
      const salary = parseInt(expectedSalary.replace(/[^0-9]/g, ''));
      if (salary) {
        const min = Math.floor(salary * 0.9);
        const max = Math.floor(salary * 1.1);
        return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
      }
      return '';
    }

    getReference(type) {
      const references = this.userProfile?.references || [];
      if (references.length === 0) return '';
      
      const firstRef = references[0];
      switch(type) {
        case 'name': return firstRef.name || '';
        case 'email': return firstRef.email || '';
        case 'phone': return firstRef.phone || '';
        default: return '';
      }
    }

    getAchievements() {
      const profile = this.userProfile?.profile;
      const achievements = [];
      
      // From resume analysis
      if (profile?.achievements) achievements.push(...profile.achievements);
      if (profile?.awards) achievements.push(...profile.awards);
      
      // From work experience
      this.userProfile?.workExperience?.forEach(exp => {
        if (exp.achievements) achievements.push(...exp.achievements);
      });
      
      return achievements.join('; ').substring(0, 500); // Limit length
    }

    getProjectExperience() {
      const projects = this.userProfile?.projects || [];
      if (projects.length === 0) return '';
      
      return projects.map(p => `${p.name}: ${p.description || ''}`).join('; ').substring(0, 300);
    }

    getLanguages() {
      const profile = this.userProfile?.profile;
      const languages = [];
      
      if (profile?.languages) languages.push(...profile.languages);
      if (profile?.spokenLanguages) languages.push(...profile.spokenLanguages);
      
      return languages.join(', ');
    }

    getIndustryExperience() {
      const industries = new Set();
      
      this.userProfile?.workExperience?.forEach(exp => {
        if (exp.industry) industries.add(exp.industry);
        if (exp.company) {
          // Infer industry from company name patterns
          const company = exp.company.toLowerCase();
          if (company.includes('tech') || company.includes('software')) industries.add('Technology');
          if (company.includes('bank') || company.includes('financial')) industries.add('Financial Services');
          if (company.includes('health') || company.includes('medical')) industries.add('Healthcare');
        }
      });
      
      return Array.from(industries).join(', ');
    }

    hasManagementExperience() {
      const profile = this.userProfile?.profile;
      const workExp = this.userProfile?.workExperience || [];
      
      // Check if title suggests management
      const managementTitles = ['manager', 'director', 'lead', 'supervisor', 'head', 'chief', 'vp', 'president'];
      const hasManagementTitle = workExp.some(exp => 
        managementTitles.some(title => 
          exp.position?.toLowerCase().includes(title)
        )
      );
      
      if (hasManagementTitle) return 'Yes';
      if (profile?.managementExperience) return profile.managementExperience;
      
      return 'No';
    }

    getTeamSizeExperience() {
      const profile = this.userProfile?.profile;
      
      if (profile?.teamSize) return profile.teamSize;
      if (profile?.managementExperience === 'Yes') return '5-10 people';
      if (this.hasManagementExperience() === 'Yes') return '3-8 people';
      
      return '';
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
          this.updateAnalysisDisplay(response.analysis);
        } else {
          this.showNotification('Analysis failed', 'error');
        }
      } catch (error) {
        console.error('Job analysis failed:', error);
        this.showNotification('Analysis error', 'error');
      }
    }

    async generateCoverLetter() {
      if (!this.currentJobData) {
        this.showNotification('No job data available', 'warning');
        return;
      }

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'GENERATE_COVER_LETTER',
          jobData: this.currentJobData
        });

        if (response.success) {
          this.showNotification('Cover letter generated!');
          // Could open in new tab or copy to clipboard
          navigator.clipboard.writeText(response.coverLetter);
        } else {
          this.showNotification('Cover letter generation failed', 'error');
        }
      } catch (error) {
        console.error('Cover letter generation failed:', error);
        this.showNotification('Cover letter error', 'error');
      }
    }

    async updateWidgetAuthStatus() {
      const authNotice = document.getElementById('autojobr-auth-notice');
      const analysisResult = document.getElementById('autojobr-analysis-result');
      
      try {
        const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
        
        if (response.authenticated) {
          if (authNotice) authNotice.style.display = 'none';
          if (analysisResult) analysisResult.style.display = 'block';
        } else {
          if (authNotice) authNotice.style.display = 'block';
          if (analysisResult) analysisResult.style.display = 'none';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (authNotice) authNotice.style.display = 'block';
        if (analysisResult) analysisResult.style.display = 'none';
      }
    }

    updateAnalysisDisplay(analysis) {
      const matchScore = document.getElementById('autojobr-match-score');
      const skillsMatch = document.getElementById('autojobr-skills-match');
      const experience = document.getElementById('autojobr-experience');
      
      if (matchScore && analysis.matchScore) {
        matchScore.textContent = `${analysis.matchScore}%`;
        matchScore.className = 'autojobr-match-score';
        if (analysis.matchScore >= 80) {
          matchScore.style.background = 'rgba(34, 197, 94, 0.8)';
        } else if (analysis.matchScore >= 60) {
          matchScore.style.background = 'rgba(251, 191, 36, 0.8)';
        } else {
          matchScore.style.background = 'rgba(239, 68, 68, 0.8)';
        }
      }
      
      if (skillsMatch && analysis.skillsMatched) {
        skillsMatch.textContent = `${analysis.skillsMatched}/${analysis.totalSkills || 0} Skills Match`;
      }
      
      if (experience && this.userProfile) {
        experience.textContent = `${this.calculateExperience()}y Experience`;
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

    // Enhanced form navigation for multi-step forms with comprehensive button detection
    async navigateFormStep(direction = 'next') {
      console.log(`🔄 Attempting to navigate form step: ${direction}`);
      
      if (direction === 'next') {
        // Comprehensive next button selectors
        const nextSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:contains("Next")',
          'button:contains("Continue")',
          'button:contains("Submit")',
          'button:contains("Apply")',
          'button:contains("Send")',
          'a:contains("Next")',
          'a:contains("Continue")',
          '[data-automation-id*="next"]',
          '[data-automation-id*="continue"]',
          '[data-automation-id*="submit"]',
          '.next-button',
          '.continue-button',
          '.submit-button',
          '.apply-button',
          'button[aria-label*="next" i]',
          'button[aria-label*="continue" i]',
          'button[aria-label*="submit" i]',
          // Workday specific
          '[data-automation-id="bottom-navigation-next-button"]',
          '[data-automation-id="formField-submitButton"]',
          // Generic patterns
          'button[class*="next"]',
          'button[class*="continue"]',
          'button[class*="submit"]',
          'button[id*="next"]',
          'button[id*="continue"]',
          'button[id*="submit"]'
        ];

        for (const selector of nextSelectors) {
          const buttons = document.querySelectorAll(selector);
          for (const button of buttons) {
            if (this.isValidNavigationButton(button, 'next')) {
              console.log(`✅ Found next button:`, button);
              await this.clickButtonSafely(button);
              await this.delay(2000); // Wait for page transition
              return { success: true, navigated: 'next', buttonText: button.textContent?.trim() };
            }
          }
        }
      } else if (direction === 'previous') {
        // Previous button selectors
        const prevSelectors = [
          'button:contains("Previous")',
          'button:contains("Back")',
          'a:contains("Previous")',
          'a:contains("Back")',
          '[data-automation-id*="previous"]',
          '[data-automation-id*="back"]',
          '.previous-button',
          '.back-button',
          'button[aria-label*="previous" i]',
          'button[aria-label*="back" i]'
        ];

        for (const selector of prevSelectors) {
          const buttons = document.querySelectorAll(selector);
          for (const button of buttons) {
            if (this.isValidNavigationButton(button, 'previous')) {
              console.log(`✅ Found previous button:`, button);
              await this.clickButtonSafely(button);
              await this.delay(2000);
              return { success: true, navigated: 'previous', buttonText: button.textContent?.trim() };
            }
          }
        }
      }

      return { success: false, error: `No ${direction} button found` };
    }

    // Complete the isFormComplete method
    async isFormComplete() {
      // Look for completion indicators
      const completionIndicators = [
        'Thank you',
        'Application submitted',
        'Successfully submitted',
        'Confirmation',
        'Application complete',
        'Review and submit'
      ];
      
      const pageText = document.body.textContent.toLowerCase();
      const hasCompletionText = completionIndicators.some(indicator => 
        pageText.includes(indicator.toLowerCase())
      );
      
      // Check for final step indicators
      const finalStepIndicators = document.querySelectorAll(
        '.final-step, .last-step, .review-step, .confirmation-step, [data-step="final"]'
      );
      
      // Check URL for completion patterns
      const url = window.location.href.toLowerCase();
      const completionUrls = ['thank-you', 'confirmation', 'complete', 'submitted'];
      const hasCompletionUrl = completionUrls.some(pattern => url.includes(pattern));
      
      return hasCompletionText || finalStepIndicators.length > 0 || hasCompletionUrl;
    }

    // Validate if button is appropriate for navigation
    isValidNavigationButton(button, direction) {
      if (!button || !button.offsetParent) return false; // Not visible
      if (button.disabled) return false; // Disabled
      
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const className = button.className?.toLowerCase() || '';
      const id = button.id?.toLowerCase() || '';
      
      if (direction === 'next') {
        const nextKeywords = ['next', 'continue', 'submit', 'apply', 'send', 'finish', 'complete'];
        const hasNextKeyword = nextKeywords.some(keyword => 
          text.includes(keyword) || ariaLabel.includes(keyword) || className.includes(keyword) || id.includes(keyword)
        );
        
        // Exclude cancel/back buttons
        const excludeKeywords = ['cancel', 'back', 'previous', 'close', 'exit'];
        const hasExcludeKeyword = excludeKeywords.some(keyword =>
          text.includes(keyword) || ariaLabel.includes(keyword) || className.includes(keyword) || id.includes(keyword)
        );
        
        return hasNextKeyword && !hasExcludeKeyword;
      } else if (direction === 'previous') {
        const prevKeywords = ['previous', 'back'];
        return prevKeywords.some(keyword => 
          text.includes(keyword) || ariaLabel.includes(keyword) || className.includes(keyword) || id.includes(keyword)
        );
      }
      
      return false;
    }

    // Safely click button with proper event handling
    async clickButtonSafely(button) {
      try {
        // Scroll button into view
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(500);
        
        // Trigger multiple events for compatibility
        const events = ['mousedown', 'mouseup', 'click'];
        events.forEach(eventType => {
          const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window
          });
          button.dispatchEvent(event);
        });
        
        // Also try direct click
        button.click();
        
        console.log(`🖱️ Clicked button: ${button.textContent?.trim()}`);
      } catch (error) {
        console.error('Error clicking button:', error);
        throw error;
      }
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

    // Enhanced multi-step form detection and auto-progression
    detectFormSteps() {
      console.log('🔍 Detecting form steps and structure...');
      
      // Look for step indicators
      const stepIndicators = document.querySelectorAll('.step, .stepper, [class*="step"], [data-step]');
      const progressBars = document.querySelectorAll('.progress, [role="progressbar"]');
      const pageNumbers = document.querySelectorAll('[class*="page"]');
      
      // Workday specific step indicators
      const workdaySteps = document.querySelectorAll('[data-automation-id*="step"]');
      
      let totalSteps = 1;
      let currentStep = 1;
      
      // Try to determine total steps
      if (stepIndicators.length > 0) {
        totalSteps = stepIndicators.length;
        // Find current active step
        stepIndicators.forEach((step, index) => {
          if (step.classList.contains('active') || step.classList.contains('current') || 
              step.getAttribute('aria-current') === 'step') {
            currentStep = index + 1;
          }
        });
      } else if (workdaySteps.length > 0) {
        totalSteps = workdaySteps.length;
      }
      
      console.log(`📋 Form structure: Step ${currentStep} of ${totalSteps}`);
      return { totalSteps, currentStep, isMultiStep: totalSteps > 1 };
    }

    // Auto-progress through multi-step forms after filling current step
    async autoProgressForm() {
      console.log('🚀 Starting auto-progression through form...');
      
      const formStructure = this.detectFormSteps();
      let attempts = 0;
      const maxAttempts = 10; // Prevent infinite loops
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Form progression attempt ${attempts}`);
        
        // Fill current step
        const fillResult = await this.autoFillCurrentStep();
        console.log(`📝 Fill result:`, fillResult);
        
        if (!fillResult.hasFields) {
          console.log('ℹ️ No fillable fields found on current step');
        }
        
        // Check if form is complete
        if (await this.isFormComplete()) {
          console.log('✅ Form appears to be complete');
          break;
        }
        
        // Try to navigate to next step
        const navResult = await this.navigateFormStep('next');
        console.log(`🔄 Navigation result:`, navResult);
        
        if (!navResult.success) {
          console.log('⏹️ No more navigation possible, form progression complete');
          break;
        }
        
        // Wait for new content to load
        await this.delay(3000);
        
        // Check if we're on a new step or page
        const newUrl = window.location.href;
        if (newUrl !== this.lastUrl) {
          this.lastUrl = newUrl;
          console.log('🌐 Detected page change, continuing with new content');
        }
      }
      
      console.log(`🏁 Auto-progression completed after ${attempts} attempts`);
      return { completed: true, steps: attempts };
    }

    // Fill only the current step/section of the form
    async autoFillCurrentStep() {
      console.log('📝 Filling current form step...');
      
      if (!this.userProfile) {
        console.log('❌ No user profile data available');
        return { success: false, hasFields: false };
      }

      const profile = this.userProfile.profile;
      const fieldMappings = this.getUniversalFieldMappings();
      
      // Create comprehensive data mapping
      const latestEducation = this.getLatestEducation();
      const latestWork = this.getLatestWorkExperience();
      const skillsList = this.getSkillsList();
      
      const dataMapping = {
        // All the comprehensive data mapping from before
        firstName: profile.fullName?.split(' ')[0] || '',
        lastName: profile.fullName?.split(' ').slice(1).join(' ') || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || 'United States',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || profile.website || '',
        workAuthorization: profile.workAuthorization || 'Yes',
        requireSponsorship: profile.requiresSponsorship || 'No',
        university: latestEducation?.institution || '',
        degree: latestEducation?.degree || '',
        major: latestEducation?.fieldOfStudy || '',
        gpa: latestEducation?.gpa || '',
        graduationYear: latestEducation?.endDate ? new Date(latestEducation.endDate).getFullYear().toString() : '',
        yearsExperience: this.calculateExperience().toString(),
        currentCompany: latestWork?.company || '',
        currentTitle: latestWork?.position || profile.professionalTitle || '',
        programmingLanguages: skillsList.technical.join(', '),
        certifications: skillsList.certifications.join(', '),
        expectedSalary: profile.expectedSalary || profile.currentSalary || '',
        salaryRange: profile.salaryRange || this.formatSalaryRange(profile.expectedSalary),
        availableStartDate: profile.availableStartDate || this.getAvailableStartDate(),
        willingToRelocate: profile.willingToRelocate || profile.relocateWillingness || 'Open to discuss',
        preferredWorkLocation: profile.preferredWorkLocation || profile.workLocationPreference || 'Remote/Hybrid',
        coverLetter: profile.preferredCoverLetter || this.generateQuickCoverLetter(),
        whyInterested: profile.careerObjective || this.generateInterestStatement(),
        additionalInfo: profile.summary || profile.professionalSummary || profile.resumeSummary || '',
        achievements: this.getAchievements(),
        projectExperience: this.getProjectExperience(),
        languages: profile.spokenLanguages || this.getLanguages(),
        industries: this.getIndustryExperience(),
        managementExperience: profile.managementExperience || this.hasManagementExperience(),
        teamSize: profile.teamSize || this.getTeamSizeExperience()
      };

      let filledCount = 0;
      let totalFieldsFound = 0;

      // Fill fields only on the currently visible/active form section
      for (const [dataKey, value] of Object.entries(dataMapping)) {
        if (!value || value === '') continue;
        
        const selectors = fieldMappings[dataKey] || [];
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (this.shouldFillField(element) && this.isElementInCurrentStep(element)) {
              totalFieldsFound++;
              try {
                await this.fillField(element, value);
                filledCount++;
                await this.delay(100); // Small delay between fields
              } catch (error) {
                console.error(`Error filling field ${dataKey}:`, error);
              }
            }
          }
        }
      }

      console.log(`📊 Current step: filled ${filledCount}/${totalFieldsFound} fields`);
      return { success: filledCount > 0, filledCount, totalFieldsFound, hasFields: totalFieldsFound > 0 };
    }

    // Check if element is in the currently active form step/section
    isElementInCurrentStep(element) {
      // Check if element is visible
      if (!element.offsetParent) return false;
      
      // Check if element is in viewport or close to it
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top >= -100 && rect.top <= window.innerHeight + 100;
      
      // For multi-step forms, prioritize elements in active sections
      const activeSection = element.closest('.active, .current, [aria-current="step"]');
      const hiddenSection = element.closest('.hidden, [style*="display: none"], [style*="visibility: hidden"]');
      
      return !hiddenSection && (isInViewport || activeSection);
    }

    // Check if form appears to be complete
    async isFormComplete() {
      // Look for completion indicators
      const completionIndicators = [
        'Thank you',
        'Application submitted',
        'Successfully submitted',
        'Confirmation',
        'Application complete',
        'Review and submit'
      ];
      
      const pageText = document.body.textContent.toLowerCase();
      const hasCompletionText = completionIndicators.some(indicator => 
        pageText.includes(indicator.toLowerCase())
      );
      
      // Check for final step indicators
      const finalStepIndicators = document.querySelectorAll(
        '.final-step, .last-step, .review-step, .confirmation-step, [data-step="final"]'
      );
      
      // Check URL for completion patterns
      const url = window.location.href.toLowerCase();
      const completionUrls = ['thank-you', 'confirmation', 'complete', 'submitted'];
      const hasCompletionUrl = completionUrls.some(pattern => url.includes(pattern));
      
      return hasCompletionText || finalStepIndicators.length > 0 || hasCompletionUrl;
    }

    // Navigate form steps (next/previous)
    async navigateFormStep(direction = 'next') {
      console.log(`🧭 Attempting to navigate form ${direction}`);
      
      // Look for navigation buttons
      const buttonSelectors = [
        `button[type="submit"]`,
        `input[type="submit"]`,
        `button:contains("${direction}")`,
        `.btn-${direction}`,
        `[class*="${direction}"]`,
        `[data-step="${direction}"]`,
        `[aria-label*="${direction}"]`
      ];
      
      const buttons = document.querySelectorAll(buttonSelectors.join(', '));
      let bestButton = null;
      
      for (const button of buttons) {
        if (this.isValidNavigationButton(button, direction)) {
          bestButton = button;
          break;
        }
      }
      
      if (bestButton) {
        try {
          await this.clickButtonSafely(bestButton);
          return { success: true, action: `clicked ${direction} button` };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      
      return { success: false, error: `No ${direction} button found` };
    }

    // Enhanced submission detection that works across all platforms
    async detectApplicationSubmission() {
      // Only proceed if we have a pending submission
      if (!this.pendingSubmission) return;
      
      // Look for very specific success indicators
      const successIndicators = [
        'your application has been submitted',
        'application submitted successfully', 
        'thank you for your application',
        'application received',
        'we have received your application'
      ];

      const pageText = document.body.textContent.toLowerCase();
      const hasSuccessText = successIndicators.some(indicator => pageText.includes(indicator));

      // Check for success URL patterns
      const successUrlPatterns = [
        'application-submitted', 'submission-complete', 'thank-you',
        'confirmation', 'success'
      ];
      
      const hasSuccessUrl = successUrlPatterns.some(pattern => 
        window.location.href.toLowerCase().includes(pattern)
      );

      if (hasSuccessText || hasSuccessUrl) {
        await this.trackApplication('automatic_detection');
        await this.showApplicationTrackedConfirmation();
        this.pendingSubmission = false;
      }
    }

    // Enhanced auto-detection for form submissions across all platforms
    async setupAutoSubmissionTracking() {
      // Monitor for actual form submissions only
      document.addEventListener('submit', async (event) => {
        if (this.isJobApplicationForm(event.target)) {
          this.pendingSubmission = true;
          // Wait longer to ensure submission completes
          setTimeout(async () => {
            await this.detectApplicationSubmission();
          }, 5000);
        }
      });

      // Only track on final submit button clicks, not navigation or partial saves
      document.addEventListener('click', async (event) => {
        const button = event.target;
        const buttonText = button.textContent?.toLowerCase() || '';
        const buttonId = button.id?.toLowerCase() || '';
        const buttonClass = button.className?.toLowerCase() || '';
        
        // More restrictive submit button detection - only final submission actions
        const isSubmitButton = (
          (buttonText.includes('submit application') || 
           buttonText.includes('send application') ||
           buttonText.includes('complete application') ||
           buttonText === 'submit' ||
           buttonText === 'apply now') &&
          !buttonText.includes('save') &&
          !buttonText.includes('continue') &&
          !buttonText.includes('next') &&
          !buttonText.includes('previous')
        );

        // Special Workday final submission detection
        const isWorkdayFinalSubmit = (
          buttonText.includes('submit application') ||
          (buttonClass.includes('wd-button') && buttonText.includes('submit')) ||
          button.getAttribute('data-automation-id')?.includes('submitApplication')
        );

        if (isSubmitButton || isWorkdayFinalSubmit) {
          this.pendingSubmission = true;
          setTimeout(async () => {
            await this.detectApplicationSubmission();
          }, 5000);
        }
      });

      // More restrictive URL change monitoring - only clear success patterns
      let currentUrl = window.location.href;
      setInterval(async () => {
        if (window.location.href !== currentUrl && this.pendingSubmission) {
          const newUrl = window.location.href;
          currentUrl = newUrl;
          
          // Only track on very specific success URL patterns
          const successPatterns = [
            'application-submitted', 'submission-complete', 'thank-you',
            'confirmation', 'success', 'submitted'
          ];
          
          const hasSuccessPattern = successPatterns.some(pattern => 
            newUrl.toLowerCase().includes(pattern)
          );

          if (hasSuccessPattern) {
            await this.trackApplication('automatic_url_detection');
            await this.showApplicationTrackedConfirmation();
            this.pendingSubmission = false;
          }
        }
      }, 2000);

      // Monitor for very specific success messages only
      const observer = new MutationObserver(async (mutations) => {
        if (!this.pendingSubmission) return;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) { // Element node
                const text = node.textContent?.toLowerCase() || '';
                
                // Very specific success indicators to avoid false positives
                const successIndicators = [
                  'your application has been submitted',
                  'application submitted successfully',
                  'thank you for your application',
                  'we have received your application',
                  'application received'
                ];
                
                if (successIndicators.some(indicator => text.includes(indicator))) {
                  await this.trackApplication('content_change_detection');
                  await this.showApplicationTrackedConfirmation();
                  this.pendingSubmission = false;
                  break;
                }
              }
            }
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Enhanced form detection for all platforms including Workday
    isJobApplicationForm(form) {
      if (!form) return false;
      
      const formText = form.textContent?.toLowerCase() || '';
      const formAction = form.action?.toLowerCase() || '';
      const formId = form.id?.toLowerCase() || '';
      
      // Standard application form indicators
      const applicationIndicators = [
        'application', 'apply', 'resume', 'cover letter', 'job',
        'candidate', 'personal information', 'work experience',
        'education', 'skills'
      ];

      // Workday specific indicators
      const workdayIndicators = [
        'workday', 'wd-', 'myworkdayjobs', 'job-apply', 'application-form'
      ];

      return [...applicationIndicators, ...workdayIndicators].some(indicator =>
        formText.includes(indicator) || formAction.includes(indicator) || formId.includes(indicator)
      );
    }

    // Enhanced application tracking confirmation
    async showApplicationTrackedConfirmation() {
      const popup = document.createElement('div');
      popup.innerHTML = `
        <div style="
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
        ">
          <div style="
            background: white;
            padding: 32px;
            border-radius: 16px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          ">
            <div style="
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg, #10b981, #059669);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px auto;
              font-size: 24px;
            ">✓</div>
            <h3 style="
              margin: 0 0 12px 0;
              color: #10b981;
              font-size: 20px;
              font-weight: 600;
            ">Application Tracked!</h3>
            <p style="
              margin: 0 0 24px 0;
              color: #6b7280;
              line-height: 1.5;
            ">Your job application has been automatically detected and saved to your AutoJobr dashboard.</p>
            <div style="
              display: flex;
              gap: 12px;
              justify-content: center;
            ">
              <a href="${CONFIG.API_BASE_URL}/applications" target="_blank" style="
                background: #4f46e5;
                color: white;
                text-decoration: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 500;
                transition: background 0.2s;
              ">View Applications</a>
              <button onclick="this.closest('div').remove()" style="
                background: #f3f4f6;
                color: #374151;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
              ">Close</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(popup);
      
      // Auto-close after 8 seconds
      setTimeout(() => {
        if (popup.parentNode) {
          popup.remove();
        }
      }, 8000);
    }
  }

  // Global instance for message handling
  let assistantInstance = null;

  // Message listener for popup communication
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!assistantInstance) {
      sendResponse({ success: false, error: 'Assistant not initialized' });
      return false;
    }

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
      case 'AUTO_FILL_FORM':
        (async () => {
          try {
            let result;
            if (message.autoProgress) {
              result = await assistantInstance.autoProgressForm();
            } else {
              result = await assistantInstance.autoFillCurrentStep();
            }
            sendResponse({ success: true, result, type: message.autoProgress ? 'multi-step' : 'single-step' });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
        })();
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