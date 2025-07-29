// Configuration for AutoJobr Extension
const CONFIG = {
  API_BASE_URL: 'http://40.160.50.128',
  ENDPOINTS: {
    USER: '/api/user',
    PROFILE: '/api/profile',
    EXTENSION_PROFILE: '/api/extension/profile',
    SKILLS: '/api/skills',
    WORK_EXPERIENCE: '/api/work-experience',
    EDUCATION: '/api/education',
    GENERATE_COVER_LETTER: '/api/generate-cover-letter',
    JOB_ANALYSIS: '/api/analyze-job',
    HEALTH_CHECK: '/api/health',
    HEALTH_CHECK_SIMPLE: '/api/health/simple'
  },
  STORAGE_KEYS: {
    USER_DATA: 'autojobr_user_data',
    AUTH_TOKEN: 'autojobr_auth_token',
    PROFILE_CACHE: 'autojobr_profile_cache',
    SETTINGS: 'autojobr_settings'
  },
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  JOB_BOARDS: [
    'linkedin.com',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'ziprecruiter.com',
    'careerbuilder.com',
    'simplyhired.com',
    'dice.com',
    'stackoverflow.com',
    'angel.co',
    'wellfound.com',
    'greenhouse.io',
    'lever.co',
    'workday.com',
    'myworkdayjobs.com',
    'bamboohr.com',
    'smartrecruiters.com',
    'jobvite.com',
    'icims.com',
    'taleo.net',
    'successfactors.com',
    'naukri.com',
    'shine.com',
    'timesjobs.com',
    'foundit.in'
  ],
  FIELD_MAPPINGS: {
    firstName: [
      'input[name*="first" i]',
      'input[placeholder*="first" i]',
      'input[id*="first" i]',
      '[data-automation-id*="first"]',
      '[data-testid*="first"]'
    ],
    lastName: [
      'input[name*="last" i]',
      'input[placeholder*="last" i]',
      'input[id*="last" i]',
      '[data-automation-id*="last"]',
      '[data-testid*="last"]'
    ],
    email: [
      'input[type="email"]',
      'input[name*="email" i]',
      'input[placeholder*="email" i]',
      '[data-automation-id*="email"]'
    ],
    phone: [
      'input[type="tel"]',
      'input[name*="phone" i]',
      'input[placeholder*="phone" i]',
      '[data-automation-id*="phone"]'
    ],
    address: [
      'input[name*="address" i]',
      'textarea[name*="address" i]',
      '[data-automation-id*="address"]'
    ],
    city: [
      'input[name*="city" i]',
      '[data-automation-id*="city"]'
    ],
    state: [
      'select[name*="state" i]',
      'input[name*="state" i]',
      '[data-automation-id*="state"]'
    ],
    zipCode: [
      'input[name*="zip" i]',
      'input[name*="postal" i]',
      '[data-automation-id*="zip"]'
    ],
    linkedinUrl: [
      'input[name*="linkedin" i]',
      'input[placeholder*="linkedin" i]'
    ],
    githubUrl: [
      'input[name*="github" i]',
      'input[placeholder*="github" i]'
    ],
    portfolioUrl: [
      'input[name*="portfolio" i]',
      'input[name*="website" i]'
    ],
    yearsExperience: [
      'select[name*="experience" i]',
      'input[name*="experience" i]'
    ],
    university: [
      'input[name*="university" i]',
      'input[name*="college" i]',
      'input[name*="school" i]'
    ],
    degree: [
      'select[name*="degree" i]',
      'input[name*="degree" i]'
    ],
    major: [
      'input[name*="major" i]',
      'input[name*="field" i]'
    ]
  },
  JOB_SELECTORS: {
    title: [
      'h1', 
      '[data-automation-id*="jobTitle"]',
      '.job-title',
      '.position-title',
      '[class*="title"]'
    ],
    company: [
      '[data-automation-id*="company"]',
      '.company-name',
      '[class*="company"]',
      'a[href*="company"]'
    ],
    location: [
      '[data-automation-id*="location"]',
      '.job-location',
      '[class*="location"]'
    ],
    description: [
      '[data-automation-id*="description"]',
      '.job-description',
      '[class*="description"]',
      '[role="main"]'
    ]
  },
  SUBMISSION_SELECTORS: [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[data-automation-id*="submit"]',
    'button[data-automation-id*="apply"]',
    'button:contains("Submit")',
    'button:contains("Apply")',
    'a[href*="apply"]'
  ]
};

