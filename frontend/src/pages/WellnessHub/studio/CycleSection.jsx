/**
 * Feature 3 — Menstrual Wellness Journal
 * Private cycle logging, monthly calendar, cycle history with lengths,
 * symptom patterns across recorded cycles (non-diagnostic), optional
 * estimated next-period window clearly labelled as an estimate, and a
 * user-controlled exportable summary.
 *
 * All calculations are deterministic (plain code over the user's own records).
 * No pregnancy claims, no diagnosis, support for irregular/missing entries.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Download,
  Pencil,
  Plus,
  Trash2,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getMenstrualLogs,
  createMenstrualLog,
  updateMenstrualLog,
  deleteMenstrualLog,
} from "../../../services/wellnessService";
import {
  Card,
  SectionHeader,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  InfoNote,
} from "./ui";
import { computeCycleLengths, addDays, friendlyDate, todayISO } from "./studioUtils";

const FLOWS = [
  { id: "spotting", label: "Spotting" },
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "heavy", label: "Heavy" },
];

const SYMPTOMS = [
  "cramps", "headache", "bloating", "fatigue", "backache",
  "nausea", "tender breasts", "mood swings", "acne", "cravings",
  "anxiety", "low mood", "insomnia", "dizziness",
];

const PAINS = ["None", "Mild", "Moderate", "Strong", "Severe"];

// ── Deterministic cycle math (plain functions over user records) ─────────────

/** Range of recorded period dates (for calendar marks). */
function periodDateSet(logs) {
  const set = new Set();
  logs.forEach((log) => {
    if (!log.startDate) return;
    const end = log.endDate || log.startDate;
    let cursor = log.startDate;
    // cap at 14 days per entry to tolerate typos without melting the calendar
    let guard = 0;
    while (cursor <= end && guard < 14) {
      set.add(cursor);
      cursor = addDays(cursor, 1);
      guard++;
    }
  });
  return set;
}

// ── Calendar ────────────────────────────────────────────────────────────────

