// ──────────────────────────────────────────────────────────────────────────────
// src/middleware/authMiddleware.ts
//
// Protect middleware — verifies the short-lived access token and attaches
// the user to req.user.
//
// Cookie read order (backward-compatible):
//   1. `accessToken` – new dual-token cookie name
//   2. `jwt`         – legacy cookie name (removed once all sessions migrate)
//
// Returns 401 if the token is missing, invalid, or the user no longer exists.
// The frontend's Axios interceptor handles 401 → silent refresh transparently.
// ──────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../utils/env';
import { JwtPayload } from '../types';

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Accept new cookie name first, fall back to legacy name for existing sessions
  const token = (req.cookies?.accessToken ?? req.cookies?.jwt) as string | undefined;

  if (!token) {
    res
      .status(401)
      .json({ message: 'Not authorized to access this route, no token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ message: 'Not authorized, user not found' });
      return;
    }

    req.user = user;
    next();
  } catch {
    // Token expired or tampered — let the frontend's interceptor call /refresh
    res
      .status(401)
      .json({ message: 'Access token expired or invalid' });
  }
};
