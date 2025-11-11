
// XPath Helper - More robust than CSS selectors for complex ATS forms
class XPathHelper {
  static evaluateXPath(xpathExpr, contextNode = document) {
    const result = document.evaluate(
      xpathExpr,
      contextNode,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  }

  static evaluateXPathAll(xpathExpr, contextNode = document) {
    const result = document.evaluate(
      xpathExpr,
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
  }

  static findFieldByXPath(xpathSelectors) {
    if (!Array.isArray(xpathSelectors)) {
      xpathSelectors = [xpathSelectors];
    }

    for (const selector of xpathSelectors) {
      const element = this.evaluateXPath(selector);
      if (element && this.isVisible(element)) {
        return element;
      }
    }
    return null;
  }

  static isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
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

  // Convert CSS selector to XPath for fallback
  static cssToXPath(cssSelector) {
    // Simple conversion for common cases
    if (cssSelector.startsWith('#')) {
      return `.//*[@id='${cssSelector.substring(1)}']`;
    }
    if (cssSelector.startsWith('.')) {
      return `.//*[contains(@class, '${cssSelector.substring(1)}')]`;
    }
    return `.//${cssSelector}`;
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.XPathHelper = XPathHelper;
}
