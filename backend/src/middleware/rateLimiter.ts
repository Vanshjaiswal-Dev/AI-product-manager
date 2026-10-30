// ──────────────────────────────────────────────────────────────────────────────
// src/middleware/rateLimiter.ts
//
// Express rate-limit middleware to prevent abuse of auth and generation routes.
// ──────────────────────────────────────────────────────────────────────────────

import rateLimit from 'express-rate-limit';

/**
 * Strict limiter for auth endpoints (login, register).
 * Allows 10 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth requests from this IP. Please try again in 15 minutes.',
  },
});

/**
 * Limiter for AI generation endpoints.
 * Allows 5 requests per 10-minute window per IP.
 * Keeps us safe on free-tier Gemini API quotas.
 */
export const generationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Generation limit reached. Please wait 10 minutes before generating again.',
  },
});
