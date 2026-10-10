import { Award } from "lucide-react";

const predefinedBadges = [
  { id: "first-fav", label: "First Bookmark", desc: "Saved your first wellness record" },
  { id: "healthy-eater", label: "Dietary Focus", desc: "Archived clinical nutrition plans" },
  { id: "fitness-lover", label: "Active Protocol", desc: "Maintained fitness routines" },
  { id: "consistent-user", label: "7-Day Cadence", desc: "Continuous 7+ days activity" },
  { id: "reminder-master", label: "Alert Vigilance", desc: "Set 5+ scheduled reminders" },
];

const Badges = ({ favorites = [], reminders = [], activityDays = [] }) => {
  const unlocked = new Set();
  if (favorites.length > 0) unlocked.add("first-fav");
  if (favorites.some((f) => f.category === "Nutrition")) unlocked.add("healthy-eater");
  if (favorites.some((f) => f.category === "Fitness")) unlocked.add("fitness-lover");
  if (activityDays.length >= 7) unlocked.add("consistent-user");
  if (reminders.length >= 5) unlocked.add("reminder-master");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {predefinedBadges.map((b) => {
        const isUnlocked = unlocked.has(b.id);
        return (
          <div
            key={b.id}
            className={`rounded-lg border p-3 transition ${
              isUnlocked
                ? "border-[#EDE6E2] bg-white shadow-2xs"
                : "border-[#EDE6E2]/60 bg-[#FBF9F7] opacity-60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  isUnlocked
                    ? "bg-[#F6EFEA] text-[#8C3737] border border-[#8C3737]/20"
                    : "bg-[#EDE6E2] text-[#78726B]"
                }`}
              >
                {isUnlocked ? <Award className="h-4 w-4" /> : b.label.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#1E1B18]">{b.label}</p>
                <p className="truncate text-[11px] text-[#78726B]">{b.desc}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Badges;
