import { motion } from "framer-motion";

function QuoteBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto mt-4 mb-16 w-11/12 max-w-4xl rounded-xl border border-[#EDE6E2] bg-[#F6EFEA] p-5 sm:p-6 shadow-xs text-center"
    >
      <p className="font-serif text-base sm:text-lg italic text-[#8C3737] tracking-wide">
        &ldquo;Confidence is the most beautiful thing a woman can wear.&rdquo;
      </p>
    </motion.div>
  );
}

export default QuoteBanner;