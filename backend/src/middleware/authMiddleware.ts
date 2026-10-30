import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../utils/env';
import { JwtPayload } from '../types';

/**
 * Protect middleware — verifies the JWT cookie and attaches the user to req.user.
 * Returns 401 if the token is missing, invalid, or the user no longer exists.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.cookies?.jwt as string | undefined;

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
    res
      .status(401)
      .json({ message: 'Not authorized to access this route, token invalid or expired' });
  }
};
