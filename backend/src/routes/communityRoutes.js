import express from 'express';
import protect from '../middleware/auth.js';
import CommunityPost from '../models/CommunityPost.js';
import CommunityReply from '../models/CommunityReply.js';
import CommunityReport from '../models/CommunityReport.js';

const router = express.Router();

/**
 * GET /api/community/posts
 * Fetch community posts with topic filter, search, and sorting
 */
router.get('/posts', async (req, res, next) => {
  try {
    const { topic, search, sort = 'newest' } = req.query;

    const query = { status: { $ne: 'hidden' } };

    if (topic && topic !== 'all') {
      query.topic = topic;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'helpful') {
      sortOption = { upvotes: -1, createdAt: -1 };
    }

    const posts = await CommunityPost.find(query)
      .sort(sortOption)
      .limit(50)
      .lean();

    // Check optional auth token to flag if user liked each post
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        // Optional auth failure is ignored for public list
      }
    }

    const formattedPosts = posts.map(post => ({
      ...post,
      upvoteCount: (post.upvotes || []).length,
      hasLiked: userId ? (post.upvotes || []).some(id => id.toString() === userId.toString()) : false,
      isOwner: userId ? post.user?.toString() === userId.toString() : false,
    }));

    res.json({ success: true, posts: formattedPosts });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/community/posts
 * Create a new community post
 */
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

    const newPost = await CommunityPost.create({
      user: req.user._id,
      authorName,
      isAnonymous: Boolean(isAnonymous),
      topic: topic || 'general',
      title: title.trim().slice(0, 200),
      content: content.trim().slice(0, 4000),
      upvotes: [],
      replyCount: 0,
    });

    res.status(201).json({
      success: true,
      post: {
        ...newPost.toObject(),
        upvoteCount: 0,
        hasLiked: false,
        isOwner: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/community/posts/:id
 * Get post details along with all active replies
 */
router.get('/posts/:id', async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id).lean();
    if (!post || post.status === 'hidden') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        // Ignored
      }
    }

    const replies = await CommunityReply.find({
      post: post._id,
      status: { $ne: 'hidden' },
    })
      .sort({ createdAt: 1 })
      .lean();

    const formattedReplies = replies.map(r => ({
      ...r,
      upvoteCount: (r.upvotes || []).length,
      hasLiked: userId ? (r.upvotes || []).some(id => id.toString() === userId.toString()) : false,
      isOwner: userId ? r.user?.toString() === userId.toString() : false,
    }));

    res.json({
      success: true,
      post: {
        ...post,
        upvoteCount: (post.upvotes || []).length,
        hasLiked: userId ? (post.upvotes || []).some(id => id.toString() === userId.toString()) : false,
        isOwner: userId ? post.user?.toString() === userId.toString() : false,
      },
      replies: formattedReplies,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/community/posts/:id/replies
 * Add a reply to a post
 */
router.post('/posts/:id/replies', protect, async (req, res, next) => {
  try {
    const { content, isAnonymous = false, pseudonym } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content cannot be empty' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post || post.status === 'hidden') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let authorName = (req.user.name || 'Member').trim();
    if (isAnonymous) {
      authorName = (pseudonym && pseudonym.trim()) ? pseudonym.trim() : 'Advocate Member';
    }

    const reply = await CommunityReply.create({
      post: post._id,
      user: req.user._id,
      authorName,
      isAnonymous: Boolean(isAnonymous),
      content: content.trim().slice(0, 2000),
      upvotes: [],
    });

    post.replyCount = (post.replyCount || 0) + 1;
    await post.save();

    res.status(201).json({
      success: true,
      reply: {
        ...reply.toObject(),
        upvoteCount: 0,
        hasLiked: false,
        isOwner: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/community/posts/:id/like
 * Toggle upvote on a post
 */
router.post('/posts/:id/like', protect, async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userIdStr = req.user._id.toString();
    const existingIndex = post.upvotes.findIndex(id => id.toString() === userIdStr);

    let hasLiked = false;
    if (existingIndex > -1) {
      post.upvotes.splice(existingIndex, 1);
      hasLiked = false;
    } else {
      post.upvotes.push(req.user._id);
      hasLiked = true;
    }

    await post.save();

    res.json({
      success: true,
      hasLiked,
      upvoteCount: post.upvotes.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/community/replies/:id/like
 * Toggle upvote on a reply
 */
router.post('/replies/:id/like', protect, async (req, res, next) => {
  try {
    const reply = await CommunityReply.findById(req.params.id);
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    const userIdStr = req.user._id.toString();
    const existingIndex = reply.upvotes.findIndex(id => id.toString() === userIdStr);

    let hasLiked = false;
    if (existingIndex > -1) {
      reply.upvotes.splice(existingIndex, 1);
      hasLiked = false;
    } else {
      reply.upvotes.push(req.user._id);
      hasLiked = true;
    }

    await reply.save();

    res.json({
      success: true,
      hasLiked,
      upvoteCount: reply.upvotes.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/community/report
 * Submit a moderation report for a post or reply
 */
router.post('/report', protect, async (req, res, next) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: 'Target and reason are required' });
    }

    const report = await CommunityReport.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      details: (details || '').trim().slice(0, 1000),
      status: 'pending',
    });

    if (targetType === 'post') {
      const post = await CommunityPost.findById(targetId);
      if (post) {
        post.isReported = true;
        post.reportCount = (post.reportCount || 0) + 1;
        // Automatically flag or hide if reported excessively (e.g. >= 5)
        if (post.reportCount >= 5) {
          post.status = 'flagged';
        }
        await post.save();
      }
    } else if (targetType === 'reply') {
      const reply = await CommunityReply.findById(targetId);
      if (reply) {
        reply.isReported = true;
        await reply.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderation team will review it according to community safety guidelines.',
      reportId: report._id,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/community/posts/:id
 * Delete own post
 */
router.delete('/posts/:id', protect, async (req, res, next) => {
  try {
    const post = await CommunityPost.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }

    await CommunityReply.deleteMany({ post: post._id });
    await CommunityPost.deleteOne({ _id: post._id });

    res.json({ success: true, message: 'Post and replies removed successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/community/replies/:id
 * Delete own reply
 */
router.delete('/replies/:id', protect, async (req, res, next) => {
  try {
    const reply = await CommunityReply.findOne({ _id: req.params.id, user: req.user._id });
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found or unauthorized' });
    }

    const postId = reply.post;
    await CommunityReply.deleteOne({ _id: reply._id });

    if (postId) {
      await CommunityPost.findByIdAndUpdate(postId, { $inc: { replyCount: -1 } });
    }

    res.json({ success: true, message: 'Reply deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
