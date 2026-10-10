import { normalizeOpportunity, fetchJson } from './normalize.js';
import { ADZUNA_COUNTRY_CODES, canonicalizeCity, canonicalizeCountry, cityTextMatches } from './cityUtils.js';

export const fetchJSearch = async (city = '', country = '', role = '', fetchedAt = new Date()) => {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return { source: 'JSearch', listings: [], skipped: true };

  const requestedCity = canonicalizeCity(city);
  const requestedCountry = canonicalizeCountry(country);
  const place = [requestedCity, requestedCountry].filter(Boolean).join(', ');
  const params = new URLSearchParams({
    query: `${String(role || 'jobs').slice(0, 140)}${place ? ` in ${place}` : ''}`,
    page: '1',
    num_pages: '1',
  });
  const countryCode = ADZUNA_COUNTRY_CODES[requestedCountry];
  if (countryCode) params.set('country', countryCode);
  const payload = await fetchJson(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' },
  });
  const listings = (payload.data || []).flatMap((job) => {
    const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ');
    if (requestedCity && !cityTextMatches(location, requestedCity) && !job.job_is_remote) return [];
    const normalized = normalizeOpportunity({
      title: job.job_title,
      company: job.employer_name,
      location,
      city: job.job_city,
      country: job.job_country,
      description: job.job_description,
      url: job.job_apply_link,
      postedAt: job.job_posted_at_datetime_utc,
      workModeHint: job.job_is_remote ? 'remote' : null,
      level: job.job_required_experience?.required_experience_in_months,
      source: 'JSearch',
    }, fetchedAt);
    return normalized ? [normalized] : [];
  });
  return { source: 'JSearch', listings };
};