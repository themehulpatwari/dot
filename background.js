import config from './config.js';

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
  const events = [];
  const lines = icsData.split('\n');
  let currentEvent = null;

  for (let line of lines) {
    line = line.trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (currentEvent) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent && line) {
      const [key, ...values] = line.split(':');
      const value = values.join(':');
      
      switch (key) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'DTSTART':
          currentEvent.start = new Date(value).toISOString();
          break;
      }
    }
  }

  return events;
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
