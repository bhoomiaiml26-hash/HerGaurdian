/**
 * Feature 1 — Personal Wellness Tracker
 * Quick daily check-in (all fields optional), personal history with edit/delete,
 * and trends that only render when enough real entries exist.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CalendarCheck, Pencil, Trash2, TrendingUp } from "lucide-react";
import {
  getCheckins,
  saveCheckin,
  updateCheckin,
  deleteCheckin,
} from "../../../services/wellnessService";
import {
  Card,
  SectionHeader,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  ScaleRating,
  MoodPicker,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  InfoNote,
} from "./ui";
import { MOOD_LABELS, friendlyDate, todayISO } from "./studioUtils";

const MOOD_SCORE = { great: 5, good: 4, neutral: 3, low: 2, stressed: 1 };

const SCALE_LABELS = ["Low", "2", "3", "4", "High"];

function CheckinForm({ existing, onSaved, onCancel }) {
  const [mood, setMood] = useState(existing?.mood || "");
  const [energy, setEnergy] = useState(existing?.energy ?? null);
  const [stress, setStress] = useState(existing?.stress ?? null);
  const [sleepQuality, setSleepQuality] = useState(existing?.sleepQuality ?? null);
  const [generalWellbeing, setGeneralWellbeing] = useState(existing?.generalWellbeing ?? null);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [date, setDate] = useState(existing?.date || todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateMood = (v) => { setMood(v); };
  const updateEnergy = (v) => { setEnergy(v); };
  const updateStress = (v) => { setStress(v); };
  const updateSleepQuality = (v) => { setSleepQuality(v); };
  const updateGeneralWellbeing = (v) => { setGeneralWellbeing(v); };
  const updateNotes = (v) => { setNotes(v); };
  const updateDate = (v) => { setDate(v); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      date,
      mood: mood || "",
      energy: energy != null ? Number(energy) : null,
      stress: stress != null ? Number(stress) : null,
      sleepQuality: sleepQuality != null ? Number(sleepQuality) : null,
      generalWellbeing: generalWellbeing != null ? Number(generalWellbeing) : null,
      notes,
    };
    try {
      if (existing?._id) {
        await updateCheckin(existing._id, payload);
        toast.success("Check-in updated");
      } else {
        await saveCheckin(payload);
        toast.success("Check-in saved");
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your check-in. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const nothingChosen =
    !mood && energy == null && stress == null && sleepQuality == null && generalWellbeing == null && !notes.trim();

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#1E1B18]">
              {existing?._id ? "Edit your check-in" : "Today's check-in"}
            </h3>
            <p className="mt-0.5 text-xs text-[#78726B]">
              Fill in what you feel like — everything is optional. Takes under a minute.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#4F4A45]">
            Date
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => updateDate(e.target.value)}
              className="rounded-lg border border-[#EDE6E2] bg-white px-3 py-2 text-xs text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
            />
          </label>
        </div>

        <MoodPicker value={mood} onChange={updateMood} />

        <div className="grid gap-3 sm:grid-cols-2">
          <ScaleRating id="energy" legend="Energy" labels={SCALE_LABELS} value={energy} onChange={updateEnergy} />
          <ScaleRating id="stress" legend="Stress" labels={SCALE_LABELS} value={stress} onChange={updateStress} />
          <ScaleRating id="sleepq" legend="Sleep quality" labels={SCALE_LABELS} value={sleepQuality} onChange={updateSleepQuality} />
          <ScaleRating id="wellbeing" legend="General wellbeing" labels={SCALE_LABELS} value={generalWellbeing} onChange={updateGeneralWellbeing} />
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-[#4F4A45]">
            Notes <span className="font-normal text-[#A19B93]">(only you can see these)</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => updateNotes(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Anything worth remembering about today?"
            className="mt-1.5 w-full resize-y rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder:text-[#A19B93] focus:border-[#8C3737] focus:outline-none"
          />
        </label>

        <ErrorNote message={error} />

        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton type="submit" disabled={saving || nothingChosen}>
            {saving ? "Saving..." : existing?._id ? "Update check-in" : "Save check-in"}
          </PrimaryButton>
          {existing?._id && (
            <SecondaryButton onClick={onCancel}>Cancel edit</SecondaryButton>
          )}
          {nothingChosen && (
            <span className="text-xs text-[#A19B93]">Pick at least one thing to save.</span>
          )}
        </div>
      </form>
    </Card>
  );
}

function TrendsChart({ checkins }) {
  const [range, setRange] = useState(7);

  // Ascending order for charting; user-entered values only.
  const data = useMemo(() => {
    return [...checkins]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-range)
      .map((c) => ({
        date: friendlyDate(c.date),
        mood: MOOD_SCORE[c.mood] ?? null,
        energy: c.energy ?? null,
        sleep: c.sleepQuality ?? null,
        stress: c.stress ?? null,
      }));
  }, [checkins, range]);

  if (checkins.length < 3) {
    return (
      <Card>
        <h3 className="font-serif text-base font-bold text-[#1E1B18]">Trends</h3>
        <p className="mt-1 text-xs text-[#78726B]">
          Charts appear once you have at least 3 check-ins — your entries are never
          invented or filled in for you.
        </p>
        <div className="mt-3 text-xs text-[#A19B93]">You have {checkins.length} so far.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#1E1B18]">
            <TrendingUp className="h-4 w-4 text-[#8C3737]" aria-hidden="true" />
            Your trends
          </h3>
          <p className="mt-0.5 text-xs text-[#78726B]">
            Ratings you recorded, on a 1–5 scale.
          </p>
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Chart range">
          {[7, 14, 30].map((n) => (
            <button
              key={n}
              onClick={() => setRange(n)}
              aria-pressed={range === n}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                range === n
                  ? "border-[#8C3737] bg-[#8C3737] text-white"
                  : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
              }`}
            >
              {n} days
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE6E2" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#78726B" }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#78726B" }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #EDE6E2", fontSize: 12 }}
              labelStyle={{ color: "#1E1B18" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="mood" name="Mood" stroke="#8C3737" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="energy" name="Energy" stroke="#A8483B" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="sleep" name="Sleep quality" stroke="#286646" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="stress" name="Stress" stroke="#A85C12" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function CheckinsSection() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCheckins(30);
      setCheckins(data.checkins || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your check-ins.");
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

  const todayStr = todayISO();
  const existingToday = checkins.find((c) => c.date === todayStr) || null;
  const editing = editingId ? checkins.find((c) => c._id === editingId) : null;

  const handleDelete = async (id) => {
    try {
      await deleteCheckin(id);
      toast.success("Check-in deleted");
      if (editingId === id) setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Personal Wellness Tracker"
        subtitle="A quick daily check-in, your history, and trends from what you actually recorded."
      />

      {editing ? (
        <CheckinForm
          key={editing._id}
          existing={editing}
          onSaved={() => {
            setEditingId(null);
            void load();
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <CheckinForm
          key="today-checkin-form"
          existing={existingToday}
          onSaved={() => void load()}
        />
      )}

      {loading ? (
        <LoadingBlock label="Loading your history..." />
      ) : error ? (
        <Card>
          <ErrorNote message={error} onRetry={load} />
        </Card>
      ) : checkins.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No check-ins yet"
          message="Your history will appear here after your first check-in. Nothing is shown until you record it."
        />
      ) : (
        <>
          <TrendsChart checkins={checkins} />

          <Card>
            <h3 className="font-serif text-base font-bold text-[#1E1B18]">History</h3>
            <p className="mt-0.5 text-xs text-[#78726B]">
              Your entries, newest first. You can edit or delete any of them.
            </p>
            <ul className="mt-4 divide-y divide-[#EDE6E2]">
              {checkins.map((c) => (
                <li key={c._id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#1E1B18]">{friendlyDate(c.date)}</span>
                      {c.mood && (
                        <span className="rounded-full bg-[#F6EFEA] px-2.5 py-0.5 text-[11px] font-semibold text-[#8C3737]">
                          {MOOD_LABELS[c.mood] || c.mood}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#78726B]">
                      {c.energy != null && <span>Energy {c.energy}/5</span>}
                      {c.stress != null && <span>Stress {c.stress}/5</span>}
                      {c.sleepQuality != null && <span>Sleep {c.sleepQuality}/5</span>}
                      {c.generalWellbeing != null && <span>Wellbeing {c.generalWellbeing}/5</span>}
                    </div>
                    {c.notes && (
                      <p className="mt-1 max-w-2xl whitespace-pre-wrap text-xs italic text-[#4F4A45]">
                        “{c.notes}”
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <SecondaryButton
                      onClick={() => {
                        setEditingId(c._id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="min-h-9 px-3 py-1.5 text-xs"
                      icon={Pencil}
                    >
                      Edit
                    </SecondaryButton>
                    <DangerButton onClick={() => handleDelete(c._id)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                    </DangerButton>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <InfoNote>
        Check-ins are private to your account. Nothing here is shared with other
        users or community features.
      </InfoNote>
    </div>
  );
}
