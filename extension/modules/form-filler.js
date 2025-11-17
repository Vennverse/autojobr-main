
// Form Filler Module - Handles intelligent form field filling
class FormFiller {
  constructor(fieldMappings) {
    this.fieldMappings = fieldMappings;
    this.filledFields = new Set();
    this.fillAttempts = 0;
    this.maxAttempts = 3;
  }

  async fillForm(userProfile) {
    if (this.fillAttempts >= this.maxAttempts) {
      console.warn('Max fill attempts reached');
      return { success: false, error: 'Maximum fill attempts exceeded' };
    }

    this.fillAttempts++;
    const fields = this.findFormFields();
    let fieldsFilled = 0;

    for (const field of fields) {
      if (this.filledFields.has(field)) continue;

      const filled = this.fillField(field, userProfile);
      if (filled) {
        fieldsFilled++;
        this.filledFields.add(field);
      }
    }

    return { 
      success: true, 
      fieldsFilled, 
      fieldsFound: fields.length 
    };
  }

  findFormFields() {
    return Array.from(document.querySelectorAll('input, textarea, select')).filter(field => {
      return field.offsetParent !== null && !field.disabled && !field.readOnly;
    });
  }

  fillField(field, userProfile) {
    const fieldType = this.identifyField(field);
    if (!fieldType) return false;

    const value = this.getValueForField(fieldType, userProfile);
    if (!value) return false;

    return this.setFieldValue(field, value);
  }

  identifyField(field) {
    const name = (field.name || '').toLowerCase();
    const id = (field.id || '').toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();
    const label = this.getFieldLabel(field)?.toLowerCase() || '';

    for (const [fieldType, mapping] of Object.entries(this.fieldMappings)) {
      if (mapping.patterns.some(pattern => 
        name.includes(pattern) || id.includes(pattern) || 
        placeholder.includes(pattern) || label.includes(pattern)
      )) {
        return fieldType;
      }
    }

    return null;
  }

  getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    return label?.textContent?.trim();
  }

  getValueForField(fieldType, userProfile) {
    const mapping = {
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      phone: userProfile.phone,
      currentTitle: userProfile.professionalTitle,
      experience: userProfile.yearsExperience
    };

    return mapping[fieldType] || null;
  }

  setFieldValue(field, value) {
    try {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (error) {
      console.error('Error setting field value:', error);
      return false;
    }
  }

  reset() {
    this.filledFields.clear();
    this.fillAttempts = 0;
  }
}

if (typeof window !== 'undefined') {
  window.FormFiller = FormFiller;
}
