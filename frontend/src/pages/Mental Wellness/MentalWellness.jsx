import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Quote } from "lucide-react";
import HealthTipModal from "../../components/common/HealthTipModal";
import CategoryFilter from "../../components/common/CategoryFilter";
import SearchBar from "../../components/common/SearchBar";
import WellnessCard from "../../components/common/WellnessCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import mentalTips from "../../data/mentalTips";
import { addFavorite, getFavorites, removeFavorite } from "../../services/favoriteService";

const wellnessQuotes = [
  "Strategic recovery and psychological decompression are clinical necessities, not concessions.",
  "Regulating autonomic nervous system arousal directly protects long-term cognitive acuity.",
  "Paced diaphragmatic respirations signal immediate neurochemical safety to the amygdala.",
  "Observing internal chatter without reactive judgment de-escalates acute sympathetic overdrive.",
  "Calibrated boundaries around screen time and communication restore cognitive bandwidth.",
];

const quickCopingSkills = [
  { title: "Box Breathing (4-4-4-4)", description: "Inhale 4s, hold 4s, exhale 4s, hold 4s to regulate autonomic tone." },
  { title: "5-4-3-2-1 Sensory Grounding", description: "Identify 5 visual, 4 tactile, 3 auditory, 2 olfactory, and 1 gustatory cues." },
  { title: "Somatic Relaxation", description: "Progressive muscle tension release starting from cervical spine down to soles." },
  { title: "Sensory Quarantine", description: "30-minute silence window with eliminated device notifications." },
];

function MentalWellness() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedTip, setSelectedTip] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dailyQuote] = useState(() => wellnessQuotes[Math.floor(Math.random() * wellnessQuotes.length)]);

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

  const categories = useMemo(() => ["All", ...new Set(mentalTips.map((tip) => tip.category))], []);

  const filteredTips = useMemo(() => {
    return mentalTips.filter((tip) => {
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
          source: "mental",
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
      {/* Daily Reflection */}
      <div className="rounded-xl border border-[#EDE6E2] bg-[#F6EFEA]/80 p-5 shadow-xs flex items-start gap-3.5">
        <Quote className="h-5 w-5 shrink-0 text-[#8C3737] mt-0.5" />
        <div>
          <h3 className="font-serif text-xs font-semibold uppercase tracking-wider text-[#78726B]">Daily Mindfulness Principle</h3>
          <p className="mt-1 font-serif text-sm italic leading-relaxed text-[#1E1B18]">"{dailyQuote}"</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mental health protocols..."
        />
        <span className="text-xs text-[#78726B] font-medium">{filteredTips.length} practices available</span>
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

      {/* Somatic De-Escalation Protocols */}
      <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
        <h2 className="font-serif text-lg font-bold text-[#1E1B18] mb-4">
          Acute Stress De-Escalation Protocols
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickCopingSkills.map((skill, idx) => (
            <div key={skill.title} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-3.5">
              <span className="text-[10px] font-bold text-[#8C3737]">0{idx + 1}</span>
              <h3 className="font-serif text-xs font-semibold text-[#1E1B18] mt-1">{skill.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#4F4A45]">{skill.description}</p>
            </div>
          ))}
        </div>
      </div>

      <HealthTipModal tip={selectedTip} onClose={() => setSelectedTip(null)} />
    </div>
  );
}

export default MentalWellness;
