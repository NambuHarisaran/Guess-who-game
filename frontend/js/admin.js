/**
 * Stage Guess Reveal Game - Admin Dashboard
 * 
 * Handles:
 * - Loading and displaying dashboard statistics
 * - Showing recent games
 */

// DOM Elements
const elements = {
    totalGames: document.getElementById('total-games'),
    totalImages: document.getElementById('total-images'),
    recentGame: document.getElementById('recent-game'),
    recentGamesList: document.getElementById('recent-games-list')
};

/**
 * Initialize the admin dashboard
 */
async function initDashboard() {
    try {
        const response = await fetch('/api/games');
        const games = await response.json();
        
        // Update stats
        elements.totalGames.textContent = games.length;
        elements.totalImages.textContent = games.length;
        
        // Get most recent game
        if (games.length > 0) {
            const sorted = games.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            elements.recentGame.textContent = sorted[0].title.substring(0, 15) + 
                (sorted[0].title.length > 15 ? '...' : '');
            
            // Render recent games (last 5)
            renderRecentGames(sorted.slice(0, 5));
        } else {
            elements.recentGame.textContent = 'None';
            elements.recentGamesList.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <span class="empty-icon">🎮</span>
                    <h3>No Games Yet</h3>
                    <p>Create your first game to get started!</p>
                    <a href="/admin/create" class="btn btn-primary">Create Game</a>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        elements.recentGamesList.innerHTML = `
            <p style="color: var(--danger-color);">Failed to load data</p>
        `;
    }
}

/**
 * Render recent games list
 * @param {Array} games - Array of game objects
 */
function renderRecentGames(games) {
    if (games.length === 0) {
        elements.recentGamesList.innerHTML = '<p>No games found</p>';
        return;
    }
    
    elements.recentGamesList.innerHTML = games.map(game => `
        <div class="game-list-item">
            <div class="game-list-info">
                <img src="${game.image}" alt="${game.title}" class="game-list-thumb">
                <div class="game-list-details">
                    <h4>${escapeHtml(game.title)}</h4>
                    <p>${game.gridSize}×${game.gridSize} grid • ${formatDate(game.createdAt)}</p>
                </div>
            </div>
            <div class="game-list-actions">
                <a href="/game/${game.id}" class="btn btn-primary btn-small">Play</a>
            </div>
        </div>
    `).join('');
}

/**
 * Format date string
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
        return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initDashboard);
