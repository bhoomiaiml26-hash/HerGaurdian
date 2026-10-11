import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import inspirationRoutes from './routes/inspirationRoutes.js';
import safetyAnalyzerRoutes from './routes/safetyAnalyzerRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import careerEnhancedRoutes from './routes/careerRoutes.js';
import footprintRoutes from './routes/footprintRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import supportCaseRoutes from './routes/supportCaseRoutes.js';
import documentDraftRoutes from './routes/documentDraftRoutes.js';
import wellnessRoutes from './routes/wellnessRoutes.js';
import opportunitiesRoutes from './routes/opportunitiesRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://her-gaurdian-self.vercel.app',
];

const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim().replace(/\/+$/, ''))
  : [];

const allowedOrigins = new Set([
  ...defaultOrigins.map((o) => o.replace(/\/+$/, '')),
  ...envOrigins,
]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/+$/, '');

    // Allow exact matches from allowedOrigins
    if (allowedOrigins.has(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow any Vercel deployment preview / production domain for HerGuardian
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // If FRONTEND_URL is set to '*', allow all
    if (process.env.FRONTEND_URL === '*') {
      return callback(null, true);
    }

    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

// Enable CORS for all routes and preflight requests
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', { skip: (req) => req.path.startsWith('/api/opportunities') }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/inspiration', inspirationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/safety-analyzer', safetyAnalyzerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/career', careerEnhancedRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/footprint', footprintRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/support-cases', supportCaseRoutes);
app.use('/api/drafts', documentDraftRoutes);
app.use('/api/wellness', wellnessRoutes);

app.use(errorHandler);

export default app;
