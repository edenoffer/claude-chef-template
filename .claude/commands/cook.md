# Cook

Create a new recipe from any input — image, text, idea, mood, or ingredient list.

## Usage

```
/cook brown butter ice cream
/cook something Thai and spicy
/cook I have chicken, lemons, and garlic
/cook [attach an image of a dish]
/cook cozy Sunday dinner for two
/cook surprise me
```

## Execution Steps

### Step 1: Greet and Identify Input

Open with a sous-chef personality greeting, then identify the input type:

| Input | Action |
|-------|--------|
| Image attached | Use Gemini vision to analyze the dish. Describe what you see. Then proceed to research. |
| Specific dish name | Proceed directly to research |
| Cuisine type or mood | Suggest 3-5 options with short descriptions, wait for user to pick |
| Ingredient list | Suggest 3-5 recipes using those ingredients, wait for user to pick |
| "surprise me" | Pick something seasonal and interesting, announce it with enthusiasm |
| URL | Fetch the recipe, analyze it, then improve it using trusted chef sources |

### Step 2: Invoke the Sous Chef Agent

Hand off to the **sous-chef** agent with the identified dish and any context from the user.

### Step 3: Research Phase

The sous-chef will:
1. Search for `"[dish name] recipe [trusted chef name]"` for each relevant chef
2. Search for `"[dish name] technique tips"`
3. Search for `"[key technique] food science"` (e.g., "brown butter science Kenji")
4. Cross-reference ratios and methods from 2-3 trusted sources
5. Build the composite recipe using the best techniques from each source

### Step 4: Present Recipe

Display the full recipe in the standardized format (see sous-chef agent for exact structure). Include:
- Title and description
- Difficulty, times, serves
- Equipment list
- Ingredients table with BOTH cups/spoons AND grams
- Numbered instructions with visual cues and temperatures
- Chef's Notes
- Cuisine, tags, and inspiration credits

Then ask:

> "How's this looking, chef? You can:
> - **Keep it** — I'll snap a photo and add it to your book
> - **Refine it** — Tell me what to change
> - **Level up** — I'll add restaurant-quality techniques"

### Step 5: Handle Response

**On "keep" or any approval:**

1. **Analyze the recipe for visuals.** Read the FULL instructions and determine:
   - What the finished dish actually looks like (color, texture, shape)
   - Which ingredients are INSIDE vs ON TOP
   - What garnish is specified
   - What it should be served in/on
   - Temperature state (steaming, cold, room temp)

2. **Build the subject description.** Write a detailed visual description of the finished dish based on the recipe analysis. Be specific about colors from cooking processes (browning = golden-amber, caramelizing = deep amber, etc.)

3. **Generate the photo:**
   ```python
   import sys
   sys.path.insert(0, 'tools')
   from recipe_photo import generate_recipe_photo
   photo_path = generate_recipe_photo(
       title="Recipe Title",
       subject_description="The detailed visual description you wrote",
       cuisine="Cuisine Type"
   )
   ```

4. **Save the recipe as JSON** to `recipes/data/[slug].json` with the full data structure (see CLAUDE.md for schema).

5. **Update the recipe library HTML.** Read `recipes/recipe-book.html`, find the `const recipes = [` array, and add the new recipe object. Determine the next ID by finding the highest existing ID and adding 1.

6. **Confirm:** "Your recipe has been added to the book, chef! 📖"

**On "refine":**
- Apply the requested changes
- Re-present the updated recipe
- Ask again

**On "level up":**
- Add professional techniques (temper, bloom spices, sous vide, plating)
- Upgrade garnishes and presentation
- Bump difficulty if needed
- Re-present and ask again

### Step 6: Show the Photo

After generating, display the photo path so the user can see it. Then ask:

> "Here's your dish. Want me to adjust the photo, or are we good?"

If they want adjustments, describe what to change and regenerate.

## Output

- Recipe JSON: `recipes/data/[slug].json`
- Photo: `recipes/photos/[slug].png`
- Library HTML: updated with new entry

ARGUMENTS: $ARGUMENTS
