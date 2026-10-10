# Wellness Studio — Implementation Plan (Phase 2)

## Phase 1 findings (what actually exists)

### Frontend
- `WellnessHub.jsx` is a tab shell (`?tab=` URL param): overview, women-health, menstrual, nutrition, nutrition-ai, fitness, mental.
- Static walls: `WomenHealth`, `MenstrualWellness`, `Fitness`, `MentalWellness`, `Nutrition` — all card grids over static data files (`enhancedHealthTips`, `menstrualTips`, `mentalTips`, `detailedExercises`, `recipes`) + favorites + `HealthTipModal`.
- `NutritionAI.jsx` (NutriBot): chat, 7-day meal plan, calorie analyzer, BMI, quick meals, family planner — **preserved untouched**.
- Videos: `enhancedHealthTips` has 8 `tip.video` entries rendered by `HealthTipModal`; `detailedExercises` has 6 `youtubeVideo` embeds (currently never rendered by Fitness — field mismatch).
- Design system: Tailwind 4 tokens in `index.css` (`--color-brand-primary #8C3737`, cream `#FBF9F7`, borders `#EDE6E2`, Fraunces/Manrope). Shared: `SearchBar`, `CategoryFilter`, `WellnessCard`, `HealthTipModal`, `LoadingSpinner` (SearchBar also used by Career — keep all shared components).
- Deps available: `recharts`, `framer-motion`, `lucide-react`, `date-fns`, `react-hot-toast`.
- No test framework (no vitest/jest); checks = `eslint .` + `vite build`.

### Backend
- `wellnessRoutes.js` (594 lines, untracked) already implements check-ins, menstrual, sleep, movement, journal, goals CRUD + a first insights engine — **but is NOT mounted in `app.js`** (confirmed 404).
- Models exist (untracked): `WellnessCheckin`, `MenstrualLog`, `SleepLog`, `MovementLog`, `WellnessJournal`, `WellnessGoal`; shared `Reminder` model + `/api/reminders` CRUD (categories incl. Cycle Phase, Rest & Recovery, Mobility/Exercise) with `protect` auth.
- Sleep duration correctly crosses midnight (`calculateSleepMinutes`).
- AI: Gemini via `GEMINI_API_KEY` in `backend/.env` (used by safety analyzer). Frontend `aiService.js` points at a non-existent `/api/ai/chat` (dead code).
- Server runs as plain `node src/server.js` on :5000 — must restart after backend edits. Vite dev on :5173 (HMR). NutriBot Flask on :5001 (currently down).
- Global rate limit: 100 req / 15 min / IP — keep API test volume lean.

## Decisions

1. **Nav**: replace 7 tabs with 9: `today`, `checkins`, `reset`, `cycle`, `movement`, `sleep`, `insights`, `goals`, `nutrition-ai`. Legacy tab ids and legacy routes (`/health`, `/menstrual`, `/fitness`, `/mental`, `/nutrition`) redirect to the closest new section.
2. **Static walls removed from the Hub**: old tip pages unwired from Hub + AppRoutes (files kept on disk, no other dependencies). Shared components untouched.
3. **Videos preserved contextually**: exercise videos embedded inside Movement activity detail; mental-wellness video inside Reset Studio; health-topic videos surfaced where relevant — no static article walls.
4. **Storage**: reuse the 6 wellness models; add only `WindDownRoutine` (nothing fits an ordered evening routine) and an optional `sessionMinutes`/`preferences` extension where needed. Reminders reuse the existing `/api/reminders`.
5. **Deterministic math client/server-side**: cycle stats, predictions, duration, aggregates, progress, charts — all plain code. One optional AI endpoint (`/api/wellness/ai/*`) that (a) rephrases an already-computed insight in plain words, (b) helps reflect on a **single** journal entry — only with explicit user consent, minimum data, graceful fallback when AI is unavailable.
6. **Insights rewritten** to return: period, observation, supporting record references (inspectable), explicit `insufficient` states, no causal/diagnostic claims; fixes an existing ungrounded claim ("gentle activities prioritized").
7. **Privacy**: all routes behind existing `protect`; every query scoped by `req.user._id`; no wellness/journal content in logs; per-record delete controls everywhere.

## Implementation order
1. Backend: mount routes → harden validation → journal PUT → wind-down model+routes → insights rewrite → optional AI endpoints → restart server.
2. Frontend service (`wellnessService.js`).
3. New studio shell + Today dashboard.
4. Features 1–8 in spec order.
5. Legacy redirects + AppRoutes cleanup.
6. API tests (scripted, two users for auth isolation) → browser E2E → lint → production build → fix.
