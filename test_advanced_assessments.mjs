
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test data
const testCandidate = {
  email: 'candidate@test.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Candidate',
  userType: 'job_seeker'
};

const testRecruiter = {
  email: 'recruiter@company.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Recruiter',
  userType: 'recruiter',
  companyName: 'Test Company'
};

let candidateAuth = null;
let recruiterAuth = null;
let testJobId = null;

async function makeRequest(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  return response.json();
}

async function login(credentials) {
  const response = await fetch(`${BASE_URL}/api/auth/quick-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credentials.email }),
  });
  
  if (!response.ok) {
    // Try to create user first
    await makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Then login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email }),
    });
    
    return loginResponse.json();
  }
  
  return response.json();
}

async function testVideoInterview() {
  console.log('\n🎥 Testing Video Interview System...');
  
  try {
    // Create video interview
    const videoInterview = await makeRequest('/api/video-interviews/create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${recruiterAuth.token}` },
      body: JSON.stringify({
        candidateId: candidateAuth.user.id,
        jobId: testJobId,
        questions: [
          {
            id: 'q1',
            question: 'Tell me about yourself',
            type: 'behavioral',
            timeLimit: 120,
            preparationTime: 30,
            retakesAllowed: 1,
            difficulty: 'easy'
          },
          {
            id: 'q2',
            question: 'Describe a challenging project you worked on',
            type: 'behavioral',
            timeLimit: 180,
            preparationTime: 30,
            retakesAllowed: 1,
            difficulty: 'medium'
          }
        ],
        totalTimeLimit: 300,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }),
    });
    
    console.log('✅ Video interview created:', videoInterview.id);
    
    // Simulate video response upload
    const mockVideoData = Buffer.from('mock-video-data').toString('base64');
    const uploadResult = await makeRequest(`/api/video-interviews/${videoInterview.id}/upload-response`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${candidateAuth.token}` },
      body: JSON.stringify({
        questionId: 'q1',
        videoFile: mockVideoData,
        metadata: {
          duration: 90,
          attempts: 1,
          deviceInfo: { browser: 'chrome', os: 'windows' }
        }
      }),
    });
    
    console.log('✅ Video response uploaded:', uploadResult.fileName);
    
    // Test video analysis
    const analysis = await makeRequest(`/api/video-interviews/responses/1/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${recruiterAuth.token}` },
      body: JSON.stringify({
        question: 'Tell me about yourself'
      }),
    });
    
    console.log('✅ Video analysis completed, score:', analysis.overallScore);
    
    return { success: true, interviewId: videoInterview.id };
  } catch (error) {
    console.error('❌ Video interview test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSimulationAssessment() {
  console.log('\n🎯 Testing Simulation Assessment System...');
  
  try {
    // Create simulation assessment
    const simulation = await makeRequest('/api/simulation-assessments/create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${recruiterAuth.token}` },
      body: JSON.stringify({
        candidateId: candidateAuth.user.id,
        jobId: testJobId,
        scenarioType: 'customer_service',
        difficulty: 'medium'
      }),
    });
    
    console.log('✅ Simulation assessment created:', simulation.id);
    
    // Start simulation
    const sessionResult = await makeRequest(`/api/simulation-assessments/${simulation.id}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${candidateAuth.token}` },
    });
    
    console.log('✅ Simulation started, session ID:', sessionResult.sessionId);
    
    // Record some actions
    await makeRequest(`/api/simulation-assessments/${sessionResult.sessionId}/action`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${candidateAuth.token}` },
      body: JSON.stringify({
        action: 'respond_to_customer',
        data: { response: 'Thank you for contacting us. How can I help you today?' },
        timestamp: Date.now()
      }),
    });
    
    // Complete simulation
    const result = await makeRequest(`/api/simulation-assessments/${sessionResult.sessionId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${candidateAuth.token}` },
    });
    
    console.log('✅ Simulation completed, score:', result.score);
    
    return { success: true, assessmentId: simulation.id };
  } catch (error) {
    console.error('❌ Simulation assessment test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testPersonalityAssessment() {
  console.log('\n🧠 Testing Personality Assessment System...');
  
  try {
    // Create personality assessment
    const assessment = await makeRequest('/api/personality-assessments/create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${recruiterAuth.token}` },
      body: JSON.stringify({
        candidateId: candidateAuth.user.id,
        jobId: testJobId,
        config: {
          assessmentType: 'big_five',
          timeLimit: 30
        }
      }),
    });
    
    console.log('✅ Personality assessment created:', assessment.id);
    
    // Submit responses
    const mockResponses = [
      { questionId: 1, answer: 4 },
      { questionId: 2, answer: 3 },
      { questionId: 3, answer: 5 },
      { questionId: 4, answer: 2 },
      { questionId: 5, answer: 4 }
    ];
    
    const profile = await makeRequest(`/api/personality-assessments/${assessment.id}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${candidateAuth.token}` },
      body: JSON.stringify({
        responses: mockResponses
      }),
    });
    
    console.log('✅ Personality profile generated:', profile.personalityType);
    
    return { success: true, assessmentId: assessment.id };
  } catch (error) {
    console.error('❌ Personality assessment test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSkillsVerification() {
  console.log('\n💻 Testing Skills Verification System...');
  
  try {
    // Create skills verification
    const verification = await makeRequest('/api/skills-verifications/create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${recruiterAuth.token}` },
      body: JSON.stringify({
        candidateId: candidateAuth.user.id,
        jobId: testJobId,
        projectTemplateId: 'react_todo_app',
        customizations: {
          requirements: ['React', 'TypeScript', 'CSS'],
          timeLimit: 240 // 4 hours
        }
      }),
    });
    
    console.log('✅ Skills verification created:', verification.id);
    
    // Submit project
    const mockSubmissions = {
      codeFiles: [
        { filename: 'App.tsx', content: 'import React from "react";\n\nfunction App() {\n  return <div>Todo App</div>;\n}\n\nexport default App;' },
        { filename: 'Todo.tsx', content: 'import React from "react";\n\ninterface TodoProps {\n  text: string;\n}\n\nfunction Todo({ text }: TodoProps) {\n  return <li>{text}</li>;\n}\n\nexport default Todo;' }
      ],
      documentation: 'This is a simple Todo application built with React and TypeScript.',
      liveDemo: 'https://example.com/demo',
      testResults: 'All tests passed'
    };
    
    const result = await makeRequest(`/api/skills-verifications/${verification.id}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${candidateAuth.token}` },
      body: JSON.stringify({
        submissions: mockSubmissions
      }),
    });
    
    console.log('✅ Skills verification completed, score:', result.score);
    
    return { success: true, verificationId: verification.id };
  } catch (error) {
    console.error('❌ Skills verification test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAIDetection() {
  console.log('\n🤖 Testing AI Detection System...');
  
  try {
    // Test with human-like response
    const humanResponse = "I've been working as a software developer for about 3 years now. Started right after college with a small startup where I learned the basics of web development. The team was really supportive and I got to work on various projects from frontend to backend stuff.";
    
    const humanDetection = await makeRequest('/api/ai-detection/analyze', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${recruiterAuth.token}` },
      body: JSON.stringify({
        userResponse: humanResponse,
        questionContext: 'Tell me about your work experience',
        behavioralData: {
          typingSpeed: 45,
          pausePatterns: [2000, 1500, 3000],
          corrections: 3
        }
      }),
    });
    
    console.log('✅ Human response analysis:', {
      isAI: humanDetection.isAIGenerated,
      confidence: humanDetection.confidence,
      humanScore: humanDetection.humanScore
    });
    
    // Test with AI-like response
    const aiResponse = "As a highly motivated and results-driven software developer with extensive experience in full-stack development, I have successfully delivered numerous projects utilizing cutting-edge technologies. My expertise encompasses frontend frameworks such as React and Angular, backend technologies including Node.js and Python, and database management systems like MySQL and MongoDB. Furthermore, I have demonstrated exceptional problem-solving abilities and collaborative skills throughout my professional journey.";
    
    const aiDetection = await makeRequest('/api/ai-detection/analyze', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${recruiterAuth.token}` },
      body: JSON.stringify({
        userResponse: aiResponse,
        questionContext: 'Tell me about your technical skills',
        behavioralData: {
          typingSpeed: 120,
          pausePatterns: [500, 300, 200],
          corrections: 0
        }
      }),
    });
    
    console.log('✅ AI response analysis:', {
      isAI: aiDetection.isAIGenerated,
      confidence: aiDetection.confidence,
      humanScore: aiDetection.humanScore
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ AI detection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function createTestJob() {
  console.log('\n📋 Creating test job...');
  
  try {
    const job = await makeRequest('/api/jobs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${recruiterAuth.token}` },
      body: JSON.stringify({
        title: 'Senior Software Engineer',
        description: 'We are looking for a senior software engineer to join our team.',
        companyName: 'Test Company',
        location: 'Remote',
        workMode: 'remote',
        jobType: 'full-time',
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        minSalary: 80000,
        maxSalary: 120000
      }),
    });
    
    testJobId = job.id;
    console.log('✅ Test job created:', testJobId);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test job:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 Starting Advanced Assessment System Test Suite\n');
  
  try {
    // Login users
    console.log('🔑 Authenticating test users...');
    candidateAuth = await login(testCandidate);
    recruiterAuth = await login(testRecruiter);
    console.log('✅ Users authenticated');
    
    // Create test job
    const jobCreated = await createTestJob();
    if (!jobCreated) {
      throw new Error('Failed to create test job');
    }
    
    // Run all tests
    const results = {
      videoInterview: await testVideoInterview(),
      simulationAssessment: await testSimulationAssessment(),
      personalityAssessment: await testPersonalityAssessment(),
      skillsVerification: await testSkillsVerification(),
      aiDetection: await testAIDetection()
    };
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('==================');
    
    let passedTests = 0;
    let totalTests = 0;
    
    Object.entries(results).forEach(([testName, result]) => {
      totalTests++;
      if (result.success) {
        passedTests++;
        console.log(`✅ ${testName}: PASSED`);
      } else {
        console.log(`❌ ${testName}: FAILED - ${result.error}`);
      }
    });
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All advanced assessment systems are working correctly!');
    } else {
      console.log('⚠️  Some systems need attention. Check the errors above.');
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// Run the test
runFullTest();
