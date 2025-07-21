// Smart Job Detection and Analysis - AutoJobr Extension
class SmartJobDetector {
  constructor() {
    this.apiBase = 'https://6d490f6a-220b-4865-9c1e-56491791d355-00-fobjhe3sa4h6.spock.replit.dev';
    this.isJobPage = false;
    this.jobData = null;
    this.userProfile = null;
    this.floatingPanel = null;
    this.isAuthenticated = false;
    
    this.jobSelectors = {
      linkedin: {
        title: '.jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title, h1.jobs-details__job-title',
        company: '.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name, .jobs-details__company-name',
        description: '.jobs-description__content, .jobs-box__html-content, .job-details-jobs-unified-top-card__primary-description-container',
        location: '.jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__bullet',
        salary: '.jobs-details__salary-main-rail, .compensation__salary',
        applyButton: '.jobs-apply-button, .jobs-s-apply--top-card, button[aria-label*="Apply"]'
      },
      indeed: {
        title: '[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title',
        company: '[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating',
        description: '#jobDescriptionText, .jobsearch-jobDescriptionText',
        location: '[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle',
        salary: '.jobsearch-JobMetadataHeader-item, .attribute_snippet',
        applyButton: '.jobsearch-IndeedApplyButton, .indeed-apply-button'
      },
      workday: {
        title: '[data-automation-id="jobPostingHeader"], h1[data-automation-id="jobPostingHeader"]',
        company: '[data-automation-id="jobPostingCompany"]',
        description: '[data-automation-id="jobPostingDescription"]',
        location: '[data-automation-id="locations"]',
        salary: '.css-1eaq0u6, .wd-u-color-text-primary-medium',
        applyButton: '[data-automation-id="applyToJobButton"]'
      },
      greenhouse: {
        title: '.app-title, h1.app-title',
        company: '.company-name, .header--company-name',
        description: '#content .section:first-of-type, .job-post-content',
        location: '.location, .offices',
        salary: '.salary-range, .compensation',
        applyButton: '#submit_app, .application-form button[type="submit"]'
      },
      lever: {
        title: '.posting-headline h2, .template-posting h2',
        company: '.posting-headline .company-name',
        description: '.section-wrapper .section:first-child',
        location: '.posting-categories .location',
        salary: '.posting-headline .salary, .compensation-range',
        applyButton: '.template-btn-submit, .postings-btn'
      }
    };

    this.init();
  }

