// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
  
  // Function to authenticate and get OAuth2 token
  async function authenticate() {
    const token = await chrome.identity.getAuthToken({ interactive: true });
    return token;
  }
  
  // Function to fetch ICS data and convert to Google Tasks
  async function syncIcsToGoogleTasks(icsUrl) {
    const token = await authenticate();
    // Fetch the ICS file
    const response = await fetch(icsUrl);
    const icsData = await response.text();
    // Parse ICS and convert to Google Tasks
    // (Implement parsing logic here)
  }
  
  // Listener for messages from content or popup scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'syncIcs') {
      syncIcsToGoogleTasks(request.icsUrl);
      sendResponse({ status: 'Sync initiated' });
    }
  });
  