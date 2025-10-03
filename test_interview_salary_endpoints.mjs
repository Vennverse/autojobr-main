
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Test data
const testData = {
  jobPosting: {
    title: 'AI Engineer',
    company: 'Google',
    description: 'We are looking for an experienced AI Engineer to join our team. You will work on cutting-edge machine learning models, natural language processing, and computer vision projects. Strong Python skills and experience with TensorFlow/PyTorch required.',
    location: 'Mountain View, CA',
    requirements: [
      'MS/PhD in Computer Science or related field',
      '3+ years of experience in AI/ML',
      'Strong Python programming skills',
      'Experience with TensorFlow or PyTorch',
      'Knowledge of NLP and Computer Vision'
    ]
  },
  userProfile: {
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science'],
    experience: 5,
    location: 'San Francisco, CA'
  }
};

async function testInterviewPrep() {
  console.log('\n🎯 Testing /api/interview-prep endpoint...\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/interview-prep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobTitle: testData.jobPosting.title,
        company: testData.jobPosting.company,
        jobDescription: testData.jobPosting.description,
        requirements: testData.jobPosting.requirements
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Interview Prep Endpoint Success!\n');
      console.log('📊 Response Data:');
      console.log('─'.repeat(60));
      console.log('\n🏢 Company Insights:');
      console.log(data.companyInsights?.substring(0, 200) + '...');
      
      console.log('\n❓ Sample Interview Questions:');
      data.questions?.slice(0, 3).forEach((q, i) => {
        console.log(`${i + 1}. ${q}`);
      });
      
      console.log('\n💡 Preparation Tips:');
      console.log(data.tips?.substring(0, 200) + '...');
      
      if (data.technicalTopics) {
        console.log('\n🔧 Technical Topics to Study:');
        data.technicalTopics.slice(0, 5).forEach((topic, i) => {
          console.log(`${i + 1}. ${topic}`);
        });
      }
      
      console.log('\n' + '─'.repeat(60));
    } else {
      console.error('❌ Interview Prep Failed:', data);
    }
  } catch (error) {
    console.error('❌ Error testing interview prep:', error.message);
  }
}

async function testSalaryInsights() {
  console.log('\n💰 Testing /api/salary-insights endpoint...\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/salary-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobTitle: testData.jobPosting.title,
        company: testData.jobPosting.company,
        location: testData.jobPosting.location,
        experienceLevel: testData.userProfile.experience,
        skills: testData.userProfile.skills
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Salary Insights Endpoint Success!\n');
      console.log('📊 Response Data:');
      console.log('─'.repeat(60));
      
      if (data.salaryRange) {
        console.log('\n💵 Salary Range:');
        console.log(`   Min: $${data.salaryRange.min?.toLocaleString()}`);
        console.log(`   Median: $${data.salaryRange.median?.toLocaleString()}`);
        console.log(`   Max: $${data.salaryRange.max?.toLocaleString()}`);
      }
      
      if (data.marketInsights) {
        console.log('\n📈 Market Insights:');
        console.log(data.marketInsights.substring(0, 200) + '...');
      }
      
      if (data.negotiationTips) {
        console.log('\n🤝 Negotiation Tips:');
        data.negotiationTips.slice(0, 3).forEach((tip, i) => {
          console.log(`${i + 1}. ${tip}`);
        });
      }
      
      if (data.benefitsToConsider) {
        console.log('\n🎁 Benefits to Consider:');
        data.benefitsToConsider.slice(0, 5).forEach((benefit, i) => {
          console.log(`${i + 1}. ${benefit}`);
        });
      }
      
      if (data.locationAdjustment) {
        console.log('\n📍 Location Adjustment:');
        console.log(data.locationAdjustment.substring(0, 150) + '...');
      }
      
      console.log('\n' + '─'.repeat(60));
    } else {
      console.error('❌ Salary Insights Failed:', data);
    }
  } catch (error) {
    console.error('❌ Error testing salary insights:', error.message);
  }
}

async function runTests() {
  console.log('═'.repeat(60));
  console.log('🧪 Testing Interview Prep & Salary Insights APIs');
  console.log('   Company: Google | Position: AI Engineer');
  console.log('═'.repeat(60));
  
  await testInterviewPrep();
  await testSalaryInsights();
  
  console.log('\n✅ All tests completed!');
  console.log('═'.repeat(60));
}

runTests().catch(console.error);
