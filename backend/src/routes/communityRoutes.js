import express from 'express';
import protect from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

const decodeOptionalUserId = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const jwt = await import('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
};

router.get('/posts', async (req, res, next) => {
  try {
    const { topic, search, sort = 'newest' } = req.query;

    const where = { NOT: { status: 'hidden' } };

    if (topic && topic !== 'all') {
      where.topic = topic;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'helpful') {
      orderBy = [{ upvotes: 'desc' }, { createdAt: 'desc' }];
    }

    const posts = await prisma.communityPost.findMany({
      where,
      orderBy,
      take: 50,
    });

    const userId = await decodeOptionalUserId(req);

    const formattedPosts = posts.map(post => ({
      ...post,
      upvoteCount: (post.upvotes || []).length,
      hasLiked: userId ? (post.upvotes || []).some(id => String(id) === String(userId)) : false,
      isOwner: userId ? String(post.userId) === String(userId) : false,
    }));

    res.json({ success: true, posts: formattedPosts });
  } catch (err) {
    next(err);
  }
});

router.post('/posts', protect, async (req, res, next) => {
  try {
    const { title, content, topic = 'general', isAnonymous = false, pseudonym } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Post title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    let authorName = (req.user.name || 'Member').trim();
    if (isAnonymous) {
      authorName = (pseudonym && pseudonym.trim()) ? pseudonym.trim() : 'Advocate Member';
    }

    const newPost = await prisma.communityPost.create({
      data: {
        userId: req.user.id,
        authorName,
        isAnonymous: Boolean(isAnonymous),
        topic: topic || 'general',
        title: title.trim().slice(0, 200),
        content: content.trim().slice(0, 4000),
        upvotes: [],
        replyCount: 0,
      },
    });

    res.status(201).json({
      success: true,
      post: {
        ...newPost,
        upvoteCount: 0,
        hasLiked: false,
        isOwner: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:id', async (req, res, next) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post || post.status === 'hidden') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = await decodeOptionalUserId(req);

    const replies = await prisma.communityReply.findMany({
      where: { postId: post.id, NOT: { status: 'hidden' } },
      orderBy: { createdAt: 'asc' },
    });

    const formattedReplies = replies.map(r => ({
      ...r,
      upvoteCount: (r.upvotes || []).length,
      hasLiked: userId ? (r.upvotes || []).some(id => String(id) === String(userId)) : false,
      isOwner: userId ? String(r.userId) === String(userId) : false,
    }));

    res.json({
      success: true,
      post: {
        ...post,
        upvoteCount: (post.upvotes || []).length,
        hasLiked: userId ? (post.upvotes || []).some(id => String(id) === String(userId)) : false,
        isOwner: userId ? String(post.userId) === String(userId) : false,
      },
      replies: formattedReplies,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:id/replies', protect, async (req, res, next) => {
  try {
    const { content, isAnonymous = false, pseudonym } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content cannot be empty' });
    }

    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post || post.status === 'hidden') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let authorName = (req.user.name || 'Member').trim();
    if (isAnonymous) {
      authorName = (pseudonym && pseudonym.trim()) ? pseudonym.trim() : 'Advocate Member';
    }

    const reply = await prisma.communityReply.create({
      data: {
        postId: post.id,
        userId: req.user.id,
        authorName,
        isAnonymous: Boolean(isAnonymous),
        content: content.trim().slice(0, 2000),
        upvotes: [],
      },
    });

    await prisma.communityPost.update({
      where: { id: post.id },
      data: { replyCount: (post.replyCount || 0) + 1 },
    });

    res.status(201).json({
      success: true,
      reply: {
        ...reply,
        upvoteCount: 0,
        hasLiked: false,
        isOwner: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:id/like', protect, async (req, res, next) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userIdStr = String(req.user.id);
    const upvotes = Array.isArray(post.upvotes) ? [...post.upvotes] : [];
    const existingIndex = upvotes.findIndex(id => String(id) === userIdStr);

    let hasLiked = false;
    if (existingIndex > -1) {
      upvotes.splice(existingIndex, 1);
      hasLiked = false;
    } else {
      upvotes.push(req.user.id);
      hasLiked = true;
    }

    await prisma.communityPost.update({
      where: { id: post.id },
      data: { upvotes },
    });

    res.json({
      success: true,
      hasLiked,
      upvoteCount: upvotes.length,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/replies/:id/like', protect, async (req, res, next) => {
  try {
    const reply = await prisma.communityReply.findUnique({ where: { id: req.params.id } });
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    const userIdStr = String(req.user.id);
    const upvotes = Array.isArray(reply.upvotes) ? [...reply.upvotes] : [];
    const existingIndex = upvotes.findIndex(id => String(id) === userIdStr);

    let hasLiked = false;
    if (existingIndex > -1) {
      upvotes.splice(existingIndex, 1);
      hasLiked = false;
    } else {
      upvotes.push(req.user.id);
      hasLiked = true;
    }

    await prisma.communityReply.update({
      where: { id: reply.id },
      data: { upvotes },
    });

    res.json({
      success: true,
      hasLiked,
      upvoteCount: upvotes.length,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/report', protect, async (req, res, next) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: 'Target and reason are required' });
    }

    const report = await prisma.communityReport.create({
      data: {
        reporterId: req.user.id,
        targetType,
        targetId,
        reason,
        details: (details || '').trim().slice(0, 1000),
        status: 'pending',
      },
    });

    if (targetType === 'post') {
      const post = await prisma.communityPost.findUnique({ where: { id: targetId } });
      if (post) {
        const data = {
          isReported: true,
          reportCount: (post.reportCount || 0) + 1,
        };
        if (data.reportCount >= 5) {
          data.status = 'flagged';
        }
        await prisma.communityPost.update({ where: { id: targetId }, data });
      }
    } else if (targetType === 'reply') {
      const reply = await prisma.communityReply.findUnique({ where: { id: targetId } });
      if (reply) {
        await prisma.communityReply.update({
          where: { id: targetId },
          data: { isReported: true },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderation team will review it according to community safety guidelines.',
      reportId: report.id,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/posts/:id', protect, async (req, res, next) => {
  try {
    const post = await prisma.communityPost.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }

    await prisma.communityReply.deleteMany({ where: { postId: post.id } });
    await prisma.communityPost.delete({ where: { id: post.id } });

    res.json({ success: true, message: 'Post and replies removed successfully' });
  } catch (err) {
    next(err);
  }
});

router.delete('/replies/:id', protect, async (req, res, next) => {
  try {
    const reply = await prisma.communityReply.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found or unauthorized' });
    }

    const postId = reply.postId;
    await prisma.communityReply.delete({ where: { id: reply.id } });

    if (postId) {
      const post = await prisma.communityPost.findUnique({ where: { id: postId } });
      if (post) {
        await prisma.communityPost.update({
          where: { id: postId },
          data: { replyCount: Math.max(0, (post.replyCount || 0) - 1) },
        });
      }
    }

    res.json({ success: true, message: 'Reply deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
