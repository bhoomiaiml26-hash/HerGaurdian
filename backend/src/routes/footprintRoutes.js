import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { analyzeFootprint } from '../services/footprintAnalyzer.js';
import { analyzeScreenshot } from '../services/screenshotAnalyzer.js';

const router = express.Router();

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many scan requests. Please try again in a few minutes.' },
});

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
      if (!image && !cleanText) {
        return res.status(400).json({
          success: false,
          message: 'Screenshot image data or extracted text is required for analysis.',
        });
      }

      if (image && typeof image === 'string') {
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
      if (!cleanText) {
        return res.status(400).json({ success: false, message: 'Text content is required for analysis.' });
      }
      if (cleanText.length > 10000) {
        return res.status(400).json({ success: false, message: 'Content exceeds maximum length of 10,000 characters.' });
      }
      analysis = analyzeFootprint(cleanText);
    }

    const summaryPrefix = scanType.toUpperCase();
    const summaryLength = scanType === 'screenshot' ? (image ? `${Math.round(image.length * 0.75 / 1024)}KB image` : `${cleanText.length} chars OCR`) : `${cleanText.length} chars`;
    const inputSummary = `${summaryPrefix} | ${summaryLength} | ${new Date().toISOString().split('T')[0]}`;

    const scan = await prisma.footprintScan.create({
      data: {
        userId: req.user.id,
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
      },
    });

    res.status(200).json({
      success: true,
      scanId: scan.id,
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

router.get('/scans', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [scans, total] = await Promise.all([
      prisma.footprintScan.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.footprintScan.count({ where: { userId: req.user.id } }),
    ]);
    const sanitized = scans.map(s => ({
      ...s,
      findings: (s.findings || []).map(f => {
        const { evidence, ...rest } = f;
        return rest;
      }),
    }));
    res.json({ success: true, scans: sanitized, total });
  } catch (err) {
    next(err);
  }
});

router.get('/scans/:id', protect, async (req, res, next) => {
  try {
    const scan = await prisma.footprintScan.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!scan) return res.status(404).json({ success: false, message: 'Scan report not found.' });
    res.json({ success: true, scan });
  } catch (err) {
    next(err);
  }
});

router.patch('/scans/:id/findings/:findingIndex', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['to_review', 'in_progress', 'resolved', 'not_applicable'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const scan = await prisma.footprintScan.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });

    const idx = parseInt(req.params.findingIndex, 10);
    const findings = Array.isArray(scan.findings) ? [...scan.findings] : [];
    if (isNaN(idx) || !findings[idx]) {
      return res.status(404).json({ success: false, message: 'Finding not found.' });
    }

    findings[idx] = { ...findings[idx], status };
    const resolvedCount = findings.filter((f) => f.status === 'resolved').length;

    const updated = await prisma.footprintScan.update({
      where: { id: scan.id },
      data: { findings, resolvedCount },
    });

    res.json({ success: true, scan: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/scans/:id', protect, async (req, res, next) => {
  try {
    const result = await prisma.footprintScan.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Scan not found.' });
    res.json({ success: true, message: 'Scan report deleted.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/scans', protect, async (req, res, next) => {
  try {
    await prisma.footprintScan.deleteMany({ where: { userId: req.user.id } });
    res.json({ success: true, message: 'All scan history deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
