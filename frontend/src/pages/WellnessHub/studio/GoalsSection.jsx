/**
 * Feature 7 — Personal Wellness Goals & Habits
 * Lightweight habit tracker: create goals with a self-chosen frequency, track
 * gentle progress, pause/resume, edit and delete. No guilt, no streak
 * punishment, no duplication of nutrition/career/financial goals (those live
 * in their own HerGuardian modules).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Flag,
  Pencil,
  Pause,
  Play,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import {
  getGoals,
  createGoal,
  updateGoal,
  incrementGoal,
  deleteGoal,
} from "../../../services/wellnessService";
import {
  Card,
  SectionHeader,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  PrimaryButton,
  SecondaryButton,
  InfoNote,
} from "./ui";

const CATEGORIES = [
  { id: "mindfulness", label: "Relaxation" },
  { id: "movement", label: "Movement" },
  { id: "sleep", label: "Sleep" },
  { id: "checkin", label: "Mood check-in" },
  { id: "cycle", label: "Cycle journal" },
  { id: "other", label: "Other self-care" },
];

const FREQUENCIES = [
  { id: "daily", label: "Every day", per: 7 },
  { id: "5x_week", label: "5× a week", per: 5 },
  { id: "3x_week", label: "3× a week", per: 3 },
  { id: "weekly", label: "Once a week", per: 1 },
];

const PRESETS = [
  { title: "Practice relaxation", category: "mindfulness", frequency: "3x_week" },
  { title: "Follow my wind-down routine", category: "sleep", frequency: "5x_week" },
  { title: "Record my mood", category: "checkin", frequency: "daily" },
  { title: "Take movement breaks", category: "movement", frequency: "5x_week" },
  { title: "Keep my symptom journal", category: "cycle", frequency: "weekly" },
];

function GoalForm({ existing, onSaved, onCancel }) {
  const [title, setTitle] = useState(existing?.title || "");
  const [category, setCategory] = useState(existing?.category || "mindfulness");
  const [frequency, setFrequency] = useState(existing?.frequency || "3x_week");
  const [targetCount, setTargetCount] = useState(existing?.targetCount || 3);
  const [saving, setSaving] = useState(false);

  const handleFrequency = (freqId) => {
    setFrequency(freqId);
    const per = FREQUENCIES.find((f) => f.id === freqId)?.per;
    if (per) setTargetCount(per);
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = { title: title.trim(), category, frequency, targetCount };
      if (existing?._id) await updateGoal(existing._id, payload);
      else await createGoal(payload);
      toast.success(existing?._id ? "Goal updated" : "Goal created");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save goal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-[#8C3737]/20">
      <h3 className="font-serif text-base font-bold text-[#1E1B18]">
        {existing?._id ? "Edit goal" : "New goal"}
      </h3>
      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-[#4F4A45]">What do you want to work on?</span>
          <input
            type="text"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Take a short walking break"
            className="mt-1.5 w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder:text-[#A19B93] focus:border-[#8C3737] focus:outline-none"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset>
            <legend className="text-xs font-semibold text-[#4F4A45]">Area</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <label
                  key={c.id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    category === c.id
                      ? "border-[#8C3737] bg-[#8C3737] text-white"
                      : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={category === c.id}
                    onChange={() => setCategory(c.id)}
                    className="sr-only"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-[#4F4A45]">How often?</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {FREQUENCIES.map((f) => (
                <label
                  key={f.id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    frequency === f.id
                      ? "border-[#8C3737] bg-[#F6EFEA] text-[#8C3737]"
                      : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    checked={frequency === f.id}
                    onChange={() => handleFrequency(f.id)}
                    className="sr-only"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap gap-3">
          <PrimaryButton disabled={saving || !title.trim()} onClick={save}>
            {saving ? "Saving..." : existing?._id ? "Update goal" : "Create goal"}
          </PrimaryButton>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        </div>
      </div>
    </Card>
  );
}

function GoalCard({ goal, onChanged }) {
  const pct = Math.min(100, Math.round(((goal.currentCount || 0) / (goal.targetCount || 1)) * 100));
  const catLabel = CATEGORIES.find((c) => c.id === goal.category)?.label || goal.category;
  const freqLabel = FREQUENCIES.find((f) => f.id === goal.frequency)?.label || goal.frequency;
  const paused = goal.status === "paused";
  const completed = goal.status === "completed";

  return (
    <Card className={paused ? "opacity-70" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F6EFEA] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8C3737]">
              {catLabel}
            </span>
            <span className="text-[11px] text-[#78726B]">{freqLabel}</span>
            {paused && (
              <span className="text-[11px] font-semibold text-[#A85C12]">Paused</span>
            )}
            {completed && (
              <span className="text-[11px] font-semibold text-[#286646]">Completed 🎉</span>
            )}
          </div>
          <h3 className="mt-1.5 font-serif text-base font-bold text-[#1E1B18]">{goal.title}</h3>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={() => onChanged({ edit: goal })}
            aria-label={`Edit ${goal.title}`}
            className="rounded-lg border border-[#EDE6E2] p-2 text-[#4F4A45] hover:bg-[#F6EFEA]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={async () => {
              await updateGoal(goal._id, { status: paused ? "active" : "paused" });
              toast.success(paused ? "Goal resumed" : "Goal paused — no pressure");
              onChanged({});
            }}
            aria-label={paused ? `Resume ${goal.title}` : `Pause ${goal.title}`}
            className="rounded-lg border border-[#EDE6E2] p-2 text-[#4F4A45] hover:bg-[#F6EFEA]"
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={async () => {
              await deleteGoal(goal._id);
              toast.success("Goal deleted");
              onChanged({});
            }}
            aria-label={`Delete ${goal.title}`}
            className="rounded-lg border border-[#EDE6E2] p-2 text-[#BA2626] hover:bg-[#FDF2F2]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-[#78726B]">
          <span>
            {goal.currentCount || 0} of {goal.targetCount} this period
          </span>
          <span>{pct}%</span>
        </div>
        <div
          className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#F6EFEA]"
          role="progressbar"
          aria-valuenow={goal.currentCount || 0}
          aria-valuemin={0}
          aria-valuemax={goal.targetCount || 1}
          aria-label={`${goal.title} progress`}
        >
          <div
            className="h-full rounded-full bg-[#8C3737] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {!paused && (
        <div className="mt-4 flex flex-wrap gap-3">
          <PrimaryButton
            icon={Target}
            disabled={completed}
            onClick={async () => {
              await incrementGoal(goal._id);
              onChanged({});
            }}
          >
            {completed ? "Target reached" : "Done for today"}
          </PrimaryButton>
          <SecondaryButton
            onClick={async () => {
              await updateGoal(goal._id, { currentCount: 0, status: "active" });
              toast.success("Progress reset — fresh start");
              onChanged({});
            }}
          >
            Reset progress
          </SecondaryButton>
        </div>
      )}
    </Card>
  );
}

export default function GoalsSection() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null); // null | 'new' | {edit: goal}

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getGoals();
      setGoals(data.goals || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load goals.");
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

  const active = useMemo(() => goals.filter((g) => g.status !== "completed"), [goals]);
  const completed = useMemo(() => goals.filter((g) => g.status === "completed"), [goals]);

  const showPresets = goals.length === 0 && mode === null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Goals & Habits"
        subtitle="Small, self-chosen goals with gentle progress — missed days never count against you."
        action={
          mode === null && (
            <PrimaryButton onClick={() => setMode("new")} icon={Plus}>
              New goal
            </PrimaryButton>
          )
        }
      />

      {mode === "new" && (
        <GoalForm onSaved={() => { setMode(null); void load(); }} onCancel={() => setMode(null)} />
      )}
      {mode && mode !== "new" && mode.edit && (
        <GoalForm
          existing={mode.edit}
          onSaved={() => { setMode(null); void load(); }}
          onCancel={() => setMode(null)}
        />
      )}

      {loading ? (
        <LoadingBlock label="Loading your goals..." />
      ) : error ? (
        <Card>
          <ErrorNote message={error} onRetry={load} />
        </Card>
      ) : goals.length === 0 ? (
        <>
          <EmptyState
            icon={Flag}
            title="No goals yet"
            message="Pick one small thing you'd like to do more often. You can change or pause it whenever life gets busy."
          />
          {showPresets && (
            <Card>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">
                Quick starts
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.title}
                    onClick={async () => {
                      try {
                        await createGoal({
                          title: p.title,
                          category: p.category,
                          frequency: p.frequency,
                          targetCount: FREQUENCIES.find((f) => f.id === p.frequency)?.per || 3,
                        });
                        toast.success("Goal created");
                        await load();
                      } catch (err) {
                        toast.error(err.response?.data?.message || "Could not create goal");
                      }
                    }}
                    className="flex items-center justify-between rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-4 py-3 text-left transition hover:border-[#8C3737]/30 hover:bg-[#F6EFEA]"
                  >
                    <span className="text-sm font-semibold text-[#1E1B18]">{p.title}</span>
                    <Plus className="h-4 w-4 shrink-0 text-[#8C3737]" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map((goal) => (
              <GoalCard key={goal._id} goal={goal} onChanged={load} />
            ))}
          </div>

          {completed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">
                Completed
              </h3>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                {completed.map((goal) => (
                  <GoalCard key={goal._id} goal={goal} onChanged={load} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <InfoNote>
        These goals are only about your own wellbeing routines. Nutrition goals live in
        Nutrition AI, and career or money goals live in their own HerGuardian modules —
        nothing is duplicated here. Reminders for goals can be turned off any time from
        the Reminders page.
      </InfoNote>
    </div>
  );
}
