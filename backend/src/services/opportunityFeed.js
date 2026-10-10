const FEED_URL = 'https://www.arbeitnow.com/api/job-board-api';
const CACHE_TTL_MS = 15 * 60 * 1000;

let cachedFeed = null;
let cacheExpiresAt = 0;
let pendingRefresh = null;

const SKILL_KEYWORDS = [
  'Python', 'SQL', 'Java', 'JavaScript', 'TypeScript', 'React', 'AWS', 'Azure',
  'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'machine learning',
  'generative AI', 'LLM', 'data analysis', 'cybersecurity', 'DevOps',
];

const safeDate = (value) => {
  if (!value) return null;
  const numeric = Number(value);
  const date = new Date(Number.isFinite(numeric) && numeric > 0 ? numeric * 1000 : value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const normalizeJob = (job) => {
  const applicationUrl = safeUrl(job.url);
  if (!applicationUrl || !job.title) return null;

  const description = String(job.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const searchableText = `${job.title} ${description} ${(job.tags || []).join(' ')}`.toLowerCase();
  const skills = SKILL_KEYWORDS.filter((skill) => new RegExp(`\\b${skill}\\b`, 'i').test(searchableText));
  const tags = [...new Set([...(job.tags || []), ...skills])].slice(0, 8);
  const jobTypes = Array.isArray(job.job_types) ? job.job_types : [];
  const type = /intern|internship/i.test(`${job.title} ${jobTypes.join(' ')}`) ? 'internship' : 'job';
  const level = /intern|student|graduate|entry.level|junior|early.career|fresher/i.test(searchableText)
    ? 'early-career'
    : 'unspecified';

  return {
    id: String(job.slug || applicationUrl),
    title: String(job.title).trim(),
    organization: String(job.company_name || '').trim(),
    type,
    location: String(job.location || '').trim(),
    remote: Boolean(job.remote),
    level,
    tags,
    skills,
    description: description.slice(0, 420),
    applicationUrl,
    publishedAt: safeDate(job.created_at),
    deadline: null,
    status: 'deadline_unverified',
    source: 'Arbeitnow Job Board API',
  };
};

const fetchFeed = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(FEED_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Job source returned HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.data)) throw new Error('Job source returned an invalid response');

    const seen = new Set();
    const opportunities = payload.data.map(normalizeJob).filter((job) => {
      if (!job || seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
    const fetchedAt = new Date().toISOString();
    cachedFeed = {
      opportunities,
      source: 'Arbeitnow Job Board API',
      sourceUrl: FEED_URL,
      fetchedAt,
    };
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return cachedFeed;
  } finally {
    clearTimeout(timeout);
  }
};

export const getOpportunityFeed = async ({ refresh = false } = {}) => {
  if (!refresh && cachedFeed && Date.now() < cacheExpiresAt) {
    return { ...cachedFeed, stale: false };
  }

  try {
    pendingRefresh ||= fetchFeed().finally(() => { pendingRefresh = null; });
    return { ...(await pendingRefresh), stale: false };
  } catch (error) {
    if (cachedFeed) {
      return { ...cachedFeed, stale: true, refreshError: error.message };
    }
    throw error;
  }
};