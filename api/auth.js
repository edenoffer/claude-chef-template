import { kv } from './_lib/kv.js';
import {
  createToken,
  verifyToken,
  getSessionToken,
  hashPassword,
  verifyPassword,
  generateToken,
  SESSION_COOKIE_OPTIONS,
} from './_lib/session.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

async function sendResetEmail(toEmail, resetUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Email service not configured (add RESEND_API_KEY to Vercel env)');

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      subject: 'Reset your recipe book password',
      html: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#2c2420;">
          <h2 style="color:#c2272d;">Your Recipe Book</h2>
          <p>Someone requested a password reset. If that was you, click the link below:</p>
          <p style="margin:1.5rem 0;">
            <a href="${resetUrl}" style="background:#c2272d;color:#fff;padding:0.75rem 1.5rem;border-radius:6px;text-decoration:none;font-weight:600;">
              Reset Password
            </a>
          </p>
          <p style="color:#888;font-size:0.85rem;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          <p style="color:#bbb;font-size:0.75rem;margin-top:2rem;border-top:1px solid #eee;padding-top:1rem;">${resetUrl}</p>
        </div>
      `,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Email send failed: ${err}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, password, email, token, newPassword } = req.body;

  // ── check ──────────────────────────────────────────────────────────────────
  if (action === 'check') {
    const storedHash = await kv.get('password');
    const passwordSet = !!storedHash;
    if (!passwordSet) return res.json({ passwordSet: false, authenticated: true });

    const sessionToken = getSessionToken(req);
    const authenticated = sessionToken ? verifyToken(sessionToken) : false;
    return res.json({ passwordSet: true, authenticated });
  }

  // ── login ──────────────────────────────────────────────────────────────────
  if (action === 'login') {
    const storedHash = await kv.get('password');
    if (!storedHash) return res.json({ ok: true }); // No password — open access

    if (!password) return res.status(401).json({ error: 'Password required' });

    if (!verifyPassword(password, storedHash)) {
      return res.status(401).json({ error: 'Wrong password, chef.' });
    }

    const sessionToken = createToken();
    res.setHeader('Set-Cookie', `session=${sessionToken}; ${SESSION_COOKIE_OPTIONS}`);
    return res.json({ ok: true });
  }

  // ── set-password ───────────────────────────────────────────────────────────
  if (action === 'set-password') {
    if (password) {
      await kv.set('password', hashPassword(password));
    } else {
      await kv.del('password');
    }
    // Optionally store/update the owner recovery email
    if (email) {
      await kv.set('owner_email', email.toLowerCase().trim());
    }
    return res.json({ ok: true });
  }

  // ── request-reset ──────────────────────────────────────────────────────────
  if (action === 'request-reset') {
    // Always respond with the same message to prevent email enumeration
    const genericOk = { ok: true, message: 'If that email matches your account, a reset link was sent.' };

    const ownerEmail = await kv.get('owner_email');
    if (!ownerEmail || !email || email.toLowerCase().trim() !== ownerEmail) {
      return res.json(genericOk);
    }

    const resetToken = generateToken(32);
    await kv.set('reset_token', { token: resetToken, expiry: Date.now() + RESET_TOKEN_TTL_MS });

    const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
    const resetUrl = `${siteUrl}/recipes/recipe-book.html?reset=${resetToken}`;

    try {
      await sendResetEmail(ownerEmail, resetUrl);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }

    return res.json(genericOk);
  }

  // ── verify-reset ───────────────────────────────────────────────────────────
  if (action === 'verify-reset') {
    if (!token) return res.status(400).json({ error: 'Token required' });
    const stored = await kv.get('reset_token');
    if (!stored || stored.token !== token || Date.now() > stored.expiry) {
      return res.status(400).json({ error: 'Reset link is invalid or expired.' });
    }
    return res.json({ ok: true });
  }

  // ── reset-password ─────────────────────────────────────────────────────────
  if (action === 'reset-password') {
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }
    const stored = await kv.get('reset_token');
    if (!stored || stored.token !== token || Date.now() > stored.expiry) {
      return res.status(400).json({ error: 'Reset link is invalid or expired.' });
    }

    await kv.set('password', hashPassword(newPassword));
    await kv.del('reset_token');

    // Log user in automatically after reset
    const sessionToken = createToken();
    res.setHeader('Set-Cookie', `session=${sessionToken}; ${SESSION_COOKIE_OPTIONS}`);
    return res.json({ ok: true });
  }

  // ── logout ─────────────────────────────────────────────────────────────────
  if (action === 'logout') {
    res.setHeader('Set-Cookie', 'session=; Path=/; Max-Age=0');
    return res.json({ ok: true });
  }

  res.status(400).json({ error: 'Unknown action' });
}
