import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ArrowRight, HeartPulse } from "lucide-react";

function WellnessCard({
  title,
  description,
  category,
  image,
  alt,
  isFavorite,
  onToggleFavorite,
  onReadMore,
  themeColor = "text-[#1E1B18]",
  buttonClass = "border-[#EDE6E2] text-[#1E1B18] hover:bg-[#F6EFEA]",
  badgeClass = "bg-[#F6EFEA] text-[#8C3737]",
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col justify-between h-full rounded-xl border border-[#EDE6E2] bg-white shadow-xs overflow-hidden transition-all duration-300 hover:border-[#8C3737]/40 hover:shadow-md"
    >
      {/* Top Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-[#F6EFEA] border-b border-[#EDE6E2]">
        {image && !imgError ? (
          <img
            src={image}
            alt={alt || title}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#F6EFEA] to-[#FAF8F6] p-4 text-[#8C3737]">
            <HeartPulse className="h-10 w-10 opacity-70" />
            <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#78726B]">
              Clinical Protocol
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {/* Category Badge */}
          {category && (
            <div className="mb-2.5">
              <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                {category}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className={`font-serif text-lg font-bold tracking-tight ${themeColor}`}>
            {title}
          </h2>

          {/* Description */}
          <p className="mt-2 text-xs leading-relaxed text-[#4F4A45]">
            {description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-[#EDE6E2]">
          <button
            onClick={onReadMore}
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${buttonClass}`}
          >
            Review Protocol
            <ArrowRight className="h-3.5 w-3.5 text-[#8C3737] transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={onToggleFavorite}
            type="button"
            className="rounded-lg border border-[#EDE6E2] p-2 text-[#78726B] transition hover:bg-[#F6EFEA] hover:text-[#8C3737] cursor-pointer"
            aria-label={`Favorite ${title}`}
            title={isFavorite ? "Remove from favorites" : "Save to favorites"}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorite ? "fill-[#8C3737] text-[#8C3737]" : "currentColor"
              }`}
            />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default WellnessCard;

