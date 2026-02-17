import { kv } from './_lib/kv.js';
import { verifyToken, getSessionToken } from './_lib/session.js';

export default async function handler(req, res) {
  // Auth guard — chat history is private
  try {
    const passwordSet = !!(await kv.get('password'));
    if (passwordSet) {
      const token = getSessionToken(req);
      if (!token || !verifyToken(token)) {
        return res.status(401).json({ error: 'Authentication required' });
      }
    }
  } catch (e) { /* KV unavailable — allow access */ }

  if (req.method === 'GET') {
    try {
      const chats = await kv.get('chats') || [];
      return res.json(chats);
    } catch (e) {
      return res.json([]);
    }
  }

  if (req.method === 'POST') {
    try {
      const { chats } = req.body;
      if (!Array.isArray(chats)) {
        return res.status(400).json({ error: 'chats array required' });
      }
      // Enforce 20-chat limit server-side
      const trimmed = chats.slice(0, 20);
      await kv.set('chats', trimmed);
      return res.json({ ok: true, count: trimmed.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id query param required' });
      const chats = await kv.get('chats') || [];
      const filtered = chats.filter(c => c.id !== id);
      await kv.set('chats', filtered);
      return res.json({ ok: true, remaining: filtered.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
