
// Settings Manager Module - Handles user settings and preferences
class SettingsManager {
  constructor() {
    this.groqApiKey = null;
    this.settings = {};
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'userApiKey',
        'premiumFeaturesEnabled',
        'smartFillMode',
        'autoSubmitMode',
        'autoResumeMode'
      ]);

      this.groqApiKey = result.userApiKey || null;
      this.settings = result;

      return this.settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  async saveApiKey(apiKey) {
    if (!apiKey || apiKey === '••••••••••••••••') {
      return { success: false, message: 'Invalid API key' };
    }

    if (apiKey.length < 20) {
      return { success: false, message: 'API key appears to be invalid (too short)' };
    }

    try {
      await chrome.storage.sync.set({ userApiKey: apiKey });
      this.groqApiKey = apiKey;
      return { success: true, message: 'API key saved successfully' };
    } catch (error) {
      console.error('API key save error:', error);
      return { success: false, message: 'Failed to save API key: ' + error.message };
    }
  }

  async updateSetting(key, value) {
    try {
      await chrome.storage.sync.set({ [key]: value });
      this.settings[key] = value;
      return { success: true };
    } catch (error) {
      console.error('Setting update error:', error);
      return { success: false, error: error.message };
    }
  }

  async clearCache() {
    try {
      await chrome.storage.local.remove(['profileCache', 'analysisCache']);
      return { success: true };
    } catch (error) {
      console.error('Clear cache error:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      await chrome.storage.local.clear();
      await chrome.storage.sync.remove(['userApiKey', 'premiumFeaturesEnabled']);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }
}

if (typeof window !== 'undefined') {
  window.SettingsManager = SettingsManager;
}
