/**
 * XPath-based Field Detection Engine
 * Inspired by Simplify extension's configuration-driven approach
 */

class XPathDetector {
  constructor() {
    this.atsConfig = null;
    this.currentATS = null;
    this.initialized = false;
    console.log('[XPathDetector] Constructor called');
  }

  async initialize() {
    // Prevent duplicate initialization
    if (this.initialized) {
      console.log('[XPathDetector] Already initialized, skipping');
      return;
    }

    try {
      console.log('[XPathDetector] Initializing...');
      const configUrl = chrome.runtime.getURL('ats-config.json');
      console.log('[XPathDetector] Loading config from:', configUrl);
      
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      
      this.atsConfig = await response.json();
      console.log('[XPathDetector] Config loaded successfully');
      console.log('[XPathDetector] Available ATS platforms:', Object.keys(this.atsConfig.atsConfigurations || {}));
      
      this.detectCurrentATS();
      this.initialized = true;
      
      console.log('[XPathDetector] ✅ Initialization complete. Current ATS:', this.currentATS || 'Generic (CSS fallback)');
    } catch (error) {
      console.error('[XPathDetector] ❌ Initialization failed:', error);
      // Set a minimal config to prevent errors
      this.atsConfig = { atsConfigurations: {}, fieldDetectionPatterns: {} };
      this.initialized = true; // Mark as initialized even on error to prevent retry loops
    }
  }

  detectCurrentATS() {
    const currentUrl = window.location.href;
    
    for (const [atsName, config] of Object.entries(this.atsConfig.atsConfigurations)) {
      for (const urlPattern of config.urls) {
        if (this.matchesPattern(currentUrl, urlPattern)) {
          this.currentATS = atsName;
          console.log(`[AutoJobr] Detected ATS: ${atsName}`);
          return atsName;
        }
      }
    }
    
    this.currentATS = null;
    return null;
  }

