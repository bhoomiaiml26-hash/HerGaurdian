/**
 * Today — the Wellness Studio dashboard.
 * A calm overview: today's check-in status, prominent quick actions,
 * recent patterns (only from real records), active goals, and recent
 * wellness activity. No fabricated metrics — every number is a record.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Footprints,
  Moon,
  Sparkles,
  ArrowRight,
  Flag,
} from "lucide-react";
import {
  getCheckins,
  getSleepLogs,
  getMovementLogs,
  getGoals,
  getMenstrualLogs,
} from "../../../services/wellnessService";
import {
  Card,
  LoadingBlock,
  ErrorNote,
  PrimaryButton,
  SecondaryButton,
} from "./ui";
import { formatMinutes, friendlyDate, todayISO, daysAgoISO } from "./studioUtils";

function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-[#EDE6E2] bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2 text-[#8C3737]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">
          {label}
        </span>
      </div>
      <p className="mt-2 font-serif text-xl font-bold text-[#1E1B18]">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[#78726B]">{sub}</p>}
    </div>
  );
}

export default function TodaySection({ onGoTo }) {
  const [checkins, setCheckins] = useState([]);
  const [sleepLogs, setSleepLogs] = useState([]);
  const [movement, setMovement] = useState([]);
  const [goals, setGoals] = useState([]);
  const [cycleLogs, setCycleLogs] = useState([]);
  const [weekAgo, setWeekAgo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, s, m, g, cy] = await Promise.all([
        getCheckins(14),
        getSleepLogs(7),
        getMovementLogs(14),
        getGoals(),
        getMenstrualLogs(6),
      ]);
      setCheckins(c.checkins || []);
      setSleepLogs(s.logs || []);
      setMovement(m.logs || []);
      setGoals((g.goals || []).filter((x) => x.status === "active"));
      setCycleLogs(cy.logs || []);
      setWeekAgo(daysAgoISO(7));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your wellness overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const today = todayISO();
  const todayCheckin = checkins.find((c) => c.date === today) || null;
  const latestSleep = sleepLogs[0] || null;
  const movementThisWeek = movement.filter((m) => (m.date || "") >= weekAgo).length;

  // Recent mood/energy pattern — averages of the last 7 check-ins (calculated summary)
  const recent7 = useMemo(() => [...checkins].slice(0, 7), [checkins]);
  const avgMoodLabel = useMemo(() => {
    const scores = { great: 5, good: 4, neutral: 3, low: 2, stressed: 1 };
    const labelled = recent7.filter((c) => c.mood);
    if (labelled.length === 0) return null;
    const avg = labelled.reduce((a, c) => a + (scores[c.mood] || 3), 0) / labelled.length;
    if (avg >= 4.5) return "Great";
    if (avg >= 3.5) return "Good";
    if (avg >= 2.5) return "Okay";
    if (avg >= 1.5) return "Low";
    return "Mixed";
  }, [recent7]);
  const avgEnergy = useMemo(() => {
    const withE = recent7.filter((c) => c.energy != null);
    if (withE.length === 0) return null;
    return Math.round((withE.reduce((a, c) => a + c.energy, 0) / withE.length) * 10) / 10;
  }, [recent7]);

  const lastCycleStart = cycleLogs[0]?.startDate || null;

  return (
    <div className="space-y-6">
      {/* Header + primary actions */}
      <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Personal Wellness & Self-Care Studio
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
              Your wellness today
            </h1>
            <p className="mt-1 text-sm text-[#4F4A45]">
              {todayCheckin
                ? "You've checked in today — nice. Everything below comes from your own entries."
                : "A quick check-in takes under a minute. Or try a reset if things feel like a lot."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:min-w-48">
            <PrimaryButton
              onClick={() => onGoTo?.("checkins")}
              icon={todayCheckin ? CheckCircle2 : CalendarCheck2}
            >
              {todayCheckin ? "Review today's check-in" : "Check in now"}
            </PrimaryButton>
            <SecondaryButton onClick={() => onGoTo?.("reset")} icon={Sparkles}>
              Try a quick reset
            </SecondaryButton>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Loading your overview..." />
      ) : error ? (
        <Card>
          <ErrorNote message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          {/* Stat tiles — all derived from real records */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              icon={CalendarCheck2}
              label="Check-ins"
              value={checkins.length}
              sub={checkins.length === 0 ? "Start with today" : "in the last 14 days"}
            />
            <StatTile
              icon={Moon}
              label="Last sleep"
              value={latestSleep ? formatMinutes(latestSleep.durationMinutes) : "—"}
              sub={
                latestSleep
                  ? `${friendlyDate(latestSleep.date)} · quality ${latestSleep.quality}/5`
                  : "No sleep logged yet"
              }
            />
            <StatTile
              icon={Footprints}
              label="Movement"
              value={movementThisWeek}
              sub="sessions in the last 7 days"
            />
            <StatTile
              icon={Flag}
              label="Active goals"
              value={goals.length}
              sub={goals.length === 0 ? "Set one in Goals" : goals[0].title}
            />
          </div>

          {/* Recent pattern — clearly a calculated summary */}
          <Card>
            <h2 className="font-serif text-base font-bold text-[#1E1B18]">
              Your recent pattern
            </h2>
            {checkins.length === 0 ? (
              <p className="mt-2 text-sm text-[#78726B]">
                Once you check in a few times, you'll see your recent mood and energy
                pattern here — always summarised from your own entries, never invented.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">
                    Mood (last {recent7.filter((c) => c.mood).length || 0} check-ins)
                  </p>
                  <p className="mt-1.5 font-serif text-lg font-bold text-[#1E1B18]">
                    {avgMoodLabel || "—"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#A19B93]">Calculated from your ratings</p>
                </div>
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">
                    Energy (last {recent7.filter((c) => c.energy != null).length || 0})
                  </p>
                  <p className="mt-1.5 font-serif text-lg font-bold text-[#1E1B18]">
                    {avgEnergy != null ? `${avgEnergy} / 5` : "—"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#A19B93]">Average of your entries</p>
                </div>
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">
                    Cycle
                  </p>
                  <p className="mt-1.5 font-serif text-lg font-bold text-[#1E1B18]">
                    {lastCycleStart ? friendlyDate(lastCycleStart) : "—"}
                  </p>
                  <button
                    onClick={() => onGoTo?.("cycle")}
                    className="mt-0.5 text-[11px] font-semibold text-[#8C3737] hover:underline"
                  >
                    Open journal →
                  </button>
                </div>
              </div>
            )}
            {checkins.length > 0 && (
              <button
                onClick={() => onGoTo?.("insights")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C3737] hover:underline"
              >
                Explore pattern insights <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </Card>

          {/* Active goals snapshot */}
          {goals.length > 0 && (
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-base font-bold text-[#1E1B18]">
                  Self-care goals
                </h2>
                <button
                  onClick={() => onGoTo?.("goals")}
                  className="text-xs font-semibold text-[#8C3737] hover:underline"
                >
                  Manage →
                </button>
              </div>
              <ul className="mt-3 space-y-2.5">
                {goals.slice(0, 4).map((g) => {
                  const pct = Math.min(100, Math.round(((g.currentCount || 0) / (g.targetCount || 1)) * 100));
                  return (
                    <li key={g._id} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-4 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#1E1B18]">{g.title}</span>
                        <span className="text-xs text-[#78726B]">
                          {g.currentCount || 0}/{g.targetCount}
                        </span>
                      </div>
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-[#F6EFEA]"
                        role="progressbar"
                        aria-valuenow={g.currentCount || 0}
                        aria-valuemin={0}
                        aria-valuemax={g.targetCount || 1}
                        aria-label={`${g.title} progress`}
                      >
                        <div className="h-full rounded-full bg-[#8C3737]" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {/* Explore tiles */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: "cycle", title: "Cycle journal", desc: "Record periods, symptoms, and notice your own patterns." },
              { id: "movement", title: "Movement", desc: "Short, gentle sessions you can start right away." },
              { id: "sleep", title: "Sleep & recovery", desc: "A sleep diary and an evening wind-down builder." },
              { id: "reset", title: "Reset studio", desc: "Breathing, grounding, and a private journal." },
              { id: "insights", title: "Insights", desc: "Grounded observations from your own records." },
              { id: "nutrition-ai", title: "Nutrition AI", desc: "Meals, calories, and BMI with Watsonx.ai — powered by NutriBot." },
            ].map((tile) => (
              <button
                key={tile.id}
                onClick={() => onGoTo?.(tile.id)}
                className="group rounded-xl border border-[#EDE6E2] bg-white p-4 text-left shadow-xs transition hover:border-[#8C3737]/30 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm font-bold text-[#1E1B18]">{tile.title}</h3>
                  <ArrowRight
                    className="h-4 w-4 text-[#8C3737] transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#78726B]">{tile.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
