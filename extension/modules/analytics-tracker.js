
// Analytics Tracker Module - Handles application tracking
class AnalyticsTracker {
  constructor() {
    this.setupTracking();
  }

  setupTracking() {
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (this.isJobApplicationForm(form)) {
        setTimeout(() => this.trackApplicationSubmission(), 3000);
      }
    });

    document.addEventListener('click', async (e) => {
      const target = e.target;
      if (this.isSubmissionButton(target) || this.isSubmissionButton(target.closest('button'))) {
        setTimeout(() => this.trackApplicationSubmission(), 3000);
      }
    }, true);
  }

  isJobApplicationForm(form) {
    if (!form || (form.tagName !== 'FORM' && form.getAttribute('role') !== 'form')) {
      return false;
    }

    const formText = form.textContent.toLowerCase();
    const hasApplyKeyword = formText.includes('apply') || formText.includes('application');
    const hasResumeField = form.querySelector('input[type="file"][accept*="pdf"], input[name*="resume"]');
    
    return hasApplyKeyword || hasResumeField;
  }

  isSubmissionButton(button) {
    if (!button) return false;
    const text = button.textContent?.toLowerCase() || '';
    const submitKeywords = ['submit application', 'apply now', 'submit', 'apply'];
    return submitKeywords.some(keyword => text.includes(keyword));
  }

  async trackApplicationSubmission() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'trackApplication',
        data: {
          jobUrl: window.location.href,
          timestamp: new Date().toISOString()
        }
      });

      if (response?.success) {
        console.log('Application tracked successfully');
      }
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }
}

if (typeof window !== 'undefined') {
  window.AnalyticsTracker = AnalyticsTracker;
}
