// ──────────────────────────────────────────────────────────────────────────────
// src/utils/env.ts
//
// Validates ALL required environment variables at startup using Zod.
// If any required vars are missing or malformed, the server exits immediately
// with a clear error — fail-fast beats mysterious runtime errors.
//
// Every other module imports `env` from here instead of reading process.env
// directly, giving us full type safety for env vars throughout the codebase.
// ──────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  // ── JWT ────────────────────────────────────────────────────────────────────
  // Access token: short-lived (15 min), signed with JWT_SECRET.
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  // Refresh token: long-lived (7 d), signed with a separate secret.
  // Falls back to JWT_SECRET + '_refresh' so existing deployments don't crash
  // when upgrading — set it explicitly in production for true separation.
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default((process.env.JWT_SECRET ?? '') + '_refresh'),

  // ── AI ─────────────────────────────────────────────────────────────────────
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-lite'),

  // ── CORS ───────────────────────────────────────────────────────────────────
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid or missing environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`    ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
  throw new Error('Invalid environment variables');
}

export const env: Env = parsed.data;

// ── Token TTLs (centralised so both the controller and tests agree) ───────────
export const ACCESS_TOKEN_TTL  = '15m';
export const REFRESH_TOKEN_TTL = '7d';
export const ACCESS_TOKEN_MS   = 15 * 60 * 1000;           // 15 minutes in ms
export const REFRESH_TOKEN_MS  = 7 * 24 * 60 * 60 * 1000;  // 7 days in ms
