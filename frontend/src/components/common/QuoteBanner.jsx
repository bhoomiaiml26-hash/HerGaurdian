import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { inspirationQuotes } from "../../data/inspirationQuotes";

const STORAGE_KEY = "hg_last_quote_id";

function pickQuote() {
  const quotes = inspirationQuotes;
  if (!quotes || quotes.length === 0) return null;

  let lastId = null;
  try {
    lastId = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — continue without it
  }

  // Build pool excluding the last shown quote (when pool size allows it)
  const pool =
    quotes.length > 1
      ? quotes.filter((q) => String(q.id) !== lastId)
      : quotes;

  const selected = pool[Math.floor(Math.random() * pool.length)];

  try {
    localStorage.setItem(STORAGE_KEY, String(selected.id));
  } catch {
    // Ignore write errors
  }

  return selected;
}

function QuoteBanner() {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    setQuote(pickQuote());
  }, []);

  return (
    <div className="mx-auto mt-4 mb-16 w-11/12 max-w-4xl">
      <AnimatePresence mode="wait">
        {quote && (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-xl border border-[#EDE6E2] bg-[#F6EFEA] p-5 sm:p-6 shadow-xs text-center"
          >
            <p className="font-serif text-base sm:text-lg italic text-[#8C3737] tracking-wide">
              &ldquo;{quote.text}&rdquo;
            </p>
            {quote.author && quote.author !== "Unknown" && (
              <p className="mt-2 text-xs font-medium text-[#78726B] tracking-wide">
                — {quote.author}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuoteBanner;