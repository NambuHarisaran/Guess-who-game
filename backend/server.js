/**
 * Stage Guess Reveal Game - Backend Server
 * 
 * This Express server handles:
 * - Serving static frontend files
 * - REST API for game management (CRUD operations)
 * - Image upload handling
 * - Game state management
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const gameRoutes = require('./routes/gameRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure data directory and games.json exist
const dataDir = path.join(__dirname, 'data');
const gamesFile = path.join(dataDir, 'games.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(gamesFile)) {
    fs.writeFileSync(gamesFile, JSON.stringify([], null, 2));
}

// API Routes
app.use('/api', gameRoutes);

// Frontend Routes
// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve game.html for game routes
app.get('/game/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/game.html'));
});

// Serve admin pages
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/admin/create', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-create.html'));
});

app.get('/admin/games', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-games.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Stage Guess Reveal Game Server Started!            ║
╠════════════════════════════════════════════════════════════╣
║  Local:   http://localhost:${PORT}                           ║
║  Admin:   http://localhost:${PORT}/admin                     ║
║  Games:   http://localhost:${PORT}/admin/games               ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
