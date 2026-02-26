import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours (server-side token validity)

export function createToken() {
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', SECRET).update(timestamp).digest('hex');
  return `${timestamp}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > MAX_AGE_MS || age < 0) return false;

  const expected = crypto.createHmac('sha256', SECRET).update(timestamp).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Generate a salted password hash: "salt:hash"
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify password against a stored "salt:hash" or legacy plain SHA256 hash
export function verifyPassword(password, stored) {
  if (!stored) return false;
  try {
    if (stored.includes(':')) {
      const [salt, hash] = stored.split(':');
      const attempt = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      const a = Buffer.from(attempt);
      const b = Buffer.from(hash);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
    // Legacy: plain SHA256 (for existing passwords set before this change)
    const legacy = crypto.createHash('sha256').update(password).digest('hex');
    return legacy === stored;
  } catch {
    return false;
  }
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// Session cookie (no Max-Age = expires when browser closes, re-auth required per browser session)
export const SESSION_COOKIE_OPTIONS = 'Path=/; HttpOnly; Secure; SameSite=Strict';

export function getSessionToken(req) {
  const cookie = req.headers?.cookie || '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/);
  return match ? match[1] : null;
}
