/**
 * Game Controller
 * 
 * Handles all business logic for game management:
 * - CRUD operations for games
 * - Cloudinary image storage
 * - In-memory fallback for serverless environments
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// Path to games data file
const GAMES_FILE = path.join(__dirname, '../data/games.json');

// In-memory cache for serverless environments
let gamesCache = null;

/**
 * Helper function to read games from JSON file or cache
 * @returns {Array} Array of game objects
 */
const readGames = () => {
    // Try to read from file first
    try {
        const data = fs.readFileSync(GAMES_FILE, 'utf8');
        const games = JSON.parse(data);
        gamesCache = games; // Update cache
        return games;
    } catch (error) {
        console.log('Using in-memory cache (filesystem unavailable)');
        // Return cache if file read fails
        if (gamesCache !== null) {
            return gamesCache;
        }
        return [];
    }
};

/**
 * Helper function to write games to JSON file or cache
 * @param {Array} games - Array of game objects to save
 */
const writeGames = (games) => {
    // Always update cache
    gamesCache = games;
    
    // Try to write to file (will fail on Vercel but that's ok)
    try {
        fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));
    } catch (error) {
        console.log('Filesystem write failed, using in-memory cache only');
        // On serverless, we rely on the cache
    }
};



/**
 * Get all games
 * GET /api/games
 */
exports.getAllGames = (req, res) => {
    try {
        const games = readGames();
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve games' });
    }
};

/**
 * Get a specific game by ID
 * GET /api/games/:id
 */
exports.getGameById = (req, res) => {
    try {
        const games = readGames();
        const game = games.find(g => g.id === req.params.id);
        
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve game' });
    }
};

/**
 * Create a new game
 * POST /api/games
 * 
 * Request body (multipart/form-data):
 * - image: Image file
 * - imageData: Base64 string (alternative to file)
 * - gridSize: Number (6, 8, or 10)
 * - answer: String (correct answer)
 * - title: String (optional game title)
 */
exports.createGame = async (req, res) => {
    try {
        const { gridSize, answer, title } = req.body;
        
        // Check for image file
        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }
        
        if (!gridSize || !answer) {
            return res.status(400).json({ error: 'Grid size and answer are required' });
        }
        
        // Validate grid size
        const validGridSizes = [6, 8, 10];
        const parsedGridSize = parseInt(gridSize);
        
        if (!validGridSizes.includes(parsedGridSize)) {
            return res.status(400).json({ error: 'Invalid grid size. Must be 6, 8, or 10' });
        }
        
        // Upload image to Cloudinary
        let imageUrl;
        try {
            imageUrl = await uploadImage(req.file.buffer, req.file.mimetype);
        } catch (e) {
            console.error('Error uploading to Cloudinary:', e);
            return res.status(500).json({ error: 'Failed to upload image' });
        }
        
        // Create new game object
        const newGame = {
            id: uuidv4(),
            title: title || `Game ${Date.now()}`,
            image: imageUrl,
            gridSize: parsedGridSize,
            answer: answer.trim(),
            createdAt: new Date().toISOString(),
            revealedTiles: []
        };
        
        // Save game to file
        const games = readGames();
        games.push(newGame);
        writeGames(games);
        
        res.status(201).json(newGame);
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Failed to create game' });
    }
};

/**
 * Update an existing game
 * PUT /api/games/:id
 */
exports.updateGame = async (req, res) => {
    try {
        const games = readGames();
        const gameIndex = games.findIndex(g => g.id === req.params.id);
        
        if (gameIndex === -1) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const { gridSize, answer, title, revealedTiles } = req.body;
        
        // Update game fields
        if (title) games[gameIndex].title = title;
        if (answer) games[gameIndex].answer = answer.trim();
        if (gridSize) {
            const parsedGridSize = parseInt(gridSize);
            if ([6, 8, 10].includes(parsedGridSize)) {
                games[gameIndex].gridSize = parsedGridSize;
            }
        }
        
        // Update revealed tiles if provided
        if (revealedTiles !== undefined) {
            try {
                games[gameIndex].revealedTiles = typeof revealedTiles === 'string' 
                    ? JSON.parse(revealedTiles) 
                    : revealedTiles;
            } catch (e) {
                games[gameIndex].revealedTiles = revealedTiles;
            }
        }
        
        // Update image if new one uploaded
        if (req.file) {
            try {
                // Delete old image from Cloudinary
                if (games[gameIndex].image && games[gameIndex].image.includes('cloudinary')) {
                    await deleteImage(games[gameIndex].image);
                }
                // Upload new image
                games[gameIndex].image = await uploadImage(req.file.buffer, req.file.mimetype);
            } catch (e) {
                console.error('Error updating image on Cloudinary:', e);
            }
        }
        
        games[gameIndex].updatedAt = new Date().toISOString();
        writeGames(games);
        
        res.json(games[gameIndex]);
    } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ error: 'Failed to update game' });
    }
};

/**
 * Delete a game
 * DELETE /api/games/:id
 */
exports.deleteGame = async (req, res) => {
    try {
        const games = readGames();
        const gameIndex = games.findIndex(g => g.id === req.params.id);
        
        if (gameIndex === -1) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        // Delete image from Cloudinary
        if (games[gameIndex].image && games[gameIndex].image.includes('cloudinary')) {
            await deleteImage(games[gameIndex].image);
        }
        
        // Remove game from array
        const deletedGame = games.splice(gameIndex, 1)[0];
        writeGames(games);
        
        res.json({ message: 'Game deleted successfully', game: deletedGame });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'Failed to delete game' });
    }
};
