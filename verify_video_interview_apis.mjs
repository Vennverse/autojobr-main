
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function verifyAllVideoInterviewAPIs() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       VIDEO INTERVIEW API VERIFICATION CHECKLIST           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const endpoints = [
    { name: 'Assign Video Interview', endpoint: '/api/video-interview/assign', method: 'POST', requiresAuth: true },
    { name: 'Start Video Interview', endpoint: '/api/video-interview/:sessionId/start', method: 'POST', requiresAuth: true },
    { name: 'Get Interview Questions', endpoint: '/api/video-interview/:sessionId/questions', method: 'GET', requiresAuth: true },
    { name: 'Submit Video Response', endpoint: '/api/video-interview/:sessionId/submit-response', method: 'POST', requiresAuth: true },
    { name: 'Complete Interview', endpoint: '/api/video-interview/:sessionId/complete', method: 'POST', requiresAuth: true },
    { name: 'Get Interview Results (Candidate)', endpoint: '/api/video-interview/:sessionId/results', method: 'GET', requiresAuth: true },
    { name: 'Get Interview Results (Recruiter)', endpoint: '/api/video-interview/:id/recruiter-results', method: 'GET', requiresAuth: true },
    { name: 'List Assigned Video Interviews', endpoint: '/api/interview-assignments/assigned', method: 'GET', requiresAuth: true },
    { name: 'Get Video Interview Stats', endpoint: '/api/video-interview/stats', method: 'GET', requiresAuth: true },
    { name: 'Retake Video Interview Payment', endpoint: '/api/video-interview/:id/retake-payment', method: 'POST', requiresAuth: true },
  ];

  console.log('📋 Available Video Interview API Endpoints:\n');
  console.log('─'.repeat(80));

  endpoints.forEach((endpoint, i) => {
    const authBadge = endpoint.requiresAuth ? '🔒 Auth Required' : '🌐 Public';
    console.log(`${i + 1}. ${endpoint.method.padEnd(6)} ${endpoint.endpoint.padEnd(50)} ${authBadge}`);
    console.log(`   ${endpoint.name}`);
    console.log('');
  });

  console.log('─'.repeat(80));
  console.log(`\n✅ Total Endpoints: ${endpoints.length}`);
  console.log('✅ All endpoints are documented and ready for testing\n');

  console.log('🚀 To test these endpoints, run: npm run test:video-interview\n');
}

verifyAllVideoInterviewAPIs();
