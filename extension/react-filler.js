// React-Aware Form Filler - Bypasses Controlled Components
// This is Simplify's secret weapon - we're making it BETTER

class ReactFormFiller {
  constructor() {
    this.fillAttempts = 0;
    this.successfulFills = 0;
  }

  // Main method to fill a field (tries all methods)
  async fillField(element, value, options = {}) {
    if (!element || value === null || value === undefined) {
      return false;
    }

    this.fillAttempts++;

    // Try different methods in order of effectiveness
    const methods = [
      () => this.fillReactInput(element, value),
      () => this.fillNativeInput(element, value),
      () => this.fillWithEvents(element, value),
      () => this.fillWithDescriptor(element, value)
    ];

    for (const method of methods) {
      try {
        const success = await method();
        if (success && this.verifyFill(element, value)) {
          this.successfulFills++;
          
          // Trigger validation events
          if (options.validate !== false) {
            await this.triggerValidation(element);
          }
          
          return true;
        }
      } catch (error) {
        console.warn('Fill method failed:', error);
      }
    }

    return false;
  }

  // Method 1: React-specific filling (BEST for React apps)
  fillReactInput(element, value) {
    try {
      // Find React instance on element
      const reactKey = Object.keys(element).find(key => 
        key.startsWith('__reactProps') || 
        key.startsWith('__reactFiber') ||
        key.startsWith('__reactInternalInstance')
      );

      if (!reactKey) {
        return false;
      }

      // Get React props/fiber
      const reactInstance = element[reactKey];
      
      // Method A: Direct props onChange
      if (reactInstance?.memoizedProps?.onChange) {
        element.value = value;
        reactInstance.memoizedProps.onChange({
          target: element,
          currentTarget: element
        });
        return true;
      }

      // Method B: Through fiber's return path
      if (reactInstance?.return?.stateNode?.props?.onChange) {
        element.value = value;
        reactInstance.return.stateNode.props.onChange({
          target: element,
          currentTarget: element
        });
        return true;
      }

      // Method C: Direct setter
      const valueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(element),
        'value'
      )?.set;

      if (valueSetter) {
        valueSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  // Method 2: Native input filling with descriptor override
  fillNativeInput(element, value) {
    try {
      const prototype = Object.getPrototypeOf(element);
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
        return true;
      }
      
      element.value = value;
      return true;
    } catch (error) {
      return false;
    }
  }

  // Method 3: Fill with full event cascade
  fillWithEvents(element, value) {
    try {
      // Focus the element first
      element.focus();
      
      // Set value
      element.value = '';
      
      // Simulate typing character by character for complex validations
      for (const char of String(value)) {
        element.value += char;
        
        // Dispatch events for each character
        element.dispatchEvent(new KeyboardEvent('keydown', { 
          key: char, 
          bubbles: true, 
          cancelable: true 
        }));
        element.dispatchEvent(new KeyboardEvent('keypress', { 
          key: char, 
          bubbles: true, 
          cancelable: true 
        }));
        element.dispatchEvent(new InputEvent('input', { 
          data: char, 
          bubbles: true, 
          cancelable: true 
        }));
        element.dispatchEvent(new KeyboardEvent('keyup', { 
          key: char, 
          bubbles: true, 
          cancelable: true 
        }));
      }
      
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Method 4: Descriptor override (last resort)
  fillWithDescriptor(element, value) {
    try {
      Object.defineProperty(element, 'value', {
        get() { return value; },
        set(v) { 
          Object.defineProperty(element, 'value', {
            value: v,
            writable: true,
            configurable: true
          });
        },
        configurable: true
      });
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Select dropdown/radio/checkbox
  async selectOption(element, value, options = {}) {
    const tagName = element.tagName.toLowerCase();
    const type = element.type?.toLowerCase();

    try {
      if (tagName === 'select') {
        return await this.selectDropdown(element, value);
      } else if (type === 'radio') {
        return await this.selectRadio(element, value);
      } else if (type === 'checkbox') {
        return await this.selectCheckbox(element, value);
      }
      
      return false;
    } catch (error) {
      console.error('Selection error:', error);
      return false;
    }
  }

  // Select dropdown option
  async selectDropdown(select, value) {
    try {
      // Find matching option (exact match, case-insensitive, or partial)
      const options = Array.from(select.options);
      const normalizedValue = String(value).toLowerCase().trim();
      
      let matchedOption = 
        // Exact value match
        options.find(opt => opt.value === value) ||
        // Exact text match
        options.find(opt => opt.text.toLowerCase() === normalizedValue) ||
        // Partial text match
        options.find(opt => opt.text.toLowerCase().includes(normalizedValue)) ||
        // Value contains search
        options.find(opt => opt.value.toLowerCase().includes(normalizedValue));

      if (!matchedOption) {
        return false;
      }

      // Select the option
      select.value = matchedOption.value;
      matchedOption.selected = true;
      
      // Trigger React onChange if available
      if (await this.fillReactInput(select, matchedOption.value)) {
        return true;
      }

      // Fallback: dispatch events
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Select radio button
  async selectRadio(radio, value) {
    try {
      const shouldCheck = value === true || 
                         String(value).toLowerCase() === 'yes' ||
                         String(value).toLowerCase() === 'true' ||
                         radio.value === String(value);

      if (shouldCheck) {
        radio.checked = true;
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  // Select checkbox
  async selectCheckbox(checkbox, value) {
    try {
      const shouldCheck = value === true || 
                         String(value).toLowerCase() === 'yes' ||
                         String(value).toLowerCase() === 'true';

      if (checkbox.checked !== shouldCheck) {
        checkbox.click();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Verify that the fill was successful
  verifyFill(element, expectedValue) {
    try {
      const actualValue = element.value || element.textContent;
      
      // For checkboxes/radios, check 'checked' property
      if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked === (expectedValue === true || 
                                   String(expectedValue).toLowerCase() === 'yes');
      }
      
      // For text inputs, verify value matches
      return actualValue === String(expectedValue);
    } catch (error) {
      return false;
    }
  }

  // Trigger validation events
  async triggerValidation(element) {
    try {
      // Blur and focus to trigger validation
      element.blur();
      await this.sleep(50);
      element.focus();
      await this.sleep(50);
      element.blur();
      
      // Dispatch validation-related events
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      element.dispatchEvent(new Event('focusout', { bubbles: true }));
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Upload file to file input
  async uploadFile(fileInput, file) {
    try {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (error) {
      console.error('File upload error:', error);
      return false;
    }
  }

  // Helper: sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get stats
  getStats() {
    return {
      attempts: this.fillAttempts,
      successful: this.successfulFills,
      successRate: this.fillAttempts > 0 
        ? (this.successfulFills / this.fillAttempts * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReactFormFiller };
}
