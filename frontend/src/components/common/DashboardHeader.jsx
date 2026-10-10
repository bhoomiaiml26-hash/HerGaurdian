import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";

function DashboardHeader({ user }) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
            {greeting}, {user?.name || "Member"}
          </h1>
          <p className="mt-1 text-sm text-[#4F4A45]">
            Real-time safety status, health metrics, and emergency contacts overview.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] px-3 py-1.5 text-xs font-medium text-[#4F4A45]">
          <span className="flex h-2 w-2 rounded-full bg-[#286646]" />
          <ShieldCheck className="h-3.5 w-3.5 text-[#286646]" />
          <span>Protection Network Active</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;