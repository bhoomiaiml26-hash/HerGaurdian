import prisma from '../../lib/prisma.js';
import { fetchAdzuna } from './adzuna.js';
import { fetchJooble } from './jooble.js';
import { fetchRemotive } from './remotive.js';
import { fetchHimalayas } from './himalayas.js';
import { fetchArbeitnow } from './arbeitnow.js';
import { fetchJSearch } from './jsearch.js';

const DEFAULT_ROLE = 'software developer OR data analyst OR AI engineer';
const PROVIDERS = [
  { source: 'Adzuna', fetch: (now) => fetchAdzuna('', 'India', DEFAULT_ROLE, now) },
  { source: 'Jooble', fetch: (now) => fetchJooble('', DEFAULT_ROLE, 'India', now) },
  { source: 'Remotive', fetch: fetchRemotive },
  { source: 'Himalayas', fetch: fetchHimalayas },
  { source: 'Arbeitnow', fetch: fetchArbeitnow },
  { source: 'JSearch', fetch: (now) => fetchJSearch('', 'India', DEFAULT_ROLE, now) },
];

const identityKey = (listing) => [listing.title, listing.company || '', listing.city || '']
  .map((part) => part.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
  .join('|');

export const dedupeOpportunities = (listings) => {
  const urls = new Set();
  const identities = new Set();
  return listings.filter((listing) => {
    const urlKey = listing.url.toLowerCase().replace(/\/$/, '');
    const identity = identityKey(listing);
    if (urls.has(urlKey) || identities.has(identity)) return false;
    urls.add(urlKey);
    identities.add(identity);
    return true;
  });
};

export const ingestOpportunities = async ({ providers = PROVIDERS, now = new Date() } = {}) => {
  const remotiveCooldownStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const remotiveExisting = providers.some((provider) => provider.source === 'Remotive')
    && await prisma.opportunity.findFirst({ where: { source: 'Remotive', fetchedAt: { gt: remotiveCooldownStart } } });
  const remotiveCached = Boolean(remotiveExisting);
  const settled = await Promise.allSettled(providers.map((provider) => (
    provider.source === 'Remotive' && remotiveCached
      ? Promise.resolve({ source: 'Remotive', listings: [], skipped: true, cached: true })
      : provider.fetch(now)
  )));
  const sourceCounts = {};
  const allListings = [];
  settled.forEach((result, index) => {
    const source = result.status === 'fulfilled' ? result.value.source : providers[index]?.source || `Source ${index + 1}`;
    if (result.status === 'rejected') {
      sourceCounts[source] = { fetched: 0, skipped: false, failed: true };
      return;
    }
    sourceCounts[source] = {
      fetched: result.value.listings.length,
      skipped: Boolean(result.value.skipped),
      failed: Number(result.value.failed || 0) > 0,
      failedQueries: Number(result.value.failed || 0),
    };
    allListings.push(...result.value.listings);
  });

  const listings = dedupeOpportunities(allListings);
  const existing = await prisma.opportunity.findMany({
    where: { expiresAt: { gt: now } },
    select: { id: true, url: true, title: true, company: true, city: true },
    orderBy: { postedAt: 'desc' },
    take: 10000,
  });
  const byUrl = new Map(existing.map((item) => [item.url.toLowerCase().replace(/\/$/, ''), item]));
  const byIdentity = new Map();
  existing.forEach((item) => {
    const key = identityKey(item);
    if (!byIdentity.has(key)) byIdentity.set(key, item);
  });

  const operations = listings
    .map((listing) => {
      const key = listing.url.toLowerCase().replace(/\/$/, '');
      const urlMatch = byUrl.get(key);
      const identityMatch = byIdentity.get(identityKey(listing));
      const data = { ...listing };
      delete data.id;
      if (urlMatch) {
        return prisma.opportunity.update({ where: { id: urlMatch.id }, data });
      }
      if (identityMatch) return null;
      return prisma.opportunity.upsert({
        where: { url: listing.url },
        update: data,
        create: data,
      });
    })
    .filter(Boolean);

  if (operations.length) {
    await prisma.$transaction(operations);
  }
  const expiredResult = await prisma.opportunity.deleteMany({ where: { expiresAt: { lte: now } } });
  const indiaCount = listings.filter((listing) => listing.region === 'india').length;
  const globalCount = listings.length - indiaCount;
  const failedSources = Object.values(sourceCounts).filter((source) => source.failed).length;
  const successfulSources = Object.values(sourceCounts).filter((source) => !source.failed && !source.skipped).length;

  console.info('Opportunity ingestion complete', JSON.stringify({
    sources: sourceCounts,
    fetched: allListings.length,
    deduplicated: listings.length,
    india: indiaCount,
    global: globalCount,
    expiredRemoved: expiredResult.count,
  }));

  return {
    sourceCounts,
    fetched: allListings.length,
    deduplicated: listings.length,
    india: indiaCount,
    global: globalCount,
    expiredRemoved: expiredResult.count,
    lastRefreshedAt: successfulSources > 0 ? now : null,
    failedSources,
  };
};
