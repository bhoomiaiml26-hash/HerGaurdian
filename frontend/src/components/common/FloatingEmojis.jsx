import { motion, useReducedMotion } from "framer-motion";

// Soft, slow float loop used by every emoji. Items get their own
// duration/delay/amplitude from the config so they drift out of phase.
function FloatingEmoji({ item, displayClass, reducedMotion }) {
  const {
    emoji,
    style,
    sizeClass,
    duration,
    delay,
    sway,
    drift,
    rotate,
    opacity,
  } = item;

  const className = `pointer-events-none absolute select-none ${sizeClass} ${displayClass}`;

  // Respect prefers-reduced-motion: render as a static, subtle decoration.
  if (reducedMotion) {
    return (
      <span aria-hidden="true" className={className} style={{ ...style, opacity }}>
        {emoji}
      </span>
    );
  }

  return (
    <motion.span
      aria-hidden="true"
      className={className}
      style={{ ...style, opacity }}
      initial={{ opacity: 0 }}
      animate={{
        opacity,
        y: [0, -sway, 0],
        x: [0, drift, 0],
        rotate: [0, rotate, 0],
      }}
      transition={{
        opacity: { duration: 1, ease: "easeOut" },
        y: { duration, delay, repeat: Infinity, ease: "easeInOut" },
        x: { duration, delay, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration, delay, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {emoji}
    </motion.span>
  );
}

const WELCOME_ITEMS = {
  // Full frame on large screens (xl+), where content is centered with free
  // margin on both edges. Kept to the outer 2.5–5.5% band.
  desktop: [
    { emoji: "🌸", style: { left: "3.5%", top: "11%" }, sizeClass: "text-4xl", duration: 7, delay: 0, sway: 16, drift: 10, rotate: 8, opacity: 0.5 },
    { emoji: "💗", style: { left: "5%", top: "27%" }, sizeClass: "text-3xl", duration: 8.5, delay: 1.2, sway: 14, drift: -8, rotate: -6, opacity: 0.45 },
    { emoji: "🧘‍♀️", style: { left: "2.5%", top: "45%" }, sizeClass: "text-4xl", duration: 9, delay: 0.6, sway: 18, drift: 12, rotate: 5, opacity: 0.5 },
    { emoji: "🦋", style: { left: "5.5%", top: "63%" }, sizeClass: "text-3xl", duration: 7.5, delay: 2, sway: 12, drift: -10, rotate: -8, opacity: 0.45 },
    { emoji: "💪", style: { left: "3.5%", top: "83%" }, sizeClass: "text-3xl", duration: 8, delay: 1.8, sway: 15, drift: 8, rotate: 6, opacity: 0.45 },
    { emoji: "👩‍💻", style: { right: "3.5%", top: "13%" }, sizeClass: "text-4xl", duration: 8, delay: 0.4, sway: 16, drift: -10, rotate: -7, opacity: 0.5 },
    { emoji: "✨", style: { right: "5%", top: "29%" }, sizeClass: "text-3xl", duration: 7, delay: 2.4, sway: 13, drift: 9, rotate: 8, opacity: 0.45 },
    { emoji: "🎀", style: { right: "2.5%", top: "47%" }, sizeClass: "text-4xl", duration: 9.5, delay: 1, sway: 17, drift: -12, rotate: 6, opacity: 0.5 },
    { emoji: "🌙", style: { right: "5.5%", top: "65%" }, sizeClass: "text-3xl", duration: 8, delay: 2.8, sway: 14, drift: 8, rotate: -5, opacity: 0.45 },
    { emoji: "🩷", style: { right: "3.5%", top: "85%" }, sizeClass: "text-3xl", duration: 7.5, delay: 0.8, sway: 15, drift: -8, rotate: 7, opacity: 0.5 },
  ],
  // Compact frame for tablets (md–xl), hugging the very edges.
  tablet: [
    { emoji: "🌸", style: { left: "8px", top: "12%" }, sizeClass: "text-2xl", duration: 7, delay: 0, sway: 12, drift: 6, rotate: 7, opacity: 0.4 },
    { emoji: "🦋", style: { left: "10px", top: "45%" }, sizeClass: "text-2xl", duration: 8, delay: 1.6, sway: 13, drift: -6, rotate: -6, opacity: 0.4 },
    { emoji: "💗", style: { left: "8px", top: "78%" }, sizeClass: "text-xl", duration: 7.5, delay: 0.8, sway: 11, drift: 5, rotate: 6, opacity: 0.4 },
    { emoji: "✨", style: { right: "8px", top: "14%" }, sizeClass: "text-2xl", duration: 7.5, delay: 1.2, sway: 12, drift: -6, rotate: -7, opacity: 0.4 },
    { emoji: "🎀", style: { right: "8px", top: "48%" }, sizeClass: "text-2xl", duration: 8.5, delay: 0.4, sway: 14, drift: 6, rotate: 5, opacity: 0.4 },
    { emoji: "🌙", style: { right: "8px", top: "80%" }, sizeClass: "text-xl", duration: 7, delay: 2.2, sway: 11, drift: -5, rotate: -6, opacity: 0.4 },
  ],
  // Small accents below the sticky navbar and above the footer — the free
  // corner zones on phones.
  mobile: [
    { emoji: "🌸", style: { left: "8px", top: "88px" }, sizeClass: "text-sm", duration: 6, delay: 0, sway: 8, drift: 3, rotate: 5, opacity: 0.3 },
    { emoji: "✨", style: { right: "8px", top: "104px" }, sizeClass: "text-sm", duration: 7, delay: 1.4, sway: 9, drift: -3, rotate: -6, opacity: 0.3 },
    { emoji: "💗", style: { left: "8px", bottom: "64px" }, sizeClass: "text-sm", duration: 6.5, delay: 0.8, sway: 8, drift: 3, rotate: -5, opacity: 0.3 },
    { emoji: "🌙", style: { right: "8px", bottom: "40px" }, sizeClass: "text-sm", duration: 7.5, delay: 2, sway: 9, drift: -3, rotate: 6, opacity: 0.3 },
  ],
};

const REGISTER_ITEMS = {
  // Fewer elements than the landing page so the centered form stays the focus.
  desktop: [
    { emoji: "🌸", style: { left: "4%", top: "16%" }, sizeClass: "text-4xl", duration: 7, delay: 0, sway: 16, drift: 10, rotate: 8, opacity: 0.5 },
    { emoji: "🦋", style: { left: "2.5%", top: "45%" }, sizeClass: "text-3xl", duration: 8.5, delay: 1.4, sway: 14, drift: -8, rotate: -7, opacity: 0.45 },
    { emoji: "💗", style: { left: "5%", top: "76%" }, sizeClass: "text-3xl", duration: 7.5, delay: 0.8, sway: 15, drift: 9, rotate: 6, opacity: 0.45 },
    { emoji: "✨", style: { right: "4%", top: "18%" }, sizeClass: "text-3xl", duration: 8, delay: 0.6, sway: 15, drift: -10, rotate: -8, opacity: 0.5 },
    { emoji: "🧘‍♀️", style: { right: "2.5%", top: "48%" }, sizeClass: "text-4xl", duration: 9, delay: 1, sway: 17, drift: 11, rotate: 5, opacity: 0.5 },
    { emoji: "🌷", style: { right: "5%", top: "78%" }, sizeClass: "text-3xl", duration: 7, delay: 2.2, sway: 13, drift: -8, rotate: 7, opacity: 0.45 },
  ],
  tablet: [
    { emoji: "🌸", style: { left: "10px", top: "18%" }, sizeClass: "text-2xl", duration: 7, delay: 0, sway: 12, drift: 6, rotate: 7, opacity: 0.4 },
    { emoji: "💗", style: { left: "8px", top: "72%" }, sizeClass: "text-xl", duration: 7.5, delay: 1.4, sway: 11, drift: -5, rotate: -6, opacity: 0.4 },
    { emoji: "✨", style: { right: "10px", top: "20%" }, sizeClass: "text-2xl", duration: 7.5, delay: 0.8, sway: 12, drift: -6, rotate: -7, opacity: 0.4 },
    { emoji: "🌷", style: { right: "8px", top: "74%" }, sizeClass: "text-xl", duration: 8, delay: 2, sway: 13, drift: 5, rotate: 6, opacity: 0.4 },
  ],
  // The register form fills the viewport width on phones, so these stay tiny
  // and tucked into the extreme corners (inside the page's padding gutters).
  mobile: [
    { emoji: "🌸", style: { left: "2px", top: "2px" }, sizeClass: "text-xs", duration: 6, delay: 0, sway: 8, drift: 3, rotate: 5, opacity: 0.3 },
    { emoji: "✨", style: { right: "2px", top: "2px" }, sizeClass: "text-xs", duration: 7, delay: 1.4, sway: 9, drift: -3, rotate: -6, opacity: 0.3 },
    { emoji: "💗", style: { left: "2px", bottom: "2px" }, sizeClass: "text-xs", duration: 6.5, delay: 0.8, sway: 8, drift: 3, rotate: -5, opacity: 0.3 },
    { emoji: "🌙", style: { right: "2px", bottom: "2px" }, sizeClass: "text-xs", duration: 7.5, delay: 2, sway: 9, drift: -3, rotate: 6, opacity: 0.3 },
  ],
};

function FloatingEmojis({ variant = "welcome" }) {
  const reducedMotion = useReducedMotion();
  const items = variant === "register" ? REGISTER_ITEMS : WELCOME_ITEMS;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {items.desktop.map((item, index) => (
        <FloatingEmoji
          key={`desktop-${index}`}
          item={item}
          displayClass="hidden xl:block"
          reducedMotion={reducedMotion}
        />
      ))}

      {items.tablet.map((item, index) => (
        <FloatingEmoji
          key={`tablet-${index}`}
          item={item}
          displayClass="hidden md:block xl:hidden"
          reducedMotion={reducedMotion}
        />
      ))}

      {items.mobile.map((item, index) => (
        <FloatingEmoji
          key={`mobile-${index}`}
          item={item}
          displayClass="md:hidden"
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

export default FloatingEmojis;
