import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';
const TEST_EMAIL = 'shubhamdubexskd2001@gmail.com';
const TEST_PASSWORD = '12345678';

let sessionCookie = '';

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  log('\n🔐 Testing Login...', 'blue');
  
  try {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        provider: 'credentials',
        email: TEST_EMAIL, 
        password: TEST_PASSWORD 
      })
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
      log(`✅ Login successful! Session: ${sessionCookie.substring(0, 30)}...`, 'green');
      const data = await response.json().catch(() => ({}));
      if (data.user) {
        log(`   User: ${data.user.email} (${data.user.userType})`);
      }
      return true;
    } else {
      const data = await response.json().catch(() => ({ message: 'Unknown error' }));
      log(`❌ Login failed (${response.status}): ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Login error: ${error.message}`, 'red');
    return false;
  }
}

async function testAPI(name, endpoint, method = 'GET', body = null) {
  log(`\n🧪 Testing: ${name}`, 'blue');
  log(`   ${method} ${endpoint}`);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      log(`✅ ${name} - Status: ${response.status}`, 'green');
      log(`   Response: ${JSON.stringify(data).substring(0, 150)}...`);
      return { success: true, data };
    } else {
      log(`⚠️  ${name} - Status: ${response.status}`, 'yellow');
      log(`   Response: ${JSON.stringify(data)}`, 'yellow');
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    log(`❌ ${name} - Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n=== EXTENSION API COMPREHENSIVE TEST ===\n', 'blue');

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without successful login', 'red');
    return;
  }

  // Test all extension APIs
  const tests = [
    // Health check
    { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
    
    // User APIs
    { name: 'Get User Profile', endpoint: '/api/user', method: 'GET' },
    { name: 'Get Extension Profile', endpoint: '/api/extension/profile', method: 'GET' },
    
    // Job Analysis
    { 
      name: 'Analyze Job Match', 
      endpoint: '/api/analyze-job-match', 
      method: 'POST',
      body: {
        jobData: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'Remote',
          description: 'Looking for a software engineer with JavaScript, React, Node.js experience',
          requiredSkills: ['JavaScript', 'React', 'Node.js']
        }
      }
    },
    
    // Interview Prep
    {
      name: 'Interview Prep',
      endpoint: '/api/interview-prep',
      method: 'POST',
      body: {
        jobData: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          jobDescription: 'Full stack development role'
        }
      }
    },
    
    // Salary Insights
    {
      name: 'Salary Insights',
      endpoint: '/api/salary-insights',
      method: 'POST',
      body: {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco'
      }
    },
    
    // Cover Letter
    {
      name: 'Cover Letter Usage Check',
      endpoint: '/api/cover-letter/usage-check',
      method: 'GET'
    },
    {
      name: 'Generate Cover Letter',
      endpoint: '/api/generate-cover-letter',
      method: 'POST',
      body: {
        jobTitle: 'Software Engineer',
        companyName: 'Tech Corp',
        jobDescription: 'We are looking for a talented software engineer to join our team.'
      }
    },
    
    // Saved Jobs
    { name: 'Get Saved Jobs', endpoint: '/api/saved-jobs', method: 'GET' },
    {
      name: 'Save Job',
      endpoint: '/api/saved-jobs',
      method: 'POST',
      body: {
        jobData: {
          title: 'Senior Developer',
          company: 'StartUp Inc',
          url: 'https://example.com/job/123',
          location: 'New York',
          salary: '$120k-150k',
          description: 'Exciting opportunity'
        }
      }
    },
    
    // Tasks
    { name: 'Get Tasks', endpoint: '/api/tasks?limit=5&status=pending', method: 'GET' },
    {
      name: 'Create Task',
      endpoint: '/api/tasks',
      method: 'POST',
      body: {
        title: 'Follow up with recruiter',
        description: 'Send thank you email',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000).toISOString()
      }
    },
    
    // Resumes
    { name: 'Get Resumes', endpoint: '/api/resumes', method: 'GET' },
    { name: 'Get Active Resume', endpoint: '/api/resumes/active', method: 'GET' },
    
    // Reminders
    { name: 'Get Pending Reminders', endpoint: '/api/reminders/pending', method: 'GET' },
    
    // Job Suggestions
    {
      name: 'Get Job Suggestions',
      endpoint: '/api/job-suggestions',
      method: 'POST',
      body: {
        preferences: {
          workMode: 'remote',
          location: 'San Francisco'
        }
      }
    },
    
    // User Preferences
    {
      name: 'Update User Preferences',
      endpoint: '/api/user/preferences',
      method: 'POST',
      body: {
        workMode: 'remote',
        willingToRelocate: false,
        salaryMin: 100000,
        salaryMax: 150000
      }
    },
    
    // Application Tracking
    {
      name: 'Track Application',
      endpoint: '/api/extension/applications',
      method: 'POST',
      body: {
        jobUrl: 'https://example.com/job/456',
        applicationData: {
          title: 'Frontend Developer',
          company: 'Web Company',
          location: 'Remote'
        }
      }
    },
    
    // Applications List
    { name: 'Get Applications', endpoint: '/api/applications', method: 'GET' }
  ];

  let passedTests = 0;
  let failedTests = 0;
  let warningTests = 0;

  for (const test of tests) {
    const result = await testAPI(test.name, test.endpoint, test.method, test.body);
    
    if (result.success) {
      passedTests++;
    } else if (result.status === 404 || result.status === 400) {
      warningTests++;
    } else {
      failedTests++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  log('\n=== TEST SUMMARY ===', 'blue');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`⚠️  Warnings: ${warningTests}`, 'yellow');
  log(`❌ Failed: ${failedTests}`, 'red');
  log(`📊 Total: ${tests.length}`);

  if (failedTests === 0 && warningTests === 0) {
    log('\n🎉 All extension APIs are working perfectly!', 'green');
  } else if (failedTests === 0) {
    log('\n✅ All critical APIs working. Some endpoints need data setup.', 'green');
  } else {
    log('\n⚠️  Some APIs need attention!', 'yellow');
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
});
