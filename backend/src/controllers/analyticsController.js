import {
  getDashboardAnalytics,
  getFavoritesByModule,
  getRemindersByCategory,
  getRecentReminders,
  getRecentFavorites,
  getRecentChatMessages,
} from '../services/analyticsService.js';

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      dashboardData,
      favoritesByModule,
      remindersByCategory,
      recentReminders,
      recentFavorites,
      recentChatMessages,
    ] = await Promise.all([
      getDashboardAnalytics(userId),
      getFavoritesByModule(userId),
      getRemindersByCategory(userId),
      getRecentReminders(userId),
      getRecentFavorites(userId),
      getRecentChatMessages(userId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        dashboard: dashboardData,
        charts: {
          favoritesByModule,
          remindersByCategory,
        },
        recentActivity: {
          reminders: recentReminders,
          favorites: recentFavorites,
          chatMessages: recentChatMessages,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard Controller Error:', error);
    next(error);
  }
};
