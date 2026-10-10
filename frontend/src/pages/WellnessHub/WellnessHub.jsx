/**
 * Wellness Hub — Personal Wellness & Self-Care Studio
 * Shell for the studio sections. Section state lives in the URL (?section=)
 * so deep links and back/forward work. Legacy ?tab= values from the old
 * information-first layout are mapped to the closest new section.
 *
 * Nutrition AI (NutriBot) is preserved exactly as integrated.
 */
import { Suspense, lazy, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  Flag,
  Footprints,
  Lightbulb,
  Moon,
  Salad,
  Sparkles,
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const TodaySection = lazy(() => import("./studio/TodaySection"));
const CheckinsSection = lazy(() => import("./studio/CheckinsSection"));
const ResetSection = lazy(() => import("./studio/ResetSection"));
const CycleSection = lazy(() => import("./studio/CycleSection"));
const MovementSection = lazy(() => import("./studio/MovementSection"));
const SleepSection = lazy(() => import("./studio/SleepSection"));
const InsightsSection = lazy(() => import("./studio/InsightsSection"));
const GoalsSection = lazy(() => import("./studio/GoalsSection"));
const NutritionAI = lazy(() => import("./NutritionAI"));

const SECTIONS = [
  { id: "today", label: "Today", icon: CalendarCheck2 },
  { id: "checkins", label: "Check-ins", icon: ClipboardList },
  { id: "reset", label: "Reset Studio", icon: Sparkles },
  { id: "cycle", label: "Cycle Journal", icon: CalendarDays },
  { id: "movement", label: "Movement", icon: Footprints },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "goals", label: "Goals", icon: Flag },
  { id: "nutrition-ai", label: "Nutrition AI", icon: Salad },
];

// Old tab ids → new sections (deep links and redirects keep working)
const LEGACY_TAB_MAP = {
  overview: "today",
  "women-health": "today",
  menstrual: "cycle",
  nutrition: "today",
  fitness: "movement",
  mental: "reset",
};

function SectionFallback() {
  return (
    <div className="rounded-xl border border-[#EDE6E2] bg-white p-10 shadow-xs">
      <LoadingSpinner label="Loading section..." />
    </div>
  );
}

function WellnessHub() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection = useMemo(() => {
    const raw = searchParams.get("section") || searchParams.get("tab");
    if (!raw) return "today";
    if (SECTIONS.find((s) => s.id === raw)) return raw;
    if (LEGACY_TAB_MAP[raw]) return LEGACY_TAB_MAP[raw];
    return "today";
  }, [searchParams]);

  const goTo = (sectionId) => {
    if (sectionId === "breathing" || sectionId === "grounding" || sectionId === "journal") {
      // Quick-reset targets inside the Reset Studio
      setSearchParams({ section: "reset" });
      // Scroll after the lazy section mounts
      window.setTimeout(() => {
        document.getElementById(`${sectionId}-anchor`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
      return;
    }
    if (sectionId === "movement") {
      setSearchParams({ section: "movement" });
      return;
    }
    setSearchParams({ section: sectionId });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "checkins":
        return <CheckinsSection />;
      case "reset":
        return <ResetSection onGoTo={goTo} />;
      case "cycle":
        return <CycleSection />;
      case "movement":
        return <MovementSection />;
      case "sleep":
        return <SleepSection />;
      case "insights":
        return <InsightsSection />;
      case "goals":
        return <GoalsSection />;
      case "nutrition-ai":
        return <NutritionAI />;
      case "today":
      default:
        return <TodaySection onGoTo={goTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18]">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Section navigation */}
        <nav
          aria-label="Wellness Studio sections"
          className="rounded-xl border border-[#EDE6E2] bg-white p-2 shadow-xs"
        >
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0" role="tablist">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => goTo(section.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#8C3737] text-white shadow-xs"
                      : "text-[#4F4A45] hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-white" : "text-[#78726B]"}`}
                    aria-hidden="true"
                  />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Section content */}
        <Suspense fallback={<SectionFallback />}>{renderSection()}</Suspense>
      </div>
    </div>
  );
}

export default WellnessHub;
