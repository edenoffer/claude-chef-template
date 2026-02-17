# Claude Chef

Your personal AI recipe book builder. Create, refine, and collect recipes with food photography.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `/cook` | Create a new recipe from any input |
| `/library` | Open your recipe book |
| `/photo` | Regenerate a recipe photo |
| `/import` | Import a recipe from URL or text |
| `/go-live` | Deploy your recipe book to the web |

---

## How It Works

### Two Modes

**Claude Code (local)** — Power-user mode via terminal. Full agent capabilities, web research, recipe building, photo generation.

**Web Chat (browser)** — Anyone with the URL can chat with the sous chef, create recipes, and generate photos. Uses Claude API + Gemini API via serverless functions.

### Core Flow
1. User gives any food input (image, name, mood, ingredients, URL)
2. Sous Chef researches recipes from trusted professional chefs
3. Builds a detailed recipe with dual measurements (cups + grams)
4. User can refine, level up, or keep
5. On keep: generate food photo via Gemini, save to library

---

## Routing Rules

### All Recipe Requests
For ANY food-related request, invoke the **sous-chef** agent.

### Recipe-to-Photo Pipeline
When generating food photos, you MUST:
1. Read the FULL recipe instructions before building the image prompt
2. Identify what the finished dish actually looks like based on cooking steps
3. Determine which ingredients are INSIDE the dish vs ON TOP (infused ≠ drizzled)
4. Note color changes from cooking processes (browning, caramelizing, reducing)
5. Build a 3-layer prompt: Subject Description + Cuisine Context + Photography Style
6. Generate via `tools/recipe_photo.py`

### Image Generation
```python
import sys
sys.path.insert(0, 'tools')
from recipe_photo import generate_recipe_photo
photo_path = generate_recipe_photo(title, subject_description, cuisine)
```

Default model: `gemini-3-pro-image-preview`
Default aspect ratio: `4:3`
Default style: Mediterranean food photography (embedded in recipe_photo.py)

---

## Recipe Storage

### Dual Storage — Local + Cloud

**Claude Code (local) creates:**
- JSON file: `recipes/data/[slug].json` — for Claude to read/edit
- HTML data array: embedded in `BUNDLED_RECIPES` in `recipes/recipe-book.html`
- Photo: `recipes/photos/[slug].png` (static file)

**Web Chat (browser) creates:**
- Vercel KV: recipe saved via `/api/recipes` POST
- Photo: Vercel Blob via `/api/photo` or `/api/chat` tool use

When saving a recipe via Claude Code, ALWAYS update BOTH:
1. Write/update the JSON file in `recipes/data/`
2. Add/update the entry in the HTML `BUNDLED_RECIPES` array

The web page merges both sources: bundled recipes (from deploy) + KV recipes (from web chat).

### Slug Convention
Convert title to lowercase, replace spaces with hyphens, remove special characters.
- "Brown Butter Ice Cream" → `brown-butter-ice-cream`
- "Mom's Chicken Soup" → `moms-chicken-soup`

### Photo Storage
- Local photos: `recipes/photos/[slug].png` (relative path)
- Web photos: Vercel Blob URLs (absolute https:// URL)

---

## Recipe Data Structure

```json
{
  "id": 1,
  "slug": "brown-butter-ice-cream",
  "title": "Brown Butter Ice Cream",
  "description": "Short 2-3 sentence description",
  "difficulty": "Medium",
  "prepTime": 30,
  "cookTime": 45,
  "totalTime": 75,
  "serves": 6,
  "equipment": ["Ice cream maker", "Fine-mesh strainer"],
  "ingredients": [
    { "item": "Unsalted butter", "cups": "1/2 cup", "grams": "113g" }
  ],
  "instructions": ["Step 1...", "Step 2..."],
  "chefsNotes": ["Tip 1...", "Tip 2..."],
  "cuisine": "American",
  "tags": ["dessert", "ice-cream", "make-ahead"],
  "photo": "photos/brown-butter-ice-cream.png",
  "inspiredBy": "Kenji Lopez-Alt, Dana Cree",
  "rating": 0,
  "dateAdded": "2026-02-11"
}
```

---

## API Layer (Vercel Serverless)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/recipes` | GET | All recipes (merged: bundled JSON + KV) |
| `/api/recipes` | POST | Save new recipe (to KV) |
| `/api/ratings` | GET/POST | Recipe ratings (stored in KV) |
| `/api/settings` | GET/POST | Library title, subtitle (stored in KV) |
| `/api/auth` | POST | Login, set-password, logout |
| `/api/chat` | POST | Streaming chat (Claude API proxy + tool use) |
| `/api/photo` | POST | Photo generation (Gemini API proxy + Blob storage) |

### Shared Modules (`api/_lib/`)
- `session.js` — HMAC token create/verify for auth
- `system-prompt.js` — Condensed sous-chef prompt + tool definitions for Claude API
- `photo-style.js` — CUISINE_PROPS, DEFAULT_FOOD_STYLE, slugify (ported from Python)

---

## Environment

### Local Development (Claude Code)
Requires `GEMINI_API_KEY` in `.env` file.

```
pip install google-genai python-dotenv Pillow
```

### Deployed (Vercel)
| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Web chat (Claude API) |
| `GEMINI_API_KEY` | Photo generation |
| `SESSION_SECRET` | Auth cookie signing |
| `KV_REST_API_URL` | Auto-set by Vercel KV |
| `KV_REST_API_TOKEN` | Auto-set by Vercel KV |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by Vercel Blob |

---

## Project Structure

```
claude-chef/
├── api/                        # Vercel serverless functions
│   ├── _lib/                   # Shared modules
│   │   ├── photo-style.js      # Photography constants
│   │   ├── session.js          # Auth token helpers
│   │   └── system-prompt.js    # Sous-chef prompt for API
│   ├── auth.js                 # Login, password, logout
│   ├── chat.js                 # Claude API streaming + tool use
│   ├── health.js               # Health check
│   ├── photo.js                # Gemini photo generation
│   ├── ratings.js              # Recipe ratings
│   ├── recipes.js              # Recipe CRUD (merged data)
│   └── settings.js             # Library settings
├── middleware.js                # Edge Middleware (password protection)
├── .claude/commands/            # Slash commands (/cook, /library, etc.)
├── agents/                     # Sous Chef agent definition
├── tools/                      # Image generation Python modules
├── recipes/
│   ├── recipe-book.html        # Your recipe book (with chat panel)
│   ├── data/                   # Individual recipe JSON files
│   └── photos/                 # Generated food photos
├── CLAUDE.md                   # This file
└── README.md                   # Setup guide
```
