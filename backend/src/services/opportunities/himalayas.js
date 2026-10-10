import { normalizeOpportunity, fetchJson } from './normalize.js';

export const fetchHimalayas = async (fetchedAt = new Date()) => {
  let cursor = null;
  const jobs = [];
  for (let page = 0; page < 5; page += 1) {
    const params = new URLSearchParams({ limit: '100' });
    if (cursor) params.set('cursor', cursor);
    const payload = await fetchJson(`https://himalayas.app/jobs/api?${params}`);
    jobs.push(...(payload.jobs || []));
    cursor = payload.nextCursor || null;
    if (!cursor) break;
  }

  const seenUrls = new Set();
  const listings = jobs.map((job) => {
    const restrictions = job.locationRestrictions || [];
    const indiaOnly = restrictions.some((value) => /\bindia\b/i.test(value));
    const global = restrictions.length === 0 || restrictions.some((value) => /worldwide|anywhere|global/i.test(value));
    return normalizeOpportunity({
      title: job.title,
      company: job.companyName,
      location: restrictions.join(', ') || (job.categories || []).join(', '),
      country: indiaOnly && !global ? 'India' : null,
      description: job.description || job.excerpt,
      url: job.applicationLink || job.guid,
      postedAt: job.pubDate,
      workModeHint: 'remote',
      level: (job.seniority || []).join(' '),
      source: 'Himalayas',
      region: indiaOnly && !global ? 'india' : 'global',
    }, fetchedAt);
  }).filter((job) => {
    if (!job || seenUrls.has(job.url)) return false;
    seenUrls.add(job.url);
    return true;
  });
  return { source: 'Himalayas', listings };
};