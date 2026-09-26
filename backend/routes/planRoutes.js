// ──────────────────────────────────────────────────────────────────────────────
// routes/planRoutes.js
//
// All plan-related routes. Mounted at /api in server.js, so full paths are:
//
//   POST   /api/generate-requirements  — Generate feature list + user stories
//   POST   /api/generate-schema        — Generate database schema
//   POST   /api/generate-apis          — Generate REST API endpoint list
//   POST   /api/generate-sprint-plan   — Generate sprint plan
//   GET    /api/plans                  — Fetch all saved plans (for history)
//   GET    /api/plans/:id              — Fetch one plan by MongoDB _id
// ──────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();

const {
  generateRequirements,
  generateSchema,
  generateApis,
  generateSprintPlan,
  getAllPlans,
  getPlanById,
} = require("../controllers/planController");

const { protect } = require("../middleware/authMiddleware");

// ── Apply auth middleware to ALL plan routes ─────────────────────────────────
router.use(protect);

// ── AI Generator Routes ───────────────────────────────────────────────────────
router.post("/generate-requirements", generateRequirements);
router.post("/generate-schema",       generateSchema);
router.post("/generate-apis",         generateApis);
router.post("/generate-sprint-plan",  generateSprintPlan);

// ── History / Dashboard Routes ────────────────────────────────────────────────
router.get("/plans",     getAllPlans);
router.get("/plans/:id", getPlanById);

module.exports = router;
