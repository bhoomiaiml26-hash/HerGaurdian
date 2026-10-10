import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { GraduationCap, Award } from "lucide-react";
import HealthTipModal from "../../components/common/HealthTipModal";
import CategoryFilter from "../../components/common/CategoryFilter";
import SearchBar from "../../components/common/SearchBar";
import WellnessCard from "../../components/common/WellnessCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import careerTips from "../../data/careerTips";
import { addFavorite, getFavorites, removeFavorite } from "../../services/favoriteService";

const featuredGrants = [
  { title: "Adobe Research Women-in-Technology", award: "$10,000 + Fellowship", deadline: "Annual cycle" },
  { title: "Generation Google Scholarship", award: "$1,000 to $10,000", deadline: "Spring intake" },
  { title: "Palantir Women in Technology Fellowship", award: "$7,000 + Infrastructure grant", deadline: "Autumn intake" },
  { title: "Outreachy Open Research Internships", award: "$7,000 Stipend (Distributed)", deadline: "Bi-annual" },
];

function Career() {
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

  const categories = useMemo(() => ["All", ...new Set(careerTips.map((tip) => tip.category))], []);

  const filteredTips = useMemo(() => {
    return careerTips.filter((tip) => {
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
        toast.success("Opportunity removed from library");
      } else {
        await addFavorite({
          itemId: tipId,
          title: tip.title,
          description: tip.description,
          category: tip.category,
          source: "career",
        });
        toast.success("Opportunity saved to library");
      }
      await loadFavorites();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update saved status");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Banner */}
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Executive &amp; Academic Acceleration</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Career Advancement &amp; Grants
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#4F4A45]">
                Curated fellowships, venture opportunities, and leadership playbooks designed for women.
              </p>
            </div>
          </div>
        </div>

        {/* Featured Opportunities Strip */}
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-[#8C3737]" />
            <h2 className="font-serif text-base font-bold text-[#1E1B18]">Accredited Fellowships &amp; Grants</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featuredGrants.map((grant) => (
              <div key={grant.title} className="rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xs font-semibold text-[#1E1B18]">{grant.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#8C3737]">{grant.award}</p>
                </div>
                <p className="mt-3 text-[11px] text-[#78726B] pt-2 border-t border-[#EDE6E2]">Deadline: {grant.deadline}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search grants, skills & careers..."
          />
          <span className="text-xs text-[#78726B] font-medium">{filteredTips.length} opportunities available</span>
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
      </div>

      <HealthTipModal tip={selectedTip} onClose={() => setSelectedTip(null)} />
    </div>
  );
}

export default Career;
