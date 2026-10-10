import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Sparkles,
  Apple,
  Activity,
  Brain,
  GraduationCap,
  BookOpen,
  ShieldAlert,
  Bell,
  Bookmark,
  MessageSquareHeart,
  ArrowRight
} from "lucide-react";

const cards = [
  {
    title: "Emergency SOS",
    description: "Rapid dispatch to trusted contacts and national helplines.",
    icon: ShieldAlert,
    route: "/emergency",
    isUrgent: true,
  },
  {
    title: "Women's Health",
    description: "Clinical health insights and preventative care reminders.",
    icon: HeartPulse,
    route: "/health",
  },
  {
    title: "Menstrual Cycle",
    description: "Hormonal phase tracking, prediction, and pattern analysis.",
    icon: Sparkles,
    route: "/menstrual",
  },
  {
    title: "Clinical Nutrition",
    description: "Personalized dietary planning and hormonal balance support.",
    icon: Apple,
    route: "/nutrition",
  },
  {
    title: "Functional Fitness",
    description: "Targeted exercise routines adapted to your daily energy.",
    icon: Activity,
    route: "/fitness",
  },
  {
    title: "Mental Wellbeing",
    description: "Cognitive support tools, de-escalation, and mindfulness.",
    icon: Brain,
    route: "/mental",
  },
  {
    title: "Grants & Fellowships",
    description: "Verified scholarships, grants, and career accelerator links.",
    icon: GraduationCap,
    route: "/career",
  },
  {
    title: "Safety & Legal Library",
    description: "Advocacy resources, legal guides, and leadership reads.",
    icon: BookOpen,
    route: "/inspiration",
  },
  {
    title: "Health Reminders",
    description: "Automated medication, hydration, and screening alerts.",
    icon: Bell,
    route: "/reminder",
  },
  {
    title: "Saved Items",
    description: "Your bookmarked clinical guides and legal resources.",
    icon: Bookmark,
    route: "/saved",
  },
  {
    title: "Feedback & Audit",
    description: "Submit feedback and report emergency response accuracy.",
    icon: MessageSquareHeart,
    route: "/feedback",
  },
];

function DashboardCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          >
            <Link
              to={card.route}
              className={`group flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 h-full min-h-[190px] ${
                card.isUrgent
                  ? "border-[#BA2626]/30 bg-[#FDF2F2] hover:border-[#BA2626] shadow-xs"
                  : "border-[#EDE6E2] bg-white hover:border-[#8C3737]/40 hover:shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                      card.isUrgent
                        ? "bg-[#BA2626] text-white"
                        : "bg-[#F6EFEA] text-[#8C3737] group-hover:bg-[#8C3737] group-hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {card.isUrgent && (
                    <span className="rounded-md bg-[#BA2626]/10 px-2 py-0.5 text-[11px] font-semibold text-[#BA2626]">
                      High Priority
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-serif text-base font-semibold text-[#1E1B18]">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#4F4A45]">
                  {card.description}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#8C3737] group-hover:underline">
                <span>Access Module</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

export default DashboardCards;