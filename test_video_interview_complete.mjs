
import fetch from 'node-fetch';

// Use environment variable or default to Replit's public URL
const API_BASE = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'http://0.0.0.0:5000';

// Performance tracking
const performanceMetrics = {
  apiCalls: [],
  totalTime: 0,
  successCount: 0,
  failureCount: 0
};

function logPerformance(endpoint, method, duration, status, success) {
  performanceMetrics.apiCalls.push({
    endpoint,
    method,
    duration: `${duration}ms`,
    status,
    success,
    timestamp: new Date().toISOString()
  });
  performanceMetrics.totalTime += duration;
  if (success) performanceMetrics.successCount++;
  else performanceMetrics.failureCount++;
}

async function apiCall(endpoint, method = 'GET', body = null, cookie = '') {
  const startTime = Date.now();
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const duration = Date.now() - startTime;
    const data = await response.json();
    
    const setCookieHeader = response.headers.get('set-cookie');
    const newCookie = setCookieHeader ? setCookieHeader.split(';')[0] : cookie;
    
    logPerformance(endpoint, method, duration, response.status, response.ok);
    
    return { 
      ok: response.ok, 
      status: response.status, 
      data, 
      cookie: newCookie,
      duration 
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logPerformance(endpoint, method, duration, 'ERROR', false);
    console.error(`❌ API Call Failed: ${method} ${endpoint}`, error.message);
    return { ok: false, error: error.message, duration };
  }
}

