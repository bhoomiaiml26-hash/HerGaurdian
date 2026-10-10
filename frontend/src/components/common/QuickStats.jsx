import { useEffect, useState } from "react";
import { getFavorites } from "../../services/favoriteService";
import { getReminders } from "../../services/reminderService";

function QuickStats() {
  const [stats, setStats] = useState({ savedItems: 0, reminders: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [favRes, remRes] = await Promise.all([getFavorites(), getReminders()]);
        setStats({
          savedItems: (favRes.favorites || []).length,
          reminders: (remRes.reminders || []).length,
        });
      } catch {
        // Silently fail — defaults to 0
      }
    };
    loadStats();
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 text-center shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Active Modules</h3>
        <p className="font-serif text-2xl font-bold mt-2 text-[#1E1B18]">12</p>
      </div>

      <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 text-center shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Saved Protocols</h3>
        <p className="font-serif text-2xl font-bold mt-2 text-[#8C3737]">{stats.savedItems}</p>
      </div>

      <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 text-center shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Active Reminders</h3>
        <p className="font-serif text-2xl font-bold mt-2 text-[#8C3737]">{stats.reminders}</p>
      </div>

      <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 text-center shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">System Status</h3>
        <p className="font-serif text-base font-bold mt-2 text-[#286646]">Operational</p>
      </div>
    </div>
  );
}

export default QuickStats;