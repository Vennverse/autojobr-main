// Simple test background script
console.log('AutoJobr background script loaded successfully');

// Set up basic event listeners
chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoJobr extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  sendResponse({success: true});
  return true;
});

// Test API connection
async function testConnection() {
  try {
    const response = await fetch('https://29ce8162-da3c-47aa-855b-eac2ee4b17cd-00-2uv34jdoe24cx.riker.replit.dev/api/health');
    console.log('API health check:', response.ok ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('API connection failed:', error);
  }
}

testConnection();