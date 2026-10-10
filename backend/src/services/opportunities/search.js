import Opportunity from '../../models/Opportunity.js';
import OpportunityPreference from '../../models/OpportunityPreference.js';
import { canonicalizeCity, canonicalizeCountry, cityTextMatches, citiesForSearch, isKnownCity } from './cityUtils.js';

const tokens = (value) => String(value || '').toLowerCase().match(/[a-z0-9+#.]+/g) || [];
const normalized = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const compareNewest = (left, right) => new Date(right.postedAt || 0) - new Date(left.postedAt || 0);

export const scoreOpportunity = (job, preferences = {}, params = {}, now = new Date()) => {
  const title = normalized(job.title);
  const company = normalized(job.company);
  const skills = (job.skills || []).map(normalized);
  const description = normalized(job.description);
  const locationText = `${job.location || ''} ${job.city || ''}`;
  const location = normalized(`${locationText} ${job.country || ''}`);
  let score = 0;

  const queryTokens = tokens(params.q);
  if (queryTokens.length) {
    const titleHits = queryTokens.filter((token) => title.includes(token)).length;
    const skillHits = queryTokens.filter((token) => skills.some((skill) => skill.includes(token))).length;
    const otherHits = queryTokens.filter((token) => company.includes(token) || description.includes(token)).length;
    if (!titleHits && !skillHits && !otherHits) return null;
    score += titleHits * 5 + skillHits * 4 + otherHits;
    if (normalized(params.q) && title.includes(normalized(params.q))) score += 8;
  }

  const requestedCity = canonicalizeCity(params.city || params.location);
  const requestedCountry = canonicalizeCountry(params.country);
  const requestedModes = params.workModes || (params.workMode ? [params.workMode] : []);
  const locationMatch = Boolean(requestedCity && cityTextMatches(locationText, requestedCity));
  const countryMatch = !requestedCountry || !job.country || canonicalizeCountry(job.country) === requestedCountry;
  const exactCityMatch = locationMatch && countryMatch;
  const nearbyCities = citiesForSearch(requestedCity).slice(1);
  const nearbyMatch = Boolean(requestedCity && countryMatch && nearbyCities.some((city) => cityTextMatches(locationText, city)));
  const modeMatch = requestedModes.some((mode) => job.workMode === mode);

  if (exactCityMatch) score += 40;
  else if (nearbyMatch) score += 25;
  else if (job.workMode === 'remote') score += 18;
  else if (job.region === 'india') score += 12;
  else score += 3;
  if (modeMatch) score += 8;

  const levelMatch = !params.level || job.level === params.level;
  if (params.level && levelMatch) score += 6;

  const rolePrefs = (preferences.roles || []).map(normalized);
  const preferredCities = (preferences.cities || []).map(normalized);
  const preferredModes = preferences.workModes || [];
  const preferredLevels = preferences.levels || [];
  const preferredSkills = (preferences.skills || []).map(normalized);
  if (rolePrefs.some((role) => title.includes(role) || role.includes(title))) score += 14;
  if (preferredCities.some((city) => location.includes(city))) score += 10;
  if (preferredModes.includes(job.workMode)) score += 7;
  if (preferredLevels.includes(job.level)) score += 6;
  score += skills.filter((skill) => preferredSkills.includes(skill)).length * 5;

  const postedAt = job.postedAt ? new Date(job.postedAt) : null;
  if (postedAt && !Number.isNaN(postedAt.getTime())) {
    const ageDays = Math.max(0, (now - postedAt) / 86400000);
    score += Math.max(0, 5 - ageDays / 6);
  }
  if (job.region === 'india' && (params.region || 'india') !== 'global') score += 5;

  const section = exactCityMatch ? 'exactCity'
    : nearbyMatch ? 'nearby'
      : job.workMode === 'remote' ? 'remote'
        : job.region === 'india' ? 'india'
          : 'global';
  return { score, exactCityMatch, nearbyMatch, section, levelMatch, modeMatch };
};

const sectionTitles = (city) => ({
  exactCity: city ? `In ${city}` : 'Matching opportunities',
  nearby: 'Nearby',
  remote: 'Remote',
  india: 'India-wide',
  global: 'Global',
});
const SECTION_ORDER = { exactCity: 0, nearby: 1, remote: 2, india: 3, global: 4 };

export const searchOpportunities = async ({ userId, params = {}, cacheResult = null, now = new Date() }) => {
  const [storedPreferences, rawDocs] = await Promise.all([
    OpportunityPreference.findOne({ user: userId }).lean(),
    Opportunity.find({ expiresAt: { $gt: now }, ...(params.region === 'global' ? { region: 'global' } : {}) })
      .sort({ postedAt: -1 })
      .limit(10000)
      .lean(),
  ]);
  const preferences = storedPreferences || { includeGlobal: true, roles: [], cities: [], workModes: [], levels: [], skills: [] };
  const docs = rawDocs.filter((job) => params.region === 'global'
    ? job.region === 'global'
    : preferences.includeGlobal !== false || job.region === 'india');
  const scored = docs.map((job) => ({ ...job, _match: scoreOpportunity(job, preferences, params, now) }))
    .filter((job) => job._match);
  const requestedCity = canonicalizeCity(params.city || params.location);
  const exactMatches = scored.filter((job) => job._match.section === 'exactCity');
  const requestedModes = params.workModes || [];
  const strictMatches = scored.filter((job) => {
    if (requestedCity) {
      return requestedModes.includes('remote')
        ? job._match.exactCityMatch || job.workMode === 'remote'
        : job._match.exactCityMatch;
    }
    return !requestedModes.length || job._match.modeMatch;
  });
  const canBroadenCity = Boolean(requestedCity && exactMatches.length < 5
    && (isKnownCity(requestedCity) || exactMatches.length > 0));
  const visibleScored = canBroadenCity
    ? requestedModes.includes('remote')
      ? scored.filter((job) => job._match.exactCityMatch || job._match.nearbyMatch || job.workMode === 'remote')
      : scored
    : requestedCity || requestedModes.length ? strictMatches : scored;
  const sorted = visibleScored.sort((left, right) => SECTION_ORDER[left._match.section] - SECTION_ORDER[right._match.section]
    || right._match.score - left._match.score
    || compareNewest(left, right));
  const grouped = { exactCity: [], nearby: [], remote: [], india: [], global: [] };
  sorted.forEach((job) => grouped[job._match.section].push(job));

  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, Number.parseInt(params.limit, 10) || 20));
  const pageItems = (items) => items.slice((page - 1) * limit, page * limit).map(({ _match, ...job }) => ({ ...job, score: _match.score }));
  const sections = Object.entries(grouped).map(([key, items]) => ({
    key,
    title: sectionTitles(canonicalizeCity(params.city || params.location))[key],
    totalCount: items.length,
    opportunities: pageItems(items),
  })).filter((section) => section.totalCount > 0 || section.key === 'exactCity');
  const opportunities = sections.flatMap((section) => section.opportunities);
  const exactCityCount = exactMatches.length;
  const hasBroaderMatches = grouped.nearby.length + grouped.remote.length + grouped.india.length + grouped.global.length > 0;
  const sourceCounts = {
    ...(cacheResult?.sourceCounts || cacheResult?.cache?.sourceCounts || {}),
  };
  const visibleSourceCounts = {};
  visibleScored.forEach((job) => {
    visibleSourceCounts[job.source] = (visibleSourceCounts[job.source] || 0) + 1;
  });
  Object.entries(visibleSourceCounts).forEach(([source, count]) => {
    sourceCounts[source] = Math.max(sourceCounts[source] || 0, count);
  });
  const latestFetch = scored.reduce((latest, job) => job.fetchedAt && (!latest || job.fetchedAt > latest) ? job.fetchedAt : latest, null);
  const beforeLastVisit = storedPreferences?.lastVisitAt || null;
  await OpportunityPreference.updateOne({ user: userId }, { $set: { lastVisitAt: now }, $setOnInsert: { user: userId } }, { upsert: true });

  const strictIds = new Set(strictMatches.map((job) => String(job._id)));
  const relaxedCount = visibleScored.filter((job) => !strictIds.has(String(job._id))).length;
  const relaxed = Boolean(canBroadenCity && relaxedCount > 0);
  const message = relaxed && hasBroaderMatches
    ? requestedModes.includes('remote')
      ? `Only ${exactCityCount} exact ${requestedCity} match(es); also showing nearby and remote matches.`
      : `Only ${exactCityCount} exact ${requestedCity} match(es); also showing nearby, remote, India-wide, and global listings.`
    : requestedCity && exactCityCount === 0 && !isKnownCity(requestedCity) && !requestedModes.includes('remote')
      ? `No jobs found in ${requestedCity}. Try a verified nearby city or select Remote.`
      : null;
  const cache = cacheResult?.cache;
  const lastRefreshedAt = cache?.lastSuccessfulAt || latestFetch || null;
  const sourceErrors = cacheResult?.sourceErrors || cache?.sourceErrors || [];

  return {
    opportunities,
    sections,
    meta: {
      totalCount: scored.length,
      exactCityCount,
      page,
      limit,
      lastRefreshedAt,
      sources: Object.keys(sourceCounts),
      sourceCounts,
      sourceErrors,
      relaxed,
      message,
      lastVisitAt: beforeLastVisit,
    },
  };
};