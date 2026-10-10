import express from 'express';
import protect from '../middleware/auth.js';
import WellnessCheckin from '../models/WellnessCheckin.js';
import MenstrualLog from '../models/MenstrualLog.js';
import SleepLog from '../models/SleepLog.js';
import MovementLog from '../models/MovementLog.js';
import WellnessJournal from '../models/WellnessJournal.js';
import WellnessGoal from '../models/WellnessGoal.js';
import WindDownRoutine from '../models/WindDownRoutine.js';
import { explainInsightInPlainWords, reflectOnJournalEntry, isWellnessAIAvailable } from '../services/wellnessAI.js';

const router = express.Router();

// ── Validation helpers ───────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d &&
    y >= 2000 &&
    y <= 2100
  );
}

function isValidTime(value) {
  return typeof value === 'string' && TIME_RE.test(value);
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampOptionalNumber(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function optionalOneOf(value, allowed) {
  if (!value || typeof value !== 'string') return '';
  return allowed.includes(value) ? value : '';
}

function parseLimit(raw, fallback, max = 100) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function badDate(res) {
  return res.status(400).json({ success: false, message: 'Date must be a valid YYYY-MM-DD date' });
}

// Helper: duration between two HH:mm times, correctly crossing midnight
function calculateSleepMinutes(bedtime, wakeTime) {
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let start = bH * 60 + bM;
  let end = wH * 60 + wM;
  if (end <= start) {
    end += 24 * 60; // crossed midnight
  }
  return Math.max(0, end - start);
}

// ── 1. WELLNESS CHECK-INS ────────────────────────────────────────────────────

router.get('/checkins', protect, async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 30);
    const filter = { user: req.user._id };
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (isValidDate(req.query.from)) filter.date.$gte = req.query.from;
      if (isValidDate(req.query.to)) filter.date.$lte = req.query.to;
      if (Object.keys(filter.date).length === 0) delete filter.date;
    }

    const checkins = await WellnessCheckin.find(filter)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckin = checkins.find((c) => c.date === todayStr) || null;

    res.json({
      success: true,
      checkins,
      todayCheckin,
      hasCheckedInToday: Boolean(todayCheckin),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/checkins', protect, async (req, res, next) => {
  try {
    const { date, mood, energy, stress, sleepQuality, generalWellbeing, notes } = req.body;
    const targetDate = date === undefined || date === '' || date === null
      ? new Date().toISOString().split('T')[0]
      : date;
    if (!isValidDate(targetDate)) return badDate(res);

    const checkin = await WellnessCheckin.findOneAndUpdate(
      { user: req.user._id, date: targetDate },
      {
        user: req.user._id,
        date: targetDate,
        mood: optionalOneOf(mood, ['great', 'good', 'neutral', 'low', 'stressed']),
        energy: clampOptionalNumber(energy, 1, 5),
        stress: clampOptionalNumber(stress, 1, 5),
        sleepQuality: clampOptionalNumber(sleepQuality, 1, 5),
        generalWellbeing: clampOptionalNumber(generalWellbeing, 1, 5),
        notes: String(notes || '').trim().slice(0, 1000),
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, checkin });
  } catch (err) {
    next(err);
  }
});

router.put('/checkins/:id', protect, async (req, res, next) => {
  try {
    const checkin = await WellnessCheckin.findOne({ _id: req.params.id, user: req.user._id });
    if (!checkin) {
      return res.status(404).json({ success: false, message: 'Check-in not found' });
    }

    const { date, mood, energy, stress, sleepQuality, generalWellbeing, notes } = req.body;
    if (date !== undefined) {
      if (!isValidDate(date)) return badDate(res);
      checkin.date = date;
    }
    if (mood !== undefined) checkin.mood = optionalOneOf(mood, ['great', 'good', 'neutral', 'low', 'stressed']);
    if (energy !== undefined) checkin.energy = clampOptionalNumber(energy, 1, 5);
    if (stress !== undefined) checkin.stress = clampOptionalNumber(stress, 1, 5);
    if (sleepQuality !== undefined) checkin.sleepQuality = clampOptionalNumber(sleepQuality, 1, 5);
    if (generalWellbeing !== undefined) checkin.generalWellbeing = clampOptionalNumber(generalWellbeing, 1, 5);
    if (notes !== undefined) checkin.notes = String(notes).trim().slice(0, 1000);

    await checkin.save();
    res.json({ success: true, checkin });
  } catch (err) {
    // e.g. duplicate {user, date} when moving a check-in onto an existing date
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A check-in already exists for that date' });
    }
    next(err);
  }
});

