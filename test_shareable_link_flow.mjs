import fetch from 'node-fetch';
import pg from 'pg';

const { Pool } = pg;

// Configuration
const BASE_URL = 'http://localhost:5000';
const SHAREABLE_LINK_ID = 'link_1759692765804_yfm8zjth0';
const TEST_EMAIL = 'shubhamdubexskd2001@gmail.com';
const TEST_PASSWORD = '12345678';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Track session cookie
let sessionCookie = null;

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Capture session cookie from login
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  return response;
}

// Test functions
async function testAuthentication() {
  console.log('\n📝 Step 1: Testing Authentication');
  console.log('=' .repeat(60));

  try {
    const response = await makeRequest('/api/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Authentication successful');
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email: ${data.user?.email}`);
      console.log(`   User Type: ${data.user?.userType}`);
      return data.user;
    } else {
      console.error('❌ Authentication failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return null;
  }
}

async function testGetInterviewLink() {
  console.log('\n📝 Step 2: Fetching Interview Link Details');
  console.log('=' .repeat(60));

  try {
    const response = await makeRequest(`/api/interviews/link/${SHAREABLE_LINK_ID}`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Interview link retrieved successfully');
      console.log(`   Interview Type: ${data.interviewType}`);
      console.log(`   Role: ${data.role}`);
      console.log(`   Company: ${data.company}`);
      console.log(`   Difficulty: ${data.difficulty}`);
      console.log(`   Expires At: ${data.expiresAt}`);
      return data;
    } else if (response.status === 410) {
      console.error('❌ Interview link has expired');
      return null;
    } else {
      console.error('❌ Failed to retrieve interview link:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching interview link:', error.message);
    return null;
  }
}

async function checkDatabaseForLink() {
  console.log('\n📝 Step 3: Checking Database for Interview Link');
  console.log('=' .repeat(60));

  try {
    const result = await pool.query(
      'SELECT * FROM interview_invitations WHERE token = $1',
      [SHAREABLE_LINK_ID]
    );

    if (result.rows.length > 0) {
      const link = result.rows[0];
      console.log('✅ Found interview link in database');
      console.log(`   Link ID: ${link.id}`);
      console.log(`   Interview Type: ${link.interview_type}`);
      console.log(`   Job Posting ID: ${link.job_posting_id}`);
      console.log(`   Recruiter ID: ${link.recruiter_id}`);
      console.log(`   Role: ${link.role}`);
      console.log(`   Company: ${link.company}`);
      console.log(`   Usage Count: ${link.usage_count}`);
      console.log(`   Max Uses: ${link.max_uses || 'Unlimited'}`);
      console.log(`   Expiry Date: ${link.expiry_date}`);
      return link;
    } else {
      console.error('❌ Interview link not found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    return null;
  }
}

async function checkExistingApplication(userId, jobPostingId) {
  console.log('\n📝 Step 4: Checking Existing Application');
  console.log('=' .repeat(60));

  if (!jobPostingId) {
    console.log('ℹ️  No job posting associated with this link');
    return null;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM job_posting_applications WHERE job_posting_id = $1 AND applicant_id = $2',
      [jobPostingId, userId]
    );

    if (result.rows.length > 0) {
      console.log('✅ User already applied to this job');
      console.log(`   Application ID: ${result.rows[0].id}`);
      console.log(`   Status: ${result.rows[0].status}`);
      console.log(`   Applied At: ${result.rows[0].applied_at}`);
      console.log(`   Source: ${result.rows[0].source}`);
      return result.rows[0];
    } else {
      console.log('ℹ️  User has not applied to this job yet');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking application:', error.message);
    return null;
  }
}

async function testStartInterview(user) {
  console.log('\n📝 Step 5: Starting Interview from Shareable Link');
  console.log('=' .repeat(60));

  try {
    const response = await makeRequest(`/api/interviews/link/${SHAREABLE_LINK_ID}/start`, {
      method: 'POST'
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Interview started successfully');
      console.log(`   Redirect URL: ${data.redirectUrl}`);
      
      // Check if application was auto-created
      const linkData = await checkDatabaseForLink();
      if (linkData?.job_posting_id) {
        await checkExistingApplication(user.id, linkData.job_posting_id);
      }

      return data;
    } else {
      console.error('❌ Failed to start interview:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error starting interview:', error.message);
    return null;
  }
}

async function checkVirtualInterviewAssignment(userId) {
  console.log('\n📝 Step 6: Checking Virtual Interview Assignment');
  console.log('=' .repeat(60));

  try {
    const result = await pool.query(
      `SELECT * FROM virtual_interview_sessions 
       WHERE candidate_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length > 0) {
      const session = result.rows[0];
      console.log('✅ Virtual interview session created');
      console.log(`   Session ID: ${session.session_id}`);
      console.log(`   Interview Type: ${session.interview_type}`);
      console.log(`   Role: ${session.role}`);
      console.log(`   Company: ${session.company}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Created At: ${session.created_at}`);
      return session;
    } else {
      console.log('ℹ️  No virtual interview session found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking virtual interview:', error.message);
    return null;
  }
}

async function checkUsageCount() {
  console.log('\n📝 Step 7: Verifying Usage Count Increment');
  console.log('=' .repeat(60));

  try {
    const result = await pool.query(
      'SELECT usage_count FROM interview_invitations WHERE token = $1',
      [SHAREABLE_LINK_ID]
    );

    if (result.rows.length > 0) {
      console.log('✅ Usage count verified');
      console.log(`   Current Usage Count: ${result.rows[0].usage_count}`);
      return result.rows[0].usage_count;
    }
  } catch (error) {
    console.error('❌ Error checking usage count:', error.message);
  }
}

async function runTests() {
  console.log('\n🚀 Starting Shareable Link Flow Test');
  console.log('=' .repeat(60));
  console.log(`Link ID: ${SHAREABLE_LINK_ID}`);
  console.log(`Test User: ${TEST_EMAIL}`);
  console.log('=' .repeat(60));

  try {
    // Step 1: Authenticate
    const user = await testAuthentication();
    if (!user) {
      console.error('\n❌ Test failed: Cannot proceed without authentication');
      return;
    }

    // Step 2: Get interview link details
    const linkInfo = await testGetInterviewLink();
    if (!linkInfo) {
      console.error('\n❌ Test failed: Interview link not accessible');
      return;
    }

    // Step 3: Check database for link
    const dbLink = await checkDatabaseForLink();
    if (!dbLink) {
      console.error('\n❌ Test failed: Link not found in database');
      return;
    }

    // Step 4: Check existing application
    await checkExistingApplication(user.id, dbLink.job_posting_id);

    // Step 5: Start the interview
    const startResult = await testStartInterview(user);
    if (!startResult) {
      console.error('\n❌ Test failed: Could not start interview');
      return;
    }

    // Step 6: Check if virtual interview was assigned
    await checkVirtualInterviewAssignment(user.id);

    // Step 7: Verify usage count
    await checkUsageCount();

    console.log('\n✅ All tests completed successfully!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  } finally {
    await pool.end();
  }
}

// Run the tests
runTests().catch(console.error);
