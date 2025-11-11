// Enhanced Integration Layer - Makes ALL features work together
// Integrates: Existing AutoJobr + New XPath + React Filler + Multi-ATS

// Keep reference to original content script if it exists
let originalAutoJobr = null;
let enhancedSystem = {
  xpath: null,
  react: null,
  ats: null,
  formDetector: null,
  autopilot: null
};

// Enhanced initialization that preserves existing features
async function initializeEnhancedIntegration() {
  console.log('🔗 Integrating Enhanced System with Existing Features...');

  try {
    // Initialize new enhanced engines
    enhancedSystem.xpath = new XPathEngine();
    enhancedSystem.react = new ReactFormFiller();
    enhancedSystem.ats = new ATSDetector();

    // Detect ATS and create adapter
    const detected = enhancedSystem.ats.detect();
    const currentAdapter = detected.adapter;
    
    // Initialize form detector
    enhancedSystem.formDetector = new SmartFormDetector(
      enhancedSystem.xpath, 
      currentAdapter
    );

    console.log(`✅ Enhanced engines initialized (ATS: ${detected.ats})`);

    // Check if AutopilotEngine exists (from autopilot-engine.js)
    if (typeof AutopilotEngine !== 'undefined') {
      enhancedSystem.autopilot = new AutopilotEngine();
      console.log('✅ AutopilotEngine loaded');
      
      // Enhance autopilot with new filling methods
      enhanceAutopilotEngine();
    }

    // Check if original AutoJobrContentScript exists
    if (typeof AutoJobrContentScript !== 'undefined') {
      originalAutoJobr = new AutoJobrContentScript();
      console.log('✅ Original AutoJobr features loaded');
      
      // Enhance original with new methods
      enhanceOriginalAutoJobr();
    }

    return true;
  } catch (error) {
    console.error('❌ Enhanced integration error:', error);
    return false;
  }
}

