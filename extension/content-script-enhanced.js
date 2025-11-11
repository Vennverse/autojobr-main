// Enhanced AutoJobr Content Script - NOW BETTER THAN SIMPLIFY!
// Integrates: XPath Engine + React Filler + Multi-ATS + Smart Detection

// Load our new modules (injected via manifest)
let xpathEngine, reactFiller, atsDetector, formDetector, currentAdapter;

// Initialize enhanced system
async function initializeEnhancedSystem() {
  console.log('🚀 AutoJobr Enhanced System Initializing...');

  try {
    // Initialize engines
    xpathEngine = new XPathEngine();
    reactFiller = new ReactFormFiller();
    atsDetector = new ATSDetector();

    // Detect ATS
    const detected = atsDetector.detect();
    currentAdapter = detected.adapter;
    
    console.log(`✅ ATS Detected: ${detected.ats} (${(detected.confidence * 100).toFixed(0)}% confidence)`);

    // Initialize form detector with detected ATS
    formDetector = new SmartFormDetector(xpathEngine, currentAdapter);

    // Detect if multi-page form
    const isMultiPage = formDetector.detectMultiPage();
    console.log(`📋 Form Type: ${isMultiPage ? 'Multi-page' : 'Single-page'}`);

    // Inject enhanced UI
    injectEnhancedUI();

    // Setup auto-detection
    setupAutoFillTriggers();

    console.log('✅ Enhanced System Ready!');
    
    return true;
  } catch (error) {
    console.error('❌ Enhanced System Initialization Error:', error);
    return false;
  }
}

// Enhanced auto-fill function
async function enhancedAutoFill(profileData) {
  if (!profileData) {
    console.error('No profile data provided');
    return { success: false, error: 'No profile data' };
  }

  console.log('🎯 Starting Enhanced Auto-Fill...');
  
  const results = {
    totalFields: 0,
    filledFields: 0,
    failedFields: [],
    skippedFields: [],
    pages: 1
  };

  try {
    // Detect visible fields on current page
    let currentFields = formDetector.detectVisibleFields();
    results.totalFields = Object.keys(currentFields).length;

    console.log(`📝 Found ${results.totalFields} fillable fields on page ${formDetector.currentPage}`);

    // Fill fields on current page
    for (const [fieldName, fieldInfo] of Object.entries(currentFields)) {
      const value = getProfileValue(profileData, fieldName);
      
      if (!value) {
        results.skippedFields.push(fieldName);
        continue;
      }

      // Use React-aware filling
      const success = await fillFieldSmart(fieldInfo.element, value, fieldName);
      
      if (success) {
        results.filledFields++;
        formDetector.markFieldFilled(fieldName);
        console.log(`✅ Filled: ${fieldName} = ${String(value).substring(0, 30)}...`);
      } else {
        results.failedFields.push(fieldName);
        console.warn(`⚠️  Failed: ${fieldName}`);
      }

      // Small delay between fields
      await sleep(100);
    }

    // Check if there's a next page
    if (formDetector.formState.hasNextButton && !formDetector.formState.hasSubmitButton) {
      console.log('⏭️  Multi-page form detected, clicking Next...');
      
      const hasNext = await formDetector.goToNextPage();
      
      if (hasNext) {
        results.pages++;
        // Recursively fill next page
        const nextPageResults = await enhancedAutoFill(profileData);
        results.totalFields += nextPageResults.totalFields;
        results.filledFields += nextPageResults.filledFields;
        results.failedFields.push(...nextPageResults.failedFields);
        results.skippedFields.push(...nextPageResults.skippedFields);
        results.pages += nextPageResults.pages - 1;
      }
    }

    // Show completion notification
    showNotification({
      title: '✅ Auto-Fill Complete!',
      message: `Filled ${results.filledFields}/${results.totalFields} fields across ${results.pages} page(s)`,
      type: 'success'
    });

    return { success: true, ...results };

  } catch (error) {
    console.error('❌ Auto-fill error:', error);
    showNotification({
      title: '❌ Auto-Fill Error',
      message: error.message,
      type: 'error'
    });
    return { success: false, error: error.message, ...results };
  }
}

