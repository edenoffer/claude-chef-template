import { Redis } from '@upstash/redis';

// Support both Vercel KV (KV_REST_API_*) and native Upstash (UPSTASH_REDIS_REST_*) env vars
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const kv = url && token ? new Redis({ url, token }) : Redis.fromEnv();
