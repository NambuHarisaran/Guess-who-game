/**
 * Stage Guess Reveal Game - Games Management Controller
 */

// DOM Elements
const elements = {
    gamesGrid: document.getElementById('games-grid'),
    searchInput: document.getElementById('search-input'),
    filterGrid: document.getElementById('filter-grid'),
    sortBy: document.getElementById('sort-by'),
    btnToggleAllImages: document.getElementById('btn-toggle-all-images'),
    deleteModal: document.getElementById('delete-modal'),
    deleteGameTitle: document.getElementById('delete-game-title'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    btnCloseDelete: document.getElementById('btn-close-delete'),
    editModal: document.getElementById('edit-modal'),
    editGameForm: document.getElementById('edit-game-form'),
    editGameId: document.getElementById('edit-game-id'),
    editGameTitle: document.getElementById('edit-game-title'),
    editGameAnswer: document.getElementById('edit-game-answer'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    btnCloseEdit: document.getElementById('btn-close-edit'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    hamburgerBtn: document.getElementById('hamburger-btn'),
    drawerCloseBtn: document.getElementById('drawer-close-btn'),
    adminSidebar: document.getElementById('admin-sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop')
};

let allGames = [];
let gameToDelete = null;
const revealedCardIds = new Set(); // Stores game IDs that user has clicked to reveal

async function initGamesPage() {
    setupMobileDrawer();
    setupEventListeners();
    await loadGames();
}

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

async function loadGames() {
    try {
        const res = await fetch('/api/games');
        allGames = await res.json();
        applyFiltersAndRender();
    } catch (err) {
        console.error(err);
        elements.gamesGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon" style="color: var(--brand-rose);">⚠️</span>
                <h3>Failed to load games</h3>
                <p>Ensure backend server is running.</p>
            </div>
        `;
    }
}

function applyFiltersAndRender() {
    let filtered = [...allGames];

    // Search query
    const query = (elements.searchInput?.value || '').toLowerCase().trim();
    if (query) {
        filtered = filtered.filter(g => 
            (g.title || '').toLowerCase().includes(query) || 
            (g.answer || '').toLowerCase().includes(query)
        );
    }

    // Grid size filter
    const gridSize = elements.filterGrid?.value;
    if (gridSize) {
        filtered = filtered.filter(g => String(g.gridSize) === String(gridSize));
    }

    // Sort
    const sort = elements.sortBy?.value || 'newest';
    if (sort === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'name') {
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    renderGames(filtered);
}

function renderGames(games) {
    if (!elements.gamesGrid) return;

    if (games.length === 0) {
        elements.gamesGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🎮</span>
                <h3>No Games Found</h3>
                <p>Try clearing filters or create a brand new reveal quiz game.</p>
                <a href="/admin/create" class="btn btn-primary" style="margin-top: 1rem;">✨ Create New Game</a>
            </div>
        `;
        return;
    }

    elements.gamesGrid.innerHTML = games.map(game => {
        const totalTiles = game.gridSize * game.gridSize;
        const revCount = (game.revealedTiles || []).length;
        const isSolved = revCount === totalTiles;
        const pct = Math.round((revCount / totalTiles) * 100);
        const isRevealed = revealedCardIds.has(String(game.id));

        return `
            <div class="game-card-admin" data-id="${game.id}">
                <!-- Mystery Artwork Cover -->
                <div class="game-card-thumb-wrap ${isRevealed ? 'revealed' : 'concealed'}" id="thumb-${game.id}">
                    <img src="${game.image}" alt="${escapeHtml(game.title)}" loading="lazy">
                    
                    <div class="mystery-cover">
                        <span class="mystery-icon">🎭</span>
                        <span class="mystery-label">Mystery Artwork</span>
                        <button class="btn-reveal-cover" onclick="toggleCardReveal('${game.id}', event)">
                            <span>👁️ Reveal Image</span>
                        </button>
                    </div>

                    <button class="btn-hide-cover" onclick="toggleCardReveal('${game.id}', event)" title="Conceal artwork to prevent spoilers">
                        <span>🔒 Hide</span>
                    </button>

                    <div class="game-card-overlay-actions">
                        <a href="/game/${game.id}" class="btn btn-primary btn-small">
                            ▶ Play
                        </a>
                    </div>
                </div>

                <div class="game-card-body">
                    <div class="game-card-meta">
                        <span class="progress-pill ${isSolved ? 'completed' : ''}">
                            ${isSolved ? '🏆 Solved' : `${revCount}/${totalTiles} (${pct}%)`}
                        </span>
                        <span>🔲 ${game.gridSize}×${game.gridSize}</span>
                    </div>
                    <h3 class="game-card-title">${escapeHtml(game.title)}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                        Answer: <span class="spoiler-answer" onclick="this.classList.toggle('revealed')" title="Click to reveal/hide answer">${escapeHtml(game.answer)}</span>
                    </p>
                </div>

                <div class="game-card-footer-actions">
                    <a href="/game/${game.id}" class="btn btn-primary btn-small">
                        ▶ Launch
                    </a>
                    <button class="btn btn-secondary btn-small" onclick="toggleCardReveal('${game.id}', event)" title="Toggle Image Preview">
                        ${isRevealed ? '🔒 Hide' : '👁️ View'}
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="copyGameLink('${game.id}', this)" title="Copy Shareable Link">
                        🔗 Link
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="openEditModal('${game.id}')" title="Edit Title & Answer">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="resetGameProgress('${game.id}')" title="Reset Revealed Tiles to 0">
                        ↺ Reset
                    </button>
                    <button class="btn btn-danger btn-small" onclick="promptDelete('${game.id}', '${escapeHtml(game.title).replace(/'/g, "\\'")}')" title="Delete Game">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle reveal for a specific game card
function toggleCardReveal(gameId, event) {
    if (event) event.stopPropagation();

    const strId = String(gameId);
    if (revealedCardIds.has(strId)) {
        revealedCardIds.delete(strId);
    } else {
        revealedCardIds.add(strId);
    }

    applyFiltersAndRender();
}

// Toggle reveal for all game cards
function toggleAllCardsReveal() {
    if (revealedCardIds.size === allGames.length) {
        revealedCardIds.clear();
        if (elements.btnToggleAllImages) {
            elements.btnToggleAllImages.innerHTML = '<span>👁️ Reveal All Artwork</span>';
        }
        showToast('All artwork concealed', 'info');
    } else {
        allGames.forEach(g => revealedCardIds.add(String(g.id)));
        if (elements.btnToggleAllImages) {
            elements.btnToggleAllImages.innerHTML = '<span>🔒 Hide All Artwork</span>';
        }
        showToast('All artwork revealed', 'info');
    }

    applyFiltersAndRender();
}

// Copy link to clipboard
async function copyGameLink(gameId, btn) {
    const url = `${window.location.origin}/game/${gameId}`;
    try {
        await navigator.clipboard.writeText(url);
        const origText = btn.innerHTML;
        btn.innerHTML = '✓ Copied';
        btn.classList.add('btn-success-active');
        showToast('🔗 Stage Game link copied to clipboard!', 'success');
        setTimeout(() => {
            btn.innerHTML = origText;
            btn.classList.remove('btn-success-active');
        }, 2000);
    } catch (err) {
        showToast('Failed to copy link', 'error');
    }
}

// Reset progress back to unrevealed state
async function resetGameProgress(gameId) {
    try {
        const formData = new FormData();
        formData.append('revealedTiles', JSON.stringify([]));

        const res = await fetch(`/api/games/${gameId}`, {
            method: 'PUT',
            body: formData
        });

        if (!res.ok) throw new Error('Failed to reset');
        showToast('Game progress reset to unrevealed state!', 'success');
        await loadGames();
    } catch (err) {
        console.error(err);
        showToast('Error resetting game progress', 'error');
    }
}

// Edit Modal
function openEditModal(gameId) {
    const game = allGames.find(g => String(g.id) === String(gameId));
    if (!game) return;

    elements.editGameId.value = game.id;
    elements.editGameTitle.value = game.title;
    elements.editGameAnswer.value = game.answer;
    elements.editModal.classList.remove('hidden');
}

function closeEditModal() {
    elements.editModal.classList.add('hidden');
}

// Delete Modal
function promptDelete(gameId, title) {
    gameToDelete = gameId;
    elements.deleteGameTitle.textContent = title;
    elements.deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    gameToDelete = null;
    elements.deleteModal.classList.add('hidden');
}

async function confirmDeleteGame() {
    if (!gameToDelete) return;
    try {
        const res = await fetch(`/api/games/${gameToDelete}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('Delete failed');

        showToast('Game deleted successfully', 'success');
        closeDeleteModal();
        await loadGames();
    } catch (err) {
        console.error(err);
        showToast('Failed to delete game', 'error');
    }
}

function setupEventListeners() {
    elements.searchInput?.addEventListener('input', applyFiltersAndRender);
    elements.filterGrid?.addEventListener('change', applyFiltersAndRender);
    elements.sortBy?.addEventListener('change', applyFiltersAndRender);
    elements.btnToggleAllImages?.addEventListener('click', toggleAllCardsReveal);

    // Delete Modal
    elements.btnCancelDelete?.addEventListener('click', closeDeleteModal);
    elements.btnCloseDelete?.addEventListener('click', closeDeleteModal);
    elements.btnConfirmDelete?.addEventListener('click', confirmDeleteGame);

    // Edit Modal
    elements.btnCancelEdit?.addEventListener('click', closeEditModal);
    elements.btnCloseEdit?.addEventListener('click', closeEditModal);
    elements.editGameForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = elements.editGameId.value;
        const title = elements.editGameTitle.value.trim();
        const answer = elements.editGameAnswer.value.trim();

        if (!title || !answer) return;

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('answer', answer);

            const res = await fetch(`/api/games/${id}`, {
                method: 'PUT',
                body: formData
            });

            if (!res.ok) throw new Error('Update failed');
            showToast('Game updated successfully!', 'success');
            closeEditModal();
            await loadGames();
        } catch (err) {
            console.error(err);
            showToast('Failed to update game', 'error');
        }
    });
}

function showToast(message, type = 'success') {
    if (!elements.toast || !elements.toastMessage) return;
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove('hidden');
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 300);
    }, 3200);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Global functions for inline HTML calls
window.toggleCardReveal = toggleCardReveal;
window.copyGameLink = copyGameLink;
window.resetGameProgress = resetGameProgress;
window.openEditModal = openEditModal;
window.promptDelete = promptDelete;

document.addEventListener('DOMContentLoaded', initGamesPage);
