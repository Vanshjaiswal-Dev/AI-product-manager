// ──────────────────────────────────────────────────────────────────────────────
// src/server.ts
//
// Entry point for the AI Product Manager backend.
//
// Responsibilities:
//   1. Validate environment variables (done eagerly by env.ts import)
//   2. Connect to MongoDB
//   3. Set up Express (middleware + routes)
//   4. Start the HTTP server (only after DB is ready)
// ──────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import env first — validates all env vars and exits on failure
import { env } from './utils/env';
import authRoutes from './routes/authRoutes';
import planRoutes from './routes/planRoutes';

const app: Application = express();

// Trust first proxy (Render, Railway, Vercel) so secure cookies and IPs resolve correctly
app.set('trust proxy', 1);

// ── Middleware ────────────────────────────────────────────────────────────────

const normalizedFrontendUrl = env.FRONTEND_URL.replace(/\/+$/, '');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or uptime pings)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');

    // Allow configured FRONTEND_URL, any vercel.app deployment, or localhost
    if (
      normalizedOrigin === normalizedFrontendUrl ||
      normalizedOrigin.endsWith('.vercel.app') ||
      normalizedOrigin.includes('localhost') ||
      normalizedOrigin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200,
}));
app.use(express.json());
app.use(cookieParser());

// ── Health-check ──────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({ message: 'AI Product Manager API is running ✅' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
// Supports both with and without '/api' prefix (e.g. /api/auth/login and /auth/login)
app.use('/api/auth', authRoutes);
app.use('/auth',      authRoutes);

app.use('/api',      planRoutes);
app.use('/',         planRoutes);

// ── Start ─────────────────────────────────────────────────────────────────────
// Wait for MongoDB before accepting traffic — prevents the API from serving
// requests when the database is unreachable.

mongoose
  .connect(env.MONGO_URI)
  .then(() => {
    console.log('✅  Connected to MongoDB');
    app.listen(Number(env.PORT), () => {
      console.log(`🚀  Server running on http://localhost:${env.PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
