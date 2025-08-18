// Enhanced AutoJobr Content Script v2.0 - Advanced Job Board Auto-Fill System
class AutoJobrContentScript {
  constructor() {
    this.isInitialized = false;
    this.currentJobData = null;
    this.fillInProgress = false;
    this.currentSite = this.detectSite();
    this.fieldMappings = this.initializeFieldMappings();
    this.observers = [];
    this.fillHistory = [];
    this.smartSelectors = new Map();
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      this.injectEnhancedUI();
      this.setupMessageListener();
      this.observePageChanges();
      this.detectJobPosting();
      this.setupKeyboardShortcuts();
      this.initializeSmartSelectors();
      this.setupApplicationTracking(); // Setup tracking once during initialization
      this.setupAutoAnalysis(); // New: Setup automatic job analysis
      this.isInitialized = true;
      
      // Mark as loaded for background script
      window.autojobrContentScriptLoaded = true;
      
      console.log('🚀 AutoJobr extension v2.0 initialized on:', this.currentSite);
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
      firstName: {
        patterns: ['firstName', 'first_name', 'fname', 'first-name', 'given-name', 'forename', 'given name', 'legal first name', 'first legal name'],
        types: ['text'],
        priority: 10
      },
      lastName: {
        patterns: ['lastName', 'last_name', 'lname', 'last-name', 'family-name', 'surname', 'family name', 'legal last name', 'last legal name'],
        types: ['text'],
        priority: 10
      },
      fullName: {
        patterns: ['fullName', 'full_name', 'name', 'full-name', 'candidate-name', 'applicant-name', 'legal name', 'legal full name', 'full legal name'],
        types: ['text'],
        priority: 9
      },
      email: {
        patterns: ['email', 'emailAddress', 'email_address', 'email-address', 'e-mail', 'mail'],
        types: ['email', 'text'],
        priority: 10
      },
      phone: {
        patterns: ['phone', 'phoneNumber', 'phone_number', 'phone-number', 'telephone', 'mobile', 'cell'],
        types: ['tel', 'text'],
        priority: 9
      },
      
      // Address
      address: {
        patterns: ['address', 'street', 'streetAddress', 'street_address', 'address1', 'addr1'],
        types: ['text'],
        priority: 8
      },
      city: {
        patterns: ['city', 'locality', 'town'],
        types: ['text'],
        priority: 8
      },
      state: {
        patterns: ['state', 'region', 'province', 'st'],
        types: ['text', 'select-one'],
        priority: 8
      },
      zipCode: {
        patterns: ['zipCode', 'zip', 'postalCode', 'postal_code', 'postal-code', 'postcode'],
        types: ['text'],
        priority: 8
      },
      country: {
        patterns: ['country', 'nation'],
        types: ['text', 'select-one'],
        priority: 7
      },
      
      // Professional
      currentTitle: {
        patterns: ['currentTitle', 'title', 'jobTitle', 'job_title', 'position', 'role'],
        types: ['text'],
        priority: 9
      },
      company: {
        patterns: ['company', 'employer', 'organization', 'current_company', 'currentCompany'],
        types: ['text'],
        priority: 8
      },
      experience: {
        patterns: ['experience', 'yearsExperience', 'years_experience', 'years-experience', 'exp'],
        types: ['text', 'number', 'select-one'],
        priority: 7
      },
      
      // Education
      university: {
        patterns: ['university', 'school', 'college', 'education', 'institution'],
        types: ['text'],
        priority: 7
      },
      degree: {
        patterns: ['degree', 'education_level', 'qualification'],
        types: ['text', 'select-one'],
        priority: 7
      },
      major: {
        patterns: ['major', 'field', 'study', 'specialization', 'concentration'],
        types: ['text'],
        priority: 7
      },
      
      // Links
      linkedin: {
        patterns: ['linkedin', 'linkedinUrl', 'linkedin_url', 'linkedin-url', 'li-url'],
        types: ['url', 'text'],
        priority: 6
      },
      github: {
        patterns: ['github', 'githubUrl', 'github_url', 'github-url'],
        types: ['url', 'text'],
        priority: 6
      },
      portfolio: {
        patterns: ['portfolio', 'website', 'portfolioUrl', 'personal_website'],
        types: ['url', 'text'],
        priority: 6
      },
      
      // Work Authorization
      workAuth: {
        patterns: ['workAuthorization', 'work_authorization', 'eligible', 'authorized', 'legal'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 8
      },
      visa: {
        patterns: ['visa', 'visaStatus', 'visa_status', 'immigration', 'sponsor'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 7
      },
      
      // Skills and Technical
      skills: {
        patterns: ['skills', 'technical_skills', 'technologies', 'programming', 'tech_stack', 'competencies'],
        types: ['text', 'textarea'],
        priority: 7
      },
      
      // Salary and Compensation
      salary: {
        patterns: ['salary', 'compensation', 'expected_salary', 'desired_salary', 'pay_rate', 'wage', 'salary_expectation'],
        types: ['text', 'number'],
        priority: 6
      },
      
      // Additional fields
      description: {
        patterns: ['description', 'summary', 'about', 'bio', 'overview', 'profile_summary', 'personal_statement'],
        types: ['textarea', 'text'],
        priority: 6
      },
      
      // Resume/Cover Letter
      resume: {
        patterns: ['resume', 'cv', 'resumeUpload', 'resume_upload', 'curriculum'],
        types: ['file'],
        priority: 9
      },
      coverLetter: {
        patterns: ['coverLetter', 'cover_letter', 'covering_letter', 'motivation'],
        types: ['textarea', 'text'],
        priority: 8
      }
    };
  }

  initializeSmartSelectors() {
    // Site-specific smart selectors for better accuracy
    const siteSelectors = {
      linkedin: {
        forms: ['.jobs-apply-form', '.application-outlet', '.jobs-easy-apply-modal'],
        skipButtons: ['.artdeco-button--secondary', '[data-test-modal-close-btn]'],
        nextButtons: ['.artdeco-button--primary', '[aria-label*="Continue"]'],
        submitButtons: ['.artdeco-button--primary', '[aria-label*="Submit"]']
      },
      indeed: {
        forms: ['.ia-BasePage-content form', '.jobsearch-ApplyIndeed-content form'],
        skipButtons: ['.ia-continueButton--secondary'],
        nextButtons: ['.ia-continueButton', '.np-button'],
        submitButtons: ['.ia-continueButton--primary']
      },
      workday: {
        forms: ['[data-automation-id="jobApplication"]', '.css-1hwfws3'],
        skipButtons: ['[data-automation-id="cancelButton"]'],
        nextButtons: ['[data-automation-id="continueButton"]'],
        submitButtons: ['[data-automation-id="submitButton"]']
      }
    };

    this.smartSelectors = siteSelectors[this.currentSite] || siteSelectors.generic || {};
  }

  injectEnhancedUI() {
    if (document.getElementById('autojobr-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'autojobr-overlay';
    overlay.innerHTML = `
      <div class="autojobr-widget" style="display: none;">
        <div class="autojobr-header">
          <div class="autojobr-logo">
            <div class="autojobr-icon">A</div>
            <span>AutoJobr v2.0</span>
          </div>
          <div class="autojobr-controls">
            <button class="autojobr-minimize" title="Minimize">−</button>
            <button class="autojobr-close" title="Close">×</button>
          </div>
        </div>
        
        <div class="autojobr-content">
          <div class="autojobr-status" id="autojobr-status">
            <div class="status-icon">🎯</div>
            <div class="status-text">Job detected - Ready to auto-fill</div>
            <div class="status-progress" id="autojobr-progress" style="display: none;">
              <div class="progress-bar"></div>
            </div>
          </div>
          
          <div class="autojobr-job-info" id="autojobr-job-info" style="display: none;">
            <div class="job-title" id="autojobr-job-title"></div>
            <div class="job-company" id="autojobr-job-company"></div>
            <div class="job-match" id="autojobr-job-match"></div>
          </div>
          
          <div class="autojobr-actions">
            <button class="autojobr-btn primary" id="autojobr-autofill">
              <span class="btn-icon">⚡</span>
              <span class="btn-text">Smart Auto-fill</span>
              <span class="btn-shortcut">Ctrl+A</span>
            </button>
            
            <div class="action-row">
              <button class="autojobr-btn secondary" id="autojobr-analyze">
                <span class="btn-icon">📊</span>
                <span>Analyze</span>
              </button>
              <button class="autojobr-btn secondary" id="autojobr-save-job">
                <span class="btn-icon">💾</span>
                <span>Save</span>
              </button>
              <button class="autojobr-btn secondary" id="autojobr-cover-letter">
                <span class="btn-icon">📝</span>
                <span>Cover Letter</span>
              </button>
            </div>
          </div>
          
          <div class="autojobr-features">
            <div class="feature-toggle">
              <input type="checkbox" id="smart-fill" checked>
              <label for="smart-fill">Smart Fill Mode</label>
            </div>
            <div class="feature-toggle">
              <input type="checkbox" id="auto-submit">
              <label for="auto-submit">Auto Submit</label>
            </div>
          </div>
          
          <div class="autojobr-stats" id="autojobr-stats" style="display: none;">
            <div class="stat-item">
              <span class="stat-label">Fields Found:</span>
              <span class="stat-value" id="fields-found">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Fields Filled:</span>
              <span class="stat-value" id="fields-filled">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Success Rate:</span>
              <span class="stat-value" id="success-rate">0%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.attachEnhancedUIEventListeners();
    this.makeWidgetDraggable();
  }

  attachEnhancedUIEventListeners() {
    // Main action buttons
    document.getElementById('autojobr-autofill')?.addEventListener('click', () => this.handleSmartAutofill());
    document.getElementById('autojobr-analyze')?.addEventListener('click', () => this.handleAnalyze());
    document.getElementById('autojobr-save-job')?.addEventListener('click', () => this.handleSaveJob());
    document.getElementById('autojobr-cover-letter')?.addEventListener('click', () => this.handleCoverLetter());

    // Widget controls
    // Enhanced close button with better event handling
    const closeBtn = document.querySelector('.autojobr-close');
    const minimizeBtn = document.querySelector('.autojobr-minimize');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideWidget();
      });
      // Add touch event for mobile
      closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideWidget();
      });
    }
    
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.minimizeWidget();
      });
      minimizeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.minimizeWidget();
      });
    }

    // Feature toggles
    document.getElementById('smart-fill')?.addEventListener('change', (e) => {
      chrome.storage.sync.set({ smartFillMode: e.target.checked });
    });

    document.getElementById('auto-submit')?.addEventListener('change', (e) => {
      chrome.storage.sync.set({ autoSubmitMode: e.target.checked });
    });
  }

  makeWidgetDraggable() {
    const widget = document.querySelector('.autojobr-widget');
    const header = document.querySelector('.autojobr-header');
    
    if (!widget || !header) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
        widget.style.cursor = 'grabbing';
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        widget.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }

    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      widget.style.cursor = 'default';
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            if (e.shiftKey) {
              e.preventDefault();
              this.handleSmartAutofill();
            }
            break;
          case 'j':
            if (e.shiftKey) {
              e.preventDefault();
              this.handleAnalyze();
            }
            break;
          case 's':
            if (e.shiftKey) {
              e.preventDefault();
              this.handleSaveJob();
            }
            break;
        }
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'extractJobDetails':
          this.extractJobDetails().then(sendResponse);
          return true;
          
        case 'detectJobPosting':
          this.detectJobPosting().then(sendResponse);
          return true;
          
        case 'startAutofill':
          this.startSmartAutofill(message.userProfile).then(sendResponse);
          return true;
          
        case 'fillCoverLetter':
          this.fillCoverLetter(message.coverLetter).then(sendResponse);
          return true;
          
        case 'analyzeJob':
          this.analyzeCurrentJob().then(sendResponse);
          return true;

        case 'saveCurrentJob':
          this.saveCurrentJob().then(sendResponse);
          return true;

        case 'uploadResumeToForm':
          this.uploadResumeToForm().then(sendResponse);
          return true;

        case 'detectResumeFields':
          this.detectResumeFields().then(sendResponse);
          return true;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    });
  }

  observePageChanges() {
    // Enhanced mutation observer for SPA navigation
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver((mutations) => {
      // Check for URL changes
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(() => {
          this.detectJobPosting();
        }, 1500);
      }

      // Check for form changes
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
              if (forms.length > 0 || node.tagName === 'FORM') {
                setTimeout(() => this.analyzeNewForms(), 500);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id']
    });

    this.observers.push(observer);

    // Listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => this.detectJobPosting(), 1000);
    });

    // Listen for pushstate/replacestate
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(history, arguments);
      setTimeout(() => this.detectJobPosting(), 1000);
    }.bind(this);

    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      setTimeout(() => this.detectJobPosting(), 1000);
    }.bind(this);
  }

  async detectJobPosting() {
    try {
      // First check if this is actually a job page
      if (!this.isJobPage()) {
        this.hideWidget();
        return { success: false, reason: 'Not a job page' };
      }

      const jobData = await this.extractJobDetails();
      
      if (jobData.success && jobData.jobData.title) {
        this.currentJobData = jobData.jobData;
        this.showWidget();
        this.updateJobInfo(jobData.jobData);
        
        return { success: true, jobData: jobData.jobData };
      } else {
        this.hideWidget();
        return { success: false };
      }
    } catch (error) {
      console.error('Job detection error:', error);
      return { success: false, error: error.message };
    }
  }

  isJobPage() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // Site-specific job page detection
    const jobPagePatterns = {
      'linkedin.com': ['/jobs/', '/job/'],
      'indeed.com': ['/job/', '/viewjob'],
      'glassdoor.com': ['/job/', '/jobs/'],
      'ziprecruiter.com': ['/jobs/', '/job/'],
      'monster.com': ['/job/', '/jobs/'],
      'careerbuilder.com': ['/job/', '/jobs/'],
      'dice.com': ['/jobs/', '/job/'],
      'stackoverflow.com': ['/jobs/', '/job/'],
      'angel.co': ['/job/', '/jobs/'],
      'wellfound.com': ['/job/', '/jobs/'],
      'greenhouse.io': ['/job/', '/jobs/'],
      'lever.co': ['/jobs/', '/job/'],
      'workday.com': ['/job/', '/jobs/', '/en-us/job/'],
      'myworkdayjobs.com': ['/job/', '/jobs/'],
      'icims.com': ['/job/', '/jobs/'],
      'smartrecruiters.com': ['/job/', '/jobs/'],
      'bamboohr.com': ['/job/', '/jobs/'],
      'ashbyhq.com': ['/job/', '/jobs/'],
      'careers.google.com': ['/job/', '/jobs/'],
      'amazon.jobs': ['/job/', '/jobs/'],
      'microsoft.com': ['/job/', '/jobs/', '/careers/job-search/'],
      'apple.com': ['/job/', '/jobs/'],
      'meta.com': ['/job/', '/jobs/']
    };

    // Check if hostname matches and URL contains job pattern
    for (const [domain, patterns] of Object.entries(jobPagePatterns)) {
      if (hostname.includes(domain)) {
        return patterns.some(pattern => url.includes(pattern));
      }
    }

    // Fallback: check for generic job indicators in URL
    const genericJobIndicators = ['/job/', '/jobs/', '/career/', '/careers/', '/position/', '/apply/'];
    return genericJobIndicators.some(indicator => url.includes(indicator));
  }

  updateJobInfo(jobData) {
    const jobInfo = document.getElementById('autojobr-job-info');
    const jobTitle = document.getElementById('autojobr-job-title');
    const jobCompany = document.getElementById('autojobr-job-company');
    
    if (jobInfo && jobTitle && jobCompany) {
      // Use extracted data with better fallbacks
      const title = jobData.title || jobData.role || jobData.position || 'Job detected';
      const company = jobData.company || jobData.companyName || jobData.employer || 'Company detected';
      
      jobTitle.textContent = title;
      jobCompany.textContent = company;
      jobInfo.style.display = 'block';
      
      // Store the enhanced data for cover letter generation
      this.currentJobData = {
        ...jobData,
        title: title,
        company: company,
        extractedAt: new Date().toISOString()
      };
      
      console.log('Updated job info with extracted data:', { title, company });
    }
  }

  showWidget() {
    const widget = document.querySelector('.autojobr-widget');
    if (widget) {
      widget.style.display = 'block';
      widget.style.position = 'fixed';
      widget.style.top = '20px';
      widget.style.right = '20px';
      widget.style.zIndex = '10000';
      
      // Animate in
      widget.style.opacity = '0';
      widget.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        widget.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        widget.style.opacity = '1';
        widget.style.transform = 'translateX(0)';
      }, 100);
    }
  }

  hideWidget() {
    const widget = document.querySelector('.autojobr-widget');
    if (widget) {
      widget.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      widget.style.opacity = '0';
      widget.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        widget.remove(); // Completely remove from DOM instead of just hiding
      }, 300);
    }
  }

  minimizeWidget() {
    const widget = document.querySelector('.autojobr-widget');
    const content = document.querySelector('.autojobr-content');
    
    if (widget && content) {
      const isMinimized = content.style.display === 'none';
      
      if (isMinimized) {
        content.style.display = 'block';
        widget.style.height = 'auto';
      } else {
        content.style.display = 'none';
        widget.style.height = '60px';
      }
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
        url: window.location.href,
        site: this.currentSite,
        extractedAt: new Date().toISOString()
      };

      // Enhanced data cleaning
      Object.keys(jobData).forEach(key => {
        if (typeof jobData[key] === 'string') {
          jobData[key] = jobData[key]
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .substring(0, key === 'description' ? 5000 : 500); // Limit lengths
        }
      });

      // Validate required fields
      const isValid = jobData.title && jobData.title.length > 2;

      return { 
        success: isValid, 
        jobData: isValid ? jobData : null,
        confidence: this.calculateExtractionConfidence(jobData)
      };
    } catch (error) {
      console.error('Job extraction error:', error);
      return { success: false, error: error.message };
    }
  }

  calculateExtractionConfidence(jobData) {
    let score = 0;
    const weights = {
      title: 30,
      company: 25,
      location: 15,
      description: 20,
      salary: 10
    };

    Object.keys(weights).forEach(key => {
      if (jobData[key] && jobData[key].length > 2) {
        score += weights[key];
      }
    });

    return Math.min(100, score);
  }

  getJobSelectors() {
    const siteSelectors = {
      linkedin: {
        title: [
          '.top-card-layout__title h1',
          '.job-details-jobs-unified-top-card__job-title h1',
          'h1.t-24',
          '.jobs-unified-top-card__job-title h1'
        ],
        company: [
          '.topcard__org-name-link',
          '.job-details-jobs-unified-top-card__company-name a',
          '.topcard__flavor--black-link',
          '.jobs-unified-top-card__company-name a'
        ],
        location: [
          '.topcard__flavor--bullet',
          '.job-details-jobs-unified-top-card__bullet',
          '.topcard__flavor',
          '.jobs-unified-top-card__bullet'
        ],
        description: [
          '.description__text',
          '.jobs-description-content__text',
          '.jobs-description .t-14',
          '.jobs-box__html-content'
        ],
        requirements: [
          '.description__text',
          '.jobs-description-content__text'
        ],
        salary: [
          '.salary',
          '.compensation',
          '.pay-range'
        ],
        type: [
          '.job-criteria__text',
          '.job-details-preferences-and-skills'
        ]
      },
      indeed: {
        title: [
          '[data-testid="jobsearch-JobInfoHeader-title"] h1',
          '.jobsearch-JobInfoHeader-title h1',
          'h1[data-testid="job-title"]',
          '.jobsearch-JobInfoHeader-title span'
        ],
        company: [
          '[data-testid="inlineHeader-companyName"] a',
          '.jobsearch-InlineCompanyRating-companyHeader a',
          'a[data-testid="company-name"]',
          '.jobsearch-CompanyReview--heading'
        ],
        location: [
          '[data-testid="job-location"]',
          '.jobsearch-JobInfoHeader-subtitle div',
          '.companyLocation',
          '[data-testid="job-location"] div'
        ],
        description: [
          '#jobDescriptionText',
          '.jobsearch-jobDescriptionText',
          '.jobsearch-JobComponent-description',
          '.jobsearch-JobComponent-description div'
        ],
        requirements: [
          '#jobDescriptionText',
          '.jobsearch-jobDescriptionText'
        ],
        salary: [
          '.attribute_snippet',
          '.salary-snippet',
          '.estimated-salary',
          '.jobsearch-SalaryGuide-module'
        ],
        type: [
          '.jobsearch-JobDescriptionSection-section',
          '.job-snippet'
        ]
      },
      workday: {
        title: [
          '.css-1id67r3',
          '[data-automation-id="jobPostingHeader"]',
          '.WDKN_PositionTitle',
          'h1[data-automation-id="jobPostingHeader"]',
          '[data-automation-id="jobPostingHeader"] h1'
        ],
        company: [
          '[data-automation-id="company"]',
          '.css-1x9zq2f',
          '.WDKN_CompanyName',
          '[data-automation-id="company"] div'
        ],
        location: [
          '[data-automation-id="locations"]',
          '.css-129m7dg',
          '.WDKN_Location',
          '[data-automation-id="locations"] div'
        ],
        description: [
          '[data-automation-id="jobPostingDescription"]',
          '.css-1t3of01',
          '.WDKN_JobDescription',
          '[data-automation-id="jobPostingDescription"] div'
        ],
        requirements: [
          '[data-automation-id="jobPostingDescription"]',
          '.css-1t3of01'
        ],
        salary: [
          '.css-salary',
          '.compensation-section'
        ],
        type: [
          '[data-automation-id="employmentType"]',
          '.employment-type'
        ]
      },
      greenhouse: {
        title: [
          '.header--title',
          '.app-title',
          'h1.header-title',
          '.posting-headline h2'
        ],
        company: [
          '.header--company',
          '.company-name',
          '.header-company',
          '.posting-company'
        ],
        location: [
          '.header--location',
          '.location',
          '.job-location',
          '.posting-categories .location'
        ],
        description: [
          '.body--text',
          '.section--text',
          '.job-post-content',
          '.posting-description .section-wrapper'
        ],
        requirements: [
          '.body--text',
          '.section--text'
        ],
        salary: [
          '.salary',
          '.compensation'
        ],
        type: [
          '.employment-type',
          '.job-type'
        ]
      },
      lever: {
        title: [
          '.posting-headline h2',
          '.template-job-page h1',
          '.job-title'
        ],
        company: [
          '.posting-company',
          '.company-name',
          '.lever-company'
        ],
        location: [
          '.posting-categories .location',
          '.job-location',
          '.posting-location'
        ],
        description: [
          '.posting-description .section-wrapper',
          '.job-description'
        ],
        requirements: [
          '.posting-description .section-wrapper',
          '.job-description'
        ],
        salary: [
          '.salary',
          '.compensation'
        ],
        type: [
          '.posting-categories .commitment',
          '.employment-type'
        ]
      },
      microsoft: {
        title: [
          'h1[data-test-id="job-title"]',
          '.ms-JobDetailHeader-title h1',
          '.ms-JobTitle',
          'h1.c-heading-3',
          '[data-automation-id="jobTitle"]',
          '.job-detail-title h1'
        ],
        company: [
          '.ms-JobDetailHeader-company',
          '.ms-CompanyName',
          '.company-name',
          '[data-automation-id="company"]'
        ],
        location: [
          '.ms-JobDetailHeader-location',
          '.ms-Location',
          '.job-location',
          '[data-automation-id="location"]'
        ],
        description: [
          '.ms-JobDescription',
          '.job-description-content',
          '.job-detail-description',
          '[data-automation-id="jobDescription"]'
        ],
        requirements: [
          '.ms-JobRequirements',
          '.job-requirements',
          '.qualifications'
        ],
        salary: [
          '.ms-Salary',
          '.salary-range',
          '.compensation'
        ],
        type: [
          '.ms-JobType',
          '.employment-type',
          '.job-type'
        ]
      },
      generic: {
        title: [
          'h1',
          '.job-title',
          '.position-title',
          '[class*="title"]',
          '[class*="job"]',
          '[class*="position"]',
          'h1[class*="job"]',
          'h2[class*="job"]'
        ],
        company: [
          '.company',
          '.employer',
          '.organization',
          '[class*="company"]',
          '[class*="employer"]',
          '[class*="org"]'
        ],
        location: [
          '.location',
          '.address',
          '.city',
          '[class*="location"]',
          '[class*="address"]',
          '[class*="city"]'
        ],
        description: [
          '.description',
          '.job-desc',
          '.content',
          '[class*="description"]',
          '[class*="content"]',
          '[class*="detail"]'
        ],
        requirements: [
          '.requirements',
          '.qualifications',
          '[class*="requirements"]',
          '[class*="qualifications"]',
          '[class*="skills"]'
        ],
        salary: [
          '.salary',
          '.compensation',
          '.pay',
          '[class*="salary"]',
          '[class*="compensation"]',
          '[class*="pay"]'
        ],
        type: [
          '.job-type',
          '.employment-type',
          '[class*="type"]',
          '[class*="employment"]'
        ]
      }
    };

    return siteSelectors[this.currentSite] || siteSelectors.generic;
  }

  extractText(selectors) {
    if (!selectors) return '';
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.innerText || element.textContent || '';
          if (text.trim().length > 0) {
            return text.trim();
          }
        }
      } catch (error) {
        console.warn(`Selector error: ${selector}`, error);
      }
    }
    
    return '';
  }

  async startSmartAutofill(userProfile) {
    if (this.fillInProgress) {
      return { success: false, error: 'Auto-fill already in progress' };
    }

    // Prevent infinite loops by tracking attempts
    this.autoFillAttempts = (this.autoFillAttempts || 0) + 1;
    if (this.autoFillAttempts > 2) {
      console.log('Max auto-fill attempts reached, stopping to prevent loops');
      this.autoFillAttempts = 0; // Reset counter
      return { success: false, error: 'Max auto-fill attempts reached' };
    }

    this.fillInProgress = true;
    this.showProgress(true);

    // Debug: Log profile data to help diagnose field mapping issues
    console.log('AutoJobr Extension - Profile data received:', {
      firstName: userProfile?.firstName,
      lastName: userProfile?.lastName,
      fullName: userProfile?.fullName,
      email: userProfile?.email,
      phone: userProfile?.phone,
      professionalTitle: userProfile?.professionalTitle,
      workAuthorization: userProfile?.workAuthorization,
      skills: userProfile?.skills,
      workExperience: userProfile?.workExperience?.length || 0,
      education: userProfile?.education?.length || 0
    });

    try {
      // Get settings
      const settings = await chrome.storage.sync.get(['smartFillMode', 'autoSubmitMode']);
      const smartMode = settings.smartFillMode !== false;
      const autoSubmit = settings.autoSubmitMode === true;

      // Find all forms with enhanced detection
      const forms = this.findAllForms();
      let totalFieldsFound = 0;
      let totalFieldsFilled = 0;
      const fillResults = [];

      for (const form of forms) {
        const result = await this.fillForm(form, userProfile, smartMode);
        totalFieldsFound += result.fieldsFound;
        totalFieldsFilled += result.fieldsFilled;
        fillResults.push(result);
        
        // Update progress
        this.updateProgress(totalFieldsFilled, totalFieldsFound);
        
        // Delay between forms
        await this.delay(500);
      }

      // Handle file uploads
      const fileResults = await this.handleAdvancedFileUploads(userProfile);
      totalFieldsFound += fileResults.filesFound;
      totalFieldsFilled += fileResults.filesUploaded;

      // Update statistics
      this.updateStats(totalFieldsFound, totalFieldsFilled);

      // Auto-submit if enabled
      if (autoSubmit && totalFieldsFilled > 0) {
        await this.attemptAutoSubmit();
      }

      this.fillInProgress = false;
      this.showProgress(false);
      
      // Reset attempts counter after successful completion
      setTimeout(() => {
        this.autoFillAttempts = 0;
      }, 5000);
      
      return {
        success: true,
        fieldsFound: totalFieldsFound,
        fieldsFilled: totalFieldsFilled,
        successRate: totalFieldsFound > 0 ? Math.round((totalFieldsFilled / totalFieldsFound) * 100) : 0,
        message: `Successfully filled ${totalFieldsFilled} out of ${totalFieldsFound} fields`,
        results: fillResults
      };

    } catch (error) {
      this.fillInProgress = false;
      this.showProgress(false);
      // Reset attempts counter on error
      setTimeout(() => {
        this.autoFillAttempts = 0;
      }, 5000);
      console.error('Smart auto-fill error:', error);
      return { success: false, error: error.message };
    }
  }

  findAllForms() {
    const forms = [];
    
    // Standard form detection
    document.querySelectorAll('form').forEach(form => {
      if (this.isRelevantForm(form)) {
        forms.push(form);
      }
    });

    // Site-specific form detection
    if (this.smartSelectors.forms) {
      this.smartSelectors.forms.forEach(selector => {
        document.querySelectorAll(selector).forEach(form => {
          if (!forms.includes(form) && this.isRelevantForm(form)) {
            forms.push(form);
          }
        });
      });
    }

    // Fallback: look for containers with form fields
    if (forms.length === 0) {
      const containers = document.querySelectorAll('div, section, main');
      containers.forEach(container => {
        const fields = container.querySelectorAll('input, select, textarea');
        if (fields.length >= 3) { // Minimum threshold
          forms.push(container);
        }
      });
    }

    return forms;
  }

  isRelevantForm(form) {
    // Skip forms that are clearly not job applications
    const skipPatterns = [
      'search', 'login', 'signin', 'signup', 'newsletter', 
      'subscribe', 'comment', 'review', 'feedback'
    ];

    const formText = (form.textContent || '').toLowerCase();
    const formClass = (form.className || '').toLowerCase();
    const formId = (form.id || '').toLowerCase();

    return !skipPatterns.some(pattern => 
      formText.includes(pattern) || 
      formClass.includes(pattern) || 
      formId.includes(pattern)
    );
  }

  async fillForm(form, userProfile, smartMode) {
    const fields = form.querySelectorAll('input, select, textarea');
    let fieldsFound = 0;
    let fieldsFilled = 0;

    for (const field of fields) {
      if (this.shouldSkipField(field)) continue;
      
      fieldsFound++;
      
      try {
        const filled = await this.fillFieldSmart(field, userProfile, smartMode);
        if (filled) {
          fieldsFilled++;
          
          // Add visual feedback
          this.addFieldFeedback(field, true);
          
          // Human-like delay
          await this.delay(150 + Math.random() * 200);
        }
      } catch (error) {
        console.warn('Field fill error:', error);
        this.addFieldFeedback(field, false);
      }
    }

    return { fieldsFound, fieldsFilled };
  }

  shouldSkipField(field) {
    // Skip hidden, disabled, or readonly fields
    if (field.type === 'hidden' || field.disabled || field.readOnly) {
      return true;
    }

    // Skip fields that are not visible
    const style = window.getComputedStyle(field);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }

    // Skip certain input types
    const skipTypes = ['submit', 'button', 'reset', 'image'];
    if (skipTypes.includes(field.type)) {
      return true;
    }

    return false;
  }

  async fillFieldSmart(field, userProfile, smartMode) {
    try {
      // Scroll field into view smoothly
      field.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      await this.delay(100);

      // Focus the field with animation
      field.focus();
      await this.delay(50);

      const fieldInfo = this.analyzeFieldAdvanced(field);
      const value = this.getValueForFieldSmart(fieldInfo, userProfile, smartMode);

      if (!value) return false;

      // Fill based on field type
      switch (field.tagName.toLowerCase()) {
        case 'select':
          return await this.fillSelectFieldSmart(field, value);
        case 'textarea':
          return await this.fillTextAreaSmart(field, value);
        case 'input':
          switch (field.type.toLowerCase()) {
            case 'checkbox':
            case 'radio':
              return await this.fillChoiceFieldSmart(field, value);
            case 'file':
              return await this.fillFileFieldSmart(field, value, userProfile);
            default:
              return await this.fillTextFieldSmart(field, value);
          }
        default:
          return await this.fillTextFieldSmart(field, value);
      }

    } catch (error) {
      console.error('Smart field fill error:', error);
      return false;
    }
  }

  analyzeFieldAdvanced(field) {
    const info = {
      name: field.name?.toLowerCase() || '',
      id: field.id?.toLowerCase() || '',
      placeholder: field.placeholder?.toLowerCase() || '',
      label: '',
      type: field.type?.toLowerCase() || 'text',
      className: field.className?.toLowerCase() || '',
      automationId: field.getAttribute('data-automation-id')?.toLowerCase() || '',
      ariaLabel: field.getAttribute('aria-label')?.toLowerCase() || '',
      title: field.title?.toLowerCase() || '',
      required: field.required || false,
      maxLength: field.maxLength || null,
      pattern: field.pattern || null
    };

    // Find associated label with multiple strategies
    let label = field.closest('label') || 
                document.querySelector(`label[for="${field.id}"]`);
    
    if (!label) {
      // Look for nearby text
      const parent = field.parentElement;
      const siblings = parent ? Array.from(parent.children) : [];
      const fieldIndex = siblings.indexOf(field);
      
      // Check previous siblings
      for (let i = fieldIndex - 1; i >= 0; i--) {
        const sibling = siblings[i];
        if (sibling.tagName === 'LABEL' || sibling.textContent?.trim()) {
          label = sibling;
          break;
        }
      }
    }
    
    if (label) {
      info.label = (label.innerText || label.textContent || '').toLowerCase();
    }

    // Combine all identifiers for matching
    info.combined = `${info.name} ${info.id} ${info.placeholder} ${info.label} ${info.className} ${info.automationId} ${info.ariaLabel} ${info.title}`;

    // Calculate confidence score
    info.confidence = this.calculateFieldConfidence(info);

    return info;
  }

  calculateFieldConfidence(fieldInfo) {
    let confidence = 0;
    
    // Higher confidence for specific identifiers
    if (fieldInfo.name) confidence += 30;
    if (fieldInfo.id) confidence += 25;
    if (fieldInfo.label) confidence += 20;
    if (fieldInfo.placeholder) confidence += 15;
    if (fieldInfo.automationId) confidence += 10;

    return Math.min(100, confidence);
  }

  getValueForFieldSmart(fieldInfo, userProfile, smartMode) {
    if (!userProfile) return null;

    // Enhanced field matching with priority scoring
    let bestMatch = null;
    let bestScore = 0;

    for (const [profileKey, mapping] of Object.entries(this.fieldMappings)) {
      for (const pattern of mapping.patterns) {
        if (fieldInfo.combined.includes(pattern)) {
          let score = mapping.priority || 1;
          
          // Boost score for exact matches
          if (fieldInfo.name === pattern || fieldInfo.id === pattern) {
            score += 20;
          }
          
          // Boost score for type compatibility
          if (mapping.types.includes(fieldInfo.type)) {
            score += 10;
          }
          
          // Debug: Log field matching for name fields
          if (profileKey === 'firstName' || profileKey === 'lastName' || profileKey === 'fullName') {
            console.log(`AutoJobr Extension - Name field match:`, {
              fieldPattern: pattern,
              profileKey: profileKey,
              fieldInfo: fieldInfo.combined,
              score: score,
              userProfileValue: this.getProfileValueSmart(profileKey, userProfile, fieldInfo)
            });
          }
          
          // Boost score for required fields
          if (fieldInfo.required) {
            score += 5;
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = profileKey;
          }
        }
      }
    }

    if (bestMatch) {
      return this.getProfileValueSmart(bestMatch, userProfile, fieldInfo);
    }

    // Fallback pattern matching
    return this.getFallbackValue(fieldInfo, userProfile);
  }

  getProfileValueSmart(key, profile, fieldInfo) {
    const valueMap = {
      firstName: profile.firstName || profile.user?.firstName || (profile.fullName || '').split(' ')[0] || '',
      lastName: profile.lastName || profile.user?.lastName || (profile.fullName || '').split(' ').slice(1).join(' ') || '',
      fullName: profile.fullName || `${profile.firstName || profile.user?.firstName || ''} ${profile.lastName || profile.user?.lastName || ''}`.trim(),
      email: profile.email || profile.user?.email || '',
      phone: this.formatPhone(profile.phone || profile.profile?.phone, fieldInfo),
      address: profile.currentAddress || profile.profile?.currentAddress || '',
      city: this.extractCity(profile.location || profile.profile?.city),
      state: this.extractState(profile.location || profile.profile?.state),
      zipCode: profile.zipCode || profile.profile?.zipCode || '',
      country: profile.country || 'United States',
      currentTitle: profile.professionalTitle || profile.workExperience?.[0]?.position || '',
      company: profile.currentCompany || profile.workExperience?.[0]?.company || '',
      experience: this.formatExperience(profile.yearsExperience, fieldInfo),
      university: profile.education?.[0]?.institution || '',
      degree: profile.education?.[0]?.degree || '',
      major: profile.education?.[0]?.fieldOfStudy || profile.education?.[0]?.field_of_study || '',
      linkedin: profile.linkedinUrl || '',
      github: profile.githubUrl || '',
      portfolio: profile.portfolioUrl || '',
      workAuth: this.formatWorkAuth(profile.workAuthorization, fieldInfo),
      visa: this.formatVisa(profile.visaStatus || profile.workAuthorization, fieldInfo),
      coverLetter: profile.defaultCoverLetter || '',
      skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
      salary: profile.desiredSalaryMin ? `${profile.desiredSalaryMin}-${profile.desiredSalaryMax || profile.desiredSalaryMin}` : '',
      description: profile.summary || ''
    };

    return valueMap[key] || null;
  }

  formatPhone(phone, fieldInfo) {
    if (!phone) return null;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format based on field pattern or maxLength
    if (fieldInfo.pattern?.includes('(') || fieldInfo.maxLength === 14) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`;
    } else if (fieldInfo.maxLength === 12) {
      return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,10)}`;
    } else {
      return digits.slice(0, 10);
    }
  }

  formatExperience(years, fieldInfo) {
    if (!years) return null;
    
    if (fieldInfo.type === 'select-one') {
      // Return appropriate range for select fields
      if (years < 1) return '0-1 years';
      if (years < 3) return '1-3 years';
      if (years < 5) return '3-5 years';
      if (years < 10) return '5-10 years';
      return '10+ years';
    }
    
    return years.toString();
  }

  formatWorkAuth(workAuth, fieldInfo) {
    if (!workAuth) return 'Yes'; // Default assumption for US-based applications
    
    if (fieldInfo.type === 'select-one') {
      // Handle various work authorization values from database
      if (workAuth === 'authorized' || workAuth === 'citizen' || workAuth === 'permanent_resident') {
        return 'Yes';
      } else if (workAuth === 'visa_required' || workAuth === 'not_authorized') {
        return 'No';
      }
      return workAuth === 'authorized' ? 'Yes' : 'No';
    }
    
    return workAuth;
  }

  formatVisa(visaStatus, fieldInfo) {
    if (!visaStatus) return 'No'; // Default assumption
    
    if (fieldInfo.type === 'select-one') {
      // Handle various visa status values from database
      if (visaStatus === 'visa_required' || visaStatus === 'required') {
        return 'Yes';
      } else if (visaStatus === 'authorized' || visaStatus === 'citizen' || visaStatus === 'permanent_resident') {
        return 'No';
      }
      return visaStatus === 'required' ? 'Yes' : 'No';
    }
    
    return visaStatus;
  }

  extractCity(location) {
    if (!location) return null;
    return location.split(',')[0]?.trim();
  }

  extractState(location) {
    if (!location) return null;
    const parts = location.split(',');
    return parts[1]?.trim();
  }

  getFallbackValue(fieldInfo, userProfile) {
    // Smart fallback based on common patterns
    const combined = fieldInfo.combined;
    
    if (combined.includes('name') && !combined.includes('company')) {
      if (combined.includes('first') || combined.includes('given')) {
        return userProfile.firstName || userProfile.user?.firstName || (userProfile.fullName || '').split(' ')[0] || '';
      } else if (combined.includes('last') || combined.includes('family')) {
        return userProfile.lastName || userProfile.user?.lastName || (userProfile.fullName || '').split(' ').slice(1).join(' ') || '';
      } else {
        return userProfile.fullName || `${userProfile.firstName || userProfile.user?.firstName || ''} ${userProfile.lastName || userProfile.user?.lastName || ''}`.trim();
      }
    }
    
    return null;
  }

  async fillTextFieldSmart(field, value) {
    try {
      // Clear existing value with animation
      if (field.value) {
        for (let i = field.value.length; i >= 0; i--) {
          field.value = field.value.substring(0, i);
          field.dispatchEvent(new Event('input', { bubbles: true }));
          await this.delay(20);
        }
      }

      // Type with human-like rhythm
      for (let i = 0; i < value.length; i++) {
        field.value = value.substring(0, i + 1);
        
        // Dispatch events for framework compatibility
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        // Variable typing speed
        const delay = 30 + Math.random() * 40;
        await this.delay(delay);
      }

      // Final events
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('Text field fill error:', error);
      return false;
    }
  }

  async fillSelectFieldSmart(field, value) {
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

      // Try fuzzy match for common variations
      if (!option) {
        option = this.findFuzzyMatch(options, value);
      }

      if (option) {
        field.value = option.value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Select field fill error:', error);
      return false;
    }
  }

  findFuzzyMatch(options, value) {
    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const option of options) {
      const normalizedOption = option.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check for common abbreviations and variations
      if (this.isFuzzyMatch(normalizedValue, normalizedOption)) {
        return option;
      }
    }
    
    return null;
  }

  isFuzzyMatch(value1, value2) {
    // Simple fuzzy matching logic
    const minLength = Math.min(value1.length, value2.length);
    const maxLength = Math.max(value1.length, value2.length);
    
    if (minLength < 3) return false;
    
    // Check if one contains the other
    if (value1.includes(value2) || value2.includes(value1)) {
      return true;
    }
    
    // Check similarity ratio
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (value1[i] === value2[i]) {
        matches++;
      }
    }
    
    return (matches / maxLength) > 0.7;
  }

  async fillTextAreaSmart(field, value) {
    try {
      // For cover letters and long text, use a different approach
      field.focus();
      await this.delay(100);
      
      // Clear existing content
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Insert text in chunks for better performance
      const chunkSize = 50;
      for (let i = 0; i < value.length; i += chunkSize) {
        const chunk = value.substring(i, i + chunkSize);
        field.value += chunk;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(100);
      }
      
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('Textarea fill error:', error);
      return false;
    }
  }

  async fillChoiceFieldSmart(field, value) {
    try {
      const shouldCheck = this.interpretBooleanValue(value);
      
      if (field.type === 'radio') {
        // For radio buttons, find the appropriate option
        const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
        for (const radio of radioGroup) {
          const radioInfo = this.analyzeFieldAdvanced(radio);
          if (this.shouldSelectRadio(radioInfo, value)) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      } else {
        // Checkbox
        if (field.checked !== shouldCheck) {
          field.checked = shouldCheck;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Choice field fill error:', error);
      return false;
    }
  }

  interpretBooleanValue(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return ['yes', 'true', '1', 'on', 'enabled', 'authorized'].includes(lower);
    }
    return false;
  }

  shouldSelectRadio(radioInfo, value) {
    const combined = radioInfo.combined;
    const valueLower = value.toLowerCase();
    
    // Match based on value content
    if (valueLower === 'yes' && (combined.includes('yes') || combined.includes('authorized'))) {
      return true;
    }
    if (valueLower === 'no' && (combined.includes('no') || combined.includes('not authorized'))) {
      return true;
    }
    
    return combined.includes(valueLower);
  }

  async fillFileFieldSmart(field, value, userProfile) {
    try {
      // This would need to be implemented based on actual file handling
      // For now, we'll skip file fields as they require actual file data
      console.log('File field detected, skipping for now:', field);
      return false;
    } catch (error) {
      console.error('File field fill error:', error);
      return false;
    }
  }

  addFieldFeedback(field, success) {
    // Add visual feedback to filled fields
    const indicator = document.createElement('div');
    indicator.className = `autojobr-field-indicator ${success ? 'success' : 'error'}`;
    indicator.innerHTML = success ? '✓' : '✗';
    indicator.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${success ? '#22c55e' : '#ef4444'};
      color: white;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeInScale 0.3s ease-out;
    `;

    // Position relative to field
    const rect = field.getBoundingClientRect();
    indicator.style.position = 'fixed';
    indicator.style.left = `${rect.right - 8}px`;
    indicator.style.top = `${rect.top - 8}px`;

    document.body.appendChild(indicator);

    // Remove after 2 seconds
    setTimeout(() => {
      indicator.remove();
    }, 2000);
  }

  showProgress(show) {
    const progress = document.getElementById('autojobr-progress');
    if (progress) {
      progress.style.display = show ? 'block' : 'none';
    }
  }

  updateProgress(filled, total) {
    const progress = document.querySelector('#autojobr-progress .progress-bar');
    if (progress && total > 0) {
      const percentage = (filled / total) * 100;
      progress.style.width = `${percentage}%`;
    }
  }

  updateStats(found, filled) {
    const fieldsFoundEl = document.getElementById('fields-found');
    const fieldsFilledEl = document.getElementById('fields-filled');
    const successRateEl = document.getElementById('success-rate');
    const statsEl = document.getElementById('autojobr-stats');

    if (fieldsFoundEl) fieldsFoundEl.textContent = found;
    if (fieldsFilledEl) fieldsFilledEl.textContent = filled;
    if (successRateEl) {
      const rate = found > 0 ? Math.round((filled / found) * 100) : 0;
      successRateEl.textContent = `${rate}%`;
    }
    if (statsEl) statsEl.style.display = 'block';
  }

  async handleAdvancedFileUploads(userProfile) {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    let filesFound = fileInputs.length;
    let filesUploaded = 0;

    for (const input of fileInputs) {
      try {
        if (await this.handleFileUpload(input, userProfile)) {
          filesUploaded++;
        }
      } catch (error) {
        console.error('File upload error:', error);
      }
    }

    return { filesFound, filesUploaded };
  }

  async handleFileUpload(input, userProfile) {
    // This would need actual file handling implementation
    // For now, we'll return false as we can't upload actual files
    return false;
  }

  async attemptAutoSubmit() {
    // Look for submit buttons
    const submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'button:contains("Submit")',
      'button:contains("Apply")',
      '.submit-btn',
      '.apply-btn'
    ];

    if (this.smartSelectors.submitButtons) {
      submitSelectors.push(...this.smartSelectors.submitButtons);
    }

    for (const selector of submitSelectors) {
      const button = document.querySelector(selector);
      if (button && !button.disabled) {
        // Add confirmation
        if (confirm('Auto-submit is enabled. Submit the application now?')) {
          button.click();
          return true;
        }
        break;
      }
    }

    return false;
  }

