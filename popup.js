document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('candidateModeToggle');
  const clearButton = document.getElementById('clearMarks');

  // Initialize toggle state
  chrome.storage.local.get('candidateMode', (data) => {
    toggle.checked = data.candidateMode !== undefined ? data.candidateMode : true;
  });

  // Handle toggle changes
  toggle.addEventListener('change', () => {
    chrome.storage.local.set({ candidateMode: toggle.checked });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'TOGGLE_MODE',
        enabled: toggle.checked
      });
    });
  });

  // Handle clear marks
  clearButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_MARKS' });
    });
  });
});