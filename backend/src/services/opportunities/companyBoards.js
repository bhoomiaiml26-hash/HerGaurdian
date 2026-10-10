import { readFile } from 'node:fs/promises';
import { normalizeOpportunity, fetchJson } from './normalize.js';
import { cityTextMatches, canonicalizeCity } from './cityUtils.js';

const BOARD_CONFIG_URL = new URL('./companyBoards.json', import.meta.url);
let cachedBoards = null;

const getBoards = async () => {
  if (!cachedBoards) cachedBoards = JSON.parse(await readFile(BOARD_CONFIG_URL, 'utf8'));
  return cachedBoards;
};

const roleMatches = (job, role) => {
  const requested = String(role || '').trim().toLowerCase();
  if (!requested) return true;
  const text = `${job.title || ''} ${job.descriptionPlain || job.description || job.content || ''}`.toLowerCase();
  const alternatives = requested.split(/\s+or\s+/i).map((part) => part.trim()).filter(Boolean);
  return alternatives.some((alternative) => alternative.split(/\s+/).every((word) => text.includes(word)));
};

const parseGreenhouse = (board, jobs, city, country, role, fetchedAt) => (jobs || []).flatMap((job) => {
  const location = job.location?.name || (job.offices || []).map((office) => office.name).filter(Boolean).join(', ');
  if (!location || !cityTextMatches(location, city) || !roleMatches(job, role)) return [];
  const normalized = normalizeOpportunity({
    title: job.title,
    company: board.name,
    location,
    city,
    country,
    description: job.content,
    url: job.absolute_url,
    postedAt: job.updated_at,
    source: `Greenhouse: ${board.name}`,
  }, fetchedAt);
  return normalized ? [normalized] : [];
});

const parseLever = (board, jobs, city, country, role, fetchedAt) => (jobs || []).flatMap((job) => {
  const location = job.categories?.location || job.categories?.allLocations?.join(', ');
  if (!location || !cityTextMatches(location, city) || !roleMatches(job, role)) return [];
  const normalized = normalizeOpportunity({
    title: job.text,
    company: board.name,
    location,
    city,
    country: country || job.country,
    description: job.descriptionPlain || job.openingPlain,
    url: job.hostedUrl || job.applyUrl,
    postedAt: job.createdAt,
    workMode: job.workplaceType,
    source: `Lever: ${board.name}`,
  }, fetchedAt);
  return normalized ? [normalized] : [];
});

const parseAshby = (board, jobs, city, country, role, fetchedAt) => (jobs || []).flatMap((job) => {
  if (job.isListed === false) return [];
  const location = [job.location, ...(job.secondaryLocations || []).map((item) => item.location)].filter(Boolean).join(', ');
  if (!location || !cityTextMatches(location, city) || !roleMatches(job, role)) return [];
  const normalized = normalizeOpportunity({
    title: job.title,
    company: board.name,
    location,
    city,
    country: job.address?.postalAddress?.addressCountry || country,
    description: job.descriptionPlain,
    url: job.jobUrl || job.applyUrl,
    postedAt: job.publishedAt,
    workMode: job.workplaceType,
    isRemote: job.isRemote,
    source: `Ashby: ${board.name}`,
  }, fetchedAt);
  return normalized ? [normalized] : [];
});

const fetchBoard = async (board, city, country, role, fetchedAt) => {
  const token = encodeURIComponent(board.boardToken);
  if (board.provider === 'greenhouse') {
    const payload = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
    return parseGreenhouse(board, payload.jobs, city, country, role, fetchedAt);
  }
  if (board.provider === 'lever') {
    const payload = await fetchJson(`https://api.lever.co/v0/postings/${token}?mode=json&limit=100`);
    return parseLever(board, payload, city, country, role, fetchedAt);
  }
  if (board.provider === 'ashby') {
    const payload = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${token}`);
    return parseAshby(board, payload.jobs, city, country, role, fetchedAt);
  }
  throw new Error(`Unsupported public board provider: ${board.provider}`);
};

export const fetchCompanyBoards = async (city = '', country = '', role = '', fetchedAt = new Date()) => {
  const requestedCity = canonicalizeCity(city);
  if (!requestedCity) return { source: 'Company boards', listings: [], skipped: true };
  const boards = await getBoards();
  const results = await Promise.allSettled(boards.map((board) => fetchBoard(board, requestedCity, country, role, fetchedAt)));
  return {
    source: 'Company boards',
    listings: results.flatMap((result) => result.status === 'fulfilled' ? result.value : []),
    failed: results.filter((result) => result.status === 'rejected').length,
    sourceErrors: results.flatMap((result, index) => result.status === 'rejected'
      ? [`${boards[index].provider}: ${result.reason?.message || 'request failed'}`]
      : []),
  };
};