import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  HeartPulse,
  TrendingUp,
  GraduationCap,
  ShieldAlert,
  Shield,
  Bell,
  Bookmark,
  MessageSquareHeart,
  User,
  LogOut,
  Menu,
  X,
  Plus,
  Minus,
  Users,

  MapPin,
  ShieldCheck,
  Wallet,
  ScanSearch
} from "lucide-react";
import toast from "react-hot-toast";

const navItems = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Emergency SOS", path: "/emergency", icon: ShieldAlert },
  { label: "Safe Route", path: "/safe-route", icon: MapPin },
  { label: "Digital Safety Analyzer", path: "/safety-analyzer", icon: ShieldCheck },
  { label: "Footprint Scanner",       path: "/footprint-scanner", icon: ScanSearch },
  { label: "Wellness Hub",            path: "/wellness",          icon: HeartPulse },
  { label: "Career & Grants",         path: "/career",            icon: GraduationCap },
  { label: "Financial Coach",         path: "/financial-coach",   icon: Wallet },
  { label: "Community & Rights",      path: "/community",         icon: Users },
  { label: "Analytics",               path: "/analytics",         icon: TrendingUp },
  { label: "Reminders",               path: "/reminder",          icon: Bell },
  { label: "Saved Resources",         path: "/saved",             icon: Bookmark },
  { label: "Feedback", path: "/feedback", icon: MessageSquareHeart },
  { label: "Settings & Profile", path: "/profile", icon: User },
];

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    document.documentElement.style.fontSize = `${zoomLevel}%`;
    return () => {
      document.documentElement.style.fontSize = "100%";
    };
  }, [zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 130));
    toast.success(`Display scale: ${zoomLevel + 10}%`);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 80));
    toast.success(`Display scale: ${zoomLevel - 10}%`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const currentNav = navItems.find(item => item.path === location.pathname ||
    (item.path === "/wellness" && location.pathname.startsWith("/wellness")) ||
    (item.path === "/safe-route" && location.pathname.startsWith("/safe-route")) ||
    (item.path === "/safety-analyzer" && location.pathname.startsWith("/safety-analyzer")) ||
    (item.path === "/financial-coach" && location.pathname.startsWith("/financial-coach")) ||
    (item.path === "/footprint-scanner" && location.pathname.startsWith("/footprint-scanner")) ||
    (item.path === "/community" && location.pathname.startsWith("/community"))
  );
  
  // Handle Wellness Hub, Safe Route, and Community & Rights page titles
  const getPageTitle = () => {
    if (location.pathname === "/wellness" || location.pathname.startsWith("/wellness")) {
      const searchParams = new URLSearchParams(location.search);
      const tab = searchParams.get("tab");
      const tabTitles = {
        "overview": "Wellness Hub",
        "women-health": "Women's Health",
        "menstrual": "Menstrual Cycle",
        "nutrition": "Nutrition",
        "nutrition-ai": "Nutrition AI",
        "fitness": "Fitness",
        "mental": "Mental Wellness"
      };
      return tabTitles[tab] || "Wellness Hub";
    }
    if (location.pathname === "/community" || location.pathname.startsWith("/community")) {
      const searchParams = new URLSearchParams(location.search);
      const tab = searchParams.get("tab");
      const tabTitles = {
        "dashboard": "Community & Rights Hub",
        "assistant": "Rights Action Assistant",
        "complaint": "Complaint & Letter Builder",
        "tracker": "Personal Case & Action Tracker",
        "circles": "Community Support Circles",
        "directory": "Find Help & Support Directory",
        "navigator": "Rights & Support Eligibility",
        "decoder": "Document Decoder",
        "talk": "Difficult Conversation & Letter Assistant",
        "library": "Trusted Knowledge & Resource Library"
      };
      return tabTitles[tab] || "Community & Rights";
    }
    if (location.pathname.startsWith("/safety-analyzer")) {
      return "Digital Safety Analyzer";
    }
    return currentNav?.label || "Safety & Wellness";
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F7] text-[#1E1B18]">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-[#EDE6E2] bg-white transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#EDE6E2] px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 font-serif text-lg font-bold tracking-tight text-[#1E1B18]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8C3737] text-white shadow-xs">
              <Shield className="h-4 w-4" />
            </span>
            <span>HerGuardian</span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-[#78726B] hover:bg-[#F6EFEA] md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="h-[calc(100vh-8.5rem)] overflow-y-auto px-3.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === "/wellness" && location.pathname.startsWith("/wellness")) ||
              (item.path === "/safe-route" && location.pathname.startsWith("/safe-route")) ||
              (item.path === "/safety-analyzer" && location.pathname.startsWith("/safety-analyzer")) ||
              (item.path === "/financial-coach" && location.pathname.startsWith("/financial-coach")) ||
              (item.path === "/footprint-scanner" && location.pathname.startsWith("/footprint-scanner"));
            const isEmergency = item.path === "/emergency";

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#8C3737] text-white shadow-xs"
                    : isEmergency
                    ? "text-[#BA2626] hover:bg-[#FDF2F2]"
                    : "text-[#4F4A45] hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : isEmergency ? "text-[#BA2626]" : "text-[#78726B] group-hover:text-[#1E1B18]"}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Account / Sign Out at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#EDE6E2] bg-white p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6EFEA] text-xs font-semibold text-[#8C3737]">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-[#1E1B18]">{user.name || "User"}</p>
              <p className="truncate text-[11px] text-[#78726B]">{user.email || "user@herguardian.ai"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-[#78726B] hover:bg-[#FDF2F2] hover:text-[#BA2626] transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Content Area */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#EDE6E2] bg-[#FBF9F7]/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 text-[#4F4A45] hover:bg-[#F6EFEA] md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-lg font-semibold tracking-tight text-[#1E1B18]">
              {getPageTitle()}
            </h1>
          </div>

          {/* Scale & Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-[#EDE6E2] bg-white px-2 py-1 shadow-xs">
              <button
                onClick={handleZoomOut}
                className="rounded-md p-1 text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
                title="Decrease font scale"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-xs font-medium text-[#4F4A45]">{zoomLevel}%</span>
              <button
                onClick={handleZoomIn}
                className="rounded-md p-1 text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
                title="Increase font scale"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
