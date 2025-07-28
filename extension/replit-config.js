// Replit-specific configuration for AutoJobr Extension
const REPLIT_CONFIG = {
  // Auto-detect current Replit environment
  getBackendURL: () => {
    // Check if we're in a Replit webview
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      
      // Handle Replit development environment
      if (hostname.includes('replit.dev')) {
        return `https://${hostname}`;
      }
      
      // Handle Replit production environment  
      if (hostname.includes('replit.app')) {
        return `https://${hostname}`;
      }
      
      // Handle custom Replit domains
      if (hostname.includes('.replit.')) {
        return `https://${hostname}`;
      }
    }
    
    // Fallback to localhost for development
    return 'http://localhost:5000';
  },
  
  // Enhanced connection options for Replit
  getConnectionOptions: () => ({
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // Longer timeout for Replit environments
    timeout: 15000,
  }),
  
  // Health check configuration
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    retries: 3,
    retryDelay: 2000, // 2 seconds
  },
  
  // Replit-specific CORS origins
  allowedOrigins: [
    'https://*.replit.dev',
    'https://*.replit.app', 
    'https://*.replit.co',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ],
  
  // Feature flags for Replit environment
  features: {
    enableHealthMonitoring: true,
    enableAutoReconnect: true,
    enableConnectionFallback: true,
    enableCaching: true,
    enableOfflineMode: false, // Redis handles this on backend
  }
};

// Enhanced connection manager for Replit
class ReplitConnectionManager {
  constructor() {
    this.backendURL = REPLIT_CONFIG.getBackendURL();
    this.connectionOptions = REPLIT_CONFIG.getConnectionOptions();
    this.healthStatus = 'unknown';
    this.lastHealthCheck = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REPLIT_CONFIG.healthCheck.timeout);
      
      const response = await fetch(`${this.backendURL}/api/health/simple`, {
        ...this.connectionOptions,
        signal: controller.signal,
        method: 'GET'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.healthStatus = 'connected';
        this.reconnectAttempts = 0;
        this.lastHealthCheck = new Date();
        return true;
      } else {
        this.healthStatus = 'error';
        return false;
      }
    } catch (error) {
      this.healthStatus = 'disconnected';
      console.warn('Replit connection test failed:', error.message);
      return false;
    }
  }
  
  async makeRequest(endpoint, options = {}) {
    const url = `${this.backendURL}${endpoint}`;
    const requestOptions = {
      ...this.connectionOptions,
      ...options,
      headers: {
        ...this.connectionOptions.headers,
        ...options.headers
      }
    };
    
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Replit API request failed:', error);
      throw error;
    }
  }
  
  async startHealthMonitoring() {
    if (!REPLIT_CONFIG.features.enableHealthMonitoring) return;
    
    // Initial connection test
    await this.testConnection();
    
    // Set up periodic health checks
    setInterval(async () => {
      await this.testConnection();
    }, REPLIT_CONFIG.healthCheck.interval);
    
    console.log('🔄 Replit health monitoring started');
  }
  
  getHealthStatus() {
    return {
      status: this.healthStatus,
      lastCheck: this.lastHealthCheck,
      backendURL: this.backendURL,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Export for use in other extension files
if (typeof window !== 'undefined') {
  window.REPLIT_CONFIG = REPLIT_CONFIG;
  window.ReplitConnectionManager = ReplitConnectionManager;
}

// For Chrome extension environment
if (typeof chrome !== 'undefined' && chrome.storage) {
  // Store Replit configuration in extension storage
  chrome.storage.local.set({
    'replit_config': REPLIT_CONFIG,
    'backend_url': REPLIT_CONFIG.getBackendURL(),
    'last_updated': new Date().toISOString()
  });
}