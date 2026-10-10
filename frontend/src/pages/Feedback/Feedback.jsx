import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

function Feedback() {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get("/feedback");
      setReviews(res.data.feedback || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load member feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchReviews();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please enter your observation or critique.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/feedback", { rating, comment });
      toast.success("Thank you. Your feedback has been recorded.");
      setComment("");
      setRating(5);
      fetchReviews();
    } catch {
      toast.error("Unable to submit feedback at this time.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Editorial Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Continuous Improvement</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Member Reviews &amp; Feedback
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#4F4A45]">
                Share your clinical or platform experience to ensure GuardianHer AI continues to meet rigorous standards of safety and care.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-[#78726B]">
                {reviews.length} community {reviews.length === 1 ? "review" : "reviews"} published
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          {/* Submit Review Card */}
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs self-start">
            <h2 className="font-serif text-lg font-bold text-[#1E1B18]">
              Submit Feedback
            </h2>
            <p className="mt-1 text-xs text-[#78726B]">
              Logged in as <span className="font-semibold text-[#1E1B18]">{user.name || "Authenticated Member"}</span>
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-2">
                  Evaluation Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition hover:scale-105"
                      aria-label={`Rate ${star} out of 5 stars`}
                    >
                      <Star
                        className={`h-6 w-6 transition ${
                          (hoverRating || rating) >= star
                            ? "fill-[#A85C12] text-[#A85C12]"
                            : "text-[#EDE6E2]"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-semibold text-[#4F4A45]">
                    {hoverRating || rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                  Your Observations
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Detail your experience with emergency routing, wellness recommendations, or interface responsiveness..."
                  rows="5"
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white p-3 text-xs text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
                  disabled={submitting}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#8C3737] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#752B2B] disabled:opacity-60"
              >
                {submitting ? "Submitting Review..." : "Publish Member Review"}
              </button>
            </form>
          </div>

          {/* Testimonial Feed */}
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-[#1E1B18]">
              Member Perspectives
            </h2>
            <p className="mt-1 text-xs text-[#78726B]">
              Verified testimonials and insights from our community.
            </p>

            {loading ? (
              <LoadingSpinner label="Retrieving community feedback..." className="min-h-[250px]" />
            ) : error ? (
              <p className="mt-6 rounded-lg border border-[#BA2626]/20 bg-[#FDF2F2] p-3 text-xs text-[#BA2626]">
                {error}
              </p>
            ) : reviews.length === 0 ? (
              <div className="mt-8 flex min-h-[250px] flex-col items-center justify-center text-center text-[#78726B]">
                <MessageSquare className="h-8 w-8 text-[#EDE6E2] mb-2" />
                <p className="text-xs">No feedback entries recorded yet.</p>
                <p className="mt-1 text-[11px] text-[#78726B]">Be the first to submit a review.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4 transition hover:border-[#8C3737]/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#1E1B18]">
                          {rev.userName || "Verified User"}
                        </h3>
                        <p className="text-[10px] text-[#78726B]">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              rev.rating >= star
                                ? "fill-[#A85C12] text-[#A85C12]"
                                : "text-[#EDE6E2]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#4F4A45]">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
