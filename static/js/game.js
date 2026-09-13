/**
 * Stage Guess Reveal Game - Master Game Engine (Hugo Extended Client-Side)
 * Includes Web Audio Synthesis, Confetti Canvas, Stage Timer, and HUD Controls.
 * Powered by GameStore with zero backend dependency.
 */

// Synthesized Web Audio API Engine
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem('stage_game_muted') === 'true';
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('stage_game_muted', String(this.isMuted));
        return this.isMuted;
    }

    playTileReveal(index = 1, total = 64) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Pitch dynamically rises as more tiles are revealed
        const baseFreq = 440 + (index / total) * 360;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    playSpinTick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    playTimerTick(isPanic = false) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isPanic ? 'square' : 'sine';
        osc.frequency.setValueAtTime(isPanic ? 1100 : 650, now);
        gain.gain.setValueAtTime(isPanic ? 0.22 : 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playResetWhoosh() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playVictoryFanfare() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        });
    }
}

// Confetti Particle Engine
class ConfettiEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext('2d');
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
        if (!this.canvas) return;
        this.isActive = true;
        const colors = ['#22d3ee', '#06b6d4', '#fbbf24', '#f59e0b', '#ec4899', '#10b981'];
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height * 0.4,
                vx: (Math.random() - 0.5) * 26,
                vy: (Math.random() - 0.7) * 22,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rSpeed: (Math.random() - 0.5) * 10,
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
            p.vy += 0.4;
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

// Game State
const audio = new SoundEngine();
let confetti;

let gameState = {
    id: null,
    title: '',
    image: '',
    gridSize: 8,
    answer: '',
    totalTiles: 64,
    revealedTiles: new Set(),
    isComplete: false,
    hostPeek: false
};

let timerState = {
    duration: 30,
    remaining: 30,
    timerId: null,
    isRunning: false
};

let allGames = [];
let currentGameIndex = -1;

const el = {
    loadingOverlay: document.getElementById('loading-overlay'),
    gameBoard: document.getElementById('game-board'),
    gameTitle: document.getElementById('game-title'),
    tilesLeft: document.getElementById('tiles-left'),
    tilesRevealed: document.getElementById('tiles-revealed'),
    tilesPercent: document.getElementById('tiles-percent'),
    answerDisplay: document.getElementById('answer-display'),
    answerText: document.getElementById('answer-text'),
    tileInput: document.getElementById('tile-input'),
    btnReset: document.getElementById('btn-reset'),
    btnRandom: document.getElementById('btn-random'),
    btnRevealAll: document.getElementById('btn-reveal-all'),
    btnRevealTile: document.getElementById('btn-reveal-tile'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    btnHostPeek: document.getElementById('btn-host-peek'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    btnHudToggle: document.getElementById('btn-hud-toggle'),
    btnPlayAgain: document.getElementById('btn-play-again'),
    btnNextGame: document.getElementById('btn-next-game'),
    timerText: document.getElementById('timer-text'),
    timerRingProgress: document.getElementById('timer-ring-progress'),
    btnTimerToggle: document.getElementById('btn-timer-toggle'),
    btnTimerReset: document.getElementById('btn-timer-reset'),
    timerPresetSelect: document.getElementById('timer-preset-select'),
    btnNumpadToggle: document.getElementById('btn-numpad-toggle'),
    numpadDrawer: document.getElementById('mobile-numpad-drawer'),
    numpadGrid: document.getElementById('numpad-grid'),
    btnCloseNumpad: document.getElementById('btn-close-numpad')
};

async function initGame() {
    confetti = new ConfettiEngine(document.getElementById('confetti-canvas'));
    
    // Determine gameId from query parameter ?id=... or pathname /game/<id>/
    const urlParams = new URLSearchParams(window.location.search);
    let gameId = urlParams.get('id');

    if (!gameId) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== 'game' && lastPart !== 'index.html') {
            gameId = lastPart;
        }
    }

    try {
        allGames = await window.GameStore.getAllGames();

        if (!allGames || allGames.length === 0) {
            el.loadingOverlay.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--brand-amber);">⚠️ No Games Available</p>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Create a game in the Admin Studio to get started.</p>
                    <a href="/admin/create/" class="btn btn-primary">✨ Create Game</a>
                </div>
            `;
            return;
        }

        let game = null;
        if (gameId) {
            game = await window.GameStore.getGameById(gameId);
        }

        if (!game) {
            // Default to first game
            game = allGames[0];
            gameId = game.id;
        }

        currentGameIndex = allGames.findIndex(g => String(g.id) === String(game.id));

        gameState.id = game.id;
        gameState.title = game.title;
        gameState.image = game.image;
        gameState.gridSize = game.gridSize || 6;
        gameState.answer = game.answer || '';
        gameState.totalTiles = gameState.gridSize * gameState.gridSize;
        gameState.revealedTiles = new Set(game.revealedTiles || []);

        if (el.gameTitle) el.gameTitle.textContent = game.title;
        if (el.tileInput) el.tileInput.max = gameState.totalTiles;

        renderGameBoard();
        renderMobileNumpad();
        updateStats();
        initTimer(30);

        if (gameState.revealedTiles.size >= gameState.totalTiles && gameState.totalTiles > 0) {
            completeGame();
        }

        if (el.soundIcon) {
            el.soundIcon.textContent = audio.isMuted ? '🔇' : '🔊';
        }

        el.loadingOverlay?.classList.add('hidden');
    } catch (err) {
        console.error('Error in initGame:', err);
        if (el.loadingOverlay) {
            el.loadingOverlay.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--stage-danger);">⚠️ Game Not Found</p>
                    <a href="/admin/games/" class="btn btn-primary">Back to Games List</a>
                </div>
            `;
        }
    }
}

