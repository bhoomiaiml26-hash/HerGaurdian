import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import HealthTipModal from "../../components/common/HealthTipModal";
import CategoryFilter from "../../components/common/CategoryFilter";
import SearchBar from "../../components/common/SearchBar";
import WellnessCard from "../../components/common/WellnessCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import enhancedHealthTips from "../../data/enhancedHealthTips";
import { addFavorite, getFavorites, removeFavorite } from "../../services/favoriteService";

function WomenHealth() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedTip, setSelectedTip] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(() => ["All", ...new Set(enhancedHealthTips.map((tip) => tip.category))], []);

  const filteredTips = useMemo(() => {
    return enhancedHealthTips.filter((tip) => {
      const matchesSearch = tip.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || tip.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const loadFavorites = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getFavorites();
      setFavorites(response.favorites || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load saved items");
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

  const toggleFavorite = async (tip) => {
    setError("");

    const isAlreadyFavorite = favorites.some((favorite) => favorite.itemId === tip.title);
    try {
      if (isAlreadyFavorite) {
        const favorite = favorites.find((item) => item.itemId === tip.title);
        await removeFavorite(favorite._id);
        toast.success("Removed from saved library");
      } else {
        await addFavorite({
          itemId: tip.title,
          title: tip.title,
          description: tip.description,
          category: tip.category,
          source: "health",
        });
        toast.success("Saved to your library");
      }
      await loadFavorites();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update saved status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter clinical topics..."
        />
        <span className="text-xs text-[#78726B] font-medium">{filteredTips.length} protocols available</span>
      </div>

      {error && <p className="rounded-lg bg-[#FDF2F2] border border-[#BA2626]/20 p-3 text-xs text-[#BA2626]">{error}</p>}

      <CategoryFilter
        categories={categories}
        selectedCategory={category}
        onCategoryChange={setCategory}
      />

      {/* Cards Grid */}
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner label="Synchronizing records..." />
        </div>
      ) : filteredTips.length === 0 ? (
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-12 text-center shadow-xs">
          <HeartPulse className="mx-auto h-12 w-12 text-[#8C3737]/60" />
          <h3 className="mt-3 font-serif text-lg font-bold text-[#1E1B18]">No Protocols Found</h3>
          <p className="mt-1 text-xs text-[#78726B]">
            No clinical topics match "{search}". Try searching for another keyword or selecting "All" categories.
          </p>
          <button
            onClick={() => { setSearch(""); setCategory("All"); }}
            className="mt-4 inline-flex items-center rounded-lg border border-[#EDE6E2] bg-white px-4 py-2 text-xs font-semibold text-[#8C3737] hover:bg-[#F6EFEA]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTips.map((tip) => (
            <WellnessCard
              key={tip.id || tip.title}
              title={tip.title}
              description={tip.description}
              category={tip.category}
              image={tip.image}
              alt={tip.alt}
              isFavorite={favorites.some((favorite) => favorite.itemId === tip.title)}
              onToggleFavorite={() => toggleFavorite(tip)}
              onReadMore={() => setSelectedTip(tip)}
              themeColor="text-[#1E1B18]"
              buttonClass="border-[#EDE6E2] text-[#1E1B18] hover:bg-[#F6EFEA]"
              badgeClass="bg-[#F6EFEA] text-[#8C3737]"
            />
          ))}
        </div>
      )}

      {/* Clinical Disclaimer Banner */}
      <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs">
        <p className="text-[11px] leading-relaxed text-[#78726B]">
          <span className="font-semibold text-[#4F4A45]">Important Medical Notice: </span>
          All health information and wellness protocols are compiled for general educational purposes only. They are not intended to diagnose, treat, cure, or substitute for personalized advice from a certified physician or healthcare professional.
        </p>
      </div>

      <HealthTipModal tip={selectedTip} onClose={() => setSelectedTip(null)} />
    </div>
  );
}

export default WomenHealth;
