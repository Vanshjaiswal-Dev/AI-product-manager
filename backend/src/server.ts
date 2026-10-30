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

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Health-check ──────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({ message: 'AI Product Manager API is running ✅' });
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api',      planRoutes);

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