// Enhanced API client with persistent authentication
class AutoJobrAPI {
  constructor() {
    this.baseURL = this.detectBackendURL();
    this.isAuthenticated = false;
    this.userProfile = null;
    this.healthCheckInterval = null;
    this.connectionStatus = 'unknown';
  }

  detectBackendURL() {
    // Use Replit app URL
    return 'https://2c294fad-7817-4711-a460-7808eeccb047-00-3bi7bnnz6rhfb.picard.replit.dev';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (response.status === 401) {
        this.isAuthenticated = false;
        await this.clearStoredAuth();
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async checkAuthStatus() {
    try {
      const user = await this.makeRequest(CONFIG.ENDPOINTS.USER);
      this.isAuthenticated = true;
      await this.cacheUserData(user);
      return user;
    } catch (error) {
      this.isAuthenticated = false;
      return null;
    }
  }

  async getUserProfile() {
    if (this.userProfile) return this.userProfile;

    try {
      const [profile, skills, workExperience, education] = await Promise.all([
        this.makeRequest(CONFIG.ENDPOINTS.PROFILE),
        this.makeRequest(CONFIG.ENDPOINTS.SKILLS),
        this.makeRequest(CONFIG.ENDPOINTS.WORK_EXPERIENCE),
        this.makeRequest(CONFIG.ENDPOINTS.EDUCATION)
      ]);

      this.userProfile = {
        profile,
        skills,
        workExperience,
        education,
        lastUpdated: Date.now()
      };

      await this.cacheProfileData(this.userProfile);
      return this.userProfile;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return await this.getCachedProfileData();
    }
  }

  async generateCoverLetter(jobDescription, companyName) {
    try {
      return await this.makeRequest(CONFIG.ENDPOINTS.GENERATE_COVER_LETTER, {
        method: 'POST',
        body: JSON.stringify({
          jobDescription,
          companyName,
          useProfile: true
        })
      });
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
      throw error;
    }
  }

  async analyzeJob(jobData) {
    try {
      return await this.makeRequest(CONFIG.ENDPOINTS.JOB_ANALYSIS, {
        method: 'POST',
        body: JSON.stringify(jobData)
      });
    } catch (error) {
      console.error('Failed to analyze job:', error);
      throw error;
    }
  }

  async saveJob(jobData) {
    try {
      return await this.makeRequest('/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify(jobData)
      });
    } catch (error) {
      console.error('Failed to save job:', error);
      throw error;
    }
  }

  async trackApplication(applicationData) {
    try {
      return await this.makeRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          ...applicationData,
          source: 'extension',
          appliedDate: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track application:', error);
      throw error;
    }
  }

  async cacheUserData(userData) {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.USER_DATA]: {
        data: userData,
        timestamp: Date.now()
      }
    });
  }

  async cacheProfileData(profileData) {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.PROFILE_CACHE]: {
        data: profileData,
        timestamp: Date.now()
      }
    });
  }

  async getCachedProfileData() {
    const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.PROFILE_CACHE);
    const cached = result[CONFIG.STORAGE_KEYS.PROFILE_CACHE];
    
    if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  async clearStoredAuth() {
    await chrome.storage.local.clear();
    this.userProfile = null;
  }

  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.HEALTH_CHECK_SIMPLE}`, {
        method: 'GET',
        credentials: 'include',
        timeout: 5000
      });
      
      this.connectionStatus = response.ok ? 'connected' : 'error';
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      this.connectionStatus = 'disconnected';
      return false;
    }
  }

  async startHealthMonitoring() {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.checkBackendHealth();
    }, 30000);
    
    // Initial health check
    await this.checkBackendHealth();
  }

  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }
}

// Global API instance
window.AutoJobrAPI = AutoJobrAPI;
window.CONFIG = CONFIG;