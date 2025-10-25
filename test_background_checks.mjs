
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

// Test data
const testData = {
  candidateName: 'John Doe',
  candidateEmail: 'john.doe@gmail.com',
  candidateLinkedIn: 'https://linkedin.com/in/johndoe',
  candidateGithub: 'torvalds',
  candidatePhone: '+1234567890',
  jobTitle: 'Software Engineer'
};

async function testBackgroundCheckFeatures() {
  console.log('🧪 Starting Background Check Features Test\n');
  
  try {
    // Test 1: Check if public background check service is available
    console.log('1️⃣ Testing Public Background Check Service...');
    const startResponse = await fetch(`${API_URL}/api/public-background-checks/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: 'test-candidate-123',
        ...testData
      })
    });
    
    if (startResponse.ok) {
      const startResult = await startResponse.json();
      console.log('✅ Background check started successfully');
      console.log('   Check ID:', startResult.id);
      console.log('   Status:', startResult.status);
      console.log('   Cost: $', startResult.cost);
      
      // Wait for check to complete
      console.log('\n⏳ Waiting for background check to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test 2: Retrieve the background check
      console.log('\n2️⃣ Testing Background Check Retrieval...');
      const getResponse = await fetch(`${API_URL}/api/public-background-checks/${startResult.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (getResponse.ok) {
        const checkResult = await getResponse.json();
        console.log('✅ Background check retrieved successfully');
        console.log('   Status:', checkResult.status);
        console.log('   Trust Score:', checkResult.results.trustScore);
        console.log('   Recommendation:', checkResult.results.recommendation);
        console.log('\n📊 Email Verification:');
        console.log('   Valid:', checkResult.results.emailVerification.isValid);
        console.log('   Disposable:', checkResult.results.emailVerification.isDisposable);
        console.log('   MX Records:', checkResult.results.emailVerification.mxRecords);
        
        if (checkResult.results.githubProfile) {
          console.log('\n🐙 GitHub Profile:');
          console.log('   Exists:', checkResult.results.githubProfile.exists);
          console.log('   Public Repos:', checkResult.results.githubProfile.publicRepos);
          console.log('   Followers:', checkResult.results.githubProfile.followers);
        }
        
        if (checkResult.results.redFlags.length > 0) {
          console.log('\n⚠️  Red Flags:', checkResult.results.redFlags.join(', '));
        }
        
        // Test 3: Export results
        if (checkResult.status === 'completed') {
          console.log('\n3️⃣ Testing Results Export...');
          const exportResponse = await fetch(`${API_URL}/api/public-background-checks/${startResult.id}/export`, {
            method: 'GET',
          });
          
          if (exportResponse.ok) {
            const report = await exportResponse.text();
            console.log('✅ Report exported successfully');
            console.log('   Report length:', report.length, 'characters');
            console.log('\n📄 Report Preview:');
            console.log(report.substring(0, 500) + '...');
          } else {
            console.log('❌ Export failed:', exportResponse.statusText);
          }
        }
      } else {
        console.log('❌ Retrieval failed:', getResponse.statusText);
      }
    } else {
      console.log('❌ Start failed:', startResponse.statusText);
    }
    
    // Test 4: List all background checks
    console.log('\n4️⃣ Testing Background Check List...');
    const listResponse = await fetch(`${API_URL}/api/public-background-checks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (listResponse.ok) {
      const checks = await listResponse.json();
      console.log('✅ Background checks listed successfully');
      console.log('   Total checks:', checks.length);
    } else {
      console.log('❌ List failed:', listResponse.statusText);
    }
    
    console.log('\n✨ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run tests
testBackgroundCheckFeatures();
