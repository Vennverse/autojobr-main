
// API Client Module - Handles all server communication
class APIClient {
  constructor() {
    this.API_BASE_URL = 'https://autojobr.com';
    this.cache = new Map();
    this.lastAuthCheck = 0;
  }

  async initialize() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getApiUrl' });
      if (response && response.apiUrl) {
        this.API_BASE_URL = response.apiUrl;
      }
    } catch (error) {
      console.log('Using default API URL:', this.API_BASE_URL);
    }
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
      if (options.method === 'GET' && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) {
          return cached.data;
        }
      }

      const result = await chrome.storage.local.get(['sessionToken', 'userId']);
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (result.sessionToken) {
        headers['Authorization'] = `Bearer ${result.sessionToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        await chrome.storage.local.remove(['sessionToken', 'userId']);
        return { error: 'Authentication required' };
      }

      const newToken = response.headers.get('X-Session-Token');
      if (newToken) {
        await chrome.storage.local.set({ sessionToken: newToken });
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      if (options.method === 'GET') {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  async getUserProfile() {
    try {
      const result = await chrome.runtime.sendMessage({ action: 'getUserProfile' });
      return result?.success ? result.profile : null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

if (typeof window !== 'undefined') {
  window.APIClient = APIClient;
}
