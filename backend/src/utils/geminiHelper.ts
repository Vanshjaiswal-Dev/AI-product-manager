// ──────────────────────────────────────────────────────────────────────────────
// src/utils/geminiHelper.ts
//
// Single reusable utility for all Gemini API interactions.
// Returns parsed JSON or throws a typed AppError with the raw output attached.
// ──────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';
import { AppError } from '../types';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: env.GEMINI_MODEL,
});

// Strip accidental markdown code fences that Gemini occasionally adds
// even when the prompt explicitly says not to.
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

/**
 * Call the Gemini API with the given prompt.
 * @returns Parsed JSON object from Gemini's response.
 * @throws  AppError (502) if the response cannot be parsed as JSON.
 */
export async function callGemini(prompt: string): Promise<Record<string, unknown>> {
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
}
