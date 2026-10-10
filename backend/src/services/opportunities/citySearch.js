import Opportunity from '../../models/Opportunity.js';
import OpportunitySearchCache from '../../models/OpportunitySearchCache.js';
import { fetchAdzuna } from './adzuna.js';
import { fetchJooble } from './jooble.js';
import { fetchJSearch } from './jsearch.js';
import { fetchCompanyBoards } from './companyBoards.js';
import { fetchRemotive } from './remotive.js';
import { fetchHimalayas } from './himalayas.js';
import { fetchArbeitnow } from './arbeitnow.js';
import { canonicalizeCity, canonicalizeCountry, normalizeCountryKey } from './cityUtils.js';

export const SEARCH_CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const inFlightSearches = new Map();

const normalizeIdentity = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const identityKey = (listing) => [listing.title, listing.company || '', listing.city || ''].map(normalizeIdentity).join('|');
const normalizedKeyPart = (value) => normalizeIdentity(value);

export const buildSearchCacheKey = ({ city = '', country = '', role = '', level = '' }) => [
  normalizedKeyPart(canonicalizeCity(city)),
  normalizeCountryKey(canonicalizeCountry(country)),
  normalizedKeyPart(role),
  normalizedKeyPart(level),
].join('|');

export const runWithSearchKeyLock = async (key, work) => {
  const pending = inFlightSearches.get(key);
  if (pending) return { result: await pending, joined: true };
  const promise = Promise.resolve().then(work);
  inFlightSearches.set(key, promise);
  try {
    return { result: await promise, joined: false };
  } finally {
    if (inFlightSearches.get(key) === promise) inFlightSearches.delete(key);
  }
};

const cityProviders = [
  { name: 'Adzuna', fetch: ({ city, country, role, now }) => fetchAdzuna(city, country, role, now) },
  { name: 'Jooble', fetch: ({ city, country, role, now }) => fetchJooble(city, role, country, now) },
  { name: 'JSearch', fetch: ({ city, country, role, now }) => fetchJSearch(city, country, role, now) },
  { name: 'Company boards', fetch: ({ city, country, role, now }) => fetchCompanyBoards(city, country, role, now) },
];

const remoteProviders = [
  { name: 'Remotive', intervalMs: 6 * 60 * 60 * 1000, fetch: fetchRemotive },
  { name: 'Himalayas', intervalMs: 3 * 60 * 60 * 1000, fetch: fetchHimalayas },
  { name: 'Arbeitnow', intervalMs: 3 * 60 * 60 * 1000, fetch: fetchArbeitnow },
];

const fetchRemoteProvider = async (provider, now) => {
  const locked = await runWithSearchKeyLock(`remote-provider|${provider.name}`, async () => {
    const previous = await Opportunity.findOne({ source: provider.name }).sort({ fetchedAt: -1 }).select('_id fetchedAt').lean();
    if (previous?.fetchedAt && now.getTime() - new Date(previous.fetchedAt).getTime() < provider.intervalMs) {
      return { source: provider.name, listings: [], skipped: true, reused: true };
    }
    return provider.fetch(now);
  });
  if (locked.joined) return { ...locked.result, listings: [], skipped: true, reused: true };
  return locked.result;
};

const dedupeCityResults = (listings) => {
  const urls = new Set();
  const identities = new Set();
  return listings.filter((listing) => {
    if (!listing?.url) return false;
    const url = listing.url.toLowerCase().replace(/\/$/, '');
    const identity = identityKey(listing);
    if (urls.has(url) || identities.has(identity)) return false;
    urls.add(url);
    identities.add(identity);
    return true;
  });
};

const existingIdentityKeys = async (listings, now) => {
  const cities = [...new Set(listings.map((listing) => listing.city).filter(Boolean))];
  if (!cities.length) return new Set();
  const docs = await Opportunity.find({ city: { $in: cities }, expiresAt: { $gt: now } })
    .select('title company city')
    .limit(3000)
    .lean();
  return new Set(docs.map(identityKey));
};

const persistListings = async (listings, now) => {
  const batch = dedupeCityResults(listings);
  const priorIdentities = await existingIdentityKeys(batch, now);
  const priorUrls = new Set(await Opportunity.distinct('url', { expiresAt: { $gt: now } }));
  const writes = [];
  for (const listing of batch) {
    const identity = identityKey(listing);
    if (priorUrls.has(listing.url)) {
      writes.push({ updateOne: { filter: { url: listing.url }, update: { $set: listing } } });
      priorIdentities.add(identity);
      continue;
    }
    if (priorIdentities.has(identity)) continue;
    priorIdentities.add(identity);
    priorUrls.add(listing.url);
    writes.push({ updateOne: { filter: { url: listing.url }, update: { $set: listing }, upsert: true } });
  }
  const upserts = writes.filter((write) => write.updateOne.upsert);
  if (writes.length) {
    try {
      await Opportunity.bulkWrite(writes, { ordered: false });
    } catch (error) {
      const writeErrors = error.writeErrors || [];
      const onlyDuplicateUrls = error.code === 11000 || (writeErrors.length > 0 && writeErrors.every((item) => item.code === 11000));
      if (!onlyDuplicateUrls) throw error;
    }
  }
  await Opportunity.deleteMany({ expiresAt: { $lte: now } });
  return { listings: batch, upsertedCount: upserts.length };
};

