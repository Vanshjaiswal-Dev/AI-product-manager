// ── API Response wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
}

// ── Plan sub-types ────────────────────────────────────────────────────────────
export interface Requirements {
  features: string[];
  userStories: string[];
}

export interface Field {
  name: string;
  type: string;
  description: string;
}

export interface Table {
  tableName: string;
  fields: Field[];
}

export interface DbSchema {
  tables: Table[];
}

export interface Endpoint {
  method: string;
  endpoint: string;
  description: string;
}

export interface Apis {
  endpoints: Endpoint[];
}

export interface Sprint {
  sprintName: string;
  duration: string;
  tasks: string[];
}

export interface SprintPlan {
  sprints: Sprint[];
}

// ── Plan document ─────────────────────────────────────────────────────────────
export interface Plan {
  _id: string;
  userId: string;
  idea: string;
  requirements?: Requirements | null;
  schema?: DbSchema | null;
  apis?: Apis | null;
  sprintPlan?: SprintPlan | null;
  createdAt: string;
}

// ── Auth credentials ──────────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// ── Auth store state ─────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; user: User }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; user: User }>;
  logout: () => Promise<void>;
}

// ── Plan store state ──────────────────────────────────────────────────────────
export interface PlanState {
  currentPlanId: string | null;
  currentIdea: string;
  setCurrentPlan: (id: string, idea: string) => void;
  clearPlan: () => void;
}
