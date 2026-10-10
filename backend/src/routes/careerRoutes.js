import express from 'express';
import protect from '../middleware/auth.js';
import CareerRoadmap from '../models/CareerRoadmap.js';
import SavedOpportunity from '../models/SavedOpportunity.js';

const router = express.Router();

// ── CAREER ROADMAPS ──────────────────────────────────────────────────────────

/**
 * GET /api/career/roadmaps
 * List all roadmaps for the current user
 */
router.get('/roadmaps', protect, async (req, res, next) => {
  try {
    const roadmaps = await CareerRoadmap.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, roadmaps });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/career/roadmaps
 * Save a new career roadmap
 */
router.post('/roadmaps', protect, async (req, res, next) => {
  try {
    const { careerGoal, educationLevel, currentSkills, availableHoursPerWeek, learningPace, budget, roadmapContent, stages, notes } = req.body;

    if (!careerGoal || !careerGoal.trim()) {
      return res.status(400).json({ success: false, message: 'Career goal is required' });
    }

    const roadmap = await CareerRoadmap.create({
      user: req.user._id,
      careerGoal: careerGoal.trim().slice(0, 300),
      educationLevel: (educationLevel || '').trim(),
      currentSkills: (currentSkills || '').trim(),
      availableHoursPerWeek: availableHoursPerWeek ? Number(availableHoursPerWeek) : null,
      learningPace: learningPace || '',
      budget: budget || '',
      roadmapContent: (roadmapContent || '').slice(0, 50000),
      stages: stages || [],
      notes: (notes || '').trim().slice(0, 2000),
    });

    res.status(201).json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/career/roadmaps/:id
 * Update roadmap (tasks, notes, status, etc.)
 */
router.put('/roadmaps/:id', protect, async (req, res, next) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.user._id });
    if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });

    const allowed = ['careerGoal', 'educationLevel', 'currentSkills', 'availableHoursPerWeek', 'learningPace', 'budget', 'roadmapContent', 'stages', 'notes', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) roadmap[key] = req.body[key];
    }

    await roadmap.save();
    res.json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/career/roadmaps/:id/task
 * Toggle a task complete/incomplete
 */
router.patch('/roadmaps/:id/task', protect, async (req, res, next) => {
  try {
    const { stageIndex, taskIndex, completed } = req.body;
    if (stageIndex === undefined || taskIndex === undefined) {
      return res.status(400).json({ success: false, message: 'stageIndex and taskIndex are required' });
    }

    const roadmap = await CareerRoadmap.findOne({ _id: req.params.id, user: req.user._id });
    if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });

    if (!roadmap.stages[stageIndex]?.tasks[taskIndex]) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    roadmap.stages[stageIndex].tasks[taskIndex].completed = Boolean(completed);
    roadmap.markModified('stages');
    await roadmap.save();
    res.json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/career/roadmaps/:id
 */
router.delete('/roadmaps/:id', protect, async (req, res, next) => {
  try {
    const roadmap = await CareerRoadmap.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });
    res.json({ success: true, message: 'Roadmap deleted' });
  } catch (err) {
    next(err);
  }
});

// ── SAVED OPPORTUNITIES ──────────────────────────────────────────────────────

/**
 * GET /api/career/opportunities
 */
router.get('/opportunities', protect, async (req, res, next) => {
  try {
    const opps = await SavedOpportunity.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, opportunities: opps });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/career/opportunities
 */
router.post('/opportunities', protect, async (req, res, next) => {
  try {
    const { opportunityId, title, organization, type, deadline, applicationUrl, status, notes, documents } = req.body;

    if (!opportunityId || !title) {
      return res.status(400).json({ success: false, message: 'opportunityId and title are required' });
    }

    // Upsert — if already saved, return existing
    let opp = await SavedOpportunity.findOne({ user: req.user._id, opportunityId });
    if (opp) return res.json({ success: true, opportunity: opp, alreadySaved: true });

    opp = await SavedOpportunity.create({
      user: req.user._id,
      opportunityId,
      title: title.trim().slice(0, 300),
      organization: (organization || '').trim(),
      type: type || 'other',
      deadline: deadline ? new Date(deadline) : null,
      applicationUrl: (applicationUrl || '').trim(),
      status: status || 'interested',
      notes: (notes || '').trim().slice(0, 2000),
      documents: documents || [],
    });

    res.status(201).json({ success: true, opportunity: opp });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await SavedOpportunity.findOne({ user: req.user._id, opportunityId: req.body.opportunityId }).lean();
      return res.json({ success: true, opportunity: existing, alreadySaved: true });
    }
    next(err);
  }
});

/**
 * PUT /api/career/opportunities/:id
 * Update status, notes, documents
 */
router.put('/opportunities/:id', protect, async (req, res, next) => {
  try {
    const opp = await SavedOpportunity.findOne({ _id: req.params.id, user: req.user._id });
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });

    const allowed = ['status', 'notes', 'documents', 'deadline', 'applicationUrl'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) opp[key] = req.body[key];
    }

    await opp.save();
    res.json({ success: true, opportunity: opp });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/career/opportunities/:id
 */
router.delete('/opportunities/:id', protect, async (req, res, next) => {
  try {
    const opp = await SavedOpportunity.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });
    res.json({ success: true, message: 'Opportunity removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
