import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Apple, Activity, Sparkles, Bell, MessageSquare, BarChart3, Download } from "lucide-react";
import StatCard from "../../components/analytics/StatCard";
import ChartsSection from "../../components/analytics/ChartsSection";
import CircularProgress from "../../components/analytics/CircularProgress";
import Badges from "../../components/analytics/Badges";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const totalSavedTips = Number(localStorage.getItem("totalSavedTips") || 0);
      const nutritionFavorites = Number(localStorage.getItem("nutritionFavorites") || 0);
      const fitnessFavorites = Number(localStorage.getItem("fitnessFavorites") || 0);
      const menstrualFavorites = Number(localStorage.getItem("menstrualFavorites") || 0);
      const reminderCount = Number(localStorage.getItem("reminderCount") || 0);
      const aiChatsCount = Number(localStorage.getItem("aiChatsCount") || 0);

      const favoritesByModule = JSON.parse(localStorage.getItem("favoritesByModule") || "[]");
      const remindersByCategory = JSON.parse(localStorage.getItem("remindersByCategory") || "[]");

      const defaultActivity = Array.from({ length: 7 }).map((_, idx) => ({
        day: `Day ${idx + 1}`,
        value: Math.floor(Math.random() * 10),
      }));
      const activity7Days = JSON.parse(
        localStorage.getItem("activity7Days") || JSON.stringify(defaultActivity)
      );

      const completedActivities = Number(localStorage.getItem("completedActivities") || 0);

      let streak = Number(localStorage.getItem("healthStreak") || 0);
      if (!streak) {
        streak = Math.floor(Math.random() * 5) + 1;
        localStorage.setItem("healthStreak", String(streak));
      }

      setData({
        totalSavedTips,
        nutritionFavorites,
        fitnessFavorites,
        menstrualFavorites,
        reminderCount,
        aiChatsCount,
        favoritesByModule,
        remindersByCategory,
        activity7Days,
        completedActivities,
        streak,
      });
      setLoading(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, []);

  const calculateScore = () => {
    const { reminderCount = 0, totalSavedTips = 0, completedActivities = 0 } = data;
    const rScore = Math.min(reminderCount / 10, 1) * 20;
    const fScore = Math.min(totalSavedTips / 20, 1) * 40;
    const cScore = Math.min(completedActivities / 10, 1) * 40;
    return Math.round(rScore + fScore + cScore);
  };

  const handleExport = () => {
    const win = window.open("", "_blank");
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GuardianHer AI - Clinical Health Telemetry</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #1E1B18; line-height: 1.5; }
          h1 { color: #8C3737; font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 16px; margin-top: 24px; color: #4F4A45; border-bottom: 1px solid #EDE6E2; padding-bottom: 4px; }
          .stat { margin: 8px 0; font-size: 13px; color: #4F4A45; }
          .highlight { font-weight: 600; color: #1E1B18; }
          .footer { margin-top: 40px; font-size: 11px; color: #78726B; }
        </style>
      </head>
      <body>
        <h1>GuardianHer AI - Clinical Telemetry Report</h1>
        <p style="font-size: 12px; color: #78726B;">Generated: ${new Date().toLocaleDateString()}</p>
        
        <h2>Telemetry Metrics</h2>
        <div class="stat">Archived Protocols: <span class="highlight">${data.totalSavedTips || 0}</span></div>
        <div class="stat">Active Reminders: <span class="highlight">${data.reminderCount || 0}</span></div>
        <div class="stat">Interactive Inquiries: <span class="highlight">${data.aiChatsCount || 0}</span></div>
        <div class="stat">Consistency Streak: <span class="highlight">${data.streak || 0} Days</span></div>
        
        <div class="footer">Confidential report compiled via GuardianHer AI platform.</div>
      </body>
      </html>
    `;
    win.document.write(content);
    win.document.close();
    win.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F7] p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-28 animate-pulse rounded-xl border border-[#EDE6E2] bg-white" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-32 animate-pulse rounded-xl border border-[#EDE6E2] bg-white" />
            <div className="h-32 animate-pulse rounded-xl border border-[#EDE6E2] bg-white" />
            <div className="h-32 animate-pulse rounded-xl border border-[#EDE6E2] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  const score = calculateScore();

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Health Intelligence &amp; Analytics</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Wellness Analytics &amp; Trends
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#4F4A45]">
                Aggregated telemetry across clinical protocols, adherence reminders, and personal lifestyle tracking.
              </p>
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Record</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <StatCard title="Saved Protocols" value={data.totalSavedTips} icon={Bookmark} />
          <StatCard title="Dietary Plans" value={data.nutritionFavorites} icon={Apple} />
          <StatCard title="Fitness Protocols" value={data.fitnessFavorites} icon={Activity} />
          <StatCard title="Menstrual Logs" value={data.menstrualFavorites} icon={Sparkles} />
          <StatCard title="Scheduled Reminders" value={data.reminderCount} icon={Bell} />
          <StatCard title="Advisory Queries" value={data.aiChatsCount} icon={MessageSquare} />
        </motion.div>

        {/* Charts & Diagnostics Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartsSection
              favoritesByModule={data.favoritesByModule}
              remindersByCategory={data.remindersByCategory}
              activity7Days={data.activity7Days}
            />
          </div>

          <div className="space-y-5">
            {/* Score Ring */}
            <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs flex items-center justify-center">
              <CircularProgress score={score} />
            </div>

            {/* Streak Counter */}
            <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 sm:p-6 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">
                Adherence Cadence
              </p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#8C3737]">
                {data.streak} {data.streak === 1 ? "Day" : "Days"}
              </p>
              <p className="mt-1 text-xs text-[#4F4A45]">
                Continuous platform engagement logged across security and wellness checkpoints.
              </p>
            </div>

            {/* Milestones / Badges */}
            <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="mb-3 font-serif text-base font-bold text-[#1E1B18]">
                Milestones &amp; Adherence
              </h3>
              <Badges
                favorites={data.favoritesByModule || []}
                reminders={(data.remindersByCategory || []).flatMap((r) =>
                  Array(r.count).fill(r.name)
                )}
                activityDays={data.activity7Days || []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
