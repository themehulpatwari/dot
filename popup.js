// popup.js

document.getElementById('syncButton').addEventListener('click', () => {
    const icsUrl = document.getElementById('icsUrl').value;
    if (icsUrl) {
      chrome.runtime.sendMessage({ action: 'syncIcs', icsUrl: icsUrl }, (response) => {
        console.log(response.status);
      });
    } else {
      alert('Please enter a valid ICS URL.');
    }
  });
  