// Simple Background Script for AutoJobr Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoJobr Extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  
  if (message.action === 'CHECK_AUTH') {
    // For now, return authentication status
    sendResponse({ success: true, authenticated: false });
  } else if (message.action === 'GET_PROFILE') {
    // Return empty profile for now
    sendResponse({ success: false, profile: null });
  }
  
  return true; // Keep message channel open
});

console.log('AutoJobr background script loaded');