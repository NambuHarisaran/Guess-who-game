/**
 * Game Controller
 * 
 * Handles all business logic for game management:
 * - CRUD operations for games
 * - Image storage (Cloudinary or local /uploads)
 * - Persistent database (Supabase or local backend/data/games.json)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { supabase } = require('../config/supabase');

const dataDir = path.join(__dirname, '../data');
const gamesFile = path.join(dataDir, 'games.json');
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure local directories exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(gamesFile)) {
    fs.writeFileSync(gamesFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const isCloudinaryConfigured = () => {
    return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
};

const isSupabaseConfigured = () => {
    return Boolean(supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
};

const readLocalGames = () => {
    try {
        if (!fs.existsSync(gamesFile)) {
            return [];
        }
        const data = fs.readFileSync(gamesFile, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('Error reading games.json:', err);
        return [];
    }
};

const writeLocalGames = (games) => {
    try {
        fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing games.json:', err);
        throw err;
    }
};

const saveLocalImage = (buffer, originalname) => {
    const ext = path.extname(originalname) || '.jpg';
    const filename = `${Date.now()}-${uuidv4()}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
};

const deleteLocalImage = (imageUrl) => {
    try {
        if (imageUrl && imageUrl.startsWith('/uploads/')) {
            const filename = path.basename(imageUrl);
            const filePath = path.join(uploadsDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (err) {
        console.error('Error deleting local image:', err);
    }
};

/**
 * Get all games
 * GET /api/games
 */
exports.getAllGames = async (req, res) => {
    try {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            const isAdmin = req.query.admin === 'true';
            const games = data.map(game => {
                const g = {
                    id: game.id,
                    title: game.title,
                    image: game.image,
                    gridSize: game.grid_size,
                    revealedTiles: game.revealed_tiles || [],
                    createdAt: game.created_at,
                    updatedAt: game.updated_at
                };
                if (isAdmin) g.answer = game.answer;
                return g;
            });
            return res.json(games);
        }

        // Local storage mode
        const games = readLocalGames();
        games.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const isAdminLocal = req.query.admin === 'true';
        if (!isAdminLocal) {
            const sanitized = games.map(g => {
                const { answer, ...rest } = g;
                return rest;
            });
            return res.json(sanitized);
        }
        res.json(games);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to retrieve games' });
    }
};

/**
 * Get a specific game by ID
 * GET /api/games/:id
 */
exports.getGameById = async (req, res) => {
    try {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('id', req.params.id)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Game not found' });
                }
                throw error;
            }
            
            const game = {
                id: data.id,
                title: data.title,
                image: data.image,
                gridSize: data.grid_size,
                revealedTiles: data.revealed_tiles || [],
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            if (req.query.admin === 'true') game.answer = data.answer;
            return res.json(game);
        }

        // Local storage mode
        const games = readLocalGames();
        const game = games.find(g => String(g.id) === String(req.params.id));
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        if (req.query.admin !== 'true') {
            const { answer, ...safeGame } = game;
            return res.json(safeGame);
        }
        res.json(game);
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Failed to retrieve game' });
    }
};

/**
 * Create a new game
 * POST /api/games
 */
