import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── AI Generator endpoints ──────────────────────────────────────────────────
export const generateRequirements = (idea, planId) =>
  api.post('/generate-requirements', { idea, planId }).then((res) => res.data);

export const generateSchema = (idea, planId) =>
  api.post('/generate-schema', { idea, planId }).then((res) => res.data);

export const generateApis = (idea, planId) =>
  api.post('/generate-apis', { idea, planId }).then((res) => res.data);

export const generateSprintPlan = (idea, planId) =>
  api.post('/generate-sprint-plan', { idea, planId }).then((res) => res.data);

// ── History / Dashboard endpoints ───────────────────────────────────────────
export const getAllPlans = () =>
  api.get('/plans').then((res) => res.data);

export const getPlanById = (id) =>
  api.get(`/plans/${id}`).then((res) => res.data);

export default api;
