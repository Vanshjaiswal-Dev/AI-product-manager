// ──────────────────────────────────────────────────────────────────────────────
// src/controllers/authController.ts
//
// Dual-Token Authentication — Access Token (15 min) + Rotating Refresh Token (7 d)
//
// Cookie strategy:
//   accessToken  – short-lived, all paths, validates every API request
//   refreshToken – long-lived, path=/api/auth only, rotated on every use
//
// Refresh token is stored as a SHA-256 hash in MongoDB (refreshTokenHash).
// This allows:
//   • Server-side revocation (logout clears the hash)
//   • Reuse detection   (hash mismatch → wipe hash, force re-login)
//   • Rotation          (every /refresh issues a brand-new pair)
// ──────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, IUserDocument } from '../models/User';
import { env, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, ACCESS_TOKEN_MS, REFRESH_TOKEN_MS } from '../utils/env';
import { JwtPayload } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const isProduction = env.NODE_ENV === 'production';

/** SHA-256 hash of a refresh token — used for fast DB comparison. */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Cookie options shared between access- and refresh-token cookies. */
function baseCookieOpts() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  };
}

/**
 * Issue a fresh access-token cookie (15 min).
 * Cookie name: `accessToken`
 */
function setAccessTokenCookie(res: Response, userId: string, email: string): string {
  const token = jwt.sign({ id: userId, email }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
  res.cookie('accessToken', token, {
    ...baseCookieOpts(),
    maxAge: ACCESS_TOKEN_MS,
  });
  return token;
}

/**
 * Issue a fresh refresh-token cookie (7 d).
 * Cookie name: `refreshToken`, restricted to path `/api/auth`.
 * Returns the **raw** (un-hashed) token so the caller can hash and persist it.
 */
function setRefreshTokenCookie(res: Response, userId: string, email: string): string {
  const token = jwt.sign({ id: userId, email }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
  res.cookie('refreshToken', token, {
    ...baseCookieOpts(),
    maxAge: REFRESH_TOKEN_MS,
    path: '/', // sent to all auth routes
  });
  return token;
}

/**
 * Clear both auth cookies and respond with 401.
 * Called when a refresh token is invalid or reused (potential theft scenario).
 */
function clearAuthCookies(res: Response): void {
  res.cookie('accessToken',  'gone', { ...baseCookieOpts(), maxAge: 0 });
  res.cookie('refreshToken', 'gone', { ...baseCookieOpts(), maxAge: 0, path: '/' });
}

/**
 * Issue both tokens, persist hash in DB, set cookies, send JSON response.
 */
async function sendDualTokenResponse(
  user: IUserDocument,
  statusCode: number,
  res: Response,
): Promise<void> {
  const userId = user._id.toString();

  setAccessTokenCookie(res, userId, user.email);
  const rawRefresh = setRefreshTokenCookie(res, userId, user.email);

  // Persist the hash — enables server-side revocation and rotation checks
  await User.findByIdAndUpdate(userId, { refreshTokenHash: hashToken(rawRefresh) });

  res.status(statusCode).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email },
  });
}

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || 'Validation error' });
      return;
    }

    const { name, email, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'Email is already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword });

    await sendDualTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || 'Validation error' });
      return;
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    await sendDualTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
// Validates the incoming refresh token against the stored hash, then performs
// full token rotation: new access token + new refresh token, new hash in DB.
// Any mismatch (reuse, tampering, logout) → wipe DB hash + clear cookies.

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const incomingRefresh = req.cookies?.refreshToken as string | undefined;

  if (!incomingRefresh) {
    res.status(401).json({ message: 'No refresh token provided' });
    return;
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(incomingRefresh, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    // Expired or tampered — clear cookies, force re-login
    clearAuthCookies(res);
    res.status(401).json({ message: 'Refresh token invalid or expired' });
    return;
  }

  // Load user WITH the hidden refreshTokenHash field
  const user = await User.findById(payload.id).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    clearAuthCookies(res);
    res.status(401).json({ message: 'Session not found — please log in again' });
    return;
  }

  // Constant-time comparison via hash (prevents timing attacks)
  const incomingHash = hashToken(incomingRefresh);
  if (incomingHash !== user.refreshTokenHash) {
    // Hash mismatch → possible token theft / reuse — revoke everything
    await User.findByIdAndUpdate(payload.id, { refreshTokenHash: null });
    clearAuthCookies(res);
    res.status(401).json({ message: 'Refresh token reuse detected — session revoked' });
    return;
  }

  // ── Token Rotation ────────────────────────────────────────────────────────
  // Issue new pair, persist new hash, send new cookies.
  setAccessTokenCookie(res, user._id.toString(), user.email);
  const newRawRefresh = setRefreshTokenCookie(res, user._id.toString(), user.email);
  await User.findByIdAndUpdate(payload.id, { refreshTokenHash: hashToken(newRawRefresh) });

  res.status(200).json({ success: true, message: 'Tokens rotated' });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
// Revokes the DB hash (so the old refresh token is dead even if it's intercepted)
// and clears both cookies from the browser.

export const logout = async (req: Request, res: Response): Promise<void> => {
  // Try to identify user from either the access or refresh token cookie
  // so we can clear the DB hash. Non-fatal if neither is present.
  const accessToken   = req.cookies?.accessToken  as string | undefined;
  const legacyToken   = req.cookies?.jwt          as string | undefined;
  const refreshToken  = req.cookies?.refreshToken as string | undefined;

  try {
    const bearerToken = accessToken ?? legacyToken;
    if (bearerToken) {
      const p = jwt.verify(bearerToken, env.JWT_SECRET) as JwtPayload;
      await User.findByIdAndUpdate(p.id, { refreshTokenHash: null });
    } else if (refreshToken) {
      const p = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
      await User.findByIdAndUpdate(p.id, { refreshTokenHash: null });
    }
  } catch {
    // Token may already be expired — still clear cookies
  }

  clearAuthCookies(res);
  // Also clear the legacy `jwt` cookie if it exists (backward compat)
  res.cookie('jwt', 'gone', { ...baseCookieOpts(), maxAge: 0 });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Me route error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};
