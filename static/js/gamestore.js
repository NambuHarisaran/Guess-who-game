/**
 * Stage Guess Reveal Game - Unified Client-Side GameStore
 * Eliminates the need for any backend server, databases, or cloud storage.
 * Stores games & image assets reliably in IndexedDB with LocalStorage fallback.
 */

(function(window) {
    'use strict';

    const DB_NAME = 'StageGuessGameDB';
    const DB_VERSION = 1;
    const STORE_GAMES = 'custom_games';
    const STORE_OVERRIDES = 'game_overrides';

    let dbInstance = null;
    let initialBundledGames = null;

    // Initialize IndexedDB
    function openDB() {
        if (dbInstance) return Promise.resolve(dbInstance);

        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported, using LocalStorage fallback');
                return resolve(null);
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_GAMES)) {
                    db.createObjectStore(STORE_GAMES, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_OVERRIDES)) {
                    db.createObjectStore(STORE_OVERRIDES, { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                dbInstance = e.target.result;
                resolve(dbInstance);
            };

            request.onerror = (e) => {
                console.error('IndexedDB open error:', e);
                resolve(null); // Fallback to localStorage
            };
        });
    }

    // Generic IndexedDB operations
    async function idbGetAll(storeName) {
        const db = await openDB();
        if (!db) {
            try {
                return JSON.parse(localStorage.getItem(storeName) || '[]');
            } catch (e) {
                return [];
            }
        }
        return new Promise((resolve) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    }

    async function idbGet(storeName, key) {
        const db = await openDB();
        if (!db) {
            try {
                const items = JSON.parse(localStorage.getItem(storeName) || '[]');
                return items.find(i => String(i.id) === String(key)) || null;
            } catch (e) {
                return null;
            }
        }
        return new Promise((resolve) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    }

    async function idbPut(storeName, val) {
        const db = await openDB();
        if (!db) {
            try {
                let items = JSON.parse(localStorage.getItem(storeName) || '[]');
                const idx = items.findIndex(i => String(i.id) === String(val.id));
                if (idx >= 0) items[idx] = val;
                else items.push(val);
                localStorage.setItem(storeName, JSON.stringify(items));
            } catch (e) {
                console.error('LocalStorage write error:', e);
            }
            return val;
        }
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(val);
            req.onsuccess = () => resolve(val);
            req.onerror = (e) => reject(e);
        });
    }

    async function idbDelete(storeName, key) {
        const db = await openDB();
        if (!db) {
            try {
                let items = JSON.parse(localStorage.getItem(storeName) || '[]');
                items = items.filter(i => String(i.id) !== String(key));
                localStorage.setItem(storeName, JSON.stringify(items));
            } catch (e) {}
            return true;
        }
        return new Promise((resolve) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolve(true);
            req.onerror = () => resolve(false);
        });
    }

    // Load bundled default games from /data/games.json
    async function loadBundledGames() {
        if (initialBundledGames) return initialBundledGames;
        try {
            const res = await fetch('/data/games.json');
            if (res.ok) {
                initialBundledGames = await res.json();
                return initialBundledGames;
            }
        } catch (e) {
            console.warn('Could not fetch /data/games.json:', e);
        }
        initialBundledGames = [];
        return initialBundledGames;
    }

    // Generate unique ID
    function generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'game-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    }

    // Public GameStore API
    const GameStore = {
        /**
         * Get all active games (bundled + custom, with overrides applied, excluding deleted)
         */
        async getAllGames() {
            const [bundled, custom, overrides] = await Promise.all([
                loadBundledGames(),
                idbGetAll(STORE_GAMES),
                idbGetAll(STORE_OVERRIDES)
            ]);

            const overrideMap = new Map(overrides.map(o => [String(o.id), o]));

            // Process bundled games
            const processedBundled = [];
            for (const bg of bundled) {
                const ov = overrideMap.get(String(bg.id));
                if (ov && ov.isDeleted) continue; // Deleted
                processedBundled.push({
                    ...bg,
                    ...(ov || {})
                });
            }

            // Process custom games
            const processedCustom = [];
            for (const cg of custom) {
                const ov = overrideMap.get(String(cg.id));
                if (ov && ov.isDeleted) continue;
                processedCustom.push({
                    ...cg,
                    ...(ov || {})
                });
            }

            // Combine and sort by createdAt descending (newest first)
            const all = [...processedCustom, ...processedBundled];
            all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            return all;
        },

        /**
         * Get a single game by ID
         */
        async getGameById(id) {
            if (!id) return null;
            const strId = String(id);

            // Check custom store first
            const custom = await idbGet(STORE_GAMES, strId);
            const override = await idbGet(STORE_OVERRIDES, strId);

            if (override && override.isDeleted) return null;

            if (custom) {
                return { ...custom, ...(override || {}) };
            }

            // Check bundled games
            const bundled = await loadBundledGames();
            const bg = bundled.find(g => String(g.id) === strId);
            if (bg) {
                return { ...bg, ...(override || {}) };
            }

            return null;
        },

        /**
         * Create a new game with uploaded or URL image
         */
        async createGame({ title, category = 'General', image, gridSize = 8, answer }) {
            const newGame = {
                id: generateId(),
                title: String(title).trim(),
                category: String(category),
                image: image, // Data URL or URL string
                gridSize: parseInt(gridSize, 10) || 8,
                answer: String(answer).trim(),
                revealedTiles: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await idbPut(STORE_GAMES, newGame);
            return newGame;
        },

        /**
         * Update an existing game (title, answer, gridSize, image, etc.)
         */
        async updateGame(id, updates) {
            const strId = String(id);
            const existing = await this.getGameById(strId);
            if (!existing) throw new Error('Game not found');

            const isCustom = !!(await idbGet(STORE_GAMES, strId));

            const updatedData = {
                ...updates,
                updatedAt: new Date().toISOString()
            };

            if (isCustom) {
                const fullCustom = { ...existing, ...updatedData };
                await idbPut(STORE_GAMES, fullCustom);
                return fullCustom;
            } else {
                // Bundled game: save override
                const currentOv = (await idbGet(STORE_OVERRIDES, strId)) || { id: strId };
                const newOv = { ...currentOv, ...updatedData };
                await idbPut(STORE_OVERRIDES, newOv);
                return { ...existing, ...newOv };
            }
        },

        /**
         * Delete a game
         */
        async deleteGame(id) {
            const strId = String(id);
            const isCustom = !!(await idbGet(STORE_GAMES, strId));

            if (isCustom) {
                await idbDelete(STORE_GAMES, strId);
                await idbDelete(STORE_OVERRIDES, strId);
            } else {
                // Mark bundled game as deleted in overrides
                await idbPut(STORE_OVERRIDES, { id: strId, isDeleted: true });
            }
            return true;
        },

        /**
         * Reset revealed tiles of a game back to unrevealed state
         */
        async resetGameProgress(id) {
            return this.updateGame(id, { revealedTiles: [] });
        },

        /**
         * Save game progress (revealed tiles array)
         */
        async saveGameProgress(id, revealedTiles) {
            return this.updateGame(id, { revealedTiles: Array.from(revealedTiles) });
        },

        /**
         * Export all games as JSON backup
         */
        async exportBackup() {
            const all = await this.getAllGames();
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(all, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `stage_guess_games_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        },

        /**
         * Import games from JSON string
         */
        async importBackup(jsonString) {
            const parsed = JSON.parse(jsonString);
            if (!Array.isArray(parsed)) throw new Error('Invalid backup format: expected array');

            for (const item of parsed) {
                if (item.title && item.image && item.answer) {
                    await idbPut(STORE_GAMES, {
                        ...item,
                        id: item.id || generateId(),
                        createdAt: item.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            }
            return true;
        }
    };

    window.GameStore = GameStore;
})(window);
