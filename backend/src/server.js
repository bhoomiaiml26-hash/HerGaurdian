import app from './app.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cron from 'node-cron';
import { refreshPopularCitySearches } from './services/opportunities/citySearch.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startOpportunityScheduler = () => {
  if (process.env.NODE_ENV === 'production') return;
  cron.schedule('0 */4 * * *', async () => {
    try {
      await refreshPopularCitySearches();
    } catch (error) {
      console.error('Scheduled opportunity refresh failed', error.message);
    }
  });
};

const startServer = async () => {
  try {
    await connectDB();
    startOpportunityScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
