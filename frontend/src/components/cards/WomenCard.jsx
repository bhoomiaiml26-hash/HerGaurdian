import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, BookOpen, X } from 'lucide-react';

const WomenCard = ({ woman, onFavorite, isFavorited }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-white shadow-xs overflow-hidden transition-colors hover:border-[#8C3737]/30"
      >
        {/* Header Visual */}
        <div className="h-44 overflow-hidden relative border-b border-[#EDE6E2] bg-[#FBF9F7] flex items-center justify-center">
          {woman.image ? (
            <img src={woman.image} alt={woman.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#F6EFEA] text-[#8C3737]">
              <span className="font-serif text-4xl font-bold">{woman.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2 mb-2">
              <div>
                <h3 className="font-serif text-base font-semibold text-[#1E1B18]">{woman.name}</h3>
                <p className="text-xs font-semibold text-[#8C3737]">{woman.profession}</p>
              </div>
              <button
                onClick={() => onFavorite(woman.id)}
                className="rounded-lg border border-[#EDE6E2] p-1.5 text-[#78726B] hover:bg-[#F6EFEA] transition-colors"
                title={isFavorited ? "Remove from saved" : "Save profile"}
              >
                <Heart
                  size={16}
                  className={isFavorited ? "fill-[#8C3737] text-[#8C3737]" : "currentColor"}
                />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-[#4F4A45] line-clamp-3 mb-4">{woman.description}</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full rounded-lg border border-[#EDE6E2] bg-white py-2 text-xs font-semibold text-[#1E1B18] hover:bg-[#F6EFEA] transition-colors flex items-center justify-center gap-1.5"
          >
            <BookOpen size={14} className="text-[#8C3737]" />
            Read Biography
          </button>
        </div>
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

            <h2 className="font-serif text-2xl font-bold text-[#1E1B18]">{woman.name}</h2>
            <p className="text-xs font-semibold text-[#8C3737] mt-0.5 mb-6">{woman.profession}</p>

            <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-[#4F4A45]">
              <div>
                <h3 className="font-serif text-sm font-semibold text-[#1E1B18] mb-2">Historical Narrative</h3>
                <p>{woman.fullStory}</p>
              </div>

              <div>
                <h3 className="font-serif text-sm font-semibold text-[#1E1B18] mb-2">Key Contributions &amp; Honors</h3>
                <ul className="space-y-1.5 list-disc pl-5">
                  {woman.achievements.map((achievement, idx) => (
                    <li key={idx}>{achievement}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                <h3 className="font-serif text-xs font-semibold uppercase tracking-wider text-[#78726B] mb-1">Lasting Influence</h3>
                <p className="italic text-[#1E1B18]">{woman.legacy}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EDE6E2] flex justify-end">
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

export default WomenCard;
