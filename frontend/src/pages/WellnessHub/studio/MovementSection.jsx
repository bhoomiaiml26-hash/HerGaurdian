/**
 * Feature 4 — Movement & Energy Planner
 * A gentle movement habit tracker: pick a short activity, follow its
 * instructions, mark it complete, optionally rate effort, review sessions,
 * and manage one personal movement goal.
 *
 * Deliberately NO calories burned, weight-loss, body measurements, or
 * shape targets — this module is about comfortable movement only.
 * No device integration is claimed; sessions are only what the user logs.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  CheckCircle2,
  Clock,
  Play,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import {
  getMovementLogs,
  createMovementLog,
  deleteMovementLog,
  getGoals,
  createGoal,
  updateGoal,
  incrementGoal,
  deleteGoal,
} from "../../../services/wellnessService";
import {
  Card,
  SectionHeader,
  LoadingBlock,
  ErrorNote,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  InfoNote,
  VideoStrip,
} from "./ui";
import { friendlyDate, todayISO, daysAgoISO } from "./studioUtils";
import { MOVEMENT_VIDEOS } from "./studioVideos";

// ── Activity library (gentle, accessible; uses existing exercise guidance) ──

const ACTIVITIES = [
  {
    id: "stretch",
    title: "Gentle full-body stretch",
    category: "stretching",
    minutes: 8,
    comfort: "any",
    description: "Slow, easy stretches you can do beside your desk or bed.",
    steps: [
      "Reach both arms overhead and breathe normally for 10 seconds.",
      "Fold forward gently — knees soft, let your head hang.",
      "Roll your shoulders back five times, then forward five times.",
      "Tilt your head ear-to-shoulder, 15 seconds each side.",
      "Twist gently left and right, letting your arms swing.",
      "Shake out your hands and finish with two slow breaths.",
    ],
    precautions: "Never push into pain. Skip any move that feels wrong.",
  },
  {
    id: "deskbreak",
    title: "Desk / study break",
    category: "desk-break",
    minutes: 5,
    comfort: "any",
    description: "A quick reset for long sitting sessions.",
    steps: [
      "Stand up and walk in place for 1 minute.",
      "Roll your ankles 10 times each direction.",
      "Open your chest: hands behind you, gentle stretch for 15 seconds.",
      "Look at something far away for 30 seconds to rest your eyes.",
      "Do 5 slow shoulder shrugs — up, hold, release.",
      "Sit back down and take one slow breath before resuming.",
    ],
    precautions: "Stand slowly if you feel lightheaded.",
  },
  {
    id: "walk",
    title: "Walking session",
    category: "walking",
    minutes: 15,
    comfort: "any",
    description: "An easy walk, indoors or outdoors, at a pace you can hold a conversation at.",
    steps: [
      "Start at a comfortable pace for 2 minutes.",
      "Settle into a rhythm where you could still chat easily.",
      "Notice your posture — tall but relaxed.",
      "Walk for your chosen time; turn back when half the time is done.",
      "Finish with 1 minute of slow walking and a few calf stretches.",
    ],
    precautions: "Wear supportive shoes. Choose well-lit, safe routes.",
  },
  {
    id: "mobility",
    title: "Basic mobility routine",
    category: "mobility",
    minutes: 10,
    comfort: "some",
    description: "Joint-by-joint movements to stay loose and comfortable.",
    steps: [
      "Neck: slow half-circles, 5 each direction (no full circles).",
      "Shoulders: 10 big arm circles each direction.",
      "Hips: hands on hips, 10 circles each direction.",
      "Knees: gentle mini-squats holding a chair, 8 reps.",
      "Ankles: rise onto toes and lower, 10 reps.",
      "Finish with 3 slow breaths.",
    ],
    precautions: "Use a chair for balance if needed. Skip anything that hurts.",
  },
  {
    id: "relax",
    title: "Relaxation movement",
    category: "yoga",
    minutes: 7,
    comfort: "any",
    description: "Slow, floor-based movement to wind down.",
    steps: [
      "Lie on your back, knees bent. Breathe normally for 30 seconds.",
      "Hug one knee to your chest, 20 seconds each side.",
      "Gentle knee roll side to side, 8 times.",
      "Child's pose or a comfortable stretch for 30 seconds.",
      "Corpse rest: flat on your back, 1 minute of quiet breathing.",
    ],
    precautions: "Use a mat or carpet. Stop if anything feels strained.",
  },
];

const COMFORT_FILTERS = [
  { id: "all", label: "Show all" },
  { id: "any", label: "Very gentle" },
  { id: "some", label: "Includes a little effort" },
];

const EFFORTS = [
  { id: "gentle", label: "Gentle" },
  { id: "moderate", label: "Moderate" },
  { id: "invigorating", label: "Invigorating" },
];

// ── Active session view ─────────────────────────────────────────────────────

function ActivitySession({ activity, onComplete, onExit }) {
  const [step, setStep] = useState(0);
  const [effort, setEffort] = useState("gentle");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  if (done) {
    return (
      <Card className="border-[#286646]/30">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-[#286646]" aria-hidden="true" />
          <div>
            <h3 className="font-serif text-base font-bold text-[#1E1B18]">Session complete</h3>
            <p className="text-xs text-[#78726B]">
              Logged {activity.title} · {activity.minutes} min
            </p>
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-semibold text-[#4F4A45]">
            How did it feel? <span className="font-normal text-[#A19B93]">(optional)</span>
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {EFFORTS.map((e) => (
              <label
                key={e.id}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  effort === e.id
                    ? "border-[#8C3737] bg-[#F6EFEA] text-[#8C3737]"
                    : "border-[#EDE6E2] bg-white text-[#78726B] hover:bg-[#F6EFEA]"
                }`}
              >
                <input
                  type="radio"
                  name="effort"
                  checked={effort === e.id}
                  onChange={() => setEffort(e.id)}
                  className="sr-only"
                />
                {e.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex gap-3">
          <PrimaryButton
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onComplete(effort);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : "Save to my log"}
          </PrimaryButton>
          <SecondaryButton onClick={onExit}>Discard</SecondaryButton>
        </div>
      </Card>
    );
  }

  const isLast = step >= activity.steps.length - 1;

  return (
    <Card className="border-[#8C3737]/25">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C3737]">
            In session
          </p>
          <h3 className="font-serif text-lg font-bold text-[#1E1B18]">{activity.title}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#78726B]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            About {activity.minutes} minutes
          </p>
        </div>
        <button
          onClick={onExit}
          className="rounded-lg border border-[#EDE6E2] px-3 py-1.5 text-xs font-semibold text-[#78726B] hover:bg-[#F6EFEA]"
        >
          Exit
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C3737]">
          Step {step + 1} of {activity.steps.length}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#1E1B18]">{activity.steps[step]}</p>
      </div>

      <p className="mt-3 text-xs text-[#A85C12]">{activity.precautions}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        {step > 0 && <SecondaryButton onClick={() => setStep((s) => s - 1)}>Back</SecondaryButton>}
        {!isLast ? (
          <PrimaryButton onClick={() => setStep((s) => s + 1)}>Next step</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setDone(true)} icon={CheckCircle2}>
            Mark as complete
          </PrimaryButton>
        )}
      </div>
    </Card>
  );
}

// ── Movement goal ───────────────────────────────────────────────────────────

const FREQUENCIES = [
  { id: "daily", label: "Every day", per: 7 },
  { id: "5x_week", label: "5× a week", per: 5 },
  { id: "3x_week", label: "3× a week", per: 3 },
  { id: "weekly", label: "Once a week", per: 1 },
];

function MovementGoal({ goal, onSaved }) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("3x_week");
  const [sessionMinutes, setSessionMinutes] = useState(15);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category: "movement",
        frequency,
        targetCount: FREQUENCIES.find((f) => f.id === frequency)?.per || 3,
        notes: sessionMinutes ? `Preferred session: ${sessionMinutes} min` : "",
      };
      if (goal) await updateGoal(goal._id, payload);
      else await createGoal(payload);
      toast.success(goal ? "Goal updated" : "Goal created");
      setCreating(false);
      setTitle("");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save goal");
    } finally {
      setSaving(false);
    }
  };

  if (!goal && !creating) {
    return (
      <Card>
        <h3 className="font-serif text-base font-bold text-[#1E1B18]">Movement goal</h3>
        <p className="mt-1 text-xs text-[#78726B]">
          Set a small, manageable goal — like a short walking break a few times a week.
        </p>
        <div className="mt-3">
          <PrimaryButton onClick={() => setCreating(true)} icon={Plus}>
            Create a movement goal
          </PrimaryButton>
        </div>
      </Card>
    );
  }

  if (!creating && goal) {
    const per = FREQUENCIES.find((f) => f.id === goal.frequency)?.per || goal.targetCount || 1;
    const pct = Math.min(100, Math.round(((goal.currentCount || 0) / (goal.targetCount || per)) * 100));
    const freqLabel = FREQUENCIES.find((f) => f.id === goal.frequency)?.label || goal.frequency;

    return (
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[#1E1B18]">{goal.title}</h3>
            <p className="mt-0.5 text-xs text-[#78726B]">
              {freqLabel}
              {goal.notes ? ` · ${goal.notes}` : ""}
              {goal.status === "paused" && " · paused"}
              {goal.status === "completed" && " · completed"}
            </p>
          </div>
          <div className="flex gap-2">
            <SecondaryButton
              className="min-h-9 px-3 py-1.5 text-xs"
              onClick={() => {
                setCreating(true);
                setTitle(goal.title);
                setFrequency(goal.frequency);
                const m = goal.notes?.match(/(\d+)\s*min/);
                if (m) setSessionMinutes(Number(m[1]));
              }}
            >
              Edit
            </SecondaryButton>
            <DangerButton
              onClick={async () => {
                await deleteGoal(goal._id);
                toast.success("Goal removed");
                onSaved();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
            </DangerButton>
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
            aria-label="Goal progress"
          >
            <div className="h-full rounded-full bg-[#8C3737] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <PrimaryButton
            icon={CheckCircle2}
            onClick={async () => {
              await incrementGoal(goal._id);
              onSaved();
            }}
          >
            I did this
          </PrimaryButton>
          <SecondaryButton
            onClick={async () => {
              await updateGoal(goal._id, {
                status: goal.status === "paused" ? "active" : "paused",
              });
              onSaved();
            }}
          >
            {goal.status === "paused" ? "Resume goal" : "Pause goal"}
          </SecondaryButton>
          <SecondaryButton
            onClick={async () => {
              await updateGoal(goal._id, { currentCount: 0, status: "active" });
              toast.success("Progress reset");
              onSaved();
            }}
          >
            Reset progress
          </SecondaryButton>
        </div>

        <p className="mt-3 text-[11px] text-[#A19B93]">
          Progress is gentle by design — missing a day never counts against you.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-serif text-base font-bold text-[#1E1B18]">
        {goal ? "Edit movement goal" : "New movement goal"}
      </h3>
      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-[#4F4A45]">What will you do?</span>
          <input
            type="text"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Take a short walking break"
            className="mt-1.5 w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder:text-[#A19B93] focus:border-[#8C3737] focus:outline-none"
          />
        </label>

        <fieldset>
          <legend className="text-xs font-semibold text-[#4F4A45]">How often?</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {FREQUENCIES.map((f) => (
              <label
                key={f.id}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  frequency === f.id
                    ? "border-[#8C3737] bg-[#8C3737] text-white"
                    : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
                }`}
              >
                <input
                  type="radio"
                  name="freq"
                  checked={frequency === f.id}
                  onChange={() => setFrequency(f.id)}
                  className="sr-only"
                />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-xs font-semibold text-[#4F4A45]">
            Preferred session length: {sessionMinutes} minutes
          </span>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={sessionMinutes}
            onChange={(e) => setSessionMinutes(Number(e.target.value))}
            className="mt-2 w-full accent-[#8C3737]"
          />
        </label>

        <div className="flex gap-3">
          <PrimaryButton disabled={saving || !title.trim()} onClick={save}>
            {saving ? "Saving..." : "Save goal"}
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              setCreating(false);
              setTitle("");
            }}
          >
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </Card>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export default function MovementSection() {
  const [logs, setLogs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comfort, setComfort] = useState("all");
  const [active, setActive] = useState(null);
  const [weekAgo, setWeekAgo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [logData, goalData] = await Promise.all([getMovementLogs(40), getGoals()]);
      setLogs(logData.logs || []);
      setGoals((goalData.goals || []).filter((g) => g.category === "movement" && g.status !== "completed"));
      setWeekAgo(daysAgoISO(7));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load movement data.");
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

  const visible = useMemo(
    () => (comfort === "all" ? ACTIVITIES : ACTIVITIES.filter((a) => a.comfort === comfort)),
    [comfort]
  );

  const handleComplete = async (effort) => {
    try {
      await createMovementLog({
        title: active.title,
        category: active.category,
        durationMinutes: active.minutes,
        effort,
        date: todayISO(),
      });
      toast.success("Session saved");
      setActive(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save session");
    }
  };

  const movementGoal = goals[0] || null;
  const recentCount = useMemo(
    () => logs.filter((l) => (l.date || "") >= weekAgo).length,
    [logs, weekAgo]
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Movement & Energy Planner"
        subtitle="Short, comfortable movement sessions you can start right away — no equipment, no pressure."
        action={
          <div className="rounded-lg border border-[#EDE6E2] bg-[#F6EFEA] px-3.5 py-2 text-xs font-semibold text-[#8C3737]">
            {recentCount} session{recentCount === 1 ? "" : "s"} in the last 7 days
          </div>
        }
      />

      {loading ? (
        <LoadingBlock label="Loading movement data..." />
      ) : error ? (
        <Card>
          <ErrorNote message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          {active ? (
            <ActivitySession activity={active} onComplete={handleComplete} onExit={() => setActive(null)} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#4F4A45]">Comfort level:</span>
                {COMFORT_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setComfort(f.id)}
                    aria-pressed={comfort === f.id}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      comfort === f.id
                        ? "border-[#8C3737] bg-[#8C3737] text-white"
                        : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((a) => (
                  <Card key={a.id} className="flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-base font-bold text-[#1E1B18]">{a.title}</h3>
                      <span className="shrink-0 rounded-full bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                        {a.minutes} min
                      </span>
                    </div>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[#78726B]">
                      {a.description}
                    </p>
                    <div className="mt-3">
                      <PrimaryButton onClick={() => setActive(a)} icon={Play} className="w-full">
                        Start activity
                      </PrimaryButton>
                    </div>
                  </Card>
                ))}
              </div>

              <VideoStrip videos={MOVEMENT_VIDEOS} title="Follow-along videos" />

              <MovementGoal goal={movementGoal} onSaved={load} />

              <Card>
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
                  <Activity className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
                  Completed sessions
                </h3>
                {logs.length === 0 ? (
                  <p className="mt-2 text-xs text-[#A19B93]">
                    Sessions you complete will be listed here.
                  </p>
                ) : (
                  <ul className="mt-3 max-h-80 divide-y divide-[#EDE6E2] overflow-y-auto">
                    {logs.map((log) => (
                      <li key={log._id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1E1B18]">{log.title}</p>
                          <p className="text-xs text-[#78726B]">
                            {friendlyDate(log.date)} · {log.durationMinutes} min
                            {log.effort ? ` · ${log.effort}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            await deleteMovementLog(log._id);
                            toast.success("Session removed");
                            await load();
                          }}
                          aria-label={`Delete ${log.title} session`}
                          className="shrink-0 rounded-lg border border-[#EDE6E2] p-2 text-[#BA2626] hover:bg-[#FDF2F2]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <InfoNote icon={Info}>
                Sessions are only recorded when you log them — this app does not track
                your movement automatically. No calorie or weight targets here: this
                space is about feeling comfortable in your body.
              </InfoNote>
            </>
          )}
        </>
      )}
    </div>
  );
}
