import prisma from '../lib/prisma.js';

export const getChat = async (req, res, next) => {
  try {
    const chat = await prisma.chat.findFirst({ where: { userId: req.user.id } });
    if (!chat) {
      return res.status(200).json({ success: true, messages: [] });
    }
    res.status(200).json({ success: true, messages: chat.messages || [] });
  } catch (error) {
    next(error);
  }
};

export const saveMessage = async (req, res, next) => {
  try {
    const { id, role, content } = req.body;

    if (!id || !role || !content) {
      return res.status(400).json({ success: false, message: 'Message data is required' });
    }

    let chat = await prisma.chat.findFirst({ where: { userId: req.user.id } });
    const currentMessages = chat ? chat.messages : [];
    const updatedMessages = [
      ...currentMessages,
      { id, role, content, timestamp: new Date().toISOString() },
    ];

    if (chat) {
      chat = await prisma.chat.update({
        where: { id: chat.id },
        data: { messages: updatedMessages },
      });
    } else {
      chat = await prisma.chat.create({
        data: {
          userId: req.user.id,
          messages: updatedMessages,
        },
      });
    }

    res.status(201).json({ success: true, message: { id, role, content } });
  } catch (error) {
    next(error);
  }
};

export const clearChat = async (req, res, next) => {
  try {
    await prisma.chat.deleteMany({ where: { userId: req.user.id } });
    res.status(200).json({ success: true, message: 'Chat cleared' });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chat.findFirst({ where: { userId: req.user.id } });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const remainingMessages = (chat.messages || []).filter((msg) => msg.id !== id);

    if (remainingMessages.length === 0) {
      await prisma.chat.delete({ where: { id: chat.id } });
    } else {
      await prisma.chat.update({
        where: { id: chat.id },
        data: { messages: remainingMessages },
      });
    }

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};
