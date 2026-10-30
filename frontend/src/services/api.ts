import axios from 'axios';
import type { Plan, ApiResponse, LoginCredentials, RegisterCredentials } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── AI Generator endpoints ────────────────────────────────────────────────────

export const generateRequirements = (idea: string, planId?: string): Promise<ApiResponse<Plan>> =>
  api.post('/generate-requirements', { idea, planId }).then((res) => res.data as ApiResponse<Plan>);

export const generateSchema = (idea: string, planId?: string): Promise<ApiResponse<Plan>> =>
  api.post('/generate-schema', { idea, planId }).then((res) => res.data as ApiResponse<Plan>);

export const generateApis = (idea: string, planId?: string): Promise<ApiResponse<Plan>> =>
  api.post('/generate-apis', { idea, planId }).then((res) => res.data as ApiResponse<Plan>);

export const generateSprintPlan = (idea: string, planId?: string): Promise<ApiResponse<Plan>> =>
  api.post('/generate-sprint-plan', { idea, planId }).then((res) => res.data as ApiResponse<Plan>);

// ── History / Dashboard endpoints ─────────────────────────────────────────────

export const getAllPlans = (): Promise<ApiResponse<Plan[]>> =>
  api.get('/plans').then((res) => res.data as ApiResponse<Plan[]>);

export const getPlanById = (id: string): Promise<ApiResponse<Plan>> =>
  api.get(`/plans/${id}`).then((res) => res.data as ApiResponse<Plan>);

// ── Auth endpoints ────────────────────────────────────────────────────────────

export const loginUser = (credentials: LoginCredentials) =>
  api.post('/auth/login', credentials).then((res) => res.data);

export const registerUser = (credentials: RegisterCredentials) =>
  api.post('/auth/register', credentials).then((res) => res.data);

export default api;
