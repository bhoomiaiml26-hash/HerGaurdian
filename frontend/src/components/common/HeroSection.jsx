import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col items-center justify-center px-6 pt-16 pb-6 text-center sm:px-8 sm:pt-20">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#8C3737]"
      >
        Welcome to HerGuardian AI
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-6 max-w-3xl font-sans text-base sm:text-lg md:text-xl leading-relaxed text-[#4F4A45]"
      >
        A trusted AI companion created exclusively for women — empowering every journey
        through health, wellness, education, career growth, confidence, and self-care.
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/register")}
        className="mt-8 inline-flex items-center gap-2.5 rounded-lg bg-[#8C3737] px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
      >
        <span>Get Started</span>
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </section>
  );
}

export default HeroSection;