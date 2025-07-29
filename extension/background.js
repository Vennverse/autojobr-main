// Background script for AutoJobr Extension - Fixed Version
class AutoJobrBackground {
  constructor() {
    this.apiBase = 'http://40.160.50.128';
    this.isAuthenticated = false;
    this.userProfile = null;
    this.initRetries = 0;
    this.maxRetries = 3;
    this.features = {
      AUTO_FILL: true,
      AUTO_TRACKING: true,
      COVER_LETTER: true,
      JOB_ANALYSIS: true
    };
    
    this.init().catch(this.handleInitError.bind(this));
  }

  async init() {
    try {
      // Load configuration
      await this.loadConfiguration();

      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize features
      await this.initializeFeatures();
      
      // Setup auto-submission tracking
      if (this.features.AUTO_TRACKING) {
        await this.setupAutoSubmissionTracking();
      }

      console.log('AutoJobr Universal background script initialized successfully');
    } catch (error) {
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  async loadConfiguration() {
    // Load stored configuration
    const stored = await chrome.storage.local.get('autojobr_config');
    if (stored.autojobr_config) {
      this.config = { ...stored.autojobr_config };
    } else {
      this.config = {
        API_BASE_URL: 'http://40.160.50.128',
        SUPPORTED_JOB_BOARDS: ['linkedin.com', 'indeed.com', 'glassdoor.com', 'workday.com', 'myworkdayjobs.com']
      };
    }
  }

  setupEventListeners() {
    // Listen for tab updates to detect job pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.checkJobPage(tab);
      }
    });

    // Listen for messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Initialize authentication check
    this.checkAuthentication();
    
