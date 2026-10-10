import { normalizeOpportunity, fetchJson } from './normalize.js';
import { canonicalizeCity, canonicalizeCountry, cityTextMatches } from './cityUtils.js';

export const fetchJooble = async (city = '', role = '', country = '', fetchedAt = new Date()) => {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return { source: 'Jooble', listings: [], skipped: true };

  const requestedCity = canonicalizeCity(city);
  const requestedCountry = canonicalizeCountry(country);
  const location = [requestedCity, requestedCountry].filter(Boolean).join(', ');
  const payload = await fetchJson(`https://jooble.org/api/${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keywords: String(role || 'jobs').slice(0, 160),
      location,
      page: 1,
    }),
  });
  const listings = (payload.jobs || []).flatMap((job) => {
    const listingLocation = String(job.location || '').trim();
    if (requestedCity && !cityTextMatches(listingLocation, requestedCity)) return [];
    const normalized = normalizeOpportunity({
      title: job.title,
      company: job.company,
      location: listingLocation,
      city: requestedCity,
      country: requestedCountry || undefined,
      description: job.snippet,
      url: job.link,
      postedAt: job.updated,
      source: 'Jooble',
      region: requestedCountry === 'India' ? 'india' : 'global',
    }, fetchedAt);
    return normalized ? [normalized] : [];
  });

  return { source: 'Jooble', listings };
};