  async analyzeNewForms() {
    // Analyze newly added forms for auto-fill opportunities
    const forms = this.findAllForms();
    if (forms.length > 0) {
      console.log('New forms detected:', forms.length);
      // Could trigger auto-analysis here
    }
  }

  // Enhanced UI event handlers
  async handleSmartAutofill() {
    const userProfile = await this.getUserProfile();
    if (!userProfile) {
      this.showNotification('Please sign in to use auto-fill', 'error');
      return;
    }

    const result = await this.startSmartAutofill(userProfile);
    if (result.success) {
      this.showNotification(
        `✅ Filled ${result.fieldsFilled}/${result.fieldsFound} fields (${result.successRate}% success)`,
        'success'
      );
    } else {
      this.showNotification(`❌ Auto-fill failed: ${result.error}`, 'error');
    }
  }

  async handleAnalyze() {
    const result = await this.analyzeCurrentJob();
    if (result.success) {
      this.showNotification('✅ Job analysis completed!', 'success');
    } else {
      this.showNotification('❌ Job analysis failed', 'error');
    }
  }

  async handleSaveJob() {
    if (!this.currentJobData) {
      this.showNotification('No job data found on this page', 'error');
      return;
    }

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'saveJob',
        data: {
          jobTitle: this.currentJobData.title,
          company: this.currentJobData.company,
          location: this.currentJobData.location,
          jobUrl: window.location.href,
          description: this.currentJobData.description,
          source: 'extension_v2'
        }
      });

      if (result.success) {
        this.showNotification('✅ Job saved successfully!', 'success');
      } else {
        throw new Error('Failed to save job');
      }
    } catch (error) {
      console.error('Save job error:', error);
      this.showNotification('❌ Failed to save job', 'error');
    }
  }

  async handleCoverLetter() {
    if (!this.currentJobData) {
      this.showNotification('No job data found on this page', 'error');
      return;
    }

    try {
      const userProfile = await this.getUserProfile();
      const result = await chrome.runtime.sendMessage({
        action: 'generateCoverLetter',
        data: {
          jobData: this.currentJobData,
          userProfile: userProfile
        }
      });

      if (result.success) {
        await navigator.clipboard.writeText(result.coverLetter);
        this.showNotification('✅ Cover letter generated and copied!', 'success');
        
        // Try to fill cover letter field
        await this.fillCoverLetter(result.coverLetter);
      } else {
        throw new Error('Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Cover letter error:', error);
      this.showNotification('❌ Failed to generate cover letter', 'error');
    }
  }

  async fillCoverLetter(coverLetter) {
    try {
      const textAreas = document.querySelectorAll('textarea');
      
      for (const textarea of textAreas) {
        const fieldInfo = this.analyzeFieldAdvanced(textarea);
        
        if (fieldInfo.combined.includes('cover') || 
            fieldInfo.combined.includes('letter') || 
            fieldInfo.combined.includes('motivation') ||
            fieldInfo.combined.includes('message')) {
          
          await this.fillTextAreaSmart(textarea, coverLetter);
          return { success: true };
        }
      }

      return { success: false, error: 'Cover letter field not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async analyzeCurrentJob() {
    const jobData = await this.extractJobDetails();
    
    if (jobData.success) {
      // Update UI with job info
      this.updateJobInfo(jobData.jobData);
      
      // Send to background for analysis
      try {
        const userProfile = await this.getUserProfile();
        const result = await chrome.runtime.sendMessage({
          action: 'analyzeJob',
          data: {
            jobData: jobData.jobData,
            userProfile: userProfile
          }
        });

        if (result.success) {
          this.updateJobMatch(result.analysis);
        }

        return { success: true, analysis: result.analysis };
      } catch (error) {
        console.error('Job analysis error:', error);
        return { success: false, error: error.message };
      }
    }
    
    return jobData;
  }

  updateJobMatch(analysis) {
    const matchEl = document.getElementById('autojobr-job-match');
    if (matchEl && analysis) {
      const score = analysis.matchScore || 0;
      const level = score >= 80 ? 'Excellent' : 
                   score >= 60 ? 'Good' : 
                   score >= 40 ? 'Fair' : 'Poor';
      
      matchEl.innerHTML = `
        <div class="match-score ${level.toLowerCase()}">
          ${score}% Match (${level})
        </div>
      `;
    }
  }

  async saveCurrentJob() {
    return await this.handleSaveJob();
  }

  async getUserProfile() {
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'getUserProfile'
      });

      if (result.success && result.profile) {
        console.log('Extension received user profile:', {
          firstName: result.profile.firstName,
          lastName: result.profile.lastName,
          fullName: result.profile.fullName,
          skillsCount: result.profile.skills?.length || 0
        });
      }

      return result.success ? result.profile : null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `autojobr-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      z-index: 10001;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Application tracking system - Only tracks actual form submissions
  async setupApplicationTracking() {
    console.log('Setting up application tracking for form submissions only...');
    
    // Only track actual form submissions - not page visits
    document.addEventListener('submit', async (e) => {
      if (this.isJobApplicationForm(e.target)) {
        console.log('Job application form submitted - tracking application');
        // Only track if form actually submitted successfully
        setTimeout(() => this.trackApplicationSubmission(), 3000);
      }
    });

    // Track confirmation pages only when navigating FROM a form submission
    let lastFormSubmissionTime = 0;
    let currentUrl = window.location.href;
    
    // Enhanced form submission tracking
    document.addEventListener('submit', (e) => {
      if (this.isJobApplicationForm(e.target)) {
        lastFormSubmissionTime = Date.now();
        console.log('Form submitted, will monitor for confirmation page');
      }
    });

    // Only check for confirmation if we recently submitted a form (within 30 seconds)
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        
        // Only check for confirmation within 30 seconds of form submission
        if (Date.now() - lastFormSubmissionTime < 30000 && lastFormSubmissionTime > 0) {
          this.checkForSubmissionConfirmation();
        }
      }
    }, 2000);
  }

  isJobApplicationForm(form) {
    if (!form || form.tagName !== 'FORM') return false;
    
    const formText = form.textContent.toLowerCase();
    const actionUrl = form.action?.toLowerCase() || '';
    
    return formText.includes('apply') || 
           formText.includes('application') || 
           formText.includes('submit') ||
           actionUrl.includes('apply') ||
           actionUrl.includes('application');
  }

  isSubmissionButton(button) {
    if (!button) return false;
    
    const buttonText = button.textContent?.toLowerCase() || '';
    const buttonValue = button.value?.toLowerCase() || '';
    const buttonClass = button.className?.toLowerCase() || '';
    const buttonId = button.id?.toLowerCase() || '';
    
    const submitKeywords = [
      'submit application', 'apply now', 'submit', 'apply', 'send application',
      'continue to apply', 'review and submit', 'complete application'
    ];
    
    return submitKeywords.some(keyword => 
      buttonText.includes(keyword) || 
      buttonValue.includes(keyword) ||
      buttonClass.includes(keyword.replace(' ', '-')) ||
      buttonId.includes(keyword.replace(' ', '-'))
    );
  }

  async trackApplicationSubmission() {
    try {
      // Double-check this is actually a job application submission
      if (!this.isJobApplicationPage()) {
        console.log('Not a job application page - skipping tracking');
        return;
      }

      const jobData = await this.extractJobDetails();
      
      if (jobData.success && jobData.jobData && jobData.jobData.title) {
        console.log('Tracking confirmed application submission:', jobData.jobData);
        
        const response = await chrome.runtime.sendMessage({
          action: 'trackApplication',
          data: {
            jobTitle: jobData.jobData.title,
            company: jobData.jobData.company,
            location: jobData.jobData.location || '',
            jobUrl: window.location.href,
            status: 'applied',
            source: 'extension',
            platform: this.detectPlatform(window.location.hostname),
            appliedDate: new Date().toISOString()
          }
        });

        if (response && response.success) {
          this.showNotification('✅ Application submitted & tracked!', 'success');
        } else {
          console.log('Application tracking failed:', response);
        }
      } else {
        console.log('No valid job data found - skipping tracking');
      }
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }

  checkForSubmissionConfirmation() {
    const confirmationPatterns = [
      /thank.*you.*for.*your.*application/i,
      /application.*successfully.*submitted/i,
      /application.*has.*been.*received/i,
      /we.*have.*received.*your.*application/i,
      /application.*confirmation/i
    ];

    const pageText = document.body.textContent.toLowerCase();
    const currentUrl = window.location.href.toLowerCase();
    
    // More strict confirmation detection - must have strong confirmation text
    const hasStrongConfirmation = confirmationPatterns.some(pattern => pattern.test(pageText));
    const hasConfirmationUrl = currentUrl.includes('confirmation') || 
                               currentUrl.includes('thank-you') ||
                               currentUrl.includes('application-submitted');
    
    // Only track if we have BOTH strong text confirmation AND confirmation URL
    if (hasStrongConfirmation && hasConfirmationUrl) {
      console.log('Strong confirmation detected - tracking application');
      this.trackApplicationSubmission();
    }
  }

  detectPlatform(hostname) {
    const platformMap = {
      'linkedin.com': 'LinkedIn',
      'myworkdayjobs.com': 'Workday',
      'indeed.com': 'Indeed',
      'glassdoor.com': 'Glassdoor',
      'lever.co': 'Lever',
      'greenhouse.io': 'Greenhouse',
      'ashbyhq.com': 'AshbyHQ'
    };

    for (const [domain, platform] of Object.entries(platformMap)) {
      if (hostname.includes(domain)) {
        return platform;
      }
    }
    return 'Unknown';
  }

  // Create floating button that opens extension popup
  createFloatingButton() {
    // Only show on job application forms
    if (!this.isJobApplicationPage()) {
      return;
    }

    // Don't create multiple buttons
    if (document.getElementById('autojobr-floating-button')) {
      return;
    }

    const button = document.createElement('div');
    button.id = 'autojobr-floating-button';
    button.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        transition: all 0.3s ease;
        animation: pulse 2s infinite;
      " title="Open AutoJobr Extension">
        <span style="color: white; font-weight: bold; font-size: 18px;">AJ</span>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.8); }
          100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
        }
        #autojobr-floating-button:hover > div {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
        }
      </style>
    `;

    document.body.appendChild(button);

    // Open extension popup when clicked
    button.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });

    // Auto-fade after 30 seconds
    setTimeout(() => {
      if (button.parentNode) {
        button.style.opacity = '0.3';
      }
    }, 30000);

    // Reappear on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (button.parentNode) {
        button.style.opacity = '1';
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          button.style.opacity = '0.3';
        }, 5000);
      }
    });
  }

  isJobApplicationPage() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // LinkedIn specific detection - avoid feeds, home, search pages
    if (hostname.includes('linkedin.com')) {
      // Must be jobs page AND have easy apply or application form
      const isJobsPage = url.includes('/jobs/view/') || url.includes('/jobs/collections/');
      const hasEasyApply = document.querySelector('[data-test-modal="jobs-easy-apply-modal"], .jobs-easy-apply-content, .jobs-apply-button');
      const isFeedPage = url.includes('/feed/') || url.includes('/mynetwork/') || url === 'https://www.linkedin.com/';
      
      return isJobsPage && hasEasyApply && !isFeedPage;
    }
    
    // Workday specific detection
    if (hostname.includes('myworkdayjobs.com')) {
      return url.includes('/job/') && document.querySelector('form[data-automation-id="jobApplicationForm"], .css-1x9zq2f');
    }
    
    // Indeed specific detection
    if (hostname.includes('indeed.com')) {
      return url.includes('/viewjob') && document.querySelector('.indeed-apply-button, .ia-IndeedApplyButton');
    }
    
    // Generic detection for other sites
    const pageText = document.body.textContent.toLowerCase();
    const hasStrictJobForm = document.querySelectorAll('input[type="file"][accept*="pdf"], textarea[name*="cover"], input[name*="resume"]').length > 0;
    const hasApplyButton = document.querySelector('[class*="apply"], [id*="apply"], button[data-test*="apply"]');
    
    return hasStrictJobForm && hasApplyButton;
  }

  // Setup automatic job analysis when new pages load
  setupAutoAnalysis() {
    // Analyze current page if it's a job page
    if (this.isJobApplicationPage()) {
      setTimeout(() => this.performAutoAnalysis(), 2000);
    }

    // Watch for URL changes (SPA navigation)
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        if (this.isJobApplicationPage()) {
          setTimeout(() => this.performAutoAnalysis(), 3000);
        }
      }
    });

    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(urlObserver);
  }

  async performAutoAnalysis() {
    try {
      const jobData = this.extractJobData();
      if (!jobData || !jobData.title) {
        console.log('No job data found for analysis');
        return;
      }

      // Get user profile first
      const profile = await this.getUserProfile();
      if (!profile) {
        console.log('User not authenticated - skipping auto analysis');
        return;
      }

      // Perform enhanced job analysis
      const analysis = await this.analyzeJobWithAPI(jobData, profile);
      if (analysis) {
        // Update floating button with analysis results
        this.updateFloatingButtonWithAnalysis(analysis);
        console.log('Auto-analysis completed:', analysis);
      }
    } catch (error) {
      console.error('Auto-analysis failed:', error);
    }
  }

  extractJobData() {
    const url = window.location.href;
    const hostname = window.location.hostname.toLowerCase();
    
    let jobData = {
      title: '',
      company: '',
      description: '',
      location: '',
      salary: '',
      url: url
    };

    // LinkedIn job extraction
    if (hostname.includes('linkedin.com')) {
      jobData.title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .job-title')?.textContent?.trim() || '';
      jobData.company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .company-name')?.textContent?.trim() || '';
      jobData.location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .job-location')?.textContent?.trim() || '';
      jobData.description = document.querySelector('.job-details__description-text, .job-view-description')?.textContent?.trim() || '';
    }
    
    // Workday job extraction
    else if (hostname.includes('myworkdayjobs.com')) {
      jobData.title = document.querySelector('[data-automation-id="jobPostingHeader"], .css-1id67r3')?.textContent?.trim() || '';
      jobData.company = document.querySelector('[data-automation-id="jobPostingCompany"], .css-1x9zq2f')?.textContent?.trim() || '';
      jobData.location = document.querySelector('[data-automation-id="jobPostingLocation"]')?.textContent?.trim() || '';
      jobData.description = document.querySelector('[data-automation-id="jobPostingDescription"]')?.textContent?.trim() || '';
    }
    
    // Indeed job extraction
    else if (hostname.includes('indeed.com')) {
      jobData.title = document.querySelector('[data-jk] h1, .jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
      jobData.company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() || '';
      jobData.location = document.querySelector('[data-testid="job-location"]')?.textContent?.trim() || '';
      jobData.description = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.textContent?.trim() || '';
    }
    
    // Generic extraction for other sites
    else {
      jobData.title = document.querySelector('h1, .job-title, [class*="title"]')?.textContent?.trim() || '';
      jobData.company = document.querySelector('.company, [class*="company"]')?.textContent?.trim() || '';
      jobData.description = document.querySelector('.description, .job-description, [class*="description"]')?.textContent?.trim() || '';
    }

    return jobData.title ? jobData : null;
  }

  async analyzeJobWithAPI(jobData, userProfile) {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/analyze-job-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobData: {
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            requirements: jobData.description,
            qualifications: jobData.description,
            benefits: jobData.description,
            location: jobData.location,
            salary: jobData.salary,
            url: jobData.url
          },
          userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API job analysis failed:', error);
      return null;
    }
  }

  updateFloatingButtonWithAnalysis(analysis) {
    const button = document.getElementById('autojobr-floating-button');
    if (!button) return;

    const score = analysis.matchScore || analysis.analysis?.matchScore || 0;
    const scoreText = `${Math.round(score)}%`;
    
    // Update button with score and click handler to open extension popup
    button.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, ${this.getScoreColor(score)} 0%, ${this.getScoreColor(score)}dd 100%);
        border-radius: 50%;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        transition: all 0.3s ease;
        animation: pulse 2s infinite;
      " title="Job Match: ${scoreText} - Click to open AutoJobr extension">
        <span style="color: white; font-weight: bold; font-size: 12px; text-align: center;">
          ${scoreText}
        </span>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.8); }
          100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
        }
        #autojobr-floating-button:hover > div {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
        }
      </style>
    `;

    // Add click handler to open extension popup
    button.onclick = () => {
      // Try to open popup, fallback to notification
      chrome.runtime.sendMessage({ action: 'openPopup' }, (response) => {
        if (!response?.success) {
          // Show notification if popup couldn't be opened
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10001;
            animation: fadeInUp 0.3s ease;
          `;
          notification.textContent = 'Click the AutoJobr extension icon in your toolbar to view details';
          document.body.appendChild(notification);
          
          // Remove notification after 3 seconds
          setTimeout(() => notification.remove(), 3000);
        }
      });
    };

    // Store analysis data for popup use
    this.currentAnalysis = analysis;
  }

  getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  async getUserProfile() {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/extension/profile`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  async getApiUrl() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getApiUrl' }, (response) => {
        resolve(response?.apiUrl || 'https://autojobr.com');
      });
    });
  }

  // ===== RESUME UPLOAD FUNCTIONALITY =====
  async detectResumeFields() {
    try {
      const resumeFields = [];
      
      // Common selectors for resume upload fields
      const resumeSelectors = [
        'input[type="file"][name*="resume"]',
        'input[type="file"][name*="cv"]',
        'input[type="file"][id*="resume"]',
        'input[type="file"][id*="cv"]',
        'input[type="file"][accept*=".pdf"]',
        'input[type="file"][accept*=".doc"]',
        'input[type="file"][accept*="application"]',
        '[data-testid*="resume"]',
        '[data-testid*="cv"]',
        '.resume-upload',
        '.cv-upload',
        '.file-upload-resume'
      ];

      // Site-specific selectors
      const siteSpecificSelectors = {
        linkedin: [
          'input[type="file"][data-test-file-input-file-uploader]',
          '.file-input',
          '[data-field="resume"]'
        ],
        indeed: [
          'input[type="file"][name="resume"]',
          '.ia-BaseForms-FileInput-file',
          '#resume'
        ],
        greenhouse: [
          'input[type="file"][data-source="resume"]',
          '.file-input',
          '[name*="attachment"]'
        ],
        workday: [
          'input[type="file"]',
          '.css-file-upload',
          '[data-automation-id*="file"]'
        ]
      };

      // Add site-specific selectors
      if (siteSpecificSelectors[this.currentSite]) {
        resumeSelectors.push(...siteSpecificSelectors[this.currentSite]);
      }

      // Find all potential resume fields
      for (const selector of resumeSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element.offsetParent !== null) { // Only visible elements
            resumeFields.push({
              element: element,
              selector: selector,
              id: element.id,
              name: element.name,
              accept: element.accept,
              required: element.required,
              multiple: element.multiple
            });
          }
        });
      }

      // Remove duplicates
      const uniqueFields = resumeFields.filter((field, index, array) => 
        array.findIndex(f => f.element === field.element) === index
      );

      return {
        success: true,
        fields: uniqueFields.map(field => ({
          id: field.id,
          name: field.name,
          selector: field.selector,
          accept: field.accept,
          required: field.required,
          multiple: field.multiple
        })),
        count: uniqueFields.length
      };
    } catch (error) {
      console.error('Error detecting resume fields:', error);
      return { success: false, error: error.message };
    }
  }

  async uploadResumeToForm() {
    try {
      // First detect resume fields
      const detectionResult = await this.detectResumeFields();
      if (!detectionResult.success || detectionResult.count === 0) {
        return { success: false, error: 'No resume upload fields found on this page' };
      }

      // Get active resume from background script
      const resumeResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getActiveResume' }, resolve);
      });

      if (!resumeResult.success) {
        return { success: false, error: 'No active resume found. Please upload a resume first.' };
      }

      // Convert blob to file
      const resumeFile = new File([resumeResult.resumeBlob], 'resume.pdf', {
        type: 'application/pdf'
      });

      // Upload to the first available resume field
      const resumeField = document.querySelector(detectionResult.fields[0].selector);
      if (!resumeField) {
        return { success: false, error: 'Resume field not found' };
      }

      // Create DataTransfer for file upload
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(resumeFile);

      // Set files to the input
      resumeField.files = dataTransfer.files;

      // Trigger change events
      resumeField.dispatchEvent(new Event('change', { bubbles: true }));
      resumeField.dispatchEvent(new Event('input', { bubbles: true }));

      // Site-specific upload handling
      await this.handleSiteSpecificUpload(resumeField, resumeFile);

      return { 
        success: true, 
        message: 'Resume uploaded successfully',
        fieldCount: detectionResult.count
      };
    } catch (error) {
      console.error('Resume upload error:', error);
      return { success: false, error: error.message };
    }
  }

  async handleSiteSpecificUpload(field, file) {
    // Handle specific site upload behaviors
    switch (this.currentSite) {
      case 'linkedin':
        // LinkedIn may have custom upload handlers
        setTimeout(() => {
          const uploadBtn = document.querySelector('[data-test-file-input-upload-btn]');
          if (uploadBtn) uploadBtn.click();
        }, 100);
        break;
        
      case 'greenhouse':
        // Greenhouse often requires additional form submission
        setTimeout(() => {
          const continueBtn = document.querySelector('.btn-primary, .continue-btn');
          if (continueBtn && continueBtn.textContent.includes('Continue')) {
            continueBtn.click();
          }
        }, 500);
        break;
        
      case 'workday':
        // Workday has specific upload flow
        setTimeout(() => {
          const uploadBtn = document.querySelector('[data-automation-id*="upload"]');
          if (uploadBtn) uploadBtn.click();
        }, 200);
        break;
        
      default:
        // Generic handling - look for submit or continue buttons
        setTimeout(() => {
          const submitBtns = document.querySelectorAll('button, input[type="submit"]');
          for (const btn of submitBtns) {
            const text = btn.textContent || btn.value || '';
            if (text.toLowerCase().includes('upload') || 
                text.toLowerCase().includes('continue') ||
                text.toLowerCase().includes('next')) {
              btn.click();
              break;
            }
          }
        }, 300);
    }
  }

  // Cleanup method
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    const overlay = document.getElementById('autojobr-overlay');
    const button = document.getElementById('autojobr-floating-button');
    if (overlay) overlay.remove();
    if (button) button.remove();
  }
}

// Add message listener for getting current analysis data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentAnalysis') {
    const extension = window.autojobrExtension;
    if (extension && extension.currentAnalysis) {
      sendResponse({
        success: true,
        analysis: extension.currentAnalysis,
        jobData: extension.extractJobData()
      });
    } else {
      sendResponse({ success: false });
    }
  }
  return true;
});

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const extension = new AutoJobrContentScript();
    window.autojobrExtension = extension; // Store reference for message handling
    // Show floating button on job application pages after a delay
    setTimeout(() => extension.createFloatingButton(), 3000);
  });
} else {
  const extension = new AutoJobrContentScript();
  window.autojobrExtension = extension; // Store reference for message handling
  // Show floating button on job application pages after a delay  
  setTimeout(() => extension.createFloatingButton(), 3000);
}