# Planify — Codebase Inspection & Ground-Truth Audit Report

**Date:** October 30, 2026  
**Audited Codebase:** Full-Stack Repository (`/backend` and `/frontend`)  
**Target Audience:** AI Models (Gemini/Claude), Senior Code Reviewers, Technical Interviewers

---

## Executive Summary
This document provides a line-by-line, ground-truth inspection of the **Planify** codebase. It outlines the current implementations, verifies exact package versions and model configurations, identifies production/deployment vulnerabilities, and details architectural trade-offs.

---

## 1. Exact Dependencies & Model Configurations

### 1.1 Backend Dependencies (`backend/package.json`)
```json
{
  "name": "ai-product-manager-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^8.4.1",
    "zod": "^4.6.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^26.6.6",
    "nodemon": "^3.1.3",
    "tsx": "^4.23.15",
    "typescript": "^7.0.2"
  }
}
```

### 1.2 Frontend Dependencies (`frontend/package.json`)
```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.9.1",
    "@studio-freight/lenis": "^1.0.42",
    "@tailwindcss/vite": "^4.3.3",
    "@tanstack/react-query": "^5.102.8",
    "axios": "^1.20.0",
    "framer-motion": "^13.2.0",
    "lucide-react": "^1.45.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-hook-form": "^7.88.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^7.18.3",
    "tailwindcss": "^4.3.3",
    "zod": "^3.25.76",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "eslint": "^10.10.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.6",
    "globals": "^17.12.0",
    "typescript": "^7.0.2",
    "vite": "^8.3.0"
  }
}
```

### 1.3 Exact Google Gemini Model Configuration Matrix
* **Active Working Model in `.env`:** `GEMINI_MODEL=gemini-3.1-flash-lite`
* **Default in `backend/src/utils/env.ts`:** `z.string().default('gemini-3.1-flash-lite')`
* **Candidate Pool in `backend/src/utils/geminiHelper.ts`:**
  ```typescript
  const CANDIDATE_MODELS = Array.from(
    new Set([
      env.GEMINI_MODEL,
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-latest',
    ]),
  );
  ```
* **⚠️ `.env.example` Gap:** `backend/.env.example` currently only lists `GEMINI_API_KEY`, `MONGO_URI`, `PORT`. It lacks `GEMINI_MODEL`, `JWT_SECRET`, and `FRONTEND_URL`.

---

## 2. LLM Call & Fallback Architecture

### 2.1 Composite `/generate-full-plan` Prompt Construction
Located at `backend/src/controllers/planController.ts` (lines 324–416).
* The prompt is dynamically assembled based on the caller's `selected` array:
  ```typescript
  const sectionsToInclude: string[] = [];
  if (selected.includes('requirements')) sectionsToInclude.push('"requirements": { ... }');
  if (selected.includes('schema'))       sectionsToInclude.push('"schema": { ... }');
  if (selected.includes('apis'))         sectionsToInclude.push('"apis": { ... }');
  if (selected.includes('sprint'))       sectionsToInclude.push('"sprintPlan": { ... }');
  ```
* All requested sections are unified into a single prompt envelope, forcing Gemini to generate the entire specification in a single forward pass.

### 2.2 JSON Enforcement & Output Validation
* **Enforcement:** Enforced in `geminiHelper.ts` via SDK configuration:
  ```typescript
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.7,
  }
  ```
* **Ground-Truth Validation Gap:**
  * In `generateFullPlan`, the model response is parsed via `JSON.parse(cleanedText)`.
  * The resulting object is assigned directly:
    ```typescript
    if (parsed.requirements) plan.requirements = parsed.requirements as never;
    if (parsed.schema)       plan.schema = parsed.schema as never;
    if (parsed.apis)         plan.apis = parsed.apis as never;
    if (parsed.sprintPlan)   plan.sprintPlan = parsed.sprintPlan as never;
    ```
  * **There is currently NO runtime Zod validation schema parsing the LLM output** before passing it to Mongoose. Type conformity relies entirely on Mongoose's internal schema casting during `await plan.save()`.

