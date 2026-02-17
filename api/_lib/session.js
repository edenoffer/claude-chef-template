import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const SESSION_COOKIE_OPTIONS = 'Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000';

export function getSessionToken(req) {
  const cookie = req.headers?.cookie || '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/);
  return match ? match[1] : null;
}
