"""
╔══════════════════════════════════════════════════════════════════════════════╗
║          IBM Watsonx.ai  —  AI Nutrition Agent  (Flask Backend)            ║
╚══════════════════════════════════════════════════════════════════════════════╝

Powered by IBM Granite models via ibm-watsonx-ai SDK.
Secure credentials loaded from .env  (never hard-coded).

Integration notes (HerGuardian AI):
- This service is consumed by the HerGuardian React frontend (Wellness Hub →
  Nutrition AI). CORS is restricted to the HerGuardian frontend origins.
- /api/chat accepts an optional `history` array so follow-up questions keep
  their conversation context across stateless requests.
- Missing IBM credentials return HTTP 503 with a setup message instead of a
  fake AI reply.
"""

import os
import json
import math
import sys
from datetime import datetime
from flask import Flask, request, jsonify, render_template, session, Response
from dotenv import load_dotenv
from pathlib import Path

# ── Load environment variables ────────────────────────────────────────────────
# Use explicit path so .env is found regardless of working directory
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "fallback-dev-secret-change-me")

# ══════════════════════════════════════════════════════════════════════════════
#  CORS  — allow only HerGuardian AI frontend origins
# ══════════════════════════════════════════════════════════════════════════════

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]


def _allowed_origins():
    env_origins = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "").split(",")
        if o.strip()
    ]
    return list(dict.fromkeys(DEFAULT_CORS_ORIGINS + env_origins))


@app.after_request
def add_cors_headers(response: Response) -> Response:
    origin = request.headers.get("Origin")
    if origin and origin in _allowed_origins():
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return ("", 204)


# ══════════════════════════════════════════════════════════════════════════════
#  AGENT INSTRUCTIONS  — Edit this section to customise agent behaviour
# ══════════════════════════════════════════════════════════════════════════════

AGENT_INSTRUCTIONS = """
You are NutriBot, a warm, knowledgeable, and encouraging AI Nutrition Expert
powered by IBM Watsonx.ai Granite technology.

## PERSONA & TONE
- Speak in a friendly, motivating, and non-judgmental tone.
- Use simple language — avoid heavy medical jargon.
- Add light encouragement phrases like "Great choice!", "You're doing well!"
- Always respect cultural food preferences and dietary restrictions.

## SPECIALISATION
- Deep expertise in Indian cuisine and regional food traditions
  (North Indian, South Indian, Bengali, Gujarati, Maharashtrian, etc.).
- Fluent in standard global diets: Mediterranean, Keto, Vegan, Vegetarian,
  Paleo, DASH, Gluten-Free, Diabetic-friendly, Weight-loss, Muscle-gain.
- Familiar with Ayurvedic dietary principles.

## INDIAN FOOD PREFERENCES
- Suggest dal, sabzi, roti, rice, idli, dosa, poha, upma, khichdi, etc.
- Incorporate traditional superfoods: turmeric, jeera, amla, moringa, ghee
  (in moderation), coconut, lentils, millet (bajra, jowar, ragi).
- Account for festival foods and fasting (vrat) requirements when asked.
- Suggest healthy Indian street-food alternatives.

## CAPABILITIES
1. Personalised nutrition plans (daily / weekly / monthly)
2. Calorie analysis and macro-nutrient breakdown
3. Healthy meal suggestions for breakfast, lunch, dinner, snacks
4. Family diet recommendations (children, elderly, pregnant women)
5. BMI interpretation and weight-management advice
6. Grocery shopping lists based on meal plans
7. Recipe substitution suggestions for healthier alternatives
8. Hydration and supplement guidance

## SAFETY RULES  (NON-NEGOTIABLE)
- NEVER diagnose medical conditions or prescribe medications.
- Always recommend consulting a registered dietitian or doctor for serious
  health conditions (diabetes, kidney disease, eating disorders, etc.).
- Do NOT provide extreme calorie-restriction plans below 1200 kcal/day for
  adults without flagging risks and advising professional supervision.
- Refuse requests for crash diets or unhealthy weight-loss shortcuts.
- For children under 12, always note that a paediatrician should be consulted.
- For pregnancy, eating disorders, or medically prescribed diets, encourage
  consultation with an appropriately qualified healthcare professional.
- Clearly label all calorie and nutrient numbers as estimates unless they come
  from a stated verified source. Never present estimates as exact measurements.

## RESPONSE FORMAT
- Use clear headings (## ) and bullet points for meal plans.
- Include approximate calories and macros where relevant.
- Keep responses concise but complete — aim for 150-400 words unless a
  detailed meal plan is explicitly requested.
- End with a motivational note or a practical tip when appropriate.
"""

