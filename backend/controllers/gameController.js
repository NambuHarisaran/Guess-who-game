/**
 * Game Controller
 * 
 * Handles all business logic for game management:
 * - CRUD operations for games
 * - Cloudinary image storage
 * - Supabase database for persistent storage
 */

const { v4: uuidv4 } = require('uuid');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { supabase } = require('../config/supabase');

/**
 * Get all games
 * GET /api/games
 */
exports.getAllGames = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('games')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform snake_case to camelCase for frontend
        const games = data.map(game => ({
            id: game.id,
            title: game.title,
            image: game.image,
            gridSize: game.grid_size,
            answer: game.answer,
            revealedTiles: game.revealed_tiles || [],
            createdAt: game.created_at,
            updatedAt: game.updated_at
        }));
        
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
        
        // Transform to camelCase
        const game = {
            id: data.id,
            title: data.title,
            image: data.image,
            gridSize: data.grid_size,
            answer: data.answer,
            revealedTiles: data.revealed_tiles || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
        
        res.json(game);
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Failed to retrieve game' });
    }
};

/**
 * Create a new game
 * POST /api/games
 * 
 * Request body (multipart/form-data):
 * - image: Image file
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
        
        // Insert into Supabase
        const { data, error } = await supabase
            .from('games')
            .insert({
                title: title || `Game ${Date.now()}`,
                image: imageUrl,
                grid_size: parsedGridSize,
                answer: answer.trim(),
                revealed_tiles: []
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Transform to camelCase for response
        const newGame = {
            id: data.id,
            title: data.title,
            image: data.image,
            gridSize: data.grid_size,
            answer: data.answer,
            revealedTiles: data.revealed_tiles || [],
            createdAt: data.created_at
        };
        
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
        // First get the existing game
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
        
        const { gridSize, answer, title, revealedTiles } = req.body;
        
        // Build update object
        const updates = {
            updated_at: new Date().toISOString()
        };
        
        if (title) updates.title = title;
        if (answer) updates.answer = answer.trim();
        if (gridSize) {
            const parsedGridSize = parseInt(gridSize);
            if ([6, 8, 10].includes(parsedGridSize)) {
                updates.grid_size = parsedGridSize;
            }
        }
        
        // Update revealed tiles if provided
        if (revealedTiles !== undefined) {
            try {
                updates.revealed_tiles = typeof revealedTiles === 'string' 
                    ? JSON.parse(revealedTiles) 
                    : revealedTiles;
            } catch (e) {
                updates.revealed_tiles = revealedTiles;
            }
        }
        
        // Update image if new one uploaded
        if (req.file) {
            try {
                // Delete old image from Cloudinary
                if (existingGame.image && existingGame.image.includes('cloudinary')) {
                    await deleteImage(existingGame.image);
                }
                // Upload new image
                updates.image = await uploadImage(req.file.buffer, req.file.mimetype);
            } catch (e) {
                console.error('Error updating image on Cloudinary:', e);
            }
        }
        
        // Update in Supabase
        const { data, error } = await supabase
            .from('games')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        
        // Transform to camelCase
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
        
        res.json(updatedGame);
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
        // First get the game to delete its image
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
        
        // Delete image from Cloudinary
        if (game.image && game.image.includes('cloudinary')) {
            await deleteImage(game.image);
        }
        
        // Delete from Supabase
        const { error } = await supabase
            .from('games')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({ message: 'Game deleted successfully', game });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'Failed to delete game' });
    }
};
