# Claude Chef

Your personal AI recipe book. Tell it what you want to cook, and it will:

- Research recipes from world-class chefs (Kenji Lopez-Alt, Julia Child, Marco Pierre White, and more)
- Build you a detailed recipe with exact measurements (cups *and* grams)
- Generate a beautiful food photo of your dish
- Save everything to your personal recipe book
- Deploy your recipe book as a website with a built-in chat sous chef

No coding knowledge required. Just talk to it like you'd talk to a friend in the kitchen.

---

## Get Your Own Copy

### Option A — One-Click Deploy (Easiest)

Click the button to fork and deploy to Vercel in one step:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/edenoffer/claude-chef-template&project-name=my-recipe-book&repository-name=my-recipe-book)

After deploying, add your API keys and storage (see [Step 3](#step-3-add-api-keys) and [Step 4](#step-4-add-storage) below).

### Option B — Fork & Customize

1. Click **Fork** in the top-right of this repo on GitHub
2. Clone your fork locally
3. Follow the [Full Deploy](#publishing-to-vercel-make-it-live) instructions below

---

## Two Ways to Use It

**Terminal (Claude Code)** — The power-user experience. Full recipe research, photo generation, and library management via slash commands.

**Web Chat** — Open your recipe book in any browser and click the chat button. Talk to your sous chef, create recipes, and generate photos — all from your phone while you're in the kitchen.

---

## Setup (5 minutes)

### 1. Install Claude Code

**Mac** — Open Terminal (press `Cmd + Space`, type "Terminal", hit Enter) and paste:

```bash
brew install claude-code
```

Don't have Homebrew? Install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Windows:**

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Get Your API Keys

**Gemini** (for food photos):
1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with "AI...")

**Anthropic** (for web chat — optional for local-only use):
1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or sign in
3. Go to API Keys → Create Key
4. Copy the key

### 3. Download This Project

Fork this repo on GitHub first, then:

```bash
git clone https://github.com/YOUR_USERNAME/my-recipe-book.git
cd my-recipe-book
```

### 4. Add Your API Keys

```bash
cp .env.example .env
```

Open `.env` in any text editor and fill in your keys:

```
GEMINI_API_KEY=AIza...your_key_here
ANTHROPIC_API_KEY=sk-ant-...your_key_here
SESSION_SECRET=any-random-text-you-want
```

### 5. Install Python Helpers

```bash
pip install google-genai python-dotenv Pillow
```

### 6. Start Cooking!

```bash
claude
```

Then type:

```
/cook chocolate lava cake
```

That's it. Your sous chef will take it from here.

---

## Commands

| Type this | What happens |
|-----------|-------------|
| `/cook [anything]` | Create a recipe. Can be a dish name, a photo, a mood, or ingredients you have. |
| `/library` | Open your recipe book in the browser |
| `/photo [recipe]` | Regenerate the photo for a recipe |
| `/import [url]` | Import and improve a recipe from a website or YouTube video |
| `/go-live` | Put your recipe book on the internet |

---

## Examples

```
/cook brown butter ice cream
/cook something Thai and spicy for date night
/cook I have salmon, miso paste, and rice
/cook cozy Sunday dinner for two
/cook surprise me with a weekend baking project
/cook [drag and drop a photo of a dish you loved]
```

---

## Your Recipe Book

**On your computer:** Type `/library` to open it in your browser.

**On your phone:** Deploy to Vercel (see below), then bookmark the URL. Open it anytime from your phone while you're in the kitchen.

**Print a recipe:** Open your recipe book, click a recipe, click the Print button.

**Chat with your sous chef:** Click the chef button in the bottom-right corner to open the chat panel. Create recipes, get cooking advice, and add to your book — all from the browser.

---

## Publishing to Vercel (Make It Live)

### Step 1: Push to GitHub

If you haven't already, push your fork to GitHub:

```bash
git add .
git commit -m "My recipe book"
git push
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `claude-chef` fork
4. Click **Deploy**

### Step 3: Add API Keys

In your Vercel project dashboard → **Settings** → **Environment Variables**, add:

| Variable | Value | Where to get it |
|----------|-------|----------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | [console.anthropic.com](https://console.anthropic.com) |
| `GEMINI_API_KEY` | `AIza...` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `SESSION_SECRET` | any random string | make one up, e.g. `my-secret-book-2026` |

### Step 4: Add Storage

In your Vercel project dashboard → **Storage** tab:

1. Click **Create Database** → select **KV** → name it `claude-chef-data` → Create → Connect to Project
2. Click **Create Database** → select **Blob** → name it `claude-chef-photos` → Create → Connect to Project

### Step 5: Redeploy

Go to **Deployments** tab → click three dots on latest → **Redeploy**

Your recipe book is now fully live with:
- Chat with your sous chef from any device
- Password protection (set in Settings panel)
- Ratings that sync across all your devices
- AI-generated food photos from the web

### Every Time After

Just run `/go-live` inside Claude Code, or `git push` — Vercel auto-deploys.

---

## Features

### Web Chat
Click the chef button (bottom-right) to open the chat panel. Your sous chef has the same personality and knowledge as the terminal version. Ask it to create recipes, and it will save them directly to your book with photos.

### Image & URL Import
- **Paste a photo** of a dish in the chat and the sous chef will suggest a recipe to replicate it
- **Paste a YouTube URL** or recipe blog link and the sous chef will extract and adapt the recipe

### Password Protection
Set a password in the Settings panel (gear icon). Anyone accessing your recipe book URL will need to enter the password first.

### Cross-Device Chat History
All your sous chef conversations are saved and accessible across devices.

### Cross-Device Ratings
Rate recipes with stars. Your ratings persist across all devices.

### Customization
Change your recipe book's title and subtitle in the Settings panel.

---

## Privacy & Data

Your recipe book is **completely separate from anyone else's**. When you deploy:

- **Your Vercel project** = your own isolated app
- **Your KV database** = your recipes only, no one can access them
- **Your Blob storage** = your food photos only
- **Password protection** = optional extra lock on the whole site

The source code is shared (that's the whole point — it's a template), but your data never is.

---

## FAQ

**Do I need to know how to code?**
No. Just type commands and talk naturally.

**Will other people's recipes show up in my book?**
No. Each deployment has its own database. You start with an empty book.

**Is my recipe book private?**
Yes. Everything stays in your own Vercel account. Set a password in Settings for extra security.

**Can I edit recipes later?**
Yes! Say `/cook [recipe name] — make it less spicy` or whatever you want to change.

**What if I don't have API keys?**
Without Gemini: everything works except food photos. Without Anthropic: everything works except the web chat. Both are optional.

**Can I add my own family recipes?**
Yes! Use `/import` and paste the recipe text, or tell `/cook` the recipe and it will format and save it.

**What chefs does it reference?**
Kenji Lopez-Alt, Marco Pierre White, Matty Matheson, Ken Forkish, Julia Child, Fuchsia Dunlop, Nik Sharma, and Chad Robertson — depending on the dish and cuisine.

**How much does the web chat cost?**
It uses your own API credits. A typical recipe conversation costs about $0.05–0.15 with Claude Sonnet.

---

## Project Structure

```
claude-chef/
├── api/                        ← Vercel serverless functions
│   ├── _lib/                   ← Shared modules
│   ├── chat.js                 ← Claude API streaming proxy
│   ├── recipes.js              ← Recipe CRUD
│   ├── ratings.js              ← Rating storage
│   ├── settings.js             ← Library settings
│   ├── auth.js                 ← Password/login
│   └── photo.js                ← Gemini photo generation
├── middleware.js                ← Password protection
├── recipes/
│   ├── recipe-book.html        ← Your recipe book (with chat!)
│   ├── data/                   ← Individual recipe files (yours — not shared)
│   └── photos/                 ← Food photography (yours — not shared)
├── agents/                     ← The Sous Chef personality
├── tools/                      ← Image generation modules
├── CLAUDE.md                   ← How the AI works
└── README.md                   ← You are here
```

---

Built with [Claude Code](https://claude.ai/claude-code), [Claude API](https://console.anthropic.com), and [Gemini](https://aistudio.google.com/).