async function runVideoInterviewTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   VIDEO INTERVIEW COMPLETE SYSTEM TEST WITH PERFORMANCE   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let recruiterCookie = '';
  let jobSeekerCookie = '';
  let jobPostingId = null;
  let interviewId = null;
  let sessionId = null;

  // ============================================================
  // STEP 1: RECRUITER LOGIN
  // ============================================================
  console.log('\n📋 STEP 1: Recruiter Login');
  console.log('─'.repeat(60));
  
  const recruiterLogin = await apiCall('/api/auth/email/login', 'POST', {
    email: 'shubham.dubey@autojobr.com',
    password: '12345678'
  });

  if (!recruiterLogin.ok) {
    console.log('❌ Recruiter login failed:', recruiterLogin.data);
    return;
  }

  recruiterCookie = recruiterLogin.cookie;
  console.log('✅ Recruiter logged in successfully');
  console.log(`⏱️  Duration: ${recruiterLogin.duration}ms`);

  // ============================================================
  // STEP 2: CREATE JOB POSTING
  // ============================================================
  console.log('\n📋 STEP 2: Create Job Posting');
  console.log('─'.repeat(60));

  const jobPosting = await apiCall('/api/job-postings', 'POST', {
    title: 'Senior Software Engineer - Video Interview Test',
    description: 'Test job posting for video interview functionality',
    company: 'AutoJobr Test',
    location: 'Remote',
    jobType: 'full-time',
    experienceLevel: 'senior',
    salaryRange: '$120,000 - $180,000',
    skills: ['JavaScript', 'React', 'Node.js'],
    requirements: ['5+ years experience', 'Strong communication'],
    benefits: ['Health insurance', 'Remote work']
  }, recruiterCookie);

  if (!jobPosting.ok) {
    console.log('❌ Job posting creation failed:', jobPosting.data);
    return;
  }

  jobPostingId = jobPosting.data.id;
  console.log(`✅ Job posting created: ID ${jobPostingId}`);
  console.log(`⏱️  Duration: ${jobPosting.duration}ms`);

  // ============================================================
  // STEP 3: GET JOB SEEKER USER ID
  // ============================================================
  console.log('\n📋 STEP 3: Get Job Seeker User ID');
  console.log('─'.repeat(60));

  const candidatesList = await apiCall('/api/recruiter/candidates', 'GET', null, recruiterCookie);
  
  if (!candidatesList.ok) {
    console.log('❌ Failed to get candidates list');
    return;
  }

  const jobSeeker = candidatesList.data.find(c => c.email === 'shubhamdubexskd2001@gmail.com');
  
  if (!jobSeeker) {
    console.log('❌ Job seeker not found in candidates list');
    return;
  }

  const candidateId = jobSeeker.id;
  console.log(`✅ Job seeker found: ${jobSeeker.email} (ID: ${candidateId})`);
  console.log(`⏱️  Duration: ${candidatesList.duration}ms`);

  // ============================================================
  // STEP 4: ASSIGN VIDEO INTERVIEW
  // ============================================================
  console.log('\n📋 STEP 4: Assign Video Interview');
  console.log('─'.repeat(60));

  const assignInterview = await apiCall('/api/video-interview/assign', 'POST', {
    candidateId: candidateId,
    jobPostingId: jobPostingId,
    jobRole: 'Senior Software Engineer',
    company: 'AutoJobr',
    difficultyLevel: 'medium',
    totalQuestions: 3,
    questionsPerType: {
      behavioral: 1,
      technical: 1,
      situational: 1
    },
    timeLimitPerQuestion: 180, // 3 minutes per question
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  }, recruiterCookie);

  if (!assignInterview.ok) {
    console.log('❌ Video interview assignment failed:', assignInterview.data);
    return;
  }

  interviewId = assignInterview.data.interviewId;
  sessionId = assignInterview.data.sessionId;
  console.log(`✅ Video interview assigned: ID ${interviewId}`);
  console.log(`📧 Session ID: ${sessionId}`);
  console.log(`⏱️  Duration: ${assignInterview.duration}ms`);

  // ============================================================
  // STEP 5: JOB SEEKER LOGIN
  // ============================================================
  console.log('\n📋 STEP 5: Job Seeker Login');
  console.log('─'.repeat(60));

  const jobSeekerLogin = await apiCall('/api/auth/email/login', 'POST', {
    email: 'shubhamdubexskd2001@gmail.com',
    password: '12345678'
  });

  if (!jobSeekerLogin.ok) {
    console.log('❌ Job seeker login failed:', jobSeekerLogin.data);
    return;
  }

  jobSeekerCookie = jobSeekerLogin.cookie;
  console.log('✅ Job seeker logged in successfully');
  console.log(`⏱️  Duration: ${jobSeekerLogin.duration}ms`);

  // ============================================================
  // STEP 6: GET ASSIGNED INTERVIEWS
  // ============================================================
  console.log('\n📋 STEP 6: Get Assigned Interviews');
  console.log('─'.repeat(60));

  const assignedInterviews = await apiCall('/api/interview-assignments/assigned', 'GET', null, jobSeekerCookie);

  if (!assignedInterviews.ok) {
    console.log('❌ Failed to get assigned interviews');
    return;
  }

  console.log(`✅ Found ${assignedInterviews.data.length} assigned interview(s)`);
  console.log(`⏱️  Duration: ${assignedInterviews.duration}ms`);

  // ============================================================
  // STEP 7: START VIDEO INTERVIEW
  // ============================================================
  console.log('\n📋 STEP 7: Start Video Interview');
  console.log('─'.repeat(60));

  const startInterview = await apiCall(`/api/video-interview/${sessionId}/start`, 'POST', {}, jobSeekerCookie);

  if (!startInterview.ok) {
    console.log('❌ Failed to start video interview:', startInterview.data);
    return;
  }

  console.log('✅ Video interview started');
  console.log(`⏱️  Duration: ${startInterview.duration}ms`);

  // ============================================================
  // STEP 8: GET INTERVIEW QUESTIONS
  // ============================================================
  console.log('\n📋 STEP 8: Get Interview Questions');
  console.log('─'.repeat(60));

  const getQuestions = await apiCall(`/api/video-interview/${sessionId}/questions`, 'GET', null, jobSeekerCookie);

  if (!getQuestions.ok) {
    console.log('❌ Failed to get questions:', getQuestions.data);
    return;
  }

  const questions = getQuestions.data.questions;
  console.log(`✅ Retrieved ${questions.length} questions`);
  console.log(`⏱️  Duration: ${getQuestions.duration}ms`);

  questions.forEach((q, i) => {
    console.log(`\n   Question ${i + 1} (${q.type}):`);
    console.log(`   ${q.question}`);
    console.log(`   Time Limit: ${q.timeLimit}s`);
  });

  // ============================================================
  // STEP 9: SUBMIT VIDEO RESPONSES
  // ============================================================
  console.log('\n📋 STEP 9: Submit Video Responses for Each Question');
  console.log('─'.repeat(60));

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`\n   Submitting response for Question ${i + 1}...`);

    // Simulate video upload with mock data
    const mockVideoData = {
      questionId: question.id,
      duration: 120, // 2 minutes
      attempts: 1,
      recordingQuality: 'high',
      videoBlob: 'mock_video_base64_data_' + Math.random().toString(36),
      deviceInfo: {
        browser: 'Chrome',
        os: 'Windows',
        camera: 'HD WebCam'
      }
    };

    const submitResponse = await apiCall(
      `/api/video-interview/${sessionId}/submit-response`, 
      'POST', 
      mockVideoData, 
      jobSeekerCookie
    );

    if (!submitResponse.ok) {
      console.log(`   ❌ Failed to submit response for question ${i + 1}:`, submitResponse.data);
      continue;
    }

    console.log(`   ✅ Response submitted for Question ${i + 1}`);
    console.log(`   ⏱️  Duration: ${submitResponse.duration}ms`);
  }

  // ============================================================
  // STEP 10: COMPLETE VIDEO INTERVIEW
  // ============================================================
  console.log('\n📋 STEP 10: Complete Video Interview');
  console.log('─'.repeat(60));

  const completeInterview = await apiCall(
    `/api/video-interview/${sessionId}/complete`, 
    'POST', 
    {}, 
    jobSeekerCookie
  );

  if (!completeInterview.ok) {
    console.log('❌ Failed to complete interview:', completeInterview.data);
    return;
  }

  console.log('✅ Video interview completed successfully');
  console.log(`⏱️  Duration: ${completeInterview.duration}ms`);

  // ============================================================
  // STEP 11: GET VIDEO INTERVIEW RESULTS
  // ============================================================
  console.log('\n📋 STEP 11: Get Video Interview Results');
  console.log('─'.repeat(60));

  const getResults = await apiCall(`/api/video-interview/${sessionId}/results`, 'GET', null, jobSeekerCookie);

  if (!getResults.ok) {
    console.log('❌ Failed to get results:', getResults.data);
  } else {
    console.log('✅ Video interview results retrieved');
    console.log(`⏱️  Duration: ${getResults.duration}ms`);
    console.log('\n📊 Interview Results:');
    console.log(`   Overall Score: ${getResults.data.overallScore}%`);
    console.log(`   Status: ${getResults.data.status}`);
  }

  // ============================================================
  // STEP 12: RECRUITER VIEWS RESULTS
  // ============================================================
  console.log('\n📋 STEP 12: Recruiter Views Interview Results');
  console.log('─'.repeat(60));

  const recruiterResults = await apiCall(
    `/api/video-interview/${interviewId}/recruiter-results`, 
    'GET', 
    null, 
    recruiterCookie
  );

  if (!recruiterResults.ok) {
    console.log('❌ Failed to get recruiter results:', recruiterResults.data);
  } else {
    console.log('✅ Recruiter results retrieved');
    console.log(`⏱️  Duration: ${recruiterResults.duration}ms`);
  }

  // ============================================================
  // PERFORMANCE SUMMARY
  // ============================================================
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    PERFORMANCE SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 Total API Calls: ${performanceMetrics.apiCalls.length}`);
  console.log(`✅ Successful: ${performanceMetrics.successCount}`);
  console.log(`❌ Failed: ${performanceMetrics.failureCount}`);
  console.log(`⏱️  Total Time: ${performanceMetrics.totalTime}ms`);
  console.log(`⚡ Average Time: ${Math.round(performanceMetrics.totalTime / performanceMetrics.apiCalls.length)}ms per call\n`);

  console.log('📋 Detailed API Performance:');
  console.log('─'.repeat(80));
  performanceMetrics.apiCalls.forEach((call, i) => {
    const status = call.success ? '✅' : '❌';
    console.log(`${i + 1}. ${status} ${call.method.padEnd(6)} ${call.endpoint.padEnd(40)} ${call.duration.padEnd(8)} [${call.status}]`);
  });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST COMPLETE                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run the test
runVideoInterviewTest().catch(console.error);
