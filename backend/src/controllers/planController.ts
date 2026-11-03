// ──────────────────────────────────────────────────────────────────────────────
// src/controllers/planController.ts
//
// Business logic for all plan-related routes:
//
//   POST /api/generate-full-plan      → generateFullPlan
//   POST /api/generate-requirements   → generateRequirements
//   POST /api/generate-schema         → generateSchema
//   POST /api/generate-apis           → generateApis
//   POST /api/generate-sprint-plan    → generateSprintPlan
//   GET  /api/plans                   → getAllPlans
//   GET  /api/plans/:id               → getPlanById
//
// ── Design: update-or-create (upsert-like) ───────────────────────────────────
// If the caller sends a planId, the existing document is loaded and updated.
// If not, a new document is created (only used by generate-requirements).
// This allows the frontend to chain all 4 generators against ONE planId,
// resulting in a single complete Plan document instead of 4 separate records.
//
// ── Task 2: Zod validation ───────────────────────────────────────────────────
// Every LLM response is validated through the matching Zod schema before being
// assigned to the Mongoose document. This removes all `as never` casts and
// ensures structural correctness at runtime.
//
// ── Task 3: Context-aware regeneration ───────────────────────────────────────
// Granular section regeneration endpoints now fetch the existing Plan from
// MongoDB and inject the already-generated context into the prompt, preventing
// entity drift between sections.
// ──────────────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { callGemini } from '../utils/geminiHelper';
import { Plan, IPlanDocument } from '../models/Plan';
import { AppError } from '../types';
import {
  RequirementsSchema,
  DbSchemaSchema,
  ApisSchema,
  SprintPlanSchema,
  FullPlanResponseSchema,
} from '../utils/planZodSchemas';

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
// 0. POST /api/generate-full-plan (Single fast Gemini call for all sections)
// ─────────────────────────────────────────────────────────────────────────────

export const generateFullPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idea, planId, selected = ['requirements', 'schema', 'apis', 'sprint'] } = req.body as {
      idea?: string;
      planId?: string;
      selected?: string[];
    };

    if (!idea?.trim()) {
      res.status(400).json({ success: false, message: 'Bad Request: `idea` is required.' });
      return;
    }

    const sectionsToInclude: string[] = [];

    if (selected.includes('requirements')) {
      sectionsToInclude.push(`
  "requirements": {
    "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
    "userStories": ["As a <role>, I want to <goal>, so that <benefit>.", "As a <role>, I want to <goal>, so that <benefit>."]
  }`);
    }

    if (selected.includes('schema')) {
      sectionsToInclude.push(`
  "schema": {
    "tables": [
      {
        "tableName": "TableName",
        "fields": [
          { "name": "fieldName", "type": "String|Number|Date|ObjectId", "description": "Field description" }
        ]
      }
    ]
  }`);
    }

    if (selected.includes('apis')) {
      sectionsToInclude.push(`
  "apis": {
    "endpoints": [
      { "method": "GET|POST|PUT|DELETE", "endpoint": "/api/resource", "description": "Endpoint description" }
    ]
  }`);
    }

    if (selected.includes('sprint')) {
      sectionsToInclude.push(`
  "sprintPlan": {
    "sprints": [
      {
        "sprintName": "Sprint 1 — Foundation",
        "duration": "2 weeks",
        "tasks": ["Task 1", "Task 2", "Task 3"]
      }
    ]
  }`);
    }

    const prompt = `
You are a Principal Product Manager, Lead Database Architect, and Technical Director.
Analyze this product idea:
"${idea.trim()}"

Generate a complete, production-grade technical specification in JSON format matching this exact shape:
{
${sectionsToInclude.join(',\n')}
}

Quality & Completeness Rules:
- If requirements are included:
  * Provide 6-8 comprehensive features with a bold title and clear operational details (e.g. "Split Calculation Engine: Handles equal, percentage, and exact splits with floating-point rounding safeguards").
  * Provide 6-8 user stories covering distinct roles (e.g. Creator, Participant, Admin) in the strict format "As a <role>, I want to <goal>, so that <benefit>."
- If schema is included:
  * Provide 4-6 normalized database tables/collections.
  * Each table must include 4-8 fields with proper data types (String, Number, Date, ObjectId, Boolean, Array).
  * Explicitly include foreign keys (e.g. "userId: ObjectId -> references Users table"), audit timestamps, and status enums where applicable.
- If apis are included:
  * Provide 8-12 RESTful endpoints with standard HTTP verbs (GET, POST, PUT, PATCH, DELETE).
  * Use RESTful paths (e.g. /api/groups, /api/groups/:id/expenses, /api/settlements/:id/pay).
  * Provide concise descriptions detailing request payload purpose and return value.
- If sprintPlan is included:
  * Provide 4 logical development sprints:
    1. Sprint 1 — Project Foundation, Auth & Core Models
    2. Sprint 2 — Core Domain Logic & Business Rules
    3. Sprint 3 — Integrations, Transactions & Settlement Flow
    4. Sprint 4 — Analytics, Dashboard, Performance & Production Launch
  * Each sprint must contain 4-6 concrete, developer-ready engineering tasks.
- Consistency: All tables, APIs, and sprint tasks must strictly align on the same domain entities and naming conventions.
- Output ONLY valid JSON adhering strictly to the format.
    `.trim();

    const parsed = await callGemini(prompt);

    // ── Task 2: Zod validation ────────────────────────────────────────────────
    const validation = FullPlanResponseSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn('[planController] Zod validation failed for full plan:', validation.error.issues);
      // Surface the first issue to the caller for debuggability
      res.status(502).json({
        success: false,
        message: `AI response did not match expected schema: ${validation.error.issues[0]?.message ?? 'Unknown error'}`,
      });
      return;
    }

    const validData = validation.data;
    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());

    if (validData.requirements) plan.requirements = validData.requirements;
    if (validData.schema)       plan.schema       = validData.schema as unknown as typeof plan.schema;
    if (validData.apis)         plan.apis         = validData.apis;
    if (validData.sprintPlan)   plan.sprintPlan   = validData.sprintPlan;
    if (isNew) plan.idea = idea.trim();

    const saved = await plan.save();
    res.status(isNew ? 201 : 200).json({ success: true, data: saved });
  } catch (error) {
    console.error('generateFullPlan error:', error);
    sendError(res, error);
  }
};

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
You are a Principal Product Manager and Enterprise Solution Architect.

