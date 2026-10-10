import { useEffect, useState } from "react";
import {
  MessageSquare,
  CalendarDays,
  Flame,
  Calculator,
  Salad,
  Users,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import NutritionChat from "./NutritionChat";
import MealPlan from "./MealPlan";
import CalorieAnalyzer from "./CalorieAnalyzer";
import BmiCalculator from "./BmiCalculator";
import QuickMealSuggestions from "./QuickMealSuggestions";
import FamilyMealPlanner from "./FamilyMealPlanner";
import { getNutritionHealth } from "../../services/nutritionService";
import "./nutritionTheme.css";

const FEATURES = [
  {
    id: "chat",
    label: "Nutrition AI Chat",
    icon: MessageSquare,
    title: "AI Nutrition Chat",
    description:
      "Ask anything about food, nutrients, balanced meals, vegetarian nutrition, Indian cuisine, and healthy eating — with follow-up context.",
    element: NutritionChat,
  },
  {
    id: "meal-plan",
    label: "7-Day Meal Plan",
    icon: CalendarDays,
    title: "Personalized 7-Day Meal Plan",
    description:
      "A full week of meals built around your diet, allergies, goals, budget, and available ingredients — with portion guidance and variety.",
    element: MealPlan,
  },
  {
    id: "calorie-analyzer",
    label: "Calorie Analyzer",
    icon: Flame,
    title: "Calorie & Macronutrient Analyzer",
    description:
      "Enter any food or meal with ingredients and quantities to get estimated calories, protein, carbs, fat, fibre, and a quick profile.",
    element: CalorieAnalyzer,
  },
  {
    id: "bmi",
    label: "BMI Calculator",
    icon: Calculator,
    title: "BMI Calculator",
    description:
      "Validate your measurements, calculate BMI, see your healthy weight range, and get personalised AI guidance.",
    element: BmiCalculator,
  },
  {
    id: "quick-meals",
    label: "Quick Meal Suggestions",
    icon: Salad,
    title: "Quick Meal Suggestions",
    description:
      "Three tailored meal ideas for any occasion, based on your goals, ingredients, budget, and dietary restrictions.",
    element: QuickMealSuggestions,
  },
  {
    id: "family-plan",
    label: "Family Meal Planner",
    icon: Users,
    title: "Family Meal Planner",
    description:
      "Plan meals for the whole family — each member's diet, allergies, and health notes are respected individually.",
    element: FamilyMealPlanner,
  },
];

const THEME_KEY = "nutribot-theme";

function NutritionAI() {
  const [activeFeature, setActiveFeature] = useState("chat");
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "light"
  );
  const [serviceStatus, setServiceStatus] = useState("checking"); // checking | ok | unconfigured | offline

  useEffect(() => {
    let cancelled = false;
    getNutritionHealth()
      .then((data) => {
        if (cancelled) return;
        setServiceStatus(data.watsonx_configured ? "ok" : "unconfigured");
      })
      .catch(() => {
        if (!cancelled) setServiceStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  const statusInfo = {
    checking: { icon: Wifi, text: "Checking AI service…", cls: "nb-soft" },
    ok: { icon: Wifi, text: "Watsonx.ai connected", cls: "text-[#286646]" },
    unconfigured: {
      icon: WifiOff,
      text: "Watsonx.ai not configured — check service .env",
      cls: "text-[#a85c12]",
    },
    offline: {
      icon: WifiOff,
      text: "Nutrition service offline — start it to chat",
      cls: "text-[#ba2626]",
    },
  }[serviceStatus];
  const StatusIcon = statusInfo.icon;

  const ActiveView =
    FEATURES.find((f) => f.id === activeFeature)?.element ?? NutritionChat;
  const activeMeta = FEATURES.find((f) => f.id === activeFeature);

  return (
    <div data-nb-theme={theme} className="-m-6 overflow-hidden rounded-xl sm:-m-8">
      {/* ── Landing header ─────────────────────────────────────────────── */}
      <div className="nb-card border-x-0 border-t-0 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="nb-badge mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by IBM Watsonx.ai · IBM Granite
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              Personalized Nutrition &amp; Meal Planning
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed sm:text-sm nb-muted">
              Your complete AI nutrition companion — chat with NutriBot, build a
              7-day meal plan, analyse calories, check BMI, get quick meal ideas,
              and plan for the whole family. Indian cuisine specialist &amp; global diets.
            </p>
            <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${statusInfo.cls}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.text}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="nb-btn nb-btn-outline shrink-0 cursor-pointer self-start"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>

        {/* Feature cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => setActiveFeature(feature.id)}
                className="nb-card cursor-pointer rounded-xl p-4 text-left transition hover:-translate-y-0.5"
                style={
                  isActive
                    ? { borderColor: "var(--nb-primary)", boxShadow: "0 0 0 1px var(--nb-primary)" }
                    : undefined
                }
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg nb-badge">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold">{feature.title}</h3>
                <p className="nb-soft mt-1 text-xs leading-relaxed">{feature.description}</p>
                <span className="mt-2 inline-block text-xs font-semibold nb-accent">
                  Open →
                </span>
              </button>
            );
          })}
        </div>

        <p className="nb-alert-info mt-5 flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 nb-accent" />
          <span>
            NutriBot offers general nutrition education and practical meal
            suggestions — it is not a substitute for a qualified healthcare
            professional. All calorie and nutrient values are clearly labelled
            estimates. For pregnancy, eating disorders, serious medical conditions,
            or medically prescribed diets, please consult an appropriately
            qualified healthcare professional.
          </span>
        </p>
      </div>

      {/* ── Feature tabs ───────────────────────────────────────────────── */}
      <div className="border-b border-[var(--nb-border)] bg-[var(--nb-surface-2)] px-6 py-3 sm:px-8">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => setActiveFeature(feature.id)}
                className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[var(--nb-primary)] text-[var(--nb-on-primary)] shadow-xs"
                    : "text-[var(--nb-text-muted)] hover:bg-[var(--nb-surface)]"
                }`}
                aria-pressed={isActive}
              >
                <Icon className="h-3.5 w-3.5" />
                {feature.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active feature ─────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8">
        <div className="mb-5">
          <h3 className="font-serif text-xl font-bold tracking-tight">
            {activeMeta?.title}
          </h3>
          <p className="mt-1 text-xs nb-muted sm:text-sm">
            {activeMeta?.description}
          </p>
        </div>
        <ActiveView />
      </div>
    </div>
  );
}

export default NutritionAI;
