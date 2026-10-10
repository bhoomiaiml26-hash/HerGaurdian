import express from 'express';
import rateLimit from 'express-rate-limit';
import { analyzeSafetyMessage } from '../services/messageClassifier.js';

const router = express.Router();

// Privacy & abuse rate limiter
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many analysis requests from this IP. Please try again after a few minutes.'
  }
});

/**
 * POST /api/safety-analyzer/analyze
 * Analyzes text or OCR-extracted message for safety risks
 * 
 * PRIVACY: The incoming message content is strictly processed in-memory
 * and is NEVER written to the database or logged in server logs.
 */
router.post('/analyze', analyzeLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A message string is required for analysis.'
      });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    if (trimmed.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds the maximum permitted length of 5000 characters.'
      });
    }

    // Run NLP / ML analysis
    const result = await analyzeSafetyMessage(trimmed);

    return res.status(200).json({
      success: true,
      message: 'Analysis complete',
      data: result
    });
  } catch (error) {
    // Note: Do not log the sensitive message content in the error log
    console.error('[SafetyAnalyzer] Analysis error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while analyzing this message. Please try again.'
    });
  }
});

/**
 * GET /api/safety-analyzer/info
 * Health check & supported categories list
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      status: 'active',
      supportedCategories: [
        'NORMAL',
        'FINANCIAL_SCAM',
        'JOB_SCAM',
        'MATRIMONIAL_SCAM',
        'PHISHING',
        'HARASSMENT',
        'THREAT',
        'SUSPICIOUS'
      ],
      privacyMode: 'ephemeral-in-memory'
    }
  });
});

export default router;
