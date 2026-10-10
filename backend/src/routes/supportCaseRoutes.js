import express from 'express';
import protect from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const { status, includeArchived = 'false' } = req.query;
    const where = { userId: req.user.id };

    if (includeArchived !== 'true') {
      where.isArchived = false;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const cases = await prisma.supportCase.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, cases });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const {
      title,
      category,
      jurisdiction,
      description,
      status = 'planning',
      priority = 'medium',
      incidentDate,
      targetResolutionDate,
      tasks = [],
      notes = [],
      savedResources = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Case title is required' });
    }

    const formattedTasks = Array.isArray(tasks)
      ? tasks.map(t => ({
          id: t.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: (t.title || '').trim(),
          completed: Boolean(t.completed),
          dueDate: t.dueDate || '',
          priority: t.priority || 'normal',
        }))
      : [];

    const newCase = await prisma.supportCase.create({
      data: {
        userId: req.user.id,
        title: title.trim().slice(0, 200),
        category: (category || 'General Support').trim(),
        jurisdiction: (jurisdiction || 'National / General').trim(),
        description: (description || '').trim().slice(0, 10000),
        status,
        priority,
        incidentDate: incidentDate || '',
        targetResolutionDate: targetResolutionDate || '',
        tasks: formattedTasks,
        notes: Array.isArray(notes) ? notes : [],
        savedResources: Array.isArray(savedResources) ? savedResources : [],
      },
    });

    res.status(201).json({ success: true, case: newCase });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const supportCase = await prisma.supportCase.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!supportCase) {
      return res.status(404).json({ success: false, message: 'Case not found or access denied' });
    }

    res.json({ success: true, case: supportCase });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const supportCase = await prisma.supportCase.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!supportCase) {
      return res.status(404).json({ success: false, message: 'Case not found or access denied' });
    }

    const {
      title,
      category,
      jurisdiction,
      description,
      status,
      priority,
      incidentDate,
      targetResolutionDate,
      tasks,
      notes,
      savedResources,
      isArchived,
    } = req.body;

    const data = {};
    if (title !== undefined) data.title = title.trim().slice(0, 200);
    if (category !== undefined) data.category = category.trim();
    if (jurisdiction !== undefined) data.jurisdiction = jurisdiction.trim();
    if (description !== undefined) data.description = description.trim().slice(0, 10000);
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (incidentDate !== undefined) data.incidentDate = incidentDate;
    if (targetResolutionDate !== undefined) data.targetResolutionDate = targetResolutionDate;
    if (tasks !== undefined) data.tasks = tasks;
    if (notes !== undefined) data.notes = notes;
    if (savedResources !== undefined) data.savedResources = savedResources;
    if (isArchived !== undefined) data.isArchived = Boolean(isArchived);

    const updated = await prisma.supportCase.update({
      where: { id: supportCase.id },
      data,
    });

    res.json({ success: true, case: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/tasks', protect, async (req, res, next) => {
  try {
    const supportCase = await prisma.supportCase.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!supportCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const { title, dueDate, priority = 'normal' } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      completed: false,
      dueDate: dueDate || '',
      priority,
    };

    const updated = await prisma.supportCase.update({
      where: { id: supportCase.id },
      data: { tasks: [...supportCase.tasks, newTask] },
    });

    res.status(201).json({ success: true, case: updated, task: newTask });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/tasks/:taskId', protect, async (req, res, next) => {
  try {
    const supportCase = await prisma.supportCase.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!supportCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const tasks = supportCase.tasks.map(t => {
      if (t.id !== req.params.taskId) return t;
      const updated = { ...t };
      if (req.body.completed !== undefined) updated.completed = Boolean(req.body.completed);
      if (req.body.title !== undefined) updated.title = req.body.title.trim();
      if (req.body.dueDate !== undefined) updated.dueDate = req.body.dueDate;
      if (req.body.priority !== undefined) updated.priority = req.body.priority;
      return updated;
    });

    const task = tasks.find(t => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const updated = await prisma.supportCase.update({
      where: { id: supportCase.id },
      data: { tasks },
    });

    res.json({ success: true, case: updated, task });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const result = await prisma.supportCase.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Case not found or access denied' });
    }

    res.json({ success: true, message: 'Case successfully deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
