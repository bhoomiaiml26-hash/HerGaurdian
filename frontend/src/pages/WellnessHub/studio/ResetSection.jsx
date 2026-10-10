/**
 * Feature 2 — Mood & Stress Reset Studio
 * Guided breathing (timer, pause/resume/stop, gentle patterns), step-by-step
 * grounding, private journaling with optional AI reflection (consent-gated),
 * and a one-tap Quick Reset chooser.
 *
 * No diagnosis, no medical claims, stop-anytime controls throughout.
 */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BookOpen,
  CircleDot,
  Wind,
  Footprints,
  Sparkles,
  Pencil,
  Trash2,
  Play,
  Pause,
  Square,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  reflectOnEntry,
} from "../../../services/wellnessService";
import {
  Card,
  SectionHeader,
  ErrorNote,
  PrimaryButton,
  SecondaryButton,
  InfoNote,
  VideoStrip,
} from "./ui";
import { friendlyDate } from "./studioUtils";
import { RESET_VIDEOS } from "./studioVideos";

// ── Guided breathing ─────────────────────────────────────────────────────────

const BREATH_PATTERNS = [
  { id: "calm", label: "Easy breathing", steps: [["Breathe in", 4], ["Breathe out", 6]], hint: "A slow, comfortable out-breath." },
  { id: "box", label: "Box breathing", steps: [["Breathe in", 4], ["Hold", 4], ["Breathe out", 4], ["Hold", 4]], hint: "Steady 4-4-4-4 rhythm. Skip the holds if uncomfortable." },
  { id: "long", label: "Long exhale", steps: [["Breathe in", 4], ["Breathe out", 8]], hint: "A longer out-breath can feel calming." },
];

const DURATIONS = [1, 3, 5];

