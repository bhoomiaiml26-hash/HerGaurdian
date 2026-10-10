import { normalizeOpportunity, fetchJson, mapWithConcurrency, SOURCE_URLS } from './normalize.js';
import { ADZUNA_COUNTRY_CODES, canonicalizeCountry, canonicalizeCity, cityTextMatches } from './cityUtils.js';

const DEFAULT_ROLE = 'software developer OR data analyst OR AI engineer OR product manager';
const FALLBACK_COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore', 'Germany'];

const normalizeRows = (rows, sourceCountry, requestedCity, fetchedAt) => (rows || []).flatMap((job) => {
  const location = job.location?.display_name || '';
  if (requestedCity && !cityTextMatches(location, requestedCity)) return [];
  const area = job.location?.area || [];
  const listingCountry = area.find((part) => canonicalizeCountry(part) === sourceCountry) || sourceCountry;
  const suppliedCity = area.length ? area.at(-1) : '';
  const normalized = normalizeOpportunity({
    title: job.title,
    company: job.company?.display_name,
    location,
    city: suppliedCity || requestedCity,
    country: listingCountry,
    description: job.description,
    url: job.redirect_url,
    postedAt: job.created,
    source: 'Adzuna',
    region: sourceCountry === 'India' ? 'india' : 'global',
  }, fetchedAt);
  return normalized ? [normalized] : [];
});

const requestCity = async ({ city, country, role, appId, appKey, fetchedAt }) => {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '30',
    what: String(role || DEFAULT_ROLE).slice(0, 160),
  });
  if (city) params.set('where', city);
  const code = ADZUNA_COUNTRY_CODES[country];
  if (!code) throw new Error(`Adzuna does not support country: ${country}`);
  const payload = await fetchJson(`https://api.adzuna.com/v1/api/jobs/${code}/search/1?${params}`);
  return normalizeRows(payload.results || [], country, city, fetchedAt);
};

export const fetchAdzuna = async (city = '', country = 'India', role = '', fetchedAt = new Date()) => {
  const { ADZUNA_APP_ID: appId, ADZUNA_APP_KEY: appKey } = process.env;
  if (!appId || !appKey) return { source: 'Adzuna', listings: [], skipped: true };

  const requestedCity = canonicalizeCity(city);
  const requestedCountry = canonicalizeCountry(country);
  const countries = requestedCountry && ADZUNA_COUNTRY_CODES[requestedCountry]
    ? [requestedCountry]
    : FALLBACK_COUNTRIES;
  const results = await mapWithConcurrency(countries, 3, (sourceCountry) => requestCity({
    city: requestedCity,
    country: sourceCountry,
    role,
    appId,
    appKey,
    fetchedAt,
  }));
  return {
    source: 'Adzuna',
    listings: results.flatMap((result) => result.error ? [] : result),
    failed: results.filter((result) => result.error).length,
    sourceErrors: results.flatMap((result, index) => result.error ? [`Adzuna ${countries[index]}: ${result.error.message}`] : []),
  };
};

export { SOURCE_URLS };