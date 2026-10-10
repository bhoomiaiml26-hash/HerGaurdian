import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import HealthTipModal from "../../components/common/HealthTipModal";
import CategoryFilter from "../../components/common/CategoryFilter";
import SearchBar from "../../components/common/SearchBar";
import WellnessCard from "../../components/common/WellnessCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import recipes from "../../data/recipes";
import { addFavorite, getFavorites, removeFavorite } from "../../services/favoriteService";

function Nutrition() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedTip, setSelectedTip] = useState(null);
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

  const categories = useMemo(() => ["All", ...new Set(recipes.map((tip) => tip.category))], []);

  const filteredTips = useMemo(() => {
    return recipes.filter((tip) => {
      const matchesSearch = tip.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || tip.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const toggleFavorite = async (tip) => {
    setError("");

    const isAlreadyFavorite = favorites.some((favorite) => favorite.itemId === tip.id.toString());
    try {
      if (isAlreadyFavorite) {
        const favorite = favorites.find((item) => item.itemId === tip.id.toString());
        await removeFavorite(favorite._id);
        toast.success("Removed from saved library");
      } else {
        await addFavorite({
          itemId: tip.id.toString(),
          title: tip.title,
          description: tip.description,
          category: tip.category,
          source: "nutrition",
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
          placeholder="Search meal plans & nutrients..."
        />
        <span className="text-xs text-[#78726B] font-medium">{filteredTips.length} dietary protocols ready</span>
      </div>

      {error && <p className="rounded-lg bg-[#FDF2F2] border border-[#BA2626]/20 p-3 text-xs text-[#BA2626]">{error}</p>}

      <CategoryFilter
        categories={categories}
        selectedCategory={category}
        onCategoryChange={setCategory}
      />

      {/* Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <LoadingSpinner label="Synchronizing records..." className="col-span-full" />
        ) : (
          filteredTips.map((tip) => (
            <WellnessCard
              key={tip.id}
              title={tip.title}
              description={tip.description}
              category={tip.category}
              image={tip.image}
              isFavorite={favorites.some((favorite) => favorite.itemId === tip.id.toString())}
              onToggleFavorite={() => toggleFavorite(tip)}
              onReadMore={() => setSelectedTip(tip)}
              themeColor="text-[#1E1B18]"
              buttonClass="border-[#EDE6E2] text-[#1E1B18] hover:bg-[#F6EFEA]"
              badgeClass="bg-[#F6EFEA] text-[#8C3737]"
            />
          ))
        )}
      </div>

      <HealthTipModal tip={selectedTip} onClose={() => setSelectedTip(null)} />
    </div>
  );
}

export default Nutrition;