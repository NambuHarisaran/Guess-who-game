/**
 * Stage Guess Reveal Game - Projector Secondary Display Client
 * Real-time mirror receiving state updates via BroadcastChannel / localStorage.
 */

// Confetti Particle Engine
class ConfettiEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.isActive = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    burst() {
        this.isActive = true;
        const colors = ['#22d3ee', '#06b6d4', '#fbbf24', '#f59e0b', '#ec4899', '#10b981'];
        for (let i = 0; i < 180; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height * 0.5,
                vx: (Math.random() - 0.5) * 28,
                vy: (Math.random() - 0.8) * 24,
                size: Math.random() * 9 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rSpeed: (Math.random() - 0.5) * 12,
                alpha: 1
            });
        }
        this.animate();
    }

    animate() {
        if (!this.isActive || !this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.45;
            p.rotation += p.rSpeed;
            p.alpha -= 0.008;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            this.ctx.restore();

            if (p.alpha <= 0) {
                this.particles.splice(idx, 1);
            }
        });

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isActive = false;
        }
    }
}

let confetti;
let broadcastChan = null;

// Determine target screen mode from URL (/display/1, /display/2, /display/dual)
const pathParts = window.location.pathname.split('/').filter(Boolean);
let displayMode = 'dual'; // 'dual' | '1' | '2'
if (pathParts.length >= 2 && pathParts[0] === 'display') {
    displayMode = pathParts[1];
}

const el = {
    displayTitle: document.getElementById('display-title'),
    dispTimerText: document.getElementById('disp-timer-text'),
    btnFullscreenDisp: document.getElementById('btn-fullscreen-disp'),
    dispCardP1: document.getElementById('disp-card-p1'),
    dispCardP2: document.getElementById('disp-card-p2'),
    dispP1Name: document.getElementById('disp-p1-name'),
    dispP2Name: document.getElementById('disp-p2-name'),
    dispP1Wins: document.getElementById('disp-p1-wins'),
    dispP2Wins: document.getElementById('disp-p2-wins'),
    dispP1Score: document.getElementById('disp-p1-score'),
    dispP2Score: document.getElementById('disp-p2-score'),
    dispBuzzerBanner: document.getElementById('disp-buzzer-banner'),

    dispArenaGrid: document.getElementById('disp-arena-grid'),
    dispArena1: document.getElementById('disp-arena-1'),
    dispArena2: document.getElementById('disp-arena-2'),
    dispP1Title: document.getElementById('disp-p1-title'),
    dispP2Title: document.getElementById('disp-p2-title'),
    dispP1Left: document.getElementById('disp-p1-left'),
    dispP2Left: document.getElementById('disp-p2-left'),
    dispP1Board: document.getElementById('disp-p1-board'),
    dispP2Board: document.getElementById('disp-p2-board'),
    dispP1Solved: document.getElementById('disp-p1-solved'),
    dispP2Solved: document.getElementById('disp-p2-solved'),
    dispP1AnswerText: document.getElementById('disp-p1-answer-text'),
    dispP2AnswerText: document.getElementById('disp-p2-answer-text')
};

let lastSyncState = null;

document.addEventListener('DOMContentLoaded', () => {
    confetti = new ConfettiEngine(document.getElementById('confetti-canvas'));

    // Apply single-display mode styling if target is 1 or 2
    if (displayMode === '1') {
        document.body.classList.add('single-display-mode');
        if (el.dispArena2) el.dispArena2.style.display = 'none';
        if (el.dispCardP2) el.dispCardP2.style.opacity = '0.4';
    } else if (displayMode === '2') {
        document.body.classList.add('single-display-mode');
        if (el.dispArena1) el.dispArena1.style.display = 'none';
        if (el.dispCardP1) el.dispCardP1.style.opacity = '0.4';
    }

    el.btnFullscreenDisp?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    // Setup BroadcastChannel
    try {
        broadcastChan = new BroadcastChannel('stage_guess_dual_channel');
        broadcastChan.onmessage = (e) => {
            if (e.data && e.data.type === 'DUAL_SYNC') {
                renderFromSync(e.data);
            }
        };
    } catch (e) {
        console.warn('BroadcastChannel fallback', e);
    }

    // Storage event fallback
    window.addEventListener('storage', (e) => {
        if (e.key === 'stage_dual_sync_payload' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                renderFromSync(data);
            } catch (err) {}
        }
    });

    // Check initial cached state
    const cached = localStorage.getItem('stage_dual_sync_payload');
    if (cached) {
        try {
            renderFromSync(JSON.parse(cached));
        } catch (err) {}
    }
});