A user has submitted the following product idea:
"${idea.trim()}"

Your task is to analyze this idea and generate an executive-grade, structured requirements document.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text before or after.

The JSON must follow this exact shape:
{
  "features": [
    "Feature Name: In-depth description of functionality, business rationale, and user experience"
  ],
  "userStories": [
    "As a <role>, I want to <goal>, so that <benefit>."
  ]
}

Rules:
- Generate between 6 and 10 high-impact features covering core workflows, edge-case protections, and user value.
- Generate between 6 and 10 user stories covering distinct personas (end-users, admins, power users).
- Each user story must strictly follow: "As a <role>, I want to <goal>, so that <benefit>."
- Do NOT include any text outside the JSON object.
    `.trim();

    const parsed = await callGemini(prompt);

    // ── Task 2: Zod validation ────────────────────────────────────────────────
    const validation = RequirementsSchema.safeParse(parsed);
    if (!validation.success) {
      res.status(502).json({
        success: false,
        message: `AI response validation failed: ${validation.error.issues[0]?.message ?? 'Invalid structure'}`,
        parsedOutput: parsed,
      });
      return;
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());
    plan.requirements = validation.data;
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

    // ── Task 3: Fetch existing context to prevent entity drift ────────────────
    let requirementsContext = '';
    if (planId) {
      const existing = await Plan.findById(planId).select('requirements').lean();
      if (existing?.requirements?.features?.length) {
        requirementsContext = `
The product requirements have already been defined. Use them as context to keep entities consistent:
Features: ${existing.requirements.features.slice(0, 5).join('; ')}
`;
      }
    }

    const prompt = `
You are a Principal Database Architect and Data Modeler.

A user has submitted the following product idea:
"${idea.trim()}"
${requirementsContext}
Your task is to design a complete, production-grade database schema for this application.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text before or after.

The JSON must follow this exact shape:
{
  "tables": [
    {
      "tableName": "TableName",
      "fields": [
        { "name": "field_name", "type": "DataType", "description": "What this field stores, relationships (foreign keys), or constraints" }
      ]
    }
  ]
}

Rules:
- Generate between 4 and 7 normalized tables/collections.
- Each table must have between 4 and 10 fields.
- Use realistic data types: String, Number, Boolean, Date, ObjectId, Array, Object.
- Clearly annotate foreign keys (e.g. "userId: ObjectId — Foreign key referencing User._id").
- Include proper timestamp fields (createdAt, updatedAt) and status indicators where appropriate.
- Do NOT include any text outside the JSON object.
    `.trim();

    const parsed = await callGemini(prompt);

    // ── Task 2: Zod validation ────────────────────────────────────────────────
    const validation = DbSchemaSchema.safeParse(parsed);
    if (!validation.success) {
      res.status(502).json({
        success: false,
        message: `AI response validation failed: ${validation.error.issues[0]?.message ?? 'Invalid structure'}`,
        parsedOutput: parsed,
      });
      return;
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());
    plan.schema = validation.data as unknown as typeof plan.schema;
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

    // ── Task 3: Inject schema context to keep endpoints consistent ────────────
    let schemaContext = '';
    if (planId) {
      const existing = await Plan.findById(planId).select('schema').lean();
      if (existing?.schema?.tables?.length) {
        const tableNames = existing.schema.tables.map((t) => t.tableName).join(', ');
        schemaContext = `
