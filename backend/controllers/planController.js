// ──────────────────────────────────────────────────────────────────────────────
// controllers/planController.js
//
// Contains the business logic for ALL plan-related routes:
//
//   POST /api/generate-requirements  → generateRequirements
//   POST /api/generate-schema        → generateSchema
//   POST /api/generate-apis          → generateApis
//   POST /api/generate-sprint-plan   → generateSprintPlan
//   GET  /api/plans                  → getAllPlans
//   GET  /api/plans/:id              → getPlanById
//
// ── Shared Pattern (for all 4 POST generators) ───────────────────────────────
//   1. Validate { idea } in req.body (required for all)
//   2. If { planId } is also provided → load & UPDATE that existing document
//      If not → CREATE a new document (used only by generate-requirements)
//   3. Build a strict-JSON prompt describing the desired output shape
//   4. Call callGemini(prompt) from utils/geminiHelper.js
//   5. Validate the parsed JSON has the required keys
//   6. Save/update MongoDB
//   7. Return the document
//
// ── Interview talking point ───────────────────────────────────────────────────
//   Using an "update-or-create" strategy (upsert-like) means the frontend can
//   chain all 4 generators against ONE planId, and the user ends up with a
//   single, complete Plan document in MongoDB instead of 4 separate records.
// ──────────────────────────────────────────────────────────────────────────────

const { callGemini } = require("../utils/geminiHelper");
const Plan = require("../models/Plan");

