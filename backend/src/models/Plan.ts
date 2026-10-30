import mongoose, { Document, Schema, Types } from 'mongoose';

// ── Sub-interfaces ────────────────────────────────────────────────────────────

export interface IRequirements {
  features: string[];
  userStories: string[];
}

export interface IField {
  name: string;
  type: string;
  description: string;
}

export interface ITable {
  tableName: string;
  fields: IField[];
}

export interface IDbSchema {
  tables: ITable[];
}

export interface IEndpoint {
  method: string;
  endpoint: string;
  description: string;
}

export interface IApis {
  endpoints: IEndpoint[];
}

export interface ISprint {
  sprintName: string;
  duration: string;
  tasks: string[];
}

export interface ISprintPlan {
  sprints: ISprint[];
}

// ── Main Plan interface ───────────────────────────────────────────────────────

export interface IPlan {
  userId: Types.ObjectId;
  idea: string;
  requirements?: IRequirements | null;
  schema?: IDbSchema | null;
  apis?: IApis | null;
  sprintPlan?: ISprintPlan | null;
  createdAt: Date;
}

export type IPlanDocument = IPlan & Document;

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const requirementsSchema = new Schema(
  {
    features:   { type: [String], default: [] },
    userStories: { type: [String], default: [] },
  },
  { _id: false },
);

const fieldSchema = new Schema(
  {
    name:        { type: String, required: true },
    type:        { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false },
);

const tableSchema = new Schema(
  {
    tableName: { type: String, required: true },
    fields:    { type: [fieldSchema], default: [] },
  },
  { _id: false },
);

const dbSchemaSchema = new Schema(
  { tables: { type: [tableSchema], default: [] } },
  { _id: false },
);

const endpointSchema = new Schema(
  {
    method:      { type: String, required: true },
    endpoint:    { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false },
);

const apisSchema = new Schema(
  { endpoints: { type: [endpointSchema], default: [] } },
  { _id: false },
);

const sprintSchema = new Schema(
  {
    sprintName: { type: String, required: true },
    duration:   { type: String, required: true },
    tasks:      { type: [String], default: [] },
  },
  { _id: false },
);

const sprintPlanSchema = new Schema(
  { sprints: { type: [sprintSchema], default: [] } },
  { _id: false },
);

// ── Main Schema ───────────────────────────────────────────────────────────────

const planSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required to create a plan'],
  },
  idea: {
    type: String,
    required: [true, 'Idea is required'],
    trim: true,
  },
  requirements: { type: requirementsSchema, default: null },
  schema:        { type: dbSchemaSchema,    default: null },
  apis:          { type: apisSchema,        default: null },
  sprintPlan:    { type: sprintPlanSchema,  default: null },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Plan = mongoose.model<IPlanDocument>('Plan', planSchema);
