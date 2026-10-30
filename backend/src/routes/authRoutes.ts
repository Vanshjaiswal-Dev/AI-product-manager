import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Strict rate-limiting on credential endpoints
router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);

// Token rotation — has its own path cookie restriction (`/api/auth`)
router.post('/refresh', refresh);

// Session termination
router.post('/logout', logout);

// Protected profile route
router.get('/me', protect, me);

export default router;