router.delete('/checkins/:id', protect, async (req, res, next) => {
  try {
    const result = await WellnessCheckin.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Check-in not found' });
    }
    res.json({ success: true, message: 'Check-in entry deleted' });
  } catch (err) {
    next(err);
  }
});

// ── 2. MENSTRUAL WELLNESS LOGS ──────────────────────────────────────────────

const FLOWS = ['spotting', 'light', 'medium', 'heavy', ''];

function validateCycleDates(startDate, endDate, res) {
  if (!isValidDate(startDate)) return badDate(res);
  if (endDate !== undefined && endDate !== '' && !isValidDate(endDate)) return badDate(res);
  if (endDate && endDate < startDate) {
    return res.status(400).json({ success: false, message: 'End date cannot be before the start date' });
  }
  return null;
}

router.get('/menstrual', protect, async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 60);
    const logs = await MenstrualLog.find({ user: req.user._id })
      .sort({ startDate: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

router.post('/menstrual', protect, async (req, res, next) => {
  try {
    const { startDate, endDate, flow, painLevel, symptoms, mood, notes } = req.body;
    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required' });
    }
    const invalid = validateCycleDates(startDate, endDate, res);
    if (invalid) return invalid;

    const log = await MenstrualLog.create({
      user: req.user._id,
      startDate,
      endDate: endDate || '',
      flow: oneOf(flow, FLOWS, 'medium'),
      painLevel: clampNumber(painLevel, 1, 5, 2),
      symptoms: Array.isArray(symptoms)
        ? symptoms.filter((s) => typeof s === 'string').slice(0, 20).map((s) => s.trim().slice(0, 60))
        : [],
      mood: String(mood || '').trim().slice(0, 60),
      notes: String(notes || '').trim().slice(0, 1000),
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
});

router.put('/menstrual/:id', protect, async (req, res, next) => {
  try {
    const { startDate, endDate, flow, painLevel, symptoms, mood, notes } = req.body;
    const log = await MenstrualLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    const nextStart = startDate !== undefined ? startDate : log.startDate;
    const nextEnd = endDate !== undefined ? endDate : log.endDate;
    const invalid = validateCycleDates(nextStart, nextEnd, res);
    if (invalid) return invalid;

    log.startDate = nextStart;
    log.endDate = nextEnd;
    if (flow !== undefined) log.flow = oneOf(flow, FLOWS, 'medium');
    if (painLevel !== undefined) log.painLevel = clampNumber(painLevel, 1, 5, 2);
    if (symptoms !== undefined) {
      log.symptoms = Array.isArray(symptoms)
        ? symptoms.filter((s) => typeof s === 'string').slice(0, 20).map((s) => s.trim().slice(0, 60))
        : [];
    }
    if (mood !== undefined) log.mood = String(mood).trim().slice(0, 60);
    if (notes !== undefined) log.notes = String(notes).trim().slice(0, 1000);

    await log.save();
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
});

router.delete('/menstrual/:id', protect, async (req, res, next) => {
  try {
    const result = await MenstrualLog.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }
    res.json({ success: true, message: 'Cycle entry deleted' });
  } catch (err) {
    next(err);
  }
});

// ── 3. SLEEP LOGS ────────────────────────────────────────────────────────────

router.get('/sleep', protect, async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 30);
    const logs = await SleepLog.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

router.post('/sleep', protect, async (req, res, next) => {
  try {
    const { date, bedtime, wakeTime, quality, windDownActivities, notes } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    if (!isValidDate(targetDate)) return badDate(res);
    if (!isValidTime(bedtime) || !isValidTime(wakeTime)) {
      return res.status(400).json({ success: false, message: 'Bedtime and wake time must be in HH:mm format' });
    }

    const durationMinutes = calculateSleepMinutes(bedtime, wakeTime);
    if (durationMinutes === 0 || durationMinutes === 24 * 60) {
      return res.status(400).json({ success: false, message: 'Bedtime and wake time cannot be the same' });
    }

    const log = await SleepLog.findOneAndUpdate(
      { user: req.user._id, date: targetDate },
      {
        user: req.user._id,
        date: targetDate,
        bedtime,
        wakeTime,
        durationMinutes,
        quality: clampNumber(quality, 1, 5, 3),
        windDownActivities: Array.isArray(windDownActivities)
          ? windDownActivities.filter((s) => typeof s === 'string').slice(0, 12).map((s) => s.trim().slice(0, 60))
          : [],
        notes: String(notes || '').trim().slice(0, 1000),
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, log });
  } catch (err) {
    next(err);
  }
});

router.delete('/sleep/:id', protect, async (req, res, next) => {
  try {
    const result = await SleepLog.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Sleep log not found' });
    }
    res.json({ success: true, message: 'Sleep log deleted' });
  } catch (err) {
    next(err);
  }
});

// ── 4. MOVEMENT LOGS ─────────────────────────────────────────────────────────

const MOVEMENT_CATEGORIES = ['stretching', 'walking', 'mobility', 'yoga', 'desk-break', 'other'];

router.get('/movement', protect, async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 40);
    const logs = await MovementLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

router.post('/movement', protect, async (req, res, next) => {
  try {
    const { title, category, durationMinutes, effort, date, notes } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Activity title is required' });
    }
    const targetDate = date || new Date().toISOString().split('T')[0];
    if (!isValidDate(targetDate)) return badDate(res);

    const log = await MovementLog.create({
      user: req.user._id,
      title: String(title).trim().slice(0, 150),
      category: oneOf(category, MOVEMENT_CATEGORIES, 'stretching'),
      durationMinutes: clampNumber(durationMinutes, 1, 360, 10),
      effort: oneOf(effort, ['gentle', 'moderate', 'invigorating', ''], 'gentle'),
      completed: true,
      date: targetDate,
      notes: String(notes || '').trim().slice(0, 1000),
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
});

router.delete('/movement/:id', protect, async (req, res, next) => {
  try {
    const result = await MovementLog.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Movement log not found' });
    }
    res.json({ success: true, message: 'Movement entry deleted' });
  } catch (err) {
    next(err);
  }
});

// ── 5. WELLNESS JOURNAL / REFLECTIONS (private to the user) ─────────────────

router.get('/journal', protect, async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 30);
    const entries = await WellnessJournal.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, entries });
  } catch (err) {
    next(err);
  }
});

