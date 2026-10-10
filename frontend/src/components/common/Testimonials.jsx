import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import testimonialsData from "../../data/testimonialsData";
import { getFeedback } from "../../services/feedbackService";

function StarRating({ rating }) {
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${rating >= star ? "text-[#A85C12]" : "text-[#EDE6E2]"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function Testimonials() {
  const [dynamicReviews, setDynamicReviews] = useState([]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await getFeedback();
        setDynamicReviews((response.feedback || []).slice(0, 3));
      } catch {
        // Silently continue with default testimonials
      }
    };
    loadReviews();
  }, []);

  const allTestimonials = [
    ...dynamicReviews.map((rev) => ({
      name: rev.userName,
      profession: "Verified Member",
      review: rev.comment,
      rating: rev.rating,
      isDynamic: true,
    })),
    ...testimonialsData.map((t) => ({ ...t, isDynamic: false })),
  ];

  return (
    <section id="reviews" className="border-t border-[#EDE6E2] bg-[#FBF9F7] py-20 px-6 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1E1B18] sm:text-4xl">
            What Women Say
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#4F4A45] sm:text-lg">
            Real voices. Real experiences. Real empowerment.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {allTestimonials.slice(0, 6).map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-white p-7 shadow-xs"
            >
              <div>
                {item.isDynamic && (
                  <span className="mb-3 inline-block rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                    Verified Member
                  </span>
                )}
                <p className="text-sm leading-relaxed text-[#4F4A45]">
                  &ldquo;{item.review}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#EDE6E2]">
                <h4 className="font-serif text-base font-semibold text-[#8C3737]">
                  {item.name}
                </h4>
                <p className="text-xs text-[#78726B]">
                  {item.profession}
                </p>
                {item.rating && <StarRating rating={item.rating} />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
