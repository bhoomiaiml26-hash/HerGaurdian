import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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
const Fitness = lazy(() => import("../pages/Fitness/Fitness"));
const HealthReminder = lazy(() => import("../pages/HealthReminder/HealthReminder"));
const MenstrualWellness = lazy(() => import("../pages/Menstrual Wellness/MenstrualWellness"));
const Nutrition = lazy(() => import("../pages/Nutrition/Nutrition"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Saved = lazy(() => import("../pages/Saved/Saved"));
const WomenHealth = lazy(() => import("../pages/WomenHealth/WomenHealth"));
const MentalWellness = lazy(() => import("../pages/Mental Wellness/MentalWellness"));
const Career = lazy(() => import("../pages/Career/Career"));
const Inspiration = lazy(() => import("../pages/Inspiration/Inspiration"));
const Analytics = lazy(() => import("../pages/Analytics/Analytics"));
// Symptom Checker removed
const Notifications = lazy(() => import("../pages/Notifications/Notifications"));
const Feedback = lazy(() => import("../pages/Feedback/Feedback"));
// Period Tracker and Wellness Insights removed
const CommunityHub = lazy(() => import("../pages/Community/CommunityHub"));

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
          <Route path="/fitness" element={<Suspense fallback={<RouteFallback />}><Fitness /></Suspense>} />
          <Route path="/reminder" element={<Suspense fallback={<RouteFallback />}><HealthReminder /></Suspense>} />
          <Route path="/menstrual" element={<Suspense fallback={<RouteFallback />}><MenstrualWellness /></Suspense>} />
          <Route path="/nutrition" element={<Suspense fallback={<RouteFallback />}><Nutrition /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<RouteFallback />}><Profile /></Suspense>} />
          <Route path="/saved" element={<Suspense fallback={<RouteFallback />}><Saved /></Suspense>} />
          <Route path="/health" element={<Suspense fallback={<RouteFallback />}><WomenHealth /></Suspense>} />
          <Route path="/mental" element={<Suspense fallback={<RouteFallback />}><MentalWellness /></Suspense>} />
          <Route path="/career" element={<Suspense fallback={<RouteFallback />}><Career /></Suspense>} />
          <Route path="/inspiration" element={<Suspense fallback={<RouteFallback />}><Inspiration /></Suspense>} />
          <Route path="/analytics" element={<Suspense fallback={<RouteFallback />}><Analytics /></Suspense>} />
          <Route path="/notifications" element={<Suspense fallback={<RouteFallback />}><Notifications /></Suspense>} />
          {/* Removed assistant, symptom-checker, period-tracker, and wellness-insights routes */}
          <Route path="/community" element={<Suspense fallback={<RouteFallback />}><CommunityHub /></Suspense>} />
          <Route path="/feedback" element={<Suspense fallback={<RouteFallback />}><Feedback /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<RouteFallback />}><Profile /></Suspense>} />
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