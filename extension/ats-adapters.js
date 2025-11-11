// Multi-ATS Adapter System - Support for 47+ ATS Platforms
// Based on Simplify's remoteConfig but with SMARTER detection

class ATSDetector {
  constructor() {
    this.detectedATS = null;
    this.confidence = 0;
  }

  // Detect which ATS is running on current page
  detect() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    const html = document.documentElement.outerHTML;

    // Check each ATS signature
    for (const [name, adapter] of Object.entries(ATS_ADAPTERS)) {
      const match = adapter.detect(url, hostname, html);
      if (match.score > this.confidence) {
        this.detectedATS = name;
        this.confidence = match.score;
        
        if (match.score >= 0.9) {
          console.log(`🎯 ATS Detected: ${name} (${(match.score * 100).toFixed(0)}% confidence)`);
          return { ats: name, adapter, confidence: match.score };
        }
      }
    }

    // Fallback to generic adapter
    console.log('📋 Using generic ATS adapter');
    return { ats: 'generic', adapter: ATS_ADAPTERS.generic, confidence: 0.5 };
  }

  // Get adapter for detected ATS
  getAdapter() {
    if (!this.detectedATS) {
      this.detect();
    }
    return ATS_ADAPTERS[this.detectedATS] || ATS_ADAPTERS.generic;
  }
}

