import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Search, RefreshCw, Quote, Sparkles, BookOpen } from 'lucide-react';
import WomenCard from '../../components/cards/WomenCard';
import StoryCard from '../../components/cards/StoryCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { inspirationQuotes } from '../../data/inspirationQuotes';
import { inspiringWomen } from '../../data/inspiringWomen';
import { affirmations } from '../../data/affirmations';
import { successStories } from '../../data/successStories';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) console.warn('VITE_API_BASE_URL is not set. Favorites API calls will be skipped.');

const Inspiration = () => {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [currentAffirmation, setCurrentAffirmation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const getQuoteOfDay = () => {
    const today = new Date();
    const index = (today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate()) % inspirationQuotes.length;
    return inspirationQuotes[index];
  };

  const getRandomAffirmation = () => {
    return affirmations[Math.floor(Math.random() * affirmations.length)];
  };

  const loadFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !API_BASE_URL) return;

      const response = await fetch(`${API_BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentQuote(getQuoteOfDay());
      setCurrentAffirmation(getRandomAffirmation());
      void loadFavorites();
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const isFavorited = (itemId, type) => {
    return favorites.some((fav) => fav.itemId === itemId && fav.category === type);
  };

  const handleToggleFavorite = async (itemId, type, title = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (isFavorited(itemId, type)) {
        const fav = favorites.find((f) => f.itemId === itemId && f.category === type);
        if (fav && API_BASE_URL) {
          await fetch(`${API_BASE_URL}/favorites/${fav._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } else {
        if (API_BASE_URL) {
          await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemId, category: type, title }),
          });
        }
      }

      loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredWomen = inspiringWomen.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredStories = successStories.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.preview && s.preview.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredQuotes = inspirationQuotes.filter((q) =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F7] flex items-center justify-center">
        <LoadingSpinner label="Loading inspiration..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Stories, Wisdom &amp; Daily Reflection</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Daily Inspiration
              </h1>
              <p className="text-xs sm:text-sm text-[#4F4A45]">
                Discover the stories, wisdom, and strength of inspiring women throughout history and today.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78726B]" />
            <input
              type="text"
              placeholder="Search quotes, women, stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] py-2.5 pl-10 pr-4 text-sm text-[#1E1B18] placeholder-[#78726B] focus:border-[#8C3737] focus:outline-none"
            />
          </div>
        </div>

        {/* Quote of the Day */}
        {currentQuote && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-[#8C3737]/20 bg-white p-6 sm:p-8 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-5">
              <Quote className="h-4 w-4 text-[#8C3737]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Quote of the Day</span>
            </div>
            <blockquote className="font-serif text-xl font-medium italic leading-relaxed text-[#1E1B18] sm:text-2xl">
              &ldquo;{currentQuote.text}&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-[#78726B]">— {currentQuote.author}</p>
            <div className="mt-6 pt-5 border-t border-[#EDE6E2] flex items-center justify-between">
              <button
                onClick={() => handleToggleFavorite(currentQuote.id, 'Quote', currentQuote.text)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#EDE6E2] px-4 py-2 text-xs font-semibold text-[#4F4A45] hover:bg-[#F6EFEA] transition-colors"
              >
                <Heart
                  size={14}
                  className={isFavorited(currentQuote.id, 'Quote') ? 'fill-[#8C3737] text-[#8C3737]' : 'text-[#78726B]'}
                />
                {isFavorited(currentQuote.id, 'Quote') ? 'Saved' : 'Save Quote'}
              </button>
            </div>
          </motion.section>
        )}

        {/* Daily Affirmation */}
        {currentAffirmation && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-xl border border-[#EDE6E2] bg-[#F6EFEA]/60 p-6 sm:p-8 shadow-xs"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#8C3737]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">Daily Affirmation</span>
            </div>
            <p className="font-serif text-xl font-medium italic leading-relaxed text-[#1E1B18] sm:text-2xl text-center py-4">
              {currentAffirmation}
            </p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setCurrentAffirmation(getRandomAffirmation())}
                className="inline-flex items-center gap-2 rounded-lg border border-[#EDE6E2] bg-white px-5 py-2.5 text-xs font-semibold text-[#4F4A45] hover:bg-[#F6EFEA] transition-colors shadow-xs"
              >
                <RefreshCw size={13} />
                Another Affirmation
              </button>
            </div>
          </motion.section>
        )}

        {/* Women Who Inspire */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#8C3737]" />
              <h2 className="font-serif text-xl font-semibold text-[#1E1B18]">Women Who Inspire</h2>
            </div>
            <span className="text-xs text-[#78726B]">{filteredWomen.length} profiles</span>
          </div>
          {filteredWomen.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredWomen.map((woman) => (
                <WomenCard
                  key={woman.id}
                  woman={woman}
                  onFavorite={(id) => handleToggleFavorite(id, 'Woman', woman.name)}
                  isFavorited={isFavorited(woman.id, 'Woman')}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#EDE6E2] bg-white p-10 text-center">
              <p className="text-xs text-[#78726B]">No profiles match your search.</p>
            </div>
          )}
        </section>

        {/* Success Stories */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-[#8C3737]" />
              <h2 className="font-serif text-xl font-semibold text-[#1E1B18]">Success Stories</h2>
            </div>
            <span className="text-xs text-[#78726B]">{filteredStories.length} stories</span>
          </div>
          {filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onFavorite={(id) => handleToggleFavorite(id, 'Story', story.title)}
                  isFavorited={isFavorited(story.id, 'Story')}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#EDE6E2] bg-white p-10 text-center">
              <p className="text-xs text-[#78726B]">No stories match your search.</p>
            </div>
          )}
        </section>

        {/* Search Results: Quotes */}
        {searchTerm && filteredQuotes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Search className="h-4 w-4 text-[#8C3737]" />
              <h2 className="font-serif text-xl font-semibold text-[#1E1B18]">
                Quotes Matching &ldquo;{searchTerm}&rdquo;
              </h2>
            </div>
            <div className="space-y-3">
              {filteredQuotes.map((quote) => (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-[#EDE6E2] bg-white p-5 flex items-start justify-between gap-4 shadow-xs"
                >
                  <div className="flex-1">
                    <p className="font-serif text-sm italic leading-relaxed text-[#1E1B18]">
                      &ldquo;{quote.text}&rdquo;
                    </p>
                    <p className="mt-2 text-xs text-[#78726B]">— {quote.author}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(quote.id, 'Quote', quote.text)}
                    className="rounded-lg border border-[#EDE6E2] p-1.5 text-[#78726B] hover:bg-[#F6EFEA] transition-colors shrink-0"
                  >
                    <Heart
                      size={14}
                      className={isFavorited(quote.id, 'Quote') ? 'fill-[#8C3737] text-[#8C3737]' : 'currentColor'}
                    />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Inspiration;
