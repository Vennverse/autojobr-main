// XPath Selector Engine - More Powerful than CSS Selectors
// Based on Simplify's approach but BETTER

class XPathEngine {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  // Evaluate XPath expression and return elements
  evaluate(xpathExpr, contextNode = document, returnType = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) {
    try {
      const result = document.evaluate(
        xpathExpr,
        contextNode,
        null,
        returnType,
        null
      );

      if (returnType === XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) {
        const nodes = [];
        for (let i = 0; i < result.snapshotLength; i++) {
          nodes.push(result.snapshotItem(i));
        }
        return nodes;
      }

      return result.singleNodeValue;
    } catch (error) {
      console.error('XPath evaluation error:', xpathExpr, error);
      return returnType === XPathResult.ORDERED_NODE_SNAPSHOT_TYPE ? [] : null;
    }
  }

  // Find element using multiple XPath selectors with priority
  findElement(selectors, contextNode = document) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }

    for (const selector of selectors) {
      const cacheKey = `${selector}:${contextNode === document ? 'doc' : 'ctx'}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached && document.contains(cached)) {
          this.stats.hits++;
          return cached;
        }
        this.cache.delete(cacheKey);
      }

      const result = this.evaluate(selector, contextNode, XPathResult.FIRST_ORDERED_NODE_TYPE);
      if (result) {
        this.cache.set(cacheKey, result);
        this.stats.misses++;
        return result;
      }
    }

    return null;
  }

  // Find all elements matching any of the selectors
  findElements(selectors, contextNode = document) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }

    const allElements = [];
    const seen = new Set();

    for (const selector of selectors) {
      const elements = this.evaluate(selector, contextNode);
      for (const el of elements) {
        if (!seen.has(el)) {
          seen.add(el);
          allElements.push(el);
        }
      }
    }

    return allElements;
  }

  // Clear cache (call when DOM changes significantly)
  clearCache() {
    this.cache.clear();
  }

  // Get stats for debugging
  getStats() {
    return { ...this.stats };
  }
}

// Field-specific XPath patterns (like Simplify but MORE comprehensive)
const FIELD_XPATHS = {
  // Personal Information
  firstName: [
    './/input[@id="first_name" or @id="firstName" or @name="first_name" or @name="firstName"]',
    './/input[contains(translate(@name, "FIRSTNAME", "firstname"), "first")]',
    './/label[contains(translate(., "FIRST NAME", "first name"), "first name")]/following::input[@type="text"][1]',
    './/input[contains(@autocomplete, "given-name")]',
    './/input[@placeholder and contains(translate(@placeholder, "FIRST", "first"), "first")]'
  ],
  
  lastName: [
    './/input[@id="last_name" or @id="lastName" or @name="last_name" or @name="lastName"]',
    './/input[contains(translate(@name, "LASTNAME", "lastname"), "last")]',
    './/label[contains(translate(., "LAST NAME", "last name"), "last name")]/following::input[@type="text"][1]',
    './/input[contains(@autocomplete, "family-name")]',
    './/input[@placeholder and contains(translate(@placeholder, "LAST", "last"), "last")]'
  ],

  fullName: [
    './/input[@id="full_name" or @id="fullName" or @id="name"]',
    './/input[@name="full_name" or @name="fullName" or @name="name"]',
    './/label[contains(translate(., "FULL NAME", "full name"), "full name")]/following::input[@type="text"][1]',
    './/input[contains(@autocomplete, "name")]',
    './/input[@placeholder and contains(translate(@placeholder, "FULL NAME", "full name"), "full name")]'
  ],

  email: [
    './/input[@type="email"]',
    './/input[@id="email" or @name="email"]',
    './/input[contains(translate(@name, "EMAIL", "email"), "email")]',
    './/input[contains(@autocomplete, "email")]',
    './/label[contains(translate(., "EMAIL", "email"), "email")]/following::input[1]',
    './/input[@placeholder and contains(translate(@placeholder, "EMAIL", "email"), "email")]'
  ],

  phone: [
    './/input[@type="tel"]',
    './/input[@id="phone" or @name="phone"]',
    './/input[contains(translate(@name, "PHONE", "phone"), "phone")]',
    './/input[contains(@autocomplete, "tel")]',
    './/label[contains(translate(., "PHONE", "phone"), "phone")]/following::input[1]',
    './/input[@placeholder and contains(translate(@placeholder, "PHONE", "phone"), "phone")]'
  ],

  // Work Information
  currentCompany: [
    './/input[@id="current_company" or @name="current_company" or @name="currentCompany"]',
    './/input[contains(translate(@name, "COMPANY", "company"), "company")]',
    './/label[contains(translate(., "CURRENT COMPANY", "current company"), "current company")]/following::input[@type="text"][1]',
    './/input[@placeholder and contains(translate(@placeholder, "COMPANY", "company"), "company")]'
  ],

  currentTitle: [
    './/input[@id="current_title" or @name="current_title" or @name="currentTitle"]',
    './/input[contains(translate(@name, "TITLE", "title"), "title")]',
    './/label[contains(translate(., "CURRENT TITLE", "current title"), "current title")]/following::input[@type="text"][1]',
    './/label[contains(translate(., "JOB TITLE", "job title"), "job title")]/following::input[@type="text"][1]'
  ],

  yearsExperience: [
    './/input[@id="years_experience" or @name="years_experience"]',
    './/input[contains(translate(@name, "EXPERIENCE", "experience"), "experience")]',
    './/label[contains(translate(., "YEARS OF EXPERIENCE", "years of experience"), "experience")]/following::input[@type="number" or @type="text"][1]',
    './/select[contains(translate(@name, "EXPERIENCE", "experience"), "experience")]'
  ],

  // Social Links
  linkedin: [
    './/input[@id="linkedin" or @name="linkedin"]',
    './/input[contains(translate(@name, "LINKEDIN", "linkedin"), "linkedin")]',
    './/input[contains(@autocomplete, "linkedin")]',
    './/label[contains(translate(., "LINKEDIN", "linkedin"), "linkedin")]/following::input[@type="text" or @type="url"][1]'
  ],

  github: [
    './/input[@id="github" or @name="github"]',
    './/input[contains(translate(@name, "GITHUB", "github"), "github")]',
    './/label[contains(translate(., "GITHUB", "github"), "github")]/following::input[@type="text" or @type="url"][1]'
  ],

  portfolio: [
    './/input[@id="portfolio" or @name="portfolio" or @name="website"]',
    './/input[contains(translate(@name, "PORTFOLIO", "portfolio"), "portfolio")]',
    './/label[contains(translate(., "PORTFOLIO", "portfolio"), "portfolio")]/following::input[@type="url" or @type="text"][1]',
    './/label[contains(translate(., "WEBSITE", "website"), "website")]/following::input[@type="url" or @type="text"][1]'
  ],

  // Location
  city: [
    './/input[@id="city" or @name="city"]',
    './/input[contains(translate(@name, "CITY", "city"), "city")]',
    './/label[contains(translate(., "CITY", "city"), "city")]/following::input[@type="text"][1]'
  ],

  state: [
    './/select[@id="state" or @name="state"]',
    './/select[contains(translate(@name, "STATE", "state"), "state")]',
    './/label[contains(translate(., "STATE", "state"), "state")]/following::select[1]'
  ],

  zipCode: [
    './/input[@id="zip" or @id="zipcode" or @id="postal_code"]',
    './/input[@name="zip" or @name="zipcode" or @name="postal_code"]',
    './/input[contains(translate(@name, "ZIP", "zip"), "zip")]',
    './/label[contains(translate(., "ZIP", "zip"), "zip")]/following::input[1]'
  ],

  // Education
  school: [
    './/input[@id="school" or @name="school" or @name="university"]',
    './/input[contains(translate(@name, "SCHOOL", "school"), "school")]',
    './/input[contains(translate(@name, "UNIVERSITY", "university"), "university")]',
    './/label[contains(translate(., "SCHOOL", "school"), "school") or contains(translate(., "UNIVERSITY", "university"), "university")]/following::input[@type="text"][1]'
  ],

  degree: [
    './/select[@id="degree" or @name="degree"]',
    './/select[contains(translate(@name, "DEGREE", "degree"), "degree")]',
    './/label[contains(translate(., "DEGREE", "degree"), "degree")]/following::select[1]'
  ],

  major: [
    './/input[@id="major" or @name="major" or @name="field_of_study"]',
    './/input[contains(translate(@name, "MAJOR", "major"), "major")]',
    './/label[contains(translate(., "MAJOR", "major"), "major")]/following::input[@type="text"][1]'
  ],

  graduationYear: [
    './/select[@id="graduation_year" or @name="graduation_year"]',
    './/select[contains(translate(@name, "GRADUATION", "graduation"), "graduation")]',
    './/label[contains(translate(., "GRADUATION", "graduation"), "graduation")]/following::select[1]',
    './/input[@placeholder and contains(translate(@placeholder, "YEAR", "year"), "year") and (@type="number" or @type="text")]'
  ],

  // Resume/Cover Letter
  resume: [
    './/input[@type="file" and contains(translate(@name, "RESUME", "resume"), "resume")]',
    './/input[@type="file" and contains(translate(@id, "RESUME", "resume"), "resume")]',
    './/label[contains(translate(., "RESUME", "resume"), "resume")]/following::input[@type="file"][1]'
  ],

  coverLetter: [
    './/textarea[@id="cover_letter" or @name="cover_letter" or @name="coverLetter"]',
    './/textarea[contains(translate(@name, "COVER", "cover"), "cover")]',
    './/label[contains(translate(., "COVER LETTER", "cover letter"), "cover letter")]/following::textarea[1]'
  ],

  // Diversity & Legal
  veteran: [
    './/input[@type="checkbox" and contains(translate(@name, "VETERAN", "veteran"), "veteran")]',
    './/select[contains(translate(@name, "VETERAN", "veteran"), "veteran")]'
  ],

  disability: [
    './/input[@type="checkbox" and contains(translate(@name, "DISABILITY", "disability"), "disability")]',
    './/select[contains(translate(@name, "DISABILITY", "disability"), "disability")]'
  ],

  ethnicity: [
    './/select[@id="ethnicity" or @name="ethnicity" or @name="race"]',
    './/select[contains(translate(@name, "ETHNICITY", "ethnicity"), "ethnicity")]',
    './/select[contains(translate(@name, "RACE", "race"), "race")]'
  ],

  gender: [
    './/select[@id="gender" or @name="gender"]',
    './/select[contains(translate(@name, "GENDER", "gender"), "gender")]',
    './/label[contains(translate(., "GENDER", "gender"), "gender")]/following::select[1]'
  ],

  // Authorization
  authorized: [
    './/select[contains(translate(@name, "AUTHORIZED", "authorized"), "authorized")]',
    './/input[@type="radio" and contains(translate(@name, "AUTHORIZED", "authorized"), "authorized")]',
    './/label[contains(translate(., "AUTHORIZED TO WORK", "authorized to work"), "authorized")]/following::select[1]'
  ],

  sponsorship: [
    './/select[contains(translate(@name, "SPONSORSHIP", "sponsorship"), "sponsorship")]',
    './/input[@type="radio" and contains(translate(@name, "SPONSORSHIP", "sponsorship"), "sponsorship")]'
  ],

  // Submit buttons
  submitButton: [
    './/button[@type="submit"]',
    './/input[@type="submit"]',
    './/button[contains(translate(., "SUBMIT", "submit"), "submit")]',
    './/button[contains(translate(., "APPLY", "apply"), "apply")]',
    './/a[contains(@class, "submit") or contains(@class, "apply")]'
  ],

  // Next/Continue buttons for multi-page forms
  nextButton: [
    './/button[contains(translate(., "NEXT", "next"), "next")]',
    './/button[contains(translate(., "CONTINUE", "continue"), "continue")]',
    './/input[@type="button" and contains(translate(@value, "NEXT", "next"), "next")]'
  ]
};

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { XPathEngine, FIELD_XPATHS };
}