### 2.3 Fallback & Error Handling
* Implemented in `backend/src/utils/geminiHelper.ts`:
  ```typescript
  for (const modelName of CANDIDATE_MODELS) {
    try {
      // Call Gemini model
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini] Model ${modelName} failed. Trying fallback...`);
      if (err instanceof AppError && err.statusCode === 502) throw err;
    }
  }
  ```
* **Ground Truth:** This is an **in-line synchronous retry loop**. If a 503 (high demand) or 429 (rate limit) occurs, it immediately tries the next candidate in the same HTTP request cycle. It is **not** a stateful circuit breaker (it does not record failure rates over time or use exponential backoff delays).

---

## 3. Authentication, Security & Cookie Configuration

### 3.1 Cookie Settings
In `backend/src/controllers/authController.ts` (lines 17–24):
```typescript
res.status(statusCode)
  .cookie('jwt', token, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
```

### 3.2 ⚠️ Cross-Domain Production Risk
* **Current state:** `sameSite: 'lax'`.
* **The Vulnerability:** Works perfectly on `localhost` (same-site context). However, if deployed with a decoupled architecture (e.g., Frontend on `https://planify.vercel.app` and Backend on `https://planify-api.onrender.com`), browsers block third-party `SameSite=Lax` cookies on asynchronous cross-site `axios` requests.
* **Production Fix Required:**
  ```typescript
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: env.NODE_ENV === 'production',
  ```

### 3.3 Rate Limiting Status
* **Ground Truth:** `express-rate-limit` is **not installed**.
* There is currently no IP-based or user-based rate limiting on:
  * `/api/auth/login` (vulnerable to brute-force credential stuffing).
  * `/api/generate-full-plan` (vulnerable to API quota exhaustion).

---

## 4. Granular Regeneration & State Sync

### 4.1 Implementation in `planController.ts`
When an individual section is regenerated from the Dashboard (e.g. `POST /api/generate-schema`):
```typescript
export const generateSchema = async (req: Request, res: Response): Promise<void> => {
  const { idea, planId } = req.body;
  
  const prompt = `
    You are a senior database architect...
    A user has submitted the following product idea:
    "${idea.trim()}"
    Your task is to design a complete database schema...
  `;
  
  const parsed = await callGemini(prompt);
  const { plan } = await resolvePlan(planId, idea, req.user!._id.toString());
  plan.schema = parsed as never;
  await plan.save();
};
```

### 4.2 Architectural Finding
* **Ground Truth:** Individual regeneration handlers **do NOT query or inject existing plan sections from MongoDB into the prompt**.
* When a user regenerates the Schema, Gemini only receives the raw `idea`. It is unaware of the existing `requirements` or `apis` already saved in the document.
* **Potential Issue:** Independent regeneration can introduce entity drift between sections (e.g., the new schema might name a collection `Profiles`, while the existing API endpoints reference `/api/users`).

---

## 5. Deployment & Containerization Readiness

### 5.1 Deployment Configurations
* `Dockerfile`: ❌ Not present
* `docker-compose.yml`: ❌ Not present
* Cloud platform manifests (`render.yaml`, `vercel.json`, `netlify.toml`): ❌ Not present

### 5.2 Environment Variables & Hardcoded Fallbacks
* **Frontend Service (`frontend/src/services/api.ts`):**
  ```typescript
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  ```
  * Configured correctly to read `VITE_API_URL` with a fallback to `localhost:5000`.
* **Backend CORS (`backend/src/server.ts`):**
  ```typescript
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }));
  ```
  * In `env.ts`: `FRONTEND_URL: z.string().default('http://localhost:5173')`.
  * Configured correctly to read `FRONTEND_URL` from environment.

---

## 6. Actionable Gaps & Implementation Roadmap

| Priority | Area | Issue Description | Recommended Solution |
|---|---|---|---|
| **P0** | **Cookies** | `sameSite: 'lax'` breaks cross-domain cookies (Vercel + Render) | Update cookie to `sameSite: 'none'` and `secure: true` when `NODE_ENV === 'production'` |
| **P0** | **Config** | `backend/.env.example` missing `JWT_SECRET`, `FRONTEND_URL`, `GEMINI_MODEL` | Add all required keys to `.env.example` to prevent boot crashes on fresh deployments |
| **P1** | **Security** | Missing rate limiting on auth and AI endpoints | Install `express-rate-limit` (e.g. 5 req/min on AI endpoints, 10 req/15min on auth) |
| **P1** | **Reliability** | No runtime Zod validation on Gemini output in `generateFullPlan` | Define `z.object({ requirements, schema, apis, sprintPlan })` and validate before saving |
| **P2** | **Context** | Granular regeneration does not read existing MongoDB section context | In `generateSchema`, fetch existing `plan.requirements` and feed into prompt |
| **P2** | **DevOps** | No Docker or container configs | Add standard multi-stage `Dockerfile` for backend and frontend |
