# Photo

Regenerate or improve the photo for an existing recipe.

## Usage

```
/photo brown-butter-ice-cream              — Regenerate the photo
/photo brown-butter-ice-cream more moody   — Regenerate with specific direction
```

## Execution Steps

### Step 1: Find the Recipe

Read the recipe JSON from `recipes/data/[slug].json`. If the slug doesn't match exactly, search through `recipes/data/` for a close match.

### Step 2: Analyze the Recipe

Read the full recipe instructions and build a visual description of the finished dish (same analysis as in `/cook` — what it looks like based on the cooking process, not just the name).

### Step 3: Apply Direction

If the user provided additional direction (e.g., "more moody", "closer shot", "darker lighting"), incorporate it into the subject description or override the default photography style.

### Step 4: Generate

```python
import sys
sys.path.insert(0, 'tools')
from recipe_photo import generate_recipe_photo
photo_path = generate_recipe_photo(
    title="Recipe Title",
    subject_description="Updated visual description",
    cuisine="Cuisine Type"
)
```

### Step 5: Update

- Replace the existing photo in `recipes/photos/[slug].png`
- Show the user the new photo
- Ask if they're happy with it or want further adjustments

ARGUMENTS: $ARGUMENTS
