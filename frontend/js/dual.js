/**
 * Stage Guess Reveal Game - Dual Screen & Scoring Engine
 * Synchronized split-screen stage battle with Web Audio synthesis,
 * BroadcastChannel multi-monitor mirroring, and rich scoring system.
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

    playTileReveal(playerNum = 1, index = 1, total = 64) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Distinct tones: P1 is brighter cyan timbre, P2 is deeper amber
        const baseFreq = playerNum === 1 ? 480 + (index / total) * 360 : 380 + (index / total) * 360;
        osc.type = playerNum === 1 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.12);

        gain.gain.setValueAtTime(playerNum === 1 ? 0.28 : 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    playBuzzer(playerNum = 1) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(playerNum === 1 ? 880 : 720, now);
        osc.frequency.setValueAtTime(playerNum === 1 ? 1174 : 960, now + 0.08);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playScoreGain() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        });
    }

    playScorePenalty() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playSpinTick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, now);
        gain.gain.setValueAtTime(0.12, now);
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
        gain.gain.setValueAtTime(isPanic ? 0.2 : 0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
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
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.3);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playVictoryFanfare() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.65);
        });
    }
}

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

// Global Audio and BroadcastChannel
const audio = new SoundEngine();
let confetti;
let broadcastChan = null;

// Multi-Screen Broadcast Setup
try {
    broadcastChan = new BroadcastChannel('stage_guess_dual_channel');
} catch (e) {
    console.warn('BroadcastChannel not supported, using fallback sync', e);
}

// Master Dual Battle State
const state = {
    p1: {
        id: null,
        title: '',
        image: '',
        gridSize: 8,
        answer: '',
        totalTiles: 64,
        revealedTiles: new Set(),
        isComplete: false
    },
    p2: {
        id: null,
        title: '',
        image: '',
        gridSize: 8,
        answer: '',
        totalTiles: 64,
        revealedTiles: new Set(),
        isComplete: false
    },
    match: {
        p1Name: localStorage.getItem('p1_name') || 'Player 1',
        p2Name: localStorage.getItem('p2_name') || 'Player 2',
        p1Score: 0,
        p2Score: 0,
        p1Wins: 0,
        p2Wins: 0,
        turn: 'both', // 'both' | 'p1' | 'p2'
        buzzerLockedBy: null, // null | 'p1' | 'p2'
        pointsCorrect: 100,
        pointsPenalty: 25,
        timerDuration: 60,
        timerRemaining: 60,
        isTimerRunning: false,
        timerId: null,
        hostPeek: false
    }
};

let allAvailableGames = [];
let targetScorePlayer = null; // Used for custom score adjustment modal

// DOM Elements cache
const el = {
    loadingOverlay: document.getElementById('loading-overlay'),
    stageHud: document.getElementById('stage-hud'),
    timerText: document.getElementById('timer-text'),
    btnTimerToggle: document.getElementById('btn-timer-toggle'),
    btnTimerReset: document.getElementById('btn-timer-reset'),
    timerPresetSelect: document.getElementById('timer-preset-select'),
    btnHostPeek: document.getElementById('btn-host-peek'),
    btnOpenPopouts: document.getElementById('btn-open-popouts'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    btnHudToggle: document.getElementById('btn-hud-toggle'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    btnOpenSetup: document.getElementById('btn-open-setup'),

    // Scoreboard
    cardP1: document.getElementById('card-p1'),
    cardP2: document.getElementById('card-p2'),
    p1NameInput: document.getElementById('p1-name-input'),
    p2NameInput: document.getElementById('p2-name-input'),
    p1ScoreVal: document.getElementById('p1-score-val'),
    p2ScoreVal: document.getElementById('p2-score-val'),
    p1ScorePopup: document.getElementById('p1-score-popup'),
    p2ScorePopup: document.getElementById('p2-score-popup'),
    p1Wins: document.getElementById('p1-wins'),
    p2Wins: document.getElementById('p2-wins'),
    btnBuzzer1: document.getElementById('btn-buzzer-1'),
    btnBuzzer2: document.getElementById('btn-buzzer-2'),
    btnP1Correct: document.getElementById('btn-p1-correct'),
    btnP2Correct: document.getElementById('btn-p2-correct'),
    btnP1Wrong: document.getElementById('btn-p1-wrong'),
    btnP2Wrong: document.getElementById('btn-p2-wrong'),
    btnP1Custom: document.getElementById('btn-p1-custom'),
    btnP2Custom: document.getElementById('btn-p2-custom'),
    btnTurnP1: document.getElementById('btn-turn-p1'),
    btnTurnBoth: document.getElementById('btn-turn-both'),
    btnTurnP2: document.getElementById('btn-turn-p2'),
    buzzerStatusBanner: document.getElementById('buzzer-status-banner'),

    // Arena 1
    p1QuestionTitle: document.getElementById('p1-question-title'),
    p1TilesLeft: document.getElementById('p1-tiles-left'),
    p1TilesRev: document.getElementById('p1-tiles-rev'),
    p1TilesPct: document.getElementById('p1-tiles-pct'),
    p1GameBoard: document.getElementById('p1-game-board'),
    p1SolvedBanner: document.getElementById('p1-solved-banner'),
    p1SolvedAnswer: document.getElementById('p1-solved-answer'),
    p1TileInput: document.getElementById('p1-tile-input'),
    btnP1Random: document.getElementById('btn-p1-random'),
    btnP1Reset: document.getElementById('btn-p1-reset'),
    btnP1RevealAll: document.getElementById('btn-p1-reveal-all'),
    btnP1RevealTile: document.getElementById('btn-p1-reveal-tile'),
    btnP1QuickSolve: document.getElementById('btn-p1-quick-solve'),
    btnP1Replay: document.getElementById('btn-p1-replay'),
    btnP1AwardWin: document.getElementById('btn-p1-award-win'),

    // Arena 2
    p2QuestionTitle: document.getElementById('p2-question-title'),
    p2TilesLeft: document.getElementById('p2-tiles-left'),
    p2TilesRev: document.getElementById('p2-tiles-rev'),
    p2TilesPct: document.getElementById('p2-tiles-pct'),
    p2GameBoard: document.getElementById('p2-game-board'),
    p2SolvedBanner: document.getElementById('p2-solved-banner'),
    p2SolvedAnswer: document.getElementById('p2-solved-answer'),
    p2TileInput: document.getElementById('p2-tile-input'),
    btnP2Random: document.getElementById('btn-p2-random'),
    btnP2Reset: document.getElementById('btn-p2-reset'),
    btnP2RevealAll: document.getElementById('btn-p2-reveal-all'),
    btnP2RevealTile: document.getElementById('btn-p2-reveal-tile'),
    btnP2QuickSolve: document.getElementById('btn-p2-quick-solve'),
    btnP2Replay: document.getElementById('btn-p2-replay'),
    btnP2AwardWin: document.getElementById('btn-p2-award-win'),

    // Modals
    matchSetupModal: document.getElementById('match-setup-modal'),
    selectGame1: document.getElementById('select-game-1'),
    selectGame2: document.getElementById('select-game-2'),
    previewImg1: document.getElementById('preview-img-1'),
    previewImg2: document.getElementById('preview-img-2'),
    previewPlaceholder1: document.getElementById('preview-placeholder-1'),
    previewPlaceholder2: document.getElementById('preview-placeholder-2'),
    setupPointsCorrect: document.getElementById('setup-points-correct'),
    setupPointsPenalty: document.getElementById('setup-points-penalty'),
    setupTimerVal: document.getElementById('setup-timer-val'),
    btnCloseSetup: document.getElementById('btn-close-setup'),
    btnCancelSetup: document.getElementById('btn-cancel-setup'),
    btnApplySetup: document.getElementById('btn-apply-setup'),

    popoutsModal: document.getElementById('popouts-modal'),
    btnClosePopouts: document.getElementById('btn-close-popouts'),
    btnDismissPopouts: document.getElementById('btn-dismiss-popouts'),
    btnOpenDispDual: document.getElementById('btn-open-disp-dual'),
    btnOpenDisp1: document.getElementById('btn-open-disp-1'),
    btnOpenDisp2: document.getElementById('btn-open-disp-2'),

    scoreModal: document.getElementById('score-modal'),
    scoreModalTitle: document.getElementById('score-modal-title'),
    customScoreInput: document.getElementById('custom-score-input'),
    btnCloseScoreModal: document.getElementById('btn-close-score-modal'),
    btnCancelScore: document.getElementById('btn-cancel-score'),
    btnApplyScore: document.getElementById('btn-apply-score'),

    championModal: document.getElementById('champion-modal'),
    championName: document.getElementById('champion-name'),
    championSubtext: document.getElementById('champion-subtext'),
    btnResetMatchScores: document.getElementById('btn-reset-match-scores'),
    btnNextMatchPair: document.getElementById('btn-next-match-pair')
};

// Initializer
document.addEventListener('DOMContentLoaded', initDualGame);

async function initDualGame() {
    confetti = new ConfettiEngine(document.getElementById('confetti-canvas'));
    
    // Load player names from memory
    if (el.p1NameInput) el.p1NameInput.value = state.match.p1Name;
    if (el.p2NameInput) el.p2NameInput.value = state.match.p2Name;

    setupEventListeners();
    setupKeyboardShortcuts();

    // Check sound state
    if (el.soundIcon) {
        el.soundIcon.textContent = audio.isMuted ? '🔇' : '🔊';
    }

    try {
        const res = await fetch('/api/games');
        if (!res.ok) throw new Error('Failed to load games');
        allAvailableGames = await res.json();

        if (allAvailableGames.length === 0) {
            el.loadingOverlay.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p style="font-size: 1.35rem; margin-bottom: 1rem; color: var(--brand-amber);">⚠️ No Games Found</p>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Create at least 2 games in Admin Studio first.</p>
                    <a href="/admin/create" class="btn btn-primary">✨ Create Games</a>
                </div>
            `;
            return;
        }

        // Determine which 2 games to load
        const urlParams = new URLSearchParams(window.location.search);
        let g1Id = urlParams.get('game1');
        let g2Id = urlParams.get('game2');

        // Path /dual/:id1/:id2 check
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 3 && pathParts[0] === 'dual') {
            g1Id = pathParts[1];
            g2Id = pathParts[2];
        }

        let g1 = allAvailableGames.find(g => String(g.id) === String(g1Id));
        let g2 = allAvailableGames.find(g => String(g.id) === String(g2Id));

        if (!g1) g1 = allAvailableGames[0];
        if (!g2) g2 = allAvailableGames.length > 1 ? allAvailableGames[1] : allAvailableGames[0];

        loadPair(g1, g2);
        populateSetupModalDropdowns();

        el.loadingOverlay.classList.add('hidden');
    } catch (err) {
        console.error('Dual init error:', err);
        el.loadingOverlay.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="font-size: 1.35rem; margin-bottom: 1rem; color: var(--stage-danger);">⚠️ Failed to initialize match</p>
                <a href="/admin/games" class="btn btn-primary">Back to Games List</a>
            </div>
        `;
    }
}

function loadPair(game1, game2) {
    // Load Board 1 (Player 1)
    state.p1.id = game1.id;
    state.p1.title = game1.title;
    state.p1.image = game1.image;
    state.p1.gridSize = game1.gridSize || 8;
    state.p1.answer = game1.answer || '';
    state.p1.totalTiles = state.p1.gridSize * state.p1.gridSize;
    state.p1.revealedTiles = new Set(game1.revealedTiles || []);
    state.p1.isComplete = false;

    // Load Board 2 (Player 2)
    state.p2.id = game2.id;
    state.p2.title = game2.title;
    state.p2.image = game2.image;
    state.p2.gridSize = game2.gridSize || 8;
    state.p2.answer = game2.answer || '';
    state.p2.totalTiles = state.p2.gridSize * state.p2.gridSize;
    state.p2.revealedTiles = new Set(game2.revealedTiles || []);
    state.p2.isComplete = false;

    renderArena(1);
    renderArena(2);
    updateArenaStats(1);
    updateArenaStats(2);
    renderScoreboard();
    resetTimer(state.match.timerDuration);

    broadcastState();
}

function renderArena(playerNum) {
    const s = playerNum === 1 ? state.p1 : state.p2;
    const boardEl = playerNum === 1 ? el.p1GameBoard : el.p2GameBoard;
    const titleEl = playerNum === 1 ? el.p1QuestionTitle : el.p2QuestionTitle;
    const bannerEl = playerNum === 1 ? el.p1SolvedBanner : el.p2SolvedBanner;
    const dialInput = playerNum === 1 ? el.p1TileInput : el.p2TileInput;

    if (titleEl) titleEl.textContent = s.title;
    if (bannerEl) bannerEl.classList.add('hidden');
    if (dialInput) dialInput.max = s.totalTiles;

    boardEl.innerHTML = '';
    boardEl.style.backgroundImage = `url(${s.image})`;
    boardEl.className = `dual-game-board grid-${s.gridSize}`;

    for (let i = 1; i <= s.totalTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.number = i;
        if (s.revealedTiles.has(i)) {
            tile.classList.add('revealed');
        }

        const span = document.createElement('span');
        span.className = 'tile-number';
        span.textContent = i;
        tile.appendChild(span);

        tile.addEventListener('click', () => revealTile(playerNum, i));
        boardEl.appendChild(tile);
    }
}

function revealTile(playerNum, num) {
    const s = playerNum === 1 ? state.p1 : state.p2;
    if (s.isComplete || num < 1 || num > s.totalTiles || s.revealedTiles.has(num)) return;

    s.revealedTiles.add(num);
    const boardEl = playerNum === 1 ? el.p1GameBoard : el.p2GameBoard;
    const tile = boardEl.querySelector(`.tile[data-number="${num}"]`);
    if (tile) {
        tile.classList.add('revealed');
    }

    audio.playTileReveal(playerNum, s.revealedTiles.size, s.totalTiles);
    updateArenaStats(playerNum);

    if (s.revealedTiles.size >= s.totalTiles) {
        completeBoard(playerNum);
    }

    broadcastState();
}

let isSpinningDual = { 1: false, 2: false };
let revealAllTimeoutsDual = { 1: null, 2: null };

function revealRandomTile(playerNum) {
    const s = playerNum === 1 ? state.p1 : state.p2;
    if (s.isComplete || isSpinningDual[playerNum]) return;

    const unrevealed = [];
    for (let i = 1; i <= s.totalTiles; i++) {
        if (!s.revealedTiles.has(i)) unrevealed.push(i);
    }
    if (unrevealed.length === 0) return;

    isSpinningDual[playerNum] = true;
    let spins = 0;
    const maxSpins = 6;
    const interval = setInterval(() => {
        audio.playSpinTick();
        spins++;
        if (spins >= maxSpins) {
            clearInterval(interval);
            isSpinningDual[playerNum] = false;
            const target = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            revealTile(playerNum, target);
        }
    }, 45);
}

function revealAllTiles(playerNum) {
    const s = playerNum === 1 ? state.p1 : state.p2;
    if (s.isComplete) return;

    if (revealAllTimeoutsDual[playerNum]) {
        clearTimeout(revealAllTimeoutsDual[playerNum]);
    }

    const boardEl = playerNum === 1 ? el.p1GameBoard : el.p2GameBoard;
    for (let i = 1; i <= s.totalTiles; i++) {
        if (!s.revealedTiles.has(i)) {
            s.revealedTiles.add(i);
            const tile = boardEl.querySelector(`.tile[data-number="${i}"]`);
            if (tile) {
                setTimeout(() => tile.classList.add('revealed'), Math.random() * 350);
            }
        }
    }
    revealAllTimeoutsDual[playerNum] = setTimeout(() => {
        revealAllTimeoutsDual[playerNum] = null;
        updateArenaStats(playerNum);
        completeBoard(playerNum);
        broadcastState();
    }, 380);
}

function resetBoard(playerNum) {
    if (revealAllTimeoutsDual[playerNum]) {
        clearTimeout(revealAllTimeoutsDual[playerNum]);
        revealAllTimeoutsDual[playerNum] = null;
    }
    isSpinningDual[playerNum] = false;

    audio.playResetWhoosh();
    const s = playerNum === 1 ? state.p1 : state.p2;
    s.revealedTiles.clear();
    s.isComplete = false;
    renderArena(playerNum);
    updateArenaStats(playerNum);
    broadcastState();
}

function updateArenaStats(playerNum) {
    const s = playerNum === 1 ? state.p1 : state.p2;
    const revCount = s.revealedTiles.size;
    const leftCount = Math.max(0, s.totalTiles - revCount);
    const pct = Math.round((revCount / s.totalTiles) * 100);

    if (playerNum === 1) {
        if (el.p1TilesLeft) el.p1TilesLeft.textContent = leftCount;
        if (el.p1TilesRev) el.p1TilesRev.textContent = revCount;
        if (el.p1TilesPct) el.p1TilesPct.textContent = `${pct}%`;
    } else {
        if (el.p2TilesLeft) el.p2TilesLeft.textContent = leftCount;
        if (el.p2TilesRev) el.p2TilesRev.textContent = revCount;
        if (el.p2TilesPct) el.p2TilesPct.textContent = `${pct}%`;
    }
}

async function completeBoard(playerNum) {
    const s = playerNum === 1 ? state.p1 : state.p2;
    s.isComplete = true;

    // Ensure all tiles are visibly flipped
    const boardEl = playerNum === 1 ? el.p1GameBoard : el.p2GameBoard;
    boardEl.querySelectorAll('.tile').forEach(t => t.classList.add('revealed'));

    const bannerEl = playerNum === 1 ? el.p1SolvedBanner : el.p2SolvedBanner;
    const ansTextEl = playerNum === 1 ? el.p1SolvedAnswer : el.p2SolvedAnswer;

    // Securely fetch answer if not yet loaded
    if (!s.answer && s.id) {
        try {
            const ansRes = await fetch(`/api/games/${s.id}/answer`);
            if (ansRes.ok) {
                const ansData = await ansRes.json();
                s.answer = ansData.answer || '';
            }
        } catch (e) {
            console.warn('Could not fetch revealed answer:', e);
        }
    }

    if (ansTextEl) ansTextEl.textContent = s.answer || '🎉 Solved!';
    if (bannerEl) bannerEl.classList.remove('hidden');

    audio.playVictoryFanfare();
    confetti.burst();
}

// ==========================================================================
// SCORING ENGINE & CONTROLS
// ==========================================================================

function adjustScore(playerNum, delta) {
    if (delta > 0) {
        audio.playScoreGain();
    } else if (delta < 0) {
        audio.playScorePenalty();
    }

    if (playerNum === 1) {
        state.match.p1Score = Math.max(0, state.match.p1Score + delta);
        showScorePopup(1, delta);
    } else {
        state.match.p2Score = Math.max(0, state.match.p2Score + delta);
        showScorePopup(2, delta);
    }

    renderScoreboard();
    broadcastState();
}

function showScorePopup(playerNum, delta) {
    const popupEl = playerNum === 1 ? el.p1ScorePopup : el.p2ScorePopup;
    if (!popupEl) return;

    popupEl.textContent = (delta >= 0 ? `+${delta}` : `${delta}`);
    popupEl.className = `score-delta-popup ${delta >= 0 ? 'positive' : 'negative'}`;

    // Re-trigger animation
    void popupEl.offsetWidth;
}

function awardWin(playerNum) {
    if (playerNum === 1) {
        state.match.p1Wins++;
        adjustScore(1, state.match.pointsCorrect);
    } else {
        state.match.p2Wins++;
        adjustScore(2, state.match.pointsCorrect);
    }

    renderScoreboard();
    confetti.burst();
    audio.playVictoryFanfare();

    // Check if match threshold reached (e.g., best of 3 or 5)
    if (state.match.p1Wins >= 3 || state.match.p2Wins >= 3) {
        showChampionCelebration(state.match.p1Wins >= 3 ? 1 : 2);
    }

    broadcastState();
}

function triggerBuzzer(playerNum) {
    if (state.match.buzzerLockedBy) return; // Already locked

    state.match.buzzerLockedBy = playerNum;
    audio.playBuzzer(playerNum);

    const playerName = playerNum === 1 ? state.match.p1Name : state.match.p2Name;
    if (el.buzzerStatusBanner) {
        el.buzzerStatusBanner.innerHTML = `<span>🔔 ${escapeHtml(playerName)} BUZZED IN!</span>`;
        el.buzzerStatusBanner.className = `buzzer-alert-banner buzzed-p${playerNum}`;
    }

    // Set active turn highlight
    setTurn(playerNum === 1 ? 'p1' : 'p2');

    broadcastState();

    // Auto-release buzzer lock after 4 seconds if not reset
    setTimeout(() => {
        if (state.match.buzzerLockedBy === playerNum) {
            clearBuzzerLock();
        }
    }, 4500);
}

function clearBuzzerLock() {
    state.match.buzzerLockedBy = null;
    if (el.buzzerStatusBanner) {
        el.buzzerStatusBanner.innerHTML = `<span>🔔 Buzzers Active</span>`;
        el.buzzerStatusBanner.className = 'buzzer-alert-banner';
    }
    broadcastState();
}

function setTurn(turnMode) {
    state.match.turn = turnMode;

    el.btnTurnP1?.classList.toggle('active', turnMode === 'p1');
    el.btnTurnBoth?.classList.toggle('active', turnMode === 'both');
    el.btnTurnP2?.classList.toggle('active', turnMode === 'p2');

    el.cardP1?.classList.toggle('active-turn', turnMode === 'p1');
    el.cardP2?.classList.toggle('active-turn', turnMode === 'p2');

    broadcastState();
}

function renderScoreboard() {
    if (el.p1ScoreVal) el.p1ScoreVal.textContent = state.match.p1Score;
    if (el.p2ScoreVal) el.p2ScoreVal.textContent = state.match.p2Score;

    if (el.p1Wins) {
        el.p1Wins.textContent = '★'.repeat(state.match.p1Wins) + '☆'.repeat(Math.max(0, 3 - state.match.p1Wins));
    }
    if (el.p2Wins) {
        el.p2Wins.textContent = '★'.repeat(state.match.p2Wins) + '☆'.repeat(Math.max(0, 3 - state.match.p2Wins));
    }
}

function showChampionCelebration(winnerNum) {
    const winnerName = winnerNum === 1 ? state.match.p1Name : state.match.p2Name;
    if (el.championName) el.championName.textContent = `${winnerName.toUpperCase()} WINS! 👑`;
    if (el.championSubtext) {
        el.championSubtext.textContent = `Final Match Score: ${state.match.p1Score} pts (${state.match.p1Name}) vs ${state.match.p2Score} pts (${state.match.p2Name})`;
    }
    el.championModal?.classList.remove('hidden');
    confetti.burst();
}

// ==========================================================================
// MATCH COUNTDOWN TIMER
// ==========================================================================

function initTimer(duration = 60) {
    state.match.timerDuration = duration;
    state.match.timerRemaining = duration;
    updateTimerDisplay();
}

function toggleTimer() {
    if (state.match.isTimerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (state.match.isTimerRunning) return;
    state.match.isTimerRunning = true;
    if (el.btnTimerToggle) el.btnTimerToggle.textContent = '⏸';

    state.match.timerId = setInterval(() => {
        state.match.timerRemaining--;
        updateTimerDisplay();

        const isPanic = state.match.timerRemaining <= 10;
        audio.playTimerTick(isPanic);

        if (state.match.timerRemaining <= 0) {
            pauseTimer();
            audio.playScorePenalty();
            if (el.timerText) el.timerText.textContent = "0s TIME!";
        }
        broadcastState();
    }, 1000);

    broadcastState();
}

function pauseTimer() {
    state.match.isTimerRunning = false;
    clearInterval(state.match.timerId);
    if (el.btnTimerToggle) el.btnTimerToggle.textContent = '▶';
    broadcastState();
}

function resetTimer(newDuration) {
    pauseTimer();
    const duration = newDuration || parseInt(el.timerPresetSelect?.value || '60', 10);
    initTimer(duration);
    broadcastState();
}

function updateTimerDisplay() {
    if (!el.timerText) return;
    el.timerText.textContent = `${state.match.timerRemaining}s`;
    el.timerText.classList.toggle('panic', state.match.timerRemaining <= 10 && state.match.timerRemaining > 0);
}

// ==========================================================================
// MULTI-SCREEN & PROJECTOR BROADCAST MIRRORING
// ==========================================================================

function broadcastState() {
    const payload = {
        type: 'DUAL_SYNC',
        p1: {
            id: state.p1.id,
            title: state.p1.title,
            image: state.p1.image,
            gridSize: state.p1.gridSize,
            totalTiles: state.p1.totalTiles,
            revealedTiles: Array.from(state.p1.revealedTiles),
            isComplete: state.p1.isComplete
        },
        p2: {
            id: state.p2.id,
            title: state.p2.title,
            image: state.p2.image,
            gridSize: state.p2.gridSize,
            totalTiles: state.p2.totalTiles,
            revealedTiles: Array.from(state.p2.revealedTiles),
            isComplete: state.p2.isComplete
        },
        match: {
            p1Name: state.match.p1Name,
            p2Name: state.match.p2Name,
            p1Score: state.match.p1Score,
            p2Score: state.match.p2Score,
            p1Wins: state.match.p1Wins,
            p2Wins: state.match.p2Wins,
            turn: state.match.turn,
            buzzerLockedBy: state.match.buzzerLockedBy,
            timerRemaining: state.match.timerRemaining,
            isTimerRunning: state.match.isTimerRunning
        }
    };

    if (broadcastChan) {
        broadcastChan.postMessage(payload);
    }
    // LocalStorage fallback for separate browser contexts
    localStorage.setItem('stage_dual_sync_payload', JSON.stringify({ ...payload, timestamp: Date.now() }));
}

function openPopoutDisplay(target) {
    const url = `/display/${target}`;
    const windowFeatures = 'toolbar=no,menubar=no,location=no,status=no,width=1280,height=720,scrollbars=no,resizable=yes';
    window.open(url, `StageDisplay_${target}`, windowFeatures);
    el.popoutsModal?.classList.add('hidden');
}

// ==========================================================================
// EVENT LISTENERS & SHORTCUTS
// ==========================================================================

function setupEventListeners() {
    // Timer controls
    el.btnTimerToggle?.addEventListener('click', toggleTimer);
    el.btnTimerReset?.addEventListener('click', () => resetTimer());
    el.timerPresetSelect?.addEventListener('change', (e) => resetTimer(parseInt(e.target.value, 10)));

    // HUD Actions
    el.btnSoundToggle?.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        if (el.soundIcon) el.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    el.btnHudToggle?.addEventListener('click', () => {
        el.stageHud?.classList.toggle('hud-hidden');
    });

    el.btnFullscreen?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    // Scoreboard Buzzers & Point Buttons
    el.btnBuzzer1?.addEventListener('click', () => triggerBuzzer(1));
    el.btnBuzzer2?.addEventListener('click', () => triggerBuzzer(2));

    el.btnP1Correct?.addEventListener('click', () => {
        adjustScore(1, state.match.pointsCorrect);
        clearBuzzerLock();
    });
    el.btnP2Correct?.addEventListener('click', () => {
        adjustScore(2, state.match.pointsCorrect);
        clearBuzzerLock();
    });

    el.btnP1Wrong?.addEventListener('click', () => {
        adjustScore(1, -state.match.pointsPenalty);
        clearBuzzerLock();
    });
    el.btnP2Wrong?.addEventListener('click', () => {
        adjustScore(2, -state.match.pointsPenalty);
        clearBuzzerLock();
    });

    el.btnP1Custom?.addEventListener('click', () => openScoreModal(1));
    el.btnP2Custom?.addEventListener('click', () => openScoreModal(2));

    // Turn switcher
    el.btnTurnP1?.addEventListener('click', () => setTurn('p1'));
    el.btnTurnBoth?.addEventListener('click', () => setTurn('both'));
    el.btnTurnP2?.addEventListener('click', () => setTurn('p2'));

    // Player name edits
    el.p1NameInput?.addEventListener('change', (e) => {
        state.match.p1Name = e.target.value.trim() || 'Player 1';
        localStorage.setItem('p1_name', state.match.p1Name);
        broadcastState();
    });
    el.p2NameInput?.addEventListener('change', (e) => {
        state.match.p2Name = e.target.value.trim() || 'Player 2';
        localStorage.setItem('p2_name', state.match.p2Name);
        broadcastState();
    });

    // Arena 1 Controls
    el.btnP1Random?.addEventListener('click', () => revealRandomTile(1));
    el.btnP1Reset?.addEventListener('click', () => resetBoard(1));
    el.btnP1RevealAll?.addEventListener('click', () => revealAllTiles(1));
    el.btnP1RevealTile?.addEventListener('click', () => {
        const num = parseInt(el.p1TileInput?.value, 10);
        if (num) {
            revealTile(1, num);
            if (el.p1TileInput) el.p1TileInput.value = '';
        }
    });
    el.p1TileInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const num = parseInt(el.p1TileInput.value, 10);
            if (num) {
                revealTile(1, num);
                el.p1TileInput.value = '';
            }
        }
    });
    el.btnP1QuickSolve?.addEventListener('click', () => {
        completeBoard(1);
        awardWin(1);
    });
    el.btnP1Replay?.addEventListener('click', () => resetBoard(1));
    el.btnP1AwardWin?.addEventListener('click', () => awardWin(1));

    // Arena 2 Controls
    el.btnP2Random?.addEventListener('click', () => revealRandomTile(2));
    el.btnP2Reset?.addEventListener('click', () => resetBoard(2));
    el.btnP2RevealAll?.addEventListener('click', () => revealAllTiles(2));
    el.btnP2RevealTile?.addEventListener('click', () => {
        const num = parseInt(el.p2TileInput?.value, 10);
        if (num) {
            revealTile(2, num);
            if (el.p2TileInput) el.p2TileInput.value = '';
        }
    });
    el.p2TileInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const num = parseInt(el.p2TileInput.value, 10);
            if (num) {
                revealTile(2, num);
                el.p2TileInput.value = '';
            }
        }
    });
    el.btnP2QuickSolve?.addEventListener('click', () => {
        completeBoard(2);
        awardWin(2);
    });
    el.btnP2Replay?.addEventListener('click', () => resetBoard(2));
    el.btnP2AwardWin?.addEventListener('click', () => awardWin(2));

    // Modal dialogs
    el.btnOpenSetup?.addEventListener('click', () => el.matchSetupModal?.classList.remove('hidden'));
    el.btnCloseSetup?.addEventListener('click', () => el.matchSetupModal?.classList.add('hidden'));
    el.btnCancelSetup?.addEventListener('click', () => el.matchSetupModal?.classList.add('hidden'));
    el.btnApplySetup?.addEventListener('click', applyMatchSetup);

    el.selectGame1?.addEventListener('change', (e) => updateSetupPreview(1, e.target.value));
    el.selectGame2?.addEventListener('change', (e) => updateSetupPreview(2, e.target.value));

    el.btnOpenPopouts?.addEventListener('click', () => el.popoutsModal?.classList.remove('hidden'));
    el.btnClosePopouts?.addEventListener('click', () => el.popoutsModal?.classList.add('hidden'));
    el.btnDismissPopouts?.addEventListener('click', () => el.popoutsModal?.classList.add('hidden'));

    el.btnOpenDispDual?.addEventListener('click', () => openPopoutDisplay('dual'));
    el.btnOpenDisp1?.addEventListener('click', () => openPopoutDisplay('1'));
    el.btnOpenDisp2?.addEventListener('click', () => openPopoutDisplay('2'));

    // Score adjust modal
    el.btnCloseScoreModal?.addEventListener('click', () => el.scoreModal?.classList.add('hidden'));
    el.btnCancelScore?.addEventListener('click', () => el.scoreModal?.classList.add('hidden'));
    el.btnApplyScore?.addEventListener('click', applyCustomScore);

    // Champion Modal
    el.btnResetMatchScores?.addEventListener('click', () => {
        state.match.p1Score = 0;
        state.match.p2Score = 0;
        state.match.p1Wins = 0;
        state.match.p2Wins = 0;
        renderScoreboard();
        el.championModal?.classList.add('hidden');
        broadcastState();
    });
    el.btnNextMatchPair?.addEventListener('click', () => {
        el.championModal?.classList.add('hidden');
        el.matchSetupModal?.classList.remove('hidden');
    });
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // Skip if typing in an input
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

        const key = e.key.toLowerCase();
        if (key === '1') {
            triggerBuzzer(1);
        } else if (key === '2') {
            triggerBuzzer(2);
        } else if (key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (state.match.turn === 'p1') revealRandomTile(1);
            else if (state.match.turn === 'p2') revealRandomTile(2);
            else {
                revealRandomTile(1);
                revealRandomTile(2);
            }
        } else if (key === 't') {
            toggleTimer();
        } else if (key === 'm') {
            el.btnSoundToggle?.click();
        } else if (key === 'h') {
            el.stageHud?.classList.toggle('hud-hidden');
        } else if (key === 'f') {
            el.btnFullscreen?.click();
        }
    });
}

// Setup Modal helpers
function populateSetupModalDropdowns() {
    if (!el.selectGame1 || !el.selectGame2) return;

    const optionsHtml = allAvailableGames.map(g => `
        <option value="${g.id}">${escapeHtml(g.title)} (${g.gridSize}×${g.gridSize})</option>
    `).join('');

    el.selectGame1.innerHTML = optionsHtml;
    el.selectGame2.innerHTML = optionsHtml;

    if (state.p1.id) el.selectGame1.value = state.p1.id;
    if (state.p2.id) el.selectGame2.value = state.p2.id;

    updateSetupPreview(1, el.selectGame1.value);
    updateSetupPreview(2, el.selectGame2.value);
}

function updateSetupPreview(pickerNum, gameId) {
    const game = allAvailableGames.find(g => String(g.id) === String(gameId));
    const imgEl = pickerNum === 1 ? el.previewImg1 : el.previewImg2;
    const placeholderEl = pickerNum === 1 ? el.previewPlaceholder1 : el.previewPlaceholder2;

    if (game && game.image) {
        if (imgEl) {
            imgEl.src = game.image;
            imgEl.style.display = 'block';
        }
        if (placeholderEl) placeholderEl.style.display = 'none';
    } else {
        if (imgEl) imgEl.style.display = 'none';
        if (placeholderEl) placeholderEl.style.display = 'block';
    }
}

function applyMatchSetup() {
    const g1Id = el.selectGame1?.value;
    const g2Id = el.selectGame2?.value;
    const g1 = allAvailableGames.find(g => String(g.id) === String(g1Id));
    const g2 = allAvailableGames.find(g => String(g.id) === String(g2Id));

    if (g1 && g2) {
        state.match.pointsCorrect = parseInt(el.setupPointsCorrect?.value || '100', 10);
        state.match.pointsPenalty = parseInt(el.setupPointsPenalty?.value || '25', 10);
        const timerVal = parseInt(el.setupTimerVal?.value || '60', 10);
        state.match.timerDuration = timerVal;

        loadPair(g1, g2);
        el.matchSetupModal?.classList.add('hidden');
    }
}

function openScoreModal(playerNum) {
    targetScorePlayer = playerNum;
    const playerName = playerNum === 1 ? state.match.p1Name : state.match.p2Name;
    if (el.scoreModalTitle) el.scoreModalTitle.textContent = `Adjust Score: ${playerName}`;
    el.scoreModal?.classList.remove('hidden');
}

function applyCustomScore() {
    const delta = parseInt(el.customScoreInput?.value || '0', 10);
    if (targetScorePlayer && delta !== 0) {
        adjustScore(targetScorePlayer, delta);
    }
    el.scoreModal?.classList.add('hidden');
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

// Anti-cheat: Prevent console access to game answers
(function() {
    Object.defineProperty(window, 'state', {
        get: function() { return undefined; },
        set: function() {},
        configurable: false
    });
    Object.defineProperty(window, 'gameState', {
        get: function() { return undefined; },
        set: function() {},
        configurable: false
    });
})();