function renderGameBoard() {
    if (!el.gameBoard) return;
    el.gameBoard.innerHTML = '';
    el.gameBoard.style.backgroundImage = `url(${gameState.image})`;
    el.gameBoard.className = `game-board grid-${gameState.gridSize}`;

    for (let i = 1; i <= gameState.totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.number = i;
        if (gameState.revealedTiles.has(i)) {
            tile.classList.add('revealed');
        }

        const span = document.createElement('span');
        span.className = 'tile-number';
        span.textContent = i;
        tile.appendChild(span);

        tile.addEventListener('click', () => revealTile(i));
        el.gameBoard.appendChild(tile);
    }
}

function renderMobileNumpad() {
    if (!el.numpadGrid) return;
    el.numpadGrid.innerHTML = '';
    for (let i = 1; i <= gameState.totalTiles; i++) {
        const btn = document.createElement('button');
        btn.className = 'numpad-btn';
        btn.dataset.num = i;
        btn.textContent = i;
        if (gameState.revealedTiles.has(i)) {
            btn.classList.add('revealed');
        }
        btn.addEventListener('click', () => {
            revealTile(i);
            btn.classList.add('revealed');
        });
        el.numpadGrid.appendChild(btn);
    }
}

function revealTile(num) {
    if (gameState.isComplete || num < 1 || num > gameState.totalTiles || gameState.revealedTiles.has(num)) return;

    gameState.revealedTiles.add(num);
    const tile = document.querySelector(`.tile[data-number="${num}"]`);
    if (tile) {
        tile.classList.add('revealed');
    }

    const numpadBtn = document.querySelector(`.numpad-btn[data-num="${num}"]`);
    if (numpadBtn) {
        numpadBtn.classList.add('revealed');
    }

    audio.playTileReveal(gameState.revealedTiles.size, gameState.totalTiles);
    updateStats();

    if (gameState.revealedTiles.size === gameState.totalTiles) {
        completeGame();
    }
    saveGameState();
}

let isSpinningRandom = false;
let revealAllTimeoutId = null;

