import { kv } from './_lib/kv.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const ratings = await kv.get('ratings') || {};
      return res.json(ratings);
    } catch (e) {
      return res.json({});
    }
  }

  if (req.method === 'POST') {
    const { slug, rating } = req.body;
    if (!slug || typeof rating !== 'number') {
      return res.status(400).json({ error: 'slug and rating required' });
    }

    const ratings = await kv.get('ratings') || {};
    if (rating === 0) {
      delete ratings[slug];
    } else {
      ratings[slug] = rating;
    }
    await kv.set('ratings', ratings);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
