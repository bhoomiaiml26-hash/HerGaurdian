import { Bell, CalendarPlus, Trash2, Edit2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { createReminder, deleteReminder, getReminders, updateReminder } from "../../services/reminderService";

const categories = ["Medication", "Hydration", "Mobility / Exercise", "Rest & Recovery", "Cycle Phase", "Custom Protocol"];

const initialForm = {
  title: "",
  category: "Medication",
  time: "08:00",
  notes: "",
};

function HealthReminder() {
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReminders = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getReminders();
      setReminders(response.reminders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to retrieve scheduled reminders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReminders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    return {
      total: reminders.length,
      medicine: reminders.filter((item) => item.category === "Medication").length,
      exercise: reminders.filter((item) => item.category === "Mobility / Exercise").length,
      water: reminders.filter((item) => item.category === "Hydration").length,
    };
  }, [reminders]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    setError("");

    try {
      if (editingId) {
        await updateReminder(editingId, {
          title: form.title.trim(),
          category: form.category,
          time: form.time,
          notes: form.notes.trim(),
        });
        toast.success("Reminder updated successfully");
        setEditingId(null);
      } else {
        await createReminder({
          title: form.title.trim(),
          category: form.category,
          time: form.time,
          notes: form.notes.trim(),
        });
        toast.success("Reminder schedule created");
      }

      setForm(initialForm);
      await loadReminders();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to commit reminder schedule");
    }
  };

  const startEdit = (reminder) => {
    setEditingId(reminder._id);
    setForm({
      title: reminder.title,
      category: reminder.category,
      time: reminder.time,
      notes: reminder.notes || "",
    });
  };

  const handleDeleteReminder = async (id) => {
    try {
      await deleteReminder(id);
      toast.success("Reminder entry removed");
      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }
      await loadReminders();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove reminder");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Banner */}
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <Bell className="h-3.5 w-3.5" />
                <span>Automated Telemetry &amp; Alerts</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Health &amp; Prescription Reminders
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#4F4A45]">
                Configure time-critical dosage schedules, cycle alerts, and hydration notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Create / Edit Form */}
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#1E1B18]">
              {editingId ? "Modify Scheduled Reminder" : "Schedule New Reminder"}
            </h2>

            {error && <p className="mt-3 rounded-lg bg-[#FDF2F2] border border-[#BA2626]/20 p-3 text-xs text-[#BA2626]">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                  Protocol / Task Name
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Iron supplement (65mg)"
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] focus:border-[#8C3737] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                  Clinical Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="e.g. Take following lunch with citrus juice"
                  rows={3}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] focus:border-[#8C3737] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-[#8C3737] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
                >
                  {editingId ? "Update Schedule" : "Save Reminder"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(initialForm);
                    }}
                    className="rounded-lg border border-[#EDE6E2] px-4 py-2.5 text-xs font-semibold text-[#4F4A45] hover:bg-[#F6EFEA]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Stats & Reminders List */}
          <div className="space-y-4">
            {/* Quick Metrics */}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Active Schedules", value: stats.total },
                { label: "Medication", value: stats.medicine },
                { label: "Mobility", value: stats.exercise },
                { label: "Hydration", value: stats.water },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#EDE6E2] bg-white p-4 shadow-xs">
                  <p className="text-xs font-medium text-[#78726B]">{item.label}</p>
                  <p className="mt-1 font-serif text-xl font-bold text-[#1E1B18]">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Active Entries */}
            <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
              <h2 className="font-serif text-base font-bold text-[#1E1B18]">Scheduled Queue</h2>

              {isLoading ? (
                <LoadingSpinner label="Refreshing active reminders..." className="min-h-[160px]" />
              ) : reminders.length === 0 ? (
                <div className="mt-4 flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-[#EDE6E2] bg-[#FBF9F7] p-6 text-center">
                  <CalendarPlus className="h-6 w-6 text-[#78726B] mb-2" />
                  <p className="text-xs font-semibold text-[#1E1B18]">No active reminders configured</p>
                  <p className="mt-1 text-[11px] text-[#78726B]">Add your first medication or cycle check to enable alerts.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {reminders.map((reminder) => (
                    <div key={reminder._id} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif text-xs font-semibold text-[#1E1B18]">{reminder.title}</h3>
                            <span className="rounded bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                              {reminder.category}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-mono font-medium text-[#4F4A45]">Time: {reminder.time}</p>
                          {reminder.notes && <p className="mt-1 text-[11px] text-[#78726B]">{reminder.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(reminder)}
                            className="rounded-md p-1.5 text-[#78726B] hover:bg-white hover:text-[#1E1B18]"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(reminder._id)}
                            className="rounded-md p-1.5 text-[#78726B] hover:bg-[#FDF2F2] hover:text-[#BA2626]"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthReminder;
