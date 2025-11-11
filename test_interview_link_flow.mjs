
```javascript
#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'https://autojobr.com';
const TEST_EMAIL = 'shubhamdubexskd2001@gmail.com';
const TEST_PASSWORD = '12345678';
const INTERVIEW_LINK = 'https://autojobr.com/interview-link/link_1759692765804_yfm8zjth0';

let sessionCookie = '';

async function makeRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie,
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  return response;
}

async function login() {
  console.log('🔐 Logging in...');
  const response = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Login successful:', data.user?.email);
    return true;
  } else {
    const error = await response.text();
    console.error('❌ Login failed:', error);
    return false;
  }
}

async function checkInterviewLink() {
  console.log('\n📋 Checking interview link details...');
  const linkId = INTERVIEW_LINK.split('/').pop();
  
  const response = await makeRequest(`/api/interviews/link/${linkId}`, {
    method: 'GET'
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Interview link found:');
    console.log('   - Type:', data.interviewType);
    console.log('   - Job Posting ID:', data.jobPostingId);
    console.log('   - Recruiter ID:', data.recruiterId);
    console.log('   - Expires:', data.expiresAt);
    return data;
  } else {
    const error = await response.text();
    console.error('❌ Failed to fetch link:', error);
    return null;
  }
}

async function checkExistingApplication(jobPostingId) {
  console.log('\n🔍 Checking existing applications...');
  const response = await makeRequest('/api/jobseeker/applications', {
    method: 'GET'
  });

  if (response.ok) {
    const applications = await response.json();
    const existing = applications.find((app: any) => app.jobPostingId === jobPostingId);
    
    if (existing) {
      console.log('✅ Already applied to this job:', existing.id);
      return true;
    } else {
      console.log('ℹ️  Not yet applied to this job');
      return false;
    }
  } else {
    console.error('❌ Failed to check applications');
    return false;
  }
}

async function startInterviewFromLink() {
  console.log('\n🚀 Starting interview from link...');
  const linkId = INTERVIEW_LINK.split('/').pop();
  
  const response = await makeRequest(`/api/interviews/link/${linkId}/start`, {
    method: 'POST'
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Interview started successfully!');
    console.log('   - Redirect URL:', data.redirectUrl);
    return data;
  } else {
    const error = await response.text();
    console.error('❌ Failed to start interview:', error);
    return null;
  }
}

async function verifyAutoApply(jobPostingId) {
  console.log('\n✅ Verifying auto-apply...');
  const response = await makeRequest('/api/jobseeker/applications', {
    method: 'GET'
  });

  if (response.ok) {
    const applications = await response.json();
    const newApplication = applications.find((app: any) => 
      app.jobPostingId === jobPostingId && app.source === 'interview_link'
    );
    
    if (newApplication) {
      console.log('✅ Auto-apply successful!');
      console.log('   - Application ID:', newApplication.id);
      console.log('   - Status:', newApplication.status);
      console.log('   - Source:', newApplication.source);
      return true;
    } else {
      console.log('❌ Auto-apply did not work');
      return false;
    }
  } else {
    console.error('❌ Failed to verify applications');
    return false;
  }
}

async function checkDatabaseForAssignment(redirectUrl) {
  console.log('\n🗄️  Checking database for assignment...');
  
  // Extract session ID or assignment ID from redirect URL
  const sessionMatch = redirectUrl.match(/\/(chat-interview|mock-interview|test)\/([^?]+)/);
  if (sessionMatch) {
    const type = sessionMatch[1];
    const id = sessionMatch[2];
    console.log(`✅ Assignment created: ${type} with ID ${id}`);
    return true;
  } else {
    console.log('⚠️  Could not extract assignment ID from redirect URL');
    return false;
  }
}

async function runTest() {
  console.log('═'.repeat(60));
  console.log('🧪 Interview Link Flow Test');
  console.log('═'.repeat(60));
  console.log(`📧 User: ${TEST_EMAIL}`);
  console.log(`🔗 Link: ${INTERVIEW_LINK}`);
  console.log('═'.repeat(60));

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Test aborted - login failed');
    return;
  }

  // Step 2: Check interview link
  const linkData = await checkInterviewLink();
  if (!linkData) {
    console.log('\n❌ Test aborted - invalid link');
    return;
  }

  // Step 3: Check existing application
  if (linkData.jobPostingId) {
    await checkExistingApplication(linkData.jobPostingId);
  }

  // Step 4: Start interview from link (triggers auto-apply)
  const startResult = await startInterviewFromLink();
  if (!startResult) {
    console.log('\n❌ Test aborted - failed to start interview');
    return;
  }

  // Step 5: Verify auto-apply worked
  if (linkData.jobPostingId) {
    await verifyAutoApply(linkData.jobPostingId);
  }

  // Step 6: Check database assignment
  await checkDatabaseForAssignment(startResult.redirectUrl);

  console.log('\n═'.repeat(60));
  console.log('✅ Test completed!');
  console.log('═'.repeat(60));
}

runTest().catch(console.error);
```