exports.createGame = async (req, res) => {
    try {
        const { gridSize, answer, title } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }
        
        if (!gridSize || !answer) {
            return res.status(400).json({ error: 'Grid size and answer are required' });
        }
        
        const validGridSizes = [6, 8, 10];
        const parsedGridSize = parseInt(gridSize);
        
        if (!validGridSizes.includes(parsedGridSize)) {
            return res.status(400).json({ error: 'Invalid grid size. Must be 6, 8, or 10' });
        }
        
        let imageUrl;
        if (isCloudinaryConfigured()) {
            try {
                imageUrl = await uploadImage(req.file.buffer, req.file.mimetype);
            } catch (e) {
                console.error('Error uploading to Cloudinary:', e);
                return res.status(500).json({ error: 'Failed to upload image' });
            }
        } else {
            imageUrl = saveLocalImage(req.file.buffer, req.file.originalname);
        }
        
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('games')
                .insert({
                    title: title ? title.trim() : `Game ${Date.now()}`,
                    image: imageUrl,
                    grid_size: parsedGridSize,
                    answer: answer.trim(),
                    revealed_tiles: []
                })
                .select()
                .single();
            
            if (error) throw error;
            
            const newGame = {
                id: data.id,
                title: data.title,
                image: data.image,
                gridSize: data.grid_size,
                answer: data.answer,
                revealedTiles: data.revealed_tiles || [],
                createdAt: data.created_at
            };
            return res.status(201).json(newGame);
        }

        // Local storage mode
        const games = readLocalGames();
        const newGame = {
            id: uuidv4(),
            title: title && title.trim() ? title.trim() : `Game ${Date.now()}`,
            image: imageUrl,
            gridSize: parsedGridSize,
            answer: answer.trim(),
            revealedTiles: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        games.push(newGame);
        writeLocalGames(games);

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
        const { gridSize, answer, title, revealedTiles } = req.body;
        
        let parsedRevealedTiles;
        if (revealedTiles !== undefined) {
            try {
                parsedRevealedTiles = typeof revealedTiles === 'string' 
                    ? JSON.parse(revealedTiles) 
                    : revealedTiles;
            } catch (e) {
                parsedRevealedTiles = revealedTiles;
            }
        }

        if (isSupabaseConfigured()) {
            const { data: existingGame, error: fetchError } = await supabase
                .from('games')
                .select('*')
                .eq('id', req.params.id)
                .single();
            
            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Game not found' });
                }
                throw fetchError;
            }
            
            const updates = {
                updated_at: new Date().toISOString()
            };
            
            if (title) updates.title = title.trim();
            if (answer) updates.answer = answer.trim();
            if (gridSize) {
                const parsedGridSize = parseInt(gridSize);
                if ([6, 8, 10].includes(parsedGridSize)) {
                    updates.grid_size = parsedGridSize;
                }
            }
            if (parsedRevealedTiles !== undefined) {
                updates.revealed_tiles = parsedRevealedTiles;
            }
            if (req.file) {
                if (isCloudinaryConfigured()) {
                    if (existingGame.image && existingGame.image.includes('cloudinary')) {
                        await deleteImage(existingGame.image);
                    }
                    updates.image = await uploadImage(req.file.buffer, req.file.mimetype);
                } else {
                    deleteLocalImage(existingGame.image);
                    updates.image = saveLocalImage(req.file.buffer, req.file.originalname);
                }
            }
            
            const { data, error } = await supabase
                .from('games')
                .update(updates)
                .eq('id', req.params.id)
                .select()
                .single();
            
            if (error) throw error;
            
            const updatedGame = {
                id: data.id,
                title: data.title,
                image: data.image,
                gridSize: data.grid_size,
                answer: data.answer,
                revealedTiles: data.revealed_tiles || [],
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            return res.json(updatedGame);
        }

        // Local storage mode
        const games = readLocalGames();
        const gameIndex = games.findIndex(g => String(g.id) === String(req.params.id));
        if (gameIndex === -1) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const game = games[gameIndex];
        if (title) game.title = title.trim();
        if (answer) game.answer = answer.trim();
        if (gridSize) {
            const parsedGridSize = parseInt(gridSize);
            if ([6, 8, 10].includes(parsedGridSize)) {
                game.gridSize = parsedGridSize;
            }
        }
        if (parsedRevealedTiles !== undefined) {
            game.revealedTiles = parsedRevealedTiles;
        }
        if (req.file) {
            deleteLocalImage(game.image);
            game.image = saveLocalImage(req.file.buffer, req.file.originalname);
        }
        game.updatedAt = new Date().toISOString();

        games[gameIndex] = game;
        writeLocalGames(games);

        res.json(game);
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
        if (isSupabaseConfigured()) {
            const { data: game, error: fetchError } = await supabase
                .from('games')
                .select('*')
                .eq('id', req.params.id)
                .single();
            
            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Game not found' });
                }
                throw fetchError;
            }
            
            if (game.image && game.image.includes('cloudinary')) {
                await deleteImage(game.image);
            } else if (game.image && game.image.startsWith('/uploads/')) {
                deleteLocalImage(game.image);
            }
            
            const { error } = await supabase
                .from('games')
                .delete()
                .eq('id', req.params.id);
            
            if (error) throw error;
            
            return res.json({ message: 'Game deleted successfully', game });
        }

        // Local storage mode
        const games = readLocalGames();
        const gameIndex = games.findIndex(g => String(g.id) === String(req.params.id));
        if (gameIndex === -1) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const [deletedGame] = games.splice(gameIndex, 1);
        deleteLocalImage(deletedGame.image);
        writeLocalGames(games);

        res.json({ message: 'Game deleted successfully', game: deletedGame });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'Failed to delete game' });
    }
};

/**
 * Get game answer (only called when game is completed / solved)
 * GET /api/games/:id/answer
 */
exports.getGameAnswer = async (req, res) => {
    try {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('games')
                .select('id, answer')
                .eq('id', req.params.id)
                .single();
            
            if (error) {
                return res.status(404).json({ error: 'Game not found' });
            }
            return res.json({ id: data.id, answer: data.answer });
        }

        const games = readLocalGames();
        const game = games.find(g => String(g.id) === String(req.params.id));
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json({ id: game.id, answer: game.answer });
    } catch (error) {
        console.error('Error fetching game answer:', error);
        res.status(500).json({ error: 'Failed to retrieve answer' });
    }
};