  matchesPattern(url, pattern) {
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '\\?')
      .replace(/\./g, '\\.');
    return new RegExp('^' + regex + '$').test(url);
  }

  evaluateXPath(xpath, contextNode = document) {
    try {
      const result = document.evaluate(
        xpath,
        contextNode,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue;
    } catch (error) {
      console.error(`[AutoJobr] XPath evaluation error: ${xpath}`, error);
      return null;
    }
  }

  evaluateXPathAll(xpath, contextNode = document) {
    try {
      const result = document.evaluate(
        xpath,
        contextNode,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      const nodes = [];
      for (let i = 0; i < result.snapshotLength; i++) {
        nodes.push(result.snapshotItem(i));
      }
      return nodes;
    } catch (error) {
      console.error(`[AutoJobr] XPath evaluation error: ${xpath}`, error);
      return [];
    }
  }

  detectField(fieldName) {
    if (this.currentATS && this.atsConfig.atsConfigurations[this.currentATS]) {
      const atsConfig = this.atsConfig.atsConfigurations[this.currentATS];
      const fieldMappings = atsConfig.fieldMappings;
      
      if (fieldMappings && fieldMappings[fieldName]) {
        for (const xpath of fieldMappings[fieldName]) {
          const element = this.evaluateXPath(xpath);
          if (element) {
            console.log(`[AutoJobr] Found ${fieldName} via ATS-specific XPath: ${xpath}`);
            return element;
          }
        }
      }
    }

    const genericPatterns = this.atsConfig.fieldDetectionPatterns[fieldName];
    if (genericPatterns && genericPatterns.xpaths) {
      for (const xpath of genericPatterns.xpaths) {
        const element = this.evaluateXPath(xpath);
        if (element) {
          console.log(`[AutoJobr] Found ${fieldName} via generic XPath: ${xpath}`);
          return element;
        }
      }
    }

    const cssElement = this.detectFieldByCSS(fieldName);
    if (cssElement) {
      console.log(`[AutoJobr] Found ${fieldName} via CSS fallback`);
      return cssElement;
    }

    return null;
  }

  detectFieldByCSS(fieldName) {
    const selectors = {
      email: ['input[type="email"]', 'input[name*="email"]', 'input[id*="email"]'],
      phone: ['input[type="tel"]', 'input[name*="phone"]', 'input[id*="phone"]'],
      first_name: ['input[name*="first"]', 'input[id*="first"]', 'input[name="firstName"]'],
      last_name: ['input[name*="last"]', 'input[id*="last"]', 'input[name="lastName"]'],
      resume: ['input[type="file"][name*="resume"]', 'input[type="file"][id*="resume"]', 'input[type="file"]'],
      cover_letter: ['textarea[name*="cover"]', 'textarea[id*="cover"]'],
      linkedin: ['input[name*="linkedin"]', 'input[id*="linkedin"]']
    };

    const fieldSelectors = selectors[fieldName] || [];
    for (const selector of fieldSelectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  getAllFormFields() {
    const fields = {};
    const fieldTypes = ['email', 'phone', 'first_name', 'last_name', 'resume', 'cover_letter', 'linkedin', 'full_name'];
    
    for (const fieldType of fieldTypes) {
      const element = this.detectField(fieldType);
      if (element) {
        fields[fieldType] = element;
      }
    }
    
    return fields;
  }

  checkSubmissionSuccess() {
    if (!this.currentATS || !this.atsConfig.atsConfigurations[this.currentATS]) {
      return this.genericSuccessCheck();
    }

    const atsConfig = this.atsConfig.atsConfigurations[this.currentATS];
    const successPaths = atsConfig.successPaths || [];

    for (const xpath of successPaths) {
      const element = this.evaluateXPath(xpath);
      if (element) {
        console.log(`[AutoJobr] Application success detected via XPath: ${xpath}`);
        return true;
      }
    }

    return this.genericSuccessCheck();
  }

  genericSuccessCheck() {
    const successKeywords = [
      'application submitted',
      'thank you for applying',
      'application received',
      'successfully submitted',
      'application sent',
      'we got your application',
      'application complete'
    ];

    const bodyText = document.body.innerText.toLowerCase();
    return successKeywords.some(keyword => bodyText.includes(keyword));
  }

  getFormContainer() {
    if (!this.currentATS || !this.atsConfig.atsConfigurations[this.currentATS]) {
      return document.querySelector('form');
    }

    const atsConfig = this.atsConfig.atsConfigurations[this.currentATS];
    const containerPaths = atsConfig.containerPath || [];

    for (const xpath of containerPaths) {
      const container = this.evaluateXPath(xpath);
      if (container) {
        console.log(`[AutoJobr] Found form container via XPath: ${xpath}`);
        return container;
      }
    }

    return document.querySelector('form');
  }

  detectAllInputFields(container = document) {
    const inputs = [];
    const inputElements = container.querySelectorAll('input, textarea, select');
    
    inputElements.forEach(input => {
      if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
        const label = this.getFieldLabel(input);
        inputs.push({
          element: input,
          type: input.type || input.tagName.toLowerCase(),
          name: input.name,
          id: input.id,
          label: label,
          placeholder: input.placeholder
        });
      }
    });

    return inputs;
  }

  getFieldLabel(input) {
    if (input.labels && input.labels.length > 0) {
      return input.labels[0].textContent.trim();
    }

    const labelElement = document.querySelector(`label[for="${input.id}"]`);
    if (labelElement) {
      return labelElement.textContent.trim();
    }

    const closestLabel = input.closest('label');
    if (closestLabel) {
      return closestLabel.textContent.trim();
    }

    const prevElement = input.previousElementSibling;
    if (prevElement && (prevElement.tagName === 'LABEL' || prevElement.tagName === 'SPAN')) {
      return prevElement.textContent.trim();
    }

    return input.placeholder || input.name || '';
  }
}

// Create and expose XPath detector globally IMMEDIATELY
(function() {
  'use strict';
  
  console.log('[XPathDetector] Creating global instance...');
  
  // Create the detector instance
  const detector = new XPathDetector();
  
  // Make it globally available immediately
  window.xpathDetector = detector;
  
  // Also expose on document for additional safety
  if (typeof document !== 'undefined') {
    document.xpathDetector = detector;
  }
  
  console.log('[XPathDetector] ✅ Global instance created and exposed');
})();
