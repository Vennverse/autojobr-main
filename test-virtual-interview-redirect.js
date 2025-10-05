// Test script to verify virtual interview redirection logic

// Simulate the data returned from the API
const testCases = [
  {
    name: "Virtual interview with virtual-interview URL",
    data: {
      interviewType: 'virtual',
      interviewUrl: '/virtual-interview/abc123',
    },
    expectedRedirect: '/chat-interview/abc123'
  },
  {
    name: "Virtual interview with chat-interview URL",
    data: {
      interviewType: 'virtual',
      interviewUrl: '/chat-interview/def456',
    },
    expectedRedirect: '/chat-interview/def456'
  },
  {
    name: "Virtual interview with no URL",
    data: {
      interviewType: 'virtual',
      interviewUrl: '',
    },
    expectedRedirect: '/virtual-interview-start?fromInvite=true'
  },
  {
    name: "Mock interview",
    data: {
      interviewType: 'mock',
      interviewUrl: '/mock-interview/ghi789',
    },
    expectedRedirect: '/mock-interview?fromInvite=true'
  }
];

// Mock navigation function
function mockNavigate(url) {
  console.log(`Navigating to: ${url}`);
  return url;
}

// Test the redirection logic
function testRedirection(data) {
  const { interviewType } = data;
  let redirectUrl;

  switch (interviewType) {
    case 'virtual':
      if (data.interviewUrl && data.interviewUrl.includes('/virtual-interview/')) {
        const sessionId = data.interviewUrl.split('/virtual-interview/')[1];
        redirectUrl = mockNavigate(`/chat-interview/${sessionId}`);
      } else if (data.interviewUrl && data.interviewUrl.includes('/chat-interview/')) {
        redirectUrl = mockNavigate(data.interviewUrl);
      } else {
        redirectUrl = mockNavigate(`/virtual-interview-start?fromInvite=true`);
      }
      break;
    case 'mock':
      redirectUrl = mockNavigate(`/mock-interview?fromInvite=true`);
      break;
    case 'video-interview':
      redirectUrl = mockNavigate(`/ChatInterview?fromInvite=true`);
      break;
    default:
      redirectUrl = mockNavigate('/dashboard');
  }

  return redirectUrl;
}

// Run the tests
console.log("=== Testing Virtual Interview Redirection Logic ===");
testCases.forEach(testCase => {
  console.log(`\nTest: ${testCase.name}`);
  console.log(`Input: ${JSON.stringify(testCase.data)}`);
  
  const actualRedirect = testRedirection(testCase.data);
  
  console.log(`Expected: ${testCase.expectedRedirect}`);
  console.log(`Actual: ${actualRedirect}`);
  
  if (actualRedirect === testCase.expectedRedirect) {
    console.log("✅ PASS");
  } else {
    console.log("❌ FAIL");
  }
});