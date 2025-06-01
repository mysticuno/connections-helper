const browserAPI = typeof browser !== "undefined" ? browser : chrome;

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
  browserAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const currentUrl = tabs[0].url;
    if (!currentUrl.includes('nytimes.com/games/connections')) {
      playConnections.classList.remove('hidden');
      mainContent.classList.add('hidden');
      return;
    }

    // Initialize toggle state from localStorage
    candidateModeToggle.checked = window.localStorage.getItem('candidateMode') !== null
      ? window.localStorage.getItem('candidateMode')
      : true;
    updateClearButtonVisibility();

    // Toggle candidate mode
    candidateModeToggle.addEventListener('change', () => {
      window.localStorage.setItem('candidateMode', candidateModeToggle.checked);
      updateClearButtonVisibility();
      browserAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
        browserAPI.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_MODE',
          enabled: candidateModeToggle.checked
        });
      });
    });

    // Clear marks
    clearMarksButton.addEventListener('click', () => {
      browserAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
        browserAPI.tabs.sendMessage(tabs[0].id, {type: 'CLEAR_MARKS'});
      });
    });
  });
});
