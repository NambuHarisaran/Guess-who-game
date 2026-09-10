/**
 * Stage Guess Reveal Game - Admin Dashboard Controller
 */

// DOM Elements
const elements = {
    totalGames: document.getElementById('total-games'),
    totalImages: document.getElementById('total-images'),
    activeGames: document.getElementById('active-games'),
    recentGame: document.getElementById('recent-game'),
    quickLaunchList: document.getElementById('quick-launch-list'),
    hamburgerBtn: document.getElementById('hamburger-btn'),
    drawerCloseBtn: document.getElementById('drawer-close-btn'),
    adminSidebar: document.getElementById('admin-sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop')
};

/**
 * Initialize Dashboard
 */
async function initDashboard() {
    setupMobileDrawer();
    await loadDashboardStats();
}

/**
 * Setup mobile drawer
 */
function setupMobileDrawer() {
    const openDrawer = () => {
        elements.adminSidebar?.classList.add('drawer-open');
        elements.sidebarBackdrop?.classList.add('active');
    };

    const closeDrawer = () => {
        elements.adminSidebar?.classList.remove('drawer-open');
        elements.sidebarBackdrop?.classList.remove('active');
    };

    elements.hamburgerBtn?.addEventListener('click', openDrawer);
    elements.drawerCloseBtn?.addEventListener('click', closeDrawer);
    elements.sidebarBackdrop?.addEventListener('click', closeDrawer);
}

/**
 * Load dashboard statistics and games
 */
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/games');
        const games = await response.json();

        // Update stats
        if (elements.totalGames) elements.totalGames.textContent = games.length;
        if (elements.totalImages) elements.totalImages.textContent = games.length;

        const activeCount = games.filter(g => (g.revealedTiles && g.revealedTiles.length > 0 && g.revealedTiles.length < (g.gridSize * g.gridSize))).length;
        if (elements.activeGames) elements.activeGames.textContent = activeCount;

        if (games.length > 0) {
            const sorted = [...games].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            if (elements.recentGame) {
                elements.recentGame.textContent = sorted[0].title.length > 16 
                    ? sorted[0].title.substring(0, 16) + '...' 
                    : sorted[0].title;
            }

            renderQuickLaunch(sorted);
        } else {
            if (elements.recentGame) elements.recentGame.textContent = 'None';
            if (elements.quickLaunchList) {
                elements.quickLaunchList.innerHTML = `
                    <div class="empty-state" style="padding: 2.5rem; border: none;">
                        <span class="empty-icon">🎮</span>
                        <h3>No Games Created Yet</h3>
                        <p>Create your first reveal quiz game to populate the stage playlist!</p>
                        <a href="/admin/create" class="btn btn-primary" style="margin-top: 1rem;">✨ Create First Game</a>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Render Quick Launch Stage Playlist
 */
function renderQuickLaunch(games) {
    if (!elements.quickLaunchList) return;

    elements.quickLaunchList.innerHTML = games.map(game => {
        const totalTiles = game.gridSize * game.gridSize;
        const revCount = (game.revealedTiles || []).length;
        const pct = Math.round((revCount / totalTiles) * 100);

        return `
            <div class="quick-launch-card">
                <div class="quick-launch-thumb-wrap concealed" onclick="this.classList.toggle('concealed'); this.classList.toggle('revealed');" title="Click to reveal/hide artwork preview">
                    <img src="${game.image}" alt="${escapeHtml(game.title)}" loading="lazy">
                    <div class="quick-launch-cover-icon">🎭</div>
                </div>
                <div class="quick-launch-info">
                    <h4>${escapeHtml(game.title)}</h4>
                    <p>🔲 ${game.gridSize}×${game.gridSize} &bull; ${revCount}/${totalTiles} (${pct}%)</p>
                </div>
                <a href="/game/${game.id}" class="btn btn-primary btn-small">
                    ▶ Play
                </a>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initDashboard);
