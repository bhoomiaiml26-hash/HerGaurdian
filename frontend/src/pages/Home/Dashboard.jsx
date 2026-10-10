import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  TrendingUp,
  Heart,
  Bookmark,
  Phone,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { getDashboardAnalytics } from "../../services/analyticsService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import DashboardHeader from "../../components/common/DashboardHeader";
import QuoteOfTheDayWidget from "../../components/common/QuoteOfTheDayWidget";
import DashboardCards from "../../components/common/DashboardCards";

const PALETTE_COLORS = ["#8C3737", "#A8483B", "#66222F", "#286646", "#A85C12", "#4F4A45"];

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load telemetry data.");
      toast.error("Telemetry fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F7] p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <LoadingSpinner label="Loading telemetry and safety overview..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FBF9F7] p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-[#BA2626]/20 bg-[#FDF2F2] p-6 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-[#BA2626]" />
            <div>
              <p className="font-semibold text-[#BA2626] text-sm">{error}</p>
              <button
                onClick={loadAnalytics}
                className="mt-2.5 rounded-lg bg-[#BA2626] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#9B1C1C]"
              >
                Retry Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    dashboard,
    charts: { favoritesByModule, remindersByCategory } = {},
    recentActivity,
  } = analytics || {};

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <DashboardHeader user={user} />

        {/* Quick Quote / Reflection */}
        <QuoteOfTheDayWidget />

        {/* Statistics Metric Cards */}
        <div>
          <h2 className="font-serif text-lg font-semibold text-[#1E1B18] mb-4">
            Core Operational Metrics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Phone, label: "Emergency Contacts", value: dashboard?.totalEmergencyContacts || 0, urgent: true },
              { icon: Heart, label: "Scheduled Reminders", value: dashboard?.totalReminders || 0 },
              { icon: Bookmark, label: "Saved Library Items", value: dashboard?.totalSavedTips || 0 },
              { icon: TrendingUp, label: "Favorited Insights", value: dashboard?.totalFavorites || 0 },
              { icon: MessageSquare, label: "AI Safety Queries", value: dashboard?.totalChatMessages || 0 },
              { icon: UserCheck, label: "Profile Verification", value: `${dashboard?.profileCompletion || 0}%` },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-5 transition-all shadow-xs ${
                    stat.urgent
                      ? "border-[#BA2626]/30 bg-white hover:border-[#BA2626]"
                      : "border-[#EDE6E2] bg-white hover:border-[#8C3737]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#78726B]">{stat.label}</p>
                      <p className="mt-1 font-serif text-2xl font-bold text-[#1E1B18]">{stat.value}</p>
                    </div>
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        stat.urgent
                          ? "bg-[#FDF2F2] text-[#BA2626]"
                          : "bg-[#F6EFEA] text-[#8C3737]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Navigation Cards */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-lg font-semibold text-[#1E1B18]">
              Platform Modules
            </h2>
            <span className="text-xs text-[#78726B]">Direct Access</span>
          </div>
          <DashboardCards />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
            <h3 className="font-serif text-base font-semibold text-[#1E1B18] mb-4">Saved Resources by Domain</h3>
            {favoritesByModule && favoritesByModule.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={favoritesByModule}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {favoritesByModule.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg bg-[#FBF9F7] border border-dashed border-[#EDE6E2]">
                <p className="text-xs text-[#78726B]">No saved resources logged yet</p>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
            <h3 className="font-serif text-base font-semibold text-[#1E1B18] mb-4">Scheduled Reminders by Category</h3>
            {remindersByCategory && remindersByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={remindersByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE6E2" />
                  <XAxis dataKey="name" stroke="#78726B" fontSize={11} />
                  <YAxis stroke="#78726B" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8C3737" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg bg-[#FBF9F7] border border-dashed border-[#EDE6E2]">
                <p className="text-xs text-[#78726B]">No active category reminders</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Telemetry & Activity Feed */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Reminders */}
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
            <h3 className="font-serif text-base font-semibold text-[#1E1B18] mb-4">Upcoming Schedule</h3>
            <div className="space-y-2.5">
              {recentActivity?.reminders && recentActivity.reminders.length > 0 ? (
                recentActivity.reminders.map((reminder) => (
                  <div key={reminder._id} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs text-[#1E1B18]">{reminder.title}</p>
                      <p className="text-[11px] text-[#78726B] mt-0.5">
                        {reminder.category}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#8C3737]">{reminder.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#78726B]">No scheduled tasks logged.</p>
              )}
            </div>
          </div>

          {/* Recent Bookmarks */}
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
            <h3 className="font-serif text-base font-semibold text-[#1E1B18] mb-4">Recent Bookmarks</h3>
            <div className="space-y-2.5">
              {recentActivity?.favorites && recentActivity.favorites.length > 0 ? (
                recentActivity.favorites.map((favorite) => (
                  <div key={favorite._id} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3">
                    <p className="font-medium text-xs text-[#1E1B18]">{favorite.title}</p>
                    <p className="text-[11px] text-[#78726B] mt-0.5">{favorite.category}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#78726B]">No bookmarks saved recently.</p>
              )}
            </div>
          </div>
        </div>

        {/* Member Profile Summary */}
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
          <h3 className="font-serif text-base font-semibold text-[#1E1B18] mb-4">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">Name</p>
              <p className="mt-1 text-sm font-semibold text-[#1E1B18]">{user?.name || "Not provided"}</p>
            </div>
            <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">Email</p>
              <p className="mt-1 text-sm font-semibold text-[#1E1B18] truncate">{user?.email || "Not provided"}</p>
            </div>
            <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">Age</p>
              <p className="mt-1 text-sm font-semibold text-[#1E1B18]">{user?.age || "Not provided"}</p>
            </div>
            <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">Region</p>
              <p className="mt-1 text-sm font-semibold text-[#1E1B18]">{user?.country || "Not provided"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;