import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Quote } from 'lucide-react';
import { inspirationQuotes } from '../../data/inspirationQuotes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) console.warn('VITE_API_BASE_URL is not set. Favorites API calls will be skipped.');

const getQuoteForToday = () => {
  if (typeof window === 'undefined') return null;

  const today = new Date().toDateString();
  const storedDate = localStorage.getItem('quoteDate');
  const storedQuote = localStorage.getItem('quoteOfDay');

  if (storedDate === today && storedQuote) {
    return JSON.parse(storedQuote);
  }

  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const newQuote = inspirationQuotes[dayOfYear % inspirationQuotes.length];

  localStorage.setItem('quoteDate', today);
  localStorage.setItem('quoteOfDay', JSON.stringify(newQuote));
  return newQuote;
};

const QuoteOfTheDayWidget = () => {
  const [quote] = useState(getQuoteForToday);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!quote) return;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token || !API_BASE_URL) return;

          const response = await fetch(`${API_BASE_URL}/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            const favorites = data.data || [];
            const favorited = favorites.some((fav) => fav.contentId === quote.id && fav.category === 'Quote');
            setIsFavorited(favorited);
          }
        } catch (error) {
          console.error('Error checking favorites:', error);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [quote]);

  const handleToggleFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add favorites');
        return;
      }

      if (isFavorited) {
        await fetch(`${API_BASE_URL}/favorites/${quote.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch(`${API_BASE_URL}/favorites`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId: quote.id,
            category: 'Quote',
            title: quote.text,
          }),
        });
      }

      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (!quote) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Quote className="h-4 w-4 text-[#8C3737]" />
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#78726B]">Daily Reflection</h3>
        </div>
        <button
          onClick={handleToggleFavorite}
          className="rounded-md p-1 text-[#78726B] hover:text-[#8C3737] transition-colors"
          title={isFavorited ? 'Remove from Saved' : 'Save Quote'}
        >
          <Heart
            size={18}
            className={isFavorited ? 'fill-[#8C3737] text-[#8C3737]' : 'currentColor'}
          />
        </button>
      </div>

      <p className="font-serif text-base italic leading-relaxed text-[#1E1B18] sm:text-lg">"{quote.text}"</p>
      <p className="mt-2 text-xs font-medium text-[#78726B]">— {quote.author}</p>
    </motion.div>
  );
};

export default QuoteOfTheDayWidget;