router.post('/journal', protect, async (req, res, next) => {
  try {
    const { prompt, content, moodTag } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: 'Journal content is required' });
    }

    const entry = await WellnessJournal.create({
      user: req.user._id,
      prompt: String(prompt || '').trim().slice(0, 300),
      content: String(content).trim().slice(0, 5000),
      moodTag: String(moodTag || '').trim().slice(0, 60),
      date: new Date().toISOString().split('T')[0],
    });

    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
});

router.put('/journal/:id', protect, async (req, res, next) => {
  try {
    const entry = await WellnessJournal.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    const { prompt, content, moodTag } = req.body;
    if (content !== undefined) {
      if (!String(content).trim()) {
        return res.status(400).json({ success: false, message: 'Journal content cannot be empty' });
      }
      entry.content = String(content).trim().slice(0, 5000);
    }
    if (prompt !== undefined) entry.prompt = String(prompt).trim().slice(0, 300);
    if (moodTag !== undefined) entry.moodTag = String(moodTag).trim().slice(0, 60);

    await entry.save();
    res.json({ success: true, entry });
  } catch (err) {
    next(err);
  }
});

router.delete('/journal/:id', protect, async (req, res, next) => {
  try {
    const result = await WellnessJournal.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }
    res.json({ success: true, message: 'Journal entry deleted' });
  } catch (err) {
    next(err);
  }
});

// ── 6. WELLNESS GOALS & HABITS ──────────────────────────────────────────────