  async init() {
    console.log('🚀 AutoJobr Smart Detector initialized');
    
    // Check authentication status and wait for it to complete
    const isAuth = await this.checkAuthentication();
    console.log('Auth status after init:', isAuth);
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      // Detect if current page is a job posting
      this.detectJobPage();
      
      // Set up observers for dynamic content
      this.setupObservers();
    }, 1000);
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });
  }

  async checkAuthentication() {
    try {
      console.log('🔍 Checking AutoJobr authentication...');
      const response = await fetch(`${this.apiBase}/api/user`, {
        credentials: 'include',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Auth response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        this.isAuthenticated = true;
        console.log('✅ AutoJobr authenticated successfully', userData.email);
        await this.loadUserProfile();
        return true;
      } else {
        this.isAuthenticated = false;
        console.log('❌ AutoJobr not authenticated, status:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ AutoJobr authentication check failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) {
      console.log('Not authenticated, skipping profile load');
      return;
    }

    try {
      console.log('📋 Loading user profile data...');
      const [profileRes, skillsRes, experienceRes, educationRes] = await Promise.all([
        fetch(`${this.apiBase}/api/profile`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/skills`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/work-experience`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/education`, { credentials: 'include' })
      ]);

      console.log('Profile API responses:', {
        profile: profileRes.status,
        skills: skillsRes.status,
        experience: experienceRes.status,
        education: educationRes.status
      });

      if (profileRes.ok && skillsRes.ok && experienceRes.ok && educationRes.ok) {
        const [profile, skills, experience, education] = await Promise.all([
          profileRes.json(),
          skillsRes.json(),
          experienceRes.json(),
          educationRes.json()
        ]);

        this.userProfile = {
          profile,
          skills,
          experience,
          education,
          lastUpdated: Date.now()
        };

        // Cache profile for offline use
        try {
          await chrome.storage.local.set({
            autojobr_profile: this.userProfile
          });
        } catch (storageError) {
          console.log('Failed to cache profile:', storageError);
        }

        console.log('✅ User profile loaded successfully', {
          profileId: profile?.id,
          skillsCount: skills?.length || 0,
          experienceCount: experience?.length || 0,
          educationCount: education?.length || 0
        });
      } else {
        console.log('Some profile API calls failed, trying cached data');
        // Try to load from cache
        try {
          const cached = await chrome.storage.local.get('autojobr_profile');
          if (cached.autojobr_profile) {
            this.userProfile = cached.autojobr_profile;
            console.log('📦 Using cached user profile');
          }
        } catch (cacheError) {
          console.error('Failed to load cached profile:', cacheError);
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Try to load from cache as fallback
      try {
        const cached = await chrome.storage.local.get('autojobr_profile');
        if (cached.autojobr_profile) {
          this.userProfile = cached.autojobr_profile;
          console.log('📦 Using cached user profile as fallback');
        }
      } catch (cacheError) {
        console.error('Failed to load cached profile:', cacheError);
      }
    }
  }

  async detectJobPage() {
    const hostname = window.location.hostname.toLowerCase();
    let platform = null;

    // Detect platform
    if (hostname.includes('linkedin.com')) platform = 'linkedin';
    else if (hostname.includes('indeed.com')) platform = 'indeed';
    else if (hostname.includes('workday.com')) platform = 'workday';
    else if (hostname.includes('greenhouse.io')) platform = 'greenhouse';
    else if (hostname.includes('lever.co')) platform = 'lever';
    else if (hostname.includes('glassdoor.com')) platform = 'glassdoor';
    else if (hostname.includes('monster.com')) platform = 'monster';
    else if (hostname.includes('ziprecruiter.com')) platform = 'ziprecruiter';
    else if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) platform = 'wellfound';

    console.log('🔍 Detected platform:', platform);

    if (platform && this.hasJobContent(platform)) {
      this.isJobPage = true;
      console.log('✅ Job page detected on', platform);
      
      // Re-check authentication status before showing panel
      await this.checkAuthentication();
      
      this.extractJobData(platform);
      
      // Always show panel, but behavior depends on auth status
      this.showFloatingPanel();
      
      // If authenticated, automatically analyze
      if (this.isAuthenticated && this.userProfile) {
        console.log('🔍 Auto-analyzing job with user profile...');
        this.analyzeJobMatch();
      }
    } else {
      console.log('❌ No job content detected');
    }
  }

  hasJobContent(platform) {
    const selectors = this.jobSelectors[platform];
    if (!selectors) return false;

    // Check if essential job elements exist
    const titleExists = document.querySelector(selectors.title);
    const companyExists = document.querySelector(selectors.company);
    
    return titleExists && companyExists;
  }

  extractJobData(platform) {
    const selectors = this.jobSelectors[platform] || {};
    
    const title = this.getTextFromSelector(selectors.title);
    const company = this.getTextFromSelector(selectors.company);
    const description = this.getTextFromSelector(selectors.description);
    const location = this.getTextFromSelector(selectors.location);
    const salary = this.getTextFromSelector(selectors.salary);

    this.jobData = {
      title: title?.trim(),
      company: company?.trim(),
      description: description?.trim(),
      location: location?.trim(),
      salary: salary?.trim(),
      url: window.location.href,
      platform,
      extractedAt: Date.now()
    };

    // Automatically analyze the job if we have user profile
    if (this.userProfile && this.jobData.title && this.jobData.description) {
      this.analyzeJobMatch();
    }

    console.log('📋 Job data extracted:', this.jobData);
  }

  getTextFromSelector(selector) {
    if (!selector) return '';
    
    const element = document.querySelector(selector);
    return element ? element.textContent || element.innerText || '' : '';
  }

  async analyzeJobMatch() {
    if (!this.userProfile || !this.jobData) return;

    try {
      // Simple client-side matching algorithm
      const analysis = this.performClientSideAnalysis();
      
      // Store analysis results
      this.jobData.analysis = analysis;
      
      // Update floating panel with results
      this.updateFloatingPanel();
      
      console.log('📊 Job analysis completed:', analysis);
    } catch (error) {
      console.error('Failed to analyze job:', error);
    }
  }

  performClientSideAnalysis() {
    const { skills } = this.userProfile;
    const { title, description, company } = this.jobData;
    
    if (!skills || !description) return { matchScore: 0, matches: [], missing: [] };

    const descriptionLower = (title + ' ' + description).toLowerCase();
    const userSkills = skills.map(s => s.skill?.toLowerCase() || s.toLowerCase());
    
    let matchedSkills = [];
    let matchScore = 0;

    // Check skill matches
    userSkills.forEach(skill => {
      if (descriptionLower.includes(skill)) {
        matchedSkills.push(skill);
        matchScore += 10; // 10 points per matched skill
      }
    });

    // Bonus points for experience level match
    const experience = this.userProfile.experience || [];
    const totalYears = experience.reduce((total, exp) => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);
        return total + ((end - start) / (1000 * 60 * 60 * 24 * 365));
      }
      return total;
    }, 0);

    if (totalYears >= 5) matchScore += 20;
    else if (totalYears >= 3) matchScore += 15;
    else if (totalYears >= 1) matchScore += 10;

    // Cap at 100%
    matchScore = Math.min(matchScore, 100);

    return {
      matchScore: Math.round(matchScore),
      matchedSkills,
      totalSkills: userSkills.length,
      experienceYears: Math.round(totalYears),
      recommendation: matchScore >= 80 ? 'Excellent match!' : 
                    matchScore >= 60 ? 'Good match' : 
                    matchScore >= 40 ? 'Fair match' : 'Consider other opportunities'
    };
  }

  showFloatingPanel() {
    if (this.floatingPanel) return; // Already shown

    try {
      // Create floating panel
      this.floatingPanel = document.createElement('div');
      this.floatingPanel.className = 'autojobr-floating-panel';
      
      // Add basic styling for the panel
      this.floatingPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e5e7eb;
      `;
      
      this.floatingPanel.innerHTML = this.getFloatingPanelHTML();
      
      // Add to page
      document.body.appendChild(this.floatingPanel);
      
      // Add event listeners
      this.setupFloatingPanelEvents();
      
      console.log('💫 AutoJobr floating panel displayed');
    } catch (error) {
      console.error('Failed to show floating panel:', error);
    }
  }

  getFloatingPanelHTML() {
    const isAuthenticated = this.isAuthenticated;
    const jobData = this.jobData || {};
    const analysis = jobData.analysis;

    // Get icon URL safely
    let iconUrl = '';
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        iconUrl = chrome.runtime.getURL('icons/icon32.png');
      }
    } catch (e) {
      console.log('Chrome runtime not available for icon');
    }

    if (!isAuthenticated) {
      return `
        <div class="autojobr-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #4f46e5; color: white;">
          <div class="autojobr-logo" style="display: flex; align-items: center; gap: 8px;">
            ${iconUrl ? `<img src="${iconUrl}" alt="AutoJobr" style="width: 24px; height: 24px;">` : '🤖'}
            <span style="font-weight: bold;">AutoJobr</span>
          </div>
          <button class="autojobr-close" id="autojobr-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
        </div>
        <div class="autojobr-content" style="padding: 16px; background: white; border-radius: 0 0 8px 8px;">
          <div class="autojobr-auth-required" style="text-align: center;">
            <h3 style="margin: 0 0 8px 0; color: #374151;">Sign in to AutoJobr</h3>
            <p style="margin: 0 0 16px 0; color: #6b7280;">Access smart job analysis and auto-fill features</p>
            <button class="autojobr-btn-primary" id="autojobr-login" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">Sign In</button>
          </div>
        </div>
      `;
    }

    const matchScore = analysis?.matchScore || 0;
    const scoreColor = matchScore >= 80 ? '#22c55e' : matchScore >= 60 ? '#f59e0b' : '#ef4444';

    return `
      <div class="autojobr-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #4f46e5; color: white;">
        <div class="autojobr-logo" style="display: flex; align-items: center; gap: 8px;">
          ${iconUrl ? `<img src="${iconUrl}" alt="AutoJobr" style="width: 24px; height: 24px;">` : '🤖'}
          <span style="font-weight: bold;">AutoJobr</span>
        </div>
        <button class="autojobr-close" id="autojobr-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
      </div>
      <div class="autojobr-content" style="padding: 16px; background: white; border-radius: 0 0 8px 8px;">
        ${analysis ? `
          <div class="autojobr-analysis" style="margin-bottom: 16px;">
            <div class="autojobr-score" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px; border: 2px solid ${scoreColor}; border-radius: 6px;">
              <div class="score-circle" style="width: 48px; height: 48px; background: ${scoreColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                ${matchScore}%
              </div>
              <div class="score-details">
                <h4 style="margin: 0 0 4px 0; color: #374151; font-size: 14px;">Job Match Score</h4>
                <p style="margin: 0; color: #6b7280; font-size: 12px;">${analysis.recommendation || 'Analysis complete'}</p>
              </div>
            </div>
            <div class="autojobr-matches" style="text-align: center; margin-bottom: 16px;">
              <p style="margin: 0; color: #374151; font-size: 13px;"><strong>${analysis.matchedSkills?.length || 0}</strong> of your skills match this job</p>
            </div>
          </div>
        ` : `
          <div class="autojobr-analyzing" style="text-align: center; margin-bottom: 16px; padding: 20px;">
            <div class="spinner" style="width: 24px; height: 24px; border: 2px solid #e5e7eb; border-top: 2px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">Analyzing job requirements...</p>
          </div>
        `}
        
        <div class="autojobr-actions" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
          <button class="autojobr-btn-primary" id="autojobr-autofill" style="background: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; width: 100%;">
            ⚡ Autofill Application
          </button>
          <button class="autojobr-btn-secondary" id="autojobr-cover-letter" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; width: 100%;">
            📝 Generate Cover Letter
          </button>
          <button class="autojobr-btn-secondary" id="autojobr-save-job" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; width: 100%;">
            💾 Save Job
          </button>
        </div>
        
        <div class="autojobr-info" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;"><strong>${jobData.title || 'Job Position'}</strong> at <strong>${jobData.company || 'Company'}</strong></p>
          ${this.userProfile ? `
            <div style="display: flex; justify-content: center; align-items: center; gap: 4px; color: #10b981; font-size: 11px;">
              <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block;"></span>
              Profile loaded (${this.userProfile.skills?.length || 0} skills)
            </div>
          ` : `
            <div style="display: flex; justify-content: center; align-items: center; gap: 4px; color: #f59e0b; font-size: 11px;">
              <span style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; display: inline-block;"></span>
              Loading profile...
            </div>
          `}
        </div>
      </div>
    `;
  }

  setupFloatingPanelEvents() {
    // Close button
    document.getElementById('autojobr-close')?.addEventListener('click', () => {
      this.hideFloatingPanel();
    });

    // Login button
    document.getElementById('autojobr-login')?.addEventListener('click', () => {
      window.open(`${this.apiBase}/auth`, '_blank');
    });

    // Autofill button
    document.getElementById('autojobr-autofill')?.addEventListener('click', () => {
      this.performAutofill();
    });

    // Cover letter button
    document.getElementById('autojobr-cover-letter')?.addEventListener('click', () => {
      this.generateCoverLetter();
    });

    // Save job button
    document.getElementById('autojobr-save-job')?.addEventListener('click', () => {
      this.saveJob();
    });
  }

  updateFloatingPanel() {
    if (this.floatingPanel) {
      this.floatingPanel.innerHTML = this.getFloatingPanelHTML();
      this.setupFloatingPanelEvents();
    }
  }

  hideFloatingPanel() {
    if (this.floatingPanel) {
      this.floatingPanel.remove();
      this.floatingPanel = null;
    }
  }

  async performAutofill() {
    if (!this.isAuthenticated) {
      this.showNotification('Please sign in to use autofill', 'error');
      return;
    }

    if (!this.userProfile) {
      console.error('No user profile available for autofill');
      this.showNotification('User profile not loaded', 'error');
      // Try to reload profile
      await this.loadUserProfile();
      if (!this.userProfile) {
        this.showNotification('Unable to load user profile', 'error');
        return;
      }
    }

    console.log('🚀 Starting autofill process...');
    
    try {
      // Load and execute form filler
      if (typeof FormFiller !== 'undefined') {
        const formFiller = new FormFiller(this.userProfile);
        await formFiller.fillJobApplicationForm();
        this.showNotification('Form filled successfully!', 'success');
      } else {
        console.error('FormFiller class not available');
        this.showNotification('Autofill feature loading...', 'info');
      }
    } catch (error) {
      console.error('Autofill failed:', error);
      this.showNotification('Autofill failed', 'error');
    }
  }

  async generateCoverLetter() {
    if (!this.jobData) {
      console.error('Missing job data for cover letter generation');
      this.showNotification('No job data available', 'error');
      return;
    }

    if (!this.userProfile) {
      console.error('Missing user profile for cover letter generation');
      this.showNotification('Please sign in to generate cover letter', 'error');
      return;
    }

    if (!this.jobData.description || !this.jobData.company) {
      console.error('Job data incomplete for cover letter generation');
      this.showNotification('Job information incomplete', 'error');
      return;
    }

    try {
      console.log('📝 Generating cover letter...');
      this.showNotification('Generating cover letter...', 'info');
      
      const response = await fetch(`${this.apiBase}/api/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobDescription: this.jobData.description || '',
          companyName: this.jobData.company || 'Company',
          jobTitle: this.jobData.title || 'Position',
          useProfile: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Try to fill cover letter in any text area
        const textAreas = document.querySelectorAll('textarea');
        const coverLetterField = Array.from(textAreas).find(ta => 
          ta.placeholder?.toLowerCase().includes('cover') ||
          ta.name?.toLowerCase().includes('cover') ||
          ta.id?.toLowerCase().includes('cover') ||
          ta.closest('label')?.textContent?.toLowerCase().includes('cover')
        );

        if (coverLetterField) {
          coverLetterField.value = result.coverLetter;
          coverLetterField.dispatchEvent(new Event('input', { bubbles: true }));
          this.showNotification('Cover letter generated and inserted!', 'success');
        } else {
          // Copy to clipboard as fallback
          try {
            await navigator.clipboard.writeText(result.coverLetter);
            this.showNotification('Cover letter copied to clipboard!', 'success');
          } catch (clipboardError) {
            console.error('Failed to copy to clipboard:', clipboardError);
            this.showNotification('Cover letter generated but could not copy to clipboard', 'warning');
          }
        }
      } else {
        this.showNotification('Failed to generate cover letter', 'error');
      }
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      this.showNotification('Failed to generate cover letter', 'error');
    }
  }

  async saveJob() {
    if (!this.jobData) return;

    try {
      console.log('💾 Saving job...');
      
      const response = await fetch(`${this.apiBase}/api/saved-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...this.jobData,
          savedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        this.showNotification('Job saved successfully!', 'success');
      } else {
        this.showNotification('Failed to save job', 'error');
      }
    } catch (error) {
      console.error('Failed to save job:', error);
      this.showNotification('Failed to save job', 'error');
    }
  }

  showNotification(message, type = 'info') {
    try {
      const notification = document.createElement('div');
      notification.className = `autojobr-notification autojobr-notification-${type}`;
      notification.textContent = message;
      
      // Add basic styling
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-family: Arial, sans-serif;
        z-index: 10001;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(350px);
        transition: transform 0.3s ease;
        animation: slideIn 0.3s ease forwards;
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  setupObservers() {
    // Watch for URL changes (for SPAs)
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        
        // Hide existing panel
        this.hideFloatingPanel();
        
        // Re-detect job page after a short delay
        setTimeout(async () => {
          await this.detectJobPage();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(async () => {
        this.hideFloatingPanel();
        await this.detectJobPage();
      }, 500);
    });
    
    // Check for authentication changes periodically
    setInterval(async () => {
      const wasAuthenticated = this.isAuthenticated;
      await this.checkAuthentication();
      
      // If authentication status changed, update the panel
      if (wasAuthenticated !== this.isAuthenticated && this.isJobPage) {
        this.updateFloatingPanel();
      }
    }, 30000); // Check every 30 seconds
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'GET_JOB_DATA':
        sendResponse({
          success: true,
          isJobPage: this.isJobPage,
          jobData: this.jobData,
          isAuthenticated: this.isAuthenticated
        });
        break;
        
      case 'REFRESH_AUTH':
        this.checkAuthentication().then(() => {
          sendResponse({ success: true, isAuthenticated: this.isAuthenticated });
        });
        break;
        
      case 'PERFORM_AUTOFILL':
        this.performAutofill().then(() => {
          sendResponse({ success: true });
        });
        break;
        
      case 'GENERATE_COVER_LETTER':
        this.generateCoverLetter().then(() => {
          sendResponse({ success: true });
        });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    return true; // Keep message channel open for async responses
  }
}

// Add CSS animations for notifications and spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    0% { transform: translateX(350px); }
    100% { transform: translateX(0); }
  }
  .autojobr-notification {
    transition: all 0.3s ease;
  }
  .autojobr-floating-panel button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  .autojobr-btn-primary:hover {
    background: #4338ca !important;
  }
  .autojobr-btn-secondary:hover {
    background: #e5e7eb !important;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      new SmartJobDetector();
    } catch (error) {
      console.error('AutoJobr SmartJobDetector initialization failed:', error);
    }
  });
} else {
  try {
    new SmartJobDetector();
  } catch (error) {
    console.error('AutoJobr SmartJobDetector initialization failed:', error);
  }
}