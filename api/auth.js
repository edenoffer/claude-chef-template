import { kv } from './_lib/kv.js';
import { createToken, verifyToken, getSessionToken, hashPassword, SESSION_COOKIE_OPTIONS } from './_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, password } = req.body;

  if (action === 'check') {
    const storedHash = await kv.get('password');
    const passwordSet = !!storedHash;
    if (!passwordSet) {
      return res.json({ passwordSet: false, authenticated: true });
    }
    const token = getSessionToken(req);
    const authenticated = token ? verifyToken(token) : false;
    return res.json({ passwordSet: true, authenticated });
  }

  if (action === 'login') {
    const storedHash = await kv.get('password');
    if (!storedHash) {
      // No password set — allow access
      return res.json({ ok: true });
    }

    if (!password) {
      return res.status(401).json({ error: 'Password required' });
    }

    const hash = hashPassword(password);
    if (hash !== storedHash) {
      return res.status(401).json({ error: 'Wrong password, chef.' });
    }

    const token = createToken();
    res.setHeader('Set-Cookie', `session=${token}; ${SESSION_COOKIE_OPTIONS}`);
    return res.json({ ok: true });
  }

  if (action === 'set-password') {
    if (password) {
      const hash = hashPassword(password);
      await kv.set('password', hash);
    } else {
      await kv.del('password');
    }
    return res.json({ ok: true });
  }

  if (action === 'logout') {
    res.setHeader('Set-Cookie', 'session=; Path=/; Max-Age=0');
    return res.json({ ok: true });
  }

  res.status(400).json({ error: 'Unknown action' });
}
