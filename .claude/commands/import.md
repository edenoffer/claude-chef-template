# Import

Import a recipe from a URL or pasted text, improve it, and add it to your library.

## Usage

```
/import https://www.seriouseats.com/brown-butter-cookies
/import [paste recipe text directly]
```

## Execution Steps

### Step 1: Get the Recipe

**If URL:** Fetch the page content using WebFetch and extract the recipe (title, ingredients, instructions).

**If pasted text:** Parse the text to identify recipe components.

### Step 2: Analyze and Improve

Hand off to the **sous-chef** agent to:

1. Review the recipe for completeness
2. Cross-reference with trusted chef sources for potential improvements
3. Add missing dual measurements (cups AND grams)
4. Add missing equipment list
5. Improve instruction clarity with visual cues and temperatures
6. Add Chef's Notes with tips and substitutions
7. Reformat into the standardized recipe structure

### Step 3: Present

Show the improved recipe and credit the original source.

Ask:
> "I've cleaned this up and added a few notes. How's it looking, chef? Keep it / Refine it / Level up?"

### Step 4: Standard Flow

Follow the same keep/refine/level-up flow as `/cook`:
- Generate photo
- Save JSON
- Update library HTML
- Confirm

ARGUMENTS: $ARGUMENTS