const sourceName = (result, provider) => result.status === 'fulfilled' ? result.value.source || provider.name : provider.name;

const performCityRefresh = async ({ city, country, role, level, now, providers = null }) => {
  const allProviders = providers
    ? providers.map((provider, index) => ({
      name: provider.source || provider.name || `Test provider ${index + 1}`,
      fetch: () => provider({ city, country, role, level, now }),
    }))
    : [
      ...cityProviders,
      ...remoteProviders.map((provider) => ({
        name: provider.name,
        fetch: () => fetchRemoteProvider(provider, now),
      })),
    ];
  const settled = await Promise.allSettled(allProviders.map((provider) => provider.fetch({ city, country, role, level, now })));
  const sourceCounts = {};
  const sourceErrors = [];
  const allListings = [];
  let succeeded = false;

  settled.forEach((result, index) => {
    const provider = allProviders[index];
    const source = sourceName(result, provider);
    if (result.status === 'rejected') {
      sourceCounts[source] = 0;
      sourceErrors.push(`${source}: ${result.reason?.message || 'request failed'}`);
      return;
    }

    const value = result.value;
    const listings = value.listings || [];
    sourceCounts[source] = value.sourceCounts?.[source] ?? listings.length;
    allListings.push(...listings);
    if (!value.skipped) succeeded = true;
    if (value.sourceErrors?.length) sourceErrors.push(...value.sourceErrors.map((error) => `${source}: ${error}`));
    if (value.failed && !value.sourceErrors?.length) sourceErrors.push(`${source}: ${value.failed} request(s) failed`);
  });

  const { listings, upsertedCount } = await persistListings(allListings, now);
  const cache = await OpportunitySearchCache.findOneAndUpdate(
    { key: buildSearchCacheKey({ city, country, role, level }) },
    {
      $set: {
        city: city || 'India', country, role, level,
        lastFetchedAt: now,
        ...(succeeded ? { lastSuccessfulAt: now } : {}),
        resultCount: listings.length,
        sourceCounts,
        sourceErrors,
      },
    },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  return { cache, fetched: allListings.length, upsertedCount, sourceCounts, sourceErrors };
};

export const ensureCitySearchFresh = async ({ city = '', country = '', role = '', level = '', now = new Date(), providers = null, force = false }) => {
  const normalizedCity = canonicalizeCity(city);
  const normalizedCountry = canonicalizeCountry(country);
  const normalizedRole = String(role || '').trim().slice(0, 160);
  const normalizedLevel = String(level || '').trim().toLowerCase();
  const key = buildSearchCacheKey({ city: normalizedCity, country: normalizedCountry, role: normalizedRole, level: normalizedLevel });
  let cache = await OpportunitySearchCache.findOne({ key }).lean();
  if (!force && cache?.lastFetchedAt && now.getTime() - new Date(cache.lastFetchedAt).getTime() < SEARCH_CACHE_TTL_MS) {
    return { cache, cached: true, key };
  }

  const locked = await runWithSearchKeyLock(key, async () => {
    const afterWait = await OpportunitySearchCache.findOne({ key }).lean();
    if (!force && afterWait?.lastFetchedAt && now.getTime() - new Date(afterWait.lastFetchedAt).getTime() < SEARCH_CACHE_TTL_MS) {
      return { cache: afterWait, fetched: 0, upsertedCount: 0, sourceCounts: afterWait.sourceCounts || {}, sourceErrors: afterWait.sourceErrors || [], cached: true };
    }
    return performCityRefresh({ city: normalizedCity, country: normalizedCountry, role: normalizedRole, level: normalizedLevel, now, providers });
  });
  cache = locked.result.cache;
  return { ...locked.result, cache, key, cached: Boolean(locked.result.cached || locked.joined) };
};

export const refreshPopularCitySearches = async ({ now = new Date() } = {}) => {
  const popularCities = [
    ['Pune', 'India'], ['Mumbai', 'India'], ['Bengaluru', 'India'],
    ['Hyderabad', 'India'], ['Delhi NCR', 'India'], ['Chennai', 'India'],
  ];
  const results = await Promise.allSettled(popularCities.map(([city, country]) => ensureCitySearchFresh({
    city, country, role: DEFAULT_PREWARM_ROLE, now,
  })));
  return {
    prewarmed: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  };
};

const DEFAULT_PREWARM_ROLE = 'software developer OR data analyst OR AI engineer';