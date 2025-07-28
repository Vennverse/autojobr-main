// Central Configuration for AutoJobr Chrome Extension
// Update this file when backend URL changes

const AUTOJOBR_CONFIG = {
  // Main API Base URL - UPDATE THIS WHEN BACKEND CHANGES
  API_BASE_URL: 'https://2850a2fc-4859-4c6a-8bf3-95d0268c34db-00-m8wfd8rzorjq.worf.replit.dev',
  
  // Alternative URLs for fallback (optional)
  FALLBACK_URLS: [
    'http://40.160.50.128:5000',
    'http://localhost:5000'
  ],
  
  // API Endpoints (relative to base URL)
  ENDPOINTS: {
    USER: '/api/user',
    PROFILE: '/api/profile',
    EXTENSION_PROFILE: '/api/extension/profile',
    EXTENSION_TOKEN: '/api/auth/extension-token',
    EXTENSION_USER: '/api/extension/user',
    SKILLS: '/api/skills',
    WORK_EXPERIENCE: '/api/work-experience',
    EDUCATION: '/api/education',
    GENERATE_COVER_LETTER: '/api/generate-cover-letter',
    JOB_ANALYSIS: '/api/analyze-job',
    HEALTH_CHECK: '/api/health',
    HEALTH_CHECK_SIMPLE: '/api/health/simple'
  },
  
  // Storage keys for Chrome extension
  STORAGE_KEYS: {
    USER_DATA: 'autojobr_user_data',
    AUTH_TOKEN: 'autojobr_auth_token',
    PROFILE_CACHE: 'autojobr_profile_cache',
    SETTINGS: 'autojobr_settings'
  },
  
  // Cache settings
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  TOKEN_DURATION: 23 * 60 * 60 * 1000, // 23 hours (slightly less than server expiry)
  
  // Auto-detection function
  detectBackendURL() {
    return this.API_BASE_URL;
  },
  
  // Get full URL for an endpoint
  getEndpointURL(endpoint) {
    return this.API_BASE_URL + this.ENDPOINTS[endpoint];
  },
  
  // Test URL connectivity
  async testURL(url) {
    try {
      const response = await fetch(`${url}/api/health/simple`, {
        method: 'GET',
        credentials: 'include',
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  },
  
  // Auto-detect working URL from list
  async detectWorkingURL() {
    const urlsToTest = [this.API_BASE_URL, ...this.FALLBACK_URLS];
    
    for (const url of urlsToTest) {
      if (await this.testURL(url)) {
        return url;
      }
    }
    
    return this.API_BASE_URL; // Default fallback
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.AUTOJOBR_CONFIG = AUTOJOBR_CONFIG;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AUTOJOBR_CONFIG;
}