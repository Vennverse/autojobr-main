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
    this.filledFields = new Set(); // Track filled fields to prevent loops
    this.formState = { currentPage: 1, hasNextPage: false, hasSubmit: false };
    this.analysisInProgress = false; // Prevent duplicate analysis
    this.lastAnalysisUrl = null; // Track last analyzed URL
    this.analysisDebounceTimer = null; // Debounce analysis calls
    this.cachedProfile = null; // Cache profile to prevent excessive requests
    this.lastAuthCheck = 0; // Track last authentication check
    this.currentAnalysis = null; // Store the latest job analysis result

    // Experience calculation cache
    this.experienceCache = null; // Cache for general years of experience
    this.skillExpCache = {}; // Cache for skill-specific experience calculations

    // LinkedIn Automation specific states
    this.automationRunning = false;
    this.applicationsSubmitted = 0;
    this.applicationsSkipped = 0;
    this.currentPage = 1;
    this.maxPages = 1; // Default to 1 page for non-premium

    // New properties for AI features
    this.groqApiKey = null;
    this.groqApiUrl = 'https://api.groq.com/openai/v1';

    // XPath detector for ATS systems
    this.xpathDetector = null;

    // Fast button injection tracking
    this.lastInjectedJobUrn = null;
    this.buttonInjectionAttempts = 0;
    this.maxButtonInjectionAttempts = 20; // ~3 seconds with 150ms intervals
    this.autoDismissedDialogs = new Set(); // Track dismissed dialogs

    // LinkedIn SPA listener tracking
    this.linkedInSPAListenersActive = false;
    this.originalPushState = null;
    this.originalReplaceState = null;
    this.popstateHandler = null;

    this.init();
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Load XPath detector FIRST and wait for it to complete
      console.log('[AutoJobr] Loading XPath detector...');
      const xpathLoaded = await this.loadXPathDetector();
      if (!xpathLoaded) {
        console.warn('[AutoJobr] XPath detector not available - using fallback CSS selectors');
      } else {
        console.log('[AutoJobr] XPath detector loaded successfully');
      }

      // Load settings
      chrome.storage.sync.get(['userApiKey', 'premiumFeaturesEnabled'], (result) => {
        this.groqApiKey = result.userApiKey || null;
        if (result.premiumFeaturesEnabled === true) {
           // Premium features enabled
        }
      });

      this.injectEnhancedUI();
      this.setupMessageListener();
      this.observePageChanges();
      this.setupKeyboardShortcuts();
      this.initializeSmartSelectors();
      this.setupApplicationTracking(); // Setup tracking once during initialization

      // Setup SPA navigation listeners for LinkedIn (high priority)
      if (window.location.hostname.includes('linkedin.com')) {
        this.setupLinkedInSPAListeners();
        this.setupModalAutoDismiss();
      }

      // Setup automatic job analysis with debouncing
      this.setupAutoAnalysis();
      this.isInitialized = true;

      // Mark as loaded for background script
      window.autojobrContentScriptLoaded = true;

      console.log('🚀 AutoJobr extension v2.2 initialized on:', this.currentSite);
      console.log('🎯 ATS Detected:', this.xpathDetector?.currentATS || 'Generic (CSS fallback)');
    } catch (error) {
      console.error('AutoJobr initialization error:', error);
    }
  }

  async loadXPathDetector() {
    console.log('[AutoJobr] Loading simplified XPath detector');
    
    // Simplified XPath detection - no external script needed
    this.xpathDetector = {
      currentATS: this.detectATS(),
      initialized: true,
      
      // Simple XPath evaluation
      evaluateXPath(xpath, contextNode = document) {
        try {
          const result = document.evaluate(
            xpath,
            contextNode,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );
          
          const nodes = [];
          for (let i = 0; i < result.snapshotLength; i++) {
            nodes.push(result.snapshotItem(i));
          }
          return nodes;
        } catch (error) {
          console.warn('[XPath] Evaluation failed:', error);
          return [];
        }
      },
      
      // Find input fields by label text
      findFieldByLabel(labelText) {
        const xpath = `//label[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${labelText.toLowerCase()}')]/following-sibling::input | //label[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${labelText.toLowerCase()}')]//input`;
        return this.evaluateXPath(xpath)[0];
      },
      
      // Find input by placeholder
      findFieldByPlaceholder(placeholder) {
        const xpath = `//input[contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${placeholder.toLowerCase()}')]`;
        return this.evaluateXPath(xpath)[0];
      },
      
      // CRITICAL FIX: Add getAllFormFields() method that content-script.js expects
      getAllFormFields() {
        const fields = {};
        const fieldTypes = ['email', 'phone', 'first_name', 'last_name', 'full_name', 'resume', 'cover_letter', 'linkedin'];
        
        for (const fieldType of fieldTypes) {
          const element = this.detectField(fieldType);
          if (element) {
            fields[fieldType] = element;
          }
        }
        
        return fields;
      },
      
      // Detect individual field types using smart XPath patterns
      detectField(fieldType) {
        const patterns = {
          email: [
            '//input[@type="email"]',
            '//input[contains(@name, "email") or contains(@id, "email")]'
          ],
          phone: [
            '//input[@type="tel"]',
            '//input[contains(@name, "phone") or contains(@id, "phone")]'
          ],
          first_name: [
            '//input[@name="first_name" or @id="first_name"]',
            '//input[contains(@name, "firstName") or contains(@id, "firstName")]'
          ],
          last_name: [
            '//input[@name="last_name" or @id="last_name"]',
            '//input[contains(@name, "lastName") or contains(@id, "lastName")]'
          ],
          full_name: [
            '//input[@name="name" or @id="name"]',
            '//input[contains(@name, "fullName") or contains(@id, "fullName")]'
          ],
          resume: [
            '//input[@type="file" and (contains(@name, "resume") or contains(@id, "resume"))]',
            '//input[@type="file"][1]' // First file input as fallback
          ],
          cover_letter: [
            '//textarea[contains(@name, "cover") or contains(@id, "cover")]',
            '//textarea[contains(@name, "letter") or contains(@id, "letter")]'
          ],
          linkedin: [
            '//input[contains(@name, "linkedin") or contains(@id, "linkedin")]',
            '//input[contains(@placeholder, "linkedin")]'
          ]
        };
        
        const xpaths = patterns[fieldType] || [];
        for (const xpath of xpaths) {
          const nodes = this.evaluateXPath(xpath);
          if (nodes.length > 0) {
            return nodes[0]; // Return first match
          }
        }
        
        return null;
      },
      
      // Check if submission was successful
      checkSubmissionSuccess() {
        // Generic success indicators
        const successXPaths = [
          '//h1[contains(translate(., "SUCCESS", "success"), "success")]',
          '//h2[contains(translate(., "SUCCESS", "success"), "success")]',
          '//div[contains(translate(., "APPLICATION RECEIVED", "application received"), "application received")]',
          '//div[contains(translate(., "THANK YOU", "thank you"), "thank you")]',
          '//*[contains(@class, "success") or contains(@class, "confirmation")]'
        ];
        
        for (const xpath of successXPaths) {
          const nodes = this.evaluateXPath(xpath);
          if (nodes.length > 0) {
            return true;
          }
        }
        
        return false;
      }
    };
    
    console.log('[AutoJobr] ✅ Simplified XPath detector loaded, ATS:', this.xpathDetector.currentATS);
    return true;
  }
  
  // Detect ATS platform
  detectATS() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) return 'Greenhouse';
    if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) return 'Lever';
    if (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com')) return 'Workday';
    if (hostname.includes('taleo.net')) return 'Taleo';
    if (hostname.includes('icims.com')) return 'iCIMS';
    if (hostname.includes('linkedin.com')) return 'LinkedIn';
    if (hostname.includes('indeed.com')) return 'Indeed';
    if (hostname.includes('glassdoor.com')) return 'Glassdoor';
    if (hostname.includes('ashbyhq.com')) return 'Ashby';
    if (hostname.includes('smartrecruiters.com')) return 'SmartRecruiters';
    
    return 'Generic';
  }

  // Setup fast LinkedIn SPA navigation detection
  setupLinkedInSPAListeners() {
    console.log('🚀 [LinkedIn Optimization] Setting up fast SPA navigation listeners');

    // Prevent duplicate setup
    if (this.linkedInSPAListenersActive) {
      console.log('⚠️ [LinkedIn SPA] Listeners already active, skipping setup');
      return;
    }
    this.linkedInSPAListenersActive = true;

    // Store original History API methods for restoration during cleanup
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;

    // Bind to class instance to preserve 'this' context
    const handleNavigation = () => {
      console.log('🔄 [LinkedIn SPA] Navigation detected, fast button injection starting');
      this.fastInjectLinkedInButton();
    };

    // Wrap history methods with navigation detection
    history.pushState = function(...args) {
      const result = this.originalPushState.apply(this, args);
      handleNavigation();
      return result;
    }.bind(this);

    history.replaceState = function(...args) {
      const result = this.originalReplaceState.apply(this, args);
      handleNavigation();
      return result;
    }.bind(this);

    // Store bound handler for cleanup
    this.popstateHandler = handleNavigation;
    window.addEventListener('popstate', this.popstateHandler);

    // Focused MutationObserver on job topcard for SPA job swaps
    const topCardObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check if job-id attribute changed
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-job-id') {
          console.log('🎯 [LinkedIn SPA] Job ID changed, triggering fast injection');
          this.fastInjectLinkedInButton();
          break;
        }

        // Check if new job card container was added
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && (
              node.classList?.contains('jobs-unified-top-card') ||
              node.querySelector?.('[data-job-id]')
            )) {
              console.log('🎯 [LinkedIn SPA] New job card detected, triggering fast injection');
              this.fastInjectLinkedInButton();
              break;
            }
          }
        }
      }
    });

    // Observe the main content area and top card
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
      topCardObserver.observe(mainContent, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-job-id']
      });
      this.observers.push(topCardObserver);
    }

    // Initial fast injection
    setTimeout(() => this.fastInjectLinkedInButton(), 100);
  }

  // Fast button injection using requestAnimationFrame and short polling
  fastInjectLinkedInButton() {
    const currentJobUrn = this.getCurrentJobUrn();

    // Check if we've already injected for this job
    if (currentJobUrn && currentJobUrn === this.lastInjectedJobUrn) {
      console.log('✅ [Fast Injection] Button already injected for job:', currentJobUrn);
      return;
    }

    console.log('⚡ [Fast Injection] Starting fast button injection for job:', currentJobUrn || 'pending detection');

    // Phase 1: requestAnimationFrame burst for first 500ms
    const startTime = Date.now();
    this.buttonInjectionAttempts = 0;

    const attemptInjection = () => {
      const elapsed = Date.now() - startTime;

      // Try to inject
      const saveButton = document.querySelector('[aria-label*="Save"]') ||
                        document.querySelector('button.jobs-save-button') ||
                        document.querySelector('[data-control-name*="save"]');

      if (saveButton) {
        console.log('✅ [Fast Injection] Save button found, injecting Auto Apply button');
        this.injectLinkedInButtons(null); // Mount button without score
        this.lastInjectedJobUrn = currentJobUrn;

        // Schedule analysis update in background
        setTimeout(() => {
          this.debouncedAnalysis?.();
        }, 500);
        return true;
      }

      // Phase 1: requestAnimationFrame for first 500ms
      if (elapsed < 500) {
        requestAnimationFrame(attemptInjection);
        return false;
      }

      // Phase 2: Short polling with 150ms intervals for up to 3 seconds
      if (this.buttonInjectionAttempts < this.maxButtonInjectionAttempts) {
        this.buttonInjectionAttempts++;
        setTimeout(attemptInjection, 150);
        return false;
      }

      console.warn('⚠️ [Fast Injection] Save button not found after 3 seconds, button injection aborted');
      return false;
    };

    attemptInjection();
  }

  // Get current LinkedIn job URN for tracking
  getCurrentJobUrn() {
    const jobIdElement = document.querySelector('[data-job-id]');
    if (jobIdElement) {
      return jobIdElement.getAttribute('data-job-id');
    }

    // Fallback: extract from URL
    const urlMatch = window.location.href.match(/currentJobId=(\d+)/);
    return urlMatch ? urlMatch[1] : null;
  }

  // Cleanup LinkedIn SPA listeners (called on extension unload/navigation)
  cleanupLinkedInSPAListeners() {
    if (!this.linkedInSPAListenersActive) return;

    console.log('🧹 [LinkedIn SPA] Cleaning up listeners');

    // Remove popstate listener
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }

    // CRITICAL: Restore original history methods to prevent wrapper stacking
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
      this.originalPushState = null;
    }
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }

    this.linkedInSPAListenersActive = false;
  }

  // Setup modal auto-dismiss for "Save this application?" dialog
  setupModalAutoDismiss() {
    console.log('🎯 [Auto-Dismiss] Setting up auto-dismiss for post-application dialogs');

    const modalObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && (
              node.classList?.contains('artdeco-modal') ||
              node.getAttribute?.('data-test-modal') ||
              node.getAttribute?.('role') === 'dialog'
            )) {
              // Check if this is the "Save this application?" dialog
              const dialogText = node.textContent || '';
              if (dialogText.includes('Save this application') ||
                  dialogText.includes('Save to return to this application')) {

                const dialogId = node.id || `modal-${Date.now()}`;

                // Ensure we haven't already dismissed this dialog
                if (!this.autoDismissedDialogs.has(dialogId)) {
                  this.autoDismissedDialogs.add(dialogId);
                  console.log('🚫 [Auto-Dismiss] "Save application" dialog detected, auto-clicking Discard');

                  // Wait a moment for dialog to fully render
                  setTimeout(() => {
                    // Find and click the Discard button
                    const discardButton = node.querySelector('button[aria-label="Discard"]') ||
                                         node.querySelector('button[data-control-name="discard_application"]') ||
                                         node.querySelector('button[data-control-name*="discard"]') ||
                                         Array.from(node.querySelectorAll('button')).find(btn =>
                                           btn.textContent.trim().toLowerCase() === 'discard'
                                         );

                    if (discardButton && !discardButton.disabled) {
                      console.log('✅ [Auto-Dismiss] Clicking Discard button');
                      discardButton.click();

                      // Clean up old dialog IDs to prevent memory leak
                      // More aggressive pruning: keep only last 10 entries
                      if (this.autoDismissedDialogs.size > 10) {
                        const dialogIds = Array.from(this.autoDismissedDialogs);
                        this.autoDismissedDialogs = new Set(dialogIds.slice(-10));
                        console.log('[Auto-Dismiss] 🧹 Pruned dialog cache to 10 entries');
                      }
                    } else {
                      console.warn('⚠️ [Auto-Dismiss] Discard button not found or disabled');
                    }
                  }, 200);
                }
              }
            }
          }
        }
      }
    });

    // Observe the entire body for modal additions
    modalObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(modalObserver);
    console.log('✅ [Auto-Dismiss] Modal observer active');
  }

  detectSite() {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

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
      'meta.com': 'meta',
      'autojobr.com': 'autojobr',
      'naukri.com': 'naukri',
      'shine.com': 'shine',
      'timesjobs.com': 'timesjobs',
      'freshersjobs.com': 'freshersjobs',
      'instahyre.com': 'instahyre'
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
        patterns: ['firstName', 'first_name', 'fname', 'first-name', 'given-name', 'forename', 'given name', 'legal first name', 'first legal name', 'givenname', 'firstname', 'first name', 'name_first', 'applicant_first_name', 'candidate-first-name'],
        types: ['text'],
        priority: 10
      },
      lastName: {
        patterns: ['lastName', 'last_name', 'lname', 'last-name', 'family-name', 'surname', 'family name', 'legal last name', 'last legal name', 'familyname', 'lastname', 'last name', 'name_last', 'applicant_last_name', 'candidate-last-name'],
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
        patterns: ['phone', 'phoneNumber', 'phone_number', 'phone-number', 'telephone', 'mobile', 'cell', 'phonenumber', 'mobilephone', 'mobile_phone', 'contact_phone', 'applicant_phone', 'home_phone', 'work_phone', 'primary_phone', 'contact_number', 'tel'],
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
        patterns: ['currentTitle', 'title', 'jobTitle', 'job_title', 'position', 'role', 'current-position', 'job-title'],
        types: ['text'],
        priority: 9
      },
      company: {
        patterns: ['company', 'employer', 'organization', 'current_company', 'currentCompany', 'current-employer', 'company_name'],
        types: ['text'],
        priority: 8
      },
      experience: {
        patterns: ['experience', 'yearsExperience', 'years_experience', 'years-experience', 'exp', 'experience_level', 'years-experience'],
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
        patterns: ['degree', 'education_level', 'qualification', 'degree_type', 'education-level'],
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

      // Work Screening Questions
      currentlyEmployed: {
        patterns: ['currentlyEmployed', 'currently_employed', 'employment_status', 'employed', 'currently-employed'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 7
      },
      canContactEmployer: {
        patterns: ['canContactEmployer', 'contact_employer', 'employer_contact', 'employer_contact_permission', 'contact-current-employer'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 7
      },
      willingToTravel: {
        patterns: ['willingToTravel', 'willing_to_travel', 'travel_willingness', 'travel-willing', 'can-travel'],
        types: ['select-one', 'radio', 'checkbox'],
        priority: 7
      },

      // Work Authorization
      workAuth: {
        patterns: ['workAuthorization', 'work_authorization', 'eligible', 'authorized', 'legal', 'work_eligibility', 'employment_eligibility'],
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
      currentCTC: {
        patterns: ['current ctc', 'current_ctc', 'currentctc', 'current compensation', 'current_salary', 'present ctc', 'existing ctc'],
        types: ['text', 'number'],
        priority: 8
      },
      expectedCTC: {
        patterns: ['expected ctc', 'expected_ctc', 'expectedctc', 'expected compensation', 'expected_salary', 'desired ctc', 'target ctc'],
        types: ['text', 'number'],
        priority: 8
      },
      minimumSalary: {
        patterns: ['minimum salary', 'min_salary', 'minsalary', 'salary minimum', 'lowest salary'],
        types: ['text', 'number'],
        priority: 7
      },
      maximumSalary: {
        patterns: ['maximum salary', 'max_salary', 'maxsalary', 'salary maximum', 'highest salary'],
        types: ['text', 'number'],
        priority: 7
      },

      // Additional fields
      description: {
        patterns: ['description', 'summary', 'about', 'bio', 'overview', 'profile_summary', 'personal_statement'],
        types: ['textarea', 'text'],
        priority: 6
      },

      // Resume/Cover Letter
      resume: {
        patterns: ['resume', 'cv', 'resumeUpload', 'resume_upload', 'curriculum', 'attachment', 'document', 'file'],
        types: ['file'],
        priority: 9,
        autoFill: true
      },
      coverLetter: {
        patterns: ['coverLetter', 'cover_letter', 'covering_letter', 'motivation'],
        types: ['textarea', 'text'],
        priority: 8
      },

      // Personal Details
      gender: {
        patterns: ['gender', 'sex', 'gender_identity', 'genderIdentity', 'gender-identity'],
        types: ['radio', 'select-one'],
        priority: 6,
        values: {
          male: ['male', 'man', 'm'],
          female: ['female', 'woman', 'f'],
          other: ['other', 'non-binary', 'nonbinary', 'prefer-not-to-say', 'decline']
        }
      },

      veteranStatus: {
        patterns: ['veteran', 'veteran_status', 'veteranStatus', 'military', 'armed_forces', 'service_member'],
        types: ['radio', 'select-one'],
        priority: 7,
        values: {
          not_veteran: ['no', 'not-veteran', 'not_veteran', 'civilian', 'none'],
          veteran: ['yes', 'veteran', 'military-veteran'],
          disabled_veteran: ['disabled-veteran', 'disabled_veteran', 'disabled']
        }
      },

      // Additional Social Links
      twitter: {
        patterns: ['twitter', 'twitterUrl', 'twitter_url', 'twitter-url', 'twitter_handle'],
        types: ['url', 'text'],
        priority: 5
      },

      personalWebsite: {
        patterns: ['personalWebsite', 'personal_website', 'website', 'homepage', 'blog', 'personal_site'],
        types: ['url', 'text'],
        priority: 5
      },

      // Work Screening Questions (Boolean responses)
      currentlyEmployed: {
        patterns: ['currently_employed', 'currentlyEmployed', 'employed', 'current_job', 'working'],
        types: ['radio', 'select-one', 'checkbox'],
        priority: 8,
        values: {
          yes: ['yes', 'true', 'currently-employed', 'employed'],
          no: ['no', 'false', 'unemployed', 'not-employed']
        }
      },

      canContactEmployer: {
        patterns: ['contact_employer', 'contactEmployer', 'current_employer', 'employer_contact', 'reference_check'],
        types: ['radio', 'select-one', 'checkbox'],
        priority: 7,
        values: {
          yes: ['yes', 'true', 'authorized', 'allowed'],
          no: ['no', 'false', 'not-authorized', 'do-not-contact']
        }
      },

      willingToWorkOvertime: {
        patterns: ['overtime', 'work_overtime', 'extra_hours', 'extended_hours', 'flexible_hours'],
        types: ['radio', 'select-one', 'checkbox'],
        priority: 6,
        values: {
          yes: ['yes', 'true', 'willing', 'available'],
          no: ['no', 'false', 'not-willing', 'unavailable']
        }
      },

      willingToTravel: {
        patterns: ['travel', 'willing_to_travel', 'business_travel', 'travel_required', 'relocation'],
        types: ['radio', 'select-one', 'checkbox'],
        priority: 6,
        values: {
          yes: ['yes', 'true', 'willing', 'available'],
          no: ['no', 'false', 'not-willing', 'unavailable']
        }
      },

      travelPercentage: {
        patterns: ['travel_percentage', 'travel_percent', 'travel_amount', 'travel_frequency'],
        types: ['text', 'number', 'select-one'],
        priority: 5
      },

      // Application-Specific Questions
      howDidYouHear: {
        patterns: ['hear_about', 'how_did_you_hear', 'referral_source', 'source', 'where_did_you_hear', 'how_heard_about_us'],
        types: ['radio', 'select-one'],
        priority: 7,
        values: {
          linkedin: ['linkedin', 'linked-in'],
          indeed: ['indeed'],
          company_website: ['company-website', 'website', 'company_site'],
          referral: ['referral', 'employee-referral', 'friend', 'colleague'],
          job_board: ['job-board', 'job_site', 'job_portal'],
          social_media: ['social-media', 'facebook', 'twitter'],
          search_engine: ['google', 'search', 'search-engine'],
          other: ['other']
        }
      },

      whyInterestedRole: {
        patterns: ['why_interested', 'interest_reason', 'motivation', 'why_apply', 'reason_applying', 'position_interest'],
        types: ['textarea', 'text'],
        priority: 6
      },

      whyInterestedCompany: {
        patterns: ['why_company', 'company_interest', 'company_motivation', 'why_work_here'],
        types: ['textarea', 'text'],
        priority: 6
      },

      careerGoals: {
        patterns: ['career_goals', 'future_goals', 'aspirations', 'career_objectives', 'long_term_goals'],
        types: ['textarea', 'text'],
        priority: 5
      },

      startDate: {
        patterns: ['start_date', 'startDate', 'available_date', 'availability', 'when_can_start'],
        types: ['date', 'text'],
        priority: 7
      },

      gpa: {
        patterns: ['gpa', 'grade_point', 'academic_record', 'grades'],
        types: ['text', 'number'],
        priority: 5
      },

      // Professional References
      referenceName: {
        patterns: ['reference_name', 'referenceName', 'ref_name', 'contact_name', 'reference_1_name'],
        types: ['text'],
        priority: 7
      },

      referenceTitle: {
        patterns: ['reference_title', 'referenceTitle', 'ref_title', 'contact_title'],
        types: ['text'],
        priority: 6
      },

      referenceCompany: {
        patterns: ['reference_company', 'referenceCompany', 'ref_company', 'contact_company'],
        types: ['text'],
        priority: 6
      },

      referenceEmail: {
        patterns: ['reference_email', 'referenceEmail', 'ref_email', 'contact_email'],
        types: ['email', 'text'],
        priority: 7
      },

      referencePhone: {
        patterns: ['reference_phone', 'referencePhone', 'ref_phone', 'contact_phone'],
        types: ['tel', 'text'],
        priority: 6
      },

      referenceRelationship: {
        patterns: ['reference_relationship', 'relationship', 'how_do_you_know', 'connection', 'reference_1_relationship'],
        types: ['select-one', 'text'],
        priority: 6,
        values: {
          supervisor: ['supervisor', 'manager', 'boss'],
          colleague: ['colleague', 'coworker', 'peer'],
          client: ['client', 'customer'],
          mentor: ['mentor', 'advisor'],
          other: ['other']
        }
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

        <div class="autojobr-content" style="overflow-y: auto; max-height: calc(100vh - 150px);">
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
              <button class="autojobr-btn secondary" id="autojobr-upload-resume">
                <span class="btn-icon">📄</span>
                <span>Upload Resume</span>
              </button>
            </div>

            <div class="action-row" style="margin-top: 8px;">
              <button class="autojobr-btn secondary" id="autojobr-interview-prep">
                <span class="btn-icon">🎯</span>
                <span>Interview Prep</span>
              </button>
              <button class="autojobr-btn secondary" id="autojobr-salary-insights">
                <span class="btn-icon">💰</span>
                <span>Salary Intel</span>
              </button>
              <button class="autojobr-btn secondary" id="autojobr-referral-finder">
                <span class="btn-icon">🤝</span>
                <span>Find Referrals</span>
              </button>
            </div>

            <div class="action-row" style="margin-top: 8px;">
              <button class="autojobr-btn secondary" id="autojobr-generate-resume" style="grid-column: 1 / -1;">
                <span class="btn-icon">📋</span>
                <span>Generate Resume As Per Job Description</span>
              </button>
            </div>
          </div>

          <div class="autojobr-features">
            <div class="feature-toggle">
              <input type="checkbox" id="smart-fill" checked> <label for="smart-fill">Smart Fill Mode</label>
            </div>
            <div class="feature-toggle">
              <input type="checkbox" id="auto-submit"> <label for="auto-submit">Auto Submit</label>
            </div>

          </div>

          <div class="autojobr-tasks" id="autojobr-tasks" style="display: none;">
            <div class="tasks-header">
              <span class="tasks-title">📋 Pending Tasks</span>
              <span class="tasks-count" id="tasks-count">0</span>
            </div>
            <div class="tasks-list" id="tasks-list"></div>
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

          <div class="autojobr-automation-status" id="autojobr-automation-status" style="display: none;">
            <!-- Automation status will be injected here -->
          </div>

          <div class="autojobr-navigation" id="autojobr-navigation" style="display: none;">
            <!-- Navigation buttons will be injected here -->
          </div>
        </div>
      </div>

      <!-- AI Chat Widget -->
      <div id="aiChatWidget" class="ai-chat-widget" style="display: none;">
        <div class="ai-chat-header">
          <h4>🤖 AutoJobr AI Assistant</h4>
          <button class="ai-chat-close-btn">&times;</button>
        </div>
        <div class="ai-chat-messages" id="ai-chat-messages">
          <!-- Chat messages will appear here -->
        </div>
        <div class="ai-chat-input-area">
          <input type="text" id="ai-question" placeholder="Ask me anything..." />
          <button id="ai-send-btn">Send</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    // CRITICAL FIX: Wait for DOM to be fully ready before attaching listeners
    // This fixes the issue where widget buttons don't respond to clicks
    setTimeout(() => {
      this.attachEnhancedUIEventListeners();
      this.makeWidgetDraggable();
      // Load user tasks when widget is displayed
      this.loadUserTasks();
      console.log('[AutoJobr] ✅ Widget fully initialized with event listeners');
    }, 0);
  }

  attachEnhancedUIEventListeners() {
    console.log('[AutoJobr] Attaching event listeners to widget buttons...');
    
    // IMPROVED: Use event delegation like Simplify extension
    // This is more reliable and survives DOM updates
    const overlay = document.getElementById('autojobr-overlay');
    if (!overlay) {
      console.error('[AutoJobr] ❌ Overlay not found, cannot attach listeners');
      return;
    }
    
    // Remove old listener if exists to prevent duplicates
    if (this.widgetClickHandler) {
      overlay.removeEventListener('click', this.widgetClickHandler);
    }
    
    // Event delegation - listen on parent and handle all button clicks
    this.widgetClickHandler = (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      
      const buttonId = target.id;
      console.log('[AutoJobr] Button clicked:', buttonId);
      
      switch(buttonId) {
        case 'autojobr-autofill':
          e.preventDefault();
          this.handleSmartAutofill();
          break;
        case 'autojobr-analyze':
          e.preventDefault();
          this.handleAnalyze();
          break;
        case 'autojobr-save-job':
          e.preventDefault();
          this.handleSaveJob();
          break;
        case 'autojobr-cover-letter':
          e.preventDefault();
          console.log('[AutoJobr] 🔥 Cover Letter button CLICKED via delegation!');
          this.handleCoverLetter();
          break;
        case 'autojobr-upload-resume':
          e.preventDefault();
          this.handleResumeUpload();
          break;
        case 'autojobr-interview-prep':
          e.preventDefault();
          this.handleInterviewPrep();
          break;
        case 'autojobr-salary-insights':
          e.preventDefault();
          this.handleSalaryInsights();
          break;
        case 'autojobr-referral-finder':
          e.preventDefault();
          this.handleReferralFinder();
          break;
        case 'autojobr-generate-resume':
          e.preventDefault();
          this.handleGenerateResume();
          break;
      }
    };
    
    overlay.addEventListener('click', this.widgetClickHandler);
    console.log('[AutoJobr] ✅ Event delegation setup complete on overlay');

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

    // Retrieve and set initial state for toggles
    chrome.storage.sync.get(['smartFillMode', 'autoSubmitMode'], (result) => {
      document.getElementById('smart-fill').checked = result.smartFillMode !== false;
      document.getElementById('auto-submit').checked = result.autoSubmitMode === true;
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
      // Prevent shortcuts when widget is focused or when typing in input fields
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);

      if (isInputFocused || this.widgetHasFocus()) {
        return;
      }

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

  widgetHasFocus() {
    const widget = document.querySelector('.autojobr-widget');
    return widget && widget.contains(document.activeElement);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'getCurrentAnalysis':
          // Return the current analysis data stored in content script
          sendResponse({
            success: true,
            analysis: this.currentAnalysis,
            jobData: this.currentJobData
          });
          return true;

        case 'extractJobDetails':
          this.extractJobDetails().then(sendResponse);
          return true;

        case 'extractJobData':
          this.extractJobDetails().then(sendResponse);
          return true;

        case 'detectJobPosting':
          this.detectJobPosting().then(sendResponse);
          return true;

        case 'getAutomationStatus':
          sendResponse({ running: this.automationRunning || false });
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

        // LinkedIn Automation Actions
        case 'startLinkedInAutomation':
          this.startLinkedInAutomation().then(sendResponse);
          return true;
        case 'stopLinkedInAutomation':
          this.stopLinkedInAutomation(); // No response needed, handled internally
          sendResponse({ success: true }); // Acknowledge stop command
          return true;
        // AI Feature Actions
        case 'getJobDescription': // Action to get job description for resume generation
          this.getJobDescriptionForResume().then(sendResponse);
          return true;
        case 'generateResume': // Action to trigger resume generation
          this.handleGenerateResume(message.data).then(sendResponse);
          return true;
        case 'askAI': // Action to trigger AI question answering
          this.handleAskAI(message.data).then(sendResponse);
          return true;
        case 'openPopup': // Action to open the popup
          this.showWidget();
          sendResponse({ success: true });
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
      // URL changes are now handled by setupAutoAnalysis debounced function
      // No need for additional URL change detection here

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

    // URL changes are now handled by setupAutoAnalysis debounced function
    // Removed duplicate event listeners to prevent multiple analysis calls
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
        // Widget should already be visible from setupAutoAnalysis
        this.updateJobInfo(jobData.jobData);

        return { success: true, jobData: jobData.jobData };
      } else {
        // Don't hide widget if job extraction fails - keep it visible for manual use
        console.log('Job extraction failed, but keeping widget visible for manual use');
        return { success: false, reason: 'Job extraction failed' };
      }
    } catch (error) {
      console.error('Job detection error:', error);
      return { success: false, error: error.message };
    }
  }

  isJobPage() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // LinkedIn specific detection - avoid feeds, home, search pages
    if (hostname.includes('linkedin.com')) {
      const isJobsPage = url.includes('/jobs/view/') || url.includes('/jobs/collections/') || url.includes('/jobs/search/');
      const hasJobFormElements = document.querySelector('.jobs-apply-form, .jobs-easy-apply-modal, .jobs-description__content');
      const isFeedPage = url.includes('/feed/') || url.includes('/mynetwork/') || url === 'https://www.linkedin.com/';

      return isJobsPage && hasJobFormElements && !isFeedPage;
    }

    // Enhanced site-specific job page detection including Indian job sites
    const jobPagePatterns = {
      'linkedin.com': ['/jobs/', '/job/', '/jobs/view/', '/jobs/search/', 'jobs/collections/'],
      'indeed.com': ['/job/', '/viewjob', '/jobs/', '/job-'],
      'glassdoor.com': ['/job/', '/jobs/', '/job-listing/'],
      'ziprecruiter.com': ['/jobs/', '/job/', '/c/'],
      'monster.com': ['/job/', '/jobs/', '/job-openings/'],
      'careerbuilder.com': ['/job/', '/jobs/', '/job-'],
      'dice.com': ['/jobs/', '/job/', '/job-detail/'],
      'stackoverflow.com': ['/jobs/', '/job/'],
      'angel.co': ['/job/', '/jobs/', '/company/', '/job-'],
      'wellfound.com': ['/job/', '/jobs/', '/company/', '/job-'],
      'greenhouse.io': ['/job/', '/jobs/', '/job_app/'],
      'lever.co': ['/jobs/', '/job/', '/postings/'],
      'workday.com': ['/job/', '/jobs/', '/en-us/job/', '/job_', '/job-', '/jobs/', '/job_app', '/apply', '/careers/job/', '/en/job/', '/job_detail'],
      'myworkdayjobs.com': ['/job/', '/jobs/', '/job_', '/job-', '/apply', '/job_detail', '/job_app'],
      'icims.com': ['/job/', '/jobs/', '/job_', '/apply'],
      'smartrecruiters.com': ['/job/', '/jobs/', '/postings/'],
      'bamboohr.com': ['/job/', '/jobs/', '/careers/'],
      'ashbyhq.com': ['/job/', '/jobs/', '/posting/'],
      'careers.google.com': ['/job/', '/jobs/', '/careers/'],
      'amazon.jobs': ['/job/', '/jobs/', '/en/'],
      'microsoft.com': ['/job/', '/jobs/', '/careers/job-search/', '/careers/us/'],
      'apple.com': ['/job/', '/jobs/', '/careers/'],
      'meta.com': ['/job/', '/jobs/', '/careers/'],
      'autojobr.com': ['/jobs/', '/job/', '/applications/', '/dashboard', '/job-discovery/', '/view-job/', '/post-job'],
      // Indian job sites
      'naukri.com': ['/job-listings/', '/jobs/', '/job/', '/job-detail/', '/jobdetail/', '/job_detail', '/recruiter/job/', '/jobs-listings/'],
      'shine.com': ['/job/', '/jobs/', '/job-detail/', '/job-listing/', '/job_detail'],
      'timesjobs.com': ['/job/', '/jobs/', '/job-detail/', '/job-listing/', '/candidatejobs/'],
      'freshersjobs.com': ['/job/', '/jobs/', '/job-detail/', '/job-posting/'],
      'instahyre.com': ['/job/', '/jobs/', '/job-detail/', '/job/', '/posting/']
    };

    // Check if hostname matches and URL contains job pattern
    for (const [domain, patterns] of Object.entries(jobPagePatterns)) {
      if (hostname.includes(domain)) {
        const isJobPage = patterns.some(pattern => url.includes(pattern) || pathname.includes(pattern));
        if (isJobPage) {
          console.log(`📍 Job page detected on ${domain} with pattern match`);
          return true;
        }
      }
    }

    // Enhanced fallback: check for generic job indicators in URL and DOM
    const genericJobIndicators = ['/job/', '/jobs/', '/career/', '/careers/', '/position/', '/apply/', '/posting/', '/job_', '/job-'];
    const hasJobPattern = genericJobIndicators.some(indicator => url.includes(indicator) || pathname.includes(indicator));

    if (hasJobPattern) {
      console.log(`📍 Generic job page detected with pattern: ${pathname}`);
      return true;
    }

    // DOM-based detection for dynamic job pages
    const jobIndicatorSelectors = [
      '[data-automation-id*="job"]',
      '[class*="job-details"]',
      '[class*="job-posting"]',
      '[class*="job-application"]',
      '[id*="job-details"]',
      '.job-view',
      '.job-detail',
      '.apply-button',
      '.job-description'
    ];

    const hasJobElements = jobIndicatorSelectors.some(selector => {
      return document.querySelector(selector) !== null;
    });

    if (hasJobElements) {
      console.log(`📍 Job page detected via DOM elements`);
      return true;
    }

    return false;
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
    let widget = document.querySelector('.autojobr-widget');

    // If widget doesn't exist, create it
    if (!widget) {
      console.log('🔧 AutoJobr widget not found - creating fresh UI');
      this.injectEnhancedUI();
      widget = document.querySelector('.autojobr-widget');
    }

    if (widget) {
      // Ensure widget is visible and properly positioned
      widget.style.display = 'block';
      widget.style.position = 'fixed';
      widget.style.top = '20px';
      widget.style.right = '20px';
      widget.style.zIndex = '10000';
      widget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';

      // Reset any previous transforms
      widget.style.opacity = '0';
      widget.style.transform = 'translateX(100%)';
      widget.style.transition = 'none';

      // Trigger reflow and animate in
      widget.offsetHeight;
      setTimeout(() => {
        widget.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        widget.style.opacity = '1';
        widget.style.transform = 'translateX(0)';
      }, 100);

      console.log('✅ AutoJobr popup widget displayed automatically');

      // Force re-attach event listeners in case they were lost
      this.attachEnhancedUIEventListeners();
    } else {
      console.error('❌ Failed to create AutoJobr widget');
    }
  }

  hideWidget() {
    const widget = document.querySelector('.autojobr-widget');
    if (widget) {
      widget.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      widget.style.opacity = '0';
      widget.style.transform = 'translateX(100%)';

      setTimeout(() => {
        widget.style.display = 'none'; // Hide instead of removing from DOM
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
          '.job-details-jobs-unified-top-card__job-title',
          '.jobs-unified-top-card__job-title',
          '.top-card-layout__title',
          'h1.t-24',
          '.base-search-card__title',
          'h1[class*="job-title"]',
          'h1[class*="title"]'
        ],
        company: [
          '.job-details-jobs-unified-top-card__company-name',
          '.jobs-unified-top-card__company-name',
          '.topcard__org-name-link',
          '.base-search-card__subtitle',
          'a[class*="company"]',
          '[data-tracking-control-name*="company"]'
        ],
        location: [
          '.job-details-jobs-unified-top-card__bullet',
          '.jobs-unified-top-card__bullet',
          '.topcard__flavor--bullet',
          '.job-search-card__location',
          'span[class*="location"]',
          '[data-tracking-control-name*="location"]'
        ],
        description: [
          '.jobs-description__content',
          '.jobs-description-content__text',
          '.description__text',
          '.jobs-description .t-14',
          '.jobs-box__html-content',
          '[class*="description"]',
          '.show-more-less-html__markup'
        ],
        requirements: [
          '.jobs-description__content',
          '.jobs-description-content__text',
          '.description__text'
        ],
        salary: [
          '.job-details-jobs-unified-top-card__job-insight',
          '.salary',
          '.compensation',
          '.pay-range',
          '[class*="salary"]',
          '[class*="compensation"]'
        ],
        type: [
          '.job-details-jobs-unified-top-card__job-insight',
          '.job-criteria__text',
          '.job-details-preferences-and-skills',
          '[class*="job-type"]'
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

    // Reset filled fields tracking for new session
    this.filledFields.clear();

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

      // Detect form navigation buttons after filling
      this.detectFormNavigation();

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
    // Try XPath-based detection first for better ATS support
    if (this.xpathDetector && typeof this.xpathDetector.getAllFormFields === 'function') {
      try {
        const xpathFields = this.xpathDetector.getAllFormFields();
        if (xpathFields && Object.keys(xpathFields).length > 0) {
          console.log('[AutoJobr] ✅ Using XPath detection for', this.xpathDetector.currentATS || 'Generic');
          console.log('[AutoJobr] Found fields:', Object.keys(xpathFields));
          return await this.fillFormWithXPath(xpathFields, userProfile, smartMode);
        } else {
          console.log('[AutoJobr] ⚠️ XPath detector found no fields, using CSS fallback');
        }
      } catch (error) {
        console.error('[AutoJobr] ❌ XPath detection error:', error);
        console.log('[AutoJobr] Falling back to CSS selectors');
      }
    } else {
      console.log('[AutoJobr] ℹ️ XPath detector not ready, using CSS selectors');
    }

    // Fallback to standard CSS detection
    console.log('[AutoJobr] Using standard CSS selector detection');
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

  async fillFormWithXPath(xpathFields, userProfile, smartMode) {
    let fieldsFound = Object.keys(xpathFields).length;
    let fieldsFilled = 0;

    const fieldMapping = {
      'email': userProfile.email,
      'phone': userProfile.phone,
      'first_name': userProfile.firstName || userProfile.name?.split(' ')[0],
      'last_name': userProfile.lastName || userProfile.name?.split(' ').slice(1).join(' '),
      'full_name': userProfile.name,
      'linkedin': userProfile.linkedinUrl,
      'resume': userProfile.resumePath,
      'cover_letter': userProfile.coverLetter
    };

    for (const [fieldType, element] of Object.entries(xpathFields)) {
      try {
        const value = fieldMapping[fieldType];
        if (!value) continue;

        // Scroll field into view
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        await this.delay(100);

        // Focus the field
        element.focus();
        await this.delay(50);

        // Fill based on element type
        let success = false;
        if (element.tagName.toLowerCase() === 'select') {
          success = await this.fillSelectFieldSmart(element, value);
        } else if (element.tagName.toLowerCase() === 'textarea') {
          success = await this.fillTextAreaSmart(element, value);
        } else if (element.type === 'file') {
          success = await this.fillFileFieldSmart(element, value, userProfile);
        } else {
          success = await this.fillTextFieldSmart(element, value);
        }

        if (success) {
          fieldsFilled++;
          this.addFieldFeedback(element, true);
          console.log(`[AutoJobr] Filled ${fieldType} via XPath`);
        }

        await this.delay(150 + Math.random() * 200);
      } catch (error) {
        console.warn(`[AutoJobr] Failed to fill ${fieldType}:`, error);
        this.addFieldFeedback(xpathFields[fieldType], false);
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
    const skipTypes = ['submit', 'button', 'reset', 'image', 'search'];
    if (skipTypes.includes(field.type)) {
      return true;
    }

    // CRITICAL: Skip search bars and search inputs by checking name, id, placeholder, aria-label
    const fieldIdentifiers = [
      field.name?.toLowerCase() || '',
      field.id?.toLowerCase() || '',
      field.placeholder?.toLowerCase() || '',
      field.getAttribute('aria-label')?.toLowerCase() || '',
      field.className?.toLowerCase() || '',
      field.getAttribute('data-test-id')?.toLowerCase() || ''
    ].join(' ');

    const searchIndicators = [
      'search',
      'query',
      'keyword',
      'search-global',
      'global-nav',
      'search-box',
      'searchbox',
      'job-search',
      'jobs-search'
    ];

    if (searchIndicators.some(indicator => fieldIdentifiers.includes(indicator))) {
      console.log('⏭️ Skipping search field:', field.name || field.id || field.placeholder);
      return true;
    }

    return false;
  }

  getFieldIdentifier(field) {
    // Create unique identifier for field to prevent duplicate filling
    return `${field.tagName}_${field.type}_${field.name}_${field.id}_${field.placeholder}`.toLowerCase().replace(/\s+/g, '_');
  }

  async fillFieldSmart(field, userProfile, smartMode) {
    try {
      // Generate unique field identifier to prevent loops
      const fieldId = this.getFieldIdentifier(field);

      // Skip if already filled to prevent infinite loops
      if (this.filledFields.has(fieldId)) {
        return false;
      }

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
      let success = false;
      switch (field.tagName.toLowerCase()) {
        case 'select':
          success = await this.fillSelectFieldSmart(field, value);
          break;
        case 'textarea':
          success = await this.fillTextAreaSmart(field, value);
          break;
        case 'input':
          switch (field.type.toLowerCase()) {
            case 'checkbox':
            case 'radio':
              success = await this.fillChoiceFieldSmart(field, value);
              break;
            case 'file':
              success = await this.fillFileFieldSmart(field, value, userProfile);
              break;
            default:
              success = await this.fillTextFieldSmart(field, value);
              break;
          }
          break;
        default:
          success = await this.fillTextFieldSmart(field, value);
          break;
      }

      // Mark field as filled if successful
      if (success) {
        this.filledFields.add(fieldId);
      }

      return success;

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
      pattern: field.pattern || null,
      element: field // Store the element itself for context
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

    // PRIORITY 1: Check for experience-related questions (LinkedIn specific)
    const combinedLower = fieldInfo.combined.toLowerCase();
    const experienceKeywords = ['experience', 'exp', 'years', 'year', 'month', 'months'];
    const noticePeriodKeywords = ['notice period', 'notice', 'availability', 'when can you start', 'join', 'joining'];

    // Notice period questions - always fill with "1"
    const hasNoticePeriod = noticePeriodKeywords.some(keyword => combinedLower.includes(keyword));
    if (hasNoticePeriod) {
      console.log('✅ Notice period question detected - filling with "1"');
      return '1';
    }

    // Experience questions - fill with user's years of experience as number only
    const hasExperience = experienceKeywords.some(keyword => combinedLower.includes(keyword));
    if (hasExperience && (fieldInfo.type === 'text' || fieldInfo.type === 'number')) {
      const yearsExp = Math.round(userProfile.yearsExperience || 3);
      console.log(`✅ Experience question detected - filling with number: ${yearsExp}`);
      return yearsExp.toString();
    }

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
    // Initialize experience cache on first call
    if (!this.experienceCache && profile.yearsExperience) {
      this.experienceCache = Math.round(profile.yearsExperience || 3).toString();
    }

    // Calculate default salary based on job title and experience if not available
    const getDefaultSalary = () => {
      const yearsExp = profile.yearsExperience || 3;
      const jobTitle = (profile.professionalTitle || this.currentJobData?.title || '').toLowerCase();

      // Base salaries by experience level
      const baseSalaries = {
        entry: 50000,
        mid: 75000,
        senior: 110000,
        lead: 140000
      };

      // Multipliers by job category
      const categoryMultipliers = {
        'software': 1.3,
        'engineer': 1.3,
        'developer': 1.3,
        'data scientist': 1.4,
        'product manager': 1.25,
        'designer': 1.1,
        'marketing': 1.0,
        'sales': 1.2,
        'hr': 0.95,
        'analyst': 1.15,
        'manager': 1.2
      };

      // Determine experience level
      let experienceLevel = 'entry';
      if (yearsExp >= 7) experienceLevel = 'lead';
      else if (yearsExp >= 4) experienceLevel = 'senior';
      else if (yearsExp >= 2) experienceLevel = 'mid';

      // Find category multiplier
      let multiplier = 1.0;
      for (const [category, mult] of Object.entries(categoryMultipliers)) {
        if (jobTitle.includes(category)) {
          multiplier = mult;
          break;
        }
      }

      const baseSalary = baseSalaries[experienceLevel];
      const estimatedSalary = Math.round(baseSalary * multiplier);

      return {
        min: Math.round(estimatedSalary * 0.9),
        max: Math.round(estimatedSalary * 1.1)
      };
    };

    const defaultSalary = getDefaultSalary();

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
      experience: this.experienceCache || this.formatExperience(profile.yearsExperience, fieldInfo),
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
      salary: profile.desiredSalaryMin ? `${profile.desiredSalaryMin}-${profile.desiredSalaryMax || profile.desiredSalaryMin}` : `${defaultSalary.min}-${defaultSalary.max}`,
      currentCTC: profile.desiredSalaryMin || defaultSalary.min,
      expectedCTC: profile.desiredSalaryMax || defaultSalary.max,
      minimumSalary: profile.desiredSalaryMin || defaultSalary.min,
      maximumSalary: profile.desiredSalaryMax || defaultSalary.max,
      desiredSalary: profile.desiredSalaryMax || defaultSalary.max,
      description: profile.summary || '',

      // New Personal Details Fields
      gender: this.mapValueWithOptions('gender', profile.gender, fieldInfo),
      veteranStatus: this.mapValueWithOptions('veteranStatus', profile.veteranStatus, fieldInfo),
      twitter: profile.twitterUrl || '',
      personalWebsite: profile.personalWebsiteUrl || '',

      // Work Screening Questions (Boolean responses)
      currentlyEmployed: this.mapBooleanValue(profile.currentlyEmployed, fieldInfo),
      canContactEmployer: this.mapBooleanValue(profile.canContactCurrentEmployer, fieldInfo),
      willingToWorkOvertime: this.mapBooleanValue(profile.willingToWorkOvertime, fieldInfo),
      willingToTravel: this.mapBooleanValue(profile.willingToTravel, fieldInfo),
      travelPercentage: profile.maxTravelPercentage ? `${profile.maxTravelPercentage}%` : '',

      // Application-Specific Questions
      howDidYouHear: this.mapValueWithOptions('howDidYouHear', profile.howDidYouHearAboutUs, fieldInfo),
      whyInterestedRole: profile.whyInterestedInRole || '',
      whyInterestedCompany: profile.whyInterestedInCompany || '',
      careerGoals: profile.careerGoals || '',
      startDate: profile.preferredStartDate || profile.earliestStartDate || 'Flexible',
      gpa: profile.gpa || '',

      // Professional References (use first reference if available)
      referenceName: profile.references?.[0]?.fullName || '',
      referenceTitle: profile.references?.[0]?.jobTitle || '',
      referenceCompany: profile.references?.[0]?.company || '',
      referenceEmail: profile.references?.[0]?.email || '',
      referencePhone: profile.references?.[0]?.phone || '',
      referenceRelationship: this.mapValueWithOptions('referenceRelationship', profile.references?.[0]?.relationship, fieldInfo)
    };

    return valueMap[key] || null;
  }

  // Enhanced value mapping for fields with predefined options
  mapValueWithOptions(fieldType, userValue, fieldInfo) {
    if (!userValue) return null;

    const mapping = this.fieldMappings[fieldType];
    if (!mapping || !mapping.values) return userValue;

    // Find matching value from our predefined options
    for (const [ourValue, possibleMatches] of Object.entries(mapping.values)) {
      if (ourValue === userValue || possibleMatches.includes(userValue.toLowerCase())) {
        // Check if field is radio/select and try to match exact option text
        if (fieldInfo.type === 'radio' || fieldInfo.type === 'select-one') {
          return this.findBestOptionMatch(possibleMatches, fieldInfo);
        }
        return ourValue;
      }
    }

    return userValue;
  }

  // Map boolean values to appropriate yes/no responses based on field context
  mapBooleanValue(boolValue, fieldInfo) {
    if (boolValue === null || boolValue === undefined) return null;

    if (fieldInfo.type === 'radio' || fieldInfo.type === 'select-one') {
      // Try to find actual option values in the form
      const form = fieldInfo.element?.closest('form');
      if (form) {
        const options = form.querySelectorAll(`input[name="${fieldInfo.name}"], option`);
        for (const option of options) {
          const value = (option.value || option.textContent || '').toLowerCase();
          if (boolValue && (value.includes('yes') || value.includes('true') || value.includes('authorized'))) {
            return option.value || 'yes';
          }
          if (!boolValue && (value.includes('no') || value.includes('false') || value.includes('not'))) {
            return option.value || 'no';
          }
        }
      }
    }

    return boolValue ? 'yes' : 'no';
  }

  // Find the best matching option text from available form options
  findBestOptionMatch(possibleMatches, fieldInfo) {
    const form = fieldInfo.element?.closest('form');
    if (!form) return possibleMatches[0]; // Return first match if no form context

    const options = form.querySelectorAll(`input[name="${fieldInfo.name}"], option`);
    for (const option of options) {
      const optionText = (option.value || option.textContent || '').toLowerCase();
      for (const match of possibleMatches) {
        if (optionText.includes(match) || match.includes(optionText)) {
          return option.value || optionText;
        }
      }
    }

    return possibleMatches[0]; // Fallback to first match
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
    // Check cache first
    if (this.experienceCache) {
      return this.experienceCache;
    }

    // ALWAYS return user's general years of experience as a valid number
    // Normalize to ensure we have a valid integer (default to 3 if nothing provided)
    const normalizedYears = Math.round(years || 3);

    // Cache the result to avoid recalculations
    this.experienceCache = normalizedYears.toString();

    // Simply return the user's total years of experience (e.g., 2, 3, 4, etc.)
    return this.experienceCache;
  }

  calculateSkillYears(skill, workExperience) {
    // For ANY skill-related experience question, use the user's general experience
    // This is much more reliable than trying to calculate per-skill experience

    // Check cache first
    const cacheKey = `skill_exp_${skill}`;
    if (this.skillExpCache && this.skillExpCache[cacheKey]) {
      return this.skillExpCache[cacheKey];
    }

    // Use general years of experience as default
    const generalExp = this.experienceCache ? parseInt(this.experienceCache) : 3;

    // Cache the result
    if (!this.skillExpCache) {
      this.skillExpCache = {};
    }
    this.skillExpCache[cacheKey] = generalExp;

    return generalExp;
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
      // Skip if field already has correct value
      if (field.value === value) {
        return true;
      }

      // Focus field first
      field.focus();
      await this.delay(100);

      // Clear field more efficiently
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));

      // Use faster typing for better performance
      const chunkSize = Math.max(1, Math.floor(value.length / 10));
      for (let i = 0; i < value.length; i += chunkSize) {
        const chunk = value.substring(i, i + chunkSize);
        field.value = value.substring(0, i + chunk.length);

        // Dispatch events for framework compatibility
        field.dispatchEvent(new Event('input', { bubbles: true }));

        // Shorter delay for better UX
        await this.delay(50);
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
      // CRITICAL: Skip if field already has a value selected (especially for country codes)
      const currentValue = field.value;
      const fieldInfo = this.analyzeFieldAdvanced(field);
      const isCountryCode = fieldInfo.combined.includes('country') ||
                           fieldInfo.combined.includes('code') ||
                           fieldInfo.combined.includes('dial') ||
                           fieldInfo.combined.includes('phone code');

      // If it's a country code field and already has a selection, skip it
      if (isCountryCode && currentValue && currentValue !== '' && currentValue !== '0') {
        console.log('✅ Country code already selected, skipping:', currentValue);
        return true; // Return success without changing
      }

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

      // If no match found, use smart defaults to ensure form completion
      if (!option) {
        // Check if this is a Yes/No question - prefer "Yes"
        const isYesNoQuestion = options.some(opt =>
          opt.text.toLowerCase().trim() === 'yes' ||
          opt.text.toLowerCase().trim() === 'no'
        );

        if (isYesNoQuestion) {
          option = options.find(opt =>
            opt.text.toLowerCase().trim() === 'yes' ||
            opt.value.toLowerCase().trim() === 'yes'
          );
          if (option) {
            console.log('✅ Auto-selecting "Yes" for yes/no question:', fieldInfo.label || fieldInfo.name);
          }
        }

        // For ANY other dropdown, select the first REAL option (skip placeholders)
        if (!option && options.length > 1) {
          // Skip all placeholder/empty options and find first real option
          const firstRealOption = options.find(opt => {
            const text = opt.text.toLowerCase().trim();
            const value = opt.value.trim();

            // List of common placeholder texts to skip
            const placeholders = [
              'select an option',
              'select',
              'choose',
              'please select',
              'select one',
              'choose one',
              'pick one',
              '--',
              '---',
              '-- select --',
              '-- none --',
              'none',
              ''
            ];

            // Skip if text matches any placeholder
            if (placeholders.includes(text)) {
              return false;
            }

            // Skip if value is empty or placeholder-like
            if (value === '' || value === '0' || value === '-1' || value === 'null') {
              return false;
            }

            // This is a valid option!
            return true;
          });

          if (firstRealOption) {
            option = firstRealOption;
            console.log('✅ Auto-selecting first REAL option (skipped placeholders):', firstRealOption.text, 'for field:', fieldInfo.label || fieldInfo.name);
          }
        }
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
      if (field.type === 'radio') {
        // Find all radio buttons in the group
        const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
        if (radioGroup.length === 0) return false;

        // Simple strategy: Try to find "Yes", otherwise pick first option
        let selectedRadio = null;

        // First pass: Look for explicit "yes" values
        for (const radio of radioGroup) {
          const val = (radio.value || '').toLowerCase().trim();
          const id = (radio.id || '').toLowerCase();

          if (val === 'yes' || val === 'true' || val === '1' || id.includes('yes')) {
            selectedRadio = radio;
            break;
          }
        }

        // Second pass: Check labels if no explicit yes found
        if (!selectedRadio) {
          for (const radio of radioGroup) {
            const label = radio.closest('label') || document.querySelector(`label[for="${radio.id}"]`);
            if (label) {
              const text = label.textContent.toLowerCase().trim();
              if (text === 'yes' || text.startsWith('yes ') || text === 'true') {
                selectedRadio = radio;
                break;
              }
            }
          }
        }

        // Fallback: Use first option if no "yes" found
        if (!selectedRadio) {
          selectedRadio = radioGroup[0];
        }

        // Select and trigger events
        selectedRadio.click();
        selectedRadio.checked = true;
        selectedRadio.dispatchEvent(new Event('change', { bubbles: true }));
        selectedRadio.dispatchEvent(new Event('input', { bubbles: true }));

        console.log(`✅ Radio selected: ${selectedRadio.value || 'first'} for ${field.name}`);
        return true;
      }

      if (field.type === 'checkbox') {
        // Always check checkboxes
        field.checked = true;
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Choice field error:', error);
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

  isYesOption(radioInfo) {
    const radio = radioInfo.element;
    const radioValue = (radio.value || '').toLowerCase().trim();
    const radioId = (radio.id || '').toLowerCase();

    // Get the option's specific label text
    let optionText = '';
    const label = radio.closest('label') || document.querySelector(`label[for="${radio.id}"]`);
    if (label) {
      optionText = (label.textContent || '').toLowerCase().trim();
    }
    if (!optionText && radio.nextSibling) {
      optionText = (radio.nextSibling.textContent || '').toLowerCase().trim();
    }

    const thisOptionText = ` ${radioValue} ${radioId} ${optionText} `.toLowerCase();

    // Use word boundary matching to avoid false positives
    // "\\byes\\b" matches "yes" but not "eyes"
    const affirmativePatterns = [
      /\byes\b/,
      /\btrue\b/,
      /\bauthorized\b/,
      /\beligible\b/,
      /\bqualified\b/
    ];

    const negativePatterns = [
      /\bno\b/,
      /\bfalse\b/,
      /\bnot\b/,
      /\bunable\b/,
      /\bcannot\b/,
      /\bineligible\b/,
      /\bdecline\b/,
      /\bdisabled\b/,
      /\bunavailable\b/,
      /\bnever\b/
    ];

    // Check exact value matches first (most reliable)
    if (radioValue === 'yes' || radioValue === 'true' || radioValue === '1') {
      return true;
    }
    if (radioValue === 'no' || radioValue === 'false' || radioValue === '0') {
      return false;
    }

    // Check for negative indicators first (higher priority)
    const hasNegative = negativePatterns.some(pattern => pattern.test(thisOptionText));
    if (hasNegative) {
      return false;
    }

    // Then check for affirmative indicators
    const hasAffirmative = affirmativePatterns.some(pattern => pattern.test(thisOptionText));
    return hasAffirmative;
  }

  shouldSelectRadio(radioInfo, value) {
    if (!value) return false;

    const radio = radioInfo.element;
    const valueLower = value.toString().toLowerCase().trim();

    // Get the specific option's value and adjacent text (not the question)
    const radioValue = (radio.value || '').toLowerCase().trim();
    const radioId = (radio.id || '').toLowerCase().trim();

    // Find the option's specific label text (adjacent to this radio, not the question)
    let optionText = '';
    const label = radio.closest('label') || document.querySelector(`label[for="${radio.id}"]`);
    if (label) {
      optionText = (label.textContent || '').toLowerCase().trim();
    }
    if (!optionText && radio.nextSibling) {
      optionText = (radio.nextSibling.textContent || '').toLowerCase().trim();
    }

    // Combine this option's specific identifiers with word boundaries
    const thisOptionText = ` ${radioValue} ${radioId} ${optionText} `.toLowerCase();

    // Exact value match (most reliable)
    if (radioValue === valueLower) return true;

    // Check if this specific option matches the value with word boundaries
    const affirmativePatterns = [/\byes\b/, /\btrue\b/, /\bauthorized\b/, /\beligible\b/, /\bqualified\b/];
    const negativePatterns = [/\bno\b/, /\bfalse\b/, /\bnot\b/, /\bunable\b/, /\bcannot\b/, /\bineligible\b/, /\bdecline\b/];

    const hasNegative = negativePatterns.some(pattern => pattern.test(thisOptionText));
    const hasAffirmative = affirmativePatterns.some(pattern => pattern.test(thisOptionText));

    // Match based on value
    if (valueLower === 'yes' && hasAffirmative && !hasNegative) return true;
    if (valueLower === 'no' && hasNegative) return true;

    // Try to match the option text with the value using word boundary
    const valuePattern = new RegExp(`\\b${valueLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    return valuePattern.test(thisOptionText);
  }

  async fillFileFieldSmart(field, value, userProfile) {
    try {
      // Attempt to inject resume from server
      console.log('File field detected, attempting resume upload:', field);

      // Check settings for auto-resume upload
      const settings = await chrome.storage.sync.get(['autoResumeMode']);
      if (!settings.autoResumeMode) {
        console.log('Auto resume upload is disabled.');
        return false;
      }

      // Get user's active resume from server
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/resumes/active`, {
        credentials: 'include',
        headers: { 'Accept': 'application/octet-stream' }
      });

      if (response.ok) {
        const resumeBlob = await response.blob();
        const fileName = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'resume.pdf';

        // Create a File object from the blob
        const resumeFile = new File([resumeBlob], fileName, { type: resumeBlob.type });

        // Create a new DataTransfer to simulate file selection
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(resumeFile);

        // Set the files property
        field.files = dataTransfer.files;

        // Trigger change event
        field.dispatchEvent(new Event('change', { bubbles: true }));

        console.log('✅ Resume uploaded successfully:', fileName);
        return true;
      } else {
        console.log('❌ No active resume found on server');
        return false;
      }
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
    // Check if it's a resume upload field
    const fieldInfo = this.analyzeFieldAdvanced(input);
    if (fieldInfo.combined.includes('resume') || fieldInfo.combined.includes('cv')) {
      return await this.fillFileFieldSmart(input, 'resume', userProfile); // 'resume' is a placeholder value
    }
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

  detectFormNavigation() {
    // Detect next page and submit buttons
    const nextButtons = this.findNextPageButtons();
    const submitButtons = this.findSubmitButtons();

    this.formState.hasNextPage = nextButtons.length > 0;
    this.formState.hasSubmit = submitButtons.length > 0;

    // Update widget UI to show navigation buttons
    this.updateNavigationUI(nextButtons, submitButtons);

    console.log('Form navigation detected:', {
      nextButtons: nextButtons.length,
      submitButtons: submitButtons.length,
      formState: this.formState
    });
  }

  findNextPageButtons() {
    const nextButtonSelectors = [
      // Generic next/continue buttons
      'button[type="button"]:contains("Next")',
      'button[type="button"]:contains("Continue")',
      'input[type="button"][value*="Next"]',
      'input[type="button"][value*="Continue"]',
      'input[type="submit"][value*="Next"]',
      'input[type="submit"][value*="Continue"]',

      //      // Site-specific selectors
      ...this.smartSelectors.nextButtons || [],

      // Common classes and IDs
      '.next-button', '.continue-button', '.btn-next', '.btn-continue',
      '#next-button', '#continue-button', '#btn-next', '#btn-continue',

      // Data attributes
      '[data-automation-id*="next"]', '[data-automation-id*="continue"]',
      '[data-test*="next"]', '[data-test*="continue"]',

      // Text-based detection
      'button:not([type="submit"])', 'input[type="button"]'
    ];

    const buttons = [];

    nextButtonSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(button => {
          if (this.isNextButton(button) && !buttons.includes(button)) {
            buttons.push(button);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });

    return buttons;
  }

  findSubmitButtons() {
    const submitButtonSelectors = [
      // Standard submit buttons
      'button[type="submit"]',
      'input[type="submit"]',

      // Site-specific selectors
      ...this.smartSelectors.submitButtons || [],

      // Common submit button patterns
      'button:contains("Submit")', 'button:contains("Apply")',
      'button:contains("Send Application")', 'button:contains("Complete Application")',
      '.submit-button', '.apply-button', '.btn-submit', '.btn-apply',
      '#submit-button', '#apply-button', '#btn-submit', '#btn-apply',

      // Data attributes
      '[data-automation-id*="submit"]', '[data-automation-id*="apply"]',
      '[data-test*="submit"]', '[data-test*="apply"]'
    ];

    const buttons = [];

    submitButtonSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(button => {
          if (this.isSubmitButton(button) && !buttons.includes(button)) {
            buttons.push(button);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });

    return buttons;
  }

  isNextButton(button) {
    const text = (button.textContent || button.value || '').toLowerCase();
    const nextKeywords = ['next', 'continue', 'proceed', 'forward', 'step', '→', '»'];
    const submitKeywords = ['submit', 'apply', 'send', 'complete', 'finish'];

    // "Review" buttons are treated as NEXT unless they explicitly say "submit"
    if (text.includes('review')) {
      // If it says "review and submit" or similar, it's NOT a next button
      const hasExplicitSubmit = submitKeywords.some(keyword => text.includes(keyword));
      return !hasExplicitSubmit && !button.disabled;
    }

    const hasNextKeyword = nextKeywords.some(keyword => text.includes(keyword));
    const hasSubmitKeyword = submitKeywords.some(keyword => text.includes(keyword));

    return hasNextKeyword && !hasSubmitKeyword && !button.disabled;
  }

  isSubmitButton(button) {
    const text = (button.textContent || button.value || '').toLowerCase();
    const submitKeywords = ['submit application', 'apply now', 'submit', 'apply', 'send application', 'continue to apply', 'complete application', 'finish'];

    // "Review and submit" or similar should be treated as submit button
    if (text.includes('review') && text.includes('submit')) {
      return !button.disabled;
    }

    const hasSubmitKeyword = submitKeywords.some(keyword => text.includes(keyword));
    return hasSubmitKeyword && !button.disabled;
  }

  updateNavigationUI(nextButtons, submitButtons) {
    // Remove existing navigation buttons
    const existingNav = document.getElementById('autojobr-navigation');
    if (existingNav) existingNav.remove();

    if (nextButtons.length === 0 && submitButtons.length === 0) return;

    // Create navigation section
    const navigationHTML = `
      <div class="autojobr-navigation" id="autojobr-navigation">
        <div class="nav-header">
          <span class="nav-title">🧭 Quick Navigation</span>
        </div>
        <div class="nav-buttons">
          <button class="autojobr-btn secondary" id="navDashboard">
            <span class="btn-icon">📊</span>
            <span class="btn-text">Dashboard</span>
          </button>
          <button class="autojobr-btn secondary" id="navJobs">
            <span class="btn-icon">💼</span>
            <span class="btn-text">Job Discovery</span>
          </button>
          <button class="autojobr-btn secondary" id="navApplications">
            <span class="btn-icon">📋</span>
            <span class="btn-text">My Applications</span>
          </button>
          <button class="autojobr-btn primary" id="navProfile">
            <span class="btn-icon">👤</span>
            <span class="btn-text">Complete Profile</span>
          </button>
        </div>
      </div>
    `;

    // Insert navigation after actions
    const actionsDiv = document.querySelector('.autojobr-actions');
    if (actionsDiv) {
      actionsDiv.insertAdjacentHTML('afterend', navigationHTML);

      // Add event listeners
      document.getElementById('navDashboard')?.addEventListener('click', async () => {
        const apiUrl = await this.getApiUrl();
        window.open(`${apiUrl}/applications`, '_blank');
      });

      document.getElementById('navJobs')?.addEventListener('click', async () => {
        const apiUrl = await this.getApiUrl();
        window.open(`${apiUrl}/jobs`, '_blank');
      });

      document.getElementById('navApplications')?.addEventListener('click', async () => {
        const apiUrl = await this.getApiUrl();
        window.open(`${apiUrl}/applications`, '_blank');
      });

      document.getElementById('navProfile')?.addEventListener('click', async () => {
        const apiUrl = await this.getApiUrl();
        window.open(`${apiUrl}/profile`, '_blank');
      });

      document.getElementById('autojobr-next-page')?.addEventListener('click', () => {
        this.handleNextPage(nextButtons);
      });

      document.getElementById('autojobr-submit-form')?.addEventListener('click', () => {
        this.handleSubmitForm(submitButtons);
      });
    }
  }

  async handleNextPage(nextButtons) {
    if (nextButtons.length === 0) return;

    try {
      this.updateStatus('🔄 Moving to next page...', 'loading');

      // Click the most appropriate next button
      const bestButton = this.selectBestButton(nextButtons, 'next');
      if (bestButton) {
        bestButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(500);

        bestButton.click();
        this.formState.currentPage++;

        this.updateStatus('✅ Moved to next page', 'success');

        // Wait for page to load then re-detect navigation
        setTimeout(() => {
          this.detectFormNavigation();
        }, 2000);
      }
    } catch (error) {
      console.error('Next page error:', error);
      this.updateStatus('❌ Failed to move to next page', 'error');
    }
  }

  async handleSubmitForm(submitButtons) {
    if (submitButtons.length === 0) return;

    try {
      // Confirm before submitting
      if (!confirm('Submit the application now? This action cannot be undone.')) {
        return;
      }

      this.updateStatus('🔄 Submitting application...', 'loading');

      // Click the most appropriate submit button
      const bestButton = this.selectBestButton(submitButtons, 'submit');
      if (bestButton) {
        bestButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(500);

        bestButton.click();

        this.updateStatus('✅ Application submitted!', 'success');

        // Track application submission
        this.trackApplicationSubmission();
      }
    } catch (error) {
      console.error('Submit form error:', error);
      this.updateStatus('❌ Failed to submit application', 'error');
    }
  }

  selectBestButton(buttons, type) {
    if (buttons.length === 1) return buttons[0];

    // Score buttons based on various criteria
    let bestButton = null;
    let bestScore = 0;

    for (const button of buttons) {
      let score = 0;
      const text = (button.textContent || button.value || '').toLowerCase();

      // Prefer buttons with clear text
      if (type === 'next') {
        if (text.includes('next')) score += 20;
        if (text.includes('continue')) score += 15;
      } else if (type === 'submit') {
        if (text.includes('submit')) score += 20;
        if (text.includes('apply')) score += 15;
      }

      // Prefer visible buttons
      const style = window.getComputedStyle(button);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        score += 10;
      }

      // Prefer primary/styled buttons
      if (button.className.includes('primary') || button.className.includes('btn-primary')) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestButton = button;
      }
    }

    return bestButton;
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
    // Prevent manual auto-fill during LinkedIn automation
    if (this.automationRunning) {
      this.showNotification('⚠️ LinkedIn automation is running. Auto-fill is handled automatically.', 'warning');
      return;
    }

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
      const apiUrl = await this.getApiUrl(); // Ensure apiUrl is fetched
      const result = await chrome.runtime.sendMessage({
        action: 'saveJob',
        data: {
          jobTitle: this.currentJobData.title,
          company: this.currentJobData.company,
          location: this.currentJobData.location,
          jobUrl: window.location.href,
          description: this.currentJobData.description,
          source: 'extension_v2',
          apiUrl: apiUrl // Include apiUrl if needed by the background script
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
    console.log('[handleCoverLetter] Button clicked! Starting cover letter generation...');
    
    try {
      const authenticated = await this.isAuthenticated();
      console.log('[handleCoverLetter] Authentication check result:', authenticated);
      
      if (!authenticated) {
        console.log('[handleCoverLetter] User not authenticated, showing warning');
        this.showNotification('Please log in to generate cover letters', 'warning');
        return;
      }

      console.log('[handleCoverLetter] User authenticated, proceeding with generation');
      
      // Use current job data if available, otherwise extract
      let jobData = this.currentJobData;
      console.log('[handleCoverLetter] Current job data:', jobData ? 'exists' : 'null');

      if (!jobData || !jobData.description) {
        jobData = await this.extractJobDetails();
      }

      if (!jobData || !jobData.success || !jobData.jobData) {
        this.showNotification('Could not extract job details. Please ensure you are on a job posting page.', 'error');
        return;
      }

      const job = jobData.jobData || jobData;

      if (!job.description || job.description.length < 50) {
        this.showNotification('Job description is too short or missing. Please navigate to the full job posting.', 'error');
        return;
      }

      this.showNotification('Generating cover letter...', 'info');

      const response = await chrome.runtime.sendMessage({
        action: 'generateCoverLetter',
        data: {
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description,
          requirements: job.requirements || '',
          location: job.location || '',
          url: job.url || window.location.href
        }
      });

      if (response && response.success && response.coverLetter) {
        this.showNotification('Cover letter generated and copied to clipboard!', 'success');
        await navigator.clipboard.writeText(response.coverLetter);

        // Also display in console for debugging
        console.log('Generated Cover Letter:', response.coverLetter);
      } else {
        throw new Error(response?.error || 'Failed to generate cover letter');
      }
    } catch (error) {
      console.error('[handleCoverLetter] Error during cover letter generation:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
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

      // Send to background for analysis - background script handles authentication
      try {
        const result = await chrome.runtime.sendMessage({
          action: 'analyzeJob',
          data: {
            jobData: jobData.jobData,
            userProfile: null, // Let background script get profile with proper auth
            source: 'manual_analysis' // Mark as manual to allow notifications
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
      // Use the exact same score from server response without any local modifications
      const score = analysis.matchScore || 0;
      console.log('Content script updating job match with server score:', score);

      const level = score >= 80 ? 'Excellent' :
                   score >= 60 ? 'Good' :
                   score >= 40 ? 'Fair' : 'Poor';

      matchEl.innerHTML = `
        <div class="match-score ${level.toLowerCase()}">
          ${score}% Match (${level})
        </div>
      `;

      console.log('Updated automatic popup with match score:', score, level);
    }
  }

  async saveCurrentJob() {
    return await this.handleSaveJob();
  }

  // Check if user is authenticated - unified cache structure: { profile, timestamp }
  async isAuthenticated() {
    try {
      // First check cache for quick response
      if (this.cachedProfile && Date.now() - this.cachedProfile.timestamp < 300000) {
        const isAuth = this.cachedProfile.profile?.authenticated === true;
        console.log('[isAuthenticated] Using cached auth state:', isAuth);
        return isAuth;
      }

      // Cache expired or missing - fetch fresh profile
      console.log('[isAuthenticated] Cache stale, fetching fresh profile');
      const profile = await this.getUserProfile();
      
      // If profile exists and has authenticated flag, use it
      if (profile && profile.authenticated === true) {
        console.log('[isAuthenticated] Fresh profile authenticated');
        return true;
      }

      // If profile is null or not authenticated, user is not logged in
      console.log('[isAuthenticated] Not authenticated');
      return false;
    } catch (error) {
      // On actual errors, log but don't block - treat as not authenticated
      console.log('[isAuthenticated] Auth check failed, treating as unauthenticated:', error.message);
      return false;
    }
  }

  async getUserProfile() {
    try {
      // Check cache first to prevent excessive requests
      if (this.cachedProfile && Date.now() - this.cachedProfile.timestamp < 300000) { // 5 minutes
        console.log('[getUserProfile] Returning cached profile');
        return this.cachedProfile.profile;
      }

      console.log('[getUserProfile] Fetching fresh profile from background');
      const result = await chrome.runtime.sendMessage({
        action: 'getUserProfile'
      });

      if (result.success && result.profile) {
        console.log('[getUserProfile] Received profile:', {
          firstName: result.profile.firstName,
          lastName: result.profile.lastName,
          fullName: result.profile.fullName,
          skillsCount: result.profile.skills?.length || 0,
          authenticated: result.profile.authenticated
        });

        // Cache successful profile - UNIFIED STRUCTURE: { profile, timestamp }
        this.cachedProfile = { profile: result.profile, timestamp: Date.now() };
        return result.profile;
      }

      // Handle authentication errors gracefully
      if (result.error && result.error.includes('401')) {
        console.log('[getUserProfile] User not authenticated - clearing cache');
        return null;
      }

      return null;
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

  // Comprehensive Application tracking system - Tracks ALL submission methods
  async setupApplicationTracking() {
    console.log('🎯 [App Tracking] Setting up COMPREHENSIVE application tracking system');
    console.log('📍 [App Tracking] Current site:', this.currentSite);
    console.log('🌐 [App Tracking] URL:', window.location.href);

    // Track form submission state and prevent duplicates
    let lastFormSubmissionTime = 0;
    let currentUrl = window.location.href;
    let trackedApplications = new Set(); // Prevent duplicate tracking
    let pendingSubmission = false; // Track if we're waiting for confirmation

    // Helper to check if should track
    const shouldTrack = () => {
      if (trackedApplications.has(window.location.href) &&
          Date.now() - lastFormSubmissionTime < 60000) {
        console.log('[App Tracking] ⏭️ Already tracked this URL recently - skipping');
        return false;
      }
      return true;
    };

    // Helper to mark as tracked
    const markAsTracked = () => {
      lastFormSubmissionTime = Date.now();
      trackedApplications.add(window.location.href);
      pendingSubmission = true;
      console.log('[App Tracking] 🎯 Submission pending - observers activated');
    };

    // Helper to reset tracking state (critical for re-arming)
    const resetTrackingState = (success = true) => {
      pendingSubmission = false;

      // If tracking failed, remove from tracked set so retry is allowed
      if (!success && currentUrl) {
        trackedApplications.delete(currentUrl);
        console.log('[App Tracking] ⚠️ Tracking FAILED - URL removed from cache, retry allowed');
      }

      console.log(`[App Tracking] ♻️ Tracking state reset (${success ? 'SUCCESS' : 'FAILURE'}) - ready for next submission`);
    };

    // LAYER 1: Form submit events (most reliable)
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      console.log('[App Tracking] 📝 FORM SUBMIT event detected:', {
        action: form.action,
        method: form.method,
        url: window.location.href
      });

      if (this.isJobApplicationForm(form)) {
        if (!shouldTrack()) return;

        console.log('[App Tracking] ✅ Job application form identified');
        markAsTracked();

        setTimeout(async () => {
          console.log('[App Tracking] Executing delayed tracking from FORM SUBMIT...');
          let success = false;
          try {
            const result = await this.trackApplicationSubmission();
            success = result && result.success;
          } catch (error) {
            console.error('[App Tracking] Tracking error:', error);
            success = false;
          } finally {
            resetTrackingState(success);
          }
        }, 2000);
      }
    }, true); // Use capture phase

    // LAYER 2: Submit button click tracking (catches SPA submissions)
    document.addEventListener('click', async (e) => {
      const target = e.target;
      const button = target.closest('button, input[type="submit"], a[role="button"]');

      if (button && this.isSubmissionButton(button)) {
        console.log('[App Tracking] 🖱️ SUBMIT BUTTON clicked:', {
          text: button.textContent?.substring(0, 50),
          type: button.type,
          class: button.className
        });

        // Check if we're on a job application page
        if (this.isJobApplicationPage()) {
          if (!shouldTrack()) return;

          console.log('[App Tracking] ✅ Submit button on job application page');
          markAsTracked();

          // Track after delay to allow submission to process
          setTimeout(async () => {
            console.log('[App Tracking] Executing delayed tracking from BUTTON CLICK...');
            let success = false;
            try {
              const result = await this.trackApplicationSubmission();
              success = result && result.success;
            } catch (error) {
              console.error('[App Tracking] Tracking error:', error);
              success = false;
            } finally {
              resetTrackingState(success);
            }
          }, 3000); // Longer delay for SPA submissions
        }
      }
    }, true);

    // LAYER 3: Success confirmation observers (watches for success modals/messages)
    const successObserver = new MutationObserver((mutations) => {
      if (!pendingSubmission) return; // Only check if we're expecting a submission

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              const text = node.textContent?.toLowerCase() || '';

              // Check for success confirmation messages
              const successPatterns = [
                'application submitted',
                'application received',
                'thank you for applying',
                'successfully submitted',
                'application sent',
                'we received your application',
                'application complete'
              ];

              const hasSuccessMessage = successPatterns.some(pattern => text.includes(pattern));

              if (hasSuccessMessage) {
                console.log('[App Tracking] 🎉 SUCCESS MESSAGE detected:', text.substring(0, 100));

                // Use XPath detector if available for more precise confirmation
                if (this.xpathDetector) {
                  const xpathSuccess = this.xpathDetector.checkSubmissionSuccess();
                  if (xpathSuccess) {
                    console.log('[App Tracking] ✅ XPath confirmed success');
                  }
                }

                setTimeout(async () => {
                  console.log('[App Tracking] Executing delayed tracking from SUCCESS MESSAGE...');
                  let success = false;
                  try {
                    const result = await this.trackApplicationSubmission();
                    success = result && result.success;
                  } catch (error) {
                    console.error('[App Tracking] Tracking error:', error);
                    success = false;
                  } finally {
                    resetTrackingState(success);
                  }
                }, 1000);
              }
            }
          }
        }
      }
    });

    successObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    this.observers.push(successObserver);

    // LAYER 4: URL change detection (for redirect after submission)
    let previousUrl = window.location.href;
    const urlCheckInterval = setInterval(() => {
      if (window.location.href !== previousUrl) {
        const newUrl = window.location.href.toLowerCase();

        // Check if redirected to confirmation page
        const confirmationUrls = [
          'confirmation',
          'thank-you',
          'application-submitted',
          'success',
          'applied'
        ];

        const isConfirmationUrl = confirmationUrls.some(pattern => newUrl.includes(pattern));

        if (isConfirmationUrl && pendingSubmission) {
          console.log('[App Tracking] 🔄 URL CHANGED to confirmation page:', newUrl);

          setTimeout(async () => {
            console.log('[App Tracking] Executing delayed tracking from URL CHANGE...');
            let success = false;
            try {
              const result = await this.trackApplicationSubmission();
              success = result && result.success;
            } catch (error) {
              console.error('[App Tracking] Tracking error:', error);
              success = false;
            } finally {
              resetTrackingState(success);
            }
          }, 1500);
        }

        previousUrl = window.location.href;
      }
    }, 1000);

    // LAYER 5: LinkedIn Easy Apply specific tracking
    if (window.location.hostname.includes('linkedin.com')) {
      console.log('[App Tracking] 🔵 LinkedIn detected - setting up Easy Apply tracking');

      // Watch for Easy Apply modal success
      const linkedInObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1 && node.classList?.contains('artdeco-modal')) {
                const modalText = node.textContent?.toLowerCase() || '';

                if (modalText.includes('application was sent') ||
                    modalText.includes('your application was sent to')) {
                  console.log('[App Tracking] ✅ LinkedIn Easy Apply SUCCESS detected');

                  if (shouldTrack()) {
                    markAsTracked();
                    setTimeout(async () => {
                      console.log('[App Tracking] Executing tracking from LINKEDIN SUCCESS...');
                      let success = false;
                      try {
                        const result = await this.trackApplicationSubmission();
                        success = result && result.success;
                      } catch (error) {
                        console.error('[App Tracking] Tracking error:', error);
                        success = false;
                      } finally {
                        resetTrackingState(success);
                      }
                    }, 1000);
                  }
                }
              }
            }
          }
        }
      });

      linkedInObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      this.observers.push(linkedInObserver);
    }

    // Clean up old tracked applications every 5 minutes
    setInterval(() => {
      const oldSize = trackedApplications.size;
      trackedApplications.clear();
      console.log(`[App Tracking] 🧹 Cleanup: Cleared ${oldSize} tracked applications from cache`);
    }, 300000);

    console.log('✅ [App Tracking] Comprehensive tracking system active with 5 detection layers:');
    console.log('   1️⃣ Form submit events');
    console.log('   2️⃣ Submit button clicks');
    console.log('   3️⃣ Success message observers');
    console.log('   4️⃣ URL change detection');
    console.log('   5️⃣ Platform-specific tracking (LinkedIn, Workday, etc.)');
  }

  isJobApplicationForm(form) {
    if (!form) return false;

    // Handle both FORM elements and form-like containers (for SPAs)
    const isFormElement = form.tagName === 'FORM';
    const hasFormRole = form.getAttribute('role') === 'form';

    if (!isFormElement && !hasFormRole) {
      // Check if parent is a form
      const parentForm = form.closest('form');
      if (parentForm) {
        return this.isJobApplicationForm(parentForm);
      }
      return false;
    }

    const formText = form.textContent.toLowerCase();
    const actionUrl = form.action?.toLowerCase() || '';
    const formId = form.id?.toLowerCase() || '';
    const formClass = form.className?.toLowerCase() || '';

    // Check for job application indicators
    const hasApplyKeyword = formText.includes('apply') ||
                           formText.includes('application') ||
                           formText.includes('submit application') ||
                           actionUrl.includes('apply') ||
                           actionUrl.includes('application') ||
                           formId.includes('apply') ||
                           formId.includes('application') ||
                           formClass.includes('apply') ||
                           formClass.includes('application');

    // Check for resume/CV upload fields (strong indicator)
    const hasResumeField = form.querySelector('input[type="file"][accept*="pdf"], input[name*="resume"], input[name*="cv"], input[id*="resume"]');

    // Check for cover letter field (strong indicator)
    const hasCoverLetterField = form.querySelector('textarea[name*="cover"], textarea[id*="cover"], textarea[placeholder*="cover"]');

    // LinkedIn Easy Apply specific
    const isLinkedInEasyApply = form.closest('[data-test-modal="jobs-easy-apply-modal"]') ||
                                form.classList.contains('jobs-easy-apply-modal') ||
                                formClass.includes('easy-apply');

    // Workday specific
    const isWorkdayApplication = form.hasAttribute('data-automation-id') ||
                                 formClass.includes('workday');

    return hasApplyKeyword || hasResumeField || hasCoverLetterField || isLinkedInEasyApply || isWorkdayApplication;
  }

  isSubmissionButton(button) {
    if (!button) return false;

    const buttonText = button.textContent?.toLowerCase() || '';
    const buttonValue = button.value?.toLowerCase() || '';
    const buttonClass = button.className?.toLowerCase() || '';
    const buttonId = button.id?.toLowerCase() || '';

    const submitKeywords = [
      'submit application', 'apply now', 'submit', 'apply', 'send application',
      'continue to apply', 'complete application', 'finish'
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
      console.log('[TRACK] Starting application tracking...');
      console.log('[TRACK] Current URL:', window.location.href);
      console.log('[TRACK] Platform:', this.detectPlatform(window.location.hostname));

      // Double-check this is actually a job application submission
      if (!this.isJobApplicationPage()) {
        console.log('[TRACK] Not a job application page - skipping');
        return { success: false, reason: 'Not a job application page' };
      }

      // Extract job details with retry logic
      let jobData = await this.extractJobDetails();
      console.log('[TRACK] Extracted job data:', jobData);

      // If extraction failed, try one more time after a short delay
      if (!jobData.success || !jobData.jobData) {
        console.log('[TRACK] First extraction failed, retrying in 1 second...');
        await this.delay(1000);
        jobData = await this.extractJobDetails();
        console.log('[TRACK] Retry result:', jobData);
      }

      if (jobData.success && jobData.jobData && jobData.jobData.title) {
        const trackingData = {
          jobTitle: jobData.jobData.title,
          company: jobData.jobData.company || 'Unknown Company',
          location: jobData.jobData.location || '',
          jobUrl: window.location.href,
          status: 'applied',
          source: 'extension',
          platform: this.detectPlatform(window.location.hostname),
          appliedDate: new Date().toISOString(),
          jobType: jobData.jobData.jobType || null,
          workMode: jobData.jobData.workMode || null
        };

        console.log('[TRACK] Sending to background script:', trackingData);

        try {
          const response = await chrome.runtime.sendMessage({
            action: 'trackApplication',
            data: trackingData
          });

          console.log('[TRACK] Background response:', response);

          if (response && response.success) {
            // Only log to console - don't show notification to reduce spam
            console.log('[TRACK] ✅ Application saved to database');
            console.log('[TRACK] Application ID:', response.applicationId || response.application?.id);
            return { success: true, application: response.application };
          } else {
            const errorMsg = response?.error || 'Unknown error';
            console.error('[TRACK] ❌ Tracking failed:', errorMsg);
            // Only show notification if it's a real error (not duplicate)
            if (!errorMsg.includes('already tracked') && !errorMsg.includes('duplicate')) {
              this.showNotification(`⚠️ Tracking failed: ${errorMsg}`, 'error');
            }
            return { success: false, error: errorMsg };
          }
        } catch (runtimeError) {
          // Handle extension context errors
          if (runtimeError.message?.includes('Extension context invalidated') ||
              runtimeError.message?.includes('Could not establish connection')) {
            console.error('[TRACK] ❌ Extension needs reload. Please refresh the page.');
            this.showNotification('⚠️ Extension needs reload. Refresh page to continue.', 'error');
            return { success: false, error: 'Extension context invalidated' };
          }
          throw runtimeError;
        }
      } else {
        const reason = 'Could not extract job title or company';
        console.log('[TRACK] Invalid job data - cannot track:', reason);
        console.log('[TRACK] Job data details:', {
          success: jobData.success,
          hasJobData: !!jobData.jobData,
          title: jobData.jobData?.title,
          company: jobData.jobData?.company
        });
        return { success: false, reason };
      }
    } catch (error) {
      console.error('[TRACK] ❌ Failed to track application:', error);
      console.error('[TRACK] Error stack:', error.stack);

      // Show user-friendly error
      let errorMessage = 'Failed to track application';
      if (error.message?.includes('not authenticated')) {
        errorMessage = 'Please log into AutoJobr first';
      } else if (error.message?.includes('Extension context')) {
        errorMessage = 'Extension needs reload. Refresh page.';
      }

      this.showNotification(`❌ ${errorMessage}`, 'error');
      return { success: false, error: error.message };
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
      'indeed.com': 'Indeed',
      'glassdoor.com': 'Glassdoor',
      'ziprecruiter.com': 'ZipRecruiter',
      'monster.com': 'Monster',
      'greenhouse.io': 'Greenhouse',
      'lever.co': 'Lever',
      'workday.com': 'Workday',
      'myworkdayjobs.com': 'Workday'
    };

    for (const [domain, platform] of Object.entries(platformMap)) {
      if (hostname.includes(domain)) {
        return platform;
      }
    }

    return 'Other';
  }

  extractCompanyFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      const domainParts = hostname.split('.');
      let company = domainParts[0];

      // Exclude common job boards
      const jobBoards = ['linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter', 'greenhouse', 'lever', 'workday'];
      if (jobBoards.includes(company.toLowerCase())) {
        return null;
      }

      // Capitalize first letter
      return company.charAt(0).toUpperCase() + company.slice(1);
    } catch (e) {
      return null;
    }
  }


  // Create floating button that opens extension popup
  createFloatingButton() {
    // Show on any job page, not just application forms
    if (!this.isJobPage()) {
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

    // RELAXED LinkedIn detection - focus on URL patterns, not DOM (DOM may load later)
    if (hostname.includes('linkedin.com')) {
      const isJobsPage = url.includes('/jobs/view/') ||
                         url.includes('/jobs/collections/') ||
                         url.includes('/jobs/apply/') ||
                         url.includes('currentjobid=');
      const isFeedPage = url.includes('/feed/') ||
                         url.includes('/mynetwork/') ||
                         url === 'https://www.linkedin.com/';

      return isJobsPage && !isFeedPage;
    }

    // RELAXED Workday detection - URL-based (forms load dynamically)
    if (hostname.includes('myworkdayjobs.com') || hostname.includes('workday.com')) {
      return url.includes('/job/') || url.includes('/application/');
    }

    // RELAXED Indeed detection - URL-based
    if (hostname.includes('indeed.com')) {
      return url.includes('/viewjob') || url.includes('/apply/');
    }

    // Greenhouse
    if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
      return url.includes('/jobs/') || url.includes('/application/');
    }

    // Lever
    if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
      return url.includes('/jobs/') || url.includes('/apply/');
    }

    // AshbyHQ
    if (hostname.includes('ashbyhq.com') || hostname.includes('jobs.ashbyhq.com')) {
      return true; // All pages on Ashby are job-related
    }

    // Generic detection for other sites - more relaxed
    const hasJobKeywords = url.includes('/job') ||
                          url.includes('/career') ||
                          url.includes('/apply') ||
                          url.includes('/application');

    if (hasJobKeywords) {
      return true; // Let the form handler decide if it's actually a job form
    }

    // Fallback: check DOM for job application indicators
    const hasJobForm = document.querySelectorAll('input[type="file"][accept*="pdf"], input[name*="resume"], textarea[name*="cover"]').length > 0;
    return hasJobForm;
  }

  // Setup automatic job analysis when new pages load - prevent duplicates
  setupAutoAnalysis() {
    console.log('🎯 Setting up automatic job analysis with debouncing');

    // Debounced analysis function to prevent multiple calls
    this.debouncedAnalysis = this.debounce(() => {
      const currentUrl = window.location.href;

      // Skip if already analyzing this URL
      if (this.analysisInProgress || this.lastAnalysisUrl === currentUrl) {
        console.log('🔄 Skipping duplicate analysis for:', currentUrl);
        return;
      }

      this.lastAnalysisUrl = currentUrl;
      this.analysisInProgress = true;

      // Clear any cached job data first
      this.currentJobData = null;

      // Check if this is a job page
      if (this.isJobPage()) {
        console.log('📍 Job page detected:', currentUrl);

        // Inject LinkedIn buttons immediately (Auto Apply button shows up right away)
        if (window.location.hostname.includes('linkedin.com')) {
          setTimeout(() => {
            this.injectLinkedInButtons(null); // Inject Auto Apply button without score first
          }, 500);
        }

        // Don't auto-show widget - let user click the floating button instead

        // Start job detection and analysis silently
        this.detectJobPosting().then((result) => {
          if (result && result.success) {
            console.log('✅ Job detected successfully, updating match score silently');
            this.updateJobInfo(result.jobData);
            // Perform auto-analysis after successful detection
            setTimeout(() => {
              this.performAutoAnalysis().finally(() => {
                this.analysisInProgress = false;
              });
            }, 1000);
          } else {
            console.log('⚠️ Job detection failed but Auto Apply button still available');
            this.analysisInProgress = false;
          }
        }).catch((error) => {
          console.log('❌ Job detection error:', error);
          this.analysisInProgress = false;
        });
      } else {
        this.hideWidget();
        this.analysisInProgress = false;
      }
    }, 2000); // 2 second debounce

    // Initial analysis
    setTimeout(() => {
      this.debouncedAnalysis();
    }, 1500);

    // Watch for URL changes (SPA navigation)
    let currentUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('🔄 URL changed to:', currentUrl);
        this.debouncedAnalysis();
      }
    });

    urlObserver.observe(document.body, { childList: true, subtree: true });
    this.observers.push(urlObserver);
  }

  // Debounce utility function
  debounce(func, wait) {
    return (...args) => {
      clearTimeout(this.analysisDebounceTimer);
      this.analysisDebounceTimer = setTimeout(() => func.apply(this, args), wait);
    };
  }

  async performAutoAnalysis() {
    try {
      console.log('🎯 Starting fresh automatic job analysis');

      // Always extract fresh job data
      const jobData = this.extractJobData();
      if (!jobData || !jobData.title) {
        console.log('No job data found for analysis');
        return;
      }

      console.log('📋 Fresh job data extracted:', {
        title: jobData.title,
        company: jobData.company,
        hasDescription: !!jobData.description
      });

      // Get fresh user profile with auth caching
      const now = Date.now();
      if (now - this.lastAuthCheck < 60000 && !this.cachedProfile) { // 1 minute cooldown
        console.log('User not authenticated - skipping auto analysis (cached)');
        return;
      }

      const profile = await this.getUserProfile();
      if (!profile || !profile.authenticated) {
        console.log('User not authenticated - skipping auto analysis');
        this.lastAuthCheck = now; // Cache auth check to prevent spam
        return;
      }

      console.log('👤 Fresh user profile retrieved:', {
        skillsCount: profile.skills?.length || 0,
        title: profile.professionalTitle
      });

      // Perform enhanced job analysis with fresh data (automatic - no notifications)
      const analysis = await this.analyzeJobWithAPI(jobData, profile, true); // Pass true for automatic
      if (analysis) {
        console.log('✅ Fresh analysis completed - match score:', analysis.matchScore);

        // Update widget and show it automatically on job pages
        this.updateJobMatch(analysis);
        this.showWidget(); // Auto-show widget on job pages
        console.log('✅ Widget auto-opened with match score:', analysis.matchScore);
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

    // LinkedIn job extraction - Updated for 2025 DOM structure
    if (hostname.includes('linkedin.com')) {
      jobData.title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, .top-card-layout__title, h1.t-24, .base-search-card__title')?.textContent?.trim() || '';
      jobData.company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .topcard__org-name-link, .base-search-card__subtitle')?.textContent?.trim() || '';
      jobData.location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, .topcard__flavor--bullet, .job-search-card__location')?.textContent?.trim() || '';
      jobData.description = document.querySelector('.jobs-description__content, .jobs-description-content__text, .description__text, .show-more-less-html__markup')?.textContent?.trim() || '';
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
      jobData.description = document.querySelector('.description, .job-desc, [class*="description"]')?.textContent?.trim() || '';
    }

    return jobData.title ? jobData : null;
  }

  async analyzeJobWithAPI(jobData, userProfile, isAutomatic = false) {
    try {
      // Use background script for authentication instead of direct API calls
      const result = await chrome.runtime.sendMessage({
        action: 'analyzeJob',
        data: {
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
          userProfile,
          source: isAutomatic ? 'extension_automatic_popup' : 'manual_analysis'
        }
      });

      if (result && result.success) {
        return result.analysis;
      } else {
        console.error('Job analysis failed:', result?.error || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Job analysis API error:', error);
      return null;
    }
  }

  injectLinkedInButtons(analysis) {
    // Only inject on LinkedIn job pages
    if (!window.location.hostname.includes('linkedin.com') || !this.isJobPage()) {
      return;
    }

    const score = analysis ? (analysis.matchScore || analysis.analysis?.matchScore || 0) : 0;
    const scoreText = `${Math.round(score)}% Match`;

    // Find the Save button on LinkedIn
    const saveButton = document.querySelector('[aria-label*="Save"]') ||
                      document.querySelector('button.jobs-save-button') ||
                      document.querySelector('[data-control-name*="save"]');

    if (!saveButton) {
      console.log('⚠️ Save button not found - cannot inject AutoJobr buttons');
      return;
    }

    // Remove existing buttons if present
    const existingBadge = document.getElementById('autojobr-match-badge');
    const existingAutoApply = document.getElementById('autojobr-auto-apply-btn');
    if (existingBadge) existingBadge.remove();
    if (existingAutoApply) existingAutoApply.remove();

    // Ensure parent container can hold flex items
    const buttonContainer = saveButton.parentElement;
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '8px';

    // 1. Create Match Score Badge
    if (analysis && score > 0) {
      const badge = document.createElement('button');
      badge.id = 'autojobr-match-badge';
      badge.className = 'artdeco-button artdeco-button--secondary';
      badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, ${this.getScoreColor(score)} 0%, ${this.getScoreColor(score)}dd 100%);
        color: white !important;
        font-weight: 600;
        font-size: 14px;
        padding: 8px 16px;
        border-radius: 20px;
        margin-left: 8px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        z-index: 999;
        border: none;
      `;
      badge.textContent = scoreText;
      badge.title = `Job Match Score: ${scoreText} - Click to view details`;

      badge.onmouseenter = () => {
        badge.style.transform = 'scale(1.05)';
        badge.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      };
      badge.onmouseleave = () => {
        badge.style.transform = 'scale(1)';
        badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      };

      badge.onclick = () => {
        this.showWidget();
        this.updateJobMatch(analysis);
      };

      buttonContainer.appendChild(badge);
    }

    // 2. Create LinkedIn Auto Apply Button
    const autoApplyBtn = document.createElement('button');
    autoApplyBtn.id = 'autojobr-auto-apply-btn';
    autoApplyBtn.className = 'artdeco-button artdeco-button--primary';
    autoApplyBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a66c2 0%, #004182 100%);
      color: white !important;
      font-weight: 600;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 20px;
      margin-left: 8px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
      z-index: 999;
      border: none;
    `;
    autoApplyBtn.innerHTML = '⚡ LinkedIn Auto Apply';
    autoApplyBtn.title = 'Start LinkedIn Auto Apply automation on this jobs page';

    autoApplyBtn.onmouseenter = () => {
      autoApplyBtn.style.transform = 'scale(1.05)';
      autoApplyBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    };
    autoApplyBtn.onmouseleave = () => {
      autoApplyBtn.style.transform = 'scale(1)';
      autoApplyBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    };

    autoApplyBtn.onclick = () => {
      this.startLinkedInAutomation();
    };

    buttonContainer.appendChild(autoApplyBtn);

    // Store analysis data for popup use
    if (analysis) {
      this.currentAnalysis = analysis;
    }

    console.log('✅ LinkedIn Auto Apply and Match Score buttons injected');
  }

  updateFloatingButtonWithAnalysis(analysis) {
    // Call the new unified injection function
    this.injectLinkedInButtons(analysis);
  }

  getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  // Placeholder for getUserApiKey - will fetch from settings
  async getUserApiKey() {
    try {
      const result = await chrome.storage.sync.get(['userApiKey']);
      return result.userApiKey || null;
    } catch (error) {
      console.error('Error getting user API key:', error);
      return null;
    }
  }

  // Get API URL from background script or use fallback
  async getApiUrl() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: 'getApiUrl' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Background script not available, using fallback API URL');
            resolve('https://autojobr.com');
            return;
          }
          if (response && response.apiUrl) {
            resolve(response.apiUrl);
          } else {
            resolve('https://autojobr.com');
          }
        });
      } catch (error) {
        console.error('Error getting API URL:', error);
        resolve('https://autojobr.com');
      }
    });
  }

  // Placeholder for isPremiumUser - will fetch from settings
  async isPremiumUser() {
     try {
      const result = await chrome.storage.sync.get(['premiumFeaturesEnabled']);
      return result.premiumFeaturesEnabled === true;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  // Handle Interview Prep
  async handleInterviewPrep() {
    // Try to extract job data if not available
    if (!this.currentJobData) {
      const jobDataResult = await this.extractJobDetails();
      if (jobDataResult.success && jobDataResult.jobData) {
        this.currentJobData = jobDataResult.jobData;
      } else {
        this.showNotification('No job data found on this page', 'error');
        return;
      }
    }

    try {
      this.updateStatus('🔄 Generating interview prep...', 'loading');

      const response = await chrome.runtime.sendMessage({
        action: 'getInterviewPrep',
        data: {
          jobData: this.currentJobData
        }
      });

      if (response && response.success && response.prep) {
        // Ensure questions is always an array
        if (!Array.isArray(response.prep.questions)) {
          response.prep.questions = [];
        }
        this.displayInterviewPrep(response.prep);
        this.updateStatus('✅ Interview prep ready!', 'success');
        this.showNotification('✅ Interview prep generated!', 'success');
      } else {
        throw new Error(response?.message || 'Failed to generate interview prep');
      }
    } catch (error) {
      console.error('Interview prep error:', error);
      this.showNotification('❌ Interview prep failed: ' + error.message, 'error');
      this.updateStatus('❌ Interview prep failed', 'error');
    }
  }

  // Handle Salary Insights
  async handleSalaryInsights() {
    if (!this.currentJobData) {
      this.showNotification('No job data found on this page', 'error');
      return;
    }

    try {
      this.updateStatus('🔄 Fetching salary insights...', 'loading');

      const userProfile = await this.getUserProfile();
      const result = await chrome.runtime.sendMessage({
        action: 'getSalaryInsights',
        data: {
          jobData: this.currentJobData,
          userProfile: userProfile
        }
      });

      if (result && result.success) {
        this.showSalaryInsightsModal(result.insights);
        this.updateStatus('✅ Salary insights ready!', 'success');
      } else {
        throw new Error('Failed to get salary insights');
      }
    } catch (error) {
      console.error('Salary insights error:', error);
      this.showNotification('❌ Failed to get salary insights', 'error');
      this.updateStatus('❌ Salary insights failed', 'error');
    }
  }

  // Handle Referral Finder
  async handleReferralFinder() {
    if (!this.currentJobData) {
      this.showNotification('No job data found on this page', 'error');
      return;
    }

    try {
      this.updateStatus('🔄 Finding referrals...', 'loading');

      const userProfile = await this.getUserProfile();
      const result = await chrome.runtime.sendMessage({
        action: 'findReferrals',
        data: {
          jobData: this.currentJobData,
          userProfile: userProfile
        }
      });

      if (result && result.success) {
        this.showReferralFinderModal(result);
        this.updateStatus('✅ Referrals found!', 'success');
      } else {
        throw new Error('Failed to find referrals');
      }
    } catch (error) {
      console.error('Referral finder error:', error);
      this.showNotification('❌ Failed to find referrals', 'error');
      this.updateStatus('❌ Referral search failed', 'error');
    }
  }

  // Show Interview Prep Modal
  showInterviewPrepModal(prep) {
    // Ensure questions is always an array
    const questions = Array.isArray(prep.questions) ? prep.questions : 
                     (prep.questions ? [prep.questions] : [
                       'Tell me about yourself',
                       'Why do you want to work here?',
                       'Describe a challenging situation',
                       'What are your strengths and weaknesses?',
                       'Do you have any questions for the interviewer?'
                     ]);

    const modal = document.createElement('div');
    modal.className = 'autojobr-modal-overlay';
    modal.innerHTML = `
      <div class="autojobr-modal">
        <div class="autojobr-modal-header">
          <h3>🎯 Interview Preparation</h3>
          <button class="autojobr-modal-close">×</button>
        </div>
        <div class="autojobr-modal-content">
          <div class="prep-section">
            <h4>Company Insights</h4>
            <p>${prep.companyInsights || 'Research the company culture and recent news'}</p>
          </div>
          <div class="prep-section">
            <h4>Common Interview Questions</h4>
            <ul class="prep-questions">
              ${questions.map(q => `<li>${String(q)}</li>`).join('')}
            </ul>
          </div>
          <div class="prep-section">
            <h4>Preparation Tips</h4>
            <p>${prep.tips || 'Practice STAR method for behavioral questions'}</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.autojobr-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => e.target === modal && modal.remove());
  }

  // Show Salary Insights Modal
  showSalaryInsightsModal(insights) {
    // Handle both old and new API response formats
    const estimatedSalary = insights.totalCompensation || insights.estimatedSalary || 0;
    const minSalary = insights.salaryRange?.min || 0;
    const maxSalary = insights.salaryRange?.max || insights.salaryRange?.median || 0;
    const currency = insights.currency || 'USD';
    const currencySymbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

    const modal = document.createElement('div');
    modal.className = 'autojobr-modal-overlay';
    modal.innerHTML = `
      <div class="autojobr-modal">
        <div class="autojobr-modal-header">
          <h3>💰 Salary Insights</h3>
          <button class="autojobr-modal-close">×</button>
        </div>
        <div class="autojobr-modal-content">
          <div class="salary-highlight">
            <div class="salary-amount">${currencySymbol}${estimatedSalary?.toLocaleString()}</div>
            <div class="salary-label">Estimated Annual Salary</div>
          </div>
          <div class="prep-section">
            <h4>Salary Range</h4>
            <div class="salary-range">
              <span>Min: ${currencySymbol}${minSalary?.toLocaleString()}</span>
              <span>Max: ${currencySymbol}${maxSalary?.toLocaleString()}</span>
            </div>
          </div>
          <div class="prep-section">
            <h4>Negotiation Tips</h4>
            <ul>
              ${(insights.negotiationTips || []).map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.autojobr-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => e.target === modal && modal.remove());
  }

  // Show Referral Finder Modal
  showReferralFinderModal(data) {
    const modal = document.createElement('div');
    modal.className = 'autojobr-modal-overlay';
    modal.innerHTML = `
      <div class="autojobr-modal">
        <div class="autojobr-modal-header">
          <h3>🤝 Referral Opportunities</h3>
          <button class="autojobr-modal-close">×</button>
        </div>
        <div class="autojobr-modal-content">
          <div class="referral-stats">
            <div class="stat-highlight">${data.totalFound || 0}</div>
            <div class="stat-label">Potential Referrers Found</div>
          </div>
          <div class="prep-section">
            ${(data.referrals || []).slice(0, 5).map(ref => `
              <div class="referral-card">
                <div class="referral-name">${ref.name || 'Employee'}</div>
                <div class="referral-title">${ref.title || 'Position'}</div>
                <div class="referral-match">${ref.score || 0}% Match</div>
              </div>
            `).join('')}
          </div>
          <div class="prep-section">
            <h4>💡 Recommendation</h4>
            <p>Start with high-priority connections (alumni, former colleagues). Personalize your message mentioning shared experiences.</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.autojobr-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => e.target === modal && modal.remove());
  }

  // Update status helper
  updateStatus(message, type = 'info') {
    const statusEl = document.querySelector('.status-text');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  // Handle resume upload functionality
  async handleResumeUpload() {
    try {
      const status = document.getElementById('autojobr-status');
      this.updateStatus('🔄 Fetching your resume...', 'loading');

      // Get user's active resume from server
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/resumes/active`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        this.updateStatus('❌ No resume found. Please upload one in your dashboard.', 'error');
        return;
      }

      // Get the resume as blob
      const resumeBlob = await response.blob();
      const fileName = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'resume.pdf';

      // Find file input fields on the page
      const fileInputs = this.findResumeFields();

      if (fileInputs.length === 0) {
        this.updateStatus('❌ No file upload fields found on this page.', 'error');
        return;
      }

      // Create File object from blob
      const resumeFile = new File([resumeBlob], fileName, { type: resumeBlob.type });

      // Upload to all found file inputs
      let uploadCount = 0;
      for (const input of fileInputs) {
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(resumeFile);
          input.files = dataTransfer.files;

          // Trigger change event
          input.dispatchEvent(new Event('change', { bubbles: true }));
          uploadCount++;
        } catch (error) {
          console.error('Failed to upload to input:', error);
        }
      }

      if (uploadCount > 0) {
        this.updateStatus(`✅ Resume uploaded to ${uploadCount} field(s)`, 'success');
      } else {
        this.updateStatus('❌ Failed to upload resume to any fields', 'error');
      }

    } catch (error) {
      console.error('Resume upload error:', error);
      this.updateStatus('❌ Resume upload failed', 'error');
    }
  }

  // Find resume/file upload fields
  findResumeFields() {
    const fileInputs = [];

    // Look for file inputs with resume-related attributes
    const inputs = document.querySelectorAll('input[type="file"]');

    inputs.forEach(input => {
      const inputText = (
        input.name + ' ' +
        input.id + ' ' +
        input.className + ' ' +
        (input.placeholder || '') + ' ' +
        (input.getAttribute('aria-label') || '') + ' ' +
        (input.getAttribute('data-automation-id') || '')
      ).toLowerCase();

      const resumeKeywords = ['resume', 'cv', 'curriculum', 'document', 'file', 'attachment', 'upload'];

      if (resumeKeywords.some(keyword => inputText.includes(keyword))) {
        fileInputs.push(input);
      }
    });

    // If no specific resume fields found, return all file inputs
    if (fileInputs.length === 0) {
      return Array.from(inputs);
    }

    return fileInputs;
  }

  // Load and display user tasks
  async loadUserTasks() {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/reminders/pending`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated - skipping task load');
          return;
        }
        console.error('Task API error:', response.status, response.statusText);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON response but got:', contentType);
        return;
      }

      const data = await response.json();
      if (data.success && data.reminders && data.reminders.length > 0) {
        this.displayTasks(data.reminders);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  // Display tasks in the widget
  displayTasks(reminders) {
    const tasksSection = document.getElementById('autojobr-tasks');
    const tasksCount = document.getElementById('tasks-count');
    const tasksList = document.getElementById('tasks-list');

    if (!tasksSection || !tasksCount || !tasksList) return;

    tasksCount.textContent = reminders.length;
    tasksSection.style.display = 'block';

    tasksList.innerHTML = '';

    reminders.forEach(reminder => {
      const taskElement = document.createElement('div');
      taskElement.className = 'task-item';
      taskElement.innerHTML = `
        <div class="task-content">
          <div class="task-title">${reminder.taskTitle}</div>
          <div class="task-time">${this.formatRelativeTime(reminder.triggerDateTime)}</div>
        </div>
        <div class="task-actions">
          <button class="task-complete" data-task-id="${reminder.taskId}" title="Mark Complete">✓</button>
          <button class="task-snooze" data-reminder-id="${reminder.reminderId}" title="Snooze 15 min">💤</button>
        </div>
      `;

      // Add event listeners
      taskElement.querySelector('.task-complete')?.addEventListener('click', (e) => {
        this.markTaskComplete(reminder.taskId);
        taskElement.remove();
      });

      taskElement.querySelector('.task-snooze')?.addEventListener('click', (e) => {
        this.snoozeReminder(reminder.reminderId);
        taskElement.remove();
      });

      tasksList.appendChild(taskElement);
    });
  }

  // Mark task as complete
  async markTaskComplete(taskId) {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' })
      });

      if (response.ok) {
        this.updateTaskCount(-1);
      } else {
        console.error('Failed to mark task complete:', response.status);
      }
    } catch (error) {
      console.error('Failed to mark task complete:', error);
    }
  }

  // Snooze reminder
  async snoozeReminder(reminderId) {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/api/reminders/${reminderId}/snooze`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ snoozeMinutes: 15 })
      });

      if (response.ok) {
        this.updateTaskCount(-1);
      } else {
        console.error('Failed to snooze reminder:', response.status);
      }
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  }

  // Update task count
  updateTaskCount(delta) {
    const tasksCount = document.getElementById('tasks-count');
    if (tasksCount) {
      const current = parseInt(tasksCount.textContent) || 0;
      const newCount = Math.max(0, current + delta);
      tasksCount.textContent = newCount;

      if (newCount === 0) {
        document.getElementById('autojobr-tasks').style.display = 'none';
      }
    }
  }

  // Format relative time
  formatRelativeTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
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

  // LinkedIn Easy Apply Automation
  async startLinkedInAutomation() {
    if (!window.location.hostname.includes('linkedin.com')) {
      this.showNotification('❌ Please navigate to LinkedIn jobs page first', 'error');
      return;
    }

    // Check user's subscription tier and usage
    const userProfile = await this.getUserProfile();
    if (!userProfile) {
      this.showNotification('❌ Please sign in to use automation', 'error');
      return;
    }

    // Determine max pages based on subscription
    this.maxPages = userProfile.subscriptionTier === 'premium' ? 5 : 1;

    this.automationRunning = true;
    this.applicationsSubmitted = 0;
    this.applicationsSkipped = 0;
    this.currentPage = 1;

    // Update UI to show automation is running
    const statusDiv = document.getElementById('autojobr-automation-status');
    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = `
        <div class="automation-progress">
          <div class="progress-text">🤖 LinkedIn Auto-Apply Running...</div>
          <div class="progress-stats">
            Applications: <span id="apps-count">0</span> |
            Skipped: <span id="skip-count">0</span> |
            Page: <span id="page-count">1</span>/${this.maxPages}
          </div>
          <button class="btn-danger" id="stop-automation">Stop Automation</button>
        </div>
      `;

      document.getElementById('stop-automation')?.addEventListener('click', () => {
        this.stopLinkedInAutomation();
      });
    }

    // Start processing jobs
    try {
      for (this.currentPage = 1; this.currentPage <= this.maxPages && this.automationRunning; this.currentPage++) {
        await this.processJobsOnCurrentPage(userProfile);

        // Navigate to next page if not last
        if (this.currentPage < this.maxPages && this.automationRunning) {
          await this.navigateToNextPage();
          await this.delay(3000); // Wait for page load
        }
      }

      // Show completion message
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="automation-complete">
            <h3>✅ Automation Complete!</h3>
            <div class="final-stats">
              <p>Applications Submitted: ${this.applicationsSubmitted}</p>
              <p>Jobs Skipped: ${this.applicationsSkipped}</p>
              <p>Pages Processed: ${this.currentPage - 1}</p>
            </div>
          </div>
        `;
      }

      this.showNotification(`✅ Applied to ${this.applicationsSubmitted} jobs!`, 'success');
    } catch (error) {
      console.error('LinkedIn automation error:', error);
      this.showNotification('❌ Automation failed: ' + error.message, 'error');
    } finally {
      this.automationRunning = false;
    }
  }

  stopLinkedInAutomation() {
    this.automationRunning = false;
    this.showNotification('⏸️ Automation stopped', 'info');
  }

  async processJobsOnCurrentPage(userProfile) {
    // Find all job cards on current page - Updated selectors for current LinkedIn DOM
    const jobCards = document.querySelectorAll(`
      .job-card-container,
      .jobs-search-results__list-item,
      .job-card-container--clickable,
      .jobs-search-two-pane__results-list .scaffold-layout__list-item,
      .jobs-search-results__list-item,
      .jobs-search-results__list .jobs-search-results__list-item,
      [data-job-id]
    `.trim().split(/\s*,\s*/));

    console.log(`🔍 LinkedIn Auto Apply: Checking for jobs on page (found ${jobCards.length} job cards)`);

    if (jobCards.length === 0) {
      console.log('❌ No job cards found on page - Current LinkedIn selectors may have changed');
      this.showNotification('❌ No jobs found on this page. Make sure you\'re on a LinkedIn jobs search page.', 'error');
      return;
    }

    this.showNotification(`📋 Page ${this.currentPage}: Found ${jobCards.length} jobs to process`, 'info');

    for (let i = 0; i < jobCards.length && this.automationRunning; i++) {
      const jobCard = jobCards[i];

      try {
        // Click on job card to view details
        jobCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(1000);
        jobCard.click();
        await this.delay(2000);

        // Check if Easy Apply button exists
        const easyApplyButton = this.findEasyApplyButton();

        if (!easyApplyButton) {
          console.log(`Job ${i + 1}: No Easy Apply - Skipping`);
          this.applicationsSkipped++;
          this.updateAutomationStats();
          continue;
        }

        // Extract job details
        const jobData = this.extractLinkedInJobDetails();
        console.log(`Job ${i + 1}: Processing ${jobData.title} at ${jobData.company}`);

        // Click Easy Apply button
        easyApplyButton.click();
        await this.delay(2000);

        // Fill and submit the application
        const applied = await this.fillAndSubmitLinkedInApplication(userProfile, jobData);

        if (applied) {
          this.applicationsSubmitted++;
          this.showNotification(
            `✅ Applied to ${jobData.title} (${this.applicationsSubmitted} total)`,
            'success'
          );

          // Track application in backend
          await this.trackLinkedInApplication(jobData);
        } else {
          this.applicationsSkipped++;
        }

        this.updateAutomationStats();
        await this.delay(2000); // Delay between applications
      } catch (error) {
        console.error(`Error processing job ${i + 1}:`, error);
        this.applicationsSkipped++;
        this.updateAutomationStats();
      }
    }
  }

  findEasyApplyButton() {
    const selectors = [
      'button[aria-label*="Easy Apply"]',
      'button.jobs-apply-button',
      'button:contains("Easy Apply")',
      '.jobs-apply-button--top-card button'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button && button.textContent.toLowerCase().includes('easy apply')) {
        return button;
      }
    }

    return null;
  }

  extractLinkedInJobDetails() {
    return {
      title: this.extractText([
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title',
        'h1.t-24'
      ]),
      company: this.extractText([
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name'
      ]),
      location: this.extractText([
        '.job-details-jobs-unified-top-card__bullet',
        '.jobs-unified-top-card__bullet'
      ]),
      url: window.location.href
    };
  }

  async fillAndSubmitLinkedInApplication(userProfile, jobData) {
    try {
      // Wait for modal to appear
      await this.delay(1000);

      // Fill application form
      const result = await this.startSmartAutofill(userProfile);

      if (!result || !result.success) {
        console.log('Failed to fill application form');
        this.closeLinkedInModal();
        return false;
      }

      await this.delay(1000);

      // Look for and click Next/Review/Submit buttons
      let currentStep = 1;
      while (currentStep <= 5 && this.automationRunning) {
        const nextButton = this.findLinkedInNextButton();
        const submitButton = this.findLinkedInSubmitButton();

        if (submitButton && !submitButton.disabled) {
          console.log('✅ Found Submit button - preparing to submit application');

          // Check for validation errors before submitting
          const hasErrors = this.checkLinkedInValidationErrors();
          if (hasErrors) {
            console.log('❌ Validation errors detected - skipping application');
            this.closeLinkedInModal();
            return false;
          }

          // Submit the application
          console.log('📤 Submitting application...');
          submitButton.click();
          await this.delay(2000);
          return true;
        } else if (nextButton && !nextButton.disabled) {
          const buttonText = nextButton.textContent.trim();
          console.log(`➡️ Found "${buttonText}" button on step ${currentStep}`);

          // Check for validation errors before proceeding
          const hasErrors = this.checkLinkedInValidationErrors();
          if (hasErrors) {
            console.log(`❌ Validation errors detected on step ${currentStep} - skipping application`);
            this.closeLinkedInModal();
            return false;
          }

          // Move to next step (could be Next, Continue, or Review)
          console.log(`🔄 Clicking "${buttonText}" button...`);
          nextButton.click();
          await this.delay(1500);

          // Fill new fields on next page
          await this.startSmartAutofill(userProfile);
          await this.delay(1000);
          currentStep++;
        } else {
          console.log('⚠️ No more buttons found - stopping');
          break;
        }
      }

      this.closeLinkedInModal();
      return false;
    } catch (error) {
      console.error('Error filling LinkedIn application:', error);
      this.closeLinkedInModal();
      return false;
    }
  }

  checkLinkedInValidationErrors() {
    // Check for LinkedIn's inline validation errors
    const errorSelectors = [
      '.artdeco-inline-feedback--error',
      '[aria-invalid="true"]',
      '.fb-dash-form-element--error',
      '.jobs-easy-apply-form-element--error'
    ];

    for (const selector of errorSelectors) {
      const errors = document.querySelectorAll(selector);
      if (errors.length > 0) {
        console.log('Found', errors.length, 'validation errors');
        return true;
      }
    }

    return false;
  }

  findLinkedInNextButton() {
    const selectors = [
      'button[aria-label*="Continue"]',
      'button[aria-label*="Review"]',
      'button[aria-label*="Next"]',
      'button.artdeco-button--primary:not([aria-label*="Submit"])'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button && !button.disabled) {
        console.log('✅ Found Next button via selector:', selector, 'Text:', button.textContent.trim());
        return button;
      }
    }

    // Also check button text content for Review, Continue, or Next
    const allButtons = document.querySelectorAll('button.artdeco-button--primary, button.artdeco-button--secondary');
    for (const button of allButtons) {
      const text = button.textContent.toLowerCase().trim();
      const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();

      // Review button is a navigation button (not submit)
      if (text === 'review' || ariaLabel.includes('review')) {
        if (!text.includes('submit') && !ariaLabel.includes('submit') && !button.disabled) {
          console.log('✅ Found Review button:', text);
          return button;
        }
      }

      // Continue or Next buttons
      if ((text.includes('continue') || text.includes('next')) &&
          !text.includes('submit') && !button.disabled) {
        console.log('✅ Found Continue/Next button:', text);
        return button;
      }
    }

    console.log('⚠️ No Next/Review/Continue button found');
    return null;
  }

  findLinkedInSubmitButton() {
    const selectors = [
      'button[aria-label*="Submit application"]',
      'button[aria-label*="Submit"]',
      'button.jobs-apply-button'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button && button.textContent.toLowerCase().includes('submit')) {
        return button;
      }
    }

    return null;
  }

  closeLinkedInModal() {
    const closeButton = document.querySelector('[data-test-modal-close-btn], .artdeco-modal__dismiss');
    if (closeButton) {
      closeButton.click();
    }
  }

  async navigateToNextPage() {
    const nextPageButton = document.querySelector('button[aria-label*="Page"][aria-label*="' + (this.currentPage + 1) + '"]');

    if (nextPageButton) {
      nextPageButton.click();
      return true;
    }

    return false;
  }

  updateAutomationStats() {
    const appsCount = document.getElementById('apps-count');
    const skipCount = document.getElementById('skip-count');
    const pageCount = document.getElementById('page-count');

    if (appsCount) appsCount.textContent = this.applicationsSubmitted;
    if (skipCount) skipCount.textContent = this.applicationsSkipped;
    if (pageCount) pageCount.textContent = this.currentPage;
  }

  async trackLinkedInApplication(jobData) {
    try {
      const apiUrl = await this.getApiUrl();
      await fetch(`${apiUrl}/api/applications`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobData.title,
          company: jobData.company,
          location: jobData.location,
          jobUrl: jobData.url,
          status: 'applied',
          appliedDate: new Date().toISOString(),
          source: 'linkedin_automation'
        })
      });
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }

  // --- New AI Feature Methods ---

  /**
   * Handles the resume generation request.
   */
  async handleResumeGeneration() {
    this.updateStatus('🔄 Fetching job details for resume generation...', 'loading');
    try {
      // Get job description, title, and company from the current page
      const jobInfoResponse = await chrome.runtime.sendMessage({ action: 'getJobDescription' });

      if (!jobInfoResponse || !jobInfoResponse.success) {
        throw new Error(jobInfoResponse?.error || 'Could not get job details from the page.');
      }

      const { jobDescription, jobTitle, company } = jobInfoResponse;
      if (!jobDescription || !jobTitle || !company) {
        throw new Error('Could not extract all required job details. Please ensure you are on a job page.');
      }

      this.updateStatus('✍️ Generating resume with AI...', 'loading');

      // Check if premium features or API key are enabled
      const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
      const premiumAiEnabled = settingsResponse.settings?.premiumFeaturesEnabled;
      const userApiKey = settingsResponse.settings?.userApiKey;

      if (!premiumAiEnabled || !userApiKey) {
        this.showNotification('Please enable Premium AI features and add your API key in the extension settings to generate resumes.', 'warning');
        this.updateStatus('AI features not configured.', 'info');
        return;
      }

      // Call background script to generate resume using Groq API
      const resumeResponse = await chrome.runtime.sendMessage({
        action: 'generateResume',
        data: { jobDescription, jobTitle, company }
      });

      if (resumeResponse.success) {
        // Display the generated resume in a modal or new tab
        this.showResumeModal(resumeResponse.resumeContent);
        this.updateStatus('✅ Resume generated!', 'success');
      } else {
        throw new Error(resumeResponse.error || 'Resume generation failed.');
      }

    } catch (error) {
      console.error('Resume generation failed:', error);
      this.showNotification(`❌ Resume generation failed: ${error.message}`, 'error');
      this.updateStatus('Resume generation failed.', 'error');
    }
  }

  /**
   * Displays the generated resume in a modal.
   * @param {string} resumeContent - The HTML content of the resume.
   */
  showResumeModal(resumeContent) {
    const modal = document.createElement('div');
    modal.className = 'autojobr-modal-overlay';
    modal.innerHTML = `
      <div class="autojobr-modal">
        <div class="autojobr-modal-header">
          <h3>📄 Generated Resume</h3>
          <button class="autojobr-modal-close">×</button>
        </div>
        <div class="autojobr-modal-content">
          <div class="resume-preview">${resumeContent}</div>
        </div>
        <div class="autojobr-modal-footer">
          <button id="autojobr-download-resume" class="autojobr-btn primary">Download</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close modal event
    modal.querySelector('.autojobr-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Download button event
    document.getElementById('autojobr-download-resume')?.addEventListener('click', () => {
      this.downloadResume(resumeContent);
    });
  }

  /**
   * Downloads the generated resume as an HTML file.
   * @param {string} htmlContent - The HTML content of the resume.
   */
  downloadResume(htmlContent) {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_resume.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Handles the 'Ask AI' feature, sending a question to the AI.
   */
  async handleAskAI(data) { // Added data parameter for potential future use
    // Toggle AI chat widget visibility
    const aiWidget = document.getElementById('aiChatWidget');
    if (!aiWidget) {
      console.error('AI Chat widget not found');
      return;
    }

    const isVisible = aiWidget.style.display !== 'none';

    if (isVisible) {
      aiWidget.style.display = 'none';
    } else {
      aiWidget.style.display = 'block';

      // Focus on the AI question input
      setTimeout(() => {
        const aiQuestionInput = document.getElementById('ai-question');
        if (aiQuestionInput) {
          aiQuestionInput.focus();
        }
      }, 100);
    }
  }

  sendMessageToAI() {
    const questionInput = document.getElementById('ai-question');
    const sendBtn = document.getElementById('ai-send-btn');
    const messagesContainer = document.getElementById('ai-chat-messages');

    if (!questionInput || !messagesContainer) return;

    const question = questionInput.value.trim();
    if (!question) return;

    // Display user's question
    const userMessage = document.createElement('div');
    userMessage.className = 'ai-message user-message';
    userMessage.textContent = question;
    messagesContainer.appendChild(userMessage);

    questionInput.value = ''; // Clear input
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom

    // Show loading indicator for AI response
    const aiLoadingMessage = document.createElement('div');
    aiLoadingMessage.className = 'ai-message ai-loading';
    aiLoadingMessage.textContent = 'AI is thinking...';
    messagesContainer.appendChild(aiLoadingMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Disable send button while processing
    if (sendBtn) sendBtn.disabled = true;

    // Call background script to ask AI
    chrome.runtime.sendMessage({
      action: 'askAI',
      data: { question }
    }, async (response) => {
      // Remove loading message
      aiLoadingMessage.remove();

      if (response && response.success) {
        const aiAnswer = response.answer;
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message ai-response';
        aiMessage.textContent = aiAnswer;
        messagesContainer.appendChild(aiMessage);
      } else {
        const errorMessage = response?.error || 'An error occurred. Please try again.';
        const errorMsgElement = document.createElement('div');
        errorMsgElement.className = 'ai-message ai-error';
        errorMsgElement.textContent = `Error: ${errorMessage}`;
        messagesContainer.appendChild(errorMsgElement);
      }
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Re-enable send button
      if (sendBtn) sendBtn.disabled = false;
    });
  }

  /**
   * Displays the AI's answer in a modal.
   * @param {string} question - The user's original question.
   * @param {string} answer - The AI's response.
   */
  showAIResponseModal(question, answer) {
    const modal = document.createElement('div');
    modal.className = 'autojobr-modal-overlay';
    modal.innerHTML = `
      <div class="autojobr-modal">
        <div class="autojobr-modal-header">
          <h3>💬 AI Response</h3>
          <button class="autojobr-modal-close">×</button>
        </div>
        <div class="autojobr-modal-content">
          <div class="ai-question">
            <strong>Your Question:</strong> ${question}
          </div>
          <div class="ai-answer">
            <strong>AI Answer:</strong> ${answer}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.autojobr-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Gets the job description from the current page using the background script.
   * @returns {Promise<{success: boolean, jobDescription?: string, jobTitle?: string, company?: string, error?: string}>}
   */
  async getJobDescriptionForResume() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getJobDescription' });
      if (response && response.success) {
        return { success: true, jobDescription: response.jobDescription, jobTitle: response.jobTitle, company: response.company };
      } else {
        throw new Error(response?.error || 'Failed to get job description.');
      }
    } catch (error) {
      console.error('Error getting job description:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize the content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const extension = new AutoJobrContentScript();
    window.autojobrExtension = extension; // Store reference for message handling
    // Show floating button on job pages after a delay
    setTimeout(() => extension.createFloatingButton(), 1000);
  });
} else {
  const extension = new AutoJobrContentScript();
  window.autojobrExtension = extension; // Store reference for message handling
  // Show floating button on job pages after a delay
  setTimeout(() => extension.createFloatingButton(), 1000);
}

// --- Helper functions for AI Features (must be available globally or passed correctly) ---

// These functions are assumed to be defined elsewhere or globally accessible
// if they are called directly within the content script's methods.
// For example, extractJobDescription, extractJobTitle, extractCompany are
// defined in the background script in the provided changes.
// If they are intended for the content script, they should be moved here.

// --- Moved helper functions from background.js to content.js ---
// Note: These might conflict if background.js also defines them globally.

function extractJobDescription() {
  // Try multiple selectors for job description
  const selectors = [
    '.job-description', '.jobs-description__content', '.jobs-description-content__text',
    '.description', '.job-desc', '.content', '[class*="description"]', '[id*="description"]',
    'article', 'main'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    // Ensure element has substantial text content
    if (element && element.textContent && element.textContent.trim().length > 100) {
      return element.textContent.trim();
    }
  }

  // Fallback: Use a large portion of body text if no specific element is found
  return document.body.textContent ? document.body.textContent.trim().substring(0, 3000) : '';
}

function extractJobTitle() {
  const selectors = [
    'h1', '.job-title', '[class*="job-title"]', '[class*="jobtitle"]', 'h2',
    '.jobs-unified-top-card__job-title', '.job-details-jobs-unified-top-card__job-title'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }

  // Fallback: Use the page title
  return document.title ? document.title.split('|')[0].trim() : '';
}

function extractCompany() {
  const selectors = [
    '.company', '[class*="company"]', '.employer', '[class*="employer"]',
    '.organization-name', '[class*="organization"]',
    '.jobs-unified-top-card__company-name', '.job-details-jobs-unified-top-card__company-name'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }

  return ''; // Return empty string if company not found
}

// Ensure extractJobInfo exists if it was expected elsewhere, though it seems redundant now.
function extractJobInfo() {
  console.warn('extractJobInfo called, but extractJobDescription, extractJobTitle, extractCompany are preferred.');
  return {
    description: extractJobDescription(),
    title: extractJobTitle(),
    company: extractCompany(),
    url: window.location.href
  };
}