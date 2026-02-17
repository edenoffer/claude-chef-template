# Recipe Library

Open and manage your personal recipe book.

## Usage

```
/library              — Open the recipe book in your browser
/library search pasta  — Search recipes by keyword
/library stats         — Show collection statistics
```

## Execution Steps

### Open Library (default, no arguments)

```bash
open recipes/recipe-book.html
```

Tell the user: "Your recipe book is open, chef! You can filter by cuisine, difficulty, or search for anything."

### Search (argument starts with "search")

1. Read `recipes/recipe-book.html`
2. Extract the `recipes` JavaScript data array
3. Search across title, description, tags, cuisine, and ingredients for the keyword
4. Display matching recipes as a formatted list with title, cuisine, difficulty, and time

### Stats (argument is "stats")

1. Read `recipes/recipe-book.html`
2. Extract the `recipes` array
3. Count and display:
   - Total recipes
   - Breakdown by cuisine
   - Breakdown by difficulty (Easy / Medium / Hard)
   - Average cook time
   - Most common tags
   - Most recent additions

Format the output nicely with the sous-chef personality.

ARGUMENTS: $ARGUMENTS