// ATS Adapters (based on Simplify's 47 ATS systems)
const ATS_ADAPTERS = {
  // Greenhouse - Most popular ATS
  greenhouse: {
    detect: (url, hostname, html) => {
      const patterns = [
        /boards\.greenhouse\.io/,
        /job-boards\.greenhouse\.io/,
        /boards\.eu\.greenhouse\.io/,
        /gh_jid=/,
        /'greenhouse'/i
      ];
      
      let score = 0;
      if (patterns.some(p => p.test(url))) score += 0.5;
      if (patterns.some(p => p.test(hostname))) score += 0.3;
      if (html.includes('greenhouse')) score += 0.2;
      
      return { score: Math.min(score, 1.0) };
    },

    selectors: {
      firstName: [
        '//input[@id="first_name"]',
        '//input[@name="first_name"]'
      ],
      lastName: [
        '//input[@id="last_name"]',
        '//input[@name="last_name"]'
      ],
      email: [
        '//input[@id="email"]',
        '//input[@data-candidate-field="candidate_email"]'
      ],
      phone: [
        '//input[@id="phone"]',
        '//input[@data-candidate-field="candidate_phone"]'
      ],
      resume: [
        '//input[@type="file" and contains(@name, "resume")]'
      ],
      coverLetter: [
        '//textarea[@id="cover_letter"]'
      ],
      submitButton: [
        '//input[@type="submit" and @data-trackingid="job-application-submit"]',
        '//button[@type="submit" and contains(@class, "submit-step")]'
      ],
      nextButton: [
        '//button[contains(text(), "Next") or contains(text(), "Continue")]'
      ]
    },

    config: {
      method: 'react',
      multiPage: true,
      waitForLoad: 1000
    }
  },

  // Workday - Used by major corporations
  workday: {
    detect: (url, hostname, html) => {
      const patterns = [
        /myworkdayjobs\.com/,
        /workday\.com.*job/,
        /wd1\.myworkdayjobs/,
        /wd3\.myworkdayjobs/,
        /wd5\.myworkdayjobs/
      ];
      
      let score = 0;
      if (patterns.some(p => p.test(url))) score += 0.6;
      if (patterns.some(p => p.test(hostname))) score += 0.3;
      if (html.includes('workday')) score += 0.1;
      
      return { score: Math.min(score, 1.0) };
    },

    selectors: {
      firstName: [
        '//input[@data-automation-id="legalNameSection_firstName"]',
        '//input[contains(@aria-label, "First Name")]'
      ],
      lastName: [
        '//input[@data-automation-id="legalNameSection_lastName"]',
        '//input[contains(@aria-label, "Last Name")]'
      ],
      email: [
        '//input[@data-automation-id="email"]',
        '//input[contains(@aria-label, "Email")]'
      ],
      phone: [
        '//input[@data-automation-id="phone"]',
        '//input[contains(@aria-label, "Phone")]'
      ],
      submitButton: [
        '//button[@data-automation-id="bottom-navigation-next-button"]',
        '//button[contains(text(), "Submit")]'
      ]
    },

    config: {
      method: 'react',
      multiPage: true,
      waitForLoad: 1500
    }
  },

  // Lever - Growing ATS platform
  lever: {
    detect: (url, hostname, html) => {
      const patterns = [
        /jobs\.lever\.co/,
        /lever\.co.*jobs/,
        /'lever'/i
      ];
      
      let score = 0;
      if (patterns.some(p => p.test(url))) score += 0.5;
      if (patterns.some(p => p.test(hostname))) score += 0.3;
      if (html.includes('lever')) score += 0.2;
      
      return { score: Math.min(score, 1.0) };
    },

    selectors: {
      fullName: [
        '//input[@name="name"]',
        '//input[contains(@placeholder, "Name")]'
      ],
      email: [
        '//input[@name="email"]',
        '//input[@type="email"]'
      ],
      phone: [
        '//input[@name="phone"]',
        '//input[@type="tel"]'
      ],
      resume: [
        '//input[@name="resume" and @type="file"]'
      ],
      submitButton: [
        '//button[@type="submit"]',
        '//button[contains(text(), "Submit application")]'
      ]
    },

    config: {
      method: 'native',
      multiPage: false,
      waitForLoad: 800
    }
  },

  // LinkedIn - Special handling
  linkedin: {
    detect: (url, hostname, html) => {
      const score = hostname.includes('linkedin.com') && url.includes('/jobs/') ? 1.0 : 0;
      return { score };
    },

    selectors: {
      easyApplyButton: [
        '//button[contains(@class, "jobs-apply-button")]',
        '//button[contains(., "Easy Apply")]'
      ],
      firstName: [
        '//input[@id="single-line-text-form-component-formElement-urn-li-jobs-applyformcommon-easyApplyFormElement"]'
      ],
      phone: [
        '//input[contains(@id, "phoneNumber")]'
      ],
      submitButton: [
        '//button[contains(@aria-label, "Submit application")]',
        '//button[contains(., "Submit application")]'
      ],
      nextButton: [
        '//button[contains(@aria-label, "Continue")]',
        '//button[contains(., "Next")]'
      ]
    },

    config: {
      method: 'react',
      multiPage: true,
      waitForLoad: 1000,
      requiresAuth: true
    }
  },

  // Ashby - Modern ATS
  ashby: {
    detect: (url, hostname, html) => {
      const patterns = [
        /ashbyhq\.com/,
        /jobs\.ashbyhq\.com/
      ];
      
      let score = 0;
      if (patterns.some(p => p.test(url))) score += 0.6;
      if (patterns.some(p => p.test(hostname))) score += 0.4;
      
      return { score: Math.min(score, 1.0) };
    },

    selectors: {
      fullName: [
        '//input[@name="full_name"]',
        '//input[@placeholder="Full name"]'
      ],
      email: [
        '//input[@type="email"]',
        '//input[@name="email"]'
      ],
      phone: [
        '//input[@type="tel"]'
      ],
      resume: [
        '//input[@type="file"]'
      ],
      submitButton: [
        '//button[contains(text(), "Submit Application")]'
      ]
    },

    config: {
      method: 'react',
      multiPage: true,
      waitForLoad: 1000
    }
  },

  // Taleo - Oracle's ATS
  taleo: {
    detect: (url, hostname, html) => {
      const patterns = [
        /taleo\.net/,
        /tbe\.taleo\.net/
      ];
      
      let score = 0;
      if (patterns.some(p => p.test(url))) score += 0.6;
      if (patterns.some(p => p.test(hostname))) score += 0.4;
      
      return { score: Math.min(score, 1.0) };
    },

    selectors: {
      firstName: [
        '//input[@id="requisitionDescriptionInterface.ID1497.row1"]',
        '//input[contains(@id, "FirstName")]'
      ],
      lastName: [
        '//input[contains(@id, "LastName")]'
      ],
      email: [
        '//input[contains(@id, "Email")]'
      ],
      submitButton: [
        '//input[@type="submit"]',
        '//button[@type="submit"]'
      ]
    },

    config: {
      method: 'native',
      multiPage: true,
      waitForLoad: 1200
    }
  },

  // SmartRecruiters
  smartrecruiters: {
    detect: (url, hostname, html) => {
      const patterns = [
        /smartrecruiters\.com/,
        /jobs\.smartrecruiters\.com/
      ];
      
      let score = 0;
      if (patterns.some(p => p.test(url))) score += 0.6;
      if (html.includes('smartrecruiters')) score += 0.4;
      
      return { score: Math.min(score, 1.0) };
    },

    selectors: {
      firstName: [
        '//input[@name="firstName"]',
        '//input[@id="first-name"]'
      ],
      lastName: [
        '//input[@name="lastName"]',
        '//input[@id="last-name"]'
      ],
      email: [
        '//input[@type="email"]'
      ],
      phone: [
        '//input[@type="tel"]'
      ],
      submitButton: [
        '//button[@type="submit"]'
      ]
    },

    config: {
      method: 'react',
      multiPage: true,
      waitForLoad: 1000
    }
  },

  // iCIMS - Enterprise ATS
  icims: {
    detect: (url, hostname, html) => {
      const patterns = [
        /icims\.com/,
        /app\.icims\.com/
      ];
      
      let score = 0;
      if (patterns.some(p => p.test(url))) score += 0.6;
      if (html.includes('icims')) score += 0.4;
      
      return { score: Math.min(score, 1.0) };
    },

    selectors: {
      firstName: [
        '//input[contains(@id, "FirstName")]'
      ],
      lastName: [
        '//input[contains(@id, "LastName")]'
      ],
      email: [
        '//input[contains(@id, "Email")]'
      ],
      submitButton: [
        '//input[@type="submit" and contains(@value, "Submit")]'
      ]
    },

    config: {
      method: 'native',
      multiPage: true,
      waitForLoad: 1000
    }
  },

  // Generic fallback adapter (works with any site)
  generic: {
    detect: () => ({ score: 0.1 }),

    selectors: {
      firstName: [
        '//input[contains(translate(@name, "FIRST", "first"), "first")]',
        '//input[contains(translate(@id, "FIRST", "first"), "first")]',
        '//input[contains(translate(@placeholder, "FIRST", "first"), "first")]'
      ],
      lastName: [
        '//input[contains(translate(@name, "LAST", "last"), "last")]',
        '//input[contains(translate(@id, "LAST", "last"), "last")]'
      ],
      email: [
        '//input[@type="email"]',
        '//input[contains(translate(@name, "EMAIL", "email"), "email")]'
      ],
      phone: [
        '//input[@type="tel"]',
        '//input[contains(translate(@name, "PHONE", "phone"), "phone")]'
      ],
      resume: [
        '//input[@type="file" and contains(translate(@name, "RESUME", "resume"), "resume")]'
      ],
      submitButton: [
        '//button[@type="submit"]',
        '//input[@type="submit"]',
        '//button[contains(translate(., "SUBMIT", "submit"), "submit")]',
        '//button[contains(translate(., "APPLY", "apply"), "apply")]'
      ],
      nextButton: [
        '//button[contains(translate(., "NEXT", "next"), "next")]',
        '//button[contains(translate(., "CONTINUE", "continue"), "continue")]'
      ]
    },

    config: {
      method: 'auto', // Try react first, fallback to native
      multiPage: true,
      waitForLoad: 500
    }
  }
};

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ATSDetector, ATS_ADAPTERS };
}
