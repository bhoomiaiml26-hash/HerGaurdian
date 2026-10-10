import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, BookOpen, X } from 'lucide-react';

const StoryCard = ({ story, onFavorite, isFavorited }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-white shadow-xs p-5 transition-colors hover:border-[#8C3737]/30 h-full"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="rounded-md bg-[#F6EFEA] px-2.5 py-1 text-[11px] font-semibold text-[#8C3737]">
              {story.category}
            </span>
            <button
              onClick={() => onFavorite(story.id)}
              className="rounded-lg border border-[#EDE6E2] p-1.5 text-[#78726B] hover:bg-[#F6EFEA] transition-colors"
              title={isFavorited ? "Remove from saved" : "Save story"}
            >
              <Heart
                size={16}
                className={isFavorited ? "fill-[#8C3737] text-[#8C3737]" : "currentColor"}
              />
            </button>
          </div>

          <h3 className="font-serif text-base font-semibold text-[#1E1B18] mb-2">{story.title}</h3>
          <p className="text-xs leading-relaxed text-[#4F4A45] line-clamp-3 mb-3">{story.preview}</p>
          <p className="text-[11px] text-[#78726B] italic mb-4">— {story.author}</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full rounded-lg border border-[#EDE6E2] bg-white py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA] transition-colors flex items-center justify-center gap-1.5"
        >
          <BookOpen size={14} className="text-[#8C3737]" />
          Read Full Case
        </button>
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1E1B18]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xl relative"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
            >
              <X size={18} />
            </button>

            <span className="inline-block rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737] mb-3">
              {story.category}
            </span>

            <h2 className="font-serif text-2xl font-bold text-[#1E1B18] mb-1">{story.title}</h2>
            <p className="text-xs text-[#78726B] italic mb-6">Documented by {story.author}</p>

            <div className="text-xs sm:text-sm leading-relaxed text-[#4F4A45] whitespace-pre-wrap">
              {story.fullStory}
            </div>

            <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4 my-6">
              <p className="font-serif text-xs italic text-[#1E1B18]">
                Perspective: Real adversity channeled into systemic solutions and personal independence.
              </p>
            </div>

            <div className="pt-4 border-t border-[#EDE6E2] flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-[#8C3737] px-5 py-2 text-xs font-semibold text-white hover:bg-[#752B2B]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default StoryCard;