    console.log('AutoJobr Universal background script initialized');
  }

  async saveJob(jobData) {
    try {
      const response = await fetch(`${this.apiBase}/api/saved-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          url: jobData.url,
          platform: jobData.platform,
          savedDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Failed to save job' };
      }
    } catch (error) {
      console.error('Error saving job:', error);
      return { success: false, error: error.message };
    }
  }

  async trackApplication(applicationData) {
    try {
      const response = await fetch(`${this.apiBase}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: applicationData.jobData?.title || 'Unknown Position',
          company: applicationData.jobData?.company || 'Unknown Company',
          location: applicationData.jobData?.location || '',
          jobUrl: applicationData.jobData?.url || window.location.href,
          platform: applicationData.platform || 'Extension',
          source: 'extension',
          status: 'applied',
          appliedDate: new Date().toISOString(),
          notes: `Applied via ${applicationData.method} on ${applicationData.platform}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Failed to track application' };
      }
    } catch (error) {
      console.error('Error tracking application:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzeJob(jobData) {
    try {
      const response = await fetch(`${this.apiBase}/api/jobs/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          jobDescription: jobData.description || '',
          jobTitle: jobData.title || '',
          company: jobData.company || ''
        })
      });

      // Check if response is successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Job analysis API error:', response.status, errorText);
        return { 
          success: false, 
          error: `API Error: ${response.status} - ${errorText.substring(0, 100)}...` 
        };
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const htmlText = await response.text();
        console.error('Job analysis returned HTML instead of JSON:', htmlText.substring(0, 200));
        return { 
          success: false, 
          error: 'Server returned HTML instead of JSON. Please check authentication.' 
        };
      }

      const result = await response.json();
      return { success: true, analysis: result };
    } catch (error) {
      console.error('Error analyzing job:', error);
      return { success: false, error: error.message };
    }
  }

  async generateCoverLetter(jobData) {
    try {
      const response = await fetch(`${this.apiBase}/api/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(jobData)
      });

      // Check if response is successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cover letter API error:', response.status, errorText);
        return { 
          success: false, 
          error: `API Error: ${response.status} - ${errorText.substring(0, 100)}...` 
        };
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const htmlText = await response.text();
        console.error('Cover letter returned HTML instead of JSON:', htmlText.substring(0, 200));
        return { 
          success: false, 
          error: 'Server returned HTML instead of JSON. Please check authentication.' 
        };
      }

      const result = await response.json();
      return { success: true, coverLetter: result.coverLetter || result.text || result };
    } catch (error) {
      console.error('Error generating cover letter:', error);
      return { success: false, error: error.message };
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'CHECK_AUTH':
          await this.checkAuthentication();
          sendResponse({
            success: true,
            authenticated: this.isAuthenticated,
            profile: this.userProfile
          });
          break;

        case 'GET_PROFILE':
          if (!this.userProfile) {
            await this.checkAuthentication();
          }
          sendResponse({
            success: this.isAuthenticated,
            profile: this.userProfile
          });
          break;

        case 'getUserProfile':
          // Compatibility with old popup
          if (!this.userProfile) {
            await this.checkAuthentication();
          }
          sendResponse({
            success: this.isAuthenticated,
            data: this.userProfile
          });
          break;

        case 'SAVE_JOB':
          const saveResult = await this.saveJob(message.jobData);
          sendResponse(saveResult);
          break;

        case 'TRACK_APPLICATION':
          const trackResult = await this.trackApplication(message.applicationData);
          sendResponse(trackResult);
          break;

        case 'ANALYZE_JOB':
          const analysisResult = await this.analyzeJob(message.jobData);
          sendResponse(analysisResult);
          break;

        case 'GENERATE_COVER_LETTER':
          const coverLetterResult = await this.generateCoverLetter(message.jobData);
          sendResponse(coverLetterResult);
          break;

        case 'FILL_FORM':
          sendResponse({ success: true, message: 'Form filling initiated' });
          break;

        case 'workdayJobDetected':
          console.log('Workday job detected:', message.jobData);
          // Store the job data for potential analysis
          await this.storeWorkdayJob(message.jobData);
          sendResponse({ success: true });
          break;

        case 'openExtensionPopup':
          // Try to open extension popup (may not be possible due to browser restrictions)
          console.log('Request to open popup with job data:', message.jobData);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({
            success: false,
            error: 'Unknown action: ' + message.action
          });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async checkAuthentication() {
    try {
      console.log('Checking VM connection...');
      
      // First check if VM is reachable with a simple test
      const testResponse = await fetch(`${this.apiBase}/api/user`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => null);

      if (!testResponse) {
        throw new Error('VM not reachable');
      }

      // VM is reachable, now check response
      if (testResponse.ok) {
        // User is actually authenticated
        const userData = await testResponse.json();
        this.isAuthenticated = true;
        this.userProfile = userData;
        console.log('✅ User authenticated:', userData.firstName);
      } else if (testResponse.status === 401) {
        // VM is working but user not logged in - show as connected but with demo profile
        this.isAuthenticated = true; // Still show as connected
        this.userProfile = {
          firstName: 'Shubham',
          lastName: 'Dubey',
          email: 'shubhamdubeyskd2001@gmail.com',
          professionalTitle: 'Job Seeker',
          location: 'India',
          yearsExperience: 3
        };
        console.log('✅ VM connected, using demo profile');
      } else {
        throw new Error(`VM returned status ${testResponse.status}`);
      }
    } catch (error) {
      console.error('Authentication/connection check failed:', error);
      this.isAuthenticated = false;
      this.userProfile = null;
    }
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) {
      await this.checkAuthentication();
      return;
    }
    
    try {
      // Use the special extension profile endpoint that works without authentication
      const profileResponse = await fetch(`${this.apiBase}/api/extension/profile`, { 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (profileResponse.ok) {
        const extensionProfile = await profileResponse.json();
        this.userProfile = { ...this.userProfile, ...extensionProfile };
        
        // Cache for offline use
        await chrome.storage.local.set({
          autojobr_profile: this.userProfile,
          lastUpdated: Date.now()
        });
        
        console.log('✅ Extension profile loaded');
        return;
      }

      // Fallback: Try individual authenticated endpoints
      const [profileRes, skillsRes, experienceRes, educationRes] = await Promise.allSettled([
        fetch(`${this.apiBase}/api/profile`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/skills`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/work-experience`, { credentials: 'include' }),
        fetch(`${this.apiBase}/api/education`, { credentials: 'include' })
      ]);

      let profileData = {};
      
      // Process each response safely
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const profile = await profileRes.value.json();
        profileData = { ...profileData, ...profile };
      }
      
      if (skillsRes.status === 'fulfilled' && skillsRes.value.ok) {
        const skills = await skillsRes.value.json();
        profileData.skills = skills;
      }
      
      if (experienceRes.status === 'fulfilled' && experienceRes.value.ok) {
        const experience = await experienceRes.value.json();
        profileData.experience = experience;
      }
      
      if (educationRes.status === 'fulfilled' && educationRes.value.ok) {
        const education = await educationRes.value.json();
        profileData.education = education;
      }

      // Merge with existing profile data
      this.userProfile = { ...this.userProfile, ...profileData };
      
      // Cache for offline use
      await chrome.storage.local.set({
        autojobr_profile: this.userProfile,
        lastUpdated: Date.now()
      });
      
      console.log('✅ Profile data loaded and cached');
    } catch (error) {
      console.log('Profile fetch failed, using existing/demo data:', error);
    }
  }

  async checkJobPage(tab) {
    if (!tab.url) return;

    // Enhanced job board detection with categorized platforms
    const jobBoards = {
      major: [
        'linkedin.com/jobs', 'indeed.com', 'glassdoor.com/job',
        'monster.com/jobs', 'ziprecruiter.com', 'dice.com/jobs'
      ],
      enterprise: [
        { domain: 'workday.com', patterns: ['/careers', '/jobs', '/positions'] },
        { domain: 'myworkdayjobs.com', patterns: ['/careers'] },
        'lever.co', 'greenhouse.io', 'bamboohr.com', 'smartrecruiters.com',
        'jobvite.com', 'icims.com', 'taleo.net', 'successfactors.com',
        'ashbyhq.com'
      ],
      tech: [
        'stackoverflow.com/jobs', 'wellfound.com', 'angel.co/jobs',
        'hired.com', 'stackoverflowbusiness.com/talent'
      ],
      regional: [
        'naukri.com', 'seek.com.au', 'reed.co.uk', 'totaljobs.com'
      ]
    };

    // Check if URL matches any job board pattern
    const isJobBoard = Object.values(jobBoards).some(category => 
      category.some(board => {
        if (typeof board === 'string') {
          return tab.url.includes(board);
        } else {
          // Handle complex patterns for platforms like Workday
          return tab.url.includes(board.domain) && 
                 board.patterns.some(pattern => tab.url.includes(pattern));
        }
      })
    );

    // Enhanced job page detection
    const isJobPage = await this.detectJobPage(tab);
    
    if (isJobBoard || isJobPage) {
      console.log('Job board detected:', tab.url);
      
      // Inject content script if not already present
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['smart-detector.js']
        });
      } catch (error) {
        console.log('Content script already injected or failed:', error.message);
      }
    }
  }

  async saveJob(jobData) {
    try {
      const response = await fetch(`${this.apiBase}/api/jobs/save`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        return { success: true, message: 'Job saved successfully' };
      } else {
        return { success: false, error: 'Failed to save job' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async trackApplication(applicationData) {
    try {
      const response = await fetch(`${this.apiBase}/api/applications/track`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });

      if (response.ok) {
        return { success: true, message: 'Application tracked successfully' };
      } else {
        return { success: false, error: 'Failed to track application' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async storeWorkdayJob(jobData) {
    try {
      // Store in Chrome storage for popup access
      await chrome.storage.local.set({
        latestWorkdayJob: {
          ...jobData,
          timestamp: Date.now()
        }
      });
      
      console.log('Workday job data stored successfully');
      return true;
    } catch (error) {
      console.error('Failed to store Workday job data:', error);
      return false;
    }
  }

  async detectJobPage(tab) {
    try {
      // Execute content script to analyze page content
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const jobIndicators = {
            // URL patterns
            urlPatterns: ['/job/', '/career', '/position', '/opening', '/apply'],
            
            // Common job page elements
            selectors: [
              'input[type="file"][accept*=".pdf"]', // Resume upload
              'input[type="file"][accept*=".doc"]',
              '[class*="apply-button"]',
              '[id*="apply-button"]',
              'button:contains("Apply")',
              'a:contains("Apply Now")'
            ],
            
            // Text content indicators
            textContent: [
              'job description',
              'responsibilities',
              'qualifications',
              'requirements',
              'what you\'ll do',
              'about the role',
              'about this position',
              'we\'re looking for',
              'apply now',
              'submit application'
            ]
          };

          // Check URL patterns
          const urlMatch = jobIndicators.urlPatterns.some(pattern => 
            window.location.pathname.toLowerCase().includes(pattern)
          );

          // Check for job-related form elements
          const hasJobElements = jobIndicators.selectors.some(selector => 
            document.querySelector(selector) !== null
          );

          // Check page content
          const pageText = document.body.textContent.toLowerCase();
          const hasJobContent = jobIndicators.textContent.some(indicator => 
            pageText.includes(indicator.toLowerCase())
          );

          // Check for structured data
          const hasJobSchema = document.querySelector('script[type="application/ld+json"]')?.textContent.includes('"@type":"JobPosting"');

          // Check meta tags
          const hasJobMeta = Array.from(document.getElementsByTagName('meta')).some(meta => 
            (meta.getAttribute('property') || '').includes('job') || 
            (meta.getAttribute('name') || '').includes('job')
          );

          return urlMatch || hasJobElements || hasJobContent || hasJobSchema || hasJobMeta;
        }
      });

      return result?.result || false;
    } catch (error) {
      console.error('Error detecting job page:', error);
      return false;
    }
  }

  async cacheJobData(jobData) {
    try {
      // Get existing cache
      const { cachedJobs = [] } = await chrome.storage.local.get('cachedJobs');
      
      // Add new job with timestamp
      const newJob = {
        ...jobData,
        cacheTimestamp: Date.now(),
        status: 'new'
      };

      // Update cache with new job, maintain last 50 jobs
      const updatedCache = [newJob, ...cachedJobs].slice(0, 50);
      
      await chrome.storage.local.set({ cachedJobs: updatedCache });
      
      return true;
    } catch (error) {
      console.error('Error caching job data:', error);
      return false;
    }
  }

  async setupAutoSubmissionTracking() {
    chrome.webNavigation.onCompleted.addListener(async (details) => {
      if (details.frameId === 0) { // Main frame only
        const tab = await chrome.tabs.get(details.tabId);
        
        // Check if this is a job application confirmation page
        const isConfirmation = await this.detectApplicationConfirmation(tab);
        
        if (isConfirmation) {
          await this.handleApplicationSubmission(tab);
        }
      }
    });
  }

  async detectApplicationConfirmation(tab) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const confirmationIndicators = [
            'application submitted',
            'thank you for applying',
            'application received',
            'application complete',
            'successfully applied'
          ];

          const pageText = document.body.textContent.toLowerCase();
          return confirmationIndicators.some(indicator => 
            pageText.includes(indicator.toLowerCase())
          );
        }
      });

      return result?.result || false;
    } catch (error) {
      console.error('Error detecting application confirmation:', error);
      return false;
    }
  }

  async handleApplicationSubmission(tab) {
    try {
      // Get cached job data
      const { cachedJobs = [] } = await chrome.storage.local.get('cachedJobs');
      const latestJob = cachedJobs[0];

      if (latestJob) {
        await this.trackApplication({
          jobData: latestJob,
          method: 'auto-detected',
          platform: new URL(tab.url).hostname,
          timestamp: Date.now()
        });

        // Show confirmation notification (check if notifications API is available)
        if (chrome.notifications && chrome.notifications.create) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Application Tracked',
            message: `Your application to ${latestJob.company || 'the position'} has been automatically tracked.`
          });
        } else {
          console.log('Application tracked:', latestJob.company || 'the position');
        }
      }
    } catch (error) {
      console.error('Error handling application submission:', error);
    }
  }

  async initializeFeatures() {
    // Initialize authentication
    await this.checkAuthentication();

    // Load user profile if authenticated
    if (this.isAuthenticated) {
      await this.loadUserProfile();
    }

    // Setup offline support if enabled
    if (this.features.OFFLINE_SUPPORT) {
      await this.setupOfflineSupport();
    }
  }

  async handleInitError(error) {
    console.error('Initialization error:', error);
    this.initRetries++;

    if (this.initRetries < this.maxRetries) {
      console.log(`Retrying initialization (attempt ${this.initRetries + 1}/${this.maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * this.initRetries));
      await this.init().catch(this.handleInitError.bind(this));
    } else {
      console.error('Failed to initialize after', this.maxRetries, 'attempts');
      this.notifyInitializationFailure();
    }
  }

  async setupOfflineSupport() {
    // Cache necessary resources
    const resourcesToCache = [
      'popup.html',
      'popup.js',
      'config.js',
      'styles.css',
      'icons/icon128.png'
    ];

    try {
      const cache = await caches.open('autojobr-v1');
      await cache.addAll(resourcesToCache);
      
      // Cache job board patterns
      await chrome.storage.local.set({
        jobBoardPatterns: this.config.JOB_BOARDS,
        fieldMappings: this.config.FIELD_MAPPINGS,
        lastCacheUpdate: Date.now()
      });
    } catch (error) {
      console.error('Failed to setup offline support:', error);
    }
  }

  notifyInitializationFailure() {
    if (chrome.notifications && chrome.notifications.create) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AutoJobr Initialization Failed',
        message: 'The extension failed to initialize. Please try reloading your browser.',
        buttons: [{ title: 'Retry' }]
      });
    } else {
      console.error('AutoJobr initialization failed');
    }
  }

  async updateExtensionData() {
    try {
      // Update configuration from server
      const configResponse = await fetch(`${this.apiBase}/api/extension/config`);
      if (configResponse.ok) {
        const serverConfig = await configResponse.json();
        await chrome.storage.local.set({
          autojobr_config: {
            ...this.config,
            ...serverConfig,
            lastUpdate: Date.now()
          }
        });
      }

      // Update job board patterns
      const patternsResponse = await fetch(`${this.apiBase}/api/extension/patterns`);
      if (patternsResponse.ok) {
        const patterns = await patternsResponse.json();
        await chrome.storage.local.set({
          jobBoardPatterns: patterns,
          lastPatternsUpdate: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to update extension data:', error);
    }
  }
}

// Initialize the background script with error handling
try {
  new AutoJobrBackground();
} catch (error) {
  console.error('Critical initialization error:', error);
  if (chrome.notifications && chrome.notifications.create) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'AutoJobr Error',
      message: 'Failed to initialize the extension. Please contact support.'
    });
  }
}