The database schema has already been defined with these tables: ${tableNames}.
Design RESTful endpoints that align with these entities.
`;
      }
    }

    const prompt = `
You are a Lead Backend Architect and API Designer.

A user has submitted the following product idea:
"${idea.trim()}"
${schemaContext}
Your task is to design a comprehensive, production-ready REST API specification for this application.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text before or after.

The JSON must follow this exact shape:
{
  "endpoints": [
    {
      "method": "GET",
      "endpoint": "/api/resource",
      "description": "Short description of what this route does, including key query params or payload purpose"
    }
  ]
}

Rules:
- Generate between 10 and 16 endpoints covering full CRUD and specialized business workflows.
- Use standard HTTP methods: GET, POST, PUT, PATCH, DELETE.
- Endpoint paths must adhere strictly to REST conventions (e.g. /api/groups, /api/groups/:id/expenses, /api/settlements/:id/pay).
- Descriptions should specify the input parameters/payload and expected response.
- Do NOT include any text outside the JSON object.
    `.trim();

    const parsed = await callGemini(prompt);

    // ── Task 2: Zod validation ────────────────────────────────────────────────
    const validation = ApisSchema.safeParse(parsed);
    if (!validation.success) {
      res.status(502).json({
        success: false,
        message: `AI response validation failed: ${validation.error.issues[0]?.message ?? 'Invalid structure'}`,
        parsedOutput: parsed,
      });
      return;
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());
    plan.apis = validation.data;
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

    // ── Task 3: Inject requirements + apis context for aligned sprint tasks ───
    let fullContext = '';
    if (planId) {
      const existing = await Plan.findById(planId).select('requirements apis').lean();
      const parts: string[] = [];
      if (existing?.requirements?.features?.length) {
        parts.push(`Features to build: ${existing.requirements.features.slice(0, 6).join('; ')}`);
      }
      if (existing?.apis?.endpoints?.length) {
        const epSummary = existing.apis.endpoints
          .slice(0, 6)
          .map((e) => `${e.method} ${e.endpoint}`)
          .join(', ');
        parts.push(`Key API endpoints: ${epSummary}`);
      }
      if (parts.length) {
        fullContext = `\nUse this existing plan context to create aligned sprint tasks:\n${parts.join('\n')}\n`;
      }
    }

    const prompt = `
You are a Senior Engineering Manager and Agile Scrum Master.

A user has submitted the following product idea:
"${idea.trim()}"
${fullContext}
Your task is to create a realistic, engineering-level sprint plan for delivering this product.

Respond with ONLY valid JSON — no markdown, no code fences, no extra text before or after.

The JSON must follow this exact shape:
{
  "sprints": [
    {
      "sprintName": "Sprint 1 — Foundation & Authentication",
      "duration": "2 weeks",
      "tasks": [
        "Concrete technical engineering task with technical scope"
      ]
    }
  ]
}

Rules:
- Generate 4 to 5 phased development sprints moving from architecture -> core domain -> integrations -> hardening/launch.
- Each sprint must have between 4 and 7 specific, actionable engineering tasks.
- Sprint names must be descriptive (e.g. "Sprint 1 — Data Architecture & Core Auth", "Sprint 2 — Business Logic & Calculation Engine").
- Durations should be standard (e.g. "2 weeks").
- Tasks must read like real developer tickets (e.g., "Implement JWT refresh token rotation with HttpOnly cookies", "Build debt minimization graph algorithm").
- Do NOT include any text outside the JSON object.
    `.trim();

    const parsed = await callGemini(prompt);

    // ── Task 2: Zod validation ────────────────────────────────────────────────
    const validation = SprintPlanSchema.safeParse(parsed);
    if (!validation.success) {
      res.status(502).json({
        success: false,
        message: `AI response validation failed: ${validation.error.issues[0]?.message ?? 'Invalid structure'}`,
        parsedOutput: parsed,
      });
      return;
    }

    const { plan, isNew } = await resolvePlan(planId, idea, req.user!._id.toString());
    plan.sprintPlan = validation.data;
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
