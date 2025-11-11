
// Config Sync Service - Keeps ATS configurations up-to-date
class ConfigSyncService {
  constructor() {
    this.configUrl = 'https://autojobr.com/api/extension/config';
    this.localConfig = null;
    this.lastSync = null;
    this.syncInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.init();
  }

  async init() {
    await this.loadLocalConfig();
    await this.checkForUpdates();
    this.startPeriodicSync();
  }

  async loadLocalConfig() {
    try {
      const response = await fetch(chrome.runtime.getURL('remote-config.json'));
      this.localConfig = await response.json();
      console.log('✅ Local config loaded:', this.localConfig.version);
    } catch (error) {
      console.error('Failed to load local config:', error);
    }
  }

  async checkForUpdates() {
    try {
      const stored = await chrome.storage.local.get(['remoteConfig', 'configLastSync']);
      this.lastSync = stored.configLastSync;

      // Check if we need to sync
      const needsSync = !this.lastSync || (Date.now() - this.lastSync > this.syncInterval);

      if (needsSync) {
        await this.syncRemoteConfig();
      } else {
        this.localConfig = stored.remoteConfig || this.localConfig;
      }
    } catch (error) {
      console.error('Config update check failed:', error);
    }
  }

  async syncRemoteConfig() {
    try {
      const response = await fetch(this.configUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const remoteConfig = await response.json();

        // Only update if version is newer
        if (this.isNewerVersion(remoteConfig.version, this.localConfig.version)) {
          this.localConfig = remoteConfig;
          await chrome.storage.local.set({
            remoteConfig: remoteConfig,
            configLastSync: Date.now()
          });
          console.log('✅ Config synced to version:', remoteConfig.version);
        }
      }
    } catch (error) {
      console.error('Remote config sync failed:', error);
    }
  }

  isNewerVersion(remote, local) {
    const r = remote.split('.').map(Number);
    const l = local.split('.').map(Number);
    return r[0] > l[0] || (r[0] === l[0] && r[1] > l[1]) || (r[0] === l[0] && r[1] === l[1] && r[2] > l[2]);
  }

  startPeriodicSync() {
    setInterval(() => this.checkForUpdates(), this.syncInterval);
  }

  getConfig(site) {
    return this.localConfig?.ats?.[site] || null;
  }

  getSelectors(site, field) {
    const config = this.getConfig(site);
    return config?.selectors?.[field] || null;
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.ConfigSyncService = ConfigSyncService;
}
