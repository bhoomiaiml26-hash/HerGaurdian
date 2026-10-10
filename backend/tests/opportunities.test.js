import test, { before, beforeEach, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { normalizeOpportunity } from '../src/services/opportunities/normalize.js';
import { ensureCitySearchFresh, buildSearchCacheKey, SEARCH_CACHE_TTL_MS } from '../src/services/opportunities/citySearch.js';
import { fetchAdzuna } from '../src/services/opportunities/adzuna.js';
import { fetchJooble } from '../src/services/opportunities/jooble.js';
import { fetchRemotive } from '../src/services/opportunities/remotive.js';
import { fetchHimalayas } from '../src/services/opportunities/himalayas.js';
import { fetchArbeitnow } from '../src/services/opportunities/arbeitnow.js';
import { fetchJSearch } from '../src/services/opportunities/jsearch.js';
import { fetchCompanyBoards } from '../src/services/opportunities/companyBoards.js';
import { canonicalizeCity, inferCountry, parseLocation, citiesForSearch, cityTextMatches } from '../src/services/opportunities/cityUtils.js';
import { dedupeOpportunities } from '../src/services/opportunities/ingest.js';
import { scoreOpportunity, searchOpportunities } from '../src/services/opportunities/search.js';
import Opportunity from '../src/models/Opportunity.js';
import OpportunitySearchCache from '../src/models/OpportunitySearchCache.js';
import OpportunityPreference from '../src/models/OpportunityPreference.js';
import User from '../src/models/User.js';
import app from '../src/app.js';

const response = (body) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

const adzunaJob = {
  title: 'Full Stack Developer Intern',
  company: { display_name: 'Source Employer' },
  location: { display_name: 'Pune, Maharashtra', area: ['India', 'Maharashtra', 'Pune'] },
  description: '<p>Python and SQL development work.</p>',
  redirect_url: 'https://jobs.example.test/adzuna',
  created: '2026-10-09T10:00:00Z',
};

test('normalizes fixed skills, dates, India region, and rejects invalid application URLs', () => {
  const normalized = normalizeOpportunity({
    title: 'Full Stack Developer Intern',
    company: 'Example Co',
    location: 'Pune, India',
    description: '<p>Python and SQL. Remote hybrid role.</p>',
    url: 'https://jobs.example.test/apply',
    postedAt: '2026-10-09T10:00:00Z',
    source: 'Fixture',
  }, new Date('2026-10-10T00:00:00Z'));

  assert.equal(normalized.region, 'india');
  assert.equal(normalized.city, 'Pune');
  assert.equal(normalized.level, 'intern');
  assert.equal(normalized.workMode, 'hybrid');
  assert.deepEqual(normalized.skills, ['Python', 'SQL']);
  assert.equal(normalized.description, 'Python and SQL. Remote hybrid role.');
  assert.equal(normalized.expiresAt.toISOString(), '2026-11-09T00:00:00.000Z');
  assert.equal(normalizeOpportunity({ title: 'Bad', url: 'javascript:alert(1)' }), null);
  const fresher = normalizeOpportunity({ title: 'Software Developer', description: 'Open to freshers and recent graduates.', url: 'https://jobs.example.test/fresher' });
  assert.equal(fresher.level, 'entry');
});

test('canonicalizes city aliases, infers India for known cities, and passes unknown cities through', () => {
  assert.equal(canonicalizeCity('Bangalore'), 'Bengaluru');
  assert.equal(canonicalizeCity('Gurgaon'), 'Gurugram');
  assert.equal(parseLocation('Pune, India').country, 'India');
  assert.equal(inferCountry('London'), '');
  assert.equal(parseLocation('London').city, 'London');
  assert.equal(parseLocation('zzzzz').city, 'zzzzz');
  assert.deepEqual(citiesForSearch('Pune'), ['Pune', 'Pimpri-Chinchwad']);
  assert.equal(cityTextMatches('Londonderry, United Kingdom', 'London'), false);
  assert.equal(cityTextMatches('London, United Kingdom', 'London'), true);
});

test('Adzuna adapter maps India city results and covers configured city/query batches', async (context) => {
  const oldId = process.env.ADZUNA_APP_ID;
  const oldKey = process.env.ADZUNA_APP_KEY;
  process.env.ADZUNA_APP_ID = 'fixture-app';
  process.env.ADZUNA_APP_KEY = 'fixture-key';
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => response({ results: [adzunaJob] }));
  context.after(() => {
    if (oldId === undefined) delete process.env.ADZUNA_APP_ID;
    else process.env.ADZUNA_APP_ID = oldId;
    if (oldKey === undefined) delete process.env.ADZUNA_APP_KEY;
    else process.env.ADZUNA_APP_KEY = oldKey;
  });

  const result = await fetchAdzuna('Pune', 'India', 'Full Stack Developer', new Date('2026-10-10T00:00:00Z'));
  assert.equal(result.source, 'Adzuna');
  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].region, 'india');
  assert.equal(result.listings[0].city, 'Pune');
  assert.equal(result.listings[0].url, adzunaJob.redirect_url);
  const request = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.match(request.pathname, /\/jobs\/in\/search/);
  assert.equal(request.searchParams.get('where'), 'Pune');
  assert.equal(request.searchParams.get('what'), 'Full Stack Developer');
});