function renderFromSync(data) {
    if (!data) return;
    const { p1, p2, match } = data;

    // Timer & Scores
    if (el.dispTimerText && match) {
        el.dispTimerText.textContent = `${match.timerRemaining}s`;
        el.dispTimerText.classList.toggle('panic', match.timerRemaining <= 10 && match.timerRemaining > 0);
    }

    if (match) {
        if (el.dispP1Name) el.dispP1Name.textContent = match.p1Name || 'Player 1';
        if (el.dispP2Name) el.dispP2Name.textContent = match.p2Name || 'Player 2';
        if (el.dispP1Score) el.dispP1Score.textContent = match.p1Score ?? 0;
        if (el.dispP2Score) el.dispP2Score.textContent = match.p2Score ?? 0;

        if (el.dispP1Wins) {
            el.dispP1Wins.textContent = '★'.repeat(match.p1Wins || 0) + '☆'.repeat(Math.max(0, 3 - (match.p1Wins || 0)));
        }
        if (el.dispP2Wins) {
            el.dispP2Wins.textContent = '★'.repeat(match.p2Wins || 0) + '☆'.repeat(Math.max(0, 3 - (match.p2Wins || 0)));
        }

        // Active turn / Buzzer
        el.dispCardP1?.classList.toggle('active-turn', match.turn === 'p1');
        el.dispCardP2?.classList.toggle('active-turn', match.turn === 'p2');

        if (el.dispBuzzerBanner) {
            if (match.buzzerLockedBy === 1) {
                el.dispBuzzerBanner.innerHTML = `<span>🔔 ${escapeHtml(match.p1Name)} BUZZED IN!</span>`;
                el.dispBuzzerBanner.className = 'buzzer-alert-banner buzzed-p1';
            } else if (match.buzzerLockedBy === 2) {
                el.dispBuzzerBanner.innerHTML = `<span>🔔 ${escapeHtml(match.p2Name)} BUZZED IN!</span>`;
                el.dispBuzzerBanner.className = 'buzzer-alert-banner buzzed-p2';
            } else {
                el.dispBuzzerBanner.innerHTML = `<span>🔔 Live Stage Battle</span>`;
                el.dispBuzzerBanner.className = 'buzzer-alert-banner';
            }
        }
    }

    // Boards
    if (p1 && (displayMode === 'dual' || displayMode === '1')) {
        renderDisplayBoard(1, p1);
    }
    if (p2 && (displayMode === 'dual' || displayMode === '2')) {
        renderDisplayBoard(2, p2);
    }

    lastSyncState = data;
}

function renderDisplayBoard(num, pData) {
    const boardEl = num === 1 ? el.dispP1Board : el.dispP2Board;
    const titleEl = num === 1 ? el.dispP1Title : el.dispP2Title;
    const leftEl = num === 1 ? el.dispP1Left : el.dispP2Left;
    const solvedEl = num === 1 ? el.dispP1Solved : el.dispP2Solved;
    const ansTextEl = num === 1 ? el.dispP1AnswerText : el.dispP2AnswerText;

    if (!boardEl) return;

    if (titleEl) titleEl.textContent = pData.title || `Question ${num}`;
    const revSet = new Set(pData.revealedTiles || []);
    const leftCount = Math.max(0, (pData.totalTiles || 64) - revSet.size);
    if (leftEl) leftEl.textContent = leftCount;

    // Check if board needs full rebuild (image changed or grid size changed)
    const currentId = boardEl.dataset.gameId;
    if (currentId !== String(pData.id)) {
        boardEl.dataset.gameId = pData.id;
        boardEl.innerHTML = '';
        boardEl.style.backgroundImage = `url(${pData.image})`;
        boardEl.className = `dual-game-board grid-${pData.gridSize || 8}`;

        for (let i = 1; i <= (pData.totalTiles || 64); i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.number = i;
            if (revSet.has(i)) {
                tile.classList.add('revealed');
            }
            const span = document.createElement('span');
            span.className = 'tile-number';
            span.textContent = i;
            tile.appendChild(span);
            boardEl.appendChild(tile);
        }
    } else {
        // Just sync tile reveal classes
        for (let i = 1; i <= (pData.totalTiles || 64); i++) {
            const tile = boardEl.querySelector(`.tile[data-number="${i}"]`);
            if (tile) {
                if (revSet.has(i) && !tile.classList.contains('revealed')) {
                    tile.classList.add('revealed');
                } else if (!revSet.has(i) && tile.classList.contains('revealed')) {
                    tile.classList.remove('revealed');
                }
            }
        }
    }

    // Solved state
    if (pData.isComplete) {
        if (solvedEl) solvedEl.classList.remove('hidden');
        if (ansTextEl) ansTextEl.textContent = pData.answer || '🎉 Revealed!';
    } else {
        if (solvedEl) solvedEl.classList.add('hidden');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
