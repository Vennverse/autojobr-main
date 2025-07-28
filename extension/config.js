// Configuration for AutoJobr Extension - Uses Central Config
// Always use central configuration - no fallbacks
const CONFIG = AUTOJOBR_CONFIG;
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
  ]
};

// Enhanced API client with persistent authentication
class AutoJobrAPI {
  constructor() {
    this.baseURL = CONFIG.getApiBaseURL();
    this.isAuthenticated = false;
    this.userProfile = null;
    this.healthCheckInterval = null;
    this.connectionStatus = 'unknown';
  }

  detectBackendURL() {
    return CONFIG.detectBackendURL();
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
      // First try to get extension token if we don't have one
      let token = await this.getStoredToken();
      
      if (!token) {
        // Try to generate a new token from active session
        token = await this.generateExtensionToken();
      }

      if (token) {
        // Use extension-specific endpoint with token
        const user = await this.makeRequest(`${CONFIG.ENDPOINTS.EXTENSION_USER}?token=${token}`);
        this.isAuthenticated = true;
        await this.cacheUserData(user);
        await this.storeToken(token);
        return user;
      } else {
        // Fallback to regular session-based auth
        const user = await this.makeRequest(CONFIG.ENDPOINTS.USER);
        this.isAuthenticated = true;
        await this.cacheUserData(user);
        return user;
      }
    } catch (error) {
      this.isAuthenticated = false;
      await this.clearStoredAuth();
      return null;
    }
  }

  async generateExtensionToken() {
    try {
      const response = await this.makeRequest(CONFIG.ENDPOINTS.EXTENSION_TOKEN, {
        method: 'POST'
      });
      return response.token;
    } catch (error) {
      console.log('Token generation failed:', error);
      return null;
    }
  }

  async getStoredToken() {
    const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    const tokenData = result[CONFIG.STORAGE_KEYS.AUTH_TOKEN];
    
    if (tokenData && tokenData.expiresAt > Date.now()) {
      return tokenData.token;
    }
    return null;
  }

  async storeToken(token) {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.AUTH_TOKEN]: {
        token,
        expiresAt: Date.now() + (23 * 60 * 60 * 1000) // 23 hours (slightly less than server expiry)
      }
    });
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