import { motion } from "framer-motion";
import { Bookmark, BookmarkX, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getFavorites, removeFavorite } from "../../services/favoriteService";

function Saved() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadFavorites = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getFavorites();
      setFavorites(response.favorites || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load saved records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFavorites();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleRemove = async (favoriteId) => {
    setError("");
    try {
      await removeFavorite(favoriteId);
      toast.success("Item removed from saved records");
      await loadFavorites();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove saved item");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Editorial Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <Bookmark className="h-3.5 w-3.5" />
                <span>Personal Clinical Library</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Saved Guidance &amp; Protocols
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#4F4A45]">
                Curated clinical tips, nutritional plans, and self-care resources archived for rapid consultation.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-[#78726B]">
                {favorites.length} {favorites.length === 1 ? "entry" : "entries"} bookmarked
              </span>
            </div>
          </div>
        </motion.div>

        {error && (
          <p className="rounded-lg border border-[#BA2626]/20 bg-[#FDF2F2] p-3.5 text-xs font-medium text-[#BA2626]">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-[#EDE6E2] bg-white p-12 shadow-xs">
            <LoadingSpinner label="Retrieving saved items..." className="min-h-[30vh]" />
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-[#EDE6E2] bg-white p-8 text-center shadow-xs"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F6EFEA] text-[#8C3737]">
              <BookmarkX className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-serif text-lg font-bold text-[#1E1B18]">No Saved Items</h2>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#78726B]">
              Explore wellness insights across Health, Nutrition, Fitness, and Career to bookmark essential recommendations here.
            </p>
            <Link
              to="/health"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
            >
              <span>Explore Women's Health</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => (
              <motion.div
                key={favorite._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs transition hover:shadow-sm"
              >
                <div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-md bg-[#F6EFEA] px-2 py-0.5 text-[11px] font-semibold text-[#8C3737]">
                      {favorite.category || "Guidance"}
                    </span>
                    {favorite.source && (
                      <span className="text-[10px] uppercase tracking-wider text-[#78726B]">
                        {favorite.source}
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-base font-bold text-[#1E1B18] leading-snug">
                    {favorite.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-[#4F4A45] line-clamp-3">
                    {favorite.description || "Saved clinical and lifestyle protocol."}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-end border-t border-[#EDE6E2]/60 pt-3">
                  <button
                    onClick={() => handleRemove(favorite._id)}
                    className="rounded-md border border-[#EDE6E2] px-3 py-1 text-xs font-semibold text-[#78726B] transition hover:bg-[#FDF2F2] hover:text-[#BA2626] hover:border-[#BA2626]/30"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Saved;
