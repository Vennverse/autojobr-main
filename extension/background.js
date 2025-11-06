// background.js

// Mock data for testing purposes (replace with actual data fetching if needed)
const mockJobData = {
  title: "Software Engineer",
  company: "Tech Corp",
  location: "San Francisco, CA",
  url: "https://example.com/job/123",
  appliedDate: new Date().toISOString(),
  source: "extension"
};

// Function to simulate fetching job data
async function fetchJobData(url) {
  console.log(`Fetching job data from: ${url}`);
  // In a real scenario, you'd fetch data from the current page
  // For this example, we'll return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockJobData);
    }, 500);
  });
}

// Function to handle the tracking of an application
async function handleTrackApplication(data) {
  try {
    console.log('📤 Sending to backend:', data);

    const response = await fetch('https://autojobr.com/api/track-application', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    console.log('📥 Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Backend result:', result);

    return result;
  } catch (error) {
    console.error('❌ Failed to track application:', error);
    throw error;
  }
}

// Listener for messages from the content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message.action);

  if (message.action === 'trackApplication') {
    console.log('🔄 Processing trackApplication:', message.data);

    handleTrackApplication(message.data)
      .then(result => {
        console.log('✅ Track application result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('❌ Background tracking error:', error);
        sendResponse({
          success: false,
          error: error.message || 'Unknown error occurred'
        });
      });
    return true; // Keep channel open for async response
  }

  // Handle other actions...
  return false;
});

// Example of how you might use fetchJobData if needed elsewhere
// chrome.runtime.onInstalled.addListener(() => {
//   console.log('Extension installed');
// });