test('Jooble adapter maps India city results and safely skips when its key is absent', async (context) => {
  const oldKey = process.env.JOOBLE_API_KEY;
  process.env.JOOBLE_API_KEY = 'fixture-jooble-key';
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => response({ jobs: [{
    title: 'Data Analyst Intern', company: 'Example', location: 'Pune', snippet: 'SQL and Python',
    link: 'https://jobs.example.test/jooble', updated: '2026-10-09',
  }] }));
  context.after(() => {
    if (oldKey === undefined) delete process.env.JOOBLE_API_KEY;
    else process.env.JOOBLE_API_KEY = oldKey;
  });

  const result = await fetchJooble('Pune', 'Data Analyst Intern', 'India', new Date('2026-10-10T00:00:00Z'));
  assert.equal(result.source, 'Jooble');
  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].region, 'india');
  assert.equal(result.listings[0].city, 'Pune');
  assert.equal(fetchMock.mock.calls[0].arguments[1].body.includes('Pune, India'), true);
  assert.equal(fetchMock.mock.calls[0].arguments[1].body.includes('Data Analyst Intern'), true);
});

test('official Greenhouse boards return only postings matching the requested city and role', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => response({ jobs: [
    { title: 'Data Analyst', location: { name: 'Nashik, India' }, content: 'SQL role', absolute_url: 'https://boards.greenhouse.io/stripe/jobs/1' },
    { title: 'Remote Analyst', location: { name: 'Remote' }, content: 'SQL role', absolute_url: 'https://boards.greenhouse.io/stripe/jobs/2' },
  ] }));
  const result = await fetchCompanyBoards('Nashik', 'India', 'Data Analyst', new Date('2026-10-10T00:00:00Z'));
  assert.equal(result.listings.length, 2);
  assert.ok(result.listings.every((listing) => listing.city === 'Nashik' && listing.title === 'Data Analyst'));
  assert.deepEqual(result.listings.map((listing) => listing.source).sort(), ['Greenhouse: Cloudflare', 'Greenhouse: Stripe']);
});

