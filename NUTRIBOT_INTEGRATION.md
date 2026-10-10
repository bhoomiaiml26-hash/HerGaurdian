# NutriBot AI × HerGuardian AI — Integration Report

The complete NutriBot AI nutrition application (Python Flask + IBM Watsonx.ai +
IBM Granite) now runs inside HerGuardian AI's **Wellness Hub → Nutrition AI**
tab as a native section — same sidebar, top nav, theme, zoom controls, and
responsive behavior as the rest of HerGuardian.

---

## 1. What was integrated

| NutriBot feature | Where it lives now |
|---|---|
| AI Nutrition Chat (multi-turn, context-aware) | Wellness Hub → Nutrition AI → **Nutrition AI Chat** |
| Personalized 7-Day Meal Planner | Wellness Hub → Nutrition AI → **7-Day Meal Plan** |
| Calorie & Macronutrient Analyzer | Wellness Hub → Nutrition AI → **Calorie Analyzer** |
| BMI Calculator + AI guidance | Wellness Hub → Nutrition AI → **BMI Calculator** |
| Quick single-meal suggestions | Wellness Hub → Nutrition AI → **Quick Meal Suggestions** |
| Family Meal Planner (multi-member) | Wellness Hub → Nutrition AI → **Family Meal Planner** |
| Dark/light theme toggle | Preserved, scoped to the Nutrition AI section only |
| Landing hero + feature cards | New HerGuardian-styled landing section |

Enhancements made during integration:

- **Context-aware chat** — the React client sends conversation history with
  each request; the Flask service builds a multi-turn prompt, so follow-up
  questions stay on topic (the original standalone app only sent the last
  message).
- **Richer meal-plan inputs** — dietary preference, allergies/intolerances,
  foods to avoid, preferences, health goal, budget, available ingredients,
  meals/day, cuisine.
- **Richer quick-meal inputs** — goal, budget, available ingredients, and
  allergies/restrictions.
- **Per-member family fields** — each member now carries diet + allergies in
  addition to age/gender/health notes; prompts explicitly forbid assuming one
  portion fits everyone and require allergen flagging.
- **Input validation** on both client and server (weight 20–400 kg,
  height 80–260 cm, age 5–120, calories 80–3000, meal length ≤ 2000 chars).
- **Graceful failures** — missing IBM credentials return `503` with a setup
  message; Watsonx errors return `502`; the React UI shows an inline error with
  a **Retry** button. Health status (connected / not configured / offline) is
  shown in the Nutrition AI header.
- **Estimate labelling & safety disclaimers** on every generated output
  (plans, analyses, BMI guidance), per wellness-safety requirements.

## 2. Files created / modified

### Created

```
nutrition bot/                        ← complete NutriBot service (copied + adapted)
├── app.py                            (adapted: CORS, history-aware chat, extended
│                                      inputs, validation, 503/502 errors, cached
│                                      Watsonx client, Windows-safe startup)
├── requirements.txt                  (unchanged from NutriBot)
├── .env                              (local secrets — gitignored, port 5001)
├── .env.example                      (updated: FLASK_PORT=5001, CORS_ORIGINS)
├── .gitignore, README.md, test_connection.py
├── templates/index.html              (original standalone UI still works)
└── static/css/style.css, static/js/app.js

frontend/src/services/nutritionService.js      ← API layer (VITE_NUTRIBOT_API_BASE_URL,
                                                 90–120 s timeouts, friendly errors)
frontend/src/pages/WellnessHub/NutritionAI.jsx ← container: landing, feature cards,
                                                 6 tabs, theme toggle, health status
frontend/src/pages/WellnessHub/NutritionChat.jsx
frontend/src/pages/WellnessHub/MealPlan.jsx
frontend/src/pages/WellnessHub/CalorieAnalyzer.jsx
frontend/src/pages/WellnessHub/BmiCalculator.jsx
frontend/src/pages/WellnessHub/QuickMealSuggestions.jsx
frontend/src/pages/WellnessHub/FamilyMealPlanner.jsx
frontend/src/pages/WellnessHub/Markdown.jsx    ← marked + DOMPurify sanitized renderer
frontend/src/pages/WellnessHub/nutritionTheme.css ← scoped light/dark theme tokens
```

### Modified

```
frontend/src/pages/WellnessHub/WellnessHub.jsx  ← new "Nutrition AI" tab + overview card
frontend/src/layouts/DashboardLayout.jsx        ← page title for ?tab=nutrition-ai,
                                                   + min-w-0 flex fix so the
                                                   scrollable tab rows no longer
                                                   stretch the page horizontally
                                                   on narrow screens
frontend/.env / frontend/.env.example           ← VITE_NUTRIBOT_API_BASE_URL
frontend/package.json                           ← marked + dompurify (markdown rendering)
render.yaml                                     ← herguardian-nutrition Flask service
NUTRIBOT_INTEGRATION.md                         ← this document
```

Nothing else in HerGuardian was changed — auth, MongoDB, routes, dashboard,
and the existing recipe-based Nutrition tab all remain untouched.

