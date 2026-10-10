import prisma from '../lib/prisma.js';

export const getFeedback = async (req, res, next) => {
  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

export const createFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user.id,
        userName: req.user.name,
        rating,
        comment,
      },
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};
