// AutoJobr Content Script - Advanced Job Board Auto-Fill System
class AutoJobrContentScript {
  constructor() {
    this.isInitialized = false;
    this.currentJobData = null;
    this.fillInProgress = false;
    this.currentSite = this.detectSite();
    this.fieldMappings = this.initializeFieldMappings();
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      this.injectUI();
      this.setupMessageListener();
      this.observePageChanges();
      this.detectJobPosting();
      this.isInitialized = true;
      
      console.log('🚀 AutoJobr extension initialized on:', this.currentSite);
    } catch (error) {
      console.error('AutoJobr initialization error:', error);
    }
  }

  detectSite() {
    const hostname = window.location.hostname.toLowerCase();
    
    const siteMap = {
      'linkedin.com': 'linkedin',
      'indeed.com': 'indeed',
      'glassdoor.com': 'glassdoor',
      'ziprecruiter.com': 'ziprecruiter',
      'monster.com': 'monster',
      'careerbuilder.com': 'careerbuilder',
      'dice.com': 'dice',
      'stackoverflow.com': 'stackoverflow',
      'angel.co': 'angel',
      'wellfound.com': 'wellfound',
      'greenhouse.io': 'greenhouse',
      'lever.co': 'lever',
      'workday.com': 'workday',
      'myworkdayjobs.com': 'workday',
      'icims.com': 'icims',
      'smartrecruiters.com': 'smartrecruiters',
      'bamboohr.com': 'bamboohr',
      'ashbyhq.com': 'ashby',
      'careers.google.com': 'google',
      'amazon.jobs': 'amazon',
      'microsoft.com': 'microsoft',
      'apple.com': 'apple',
      'meta.com': 'meta'
    };

    for (const [domain, site] of Object.entries(siteMap)) {
      if (hostname.includes(domain)) {
        return site;
      }
    }
    
    return 'generic';
  }

  initializeFieldMappings() {
    return {
      // Personal Information
      firstName: ['firstName', 'first_name', 'fname', 'first-name', 'given-name', 'forename'],
      lastName: ['lastName', 'last_name', 'lname', 'last-name', 'family-name', 'surname'],
      fullName: ['fullName', 'full_name', 'name', 'full-name', 'candidate-name', 'applicant-name'],
      email: ['email', 'emailAddress', 'email_address', 'email-address', 'e-mail', 'mail'],
      phone: ['phone', 'phoneNumber', 'phone_number', 'phone-number', 'telephone', 'mobile', 'cell'],
      
      // Address
      address: ['address', 'street', 'streetAddress', 'street_address', 'address1', 'addr1'],
      city: ['city', 'locality', 'town'],
      state: ['state', 'region', 'province', 'st'],
      zipCode: ['zipCode', 'zip', 'postalCode', 'postal_code', 'postal-code', 'postcode'],
      country: ['country', 'nation'],
      
      // Professional
      currentTitle: ['currentTitle', 'title', 'jobTitle', 'job_title', 'position', 'role'],
      company: ['company', 'employer', 'organization', 'current_company', 'currentCompany'],
      experience: ['experience', 'yearsExperience', 'years_experience', 'years-experience', 'exp'],
      
      // Education
      university: ['university', 'school', 'college', 'education', 'institution'],
      degree: ['degree', 'education_level', 'qualification'],
      major: ['major', 'field', 'study', 'specialization', 'concentration'],
      
      // Links
      linkedin: ['linkedin', 'linkedinUrl', 'linkedin_url', 'linkedin-url', 'li-url'],
      github: ['github', 'githubUrl', 'github_url', 'github-url'],
      portfolio: ['portfolio', 'website', 'portfolioUrl', 'personal_website'],
      
      // Work Authorization
      workAuth: ['workAuthorization', 'work_authorization', 'eligible', 'authorized', 'legal'],
      visa: ['visa', 'visaStatus', 'visa_status', 'immigration', 'sponsor'],
      
      // Resume/Cover Letter
      resume: ['resume', 'cv', 'resumeUpload', 'resume_upload', 'curriculum'],
      coverLetter: ['coverLetter', 'cover_letter', 'covering_letter', 'motivation']
    };
  }

  injectUI() {
    // Create floating UI similar to Simplify
    if (document.getElementById('autojobr-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'autojobr-overlay';
    overlay.innerHTML = `
      <div class="autojobr-widget" style="display: none;">
        <div class="autojobr-header">
          <div class="autojobr-logo">
            <div class="autojobr-icon">A</div>
            <span>AutoJobr</span>
          </div>
          <button class="autojobr-close" onclick="this.closest('.autojobr-widget').style.display='none'">×</button>
        </div>
        
        <div class="autojobr-content">
          <div class="autojobr-status" id="autojobr-status">
            <div class="status-icon">✓</div>
            <div class="status-text">Ready to auto-fill application</div>
          </div>
          
          <div class="autojobr-actions">
            <button class="autojobr-btn primary" id="autojobr-autofill">
              <span class="btn-icon">✎</span>
              Autofill
            </button>
            <button class="autojobr-btn" id="autojobr-analyze">
              <span class="btn-icon">📊</span>
              Keywords Score
            </button>
            <button class="autojobr-btn" id="autojobr-profile">
              <span class="btn-icon">👤</span>
              Profile
            </button>
          </div>
          
          <div class="autojobr-features">
            <div class="feature-item" id="autojobr-save-job">
              <span class="feature-icon">💾</span>
              <span>Save Job</span>
              <button class="feature-btn">→</button>
            </div>
            <div class="feature-item" id="autojobr-cover-letter">
              <span class="feature-icon">📝</span>
              <span>Generate Cover Letter</span>
              <button class="feature-btn">→</button>
            </div>
            <div class="feature-item" id="autojobr-resume">
              <span class="feature-icon">📄</span>
              <span>Tailor Resume</span>
              <button class="feature-btn">→</button>
            </div>
          </div>
          
          <div class="autojobr-footer">
            <button class="submit-btn" id="autojobr-submit">
              📤 Submit Autofill Request
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.attachUIEventListeners();
  }

  attachUIEventListeners() {
    document.getElementById('autojobr-autofill')?.addEventListener('click', () => this.handleAutofill());
    document.getElementById('autojobr-analyze')?.addEventListener('click', () => this.handleAnalyze());
    document.getElementById('autojobr-save-job')?.addEventListener('click', () => this.handleSaveJob());
    document.getElementById('autojobr-cover-letter')?.addEventListener('click', () => this.handleCoverLetter());
    document.getElementById('autojobr-submit')?.addEventListener('click', () => this.handleSubmitRequest());
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'extractJobDetails':
          this.extractJobDetails().then(sendResponse);
          return true;
          
        case 'startAutofill':
          this.startAutofill(message.userProfile).then(sendResponse);
          return true;
          
        case 'fillCoverLetter':
          this.fillCoverLetter(message.coverLetter).then(sendResponse);
          return true;
          
        case 'analyzeJob':
          this.analyzeCurrentJob().then(sendResponse);
          return true;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    });
  }

  observePageChanges() {
    // Watch for URL changes (SPA navigation)
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(() => {
          this.detectJobPosting();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => this.detectJobPosting(), 1000);
    });
  }

  async detectJobPosting() {
    const jobData = await this.extractJobDetails();
    
    if (jobData.success && jobData.jobData.title) {
      this.currentJobData = jobData.jobData;
      this.showAutoJobrWidget();
    } else {
      this.hideAutoJobrWidget();
    }
  }

  showAutoJobrWidget() {
    const widget = document.querySelector('.autojobr-widget');
    if (widget) {
      widget.style.display = 'block';
      widget.style.position = 'fixed';
      widget.style.top = '20px';
      widget.style.right = '20px';
      widget.style.zIndex = '10000';
    }
  }

  hideAutoJobrWidget() {
    const widget = document.querySelector('.autojobr-widget');
    if (widget) {
      widget.style.display = 'none';
    }
  }

  async extractJobDetails() {
    try {
      const selectors = this.getJobSelectors();
      
      const jobData = {
        title: this.extractText(selectors.title),
        company: this.extractText(selectors.company),
        location: this.extractText(selectors.location),
        description: this.extractText(selectors.description),
        requirements: this.extractText(selectors.requirements),
        salary: this.extractText(selectors.salary),
        type: this.extractText(selectors.type),
        url: window.location.href
      };

      // Clean up extracted data
      Object.keys(jobData).forEach(key => {
        if (typeof jobData[key] === 'string') {
          jobData[key] = jobData[key].trim().replace(/\s+/g, ' ');
        }
      });

      return { success: true, jobData };
    } catch (error) {
      console.error('Job extraction error:', error);
      return { success: false, error: error.message };
    }
  }

  getJobSelectors() {
    const siteSelectors = {
      linkedin: {
        title: ['.top-card-layout__title h1', '.job-details-jobs-unified-top-card__job-title h1', 'h1.t-24'],
        company: ['.topcard__org-name-link', '.job-details-jobs-unified-top-card__company-name a', '.topcard__flavor--black-link'],
        location: ['.topcard__flavor--bullet', '.job-details-jobs-unified-top-card__bullet', '.topcard__flavor'],
        description: ['.description__text', '.jobs-description-content__text', '.jobs-description .t-14'],
        requirements: ['.description__text', '.jobs-description-content__text'],
        salary: ['.salary', '.compensation', '.pay-range'],
        type: ['.job-criteria__text', '.job-details-preferences-and-skills']
      },
      indeed: {
        title: ['[data-testid="jobsearch-JobInfoHeader-title"] h1', '.jobsearch-JobInfoHeader-title h1', 'h1[data-testid="job-title"]'],
        company: ['[data-testid="inlineHeader-companyName"] a', '.jobsearch-InlineCompanyRating-companyHeader a', 'a[data-testid="company-name"]'],
        location: ['[data-testid="job-location"]', '.jobsearch-JobInfoHeader-subtitle div', '.companyLocation'],
        description: ['#jobDescriptionText', '.jobsearch-jobDescriptionText', '.jobsearch-JobComponent-description'],
        requirements: ['#jobDescriptionText', '.jobsearch-jobDescriptionText'],
        salary: ['.attribute_snippet', '.salary-snippet', '.estimated-salary'],
        type: ['.jobsearch-JobDescriptionSection-section', '.job-snippet']
      },
      workday: {
        title: ['.css-1id67r3', '[data-automation-id="jobPostingHeader"]', '.WDKN_PositionTitle', 'h1[data-automation-id="jobPostingHeader"]'],
        company: ['[data-automation-id="company"]', '.css-1x9zq2f', '.WDKN_CompanyName'],
        location: ['[data-automation-id="locations"]', '.css-129m7dg', '.WDKN_Location'],
        description: ['[data-automation-id="jobPostingDescription"]', '.css-1t3of01', '.WDKN_JobDescription'],
        requirements: ['[data-automation-id="jobPostingDescription"]', '.css-1t3of01'],
        salary: ['.css-salary', '.compensation-section'],
        type: ['[data-automation-id="employmentType"]', '.employment-type']
      },
      greenhouse: {
        title: ['.header--title', '.app-title', 'h1.header-title'],
        company: ['.header--company', '.company-name', '.header-company'],
        location: ['.header--location', '.location', '.job-location'],
        description: ['.body--text', '.section--text', '.job-post-content'],
        requirements: ['.body--text', '.section--text'],
        salary: ['.salary', '.compensation'],
        type: ['.employment-type', '.job-type']
      },
      lever: {
        title: ['.posting-headline h2', '.template-job-page h1', '.job-title'],
        company: ['.posting-company', '.company-name', '.lever-company'],
        location: ['.posting-categories .location', '.job-location', '.posting-location'],
        description: ['.posting-description .section-wrapper', '.job-description'],
        requirements: ['.posting-description .section-wrapper', '.job-description'],
        salary: ['.salary', '.compensation'],
        type: ['.posting-categories .commitment', '.employment-type']
      },
      generic: {
        title: ['h1', '.job-title', '.position-title', '[class*="title"]', '[class*="job"]', '[class*="position"]'],
        company: ['.company', '.employer', '.organization', '[class*="company"]', '[class*="employer"]'],
        location: ['.location', '.address', '.city', '[class*="location"]', '[class*="address"]'],
        description: ['.description', '.job-desc', '.content', '[class*="description"]', '[class*="content"]'],
        requirements: ['.requirements', '.qualifications', '[class*="requirements"]', '[class*="qualifications"]'],
        salary: ['.salary', '.compensation', '.pay', '[class*="salary"]', '[class*="compensation"]'],
        type: ['.job-type', '.employment-type', '[class*="type"]']
      }
    };

    return siteSelectors[this.currentSite] || siteSelectors.generic;
  }

  extractText(selectors) {
    if (!selectors) return '';
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.innerText || element.textContent || '';
      }
    }
    
    return '';
  }

  async startAutofill(userProfile) {
    if (this.fillInProgress) {
      return { success: false, error: 'Auto-fill already in progress' };
    }

    this.fillInProgress = true;

    try {
      // Find all form fields
      const forms = document.querySelectorAll('form');
      let fieldsFound = 0;
      let fieldsFilled = 0;

      for (const form of forms) {
        const fields = form.querySelectorAll('input, select, textarea');
        
        for (const field of fields) {
          fieldsFound++;
          
          if (await this.fillField(field, userProfile)) {
            fieldsFilled++;
            // Human-like delay between fields
            await this.delay(200 + Math.random() * 300);
          }
        }
      }

      // Handle file uploads (resume)
      await this.handleFileUploads(userProfile);

      this.fillInProgress = false;
      
      return {
        success: true,
        fieldsFound,
        fieldsFilled,
        message: `Successfully filled ${fieldsFilled} out of ${fieldsFound} fields`
      };

    } catch (error) {
      this.fillInProgress = false;
      console.error('Auto-fill error:', error);
      return { success: false, error: error.message };
    }
  }

  async fillField(field, userProfile) {
    try {
      if (!field || field.disabled || field.readOnly) return false;

      const fieldInfo = this.analyzeField(field);
      const value = this.getValueForField(fieldInfo, userProfile);

      if (!value) return false;

      // Scroll field into view
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.delay(100);

      // Focus the field
      field.focus();
      await this.delay(50);

      if (field.tagName === 'SELECT') {
        return this.fillSelectField(field, value);
      } else if (field.type === 'checkbox' || field.type === 'radio') {
        return this.fillChoiceField(field, value);
      } else {
        return this.fillTextField(field, value);
      }

    } catch (error) {
      console.error('Field fill error:', error);
      return false;
    }
  }

  analyzeField(field) {
    const info = {
      name: field.name?.toLowerCase() || '',
      id: field.id?.toLowerCase() || '',
      placeholder: field.placeholder?.toLowerCase() || '',
      label: '',
      type: field.type?.toLowerCase() || 'text',
      className: field.className?.toLowerCase() || '',
      automationId: field.getAttribute('data-automation-id')?.toLowerCase() || ''
    };

    // Find associated label
    const label = field.closest('label') || 
                  document.querySelector(`label[for="${field.id}"]`) ||
                  field.previousElementSibling?.tagName === 'LABEL' ? field.previousElementSibling : null;
    
    if (label) {
      info.label = label.innerText?.toLowerCase() || '';
    }

    // Combine all identifiers for matching
    info.combined = `${info.name} ${info.id} ${info.placeholder} ${info.label} ${info.className} ${info.automationId}`;

    return info;
  }

  getValueForField(fieldInfo, userProfile) {
    if (!userProfile) return null;

    // Match field to user profile data
    for (const [profileKey, fieldPatterns] of Object.entries(this.fieldMappings)) {
      for (const pattern of fieldPatterns) {
        if (fieldInfo.combined.includes(pattern)) {
          return this.getProfileValue(profileKey, userProfile);
        }
      }
    }

    // Special case matching for common patterns
    if (fieldInfo.combined.includes('name') && !fieldInfo.combined.includes('company')) {
      if (fieldInfo.combined.includes('first') || fieldInfo.combined.includes('given')) {
        return userProfile.firstName;
      } else if (fieldInfo.combined.includes('last') || fieldInfo.combined.includes('family')) {
        return userProfile.lastName;
      } else {
        return `${userProfile.firstName} ${userProfile.lastName}`;
      }
    }

    return null;
  }

  getProfileValue(key, profile) {
    const valueMap = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: `${profile.firstName} ${profile.lastName}`,
      email: profile.email,
      phone: profile.phone,
      address: profile.currentAddress,
      city: profile.location?.split(',')[0]?.trim(),
      state: profile.location?.split(',')[1]?.trim(),
      zipCode: profile.zipCode,
      country: 'United States',
      currentTitle: profile.professionalTitle,
      company: profile.currentCompany,
      experience: profile.yearsExperience?.toString(),
      linkedin: profile.linkedinUrl,
      github: profile.githubUrl,
      portfolio: profile.portfolioUrl,
      workAuth: 'Yes',
      visa: 'No sponsorship required'
    };

    return valueMap[key] || null;
  }

  async fillTextField(field, value) {
    try {
      // Clear existing value
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));

      // Type with human-like delays
      for (let i = 0; i < value.length; i++) {
        field.value = value.substring(0, i + 1);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(30 + Math.random() * 20);
      }

      // Trigger additional events for React/Angular compatibility
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('Text field fill error:', error);
      return false;
    }
  }

  fillSelectField(field, value) {
    try {
      const options = Array.from(field.options);
      
      // Try exact match first
      let option = options.find(opt => 
        opt.text.toLowerCase() === value.toLowerCase() ||
        opt.value.toLowerCase() === value.toLowerCase()
      );

      // Try partial match
      if (!option) {
        option = options.find(opt => 
          opt.text.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(opt.text.toLowerCase())
        );
      }

      if (option) {
        field.value = option.value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Select field fill error:', error);
      return false;
    }
  }

  fillChoiceField(field, value) {
    try {
      const shouldCheck = value.toLowerCase() === 'yes' || 
                         value.toLowerCase() === 'true' || 
                         value === '1';

      if (field.checked !== shouldCheck) {
        field.checked = shouldCheck;
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return true;
    } catch (error) {
      console.error('Choice field fill error:', error);
      return false;
    }
  }

  async handleFileUploads(userProfile) {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    for (const input of fileInputs) {
      if (input.accept?.includes('.pdf') || input.name?.toLowerCase().includes('resume')) {
        await this.uploadResume(input, userProfile);
      }
    }
  }

  async uploadResume(input, userProfile) {
    try {
      // Create a mock file (in real implementation, would fetch from server)
      const resumeBlob = new Blob(['Resume content would be here'], { type: 'application/pdf' });
      const resumeFile = new File([resumeBlob], 'resume.pdf', { type: 'application/pdf' });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(resumeFile);
      input.files = dataTransfer.files;
      
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('Resume upload error:', error);
      return false;
    }
  }

  async fillCoverLetter(coverLetter) {
    try {
      const textAreas = document.querySelectorAll('textarea');
      
      for (const textarea of textAreas) {
        const fieldInfo = this.analyzeField(textarea);
        
        if (fieldInfo.combined.includes('cover') || 
            fieldInfo.combined.includes('letter') || 
            fieldInfo.combined.includes('motivation') ||
            fieldInfo.combined.includes('message')) {
          
          await this.fillTextField(textarea, coverLetter);
          return { success: true };
        }
      }

      return { success: false, error: 'Cover letter field not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // UI Event Handlers
  async handleAutofill() {
    // This would be triggered from the popup
    console.log('Autofill triggered from content script UI');
  }

  async handleAnalyze() {
    await this.analyzeCurrentJob();
  }

  async handleSaveJob() {
    if (!this.currentJobData) {
      alert('No job data found on this page');
      return;
    }

    try {
      const response = await fetch(`${this.getApiUrl()}/api/saved-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: this.currentJobData.title || 'Job Position',
          company: this.currentJobData.company || 'Company Name',
          description: this.currentJobData.description,
          location: this.currentJobData.location,
          url: window.location.href,
          platform: 'extension'
        })
      });

      if (response.ok) {
        this.showNotification('✅ Job saved successfully!');
      } else {
        throw new Error('Failed to save job');
      }
    } catch (error) {
      console.error('Save job error:', error);
      alert('Failed to save job. Please try again.');
    }
  }

  async handleCoverLetter() {
    if (!this.currentJobData) {
      alert('No job data found on this page');
      return;
    }

    try {
      const response = await fetch(`${this.getApiUrl()}/api/generate-cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: this.currentJobData.title || 'The Position',
          companyName: this.currentJobData.company || 'The Company',
          jobDescription: this.currentJobData.description || ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        await navigator.clipboard.writeText(result.coverLetter);
        this.showNotification('✅ Cover letter generated and copied to clipboard!');
      } else {
        throw new Error('Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Cover letter error:', error);
      alert('Failed to generate cover letter. Please try again.');
    }
  }

  async handleSubmitRequest() {
    // This mimics the "Submit Autofill Request" functionality from Simplify
    if (!this.currentJobData) {
      alert('No job data found on this page');
      return;
    }

    alert('🚀 Autofill request submitted! The form will be filled automatically.');
    
    // Trigger autofill if user profile is available
    const userProfile = await this.getUserProfile();
    if (userProfile) {
      await this.startAutofill(userProfile);
    }
  }

  async getUserProfile() {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/extension/profile`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
    }
    
    return null;
  }

  async analyzeCurrentJob() {
    const jobData = await this.extractJobDetails();
    
    if (jobData.success) {
      // Display job analysis in the UI
      const statusEl = document.getElementById('autojobr-status');
      if (statusEl) {
        statusEl.innerHTML = `
          <div class="status-icon">📊</div>
          <div class="status-text">Job: ${jobData.jobData.title} at ${jobData.jobData.company}</div>
        `;
      }
    }
    
    return jobData;
  }

  getApiUrl() {
    return window.location.hostname.includes('replit.dev') || window.location.hostname.includes('replit.app') 
      ? `${window.location.protocol}//${window.location.host}`
      : 'https://29ce8162-da3c-47aa-855b-eac2ee4b17cd-00-2uv34jdoe24cx.riker.replit.dev';
  }

  showNotification(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AutoJobrContentScript();
  });
} else {
  new AutoJobrContentScript();
}