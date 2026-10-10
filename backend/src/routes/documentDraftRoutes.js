import express from 'express';
import protect from '../middleware/auth.js';
import DocumentDraft from '../models/DocumentDraft.js';

const router = express.Router();

/**
 * GET /api/drafts
 * List user's saved drafts
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const drafts = await DocumentDraft.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, drafts });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/drafts
 * Save a new document draft
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, templateType, recipient, subject, content, caseId, status = 'draft' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Draft title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Draft content is required' });
    }

    const draft = await DocumentDraft.create({
      user: req.user._id,
      title: title.trim().slice(0, 200),
      templateType: (templateType || 'General Formal Complaint').trim(),
      recipient: (recipient || '').trim().slice(0, 300),
      subject: (subject || '').trim().slice(0, 300),
      content: content.trim(),
      caseId: caseId || null,
      status,
    });

    res.status(201).json({ success: true, draft });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/drafts/:id
 * Retrieve a specific draft (strictly scoped to owner)
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const draft = await DocumentDraft.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found or access denied' });
    }

    res.json({ success: true, draft });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/drafts/:id
 * Update an existing draft
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const draft = await DocumentDraft.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found or access denied' });
    }

    const { title, recipient, subject, content, status } = req.body;

    if (title !== undefined) draft.title = title.trim().slice(0, 200);
    if (recipient !== undefined) draft.recipient = recipient.trim().slice(0, 300);
    if (subject !== undefined) draft.subject = subject.trim().slice(0, 300);
    if (content !== undefined) draft.content = content.trim();
    if (status !== undefined) draft.status = status;

    await draft.save();
    res.json({ success: true, draft });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/drafts/:id
 * Delete a draft
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const result = await DocumentDraft.deleteOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Draft not found or access denied' });
    }

    res.json({ success: true, message: 'Draft deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
