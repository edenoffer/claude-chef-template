import { kv } from './_lib/kv.js';
import { verifyToken, getSessionToken } from './_lib/session.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Auth guard for mutating operations
  if (req.method === 'DELETE') {
    try {
      const passwordSet = !!(await kv.get('password'));
      if (passwordSet) {
        const token = getSessionToken(req);
        if (!token || !verifyToken(token)) {
          return res.status(401).json({ error: 'Authentication required' });
        }
      }
    } catch (e) { /* KV unavailable — allow access */ }

    const { slug } = req.query || {};
    if (!slug) return res.status(400).json({ error: 'slug query param required' });

    try {
      const kvRecipes = await kv.get('recipes') || [];
      const filtered = kvRecipes.filter(r => r.slug !== slug);
      await kv.set('recipes', filtered);
      return res.json({ ok: true, slug, remaining: filtered.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  if (req.method === 'GET') {
    // 1. Read bundled JSON files from recipes/data/
    const bundledRecipes = readBundledRecipes();

    // 2. Read KV recipes (created via web chat)
    let kvRecipes = [];
    try {
      kvRecipes = await kv.get('recipes') || [];
    } catch (e) {
      // KV not available — return bundled only
    }

    // 3. Merge by slug (KV overlays on bundled — preserves bundled fields)
    const bySlug = {};
    bundledRecipes.forEach(r => bySlug[r.slug] = r);
    kvRecipes.forEach(r => bySlug[r.slug] = { ...bySlug[r.slug], ...r });

    const merged = Object.values(bySlug).sort((a, b) => (a.id || 0) - (b.id || 0));
    return res.json(merged);
  }

  if (req.method === 'POST') {
    const recipe = req.body;
    if (!recipe || !recipe.slug || !recipe.title) {
      return res.status(400).json({ error: 'Recipe must have slug and title' });
    }

    const kvRecipes = await kv.get('recipes') || [];

    // Assign ID (1000+ to avoid collision with bundled IDs 1-999)
    const maxId = kvRecipes.reduce((max, r) => Math.max(max, r.id || 0), 999);
    recipe.id = maxId + 1;
    recipe.rating = recipe.rating || 0;
    recipe.dateAdded = recipe.dateAdded || new Date().toISOString().split('T')[0];

    kvRecipes.push(recipe);
    await kv.set('recipes', kvRecipes);

    return res.json(recipe);
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function readBundledRecipes() {
  const recipes = [];
  try {
    const dataDir = path.join(process.cwd(), 'recipes', 'data');
    if (!fs.existsSync(dataDir)) return recipes;

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
        recipes.push(data);
      } catch (e) {
        // Skip malformed files
      }
    }
  } catch (e) {
    // Filesystem not available
  }
  return recipes;
}
