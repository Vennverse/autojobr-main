#!/usr/bin/env node

// Test script for job match analysis API
const API_BASE_URL = 'http://localhost:5000';

// Mock job data for testing
const testJobData = {
  title: 'Senior Software Developer',
  company: 'TechCorp Inc',
  description: `
    We are looking for a Senior Software Developer to join our team.
    
    Requirements:
    - 3+ years of experience in JavaScript and React
    - Experience with Node.js and backend development
    - Knowledge of SQL databases
    - Python programming experience preferred
    - Team collaboration skills
    
    Responsibilities:
    - Develop web applications using React and Node.js
    - Work with APIs and database integration
    - Collaborate with cross-functional teams
  `,
  requirements: [
    'JavaScript', 'React', 'Node.js', 'SQL', 'Python', '3+ years experience'
  ]
};

// Mock user profile for testing
const testUserProfile = {
  professionalTitle: 'Software Developer',
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'MongoDB'],
  yearsExperience: 4,
  workExperience: [
    {
      company: 'Previous Corp',
      position: 'Frontend Developer',
      description: 'Developed React applications and worked with REST APIs'
    }
  ],
  education: [
    {
      degree: 'Bachelor of Computer Science',
      institution: 'University of Technology'
    }
  ]
};

async function testJobMatchAnalysis() {
  try {
    console.log('🔍 Testing job match analysis...');
    console.log('📊 Job:', testJobData.title, 'at', testJobData.company);
    console.log('👤 User:', testUserProfile.professionalTitle, 'with', testUserProfile.skills.length, 'skills');
    
    // Test without authentication first (should fail)
    console.log('\n1️⃣ Testing without authentication...');
    const unauthResponse = await fetch(`${API_BASE_URL}/api/analyze-job-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobData: testJobData,
        userProfile: testUserProfile
      })
    });
    
    if (unauthResponse.status === 401) {
      console.log('✅ Authentication check works - got 401 as expected');
    } else {
      console.log('❌ Expected 401 but got:', unauthResponse.status);
    }
    
    // Create a test user session for authenticated testing
    console.log('\n2️⃣ Creating test user session...');
    const authResponse = await fetch(`${API_BASE_URL}/api/auth/demo-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        userType: 'job_seeker'
      })
    });
    
    let sessionCookie = '';
    if (authResponse.ok) {
      // Extract session cookie
      const cookies = authResponse.headers.get('set-cookie');
      if (cookies) {
        sessionCookie = cookies.split(';')[0];
        console.log('✅ Demo session created');
      }
    }
    
    // Test with authentication
    console.log('\n3️⃣ Testing job match analysis with authentication...');
    const authHeaders = {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    };
    
    // Also test by adding some skills to the demo user
    console.log('🛠️ Adding skills to test user...');
    const skillsResponse = await fetch(`${API_BASE_URL}/api/profile/skills`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        skills: [
          { skillName: 'JavaScript', proficiencyLevel: 'Expert', yearsExperience: 4 },
          { skillName: 'React', proficiencyLevel: 'Expert', yearsExperience: 3 },
          { skillName: 'Node.js', proficiencyLevel: 'Intermediate', yearsExperience: 2 },
          { skillName: 'Python', proficiencyLevel: 'Intermediate', yearsExperience: 2 },
          { skillName: 'SQL', proficiencyLevel: 'Intermediate', yearsExperience: 3 }
        ]
      })
    });
    
    if (skillsResponse.ok) {
      console.log('✅ Skills added to user profile');
    } else {
      console.log('ℹ️ Could not add skills (endpoint may not exist), continuing with test...');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/analyze-job-match`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        jobData: testJobData,
        userProfile: testUserProfile
      })
    });
    
    if (!response.ok) {
      console.log('❌ Request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('\n📈 Analysis Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Match Score:', result.matchScore + '%');
    console.log('✨ Recommendation:', result.recommendation);
    console.log('📋 Factors Applied:');
    result.factors.forEach((factor, i) => {
      console.log(`   ${i + 1}. ${factor}`);
    });
    
    if (result.analysis) {
      console.log('\n🔍 Detailed Analysis:');
      console.log('   Strengths:', result.analysis.strengths.length);
      console.log('   Improvements:', result.analysis.improvements.length);
      console.log('   Summary:', result.analysis.summary);
    }
    
    if (result.userProfile) {
      console.log('\n👤 User Profile Used:');
      console.log('   Skills Count:', result.userProfile.skillsCount);
      console.log('   Professional Title:', result.userProfile.professionalTitle);
      console.log('   Years Experience:', result.userProfile.yearsExperience);
    }
    
    // Validate the fix
    if (result.matchScore > 0) {
      console.log('\n✅ SUCCESS: Job match analysis is working! Score > 0%');
    } else {
      console.log('\n❌ ISSUE: Still getting 0% match score');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testJobMatchAnalysis();