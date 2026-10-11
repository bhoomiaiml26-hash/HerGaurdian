import express from 'express';
import {
  chatNutrition,
  generateNutritionPlan,
  analyzeMealCalories,
  getBmiGuidance,
  suggestQuickMeals,
  generateFamilyMealPlan,
} from '../services/nutritionAIService.js';

const router = express.Router();

// Health check endpoint for NutriBot
router.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    watsonx_configured: true,
    provider: 'gemini',
    service: 'HerGuardian Nutrition AI',
  });
});

// Chat endpoint (accepts { message, history })
router.post(['/chat', '/api/chat'], async (req, res, next) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const result = await chatNutrition(message.trim(), history || []);
    res.json(result);
  } catch (err) {
    console.error('[NutritionRoutes] Chat error:', err);
    res.status(502).json({ error: err.message || 'AI generation failed. Please retry.' });
  }
});

// Clear history (returns success)
router.post(['/clear-history', '/api/clear-history'], (req, res) => {
  res.json({ success: true, message: 'Chat history cleared' });
});

// 7-Day Meal Plan
router.post(['/nutrition-plan', '/api/nutrition-plan'], async (req, res) => {
  try {
    const result = await generateNutritionPlan(req.body);
    res.json(result);
  } catch (err) {
    console.error('[NutritionRoutes] Plan error:', err);
    res.status(502).json({ error: err.message || 'Could not generate meal plan.' });
  }
});

// Calorie & Macro Analysis
router.post(['/calorie-analysis', '/api/calorie-analysis'], async (req, res) => {
  try {
    const { meal } = req.body || {};
    if (!meal || typeof meal !== 'string' || !meal.trim()) {
      return res.status(400).json({ error: 'Meal description is required' });
    }
    const result = await analyzeMealCalories(meal.trim());
    res.json(result);
  } catch (err) {
    console.error('[NutritionRoutes] Analysis error:', err);
    res.status(502).json({ error: err.message || 'Could not analyze meal.' });
  }
});

// BMI calculation & guidance
router.post(['/bmi', '/api/bmi'], async (req, res) => {
  try {
    const { weight, height, age, gender } = req.body || {};
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || w < 20 || w > 400) {
      return res.status(400).json({ error: 'Weight must be between 20 and 400 kg' });
    }
    if (!h || h < 80 || h > 260) {
      return res.status(400).json({ error: 'Height must be between 80 and 260 cm' });
    }
    const result = await getBmiGuidance(w, h, age, gender);
    res.json(result);
  } catch (err) {
    console.error('[NutritionRoutes] BMI error:', err);
    res.status(502).json({ error: err.message || 'Could not calculate BMI guidance.' });
  }
});

// Quick meal suggestions
router.post(['/meal-suggestion', '/api/meal-suggestion'], async (req, res) => {
  try {
    const result = await suggestQuickMeals(req.body);
    res.json(result);
  } catch (err) {
    console.error('[NutritionRoutes] Suggestion error:', err);
    res.status(502).json({ error: err.message || 'Could not suggest meals.' });
  }
});

// Family meal planner
router.post(['/family-plan', '/api/family-plan'], async (req, res) => {
  try {
    const result = await generateFamilyMealPlan(req.body);
    res.json(result);
  } catch (err) {
    console.error('[NutritionRoutes] Family plan error:', err);
    res.status(502).json({ error: err.message || 'Could not generate family plan.' });
  }
});

export default router;
