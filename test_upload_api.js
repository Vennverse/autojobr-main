#!/usr/bin/env node

/**
 * Resume Upload API Test Script
 * 
 * This script tests the resume upload API endpoint directly
 * Run this on your VM to simulate a file upload
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

console.log('=== Resume Upload API Test ===');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const TEST_PDF_PATH = './test_resume.pdf';

console.log('Server URL:', SERVER_URL);
console.log('Test file path:', TEST_PDF_PATH);
console.log('');

// Create a simple test PDF if it doesn't exist
function createTestPDF() {
  if (!fs.existsSync(TEST_PDF_PATH)) {
    console.log('Creating test PDF file...');
    // Simple PDF header (minimal valid PDF)
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test Resume Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000208 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
306
%%EOF`;
    
    fs.writeFileSync(TEST_PDF_PATH, pdfContent);
    console.log('✓ Test PDF created');
  } else {
    console.log('✓ Test PDF already exists');
  }
}

// Test authentication first
async function testAuth() {
  console.log('=== Testing Authentication ===');
  try {
    const response = await fetch(`${SERVER_URL}/api/user`, {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('Auth test response status:', response.status);
    console.log('Auth test response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Auth test response body:', data);
    
    if (response.status === 401) {
      console.log('⚠️  Not authenticated - you need to login first');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('✗ Auth test error:', error.message);
    return false;
  }
}

// Test the upload endpoint
async function testUpload() {
  console.log('\n=== Testing Resume Upload ===');
  
  createTestPDF();
  
  try {
    // Read the test file
    const fileBuffer = fs.readFileSync(TEST_PDF_PATH);
    console.log('✓ Test file read successfully');
    console.log('File size:', fileBuffer.length, 'bytes');
    
    // Create form data
    const formData = new FormData();
    formData.append('resume', fileBuffer, {
      filename: 'test_resume.pdf',
      contentType: 'application/pdf'
    });
    formData.append('name', 'Test Resume Upload');
    
    console.log('✓ Form data created');
    
    // Make the request
    console.log('Making upload request...');
    const response = await fetch(`${SERVER_URL}/api/resumes/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    console.log('Upload response status:', response.status);
    console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Upload response body (raw):', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Upload response body (parsed):', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('Response is not valid JSON');
    }
    
    if (response.ok) {
      console.log('✓ Upload successful!');
    } else {
      console.log('✗ Upload failed with status:', response.status);
    }
    
  } catch (error) {
    console.log('✗ Upload test error:', error.message);
    console.log('Error stack:', error.stack);
  }
}

// Test server health
async function testServerHealth() {
  console.log('\n=== Testing Server Health ===');
  try {
    const response = await fetch(`${SERVER_URL}/`, {
      method: 'GET'
    });
    
    console.log('Health check status:', response.status);
    console.log('Server appears to be:', response.ok ? 'RUNNING ✓' : 'DOWN ✗');
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('Content type:', contentType);
      
      if (contentType && contentType.includes('text/html')) {
        console.log('✓ Server serving HTML (frontend)');
      }
    }
    
  } catch (error) {
    console.log('✗ Server health check error:', error.message);
  }
}

// Test specific endpoints
async function testEndpoints() {
  console.log('\n=== Testing API Endpoints ===');
  
  const endpoints = [
    '/api/user',
    '/api/resumes',
    '/api/jobs/recommendations'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      console.log(`${endpoint}: ${response.status} ${response.ok ? '✓' : '✗'}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('Starting API tests...\n');
  
  await testServerHealth();
  await testEndpoints();
  
  const isAuthenticated = await testAuth();
  
  if (isAuthenticated) {
    await testUpload();
  } else {
    console.log('\n⚠️  Skipping upload test - authentication required');
    console.log('To test upload:');
    console.log('1. Login to your app in a browser');
    console.log('2. Extract session cookie');
    console.log('3. Add cookie to this script or test manually');
  }
  
  console.log('\n=== Test Complete ===');
  console.log('Check the logs above for any errors or issues.');
  
  // Cleanup
  if (fs.existsSync(TEST_PDF_PATH)) {
    fs.unlinkSync(TEST_PDF_PATH);
    console.log('✓ Test file cleaned up');
  }
}

main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});