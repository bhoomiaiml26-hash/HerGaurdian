import express from 'express';
import rateLimit from 'express-rate-limit';
import { geocode, clearCache } from '../services/geocoding.js';

const router = express.Router();

const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many geocode requests. Please slow down.' }
});

// Friendly message when nothing is found after all fallbacks
const GEOCODE_EMPTY_HINT = "Couldn't find an exact match — try the nearest main road or landmark, or drop a pin on the map instead";

/**
 * GET /api/geocode/search?q=<query>
 * Layered Pune/PCMC geocode: Nominatim (with viewbox) → Photon → Overpass
 */
router.get('/search', geocodeLimiter, async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
  }

  if (q.trim().length < 2) {
    return res.json({ success: true, data: [], hint: null });
  }

  try {
    const result = await geocode(q);

    res.json({
      success: true,
      data: result.data,
      hint: result.data.length ? null : GEOCODE_EMPTY_HINT,
      meta: {
        sourcesTried: ['nominatim', 'photon', 'overpass'],
        sourcesUsed: result.sourcesUsed,
        fallbackUsed: result.fallbackUsed,
        query: result.query,
      },
    });
  } catch (err) {
    console.error('Geocode proxy error:', err.message);

    if (err.response?.status === 429) {
      return res.status(429).json({ success: false, message: 'Geocoder is rate-limited. Try again in a moment.' });
    }

    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Geocoder timed out. Check your connection.' });
    }

    res.status(502).json({ success: false, message: 'Geocoder unavailable. Please try again.' });
  }
});

// Debug endpoint to clear cache (for testing)
router.post('/cache/clear', (req, res) => {
  clearCache();
  res.json({ success: true, message: 'Geocode cache cleared' });
});

export default router;