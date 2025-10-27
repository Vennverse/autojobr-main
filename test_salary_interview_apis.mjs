
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

const TEST_CREDENTIALS = {
  email: 'shubhamdubexskd2001@gmail.com',
  password: '12345678'
};

let sessionCookie = '';

async function login() {
  console.log('\n🔐 Logging in...\n');
  try {
    const response = await fetch(`${API_BASE}/api/auth/email/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      sessionCookie = setCookieHeader.split(';')[0];
      console.log('✅ Login successful!\n');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testSalaryInsights() {
  console.log('\n💰 Testing Salary Insights API...\n');
  try {
    const response = await fetch(`${API_BASE}/api/salary-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        jobTitle: 'AI Engineer',
        company: 'Google',
        location: 'Mountain View, CA',
        experienceLevel: 5,
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'LLM']
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Salary Insights Success!\n');
      console.log('📊 Salary Range:', data.salaryRange);
      console.log('💵 Total Compensation:', data.totalCompensation, data.currency);
      console.log('📈 Market Insights:', data.marketInsights);
      console.log('💡 Top Negotiation Tip:', data.negotiationTips[0]);
    } else {
      console.error('❌ Failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testInterviewPrep() {
  console.log('\n🎯 Testing Interview Prep API...\n');
  try {
    const response = await fetch(`${API_BASE}/api/interview-prep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        jobTitle: 'AI Engineer',
        company: 'Google',
        companyType: 'bigtech',
        experienceLevel: 'mid',
        location: 'us',
        difficulty: 'medium'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Interview Prep Success!\n');
      console.log('📚 Role Overview:', data.roleInsights.overview);
      console.log('🔑 Key Skills:', data.roleInsights.keySkills.slice(0, 3).join(', '));
      console.log('❓ Sample Question:', data.questions.technical[0]);
      console.log('💡 Top Tip:', data.tips.general[0]);
    } else {
      console.error('❌ Failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('═'.repeat(60));
  console.log('🧪 Testing Salary Insights & Interview Prep APIs');
  console.log('═'.repeat(60));

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Tests aborted - login failed');
    return;
  }

  await testSalaryInsights();
  await testInterviewPrep();

  console.log('\n✅ All tests completed!');
  console.log('═'.repeat(60));
}

runTests().catch(console.error);
