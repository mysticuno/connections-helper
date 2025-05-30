document.addEventListener('DOMContentLoaded', () => {
  const candidateModeToggle = document.getElementById('candidateModeToggle');
  const clearMarksButton = document.getElementById('clearMarks');
  const playConnections = document.getElementById('playConnections');
  const mainContent = document.getElementById('mainContent');

  function updateClearButtonVisibility() {
    if (candidateModeToggle.checked) {
      clearMarksButton.classList.remove('hidden');
    } else {
      clearMarksButton.classList.add('hidden');
    }
  }

  // Check if we're on the Connections page
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const currentUrl = tabs[0].url;
    if (!currentUrl.includes('nytimes.com/games/connections')) {
      playConnections.classList.remove('hidden');
      mainContent.classList.add('hidden');
      return;
    }

    // Initialize toggle state
    chrome.storage.local.get('candidateMode', (data) => {
      candidateModeToggle.checked = data.candidateMode !== undefined ? data.candidateMode : true;
      updateClearButtonVisibility();
    });

    // Toggle candidate mode
    candidateModeToggle.addEventListener('change', () => {
      chrome.storage.local.set({candidateMode: candidateModeToggle.checked});
      updateClearButtonVisibility();
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_MODE',
          enabled: candidateModeToggle.checked
        });
      });
    });

    // Clear marks
    clearMarksButton.addEventListener('click', () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {type: 'CLEAR_MARKS'});
      });
    });
  });
});