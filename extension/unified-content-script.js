// Unified AutoJobr Content Script - Single Interface for All Job Sites
(function() {
  'use strict';

  class AutoJobrUnified {
    constructor() {
      this.apiBase = this.detectBackendURL();
      this.isAuthenticated = false;
      this.userProfile = null;
      this.jobData = null;
      this.overlay = null;
      this.isProcessing = false;
      
      // Enhanced selectors for all job sites including Workday
      this.jobSelectors = {
        workday: {
          title: '[data-automation-id="jobPostingHeader"], h1[data-automation-id="jobPostingHeader"], .WDJC-1r1cwvj, h1[data-automation-id="jobTitle"]',
          company: '[data-automation-id="jobPostingCompany"], .css-1cxz035, [data-automation-id="company"]',
          description: '[data-automation-id="jobPostingDescription"], .css-1id5k8j, .wd-u-maxWidth-900px p',
          location: '[data-automation-id="locations"], .css-k008qs, [data-automation-id="location"]',
          applyButton: '[data-automation-id="applyToJobButton"], button[data-automation-id="applyToJobButton"], .css-k008qs button',
          forms: {
            firstName: 'input[name*="firstName"], input[data-automation-id*="firstName"], input[aria-label*="First Name"]',
            lastName: 'input[name*="lastName"], input[data-automation-id*="lastName"], input[aria-label*="Last Name"]',
            email: 'input[type="email"], input[name*="email"], input[data-automation-id*="email"]',
            phone: 'input[type="tel"], input[name*="phone"], input[data-automation-id*="phone"]',
            address: 'input[name*="address"], textarea[name*="address"], input[data-automation-id*="address"]',
            city: 'input[name*="city"], input[data-automation-id*="city"]',
            state: 'select[name*="state"], input[name*="state"], select[data-automation-id*="state"]',
            zipCode: 'input[name*="zip"], input[name*="postal"], input[data-automation-id*="zip"]',
            coverLetter: 'textarea[name*="cover"], textarea[data-automation-id*="cover"], textarea[aria-label*="Cover Letter"]',
            resume: 'input[type="file"], input[accept*=".pdf"], input[data-automation-id*="resume"]',
            workAuth: 'select[name*="authorization"], select[data-automation-id*="workAuth"], input[name*="workAuth"]',
            experience: 'select[name*="experience"], input[name*="experience"], select[data-automation-id*="experience"]'
          }
        },
        linkedin: {
          title: '.jobs-unified-top-card__job-title, h1.job-details-jobs-unified-top-card__job-title',
          company: '.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name',
          description: '.jobs-description__content, .jobs-box__html-content',
          location: '.jobs-unified-top-card__bullet',
          applyButton: '.jobs-apply-button, button[aria-label*="Apply"]',
          forms: {
            firstName: 'input[name*="firstName"], input[id*="firstName"]',
            lastName: 'input[name*="lastName"], input[id*="lastName"]',
            email: 'input[type="email"], input[name*="email"]',
            phone: 'input[type="tel"], input[name*="phone"]'
          }
        },
        indeed: {
          title: '[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title',
          company: '[data-testid="inlineHeader-companyName"]',
          description: '#jobDescriptionText',
          location: '[data-testid="job-location"]',
          applyButton: '.indeed-apply-button, .jobsearch-IndeedApplyButton',
          forms: {
            firstName: 'input[name*="firstName"]',
            lastName: 'input[name*="lastName"]',
            email: 'input[type="email"]',
            phone: 'input[type="tel"]'
          }
        }
      };

      this.init();
    }

    detectBackendURL() {
      // Always use central config - no fallbacks
      return AUTOJOBR_CONFIG.getApiBaseURL();
    }

    async init() {
      console.log('🚀 AutoJobr Unified initialized');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.start());
      } else {
        this.start();
      }
    }

    async start() {
      try {
        console.log('🚀 AutoJobr Extension Starting...');
        
        // Check authentication first
        const isAuth = await this.checkAuthentication();
        console.log('Authentication result:', isAuth);
        
        if (this.isAuthenticated) {
          console.log('✅ Authenticated, loading user profile...');
          await this.loadUserProfile();
        } else {
          console.log('❌ Not authenticated');
        }
        
        // Always create overlay regardless of auth status
        setTimeout(() => {
          console.log('Creating overlay and detecting job page...');
          this.detectJobPage();
          this.createOverlay();
          this.setupObservers();
        }, 1500);

      } catch (error) {
        console.error('AutoJobr initialization failed:', error);
        // Still create overlay even if initialization fails
        setTimeout(() => {
          this.createOverlay();
        }, 2000);
      }
    }

<<<<<<< HEAD
    async checkAuthentication() {
      try {
        console.log('🔍 Checking authentication...');
        
        // Try with existing token first
        let token = localStorage.getItem('autojobr_extension_token');
        if (token) {
          console.log('🔑 Found existing token, testing...');
          const response = await fetch(`${this.apiBase}/api/extension/user?token=${token}`, {
            method: 'GET',
            credentials: 'include',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Extension-Token': token
            }
          });

          if (response.ok) {
            const userData = await response.json();
            this.isAuthenticated = true;
            this.userProfile = { profile: userData };
            console.log('✅ Extension authenticated with existing token:', userData.email);
            return true;
          } else {
            console.log('🔄 Existing token invalid, removing...');
            localStorage.removeItem('autojobr_extension_token');
          }
=======
async checkAuthentication() {
  try {
    console.log('🔍 Checking authentication with:', `${this.apiBase}/api/user`);
    
    // First, test with debug endpoint
    console.log('🔍 Testing debug endpoint...');
    const debugResponse = await fetch(`${this.apiBase}/api/debug/extension-auth`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('🔍 Debug data:', debugData);
      
      // Check if debug shows authentication
      if (debugData.isAuthenticated) {
        // Try to get user data
        const response = await fetch(`${this.apiBase}/api/user`, {
          method: 'GET',
          credentials: 'include',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
<<<<<<< HEAD
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('🔍 Debug data:', debugData);
>>>>>>> 4f6e4c7b36cca9986756e7a5d3a44721e7244137
        }

        // Try to get new token from authenticated session
        console.log('🔑 Requesting new extension token...');
        try {
          const tokenResponse = await fetch(`${this.apiBase}/api/auth/extension-token`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          console.log('Token response status:', tokenResponse.status);

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            token = tokenData.token;
            localStorage.setItem('autojobr_extension_token', token);
            console.log('✅ New extension token obtained');

            // Now try with new token
            const userResponse = await fetch(`${this.apiBase}/api/extension/user?token=${token}`, {
              method: 'GET',
              credentials: 'include',
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Extension-Token': token
              }
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              this.isAuthenticated = true;
              this.userProfile = { profile: userData };
              console.log('✅ Extension authenticated with new token:', userData.email);
              return true;
            } else {
              console.log('❌ Failed to authenticate with new token, status:', userResponse.status);
              const errorText = await userResponse.text();
              console.log('User response error:', errorText);
            }
          } else {
            console.log('❌ Failed to get extension token, status:', tokenResponse.status);
            const errorText = await tokenResponse.text();
            console.log('Token response error:', errorText);
          }
<<<<<<< HEAD
        } catch (fetchError) {
          console.error('Extension token fetch error:', fetchError);
=======
=======

        console.log('Auth response:', response.status, response.statusText);

        if (response.ok) {
          const userData = await response.json();
          this.isAuthenticated = true;
          console.log('✅ AutoJobr authenticated:', userData.email);
          return true;
        } else {
          console.log('❌ Authentication API failed, status:', response.status);
          const errorText = await response.text();
          console.log('Error response:', errorText);
>>>>>>> 80128410164e37f6ee682124ad153f4273cd37be
>>>>>>> 4f6e4c7b36cca9986756e7a5d3a44721e7244137
        }
      } else {
        console.log('❌ Debug shows not authenticated');
      }
    } else {
      // Try direct fetch with proper credentials if debug endpoint fails
      const response = await fetch(`${this.apiBase}/api/user`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Auth response:', response.status, response.statusText);

      if (response.ok) {
        const userData = await response.json();
        this.isAuthenticated = true;
        console.log('✅ AutoJobr authenticated:', userData.email);
        return true;
      } else {
        console.log('❌ Authentication failed, status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    }
    
    this.isAuthenticated = false;
    return false;
  } catch (error) {
    console.error('Direct authentication check failed:', error);
    
    // Fallback: try through background script
    try {
      console.log('🔄 Trying authentication via background script...');
      const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
      if (response && response.success && response.authenticated) {
        this.isAuthenticated = true;
        console.log('✅ Background authentication successful');
        return true;
      }
    } catch (bgError) {
      console.error('Background authentication failed:', bgError);
    }
    
    this.isAuthenticated = false;
    return false;
  }
}

    async loadUserProfile() {
      if (!this.isAuthenticated) return null;

      try {
        const [profile, skills, workExperience, education] = await Promise.all([
          fetch(`${this.apiBase}/api/profile`, { credentials: 'include' }).then(r => r.json()),
          fetch(`${this.apiBase}/api/skills`, { credentials: 'include' }).then(r => r.json()),
          fetch(`${this.apiBase}/api/work-experience`, { credentials: 'include' }).then(r => r.json()),
          fetch(`${this.apiBase}/api/education`, { credentials: 'include' }).then(r => r.json())
        ]);

        this.userProfile = { profile, skills, workExperience, education };
        console.log('✅ User profile loaded');
        return this.userProfile;
      } catch (error) {
        console.error('Failed to load user profile:', error);
        return null;
      }
    }

    detectJobPage() {
      const hostname = window.location.hostname.toLowerCase();
      let platform = null;

      if (hostname.includes('workday')) platform = 'workday';
      else if (hostname.includes('linkedin')) platform = 'linkedin';
      else if (hostname.includes('indeed')) platform = 'indeed';
      else if (hostname.includes('greenhouse')) platform = 'greenhouse';
      else if (hostname.includes('lever')) platform = 'lever';

      if (platform && this.jobSelectors[platform]) {
        const selectors = this.jobSelectors[platform];
        const titleElement = document.querySelector(selectors.title);
        
        if (titleElement) {
          this.jobData = this.extractJobData(platform);
          console.log('🎯 Job detected:', this.jobData?.title);
          return true;
        }
      }
      
      return false;
    }

    extractJobData(platform) {
      const selectors = this.jobSelectors[platform];
      if (!selectors) return null;

      const getText = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : '';
      };

      return {
        title: getText(selectors.title),
        company: getText(selectors.company),
        description: getText(selectors.description),
        location: getText(selectors.location),
        platform: platform,
        url: window.location.href,
        extractedAt: new Date().toISOString()
      };
    }

    createOverlay() {
      // Remove ALL existing AutoJobr overlays/widgets
      const existingElements = [
        'autojobr-unified-overlay',
        'autojobr-widget',
        'autojobr-floating-widget',
        'autojobr-overlay'
      ];
      
      existingElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.remove();
          console.log('🗑️ Removed old overlay:', id);
        }
      });

      // Also remove by class names
      const existingByClass = document.querySelectorAll('.autojobr-floating-widget, .autojobr-widget, .smart-job-detector-overlay');
      existingByClass.forEach(element => {
        element.remove();
        console.log('🗑️ Removed old overlay by class');
      });

      this.overlay = document.createElement('div');
      this.overlay.id = 'autojobr-unified-overlay';
      this.overlay.innerHTML = this.getOverlayHTML();
      
      document.body.appendChild(this.overlay);
      this.attachEventListeners();
      this.updateOverlayContent();
      
      console.log('✅ Created unified overlay');
    }

    getOverlayHTML() {
      return `
        <div class="autojobr-container">
          <div class="autojobr-header">
            <div class="autojobr-brand">
              <span class="autojobr-logo">📘</span>
              <span class="autojobr-title">Simplify</span>
            </div>
            <div class="autojobr-actions">
              <button class="autojobr-minimize" id="autojobr-minimize">−</button>
              <button class="autojobr-close" id="autojobr-close">×</button>
            </div>
          </div>
          
          <div class="autojobr-content" id="autojobr-content">
            <div class="autojobr-status" id="autojobr-status">
              <div class="status-dot ${this.isAuthenticated ? 'connected' : 'disconnected'}"></div>
              <span>${this.isAuthenticated ? 'Connected & Ready' : 'Connection Failed'}</span>
            </div>

            ${this.isAuthenticated ? this.getAuthenticatedContent() : this.getUnauthenticatedContent()}
          </div>
        </div>
      `;
    }

    getAuthenticatedContent() {
      const profile = this.userProfile?.profile || {};
      const hasJob = this.jobData !== null;
      
      return `
        <div class="autojobr-user">
          <div class="user-avatar">${profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}</div>
          <div class="user-info">
            <div class="user-name">Shubham Dubey</div>
            <div class="user-role">Job Seeker</div>
          </div>
        </div>

        <div class="autojobr-stats">
          <div class="stat-item">
            <div class="stat-value">0</div>
            <div class="stat-label">Applications</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">0%</div>
            <div class="stat-label">Success Rate</div>
          </div>
        </div>

        ${hasJob ? this.getJobAnalysisHTML() : this.getNoJobHTML()}

        <div class="autojobr-actions">
          <button class="btn btn-primary" id="autojobr-autofill" ${!hasJob ? 'disabled' : ''}>
            ⚡ Autofill this page
          </button>
          <button class="btn btn-secondary" id="autojobr-save-job" ${!hasJob ? 'disabled' : ''}>
            💾 Save Job
          </button>
        </div>

        <div class="autojobr-tabs">
          <div class="tab-header">
            <button class="tab-button active" data-tab="resume">📄 Resume</button>
            <button class="tab-button" data-tab="cover">📝 Cover Letter</button>
          </div>
          
          <div class="tab-content">
            <div class="tab-panel active" id="resume-panel">
              <div class="resume-info">
                <div class="resume-name">Shubham_Dubey_resume (default)</div>
                <button class="view-resume-btn">👁</button>
              </div>
              
              ${hasJob ? `
                <div class="keyword-match">
                  <div class="match-header">Keyword Match - <span class="needs-work">Needs Work</span></div>
                  <div class="match-details">Your resume has <strong>2 out of 11 keywords</strong> →</div>
                  <button class="btn btn-secondary">🎯 Tailor Resume</button>
                </div>
              ` : ''}
            </div>

            <div class="tab-panel" id="cover-panel">
              <button class="btn btn-primary" id="generate-cover-letter" ${!hasJob ? 'disabled' : ''}>
                📝 Generate Cover Letter
              </button>
            </div>
          </div>
        </div>

        ${hasJob && this.detectWorkdayForm() ? `
          <div class="workday-notice">
            ⚠️ For Workday to autofill correctly, stay on the page while it fills.
          </div>
          <button class="btn btn-primary btn-large" id="continue-next-page">
            Continue to the Next Page
          </button>
        ` : ''}
      `;
    }

    getUnauthenticatedContent() {
      return `
        <div class="auth-prompt">
          <h3>Sign in to AutoJobr</h3>
          <p>Access smart job analysis, auto-fill, and cover letter generation</p>
          <button class="btn btn-primary" id="sign-in-btn">Sign In to AutoJobr</button>
        </div>
      `;
    }

    getJobAnalysisHTML() {
      const score = Math.floor(Math.random() * 40) + 10; // 10-50% range
      return `
        <div class="job-analysis">
          <div class="analysis-header">
            <div class="match-circle">
              <div class="match-percentage">${score}%</div>
            </div>
            <div class="analysis-details">
              <h4>Resume Match</h4>
              <p><strong>2 of 11 keywords</strong> are present in your resume</p>
            </div>
          </div>
        </div>
      `;
    }

    getNoJobHTML() {
      return `
        <div class="no-job-notice">
          ℹ️ Navigate to a job posting to see analysis
        </div>
      `;
    }

    detectWorkdayForm() {
      return window.location.hostname.includes('workday') || 
             window.location.hostname.includes('myworkdayjobs');
    }

    attachEventListeners() {
      // Close and minimize buttons
      const closeBtn = this.overlay.querySelector('#autojobr-close');
      const minimizeBtn = this.overlay.querySelector('#autojobr-minimize');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.overlay.style.display = 'none');
      }
      
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
      }

      // Tab switching
      this.overlay.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
      });

      // Action buttons
      const autofillBtn = this.overlay.querySelector('#autojobr-autofill');
      const saveJobBtn = this.overlay.querySelector('#autojobr-save-job');
      const coverLetterBtn = this.overlay.querySelector('#generate-cover-letter');
      const signInBtn = this.overlay.querySelector('#sign-in-btn');
      const continueBtn = this.overlay.querySelector('#continue-next-page');

      if (autofillBtn) {
        autofillBtn.addEventListener('click', () => this.autofillForm());
      }

      if (saveJobBtn) {
        saveJobBtn.addEventListener('click', () => this.saveJob());
      }

      if (coverLetterBtn) {
        coverLetterBtn.addEventListener('click', () => this.generateCoverLetter());
      }

      if (signInBtn) {
        signInBtn.addEventListener('click', () => this.openSignIn());
      }

      if (continueBtn) {
        continueBtn.addEventListener('click', () => this.continueToNextPage());
      }
    }

    toggleMinimize() {
      const content = this.overlay.querySelector('#autojobr-content');
      const isMinimized = content.style.display === 'none';
      content.style.display = isMinimized ? 'block' : 'none';
      
      const minimizeBtn = this.overlay.querySelector('#autojobr-minimize');
      minimizeBtn.textContent = isMinimized ? '−' : '+';
    }

    switchTab(tabName) {
      // Update tab buttons
      this.overlay.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });

      // Update tab panels
      this.overlay.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${tabName}-panel`);
      });
    }

    async autofillForm() {
      if (!this.userProfile || this.isProcessing) return;

      this.isProcessing = true;
      const autofillBtn = this.overlay.querySelector('#autojobr-autofill');
      if (autofillBtn) {
        autofillBtn.textContent = '⏳ Filling...';
        autofillBtn.disabled = true;
      }

      try {
        const platform = this.detectCurrentPlatform();
        const forms = this.jobSelectors[platform]?.forms;
        
        if (forms && this.userProfile.profile) {
          const profile = this.userProfile.profile;
          
          // Fill basic information
          this.fillField(forms.firstName, profile.fullName ? profile.fullName.split(' ')[0] : '');
          this.fillField(forms.lastName, profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : '');
          this.fillField(forms.email, profile.email || '');
          this.fillField(forms.phone, profile.phone || '');
          this.fillField(forms.address, profile.address || '');
          this.fillField(forms.city, profile.city || '');
          this.fillField(forms.state, profile.state || '');
          this.fillField(forms.zipCode, profile.zipCode || '');

          // Generate and fill cover letter
          if (this.jobData && forms.coverLetter) {
            const coverLetter = await this.generateCoverLetterText();
            this.fillField(forms.coverLetter, coverLetter);
          }

          console.log('✅ Form autofilled successfully');
          
          // Show success message
          if (autofillBtn) {
            autofillBtn.textContent = '✅ Filled!';
            setTimeout(() => {
              autofillBtn.textContent = '⚡ Autofill this page';
              autofillBtn.disabled = false;
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Autofill failed:', error);
        if (autofillBtn) {
          autofillBtn.textContent = '❌ Failed';
          setTimeout(() => {
            autofillBtn.textContent = '⚡ Autofill this page';
            autofillBtn.disabled = false;
          }, 2000);
        }
      } finally {
        this.isProcessing = false;
      }
    }

    fillField(selector, value) {
      if (!selector || !value) return;

      const field = document.querySelector(selector);
      if (field) {
        field.focus();
        field.value = value;
        
        // Trigger events for React/Angular forms
        const events = ['input', 'change', 'blur'];
        events.forEach(eventType => {
          field.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        
        console.log(`Filled field: ${selector} = ${value}`);
      }
    }

    detectCurrentPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.includes('workday')) return 'workday';
      if (hostname.includes('linkedin')) return 'linkedin';
      if (hostname.includes('indeed')) return 'indeed';
      return 'workday'; // Default to workday for better compatibility
    }

    async generateCoverLetterText() {
      if (!this.jobData) return '';

      try {
        const response = await fetch(`${this.apiBase}/api/generate-cover-letter`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jobDescription: this.jobData.description,
            companyName: this.jobData.company,
            useProfile: true
          })
        });

        if (response.ok) {
          const result = await response.json();
          return result.coverLetter || '';
        }
      } catch (error) {
        console.error('Failed to generate cover letter:', error);
      }

      return '';
    }

    continueToNextPage() {
      // Look for "Next" or "Continue" buttons on Workday forms
      const nextSelectors = [
        'button[data-automation-id="bottom-navigation-next-button"]',
        'button[data-automation-id="continueButton"]',
        'button[title*="Next"]',
        'button[aria-label*="Next"]',
        'button:contains("Next")',
        'button:contains("Continue")',
        '.css-k008qs button[type="button"]'
      ];

      for (const selector of nextSelectors) {
        const button = document.querySelector(selector);
        if (button && !button.disabled) {
          button.click();
          console.log('✅ Clicked Next/Continue button');
          break;
        }
      }
    }

    async saveJob() {
      if (!this.jobData) return;

      try {
        const response = await fetch(`${this.apiBase}/api/save-job`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.jobData)
        });

        if (response.ok) {
          console.log('✅ Job saved successfully');
          const saveBtn = this.overlay.querySelector('#autojobr-save-job');
          if (saveBtn) {
            saveBtn.textContent = '✅ Saved!';
            setTimeout(() => {
              saveBtn.textContent = '💾 Save Job';
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Failed to save job:', error);
      }
    }

    openSignIn() {
      const authWindow = window.open(`${this.apiBase}/auth`, '_blank');
      
      // Check if user signed in every 2 seconds
      const checkAuth = setInterval(async () => {
        try {
          if (authWindow.closed) {
            clearInterval(checkAuth);
            // Wait a moment then get extension token and check authentication
            setTimeout(async () => {
              await this.getExtensionToken();
              const isAuth = await this.checkAuthentication();
              if (isAuth) {
                console.log('✅ Authentication successful, reloading extension...');
                this.createOverlay(); // Reload the overlay with authenticated state
              }
            }, 1000);
          }
        } catch (error) {
          console.log('Auth window check error:', error);
        }
      }, 2000);
    }

    async getExtensionToken() {
      try {
        const response = await fetch(`${this.apiBase}/api/auth/extension-token`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('autojobr_extension_token', data.token);
          console.log('✅ Extension token obtained');
          return data.token;
        } else {
          console.log('❌ Failed to get extension token:', response.status);
          return null;
        }
      } catch (error) {
        console.error('Extension token request failed:', error);
        return null;
      }
    }

    updateOverlayContent() {
      if (!this.overlay) return;

      const content = this.overlay.querySelector('#autojobr-content');
      if (content) {
        content.innerHTML = this.isAuthenticated ? 
          this.getAuthenticatedContent() : 
          this.getUnauthenticatedContent();
        
        this.attachEventListeners();
      }
    }

    setupObservers() {
      // Watch for URL changes (SPA navigation)
      let currentUrl = window.location.href;
      
      const checkForChanges = () => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          setTimeout(() => {
            this.detectJobPage();
            this.updateOverlayContent();
          }, 1000);
        }
      };

      // Check for URL changes every 2 seconds
      setInterval(checkForChanges, 2000);

      // Also listen for DOM changes that might indicate new content
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldUpdate = true;
          }
        });

        if (shouldUpdate) {
          setTimeout(() => {
            this.detectJobPage();
            this.updateOverlayContent();
          }, 500);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new AutoJobrUnified();
    });
  } else {
    new AutoJobrUnified();
  }

})();