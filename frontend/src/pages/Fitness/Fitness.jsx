import { useEffect, useMemo, useState } from "react";
import { Dumbbell } from "lucide-react";
import toast from "react-hot-toast";
import HealthTipModal from "../../components/common/HealthTipModal";
import CategoryFilter from "../../components/common/CategoryFilter";
import SearchBar from "../../components/common/SearchBar";
import WellnessCard from "../../components/common/WellnessCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import detailedExercises from "../../data/detailedExercises";
import { addFavorite, getFavorites, removeFavorite } from "../../services/favoriteService";

function Fitness() {
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

  const [dailyWorkout] = useState(() => detailedExercises[Math.floor(Math.random() * detailedExercises.length)]);

  const categories = useMemo(() => ["All", ...new Set(detailedExercises.map((tip) => tip.category))], []);

  const filteredTips = useMemo(() => {
    return detailedExercises.filter((tip) => {
      const matchesSearch = tip.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || tip.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const toggleFavorite = async (tip) => {
    setError("");
    const tipId = tip.id.toString();
    const isAlreadyFavorite = favorites.some((favorite) => favorite.itemId === tipId);
    try {
      if (isAlreadyFavorite) {
        const favorite = favorites.find((item) => item.itemId === tipId);
        await removeFavorite(favorite._id);
        toast.success("Removed from saved library");
      } else {
        await addFavorite({
          itemId: tipId,
          title: tip.title,
          description: tip.description,
          category: tip.category,
          source: "fitness",
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
      {/* Daily Protocol Highlight */}
      {dailyWorkout && (
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-[#8C3737]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Suggested Session</p>
            </div>
            <h2 className="mt-1 font-serif text-lg font-bold text-[#1E1B18]">{dailyWorkout.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#4F4A45] max-w-2xl">{dailyWorkout.description}</p>
          </div>
          <span className="self-start sm:self-auto rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
            {dailyWorkout.category}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises by focus..."
        />
        <span className="text-xs text-[#78726B] font-medium">{filteredTips.length} routines available</span>
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
              image={tip.image}
              title={tip.title}
              description={tip.description}
              category={tip.category}
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

export default Fitness;