/**
 * Stage Guess Reveal Game - Game Logic
 * 
 * Handles:
 * - Loading and displaying the game
 * - Tile reveal mechanics with animations
 * - Keyboard shortcuts
 * - Game controls (reset, reveal all, random, give up)
 * - Stats tracking
 */

// Game state
let gameState = {
    id: null,
    title: '',
    image: '',
    gridSize: 8,
    answer: '',
    totalTiles: 64,
    revealedTiles: new Set(),
    isComplete: false
};

// All games list for navigation
let allGames = [];
let currentGameIndex = -1;

// DOM Elements
const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    gameBoard: document.getElementById('game-board'),
    gameTitle: document.getElementById('game-title'),
    tilesLeft: document.getElementById('tiles-left'),
    tilesRevealed: document.getElementById('tiles-revealed'),
    answerDisplay: document.getElementById('answer-display'),
    answerText: document.getElementById('answer-text'),
    tileInput: document.getElementById('tile-input'),
    btnReset: document.getElementById('btn-reset'),
    btnRandom: document.getElementById('btn-random'),
    btnRevealAll: document.getElementById('btn-reveal-all'),
    btnGiveUp: document.getElementById('btn-give-up'),
    btnRevealTile: document.getElementById('btn-reveal-tile'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    btnPlayAgain: document.getElementById('btn-play-again'),
    btnNextGame: document.getElementById('btn-next-game')
};

/**
 * Initialize the game
 */
async function initGame() {
    // Get game ID from URL
    const pathParts = window.location.pathname.split('/');
    const gameId = pathParts[pathParts.length - 1];
    
    if (!gameId) {
        showError('No game ID provided');
        return;
    }
    
    try {
        // Fetch game data
        const response = await fetch(`/api/games/${gameId}`);
        
        if (!response.ok) {
            throw new Error('Game not found');
        }
        
        const game = await response.json();
        
        // Initialize game state
        gameState.id = game.id;
        gameState.title = game.title;
        gameState.image = game.image;
        gameState.gridSize = game.gridSize;
        gameState.answer = game.answer;
        gameState.totalTiles = game.gridSize * game.gridSize;
        gameState.revealedTiles = new Set(game.revealedTiles || []);
        
        // Update UI
        elements.gameTitle.textContent = game.title;
        elements.tileInput.max = gameState.totalTiles;
        elements.tileInput.placeholder = `Enter tile (1-${gameState.totalTiles})`;
        
        // Render game board
        renderGameBoard();
        updateStats();
        
        // Hide loading
        elements.loadingOverlay.classList.add('hidden');
        
    } catch (error) {
        console.error('Error loading game:', error);
        showError('Failed to load game. Please try again.');
    }
}

/**
 * Render the game board with tiles
 */
function renderGameBoard() {
    // Clear existing content
    elements.gameBoard.innerHTML = '';
    
    // Set background image
    elements.gameBoard.style.backgroundImage = `url(${gameState.image})`;
    
    // Set grid class
    elements.gameBoard.className = `game-board grid-${gameState.gridSize}`;
    
    // Create tiles
    for (let i = 1; i <= gameState.totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.number = i;
        
        // Check if tile is already revealed
        if (gameState.revealedTiles.has(i)) {
            tile.classList.add('revealed');
        }
        
        const tileNumber = document.createElement('span');
        tileNumber.className = 'tile-number';
        tileNumber.textContent = i;
        
        tile.appendChild(tileNumber);
        
        // Click handler
        tile.addEventListener('click', () => revealTile(i));
        
        elements.gameBoard.appendChild(tile);
    }
}

/**
 * Reveal a specific tile
 * @param {number} tileNumber - The tile number to reveal (1-based)
 */
function revealTile(tileNumber) {
    if (gameState.isComplete) return;
    if (tileNumber < 1 || tileNumber > gameState.totalTiles) return;
    if (gameState.revealedTiles.has(tileNumber)) return;
    
    // Add to revealed set
    gameState.revealedTiles.add(tileNumber);
    
    // Find and animate the tile
    const tile = document.querySelector(`.tile[data-number="${tileNumber}"]`);
    if (tile) {
        tile.classList.add('revealed');
    }
    
    // Update stats
    updateStats();
    
    // Check if all tiles are revealed
    if (gameState.revealedTiles.size === gameState.totalTiles) {
        completeGame();
    }
    
    // Save state
    saveGameState();
}

/**
 * Reveal a random unrevealed tile
 */
function revealRandomTile() {
    if (gameState.isComplete) return;
    
    // Get unrevealed tiles
    const unrevealedTiles = [];
    for (let i = 1; i <= gameState.totalTiles; i++) {
        if (!gameState.revealedTiles.has(i)) {
            unrevealedTiles.push(i);
        }
    }
    
    if (unrevealedTiles.length === 0) return;
    
    // Pick random tile
    const randomIndex = Math.floor(Math.random() * unrevealedTiles.length);
    revealTile(unrevealedTiles[randomIndex]);
}

/**
 * Reveal all tiles at once
 */
function revealAllTiles() {
    if (gameState.isComplete) return;
    
    for (let i = 1; i <= gameState.totalTiles; i++) {
        if (!gameState.revealedTiles.has(i)) {
            gameState.revealedTiles.add(i);
            const tile = document.querySelector(`.tile[data-number="${i}"]`);
            if (tile) {
                // Stagger animation
                setTimeout(() => {
                    tile.classList.add('revealed');
                }, Math.random() * 500);
            }
        }
    }
    
    // Complete game after animations
    setTimeout(() => {
        updateStats();
        completeGame();
        saveGameState();
    }, 600);
}

