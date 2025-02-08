import config from '../../config/config.js';
import ICAL from "https://unpkg.com/ical.js/dist/ical.min.js";

async function authenticate() {
  const authResult = await chrome.identity.getAuthToken({ 
    interactive: true,
    client_id: config.oauth2.client_id,
    scopes: config.api.scopes
  });
  return authResult.token;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Function to fetch ICS data and convert to Google Tasks
async function syncIcsToGoogleTasks(icsUrl) {
  const token = await authenticate();
  
  // Use a public CORS proxy to fetch the ICS file
  const proxyUrl = `https://cors-anywhere.herokuapp.com/${icsUrl}`;
  const response = await fetch(proxyUrl);
  const icsData = await response.text();

  // Parse ICS data
  const events = parseIcsData(icsData);
  console.log(events);

  // Create Google Tasks
  for (const event of events) {
    console.log(event);
    await createGoogleTask(event, token);
  }
}

// Function to parse ICS data (implement parsing logic here)
function parseIcsData(icsData) {
    ICAL.parse(icsData);
    console.log(icsData);
}

// Function to create a Google Task
async function createGoogleTask(event, token) {
  const task = {
    title: event.summary,
    notes: event.description,
    due: event.start
  };

  const response = await fetch('https://www.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    console.error('Failed to create task:', response.statusText);
  }
}

// Listener for messages from content or popup scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncIcs') {
    syncIcsToGoogleTasks(request.icsUrl);
    sendResponse({ status: 'Sync initiated' });
  }
});