function BreathingTool() {
  const [patternId, setPatternId] = useState("calm");
  const [minutes, setMinutes] = useState(3);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(minutes * 60);
  const [phase, setPhase] = useState({ label: "Ready", count: 0 });
  const [cycle, setCycle] = useState(0);

  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) || BREATH_PATTERNS[0];

  // Reset display when settings change (only while not running)
  const changeMinutes = (m) => {
    setMinutes(m);
    if (!running) {
      setRemaining(m * 60);
      setFinished(false);
      setPhase({ label: "Ready", count: 0 });
      setCycle(0);
    }
  };
  const changePattern = (id) => {
    setPatternId(id);
    if (!running) {
      setRemaining(minutes * 60);
      setFinished(false);
      setPhase({ label: "Ready", count: 0 });
      setCycle(0);
    }
  };

  useEffect(() => {
    if (!running) return undefined;
    let endAt = Date.now() + remaining * 1000;
    let stepIndex = 0;
    let stepEnd = Date.now() + pattern.steps[0][1] * 1000;

    const tick = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.round((endAt - now) / 1000));
      setRemaining(left);

      if (now >= stepEnd) {
        stepIndex = (stepIndex + 1) % pattern.steps.length;
        if (stepIndex === 0) setCycle((c) => c + 1);
        const [label, secs] = pattern.steps[stepIndex];
        stepEnd = now + secs * 1000;
        setPhase({ label, count: secs });
      }

      if (left <= 0) {
        setRunning(false);
        setFinished(true);
        setPhase({ label: "Complete", count: 0 });
      }
    }, 250);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, minutes, patternId]);

  const start = () => {
    setFinished(false);
    setRemaining(minutes * 60);
    setPhase({ label: pattern.steps[0][0], count: pattern.steps[0][1] });
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    setRemaining(minutes * 60);
    setPhase({ label: "Ready", count: 0 });
    setCycle(0);
  };

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <Card>
      <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
        <Wind className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
        Guided breathing
      </h3>

      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Breathing pattern">
        {BREATH_PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => changePattern(p.id)}
            aria-pressed={patternId === p.id}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              patternId === p.id
                ? "border-[#8C3737] bg-[#8C3737] text-white"
                : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#78726B]">{pattern.hint}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[#4F4A45]">Session length:</span>
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => changeMinutes(d)}
            aria-pressed={minutes === d}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              minutes === d
                ? "border-[#8C3737] bg-[#F6EFEA] text-[#8C3737]"
                : "border-[#EDE6E2] bg-white text-[#78726B] hover:bg-[#F6EFEA]"
            }`}
          >
            {d} min
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div
        className={`mx-auto mt-5 flex h-44 w-44 flex-col items-center justify-center rounded-full border-2 transition-colors ${
          running ? "border-[#8C3737] bg-[#F6EFEA]" : "border-[#EDE6E2] bg-[#FBF9F7]"
        }`}
        role="timer"
        aria-live="polite"
        aria-label={`${phase.label}, ${mm} minutes ${ss} seconds remaining`}
      >
        <span className="font-serif text-3xl font-bold text-[#1E1B18]">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </span>
        <span className="mt-1 text-sm font-semibold text-[#8C3737]">{phase.label}</span>
        {running && phase.count > 0 && (
          <span className="text-xs text-[#78726B]">{phase.count}s</span>
        )}
        {finished && <span className="text-xs text-[#286646]">Nicely done.</span>}
        {!running && !finished && cycle > 0 && (
          <span className="text-xs text-[#78726B]">Paused</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {!running && !finished && (
          <PrimaryButton onClick={start} icon={Play}>
            Start
          </PrimaryButton>
        )}
        {running && (
          <SecondaryButton onClick={() => setRunning(false)} icon={Pause}>
            Pause
          </SecondaryButton>
        )}
        {!running && finished && (
          <PrimaryButton onClick={start} icon={RefreshCcw}>
            Go again
          </PrimaryButton>
        )}
        {(running || cycle > 0) && (
          <SecondaryButton onClick={stop} icon={Square}>
            Stop
          </SecondaryButton>
        )}
      </div>

      <InfoNote>
        Breathe at your own pace — stop whenever you like. If a hold feels like too
        much, switch to “Easy breathing”. This is a relaxation exercise, not a
        treatment for any condition.
      </InfoNote>
    </Card>
  );
}

// ── Grounding exercises ──────────────────────────────────────────────────────

const GROUNDING_EXERCISES = [
  {
    id: "54321",
    title: "5-4-3-2-1 senses",
    intro: "Look around and name things you can notice right now.",
    steps: [
      "Name 5 things you can see.",
      "Name 4 things you can feel (feet on floor, fabric, air).",
      "Name 3 things you can hear.",
      "Name 2 things you can smell.",
      "Name 1 thing you can taste.",
      "Take one normal breath and notice how you feel now.",
    ],
  },
  {
    id: "feet",
    title: "Feet on the floor",
    intro: "A short body-awareness exercise you can do sitting down.",
    steps: [
      "Sit or stand comfortably. Uncross your legs if you can.",
      "Press both feet gently into the floor. Notice the pressure.",
      "Relax your shoulders and let them drop.",
      "Unclench your jaw. Let your hands rest open.",
      "Look around and name 3 things you can see.",
      "Take one slow breath and continue with your day.",
    ],
  },
  {
    id: "water",
    title: "Cool water reset",
    intro: "Uses a small sensation to interrupt a racing moment.",
    steps: [
      "Hold your hands under cool water for a few seconds, or hold a cool glass.",
      "Notice the temperature on your skin.",
      "Take one slow breath in and out.",
      "Dry your hands and notice the change in your hands' temperature.",
      "Name one small thing you'll do next.",
    ],
  },
];

function GroundingTool({ onComplete }) {
  const [exerciseId, setExerciseId] = useState(null);
  const [step, setStep] = useState(0);

  const exercise = GROUNDING_EXERCISES.find((e) => e.id === exerciseId);

  if (!exercise) {
    return (
      <Card>
        <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
          <Footprints className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
          Grounding exercises
        </h3>
        <p className="mt-1 text-xs text-[#78726B]">
          Short, step-by-step exercises you follow at your own pace.
        </p>
        <div className="mt-3 space-y-2">
          {GROUNDING_EXERCISES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setExerciseId(ex.id);
                setStep(0);
              }}
              className="flex w-full items-center justify-between rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-4 py-3 text-left transition hover:border-[#8C3737]/30 hover:bg-[#F6EFEA]"
            >
              <span>
                <span className="block text-sm font-semibold text-[#1E1B18]">{ex.title}</span>
                <span className="mt-0.5 block text-xs text-[#78726B]">{ex.intro}</span>
              </span>
              <span className="text-xs font-semibold text-[#8C3737]">Start →</span>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const isLast = step >= exercise.steps.length - 1;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-base font-bold text-[#1E1B18]">{exercise.title}</h3>
          <p className="mt-0.5 text-xs text-[#78726B]">{exercise.intro}</p>
        </div>
        <button
          onClick={() => setExerciseId(null)}
          className="shrink-0 rounded-lg border border-[#EDE6E2] px-3 py-1.5 text-xs font-semibold text-[#78726B] hover:bg-[#F6EFEA]"
        >
          Exit
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C3737]">
          Step {step + 1} of {exercise.steps.length}
        </p>
        <p className="mt-2 font-serif text-lg leading-snug text-[#1E1B18]">
          {exercise.steps[step]}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {step > 0 && (
          <SecondaryButton onClick={() => setStep((s) => s - 1)}>Back</SecondaryButton>
        )}
        {!isLast ? (
          <PrimaryButton onClick={() => setStep((s) => s + 1)}>Next step</PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={() => {
              setExerciseId(null);
              toast.success("Exercise complete");
              onComplete?.();
            }}
          >
            Finish
          </PrimaryButton>
        )}
        <button
          onClick={() => setExerciseId(null)}
          className="text-xs font-semibold text-[#78726B] underline underline-offset-2 hover:text-[#1E1B18]"
        >
          Stop and exit
        </button>
      </div>
    </Card>
  );
}

// ── Journal ──────────────────────────────────────────────────────────────────

const PROMPTS = [
  "How am I feeling right now?",
  "What has been taking up my attention today?",
  "What is one thing I need right now?",
  "What is one manageable action I can take next?",
];

function JournalTool() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [reflectingId, setReflectingId] = useState(null);
  const [reflection, setReflection] = useState("");
  const [reflectError, setReflectError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getJournalEntries(30);
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your journal.");
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateJournalEntry(editingId, { prompt, content });
        toast.success("Entry updated");
      } else {
        await createJournalEntry({ prompt, content });
        toast.success("Entry saved privately");
      }
      setPrompt("");
      setContent("");
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJournalEntry(id);
      toast.success("Entry deleted");
      if (editingId === id) {
        setEditingId(null);
        setPrompt("");
        setContent("");
      }
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const handleReflect = async (entry) => {
    setReflectingId(entry._id);
    setReflection("");
    setReflectError("");
    try {
      const data = await reflectOnEntry(entry._id);
      setReflection(data.reflection);
    } catch (err) {
      setReflectError(
        err.response?.data?.message || "AI reflection isn't available right now — your entry is safe."
      );
    } finally {
      setReflectingId(null);
    }
  };

  return (
    <Card>
      <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
        <BookOpen className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
        Private journal
      </h3>
      <p className="mt-1 text-xs text-[#78726B]">
        Only you can see these entries. They are never posted to community features.
      </p>

      <form onSubmit={handleSave} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrompt(p)}
              aria-pressed={prompt === p}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                prompt === p
                  ? "border-[#8C3737] bg-[#F6EFEA] text-[#8C3737]"
                  : "border-[#EDE6E2] bg-white text-[#78726B] hover:bg-[#F6EFEA]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="Write as much or as little as you like..."
          className="w-full resize-y rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder:text-[#A19B93] focus:border-[#8C3737] focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton type="submit" disabled={saving || !content.trim()}>
            {saving ? "Saving..." : editingId ? "Update entry" : "Save entry"}
          </PrimaryButton>
          {editingId && (
            <SecondaryButton
              onClick={() => {
                setEditingId(null);
                setPrompt("");
                setContent("");
              }}
            >
              Cancel
            </SecondaryButton>
          )}
          <span className="text-[11px] text-[#A19B93]">{content.length}/5000</span>
        </div>
      </form>

      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">
          Recent entries
        </h4>
        {loading ? (
          <p className="mt-3 text-sm text-[#78726B]">Loading...</p>
        ) : error ? (
          <div className="mt-3">
            <ErrorNote message={error} onRetry={load} />
          </div>
        ) : entries.length === 0 ? (
          <p className="mt-3 text-xs text-[#A19B93]">
            No entries yet — your reflections will appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {entries.map((entry) => (
              <li key={entry._id} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#8C3737]">
                    {friendlyDate(entry.date)}
                    {entry.prompt && <span className="ml-2 font-normal text-[#78726B]">{entry.prompt}</span>}
                  </span>
                  <span className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(entry._id);
                        setPrompt(entry.prompt || "");
                        setContent(entry.content);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-xs font-semibold text-[#78726B] hover:text-[#1E1B18]"
                    >
                      <Pencil className="inline h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="text-xs font-semibold text-[#BA2626] hover:underline"
                    >
                      <Trash2 className="inline h-3.5 w-3.5" aria-hidden="true" /> Delete
                    </button>
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#4F4A45]">
                  {entry.content}
                </p>

                {reflectingId === entry._id ? (
                  <p className="mt-2 text-xs text-[#78726B]">Asking for a gentle reflection...</p>
                ) : reflection && reflectingId === null && !reflectError ? (
                  <div className="mt-3 rounded-lg border border-[#EDE6E2] bg-white p-3">
                    <p className="text-[11px] font-semibold text-[#8C3737]">
                      <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
                      Reflection (AI-generated, your entry stays private)
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#4F4A45]">
                      {reflection}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleReflect(entry)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#4F4A45] transition hover:bg-[#F6EFEA]"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Reflect on this entry with AI (asks first)
                  </button>
                )}
                {reflectError && reflectingId === null && (
                  <p className="mt-2 text-[11px] text-[#A85C12]">{reflectError}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <InfoNote icon={ShieldCheck}>
        AI reflection is optional and only shares the single entry you chose — never
        your whole journal or wellness history. Your entries are never used to train
        models or shown to other users.
      </InfoNote>
    </Card>
  );
}

// ── Quick reset chooser ──────────────────────────────────────────────────────

const RESET_CHOICES = [
  { id: "breathe", label: "A short breathing exercise", icon: Wind, desc: "1–5 minutes with a visible timer." },
  { id: "ground", label: "A grounding activity", icon: Footprints, desc: "Follow simple steps at your pace." },
  { id: "reflect", label: "A quiet reflection", icon: BookOpen, desc: "Write a few words in your private journal." },
  { id: "move", label: "A short movement break", icon: CircleDot, desc: "Shake it off with a gentle stretch." },
];

function QuickReset({ onGoTo }) {
  const [selected, setSelected] = useState(null);

  return (
    <Card className="border-[#8C3737]/25">
      <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
        <Sparkles className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
        Feeling stressed or overwhelmed?
      </h3>
      <p className="mt-1 text-xs text-[#78726B]">
        Pick what sounds best right now — no long questionnaire.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {RESET_CHOICES.map((choice) => {
          const Icon = choice.icon;
          const active = selected === choice.id;
          return (
            <button
              key={choice.id}
              onClick={() => setSelected(choice.id)}
              aria-pressed={active}
              className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                active
                  ? "border-[#8C3737] bg-[#F6EFEA]"
                  : "border-[#EDE6E2] bg-[#FBF9F7] hover:border-[#8C3737]/30"
              }`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-[#8C3737]" : "text-[#78726B]"}`} aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-[#1E1B18]">{choice.label}</span>
                <span className="mt-0.5 block text-xs text-[#78726B]">{choice.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-3 flex justify-end">
          <PrimaryButton
            onClick={() => {
              if (selected === "breathe") onGoTo?.("breathing");
              else if (selected === "ground") onGoTo?.("grounding");
              else if (selected === "reflect") onGoTo?.("journal");
              else onGoTo?.("movement");
            }}
          >
            Start now →
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

export default function ResetSection({ onGoTo }) {
  const [resetSignal, setResetSignal] = useState(0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mood & Stress Reset Studio"
        subtitle="Short, practical exercises you can do any time — stop whenever you want."
      />

      <QuickReset onGoTo={onGoTo} />

      <div className="grid gap-6 lg:grid-cols-2" id={`reset-grid-${resetSignal}`}>
        <div id="breathing-anchor">
          <BreathingTool />
        </div>
        <div id="grounding-anchor">
          <GroundingTool onComplete={() => setResetSignal((s) => s + 1)} />
        </div>
      </div>

      <VideoStrip videos={RESET_VIDEOS} title="Guided calming videos" />

      <div id="journal-anchor">
        <JournalTool />
      </div>

      <InfoNote>
        These tools support everyday stress management. They do not diagnose mental
        health conditions and are not a replacement for professional support. If you
        are in immediate danger, use Emergency SOS or contact local emergency services.
      </InfoNote>
    </div>
  );
}
