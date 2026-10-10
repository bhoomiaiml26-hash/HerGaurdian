import { motion } from "framer-motion";
import {
  Heart,
  Sparkles,
  Apple,
  Dumbbell,
  Brain,
  GraduationCap,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Women's Health",
    description: "Personalized guidance for a healthier and happier life.",
  },
  {
    icon: Sparkles,
    title: "Menstrual Wellness",
    description: "Understand your cycle with confidence, care, and awareness.",
  },
  {
    icon: Apple,
    title: "Nutrition",
    description: "Healthy meals, recipes, and balanced nutrition plans.",
  },
  {
    icon: Dumbbell,
    title: "Fitness",
    description: "Exercise routines designed for every woman and every goal.",
  },
  {
    icon: Brain,
    title: "Mental Wellness",
    description: "Support your emotional well-being with AI-powered guidance.",
  },
  {
    icon: GraduationCap,
    title: "Career & Scholarships",
    description: "Career advice, learning resources, and scholarships for women.",
  },
  {
    icon: Users,
    title: "Community & Rights",
    description: "Legal guidance, action plans, complaint builder, and verified support resources.",
  },
];

function WomenIllustration() {
  return (
    <section id="features" className="px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center font-serif text-3xl font-bold tracking-tight text-[#8C3737] sm:text-4xl">
          Empowering Every Chapter of Her Journey
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-center font-sans text-base leading-relaxed text-[#4F4A45] sm:text-lg">
          Everything you need to support your health, confidence, education, wellness, and personal
          growth — thoughtfully brought together in one intelligent platform.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs transition hover:border-[#8C3737]/30 hover:shadow-sm"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mb-2.5 font-serif text-lg font-bold text-[#1E1B18]">
                  {feature.title}
                </h3>

                <p className="font-sans text-sm leading-relaxed text-[#4F4A45]">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WomenIllustration;