/**
 * Stage Guess Reveal Game - Landing Page Interactive Demo
 */
document.addEventListener('DOMContentLoaded', () => {
    const previewBoard = document.getElementById('hero-preview-board');
    const previewStatus = document.getElementById('preview-status-count');
    const resetBtn = document.getElementById('preview-reset-btn');

    if (!previewBoard) return;

    let revealedCount = 0;
    const totalTiles = 9;

    function initPreview() {
        previewBoard.innerHTML = '';
        revealedCount = 0;
        updateStatus();

        for (let i = 1; i <= totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'preview-tile';
            tile.textContent = i;
            tile.setAttribute('role', 'button');
            tile.setAttribute('aria-label', `Tile ${i}`);

            tile.addEventListener('click', () => {
                if (!tile.classList.contains('revealed')) {
                    tile.classList.add('revealed');
                    revealedCount++;
                    updateStatus();
                }
            });

            previewBoard.appendChild(tile);
        }
    }

    function updateStatus() {
        if (previewStatus) {
            const remaining = totalTiles - revealedCount;
            previewStatus.textContent = `${remaining} left`;
        }
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', initPreview);
    }

    initPreview();
});