# ══════════════════════════════════════════════════════════════════════════════
#  IBM Watsonx.ai  —  Model Client Initialisation
# ══════════════════════════════════════════════════════════════════════════════

_MODEL_CACHE = {"model": None, "key": None}


def get_watsonx_client():
    """Return a cached ibm_watsonx_ai ModelInference instance, or None on config error."""
    api_key    = os.getenv("IBM_API_KEY")
    url        = os.getenv("IBM_WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
    project_id = os.getenv("IBM_PROJECT_ID")
    model_id   = os.getenv("WATSONX_MODEL_ID", "ibm/granite-3-3-8b-instruct")

    if not api_key or not project_id:
        return None

    cache_key = f"{api_key}|{url}|{project_id}|{model_id}"
    if _MODEL_CACHE["model"] is not None and _MODEL_CACHE["key"] == cache_key:
        return _MODEL_CACHE["model"]

    try:
        from ibm_watsonx_ai import Credentials
        from ibm_watsonx_ai.foundation_models import ModelInference

        credentials = Credentials(url=url, api_key=api_key)
        model = ModelInference(
            model_id=model_id,
            credentials=credentials,
            project_id=project_id,
            params={
                "decoding_method": "greedy",
                "max_new_tokens": 1024,
                "min_new_tokens": 20,
                "temperature": 0.7,
                "repetition_penalty": 1.1,
            },
        )
        _MODEL_CACHE["model"] = model
        _MODEL_CACHE["key"] = cache_key
        return model
    except Exception as exc:
        app.logger.error("Watsonx client init failed: %s", exc)
        return None


class WatsonxConfigError(Exception):
    """Raised when IBM Watsonx.ai credentials are missing or invalid."""


SETUP_ERROR_MESSAGE = (
    "IBM Watsonx.ai is not configured. Set IBM_API_KEY, IBM_PROJECT_ID and "
    "IBM_WATSONX_URL in the nutrition bot .env file and restart the service. "
    "See .env.example for the required variables."
)


def call_watsonx(prompt: str) -> str:
    """
    Send a prompt to Watsonx.ai and return the text response.

    Raises WatsonxConfigError when credentials are missing so callers can
    respond with HTTP 503 instead of a fabricated AI answer.
    """
    model = get_watsonx_client()
    if model is None:
        raise WatsonxConfigError(SETUP_ERROR_MESSAGE)
    try:
        full_prompt = (
            f"{AGENT_INSTRUCTIONS}\n\n"
            f"---\nUser: {prompt}\nNutriBot:"
        )
        response = model.generate_text(prompt=full_prompt)
        return response.strip() if response else "I couldn't generate a response. Please try again."
    except Exception as exc:
        app.logger.error("Watsonx call failed: %s", exc)
        raise RuntimeError(f"Error communicating with IBM Watsonx.ai: {exc}")


@app.errorhandler(WatsonxConfigError)
def handle_watsonx_config_error(exc):
    return jsonify({"error": str(exc), "code": "watsonx_not_configured"}), 503


@app.errorhandler(RuntimeError)
def handle_watsonx_runtime_error(exc):
    return jsonify({"error": str(exc), "code": "watsonx_error"}), 502


# ══════════════════════════════════════════════════════════════════════════════
#  Utility helpers
# ══════════════════════════════════════════════════════════════════════════════

def calculate_bmi(weight_kg: float, height_cm: float) -> dict:
    """Return BMI value, category, and healthy-weight range."""
    height_m = height_cm / 100
    bmi = round(weight_kg / (height_m ** 2), 1)

    if bmi < 18.5:
        category, color = "Underweight", "#3b82f6"
    elif bmi < 25:
        category, color = "Normal weight", "#22c55e"
    elif bmi < 30:
        category, color = "Overweight", "#f59e0b"
    else:
        category, color = "Obese", "#ef4444"

    low  = round(18.5 * (height_m ** 2), 1)
    high = round(24.9 * (height_m ** 2), 1)

    return {
        "bmi": bmi,
        "category": category,
        "color": color,
        "healthy_range": f"{low} – {high} kg",
        "height_m": round(height_m, 2),
    }


def calculate_tdee(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity: str,
) -> dict:
    """Calculate BMR (Mifflin-St Jeor) and TDEE."""
    if gender.lower() in ("male", "m"):
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    multipliers = {
        "sedentary":   1.2,
        "light":       1.375,
        "moderate":    1.55,
        "active":      1.725,
        "very_active": 1.9,
    }
    multiplier = multipliers.get(activity.lower(), 1.55)
    tdee = round(bmr * multiplier)

    return {
        "bmr":        round(bmr),
        "tdee":       tdee,
        "weight_loss":  tdee - 500,
        "weight_gain":  tdee + 500,
        "maintenance":  tdee,
    }


def validate_number(value, name, lo, hi):
    """Parse a numeric input and range-check it. Returns (value, error)."""
    try:
        num = float(value)
    except (TypeError, ValueError):
        return None, f"{name} must be a number"
    if not (lo <= num <= hi):
        return None, f"{name} must be between {lo} and {hi}"
    return num, None


def build_conversation_prompt(history, message):
    """
    Build a context-aware prompt from prior conversation turns so follow-up
    questions stay on topic. `history` is a list of {"role", "content"} dicts.
    """
    valid_roles = {"user", "assistant"}
    turns = [
        t for t in (history or [])[-10:]
        if isinstance(t, dict)
        and t.get("role") in valid_roles
        and isinstance(t.get("content"), str)
        and t.get("content").strip()
    ]
    if not turns:
        return message
    transcript = "\n".join(
        f"{'User' if t['role'] == 'user' else 'NutriBot'}: {t['content'].strip()}"
        for t in turns
    )
    return (
        "Continue this conversation about nutrition. Use the earlier turns as "
        "context so follow-up questions make sense, but answer the final user "
        "question directly.\n\n"
        f"Earlier conversation:\n{transcript}\n\n"
        f"User: {message}\nNutriBot:"
    )


# ══════════════════════════════════════════════════════════════════════════════
#  Flask Routes — Pages
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    return render_template("index.html")


# ══════════════════════════════════════════════════════════════════════════════
#  Flask Routes — API
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/chat", methods=["POST"])
def api_chat():
    """Chat endpoint — accepts optional `history` for multi-turn context."""
    data    = request.get_json(force=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Stateless history from the client (React app) takes precedence; fall
    # back to the cookie session used by the standalone NutriBot UI.
    if not isinstance(history, list):
        history = session.get("chat_history", [])

    prompt = build_conversation_prompt(history, message)
    reply = call_watsonx(prompt)

    session_history = list(history) + [
        {"role": "user", "content": message, "time": datetime.now().isoformat()},
        {"role": "assistant", "content": reply, "time": datetime.now().isoformat()},
    ]
    session["chat_history"] = session_history[-40:]   # keep last 20 exchanges

    return jsonify({"reply": reply, "timestamp": datetime.now().isoformat()})


@app.route("/api/nutrition-plan", methods=["POST"])
def api_nutrition_plan():
    """Generate a personalised 7-day meal plan."""
    data = request.get_json(force=True) or {}

    name      = data.get("name", "User")
    goal      = data.get("goal", "maintain weight")
    diet_type = data.get("diet_type", "balanced")
    activity  = data.get("activity", "moderate")
    allergies = data.get("allergies", "none")
    cuisine   = data.get("cuisine", "Indian")

    # Extended preferences (all optional — original fields still work)
    avoid_foods   = (data.get("avoid") or "").strip()
    preferences   = (data.get("preferences") or "").strip()
    budget        = (data.get("budget") or "").strip()
    ingredients   = (data.get("ingredients") or "").strip()
    meals_per_day = data.get("meals_per_day")

    weight, err = validate_number(data.get("weight", 70), "Weight", 20, 400)
    if err:
        return jsonify({"error": err}), 400
    height, err = validate_number(data.get("height", 170), "Height", 80, 260)
    if err:
        return jsonify({"error": err}), 400
    try:
        age = int(data.get("age", 30))
        if not (5 <= age <= 120):
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "Age must be a whole number between 5 and 120"}), 400

    gender = data.get("gender", "male")
    tdee_info = calculate_tdee(weight, height, age, gender, activity)
    bmi_info  = calculate_bmi(weight, height)

    lines = [
        f"Create a detailed 7-day meal plan for {name}, a {age}-year-old {gender}.",
        f"Stats: Weight {weight} kg, Height {height} cm, BMI {bmi_info['bmi']} ({bmi_info['category']})",
        f"Daily calorie target: {tdee_info['tdee']} kcal (goal: {goal})",
        f"Diet type: {diet_type} | Cuisine preference: {cuisine}",
        f"Allergies/restrictions: {allergies}",
        f"Activity level: {activity}",
    ]
    if avoid_foods:
        lines.append(f"Foods to avoid: {avoid_foods}")
    if preferences:
        lines.append(f"Food preferences: {preferences}")
    if budget:
        lines.append(f"Budget: {budget}")
    if ingredients:
        lines.append(f"Ingredients currently available: {ingredients}")
    if meals_per_day:
        lines.append(f"Number of meals per day: {meals_per_day}")
    lines += [
        "",
        "Provide: breakfast, lunch, dinner, and snacks for each day with "
        "portion guidance. Clearly label all calorie and macro numbers as "
        "estimates. Include variety across the week and respect every "
        "restriction above. Include a brief grocery list at the end.",
    ]
    prompt = "\n".join(lines)

    plan = call_watsonx(prompt)

    return jsonify({
        "plan":     plan,
        "bmi":      bmi_info,
        "calories": tdee_info,
        "generated_at": datetime.now().isoformat(),
    })


@app.route("/api/bmi", methods=["POST"])
def api_bmi():
    """BMI calculation endpoint."""
    data = request.get_json(force=True) or {}

    weight, err = validate_number(data.get("weight"), "Weight", 20, 400)
    if err:
        return jsonify({"error": err}), 400
    height, err = validate_number(data.get("height"), "Height", 80, 260)
    if err:
        return jsonify({"error": err}), 400

    age = data.get("age", 30)
    try:
        age = int(age)
    except (TypeError, ValueError):
        age = 30

    bmi_info = calculate_bmi(weight, height)

    # Ask AI for personalised advice
    prompt = (
        f"My BMI is {bmi_info['bmi']} ({bmi_info['category']}). "
        f"I am {age} years old, {data.get('gender', 'not specified')}. "
        f"Give me 5 actionable nutrition and lifestyle tips to reach or maintain a healthy BMI. "
        f"Remind me that BMI is only a screening measure and not a diagnosis."
    )
    advice = call_watsonx(prompt)

    return jsonify({"bmi_info": bmi_info, "advice": advice})


@app.route("/api/meal-suggestion", methods=["POST"])
def api_meal_suggestion():
    """Quick single-meal suggestion."""
    data = request.get_json(force=True) or {}

    meal_type  = data.get("meal_type", "lunch")
    calories   = data.get("calories", 500)
    diet_type  = data.get("diet_type", "vegetarian")
    cuisine    = data.get("cuisine", "Indian")
    ingredients = (data.get("ingredients") or "").strip()
    goal       = (data.get("goal") or "").strip()
    budget     = (data.get("budget") or "").strip()
    restrictions = (data.get("restrictions") or "").strip()

    try:
        calories = int(calories)
        if not (80 <= calories <= 3000):
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "calories must be a number between 80 and 3000"}), 400

    ing_note = f" using these ingredients: {ingredients}" if ingredients else ""
    lines = [
        f"Suggest 3 healthy {cuisine} {diet_type} {meal_type} options{ing_note}. "
        f"Each should be around {calories} calories.",
    ]
    if goal:
        lines.append(f"The eater's goal: {goal}.")
    if budget:
        lines.append(f"Budget: {budget}.")
    if restrictions:
        lines.append(f"Dietary restrictions/allergies: {restrictions}.")
    lines.append(
        "For each, include: dish name, key ingredients, prep time, calories "
        "(labelled as an estimate), and a one-sentence description."
    )
    prompt = " ".join(lines)

    suggestions = call_watsonx(prompt)
    return jsonify({"suggestions": suggestions, "meal_type": meal_type})