## 3. Architecture (and why)

```
┌──────────────────────────────┐
│  React frontend (Vite)       │  HerGuardian design system, auth via localStorage
│  /wellness?tab=nutrition-ai  │
│  nutritionService.js ────────┼──── VITE_NUTRIBOT_API_BASE_URL (default :5001)
└──────────────┬───────────────┘
               │ JSON (CORS-restricted to HerGuardian origins)
┌──────────────▼───────────────┐
│  NutriBot Flask service      │  nutrition bot/app.py  (port 5001)
│  AGENT_INSTRUCTIONS + routes │  credentials only in its .env
└──────────────┬───────────────┘
               │ ibm-watsonx-ai SDK (server-side only)
┌──────────────▼───────────────┐
│  IBM Watsonx.ai / Granite    │  WATSONX_MODEL_ID (default meta-llama/llama-3-3-70b-instruct)
└──────────────────────────────┘

HerGuardian Node backend (:5000) is unchanged — it never serves nutrition
traffic, so login/MongoDB behavior is unaffected.
```

**Why a separate Flask service:** the entire NutriBot value is its Python
`ibm-watsonx-ai` SDK integration, prompt engineering (`AGENT_INSTRUCTIONS`),
and tested endpoints. Re-implementing all of that in Node risks silent
behavioral drift; proxying Watsonx through the Node backend would duplicate the
SDK. Keeping Flask as a sidecar preserves 100% of NutriBot's AI behavior while
the React service layer gives HerGuardian a clean, timeout-safe API. The React
app **never** calls IBM directly and **no** secret ships to the browser.

## 4. Required environment variables (names only — no values)

**`nutrition bot/.env`** (Flask service, server-side only):

| Variable | Purpose |
|---|---|
| `IBM_API_KEY` | IBM Cloud API key (secret) |
| `IBM_PROJECT_ID` | Watsonx.ai project id (secret) |
| `IBM_WATSONX_URL` | e.g. `https://us-south.ml.cloud.ibm.com` |
| `WATSONX_MODEL_ID` | e.g. `meta-llama/llama-3-3-70b-instruct` |
| `FLASK_SECRET_KEY` | session signing key (secret) |
| `FLASK_PORT` | `5001` (5000 is taken by the Node backend) |
| `FLASK_DEBUG` | `False` in production |
| `CORS_ORIGINS` | comma-separated production frontend origin(s) |

**`frontend/.env`** (browser-safe):

| Variable | Purpose |
|---|---|
| `VITE_NUTRIBOT_API_BASE_URL` | Flask service base URL, default `http://localhost:5001` |
| `VITE_API_BASE_URL` | (existing) Node backend URL |

`localhost:5173/5174/5175` are allowed for CORS by default; anything else must
be listed in `CORS_ORIGINS`. **No secrets go in frontend env.**

## 5. How to run everything locally

```bash
# 1) HerGuardian Node backend (port 5000)
cd backend && npm install && npm run dev

# 2) NutriBot Flask service (port 5001)  ← new
cd "nutrition bot"
python -m venv venv
venv/Scripts/pip install -r requirements.txt     # macOS/Linux: venv/bin/pip
cp .env.example .env                             # fill in IBM credentials
venv/Scripts/python app.py                       # macOS/Linux: venv/bin/python

# 3) HerGuardian frontend (port 5173)
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173` → log in → **Wellness Hub → Nutrition AI**.

## 6. Deployment

`render.yaml` now defines two services:

- `herguardian-backend` (node) — unchanged.
- `herguardian-nutrition` (python, root `nutrition bot`,
  `gunicorn app:app`, health check `/api/health`) — set the IBM +
  `FLASK_SECRET_KEY` + `CORS_ORIGINS` env vars in Render's dashboard.

Frontend: build with `VITE_NUTRIBOT_API_BASE_URL=https://<your-render-service>.onrender.com`
and add the frontend origin(s) to the Flask service's `CORS_ORIGINS`.

The standalone NutriBot UI still works at the Flask root `/` if you ever need
it — but HerGuardian never redirects or iframes it.

## 7. Tests performed & results

