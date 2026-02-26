# Publish & Sync — Push to GitHub and Sync Template

Commit and push all changes to the personal `claude-chef` repo, then sync the public `claude-chef-template` repo with the same code (stripping personal recipes and data).

## Usage

```
/publish
/publish "commit message"
```

If no commit message is given, write one based on the changes.

## Execution Steps

### Step 1: Confirm there's something to publish

Run `git status` and `git diff --stat` in the project root. If the working tree is clean and nothing is staged, report: "Nothing to publish — working tree is clean." and stop.

### Step 2: Stage and commit to personal repo

1. Run `git add -A` (or stage specific changed files — never include `.env`, secrets, or large binaries)
2. Write a clear commit message summarising what changed. If the user provided one as an argument, use it. Otherwise draft one from the diff.
3. Commit: `git commit -m "..."`
4. Push: `git push origin main`
5. Confirm: "Personal repo pushed ✓"

### Step 3: Sync the template repo

The template lives at `https://github.com/edenoffer/claude-chef-template`. Use a temp directory `/tmp/claude-chef-template` (clone fresh if it doesn't exist, or `git pull` if it does).

```bash
# Clone or update
if [ -d /tmp/claude-chef-template/.git ]; then
  git -C /tmp/claude-chef-template pull
else
  git clone https://github.com/edenoffer/claude-chef-template.git /tmp/claude-chef-template
fi
```

### Step 4: Copy changed files to the template

Copy all files that belong in the template — everything **except** personal data:

**Always copy** (code + config):
- `api/` — entire directory
- `agents/` — entire directory
- `tools/` — entire directory
- `CLAUDE.md`
- `package.json`
- `vercel.json`
- `.env.example`
- `.claude/` — entire directory (commands, settings)

**Process before copying** (strip personal data):
- `recipes/recipe-book.html` — copy but replace the `BUNDLED_RECIPES` array with an empty array `[]`
- `README.md` — copy but:
  - Change the deploy button URL from `claude-chef` → `claude-chef-template`
  - Replace the personal-recipes warning with a clean template message

**Never copy**:
- `recipes/data/*.json` (personal recipes)
- `recipes/photos/*` (personal photos, except `.gitkeep`)
- `.vercel/` (personal Vercel project link)
- `.env` (personal API keys)

Use this Python snippet to strip BUNDLED_RECIPES:

```python
import re, shutil, os

src = '/Users/edenoffer/Documents/claude-chef'
dst = '/tmp/claude-chef-template'

# Copy API, agents, tools, config
for folder in ['api', 'agents', 'tools', '.claude']:
    shutil.copytree(f'{src}/{folder}', f'{dst}/{folder}', dirs_exist_ok=True)
for f in ['CLAUDE.md', 'package.json', 'vercel.json', '.env.example']:
    if os.path.exists(f'{src}/{f}'):
        shutil.copy2(f'{src}/{f}', f'{dst}/{f}')

# recipe-book.html — strip BUNDLED_RECIPES
with open(f'{src}/recipes/recipe-book.html') as f:
    html = f.read()
html = re.sub(r'(const BUNDLED_RECIPES\s*=\s*)\[[\s\S]*?\];', r'\1[];', html)
with open(f'{dst}/recipes/recipe-book.html', 'w') as f:
    f.write(html)

# README — update deploy URL and remove personal warning
with open(f'{src}/README.md') as f:
    readme = f.read()
readme = readme.replace(
    'repository-url=https://github.com/edenoffer/claude-chef&',
    'repository-url=https://github.com/edenoffer/claude-chef-template&'
)
readme = readme.replace(
    '> ⚠️ **This repo contains the owner\'s personal recipes.** To start fresh with your own empty book, follow the steps below — don\'t clone this repo directly.',
    '> This is a clean template — no personal recipes included. Fork or deploy it to start your own empty recipe book.'
)
readme = readme.replace(
    '### Option B — Fork & Customize\n\n1. Click **Fork** in the top-right of this repo on GitHub\n2. In your fork, go to `recipes/data/` and delete all `.json` files (those are the owner\'s personal recipes)\n3. Also delete everything in `recipes/photos/` except `.gitkeep`\n4. Follow the [Full Deploy](#publishing-to-vercel-make-it-live) instructions below',
    '### Option B — Fork & Customize\n\n1. Click **Fork** or **Use this template** in the top-right of this repo on GitHub\n2. Follow the [Full Deploy](#publishing-to-vercel-make-it-live) instructions below'
)
with open(f'{dst}/README.md', 'w') as f:
    f.write(readme)

print("Template synced")
```

### Step 5: Commit and push the template

```bash
cd /tmp/claude-chef-template
git add -A
git commit -m "Sync: [same message as personal repo commit]"
git push origin main
```

Confirm: "Template repo synced ✓"

### Step 6: Report

```
Done, chef.

Personal repo:  https://github.com/edenoffer/claude-chef   ✓ pushed
Template repo:  https://github.com/edenoffer/claude-chef-template   ✓ synced
```

If anything fails (git push, sync), report the error clearly and don't silently continue.

ARGUMENTS: $ARGUMENTS
