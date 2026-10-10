import { canonicalizeCity, inferCountry } from './cityUtils.js';

export const SOURCE_URLS = {
  Adzuna: 'https://www.adzuna.com/',
  Jooble: 'https://jooble.org/',
  Remotive: 'https://remotive.com/remote-jobs',
  Himalayas: 'https://himalayas.app/jobs',
  Arbeitnow: 'https://www.arbeitnow.com/',
  JSearch: 'https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch',
};

const INDIA_ALIASES = new Set(['in', 'india', 'ind', 'bharat']);
const INDIA_CITIES = ['Pune', 'Mumbai', 'Bengaluru', 'Bangalore', 'Hyderabad', 'Delhi NCR', 'Delhi', 'Chennai'];

const SKILL_TERMS = [
  'Python', 'SQL', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Ruby', 'PHP',
  'React', 'Angular', 'Vue', 'Node.js', 'Django', 'FastAPI', 'Spring', 'AWS', 'Azure',
  'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Git', 'Linux', 'Excel',
  'Power BI', 'Tableau', 'Pandas', 'PyTorch', 'TensorFlow', 'Machine Learning',
  'Generative AI', 'LLM', 'RAG', 'Data Analysis', 'Data Engineering', 'Cybersecurity',
  'DevOps', 'Figma', 'Product Management', 'SEO', 'Marketing', 'UX Design',
];

export const cleanDescription = (value) => String(value || '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 1000);

export const safeHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export const parseDate = (value) => {
  if (!value) return null;
  const numeric = Number(value);
  const date = new Date(Number.isFinite(numeric) && numeric > 0 ? numeric * 1000 : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const detectLevel = (value, supplied = '') => {
  const explicit = String(supplied || '').toLowerCase();
  const text = `${explicit} ${value || ''}`.toLowerCase();
  if (/\bintern(ship)?\b|\bco-?op\b/.test(text)) return 'intern';
  if (/\b(entry[- ]level|junior|graduates?|freshers?|early career|new grads?)\b/.test(text)) return 'entry';
  if (/\b(senior|staff|principal|lead|head of|director|chief)\b/.test(text)) return 'senior';
  if (/\b(mid[- ]level|intermediate)\b/.test(text)) return 'mid';
  return 'unknown';
};

export const detectWorkMode = (value, supplied = null) => {
  const explicit = String(supplied || '').toLowerCase();
  if (/hybrid/.test(explicit)) return 'hybrid';
  if (/remote|fully distributed|work from home/.test(explicit)) return 'remote';
  if (/on[ -]?site|office based/.test(explicit)) return 'onsite';
  const text = String(value || '').toLowerCase();
  if (/\bhybrid\b/.test(text)) return 'hybrid';
  if (/\b(remote|work from home|fully distributed)\b/.test(text)) return 'remote';
  if (/\b(on[ -]?site|office based)\b/.test(text)) return 'onsite';
  return 'unknown';
};

export const extractSkills = (value, tags = []) => {
  const text = `${value || ''} ${(tags || []).join(' ')}`.toLowerCase();
  return SKILL_TERMS.filter((skill) => new RegExp(`(?<![a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase()}(?![a-z0-9])`, 'i').test(text));
};

const normalizeCountry = (value) => {
  const country = String(value || '').trim();
  if (!country) return null;
  return INDIA_ALIASES.has(country.toLowerCase()) ? 'India' : country;
};

const inferCity = (value, supplied) => {
  if (supplied) return canonicalizeCity(String(supplied).trim().slice(0, 120)) || null;
  const text = String(value || '');
  return INDIA_CITIES.find((city) => new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) || null;
};

export const normalizeOpportunity = (record, fetchedAt = new Date()) => {
  const url = safeHttpUrl(record.url);
  const title = String(record.title || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!url || !title) return null;

  const company = String(record.company || '').trim().slice(0, 200) || null;
  const location = String(record.location || '').trim().replace(/\s+/g, ' ').slice(0, 300) || null;
  const details = `${title} ${location || ''} ${record.description || ''}`;
  const workMode = detectWorkMode(details, record.workMode || record.workModeHint || (record.isRemote === true ? 'remote' : null));
  const skills = extractSkills(`${title} ${record.description || ''}`);
  const city = inferCity(location, record.city);
  const country = normalizeCountry(record.country || inferCountry(city));
  const indiaLocation = /\bindia\b/i.test(`${location || ''} ${country || ''}`);
  const normalizedCountry = country || (indiaLocation ? 'India' : null);
  const mode = workMode === 'remote' ? true : workMode === 'unknown' ? null : false;

  return {
    title,
    company,
    location,
    city,
    country: normalizedCountry,
    isRemote: mode,
    workMode,
    level: detectLevel(`${title} ${record.description || ''}`, record.level || ''),
    skills,
    description: cleanDescription(record.description),
    url,
    source: String(record.source || '').trim() || 'Unknown',
    region: INDIA_ALIASES.has(String(record.region || normalizedCountry || '').toLowerCase()) || indiaLocation ? 'india' : 'global',
    postedAt: parseDate(record.postedAt),
    fetchedAt,
    expiresAt: new Date(fetchedAt.getTime() + 30 * 24 * 60 * 60 * 1000),
  };
};

export const fetchJson = async (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} from job source`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

export const mapWithConcurrency = async (items, limit, worker) => {
  const results = [];
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try { results[index] = await worker(items[index], index); }
      catch (error) { results[index] = { error }; }
    }
  });
  await Promise.all(runners);
  return results;
};