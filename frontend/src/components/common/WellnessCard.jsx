import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";

function WellnessCard({
  title,
  description,
  category,
  image,
  isFavorite,
  onToggleFavorite,
  onReadMore,
  themeColor,
  buttonClass,
  badgeClass,
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-white shadow-xs overflow-hidden transition-colors hover:border-[#8C3737]/30"
    >
      {image && (
        <div className="overflow-hidden border-b border-[#EDE6E2]">
          <img src={image} alt={title} className="h-44 w-full object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="font-serif text-lg font-semibold text-[#1E1B18]">{title}</h2>
            <span className="shrink-0 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
              {category}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-[#4F4A45]">{description}</p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-[#EDE6E2]">
          <button
            onClick={onReadMore}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2 text-xs font-semibold text-[#1E1B18] transition hover:bg-[#F6EFEA]"
          >
            Review Protocol
            <ArrowRight className="h-3.5 w-3.5 text-[#8C3737]" />
          </button>

          <button
            onClick={onToggleFavorite}
            className="rounded-lg border border-[#EDE6E2] p-2 text-[#78726B] transition hover:bg-[#F6EFEA]"
            aria-label={`Favorite ${title}`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-[#8C3737] text-[#8C3737]" : "currentColor"}`} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default WellnessCard;
