
// UI Manager Module - Handles widget UI and user interactions
class UIManager {
  constructor() {
    this.widget = null;
    this.isVisible = false;
  }

  injectWidget() {
    if (document.getElementById('autojobr-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'autojobr-overlay';
    overlay.innerHTML = this.getWidgetHTML();
    document.body.appendChild(overlay);

    this.widget = document.querySelector('.autojobr-widget');
    this.attachEventListeners();
  }

  getWidgetHTML() {
    return `
      <div class="autojobr-widget" style="display: none;">
        <div class="autojobr-header">
          <div class="autojobr-logo">
            <div class="autojobr-icon">A</div>
            <span>AutoJobr v2.1</span>
          </div>
          <div class="autojobr-controls">
            <button class="autojobr-minimize" title="Minimize">−</button>
            <button class="autojobr-close" title="Close">×</button>
          </div>
        </div>
        <div class="autojobr-content">
          <div class="autojobr-status" id="autojobr-status">
            <div class="status-icon">🎯</div>
            <div class="status-text">Ready to auto-fill</div>
          </div>
          <div class="autojobr-actions">
            <button class="autojobr-btn primary" id="autojobr-autofill">
              <span>⚡ Smart Auto-fill</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    document.querySelector('.autojobr-close')?.addEventListener('click', () => this.hide());
    document.querySelector('.autojobr-minimize')?.addEventListener('click', () => this.minimize());
  }

  show() {
    if (this.widget) {
      this.widget.style.display = 'block';
      this.isVisible = true;
    }
  }

  hide() {
    if (this.widget) {
      this.widget.style.display = 'none';
      this.isVisible = false;
      sessionStorage.setItem('autojobr_widget_closed', 'true');
    }
  }

  minimize() {
    if (this.widget) {
      this.widget.classList.toggle('minimized');
    }
  }

  updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('autojobr-status');
    if (statusEl) {
      statusEl.querySelector('.status-text').textContent = message;
      statusEl.className = `autojobr-status ${type}`;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `autojobr-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 12px;
      z-index: 10003;
      animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}
