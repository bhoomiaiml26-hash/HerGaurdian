import { motion } from "framer-motion";
import { X } from "lucide-react";
import ShareButton from "./ShareButton";
import YouTubePlayer from "./YouTubePlayer";

/**
 * Extracts a YouTube video ID from a full embed/watch URL or returns the
 * string directly if it is already a bare 11-character video ID.
 */
function extractVideoId(value) {
  if (!value) return null;
  // Already a bare ID (11 alphanum chars)
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  // youtube.com/embed/ID or youtube.com/watch?v=ID or youtu.be/ID
  const match = value.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function HealthTipModal({ tip, onClose }) {
  if (!tip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1B18]/60 backdrop-blur-xs px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="flex w-full max-w-[95vw] max-h-[90vh] flex-col overflow-hidden rounded-xl border border-[#EDE6E2] bg-white shadow-xl sm:max-w-3xl"
      >
        <div className="border-b border-[#EDE6E2] bg-white px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8C3737]">Clinical Insight</p>
              <h2 id="modal-title" className="mt-1 font-serif text-xl font-bold leading-snug text-[#1E1B18] sm:text-2xl">
                {tip.title}
              </h2>
              {tip.category && (
                <span className="mt-2.5 inline-flex rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                  {tip.category}
                </span>
              )}
            </div>
            <button onClick={onClose} className="rounded-lg border border-[#EDE6E2] p-1.5 text-[#78726B] transition hover:bg-[#F6EFEA] hover:text-[#1E1B18]" aria-label="Close modal">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-6 text-sm leading-relaxed text-[#4F4A45] sm:text-base">
          {tip.image && (
            <div className="overflow-hidden rounded-lg border border-[#EDE6E2] max-h-72">
              <img
                src={tip.image}
                alt={tip.alt || tip.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          {tip.description && (
            <div>
              <p className="text-sm font-medium leading-relaxed text-[#1E1B18]">{tip.description}</p>
            </div>
          )}

          {(tip.overview || tip.details || tip.readMore) && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Protocol Overview</h3>
              <p className="text-sm leading-relaxed text-[#4F4A45]">{tip.overview || tip.details || tip.readMore}</p>
            </div>
          )}

          {tip.healthyHabits?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Evidence-Based Healthy Habits</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.healthyHabits.map((habit, idx) => (
                  <li key={idx}>{habit}</li>
                ))}
              </ul>
            </div>
          )}

          {tip.nutritionConsiderations?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Nutrition & Lifestyle Considerations</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.nutritionConsiderations.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(tip.whenToSeekHelp || tip.consultDoctor) && (
            <div className="rounded-lg border border-[#BA2626]/20 bg-[#FDF2F2] p-4">
              <h3 className="mb-1 font-serif text-sm font-bold text-[#BA2626]">When to Seek Professional Medical Care</h3>
              <p className="text-xs leading-relaxed text-[#BA2626]/90">{tip.whenToSeekHelp || tip.consultDoctor}</p>
            </div>
          )}

          {tip.disclaimer && (
            <div className="rounded-lg border border-[#EDE6E2] bg-[#FAF8F6] p-3 text-[11px] leading-relaxed text-[#78726B]">
              <span className="font-semibold text-[#4F4A45]">Medical Disclaimer: </span>
              {tip.disclaimer}
            </div>
          )}

          {(tip.duration || tip.frequency || tip.difficulty || tip.target || tip.equipment || tip.avoid || tip.trainer || tip.caloriesBurned) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {tip.duration && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Duration</p>
                  <p className="mt-1 text-base font-bold text-[#1E1B18]">{tip.duration}</p>
                </div>
              )}
              {tip.frequency && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Frequency</p>
                  <p className="mt-1 text-base font-bold text-[#1E1B18]">{tip.frequency}</p>
                </div>
              )}
              {tip.difficulty && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Difficulty</p>
                  <p className="mt-1 text-base font-bold text-[#1E1B18]">{tip.difficulty}</p>
                </div>
              )}
              {tip.target && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Target Focus</p>
                  <p className="mt-1 text-base font-bold text-[#1E1B18]">{tip.target}</p>
                </div>
              )}
              {tip.equipment && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Equipment</p>
                  <p className="mt-1 text-base font-bold text-[#1E1B18]">{tip.equipment}</p>
                </div>
              )}
              {tip.caloriesBurned && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Estimated Output</p>
                  <p className="mt-1 text-base font-bold text-[#1E1B18]">{tip.caloriesBurned}</p>
                </div>
              )}
              {tip.avoid && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Contraindications</p>
                  <p className="mt-1 text-base font-bold text-[#1E1B18]">{tip.avoid}</p>
                </div>
              )}
              {tip.trainer && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Certified Specialist</p>
                  <p className="mt-1 text-base font-bold text-[#1E1B18]">{tip.trainer}</p>
                </div>
              )}
            </div>
          )}

          {tip.ingredients?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Ingredients</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.ingredients.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {tip.cookingMethod?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Preparation Method</h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.cookingMethod.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {tip.nutritionalValues && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Nutritional Composition</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(tip.nutritionalValues).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B] capitalize">{key}</p>
                    <p className="mt-1 text-base font-bold text-[#1E1B18]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tip.benefits?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Key Clinical Benefits</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {tip.riskFactors?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Risk Considerations</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.riskFactors.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {tip.homeRemedies?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Evidence-Based Practices</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.homeRemedies.map((remedy, idx) => (
                  <li key={idx}>{remedy}</li>
                ))}
              </ul>
            </div>
          )}

          {tip.consultDoctor && (
            <div className="rounded-lg border border-[#BA2626]/20 bg-[#FDF2F2] p-4">
              <h3 className="mb-1 font-serif text-sm font-bold text-[#BA2626]">Clinical Escalation Threshold</h3>
              <p className="text-xs leading-relaxed text-[#BA2626]/90">{tip.consultDoctor}</p>
            </div>
          )}

          {tip.tips?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Lifestyle Directives</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.tips.map((tipItem, idx) => (
                  <li key={idx}>{tipItem}</li>
                ))}
              </ul>
            </div>
          )}

          {tip.faq?.length > 0 && (
            <div>
              <h3 className="mb-3 font-serif text-base font-bold text-[#1E1B18]">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {tip.faq.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                    <p className="text-sm font-semibold text-[#1E1B18]">{item.question}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#4F4A45]">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tip.symptoms?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Observed Indicators</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.symptoms.map((symptom, idx) => (
                  <li key={idx}>{symptom}</li>
                ))}
              </ul>
            </div>
          )}

          {tip.prevention?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Preventive Strategies</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.prevention.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {tip.lifestyleTips?.length > 0 && (
            <div>
              <h3 className="mb-2 font-serif text-base font-bold text-[#1E1B18]">Recommendations</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#4F4A45]">
                {tip.lifestyleTips.map((tipItem, idx) => (
                  <li key={idx}>{tipItem}</li>
                ))}
              </ul>
            </div>
          )}

          {(tip.eatFoods?.length > 0 || tip.avoidFoods?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {tip.eatFoods?.length > 0 && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#286646]">Recommended Nutrition</h3>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-[#4F4A45]">
                    {tip.eatFoods.map((food, idx) => (
                      <li key={idx}>{food}</li>
                    ))}
                  </ul>
                </div>
              )}
              {tip.avoidFoods?.length > 0 && (
                <div className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#BA2626]">Nutritional Exclusions</h3>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-[#4F4A45]">
                    {tip.avoidFoods.map((food, idx) => (
                      <li key={idx}>{food}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Video — supports both object (tip.video) and legacy embed-URL string (tip.youtubeVideo) */}
          {(() => {
            // Prefer structured video object; fall back to legacy youtubeVideo string
            const vid = tip.video || null;
            const legacyId = !vid ? extractVideoId(tip.youtubeVideo) : null;
            const videoId = vid ? vid.id : legacyId;
            if (!videoId) return null;
            return (
              <div>
                <h3 className="mb-3 font-serif text-base font-bold text-[#1E1B18]">Watch & Learn</h3>
                <YouTubePlayer
                  videoId={videoId}
                  title={vid?.title || tip.title}
                  source={vid?.source || vid?.creator}
                  description={vid?.description}
                  fallbackQuery={vid?.title || tip.title}
                />
              </div>
            );
          })()}
        </div>

        <div className="border-t border-[#EDE6E2] bg-white px-6 py-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <ShareButton
              title={tip.title}
              text={tip.description || tip.readMore || ''}
              url={tip.video ? `https://www.youtube.com/watch?v=${tip.video.id}` : ''}
              className="w-full sm:w-auto"
            />
            <button
              onClick={onClose}
              className="rounded-lg bg-[#8C3737] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default HealthTipModal;