test('Remotive, Himalayas, and Arbeitnow retain source application URLs and remote facts', async (context) => {
  const remoteRemotive = {
    jobs: [{ title: 'Remote Python Engineer', company_name: 'Remote Co', candidate_required_location: 'Worldwide',
      description: 'Python role', url: 'https://remotive.com/remote-jobs/example', publication_date: '2026-10-09T10:00:00Z', tags: ['Python'] }],
  };
  context.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).startsWith('https://remotive.com/')) return response(remoteRemotive);
    if (String(url).startsWith('https://himalayas.app/')) return response({ jobs: [{
      title: 'Remote Data Analyst Intern', companyName: 'Himalayas Co', locationRestrictions: ['India'],
      description: 'SQL internship', applicationLink: 'https://himalayas.app/companies/example/jobs/analyst', pubDate: 1791453600,
    }] });
    return response({ data: [
      { title: 'Remote Engineer', company_name: 'Arbeit Co', location: 'Remote Worldwide', description: 'Python', url: 'https://www.arbeitnow.com/jobs/remote', remote: true, created_at: 1791453600, tags: ['Python'] },
      { title: 'Office Engineer', company_name: 'Office Co', location: 'Berlin', description: 'Java', url: 'https://www.arbeitnow.com/jobs/office', remote: false },
    ] });
  });

  const remotive = await fetchRemotive(new Date('2026-10-10T00:00:00Z'));
  const himalayas = await fetchHimalayas(new Date('2026-10-10T00:00:00Z'));
  const arbeitnow = await fetchArbeitnow(new Date('2026-10-10T00:00:00Z'));
  assert.equal(remotive.listings[0].workMode, 'remote');
  assert.equal(remotive.listings[0].url, remoteRemotive.jobs[0].url);
  assert.equal(himalayas.listings[0].region, 'india');
  assert.equal(himalayas.listings[0].workMode, 'remote');
  assert.equal(himalayas.listings[0].url, 'https://himalayas.app/companies/example/jobs/analyst');
  assert.equal(arbeitnow.listings.length, 1);
  assert.equal(arbeitnow.listings[0].workMode, 'remote');
});

test('JSearch adapter silently skips when the optional RapidAPI key is missing', async (context) => {
  const oldKey = process.env.RAPIDAPI_KEY;
  delete process.env.RAPIDAPI_KEY;
  context.after(() => {
    if (oldKey !== undefined) process.env.RAPIDAPI_KEY = oldKey;
  });
  const result = await fetchJSearch();
  assert.deepEqual(result, { source: 'JSearch', listings: [], skipped: true });
});

test('JSearch adapter maps the original application link and source-provided fields', async (context) => {
  const oldKey = process.env.RAPIDAPI_KEY;
  process.env.RAPIDAPI_KEY = 'fixture-rapidapi-key';
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => response({ data: [{
    job_title: 'Data Analyst', employer_name: 'JSearch Employer', job_city: 'Pune', job_country: 'India',
    job_description: 'SQL and Python reporting', job_apply_link: 'https://jobs.example.test/jsearch',
    job_posted_at_datetime_utc: '2026-10-09T10:00:00Z', job_is_remote: true, job_required_experience: {},
  }] }));
  context.after(() => {
    if (oldKey === undefined) delete process.env.RAPIDAPI_KEY;
    else process.env.RAPIDAPI_KEY = oldKey;
  });

  const result = await fetchJSearch('Pune', 'India', 'Data Analyst', new Date('2026-10-10T00:00:00Z'));
  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].company, 'JSearch Employer');
  assert.equal(result.listings[0].region, 'india');
  assert.equal(result.listings[0].workMode, 'remote');
  assert.equal(result.listings[0].url, 'https://jobs.example.test/jsearch');
  const request = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(request.searchParams.get('query'), 'Data Analyst in Pune, India');
});

test('dedupe removes repeated URLs and same title-company-city records', () => {
  const base = { title: 'Software Engineer', company: 'Example', city: 'Pune', url: 'https://jobs.example.test/a' };
  const unique = dedupeOpportunities([
    base,
    { ...base, url: 'https://jobs.example.test/b' },
    { ...base, title: 'Data Engineer', url: 'https://jobs.example.test/a' },
    { ...base, company: 'Other Company', url: 'https://jobs.example.test/c' },
  ]);
  assert.equal(unique.length, 2);
});

