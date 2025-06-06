const browserAPI = typeof browser !== "undefined" ? browser : chrome;

const COLORS = ['yellow', 'green', 'blue', 'purple'];
let candidateMode = true;

function initialize() {
  const tiles = document.querySelectorAll('[data-testid="card-label"]');
  
  if (tiles.length === 0) {
    return;
  }
  
  // Get candidateMode and tileMarks from localStorage
  candidateMode = window.localStorage.getItem('candidateMode') !== null
    ? window.localStorage.getItem('candidateMode') === 'true'
    : true;
  const marks = JSON.parse(window.localStorage.getItem('tileMarks') || '{}');
  
  // Only wrap tiles and restore marks if candidate mode is on
  if (candidateMode) {
    tiles.forEach(tile => {
      const word = tile.textContent.trim();
      if (!word) {
        return;
      }
      
      wrapTile(tile);
      if (marks[word]) {
        marks[word].forEach(color => addCorner(tile, color));
      }
    });
  }
}

// Watch for DOM changes to handle dynamic content
const observer = new MutationObserver((mutations) => {
  // Ignore changes to our corner containers to prevent infinite loops
  const isOurChange = mutations.some(mutation => 
    mutation.target.classList.contains('corner-container') ||
    mutation.target.classList.contains('candidate-corner')
  );
  
  if (isOurChange) {
    return;
  }
  
  // Check if the game board has been loaded
  const gameBoard = document.querySelector('[data-testid="connections-board"]');
  if (gameBoard) {
    const tiles = document.querySelectorAll('[data-testid="card-label"]');
    if (tiles.length > 0) {
      initialize();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

browserAPI.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'CLEAR_MARKS') {
    // Remove marks from storage first, then clean up DOM
    window.localStorage.removeItem('tileMarks');
    document.querySelectorAll('.corner-container').forEach(e => e.remove());
    initialize();
  } else if (msg.type === 'TOGGLE_MODE') {
    candidateMode = msg.enabled;
    window.localStorage.setItem('candidateMode', candidateMode);
    if (!candidateMode) {
      document.querySelectorAll('.corner-container').forEach(e => e.remove());
    } else {
      initialize();
    }
  }
});

function wrapTile(tile) {
  const word = tile.textContent.trim();
  
  // Check if tile is already wrapped to prevent infinite loop
  if (tile.querySelector('.corner-container')) {
    // Still check and apply any existing marks
    const marks = JSON.parse(window.localStorage.getItem('tileMarks') || '{}');
    if (marks[word]) {
      marks[word].forEach(color => addCorner(tile, color));
    }
    return;
  }
  
  tile.classList.add('tile-wrapper');
  
  const cornerContainer = document.createElement('div');
  cornerContainer.className = 'corner-container';
  
  COLORS.forEach(color => {
    const marker = document.createElement('div');
    marker.className = 'candidate-corner';
    marker.dataset.color = color;
    
    marker.addEventListener('mouseenter', () => {
      if (!marker.classList.contains('active')) {
        marker.style.opacity = '0.8';
      }
    });

    marker.addEventListener('mouseleave', () => {
      if (!marker.classList.contains('active')) {
        marker.style.opacity = '0';
      }
    });

    // Only use pointerdown event to prevent click propagation
    marker.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (candidateMode) {
        // If the tile is invisible, make it visible before toggling
        if (marker.style.opacity === '0') {
          marker.style.opacity = '0.8';
        }
        toggleMark(tile, color);
      }
    }, { capture: true });
    
    cornerContainer.appendChild(marker);
  });
  
  tile.appendChild(cornerContainer);
  
  // Check and apply any existing marks
  const marks = JSON.parse(window.localStorage.getItem('tileMarks') || '{}');
  if (marks[word]) {
    marks[word].forEach(color => addCorner(tile, color));
  }
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
  const word = tile.textContent.trim();
  
  const marks = JSON.parse(window.localStorage.getItem('tileMarks') || '{}');
  marks[word] = marks[word] || [];
  const idx = marks[word].indexOf(color);
  
  if (idx === -1) {
    marks[word].push(color);
    addCorner(tile, color);
  } else {
    marks[word].splice(idx, 1);
    removeCorner(tile, color);
    const corner = tile.querySelector(`.candidate-corner[data-color="${color}"]`);
    if (corner) {
      corner.style.opacity = '0';
    }
  }
  
  window.localStorage.setItem('tileMarks', JSON.stringify(marks));
}
