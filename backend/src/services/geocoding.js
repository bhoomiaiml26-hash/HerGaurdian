/**
 * Worldwide Multi-Source Geocoding Service
 * 
 * Layered search strategy for global location searches:
 * 1. Nominatim (OpenStreetMap's geocoding service)
 * 2. Photon (better fuzzy matching)
 * 
 * Features:
 * - Worldwide location support (no geographic restrictions)
 * - In-memory cache for repeated queries
 * - Result deduplication and ranking by relevance
 * - Graceful fallback chain
 * - Optional region bias for local searches
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Optional: Pune viewbox for local bias (can be overridden or removed for pure worldwide)
const PUNE_VIEWBOX = {
  minLat: 18.35,
  minLng: 73.60,
  maxLat: 18.70,
  maxLng: 74.00,
};

// Pune center for proximity ranking (used when results are near Pune)
const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

// Cache configuration
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const cache = new Map();

// Request timeout
const FETCH_TIMEOUT = 6000;

// ═══════════════════════════════════════════════════════════════════════════
// CACHE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getCacheKey(query) {
  return query.toLowerCase().trim();
}

function getCached(query) {
  const key = getCacheKey(query);
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(query, data) {
  const key = getCacheKey(query);
  cache.set(key, { data, timestamp: Date.now() });
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize a geocoding result to consistent shape
 */
function normalizeResult(raw, source) {
  const lat = parseFloat(raw.lat);
  const lng = parseFloat(raw.lon || raw.center?.lng);
  
  if (isNaN(lat) || isNaN(lng)) return null;

  // Build short name from address components
  let shortName = raw.name || '';
  if (!shortName && raw.address) {
    const parts = [
      raw.address.amenity,
      raw.address.building,
      raw.address.neighbourhood,
      raw.address.suburb,
      raw.address.village,
      raw.address.town,
      raw.address.city,
      raw.address.state,
      raw.address.country,
    ].filter(Boolean);
    shortName = parts[0] || raw.display_name?.split(',')[0] || 'Unknown';
  }
  
  const displayName = raw.display_name || raw.properties?.display_name || 
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  // Calculate distance from Pune center only if result is near Pune
  const distanceFromPune = Math.sqrt(
    Math.pow(lat - PUNE_CENTER.lat, 2) + 
    Math.pow((lng - PUNE_CENTER.lng) * Math.cos(lat * Math.PI / 180), 2)
  ) * 111;

  const isNearPune = distanceFromPune < 50; // Within 50km of Pune

  return {
    lat,
    lng,
    name: shortName.trim(),
    displayName,
    type: raw.type || raw.properties?.type || 'place',
    source,
    // Only rank by Pune proximity if near Pune
    distanceKm: isNearPune ? distanceFromPune : 0,
    importance: raw.importance || raw.properties?.rank || 0,
  };
}

/**
 * Deduplicate and rank results by relevance
 * Priority: importance ranking, then proximity for local results
 */