// Smart field filling with React support
async function fillFieldSmart(element, value, fieldName) {
  if (!element || !value) return false;

  const tagName = element.tagName.toLowerCase();
  const type = element.type?.toLowerCase();

  try {
    // Handle different field types
    if (tagName === 'select' || type === 'radio' || type === 'checkbox') {
      return await reactFiller.selectOption(element, value);
    } else if (type === 'file') {
      // Handle file uploads separately
      console.warn('File upload detected - requires manual handling');
      return false;
    } else {
      // Text inputs, textareas, etc.
      const method = currentAdapter.config?.method || 'auto';
      
      if (method === 'react' || method === 'auto') {
        return await reactFiller.fillField(element, value, { validate: true });
      } else {
        // Fallback to native
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
  } catch (error) {
    console.error(`Error filling ${fieldName}:`, error);
    return false;
  }
}

// Map profile data to field names
function getProfileValue(profile, fieldName) {
  const mapping = {
    // Name fields
    firstName: profile.firstName || profile.first_name,
    lastName: profile.lastName || profile.last_name,
    fullName: profile.fullName || `${profile.firstName} ${profile.lastName}`,
    
    // Contact
    email: profile.email,
    phone: profile.phone || profile.phoneNumber,
    
    // Work
    currentCompany: profile.currentCompany || profile.company,
    currentTitle: profile.currentTitle || profile.title || profile.jobTitle,
    yearsExperience: profile.yearsExperience || profile.experience,
    
    // Location
    city: profile.city,
    state: profile.state,
    zipCode: profile.zipCode || profile.zip,
    
    // Social
    linkedin: profile.linkedin || profile.linkedinUrl,
    github: profile.github || profile.githubUrl,
    portfolio: profile.portfolio || profile.website,
    
    // Education
    school: profile.school || profile.university,
    degree: profile.degree,
    major: profile.major || profile.fieldOfStudy,
    graduationYear: profile.graduationYear,
    
    // Legal
    authorized: profile.authorized === true ? 'Yes' : profile.authorized === false ? 'No' : profile.authorized,
    sponsorship: profile.sponsorship === true ? 'Yes' : profile.sponsorship === false ? 'No' : profile.sponsorship,
    veteran: profile.veteran,
    disability: profile.disability,
    ethnicity: profile.ethnicity,
    gender: profile.gender
  };

  return mapping[fieldName];
}

// Inject enhanced UI overlay
function injectEnhancedUI() {
  // Check if already injected
  if (document.getElementById('autojobr-enhanced-overlay')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'autojobr-enhanced-overlay';
  overlay.innerHTML = `
    <div class="autojobr-fab" id="autojobr-fab">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
      </svg>
      <span class="autojobr-badge" id="autojobr-badge">0</span>
    </div>
    <div class="autojobr-panel" id="autojobr-panel" style="display: none;">
      <div class="autojobr-header">
        <h3>AutoJobr Enhanced</h3>
        <button id="autojobr-close">✕</button>
      </div>
      <div class="autojobr-body">
        <div class="autojobr-status">
          <div class="status-item">
            <span>ATS:</span>
            <strong id="ats-name">Detecting...</strong>
          </div>
          <div class="status-item">
            <span>Fields:</span>
            <strong id="field-count">0</strong>
          </div>
          <div class="status-item">
            <span>Progress:</span>
            <strong id="progress">0%</strong>
          </div>
        </div>
        <button id="autojobr-autofill" class="autojobr-btn-primary">
          ⚡ Auto-Fill Form
        </button>
        <button id="autojobr-analyze" class="autojobr-btn-secondary">
          🎯 Analyze Match
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Update UI with detected info
  if (atsDetector.detectedATS) {
    document.getElementById('ats-name').textContent = atsDetector.detectedATS;
  }

  // Add event listeners
  document.getElementById('autojobr-fab').addEventListener('click', togglePanel);
  document.getElementById('autojobr-close').addEventListener('click', togglePanel);
  document.getElementById('autojobr-autofill').addEventListener('click', triggerAutoFill);
  document.getElementById('autojobr-analyze').addEventListener('click', triggerAnalysis);

  // Update field count
  updateFieldCount();
}

function togglePanel() {
  const panel = document.getElementById('autojobr-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function updateFieldCount() {
  const fields = formDetector?.detectVisibleFields() || {};
  const count = Object.keys(fields).length;
  document.getElementById('field-count').textContent = count;
  document.getElementById('autojobr-badge').textContent = count;
}

async function triggerAutoFill() {
  // Get profile from background
  const response = await chrome.runtime.sendMessage({ action: 'getProfile' });
  
  if (response?.profile) {
    await enhancedAutoFill(response.profile);
  } else {
    showNotification({
      title: '⚠️ No Profile',
      message: 'Please set up your profile in AutoJobr dashboard',
      type: 'warning'
    });
  }
}

async function triggerAnalysis() {
  // Send message to background for job analysis
  chrome.runtime.sendMessage({ 
    action: 'analyzeJob',
    url: window.location.href
  });
}

function showNotification({ title, message, type = 'info' }) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `autojobr-toast autojobr-toast-${type}`;
  toast.innerHTML = `
    <strong>${title}</strong>
    <p>${message}</p>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setupAutoFillTriggers() {
  // Listen for keyboard shortcut (Ctrl+Shift+A)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      triggerAutoFill();
    }
  });

  // Auto-detect when user focuses on form
  document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      updateFieldCount();
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnhancedSystem);
} else {
  initializeEnhancedSystem();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    enhancedAutoFill,
    fillFieldSmart,
    getProfileValue
  };
}
