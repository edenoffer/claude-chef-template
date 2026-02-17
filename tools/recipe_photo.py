"""
Recipe Photo Generator for Claude Chef
Builds intelligent image generation prompts by combining:
  1. Subject description (what the finished dish looks like — analyzed by Claude)
  2. Cuisine context (appropriate props and styling)
  3. Photography style (Mediterranean food photography default)

Then generates via Gemini image generation.

Usage:
    from recipe_photo import generate_recipe_photo
    photo_path = generate_recipe_photo(
        title="Brown Butter Ice Cream",
        subject_description="Two scoops of golden-amber ice cream...",
        cuisine="American"
    )
"""
import os
import re
import shutil
from pathlib import Path


import random

# Photography styles extracted from curated reference images using Gemini vision.
# Each style is distilled from real food photography references.
PHOTO_STYLES = [
    # Style 1: Golden Hour Linen
    "Sun-drenched food photography on cream linen or warm off-white surface. "
    "Hard natural sunlight from the side at a low angle casting long, crisp, dramatic shadows. "
    "Light refracting through glass creating bright caustic patterns on the surface. "
    "Warm golden color palette with creamy off-whites and desaturated warm tones. "
    "Handmade ceramic plates with raw clay rims, vintage crystal glassware, aged silver spoons. "
    "Minimalist composition with ample negative space, slight 45-degree overhead angle. "
    "Shallow depth of field, fine film grain. Food styled with effortless imperfection — "
    "scattered crumbs, casual drizzles, a sprig of dried herbs. "
    "Serene, nostalgic slow-living atmosphere. Desaturated warm film-like tones.",

    # Style 2: Mediterranean Aperitivo
    "Mediterranean aperitivo food photography on warm honeyed wood table surface. "
    "Hard golden-hour sunlight from the side, sharp well-defined shadows, bright specular highlights "
    "on wet surfaces and glassware. Caustics from light through glasses on the wood. "
    "Rich warm palette — golden oak wood, olive green, cobalt blue, vermilion red, creamy off-white. "
    "Hand-painted artisanal ceramics with scalloped edges in green, blue, and yellow patterns. "
    "Small cut-crystal glasses, vintage serving pieces. "
    "Abundant artful composition — multiple dishes overlapping, some cropped at frame edges, "
    "implying a larger spread. High angle (45-60 degrees), moderately shallow depth of field. "
    "Colors are high saturation but natural, never synthetic. Convivial and inviting atmosphere.",

    # Style 3: Dark & Moody Chiaroscuro
    "Moody chiaroscuro food photography on dark slate, worn baking sheet, or aged stone surface. "
    "Soft directional window light from the side and slightly above, deep enveloping shadows. "
    "Shadows are warm dark brown, not pure black — details still visible within them. "
    "Desaturated earthy palette with one vibrant selective accent color from the food "
    "(deep red, bright green, or golden amber). Creamy off-whites, charcoal greys, earthy browns. "
    "Rustic speckled stoneware with matte glaze and unfinished rims, dark linen napkins. "
    "Tight intimate framing, very shallow depth of field with soft background blur. "
    "Fine film grain, subtle dark vignette. Specular highlights on olive oil and wet surfaces. "
    "Contemplative, sophisticated atmosphere inspired by Baroque still life painting.",

    # Style 4: Bold Editorial
    "Bold editorial food photography, strict overhead flat-lay composition. "
    "Hard direct light from above creating sharp crisp shadows and bright specular highlights. "
    "Bold saturated terracotta red or deep warm-toned colored surface as background. "
    "Clean off-white ceramic plates with subtle rim detail, matte black cutlery handles. "
    "High contrast between the saturated background and bright creamy white plates. "
    "Food accent colors are vibrant — fresh greens, reds, golden olive oil — against the bold ground. "
    "Asymmetric arrangement with plates partially cropped at frame edges. "
    "Deep depth of field keeping everything sharp. No film grain — clean, modern, precise. "
    "Confident, energetic, sophisticated restaurant aesthetic.",
]


