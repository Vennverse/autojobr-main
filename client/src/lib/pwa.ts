
// PWA Utilities
export class PWAService {
  private static registration: ServiceWorkerRegistration | null = null;

  // Register service worker
  static async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registered successfully');
        
        // Check for updates periodically
        setInterval(() => {
          this.registration?.update();
        }, 60000); // Check every minute
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  // Subscribe to push notifications
  static async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey ? this.urlBase64ToUint8Array(vapidKey) : undefined
      });
      
      // Send subscription to server
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      return subscription;
    } catch (error) {
      console.error('Push notification subscription failed:', error);
      return null;
    }
  }

  // Show local notification
  static async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (this.registration) {
        await this.registration.showNotification(title, {
          icon: '/favicon.png',
          badge: '/favicon-32x32.png',
          ...options
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  // Check if app is installed
  static isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Prompt to install
  static async promptInstall(): Promise<void> {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome} the install prompt`);
      (window as any).deferredPrompt = null;
    }
  }

  // Background sync
  static async registerBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && this.registration && 'sync' in this.registration) {
      try {
        const syncManager = (this.registration as any).sync;
        await syncManager.register(tag);
        console.log('Background sync registered:', tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  // Helper function
  private static urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }
}

// Install prompt handler
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
});

// Detect when installed
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully');
  (window as any).deferredPrompt = null;
});