const GOAL_CATEGORIES = ['mindfulness', 'movement', 'sleep', 'checkin', 'hydration', 'cycle', 'other'];
const GOAL_FREQUENCIES = ['daily', '3x_week', '5x_week', 'weekly'];
const GOAL_STATUSES = ['active', 'paused', 'completed'];

router.get('/goals', protect, async (req, res, next) => {
  try {
    const goals = await WellnessGoal.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, goals });
  } catch (err) {
    next(err);
  }
});

router.post('/goals', protect, async (req, res, next) => {
  try {
    const { title, category, frequency, targetCount, notes } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Goal title is required' });
    }

    const goal = await WellnessGoal.create({
      user: req.user._id,
      title: String(title).trim().slice(0, 200),
      category: oneOf(category, GOAL_CATEGORIES, 'mindfulness'),
      frequency: oneOf(frequency, GOAL_FREQUENCIES, 'daily'),
      targetCount: clampNumber(targetCount, 1, 365, 1),
      currentCount: 0,
      status: 'active',
      notes: String(notes || '').trim().slice(0, 500),
    });

    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
});

router.patch('/goals/:id/increment', protect, async (req, res, next) => {
  try {
    const goal = await WellnessGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    goal.currentCount = (goal.currentCount || 0) + 1;
    if (goal.currentCount >= goal.targetCount) {
      goal.status = 'completed';
    }
    await goal.save();

    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
});

router.put('/goals/:id', protect, async (req, res, next) => {
  try {
    const { title, category, frequency, targetCount, currentCount, status, notes } = req.body;
    const goal = await WellnessGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    if (title !== undefined) goal.title = String(title).trim().slice(0, 200);
    if (category !== undefined) goal.category = oneOf(category, GOAL_CATEGORIES, goal.category);
    if (frequency !== undefined) goal.frequency = oneOf(frequency, GOAL_FREQUENCIES, goal.frequency);
    if (targetCount !== undefined) goal.targetCount = clampNumber(targetCount, 1, 365, goal.targetCount);
    if (currentCount !== undefined) goal.currentCount = clampNumber(currentCount, 0, 365, goal.currentCount);
    if (status !== undefined) goal.status = oneOf(status, GOAL_STATUSES, goal.status);
    if (notes !== undefined) goal.notes = String(notes).trim().slice(0, 500);

    await goal.save();
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
});

router.delete('/goals/:id', protect, async (req, res, next) => {
  try {
    const result = await WellnessGoal.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
});

// ── 7. WIND-DOWN ROUTINE (evening routine builder) ──────────────────────────

router.get('/winddown', protect, async (req, res, next) => {
  try {
    const routine = await WindDownRoutine.findOne({ user: req.user._id }).lean();
    res.json({ success: true, routine: routine || { activities: [], remindersEnabled: false } });
  } catch (err) {
    next(err);
  }
});

router.put('/winddown', protect, async (req, res, next) => {
  try {
    const { name, activities, remindersEnabled } = req.body;

    const cleaned = [];
    if (Array.isArray(activities)) {
      for (let i = 0; i < Math.min(activities.length, 12); i++) {
        const a = activities[i] || {};
        const label = String(a.label || '').trim().slice(0, 120);
        if (!label) continue;
        cleaned.push({
          label,
          time: isValidTime(a.time) ? a.time : '',
          order: cleaned.length,
          reminder: Boolean(a.reminder),
        });
      }
    }

    const routine = await WindDownRoutine.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        ...(name !== undefined ? { name: String(name).trim().slice(0, 120) || 'My wind-down routine' } : {}),
        activities: cleaned,
        ...(remindersEnabled !== undefined ? { remindersEnabled: Boolean(remindersEnabled) } : {}),
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, routine });
  } catch (err) {
    next(err);
  }
});

// ── 8. PERSONAL PATTERN INSIGHTS (deterministic, explainable) ────────────────

const MOOD_SCORE = { great: 5, good: 4, neutral: 3, low: 2, stressed: 1 };
const MOOD_LABEL = { great: 'great', good: 'good', neutral: 'neutral', low: 'low', stressed: 'stressed' };

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const round1 = (n) => Math.round(n * 10) / 10;

function insufficient(id, title, reason, need) {
  return { id, title, reason, need };
}

/**
 * Builds insights ONLY from the records passed in. Every insight names its
 * period and links the supporting records; patterns without enough data are
 * returned in `insufficient` instead of being guessed at.
 */
export function buildWellnessInsights({ checkins, sleepLogs, movementLogs, menstrualLogs }) {
  const insights = [];
  const gaps = [];

  // Dates in ascending order for period labels
  const dateRange = (dates) => (dates.length ? { from: dates[dates.length - 1], to: dates[0] } : null);
  const sortedDates = (items, field = 'date') => items.map((i) => i[field]).filter(Boolean).sort();

  // 1. Sleep quality & next-day energy ------------------------------------
  {
    const checkinByDate = new Map(checkins.map((c) => [c.date, c]));
    const pairs = sleepLogs
      .filter((s) => checkinByDate.has(s.date))
      .map((s) => ({
        date: s.date,
        sleepQuality: s.quality,
        energy: checkinByDate.get(s.date).energy,
      }));

    if (pairs.length < 4) {
      gaps.push(insufficient(
        'sleep-energy',
        'Sleep quality & energy',
        `This comparison needs at least 4 days that have BOTH a sleep record and a check-in. You have ${pairs.length}.`,
        'Record sleep and do a check-in on the same days for a few more days.'
      ));
    } else {
      const goodSleep = pairs.filter((p) => p.sleepQuality >= 4);
      const poorSleep = pairs.filter((p) => p.sleepQuality <= 2);
      const dates = sortedDates(pairs);

      if (goodSleep.length >= 2 && poorSleep.length >= 2) {
        const eGood = avg(goodSleep.map((p) => p.energy));
        const ePoor = avg(poorSleep.map((p) => p.energy));
        const diff = Math.abs(eGood - ePoor);

        const observation = diff < 0.5
          ? `Across your ${pairs.length} days with both records (${dates[0]} to ${dates[dates.length - 1]}), energy was similar after better and poorer sleep (${round1(eGood)} vs ${round1(ePoor)} out of 5) — no clear difference in your entries.`
          : `Across your ${pairs.length} days with both records (${dates[0]} to ${dates[dates.length - 1]}), you recorded higher energy on days after sleep you rated better (${round1(eGood)} vs ${round1(ePoor)} out of 5). These entries occurred together and do not prove one caused the other.`;

        insights.push({
          id: 'sleep-energy',
          title: 'Sleep quality & next-day energy',
          category: 'Sleep & Energy',
          period: dateRange(dates),
          observation,
          supportingRecords: pairs
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, 10)
            .map((p) => ({
              date: p.date,
              label: `Sleep ${p.sleepQuality}/5 → energy ${p.energy}/5 next day`,
            })),
          suggestion: 'Keep recording both for another week to see if this holds.',
          isCautionary: false,
        });
      } else {
        gaps.push(insufficient(
          'sleep-energy',
          'Sleep quality & energy',
          `You have ${pairs.length} paired days, but you need at least 2 days rated 4–5 and 2 days rated 1–2 for sleep to compare.`,
          'A few more varied sleep entries will unlock this comparison.'
        ));
      }
    }
  }

  // 2. Recorded stress & mood ------------------------------------------------
  {
    if (checkins.length < 5) {
      gaps.push(insufficient(
        'stress-mood',
        'Stress & mood',
        `This pattern needs at least 5 check-ins. You have ${checkins.length}.`,
        'A quick daily check-in takes under a minute.'
      ));
    } else {
      const highStress = checkins.filter((c) => c.stress >= 4);
      if (highStress.length < 3) {
        gaps.push(insufficient(
          'stress-mood',
          'Stress & mood',
          `Only ${highStress.length} of your ${checkins.length} check-ins recorded stress of 4 or 5 — need at least 3 to look for a pattern.`,
          'No action needed — this simply means elevated-stress days are rare in your records so far.'
        ));
      } else {
        const stressedDates = highStress.map((c) => c.date).sort();
        const lowMoodOnHighStress = highStress.filter((c) => c.mood === 'low' || c.mood === 'stressed').length;
        const otherDays = checkins.filter((c) => c.stress < 4);
        const lowMoodOnOtherDays = otherDays.filter((c) => c.mood === 'low' || c.mood === 'stressed').length;

        const observation =
          `Of your last ${checkins.length} check-ins, ${highStress.length} recorded stress of 4 or 5 ` +
          `(${stressedDates[0]} to ${stressedDates[stressedDates.length - 1]}). ` +
          `On ${lowMoodOnHighStress} of those you also recorded a low or stressed mood, compared with ` +
          `${lowMoodOnOtherDays} of your ${otherDays.length} calmer days. Your entries show these occurred together, not that one caused the other.`;

        insights.push({
          id: 'stress-mood',
          title: 'Stress & mood',
          category: 'Stress & Mood',
          period: dateRange(checkins.map((c) => c.date)),
          observation,
          supportingRecords: highStress
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, 10)
            .map((c) => ({ date: c.date, label: `Stress ${c.stress}/5, mood: ${MOOD_LABEL[c.mood] || c.mood}` })),
          suggestion: 'A 2-minute breathing session on higher-stress days is a gentle option.',
          isCautionary: true,
        });
      }
    }
  }

  // 3. Movement & self-reported wellbeing -----------------------------------
  {
    const movementDates = new Set(movementLogs.map((m) => m.date));
    const activeDays = checkins.filter((c) => movementDates.has(c.date));
    const inactiveDays = checkins.filter((c) => !movementDates.has(c.date));

    if (activeDays.length < 3 || inactiveDays.length < 3) {
      gaps.push(insufficient(
        'movement-wellbeing',
        'Movement & wellbeing',
        `Comparing needs at least 3 check-in days with a movement session and 3 without. You have ${activeDays.length} and ${inactiveDays.length}.`,
        'Log a short movement session and keep checking in to build this comparison.'
      ));
    } else {
      const wActive = avg(activeDays.map((c) => c.generalWellbeing));
      const wInactive = avg(inactiveDays.map((c) => c.generalWellbeing));
      const diff = Math.abs(wActive - wInactive);
      const dates = sortedDates(activeDays);

      const observation = diff < 0.5
        ? `On ${activeDays.length} days you logged movement (${dates[0]} to ${dates[dates.length - 1]}), your wellbeing ratings were close to days without movement (${round1(wActive)} vs ${round1(wInactive)} out of 5).`
        : `On ${activeDays.length} days you logged movement (${dates[0]} to ${dates[dates.length - 1]}), your average wellbeing was ${round1(wActive)} out of 5, versus ${round1(wInactive)} on ${inactiveDays.length} days without a session. These are your own entries occurring together — not proof that movement changed your wellbeing.`;

      insights.push({
        id: 'movement-wellbeing',
        title: 'Movement & wellbeing',
        category: 'Movement',
        period: dateRange(sortedDates(checkins)),
        observation,
        supportingRecords: activeDays
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .slice(0, 8)
          .map((c) => ({
            date: c.date,
            label: `Movement logged, wellbeing ${c.generalWellbeing}/5`,
          })),
        suggestion: 'Short, comfortable sessions count — consistency matters more than intensity.',
        isCautionary: false,
      });
    }
  }

  // 4. Repeated menstrual symptoms across recorded cycles --------------------
  {
    if (menstrualLogs.length < 2) {
      gaps.push(insufficient(
        'menstrual-symptoms',
        'Recurring cycle symptoms',
        `This needs at least 2 recorded cycles. You have ${menstrualLogs.length}.`,
        'Record your cycles in the Cycle Journal when they occur.'
      ));
    } else {
      const symptomDates = {};
      menstrualLogs.forEach((log) => {
        (log.symptoms || []).forEach((s) => {
          const key = String(s).trim().toLowerCase();
          if (!key) return;
          (symptomDates[key] = symptomDates[key] || []).push(log.startDate);
        });
      });

      const recurring = Object.entries(symptomDates).filter(([, dates]) => dates.length >= 2);

      if (recurring.length === 0) {
        gaps.push(insufficient(
          'menstrual-symptoms',
          'Recurring cycle symptoms',
          `No symptom has appeared in 2 or more of your ${menstrualLogs.length} recorded cycles yet.`,
          'Nothing to do — this will appear automatically once a symptom repeats.'
        ));
      } else {
        const listed = recurring
          .map(([symptom, dates]) => `${symptom} (${dates.length}×: ${dates.sort().join(', ')})`)
          .join('; ');

        insights.push({
          id: 'menstrual-symptoms',
          title: 'Recurring cycle symptoms',
          category: 'Cycle',
          period: dateRange(sortedDates(menstrualLogs, 'startDate')),
          observation:
            `Across your ${menstrualLogs.length} recorded cycles, these symptoms appeared more than once: ${listed}. ` +
            `This is a count of your own entries only — it is not a medical assessment.`,
          supportingRecords: recurring.flatMap(([symptom, dates]) =>
            dates.sort().map((d) => ({ date: d, label: `Recorded: ${symptom}` }))
          ),
          suggestion: 'You can export your cycle summary to discuss recurring symptoms with a healthcare professional.',
          isCautionary: false,
        });
      }
    }
  }

  // 5. Mood & energy over time ------------------------------------------------
  {
    if (checkins.length < 8) {
      gaps.push(insufficient(
        'mood-energy-trend',
        'Mood & energy over time',
        `A trend view needs at least 8 check-ins. You have ${checkins.length}.`,
        'Check in on the days you can — quality of entries matters more than streaks.'
      ));
    } else {
      const ascending = [...checkins].sort((a, b) => (a.date > b.date ? 1 : -1));
      const half = Math.floor(ascending.length / 2);
      const earlier = ascending.slice(0, half);
      const later = ascending.slice(half);

      const eEarlier = avg(earlier.map((c) => c.energy));
      const eLater = avg(later.map((c) => c.energy));
      const mEarlier = avg(earlier.map((c) => MOOD_SCORE[c.mood] ?? 3));
      const mLater = avg(later.map((c) => MOOD_SCORE[c.mood] ?? 3));

      const energyShift = round1(eLater - eEarlier);
      const moodShift = round1(mLater - mEarlier);
      const period = { from: earlier[0].date, to: later[later.length - 1].date };

      let observation;
      if (Math.abs(energyShift) < 0.5 && Math.abs(moodShift) < 0.5) {
        observation =
          `Comparing your first ${earlier.length} check-ins (${period.from}–${earlier[earlier.length - 1].date}) ` +
          `with your latest ${later.length} (${later[0].date}–${period.to}), average energy and mood ratings are steady.`;
      } else {
        const direction = (v) => (v > 0 ? 'higher' : 'lower');
        observation =
          `Comparing your first ${earlier.length} check-ins (${period.from}–${earlier[earlier.length - 1].date}) ` +
          `with your latest ${later.length} (${later[0].date}–${period.to}): ` +
          `energy averaged ${round1(eEarlier)} earlier vs ${round1(eLater)} later, ` +
          `mood averaged ${round1(mEarlier)} vs ${round1(mLater)} (out of 5). ` +
          `Your recent entries trend ${direction(energyShift)} on ` +
          `${Math.abs(energyShift) >= 0.5 ? 'energy' : 'mood'} — a description of your records, not a conclusion about you.`;
      }

      insights.push({
        id: 'mood-energy-trend',
        title: 'Mood & energy over time',
        category: 'Trends',
        period,
        observation,
        supportingRecords: later
          .slice(-10)
          .reverse()
          .map((c) => ({ date: c.date, label: `Mood: ${MOOD_LABEL[c.mood] || c.mood}, energy ${c.energy}/5` })),
        suggestion: 'Note anything unusual in your journal on odd days — patterns make more sense with context.',
        isCautionary: false,
      });
    }
  }

  return { insights, gaps };
}

