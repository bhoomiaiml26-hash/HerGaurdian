import { normalizeOpportunity, fetchJson } from './normalize.js';

export const fetchArbeitnow = async (fetchedAt = new Date()) => {
  const payload = await fetchJson('https://www.arbeitnow.com/api/job-board-api');
  const listings = (payload.data || []).filter((job) => job.remote).map((job) => normalizeOpportunity({
    title: job.title,
    company: job.company_name,
    location: job.location,
    country: /\bindia\b/i.test(job.location || '') ? 'India' : null,
    description: job.description,
    url: job.url,
    postedAt: job.created_at,
    workModeHint: 'remote',
    level: (job.job_types || []).join(' '),
    skills: job.tags || [],
    source: 'Arbeitnow',
  }, fetchedAt)).filter(Boolean);
  return { source: 'Arbeitnow', listings };
};