// Enhance AutopilotEngine with new filling capabilities
function enhanceAutopilotEngine() {
  if (!enhancedSystem.autopilot) return;

  // Add enhanced filling method to autopilot
  enhancedSystem.autopilot.enhancedFill = async function(formData) {
    console.log('🎯 Using enhanced fill for autopilot...');
    
    // Use our new enhanced auto-fill
    const fields = enhancedSystem.formDetector.detectVisibleFields();
    let filledCount = 0;

    for (const [fieldName, fieldInfo] of Object.entries(fields)) {
      const value = formData[fieldName] || getProfileValue(formData, fieldName);
      if (!value) continue;

      // Use React-aware filling
      const success = await enhancedSystem.react.fillField(
        fieldInfo.element, 
        value, 
        { validate: true }
      );

      if (success) filledCount++;
    }

    return { success: true, filledFields: filledCount };
  };

  // Override the original apply method to use enhanced filling
  const originalApply = enhancedSystem.autopilot.applyToJob;
  enhancedSystem.autopilot.applyToJob = async function(job) {
    console.log('🚀 Enhanced autopilot applying to job:', job.title);
    
    try {
      // Get user profile
      const profile = await this.getUserProfile();
      
      // Use enhanced fill
      const result = await this.enhancedFill(profile);
      
      if (result.success) {
        // Continue with original logic
        if (originalApply) {
          return await originalApply.call(this, job);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Enhanced autopilot apply error:', error);
      return { success: false, error: error.message };
    }
  };

  console.log('✅ AutopilotEngine enhanced with XPath + React filling');
}

// Enhance original AutoJobr content script
function enhanceOriginalAutoJobr() {
  if (!originalAutoJobr) return;

  // Add XPath selector finding to original
  originalAutoJobr.findFieldWithXPath = function(fieldName) {
    const xpaths = FIELD_XPATHS[fieldName] || [];
    return enhancedSystem.xpath.findElement(xpaths);
  };

  // Add React-aware filling to original
  originalAutoJobr.fillFieldReact = async function(element, value) {
    return await enhancedSystem.react.fillField(element, value);
  };

  // Enhance the fillField method
  const originalFillField = originalAutoJobr.fillField;
  originalAutoJobr.fillField = async function(fieldName, value) {
    // Try XPath first
    let element = this.findFieldWithXPath(fieldName);
    
    // Fallback to original method
    if (!element && originalFillField) {
      return await originalFillField.call(this, fieldName, value);
    }

    // Use React-aware filling
    if (element) {
      return await this.fillFieldReact(element, value);
    }

    return false;
  };

  // Enhance LinkedIn auto-apply if it exists
  if (originalAutoJobr.linkedinAutoApply) {
    const originalLinkedInApply = originalAutoJobr.linkedinAutoApply;
    originalAutoJobr.linkedinAutoApply = async function() {
      console.log('🔵 Enhanced LinkedIn Auto-Apply starting...');
      
      // Use LinkedIn-specific adapter
      const linkedinAdapter = ATS_ADAPTERS.linkedin;
      
      // Find Easy Apply button using XPath
      const easyApplyBtn = enhancedSystem.xpath.findElement(
        linkedinAdapter.selectors.easyApplyButton
      );

      if (easyApplyBtn && easyApplyBtn.offsetParent !== null) {
        easyApplyBtn.click();
        await sleep(1000);
        
        // Use enhanced form filling
        const profile = await this.getUserProfile();
        if (profile) {
          // Detect and fill all pages
          let hasMore = true;
          let pageCount = 0;
          
          while (hasMore && pageCount < 10) {
            const fields = enhancedSystem.formDetector.detectVisibleFields();
            
            // Fill current page
            for (const [fieldName, fieldInfo] of Object.entries(fields)) {
              const value = getProfileValue(profile, fieldName);
              if (value) {
                await enhancedSystem.react.fillField(fieldInfo.element, value);
              }
            }
            
            // Check for next button
            hasMore = await enhancedSystem.formDetector.goToNextPage();
            pageCount++;
          }
          
          // Submit if on last page
          if (enhancedSystem.formDetector.formState.hasSubmitButton) {
            await enhancedSystem.formDetector.submitForm();
          }
        }
        
        return true;
      }
      
      // Fallback to original method
      if (originalLinkedInApply) {
        return await originalLinkedInApply.call(this);
      }
      
      return false;
    };
  }

  // Enhance task manager if it exists
  if (originalAutoJobr.renderTaskReminders) {
    console.log('✅ Task Manager preserved and enhanced');
  }

  console.log('✅ Original AutoJobr features enhanced with new capabilities');
}

// Unified autofill function that works with all systems
async function unifiedAutoFill(profileData, options = {}) {
  console.log('🎯 Unified Auto-Fill starting...');
  
  const results = {
    method: 'enhanced',
    totalFields: 0,
    filledFields: 0,
    failedFields: [],
    pages: 1,
    features: []
  };

  try {
    // Detect visible fields using enhanced detector
    const fields = enhancedSystem.formDetector.detectVisibleFields();
    results.totalFields = Object.keys(fields).length;
    results.features.push('XPath Detection');

    console.log(`📝 Found ${results.totalFields} fields using XPath`);

    // Fill each field with React-aware method
    for (const [fieldName, fieldInfo] of Object.entries(fields)) {
      const value = getProfileValue(profileData, fieldName);
      
      if (!value) {
        continue;
      }

      // Use React filler
      const success = await enhancedSystem.react.fillField(
        fieldInfo.element, 
        value,
        { validate: true }
      );

      if (success) {
        results.filledFields++;
        results.features.push('React-Aware Fill');
        console.log(`✅ ${fieldName} = ${String(value).substring(0, 30)}`);
      } else {
        results.failedFields.push(fieldName);
        console.warn(`⚠️  Failed: ${fieldName}`);
      }

      await sleep(100);
    }

    // Handle multi-page forms
    if (enhancedSystem.formDetector.formState.hasNextButton) {
      results.features.push('Multi-Page Support');
      
      const hasNext = await enhancedSystem.formDetector.goToNextPage();
      if (hasNext) {
        const nextResults = await unifiedAutoFill(profileData, options);
        results.totalFields += nextResults.totalFields;
        results.filledFields += nextResults.filledFields;
        results.failedFields.push(...nextResults.failedFields);
        results.pages += nextResults.pages;
      }
    }

    // Show notification
    showNotification({
      title: '✅ Auto-Fill Complete!',
      message: `Filled ${results.filledFields}/${results.totalFields} fields\nUsing: ${results.features.join(', ')}`,
      type: 'success'
    });

    return { success: true, ...results };

  } catch (error) {
    console.error('❌ Unified auto-fill error:', error);
    return { success: false, error: error.message, ...results };
  }
}

// Map profile data to field names (improved version)
function getProfileValue(profile, fieldName) {
  const mapping = {
    firstName: profile.firstName || profile.first_name,
    lastName: profile.lastName || profile.last_name,
    fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    email: profile.email,
    phone: profile.phone || profile.phoneNumber,
    currentCompany: profile.currentCompany || profile.company,
    currentTitle: profile.currentTitle || profile.title || profile.jobTitle,
    yearsExperience: profile.yearsExperience || profile.experience,
    city: profile.city,
    state: profile.state,
    zipCode: profile.zipCode || profile.zip,
    linkedin: profile.linkedin || profile.linkedinUrl,
    github: profile.github || profile.githubUrl,
    portfolio: profile.portfolio || profile.website,
    school: profile.school || profile.university,
    degree: profile.degree,
    major: profile.major || profile.fieldOfStudy,
    graduationYear: profile.graduationYear,
    authorized: profile.authorized === true ? 'Yes' : profile.authorized === false ? 'No' : profile.authorized,
    sponsorship: profile.sponsorship === true ? 'Yes' : profile.sponsorship === false ? 'No' : profile.sponsorship,
    veteran: profile.veteran,
    disability: profile.disability,
    ethnicity: profile.ethnicity,
    gender: profile.gender
  };

  return mapping[fieldName];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showNotification({ title, message, type = 'info' }) {
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
  }, 4000);
}

// Export for global use
window.enhancedSystem = enhancedSystem;
window.unifiedAutoFill = unifiedAutoFill;
window.initializeEnhancedIntegration = initializeEnhancedIntegration;

// Initialize when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnhancedIntegration);
} else {
  initializeEnhancedIntegration();
}