function dedupeAndRank(results, limit = 5) {
  const seen = new Map();
  
  for (const r of results) {
    // Dedupe by lat/lng rounded to 4 decimal places (~11m precision)
    const key = `${r.lat.toFixed(4)},${r.lng.toFixed(4)}`;
    if (!seen.has(key)) {
      seen.set(key, r);
    }
  }
  
  // Sort by importance (global) then by distance (local)
  const deduped = Array.from(seen.values())
    .sort((a, b) => {
      // First sort by importance
      if (b.importance !== a.importance) {
        return (b.importance || 0) - (a.importance || 0);
      }
      // Then by distance for local results
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, limit);
  
  return deduped;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 1: NOMINATIM (with viewbox bias)
// ═══════════════════════════════════════════════════════════════════════════

async function searchNominatim(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '10');
  url.searchParams.set('addressdetails', '1');
  
  // Only bias with viewbox if query explicitly pertains to Pune/PCMC
  const lowerQ = query.toLowerCase();
  if (lowerQ.includes('pune') || lowerQ.includes('pcmc') || lowerQ.includes('kothrud') || lowerQ.includes('hinjewadi')) {
    url.searchParams.set('viewbox', `${PUNE_VIEWBOX.minLng},${PUNE_VIEWBOX.maxLat},${PUNE_VIEWBOX.maxLng},${PUNE_VIEWBOX.minLat}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'HerGuardian-AI/1.0 (https://herguardian.ai)',
        'Accept-Language': 'en',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const data = await response.json();
    clearTimeout(timeout);
    
    return data.map(r => normalizeResult(r, 'nominatim')).filter(Boolean);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.log('[Geocoding] Nominatim timeout');
    } else {
      console.log(`[Geocoding] Nominatim error: ${err.message}`);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 2: PHOTON (fallback for fuzzy matching)
// ═══════════════════════════════════════════════════════════════════════════

async function searchPhoton(query) {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  
  // Only pass local coordinates if query explicitly pertains to Pune
  const lowerQ = query.toLowerCase();
  if (lowerQ.includes('pune') || lowerQ.includes('pcmc')) {
    url.searchParams.set('lat', PUNE_CENTER.lat);
    url.searchParams.set('lon', PUNE_CENTER.lng);
  }
  url.searchParams.set('limit', '10');
  url.searchParams.set('lang', 'en');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'HerGuardian-AI/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Photon HTTP ${response.status}`);
    }

    const data = await response.json();
    clearTimeout(timeout);
    
    // Photon returns { features: [...] }
    const features = data.features || [];
    return features.map(f => normalizeResult(f.properties, 'photon')).filter(Boolean);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.log('[Geocoding] Photon timeout');
    } else {
      console.log(`[Geocoding] Photon error: ${err.message}`);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE 3: OVERPASS API (raw OSM data for societies/temples)
// ═══════════════════════════════════════════════════════════════════════════

async function searchOverpass(query) {
  // Escape special characters in query
  const escapedQuery = query.replace(/["\\()]/g, '').trim();
  
  // Overpass query: search for named features in Pune bbox
  const overpassQuery = `
    [out:json][timeout:8];
    (
      node["name"~"${escapedQuery}",i](${PUNE_VIEWBOX.minLat},${PUNE_VIEWBOX.minLng},${PUNE_VIEWBOX.maxLat},${PUNE_VIEWBOX.maxLng});
      way["name"~"${escapedQuery}",i](${PUNE_VIEWBOX.minLat},${PUNE_VIEWBOX.minLng},${PUNE_VIEWBOX.maxLat},${PUNE_VIEWBOX.maxLng});
      node["amenity"~"place_of_worship"]["name"~"${escapedQuery}",i](${PUNE_VIEWBOX.minLat},${PUNE_VIEWBOX.minLng},${PUNE_VIEWBOX.maxLat},${PUNE_VIEWBOX.maxLng});
      node["building"~"residential"]["name"~"${escapedQuery}",i](${PUNE_VIEWBOX.minLat},${PUNE_VIEWBOX.minLng},${PUNE_VIEWBOX.maxLat},${PUNE_VIEWBOX.maxLng});
      node["shop"]["name"~"${escapedQuery}",i](${PUNE_VIEWBOX.minLat},${PUNE_VIEWBOX.minLng},${PUNE_VIEWBOX.maxLat},${PUNE_VIEWBOX.maxLng});
      node["amenity"="marketplace"]["name"~"${escapedQuery}",i](${PUNE_VIEWBOX.minLat},${PUNE_VIEWBOX.minLng},${PUNE_VIEWBOX.maxLat},${PUNE_VIEWBOX.maxLng});
    );
    out center;
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'HerGuardian-AI/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const data = await response.json();
    clearTimeout(timeout);

    // Extract center points from ways, nodes from nodes
    const results = [];
    for (const element of data.elements || []) {
      let lat, lng;
      
      if (element.type === 'node') {
        lat = element.lat;
        lng = element.lon;
      } else if (element.type === 'way' && element.center) {
        lat = element.center.lat;
        lng = element.center.lng;
      }
      
      if (lat && lng) {
        results.push({
          lat,
          lon: lng,
          name: element.tags?.name || '',
          display_name: element.tags?.name || '',
          type: element.type,
        });
      }
    }

    return results.map(r => normalizeResult(r, 'overpass')).filter(Boolean);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.log('[Geocoding] Overpass timeout');
    } else {
      console.log(`[Geocoding] Overpass error: ${err.message}`);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEARCH FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search with layered fallback strategy
 * @param {string} query - Search query
 * @returns {{success: boolean, data: Array, source: string, fallbackUsed: string|null}}
 */
export async function geocode(query) {
  if (!query || query.trim().length < 2) {
    return { success: true, data: [], source: 'none', fallbackUsed: null };
  }

  const trimmed = query.trim();

  // Check cache first
  const cached = getCached(trimmed);
  if (cached) {
    return { success: true, data: cached, source: 'cache', fallbackUsed: null };
  }

  let results = [];
  let source = 'nominatim';
  let fallbackUsed = null;

  // Step 1: Try Nominatim with viewbox bias
  console.log(`[Geocoding] Searching Nominatim: "${trimmed}"`);
  results = await searchNominatim(trimmed);
  
  if (results.length === 0) {
    // Step 2: Fallback to Photon
    console.log(`[Geocoding] Nominatim failed, trying Photon: "${trimmed}"`);
    source = 'photon';
    fallbackUsed = 'nominatim';
    results = await searchPhoton(trimmed);
  }

  if (results.length === 0) {
    // Step 3: Fallback to Overpass
    console.log(`[Geocoding] Photon failed, trying Overpass: "${trimmed}"`);
    source = 'overpass';
    fallbackUsed = fallbackUsed ? `${fallbackUsed}+photon` : 'photon';
    results = await searchOverpass(trimmed);
  }

  // Final dedupe and rank
  const finalResults = dedupeAndRank(results, 5);

  // Cache successful results
  if (finalResults.length > 0) {
    setCache(trimmed, finalResults);
  }

  const resultSources = [...new Set(finalResults.map(r => r.source))];
  
  return {
    success: true,
    data: finalResults,
    sourcesUsed: resultSources.length > 0 ? resultSources.join('+') : 'none',
    fallbackUsed,
    query: trimmed,
  };
}

/**
 * Clear the geocoding cache (useful for testing)
 */
export function clearCache() {
  cache.clear();
}

export default { geocode, clearCache };