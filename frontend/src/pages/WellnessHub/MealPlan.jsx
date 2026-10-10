import { useState } from "react";
import { CalendarDays, Copy, RefreshCw, Sparkles, TriangleAlert, BookmarkPlus } from "lucide-react";
import toast from "react-hot-toast";
import Markdown from "./Markdown";
import { generateMealPlan } from "../../services/nutritionService";
import { addFavorite } from "../../services/favoriteService";

const DIET_TYPES = [
  "Indian vegetarian",
  "Indian non-vegetarian",
  "vegan",
  "keto",
  "Mediterranean",
  "balanced",
  "diabetic-friendly",
  "DASH",
];

const GOALS = ["lose weight", "maintain weight", "gain weight", "build muscle"];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" },
];

const MEALS_PER_DAY = [
  { value: "", label: "Default (3 meals + 2 snacks)" },
  { value: "3", label: "3 meals" },
  { value: "4", label: "4 meals" },
  { value: "5", label: "5 meals" },
  { value: "6", label: "6 small meals" },
];

function MealPlan() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    gender: "female",
    goal: "maintain weight",
    diet_type: "balanced",
    activity: "moderate",
    allergies: "",
    avoid: "",
    preferences: "",
    budget: "",
    ingredients: "",
    meals_per_day: "",
    cuisine: "Indian",
  });
  const [plan, setPlan] = useState("");
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const weight = Number(form.weight);
    const height = Number(form.height);
    const age = Number(form.age);
    if (!form.weight || !Number.isFinite(weight) || weight < 20 || weight > 400) {
      return "Enter a weight between 20 and 400 kg.";
    }
    if (!form.height || !Number.isFinite(height) || height < 80 || height > 260) {
      return "Enter a height between 80 and 260 cm.";
    }
    if (form.age && (!Number.isInteger(age) || age < 5 || age > 120)) {
      return "Age must be a whole number between 5 and 120.";
    }
    return "";
  };

  const generate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        name: form.name.trim() || "User",
        age: Number(form.age) || 30,
        weight: Number(form.weight),
        height: Number(form.height),
        allergies: form.allergies.trim() || "none",
      };
      const data = await generateMealPlan(payload);
      setPlan(data.plan);
      setStats({ bmi: data.bmi, calories: data.calories });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(plan);
      toast.success("Plan copied to clipboard");
    } catch {
      toast.error("Could not copy — select the text manually");
    }
  };

  const savePlan = async () => {
    try {
      await addFavorite({
        itemId: `mealplan-${Date.now()}`,
        title: `7-Day Meal Plan — ${form.diet_type}`,
        description: plan.slice(0, 500),
        category: "Meal Plan",
        source: "nutrition-ai",
      });
      toast.success("Plan saved to your library");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save plan");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Profile form */}
      <div className="nb-card rounded-xl p-5 lg:col-span-2">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold">
          <Sparkles className="h-4 w-4 nb-accent" />
          Your Profile
        </h3>
        <p className="nb-soft mb-4 text-xs">
          All fields except weight &amp; height are optional. Your details are only used to
          build this plan.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="nb-label" htmlFor="mp-name">Name</label>
            <input id="mp-name" className="nb-input" value={form.name} onChange={update("name")} placeholder="Your name" />
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-age">Age</label>
            <input id="mp-age" className="nb-input" type="number" min="5" max="120" value={form.age} onChange={update("age")} placeholder="30" />
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-gender">Gender</label>
            <select id="mp-gender" className="nb-input" value={form.gender} onChange={update("gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-weight">Weight (kg) *</label>
            <input id="mp-weight" className="nb-input" type="number" min="20" max="400" value={form.weight} onChange={update("weight")} placeholder="70" required />
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-height">Height (cm) *</label>
            <input id="mp-height" className="nb-input" type="number" min="80" max="260" value={form.height} onChange={update("height")} placeholder="170" required />
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="mp-goal">Health goal</label>
            <select id="mp-goal" className="nb-input" value={form.goal} onChange={update("goal")}>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-diet">Dietary preference</label>
            <select id="mp-diet" className="nb-input" value={form.diet_type} onChange={update("diet_type")}>
              {DIET_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-activity">Activity level</label>
            <select id="mp-activity" className="nb-input" value={form.activity} onChange={update("activity")}>
              {ACTIVITY_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-cuisine">Cuisine preference</label>
            <select id="mp-cuisine" className="nb-input" value={form.cuisine} onChange={update("cuisine")}>
              <option value="Indian">Indian</option>
              <option value="Indian + global">Indian + global</option>
              <option value="Mediterranean">Mediterranean</option>
              <option value="Asian">Asian</option>
              <option value="Continental">Continental</option>
            </select>
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-meals">Meals per day</label>
            <select id="mp-meals" className="nb-input" value={form.meals_per_day} onChange={update("meals_per_day")}>
              {MEALS_PER_DAY.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="mp-allergies">Food allergies / intolerances</label>
            <input id="mp-allergies" className="nb-input" value={form.allergies} onChange={update("allergies")} placeholder="e.g. gluten, nuts, dairy" />
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="mp-avoid">Foods to avoid</label>
            <input id="mp-avoid" className="nb-input" value={form.avoid} onChange={update("avoid")} placeholder="e.g. seafood, raw onion" />
          </div>
          <div className="col-span-2">
            <label className="nb-label" htmlFor="mp-prefs">Food preferences</label>
            <input id="mp-prefs" className="nb-input" value={form.preferences} onChange={update("preferences")} placeholder="e.g. high-fibre, low-spice, high-protein" />
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-budget">Budget</label>
            <input id="mp-budget" className="nb-input" value={form.budget} onChange={update("budget")} placeholder="e.g. moderate, ₹300/day" />
          </div>
          <div>
            <label className="nb-label" htmlFor="mp-ingredients">Available ingredients</label>
            <input id="mp-ingredients" className="nb-input" value={form.ingredients} onChange={update("ingredients")} placeholder="e.g. dal, rice, eggs" />
          </div>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={isLoading}
          className="nb-btn nb-btn-primary mt-4 w-full cursor-pointer"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
          {isLoading ? "Generating..." : plan ? "Regenerate 7-Day Plan" : "Generate 7-Day Plan"}
        </button>
      </div>

      {/* Result */}
      <div className="nb-card rounded-xl p-5 lg:col-span-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <CalendarDays className="h-4 w-4 nb-accent" />
            Your 7-Day Plan
          </h3>
          {plan && (
            <div className="flex gap-2">
              <button type="button" onClick={copyPlan} className="nb-btn nb-btn-outline cursor-pointer text-xs">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button type="button" onClick={savePlan} className="nb-btn nb-btn-outline cursor-pointer text-xs">
                <BookmarkPlus className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          )}
        </div>

        {stats && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "BMI", value: stats.bmi.bmi, hint: stats.bmi.category },
              { label: "TDEE (kcal)", value: stats.calories.tdee, hint: "maintenance" },
              { label: "Loss target", value: stats.calories.weight_loss, hint: "kcal/day" },
              { label: "Gain target", value: stats.calories.weight_gain, hint: "kcal/day" },
            ].map((s) => (
              <div key={s.label} className="nb-card-soft rounded-lg p-3 text-center">
                <p className="text-lg font-bold nb-accent">{s.value}</p>
                <p className="text-[11px] font-semibold nb-muted">{s.label}</p>
                <p className="text-[10px] nb-soft">{s.hint}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="nb-alert-error mb-3 flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-sm nb-soft">
            <RefreshCw className="h-6 w-6 animate-spin nb-accent" />
            IBM Watsonx.ai Granite is crafting your personalised plan…
          </div>
        ) : plan ? (
          <>
            <Markdown content={plan} />
            <p className="nb-soft mt-4 border-t border-[var(--nb-border)] pt-3 text-xs">
              ⚠️ Calorie and nutrient values in this plan are AI-generated estimates, not
              lab-verified measurements. BMI/TDEE figures are screening estimates only.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <CalendarDays className="h-10 w-10 nb-accent opacity-50" />
            <p className="nb-soft max-w-xs text-sm">
              Fill in your profile and click <strong>Generate 7-Day Plan</strong> to get a
              personalised week of meals with portions, variety, and a grocery list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MealPlan;
