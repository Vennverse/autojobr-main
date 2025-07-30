// AutoJobr Extension Configuration
// This is the single source of truth for the backend URL
// Change the URL here and it will update across all extension files

const AUTOJOBR_CONFIG = {
  // Main backend URL - UPDATE THIS WHEN REPLIT URL CHANGES
  API_URL: 'https://e3d8b3db-2c8e-4107-8058-625851bb3dc7-00-1r96d8sk4fqju.kirk.replit.dev',
  
  // Fallback URLs for testing
  FALLBACK_URLS: [
    'https://e3d8b3db-2c8e-4107-8058-625851bb3dc7-00-1r96d8sk4fqju.kirk.replit.dev',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ],
  
  // Extension settings
  VERSION: '2.1.0',
  TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
  
  // Feature flags
  FEATURES: {
    AUTO_SAVE: false,
    AUTO_FILL: true,
    JOB_ANALYSIS: true,
    APPLICATION_TRACKING: true,
    COVER_LETTER_GENERATION: true
  }
};

// Make config available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AUTOJOBR_CONFIG;
} else if (typeof window !== 'undefined') {
  window.AUTOJOBR_CONFIG = AUTOJOBR_CONFIG;
} else {
  // Chrome extension environment
  globalThis.AUTOJOBR_CONFIG = AUTOJOBR_CONFIG;
}