import { kv } from './_lib/kv.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const settings = await kv.get('settings') || {};
      return res.json(settings);
    } catch (e) {
      return res.json({});
    }
  }

  if (req.method === 'POST') {
    const { title, subtitle, chefs } = req.body;
    const settings = await kv.get('settings') || {};
    if (title !== undefined) settings.title = title;
    if (subtitle !== undefined) settings.subtitle = subtitle;
    if (chefs !== undefined) settings.chefs = chefs; // array of chef name strings
    await kv.set('settings', settings);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
