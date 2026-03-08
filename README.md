# Stage Guess Reveal Game

A web application for physical quiz events where hidden images are revealed through a numbered grid when tiles are clicked. Perfect for live events where audiences call numbers and the host clicks them to reveal parts of the image.

## Features

- **Admin Dashboard**: Create, manage, and delete games
- **Customizable Grid**: Choose from 6×6, 8×8, or 10×10 tile layouts
- **Interactive Reveal**: Click tiles or enter numbers to reveal parts of the image
- **Keyboard Shortcuts**: Quick controls for hosts
- **Projector Optimized**: 1920×1080 friendly layout with large, visible tiles
- **Smooth Animations**: Tiles fade out with flip animation when revealed

## Screenshots

The application includes:
- Landing page with modern game-show styling
- Admin dashboard with stats and quick actions
- Game creation form with image upload and grid preview
- Games management page with search and filters
- Full-featured game screen with controls

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **Image Storage**: Cloudinary (persistent cloud storage)
- **File Upload**: Multer for image handling

## Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase** (required for database)
   - Create a free account at [supabase.com](https://supabase.com)
   - Create a new project
   - Go to SQL Editor and run this query to create the games table:
   ```sql
   CREATE TABLE games (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     image TEXT NOT NULL,
     grid_size INTEGER NOT NULL DEFAULT 6,
     answer TEXT NOT NULL,
     revealed_tiles JSONB DEFAULT '[]',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   ALTER TABLE games ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow all" ON games FOR ALL USING (true);
   ```
   - Go to Settings → API and copy your URL and anon key

4. **Set up Cloudinary** (required for image uploads)
   - Create a free account at [cloudinary.com](https://cloudinary.com)
   - Go to your Dashboard and copy your credentials

5. **Create a `.env` file** in the project root:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. **Start the server**
   ```bash
   npm start
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add Environment Variables in Vercel dashboard:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy!

## Project Structure

```
project-root/
│
├── backend/
│   ├── server.js           # Express server setup
│   ├── routes/
│   │   └── gameRoutes.js   # API route definitions
│   ├── controllers/
│   │   └── gameController.js  # Business logic
│   └── data/
│       └── games.json      # Game data storage
│
├── frontend/
│   ├── index.html          # Landing page
│   ├── game.html           # Game play screen
│   ├── admin.html          # Admin dashboard
│   ├── admin-create.html   # Create new game
│   ├── admin-games.html    # Manage games
│   ├── css/
│   │   ├── styles.css      # Global styles
│   │   ├── game.css        # Game screen styles
│   │   └── admin.css       # Admin panel styles
│   └── js/
│       ├── game.js         # Game logic
│       ├── admin.js        # Dashboard logic
│       ├── admin-create.js # Game creation logic
│       └── admin-games.js  # Games management
│
├── uploads/                 # Uploaded images storage
│
├── package.json
└── README.md
```

## Usage

### Creating a Game

1. Go to **Admin Dashboard** (`/admin`)
2. Click **Create Game** or navigate to `/admin/create`
3. Fill in the form:
   - **Title**: Name for the game
   - **Image**: Upload the image to reveal (JPG, PNG, GIF, WebP)
   - **Grid Size**: Choose 6×6, 8×8, or 10×10
   - **Answer**: The correct answer (shown when revealed)
4. Click **Create Game**

### Playing a Game

1. Go to **All Games** (`/admin/games`)
2. Click **Play** on any game
3. The game screen shows:
   - Numbered tiles covering the image
   - Stats showing tiles revealed/remaining
   - Control buttons

### Game Controls

**Buttons:**
- **Reset**: Reset all tiles to hidden state
- **Random**: Reveal a random tile
- **Reveal All**: Show the entire image at once
- **Give Up**: Reveal everything and show the answer

**Keyboard Shortcuts:**
- `1-9`: Reveal tiles 1-9 directly
- `Space`: Reveal a random tile
- `R`: Reset the board
- `F`: Toggle fullscreen mode

**Number Input:**
- Type any tile number and press Enter or click Reveal

### Managing Games

1. Navigate to `/admin/games`
2. Use **Search** to find specific games
3. **Filter** by grid size
4. **Sort** by date or name
5. Click **Delete** to remove a game (with confirmation)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games` | Get all games |
| GET | `/api/games/:id` | Get a specific game |
| POST | `/api/games` | Create a new game |
| PUT | `/api/games/:id` | Update a game |
| DELETE | `/api/games/:id` | Delete a game |

### Create Game Request

```
POST /api/games
Content-Type: multipart/form-data

Fields:
- title: string (required)
- image: file (required)
- gridSize: number (6, 8, or 10) (required)
- answer: string (required)
```

### Game Object Response

```json
{
  "id": "uuid-string",
  "title": "Movie Star Quiz",
  "image": "/uploads/filename.jpg",
  "gridSize": 8,
  "answer": "Tom Cruise",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "revealedTiles": []
}
```

## Configuration

The server runs on port `3000` by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Tips for Live Events

1. **Use Fullscreen Mode**: Press `F` or click the fullscreen button
2. **Large Display**: Designed for 1920×1080 projectors
3. **Number Input**: Use the number input field for quick tile reveals
4. **Random Mode**: Use Space bar for audience participation games
5. **Reset Between Rounds**: The Reset button restores all tiles

## License

MIT License - Feel free to use and modify for your events!
