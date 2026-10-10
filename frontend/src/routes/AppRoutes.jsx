import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SkeletonCard from "../components/common/SkeletonCard";
import DashboardLayout from "../layouts/DashboardLayout";
import RequireAuth from "../components/common/RequireAuth";

const Welcome = lazy(() => import("../pages/Authentication/Welcome"));
const Register = lazy(() => import("../pages/Authentication/Register"));
const Login = lazy(() => import("../pages/Authentication/Login"));
const ForgotPassword = lazy(() => import("../pages/Authentication/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/Authentication/ResetPassword"));
// AI Assistant removed
const Dashboard = lazy(() => import("../pages/Home/Dashboard"));
const EmergencySOS = lazy(() => import("../pages/EmergencySOS/EmergencySOS"));
const SafeRoute = lazy(() => import("../pages/SafeRoute/SafeRoute"));
const DigitalSafetyAnalyzer = lazy(() => import("../pages/DigitalSafetyAnalyzer/DigitalSafetyAnalyzer"));
const WellnessHub = lazy(() => import("../pages/WellnessHub/WellnessHub"));
const HealthReminder = lazy(() => import("../pages/HealthReminder/HealthReminder"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Saved = lazy(() => import("../pages/Saved/Saved"));
const Career = lazy(() => import("../pages/Career/Career"));
const Analytics = lazy(() => import("../pages/Analytics/Analytics"));
// Notifications removed
const Feedback = lazy(() => import("../pages/Feedback/Feedback"));
// Period Tracker and Wellness Insights removed
const CommunityHub = lazy(() => import("../pages/Community/CommunityHub"));
const FinancialCoach = lazy(() => import("../pages/FinancialCoach/FinancialCoach"));
const FootprintScanner = lazy(() => import("../pages/FootprintScanner/FootprintScanner"));

// Old static Wellness Hub tab pages removed from the bundle:
// WomenHealth, MenstrualWellness, Fitness, MentalWellness, Nutrition.
// Their videos and useful guidance live on inside the studio sections.

function AppRoutesContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Pages */}
        <Route path="/" element={<Suspense fallback={<RouteFallback />}><Welcome /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<RouteFallback />}><Register /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<RouteFallback />}><Login /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<RouteFallback />}><ForgotPassword /></Suspense>} />
        <Route path="/reset-password/:token" element={<Suspense fallback={<RouteFallback />}><ResetPassword /></Suspense>} />

        {/* Private Dashboard Shell Routes */}
        <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Suspense fallback={<RouteFallback />}><Dashboard /></Suspense>} />
          <Route path="/emergency" element={<Suspense fallback={<RouteFallback />}><EmergencySOS /></Suspense>} />
          <Route path="/safe-route" element={<Suspense fallback={<RouteFallback />}><SafeRoute /></Suspense>} />
          <Route path="/safety-analyzer" element={<Suspense fallback={<RouteFallback />}><DigitalSafetyAnalyzer /></Suspense>} />
          <Route path="/wellness" element={<Suspense fallback={<RouteFallback />}><WellnessHub /></Suspense>} />
          <Route path="/reminder" element={<Suspense fallback={<RouteFallback />}><HealthReminder /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<RouteFallback />}><Profile /></Suspense>} />
          <Route path="/saved" element={<Suspense fallback={<RouteFallback />}><Saved /></Suspense>} />
          <Route path="/career" element={<Suspense fallback={<RouteFallback />}><Career /></Suspense>} />
          <Route path="/inspiration" element={<Navigate to="/community" replace />} />
          <Route path="/analytics" element={<Suspense fallback={<RouteFallback />}><Analytics /></Suspense>} />
          <Route path="/notifications" element={<Navigate to="/dashboard" replace />} />
          {/* Removed assistant, symptom-checker, period-tracker, and wellness-insights routes */}
          <Route path="/community" element={<Suspense fallback={<RouteFallback />}><CommunityHub /></Suspense>} />
          <Route path="/feedback" element={<Suspense fallback={<RouteFallback />}><Feedback /></Suspense>} />
          <Route path="/financial-coach" element={<Suspense fallback={<RouteFallback />}><FinancialCoach /></Suspense>} />
          <Route path="/footprint-scanner" element={<Suspense fallback={<RouteFallback />}><FootprintScanner /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<RouteFallback />}><Profile /></Suspense>} />

          {/* Redirects from old wellness routes to the new Wellness Studio */}
          <Route path="/health" element={<Navigate to="/wellness?section=today" replace />} />
          <Route path="/menstrual" element={<Navigate to="/wellness?section=cycle" replace />} />
          <Route path="/nutrition" element={<Navigate to="/wellness?section=nutrition-ai" replace />} />
          <Route path="/fitness" element={<Navigate to="/wellness?section=movement" replace />} />
          <Route path="/mental" element={<Navigate to="/wellness?section=reset" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#FBF9F7] p-6 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-2xl border border-[#EDE6E2] bg-white p-8 shadow-xs">
        <LoadingSpinner label="Loading module..." />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AppRoutesContent />
    </BrowserRouter>
  );
}

export default AppRoutes;