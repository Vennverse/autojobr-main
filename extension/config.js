// AutoJobr Extension Configuration
// This file manages API endpoint configuration for different deployment environments

class ExtensionConfig {
  constructor() {
    this.possibleUrls = [
      'https://3d6f082b-7ea6-4d17-ac26-d8174ad1bade-00-2guo24ufezq8l.janeway.repl.co',
      'https://autojobr.replit.app',
      'http://localhost:5000'
    ];
    this.currentApiUrl = null;
  }

  async detectApiUrl() {
    // Check storage first
    const stored = await chrome.storage.sync.get(['apiUrl']);
    if (stored.apiUrl && await this.testConnection(stored.apiUrl)) {
      this.currentApiUrl = stored.apiUrl;
      return this.currentApiUrl;
    }

    // Auto-detect working URL
    for (const url of this.possibleUrls) {
      if (await this.testConnection(url)) {
        this.currentApiUrl = url;
        await chrome.storage.sync.set({ apiUrl: url });
        return url;
      }
    }

    // Default fallback
    this.currentApiUrl = this.possibleUrls[0];
    await chrome.storage.sync.set({ apiUrl: this.currentApiUrl });
    return this.currentApiUrl;
  }

  async testConnection(url) {
    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.log(`Connection test failed for ${url}:`, error);
      return false;
    }
  }

  async getApiUrl() {
    if (!this.currentApiUrl) {
      await this.detectApiUrl();
    }
    return this.currentApiUrl;
  }

  async updateApiUrl(newUrl) {
    if (await this.testConnection(newUrl)) {
      this.currentApiUrl = newUrl;
      await chrome.storage.sync.set({ apiUrl: newUrl });
      return true;
    }
    return false;
  }
}

// Export for use in other extension files
// Use globalThis for cross-environment compatibility (service worker, content script, popup)
if (typeof globalThis !== 'undefined') {
  globalThis.ExtensionConfig = ExtensionConfig;
}
if (typeof window !== 'undefined') {
  window.ExtensionConfig = ExtensionConfig;
}