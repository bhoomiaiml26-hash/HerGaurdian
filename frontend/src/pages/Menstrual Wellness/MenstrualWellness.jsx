import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, Info } from "lucide-react";
import HealthTipModal from "../../components/common/HealthTipModal";
import CategoryFilter from "../../components/common/CategoryFilter";
import SearchBar from "../../components/common/SearchBar";
import WellnessCard from "../../components/common/WellnessCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import menstrualTips from "../../data/menstrualTips";
import { addFavorite, getFavorites, removeFavorite } from "../../services/favoriteService";

const cycleFacts = [
  "Endocrine fluctuations directly regulate metabolic rate, sleep architecture, and neurotransmitter balance across phases.",
  "Documenting basal patterns provides actionable predictability for physical training and cognitive workload.",
  "Targeted magnesium and electrolyte replenishment reduces myometrial spasm intensity.",
  "Systematic hydration mitigates cyclic fluid retention and vasopressin-mediated fatigue.",
  "Phase-specific adjustments in strength training maximize performance during the follicular stage.",
  "Gentle aerobic activity enhances local oxygenation and accelerates prostaglandin clearance.",
  "Localized thermal therapy relaxes smooth muscle tissue and attenuates acute uterine cramping.",
  "Active tracking empowers collaborative discussions with clinical gynecologists.",
];

const quickCareTips = [
  { title: "Electrolyte Hydration", description: "Optimize cellular water retention and alleviate sluggishness." },
  { title: "Localized Thermal Relief", description: "Apply steady warmth to calm hyperactive pelvic muscle fibers." },
  { title: "Low-Impact Mobility", description: "Gentle spinal flexion stimulates pelvic circulation and endorphins." },
  { title: "Micro-Nutrient Intake", description: "Prioritize bioavailable iron, magnesium, and anti-inflammatory fats." },
  { title: "Restorative Sleep", description: "Align nighttime schedules with higher physiological recovery demands." },
];

function MenstrualWellness() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedTip, setSelectedTip] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [featuredFact] = useState(() => cycleFacts[Math.floor(Math.random() * cycleFacts.length)]);
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

  const categories = useMemo(() => ["All", ...new Set(menstrualTips.map((tip) => tip.category))], []);

  const filteredTips = useMemo(() => {
    return menstrualTips.filter((tip) => {
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
          source: "menstrual",
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
      {/* Clinical Note Highlight */}
      <div className="rounded-xl border border-[#EDE6E2] bg-[#F6EFEA]/80 p-5 shadow-xs flex items-start gap-3.5">
        <Info className="h-5 w-5 shrink-0 text-[#8C3737] mt-0.5" />
        <div>
          <h3 className="font-serif text-sm font-semibold text-[#1E1B18]">Physiological Rhythm Insight</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#4F4A45]">{featuredFact}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cycle guides..."
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

      {/* Immediate Relief Protocols */}
      <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <h2 className="font-serif text-lg font-bold text-[#1E1B18] mb-4">
          Immediate Comfort &amp; Support Guidelines
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickCareTips.map((item, idx) => (
            <div key={item.title} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
              <span className="text-[10px] font-bold text-[#8C3737]">0{idx + 1}</span>
              <h3 className="font-serif text-xs font-semibold text-[#1E1B18] mt-1">{item.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#4F4A45]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <HealthTipModal tip={selectedTip} onClose={() => setSelectedTip(null)} />
    </div>
  );
}

export default MenstrualWellness;
