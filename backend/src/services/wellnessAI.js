/**
 * wellnessAI.js
 * OPTIONAL AI assistance for the Wellness Studio.
 *
 * Rules enforced here:
 * - AI never computes anything: it only rephrases results that normal code
 *   already produced (grounded insight text) or helps reflect on ONE
 *   journal entry the user explicitly chose to share.
 * - Minimum data: only the specific strings passed by the caller are sent.
 * - No diagnosis language is allowed; prompts forbid medical conclusions.
 * - If GEMINI_API_KEY is missing or the call fails, callers get null and
 *   fall back to deterministic behaviour. User records are never affected.
 */

import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

let model = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
    });
  } catch (err) {
    console.warn('[WellnessAI] Gemini init notice:', err.message);
  }
}

export const isWellnessAIAvailable = () => Boolean(model);

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), ms)),
  ]);

const SYSTEM_RULES = `
Rules (never violate):
- Do NOT diagnose any physical or mental health condition.
- Do NOT claim causation. Use wording like "these entries occurred together" or "your entries suggest an association".
- Do NOT invent data, dates, numbers, or patterns not present in the text you were given.
- Do NOT recommend medication, supplements, or treatments.
- Plain, warm, everyday language. Short sentences. No medical jargon.
- If the text is insufficient to say anything, say so plainly.`;

/**
 * Rephrase an already-computed, grounded insight in simpler words.
 * @param {{title: string, observation: string}} insight
 * @returns {Promise<string|null>} null when AI is unavailable
 */
export async function explainInsightInPlainWords(insight) {
  if (!model || !insight?.observation) return null;
  try {
    const prompt = `You help a wellness-app user understand an observation the app already calculated from THEIR OWN records. ${SYSTEM_RULES}

Observation title: ${insight.title}
Observation (already computed, do not alter facts): ${insight.observation}

Rewrite it in 2-3 sentences of plain, friendly language a non-technical person can grasp instantly. Return only the rewritten text.`;
    const result = await withTimeout(model.generateContent(prompt), 8000);
    const text = result.response.text()?.trim();
    return text || null;
  } catch (err) {
    console.log('[WellnessAI] explain fallback:', err.message);
    return null;
  }
}

/**
 * Optional reflection help on a SINGLE journal entry the user chose to share.
 * @param {{prompt?: string, content: string}} entry
 * @returns {Promise<string|null>} null when AI is unavailable
 */
export async function reflectOnJournalEntry(entry) {
  if (!model || !entry?.content) return null;
  try {
    const prompt = `You are a gentle reflection companion in a private wellness journal. The user asked for help reflecting on their own entry. ${SYSTEM_RULES}

${entry.prompt ? `Prompt they wrote under: ${entry.prompt}\n` : ''}Their private entry:
"""
${entry.content.slice(0, 4000)}
"""

Offer 2 short reflection questions and 1 small, optional next step they could take. Do not summarize or judge the entry. Return plain text only.`;
    const result = await withTimeout(model.generateContent(prompt), 8000);
    const text = result.response.text()?.trim();
    return text || null;
  } catch (err) {
    console.log('[WellnessAI] reflect fallback:', err.message);
    return null;
  }
}
