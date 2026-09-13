# Stage Guess Reveal Game (Hugo Extended Edition)

A high-performance, serverless static web application for physical quiz events where hidden images are revealed through a numbered grid when tiles are clicked. Re-architected with **Hugo Extended** to run 100% client-side with **zero backend dependencies**, zero external databases, and zero API services required.

---

## ✨ Highlights & Architecture

- **100% Serverless & Backend-Free**: No Node.js server, no Express, no Supabase, no Cloudinary, and no environment variables required!
- **Hugo Extended Static Site Generator**: Instant sub-second compilation (`hugo`) and lightning fast live development (`hugo server`).
- **Client-Side GameStore (IndexedDB & LocalStorage)**: Create, edit, delete, and persist games directly in the browser with full image support.
- **Dual Screen & 2-Player Battle Arena**: Host 2 contestants or teams simultaneously with 2 separate questions/boards (`/dual/`).
- **Real-Time Projector Popouts**: Zero-latency audience display mirroring (`/display/`) powered by peer-to-peer `BroadcastChannel`.
- **Interactive Scoring & Buzzer Lockout**: Integrated buzzer sound synthesis (`1` and `2` keyboard shortcuts), round wins counter, and custom point adjustments.
- **Web Audio Synthesis**: Dynamic chimes, countdown tension alarms, roulette ticks, and victory fanfares without external audio asset downloads.
- **Backup Export & Import**: Download your custom quiz games as JSON or import them on another machine in one click.
- **Static Hosting Everywhere**: Deploy on GitHub Pages, Cloudflare Pages, Vercel, Netlify, or AWS S3 with zero cost.

---

## 🚀 Quick Start

### 1. Requirements
- **Hugo Extended** (v0.120+ recommended)
  - Windows (winget): `winget install Hugo.Hugo.Extended`
  - macOS (brew): `brew install hugo`
  - Linux: Download the `extended` binary from [Hugo Releases](https://github.com/gohugoio/hugo/releases)

### 2. Start Development Server

Run the batch script (Windows):
```cmd
run.bat
```
Or use the Hugo CLI directly:
```bash
hugo server -p 1313
```
Then open your browser at:
```
http://localhost:1313
```

### 3. Build for Production

```bash
hugo --minify
```
The complete production-ready static site is generated in the `public/` directory!

---

## 📁 Project Structure

```
stage-guess-reveal/
├── content/                     # Hugo Markdown content & routes
│   ├── _index.md                # Landing page (/)
│   ├── game/                    # Game screens (/game/ & /game/<id>/)
│   ├── dual/                    # Dual Screen Battle (/dual/)
│   ├── display/                 # Audience Projector Display (/display/)
│   └── admin/                   # Admin Studio Hub
│       ├── _index.md            # Dashboard (/admin/)
│       ├── create.md            # Create Studio (/admin/create/)
│       └── games.md             # Games Hub (/admin/games/)
│
├── data/
│   └── games.json               # Default bundled stage games
│
├── layouts/                     # Hugo semantic HTML templates
│   ├── index.html               # Landing page layout
│   ├── _default/                # Fallback templates
│   ├── partials/                # Reusable partials (head, sidebar)
│   ├── game/                    # Single & list game templates
│   ├── dual/                    # Dual screen battle layout
│   ├── display/                 # Projector display layout
│   └── admin/                   # Dashboard, create, and games layouts
│
├── static/                      # Static assets served as-is
│   ├── css/                     # Glassmorphic responsive stylesheets
│   ├── js/                      # Client-side engines
│   │   ├── gamestore.js         # Client-side IndexedDB/LocalStorage CRUD
│   │   ├── game.js              # Single board game engine
│   │   ├── dual.js              # Dual battle & scoreboard engine
│   │   ├── display.js           # Audience secondary mirror client
│   │   ├── admin.js             # Admin dashboard controller
│   │   ├── admin-create.js      # Studio creation logic
│   │   ├── admin-games.js       # Games management & backup
│   │   └── landing-demo.js      # Interactive hero preview
│   ├── data/                    # JSON access for client runtime
│   └── uploads/                 # Bundled game artwork images
│
├── hugo.toml                    # Hugo configuration
├── package.json                 # Hugo helper scripts
├── run.bat                      # One-click Windows launch script
└── vercel.json                  # One-click static deployment config
```

---

## 🎮 Game Controls & Keyboard Shortcuts

### Single Board (`/game/`)
- `Space`: Reveal a random tile with roulette sound FX
- `R`: Reset board to 0 revealed tiles
- `A`: Reveal all tiles simultaneously
- `T`: Toggle countdown timer
- `M`: Toggle audio mute
- `H`: Clean HUD presentation mode (hides host controls for projectors)
- `F`: Toggle fullscreen mode
- `Enter`: Next game (when current game is completed)

### Dual Screen Battle (`/dual/`)
- `1`: Player 1 Buzzer
- `2`: Player 2 Buzzer
- `Space`: Random tile reveal
- `T`: Toggle shared match countdown timer
- `M`: Toggle sound FX
- `H`: Toggle Clean HUD presentation mode
- `F`: Toggle fullscreen mode

---

## 🌐 Deployment

### Vercel
Push your repository to GitHub, connect to Vercel, and choose Hugo (or let Vercel auto-detect). Vercel builds the site automatically using `hugo --minify`.

### GitHub Pages
Enable GitHub Pages in your repository settings with GitHub Actions (Hugo workflow template).

### Cloudflare Pages
1. Create a project in Cloudflare Pages connected to your git repository.
2. Build command: `hugo --minify`
3. Build output directory: `public`

---

## 📄 License

MIT License - Free to use and customize for your quiz events!
