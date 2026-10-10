import { useState } from "react";
import { Salad, RefreshCw, TriangleAlert } from "lucide-react";
import Markdown from "./Markdown";
import { suggestMeals } from "../../services/nutritionService";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const DIET_TYPES = [
  "vegetarian",
  "vegan",
  "non-vegetarian",
  "eggetarian",
  "keto",
  "Mediterranean",
  "diabetic-friendly",
  "balanced",
];

const CUISINES = ["Indian", "Mediterranean", "Asian", "Continental", "Mexican", "Global"];

const GOALS = [
  { value: "", label: "No specific goal" },
  { value: "lose weight", label: "Weight loss" },
  { value: "maintain weight", label: "Maintain weight" },
  { value: "gain weight", label: "Weight gain" },
  { value: "build muscle", label: "Build muscle" },
  { value: "high protein", label: "High protein" },
];

function QuickMealSuggestions() {
  const [form, setForm] = useState({
    meal_type: "lunch",
    calories: "500",
    diet_type: "vegetarian",
    cuisine: "Indian",
    ingredients: "",
    goal: "",
    budget: "",
    restrictions: "",
  });
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const suggest = async () => {
    const calories = Number(form.calories);
    if (!Number.isFinite(calories) || calories < 80 || calories > 3000) {
      setError("Target calories must be between 80 and 3000.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const data = await suggestMeals({ ...form, calories });
      setResult(data.suggestions);
    } catch (err) {
      setError(err.message);
      setResult("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <div className="nb-card rounded-xl p-5 lg:col-span-2">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold">
          <Salad className="h-4 w-4 nb-accent" />
          Quick Meal Suggestions
        </h3>
        <p className="nb-soft mb-4 text-xs">
          Get 3 tailored meal ideas for any occasion based on your goals, ingredients,
          budget, and dietary restrictions.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nb-label" htmlFor="qs-meal">Meal type</label>
            <select id="qs-meal" className="nb-input" value={form.meal_type} onChange={update("meal_type")}>
              {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="nb-label" htmlFor="qs-calories">Target calories</label>
            <input id="qs-calories" className="nb-input" type="number" min="80" max="3000" value={form.calories} onChange={update("calories")} placeholder="500" />
          </div>
          <div>
            <label className="nb-label" htmlFor="qs-diet">Diet type</label>
            <select id="qs-diet" className="nb-input" value={form.diet_type} onChange={update("diet_type")}>
              {DIET_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="nb-label" htmlFor="qs-cuisine">Cuisine</label>
            <select id="qs-cuisine" className="nb-input" value={form.cuisine} onChange={update("cuisine")}>
              {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="qs-goal">Goal (optional)</label>
            <select id="qs-goal" className="nb-input" value={form.goal} onChange={update("goal")}>
              {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="qs-ingredients">Available ingredients (optional)</label>
            <input id="qs-ingredients" className="nb-input" value={form.ingredients} onChange={update("ingredients")} placeholder="e.g. paneer, bread, eggs" />
          </div>
          <div>
            <label className="nb-label" htmlFor="qs-budget">Budget (optional)</label>
            <input id="qs-budget" className="nb-input" value={form.budget} onChange={update("budget")} placeholder="e.g. under ₹100" />
          </div>
          <div>
            <label className="nb-label" htmlFor="qs-restrictions">Allergies / restrictions</label>
            <input id="qs-restrictions" className="nb-input" value={form.restrictions} onChange={update("restrictions")} placeholder="e.g. nuts, gluten" />
          </div>
        </div>

        <button
          type="button"
          onClick={suggest}
          disabled={isLoading}
          className="nb-btn nb-btn-primary mt-4 w-full cursor-pointer"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Salad className="h-4 w-4" />}
          {isLoading ? "Suggesting..." : "Suggest Meals"}
        </button>
      </div>

      {/* Results */}
      <div className="nb-card rounded-xl p-5 lg:col-span-3">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
          <Salad className="h-4 w-4 nb-accent" />
          Suggested Meals
        </h3>

        {error && (
          <p className="nb-alert-error mb-3 flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-14 text-sm nb-soft">
            <RefreshCw className="h-6 w-6 animate-spin nb-accent" />
            Finding the right meals for you…
          </div>
        ) : result ? (
          <>
            <Markdown content={result} />
            <p className="nb-soft mt-4 border-t border-[var(--nb-border)] pt-3 text-xs">
              ⚠️ Calorie values are AI-generated estimates. Allergies listed above are
              respected, but always double-check ingredient labels for allergens.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Salad className="h-10 w-10 nb-accent opacity-50" />
            <p className="nb-soft max-w-xs text-sm">
              Set your preferences and NutriBot will suggest 3 healthy options with
              ingredients, prep time, and estimated calories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickMealSuggestions;
