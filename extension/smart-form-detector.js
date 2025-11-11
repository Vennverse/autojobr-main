// Smart Form Detector - Multi-page support & intelligent field detection
// Tracks form state across pages and detects all fillable fields

class SmartFormDetector {
  constructor(xpathEngine, atsAdapter) {
    this.xpathEngine = xpathEngine;
    this.atsAdapter = atsAdapter;
    this.currentPage = 1;
    this.totalPages = null;
    this.filledFields = new Set();
    this.formState = {
      isMultiPage: false,
      hasNextButton: false,
      hasSubmitButton: false,
      currentFields: []
    };
  }

  // Detect all forms on the page
  detectForms() {
    const forms = this.xpathEngine.findElements([
      '//form',
      '//div[@role="form"]',
      '//div[contains(@class, "application")]//div[contains(@class, "form")]'
    ]);

    if (forms.length === 0) {
      // No traditional forms, look for input containers
      const containers = this.xpathEngine.findElements([
        '//div[.//input or .//textarea or .//select]'
      ]);
      return containers.slice(0, 1); // Return first container
    }

    return forms;
  }

  // Detect visible fields in current page/step
  detectVisibleFields(container = document) {
    const fields = {};

    // Get selectors from ATS adapter
    const selectors = this.atsAdapter.selectors;

    for (const [fieldName, xpaths] of Object.entries(selectors)) {
      const element = this.xpathEngine.findElement(xpaths, container);
      
      if (element && this.isVisible(element) && !this.isDisabled(element)) {
        fields[fieldName] = {
          element,
          type: element.tagName.toLowerCase(),
          inputType: element.type,
          name: element.name,
          id: element.id,
          required: element.required,
          placeholder: element.placeholder
        };
      }
    }

    this.formState.currentFields = Object.keys(fields);
    return fields;
  }

  // Check if field is visible
  isVisible(element) {
    if (!element) return false;

    // Check display and visibility
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check opacity
    if (parseFloat(style.opacity) === 0) {
      return false;
    }

    // Check if element has dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    // Check parent visibility
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        return false;
      }
      parent = parent.parentElement;
    }

    return true;
  }

  // Check if field is disabled
  isDisabled(element) {
    return element.disabled || 
           element.readOnly || 
           element.getAttribute('aria-disabled') === 'true';
  }

  // Detect if form is multi-page
  detectMultiPage() {
    // Look for pagination indicators
    const indicators = this.xpathEngine.findElements([
      '//div[contains(@class, "step")]',
      '//div[contains(@class, "page")]',
      '//ol[contains(@class, "progress")]//li',
      '//ul[contains(@class, "steps")]//li'
    ]);

    if (indicators.length > 1) {
      this.formState.isMultiPage = true;
      this.totalPages = indicators.length;
    }

    // Look for next/continue button
    const nextButton = this.xpathEngine.findElement(
      this.atsAdapter.selectors.nextButton || []
    );
    this.formState.hasNextButton = !!nextButton;

    // Look for submit button
    const submitButton = this.xpathEngine.findElement(
      this.atsAdapter.selectors.submitButton || []
    );
    this.formState.hasSubmitButton = !!submitButton;

    // If has next but no submit, likely multi-page
    if (this.formState.hasNextButton && !this.formState.hasSubmitButton) {
      this.formState.isMultiPage = true;
    }

    return this.formState.isMultiPage;
  }

  // Click next button to go to next page
  async goToNextPage() {
    const nextButton = this.xpathEngine.findElement(
      this.atsAdapter.selectors.nextButton || [
        '//button[contains(translate(., "NEXT", "next"), "next")]',
        '//button[contains(translate(., "CONTINUE", "continue"), "continue")]'
      ]
    );

    if (!nextButton || !this.isVisible(nextButton)) {
      return false;
    }

    // Click the button
    nextButton.click();
    
    // Wait for page to load
    await this.waitForPageLoad();
    
    this.currentPage++;
    return true;
  }

  // Submit the form
  async submitForm() {
    const submitButton = this.xpathEngine.findElement(
      this.atsAdapter.selectors.submitButton || [
        '//button[@type="submit"]',
        '//input[@type="submit"]'
      ]
    );

    if (!submitButton || !this.isVisible(submitButton)) {
      return false;
    }

    // Click submit
    submitButton.click();
    
    return true;
  }

  // Wait for page to load after navigation
  async waitForPageLoad(timeout = 3000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkLoad = () => {
        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }

        // Check if page has loaded by looking for new inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        if (inputs.length > 0) {
          resolve(true);
        } else {
          setTimeout(checkLoad, 100);
        }
      };

      setTimeout(checkLoad, this.atsAdapter.config?.waitForLoad || 500);
    });
  }

  // Track which fields have been filled
  markFieldFilled(fieldName) {
    this.filledFields.add(fieldName);
  }

  isFieldFilled(fieldName) {
    return this.filledFields.has(fieldName);
  }

  // Get form progress
  getProgress() {
    const totalFields = this.formState.currentFields.length;
    const filledCount = this.formState.currentFields.filter(f => 
      this.filledFields.has(f)
    ).length;

    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      fieldsOnPage: totalFields,
      filledOnPage: filledCount,
      percentComplete: totalFields > 0 ? (filledCount / totalFields * 100).toFixed(0) : 0
    };
  }

  // Reset state (for new form)
  reset() {
    this.currentPage = 1;
    this.totalPages = null;
    this.filledFields.clear();
    this.formState = {
      isMultiPage: false,
      hasNextButton: false,
      hasSubmitButton: false,
      currentFields: []
    };
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SmartFormDetector };
}
