import prisma from '../lib/prisma.js';

export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, favorites });
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (req, res, next) => {
  try {
    const { itemId, title, description, category, source } = req.body;

    if (!itemId || !title) {
      return res.status(400).json({ success: false, message: 'Item ID and title are required' });
    }

    const existing = await prisma.favorite.findFirst({
      where: { userId: req.user.id, itemId },
    });
    if (existing) {
      return res.status(200).json({ success: true, favorite: existing });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        itemId,
        title,
        description: description || '',
        category: category || 'General',
        source: source || 'general',
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          title: 'Added to Favorites',
          message: `"${favorite.title}" was added to your favorites.`,
          type: 'success',
        },
      });
    } catch (e) {
      console.error('Notification error', e);
    }

    res.status(201).json({ success: true, favorite });
  } catch (error) {
    if (error.code === 'P2002') {
      const existing = await prisma.favorite.findFirst({
        where: { userId: req.user.id, itemId: req.body.itemId },
      });
      return res.status(200).json({ success: true, favorite: existing });
    }
    next(error);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const result = await prisma.favorite.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    res.status(200).json({ success: true, message: 'Favorite removed' });
  } catch (error) {
    next(error);
  }
};
