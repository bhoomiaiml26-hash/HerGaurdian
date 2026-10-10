/**
 * Feature 5 — Sleep & Recovery Coach
 * Sleep diary (bedtime, wake time, quality, notes) with correct cross-midnight
 * duration, a wind-down routine builder (reorderable, optional reminders via
 * the existing reminder infrastructure), and cautious sleep↔energy trends
 * computed only from the user's own records.
 *
 * No medication or supplement advice. No sleep-disorder claims.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  Check,
  Moon,
  Plus,
  Trash2,
  Info,
  Bell,
} from "lucide-react";
import {
  getSleepLogs,
  saveSleepLog,
  deleteSleepLog,
  getCheckins,
  getWindDownRoutine,
  saveWindDownRoutine,
} from "../../../services/wellnessService";
import { createReminder, deleteReminder, getReminders } from "../../../services/reminderService";
import {
  Card,
  SectionHeader,
  LoadingBlock,
  ErrorNote,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  InfoNote,
} from "./ui";
import { calcSleepMinutes, formatMinutes, friendlyDate, todayISO } from "./studioUtils";

// ── Sleep diary form ─────────────────────────────────────────────────────────

function SleepForm({ existing, onSaved, onCancel }) {
  const [date, setDate] = useState(existing?.date || todayISO());
  const [bedtime, setBedtime] = useState(existing?.bedtime || "23:00");
  const [wakeTime, setWakeTime] = useState(existing?.wakeTime || "07:00");
  const [quality, setQuality] = useState(existing?.quality ?? 3);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewMinutes = calcSleepMinutes(bedtime, wakeTime);
  const invalid = previewMinutes === 0 || previewMinutes >= 24 * 60;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (invalid) {
      setError("Bedtime and wake time can't be the same — check both times.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveSleepLog({ date, bedtime, wakeTime, quality, notes });
      toast.success(existing?._id ? "Sleep log updated" : "Sleep log saved");
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your sleep log.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#1E1B18]">
              {existing?._id ? "Edit sleep log" : "Log last night's sleep"}
            </h3>
            <p className="text-xs text-[#78726B]">
              Overnight sleep is calculated automatically, including times past midnight.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#4F4A45]">
            Date
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[#EDE6E2] bg-white px-3 py-2 text-xs focus:border-[#8C3737] focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-[#4F4A45]">Bedtime</span>
            <input
              type="time"
              required
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#4F4A45]">Wake-up time</span>
            <input
              type="time"
              required
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
            />
          </label>
        </div>

        <div
          className={`rounded-lg border p-3.5 text-sm font-semibold ${
            invalid
              ? "border-[#A85C12]/30 bg-[#FEF7ED] text-[#A85C12]"
              : "border-[#286646]/20 bg-[#EBF3EE] text-[#286646]"
          }`}
          aria-live="polite"
        >
          {invalid
            ? "Bedtime and wake time can't be the same."
            : `Recorded duration: ${formatMinutes(previewMinutes)}`}
        </div>

        <fieldset className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
          <legend className="px-1 text-xs font-semibold text-[#4F4A45]">
            How was your sleep?
            <span className="ml-1.5 font-normal text-[#A19B93]">(optional)</span>
          </legend>
          <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label="Sleep quality">
            {["Poor", "2", "Okay", "4", "Great"].map((label, idx) => {
              const val = idx + 1;
              return (
                <label
                  key={val}
                  className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-md border text-xs font-semibold transition ${
                    quality === val
                      ? "border-[#8C3737] bg-[#8C3737] text-white"
                      : "border-[#EDE6E2] bg-white text-[#78726B] hover:bg-[#F6EFEA]"
                  }`}
                >
                  <input
                    type="radio"
                    name="quality"
                    value={val}
                    checked={quality === val}
                    onChange={() => setQuality(val)}
                    className="sr-only"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-xs font-semibold text-[#4F4A45]">
            Routine notes <span className="font-normal text-[#A19B93]">(private, optional)</span>
          </span>
          <textarea
            value={notes}
            maxLength={1000}
            rows={2}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. read for 10 minutes before bed, late coffee..."
            className="mt-1.5 w-full resize-y rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder:text-[#A19B93] focus:border-[#8C3737] focus:outline-none"
          />
        </label>

        <ErrorNote message={error} />

        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="submit" disabled={saving || invalid}>
            {saving ? "Saving..." : existing?._id ? "Update log" : "Save sleep log"}
          </PrimaryButton>
          {onCancel && <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>}
        </div>
      </form>
    </Card>
  );
}

// ── Wind-down routine builder ────────────────────────────────────────────────

const SUGGESTED_STEPS = [
  { label: "Reduce screen use", time: "21:30" },
  { label: "Prepare for tomorrow", time: "21:45" },
  { label: "Quiet reading", time: "22:00" },
  { label: "Gentle stretching", time: "22:10" },
  { label: "Relaxation exercise", time: "22:15" },
  { label: "Personal reflection", time: "22:20" },
];

function WindDownBuilder({ routine, onSaved }) {
  const [items, setItems] = useState(routine?.activities || []);
  const [remindersEnabled, setRemindersEnabled] = useState(routine?.remindersEnabled || false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    getReminders()
      .then((data) => setReminders(data.reminders || []))
      .catch(() => setReminders([]));
  }, []);

  const move = (idx, dir) => {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const persist = async (nextItems = items, nextRemindersEnabled = remindersEnabled) => {
    setSaving(true);
    try {
      await saveWindDownRoutine({
        activities: nextItems.map((it, i) => ({ ...it, order: i })),
        remindersEnabled: nextRemindersEnabled,
      });
      toast.success("Routine saved");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save routine");
    } finally {
      setSaving(false);
    }
  };

  const toggleStepReminder = async (item) => {
    // Each step reminder maps to an existing Reminder record with a fixed evening time.
    const updated = items.map((it) =>
      it._id === item._id || it.label === item.label ? { ...it, reminder: !it.reminder } : it
    );
    setItems(updated);

    const existing = reminders.find(
      (r) => r.title === `Wind-down: ${item.label}` && r.category === "Rest & Recovery"
    );
    setSyncing(true);
    try {
      if (item.reminder && existing) {
        await deleteReminder(existing._id);
        setReminders((prev) => prev.filter((r) => r._id !== existing._id));
        toast.success("Reminder turned off");
      } else if (!item.reminder) {
        await createReminder({
          title: `Wind-down: ${item.label}`,
          category: "Rest & Recovery",
          time: item.time || "22:00",
          notes: "From your Sleep & Recovery wind-down routine.",
        });
        const fresh = await getReminders();
        setReminders(fresh.reminders || []);
        toast.success("Reminder added");
      }
      await persist(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update reminder");
      setItems(items); // roll back
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
            <Moon className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
            Wind-down routine
          </h3>
          <p className="mt-0.5 text-xs text-[#78726B]">
            Build a simple evening routine. Reorder steps with the arrows; times are approximate.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-[#4F4A45]">
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={(e) => setRemindersEnabled(e.target.checked)}
            className="accent-[#8C3737]"
          />
          Reminders on
        </label>
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <p className="text-xs text-[#A19B93]">No steps yet — add a few suggested ones:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTED_STEPS.map((s) => (
              <button
                key={s.label}
                onClick={() => setItems((prev) => [...prev, { ...s, reminder: false, order: prev.length }])}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE6E2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4F4A45] transition hover:border-[#8C3737]/30 hover:bg-[#F6EFEA]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ol className="mt-4 space-y-2">
          {items.map((item, idx) => (
            <li
              key={item._id || `${item.label}-${idx}`}
              className="flex items-center gap-2 rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-2.5"
            >
              <span className="w-5 shrink-0 text-center text-[11px] font-bold text-[#8C3737]">
                {idx + 1}
              </span>
              <input
                type="time"
                value={item.time || ""}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, i) => (i === idx ? { ...it, time: e.target.value } : it))
                  )
                }
                aria-label={`Time for ${item.label}`}
                className="shrink-0 rounded border border-[#EDE6E2] bg-white px-2 py-1 text-xs focus:border-[#8C3737] focus:outline-none"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-[#1E1B18]">{item.label}</span>

              <span className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Move ${item.label} up`}
                  className="rounded border border-[#EDE6E2] bg-white p-1.5 text-[#4F4A45] hover:bg-[#F6EFEA] disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  aria-label={`Move ${item.label} down`}
                  className="rounded border border-[#EDE6E2] bg-white p-1.5 text-[#4F4A45] hover:bg-[#F6EFEA] disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() =>
                    remindersEnabled
                      ? toggleStepReminder(item)
                      : toast.error("Turn reminders on first")
                  }
                  aria-label={`Toggle reminder for ${item.label}`}
                  aria-pressed={Boolean(item.reminder)}
                  className={`rounded border p-1.5 transition ${
                    item.reminder && remindersEnabled
                      ? "border-[#8C3737] bg-[#F6EFEA] text-[#8C3737]"
                      : "border-[#EDE6E2] bg-white text-[#78726B] hover:bg-[#F6EFEA]"
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label={`Remove ${item.label}`}
                  className="rounded border border-[#EDE6E2] bg-white p-1.5 text-[#BA2626] hover:bg-[#FDF2F2]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PrimaryButton disabled={saving || syncing} onClick={() => persist()} icon={Check}>
          {saving || syncing ? "Saving..." : "Save routine"}
        </PrimaryButton>
        {items.length > 0 && (
          <SecondaryButton onClick={() => setItems([])}>Clear all steps</SecondaryButton>
        )}
      </div>

      <InfoNote>
        Step reminders use HerGuardian's regular Reminders — gentle, silent nudges you
        can delete any time. Nothing alarming is sent.
      </InfoNote>
    </Card>
  );
}

// ── Trends ───────────────────────────────────────────────────────────────────

function SleepTrends({ sleepLogs, checkins }) {
  const [view, setView] = useState("duration");

  const sortedSleep = useMemo(
    () => [...sleepLogs].sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-14),
    [sleepLogs]
  );

  const durationData = useMemo(
    () =>
      sortedSleep.map((s) => ({
        date: friendlyDate(s.date),
        hours: Math.round((s.durationMinutes / 60) * 10) / 10,
        quality: s.quality,
      })),
    [sortedSleep]
  );

  // Pairs: sleep logged for date D + check-in on date D ("next-day energy")
  const pairs = useMemo(() => {
    const byDate = new Map(checkins.map((c) => [c.date, c]));
    return sleepLogs
      .filter((s) => byDate.has(s.date))
      .map((s) => ({
        date: s.date,
        sleepQuality: s.quality,
        sleepHours: Math.round((s.durationMinutes / 60) * 10) / 10,
        energy: byDate.get(s.date).energy,
      }));
  }, [sleepLogs, checkins]);

  if (sleepLogs.length < 3) {
    return (
      <Card>
        <h3 className="font-serif text-base font-bold text-[#1E1B18]">Sleep trends</h3>
        <p className="mt-1 text-xs text-[#78726B]">
          Trends appear after 3 sleep logs. Only your recorded entries are charted —
          nothing is filled in.
        </p>
        <p className="mt-2 text-xs text-[#A19B93]">You have {sleepLogs.length} so far.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-serif text-base font-bold text-[#1E1B18]">Sleep trends</h3>
        <div className="flex gap-1.5" role="group" aria-label="Trend view">
          {[
            { id: "duration", label: "Duration & quality" },
            { id: "energy", label: "vs next-day energy" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                view === v.id
                  ? "border-[#8C3737] bg-[#8C3737] text-white"
                  : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "duration" ? (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={durationData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE6E2" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#78726B" }} />
              <YAxis yAxisId="h" domain={[0, 12]} tick={{ fontSize: 11, fill: "#78726B" }} />
              <YAxis yAxisId="q" orientation="right" domain={[1, 5]} tick={{ fontSize: 11, fill: "#78726B" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #EDE6E2", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="h" type="monotone" dataKey="hours" name="Hours slept" stroke="#286646" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="q" type="monotone" dataKey="quality" name="Quality (1–5)" stroke="#8C3737" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : pairs.length >= 3 ? (
        <>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE6E2" />
                <XAxis
                  dataKey="sleepQuality"
                  name="Sleep quality"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: "#78726B" }}
                  label={{ value: "Sleep quality (1–5)", position: "insideBottom", offset: -4, fontSize: 11, fill: "#78726B" }}
                />
                <YAxis
                  dataKey="energy"
                  name="Energy"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: "#78726B" }}
                  label={{ value: "Energy (1–5)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#78726B" }}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #EDE6E2", fontSize: 12 }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={() => ""}
                />
                <Scatter data={pairs} fill="#8C3737" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#4F4A45]">
            Each dot is one day where you recorded both sleep and a check-in (
            {pairs.length} days). Your entries suggest an association between sleep
            quality and next-day energy — they do not prove that one caused the other.
          </p>
        </>
      ) : (
        <p className="mt-4 text-xs text-[#A19B93]">
          Logging sleep and doing a check-in on the same days builds this comparison —
          you need at least 3 paired days (you have {pairs.length}).
        </p>
      )}
    </Card>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export default function SleepSection() {
  const [sleepLogs, setSleepLogs] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sleepData, checkinData, routineData] = await Promise.all([
        getSleepLogs(30),
        getCheckins(30),
        getWindDownRoutine(),
      ]);
      setSleepLogs(sleepData.logs || []);
      setCheckins(checkinData.checkins || []);
      setRoutine(routineData.routine || null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load sleep data.");
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

  const editing = editingId ? sleepLogs.find((l) => l._id === editingId) : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Sleep & Recovery Coach"
        subtitle="A simple sleep diary, an evening wind-down builder, and trends from what you record."
      />

      {loading ? (
        <LoadingBlock label="Loading sleep data..." />
      ) : error ? (
        <Card>
          <ErrorNote message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          <SleepForm
            key={editing?._id || "new"}
            existing={editing}
            onSaved={() => {
              setEditingId(null);
              void load();
            }}
            onCancel={() => setEditingId(null)}
          />

          <SleepTrends sleepLogs={sleepLogs} checkins={checkins} />

          <WindDownBuilder key={routine?._id || "empty"} routine={routine} onSaved={load} />

          <Card>
            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
              <BedDouble className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
              Sleep history
            </h3>
            {sleepLogs.length === 0 ? (
              <p className="mt-2 text-xs text-[#A19B93]">
                Your sleep logs will appear here after your first entry.
              </p>
            ) : (
              <ul className="mt-3 max-h-80 divide-y divide-[#EDE6E2] overflow-y-auto">
                {sleepLogs.map((log) => (
                  <li key={log._id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E1B18]">
                        {friendlyDate(log.date)}
                        <span className="ml-2 font-normal text-[#78726B]">
                          {log.bedtime} → {log.wakeTime}
                        </span>
                      </p>
                      <p className="text-xs text-[#78726B]">
                        {formatMinutes(log.durationMinutes)} · quality {log.quality}/5
                        {log.notes ? ` · ${log.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <SecondaryButton
                        className="min-h-9 px-3 py-1.5 text-xs"
                        onClick={() => {
                          setEditingId(log._id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Edit
                      </SecondaryButton>
                      <DangerButton
                        onClick={async () => {
                          await deleteSleepLog(log._id);
                          toast.success("Sleep log deleted");
                          if (editingId === log._id) setEditingId(null);
                          await load();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                      </DangerButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <InfoNote icon={Info}>
            This diary is for personal reflection. It does not diagnose sleep disorders
            and does not recommend medication or supplements. If sleep problems persist
            or worry you, a healthcare professional is the right person to ask.
          </InfoNote>
        </>
      )}
    </div>
  );
}