// ── Shared helper: resolve the Plan document ──────────────────────────────────
// If the caller sends a planId, load that existing document.
// If not, build a new (unsaved) Plan with the given idea.
// Returns { plan, isNew } so the calling controller knows which HTTP status
// to return (201 Created vs 200 OK).
async function resolvePlan(planId, idea, userId) {
  if (planId) {
    const existing = await Plan.findById(planId);
    if (!existing) {
      const err = new Error(`No plan found with id: ${planId}`);
      err.statusCode = 404;
      throw err;
    }
    if (existing.userId.toString() !== userId.toString()) {
      const err = new Error("Not authorized to access this plan");
      err.statusCode = 403;
      throw err;
    }
    return { plan: existing, isNew: false };
  }
  // No planId → create a fresh document (not saved yet)
  return { plan: new Plan({ idea: idea.toString().trim(), userId }), isNew: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /api/generate-requirements
// ─────────────────────────────────────────────────────────────────────────────
const generateRequirements = async (req, res) => {
  try {
    const { idea, planId } = req.body;

    // Validate: `idea` is always required for requirements generation
    if (!idea || !idea.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: `idea` field is required and cannot be empty.",
      });
    }

    // Build strict-JSON prompt
    const prompt = `
You are a senior product manager and software architect.

A user has submitted the following product idea:
"${idea.toString().trim()}"

Your task is to analyze this idea and generate a structured requirements document.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text before or after.

The JSON must follow this exact shape:
{
  "features": [
    "Short description of feature 1",
    "Short description of feature 2"
  ],
  "userStories": [
    "As a <role>, I want to <goal>, so that <benefit>.",
    "As a <role>, I want to <goal>, so that <benefit>."
  ]
}

Rules:
- Generate between 5 and 10 features.
- Generate between 5 and 10 user stories.
- Each feature should be a concise, plain-English description (1–2 sentences max).
- Each user story must strictly follow the format: "As a <role>, I want to <goal>, so that <benefit>."
- Do NOT include any text outside the JSON object.
    `.trim();

    // Call Gemini
    const parsed = await callGemini(prompt);

    // Validate shape
    if (!Array.isArray(parsed.features) || !Array.isArray(parsed.userStories)) {
      return res.status(502).json({
        success: false,
        message: "AI response is missing `features` or `userStories` arrays.",
        parsedOutput: parsed,
      });
    }

    // Resolve plan document (update existing or create new)
    const { plan, isNew } = await resolvePlan(planId, idea, req.user.id);
    plan.requirements = parsed;
    // If updating an existing doc, keep the original idea unless it isn't set
    if (isNew) plan.idea = idea.toString().trim();

    const saved = await plan.save();
    return res.status(isNew ? 201 : 200).json({ success: true, data: saved });

  } catch (error) {
    console.error("generateRequirements error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...(error.rawOutput && { rawOutput: error.rawOutput }),
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/generate-schema
// ─────────────────────────────────────────────────────────────────────────────
const generateSchema = async (req, res) => {
  try {
    const { idea, planId } = req.body;

    if (!idea || !idea.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: `idea` field is required and cannot be empty.",
      });
    }

    const prompt = `
You are a senior database architect and backend engineer.

A user has submitted the following product idea:
"${idea.toString().trim()}"

Your task is to design a complete database schema for this application.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text before or after.

The JSON must follow this exact shape:
{
  "tables": [
    {
      "tableName": "TableName",
      "fields": [
        { "name": "field_name", "type": "DataType", "description": "What this field stores" }
      ]
    }
  ]
}

Rules:
- Generate between 3 and 8 tables/collections.
- Each table must have between 3 and 10 fields.
- Use realistic data types: String, Number, Boolean, Date, ObjectId, Array, Object.
- Include at least one relationship (e.g., a foreign key field like "userId: ObjectId").
- Do NOT include any text outside the JSON object.
    `.trim();

    const parsed = await callGemini(prompt);

    if (!Array.isArray(parsed.tables)) {
      return res.status(502).json({
        success: false,
        message: "AI response is missing the `tables` array.",
        parsedOutput: parsed,
      });
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user.id);
    plan.schema = parsed;
    if (isNew) plan.idea = idea.toString().trim();

    const saved = await plan.save();
    return res.status(isNew ? 201 : 200).json({ success: true, data: saved });

  } catch (error) {
    console.error("generateSchema error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...(error.rawOutput && { rawOutput: error.rawOutput }),
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/generate-apis
// ─────────────────────────────────────────────────────────────────────────────
const generateApis = async (req, res) => {
  try {
    const { idea, planId } = req.body;

    if (!idea || !idea.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: `idea` field is required and cannot be empty.",
      });
    }

    const prompt = `
You are a senior backend engineer and API designer.

A user has submitted the following product idea:
"${idea.toString().trim()}"

Your task is to design a complete REST API for this application.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text before or after.

The JSON must follow this exact shape:
{
  "endpoints": [
    {
      "method": "GET",
      "endpoint": "/api/resource",
      "description": "Short description of what this route does"
    }
  ]
}

Rules:
- Generate between 8 and 15 endpoints.
- Use standard HTTP methods: GET, POST, PUT, PATCH, DELETE.
- Endpoint paths should follow REST conventions (e.g. /api/users, /api/users/:id).
- Descriptions should be concise (1 sentence max).
- Do NOT include any text outside the JSON object.
    `.trim();

    const parsed = await callGemini(prompt);

    if (!Array.isArray(parsed.endpoints)) {
      return res.status(502).json({
        success: false,
        message: "AI response is missing the `endpoints` array.",
        parsedOutput: parsed,
      });
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user.id);
    plan.apis = parsed;
    if (isNew) plan.idea = idea.toString().trim();

    const saved = await plan.save();
    return res.status(isNew ? 201 : 200).json({ success: true, data: saved });

  } catch (error) {
    console.error("generateApis error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...(error.rawOutput && { rawOutput: error.rawOutput }),
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/generate-sprint-plan
// ─────────────────────────────────────────────────────────────────────────────
const generateSprintPlan = async (req, res) => {
  try {
    const { idea, planId } = req.body;

    if (!idea || !idea.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: `idea` field is required and cannot be empty.",
      });
    }

    const prompt = `
You are a senior engineering manager and agile project planner.

A user has submitted the following product idea:
"${idea.toString().trim()}"

Your task is to break the development of this product into a phased sprint plan.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text before or after.

The JSON must follow this exact shape:
{
  "sprints": [
    {
      "sprintName": "Sprint 1 — Foundation",
      "duration": "2 weeks",
      "tasks": [
        "Set up project repository and CI/CD pipeline",
        "Implement user authentication (JWT)"
      ]
    }
  ]
}

Rules:
- Generate between 3 and 6 sprints.
- Each sprint should have between 3 and 8 tasks.
- Sprint names should be descriptive (e.g. "Sprint 1 — Authentication & Core Data").
- Duration should be realistic (e.g. "1 week", "2 weeks", "3 weeks").
- Tasks should be concrete engineering tasks, not vague descriptions.
- Do NOT include any text outside the JSON object.
    `.trim();

    const parsed = await callGemini(prompt);

    if (!Array.isArray(parsed.sprints)) {
      return res.status(502).json({
        success: false,
        message: "AI response is missing the `sprints` array.",
        parsedOutput: parsed,
      });
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user.id);
    plan.sprintPlan = parsed;
    if (isNew) plan.idea = idea.toString().trim();

    const saved = await plan.save();
    return res.status(isNew ? 201 : 200).json({ success: true, data: saved });

  } catch (error) {
    console.error("generateSprintPlan error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...(error.rawOutput && { rawOutput: error.rawOutput }),
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/plans — Return all saved plans (newest first)
// ─────────────────────────────────────────────────────────────────────────────
const getAllPlans = async (req, res) => {
  try {
    // Sort by newest first. Exclude the __v field (Mongoose internal version key).
    const plans = await Plan.find({ userId: req.user.id }).sort({ createdAt: -1 }).select("-__v");
    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("getAllPlans error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /api/plans/:id — Return one specific plan by its MongoDB _id
// ─────────────────────────────────────────────────────────────────────────────
const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).select("-__v");

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: `No plan found with id: ${req.params.id}`,
      });
    }

    if (plan.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this plan",
      });
    }

    return res.status(200).json({ success: true, data: plan });
  } catch (error) {
    // Mongoose throws a CastError if the id format is invalid (not a valid ObjectId)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid plan id format: ${req.params.id}`,
      });
    }
    console.error("getPlanById error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Export all six controller functions
module.exports = {
  generateRequirements,
  generateSchema,
  generateApis,
  generateSprintPlan,
  getAllPlans,
  getPlanById,
};
