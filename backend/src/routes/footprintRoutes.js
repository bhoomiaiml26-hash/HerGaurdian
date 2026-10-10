import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/auth.js';
import FootprintScan from '../models/FootprintScan.js';
import { analyzeFootprint } from '../services/footprintAnalyzer.js';
import { analyzeScreenshot } from '../services/screenshotAnalyzer.js';

const router = express.Router();

// Rate limiter: max 40 scans per 15 minutes per IP
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many scan requests. Please try again in a few minutes.' },
});

// ── ROUTES ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/footprint/analyze
 * Analyze submitted profile text, bio, or screenshot image for privacy exposure.
 * Content is processed strictly in-memory and is never stored in full.
 */
router.post('/analyze', protect, scanLimiter, async (req, res, next) => {
  try {
    const {
      text = '',
      scanType = 'text',
      image = '',
      mimeType = 'image/png',
      ocrConfidence = 0,
      isSyntheticBlur = false,
    } = req.body;

    if (!['text', 'url', 'screenshot'].includes(scanType)) {
      return res.status(400).json({ success: false, message: 'Invalid scan type.' });
    }

    let analysis;
    let cleanText = (text || '').trim();

    if (scanType === 'screenshot') {
      // Validate screenshot image payload
      if (!image && !cleanText) {
        return res.status(400).json({
          success: false,
          message: 'Screenshot image data or extracted text is required for analysis.',
        });
      }

      if (image && typeof image === 'string') {
        // Enforce 10MB base64 size ceiling (~14 million chars)
        if (image.length > 14 * 1024 * 1024) {
          return res.status(400).json({ success: false, message: 'Screenshot exceeds maximum size limit of 10MB.' });
        }
      }

      if (mimeType && !['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(mimeType.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Unsupported image format. Please upload PNG, JPG, or WebP.' });
      }

      analysis = await analyzeScreenshot({
        imageBase64: image,
        mimeType,
        ocrText: cleanText,
        ocrConfidence: Number(ocrConfidence) || 0,
        isSyntheticBlur: Boolean(isSyntheticBlur),
      });
    } else {
      // Text or URL scan
      if (!cleanText) {
        return res.status(400).json({ success: false, message: 'Text content is required for analysis.' });
      }
      if (cleanText.length > 10000) {
        return res.status(400).json({ success: false, message: 'Content exceeds maximum length of 10,000 characters.' });
      }
      analysis = analyzeFootprint(cleanText);
    }

    // Store metadata only — not the raw image or raw text
    const summaryPrefix = scanType.toUpperCase();
    const summaryLength = scanType === 'screenshot' ? (image ? `${Math.round(image.length * 0.75 / 1024)}KB image` : `${cleanText.length} chars OCR`) : `${cleanText.length} chars`;
    const inputSummary = `${summaryPrefix} | ${summaryLength} | ${new Date().toISOString().split('T')[0]}`;

    const scan = await FootprintScan.create({
      user: req.user._id,
      scanType,
      inputSummary: inputSummary.slice(0, 200),
      findings: analysis.findings,
      overallRiskLevel: analysis.overallRiskLevel,
      isInconclusive: Boolean(analysis.isInconclusive),
      riskScore: analysis.riskScore,
      reasoning: analysis.reasoning,
      limitations: analysis.limitations,
      findingCount: analysis.findingCount,
      resolvedCount: 0,
    });

    res.status(200).json({
      success: true,
      scanId: scan._id,
      findings: analysis.findings,
      overallRiskLevel: analysis.overallRiskLevel,
      isInconclusive: Boolean(analysis.isInconclusive),
      riskScore: analysis.riskScore,
      reasoning: analysis.reasoning,
      limitations: analysis.limitations,
      uncertaintyNote: analysis.uncertaintyNote || null,
      findingCount: analysis.findingCount,
      checkedAt: scan.createdAt,
      message: analysis.reasoning,
    });
  } catch (err) {
    console.error('[FootprintScanner] Analysis error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message || 'Analysis failed. Please check your input and try again.',
    });
  }
});

/**
 * GET /api/footprint/scans
 * List previous scan reports for the authenticated user.
 */
router.get('/scans', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [scans, total] = await Promise.all([
      FootprintScan.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-findings.evidence') // Don't re-send evidence in list view
        .lean(),
      FootprintScan.countDocuments({ user: req.user._id }),
    ]);
    res.json({ success: true, scans, total });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/footprint/scans/:id
 * Get a specific scan with full details.
 */
router.get('/scans/:id', protect, async (req, res, next) => {
  try {
    const scan = await FootprintScan.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!scan) return res.status(404).json({ success: false, message: 'Scan report not found.' });
    res.json({ success: true, scan });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/footprint/scans/:id/findings/:findingIndex
 * Update a finding's status (to_review, in_progress, resolved, not_applicable)
 */
router.patch('/scans/:id/findings/:findingIndex', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['to_review', 'in_progress', 'resolved', 'not_applicable'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const scan = await FootprintScan.findOne({ _id: req.params.id, user: req.user._id });
    if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });

    const idx = parseInt(req.params.findingIndex, 10);
    if (isNaN(idx) || !scan.findings[idx]) {
      return res.status(404).json({ success: false, message: 'Finding not found.' });
    }

    scan.findings[idx].status = status;
    scan.resolvedCount = scan.findings.filter((f) => f.status === 'resolved').length;
    scan.markModified('findings');
    await scan.save();

    res.json({ success: true, scan });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/footprint/scans/:id
 * Delete a specific scan report.
 */
router.delete('/scans/:id', protect, async (req, res, next) => {
  try {
    const scan = await FootprintScan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
    res.json({ success: true, message: 'Scan report deleted.' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/footprint/scans
 * Delete ALL scan history for the authenticated user.
 */
router.delete('/scans', protect, async (req, res, next) => {
  try {
    await FootprintScan.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'All scan history deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
