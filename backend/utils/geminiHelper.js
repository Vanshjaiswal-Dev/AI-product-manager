// ──────────────────────────────────────────────────────────────────────────────
// utils/geminiHelper.js
//
// A single reusable utility that handles ALL Gemini API interactions.
//
// Why this exists:
//   Every AI generator (requirements, schema, APIs, sprint plan) needs to:
//     1. Call the Gemini API with a prompt
//     2. Extract the raw text response
//     3. Strip any accidental markdown code fences
//     4. Parse the cleaned text as JSON
//     5. Handle errors consistently
//
//   Instead of duplicating that 4-step logic in every controller, we extract
//   it here. Each controller just builds its prompt and calls callGemini().
//
// Interview talking point:
//   This is the DRY principle (Don't Repeat Yourself). If we ever need to
//   switch AI providers (e.g. OpenAI → Gemini → Anthropic), we change ONE
//   file, not four controllers.
// ──────────────────────────────────────────────────────────────────────────────

const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Initialise Gemini once at module load ─────────────────────────────────────
// process.env is populated by dotenv in server.js before any require() calls.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  // Allow overriding the model via .env — defaults to gemini-3.6-flash which
  // is the latest stable Flash model available on this API key.
  model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
});

// ── Helper: strip markdown code fences ───────────────────────────────────────
// Even when the prompt says "no markdown", Gemini sometimes wraps JSON in:
//   ```json\n{ ... }\n```
//   ```\n{ ... }\n```
// This function removes those fences so JSON.parse() doesn't throw.
function stripMarkdownFences(text) {
  return (
    text
      .replace(/^```(?:json)?\s*/i, "") // remove opening fence
      .replace(/\s*```$/, "")           // remove closing fence
      .trim()
  );
}

// ── Main export: callGemini ───────────────────────────────────────────────────
// @param {string} prompt   — The fully-formed prompt string to send to Gemini.
// @returns {Object}        — The parsed JSON object from Gemini's response.
// @throws  {Error}         — If the API call fails OR if JSON parsing fails.
//                            Callers (controllers) should catch this and return
//                            an appropriate HTTP error response.
async function callGemini(prompt) {
  // Step 1: Call the Gemini API
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  // Step 2: Clean the raw text
  const cleanedText = stripMarkdownFences(rawText);

  // Step 3: Parse as JSON — throw a descriptive error on failure so the
  // calling controller can return a 502 with the raw output for debugging.
  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    const err = new Error(
      `Gemini returned non-JSON output. Raw response: ${rawText}`
    );
    err.rawOutput = rawText; // attach for the controller to pass back to client
    throw err;
  }
}

module.exports = { callGemini };