function MonthCalendar({ logs, monthDate, onMonthChange, onSelectDate, selectedDate }) {
  const periodDates = useMemo(() => periodDateSet(logs), [logs]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayISO();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }

  const shift = (delta) => onMonthChange(new Date(year, month + delta, 1));

  return (
    <Card>
      <div className="flex items-center justify-between">
        <button
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="rounded-lg border border-[#EDE6E2] p-2 text-[#4F4A45] hover:bg-[#F6EFEA]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-serif text-base font-bold text-[#1E1B18]">
          {monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <button
          onClick={() => shift(1)}
          aria-label="Next month"
          className="rounded-lg border border-[#EDE6E2] p-2 text-[#4F4A45] hover:bg-[#F6EFEA]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#78726B]">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={`pad-${idx}`} />;
          const isPeriod = periodDates.has(date);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              aria-label={`${friendlyDate(date)}${isPeriod ? ", recorded period day" : ""}`}
              className={`relative flex min-h-10 flex-col items-center justify-center rounded-lg border text-xs transition ${
                isSelected
                  ? "border-[#8C3737] bg-[#8C3737] text-white"
                  : isPeriod
                    ? "border-[#8C3737]/30 bg-[#F6EFEA] font-semibold text-[#8C3737]"
                    : "border-transparent text-[#4F4A45] hover:bg-[#F6EFEA]"
              } ${isToday && !isSelected ? "ring-1 ring-[#8C3737]/40" : ""}`}
            >
              {date.split("-")[2].replace(/^0/, "")}
              {isPeriod && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#8C3737]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-[#78726B]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#8C3737]" /> Recorded period day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-[#8C3737]/40 bg-[#F6EFEA]" /> From your entries
        </span>
      </div>
      <p className="mt-2 text-[11px] text-[#A19B93]">
        Tap any date to add or edit an entry for that day.
      </p>
    </Card>
  );
}

// ── Log form ────────────────────────────────────────────────────────────────

function LogForm({ existing, presetDate, onSaved, onCancel }) {
  const [startDate, setStartDate] = useState(existing?.startDate || presetDate || todayISO());
  const [endDate, setEndDate] = useState(existing?.endDate || "");
  const [flow, setFlow] = useState(existing?.flow || "medium");
  const [painLevel, setPainLevel] = useState(existing?.painLevel ?? 2);
  const [symptoms, setSymptoms] = useState(existing?.symptoms || []);
  const [mood, setMood] = useState(existing?.mood || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleSymptom = (s) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { startDate, endDate, flow, painLevel, symptoms, mood, notes };
      if (existing?._id) {
        await updateMenstrualLog(existing._id, payload);
        toast.success("Cycle entry updated");
      } else {
        await createMenstrualLog(payload);
        toast.success("Cycle entry saved");
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="font-serif text-base font-bold text-[#1E1B18]">
          {existing?._id ? "Edit cycle entry" : "Record a period"}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-[#4F4A45]">Start date *</span>
            <input
              type="date"
              required
              value={startDate}
              max={todayISO()}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#EDE6E2] bg-white px-3 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#4F4A45]">
              End date <span className="font-normal text-[#A19B93]">(optional)</span>
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={todayISO()}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#EDE6E2] bg-white px-3 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
            />
          </label>
        </div>

        <fieldset>
          <legend className="text-xs font-semibold text-[#4F4A45]">
            Flow <span className="font-normal text-[#A19B93]">(optional)</span>
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {FLOWS.map((f) => (
              <label
                key={f.id}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  flow === f.id
                    ? "border-[#8C3737] bg-[#8C3737] text-white"
                    : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
                }`}
              >
                <input
                  type="radio"
                  name="flow"
                  value={f.id}
                  checked={flow === f.id}
                  onChange={() => setFlow(f.id)}
                  className="sr-only"
                />
                {f.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold text-[#4F4A45]">
            Pain or discomfort{" "}
            <span className="font-normal text-[#A19B93]">(optional) — {PAINS[painLevel - 1]}</span>
          </legend>
          <input
            type="range"
            min={1}
            max={5}
            value={painLevel}
            onChange={(e) => setPainLevel(Number(e.target.value))}
            className="mt-2 w-full accent-[#8C3737]"
            aria-label="Pain or discomfort level"
          />
          <div className="flex justify-between text-[10px] text-[#A19B93]">
            <span>None</span>
            <span>Severe</span>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold text-[#4F4A45]">
            Symptoms <span className="font-normal text-[#A19B93]">(optional — tap any)</span>
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => (
              <label
                key={s}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
                  symptoms.includes(s)
                    ? "border-[#8C3737] bg-[#F6EFEA] text-[#8C3737]"
                    : "border-[#EDE6E2] bg-white text-[#78726B] hover:bg-[#F6EFEA]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={symptoms.includes(s)}
                  onChange={() => toggleSymptom(s)}
                  className="sr-only"
                />
                {s}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-xs font-semibold text-[#4F4A45]">
            Mood observations <span className="font-normal text-[#A19B93]">(optional)</span>
          </span>
          <input
            type="text"
            value={mood}
            maxLength={60}
            placeholder="e.g. tired but okay"
            onChange={(e) => setMood(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder:text-[#A19B93] focus:border-[#8C3737] focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[#4F4A45]">
            Notes <span className="font-normal text-[#A19B93]">(private, optional)</span>
          </span>
          <textarea
            value={notes}
            maxLength={1000}
            rows={2}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5 w-full resize-y rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
          />
        </label>

        <ErrorNote message={error} />

        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving..." : existing?._id ? "Update entry" : "Save entry"}
          </PrimaryButton>
          {onCancel && <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>}
        </div>
      </form>
    </Card>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export default function CycleSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthDate, setMonthDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [formMode, setFormMode] = useState(null); // null | {mode:'new'|'edit', date?, id?}
  const [showEstimate, setShowEstimate] = useState(
    () => localStorage.getItem("hg_cycle_estimate") !== "off"
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMenstrualLogs(60);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your cycle journal.");
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

  const cycleLengths = useMemo(() => computeCycleLengths(logs), [logs]);

  const stats = useMemo(() => {
    if (cycleLengths.length === 0) return null;
    const sum = cycleLengths.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / cycleLengths.length);
    const irregular = Math.max(...cycleLengths) - Math.min(...cycleLengths) > 7;
    return { avg, irregular, count: cycleLengths.length, lengths: cycleLengths };
  }, [cycleLengths]);

  const estimate = useMemo(() => {
    if (!stats || stats.count < 1) return null;
    const starts = logs.map((l) => l.startDate).filter(Boolean).sort();
    const lastStart = starts[starts.length - 1];
    if (lastStart > todayISO()) return null; // future-dated entry: skip estimate
    const from = addDays(lastStart, stats.avg - 2);
    const to = addDays(lastStart, stats.avg + 2);
    if (from < todayISO() && to < todayISO()) return { stale: true, from, to };
    return { stale: false, from, to };
  }, [stats, logs]);

  const symptomPatterns = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      (log.symptoms || []).forEach((s) => {
        const key = String(s).trim().toLowerCase();
        if (!key) return;
        (map[key] = map[key] || []).push(log.startDate);
      });
    });
    return Object.entries(map)
      .filter(([, dates]) => dates.length >= 2)
      .sort((a, b) => b[1].length - a[1].length);
  }, [logs]);

  const editing = formMode?.mode === "edit" ? logs.find((l) => l._id === formMode.id) : null;

  const handleDelete = async (id) => {
    try {
      await deleteMenstrualLog(id);
      toast.success("Entry deleted");
      if (formMode?.id === id) setFormMode(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const handleExport = () => {
    const include = window.prompt(
      "What should the summary include?\nType: dates, symptoms, notes\n(or leave blank for dates + symptoms)",
      "dates, symptoms"
    );
    if (include === null) return;
    const opts = include.toLowerCase();
    const wantNotes = opts.includes("notes");
    const wantSymptoms = opts.includes("symptom") || !opts.includes("dates");

    const lines = [];
    lines.push("HerGuardian — My Cycle Summary (personal records)");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");
    lines.push(`Recorded entries: ${logs.length}`);
    if (stats) {
      lines.push(`Cycle lengths recorded: ${stats.lengths.join(", ")} days (average ${stats.avg})`);
    } else {
      lines.push("Cycle lengths: not enough recorded starts yet (need at least 2).");
    }
    lines.push("");
    lines.push("— Entries (newest first) —");
    logs.forEach((log) => {
      let row = `${log.startDate}${log.endDate ? ` → ${log.endDate}` : ""} | flow: ${log.flow || "n/a"} | pain: ${log.painLevel}/5`;
      if (wantSymptoms && log.symptoms?.length) row += ` | symptoms: ${log.symptoms.join(", ")}`;
      if (log.mood) row += ` | mood: ${log.mood}`;
      if (wantNotes && log.notes) row += ` | notes: ${log.notes}`;
      lines.push(row);
    });
    lines.push("");
    lines.push("This summary reflects only what you recorded. Estimates are not guarantees.");
    lines.push("It is not a medical assessment and cannot indicate pregnancy.");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cycle-summary-${todayISO()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded");
  };

  const editingEntry = editing;
  const presetDate = formMode?.mode === "new" ? formMode.date : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Menstrual Wellness Journal"
        subtitle="A private place to record your cycle, notice your own patterns, and export a summary if you want one."
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={handleExport} icon={Download}>
              Export summary
            </SecondaryButton>
            <PrimaryButton
              onClick={() => setFormMode({ mode: "new", date: todayISO() })}
              icon={Plus}
            >
              Record a period
            </PrimaryButton>
          </div>
        }
      />

      {loading ? (
        <LoadingBlock label="Loading your cycle journal..." />
      ) : error ? (
        <Card>
          <ErrorNote message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          {/* Stats + estimate */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">
                Recorded cycles
              </h3>
              <p className="mt-2 font-serif text-2xl font-bold text-[#1E1B18]">{logs.length}</p>
              <p className="mt-1 text-xs text-[#78726B]">
                {logs.length === 0
                  ? "Your entries will appear here."
                  : "Based only on what you entered."}
              </p>
            </Card>

            <Card>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">
                Average cycle length
              </h3>
              {stats ? (
                <>
                  <p className="mt-2 font-serif text-2xl font-bold text-[#1E1B18]">
                    {stats.avg} days
                  </p>
                  <p className="mt-1 text-xs text-[#78726B]">
                    From {stats.count} gap{stats.count > 1 ? "s" : ""} between starts
                    {stats.irregular ? " — your entries vary quite a bit, which is common." : "."}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-[#A19B93]">
                  Record at least two period starts to see a cycle length.
                </p>
              )}
            </Card>

            <Card className={estimate ? "" : "opacity-80"}>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78726B]">
                Next period window
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </h3>
              {!showEstimate ? (
                <p className="mt-2 text-xs text-[#A19B93]">Estimates are turned off.</p>
              ) : estimate && !estimate.stale ? (
                <>
                  <p className="mt-2 font-serif text-lg font-bold text-[#1E1B18]">
                    {friendlyDate(estimate.from)} – {friendlyDate(estimate.to)}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#A85C12]">
                    Estimate only — based on your average, not a guarantee. Cycles vary,
                    and this cannot tell you whether you are pregnant.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-[#A19B93]">
                  Not enough recorded starts yet — this appears once you have data.
                </p>
              )}
              <label className="mt-2 flex items-center gap-2 text-[11px] text-[#78726B]">
                <input
                  type="checkbox"
                  checked={showEstimate}
                  onChange={(e) => {
                    setShowEstimate(e.target.checked);
                    localStorage.setItem("hg_cycle_estimate", e.target.checked ? "on" : "off");
                  }}
                  className="accent-[#8C3737]"
                />
                Show estimates
              </label>
            </Card>
          </div>

          {(formMode || editingEntry) && (
            <LogForm
              key={editingEntry?._id || presetDate || "new"}
              existing={editingEntry}
              presetDate={presetDate}
              onSaved={() => {
                setFormMode(null);
                void load();
              }}
              onCancel={() => setFormMode(null)}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <MonthCalendar
              logs={logs}
              monthDate={monthDate}
              onMonthChange={setMonthDate}
              selectedDate={presetDate}
              onSelectDate={(date) => {
                const existingOnDate = logs.find(
                  (l) => date >= l.startDate && date <= (l.endDate || l.startDate)
                );
                if (existingOnDate) {
                  setFormMode({ mode: "edit", id: existingOnDate._id });
                } else {
                  setFormMode({ mode: "new", date });
                }
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            <Card>
              <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
                <CalendarDays className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
                Cycle history
              </h3>
              {logs.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No entries yet"
                  message="Record your first period above or by tapping a date on the calendar. Missing or irregular entries are fine — this works with whatever you record."
                />
              ) : (
                <ul className="mt-4 max-h-96 divide-y divide-[#EDE6E2] overflow-y-auto">
                  {logs.map((log) => (
                    <li key={log._id} className="py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#1E1B18]">
                            {friendlyDate(log.startDate)}
                            {log.endDate && log.endDate !== log.startDate && (
                              <span className="font-normal text-[#78726B]">
                                → {friendlyDate(log.endDate)}
                              </span>
                            )}
                            <span className="rounded-full bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#8C3737]">
                              {log.flow}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#78726B]">
                            <span>Pain {PAINS[(log.painLevel || 1) - 1]}</span>
                            {log.symptoms?.length > 0 && (
                              <span className="capitalize">{log.symptoms.join(", ")}</span>
                            )}
                            {log.mood && <span>{log.mood}</span>}
                          </div>
                          {log.notes && (
                            <p className="mt-1 whitespace-pre-wrap text-xs italic text-[#4F4A45]">
                              {log.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <SecondaryButton
                            className="min-h-9 px-3 py-1.5 text-xs"
                            icon={Pencil}
                            onClick={() => {
                              setFormMode({ mode: "edit", id: log._id });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Edit
                          </SecondaryButton>
                          <DangerButton onClick={() => handleDelete(log._id)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                          </DangerButton>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Symptom patterns */}
          <Card>
            <h3 className="font-serif text-base font-bold text-[#1E1B18]">
              Symptom patterns in your records
            </h3>
            <p className="mt-1 text-xs text-[#78726B]">
              Symptoms that showed up in more than one of your recorded cycles, with
              the dates that support each one.
            </p>
            {symptomPatterns.length === 0 ? (
              <p className="mt-3 text-xs text-[#A19B93]">
                Nothing repeats yet — patterns appear automatically once a symptom is
                recorded in 2 or more cycles.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {symptomPatterns.map(([symptom, dates]) => (
                  <li
                    key={symptom}
                    className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold capitalize text-[#1E1B18]">
                        {symptom}
                      </span>
                      <span className="text-xs font-semibold text-[#8C3737]">
                        {dates.length}× recorded
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#78726B]">
                      Dates: {dates.sort().map(friendlyDate).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <InfoNote tone="caution" icon={Info}>
              These are counts from your own entries — not a medical assessment. This
              tool cannot diagnose conditions such as PCOS or endometriosis, determine
              fertility, or indicate pregnancy. If a symptom concerns you, share your
              exported summary with a healthcare professional.
            </InfoNote>
          </Card>
        </>
      )}
    </div>
  );
}
