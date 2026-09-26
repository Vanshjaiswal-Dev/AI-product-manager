// ──────────────────────────────────────────────────────────────────────────────
// models/Plan.js
//
// Mongoose model for a saved "plan" document.
//
// A single Plan document holds ALL four AI-generated outputs for one idea:
//   • requirements — feature list + user stories (generated first)
//   • schema       — database tables/collections + fields
//   • apis         — REST API endpoint list
//   • sprintPlan   — phased development timeline
//
// Each of the 4 output fields is OPTIONAL at creation time because the user
// generates them one at a time. The document is created when requirements are
// generated, then the other 3 fields are filled in via update calls.
// ──────────────────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schema 1: Requirements
// ─────────────────────────────────────────────────────────────────────────────
const requirementsSchema = new mongoose.Schema(
  {
    // Plain-English feature descriptions.
    // Example: ["User authentication", "Expense splitting dashboard"]
    features: { type: [String], default: [] },

    // Standard Agile user stories.
    // Format: "As a <role>, I want to <goal>, so that <benefit>."
    userStories: { type: [String], default: [] },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schema 2: Database Schema
// ─────────────────────────────────────────────────────────────────────────────

// Each field within a table/collection
const fieldSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true }, // e.g. "user_id"
    type:        { type: String, required: true }, // e.g. "ObjectId", "String", "Number"
    description: { type: String, default: "" },    // e.g. "Foreign key to Users table"
  },
  { _id: false }
);

// Each table/collection
const tableSchema = new mongoose.Schema(
  {
    tableName: { type: String, required: true }, // e.g. "Users", "Expenses"
    fields:    { type: [fieldSchema], default: [] },
  },
  { _id: false }
);

// The top-level schema field wraps an array of tables
const dbSchemaSchema = new mongoose.Schema(
  {
    tables: { type: [tableSchema], default: [] },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schema 3: API Endpoints
// ─────────────────────────────────────────────────────────────────────────────

const endpointSchema = new mongoose.Schema(
  {
    method:      { type: String, required: true }, // "GET" | "POST" | "PUT" | "DELETE"
    endpoint:    { type: String, required: true }, // e.g. "/api/users/:id"
    description: { type: String, default: "" },    // e.g. "Fetch a single user by ID"
  },
  { _id: false }
);

const apisSchema = new mongoose.Schema(
  {
    endpoints: { type: [endpointSchema], default: [] },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schema 4: Sprint Plan
// ─────────────────────────────────────────────────────────────────────────────

const sprintSchema = new mongoose.Schema(
  {
    sprintName: { type: String, required: true }, // e.g. "Sprint 1 — Foundation"
    duration:   { type: String, required: true }, // e.g. "2 weeks"
    tasks:      { type: [String], default: [] },  // list of dev tasks for this sprint
  },
  { _id: false }
);

const sprintPlanSchema = new mongoose.Schema(
  {
    sprints: { type: [sprintSchema], default: [] },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Schema: Plan
// ─────────────────────────────────────────────────────────────────────────────
const planSchema = new mongoose.Schema({
  // Link to the user who created this plan
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required to create a plan'],
  },

  // The raw idea text submitted by the user
  idea: {
    type: String,
    required: [true, "Idea is required"],
    trim: true,
  },

  // ── Four AI-generated output fields ──────────────────────────────────────
  // All are optional at creation (no `required: true`) because they are
  // populated one at a time as the user triggers each generator.

  requirements: {
    type: requirementsSchema,
    default: null,
  },

  schema: {
    type: dbSchemaSchema,
    default: null,
  },

  apis: {
    type: apisSchema,
    default: null,
  },

  sprintPlan: {
    type: sprintPlanSchema,
    default: null,
  },

  // Auto-set on creation, never updated
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Mongoose auto-creates a "plans" collection from this model name.
module.exports = mongoose.model("Plan", planSchema);
