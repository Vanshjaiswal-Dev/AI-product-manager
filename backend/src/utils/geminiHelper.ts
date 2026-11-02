// ──────────────────────────────────────────────────────────────────────────────
// src/utils/geminiHelper.ts
//
// Single reusable utility for all Gemini API interactions.
// Uses fast 2026 models (gemini-3.1-flash-lite) with JSON mode and fallback.
// Returns parsed JSON or throws a typed AppError with the raw output attached.
// ──────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';
import { AppError } from '../types';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// List of fast, high-availability models in order of priority (Gemini 3.x — Nov 2026)
const CANDIDATE_MODELS = Array.from(
  new Set([
    env.GEMINI_MODEL,           // Configured via GEMINI_MODEL env var (primary)
    'gemini-3.8-flash',         // Current recommended flagship — free tier
    'gemini-3.6-flash',         // Stable mid-gen fallback — free tier
    'gemini-3.1-flash-lite',    // Lightest / lowest-latency fallback — free tier
  ]),
);

// Strip accidental markdown code fences if model includes them
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/**
 * Call the Gemini API with the given prompt.
 * Automatically tries fallback models if the primary model is busy or unavailable.
 * @returns Parsed JSON object from Gemini's response.
 * @throws  AppError (502) if the response cannot be parsed as JSON or all models fail.
 */
export async function callGemini(prompt: string): Promise<Record<string, unknown>> {
  let lastError: unknown = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const cleanedText = stripMarkdownFences(rawText);

      try {
        return JSON.parse(cleanedText) as Record<string, unknown>;
      } catch {
        throw new AppError(
          `Gemini returned non-JSON output. Raw response: ${rawText}`,
          502,
          rawText,
        );
      }
    } catch (err) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] Model ${modelName} failed (${errMsg.slice(0, 100)}). Trying fallback...`);
      // If it was a JSON parsing AppError, don't retry other models — it's not a model availability error
      if (err instanceof AppError && err.statusCode === 502) {
        throw err;
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'All Gemini models failed';
  throw new AppError(`Gemini generation failed: ${message}`, 502);
}
