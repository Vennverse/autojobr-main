// Content script for AutoJobr Chrome Extension
// Handles intelligent form auto-filling, job description analysis, and page interaction

(function() {
  'use strict';
  
  let isAutofillEnabled = true;
  let userProfile = null;
  let currentJobData = null;
  let advancedFormFiller = null;
  
  // Initialize extension on page load
  initializeExtension();
  
  // Message listener for communication with popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractJobData') {
      const jobData = extractJobData();
      sendResponse(jobData);
      return true;
    }
    
    if (request.action === 'getJobData') {
      sendResponse(currentJobData);
      return true;
    }
    
    if (request.action === 'fillCoverLetter') {
      const filled = fillCoverLetterOnPage(request.data.coverLetter);
      sendResponse({ filled });
      return true;
    }
    
    if (request.action === 'analyzeCurrentJob') {
      analyzeJobDescription();
      sendResponse({ success: true });
      return true;
    }
  });
  
  // Function to fill cover letter on the current page
  function fillCoverLetterOnPage(coverLetter) {
    const coverLetterSelectors = [
      // Workday
      'textarea[data-automation-id*="coverLetter"]',
      'textarea[data-automation-id*="cover-letter"]',
      'textarea[aria-label*="Cover Letter" i]',
      '[data-automation-id*="coverLetter"] textarea',
      
      // LinkedIn
      'textarea[id*="cover-letter"]',
      'textarea[name*="coverLetter"]',
      
      // Greenhouse
      'textarea[name*="cover_letter"]',
      'textarea[id*="cover_letter"]',
      
      // Generic selectors
      'textarea[placeholder*="cover letter" i]',
      'textarea[placeholder*="why are you interested" i]',
      'textarea[placeholder*="tell us about yourself" i]',
      'textarea[aria-label*="motivation" i]',
      'textarea[name*="motivation"]',
      'textarea[name*="letter"]',
      'textarea[name*="why"]',
      'textarea[id*="motivation"]'
    ];
    
    const field = coverLetterSelectors
      .map(selector => document.querySelector(selector))
      .find(field => field && field.offsetParent !== null);
    
    if (field) {
      field.focus();
      field.value = coverLetter;
      
      // Trigger events for better compatibility
      const events = ['focus', 'input', 'change', 'blur'];
      events.forEach(eventType => {
        field.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      // Highlight the field
      const originalBorder = field.style.border;
      field.style.border = '2px solid #10b981';
      setTimeout(() => {
        field.style.border = originalBorder;
      }, 3000);
      
      return true;
    }
    
    return false;
  }
  
  async function initializeExtension() {
    // Get user profile and settings
    await loadUserProfile();
    await loadSettings();
    
    // Initialize advanced form filler
    initializeAdvancedFormFiller();
    
    // Set up observers for dynamic content
    setupFormObserver();
    setupJobDescriptionObserver();
    
    // Add AutoJobr indicator
    addAutojobrIndicator();
    
    console.log('AutoJobr advanced extension initialized on', window.location.hostname);
  }
  
  function initializeAdvancedFormFiller() {
    // Initialize the advanced form filler class
    class AdvancedFormFiller {
      constructor() {
        this.userProfile = userProfile;
        this.isEnabled = isAutofillEnabled;
        this.filledFields = new Set();
        this.siteContext = this.detectSiteContext();
        this.fieldMappings = this.initializeFieldMappings();
        this.init();
      }

      detectSiteContext() {
        const hostname = window.location.hostname.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        const contexts = {
          workday: {
            patterns: ['myworkdayjobs', 'workday.com', 'wd1.myworkdayjobs', 'wd3.myworkdayjobs', 'wd5.myworkdayjobs', 'wd2.myworkdayjobs', 'wd4.myworkdayjobs', '.myworkdayjobs.com'],
            type: 'workday',
            framework: 'react',
            selectors: {
              firstName: [
                'input[data-automation-id*="firstName"]',
                'input[data-automation-id*="first-name"]',
                'input[data-automation-id*="firstNameInput"]',
                'input[id*="firstName"]',
                'input[name*="firstName"]',
                'input[aria-label*="First Name" i]',
                '[data-automation-id*="firstName"] input',
                '[data-automation-id*="legalNameSection"] input[data-automation-id="textInputComponent"]:first-of-type'
              ],
              lastName: [
                'input[data-automation-id*="lastName"]',
                'input[data-automation-id*="last-name"]',
                'input[data-automation-id*="lastNameInput"]',
                'input[id*="lastName"]',
                'input[name*="lastName"]',
                'input[aria-label*="Last Name" i]',
                '[data-automation-id*="lastName"] input',
                '[data-automation-id*="legalNameSection"] input[data-automation-id="textInputComponent"]:last-of-type'
              ],
              email: [
                'input[data-automation-id*="email"]',
                'input[data-automation-id*="emailAddress"]',
                'input[type="email"]',
                'input[aria-label*="Email" i]',
                '[data-automation-id*="email"] input'
              ],
              phone: [
                'input[data-automation-id*="phone"]',
                'input[data-automation-id*="phoneNumber"]',
                'input[type="tel"]',
                'input[aria-label*="Phone" i]',
                '[data-automation-id*="phone"] input'
              ],
              address: [
                'input[data-automation-id*="address"]',
                'input[data-automation-id*="street"]',
                'input[aria-label*="Address" i]',
                '[data-automation-id*="addressSection"] input[data-automation-id="textInputComponent"]:first-of-type'
              ],
              city: [
                'input[data-automation-id*="city"]',
                'input[aria-label*="City" i]',
                '[data-automation-id*="cityStatePostalCode"] input:first-of-type'
              ],
              state: [
                'input[data-automation-id*="state"]',
                'select[data-automation-id*="state"]',
                'input[aria-label*="State" i]',
                '[data-automation-id*="cityStatePostalCode"] select'
              ],
              zipCode: [
                'input[data-automation-id*="postal"]',
                'input[data-automation-id*="zip"]',
                'input[aria-label*="Zip" i]',
                'input[aria-label*="Postal" i]',
                '[data-automation-id*="cityStatePostalCode"] input:last-of-type'
              ],
              coverLetter: [
                'textarea[data-automation-id*="coverLetter"]',
                'textarea[data-automation-id*="cover-letter"]',
                'textarea[aria-label*="Cover Letter" i]',
                'textarea[placeholder*="cover letter" i]',
                '[data-automation-id*="coverLetter"] textarea'
              ]
            }
          },
          linkedin: {
            patterns: ['linkedin.com'],
            type: 'linkedin',
            framework: 'react'
          },
          greenhouse: {
            patterns: ['greenhouse.io', 'boards.greenhouse', 'greenhouse'],
            type: 'greenhouse',
            framework: 'rails'
          },
          lever: {
            patterns: ['lever.co', 'jobs.lever'],
            type: 'lever',
            framework: 'react'
          },
          icims: {
            patterns: ['icims.com', 'careers-', 'apply.icims'],
            type: 'icims',
            framework: 'legacy'
          },
          bamboohr: {
            patterns: ['bamboohr.com', 'bamboohr'],
            type: 'bamboohr',
            framework: 'angular'
          },
          jobvite: {
            patterns: ['jobvite.com', 'jobs.jobvite'],
            type: 'jobvite',
            framework: 'jquery'
          },
          smartrecruiters: {
            patterns: ['smartrecruiters.com', 'jobs.smartrecruiters'],
            type: 'smartrecruiters',
            framework: 'react'
          },
          ashbyhq: {
            patterns: ['ashbyhq.com', 'jobs.ashbyhq'],
            type: 'ashbyhq',
            framework: 'react'
          },
          wellfound: {
            patterns: ['wellfound.com', 'angel.co'],
            type: 'wellfound',
            framework: 'react'
          }
        };

        for (const [key, context] of Object.entries(contexts)) {
          if (context.patterns.some(pattern => hostname.includes(pattern) || url.includes(pattern))) {
            return { ...context, name: key };
          }
        }

        return { type: 'generic', name: 'generic', framework: 'unknown' };
      }

      initializeFieldMappings() {
        return {
          firstName: {
            selectors: [
              'input[name*="first" i][name*="name" i]',
              'input[id*="first" i][id*="name" i]',
              'input[placeholder*="first name" i]',
              'input[data-automation-id*="firstName"]',
              'input[name="firstName"]',
              'input[name="fname"]',
              'input[name="first_name"]',
              'input[aria-label*="first name" i]',
              'input[data-testid*="first-name"]',
              '[data-field="firstName"] input',
              '.first-name input'
            ],
            keywords: ['first', 'given', 'forename'],
            confidence: 0.95
          },
          
          lastName: {
            selectors: [
              'input[name*="last" i][name*="name" i]',
              'input[id*="last" i][id*="name" i]',
              'input[placeholder*="last name" i]',
              'input[data-automation-id*="lastName"]',
              'input[name="lastName"]',
              'input[name="lname"]',
              'input[name="last_name"]',
              'input[aria-label*="last name" i]',
              'input[data-testid*="last-name"]',
              '[data-field="lastName"] input',
              '.last-name input'
            ],
            keywords: ['last', 'surname', 'family'],
            confidence: 0.95
          },
          
          fullName: {
            selectors: [
              'input[name*="full" i][name*="name" i]',
              'input[placeholder*="full name" i]',
              'input[name="name"]',
              'input[name="fullName"]',
              'input[aria-label*="full name" i]',
              'input[data-testid*="full-name"]',
              '[data-field="name"] input'
            ],
            keywords: ['full name', 'complete name', 'name'],
            confidence: 0.9
          },
          
          email: {
            selectors: [
              'input[type="email"]',
              'input[name*="email" i]',
              'input[id*="email" i]',
              'input[placeholder*="email" i]',
              'input[data-automation-id*="email"]',
              'input[aria-label*="email" i]',
              'input[data-testid*="email"]',
              '[data-field="email"] input'
            ],
            keywords: ['email', 'e-mail'],
            confidence: 0.98
          },
          
          phone: {
            selectors: [
              'input[type="tel"]',
              'input[name*="phone" i]',
              'input[id*="phone" i]',
              'input[placeholder*="phone" i]',
              'input[name*="mobile" i]',
              'input[data-automation-id*="phone"]',
              'input[aria-label*="phone" i]',
              'input[data-testid*="phone"]',
              '[data-field="phone"] input'
            ],
            keywords: ['phone', 'mobile', 'telephone', 'cell'],
            confidence: 0.9
          },
          
          address: {
            selectors: [
              'input[name*="address" i]',
              'input[id*="address" i]',
              'textarea[name*="address" i]',
              'input[placeholder*="address" i]',
              'input[data-automation-id*="address"]',
              'input[aria-label*="address" i]',
              '[data-field="address"] input'
            ],
            keywords: ['address', 'street', 'location'],
            confidence: 0.85
          },
          
          city: {
            selectors: [
              'input[name*="city" i]',
              'input[id*="city" i]',
              'input[placeholder*="city" i]',
              'input[data-automation-id*="city"]',
              'input[aria-label*="city" i]',
              '[data-field="city"] input'
            ],
            keywords: ['city', 'town', 'municipality'],
            confidence: 0.9
          },
          
          state: {
            selectors: [
              'select[name*="state" i]',
              'input[name*="state" i]',
              'select[id*="state" i]',
              'input[id*="state" i]',
              'select[data-automation-id*="state"]',
              'input[placeholder*="state" i]',
              '[data-field="state"] select',
              '[data-field="state"] input'
            ],
            keywords: ['state', 'province', 'region'],
            confidence: 0.9
          },
          
          zipCode: {
            selectors: [
              'input[name*="zip" i]',
              'input[name*="postal" i]',
              'input[id*="zip" i]',
              'input[id*="postal" i]',
              'input[placeholder*="zip" i]',
              'input[placeholder*="postal" i]',
              'input[data-automation-id*="postalCode"]',
              '[data-field="zipCode"] input'
            ],
            keywords: ['zip', 'postal', 'postcode'],
            confidence: 0.9
          },
          
          linkedinUrl: {
            selectors: [
              'input[name*="linkedin" i]',
              'input[id*="linkedin" i]',
              'input[placeholder*="linkedin" i]',
              'input[name*="profile" i][name*="url" i]',
              'input[placeholder*="linkedin.com" i]',
              '[data-field="linkedinUrl"] input'
            ],
            keywords: ['linkedin', 'profile url', 'social'],
            confidence: 0.8
          },
          
          workAuthorization: {
            selectors: [
              'select[name*="authorization" i]',
              'select[name*="eligible" i]',
              'select[name*="visa" i]',
              'input[name*="authorization" i]',
              'select[data-automation-id*="workAuth"]'
            ],
            keywords: ['work authorization', 'eligible to work', 'visa status'],
            confidence: 0.7
          }
        };
      }

      async init() {
        this.setupObservers();
        this.startAutoFilling();
      }

      setupObservers() {
        const observer = new MutationObserver((mutations) => {
          let shouldProcess = false;
          mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              shouldProcess = true;
            }
          });
          
          if (shouldProcess) {
            setTimeout(() => this.processNewContent(), 500);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        document.addEventListener('focusin', (e) => {
          if (this.isFormField(e.target)) {
            setTimeout(() => this.processField(e.target), 100);
          }
        });
      }

      startAutoFilling() {
        this.processAllFields();
        setInterval(() => this.processNewContent(), 2000);
      }

      processAllFields() {
        if (!this.userProfile || !this.isEnabled) return;
        
        console.log('AutoJobr: Starting intelligent form filling on', this.siteContext.name);
        
        const fields = this.findAllFormFields();
        let filledCount = 0;
        
        fields.forEach(field => {
          if (this.processField(field)) {
            filledCount++;
          }
        });
        
        console.log('AutoJobr: Successfully filled', filledCount, 'fields');
        
        if (filledCount > 0) {
          this.showSuccessNotification(filledCount);
        }
      }

      processNewContent() {
        const newFields = this.findAllFormFields().filter(field => 
          !this.filledFields.has(this.getFieldId(field))
        );
        
        if (newFields.length > 0) {
          console.log('AutoJobr: Processing', newFields.length, 'new fields');
          newFields.forEach(field => this.processField(field));
        }
      }

      findAllFormFields() {
        const selectors = [
          'input[type="text"]',
          'input[type="email"]',
          'input[type="tel"]',
          'input[type="url"]',
          'input[type="search"]',
          'input[type="number"]',
          'input:not([type])',
          'select',
          'textarea',
          '[contenteditable="true"]',
          '[role="textbox"]',
          '[role="combobox"]',
          '.react-select__input input',
          '.Select-input input',
          '[data-automation-id*="input"]',
          '[data-automation-id*="textInput"]',
          '.jobs-apply__form-field input',
          '.jobs-apply__form-field select',
          '.jobs-apply__form-field textarea'
        ];

        return Array.from(document.querySelectorAll(selectors.join(', ')))
          .filter(field => this.isFormField(field) && this.isFieldFillable(field));
      }

      isFormField(element) {
        return element && (
          element.tagName === 'INPUT' ||
          element.tagName === 'SELECT' ||
          element.tagName === 'TEXTAREA' ||
          element.contentEditable === 'true' ||
          element.role === 'textbox' ||
          element.role === 'combobox'
        );
      }

      isFieldFillable(field) {
        return !field.disabled &&
               !field.readOnly &&
               field.type !== 'hidden' &&
               field.type !== 'submit' &&
               field.type !== 'button' &&
               field.type !== 'file' &&
               field.type !== 'password' &&
               !field.closest('[style*="display: none"]') &&
               !field.closest('[style*="visibility: hidden"]') &&
               field.offsetHeight > 0 &&
               field.offsetWidth > 0;
      }

      processField(field) {
        if (!this.isFieldFillable(field)) return false;
        
        const fieldId = this.getFieldId(field);
        if (this.filledFields.has(fieldId)) return false;
        
        const analysis = this.analyzeField(field);
        if (analysis.confidence < 0.3) return false;
        
        const value = this.getProfileValue(analysis.mappedField);
        if (!value) return false;
        
        const success = this.fillField(field, value, analysis);
        if (success) {
          this.filledFields.add(fieldId);
        }
        
        return success;
      }

      analyzeField(field) {
        const context = {
          name: (field.name || '').toLowerCase(),
          id: (field.id || '').toLowerCase(),
          placeholder: (field.placeholder || '').toLowerCase(),
          ariaLabel: (field.getAttribute('aria-label') || '').toLowerCase(),
          dataTestId: (field.getAttribute('data-testid') || '').toLowerCase(),
          dataAutomationId: (field.getAttribute('data-automation-id') || '').toLowerCase(),
          className: field.className.toLowerCase(),
          labelText: this.getFieldLabel(field).toLowerCase(),
          parentText: this.getParentContext(field).toLowerCase()
        };
        
        const combinedText = Object.values(context).join(' ');
        
        let bestMatch = { field: null, confidence: 0 };
        
        for (const [fieldName, mapping] of Object.entries(this.fieldMappings)) {
          let confidence = 0;
          
          for (const selector of mapping.selectors) {
            if (field.matches(selector)) {
              confidence = Math.max(confidence, mapping.confidence);
              break;
            }
          }
          
          if (confidence < 0.8) {
            for (const keyword of mapping.keywords) {
              if (combinedText.includes(keyword)) {
                confidence = Math.max(confidence, mapping.confidence * 0.7);
              }
            }
          }
          
          confidence = this.adjustConfidenceForSite(fieldName, context, confidence);
          
          if (confidence > bestMatch.confidence) {
            bestMatch = { field: fieldName, confidence };
          }
        }
        
        return {
          mappedField: bestMatch.field,
          confidence: bestMatch.confidence,
          context
        };
      }

      adjustConfidenceForSite(fieldName, context, confidence) {
        switch (this.siteContext.name) {
          case 'workday':
            if (context.dataAutomationId.includes(fieldName.toLowerCase())) {
              return Math.min(confidence + 0.2, 1.0);
            }
            break;
            
          case 'linkedin':
            if (context.className.includes('jobs-apply') && context.name.includes(fieldName.toLowerCase())) {
              return Math.min(confidence + 0.15, 1.0);
            }
            break;
            
          case 'greenhouse':
            if (context.id.includes(fieldName.toLowerCase()) || context.name.includes(fieldName.toLowerCase())) {
              return Math.min(confidence + 0.1, 1.0);
            }
            break;
        }
        
        return confidence;
      }

      getFieldLabel(field) {
        const strategies = [
          () => field.labels?.[0]?.textContent,
          () => field.getAttribute('aria-label'),
          () => field.getAttribute('aria-labelledby') && 
                document.getElementById(field.getAttribute('aria-labelledby'))?.textContent,
          () => field.closest('label')?.textContent,
          () => field.parentElement?.querySelector('label')?.textContent,
          () => field.parentElement?.previousElementSibling?.textContent,
          () => field.previousElementSibling?.textContent,
          () => field.parentElement?.parentElement?.querySelector('label')?.textContent,
          () => field.closest('[data-field]')?.getAttribute('data-field'),
          () => field.closest('.form-field, .input-group, .field-wrapper')?.querySelector('label, .label, .field-label')?.textContent
        ];
        
        for (const strategy of strategies) {
          try {
            const result = strategy();
            if (result && result.trim()) {
              return result.trim();
            }
          } catch (e) {
            continue;
          }
        }
        
        return '';
      }

      getParentContext(field) {
        const parent = field.closest('.form-group, .field-group, .input-group, .form-field, [data-field]');
        return parent ? parent.textContent.slice(0, 200) : '';
      }

      getProfileValue(fieldName) {
        if (!this.userProfile || !fieldName) return null;
        
        const mappings = {
          firstName: this.userProfile.user?.firstName,
          lastName: this.userProfile.user?.lastName,
          fullName: this.getFullName(),
          email: this.userProfile.user?.email,
          phone: this.userProfile.profile?.phone,
          address: this.userProfile.profile?.currentAddress,
          city: this.userProfile.profile?.city,
          state: this.userProfile.profile?.state,
          zipCode: this.userProfile.profile?.zipCode,
          linkedinUrl: this.userProfile.profile?.linkedinUrl,
          workAuthorization: this.userProfile.profile?.workAuthorization
        };
        
        return mappings[fieldName];
      }

      getFullName() {
        const first = this.userProfile.user?.firstName || '';
        const last = this.userProfile.user?.lastName || '';
        return `${first} ${last}`.trim();
      }

      fillField(field, value, analysis) {
        try {
          if (!value || value.toString().trim() === '') return false;
          
          this.clearField(field);
          
          setTimeout(() => {
            const fieldType = field.tagName.toLowerCase();
            const inputType = field.type?.toLowerCase();
            
            switch (fieldType) {
              case 'select':
                return this.fillSelectField(field, value);
              case 'textarea':
                return this.fillTextArea(field, value);
              case 'input':
                if (inputType === 'checkbox' || inputType === 'radio') {
                  return this.fillCheckboxRadio(field, value);
                } else {
                  return this.fillInputField(field, value);
                }
              default:
                if (field.contentEditable === 'true') {
                  return this.fillContentEditable(field, value);
                }
                return this.fillInputField(field, value);
            }
          }, 50);
          
          return true;
        } catch (error) {
          console.log('AutoJobr: Error filling field:', error);
          return false;
        }
      }

      clearField(field) {
        if (field.value !== undefined) {
          field.value = '';
        }
        if (field.textContent !== undefined) {
          field.textContent = '';
        }
        
        this.triggerEvents(field, ['input', 'change']);
      }

      fillInputField(field, value) {
        const descriptor = Object.getOwnPropertyDescriptor(field, 'value') || 
                          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value');
        
        if (descriptor && descriptor.set) {
          descriptor.set.call(field, value);
        } else {
          field.value = value;
        }
        
        this.triggerEvents(field, [
          'input', 'change', 'blur', 'keydown', 'keyup', 'paste'
        ]);
        
        return true;
      }

      fillSelectField(field, value) {
        let option = Array.from(field.options).find(opt => 
          opt.value === value || opt.text === value
        );
        
        if (!option) {
          option = Array.from(field.options).find(opt => 
            opt.value.toLowerCase() === value.toLowerCase() || 
            opt.text.toLowerCase() === value.toLowerCase()
          );
        }
        
        if (!option) {
          option = Array.from(field.options).find(opt => 
            opt.text.toLowerCase().includes(value.toLowerCase()) ||
            value.toLowerCase().includes(opt.text.toLowerCase())
          );
        }
        
        if (option) {
          field.selectedIndex = option.index;
          this.triggerEvents(field, ['change', 'input']);
          return true;
        }
        
        return false;
      }

      fillTextArea(field, value) {
        field.value = value;
        this.triggerEvents(field, ['input', 'change', 'blur']);
        return true;
      }

      fillContentEditable(field, value) {
        field.textContent = value;
        this.triggerEvents(field, ['input', 'change', 'blur']);
        return true;
      }

      fillCheckboxRadio(field, value) {
        const shouldCheck = value === 'Yes' || value === 'true' || value === true || value === 'on';
        field.checked = shouldCheck;
        this.triggerEvents(field, ['change', 'click']);
        return true;
      }

      triggerEvents(element, eventTypes) {
        eventTypes.forEach(eventType => {
          try {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            element.dispatchEvent(event);
            
            if (window.React) {
              const reactEvent = new Event(eventType, { bubbles: true });
              element.dispatchEvent(reactEvent);
            }
            
            if (window.jQuery) {
              window.jQuery(element).trigger(eventType);
            }
          } catch (e) {
            // Continue with other events
          }
        });
      }

      getFieldId(field) {
        return field.id || field.name || field.getAttribute('data-automation-id') || 
               `${field.tagName}-${field.type}-${Math.random().toString(36).substr(2, 9)}`;
      }

      showSuccessNotification(count) {
        // Track auto-fill usage with backend
        chrome.runtime.sendMessage({
          action: 'trackAutoFill',
          data: {
            site: window.location.hostname,
            fieldsCount: count
          }
        }, (response) => {
          if (response && !response.success && response.upgradeRequired) {
            this.showUpgradeNotification(response.error);
            return;
          }
        });

        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease-out;
          ">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            AutoJobr filled ${count} fields successfully!
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }

      showUpgradeNotification(message) {
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #F59E0B;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 320px;
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <strong>Upgrade Required</strong>
            </div>
            <div style="margin-bottom: 12px;">${message}</div>
            <div style="text-align: center;">
              <button onclick="this.closest('div').remove(); window.open('${window.location.origin}/subscription', '_blank');" 
                      style="background: white; color: #F59E0B; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 500; cursor: pointer;">
                Upgrade Now
              </button>
            </div>
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
          }
        }, 8000);
      }
    }
    
    // Initialize the advanced form filler
    advancedFormFiller = new AdvancedFormFiller();
  }
  
  // Load user profile from background script
  async function loadUserProfile() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getUserProfile' }, (response) => {
        if (response && response.success) {
          userProfile = response.data;
          console.log('User profile loaded:', userProfile.user?.firstName);
        }
        resolve();
      });
    });
  }
  
  // Load extension settings
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response && response.success) {
          isAutofillEnabled = response.data.autofillEnabled;
        }
        resolve();
      });
    });
  }
  
  // Add visual indicator that AutoJobr is active
  function addAutojobrIndicator() {
    if (document.getElementById('autojobr-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'autojobr-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 6px; height: 6px; background: #10b981; border-radius: 50%;"></div>
          AutoJobr Active
        </div>
      </div>
    `;
    
    indicator.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    document.body.appendChild(indicator);
  }
  
  // Set up form field observer for auto-filling
  function setupFormObserver() {
    const observer = new MutationObserver(() => {
      if (isAutofillEnabled && userProfile) {
        detectAndFillForms();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial form detection
    setTimeout(() => {
      if (isAutofillEnabled && userProfile) {
        detectAndFillForms();
      }
    }, 2000);
  }
  
  // Set up job description observer for analysis
  function setupJobDescriptionObserver() {
    const observer = new MutationObserver(() => {
      analyzeJobDescription();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial analysis
    setTimeout(() => {
      analyzeJobDescription();
    }, 3000);
  }
  
  // Detect and auto-fill form fields with comprehensive data
  function detectAndFillForms() {
    if (!userProfile) return;
    
    const { user, profile, skills, workExperience, education } = userProfile;
    
    // Comprehensive field selectors for all major ATS platforms and job application forms
    const fieldMappings = {
      // Basic Information
      firstName: [
        'input[name*="first" i][name*="name" i]',
        'input[id*="first" i][id*="name" i]',
        'input[placeholder*="first" i][placeholder*="name" i]',
        'input[name="firstName"]',
        'input[name="fname"]',
        'input[name="first_name"]'
      ],
      lastName: [
        'input[name*="last" i][name*="name" i]',
        'input[id*="last" i][id*="name" i]',
        'input[placeholder*="last" i][placeholder*="name" i]',
        'input[name="lastName"]',
        'input[name="lname"]',
        'input[name="last_name"]'
      ],
      fullName: [
        'input[name*="full" i][name*="name" i]',
        'input[name="name"]',
        'input[name="fullName"]',
        'input[placeholder*="full name" i]',
        'input[name="applicant_name"]'
      ],
      
      // Contact Information
      email: [
        'input[type="email"]',
        'input[name*="email" i]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]'
      ],
      phone: [
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input[id*="phone" i]',
        'input[placeholder*="phone" i]',
        'input[name*="mobile" i]',
        'input[name="phoneNumber"]'
      ],
      
      // Address Information
      address: [
        'input[name*="address" i]',
        'input[id*="address" i]',
        'input[placeholder*="address" i]',
        'textarea[name*="address" i]',
        'input[name="street"]'
      ],
      city: [
        'input[name*="city" i]',
        'input[id*="city" i]',
        'input[placeholder*="city" i]'
      ],
      state: [
        'input[name*="state" i]',
        'input[id*="state" i]',
        'select[name*="state" i]',
        'input[placeholder*="state" i]',
        'input[name="province"]'
      ],
      zipCode: [
        'input[name*="zip" i]',
        'input[name*="postal" i]',
        'input[id*="zip" i]',
        'input[placeholder*="zip" i]',
        'input[name="zipCode"]'
      ],
      country: [
        'select[name*="country" i]',
        'input[name*="country" i]',
        'select[id*="country" i]'
      ],
      
      // Personal Information
      dateOfBirth: [
        'input[name*="birth" i]',
        'input[name*="dob" i]',
        'input[id*="birth" i]',
        'input[type="date"][name*="birth" i]'
      ],
      
      // Work Authorization
      workAuthorization: [
        'select[name*="work" i][name*="auth" i]',
        'select[name*="visa" i]',
        'select[name*="citizenship" i]',
        'input[name*="work_authorization" i]',
        'select[name*="legal" i][name*="work" i]'
      ],
      requiresSponsorship: [
        'input[type="checkbox"][name*="sponsor" i]',
        'input[type="radio"][name*="sponsor" i]',
        'select[name*="sponsor" i]'
      ],
      
      // Professional Information
      professionalTitle: [
        'input[name*="title" i]',
        'input[name*="position" i]',
        'input[id*="title" i]',
        'input[placeholder*="title" i]',
        'input[name="currentTitle"]'
      ],
      yearsExperience: [
        'input[name*="experience" i][name*="year" i]',
        'select[name*="experience" i]',
        'input[name*="years" i]',
        'input[type="number"][name*="experience" i]'
      ],
      
      // Salary Expectations
      salaryMin: [
        'input[name*="salary" i][name*="min" i]',
        'input[name*="compensation" i][name*="min" i]',
        'input[name*="expected" i][name*="salary" i]'
      ],
      salaryMax: [
        'input[name*="salary" i][name*="max" i]',
        'input[name*="compensation" i][name*="max" i]'
      ],
      
      // Availability
      noticePeriod: [
        'select[name*="notice" i]',
        'select[name*="availability" i]',
        'input[name*="start" i][name*="date" i]'
      ],
      
      // Work Preferences
      preferredWorkMode: [
        'select[name*="remote" i]',
        'select[name*="work" i][name*="mode" i]',
        'input[name*="remote" i]'
      ],
      willingToRelocate: [
        'input[type="checkbox"][name*="relocate" i]',
        'input[type="radio"][name*="relocate" i]',
        'select[name*="relocate" i]'
      ],
      
      // Education
      highestDegree: [
        'select[name*="degree" i]',
        'select[name*="education" i]',
        'input[name*="degree" i]'
      ],
      graduationYear: [
        'input[name*="graduation" i]',
        'select[name*="year" i]',
        'input[type="number"][name*="year" i]'
      ],
      fieldOfStudy: [
        'input[name*="major" i]',
        'input[name*="field" i]',
        'input[name*="study" i]'
      ],
      
      // Emergency Contact
      emergencyContactName: [
        'input[name*="emergency" i][name*="name" i]',
        'input[name*="contact" i][name*="name" i]'
      ],
      emergencyContactPhone: [
        'input[name*="emergency" i][name*="phone" i]',
        'input[name*="contact" i][name*="phone" i]'
      ],
      
      // Diversity and Background
      veteranStatus: [
        'select[name*="veteran" i]',
        'input[name*="veteran" i]'
      ],
      ethnicity: [
        'select[name*="ethnicity" i]',
        'select[name*="race" i]'
      ],
      gender: [
        'select[name*="gender" i]',
        'input[name*="gender" i]'
      ],
      disabilityStatus: [
        'select[name*="disability" i]',
        'input[name*="disability" i]'
      ],
      
      // LinkedIn and Social
      linkedinUrl: [
        'input[name*="linkedin" i]',
        'input[placeholder*="linkedin" i]',
        'input[name*="profile" i]'
      ],
      githubUrl: [
        'input[name*="github" i]',
        'input[placeholder*="github" i]'
      ],
      portfolioUrl: [
        'input[name*="portfolio" i]',
        'input[placeholder*="portfolio" i]',
        'input[name*="website" i]'
      ],
      
      // Resume/CV
      coverLetter: [
        'textarea[name*="cover" i]',
        'textarea[name*="letter" i]',
        'textarea[placeholder*="cover" i]'
      ],
      additionalInfo: [
        'textarea[name*="additional" i]',
        'textarea[name*="other" i]',
        'textarea[name*="comments" i]'
      ]
    };
    
    // Comprehensive data mapping for auto-fill based on user profile
    const fillData = {
      // Basic Information
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      fullName: profile?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ''),
      email: user?.email || '',
      phone: profile?.phone || '',
      
      // Address Information
      address: profile?.currentAddress || '',
      city: profile?.city || '',
      state: profile?.state || '',
      zipCode: profile?.zipCode || '',
      country: profile?.country || 'United States',
      
      // Personal Information
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      
      // Work Authorization
      workAuthorization: profile?.workAuthorization || '',
      requiresSponsorship: profile?.requiresSponsorship || false,
      
      // Professional Information
      professionalTitle: profile?.professionalTitle || '',
      yearsExperience: profile?.yearsExperience?.toString() || '',
      
      // Salary and Preferences
      salaryMin: profile?.desiredSalaryMin?.toString() || '',
      salaryMax: profile?.desiredSalaryMax?.toString() || '',
      noticePeriod: profile?.noticePeriod || '',
      preferredWorkMode: profile?.preferredWorkMode || '',
      willingToRelocate: profile?.willingToRelocate || false,
      
      // Education
      highestDegree: profile?.highestDegree || '',
      graduationYear: profile?.graduationYear?.toString() || '',
      fieldOfStudy: profile?.majorFieldOfStudy || '',
      
      // Emergency Contact
      emergencyContactName: profile?.emergencyContactName || '',
      emergencyContactPhone: profile?.emergencyContactPhone || '',
      
      // Background Information
      veteranStatus: profile?.veteranStatus || '',
      ethnicity: profile?.ethnicity || '',
      disabilityStatus: profile?.disabilityStatus || '',
      
      // Professional URLs
      linkedinUrl: profile?.linkedinUrl || '',
      githubUrl: profile?.githubUrl || '',
      portfolioUrl: profile?.portfolioUrl || '',
      
      // Additional Information
      coverLetter: profile?.summary || '',
      additionalInfo: profile?.summary || ''
    };
    
    Object.entries(fieldMappings).forEach(([fieldType, selectors]) => {
      const value = fillData[fieldType];
      if (!value) return;
      
      selectors.forEach(selector => {
        const fields = document.querySelectorAll(selector);
        fields.forEach(field => {
          if (!field.value && !field.hasAttribute('data-autojobr-filled')) {
            fillField(field, value);
            field.setAttribute('data-autojobr-filled', 'true');
          }
        });
      });
    });
    
    // Handle text areas for summaries
    const summarySelectors = [
      'textarea[name*="summary" i]',
      'textarea[name*="bio" i]',
      'textarea[name*="about" i]',
      'textarea[placeholder*="tell us about" i]',
      'textarea[placeholder*="summary" i]'
    ];
    
    if (profile?.summary) {
      summarySelectors.forEach(selector => {
        const fields = document.querySelectorAll(selector);
        fields.forEach(field => {
          if (!field.value && !field.hasAttribute('data-autojobr-filled')) {
            fillField(field, profile.summary);
            field.setAttribute('data-autojobr-filled', 'true');
          }
        });
      });
    }
  }
  
  // Fill individual form field with proper event triggering
  function fillField(field, value) {
    // Set the value
    field.value = value;
    
    // Trigger events to ensure form validation and frameworks detect the change
    const events = ['input', 'change', 'blur', 'keyup'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      field.dispatchEvent(event);
    });
    
    // Add visual indication
    const originalStyle = field.style.borderColor;
    field.style.borderColor = '#10b981';
    field.style.transition = 'border-color 0.3s ease';
    
    setTimeout(() => {
      field.style.borderColor = originalStyle;
    }, 2000);
  }
  
  // Analyze job description on the current page
  function analyzeJobDescription() {
    try {
      const jobData = extractJobData();
      if (!jobData || (!jobData.description && !jobData.title)) {
        showNotification('No job content found on this page', 'error');
        return;
      }
      
      // Only analyze if this is new job data
      if (currentJobData && currentJobData.description === jobData.description) {
        showNotification('Job already analyzed', 'info');
        return;
      }
      currentJobData = jobData;
      
      showNotification('Analyzing job match with AI...', 'info');
      
      // Extract skills and requirements using simple NLP
      const skills = extractSkillsFromText(jobData.description);
      jobData.requiredSkills = skills;
      
      // Add page URL for tracking
      jobData.url = window.location.href;
      
      console.log('Sending job data for analysis:', jobData);
      
      // Send to background script for analysis
      chrome.runtime.sendMessage({
        action: 'analyzeJob',
        data: jobData
      }, (response) => {
        if (response && response.success) {
          console.log('Job analysis completed:', response.data);
          showAnalysisResults(response.data);
          showNotification(`Job match: ${response.data.matchScore}%`, 'success');
          
          // Auto-detect and fill cover letter if field is found
          setTimeout(() => {
            detectAndFillCoverLetter(jobData);
          }, 2000);
        } else {
          console.error('Analysis failed:', response?.error);
          showNotification(response?.error || 'Failed to analyze job', 'error');
        }
      });
      
    } catch (error) {
      console.error('Error analyzing job description:', error);
      showNotification('Error analyzing job', 'error');
    }
  }
  
  // Detect cover letter fields and auto-generate content
  function detectAndFillCoverLetter(jobData) {
    if (!userProfile || !jobData) return;
    
    // Enhanced cover letter selectors for all major platforms
    const coverLetterSelectors = [
      // Workday
      'textarea[data-automation-id*="coverLetter"]',
      'textarea[data-automation-id*="cover-letter"]',
      'textarea[aria-label*="Cover Letter" i]',
      '[data-automation-id*="coverLetter"] textarea',
      
      // LinkedIn
      'textarea[id*="cover-letter"]',
      'textarea[name*="coverLetter"]',
      
      // Greenhouse
      'textarea[name*="cover_letter"]',
      'textarea[id*="cover_letter"]',
      
      // Generic selectors
      'textarea[placeholder*="cover letter" i]',
      'textarea[placeholder*="why are you interested" i]',
      'textarea[placeholder*="tell us about yourself" i]',
      'textarea[aria-label*="motivation" i]',
      'textarea[name*="motivation"]',
      'textarea[name*="letter"]',
      'textarea[name*="why"]',
      'textarea[id*="motivation"]'
    ];
    
    const coverLetterField = coverLetterSelectors
      .map(selector => document.querySelector(selector))
      .find(field => field && field.offsetParent !== null && !field.value.trim());
    
    if (coverLetterField) {
      generateAndFillCoverLetter(coverLetterField, jobData);
    }
  }
  
  // Generate and fill cover letter automatically
  function generateAndFillCoverLetter(field, jobData) {
    showNotification('Generating cover letter...', 'info');
    
    chrome.runtime.sendMessage({
      action: 'generateCoverLetter',
      data: {
        companyName: jobData.company,
        jobTitle: jobData.title,
        jobDescription: jobData.description
      }
    }, (response) => {
      if (response && response.success) {
        // Fill the cover letter field
        field.focus();
        
        // Clear existing content first
        field.value = '';
        
        // Use proper input simulation for better compatibility
        if (field.setRangeText) {
          field.setRangeText(response.coverLetter);
        } else {
          field.value = response.coverLetter;
        }
        
        // Trigger comprehensive events to ensure form recognition
        const events = ['focus', 'input', 'change', 'blur', 'keyup'];
        events.forEach(eventType => {
          const event = new Event(eventType, { 
            bubbles: true, 
            cancelable: true 
          });
          field.dispatchEvent(event);
        });
        
        // React/Angular specific event triggering
        if (window.React || field.getAttribute('data-automation-id')) {
          // For React components
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 
            'value'
          ).set;
          nativeInputValueSetter.call(field, response.coverLetter);
          
          const inputEvent = new Event('input', { bubbles: true });
          field.dispatchEvent(inputEvent);
        }
        
        // Show success notification
        showNotification('Cover letter auto-generated and filled!', 'success');
        
        // Highlight the field briefly
        const originalStyle = {
          border: field.style.border,
          boxShadow: field.style.boxShadow
        };
        
        field.style.border = '2px solid #10b981';
        field.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
        
        setTimeout(() => {
          field.style.border = originalStyle.border;
          field.style.boxShadow = originalStyle.boxShadow;
        }, 4000);
        
      } else {
        showNotification(response?.error || 'Failed to generate cover letter', 'error');
        console.log('Cover letter generation failed:', response?.error);
      }
    });
  }
  
  // Extract job data from the current page
  function extractJobData() {
    const hostname = window.location.hostname;
    let jobData = {};
    
    // Platform-specific extraction
    if (hostname.includes('linkedin.com')) {
      jobData = extractLinkedInJobData();
    } else if (hostname.includes('greenhouse.io')) {
      jobData = extractGreenhouseJobData();
    } else if (hostname.includes('lever.co')) {
      jobData = extractLeverJobData();
    } else if (hostname.includes('workday.com')) {
      jobData = extractWorkdayJobData();
    } else {
      jobData = extractGenericJobData();
    }
    
    return jobData;
  }
  
  // Generic job data extraction
  function extractGenericJobData() {
    const titleSelectors = [
      'h1',
      '[class*="job-title" i]',
      '[class*="position" i]',
      '[id*="job-title" i]'
    ];
    
    const companySelectors = [
      '[class*="company" i]',
      '[class*="employer" i]',
      '[data-testid*="company" i]'
    ];
    
    const descriptionSelectors = [
      '[class*="description" i]',
      '[class*="job-content" i]',
      '[class*="details" i]',
      'section:contains("description")',
      'div:contains("responsibilities")'
    ];
    
    const title = findTextContent(titleSelectors);
    const company = findTextContent(companySelectors);
    const description = findTextContent(descriptionSelectors);
    
    return {
      title: title || document.title,
      company: company || '',
      description: description || document.body.innerText,
      url: window.location.href,
      location: extractLocation(),
      platform: window.location.hostname
    };
  }
  
  // LinkedIn-specific extraction
  function extractLinkedInJobData() {
    const titleEl = document.querySelector('.top-card-layout__title, .job-details-jobs-unified-top-card__job-title');
    const companyEl = document.querySelector('.topcard__flavor--bullet, .job-details-jobs-unified-top-card__company-name');
    const descriptionEl = document.querySelector('.jobs-box__html-content, .jobs-description-content__text');
    
    return {
      title: titleEl?.innerText?.trim() || '',
      company: companyEl?.innerText?.trim() || '',
      description: descriptionEl?.innerText?.trim() || '',
      url: window.location.href,
      location: extractLocation(),
      platform: 'LinkedIn'
    };
  }
  
  // Greenhouse-specific extraction
  function extractGreenhouseJobData() {
    const titleEl = document.querySelector('.app-title, .job-post-title');
    const companyEl = document.querySelector('.company-name, .app-company');
    const descriptionEl = document.querySelector('.job-post-content, .application-content');
    
    return {
      title: titleEl?.innerText?.trim() || '',
      company: companyEl?.innerText?.trim() || '',
      description: descriptionEl?.innerText?.trim() || '',
      url: window.location.href,
      location: extractLocation(),
      platform: 'Greenhouse'
    };
  }
  
  // Lever-specific extraction
  function extractLeverJobData() {
    const titleEl = document.querySelector('.posting-headline h2');
    const companyEl = document.querySelector('.posting-headline .company-name');
    const descriptionEl = document.querySelector('.posting-content .content');
    
    return {
      title: titleEl?.innerText?.trim() || '',
      company: companyEl?.innerText?.trim() || '',
      description: descriptionEl?.innerText?.trim() || '',
      url: window.location.href,
      location: extractLocation(),
      platform: 'Lever'
    };
  }
  
  // Workday-specific extraction
  function extractWorkdayJobData() {
    const titleEl = document.querySelector('[data-automation-id="jobPostingHeader"]');
    const companyEl = document.querySelector('[data-automation-id="jobPostingCompany"]');
    const descriptionEl = document.querySelector('[data-automation-id="jobPostingDescription"]');
    
    return {
      title: titleEl?.innerText?.trim() || '',
      company: companyEl?.innerText?.trim() || '',
      description: descriptionEl?.innerText?.trim() || '',
      url: window.location.href,
      location: extractLocation(),
      platform: 'Workday'
    };
  }
  
  // Helper function to find text content from multiple selectors
  function findTextContent(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText?.trim()) {
        return element.innerText.trim();
      }
    }
    return '';
  }
  
  // Extract location information
  function extractLocation() {
    const locationSelectors = [
      '[class*="location" i]',
      '[class*="city" i]',
      '[data-testid*="location" i]',
      '.job-location',
      '.location-info'
    ];
    
    return findTextContent(locationSelectors);
  }
  
  // Extract skills from job description text
  function extractSkillsFromText(text) {
    const commonSkills = [
      // Programming languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
      'TypeScript', 'Scala', 'R', 'MATLAB', 'SQL', 'HTML', 'CSS', 'SASS', 'LESS',
      
      // Frameworks and libraries
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Rails', 'Spring',
      'Laravel', 'jQuery', 'Bootstrap', 'Tailwind', 'Next.js', 'Nuxt.js', 'Svelte',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle',
      'DynamoDB', 'Cassandra', 'Neo4j',
      
      // Cloud and DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions',
      'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
      
      // Tools and technologies
      'Git', 'Jira', 'Confluence', 'Slack', 'Figma', 'Adobe', 'Photoshop', 'Illustrator',
      'Sketch', 'InVision', 'Postman', 'Swagger', 'REST', 'GraphQL', 'SOAP',
      
      // Soft skills
      'Leadership', 'Communication', 'Problem Solving', 'Critical Thinking', 'Teamwork',
      'Project Management', 'Agile', 'Scrum', 'Kanban', 'Time Management'
    ];
    
    const foundSkills = [];
    const textLower = text.toLowerCase();
    
    commonSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (textLower.includes(skillLower)) {
        foundSkills.push(skill);
      }
    });
    
    return foundSkills;
  }
  
  // Show analysis results in a floating widget
  function showAnalysisResults(analysis) {
    // Remove existing widget
    const existingWidget = document.getElementById('autojobr-analysis-widget');
    if (existingWidget) {
      existingWidget.remove();
    }
    
    const widget = document.createElement('div');
    widget.id = 'autojobr-analysis-widget';
    widget.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e5e7eb;
        overflow: hidden;
      ">
        <div style="
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="font-weight: 600; font-size: 14px;">Job Match Analysis</div>
          <button id="close-analysis" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
          ">✕</button>
        </div>
        
        <div style="padding: 16px;">
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 14px; color: #6b7280;">Match Score</span>
              <span style="
                font-weight: 600;
                color: ${analysis.matchScore >= 75 ? '#10b981' : analysis.matchScore >= 50 ? '#f59e0b' : '#ef4444'};
                font-size: 16px;
              ">${analysis.matchScore}%</span>
            </div>
            <div style="
              background: #f3f4f6;
              height: 8px;
              border-radius: 4px;
              overflow: hidden;
            ">
              <div style="
                background: ${analysis.matchScore >= 75 ? '#10b981' : analysis.matchScore >= 50 ? '#f59e0b' : '#ef4444'};
                height: 100%;
                width: ${analysis.matchScore}%;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Seniority Level</div>
            <div style="font-size: 14px; color: #374151;">${analysis.detectedSeniority}</div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Work Mode</div>
            <div style="font-size: 14px; color: #374151;">${analysis.workMode}</div>
          </div>
          
          ${analysis.matchingSkills.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Matching Skills</div>
              <div style="display: flex; flex-wrap: gap: 4px;">
                ${analysis.matchingSkills.slice(0, 3).map(skill => `
                  <span style="
                    background: #10b981;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                  ">${skill}</span>
                `).join('')}
                ${analysis.matchingSkills.length > 3 ? `
                  <span style="
                    background: #6b7280;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                  ">+${analysis.matchingSkills.length - 3}</span>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          ${analysis.missingSkills.length > 0 ? `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Missing Skills</div>
              <div style="display: flex; flex-wrap: gap: 4px;">
                ${analysis.missingSkills.slice(0, 3).map(skill => `
                  <span style="
                    background: #fef3c7;
                    color: #d97706;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                  ">${skill}</span>
                `).join('')}
                ${analysis.missingSkills.length > 3 ? `
                  <span style="
                    background: #6b7280;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                  ">+${analysis.missingSkills.length - 3}</span>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <button id="track-application" style="
            width: 100%;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
          " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
            Track Application
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    // Add event listeners
    document.getElementById('close-analysis').addEventListener('click', () => {
      widget.remove();
    });
    
    document.getElementById('track-application').addEventListener('click', () => {
      trackCurrentJob(analysis);
    });
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.getElementById('autojobr-analysis-widget')) {
        widget.style.opacity = '0.7';
      }
    }, 10000);
  }
  
  // Track current job application
  function trackCurrentJob(analysis) {
    if (!currentJobData) return;
    
    const applicationData = {
      ...currentJobData,
      matchScore: analysis.matchScore,
      requiredSkills: analysis.matchingSkills.concat(analysis.missingSkills)
    };
    
    chrome.runtime.sendMessage({
      action: 'trackApplication',
      data: applicationData
    }, (response) => {
      if (response && response.success) {
        showNotification('Application tracked successfully!', 'success');
      } else {
        showNotification('Failed to track application', 'error');
      }
    });
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10002;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleAutofill') {
      isAutofillEnabled = request.enabled;
      showNotification(`Autofill ${isAutofillEnabled ? 'enabled' : 'disabled'}`, 'info');
    }
    
    if (request.action === 'refreshAnalysis') {
      currentJobData = null; // Force re-analysis
      analyzeJobDescription();
    }
    
    if (request.action === 'fillForms') {
      detectAndFillForms();
      showNotification('Forms filled with your profile data', 'success');
    }
    
    if (request.action === 'getJobData') {
      // Extract job data from current page
      const jobData = extractJobData();
      sendResponse(jobData);
      return true;
    }
  });
  
})();