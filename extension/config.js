// Configuration for AutoJobr Extension
const CONFIG = Object.freeze({
  API_BASE_URL: 'https://7e3aa0be-aaa8-430c-b6b2-b03107298397-00-24aujsx55hefp.worf.replit.dev',
  ENDPOINTS: {
    USER: '/api/user',
    PROFILE: '/api/profile',
    EXTENSION_PROFILE: '/api/extension/profile',
    SKILLS: '/api/skills',
    WORK_EXPERIENCE: '/api/work-experience',
    EDUCATION: '/api/education',
    GENERATE_COVER_LETTER: '/api/generate-cover-letter',
    JOB_ANALYSIS: '/api/jobs/analyze',
    HEALTH_CHECK: '/api/health',
    HEALTH_CHECK_SIMPLE: '/api/health/simple'
  },
  STORAGE_KEYS: {
    USER_DATA: 'autojobr_user_data',
    AUTH_TOKEN: 'autojobr_auth_token',
    PROFILE_CACHE: 'autojobr_profile_cache',
    SETTINGS: 'autojobr_settings'
  },
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  // Job board configurations
  SUPPORTED_JOB_BOARDS: [
    'linkedin.com',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'ziprecruiter.com',
    'stackoverflow.com',
    'angel.co',
    'wellfound.com',
    'greenhouse.io',
    'lever.co',
    'workday.com',
    'myworkdayjobs.com',
    'bamboohr.com'
  ],
  JOB_BOARD_CONFIGS: {
    'linkedin.com': {
      name: 'LinkedIn',
      selectors: {
        applyButton: '.jobs-apply-button',
        easyApply: '.jobs-easy-apply-button'
      }
    },
    'indeed.com': {
      name: 'Indeed',
      selectors: {
        applyButton: '.indeed-apply-button',
        indeedApply: '.indeed-apply-widget'
      }
    },
    'glassdoor.com': {
      name: 'Glassdoor',
      selectors: {
        applyButton: '.applyButton'
      }
    },
    'monster.com': {
      name: 'Monster',
      selectors: {
        applyButton: '.applyButtonLink'
      }
    },
    'ziprecruiter.com': {
      name: 'ZipRecruiter',
      selectors: {
        applyButton: '.job_apply',
        oneClickApply: '.one-click-apply'
      }
    },
    'smartrecruiters.com': {
      name: 'SmartRecruiters',
      selectors: {
        applyButton: '.apply-button'
      }
    },
    'jobvite.com': {
      name: 'Jobvite',
      selectors: {
        applyButton: '.jv-button-apply'
      }
    },
    'icims.com': {
      name: 'iCIMS',
      selectors: {
        applyButton: '.iCIMS_ApplyButton'
      }
    },
    'taleo.net': {
      name: 'Taleo',
      selectors: {
        applyButton: '.requisitionApplyButton'
      }
    },
    'successfactors.com': {
      name: 'SuccessFactors',
      selectors: {
        applyButton: '.sf-apply-button'
      }
    },
    'naukri.com': {
      name: 'Naukri',
      selectors: {
        applyButton: '.apply-button'
      }
    },
    'shine.com': {
      name: 'Shine',
      selectors: {
        applyButton: '.apply-btn'
      }
    },
    'timesjobs.com': {
      name: 'TimesJobs',
      selectors: {
        applyButton: '.apply-job-btn'
      }
    },
    'foundit.in': {
      name: 'Foundit',
      selectors: {
        applyButton: '.apply-button'
      }
    }
  },
  FIELD_MAPPINGS: Object.freeze({
    // Personal Information with enhanced patterns
    firstName: [
      // Standard HTML attributes
      'input[name*="first" i]',
      'input[name*="given" i]',
      'input[id*="first" i]',
      'input[id*="given" i]',
      // Placeholder and labels
      'input[placeholder*="first" i]',
      'input[placeholder*="given" i]',
      'input[aria-label*="first" i]',
      'input[aria-label*="given" i]',
      // Data attributes
      '[data-automation-id*="first"]',
      '[data-automation-id*="firstName"]',
      '[data-automation-id*="given"]',
      '[data-testid*="first"]',
      '[data-testid*="firstName"]',
      '[data-field*="first" i]',
      // React/Angular patterns
      '[formcontrolname*="first" i]',
      '[ng-model*="first" i]',
      // Common class patterns
      '.first-name-input',
      '.given-name-input',
      // Form group patterns
      'div[class*="first-name"] input',
      'div[class*="given-name"] input',
      'label[for*="first"] + input',
      // Specific platform patterns
      'input[name="applicant.firstName"]',
      'input[name="candidate.firstName"]',
      'input[name$=".first_name"]'
    ],
    lastName: [
      'input[name*="last" i]',
      'input[placeholder*="last" i]',
      'input[id*="last" i]',
      '[data-automation-id*="last"]',
      '[data-testid*="last"]',
      '[data-automation-id*="lastName"]',
      'input[aria-label*="last" i]'
    ],
    country: [
      'select[name*="country" i]',
      'input[name*="country" i]',
      '[data-automation-id*="country"]',
      'select[aria-label*="country" i]',
      'input[placeholder*="country" i]'
    ],
    email: [
      // Standard HTML5
      'input[type="email"]',
      // Name attributes
      'input[name*="email" i]',
      'input[name*="e-mail" i]',
      'input[name$=".email"]',
      'input[name="applicant.emailAddress"]',
      // Placeholders and labels
      'input[placeholder*="email" i]',
      'input[placeholder*="e-mail" i]',
      'input[aria-label*="email" i]',
      // Data attributes
      '[data-automation-id*="email"]',
      '[data-testid*="email"]',
      '[data-field="email"]',
      // Form control patterns
      '[formcontrolname="email"]',
      '[ng-model*="email"]',
      // Class patterns
      '.email-input',
      '.e-mail-input',
      // Form group patterns
      'div[class*="email-field"] input',
      'label[for*="email"] + input',
      // Specific platforms
      'input[name="candidate.email"]',
      'input[name="contact.email"]',
      'input[name*="primary"][name*="email"]'
    ],
    phone: [
      // Standard HTML5
      'input[type="tel"]',
      // Name attributes
      'input[name*="phone" i]',
      'input[name*="mobile" i]',
      'input[name*="cell" i]',
      'input[name$=".phoneNumber"]',
      'input[name="applicant.phone"]',
      // Placeholders and labels
      'input[placeholder*="phone" i]',
      'input[placeholder*="mobile" i]',
      'input[aria-label*="phone" i]',
      'input[aria-label*="telephone" i]',
      // Data attributes
      '[data-automation-id*="phone"]',
      '[data-automation-id*="mobile"]',
      '[data-testid*="phone"]',
      '[data-field*="phone"]',
      // Form control patterns
      '[formcontrolname*="phone"]',
      '[ng-model*="phone"]',
      // Class patterns
      '.phone-input',
      '.mobile-input',
      '.telephone-input',
      // Form group patterns
      'div[class*="phone-field"] input',
      'div[class*="mobile-field"] input',
      'label[for*="phone"] + input',
      // International variations
      'input[name*="contact"][name*="number"]',
      'input[name*="primary"][name*="phone"]',
      // Platform specific
      'input[name="phoneNumber.number"]',
      'input[name="candidate.phone"]'
    ],
    address: [
      'input[name*="address" i]',
      'textarea[name*="address" i]',
      '[data-automation-id*="address"]'
    ],
    city: [
      'input[name*="city" i]',
      '[data-automation-id*="city"]'
    ],
    state: [
      'select[name*="state" i]',
      'input[name*="state" i]',
      '[data-automation-id*="state"]'
    ],
    zipCode: [
      'input[name*="zip" i]',
      'input[name*="postal" i]',
      '[data-automation-id*="zip"]'
    ],
    linkedinUrl: [
      'input[name*="linkedin" i]',
      'input[placeholder*="linkedin" i]'
    ],
    githubUrl: [
      'input[name*="github" i]',
      'input[placeholder*="github" i]'
    ],
    portfolioUrl: [
      'input[name*="portfolio" i]',
      'input[name*="website" i]'
    ],
    yearsExperience: [
      'select[name*="experience" i]',
      'input[name*="experience" i]'
    ],
    university: [
      // Standard fields
      'input[name*="university" i]',
      'input[name*="college" i]',
      'input[name*="school" i]',
      'input[name*="institution" i]',
      // Autocomplete fields
      'input[role="combobox"][name*="university" i]',
      'input[role="combobox"][name*="school" i]',
      // Data attributes
      '[data-automation-id*="education"][data-automation-id*="school"]',
      '[data-testid*="university"]',
      '[data-field*="university"]',
      // Form patterns
      'div[class*="education"] input[name*="school"]',
      'div[class*="education"] input[name*="university"]',
      // Select elements for predefined lists
      'select[name*="university" i]',
      'select[name*="school" i]',
      // Specific patterns
      'input[name="education.schoolName"]',
      'input[name$=".institution_name"]'
    ],
    degree: [
      // Standard fields
      'select[name*="degree" i]',
      'input[name*="degree" i]',
      'select[name*="qualification" i]',
      // Data attributes
      '[data-automation-id*="degree"]',
      '[data-testid*="degree"]',
      '[data-field*="degree"]',
      // Common variations
      'select[name*="education"][name*="type"]',
      'select[name*="degree"][name*="level"]',
      // Specific patterns
      'select[name="education.degreeType"]',
      'select[name$=".degree_level"]',
      // Form group patterns
      'div[class*="degree-type"] select',
      'div[class*="qualification"] select'
    ],
    major: [
      // Standard fields
      'input[name*="major" i]',
      'input[name*="field" i]',
      'input[name*="course" i]',
      'select[name*="major" i]',
      // Data attributes
      '[data-automation-id*="major"]',
      '[data-testid*="major"]',
      '[data-field*="major"]',
      // Study field variations
      'input[name*="study"][name*="field"]',
      'select[name*="study"][name*="field"]',
      // Specific patterns
      'input[name="education.fieldOfStudy"]',
      'input[name$=".study_field"]',
      // Form group patterns
      'div[class*="field-of-study"] input',
      'div[class*="study-field"] input'
    ],
    // Work Authorization and Legal Status
    workAuthorization: [
      'select[name*="work" i][name*="authorization" i]',
      'select[name*="visa" i]',
      'select[name*="sponsorship" i]',
      'input[name*="authorized" i]',
      '[data-automation-id*="legallyAuthorizedToWork"]',
      '[data-automation-id*="workAuthorization"]',
      'select[aria-label*="work authorization" i]',
      'select[aria-label*="sponsorship" i]',
      'input[type="radio"][name*="work" i][name*="auth" i]'
    ],
    requireSponsorship: [
      'select[name*="sponsorship" i]',
      'input[name*="sponsorship" i]',
      '[data-automation-id*="sponsorship"]',
      'select[aria-label*="sponsorship" i]',
      'input[type="radio"][name*="sponsor" i]',
      'select[name*="visa" i][name*="support" i]'
    ],
    // Additional Education Fields
    gpa: [
      'input[name*="gpa" i]',
      'input[name*="grade" i]',
      '[data-automation-id*="gpa"]',
      'input[placeholder*="gpa" i]',
      'select[name*="gpa" i]'
    ],
    graduationYear: [
      'select[name*="graduation" i]',
      'input[name*="graduation" i]',
      'select[name*="year" i]',
      '[data-automation-id*="graduationYear"]',
      'select[aria-label*="graduation" i]',
      'input[type="number"][name*="year" i]'
    ],
    // Professional Experience
    currentCompany: [
      // Standard fields
      'input[name*="company" i]',
      'input[name*="employer" i]',
      'input[name*="organization" i]',
      // Current/Present company
      'input[name*="current"][name*="company" i]',
      'input[name*="present"][name*="employer" i]',
      // Data attributes
      '[data-automation-id*="company"]',
      '[data-automation-id*="employer"]',
      '[data-testid*="company"]',
      '[data-field*="company"]',
      // Placeholders and labels
      'input[placeholder*="company" i]',
      'input[placeholder*="employer" i]',
      'input[aria-label*="company" i]',
      'input[aria-label*="employer" i]',
      // Form control patterns
      '[formcontrolname*="company"]',
      '[ng-model*="company"]',
      // Specific patterns
      'input[name="experience.companyName"]',
      'input[name$=".employer_name"]',
      // Common variations
      'input[name*="work"][name*="company"]',
      'input[name*="employment"][name*="company"]'
    ],
    currentTitle: [
      // Standard fields
      'input[name*="title" i]',
      'input[name*="position" i]',
      'input[name*="role" i]',
      'input[name*="designation" i]',
      // Current position indicators
      'input[name*="current"][name*="title" i]',
      'input[name*="present"][name*="position" i]',
      // Data attributes
      '[data-automation-id*="jobTitle"]',
      '[data-automation-id*="position"]',
      '[data-testid*="title"]',
      '[data-field*="title"]',
      // Placeholders and labels
      'input[placeholder*="title" i]',
      'input[placeholder*="position" i]',
      'input[aria-label*="title" i]',
      'input[aria-label*="position" i]',
      // Form control patterns
      '[formcontrolname*="title"]',
      '[ng-model*="title"]',
      // Specific patterns
      'input[name="experience.jobTitle"]',
      'input[name$=".position_title"]',
      // Common variations
      'input[name*="work"][name*="title"]',
      'input[name*="employment"][name*="role"]'
    ],
    // Salary and Benefits
    expectedSalary: [
      'input[name*="salary" i]',
      'input[name*="compensation" i]',
      'input[name*="pay" i]',
      '[data-automation-id*="salary"]',
      'input[placeholder*="salary" i]',
      'select[name*="salary" i]',
      'input[type="number"][name*="wage" i]'
    ],
    salaryRange: [
      'select[name*="salary" i][name*="range" i]',
      'input[name*="min" i][name*="salary" i]',
      'input[name*="max" i][name*="salary" i]',
      'select[aria-label*="salary range" i]'
    ],
    // Availability and Preferences
    availableStartDate: [
      'input[name*="start" i]',
      'input[name*="available" i]',
      'input[type="date"]',
      '[data-automation-id*="startDate"]',
      'input[placeholder*="start date" i]',
      'select[name*="notice" i]'
    ],
    willingToRelocate: [
      'select[name*="relocate" i]',
      'input[name*="relocate" i]',
      '[data-automation-id*="relocate"]',
      'select[aria-label*="relocate" i]',
      'input[type="radio"][name*="relocate" i]',
      'input[type="checkbox"][name*="relocate" i]'
    ],
    preferredWorkLocation: [
      'select[name*="work" i][name*="location" i]',
      'input[name*="preferred" i][name*="location" i]',
      'select[name*="remote" i]',
      'input[type="radio"][name*="work" i][name*="pref" i]'
    ],
    // Skills and Certifications
    programmingLanguages: [
      // Standard fields
      'textarea[name*="programming" i]',
      'textarea[name*="languages" i]',
      'input[name*="skills" i]',
      'textarea[name*="technical" i]',
      // Multi-select inputs
      'select[multiple][name*="skills"]',
      'select[multiple][name*="technologies"]',
      // Data attributes
      '[data-automation-id*="skills"]',
      '[data-testid*="skills"]',
      '[data-field*="technical-skills"]',
      // Common variations
      'div[class*="skills-input"] input',
      'div[class*="technologies"] input',
      // Specific platform patterns
      'input[name="technical.programmingLanguages"]',
      'input[name*="skills"][type="text"]',
      // Tag inputs
      'div[class*="tags"] input[type="text"]',
      'div[role="combobox"][aria-label*="skills"]',
      // Skill chips/tokens
      'div[class*="skill-chips"] input',
      'div[class*="token-input"] input'
    ],
    technicalSkills: [
      // Frameworks and tools
      'textarea[name*="framework" i]',
      'input[name*="tools" i]',
      'select[multiple][name*="technologies"]',
      // Data attributes
      '[data-automation-id*="technicalSkills"]',
      '[data-testid*="technologies"]',
      // Common variations
      'div[class*="tech-stack"] input',
      'div[class*="frameworks"] input',
      // Specific patterns
      'input[name="technical.frameworks"]',
      'input[name*="tech"][name*="stack"]'
    ],
    certifications: [
      // Standard fields
      'textarea[name*="certification" i]',
      'input[name*="certified" i]',
      'textarea[name*="license" i]',
      // Placeholders and labels
      'input[placeholder*="certification" i]',
      'input[aria-label*="certifications" i]',
      // Data attributes
      '[data-automation-id*="certifications"]',
      '[data-testid*="certificates"]',
      '[data-field*="certifications"]',
      // Common variations
      'div[class*="certifications"] input',
      'div[class*="credentials"] input',
      // Specific patterns
      'input[name="professional.certifications"]',
      'input[name*="technical"][name*="certs"]'
    ],
    // Additional Information
    coverLetter: [
      'textarea[name*="cover" i]',
      'textarea[name*="letter" i]',
      'textarea[name*="message" i]',
      '[data-automation-id*="coverLetter"]',
      'textarea[placeholder*="cover letter" i]',
      'textarea[name*="intro" i]'
    ],
    whyInterested: [
      'textarea[name*="why" i]',
      'textarea[name*="interest" i]',
      'textarea[name*="motivation" i]',
      'textarea[placeholder*="why are you interested" i]'
    ],
    additionalInfo: [
      'textarea[name*="additional" i]',
      'textarea[name*="comments" i]',
      'textarea[name*="notes" i]',
      'textarea[placeholder*="additional" i]',
      'textarea[name*="other" i]'
    ],
    // References
    referenceName: [
      'input[name*="reference" i][name*="name" i]',
      'input[name*="ref" i][name*="name" i]',
      'input[placeholder*="reference name" i]'
    ],
    referenceEmail: [
      'input[name*="reference" i][name*="email" i]',
      'input[name*="ref" i][name*="email" i]',
      'input[placeholder*="reference email" i]'
    ],
    referencePhone: [
      'input[name*="reference" i][name*="phone" i]',
      'input[name*="ref" i][name*="phone" i]',
      'input[placeholder*="reference phone" i]'
    ],
    // Demographics (Optional)
    gender: [
      'select[name*="gender" i]',
      'input[type="radio"][name*="gender" i]',
      '[data-automation-id*="gender"]'
    ],
    ethnicity: [
      'select[name*="ethnicity" i]',
      'select[name*="race" i]',
      'input[type="checkbox"][name*="ethnicity" i]'
    ],
    veteranStatus: [
      'select[name*="veteran" i]',
      'input[type="radio"][name*="veteran" i]',
      '[data-automation-id*="veteran"]'
    ],
    disability: [
      'select[name*="disability" i]',
      'input[type="radio"][name*="disability" i]',
      '[data-automation-id*="disability"]'
    ],
    // Additional fields from resume analysis and onboarding
    achievements: [
      'textarea[name*="achievement" i]',
      'textarea[name*="accomplishment" i]',
      'textarea[name*="award" i]',
      'input[placeholder*="achievement" i]'
    ],
    projectExperience: [
      'textarea[name*="project" i]',
      'textarea[name*="portfolio" i]',
      'input[name*="project" i]',
      'textarea[placeholder*="project" i]'
    ],
    languages: [
      'input[name*="language" i]',
      'select[name*="language" i]',
      'textarea[name*="language" i]',
      '[data-automation-id*="language"]'
    ],
    industries: [
      'select[name*="industry" i]',
      'input[name*="industry" i]',
      'select[name*="sector" i]',
      '[data-automation-id*="industry"]'
    ],
    managementExperience: [
      'select[name*="management" i]',
      'input[type="radio"][name*="management" i]',
      'select[name*="leadership" i]',
      'input[name*="manager" i]'
    ],
    teamSize: [
      'select[name*="team" i][name*="size" i]',
      'input[name*="team" i][name*="size" i]',
      'select[name*="people" i][name*="managed" i]',
      'input[placeholder*="team size" i]'
    ],
    // Workday-specific field mappings
    workdayFirstName: [
      '[data-automation-id*="firstName"]',
      '[data-automation-id*="legalNameSection_firstName"]',
      'input[aria-label*="first name" i]'
    ],
    workdayLastName: [
      '[data-automation-id*="lastName"]',
      '[data-automation-id*="legalNameSection_lastName"]',
      'input[aria-label*="last name" i]'
    ],
    workdayEmail: [
      '[data-automation-id*="email"]',
      '[data-automation-id*="emailAddress"]',
      'input[aria-label*="email" i]'
    ],
    workdayPhone: [
      '[data-automation-id*="phone"]',
      '[data-automation-id*="phoneNumber"]',
      'input[aria-label*="phone" i]'
    ],
    workdayAddress: [
      '[data-automation-id*="address"]',
      '[data-automation-id*="addressLine"]',
      'input[aria-label*="address" i]'
    ],
    workdayCity: [
      '[data-automation-id*="city"]',
      'input[aria-label*="city" i]'
    ],
    workdayState: [
      '[data-automation-id*="state"]',
      '[data-automation-id*="region"]',
      'select[aria-label*="state" i]'
    ],
    workdayZip: [
      '[data-automation-id*="postalCode"]',
      '[data-automation-id*="zipCode"]',
      'input[aria-label*="zip" i]'
    ],
    workdayCountry: [
      '[data-automation-id*="country"]',
      'select[aria-label*="country" i]'
    ]
  },
  // Job search selectors
  jobSelectors: {
    title: [
      // Generic selectors
      'h1:not(.logo)', 
      '[data-automation-id*="jobTitle"]',
      '.job-title',
      '.position-title',
      // Platform specific selectors
      '.jobs-unified-top-card__job-title', // LinkedIn
      '.jobsearch-JobInfoHeader-title', // Indeed
      '[data-automation-id="jobPostingHeader"]', // Workday
      '.posting-headline h2', // Greenhouse
      '.posting-headline', // Lever
      // Common patterns
      '[class*="job"][class*="title"]',
      '[class*="position"][class*="title"]',
      'h1[class*="title"]',
      'h2[class*="title"]'
    ],
    company: [
      '[data-automation-id*="company"]',
      '.company-name',
      '[class*="company"]',
      'a[href*="company"]'
    ],
    location: [
      '[data-automation-id*="location"]',
      '.job-location',
      '[class*="location"]'
    ],
    description: [
      '[data-automation-id*="description"]',
      '.job-description',
      '[class*="description"]',
      '[role="main"]'
    ]
  },

  submissionSelectors: [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[data-automation-id*="submit"]',
    'button[data-automation-id*="apply"]',
    'button:contains("Submit")',
    'button:contains("Apply")',
    'a[href*="apply"]'
  ],

  version: '1.0.0'
});

// Enhanced API client with persistent authentication
class AutoJobrAPI {
  constructor() {
    this.baseURL = this.detectBackendURL();
    this.isAuthenticated = false;
    this.userProfile = null;
    this.healthCheckInterval = null;
    this.connectionStatus = 'unknown';
  }

  detectBackendURL() {
    // Use Replit app URL
    return 'https://7e3aa0be-aaa8-430c-b6b2-b03107298397-00-24aujsx55hefp.worf.replit.dev';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getStoredToken();
    
    const defaultOptions = {
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': chrome.runtime.getURL(''),
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (response.status === 401) {
        this.isAuthenticated = false;
        await this.clearStoredAuth();
        throw new Error('Authentication required');
      }

      if (response.status === 403) {
        throw new Error('Access forbidden - CORS or permission error');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async checkAuthStatus() {
    try {
      const user = await this.makeRequest(CONFIG.ENDPOINTS.USER);
      this.isAuthenticated = true;
      await this.cacheUserData(user);
      return user;
    } catch (error) {
      this.isAuthenticated = false;
      return null;
    }
  }

  async getUserProfile() {
    if (this.userProfile) return this.userProfile;

    try {
      const [profile, skills, workExperience, education] = await Promise.all([
        this.makeRequest(CONFIG.ENDPOINTS.PROFILE),
        this.makeRequest(CONFIG.ENDPOINTS.SKILLS),
        this.makeRequest(CONFIG.ENDPOINTS.WORK_EXPERIENCE),
        this.makeRequest(CONFIG.ENDPOINTS.EDUCATION)
      ]);

      this.userProfile = {
        profile,
        skills,
        workExperience,
        education,
        lastUpdated: Date.now()
      };

      await this.cacheProfileData(this.userProfile);
      return this.userProfile;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return await this.getCachedProfileData();
    }
  }

  async generateCoverLetter(jobDescription, companyName) {
    try {
      return await this.makeRequest(CONFIG.ENDPOINTS.GENERATE_COVER_LETTER, {
        method: 'POST',
        body: JSON.stringify({
          jobDescription,
          companyName,
          useProfile: true
        })
      });
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
      throw error;
    }
  }

  async analyzeJob(jobData) {
    try {
      return await this.makeRequest(CONFIG.ENDPOINTS.JOB_ANALYSIS, {
        method: 'POST',
        body: JSON.stringify(jobData)
      });
    } catch (error) {
      console.error('Failed to analyze job:', error);
      throw error;
    }
  }

  async saveJob(jobData) {
    try {
      return await this.makeRequest('/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify(jobData)
      });
    } catch (error) {
      console.error('Failed to save job:', error);
      throw error;
    }
  }

  async trackApplication(applicationData) {
    try {
      return await this.makeRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          ...applicationData,
          source: 'extension',
          appliedDate: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track application:', error);
      throw error;
    }
  }

  async cacheUserData(userData) {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.USER_DATA]: {
        data: userData,
        timestamp: Date.now()
      }
    });
  }

  async cacheProfileData(profileData) {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.PROFILE_CACHE]: {
        data: profileData,
        timestamp: Date.now()
      }
    });
  }

  async getCachedProfileData() {
    const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.PROFILE_CACHE);
    const cached = result[CONFIG.STORAGE_KEYS.PROFILE_CACHE];
    
    if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  async clearStoredAuth() {
    await chrome.storage.local.clear();
    this.userProfile = null;
  }

  async getStoredToken() {
    const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    return result[CONFIG.STORAGE_KEYS.AUTH_TOKEN];
  }

  async storeToken(token) {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.AUTH_TOKEN]: token
    });
  }

  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.HEALTH_CHECK_SIMPLE}`, {
        method: 'GET',
        credentials: 'include',
        timeout: 5000
      });
      
      this.connectionStatus = response.ok ? 'connected' : 'error';
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      this.connectionStatus = 'disconnected';
      return false;
    }
  }

  async startHealthMonitoring() {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.checkBackendHealth();
    }, 30000);
    
    // Initial health check
    await this.checkBackendHealth();
  }

  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }
}

// Global API instance
window.AutoJobrAPI = AutoJobrAPI;
window.CONFIG = CONFIG;