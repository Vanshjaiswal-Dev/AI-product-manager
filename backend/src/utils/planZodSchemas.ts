// ──────────────────────────────────────────────────────────────────────────────
// src/utils/planZodSchemas.ts
//
// Zod schemas that mirror the Mongoose Plan model's sub-schemas.
// Use `safeParse` before assigning parsed LLM output to the plan document so
// any structural deviation is caught at runtime rather than stored silently.
// ──────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// ── Leaf schemas ──────────────────────────────────────────────────────────────

export const RequirementsSchema = z.object({
  features:    z.array(z.string()).min(1, 'At least one feature is required'),
  userStories: z.array(z.string()).min(1, 'At least one user story is required'),
});

export const FieldSchema = z.object({
  name:        z.string().min(1),
  type:        z.string().nullish().transform((v) => v || 'String'),
  description: z.string().nullish().transform((v) => v ?? ''),
});

export const TableSchema = z.object({
  tableName: z.string().optional(),
  name:      z.string().optional(),
  fields:    z.array(FieldSchema).min(1),
}).transform((data) => ({
  tableName: data.tableName || data.name || 'Table',
  fields: data.fields,
}));

export const DbSchemaSchema = z.object({
  tables: z.array(TableSchema).min(1, 'At least one table is required'),
});

export const EndpointSchema = z.object({
  method:      z.string().nullish().transform((v) => (v || 'GET').toUpperCase()),
  endpoint:    z.string().optional(),
  path:        z.string().optional(),
  description: z.string().nullish().transform((v) => v ?? ''),
}).transform((data) => ({
  method: data.method,
  endpoint: data.endpoint || data.path || '/api',
  description: data.description,
}));

export const ApisSchema = z.object({
  endpoints: z.array(EndpointSchema).min(1, 'At least one endpoint is required'),
});

export const SprintSchema = z.object({
  sprintName: z.string().optional(),
  name:       z.string().optional(),
  duration:   z.string().nullish().transform((v) => v || '2 weeks'),
  tasks:      z.array(z.string()).min(1),
}).transform((data) => ({
  sprintName: data.sprintName || data.name || 'Sprint',
  duration: data.duration,
  tasks: data.tasks,
}));

export const SprintPlanSchema = z.object({
  sprints: z.array(SprintSchema).min(1, 'At least one sprint is required'),
});

// ── Full composite schema (all sections optional) ─────────────────────────────

export const FullPlanResponseSchema = z.object({
  requirements: RequirementsSchema.optional(),
  schema:       DbSchemaSchema.optional(),
  apis:         ApisSchema.optional(),
  sprintPlan:   SprintPlanSchema.optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type ZRequirements = z.infer<typeof RequirementsSchema>;
export type ZDbSchema     = z.infer<typeof DbSchemaSchema>;
export type ZApis         = z.infer<typeof ApisSchema>;
export type ZSprintPlan   = z.infer<typeof SprintPlanSchema>;
export type ZFullPlan     = z.infer<typeof FullPlanResponseSchema>;