router.get('/insights', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [checkins, sleepLogs, movementLogs, menstrualLogs, goals] = await Promise.all([
      WellnessCheckin.find({ user: userId }).sort({ date: -1 }).limit(60).lean(),
      SleepLog.find({ user: userId }).sort({ date: -1 }).limit(60).lean(),
      MovementLog.find({ user: userId }).sort({ date: -1 }).limit(60).lean(),
      MenstrualLog.find({ user: userId }).sort({ startDate: -1 }).limit(12).lean(),
      WellnessGoal.find({ user: userId, status: 'active' }).lean(),
    ]);

    const { insights, gaps } = buildWellnessInsights({ checkins, sleepLogs, movementLogs, menstrualLogs });

    // Small, optional, deterministic suggestions based on goals + record counts
    const suggestions = [];
    if (checkins.length === 0 && sleepLogs.length === 0 && movementLogs.length === 0) {
      suggestions.push('Start with a quick daily check-in — it takes under a minute.');
    }
    const sleepGap = gaps.find((g) => g.id === 'sleep-energy');
    if (sleepGap && checkins.length >= 3 && sleepLogs.length >= 1 && sleepLogs.length < 10) {
      suggestions.push('Keep recording sleep and energy for a few more days to unlock that comparison.');
    }
    if (goals.length > 0) {
      suggestions.push(`You have ${goals.length} active goal${goals.length > 1 ? 's' : ''} — revisit them in Goals & Habits.`);
    }
    const symptomInsight = insights.find((i) => i.id === 'menstrual-symptoms');
    if (symptomInsight) {
      suggestions.push('If a recurring symptom concerns you, consider reviewing your exported summary with a healthcare professional.');
    }
    if (movementLogs.length >= 3 && checkins.length >= 3) {
      suggestions.push('Your movement log is building nicely — a short break still counts on busy days.');
    }

    res.json({
      success: true,
      insights,
      insufficient: gaps,
      suggestions: suggestions.slice(0, 4),
      recordCount: {
        checkins: checkins.length,
        sleep: sleepLogs.length,
        movement: movementLogs.length,
        menstrual: menstrualLogs.length,
      },
      hasSufficientData: insights.length > 0,
      aiAvailable: isWellnessAIAvailable(),
    });
  } catch (err) {
    next(err);
  }
});

