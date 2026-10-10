import { motion } from "framer-motion";
import {
  BadgeCheck,
  Settings,
  UserRound,
  ArrowRight,
  LayoutDashboard,
  ShieldAlert,
  MapPin,
  ShieldCheck,
  ScanSearch,
  HeartPulse,
  GraduationCap,
  Wallet,
  Users,
  TrendingUp,
  Bell,
  Bookmark,
  MessageSquareHeart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { getProfile } from "../../services/authService";
import { getFavorites } from "../../services/favoriteService";
import { getReminders } from "../../services/reminderService";

const defaultUser = {
  name: "Asha Sharma",
  age: 28,
  country: "India",
  profession: "Product Designer",
  avatar: "",
};

const navigationItems = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Emergency SOS", path: "/emergency", icon: ShieldAlert },
  { label: "Safe Route", path: "/safe-route", icon: MapPin },
  { label: "Digital Safety Analyzer", path: "/safety-analyzer", icon: ShieldCheck },
  { label: "Footprint Scanner", path: "/footprint-scanner", icon: ScanSearch },
  { label: "Wellness Hub", path: "/wellness", icon: HeartPulse },
  { label: "Career & Grants", path: "/career", icon: GraduationCap },
  { label: "Financial Coach", path: "/financial-coach", icon: Wallet },
  { label: "Community & Rights", path: "/community", icon: Users },
  { label: "Analytics", path: "/analytics", icon: TrendingUp },
  { label: "Reminders", path: "/reminder", icon: Bell },
  { label: "Saved Resources", path: "/saved", icon: Bookmark },
  { label: "Feedback", path: "/feedback", icon: MessageSquareHeart },
];

function Profile() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : defaultUser;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(defaultUser);

  const [counts, setCounts] = useState({
    savedTips: 0,
    healthReminders: 0,
    healthFavorites: 0,
    nutritionFavorites: 0,
    fitnessFavorites: 0,
    menstrualFavorites: 0,
  });

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const stats = useMemo(
    () => [
      { label: "Saved Items", value: counts.savedTips },
      { label: "Health Reminders", value: counts.healthReminders },
      { label: "Health Favorites", value: counts.healthFavorites },
      { label: "Nutrition Saves", value: counts.nutritionFavorites },
      { label: "Fitness Saves", value: counts.fitnessFavorites },
      { label: "Cycle Saves", value: counts.menstrualFavorites },
    ],
    [counts]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(true);

      (async () => {
        try {
          const profileRes = await getProfile();
          if (profileRes?.user) {
            setUser((prev) => ({ ...prev, ...profileRes.user }));
            setForm((prev) => ({ ...prev, ...profileRes.user }));
          }

          const favResponse = await getFavorites();
          const favs = favResponse.favorites || [];
          const remResponse = await getReminders();
          const rems = remResponse.reminders || [];

          setCounts({
            savedTips: favs.length,
            healthReminders: rems.length,
            healthFavorites: favs.filter((f) => f.source === "health" || f.source === "general").length,
            nutritionFavorites: favs.filter((f) => f.source === "nutrition").length,
            fitnessFavorites: favs.filter((f) => f.source === "fitness").length,
            menstrualFavorites: favs.filter((f) => f.source === "menstrual").length,
          });
        } catch (error) {
          toast.error(error.response?.data?.message || "Unable to load profile stats");
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveProfile = (event) => {
    event.preventDefault();
    setUser(form);
    localStorage.setItem("user", JSON.stringify(form));
    setIsEditing(false);
    toast.success("Profile updated");
  };

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <BadgeCheck className="h-3.5 w-3.5" />
                <span>Member Profile</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Profile &amp; Settings
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#4F4A45]">
                Manage your personal information and review your wellness activity.
              </p>
            </div>
            <div className="rounded-lg border border-[#EDE6E2] p-2.5 text-[#78726B]">
              <Settings className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Identity Card */}
            <section className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F6EFEA] text-[#8C3737]">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <UserRound className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-[#1E1B18]">{user.name}</h2>
                    <p className="text-xs text-[#78726B]">{user.profession || "Member"}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setForm({ ...user });
                    setIsEditing(true);
                  }}
                  className="rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#752B2B]"
                >
                  Edit Profile
                </button>
              </div>

              {isLoading && (
                <p className="mt-4 text-xs text-[#78726B]">Loading profile data…</p>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Name", value: user.name },
                  { label: "Age", value: user.age },
                  { label: "Country", value: user.country },
                  { label: "Profession", value: user.profession },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-[#1E1B18]">{item.value || "Not set"}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Activity Statistics */}
            <section className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
              <h2 className="font-serif text-base font-semibold text-[#1E1B18] mb-4">Activity Overview</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78726B]">{item.label}</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-[#1E1B18]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div>
            <section className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base font-semibold text-[#1E1B18]">
                    Quick Navigation
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#78726B]">
                    Direct shortcuts to all active safety & wellness modules
                  </p>
                </div>
                <span className="rounded-full bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                  {navigationItems.length} Modules
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 max-h-[490px] overflow-y-auto pr-1.5">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="group flex items-center justify-between rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3.5 py-2.5 text-xs font-medium text-[#4F4A45] transition hover:border-[#8C3737]/30 hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#8C3737] shadow-2xs group-hover:bg-[#8C3737] group-hover:text-white transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#78726B] group-hover:text-[#8C3737] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1B18]/60 backdrop-blur-xs px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#EDE6E2] pb-4">
              <h3 className="font-serif text-lg font-bold text-[#1E1B18]">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg p-1.5 text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              {[
                { label: "Name", name: "name", type: "text" },
                { label: "Age", name: "age", type: "number" },
                { label: "Country", name: "country", type: "text" },
                { label: "Profession", name: "profession", type: "text" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EDE6E2]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-[#EDE6E2] px-4 py-2 text-xs font-semibold text-[#4F4A45] hover:bg-[#F6EFEA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white hover:bg-[#752B2B]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Profile;
