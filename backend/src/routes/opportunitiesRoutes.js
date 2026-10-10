import crypto from 'node:crypto';
import express from 'express';
import protect from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { ensureCitySearchFresh, refreshPopularCitySearches } from '../services/opportunities/citySearch.js';
import { searchOpportunities } from '../services/opportunities/search.js';
import { parseLocation } from '../services/opportunities/cityUtils.js';

const router = express.Router();
const PREFERENCE_ARRAYS = ['roles', 'cities', 'workModes', 'levels', 'skills'];
const ALLOWED_WORK_MODES = new Set(['remote', 'hybrid', 'onsite']);
const ALLOWED_LEVELS = new Set(['intern', 'entry', 'mid', 'senior']);

const cleanArray = (value, key) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim().slice(0, 100)).filter(Boolean))].slice(0, 30)
    .filter((item) => key === 'workModes' ? ALLOWED_WORK_MODES.has(item) : key === 'levels' ? ALLOWED_LEVELS.has(item) : true);
};

router.get('/', protect, async (req, res, next) => {
  try {
    const { q, location, workMode, level, region, sort, page, limit } = req.query;
    const requestedLocation = String(location || '').trim().slice(0, 160);
    const parsed = parseLocation(requestedLocation, req.query.country);
    const preferences = await prisma.opportunityPreference.findUnique({
      where: { userId: req.user.id },
      select: { roles: true },
    });
    const role = String(q || '').trim().slice(0, 160) || (preferences?.roles || []).join(' OR ');
    const normalizedWorkMode = parsed.isRemote ? 'remote' : workMode && ALLOWED_WORK_MODES.has(workMode) ? workMode : '';
    let cacheResult = null;
    if (requestedLocation || role || level) {
      cacheResult = await ensureCitySearchFresh({
        city: parsed.city,
        country: parsed.country,
        role,
        level: level && ALLOWED_LEVELS.has(level) ? level : '',
      });
    }
    const result = await searchOpportunities({
      userId: req.user.id,
      cacheResult,
      params: {
        q: role,
        location: parsed.city,
        city: parsed.city,
        country: parsed.country,
        workModes: normalizedWorkMode ? [normalizedWorkMode] : [],
        level: level && ALLOWED_LEVELS.has(level) ? level : '',
        region: ['india', 'global', 'all'].includes(region) ? region : 'india',
        sort: sort === 'newest' ? 'newest' : 'relevance',
        page,
        limit,
      },
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/preferences', protect, async (req, res, next) => {
  try {
    const preferences = await prisma.opportunityPreference.findUnique({
      where: { userId: req.user.id },
    });
    res.json({
      success: true,
      preferences: preferences || {
        roles: [], cities: [], workModes: [], levels: [], skills: [], includeGlobal: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/preferences', protect, async (req, res, next) => {
  try {
    const changes = {};
    PREFERENCE_ARRAYS.forEach((key) => {
      if (req.body[key] !== undefined) changes[key] = cleanArray(req.body[key], key);
    });
    if (req.body.includeGlobal !== undefined) changes.includeGlobal = req.body.includeGlobal !== false;

    const preferences = await prisma.opportunityPreference.upsert({
      where: { userId: req.user.id },
      update: changes,
      create: { userId: req.user.id, ...changes },
    });
    res.json({ success: true, preferences });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh-now', protect, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }
  try {
    const parsed = parseLocation(req.body.location, req.body.country);
    const result = await ensureCitySearchFresh({
      city: parsed.city,
      country: parsed.country,
      role: String(req.body.role || '').trim().slice(0, 160),
      level: ALLOWED_LEVELS.has(req.body.level) ? req.body.level : '',
      force: true,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Development opportunity refresh failed', err.message);
    res.status(502).json({ success: false, message: 'Opportunity data refresh failed.' });
  }
});

router.post('/refresh', async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const provided = req.get('x-cron-secret') || '';
  if (!expected) return res.status(503).json({ success: false, message: 'Scheduled refresh is not configured.' });
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  const valid = expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  if (!valid) return res.status(401).json({ success: false, message: 'Not authorized.' });

  try {
    const result = await refreshPopularCitySearches();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Opportunity refresh failed', err.message);
    res.status(502).json({ success: false, message: 'Opportunity data refresh failed.' });
  }
});

export default router;
