
// Multi-Page Form Handler - Navigate through multi-step applications
class MultiPageFormHandler {
  constructor() {
    this.currentPage = 1;
    this.totalPages = 1;
    this.formState = new Map();
    this.completedPages = new Set();
  }

  detectMultiPageForm() {
    // Check for pagination indicators
    const pageIndicators = [
      './/div[contains(@class, "pagination")]',
      './/div[contains(@class, "step-indicator")]',
      './/div[contains(@class, "progress-bar")]',
      './/ol[contains(@class, "steps")]'
    ];

    for (const xpath of pageIndicators) {
      const indicator = XPathHelper.evaluateXPath(xpath);
      if (indicator) {
        return this.parsePageInfo(indicator);
      }
    }

    return { isMultiPage: false, currentPage: 1, totalPages: 1 };
  }

  parsePageInfo(indicator) {
    const text = indicator.textContent;
    
    // Try to find "Page 1 of 3" pattern
    const match = text.match(/(?:page|step)\s*(\d+)\s*(?:of|\/)\s*(\d+)/i);
    if (match) {
      return {
        isMultiPage: true,
        currentPage: parseInt(match[1]),
        totalPages: parseInt(match[2])
      };
    }

    // Count step elements
    const steps = indicator.querySelectorAll('.step, [class*="step"]');
    if (steps.length > 1) {
      const activeStep = Array.from(steps).findIndex(s => 
        s.classList.contains('active') || s.classList.contains('current')
      );
      return {
        isMultiPage: true,
        currentPage: activeStep + 1,
        totalPages: steps.length
      };
    }

    return { isMultiPage: false, currentPage: 1, totalPages: 1 };
  }

  findNextButton() {
    const nextSelectors = [
      './/button[contains(translate(., "NEXT", "next"), "next")]',
      './/button[contains(translate(., "CONTINUE", "continue"), "continue")]',
      './/input[@type="submit" and contains(@value, "Next")]',
      './/a[contains(@class, "next")]'
    ];

    for (const xpath of nextSelectors) {
      const button = XPathHelper.evaluateXPath(xpath);
      if (button && XPathHelper.isVisible(button)) {
        return button;
      }
    }
    return null;
  }

  findSubmitButton() {
    const submitSelectors = [
      './/button[contains(translate(., "SUBMIT", "submit"), "submit")]',
      './/input[@type="submit"]',
      './/button[@type="submit"]',
      './/button[contains(., "Apply")]'
    ];

    for (const xpath of submitSelectors) {
      const button = XPathHelper.evaluateXPath(xpath);
      if (button && XPathHelper.isVisible(button)) {
        return button;
      }
    }
    return null;
  }

  savePageState(pageData) {
    this.formState.set(this.currentPage, pageData);
    this.completedPages.add(this.currentPage);
  }

  async navigateToNextPage() {
    const nextButton = this.findNextButton();
    if (!nextButton) {
      console.log('No next button found');
      return false;
    }

    nextButton.click();
    
    // Wait for navigation
    await this.waitForPageLoad();
    this.currentPage++;
    
    return true;
  }

  async waitForPageLoad(timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (document.readyState === 'complete' || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  isLastPage() {
    const pageInfo = this.detectMultiPageForm();
    return !pageInfo.isMultiPage || pageInfo.currentPage >= pageInfo.totalPages;
  }
}

if (typeof window !== 'undefined') {
  window.MultiPageFormHandler = MultiPageFormHandler;
}
