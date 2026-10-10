import express from 'express';
import protect from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { analyzeSkillGap } from '../services/skillGapAnalyzer.js';
import { getOpportunityFeed } from '../services/opportunityFeed.js';

const router = express.Router();

router.post('/skill-gap', protect, async (req, res, next) => {
  try {
    const { targetRole, currentSkills, educationLevel, experienceLevel, careerGoal } = req.body;

    const analysis = await analyzeSkillGap({
      targetRole,
      currentSkills,
      educationLevel,
      experienceLevel,
      careerGoal,
    });

    res.json({ success: true, analysis });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Skill gap analysis failed' });
  }
});

router.get('/roadmaps', protect, async (req, res, next) => {
  try {
    const roadmaps = await prisma.careerRoadmap.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, roadmaps });
  } catch (err) {
    next(err);
  }
});

router.post('/roadmaps', protect, async (req, res, next) => {
  try {
    const { careerGoal, educationLevel, currentSkills, availableHoursPerWeek, learningPace, budget, roadmapContent, stages, notes } = req.body;

    if (!careerGoal || !careerGoal.trim()) {
      return res.status(400).json({ success: false, message: 'Career goal is required' });
    }

    const roadmap = await prisma.careerRoadmap.create({
      data: {
        userId: req.user.id,
        careerGoal: careerGoal.trim().slice(0, 300),
        educationLevel: (educationLevel || '').trim(),
        currentSkills: (currentSkills || '').trim(),
        availableHoursPerWeek: availableHoursPerWeek ? Number(availableHoursPerWeek) : null,
        learningPace: learningPace || '',
        budget: budget || '',
        roadmapContent: (roadmapContent || '').slice(0, 50000),
        stages: stages || [],
        notes: (notes || '').trim().slice(0, 2000),
      },
    });

    res.status(201).json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
});

router.put('/roadmaps/:id', protect, async (req, res, next) => {
  try {
    const roadmap = await prisma.careerRoadmap.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });

    const allowed = ['careerGoal', 'educationLevel', 'currentSkills', 'availableHoursPerWeek', 'learningPace', 'budget', 'roadmapContent', 'stages', 'notes', 'status'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const updated = await prisma.careerRoadmap.update({
      where: { id: roadmap.id },
      data,
    });

    res.json({ success: true, roadmap: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/roadmaps/:id/task', protect, async (req, res, next) => {
  try {
    const { stageIndex, taskIndex, completed } = req.body;
    if (stageIndex === undefined || taskIndex === undefined) {
      return res.status(400).json({ success: false, message: 'stageIndex and taskIndex are required' });
    }

    const roadmap = await prisma.careerRoadmap.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!roadmap) return res.status(404).json({ success: false, message: 'Roadmap not found' });

    const stages = Array.isArray(roadmap.stages) ? roadmap.stages.map(s => ({ ...s, tasks: [...(s.tasks || [])] })) : [];
    if (!stages[stageIndex]?.tasks?.[taskIndex]) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    stages[stageIndex].tasks[taskIndex] = {
      ...stages[stageIndex].tasks[taskIndex],
      completed: Boolean(completed),
    };

    const updated = await prisma.careerRoadmap.update({
      where: { id: roadmap.id },
      data: { stages },
    });

    res.json({ success: true, roadmap: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/roadmaps/:id', protect, async (req, res, next) => {
  try {
    const result = await prisma.careerRoadmap.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Roadmap not found' });
    res.json({ success: true, message: 'Roadmap deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities/feed', protect, async (req, res, next) => {
  try {
    const feed = await getOpportunityFeed({ refresh: req.query.refresh === 'true' });
    res.json({ success: true, ...feed });
  } catch (err) {
    res.status(502).json({
      success: false,
      message: 'Live job listings are temporarily unavailable. Please try refreshing later.',
    });
  }
});

router.get('/opportunities', protect, async (req, res, next) => {
  try {
    const opps = await prisma.savedOpportunity.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, opportunities: opps });
  } catch (err) {
    next(err);
  }
});

router.post('/opportunities', protect, async (req, res, next) => {
  try {
    const { opportunityId, title, organization, type, deadline, applicationUrl, status, notes, documents } = req.body;

    if (!opportunityId || !title) {
      return res.status(400).json({ success: false, message: 'opportunityId and title are required' });
    }

    const existing = await prisma.savedOpportunity.findFirst({
      where: { userId: req.user.id, opportunityId },
    });
    if (existing) return res.json({ success: true, opportunity: existing, alreadySaved: true });

    const opp = await prisma.savedOpportunity.create({
      data: {
        userId: req.user.id,
        opportunityId,
        title: title.trim().slice(0, 300),
        organization: (organization || '').trim(),
        type: type || 'other',
        deadline: deadline ? new Date(deadline) : null,
        applicationUrl: (applicationUrl || '').trim(),
        status: status || 'interested',
        notes: (notes || '').trim().slice(0, 2000),
        documents: documents || [],
      },
    });

    res.status(201).json({ success: true, opportunity: opp });
  } catch (err) {
    if (err.code === 'P2002') {
      const existing = await prisma.savedOpportunity.findFirst({
        where: { userId: req.user.id, opportunityId: req.body.opportunityId },
      });
      return res.json({ success: true, opportunity: existing, alreadySaved: true });
    }
    next(err);
  }
});

router.put('/opportunities/:id', protect, async (req, res, next) => {
  try {
    const opp = await prisma.savedOpportunity.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!opp) return res.status(404).json({ success: false, message: 'Opportunity not found' });

    const allowed = ['status', 'notes', 'documents', 'deadline', 'applicationUrl'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const updated = await prisma.savedOpportunity.update({
      where: { id: opp.id },
      data,
    });

    res.json({ success: true, opportunity: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/opportunities/:id', protect, async (req, res, next) => {
  try {
    const result = await prisma.savedOpportunity.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Opportunity not found' });
    res.json({ success: true, message: 'Opportunity removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
