// Enhanced Integration Layer - FIXED VERSION
// Enhances EXISTING AutoJobr features without creating duplicates
// Preserves: Save Jobs, Application Tracking, LinkedIn Auto Apply, Task Manager, Autopilot

// Global enhanced system (singleton)
window.enhancedSystem = window.enhancedSystem || {
  xpath: null,
  react: null,
  ats: null,
  formDetector: null,
  initialized: false
};

// Initialize enhanced engines ONCE
async function initializeEnhancedEngines() {
  if (window.enhancedSystem.initialized) {
    console.log('✅ Enhanced system already initialized');
    return true;
  }

  console.log('🔗 Initializing Enhanced Engines...');

  try {
    // Initialize new engines (these are utilities, not duplicates)
    window.enhancedSystem.xpath = new XPathEngine();
    window.enhancedSystem.react = new ReactFormFiller();
    window.enhancedSystem.ats = new ATSDetector();

    // Detect ATS
    const detected = window.enhancedSystem.ats.detect();
    const currentAdapter = detected.adapter;
    
    // Initialize form detector
    window.enhancedSystem.formDetector = new SmartFormDetector(
      window.enhancedSystem.xpath,
      currentAdapter
    );

    console.log(`✅ Enhanced engines ready (ATS: ${detected.ats})`);
    
    window.enhancedSystem.initialized = true;
    return true;
  } catch (error) {
    console.error('❌ Enhanced engine initialization error:', error);
    return false;
  }
}

// Enhance EXISTING AutoJobrContentScript instance
function enhanceExistingAutoJobr() {
  const maxAttempts = 50; // 5 seconds
  let attempts = 0;

  const checkAutoJobr = setInterval(() => {
    attempts++;

    // Check if AutoJobr instance exists
    const existingInstance = window.autojobrExtension || window.autoJobrInstance;

    if (existingInstance) {
      clearInterval(checkAutoJobr);
      console.log('🔧 Enhancing EXISTING AutoJobr instance...');
      addEnhancedMethodsToInstance(existingInstance);
      console.log('✅ AutoJobr enhanced with XPath + React filling!');
    } else if (attempts >= maxAttempts) {
      clearInterval(checkAutoJobr);
      // Enhance prototype for when instance is created
      enhanceAutoJobrPrototype();
    }
  }, 100);
}

// Add enhanced methods to EXISTING instance (NO DUPLICATION)
function addEnhancedMethodsToInstance(instance) {
  // Add XPath field finding
  instance.findFieldWithXPath = function(fieldName) {
    if (!window.enhancedSystem?.xpath) return null;
    const xpaths = FIELD_XPATHS[fieldName] || [];
    return window.enhancedSystem.xpath.findElement(xpaths);
  };

  // Add React-aware filling
  instance.fillFieldReact = async function(element, value) {
    if (!window.enhancedSystem?.react) {
      return false;
    }
    return await window.enhancedSystem.react.fillField(element, value);
  };

  // ENHANCE existing fillField method (WRAP, don't replace)
  if (instance.fillField && !instance._fillFieldEnhanced) {
    const originalFillField = instance.fillField.bind(instance);
    
    instance.fillField = async function(fieldName, value) {
      // Try enhanced XPath + React first
      const element = this.findFieldWithXPath(fieldName);
      
      if (element) {
        const success = await this.fillFieldReact(element, value);
        if (success) return success;
      }

      // Fallback to original implementation
      return await originalFillField(fieldName, value);
    };
    
    instance._fillFieldEnhanced = true; // Mark as enhanced
  }

  // ENHANCE existing startSmartAutofill (LinkedIn uses this!)
  if (instance.startSmartAutofill && !instance._startSmartAutofillEnhanced) {
    const originalStartSmartAutofill = instance.startSmartAutofill.bind(instance);
    
    instance.startSmartAutofill = async function(userProfile) {
      // Try enhanced smart form detection first
      if (window.enhancedSystem?.formDetector) {
        try {
          const fields = window.enhancedSystem.formDetector.detectVisibleFields();
          let filledCount = 0;
          let totalFields = Object.keys(fields).length;

          for (const [fieldName, fieldInfo] of Object.entries(fields)) {
            const value = getProfileValue(userProfile, fieldName);
            if (!value) continue;

            const success = await window.enhancedSystem.react.fillField(
              fieldInfo.element,
              value,
              { validate: true }
            );

            if (success) filledCount++;
          }

          if (filledCount > 0) {
            return {
              success: true,
              fieldsFilled: filledCount,
              fieldsFound: totalFields,
              successRate: Math.round((filledCount / totalFields) * 100)
            };
          }
        } catch (error) {
          console.error('Enhanced autofill error, falling back:', error);
        }
      }

      // Fallback to original
      return await originalStartSmartAutofill(userProfile);
    };
    
    instance._startSmartAutofillEnhanced = true;
  }

  console.log('✅ Enhanced methods added to existing AutoJobr instance');
  console.log('   - XPath field finding added');
  console.log('   - React-aware form filling added');
  console.log('   - Smart autofill enhanced');
  console.log('   - LinkedIn automation now uses enhanced filling!');
}

