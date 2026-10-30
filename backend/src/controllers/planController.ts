// ──────────────────────────────────────────────────────────────────────────────
// src/controllers/planController.ts
//
// Business logic for all plan-related routes:
//
//   POST /api/generate-requirements  → generateRequirements
//   POST /api/generate-schema        → generateSchema
//   POST /api/generate-apis          → generateApis
//   POST /api/generate-sprint-plan   → generateSprintPlan
//   GET  /api/plans                  → getAllPlans
//   GET  /api/plans/:id              → getPlanById
//
// ── Design: update-or-create (upsert-like) ───────────────────────────────────
// If the caller sends a planId, the existing document is loaded and updated.
// If not, a new document is created (only used by generate-requirements).
// This allows the frontend to chain all 4 generators against ONE planId,
// resulting in a single complete Plan document instead of 4 separate records.
// ──────────────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { callGemini } from '../utils/geminiHelper';
import { Plan, IPlanDocument } from '../models/Plan';
import { AppError } from '../types';

// ── Shared helper: resolve the Plan document ──────────────────────────────────

async function resolvePlan(
  planId: string | undefined,
  idea: string,
  userId: string,
): Promise<{ plan: IPlanDocument; isNew: boolean }> {
  if (planId) {
    const existing = await Plan.findById(planId);
    if (!existing) {
      throw new AppError(`No plan found with id: ${planId}`, 404);
    }
    if (existing.userId.toString() !== userId) {
      throw new AppError('Not authorized to access this plan', 403);
    }
    return { plan: existing, isNew: false };
  }
  return {
    plan: new Plan({ idea: idea.trim(), userId: new Types.ObjectId(userId) }),
    isNew: true,
  };
}

// ── Error response helper ─────────────────────────────────────────────────────

function sendError(res: Response, error: unknown): void {
  const err = error as AppError;
  res.status(err.statusCode ?? 500).json({
    success: false,
    message: err.message ?? 'Internal Server Error',
    ...(err.rawOutput !== undefined && { rawOutput: err.rawOutput }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /api/generate-requirements
// ─────────────────────────────────────────────────────────────────────────────

export const generateRequirements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idea, planId } = req.body as { idea?: string; planId?: string };
    if (!idea?.trim()) {
      res.status(400).json({ success: false, message: 'Bad Request: `idea` is required.' });
      return;
    }

    const prompt = `
You are a senior product manager and software architect.

A user has submitted the following product idea:
"${idea.trim()}"

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

    const parsed = await callGemini(prompt);
    if (!Array.isArray(parsed.features) || !Array.isArray(parsed.userStories)) {
      res.status(502).json({
        success: false,
        message: 'AI response is missing `features` or `userStories` arrays.',
        parsedOutput: parsed,
      });
      return;
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());
    plan.requirements = parsed as never;
    if (isNew) plan.idea = idea.trim();

    const saved = await plan.save();
    res.status(isNew ? 201 : 200).json({ success: true, data: saved });
  } catch (error) {
    console.error('generateRequirements error:', error);
    sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/generate-schema
// ─────────────────────────────────────────────────────────────────────────────

export const generateSchema = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idea, planId } = req.body as { idea?: string; planId?: string };
    if (!idea?.trim()) {
      res.status(400).json({ success: false, message: 'Bad Request: `idea` is required.' });
      return;
    }

    const prompt = `
You are a senior database architect and backend engineer.

A user has submitted the following product idea:
"${idea.trim()}"

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
      res.status(502).json({
        success: false,
        message: 'AI response is missing the `tables` array.',
        parsedOutput: parsed,
      });
      return;
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());
    plan.schema = parsed as never;
    if (isNew) plan.idea = idea.trim();

    const saved = await plan.save();
    res.status(isNew ? 201 : 200).json({ success: true, data: saved });
  } catch (error) {
    console.error('generateSchema error:', error);
    sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/generate-apis
// ─────────────────────────────────────────────────────────────────────────────

export const generateApis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idea, planId } = req.body as { idea?: string; planId?: string };
    if (!idea?.trim()) {
      res.status(400).json({ success: false, message: 'Bad Request: `idea` is required.' });
      return;
    }

    const prompt = `
You are a senior backend engineer and API designer.

A user has submitted the following product idea:
"${idea.trim()}"

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
      res.status(502).json({
        success: false,
        message: 'AI response is missing the `endpoints` array.',
        parsedOutput: parsed,
      });
      return;
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());
    plan.apis = parsed as never;
    if (isNew) plan.idea = idea.trim();

    const saved = await plan.save();
    res.status(isNew ? 201 : 200).json({ success: true, data: saved });
  } catch (error) {
    console.error('generateApis error:', error);
    sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/generate-sprint-plan
// ─────────────────────────────────────────────────────────────────────────────

export const generateSprintPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idea, planId } = req.body as { idea?: string; planId?: string };
    if (!idea?.trim()) {
      res.status(400).json({ success: false, message: 'Bad Request: `idea` is required.' });
      return;
    }

    const prompt = `
You are a senior engineering manager and agile project planner.

A user has submitted the following product idea:
"${idea.trim()}"

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
      res.status(502).json({
        success: false,
        message: 'AI response is missing the `sprints` array.',
        parsedOutput: parsed,
      });
      return;
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());
    plan.sprintPlan = parsed as never;
    if (isNew) plan.idea = idea.trim();

    const saved = await plan.save();
    res.status(isNew ? 201 : 200).json({ success: true, data: saved });
  } catch (error) {
    console.error('generateSprintPlan error:', error);
    sendError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/plans
// ─────────────────────────────────────────────────────────────────────────────

export const getAllPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await Plan.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    console.error('getAllPlans error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /api/plans/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getPlanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await Plan.findById(req.params.id).select('-__v');
    if (!plan) {
      res
        .status(404)
        .json({ success: false, message: `No plan found with id: ${req.params.id}` });
      return;
    }

    if (plan.userId.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to access this plan' });
      return;
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    const err = error as { name?: string };
    if (err.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: `Invalid plan id format: ${req.params.id as string}`,
      });
      return;
    }
    console.error('getPlanById error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
