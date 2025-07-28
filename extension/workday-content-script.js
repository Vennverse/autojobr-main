// Workday-specific content script for enhanced job detection and form filling
// Handles client-specific Workday domains like spgi.wd5.myworkdayjobs.com

(function() {
  'use strict';
  
  console.log('🔧 AutoJobr Workday Content Script loaded for:', window.location.hostname);
  
  // Enhanced Workday selectors for different client implementations
  const WORKDAY_SELECTORS = {
    title: [
      '[data-automation-id="jobPostingHeader"]',
      'h1[data-automation-id="jobPostingHeader"]', 
      '.css-1id67r3',
      '.css-1x9zq2f',
      'h1[title]',
      '[data-automation-id="jobTitle"]',
      '.WDKN_PositionTitle',
      '.css-cygeeu h1',
      '.css-cygeeu [data-automation-id*="title"]',
      'h1[class*="css-"]',
      '[class*="JobTitle"]',
      '.wd-u-fontSize-large'
    ],
    company: [
      '[data-automation-id="jobPostingCompany"]',
      '.css-1t92pv',
      '.css-1qd0w3l', 
      '[data-automation-id="company"] span',
      '.WDKN_CompanyName',
      '.css-dfvbm8',
      '[data-automation-id*="company"]',
      '.wd-u-fontSize-medium',
      '[class*="CompanyName"]'
    ],
    description: [
      '[data-automation-id="jobPostingDescription"]',
      '.css-1w9q2ls',
      '.css-16wd19p',
      '[data-automation-id="description"]',
      '.WDKN_JobDescription',
      '.css-t3xrds',
      '[data-automation-id*="description"]',
      '.css-1qnmsir',
      '.wd-u-padding-md',
      '[class*="JobDescription"]'
    ],
    location: [
      '[data-automation-id="locations"]',
      '.css-129m7dg',
      '.css-kyg8or',
      '[data-automation-id="location"]',
      '.WDKN_Location',
      '.css-k008qs',
      '[data-automation-id*="location"]',
      '[class*="Location"]'
    ],
    applyButton: [
      '[data-automation-id="applyToJobButton"]',
      '.css-ccxm6z',
      '.css-1hwfws3',
      'button[title*="Apply"]',
      '.WDKN_ApplyButton',
      '.css-4rvv7a',
      '[data-automation-id*="apply"]',
      'button[class*="css-"][title*="Apply"]'
    ]
  };

  // Wait for DOM to be ready then try to detect and analyze job
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkdayDetection);
  } else {
    initWorkdayDetection();
  }

  function initWorkdayDetection() {
    console.log('🔍 Initializing Workday job detection');
    
    // Try immediate detection
    setTimeout(detectAndAnalyzeWorkdayJob, 1000);
    
    // Try again after more page loading
    setTimeout(detectAndAnalyzeWorkdayJob, 3000);
    
    // Set up observer for dynamic content
    setupWorkdayObserver();
  }

  function setupWorkdayObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && (
              node.matches && (
                node.matches('[data-automation-id*="job"]') ||
                node.matches('[class*="css-"]') ||
                node.matches('[class*="WDKN"]')
              )
            )) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
      
      if (shouldCheck) {
        setTimeout(detectAndAnalyzeWorkdayJob, 2000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function detectAndAnalyzeWorkdayJob() {
    console.log('🔍 Attempting Workday job detection...');
    
    const jobData = extractWorkdayJobData();
    
    if (jobData.title || jobData.description) {
      console.log('✅ Workday job detected:', jobData);
      
      // Notify the main extension about the job
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'workdayJobDetected',
          jobData: jobData
        }).then(response => {
          console.log('Job data sent to extension:', response);
        }).catch(error => {
          console.log('Failed to send job data:', error);
        });
      }
      
      // Create visual indicator that job was detected
      createWorkdayJobIndicator(jobData);
      
    } else {
      console.log('⚠️ No Workday job content detected on this page');
    }
  }

  function extractWorkdayJobData() {
    const jobData = {
      title: '',
      company: '',
      description: '',
      location: '',
      url: window.location.href,
      platform: 'workday'
    };

    // Extract title
    for (const selector of WORKDAY_SELECTORS.title) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.title = element.textContent.trim();
        console.log('📋 Found title:', jobData.title);
        break;
      }
    }

    // Extract company
    for (const selector of WORKDAY_SELECTORS.company) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.company = element.textContent.trim();
        console.log('🏢 Found company:', jobData.company);
        break;
      }
    }

    // Extract description
    for (const selector of WORKDAY_SELECTORS.description) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.description = element.textContent.trim();
        console.log('📄 Found description length:', jobData.description.length);
        break;
      }
    }

    // Extract location
    for (const selector of WORKDAY_SELECTORS.location) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        jobData.location = element.textContent.trim();
        console.log('📍 Found location:', jobData.location);
        break;
      }
    }

    return jobData;
  }

  function createWorkdayJobIndicator(jobData) {
    // Remove existing indicator
    const existing = document.querySelector('#autojobr-workday-indicator');
    if (existing) {
      existing.remove();
    }

    // Create floating indicator
    const indicator = document.createElement('div');
    indicator.id = 'autojobr-workday-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #4F46E5, #7C3AED);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      cursor: pointer;
      transition: all 0.3s ease;
      max-width: 300px;
    `;
    
    indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; animation: pulse 2s infinite;"></div>
        <div>
          <div style="font-weight: 600;">AutoJobr: Job Detected!</div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
            ${jobData.title ? jobData.title.substring(0, 30) + '...' : 'Workday Job Found'}
          </div>
        </div>
      </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);

    // Add click handler to open extension popup
    indicator.addEventListener('click', () => {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'openExtensionPopup',
          jobData: jobData
        });
      }
    });

    // Add hover effects
    indicator.addEventListener('mouseenter', () => {
      indicator.style.transform = 'translateY(-2px)';
      indicator.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    });

    indicator.addEventListener('mouseleave', () => {
      indicator.style.transform = 'translateY(0)';
      indicator.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    document.body.appendChild(indicator);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (indicator && indicator.parentNode) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.remove();
          }
        }, 300);
      }
    }, 10000);
  }

  // Listen for messages from popup/background
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'getWorkdayJobData') {
        const jobData = extractWorkdayJobData();
        sendResponse({ success: true, jobData: jobData });
      } else if (message.action === 'analyzeWorkdayJob') {
        detectAndAnalyzeWorkdayJob();
        sendResponse({ success: true });
      }
      return true;
    });
  }

})();