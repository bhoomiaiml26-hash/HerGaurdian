import { normalizeOpportunity, fetchJson } from './normalize.js';

export const fetchRemotive = async (fetchedAt = new Date()) => {
  const payload = await fetchJson('https://remotive.com/api/remote-jobs?limit=100');
  const listings = (payload.jobs || []).map((job) => normalizeOpportunity({
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || 'Remote',
    country: /\bindia\b/i.test(job.candidate_required_location || '') ? 'India' : null,
    description: job.description,
    url: job.url,
    postedAt: job.publication_date,
    workModeHint: 'remote',
    level: job.job_type,
    skills: job.tags || [],
    source: 'Remotive',
  }, fetchedAt)).filter(Boolean);
  return { source: 'Remotive', listings };
};