function revealRandomTile() {
    if (gameState.isComplete || isSpinningRandom) return;
    const unrevealed = [];
    for (let i = 1; i <= gameState.totalTiles; i++) {
        if (!gameState.revealedTiles.has(i)) unrevealed.push(i);
    }
    if (unrevealed.length === 0) return;

    isSpinningRandom = true;
    let spins = 0;
    const maxSpins = 8;
    const interval = setInterval(() => {
        audio.playSpinTick();
        spins++;
        if (spins >= maxSpins) {
            clearInterval(interval);
            isSpinningRandom = false;
            const target = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            revealTile(target);
        }
    }, 45);
}

function revealAllTiles() {
    if (gameState.isComplete) return;
    if (revealAllTimeoutId) clearTimeout(revealAllTimeoutId);

    for (let i = 1; i <= gameState.totalTiles; i++) {
        if (!gameState.revealedTiles.has(i)) {
            gameState.revealedTiles.add(i);
            const tile = document.querySelector(`.tile[data-number="${i}"]`);
            if (tile) {
                setTimeout(() => tile.classList.add('revealed'), Math.random() * 400);
            }
        }
    }
    revealAllTimeoutId = setTimeout(() => {
        revealAllTimeoutId = null;
        updateStats();
        completeGame();
        saveGameState();
    }, 450);
}

function resetGame() {
    if (revealAllTimeoutId) {
        clearTimeout(revealAllTimeoutId);
        revealAllTimeoutId = null;
    }
    isSpinningRandom = false;

    audio.playResetWhoosh();
    gameState.revealedTiles.clear();
    gameState.isComplete = false;
    el.gameBoard?.classList.remove('game-completed');
    const ambientGlow = document.getElementById('ambient-glow');
    if (ambientGlow) ambientGlow.classList.remove('celebration');
    el.answerDisplay?.classList.add('hidden');
    renderGameBoard();
    renderMobileNumpad();
    updateStats();
    resetTimer();
    saveGameState();
}

function completeGame() {
    gameState.isComplete = true;
    audio.playVictoryFanfare();
    confetti?.burst();

    el.gameBoard?.classList.add('game-completed');
    const ambientGlow = document.getElementById('ambient-glow');
    if (ambientGlow) ambientGlow.classList.add('celebration');

    if (el.answerText) {
        el.answerText.textContent = gameState.answer || 'Mystery Solved!';
    }
    el.answerDisplay?.classList.remove('hidden');

    // Pause timer
    if (timerState.isRunning) {
        toggleTimer();
    }
}

function updateStats() {
    const rev = gameState.revealedTiles.size;
    const left = gameState.totalTiles - rev;
    const pct = Math.round((rev / (gameState.totalTiles || 1)) * 100);

    if (el.tilesRevealed) el.tilesRevealed.textContent = rev;
    if (el.tilesLeft) el.tilesLeft.textContent = left;
    if (el.tilesPercent) el.tilesPercent.textContent = `(${pct}%)`;
}

// Stage Countdown Timer
function initTimer(seconds) {
    timerState.duration = seconds;
    timerState.remaining = seconds;
    updateTimerUI();
}

