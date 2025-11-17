
// Notification Manager Module - Handles all user notifications
class NotificationManager {
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `autojobr-notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      z-index: 10003;
      font-size: 14px;
      font-weight: 500;
      max-width: 350px;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showWarning(message) {
    this.showNotification(message, 'warning');
  }
}

if (typeof window !== 'undefined') {
  window.NotificationManager = NotificationManager;
}
