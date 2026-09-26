// ──────────────────────────────────────────────────────────────────────────────
// server.js
//
// Entry point for the AI Product Manager backend.

//
// Responsibilities:
//   1. Load environment variables from .env
//   2. Connect to MongoDB using Mongoose
//   3. Set up the Express app (middleware + routes)
//   4. Start the HTTP server
// ──────────────────────────────────────────────────────────────────────────────

// ── 1. Load environment variables ─────────────────────────────────────────────
// dotenv reads the .env file and attaches each key to process.env.
// This MUST be called before any other code that reads process.env.
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Import routes
const planRoutes = require("./routes/planRoutes");
const authRoutes = require("./routes/authRoutes");

// ── 2. Initialise Express app ─────────────────────────────────────────────────
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

// cors() — allows the React frontend (running on a different port, e.g. 5173)
// to call this API without being blocked by the browser's same-origin policy.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// express.json() — parses incoming requests with a JSON body so that
// req.body is populated automatically.
app.use(express.json());

// cookie-parser() — parses cookies attached to the client request object
app.use(cookieParser());

// ── Health-check route ────────────────────────────────────────────────────────
// A simple GET / so you can quickly verify the server is running.
app.get("/", (req, res) => {
  res.json({ message: "AI Product Manager API is running ✅" });
});

// ── Mount routes ──────────────────────────────────────────────────────────────
// All routes are prefixed with /api.
app.use("/api/auth", authRoutes);
app.use("/api", planRoutes);

// ── 3. Connect to MongoDB, then start the server ──────────────────────────────
// We intentionally wait for the DB connection before listening for requests.
// This prevents the server from accepting traffic before the DB is ready.
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  // Hard-fail early so the developer immediately knows what's wrong.
  console.error(
    "❌  MONGO_URI is not defined. Please check your .env file."
  );
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅  Connected to MongoDB");

    // Only start listening AFTER the DB is ready.
    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    // If the DB connection fails, log the error and exit.
    // There is no point running the API if the database is unreachable.
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });
