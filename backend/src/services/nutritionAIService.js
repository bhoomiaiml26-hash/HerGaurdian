import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

let model = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
    });
  } catch (err) {
    console.warn('[NutritionAI] Gemini init error:', err.message);
  }
}

const AGENT_INSTRUCTIONS = `You are NutriBot, a warm, knowledgeable, and encouraging AI Nutrition Expert.

## PERSONA & TONE
- Speak in a friendly, motivating, and non-judgmental tone.
- Use simple language — avoid heavy medical jargon.
- Add light encouragement phrases like "Great choice!", "You're doing well!"
- Always respect cultural food preferences and dietary restrictions.

## SPECIALISATION
- Deep expertise in Indian cuisine (North, South, East, West, regional diets).
- Practical home-cooking advice using easily accessible, affordable ingredients.
- Focus on balanced macros: protein, complex carbs, healthy fats, dietary fibre.
- Vegetarian, vegan, Jain, and non-vegetarian meal planning.
- Familiar with Ayurvedic dietary principles.

## INDIAN FOOD PREFERENCES
- Suggest dal, sabzi, roti, rice, idli, dosa, poha, upma, khichdi, etc.
- Incorporate traditional superfoods: turmeric, jeera, amla, moringa, ghee (in moderation), lentils, millets (bajra, jowar, ragi).
- Account for festival foods and fasting (vrat) requirements when asked.
- Suggest healthy Indian street-food alternatives.

## SAFETY RULES (NON-NEGOTIABLE)
- NEVER diagnose medical conditions or prescribe medications.
- Always recommend consulting a registered dietitian or doctor for serious health conditions (diabetes, kidney disease, etc.).
- Refuse requests for crash diets or unhealthy weight-loss shortcuts.
- For pregnancy, eating disorders, or medically prescribed diets, encourage consultation with a healthcare professional.
- Clearly label all calorie and nutrient numbers as estimates. Never present estimates as exact measurements.

## RESPONSE FORMAT
- Use clear markdown headings (## ) and bullet points.
- Include approximate calories and macros where relevant.
- Keep responses concise but complete (150-400 words unless a full meal plan is requested).`;

async function generateAIContent(prompt) {
  if (!model) {
    throw new Error('Gemini AI is not configured. Please set GEMINI_API_KEY on the server.');
  }
  const result = await model.generateContent(`${AGENT_INSTRUCTIONS}\n\n---\n${prompt}`);
  const response = await result.response;
  return response.text();
}

export async function chatNutrition(message, history = []) {
  const turns = (history || [])
    .slice(-10)
    .filter((t) => t && typeof t.content === 'string' && t.content.trim())
    .map((t) => `${t.role === 'user' ? 'User' : 'NutriBot'}: ${t.content.trim()}`)
    .join('\n');

  const prompt = turns
    ? `Continue this conversation about nutrition. Use the earlier turns as context:\n\n${turns}\n\nUser: ${message}\nNutriBot:`
    : `User: ${message}\nNutriBot:`;

  const reply = await generateAIContent(prompt);
  return { reply, timestamp: new Date().toISOString() };
}

export async function generateNutritionPlan(data) {
  const {
    name = 'Friend',
    age = 30,
    gender = '',
    weight = 65,
    height = 165,
    goal = 'maintain weight',
    diet_type = 'balanced',
    activity = 'moderate',
    allergies = 'none',
    cuisine = 'Indian',
    avoid = '',
    preferences = '',
    budget = 'moderate',
    ingredients = '',
    meals_per_day = 3,
  } = data || {};

  const prompt = `Create a personalized 7-Day Nutrition and Meal Plan for ${name}:
- Profile: Age ${age}, Gender: ${gender || 'not specified'}, Weight: ${weight} kg, Height: ${height} cm
- Primary Health Goal: ${goal}
- Diet Type: ${diet_type}
- Activity Level: ${activity}
- Cuisine Preference: ${cuisine}
- Meals per day: ${meals_per_day}
- Budget: ${budget}
- Allergies / Intolerances: ${allergies || 'none'}
- Foods to Avoid: ${avoid || 'none'}
- Preferred Foods: ${preferences || 'none'}
- Available Ingredients to use: ${ingredients || 'general pantry items'}

Format day-by-day (Day 1 to Day 7) with breakfast, lunch, snack, dinner. Include estimated calories/macros per meal, grocery tips, and hydration advice. Remind that all calorie values are estimates.`;

  const plan = await generateAIContent(prompt);
  return { plan, timestamp: new Date().toISOString() };
}

export async function analyzeMealCalories(meal) {
  const prompt = `Perform a nutritional breakdown and calorie analysis for this meal:
"${meal}"

Please provide:
1. Estimated Total Calories
2. Macronutrient breakdown: Protein (g), Carbohydrates (g), Fats (g), Dietary Fibre (g)
3. Key Micronutrients (vitamins, minerals)
4. Health Highlights & Practical Suggestions to make it even more balanced.
Always clearly state that nutritional values are approximate estimates.`;

  const analysis = await generateAIContent(prompt);
  return { analysis, timestamp: new Date().toISOString() };
}

export function computeBmiMetrics(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  let category = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  const lowWeight = Math.round(18.5 * (heightM * heightM) * 10) / 10;
  const highWeight = Math.round(24.9 * (heightM * heightM) * 10) / 10;

  return {
    bmi,
    category,
    healthy_range: `${lowWeight} kg – ${highWeight} kg`,
  };
}

export async function getBmiGuidance(weight, height, age, gender) {
  const metrics = computeBmiMetrics(Number(weight), Number(height));
  const prompt = `A user has requested BMI interpretation:
- Weight: ${weight} kg
- Height: ${height} cm
- Calculated BMI: ${metrics.bmi} (${metrics.category})
- Age: ${age || 'not specified'}, Gender: ${gender || 'not specified'}
- Healthy weight range: ${metrics.healthy_range}

Provide warm, encouraging, realistic dietary and lifestyle guidance tailored to their category. Avoid strict or extreme diets. Emphasize nourishment, strength, and gradual sustainable habits.`;

  const ai_guidance = await generateAIContent(prompt);
  return {
    ...metrics,
    ai_guidance,
    timestamp: new Date().toISOString(),
  };
}

export async function suggestQuickMeals(data) {
  const {
    meal_type = 'dinner',
    diet_type = 'balanced',
    cuisine = 'Indian',
    goal = 'healthy eating',
    budget = 'affordable',
    ingredients = '',
    allergies = 'none',
  } = data || {};

  const prompt = `Suggest 3 quick, delicious, and healthy meal ideas for ${meal_type}:
- Diet: ${diet_type}
- Cuisine: ${cuisine}
- Goal: ${goal}
- Budget: ${budget}
- Available Ingredients: ${ingredients || 'standard kitchen ingredients'}
- Allergies/Restrictions: ${allergies || 'none'}

For each option include:
- Name of dish
- Preparation time (under 25 mins)
- Key ingredients & quick steps
- Approximate calorie & protein estimate.`;

  const suggestions = await generateAIContent(prompt);
  return { suggestions, timestamp: new Date().toISOString() };
}

export async function generateFamilyMealPlan(data) {
  const {
    members = [],
    days = 3,
    meals_per_day = 3,
    cuisine = 'Indian',
  } = data || {};

  const memberDescriptions = members
    .map((m, i) => `Member ${i + 1}: ${m.name || 'Member'} (${m.age || 30} yrs, ${m.gender || 'unspecified'}), Diet: ${m.diet || 'balanced'}, Allergies: ${m.allergies || 'none'}, Health Notes: ${m.health_notes || 'none'}`)
    .join('\n');

  const prompt = `Create a ${days}-day Family Meal Plan for the following household members:
${memberDescriptions}

Cuisine preference: ${cuisine}
Meals per day: ${meals_per_day}

Requirements:
- Ensure meals can be cooked together in one family kitchen with simple adaptations for individual dietary restrictions or allergies.
- Clearly flag which member needs substitutions (e.g. gluten-free, less spice for kids, extra protein for active members).
- Keep grocery requirements practical and shared.`;

  const plan = await generateAIContent(prompt);
  return { plan, timestamp: new Date().toISOString() };
}
