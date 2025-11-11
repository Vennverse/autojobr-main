
// Advanced Field Detector - Uses multiple strategies with confidence scoring
class AdvancedFieldDetector {
  constructor(configSync) {
    this.configSync = configSync;
    this.fieldCache = new Map();
  }

  detectField(fieldType, currentSite) {
    const cacheKey = `${currentSite}_${fieldType}`;
    
    if (this.fieldCache.has(cacheKey)) {
      return this.fieldCache.get(cacheKey);
    }

    const strategies = [
      this.detectByRemoteConfig.bind(this),
      this.detectByXPath.bind(this),
      this.detectByCSS.bind(this),
      this.detectByAttributes.bind(this),
      this.detectByContext.bind(this),
      this.detectByFuzzyMatch.bind(this)
    ];

    let bestMatch = null;
    let bestConfidence = 0;

    for (const strategy of strategies) {
      const result = strategy(fieldType, currentSite);
      if (result && result.confidence > bestConfidence) {
        bestMatch = result.element;
        bestConfidence = result.confidence;
      }

      // If we have high confidence, stop searching
      if (bestConfidence >= 90) break;
    }

    if (bestMatch) {
      this.fieldCache.set(cacheKey, { element: bestMatch, confidence: bestConfidence });
      return { element: bestMatch, confidence: bestConfidence };
    }

    return null;
  }

  detectByRemoteConfig(fieldType, currentSite) {
    const selectors = this.configSync.getSelectors(currentSite, fieldType);
    if (!selectors) return null;

    // Try XPath first
    if (selectors.xpath) {
      for (const xpath of selectors.xpath) {
        const element = this.evaluateXPath(xpath);
        if (element && this.isVisible(element)) {
          return { element, confidence: 95 };
        }
      }
    }

    // Try CSS selectors
    if (selectors.css) {
      for (const css of selectors.css) {
        const element = document.querySelector(css);
        if (element && this.isVisible(element)) {
          return { element, confidence: 90 };
        }
      }
    }

    return null;
  }

  detectByXPath(fieldType, currentSite) {
    const xpathPatterns = this.getXPathPatterns(fieldType);
    
    for (const xpath of xpathPatterns) {
      const element = this.evaluateXPath(xpath);
      if (element && this.isVisible(element)) {
        return { element, confidence: 85 };
      }
    }

    return null;
  }

  detectByCSS(fieldType, currentSite) {
    const cssPatterns = this.getCSSPatterns(fieldType);
    
    for (const css of cssPatterns) {
      const element = document.querySelector(css);
      if (element && this.isVisible(element)) {
        return { element, confidence: 80 };
      }
    }

    return null;
  }

  detectByAttributes(fieldType, currentSite) {
    const patterns = this.getFieldPatterns(fieldType);
    const inputs = document.querySelectorAll('input, select, textarea');

    for (const input of inputs) {
      let confidence = 0;
      const name = input.name?.toLowerCase() || '';
      const id = input.id?.toLowerCase() || '';
      const placeholder = input.placeholder?.toLowerCase() || '';
      const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';

      for (const pattern of patterns) {
        if (name.includes(pattern)) confidence += 30;
        if (id.includes(pattern)) confidence += 25;
        if (placeholder.includes(pattern)) confidence += 15;
        if (ariaLabel.includes(pattern)) confidence += 20;
      }

      if (confidence >= 70 && this.isVisible(input)) {
        return { element: input, confidence: Math.min(confidence, 85) };
      }
    }

    return null;
  }

  detectByContext(fieldType, currentSite) {
    const patterns = this.getFieldPatterns(fieldType);
    const inputs = document.querySelectorAll('input, select, textarea');

    for (const input of inputs) {
      const label = this.findAssociatedLabel(input);
      if (!label) continue;

      const labelText = label.textContent.toLowerCase();
      let confidence = 0;

      for (const pattern of patterns) {
        if (labelText.includes(pattern)) {
          confidence = 75;
          break;
        }
      }

      if (confidence >= 70 && this.isVisible(input)) {
        return { element: input, confidence };
      }
    }

    return null;
  }

  detectByFuzzyMatch(fieldType, currentSite) {
    // Implement fuzzy matching as last resort
    const patterns = this.getFieldPatterns(fieldType);
    const inputs = document.querySelectorAll('input, select, textarea');

    for (const input of inputs) {
      const combined = [
        input.name,
        input.id,
        input.placeholder,
        input.getAttribute('aria-label')
      ].filter(Boolean).join(' ').toLowerCase();

      for (const pattern of patterns) {
        if (this.levenshteinDistance(combined, pattern) <= 2) {
          if (this.isVisible(input)) {
            return { element: input, confidence: 60 };
          }
        }
      }
    }

    return null;
  }

  getFieldPatterns(fieldType) {
    const patterns = {
      firstName: ['first', 'fname', 'given', 'forename'],
      lastName: ['last', 'lname', 'surname', 'family'],
      email: ['email', 'mail', 'e-mail'],
      phone: ['phone', 'mobile', 'tel', 'cell']
    };
    return patterns[fieldType] || [];
  }

  getXPathPatterns(fieldType) {
    return [
      `.//input[contains(translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${fieldType}')]`,
      `.//input[contains(translate(@id, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${fieldType}')]`
    ];
  }

  getCSSPatterns(fieldType) {
    return [
      `input[name*="${fieldType}" i]`,
      `input[id*="${fieldType}" i]`,
      `input[placeholder*="${fieldType}" i]`
    ];
  }

  evaluateXPath(xpath) {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  }

  isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  findAssociatedLabel(input) {
    return input.closest('label') || document.querySelector(`label[for="${input.id}"]`);
  }

  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

if (typeof window !== 'undefined') {
  window.AdvancedFieldDetector = AdvancedFieldDetector;
}
