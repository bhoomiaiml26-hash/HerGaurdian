/**
 * Pure helpers for the Wellness Studio (kept out of ui.jsx so that file
 * only exports components, per the react-refresh lint rule).
 */

export const MOOD_SCORE = { great: 5, good: 4, neutral: 3, low: 2, stressed: 1 };

export const MOOD_LABELS = {
  great: "Great",
  good: "Good",
  neutral: "Okay",
  low: "Low",
  stressed: "Stressed",
};

/** Format minutes as "7h 30m" */
export function formatMinutes(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : h === 0 ? `${m}m` : `${h}h ${m}m`;
}

/** Friendly date label: "Oct 3" / "Oct 3, 2026" when not current year */
export function friendlyDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function todayISO() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** ISO date string for N days before today (computed inside callbacks, not render). */
export function daysAgoISO(days) {
  const d = new Date(Date.now() - days * 86400000);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Same rule as the server: end <= start means the sleep crossed midnight. */
export function calcSleepMinutes(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return 0;
  const [bH, bM] = bedtime.split(":").map(Number);
  const [wH, wM] = wakeTime.split(":").map(Number);
  if ([bH, bM, wH, wM].some((n) => !Number.isFinite(n))) return 0;
  let start = bH * 60 + bM;
  let end = wH * 60 + wM;
  if (end <= start) end += 24 * 60;
  return Math.max(0, end - start);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function daysBetween(a, b) {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db - da) / 86400000);
}

/** Cycle lengths in days between consecutive period starts. */
export function computeCycleLengths(logs) {
  const starts = logs
    .map((l) => l.startDate)
    .filter(Boolean)
    .sort(); // ascending
  const lengths = [];
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetween(starts[i - 1], starts[i]);
    if (len > 0 && len <= 90) lengths.push(len); // guard against data-entry slips
  }
  return lengths;
}

export { addDays, daysBetween };
