const COLORS = ['yellow', 'green', 'blue', 'purple'];
let candidateMode = true;
let isInitialized = false;

// Initialize on page load and when DOM changes
function initialize() {
  if (isInitialized) {
    return;
  }
  
  const tiles = document.querySelectorAll('[data-testid="card-label"]');
  
  if (tiles.length === 0) {
    return;
  }
  
  isInitialized = true;
  chrome.storage.local.get(['candidateMode', 'tileMarks'], (data) => {
    candidateMode = data.candidateMode !== undefined ? data.candidateMode : true;
    if (candidateMode) {
      const marks = data.tileMarks || {};
      tiles.forEach(tile => {
        wrapTile(tile);
        const word = tile.innerText.trim();
        if (marks[word]) {
          marks[word].forEach(color => addCorner(tile, color));
        }
      });
    }
  });
}

// Watch for DOM changes to handle dynamic content
const observer = new MutationObserver(() => {
  if (document.querySelectorAll('[data-testid="card-label"]').length > 0) {
    initialize();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initialize immediately if content is already loaded
initialize();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'CLEAR_MARKS') {
    document.querySelectorAll('.candidate-corner').forEach(e => e.remove());
    chrome.storage.local.remove('tileMarks');
  } else if (msg.type === 'TOGGLE_MODE') {
    candidateMode = msg.enabled;
    if (!candidateMode) {
      document.querySelectorAll('.candidate-corner').forEach(e => e.remove());
    } else {
      initialize();
    }
  }
});

function wrapTile(tile) {
  if (tile.querySelector('.candidate-corner')) {
    return;
  }
  
  tile.classList.add('tile-wrapper');
  
  const cornerContainer = document.createElement('div');
  cornerContainer.className = 'corner-container';
  
  COLORS.forEach(color => {
    const marker = document.createElement('div');
    marker.className = 'candidate-corner';
    marker.dataset.color = color;
    
    // Only use pointerdown event
    marker.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (candidateMode) {
        toggleMark(tile, color);
      }
    }, { capture: true });
    
    cornerContainer.appendChild(marker);
  });
  
  tile.appendChild(cornerContainer);
}

function addCorner(tile, color) {
  const corner = tile.querySelector(`.candidate-corner[data-color="${color}"]`);
  if (corner) {
    corner.classList.add('active');
  }
}

function removeCorner(tile, color) {
  const corner = tile.querySelector(`.candidate-corner[data-color="${color}"]`);
  if (corner) {
    corner.classList.remove('active');
  }
}

function toggleMark(tile, color) {
  const word = tile.innerText.trim();
  
  chrome.storage.local.get('tileMarks', (data) => {
    const marks = data.tileMarks || {};
    marks[word] = marks[word] || [];
    const idx = marks[word].indexOf(color);
    
    if (idx === -1) {
      marks[word].push(color);
      addCorner(tile, color);
    } else {
      marks[word].splice(idx, 1);
      removeCorner(tile, color);
    }
    
    chrome.storage.local.set({ tileMarks: marks });
  });
}

// Listen for changes to candidate mode toggle
chrome.storage.onChanged.addListener((changes) => {
  if (changes.candidateMode) {
    candidateMode = changes.candidateMode.newValue;
    if (candidateMode) {
      initialize();
    } else {
      document.querySelectorAll('.candidate-corner').forEach(e => e.remove());
    }
  }
});
