
// Job Detection Module - Handles job page detection and data extraction
class JobDetector {
  constructor() {
    this.currentSite = this.detectSite();
  }

  detectSite() {
    const hostname = window.location.hostname.toLowerCase();
    const siteMap = {
      'linkedin.com': 'linkedin',
      'indeed.com': 'indeed',
      'glassdoor.com': 'glassdoor',
      'ziprecruiter.com': 'ziprecruiter',
      'monster.com': 'monster',
      'careerbuilder.com': 'careerbuilder',
      'dice.com': 'dice',
      'stackoverflow.com': 'stackoverflow',
      'angel.co': 'angel',
      'wellfound.com': 'wellfound',
      'greenhouse.io': 'greenhouse',
      'lever.co': 'lever',
      'workday.com': 'workday',
      'myworkdayjobs.com': 'workday',
      'icims.com': 'icims',
      'smartrecruiters.com': 'smartrecruiters',
      'bamboohr.com': 'bamboohr',
      'ashbyhq.com': 'ashby',
      'naukri.com': 'naukri',
      'shine.com': 'shine',
      'timesjobs.com': 'timesjobs',
      'autojobr.com': 'autojobr'
    };

    for (const [domain, site] of Object.entries(siteMap)) {
      if (hostname.includes(domain)) {
        return site;
      }
    }
    return 'generic';
  }

  isJobPage() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    if (hostname.includes('linkedin.com')) {
      const isJobsPage = url.includes('/jobs/view/') || url.includes('/jobs/collections/');
      const hasJobFormElements = document.querySelector('.jobs-apply-form, .jobs-easy-apply-modal');
      const isFeedPage = url.includes('/feed/') || url.includes('/mynetwork/');
      return isJobsPage && hasJobFormElements && !isFeedPage;
    }

    const jobPagePatterns = {
      'linkedin.com': ['/jobs/', '/job/'],
      'indeed.com': ['/job/', '/viewjob'],
      'glassdoor.com': ['/job/', '/jobs/'],
      'ziprecruiter.com': ['/jobs/', '/job/'],
      'monster.com': ['/job/', '/jobs/'],
      'workday.com': ['/job/', '/jobs/', '/job_'],
      'myworkdayjobs.com': ['/job/', '/jobs/'],
      'naukri.com': ['/job-listings/', '/jobs/'],
      'autojobr.com': ['/jobs/', '/job/']
    };

    for (const [domain, patterns] of Object.entries(jobPagePatterns)) {
      if (hostname.includes(domain)) {
        return patterns.some(pattern => url.includes(pattern) || pathname.includes(pattern));
      }
    }

    return false;
  }

  async extractJobDetails() {
    const extractors = {
      linkedin: () => this.extractLinkedInJob(),
      indeed: () => this.extractIndeedJob(),
      glassdoor: () => this.extractGlassdoorJob(),
      workday: () => this.extractWorkdayJob(),
      naukri: () => this.extractNaukriJob(),
      generic: () => this.extractGenericJob()
    };

    const extractor = extractors[this.currentSite] || extractors.generic;
    return extractor();
  }

  extractLinkedInJob() {
    const title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title')?.textContent?.trim();
    const company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name')?.textContent?.trim();
    const location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent?.trim();
    const description = document.querySelector('.jobs-description__content, .jobs-box__html-content')?.textContent?.trim();

    return { title, company, location, description, url: window.location.href };
  }

  extractIndeedJob() {
    const title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim();
    const company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim();
    const location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim();
    const description = document.querySelector('#jobDescriptionText')?.textContent?.trim();

    return { title, company, location, description, url: window.location.href };
  }

  extractGlassdoorJob() {
    const title = document.querySelector('.job-title, [data-test="job-title"]')?.textContent?.trim();
    const company = document.querySelector('.employer-name, [data-test="employer-name"]')?.textContent?.trim();
    const location = document.querySelector('.location, [data-test="location"]')?.textContent?.trim();
    const description = document.querySelector('.jobDescriptionContent, [data-test="description"]')?.textContent?.trim();

    return { title, company, location, description, url: window.location.href };
  }

  extractWorkdayJob() {
    const title = document.querySelector('[data-automation-id="jobPostingHeader"]')?.textContent?.trim();
    const company = document.querySelector('[data-automation-id="company"]')?.textContent?.trim();
    const location = document.querySelector('[data-automation-id="locations"]')?.textContent?.trim();
    const description = document.querySelector('[data-automation-id="jobPostingDescription"]')?.textContent?.trim();

    return { title, company, location, description, url: window.location.href };
  }

  extractNaukriJob() {
    const title = document.querySelector('.jd-header-title, .job-title')?.textContent?.trim();
    const company = document.querySelector('.jd-header-comp-name, .company-name')?.textContent?.trim();
    const location = document.querySelector('.location, .loc')?.textContent?.trim();
    const description = document.querySelector('.job-description, .jd-desc')?.textContent?.trim();

    return { title, company, location, description, url: window.location.href };
  }

  extractGenericJob() {
    const title = document.querySelector('h1, .job-title, [class*="title"]')?.textContent?.trim();
    const company = document.querySelector('[class*="company"]')?.textContent?.trim();
    const location = document.querySelector('[class*="location"]')?.textContent?.trim();
    const description = document.querySelector('[class*="description"], [class*="details"]')?.textContent?.trim();

    return { title, company, location, description, url: window.location.href };
  }
}

if (typeof window !== 'undefined') {
  window.JobDetector = JobDetector;
}