// ── 9. OPTIONAL AI ASSISTANCE (explicit consent, minimum data) ───────────────

router.post('/ai/explain', protect, async (req, res) => {
  try {
    const { title, observation, consent } = req.body || {};
    if (consent !== true) {
      return res.status(400).json({ success: false, message: 'Consent is required for AI assistance' });
    }
    if (typeof observation !== 'string' || !observation.trim() || observation.length > 1200) {
      return res.status(400).json({ success: false, message: 'A short grounded observation is required' });
    }
    if (!isWellnessAIAvailable()) {
      return res.status(503).json({ success: false, message: 'AI is not available right now', fallback: true });
    }

    const explanation = await explainInsightInPlainWords({
      title: String(title || '').slice(0, 200),
      observation: observation.slice(0, 1200),
    });

    if (!explanation) {
      return res.status(503).json({ success: false, message: 'AI is not available right now', fallback: true });
    }
    res.json({ success: true, explanation });
  } catch (err) {
    res.status(503).json({ success: false, message: 'AI is not available right now', fallback: true });
  }
});

router.post('/ai/reflect', protect, async (req, res) => {
  try {
    const { entryId, consent } = req.body || {};
    if (consent !== true) {
      return res.status(400).json({ success: false, message: 'Consent is required before sharing an entry with AI' });
    }
    if (!entryId) {
      return res.status(400).json({ success: false, message: 'entryId is required' });
    }
    if (!isWellnessAIAvailable()) {
      return res.status(503).json({ success: false, message: 'AI is not available right now', fallback: true });
    }

    // Server-side fetch scoped to the user: the client never sends entry text.
    const entry = await WellnessJournal.findOne({ _id: entryId, user: req.user._id }).lean();
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    const reflection = await reflectOnJournalEntry({ prompt: entry.prompt, content: entry.content });
    if (!reflection) {
      return res.status(503).json({ success: false, message: 'AI is not available right now', fallback: true });
    }
    res.json({ success: true, reflection });
  } catch (err) {
    res.status(503).json({ success: false, message: 'AI is not available right now', fallback: true });
  }
});

export default router;