function toggleTimer() {
    if (timerState.isRunning) {
        clearInterval(timerState.timerId);
        timerState.isRunning = false;
        if (el.btnTimerToggle) el.btnTimerToggle.textContent = '▶';
    } else {
        timerState.isRunning = true;
        if (el.btnTimerToggle) el.btnTimerToggle.textContent = '⏸';
        timerState.timerId = setInterval(() => {
            timerState.remaining--;
            const isPanic = timerState.remaining <= 5;
            audio.playTimerTick(isPanic);
            updateTimerUI();

            if (timerState.remaining <= 0) {
                clearInterval(timerState.timerId);
                timerState.isRunning = false;
                if (el.btnTimerToggle) el.btnTimerToggle.textContent = '▶';
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerState.timerId);
    timerState.isRunning = false;
    timerState.remaining = timerState.duration;
    if (el.btnTimerToggle) el.btnTimerToggle.textContent = '▶';
    updateTimerUI();
}

function updateTimerUI() {
    if (el.timerText) el.timerText.textContent = `${timerState.remaining}s`;
    const circumference = 100.5;
    const offset = circumference - (timerState.remaining / timerState.duration) * circumference;
    if (el.timerRingProgress) el.timerRingProgress.style.strokeDashoffset = offset;

    const timerContainer = document.querySelector('.hud-timer-container');
    if (timerContainer) {
        if (timerState.remaining <= 5 && timerState.isRunning) {
            timerContainer.classList.add('panic');
            if (el.timerRingProgress) el.timerRingProgress.style.stroke = 'var(--stage-danger)';
        } else {
            timerContainer.classList.remove('panic');
            if (el.timerRingProgress) el.timerRingProgress.style.stroke = 'var(--stage-cyan)';
        }
    }
}

// Clean Projector HUD Mode
function toggleHudMode() {
    document.body.classList.toggle('clean-hud-mode');
}

function toggleHostPeek() {
    // Anti-cheat disabled
}

// Fullscreen Handler
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.error);
    } else {
        document.exitFullscreen();
    }
}

// Next Game Navigation
function playNextGame() {
    if (allGames.length > 0 && currentGameIndex !== -1) {
        const nextIndex = (currentGameIndex + 1) % allGames.length;
        window.location.href = `/game/?id=${encodeURIComponent(allGames[nextIndex].id)}`;
    } else {
        window.location.href = '/admin/games/';
    }
}

// Persistence using GameStore
async function saveGameState() {
    try {
        if (gameState.id && window.GameStore) {
            await window.GameStore.saveGameProgress(gameState.id, [...gameState.revealedTiles]);
        }
    } catch (e) {
        console.error('Error saving game state:', e);
    }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initGame();

    el.btnReset?.addEventListener('click', resetGame);
    el.btnRandom?.addEventListener('click', revealRandomTile);
    el.btnRevealAll?.addEventListener('click', revealAllTiles);
    el.btnFullscreen?.addEventListener('click', toggleFullscreen);
    el.btnHudToggle?.addEventListener('click', toggleHudMode);
    el.btnHostPeek?.addEventListener('click', toggleHostPeek);
    el.btnPlayAgain?.addEventListener('click', resetGame);
    el.btnNextGame?.addEventListener('click', playNextGame);

    el.btnSoundToggle?.addEventListener('click', () => {
        const muted = audio.toggleMute();
        if (el.soundIcon) {
            el.soundIcon.textContent = muted ? '🔇' : '🔊';
        }
    });

    el.btnTimerToggle?.addEventListener('click', toggleTimer);
    el.btnTimerReset?.addEventListener('click', resetTimer);
    el.timerPresetSelect?.addEventListener('change', (e) => initTimer(parseInt(e.target.value)));

    el.btnRevealTile?.addEventListener('click', () => {
        const val = parseInt(el.tileInput.value);
        if (val) {
            revealTile(val);
            el.tileInput.value = '';
        }
    });

    el.tileInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = parseInt(el.tileInput.value);
            if (val) {
                revealTile(val);
                el.tileInput.value = '';
            }
        }
    });

    el.btnNumpadToggle?.addEventListener('click', () => el.numpadDrawer?.classList.toggle('open'));
    el.btnCloseNumpad?.addEventListener('click', () => el.numpadDrawer?.classList.remove('open'));

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === el.tileInput) return;

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
            case 'h':
                toggleHudMode();
                break;
            case 't':
                toggleTimer();
                break;
            case 'm':
                const muted = audio.toggleMute();
                if (el.soundIcon) {
                    el.soundIcon.textContent = muted ? '🔇' : '🔊';
                }
                break;
            case 'a':
                revealAllTiles();
                break;
            case 'enter':
                if (gameState.isComplete) {
                    playNextGame();
                }
                break;
        }
    });
});

// Anti-cheat: Prevent console access to game answers
(function() {
    Object.defineProperty(window, 'gameState', {
        get: function() { return undefined; },
        set: function() {},
        configurable: false
    });
})();