| Test | Result |
|---|---|
| `python -m py_compile app.py` | ✅ pass |
| Flask `/api/health` | ✅ `watsonx_configured: true`, model `meta-llama/llama-3-3-70b-instruct` |
| CORS preflight (OPTIONS, origin `localhost:5173`) | ✅ 204 + correct `Access-Control-Allow-Origin` |
| `/api/chat` — "Explain the nutrients in poha." | ✅ real Watsonx answer, ~400 words, poha-specific |
| `/api/chat` — follow-up "breakfast ideas using it?" with history | ✅ context-aware answer about poha breakfasts |
| `/api/bmi` (65 kg / 165 cm) | ✅ BMI 23.9→24.0 category + AI advice incl. "screening tool" note |
| `/api/bmi` invalid weight (-5) | ✅ 400 `Weight must be between 20 and 400` |
| `/api/calorie-analysis` roti/dal/rice meal | ✅ table, ~600–720 kcal, macros, rating 8/10 |
| `/api/calorie-analysis` idli/sambar/buttermilk | ✅ *different* values (~350–470 kcal) — no copy-paste numbers |
| `/api/meal-suggestion` with goal+budget+ingredients | ✅ 3 suggestions honouring ₹ budget + weight-loss goal |
| `/api/nutrition-plan` with allergy (peanut) + avoid + budget + 4 meals/day | ✅ 7-day plan, peanut-free, "estimated calories" labels, BMI/TDEE correct |
| `/api/family-plan` (2 members, per-member diet/allergy) | ✅ shared framework + individual modifications |
| Missing credentials path (env removed in test client) | ✅ 503 with setup instructions, no fake reply |
| Empty meal / empty members | ✅ 400 with clear messages |
| `npx eslint` on all new/edited files | ✅ clean (22 pre-existing errors remain in untouched files) |
| `npm run build` | ✅ built in ~600 ms |
| Secret scan of `dist/` | ✅ no `IBM_API_KEY`/`IBM_PROJECT_ID` values in bundle |
| Browser E2E (Wellness Hub → Nutrition AI) | ✅ see below |

Browser verification (desktop + mobile viewport):

- Wellness Hub opens; **Nutrition AI** tab and overview card present.
- Landing section renders with heading "Personalized Nutrition & Meal Planning",
  feature cards, service status, and dark/light toggle (scoped — rest of
  HerGuardian stays light).
- Chat: typing indicator → real AI reply ("Explain the nutrients in poha." →
  poha-specific answer), context-aware follow-up about calories in a serving
  answered from the same conversation; clear chat works.
- 7-Day plan: generated live with Indian-vegetarian diet + peanut/shellfish
  allergy → plan explicitly says it "respects your peanut and shellfish
  allergies", per-day meals with labelled kcal/macros, BMI/TDEE stats,
  Copy + Save buttons.
- Save → entry appears in HerGuardian's existing **Saved Resources** page
  (category "Personal Meal Plans"), via the existing favorites API.
- Calorie analyzer: Masala dosa → meal-specific breakdown (500–650 kcal,
  component table) — distinct from other meals, clearly labelled estimates.
- BMI: 65 kg / 165 cm → 23.9 "Normal weight", healthy range 50.4–67.8 kg,
  live AI guidance with screening-measure disclaimer; metric-only (matches the
  original NutriBot calculator, which has no imperial mode).
- Quick Meal Suggestions: full form (meal type, target calories, diet incl.
  eggetarian/keto, cuisine, goal, ingredients, budget, allergies) renders;
  endpoint verified via API tests.
- Family planner: add member (Sunita, 68, peanut allergy, type-2 diabetes
  notes) → generate → shared plan that names Sunita and flags peanuts and
  diabetes; "Regenerate" works.
- Theme: dark/light toggle works and is scoped to the Nutrition AI section
  only (rest of HerGuardian stays on its cream/light theme).
- Responsive: verified at 1360 px desktop and ~520 px mobile — no horizontal
  page overflow after the `min-w-0` layout fix; tab rows scroll horizontally
  inside their cards.
- No console errors; existing pages (home, dashboard, Saved Resources,
  sidebar nav, zoom controls, notifications) remain functional.
- Existing tabs (Women's Health, Cycle, Nutrition recipes, Fitness, Mental)
  still render; sidebar/topbar/zoom controls unchanged.
- No duplicate sidebar, no iframe, no Bootstrap CSS leakage.

## 8. Known limitations / not done

1. **Nutrition chat history is not persisted across sessions.** Conversation
   context lives in React state and is sent per-request. HerGuardian's existing
   `/api/chat` collection is intentionally kept separate (requirement: keep
   nutrition conversations out of unrelated AI histories) and storing nutrition
   Q&A would persist health-adjacent data unnecessarily.
2. **"Save" on the meal plan stores a summary (first 500 chars) in Saved
   Resources**, not the full multi-thousand-character plan — the Favorite model
   is a summary store. Copy-to-clipboard provides the full plan.
3. **Calorie/BMI numbers are AI estimates**, clearly labelled as such. There is
   no local nutrition database; the original NutriBot had none either, and the
   requirement forbids presenting estimates as exact values.
4. **Python service is not containerized** — deployment is via Render python
   service (render.yaml) or any `gunicorn app:app` host. A Dockerfile was not
   added since the repo has no Docker convention.
5. The **original NutriBot project folder** (`D:\acer\my Ai projects\My Nutrition
   Agent`) was left untouched; the adapted copy lives in `nutrition bot/` so
   both can run side by side.
6. **4 pre-existing ESLint errors in `DashboardLayout.jsx`** (unused imports
   `Activity`, `Apple`, `Brain`, `Route`) come from unrelated, uncommitted nav-
   item changes in the working tree — not from this integration. All files
   created for the nutrition integration lint clean.
7. The model occasionally appends extra example dialogues to a chat reply —
   this is inherited from NutriBot's original `AGENT_INSTRUCTIONS` prompt, which
   was preserved as required rather than rewritten.