/**
 * Reset the game to initial state
 */
function resetGame() {
    gameState.revealedTiles.clear();
    gameState.isComplete = false;
    
    // Hide answer
    elements.answerDisplay.classList.add('hidden');
    
    // Re-render board
    renderGameBoard();
    updateStats();
    saveGameState();
}

/**
 * Give up and show the answer
 */
function giveUp() {
    revealAllTiles();
}

/**
 * Mark game as complete and show answer
 */
function completeGame() {
    gameState.isComplete = true;
    
    // Show answer
    elements.answerText.textContent = gameState.answer;
    elements.answerDisplay.classList.remove('hidden');
    
    // Update next game button state
    updateNextGameButton();
}

/**
 * Load all games for navigation
 */
async function loadAllGames() {
    try {
        const response = await fetch('/api/games');
        allGames = await response.json();
        
        // Sort by creation date (oldest first for sequential play)
        allGames.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Find current game index
        currentGameIndex = allGames.findIndex(g => g.id === gameState.id);
        
        // Update button state
        updateNextGameButton();
    } catch (error) {
        console.error('Error loading games list:', error);
    }
}

/**
 * Update the next game button state
 */
function updateNextGameButton() {
    if (!elements.btnNextGame) return;
    
    const hasNextGame = currentGameIndex >= 0 && currentGameIndex < allGames.length - 1;
    
    if (hasNextGame) {
        elements.btnNextGame.disabled = false;
        const nextGame = allGames[currentGameIndex + 1];
        elements.btnNextGame.title = `Next: ${nextGame.title}`;
    } else {
        elements.btnNextGame.disabled = true;
        elements.btnNextGame.title = 'No more games';
        elements.btnNextGame.innerHTML = '<span class="btn-icon">✓</span> Last Game';
    }
}

/**
 * Navigate to the next game
 */
function goToNextGame() {
    if (currentGameIndex >= 0 && currentGameIndex < allGames.length - 1) {
        const nextGame = allGames[currentGameIndex + 1];
        window.location.href = `/game/${nextGame.id}`;
    }
}

/**
 * Play the current game again (reset)
 */
function playAgain() {
    resetGame();
}

/**
 * Update the stats display
 */
function updateStats() {
    const revealed = gameState.revealedTiles.size;
    const remaining = gameState.totalTiles - revealed;
    
    elements.tilesRevealed.textContent = revealed;
    elements.tilesLeft.textContent = remaining;
}

/**
 * Save game state to server
 */
async function saveGameState() {
    try {
        const formData = new FormData();
        formData.append('revealedTiles', JSON.stringify([...gameState.revealedTiles]));
        
        await fetch(`/api/games/${gameState.id}`, {
            method: 'PUT',
            body: formData
        });
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

/**
 * Show error message
 */
function showError(message) {
    elements.loadingOverlay.innerHTML = `
        <div style="text-align: center;">
            <p style="font-size: 1.5rem; margin-bottom: 1rem;">⚠️ ${message}</p>
            <a href="/admin/games" class="btn btn-primary">Back to Games</a>
        </div>
    `;
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.body.requestFullscreen().catch(err => {
            console.error('Error entering fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    loadAllGames();
    
    // Control button events
    elements.btnReset.addEventListener('click', resetGame);
    elements.btnRandom.addEventListener('click', revealRandomTile);
    elements.btnRevealAll.addEventListener('click', revealAllTiles);
    elements.btnGiveUp.addEventListener('click', giveUp);
    elements.btnFullscreen.addEventListener('click', toggleFullscreen);
    
    // Answer display buttons
    if (elements.btnPlayAgain) {
        elements.btnPlayAgain.addEventListener('click', playAgain);
    }
    if (elements.btnNextGame) {
        elements.btnNextGame.addEventListener('click', goToNextGame);
    }
    
    // Tile input
    elements.btnRevealTile.addEventListener('click', () => {
        const tileNumber = parseInt(elements.tileInput.value);
        if (tileNumber >= 1 && tileNumber <= gameState.totalTiles) {
            revealTile(tileNumber);
            elements.tileInput.value = '';
        }
    });
    
    elements.tileInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const tileNumber = parseInt(elements.tileInput.value);
            if (tileNumber >= 1 && tileNumber <= gameState.totalTiles) {
                revealTile(tileNumber);
                elements.tileInput.value = '';
            }
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
        if (document.activeElement === elements.tileInput) return;
        
        switch (e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                revealRandomTile();
                break;
            case 'r':
                resetGame();
                break;
            case 'f':
                toggleFullscreen();
                break;
            case 'n':
                if (gameState.isComplete) {
                    goToNextGame();
                }
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                revealTile(parseInt(e.key));
                break;
        }
        
        // Handle number pad and two-digit numbers
        if (e.key >= '0' && e.key <= '9' && e.ctrlKey) {
            e.preventDefault();
            const digit = parseInt(e.key);
            // Combine with shift for tens place
            const tileNumber = e.shiftKey ? digit + 10 : digit;
            revealTile(tileNumber);
        }
    });
});
