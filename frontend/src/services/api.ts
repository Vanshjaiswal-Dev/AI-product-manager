// ──────────────────────────────────────────────────────────────────────────────
// src/services/api.ts
//
// Central Axios instance for all backend calls.
//
// Silent Refresh Interceptor
// ──────────────────────────
// When any request receives a 401, the interceptor:
//   1. Skips retrying auth endpoints themselves (avoids infinite loops).
//   2. Calls POST /auth/refresh exactly ONCE (concurrent 401s share a single
//      refresh promise so we never trigger simultaneous rotations).
//   3. On success  → retries the original request transparently.
//   4. On failure  → calls useAuthStore.logout() and rejects the error.
// ──────────────────────────────────────────────────────────────────────────────

import axios, { AxiosRequestConfig } from 'axios';
import type { Plan, ApiResponse, LoginCredentials, RegisterCredentials } from '../types';

// Augment AxiosRequestConfig so TypeScript accepts the `_retry` flag we attach
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000/api';
const cleanApiUrl = rawApiUrl.replace(/\/+$/, '');
const baseURL = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // required for HttpOnly cookie auth
  timeout: 60_000,       // 60 s — prevents silent hangs on Render cold starts
});

// ── Silent Refresh Interceptor ────────────────────────────────────────────────

/** URLs that must never trigger a silent refresh (would cause infinite loops). */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

/**
 * Shared refresh promise — ensures multiple simultaneous 401 responses only
 * trigger a single /auth/refresh call (token-rotation fan-in pattern).
 */
let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const is401 = error.response?.status === 401;
    const alreadyRetried = originalRequest._retry === true;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
      (originalRequest.url ?? '').includes(ep),
    );

    if (!is401 || alreadyRetried || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If a refresh is already in flight, wait for it instead of firing another
    if (!refreshPromise) {
      refreshPromise = api
        .post('/auth/refresh')
        .then(() => {
          // Rotation succeeded — next requests use the new cookies automatically
        })
        .catch(async (refreshError) => {
          // Refresh failed (expired / revoked) → force logout
          // Lazy-import to avoid circular dependency at module load time
          const { useAuthStore } = await import('../store/authStore');
          await useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        })
        .finally(() => {
          refreshPromise = null; // reset so future 401s can refresh again
        });
    }

    try {
      await refreshPromise;
      // Re-issue the original request — cookies have been rotated server-side
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

// ── AI Generator endpoints ────────────────────────────────────────────────────

export const generateFullPlan = (idea: string, selected?: string[], planId?: string): Promise<ApiResponse<Plan>> =>
  api.post('/generate-full-plan', { idea, selected, planId }).then((res) => res.data as ApiResponse<Plan>);

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
