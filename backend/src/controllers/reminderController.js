import prisma from '../lib/prisma.js';

export const getReminders = async (req, res, next) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, reminders });
  } catch (error) {
    next(error);
  }
};

export const createReminder = async (req, res, next) => {
  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user.id,
        title: req.body.title,
        category: req.body.category,
        time: req.body.time,
        notes: req.body.notes || '',
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          title: 'Reminder Created',
          message: `Reminder: ${reminder.title} at ${reminder.time}`,
          type: 'reminder',
        },
      });
    } catch (e) {
      console.error('Notification error', e);
    }

    res.status(201).json({ success: true, reminder });
  } catch (error) {
    next(error);
  }
};

export const updateReminder = async (req, res, next) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    const updated = await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        title: req.body.title || reminder.title,
        category: req.body.category || reminder.category,
        time: req.body.time || reminder.time,
        notes: req.body.notes ?? reminder.notes,
      },
    });

    res.status(200).json({ success: true, reminder: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteReminder = async (req, res, next) => {
  try {
    const result = await prisma.reminder.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    res.status(200).json({ success: true, message: 'Reminder deleted' });
  } catch (error) {
    next(error);
  }
};
