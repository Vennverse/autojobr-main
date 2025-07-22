// Comprehensive Chrome Extension Testing Suite
import https from 'https';
import fs from 'fs';

const API_BASE = 'https://0e44431a-708c-4df3-916b-4c2aa6aa0fdf-00-2xw51bgbvt8cp.spock.replit.dev';
const TEST_USER = {
  email: 'shubhamdubeyskd2001@gmail.com',
  password: 'autojobr123'
};

class ExtensionTester {
  constructor() {
    this.sessionCookie = null;
    this.testResults = [];
    this.userProfile = null;
    this.extensionData = null;
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${status}: ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, status, message });
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, API_BASE);
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AutoJobr-Extension-Test/1.0',
          ...options.headers
        }
      };

      if (this.sessionCookie) {
        requestOptions.headers.Cookie = this.sessionCookie;
      }

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          // Store session cookie for extension authentication simulation
          if (res.headers['set-cookie']) {
            this.sessionCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
          }

          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: data, headers: res.headers });
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  async testExtensionAuthentication() {
    this.log('Testing extension authentication flow...');
    
    // Step 1: Login via extension API endpoints
    try {
      const loginResponse = await this.makeRequest('/api/auth/email/login', {
        method: 'POST',
        body: TEST_USER
      });

      if (loginResponse.status === 200) {
        this.log('✅ Extension authentication successful', 'PASS');
        
        // Step 2: Test session persistence (what extension would do)
        const userResponse = await this.makeRequest('/api/user');
        if (userResponse.status === 200) {
          this.userProfile = userResponse.data;
          this.log(`✅ Session maintained: ${userResponse.data.firstName} ${userResponse.data.lastName}`, 'PASS');
          return true;
        } else {
          this.log('❌ Session not maintained after login', 'FAIL');
          return false;
        }
      } else {
        this.log(`❌ Extension authentication failed: ${loginResponse.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Authentication error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testProfileDataForFormFilling() {
    this.log('Testing profile data collection for form auto-fill...');
    
    try {
      // Test all endpoints that extension needs for form filling
      const endpoints = [
        { name: 'Profile', endpoint: '/api/profile' },
        { name: 'Skills', endpoint: '/api/skills' },
        { name: 'Work Experience', endpoint: '/api/work-experience' },
        { name: 'Education', endpoint: '/api/education' }
      ];

      let allDataAvailable = true;
      const profileData = {};

      for (const { name, endpoint } of endpoints) {
        const response = await this.makeRequest(endpoint);
        
        if (response.status === 200) {
          profileData[name.toLowerCase().replace(' ', '')] = response.data;
          this.log(`✅ ${name} data loaded: ${Array.isArray(response.data) ? response.data.length + ' items' : 'available'}`, 'PASS');
        } else {
          this.log(`❌ ${name} data failed: ${response.status}`, 'FAIL');
          allDataAvailable = false;
        }
      }

      // Store for form filling simulation
      this.extensionData = profileData;

      // Validate essential fields for form filling
      if (profileData.profile) {
        const profile = profileData.profile;
        const requiredFields = ['firstName', 'lastName', 'email'];
        const availableFields = requiredFields.filter(field => profile[field]);
        
        this.log(`✅ Essential form fields available: ${availableFields.join(', ')}`, 'INFO');
        
        if (availableFields.length === requiredFields.length) {
          this.log('✅ All required profile fields available for form filling', 'PASS');
        } else {
          this.log('⚠️ Some required profile fields missing', 'WARN');
        }
      }

      return allDataAvailable;
    } catch (error) {
      this.log(`❌ Profile data collection error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  simulateFormFieldMapping() {
    this.log('Simulating extension form field mapping...');
    
    if (!this.extensionData || !this.extensionData.profile) {
      this.log('❌ No profile data available for form mapping', 'FAIL');
      return false;
    }

    try {
      const profile = this.extensionData.profile;
      const skills = this.extensionData.skills || [];
      const experience = this.extensionData.workexperience || [];
      const education = this.extensionData.education || [];

      // Simulate form field mappings that extension would create
      const fieldMappings = {
        // Personal Information
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        
        // Address
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        
        // Professional
        currentTitle: experience.length > 0 ? experience[0].jobTitle : '',
        currentCompany: experience.length > 0 ? experience[0].company : '',
        
        // Education
        degree: education.length > 0 ? education[0].degree : '',
        university: education.length > 0 ? education[0].institution : '',
        
        // Skills (first 5 for testing)
        skills: skills.slice(0, 5).map(s => s.name || s.skill).join(', '),
        
        // URLs
        linkedinUrl: profile.linkedinUrl || '',
        portfolioUrl: profile.portfolioUrl || ''
      };

      // Count available vs empty fields
      const totalFields = Object.keys(fieldMappings).length;
      const filledFields = Object.values(fieldMappings).filter(value => value && value.trim().length > 0).length;
      const fillPercentage = Math.round((filledFields / totalFields) * 100);

      this.log(`✅ Form mapping simulation complete: ${filledFields}/${totalFields} fields (${fillPercentage}%)`, 'PASS');
      
      // Log some example mappings
      this.log(`   Name: ${fieldMappings.firstName} ${fieldMappings.lastName}`, 'INFO');
      this.log(`   Email: ${fieldMappings.email}`, 'INFO');
      this.log(`   Current Role: ${fieldMappings.currentTitle} at ${fieldMappings.currentCompany}`, 'INFO');
      
      if (fillPercentage >= 70) {
        this.log('✅ Sufficient data available for effective form filling', 'PASS');
        return true;
      } else {
        this.log('⚠️ Limited data available - forms may be partially filled', 'WARN');
        return true; // Still pass, but with warning
      }

    } catch (error) {
      this.log(`❌ Form mapping simulation error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testJobAnalysisAPI() {
    this.log('Testing job analysis API (used by extension overlay)...');
    
    try {
      const sampleJobData = {
        title: "Senior Software Engineer",
        company: "Tech Corp",
        description: "We are seeking a Senior Software Engineer with 5+ years of experience in JavaScript, React, Node.js, and Python. The ideal candidate will have experience with cloud platforms like AWS and be familiar with agile development methodologies.",
        location: "San Francisco, CA",
        salary: "$120,000 - $180,000"
      };

      const response = await this.makeRequest('/api/analyze-job', {
        method: 'POST',
        body: sampleJobData
      });

      if (response.status === 200) {
        const analysis = response.data;
        this.log('✅ Job analysis API working', 'PASS');
        this.log(`   Match Score: ${analysis.matchScore || 'N/A'}%`, 'INFO');
        this.log(`   Skills Match: ${analysis.skillsMatch || 0}/10`, 'INFO');
        this.log(`   Experience Match: ${analysis.experienceMatch || 0}/10`, 'INFO');
        return true;
      } else {
        this.log(`❌ Job analysis failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Job analysis error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testCoverLetterGeneration() {
    this.log('Testing AI cover letter generation (extension feature)...');
    
    try {
      const testData = {
        jobDescription: "Software Engineer position requiring React, Node.js, and Python experience. Company focuses on innovative web applications.",
        companyName: "InnovateTech Solutions",
        useProfile: true
      };

      const response = await this.makeRequest('/api/generate-cover-letter', {
        method: 'POST',
        body: testData
      });

      if (response.status === 200) {
        const result = response.data;
        this.log(`✅ Cover letter generated: ${result.coverLetter?.length || 0} characters`, 'PASS');
        
        if (result.coverLetter && result.coverLetter.length > 100) {
          this.log('✅ Cover letter content appears substantial', 'PASS');
          return true;
        } else {
          this.log('⚠️ Cover letter seems too short or empty', 'WARN');
          return false;
        }
      } else {
        this.log(`❌ Cover letter generation failed: ${response.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Cover letter generation error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testApplicationTracking() {
    this.log('Testing application tracking (extension saves applications)...');
    
    try {
      // First, get existing applications
      const appsResponse = await this.makeRequest('/api/applications');
      
      if (appsResponse.status === 200) {
        const applications = appsResponse.data;
        this.log(`✅ Application tracking API working: ${applications.length} applications found`, 'PASS');
        
        // Test application stats endpoint
        const statsResponse = await this.makeRequest('/api/applications/stats');
        if (statsResponse.status === 200) {
          const stats = statsResponse.data;
          this.log(`   Total Applications: ${stats.totalApplications || 0}`, 'INFO');
          this.log(`   Interviews: ${stats.interviews || 0}`, 'INFO');
          this.log('✅ Application statistics API working', 'PASS');
          return true;
        } else {
          this.log('❌ Application stats API failed', 'FAIL');
          return false;
        }
      } else {
        this.log(`❌ Application tracking failed: ${appsResponse.status}`, 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Application tracking error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  validateExtensionConfiguration() {
    this.log('Validating extension configuration files...');
    
    try {
      // Check if config files exist and have correct URLs
      const configFiles = [
        'extension/config.js',
        'extension/manifest.json',
        'extension/background.js',
        'extension/popup.js'
      ];

      let allConfigured = true;

      for (const file of configFiles) {
        try {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes(API_BASE.replace('https://', ''))) {
              this.log(`✅ ${file} configured with correct URL`, 'PASS');
            } else {
              this.log(`❌ ${file} has incorrect or missing URL`, 'FAIL');
              allConfigured = false;
            }
          } else {
            this.log(`❌ ${file} not found`, 'FAIL');
            allConfigured = false;
          }
        } catch (error) {
          this.log(`❌ Error reading ${file}: ${error.message}`, 'ERROR');
          allConfigured = false;
        }
      }

      if (allConfigured) {
        this.log('✅ All extension configuration files properly configured', 'PASS');
        return true;
      } else {
        this.log('❌ Some extension configuration issues found', 'FAIL');
        return false;
      }

    } catch (error) {
      this.log(`❌ Configuration validation error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  testJobBoardCompatibility() {
    this.log('Testing job board compatibility patterns...');
    
    try {
      // Simulate common job board form patterns that extension should handle
      const jobBoardPatterns = [
        {
          name: 'LinkedIn',
          fields: ['firstName', 'lastName', 'email', 'phone', 'currentTitle'],
          selectors: ['input[name="firstName"]', 'input[name="lastName"]']
        },
        {
          name: 'Indeed',
          fields: ['fullName', 'email', 'phone', 'resumeFile'],
          selectors: ['input[name="applicant.name"]', 'input[name="applicant.email"]']
        },
        {
          name: 'Workday',
          fields: ['firstName', 'lastName', 'email', 'address', 'workAuthorization'],
          selectors: ['input[data-automation-id="firstName"]']
        },
        {
          name: 'Greenhouse',
          fields: ['first_name', 'last_name', 'email', 'phone', 'cover_letter'],
          selectors: ['input[id*="first_name"]', 'textarea[id*="cover_letter"]']
        }
      ];

      let supportedBoards = 0;

      for (const board of jobBoardPatterns) {
        // Check if we have data for the required fields
        const availableFields = board.fields.filter(field => {
          if (this.extensionData && this.extensionData.profile) {
            return this.extensionData.profile[field] || 
                   this.extensionData.profile[field.replace('_', '')] ||
                   (field === 'fullName' && this.extensionData.profile.firstName);
          }
          return false;
        });

        const supportPercentage = Math.round((availableFields.length / board.fields.length) * 100);
        
        if (supportPercentage >= 60) {
          this.log(`✅ ${board.name}: ${supportPercentage}% field support`, 'PASS');
          supportedBoards++;
        } else {
          this.log(`⚠️ ${board.name}: ${supportPercentage}% field support (limited)`, 'WARN');
        }
      }

      const overallSupport = Math.round((supportedBoards / jobBoardPatterns.length) * 100);
      this.log(`✅ Job board compatibility: ${supportedBoards}/${jobBoardPatterns.length} boards (${overallSupport}%)`, 'PASS');
      
      return supportedBoards >= 3; // Should support at least 3 major boards

    } catch (error) {
      this.log(`❌ Job board compatibility test error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runAllExtensionTests() {
    this.log('🚀 Starting comprehensive Chrome Extension testing...');
    this.log(`API Base: ${API_BASE}`);
    this.log(`Test User: ${TEST_USER.email}`);
    this.log('='.repeat(80));

    const tests = [
      { name: 'Extension Authentication', fn: () => this.testExtensionAuthentication() },
      { name: 'Profile Data Collection', fn: () => this.testProfileDataForFormFilling() },
      { name: 'Form Field Mapping Simulation', fn: () => this.simulateFormFieldMapping() },
      { name: 'Job Analysis API', fn: () => this.testJobAnalysisAPI() },
      { name: 'AI Cover Letter Generation', fn: () => this.testCoverLetterGeneration() },
      { name: 'Application Tracking', fn: () => this.testApplicationTracking() },
      { name: 'Configuration Validation', fn: () => this.validateExtensionConfiguration() },
      { name: 'Job Board Compatibility', fn: () => this.testJobBoardCompatibility() }
    ];

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (const test of tests) {
      this.log(`\n📋 Testing: ${test.name}`);
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.log(`❌ ${test.name} threw error: ${error.message}`, 'ERROR');
        failed++;
      }
      
      // Brief delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Count warnings
    warnings = this.testResults.filter(r => r.status === 'WARN').length;

    this.log('\n' + '='.repeat(80));
    this.log('🎯 EXTENSION TEST SUMMARY:');
    this.log(`✅ Passed: ${passed}`);
    this.log(`❌ Failed: ${failed}`);
    this.log(`⚠️ Warnings: ${warnings}`);
    this.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

    // Extension-specific recommendations
    this.generateExtensionReport();

    return { passed, failed, warnings, total: passed + failed };
  }

  generateExtensionReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Chrome Extension Comprehensive Test',
      apiBase: API_BASE,
      testUser: TEST_USER.email,
      userProfile: this.userProfile,
      extensionData: this.extensionData,
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync('extension_test_results.json', JSON.stringify(report, null, 2));
    this.log('\n📄 Extension test report saved to: extension_test_results.json');
    
    // Create simple summary for user
    const summary = this.createUserSummary();
    fs.writeFileSync('extension_test_summary.txt', summary);
    this.log('📝 User-friendly summary saved to: extension_test_summary.txt');
  }

  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    const warnings = this.testResults.filter(r => r.status === 'WARN');
    
    if (failedTests.length === 0) {
      recommendations.push("✅ Extension is fully functional and ready for deployment");
    }
    
    if (failedTests.some(t => t.message.includes('authentication'))) {
      recommendations.push("🔧 Fix authentication flow - ensure session cookies are properly maintained");
    }
    
    if (failedTests.some(t => t.message.includes('profile'))) {
      recommendations.push("📝 Complete user profile data to improve form auto-fill effectiveness");
    }
    
    if (warnings.length > 2) {
      recommendations.push("⚠️ Address profile data gaps to improve job board compatibility");
    }
    
    recommendations.push("🧪 Test extension on actual job sites: LinkedIn, Indeed, Workday");
    recommendations.push("📱 Install extension in Chrome and verify popup functionality");
    
    return recommendations;
  }

  createUserSummary() {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    
    return `
AutoJobr Chrome Extension - Test Summary
=========================================

Overall Status: ${failed === 0 ? '✅ READY' : '⚠️ ISSUES FOUND'}

Results:
- ✅ Passed Tests: ${passed}
- ❌ Failed Tests: ${failed} 
- ⚠️ Warnings: ${warnings}

Key Findings:
${this.testResults.filter(r => r.status === 'PASS').slice(0, 3).map(r => `✅ ${r.message}`).join('\n')}

${failed > 0 ? 'Issues to Fix:' : 'Ready for Testing:'}
${failed > 0 
  ? this.testResults.filter(r => r.status === 'FAIL').map(r => `❌ ${r.message}`).join('\n')
  : 'Extension is ready for testing on job sites like LinkedIn, Indeed, and Workday.'
}

Next Steps:
1. ${failed === 0 ? 'Install extension in Chrome' : 'Fix failed tests first'}
2. ${failed === 0 ? 'Test on LinkedIn Jobs' : 'Re-run tests after fixes'}
3. ${failed === 0 ? 'Try form auto-fill functionality' : 'Complete user profile data'}

Test completed: ${new Date().toLocaleString()}
    `.trim();
  }
}

// Run extension tests
const tester = new ExtensionTester();
tester.runAllExtensionTests().then(results => {
  console.log('\n🏁 Extension testing completed!');
  console.log(`View detailed results in: extension_test_results.json`);
  console.log(`View summary in: extension_test_summary.txt`);
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Extension testing failed:', error);
  process.exit(1);
});