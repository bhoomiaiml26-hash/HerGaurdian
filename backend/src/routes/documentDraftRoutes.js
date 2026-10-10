import express from 'express';
import protect from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const drafts = await prisma.documentDraft.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, drafts });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const { title, templateType, recipient, subject, content, caseId, status = 'draft' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Draft title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Draft content is required' });
    }

    const draft = await prisma.documentDraft.create({
      data: {
        userId: req.user.id,
        title: title.trim().slice(0, 200),
        templateType: (templateType || 'General Formal Complaint').trim(),
        recipient: (recipient || '').trim().slice(0, 300),
        subject: (subject || '').trim().slice(0, 300),
        content: content.trim(),
        caseId: caseId || null,
        status,
      },
    });

    res.status(201).json({ success: true, draft });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const draft = await prisma.documentDraft.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found or access denied' });
    }

    res.json({ success: true, draft });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const draft = await prisma.documentDraft.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found or access denied' });
    }

    const { title, recipient, subject, content, status } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.trim().slice(0, 200);
    if (recipient !== undefined) data.recipient = recipient.trim().slice(0, 300);
    if (subject !== undefined) data.subject = subject.trim().slice(0, 300);
    if (content !== undefined) data.content = content.trim();
    if (status !== undefined) data.status = status;

    const updated = await prisma.documentDraft.update({
      where: { id: draft.id },
      data,
    });

    res.json({ success: true, draft: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const result = await prisma.documentDraft.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Draft not found or access denied' });
    }

    res.json({ success: true, message: 'Draft deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
