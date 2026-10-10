import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import NotificationCard from "../../components/notifications/NotificationCard";
import { motion } from "framer-motion";
import { Bell, CheckCheck, RefreshCw, Search } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) console.warn("VITE_API_BASE_URL is not set. Notifications API calls will be skipped.");

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const token = localStorage.getItem("token");

  const load = useCallback(async () => {
    setLoading(true);
    if (!token || !API_BASE_URL) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const markRead = async (id) => {
    if (!token || !API_BASE_URL) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((s) => s.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id) => {
    if (!token || !API_BASE_URL) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((s) => s.filter((n) => n._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const markAll = async () => {
    if (!token || !API_BASE_URL) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || notifications.map((n) => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = notifications
    .filter((n) => {
      if (filter === "unread") return !n.read;
      if (filter === "read") return n.read;
      return true;
    })
    .filter(
      (n) =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.message.toLowerCase().includes(query.toLowerCase())
    );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <Bell className="h-3.5 w-3.5" />
                <span>Security &amp; System Alerts</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Notification Center
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#4F4A45]">
                System alerts, clinical check-ins, and scheduled reminders.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-3 py-2 text-xs font-semibold text-[#4F4A45] shadow-xs transition hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
                >
                  <CheckCheck className="h-3.5 w-3.5 text-[#286646]" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                onClick={load}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-3 py-2 text-xs font-semibold text-[#4F4A45] shadow-xs transition hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
                title="Refresh notifications"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border border-[#EDE6E2] bg-white p-1 shadow-xs">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                filter === "all"
                  ? "bg-[#8C3737] text-white shadow-xs"
                  : "text-[#78726B] hover:text-[#1E1B18]"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                filter === "unread"
                  ? "bg-[#8C3737] text-white shadow-xs"
                  : "text-[#78726B] hover:text-[#1E1B18]"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                filter === "read"
                  ? "bg-[#8C3737] text-white shadow-xs"
                  : "text-[#78726B] hover:text-[#1E1B18]"
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#78726B]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-lg border border-[#EDE6E2] bg-white py-2 pl-9 pr-3 text-xs text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
            />
          </div>
        </div>

        {/* Notification Feed */}
        {loading ? (
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-12 shadow-xs">
            <LoadingSpinner label="Synchronizing alert telemetry..." className="min-h-[25vh]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-xl border border-dashed border-[#EDE6E2] bg-white p-8 text-center shadow-xs">
            <Bell className="h-8 w-8 text-[#EDE6E2]" />
            <p className="mt-3 font-serif text-base font-bold text-[#1E1B18]">
              {query ? "No Matching Notifications" : "No Notifications on File"}
            </p>
            <p className="mt-1 text-xs text-[#78726B]">
              {query
                ? "Refine your search term to inspect system events."
                : "You are up to date. Security and wellness updates will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <NotificationCard key={n._id} n={n} onMarkRead={markRead} onDelete={remove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