def get_photo_style(index=None):
    """Pick a random photography style, or a specific one by index."""
    if index is not None and 0 <= index < len(PHOTO_STYLES):
        return PHOTO_STYLES[index]
    return random.choice(PHOTO_STYLES)


# Keep for backwards compat
DEFAULT_FOOD_STYLE = PHOTO_STYLES[0]

# Cuisine-specific props and context for styling the photo
CUISINE_PROPS = {
    "Italian": "rustic bread, olive oil cruet, parmesan wedge, red wine glass, fresh basil",
    "French": "wine glass, butter dish, linen napkin, fresh herbs, baguette slice",
    "Thai": "chopsticks, small condiment bowls, lime wedges, chili flakes, jasmine rice",
    "Japanese": "chopsticks on ceramic rest, soy sauce dish, pickled ginger, matcha bowl",
    "Mexican": "lime wedges, cilantro sprigs, colorful Talavera ceramic, corn tortillas",
    "Indian": "small katori bowls, raita, naan bread, fresh cilantro, turmeric-stained cloth",
    "Chinese": "chopsticks, tea cup, steamer basket, soy sauce, scallion garnish",
    "American": "casual plating, cloth napkin, glass of water or lemonade, simple cutlery",
    "Mediterranean": "olive oil, hummus bowl, pita, fresh vegetables, herbs",
    "Korean": "small banchan dishes, kimchi, rice bowl, wooden chopsticks",
    "Middle Eastern": "flatbread, small dipping bowls, pomegranate seeds, fresh mint",
    "Vietnamese": "herbs plate, fish sauce dish, lime wedge, chopsticks, broth bowl",
}


def _slugify(title: str) -> str:
    """Convert a recipe title to a URL-safe slug."""
    slug = title.lower().strip()
    slug = re.sub(r"[''`]", "", slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def generate_recipe_photo(
    title: str,
    subject_description: str,
    cuisine: str = "",
    custom_style: str = None,
    aspect_ratio: str = "4:3"
) -> str:
    """
    Generate a food photo for a recipe.

    The subject_description should already contain Claude's intelligent
    analysis of what the finished dish looks like based on the recipe
    instructions — not just the dish name.

    Args:
        title: Recipe title (used for filename)
        subject_description: Detailed visual description of the finished dish
        cuisine: Cuisine type for prop styling
        custom_style: Override the default photography style
        aspect_ratio: Image aspect ratio (default "4:3")

    Returns:
        Path to the saved photo (e.g., "recipes/photos/brown-butter-ice-cream.png")
    """
    # Build cuisine context
    props = CUISINE_PROPS.get(cuisine, "clean styling, minimal props, linen napkin")
    context = f"Styled with: {props}. Single serving, intimate scale."

    # Combine the three layers
    style = custom_style or get_photo_style()
    full_prompt = f"{subject_description}\n\n{context}\n\n{style}"

    # Generate via image_gen module
    from image_gen import generate, new_session

    new_session()
    photo_path = generate(
        prompt=full_prompt,
        aspect_ratio=aspect_ratio,
        model="gemini-3-pro-image-preview"
    )

    # Rename to recipe slug
    if photo_path:
        slug = _slugify(title)
        final_path = f"recipes/photos/{slug}.png"
        Path("recipes/photos").mkdir(parents=True, exist_ok=True)

        if os.path.abspath(photo_path) != os.path.abspath(final_path):
            shutil.move(photo_path, final_path)

        print(f"Recipe photo saved: {final_path}")
        return final_path

    print("Warning: No photo was generated.")
    return None


if __name__ == "__main__":
    print("Recipe Photo Generator loaded.")
    print("Usage: generate_recipe_photo(title, subject_description, cuisine)")
    print("")
    print("The subject_description should be Claude's analysis of what the")
    print("finished dish looks like based on the recipe instructions.")
