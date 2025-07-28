// Simple Background Script for AutoJobr Extension - VM Server Only
const VM_API_BASE = 'http://40.160.50.128:5000';

chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoJobr Extension installed - VM Server Mode');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  
  if (message.action === 'CHECK_AUTH') {
    // Check authentication with VM server
    checkVMAuthentication().then(result => {
      sendResponse(result);
    });
    return true; // Keep async channel open
  } else if (message.action === 'GET_PROFILE') {
    // Get profile from VM server
    getVMProfile().then(result => {
      sendResponse(result);
    });
    return true; // Keep async channel open
  }
  
  return true; // Keep message channel open
});

async function checkVMAuthentication() {
  try {
    // First check debug endpoint
    const debugResponse = await fetch(`${VM_API_BASE}/api/debug/extension-auth`, {
      credentials: 'include',
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('🔍 Background Debug:', debugData);
      
      if (debugData.isAuthenticated) {
        // Try to get user data using extension-specific endpoint
        const userResponse = await fetch(`${VM_API_BASE}/api/extension/user`, {
          credentials: 'include',
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          return { success: true, authenticated: true, profile: userData };
        }
      }
    }
    
    return { success: true, authenticated: false, profile: null };
  } catch (error) {
    console.error('VM authentication check failed:', error);
    return { success: false, authenticated: false, profile: null };
  }
}

async function getVMProfile() {
  try {
    const [profile, skills, workExperience, education] = await Promise.all([
      fetch(`${VM_API_BASE}/api/profile`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${VM_API_BASE}/api/skills`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${VM_API_BASE}/api/work-experience`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${VM_API_BASE}/api/education`, { credentials: 'include' }).then(r => r.json())
    ]);

    const userProfile = { profile, skills, workExperience, education };
    return { success: true, profile: userProfile };
  } catch (error) {
    console.error('Failed to get VM profile:', error);
    return { success: false, profile: null };
  }
}

console.log('AutoJobr background script loaded - VM Server:', VM_API_BASE);