// VM Server Configuration for AutoJobr Extension
const VM_CONFIG = {
  // VM Server URL only
  API_BASE_URL: 'http://40.160.50.128:5000',
  
  // VM connection options
  getConnectionOptions: () => ({
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 10000,
  }),
  
  // Health check configuration
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    retries: 3,
    retryDelay: 2000, // 2 seconds
  },
  
  // VM server origin
  allowedOrigins: [
    'http://40.160.50.128:5000'
  ],
  
  // Feature flags for VM environment
  features: {
    enableHealthMonitoring: true,
    enableAutoReconnect: true,
    enableConnectionFallback: false,
    enableCaching: true,
    enableOfflineMode: false,
  }
};

// VM connection manager
class VMConnectionManager {
  constructor() {
    this.backendURL = VM_CONFIG.API_BASE_URL;
    this.connectionOptions = VM_CONFIG.getConnectionOptions();
    this.healthStatus = 'unknown';
    this.lastHealthCheck = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VM_CONFIG.healthCheck.timeout);
      
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
      console.warn('VM connection test failed:', error.message);
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
      console.error('VM API request failed:', error);
      throw error;
    }
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
  window.VM_CONFIG = VM_CONFIG;
  window.VMConnectionManager = VMConnectionManager;
}

// For Chrome extension environment
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.set({
    'vm_config': VM_CONFIG,
    'backend_url': VM_CONFIG.API_BASE_URL,
    'last_updated': new Date().toISOString()
  });
}