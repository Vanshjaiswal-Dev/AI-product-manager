// ──────────────────────────────────────────────────────────────────────────────
// src/utils/env.ts
//
// Validates ALL required environment variables at startup using Zod.
// If any are missing or malformed, the server exits immediately with a clear
// error message — fail-fast beats mysterious runtime errors deep in the code.
//
// Every other module imports `env` from here instead of reading process.env
// directly. This gives us full type safety for env vars throughout the codebase.
// ──────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
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
}

export const env: Env = parsed.data;