test('preference scoring boosts the requested city and overlapping skills', () => {
  const now = new Date('2026-10-10T00:00:00Z');
  const preferred = { roles: ['Full Stack Developer'], cities: ['Pune'], workModes: [], levels: ['entry'], skills: ['Python'], includeGlobal: true };
  const first = scoreOpportunity({
    title: 'Full Stack Developer', company: 'A', city: 'Pune', location: 'Pune, India', country: 'India',
    region: 'india', workMode: 'onsite', level: 'entry', skills: ['Python'], postedAt: now,
  }, preferred, { q: '', location: '', region: 'india' }, now);
  const second = scoreOpportunity({
    title: 'Full Stack Developer', company: 'B', city: 'Berlin', location: 'Berlin, Germany', country: 'Germany',
    region: 'global', workMode: 'remote', level: 'mid', skills: ['Java'], postedAt: now,
  }, preferred, { q: '', location: '', region: 'india' }, now);
  assert.ok(first.score > second.score);
});

describe('opportunity database search and account isolation', () => {
  let mongoServer;
  let server;
  let baseUrl;
  let userA;
  let userB;
  let tokenA;
  let tokenB;
  const testSecret = `opportunity-test-${crypto.randomUUID()}`;
  let previousJwtSecret;
  let previousCronSecret;

  before(async () => {
    previousJwtSecret = process.env.JWT_SECRET;
    previousCronSecret = process.env.CRON_SECRET;
    process.env.JWT_SECRET = testSecret;
    process.env.CRON_SECRET = 'fixture-cron-secret';
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    userA = await User.create({ name: 'Opportunity A', email: `opp-a-${crypto.randomUUID()}@example.test`, password: 'Password123' });
    userB = await User.create({ name: 'Opportunity B', email: `opp-b-${crypto.randomUUID()}@example.test`, password: 'Password123' });
    tokenA = jwt.sign({ id: userA._id }, testSecret, { expiresIn: '10m' });
    tokenB = jwt.sign({ id: userB._id }, testSecret, { expiresIn: '10m' });
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/opportunities`;
  });

  beforeEach(async () => {
    await Opportunity.deleteMany({});
    await OpportunityPreference.deleteMany({});
    await OpportunitySearchCache.deleteMany({});
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongoServer.stop();
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    if (previousCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previousCronSecret;
  });

  it('treats selected city plus remote as OR and returns relevant relaxed matches', async () => {
    const now = new Date();
    await Opportunity.insertMany([
      { title: 'Full Stack Developer Intern', company: 'Pune Labs', location: 'Pune, India', city: 'Pune', country: 'India', isRemote: false, workMode: 'onsite', level: 'intern', skills: ['Python'], description: 'Full stack Python work', url: 'https://jobs.example.test/pune', source: 'Fixture', region: 'india', postedAt: now, fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000) },
      { title: 'Full Stack Developer', company: 'Pimpri Labs', location: 'Pimpri-Chinchwad, India', city: 'Pimpri-Chinchwad', country: 'India', isRemote: false, workMode: 'onsite', level: 'mid', skills: ['Java'], description: 'Full stack nearby role', url: 'https://jobs.example.test/pimpri', source: 'Fixture', region: 'india', postedAt: now, fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000) },
      { title: 'Remote Full Stack Developer', company: 'Remote Labs', location: 'Remote India', country: 'India', isRemote: true, workMode: 'remote', level: 'entry', skills: ['JavaScript'], description: 'Full stack remote role', url: 'https://jobs.example.test/remote', source: 'Fixture', region: 'india', postedAt: now, fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000) },
      { title: 'Full Stack Developer', company: 'Mumbai Labs', location: 'Mumbai, India', city: 'Mumbai', country: 'India', isRemote: false, workMode: 'onsite', level: 'mid', skills: ['Java'], description: 'Full stack role', url: 'https://jobs.example.test/mumbai', source: 'Fixture', region: 'india', postedAt: now, fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000) },
      { title: 'Full Stack Developer', company: 'Berlin Labs', location: 'Berlin, Germany', city: 'Berlin', country: 'Germany', isRemote: false, workMode: 'onsite', level: 'mid', skills: ['Java'], description: 'Full stack role', url: 'https://jobs.example.test/berlin', source: 'Fixture', region: 'global', postedAt: now, fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000) },
    ]);

    const result = await searchOpportunities({ userId: userA._id, params: {
      q: 'full stack developer', location: 'Pune', workModes: ['remote'], level: 'intern', region: 'india', page: 1, limit: 20,
    } });
    const titles = result.opportunities.map((item) => item.title);
    assert.ok(titles.includes('Full Stack Developer Intern'));
    assert.ok(titles.includes('Remote Full Stack Developer'));
    assert.ok(!result.opportunities.some((job) => job.company === 'Berlin Labs'));
    assert.equal(result.meta.relaxed, true);
    assert.match(result.meta.message, /nearby and remote matches/);
    assert.ok(result.sections.find((section) => section.key === 'exactCity')?.opportunities.some((job) => job.city === 'Pune'));
    assert.ok(result.sections.find((section) => section.key === 'remote')?.opportunities.some((job) => job.workMode === 'remote'));
  });

  it('returns a useful no-match result for nonsense searches', async () => {
    const now = new Date();
    await Opportunity.create({
      title: 'Full Stack Developer', company: 'Remote Global', location: 'Remote, Germany', country: 'Germany',
      isRemote: true, workMode: 'remote', level: 'entry', skills: ['JavaScript'], description: 'Full stack remote role',
      url: 'https://jobs.example.test/unrelated-global', source: 'Fixture', region: 'global', postedAt: now,
      fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000),
    });
    const result = await searchOpportunities({ userId: userA._id, params: { q: 'zzzz', region: 'india' } });
    assert.equal(result.opportunities.length, 0);
    assert.equal(result.meta.totalCount, 0);
  });

  it('does not relax an unknown typo city into unrelated global remote postings', async () => {
    const now = new Date();
    await Opportunity.create({
      title: 'Full Stack Developer', company: 'Remote Global', location: 'Remote, Germany', country: 'Germany',
      isRemote: true, workMode: 'remote', level: 'entry', skills: ['JavaScript'], description: 'Full stack remote role',
      url: 'https://jobs.example.test/typo-city-global', source: 'Fixture', region: 'global', postedAt: now,
      fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000),
    });
    const result = await searchOpportunities({ userId: userA._id, params: {
      q: 'full stack developer', location: 'zzzzz', region: 'all', page: 1, limit: 20,
    } });
    assert.equal(result.opportunities.length, 0);
    assert.match(result.meta.message, /No jobs found in zzzzz/);
  });

  it('honors an explicit Global region toggle even when saved preferences exclude global listings', async () => {
    const now = new Date();
    await Opportunity.create({
      title: 'Global Remote Analyst', company: 'Global Co', location: 'Remote', country: 'Germany',
      isRemote: true, workMode: 'remote', level: 'entry', skills: ['SQL'], description: 'Remote SQL role',
      url: 'https://jobs.example.test/global', source: 'Fixture', region: 'global', postedAt: now,
      fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000),
    });
    await OpportunityPreference.create({ user: userA._id, includeGlobal: false });

    const result = await searchOpportunities({ userId: userA._id, params: { region: 'global', page: 1, limit: 20 } });
    assert.equal(result.opportunities.length, 1);
    assert.equal(result.opportunities[0].region, 'global');
  });

  it('shares one upstream city fetch for concurrent identical searches and reuses the three-hour cache', async () => {
    const now = new Date('2026-10-10T00:00:00Z');
    let upstreamCalls = 0;
    const provider = async ({ city, now: fetchedAt }) => {
      upstreamCalls += 1;
      await new Promise((resolve) => setImmediate(resolve));
      return {
        source: 'City Fixture',
        listings: [normalizeOpportunity({
          title: 'Data Analyst', company: 'City Employer', location: `${city}, India`, city,
          description: 'SQL analysis role', url: 'https://jobs.example.test/city-cache', source: 'City Fixture',
        }, fetchedAt)],
      };
    };
    const params = { city: 'Pune', country: 'India', role: 'Data Analyst', level: 'entry', now, providers: [provider] };
    const [first, simultaneous] = await Promise.all([
      ensureCitySearchFresh(params),
      ensureCitySearchFresh(params),
    ]);

    assert.equal(upstreamCalls, 1);
    assert.equal(buildSearchCacheKey(params), 'pune|india|data analyst|entry');
    assert.equal(first.cache.resultCount, 1);
    assert.equal(simultaneous.cache.resultCount, 1);
    assert.equal(await Opportunity.countDocuments({ city: 'Pune' }), 1);

    const cached = await ensureCitySearchFresh({ ...params, now: new Date(now.getTime() + SEARCH_CACHE_TTL_MS - 1000) });
    assert.equal(cached.cached, true);
    assert.equal(upstreamCalls, 1);
  });

  it('returns city adapter errors in cache metadata while retaining cached results', async () => {
    const now = new Date('2026-10-10T00:00:00Z');
    const result = await ensureCitySearchFresh({
      city: 'Nashik', country: 'India', role: 'Data Analyst', now,
      providers: [async () => { throw new Error('city provider unavailable'); }],
    });
    assert.deepEqual(result.sourceErrors, ['Test provider 1: city provider unavailable']);
    assert.equal(result.cache.resultCount, 0);
  });

  it('isolates saved preferences through the authenticated API and guards refresh with its secret', async () => {
    const saveResponse = await fetch(`${baseUrl}/preferences`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: ['Data Analyst'], cities: ['Pune'], skills: ['SQL'], workModes: ['remote'], includeGlobal: false }),
    });
    assert.equal(saveResponse.status, 200);

    const userBResponse = await fetch(`${baseUrl}/preferences`, { headers: { Authorization: `Bearer ${tokenB}` } });
    const userBBody = await userBResponse.json();
    assert.deepEqual(userBBody.preferences.roles, []);
    assert.equal(userBBody.preferences.includeGlobal, true);

    const unauthenticated = await fetch(baseUrl);
    assert.equal(unauthenticated.status, 401);
    const rejectedRefresh = await fetch(`${baseUrl}/refresh`, { method: 'POST', headers: { 'x-cron-secret': 'wrong-secret' } });
    assert.equal(rejectedRefresh.status, 401);
  });

  it('serves a cached city-specific search through the authenticated API with exact and source counts', async () => {
    const now = new Date();
    const key = buildSearchCacheKey({ city: 'Pune', country: 'India', role: 'Data Analyst', level: '' });
    await Opportunity.create({
      title: 'Data Analyst', company: 'Pune Data Co', location: 'Pune, India', city: 'Pune', country: 'India',
      isRemote: false, workMode: 'onsite', level: 'entry', skills: ['SQL'], description: 'Data analyst role',
      url: 'https://jobs.example.test/pune-api', source: 'City Fixture', region: 'india', postedAt: now,
      fetchedAt: now, expiresAt: new Date(now.getTime() + 86400000),
    });
    await OpportunitySearchCache.create({
      key, city: 'Pune', country: 'India', role: 'Data Analyst', level: '', lastFetchedAt: now,
      lastSuccessfulAt: now, resultCount: 1, sourceCounts: { 'City Fixture': 1 }, sourceErrors: [],
    });
    assert.equal(await Opportunity.countDocuments({}), 1);

    const response = await fetch(`${baseUrl}?q=Data%20Analyst&location=Pune&page=1&limit=20`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.meta.exactCityCount, 1, JSON.stringify(body.opportunities.map((job) => ({ title: job.title, company: job.company, city: job.city, location: job.location }))));
    assert.equal(body.sections[0].key, 'exactCity');
    assert.equal(body.opportunities[0].company, 'Pune Data Co');
    assert.equal(body.meta.sourceCounts['City Fixture'], 1);
  });
});