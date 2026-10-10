import express from 'express';
import protect from '../middleware/auth.js';
import SupportCase from '../models/SupportCase.js';

const router = express.Router();

/**
 * GET /api/support-cases
 * List private cases for the authenticated user
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, includeArchived = 'false' } = req.query;
    const query = { user: req.user._id };

    if (includeArchived !== 'true') {
      query.isArchived = { $ne: true };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const cases = await SupportCase.find(query).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, cases });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/support-cases
 * Create a new private case
 */
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

    const newCase = await SupportCase.create({
      user: req.user._id,
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
    });

    res.status(201).json({ success: true, case: newCase });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/support-cases/:id
 * Retrieve a single case (strictly scoped to owner)
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const supportCase = await SupportCase.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!supportCase) {
      return res.status(404).json({ success: false, message: 'Case not found or access denied' });
    }

    res.json({ success: true, case: supportCase });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/support-cases/:id
 * Update an existing case
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const supportCase = await SupportCase.findOne({
      _id: req.params.id,
      user: req.user._id,
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

    if (title !== undefined) supportCase.title = title.trim().slice(0, 200);
    if (category !== undefined) supportCase.category = category.trim();
    if (jurisdiction !== undefined) supportCase.jurisdiction = jurisdiction.trim();
    if (description !== undefined) supportCase.description = description.trim().slice(0, 10000);
    if (status !== undefined) supportCase.status = status;
    if (priority !== undefined) supportCase.priority = priority;
    if (incidentDate !== undefined) supportCase.incidentDate = incidentDate;
    if (targetResolutionDate !== undefined) supportCase.targetResolutionDate = targetResolutionDate;
    if (tasks !== undefined) supportCase.tasks = tasks;
    if (notes !== undefined) supportCase.notes = notes;
    if (savedResources !== undefined) supportCase.savedResources = savedResources;
    if (isArchived !== undefined) supportCase.isArchived = Boolean(isArchived);

    await supportCase.save();
    res.json({ success: true, case: supportCase });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/support-cases/:id/tasks
 * Add a task to a case
 */
router.post('/:id/tasks', protect, async (req, res, next) => {
  try {
    const supportCase = await SupportCase.findOne({
      _id: req.params.id,
      user: req.user._id,
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

    supportCase.tasks.push(newTask);
    await supportCase.save();

    res.status(201).json({ success: true, case: supportCase, task: newTask });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/support-cases/:id/tasks/:taskId
 * Toggle or update task completion
 */
router.put('/:id/tasks/:taskId', protect, async (req, res, next) => {
  try {
    const supportCase = await SupportCase.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!supportCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const task = supportCase.tasks.find(t => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.body.completed !== undefined) task.completed = Boolean(req.body.completed);
    if (req.body.title !== undefined) task.title = req.body.title.trim();
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.priority !== undefined) task.priority = req.body.priority;

    await supportCase.save();
    res.json({ success: true, case: supportCase, task });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/support-cases/:id
 * Delete a case
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const result = await SupportCase.deleteOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Case not found or access denied' });
    }

    res.json({ success: true, message: 'Case successfully deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
