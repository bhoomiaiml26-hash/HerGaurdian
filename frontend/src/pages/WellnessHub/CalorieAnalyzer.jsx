import { useState } from "react";
import { Flame, RefreshCw, TriangleAlert } from "lucide-react";
import Markdown from "./Markdown";
import { analyseMeal } from "../../services/nutritionService";

const EXAMPLE_MEALS = [
  "2 roti with dal, 1 cup rice, sabzi, raita",
  "Masala dosa with coconut chutney and sambar",
  "2 idli with sambar and a glass of buttermilk",
  "Chicken biryani with raita (one plate)",
  "Oats porridge with banana, almonds and honey",
];

function CalorieAnalyzer() {
  const [meal, setMeal] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const analyse = async (text) => {
    const value = (text ?? meal).trim();
    if (!value) {
      setError("Enter a food or meal to analyse.");
      return;
    }
    setIsLoading(true);
    setError("");
    setMeal(value);
    try {
      const data = await analyseMeal(value);
      setResult(data.analysis);
    } catch (err) {
      setError(err.message);
      setResult("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="nb-card rounded-xl p-5">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold">
          <Flame className="h-4 w-4 nb-accent" />
          Calorie &amp; Macronutrient Analyzer
        </h3>
        <p className="nb-soft mb-4 text-xs">
          Enter a food or meal with ingredients and approximate quantities — e.g.
          “2 roti with dal, 1 cup rice, sabzi, raita”.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="nb-input flex-1"
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyse()}
            placeholder="e.g. 2 roti with dal, 1 cup rice, sabzi, raita..."
            aria-label="Meal description"
          />
          <button
            type="button"
            onClick={() => analyse()}
            disabled={isLoading}
            className="nb-btn nb-btn-primary cursor-pointer"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
            {isLoading ? "Analysing..." : "Analyse"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_MEALS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => analyse(example)}
              disabled={isLoading}
              className="rounded-full border border-[var(--nb-border)] bg-[var(--nb-surface-2)] px-3 py-1 text-[11px] text-[var(--nb-text-muted)] transition hover:border-[var(--nb-primary)] hover:text-[var(--nb-primary)] disabled:opacity-50 cursor-pointer"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="nb-alert-error flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {isLoading && (
        <div className="nb-card flex flex-col items-center gap-3 rounded-xl py-12 text-sm nb-soft">
          <RefreshCw className="h-6 w-6 animate-spin nb-accent" />
          Analysing nutritional content…
        </div>
      )}

      {!isLoading && result && (
        <div className="nb-card rounded-xl p-5">
          <Markdown content={result} />
          <p className="nb-soft mt-4 border-t border-[var(--nb-border)] pt-3 text-xs">
            ⚠️ All values shown are estimates based on typical serving sizes. Actual
            nutrition varies with preparation method, brands, and exact quantities.
          </p>
        </div>
      )}

      {!isLoading && !result && !error && (
        <div className="nb-card flex flex-col items-center gap-3 rounded-xl py-12 text-center">
          <Flame className="h-10 w-10 nb-accent opacity-50" />
          <p className="nb-soft max-w-sm text-sm">
            Describe any meal above and NutriBot will estimate its calories, protein,
            carbohydrates, fat, fibre, and micronutrient highlights.
          </p>
        </div>
      )}
    </div>
  );
}

export default CalorieAnalyzer;
