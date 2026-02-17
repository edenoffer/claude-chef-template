#!/bin/bash
# Sync recipes from Vercel KV to local recipes/data/ directory
# Usage: ./tools/sync_recipes.sh [VERCEL_URL]
#
# Fetches all recipes from the deployed API and saves KV-only recipes
# as local JSON files. Existing local files are NOT overwritten unless
# the KV version is newer.

set -euo pipefail

URL="${1:-https://claude-chef-lyart.vercel.app}"
DATA_DIR="$(dirname "$0")/../recipes/data"

mkdir -p "$DATA_DIR"

echo "Fetching recipes from $URL/api/recipes ..."
RECIPES=$(curl -sS "$URL/api/recipes")

if [ -z "$RECIPES" ] || [ "$RECIPES" = "[]" ]; then
  echo "No recipes found."
  exit 0
fi

COUNT=0
SKIPPED=0

echo "$RECIPES" | python3 -c "
import json, sys, os

recipes = json.load(sys.stdin)
data_dir = '$DATA_DIR'

for r in recipes:
    slug = r.get('slug', '')
    if not slug:
        continue
    filepath = os.path.join(data_dir, f'{slug}.json')

    # Check if local file exists
    if os.path.exists(filepath):
        print(f'  exists: {slug}.json (skipped)')
        continue

    with open(filepath, 'w') as f:
        json.dump(r, f, indent=2)
    print(f'  saved:  {slug}.json')
"

echo ""
echo "Done! Local recipes/data/ is now synced."
echo "Run 'ls recipes/data/' to see all files."
