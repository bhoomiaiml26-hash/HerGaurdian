import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/auth.js';
import FootprintScan from '../models/FootprintScan.js';

const router = express.Router();

// Rate limiter: max 20 scans per 15 minutes per IP
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many scan requests. Please try again in a few minutes.' },
});

// ── PRIVACY HELPERS ────────────────────────────────────────────────────────────

/**
 * Detect potentially exposed personal information in submitted text.
 * Returns structured findings.
 * IMPORTANT: Uses pattern matching / NER — never stores the full input.
 */
function detectPrivacyExposure(text) {
  if (!text || typeof text !== 'string') return [];

  const findings = [];
  const t = text;

  // Email addresses
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emails = t.match(emailRegex);
  if (emails && emails.length > 0) {
    findings.push({
      type: 'email_address',
      severity: 'medium',
      title: 'Email Address Found',
      evidence: `Found ${emails.length} email address(es). Example: ${emails[0].replace(/./g, (c, i) => i < 3 || c === '@' || c === '.' ? c : '*')}`,
      recommendation: 'Consider removing or masking your email address from public-facing profiles. Use a contact form or privacy-protected email instead.',
      status: 'to_review',
    });
  }

  // Phone numbers (Indian and international formats)
  const phoneRegex = /(?:\+?91[\s\-]?)?[6-9]\d{9}|\+?[1-9]\d{1,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}/g;
  const phones = t.match(phoneRegex);
  if (phones && phones.length > 0) {
    findings.push({
      type: 'phone_number',
      severity: 'high',
      title: 'Phone Number Found',
      evidence: `Found ${phones.length} potential phone number(s).`,
      recommendation: 'Phone numbers in public profiles can expose you to unsolicited contact. Remove or hide your phone number and use platform messaging instead.',
      status: 'to_review',
    });
  }

  // Physical addresses (basic detection)
  const addressPatterns = [
    /\b\d+[A-Za-z]?\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Block|Sector|Nagar|Colony|Layout|Apartment|Flat|Floor)\b/gi,
    /\bFlat\s+No\.?\s*\d+/gi,
    /\bPlot\s+No\.?\s*\d+/gi,
    /\bH\.?No\.?\s*\d+/gi,
  ];
  let addressFound = false;
  for (const pattern of addressPatterns) {
    if (pattern.test(t)) { addressFound = true; break; }
  }
  if (addressFound) {
    findings.push({
      type: 'physical_address',
      severity: 'critical',
      title: 'Physical Address Detected',
      evidence: 'Your profile or content may contain a physical address or location clues.',
      recommendation: 'Remove your home, work, or school address from public profiles. Sharing physical addresses publicly poses a safety risk.',
      status: 'to_review',
    });
  }

  // Location clues — city/neighborhood mentions with routine
  const routinePatterns = [/\bevery (morning|evening|day|week)\b/i, /\bi (commute|travel|walk|drive) to\b/i, /\blive in\b.*?\b(near|opposite|next to)\b/i];
  for (const p of routinePatterns) {
    if (p.test(t)) {
      findings.push({
        type: 'routine_disclosure',
        severity: 'medium',
        title: 'Routine or Location Pattern Detected',
        evidence: 'Your content mentions predictable routines or location patterns.',
        recommendation: 'Avoid sharing regular schedules or routes publicly. This can make your movements predictable to strangers.',
        status: 'to_review',
      });
      break;
    }
  }

  // Usernames that may link accounts
  const usernamePattern = /@[\w._]{3,}/g;
  const usernames = t.match(usernamePattern);
  if (usernames && usernames.length > 1) {
    findings.push({
      type: 'cross_platform_username',
      severity: 'low',
      title: 'Multiple Usernames Found',
      evidence: `Found ${usernames.length} username references that may link accounts.`,
      recommendation: 'Using the same username across platforms can allow others to connect your accounts. Consider using different usernames per platform.',
      status: 'to_review',
    });
  }

  // Oversharing — age, income, sensitive personal details
  const oversharingPatterns = [
    { pattern: /\b(?:my salary|my income|i earn|i make)\s*(?:rs\.?|₹|inr)?\s*[\d,]+/i, label: 'income_disclosure', title: 'Income Information', severity: 'medium' },
    { pattern: /\bbank account\s*(?:number|no|#)\b/i, label: 'bank_info', title: 'Bank Account Reference', severity: 'critical' },
    { pattern: /\bpassport\s*(?:number|no)\b/i, label: 'passport', title: 'Passport Number Reference', severity: 'critical' },
    { pattern: /\baadhar|aadhaar|pan card|voter id/i, label: 'id_document', title: 'Government ID Reference', severity: 'critical' },
  ];
  for (const { pattern, label, title, severity } of oversharingPatterns) {
    if (pattern.test(t)) {
      findings.push({
        type: label,
        severity,
        title: `${title} Detected`,
        evidence: `Your content appears to mention ${title.toLowerCase()}.`,
        recommendation: 'Never share government IDs, bank account details, or financial information publicly. Remove this immediately.',
        status: 'to_review',
      });
    }
  }

  return findings;
}

function computeOverallRisk(findings) {
  if (findings.some((f) => f.severity === 'critical')) return 'critical';
  if (findings.some((f) => f.severity === 'high')) return 'high';
  if (findings.some((f) => f.severity === 'medium')) return 'medium';
  if (findings.length > 0) return 'low';
  return 'low';
}

// ── ROUTES ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/footprint/analyze
 * Analyze submitted text for privacy exposure.
 * Content is processed in-memory and NOT logged.
 */
router.post('/analyze', protect, scanLimiter, async (req, res, next) => {
  try {
    const { text, scanType = 'text' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text content is required for analysis.' });
    }
    const cleanText = text.trim();
    if (cleanText.length > 10000) {
      return res.status(400).json({ success: false, message: 'Content exceeds maximum length of 10,000 characters.' });
    }
    if (!['text', 'url', 'screenshot'].includes(scanType)) {
      return res.status(400).json({ success: false, message: 'Invalid scan type.' });
    }

    const findings = detectPrivacyExposure(cleanText);
    const overallRiskLevel = computeOverallRisk(findings);

    // Store metadata only — not the full text
    const inputSummary = `${scanType.toUpperCase()} | ${cleanText.length} chars | ${new Date().toISOString().split('T')[0]}`;

    const scan = await FootprintScan.create({
      user: req.user._id,
      scanType,
      inputSummary: inputSummary.slice(0, 200),
      findings,
      overallRiskLevel,
      findingCount: findings.length,
      resolvedCount: 0,
    });

    res.status(200).json({
      success: true,
      scanId: scan._id,
      findings,
      overallRiskLevel,
      findingCount: findings.length,
      checkedAt: scan.createdAt,
      message: findings.length === 0
        ? 'No obvious privacy exposures were detected in the submitted content. Note: this tool checks only the content you submitted — it cannot verify your privacy settings across the entire internet.'
        : `Found ${findings.length} item(s) that may need your attention.`,
    });
  } catch (err) {
    console.error('[FootprintScanner] Analysis error:', err.message);
    next(err);
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
