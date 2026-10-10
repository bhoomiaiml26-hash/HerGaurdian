/**
 * Nutrition AI service layer.
 *
 * Talks to the NutriBot Flask backend (IBM Watsonx.ai / IBM Granite) that runs
 * as a separate service. The base URL is configured with
 * VITE_NUTRIBOT_API_BASE_URL (defaults to http://localhost:5001).
 *
 * The React app NEVER talks to IBM Watsonx.ai directly — all credentials stay
 * on the Flask server.
 */

const BASE_URL = (
  import.meta.env.VITE_NUTRIBOT_API_BASE_URL || "http://localhost:5001"
).replace(/\/+$/, "");

if (!import.meta.env.VITE_NUTRIBOT_API_BASE_URL) {
  console.warn(
    "VITE_NUTRIBOT_API_BASE_URL is not set — Nutrition AI defaults to http://localhost:5001"
  );
}

/** Default timeout for AI calls; Watsonx generation can be slow. */
const DEFAULT_TIMEOUT_MS = 90000;

class NutritionApiError extends Error {
  constructor(message, { status, code, timedOut = false } = {}) {
    super(message);
    this.name = "NutritionApiError";
    this.status = status;
    this.code = code;
    this.timedOut = timedOut;
  }
}

/** Human-friendly message for any fetch failure. */
function toFriendlyError(error) {
  if (error instanceof NutritionApiError) return error;
  if (error?.name === "AbortError" || error?.name === "TimeoutError") {
    return new NutritionApiError(
      "The nutrition service took too long to respond. Please try again.",
      { timedOut: true }
    );
  }
  return new NutritionApiError(
    "Could not reach the nutrition service. Make sure it is running, then retry.",
    { code: "network" }
  );
}

async function request(path, { method = "POST", body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    throw toFriendlyError(error);
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. HTML error page) — fall through to status handling.
  }

  if (!response.ok) {
    const message =
      data?.error ||
      `Nutrition service error (HTTP ${response.status}). Please retry.`;
    throw new NutritionApiError(message, {
      status: response.status,
      code: data?.code,
    });
  }

  return data;
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function getNutritionHealth() {
  return request("/api/health", { method: "GET", timeout: 10000 });
}

// ── AI Chat (multi-turn) ─────────────────────────────────────────────────────

/**
 * Send a chat message with prior conversation turns for context.
 * @param {string} message
 * @param {{role: "user"|"assistant", content: string}[]} history
 */
export function sendChatMessage(message, history = []) {
  return request("/api/chat", { body: { message, history } });
}

export function clearChatHistory() {
  return request("/api/clear-history", { body: {} });
}

// ── 7-Day Meal Plan ──────────────────────────────────────────────────────────

export function generateMealPlan(profile) {
  return request("/api/nutrition-plan", { body: profile, timeout: 120000 });
}

// ── Calorie & Macro Analyzer ─────────────────────────────────────────────────

export function analyseMeal(meal) {
  return request("/api/calorie-analysis", { body: { meal }, timeout: 120000 });
}

// ── BMI ──────────────────────────────────────────────────────────────────────

export function calculateBmi(payload) {
  return request("/api/bmi", { body: payload, timeout: 120000 });
}

// ── Quick Meal Suggestions ───────────────────────────────────────────────────

export function suggestMeals(payload) {
  return request("/api/meal-suggestion", { body: payload, timeout: 120000 });
}

// ── Family Meal Planner ──────────────────────────────────────────────────────

export function generateFamilyPlan(members) {
  return request("/api/family-plan", { body: { members }, timeout: 120000 });
}

export { NutritionApiError };