@app.route("/api/family-plan", methods=["POST"])
def api_family_plan():
    """Family nutrition plan for multiple members."""
    data    = request.get_json(force=True) or {}
    members = data.get("members", [])

    if not members or not isinstance(members, list):
        return jsonify({"error": "Family members list is required"}), 400

    def member_line(m):
        parts = [
            f"  - {m.get('name', 'Member')}: {m.get('age', '?')} yrs, "
            f"{m.get('gender', '?')}",
        ]
        diet = (m.get("diet") or "").strip()
        if diet:
            parts.append(f"diet: {diet}")
        allergies = (m.get("allergies") or "").strip()
        if allergies:
            parts.append(f"allergies: {allergies}")
        notes = (m.get("health_notes") or "").strip()
        parts.append(f"notes: {notes or 'no special conditions'}")
        return ", ".join(parts)

    members_desc = "\n".join(member_line(m) for m in members if isinstance(m, dict))

    prompt = (
        f"Create a family nutrition plan for {len(members)} family members:\n"
        f"{members_desc}\n\n"
        f"Provide:\n"
        f"1. A shared meal framework where the family eats together\n"
        f"2. Individual modifications for each member's needs — do NOT assume "
        f"one portion size or one meal suits everyone; respect every allergy "
        f"listed and flag dishes that could contain an allergen\n"
        f"3. Kid-friendly healthy snack ideas (if children present)\n"
        f"4. Tips for cooking one meal that suits everyone\n"
        f"5. Weekly grocery list for the whole family\n"
        f"Label all calorie numbers as estimates."
    )

    plan = call_watsonx(prompt)
    return jsonify({"family_plan": plan, "member_count": len(members)})


