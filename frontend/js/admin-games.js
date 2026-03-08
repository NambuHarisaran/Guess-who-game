/**
 * Stage Guess Reveal Game - Games Management
 * 
 * Handles:
 * - Loading and displaying all games
 * - Search and filter functionality
 * - Game deletion with confirmation
 */

// DOM Elements
const elements = {
    gamesGrid: document.getElementById('games-grid'),
    emptyState: document.getElementById('empty-state'),
    searchInput: document.getElementById('search-input'),
    filterGrid: document.getElementById('filter-grid'),
    sortBy: document.getElementById('sort-by'),
    deleteModal: document.getElementById('delete-modal'),
    deleteGameTitle: document.getElementById('delete-game-title'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// State
let allGames = [];
let gameToDelete = null;

/**
 * Initialize the games page
 */
async function initGamesPage() {
    await loadGames();
    setupEventListeners();
}

/**
 * Load all games from API
 */
async function loadGames() {
    try {
        const response = await fetch('/api/games');
        allGames = await response.json();
        
        renderGames(allGames);
        
    } catch (error) {
        console.error('Error loading games:', error);
        elements.gamesGrid.innerHTML = `
            <div class="loading-placeholder">
                <p style="color: var(--danger-color);">Failed to load games</p>
            </div>
        `;
    }
}

/**
 * Render games grid
 * @param {Array} games - Array of game objects to render
 */
function renderGames(games) {
    if (games.length === 0) {
        elements.gamesGrid.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    
    elements.gamesGrid.innerHTML = games.map(game => `
        <div class="game-card" data-id="${game.id}">
            <div class="game-card-image">
                <img src="${game.image}" alt="${escapeHtml(game.title)}">
                <div class="game-card-overlay">
                    <a href="/game/${game.id}" class="btn btn-primary">
                        ▶ Play Game
                    </a>
                </div>
            </div>
            <div class="game-card-content">
                <h3 class="game-card-title">${escapeHtml(game.title)}</h3>
                <div class="game-card-meta">
                    <span class="game-card-grid">🔲 ${game.gridSize}×${game.gridSize}</span>
                    <span>${formatDate(game.createdAt)}</span>
                </div>
            </div>
            <div class="game-card-actions">
                <a href="/game/${game.id}" class="btn btn-secondary btn-small">
                    ▶ Play
                </a>
                <button class="btn btn-danger btn-small" onclick="confirmDelete('${game.id}', '${escapeHtml(game.title).replace(/'/g, "\\'")}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', filterGames);
    
    // Filter by grid size
    elements.filterGrid.addEventListener('change', filterGames);
    
    // Sort
    elements.sortBy.addEventListener('change', filterGames);
    
    // Modal
    elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
    elements.btnConfirmDelete.addEventListener('click', deleteGame);
    
    // Close modal on backdrop click
    elements.deleteModal.querySelector('.modal-backdrop').addEventListener('click', closeDeleteModal);
}

/**
 * Filter and sort games based on current selections
 */
function filterGames() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const gridFilter = elements.filterGrid.value;
    const sortBy = elements.sortBy.value;
    
    let filtered = allGames.filter(game => {
        // Search filter
        const matchesSearch = game.title.toLowerCase().includes(searchTerm) ||
                             game.answer.toLowerCase().includes(searchTerm);
        
        // Grid size filter
        const matchesGrid = !gridFilter || game.gridSize.toString() === gridFilter;
        
        return matchesSearch && matchesGrid;
    });
    
    // Sort
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'name':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
    renderGames(filtered);
}

/**
 * Show delete confirmation modal
 * @param {string} gameId - Game ID to delete
 * @param {string} gameTitle - Game title for display
 */
function confirmDelete(gameId, gameTitle) {
    gameToDelete = gameId;
    elements.deleteGameTitle.textContent = gameTitle;
    elements.deleteModal.classList.remove('hidden');
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
    gameToDelete = null;
    elements.deleteModal.classList.add('hidden');
}

/**
 * Delete the selected game
 */
async function deleteGame() {
    if (!gameToDelete) return;
    
    try {
        const response = await fetch(`/api/games/${gameToDelete}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete game');
        }
        
        // Remove from local array
        allGames = allGames.filter(g => g.id !== gameToDelete);
        
        // Close modal
        closeDeleteModal();
        
        // Re-render
        filterGames();
        
        showToast('Game deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting game:', error);
        showToast('Failed to delete game', 'error');
    }
}

/**
 * Format date string
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success' or 'error')
 */
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove('hidden');
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initGamesPage);