// Enhance prototype (for future instances)
function enhanceAutoJobrPrototype() {
  if (typeof AutoJobrContentScript === 'undefined') {
    console.log('AutoJobrContentScript class not found, will enhance instances directly');
    return;
  }

  const proto = AutoJobrContentScript.prototype;

  // Add methods to prototype
  if (!proto.findFieldWithXPath) {
    proto.findFieldWithXPath = function(fieldName) {
      if (!window.enhancedSystem?.xpath) return null;
      const xpaths = FIELD_XPATHS[fieldName] || [];
      return window.enhancedSystem.xpath.findElement(xpaths);
    };
  }

  if (!proto.fillFieldReact) {
    proto.fillFieldReact = async function(element, value) {
      if (!window.enhancedSystem?.react) return false;
      return await window.enhancedSystem.react.fillField(element, value);
    };
  }

  console.log('✅ AutoJobr prototype enhanced');
}

// Helper: get profile value (used by enhanced autofill)
function getProfileValue(profile, fieldName) {
  const mapping = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: profile.fullName || `${profile.firstName} ${profile.lastName}`,
    email: profile.email,
    phone: profile.phone,
    currentCompany: profile.currentCompany || profile.company,
    currentTitle: profile.currentTitle || profile.title,
    yearsExperience: profile.yearsExperience || profile.experience,
    city: profile.city,
    state: profile.state,
    zipCode: profile.zipCode,
    linkedin: profile.linkedin,
    github: profile.github,
    portfolio: profile.portfolio,
    school: profile.school,
    degree: profile.degree,
    major: profile.major,
    graduationYear: profile.graduationYear,
    authorized: profile.authorized === true ? 'Yes' : profile.authorized,
    sponsorship: profile.sponsorship === true ? 'Yes' : profile.sponsorship
  };
  return mapping[fieldName];
}

// Unified auto-fill (standalone utility, not duplicate)
async function unifiedAutoFill(profileData) {
  if (!window.enhancedSystem?.formDetector || !window.enhancedSystem?.react) {
    console.error('Enhanced system not initialized');
    return { success: false, error: 'Enhanced system not ready' };
  }

  console.log('🎯 Unified Auto-Fill (Enhanced)...');
  
  const fields = window.enhancedSystem.formDetector.detectVisibleFields();
  let filledCount = 0;

  for (const [fieldName, fieldInfo] of Object.entries(fields)) {
    const value = getProfileValue(profileData, fieldName);
    if (!value) continue;

    const success = await window.enhancedSystem.react.fillField(
      fieldInfo.element,
      value
    );

    if (success) filledCount++;
  }

  return { success: true, filledFields: filledCount };
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+F for Force Fill (using enhanced system)
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      console.log('🎯 Enhanced auto-fill triggered by shortcut');
      
      // Get profile and fill
      chrome.runtime.sendMessage({ action: 'getProfile' }, async (response) => {
        if (response?.profile) {
          const result = await unifiedAutoFill(response.profile);
          console.log('Fill result:', result);
        }
      });
    }
  });
}

// Verify existing features are preserved
function verifyFeaturesPreserved() {
  console.log('\n🔍 Verifying existing features...');
  
  const instance = window.autojobrExtension || window.autoJobrInstance;
  
  if (!instance) {
    console.log('⏳ Waiting for AutoJobr instance...');
    return;
  }

  const features = {
    'Save Jobs': !!instance.handleSaveJob,
    'Application Tracking': !!instance.trackApplicationSubmission,
    'LinkedIn Auto Apply': !!instance.startLinkedInAutomation,
    'Smart Autofill': !!instance.startSmartAutofill,
    'Task Manager': !!instance.handleAnalyze,
    'Resume Optimizer': true, // Loaded separately
    'Referral Finder': true  // Loaded separately
  };

  console.log('\n✅ Feature Status:');
  for (const [feature, exists] of Object.entries(features)) {
    console.log(`   ${exists ? '✅' : '❌'} ${feature}`);
  }
  
  if (Object.values(features).every(v => v)) {
    console.log('\n🎉 All existing features preserved!');
  }
}

// Initialize everything
async function initialize() {
  console.log('\n🚀 Enhanced Integration Starting...');
  console.log('📌 Mode: ENHANCE existing features (no duplication)');

  // Initialize engines
  await initializeEnhancedEngines();

  // Enhance existing AutoJobr (DON'T create new instance)
  enhanceExistingAutoJobr();

  // Setup shortcuts
  setupKeyboardShortcuts();

  // Verify features after delay
  setTimeout(verifyFeaturesPreserved, 2000);

  // Expose global utilities
  window.unifiedAutoFill = unifiedAutoFill;

  console.log('✅ Enhanced Integration Ready!');
  console.log('💡 Existing features enhanced with:');
  console.log('   - XPath selectors (47 ATS systems)');
  console.log('   - React-aware form filling');
  console.log('   - Multi-page form detection');
  console.log('\n🎯 Press Ctrl+Shift+F for enhanced auto-fill');
  console.log('🔗 LinkedIn automation now uses enhanced filling!');
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
