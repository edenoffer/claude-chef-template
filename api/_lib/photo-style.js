// Photography styles extracted from curated reference images using Gemini vision.
// Each style is distilled from real food photography references to ensure
// consistent, professional results. A random style is picked per photo.

const PHOTO_STYLES = [
  // Style 1: Golden Hour Linen
  // Extracted from: sunlit drinks on cream, passionfruit on linen, peaches outdoors, fig crostini
  // The signature "sun-drenched cream" look — bright, warm, minimal
  'Sun-drenched food photography on cream linen or warm off-white surface. ' +
  'Hard natural sunlight from the side at a low angle casting long, crisp, dramatic shadows. ' +
  'Light refracting through glass creating bright caustic patterns on the surface. ' +
  'Warm golden color palette with creamy off-whites and desaturated warm tones. ' +
  'Handmade ceramic plates with raw clay rims, vintage crystal glassware, aged silver spoons. ' +
  'Minimalist composition with ample negative space, slight 45-degree overhead angle. ' +
  'Shallow depth of field, fine film grain. Food styled with effortless imperfection — ' +
  'scattered crumbs, casual drizzles, a sprig of dried herbs. ' +
  'Serene, nostalgic slow-living atmosphere. Desaturated warm film-like tones.',

  // Style 2: Mediterranean Aperitivo
  // Extracted from: sardines/tapas on wood, pear crostini on cutting board
  // The "convivial table" look — warm wood, colorful ceramics, abundance
  'Mediterranean aperitivo food photography on warm honeyed wood table surface. ' +
  'Hard golden-hour sunlight from the side, sharp well-defined shadows, bright specular highlights ' +
  'on wet surfaces and glassware. Caustics from light through glasses on the wood. ' +
  'Rich warm palette — golden oak wood, olive green, cobalt blue, vermilion red, creamy off-white. ' +
  'Hand-painted artisanal ceramics with scalloped edges in green, blue, and yellow patterns. ' +
  'Small cut-crystal glasses, vintage serving pieces. ' +
  'Abundant artful composition — multiple dishes overlapping, some cropped at frame edges, ' +
  'implying a larger spread. High angle (45-60 degrees), moderately shallow depth of field. ' +
  'Colors are high saturation but natural, never synthetic. Convivial and inviting atmosphere.',

  // Style 3: Dark & Moody Chiaroscuro
  // Extracted from: burrata pesto on dark surface, blood orange toast on baking sheet, citrus still life
  // The "dark and dramatic" look — deep shadows, selective focus, painterly
  'Moody chiaroscuro food photography on dark slate, worn baking sheet, or aged stone surface. ' +
  'Soft directional window light from the side and slightly above, deep enveloping shadows. ' +
  'Shadows are warm dark brown, not pure black — details still visible within them. ' +
  'Desaturated earthy palette with one vibrant selective accent color from the food ' +
  '(deep red, bright green, or golden amber). Creamy off-whites, charcoal greys, earthy browns. ' +
  'Rustic speckled stoneware with matte glaze and unfinished rims, dark linen napkins. ' +
  'Tight intimate framing, very shallow depth of field with soft background blur. ' +
  'Fine film grain, subtle dark vignette. Specular highlights on olive oil and wet surfaces. ' +
  'Contemplative, sophisticated atmosphere inspired by Baroque still life painting.',

  // Style 4: Bold Editorial
  // Extracted from: dishes on red tablecloth with overhead angle
  // The "graphic punch" look — bold color surface, hard light, confident
  'Bold editorial food photography, strict overhead flat-lay composition. ' +
  'Hard direct light from above creating sharp crisp shadows and bright specular highlights. ' +
  'Bold saturated terracotta red or deep warm-toned colored surface as background. ' +
  'Clean off-white ceramic plates with subtle rim detail, matte black cutlery handles. ' +
  'High contrast between the saturated background and bright creamy white plates. ' +
  'Food accent colors are vibrant — fresh greens, reds, golden olive oil — against the bold ground. ' +
  'Asymmetric arrangement with plates partially cropped at frame edges. ' +
  'Deep depth of field keeping everything sharp. No film grain — clean, modern, precise. ' +
  'Confident, energetic, sophisticated restaurant aesthetic.',
];

// Pick a random photography style (or use a specific index)
export function getPhotoStyle(index) {
  if (typeof index === 'number' && index >= 0 && index < PHOTO_STYLES.length) {
    return PHOTO_STYLES[index];
  }
  return PHOTO_STYLES[Math.floor(Math.random() * PHOTO_STYLES.length)];
}

// Keep DEFAULT_FOOD_STYLE export for backwards compat
export const DEFAULT_FOOD_STYLE = PHOTO_STYLES[0];

// Cuisine-specific props and context
export const CUISINE_PROPS = {
  Italian: 'rustic bread, olive oil cruet, parmesan wedge, red wine glass, fresh basil',
  French: 'wine glass, butter dish, linen napkin, fresh herbs, baguette slice',
  Thai: 'chopsticks, small condiment bowls, lime wedges, chili flakes, jasmine rice',
  Japanese: 'chopsticks on ceramic rest, soy sauce dish, pickled ginger, matcha bowl',
  Mexican: 'lime wedges, cilantro sprigs, colorful Talavera ceramic, corn tortillas',
  Indian: 'small katori bowls, raita, naan bread, fresh cilantro, turmeric-stained cloth',
  Chinese: 'chopsticks, tea cup, steamer basket, soy sauce, scallion garnish',
  American: 'casual plating, cloth napkin, glass of water or lemonade, simple cutlery',
  Mediterranean: 'olive oil, hummus bowl, pita, fresh vegetables, herbs',
  Korean: 'small banchan dishes, kimchi, rice bowl, wooden chopsticks',
  'Middle Eastern': 'flatbread, small dipping bowls, pomegranate seeds, fresh mint',
  Vietnamese: 'herbs plate, fish sauce dish, lime wedge, chopsticks, broth bowl',
};

export function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