@app.route("/api/calorie-analysis", methods=["POST"])
def api_calorie_analysis():
    """Analyse calories in a described meal."""
    data = request.get_json(force=True) or {}
    meal = (data.get("meal") or "").strip()

    if not meal:
        return jsonify({"error": "meal description is required"}), 400
    if len(meal) > 2000:
        return jsonify({"error": "meal description is too long (max 2000 characters)"}), 400

    prompt = (
        f"Analyse the nutritional content of this meal: '{meal}'\n\n"
        f"Provide a table with:\n"
        f"- Each ingredient/component and its approximate calories\n"
        f"- Total calories\n"
        f"- Macros: protein (g), carbohydrates (g), fat (g), fibre (g)\n"
        f"- Micronutrient highlights\n"
        f"- Health rating out of 10 with a brief reason\n"
        f"- One healthier swap suggestion\n\n"
        f"Base the numbers on typical serving sizes for the described items. "
        f"Clearly state that all values are estimates and vary with preparation "
        f"method, brands, and exact quantities."
    )

    analysis = call_watsonx(prompt)
    return jsonify({"analysis": analysis, "meal": meal})


@app.route("/api/clear-history", methods=["POST"])
def api_clear_history():
    """Clear chat history from session."""
    session.pop("chat_history", None)
    return jsonify({"status": "cleared"})


@app.route("/api/health")
def api_health():
    """Health-check endpoint."""
    configured = bool(os.getenv("IBM_API_KEY") and os.getenv("IBM_PROJECT_ID"))
    return jsonify({
        "status": "ok",
        "watsonx_configured": configured,
        "model": os.getenv("WATSONX_MODEL_ID", "ibm/granite-3-3-8b-instruct"),
        "timestamp": datetime.now().isoformat(),
    })


# ══════════════════════════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    port  = int(os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    # Guard against consoles with legacy encodings (e.g. cp1252 on Windows)
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    print(f"\n[NutriBot] IBM Watsonx.ai Nutrition Agent")
    print(f"   Running on  http://localhost:{port}")
    print(f"   Debug mode: {debug}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
