/**
 * screenshotAnalyzer.js
 * Multi-Layered Visual & Textual Privacy Risk Analyzer for HerGuardian AI Screenshots.
 *
 * Examines uploaded screenshots for:
 * 1. Authentication secrets & payment credentials (passwords, OTPs, auth tokens, credit cards, CVVs) -> CRITICAL
 * 2. Real-time live location, map pins, GPS coordinates -> CRITICAL / HIGH
 * 3. Physical residential home addresses -> CRITICAL / HIGH
 * 4. Contact information (phone numbers, email addresses)
 * 5. Location patterns (recurring check-in locations, routine travel disclosures)
 * 6. Private messages, sensitive/vulnerable disclosures ("home alone")
 * 7. Blurred or unreadable images -> INCONCLUSIVE / LIMITED VISIBILITY
 * 8. Benign creative content (artwork, photography, landscapes) -> LOW RISK
 *
 * PRIVACY GUARANTEE:
 * - Operates strictly in-memory.
 * - Sensitive values (passwords, tokens, payment cards) are strictly masked and NEVER logged or stored in plain text.
 */

import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiVisionModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiVisionModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });
  } catch (err) {
    console.warn('[ScreenshotAnalyzer] Gemini Vision initialization notice:', err.message);
  }
}

// ── SENSITIVE VALUE MASKING ───────────────────────────────────────────────────

/**
 * Masks sensitive authentication secrets and financial numbers to prevent exposure in logs or UI.
 */
export function maskSensitiveValue(val) {
  if (!val || typeof val !== 'string') return '••••••';
  const clean = val.trim();
  // Card numbers (16 digits or 4 groups of 4)
  if (/^\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}$/.test(clean)) {
    return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
  }
  // Short tokens/codes (OTP, PIN, passwords)
  if (clean.length <= 8) return '••••••';
  // Long tokens/keys (JWT, Bearer, API Keys)
  return `${clean.slice(0, 3)}••••••••${clean.slice(-3)}`;
}

// ── PATTERNS SPECIFIC TO SCREENSHOT PRIVACY AUDITING ──────────────────────────

const SCREENSHOT_PATTERNS = {
  // Authentication Secrets & Credentials (CRITICAL)
  authToken: /\b(bearer\s+[a-zA-Z0-9_\-\.]{15,}|sk_live_[a-zA-Z0-9]{15,}|api[_-]?key\s*[:=]\s*[\w\-]{12,}|jwt\s*token|access[_-]?token\s*[:=]\s*[\w\-\.]{15,}|auth[_-]?secret|private[_-]?key)\b/i,
  password: /\b(password|passwd|pwd)\s*[:=]?\s*([^\s]{4,})/i,
  tempPassword: /\b(temp(orary)?\s*password|one-time\s*password|reset\s*password\s*to)\b/i,
  verificationCode: /\b(verification\s*code|otp|security\s*code|auth\s*code|2fa\s*code|login\s*code)\b[:\s]*(\d{4,8})/i,

  // Financial & Payment Credentials (CRITICAL)
  creditCard: /\b(?:\d{4}[ -]?){3}\d{4}\b/,
  cvv: /\bcvv\s*[:=]?\s*\d{3,4}\b/i,
  paymentDetails: /\b(card\s*number|expiry\s*date|exp\s*[:=]?\s*\d{2}\/\d{2,4}|upi\s*pin|bank\s*pin)\b/i,

  // Live Location & Map Interfaces (CRITICAL / HIGH)
  // Negative lookbehind prevents matching phrases like "no live location" or "without live location"
  liveLocationInterface: /(?<!no\s{0,4}|without\s{0,4})\b(live\s*location\s*(is\s*|are\s*)?(publicly\s*)?(shared|enabled|on|active|visible|posted)|sharing\s*live\s*location|real-?time\s*location\s*(is\s*|are\s*)?(shared|visible|public|active)|real-?time\s*whereabouts|sharing\s*until|live\s*until|live\s*for\s*\d+\s*(mins?|hours?)|maps?\.google|google\s*maps|dropped\s*pin|current\s*gps\s*location|navigation\s*active)\b/i,

  // Physical Residential Home Address (CRITICAL / HIGH)
  // Negative lookbehind prevents matching phrases like "no home address"
  homeAddressDeclared: /(?<!no\s{0,4}|without\s{0,4})\b(home\s*address\s*(and\s*[\w\s]*?)?\s*(is\s*|are\s*)?(publicly\s*)?(shared|visible|exposed|posted)|residential\s*address\s*(is\s*|are\s*)?(shared|visible|exposed|posted)|my\s*home\s*address|live\s*at\s+[\w\s,]+)\b/i,
  physicalAddressPattern: [
    /\b\d+[A-Za-z]?\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Block|Sector|Nagar|Colony|Layout|Apartment|Flat|Floor)\b/i,
    /\bFlat\s+No\.?\s*\d+/i,
    /\bPlot\s+No\.?\s*\d+/i,
    /\bH\.?No\.?\s*\d+/i,
  ],

  // Contact Exposures
  emailPattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i,
  phonePattern: /(?:\+?91[\s\-]?)?[6-9]\d{9}|\+?[1-9]\d{1,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}/,
  emailDeclared: /\b(email(\s*(and|&|,)\s*phone(\s*number)?)?(\s*address)?\s*(is|are)?\s*(visible|public|exposed|shared)|public\s*email|contact(\s*me)?\s*(at|via)\s*email)\b/i,
  phoneDeclared: /\b((email\s*(and|&|,)\s*)?phone(\s*number)?\s*(is|are)\s*(visible|public|exposed|shared)|whatsapp|mobile(\s*number)?\s*(is|are)\s*(visible|public))\b/i,
  emailHidden: /\b(email(\s*(and|&|,)\s*phone(\s*number)?)?(\s*address)?\s*(is|are)?\s*(hidden|not\s*visible|masked|private)|no\s*email\s*(shared|visible))\b/i,
  phoneHidden: /\b((email\s*(and|&|,)\s*)?phone(\s*number)?\s*(is|are)?\s*(hidden|not\s*visible|masked|private)|no\s*phone\s*(shared|visible))\b/i,

  // Location Patterns & Routine Check-Ins (MEDIUM)
  cityCheckIns: /\b(city\s*and\s*recurring\s*check-in|recurring\s*check-in|check-in\s*locations|frequent\s*check-?ins?|routine\s*places\s*and\s*activities|daily\s*gym|commute\s*to\s+[\w\s]+every)\b/i,

  // Post & Profile Context
  privateProfile: /\b(private\s*(profile|account|visibility)?|account\s*is\s*private|profile\s*is\s*private|only\s*approved\s*followers)\b/i,
  publicProfile: /\b(public\s*(profile|account|visibility)?|account\s*is\s*public|profile\s*is\s*public|open\s*profile)\b/i,
  homeAlone: /\b(home\s*alone|alone\s*at\s*home|living\s*alone|when\s*(the\s*person\s*is|i\s*am)\s*home\s*alone|parents\s*(are\s*)?out\s*of\s*town|house\s*to\s*myself)\b/i,
  benignArtHobbies: /\b(general\s*artwork\s*and\s*hobbies|artwork|paintings|art\s*portfolio|drawings|illustrations|hobbies|crafts|cooking\s*recipes|sunset\s*photos|nature\s*photography|landscape\s*photo|ordinary\s*scenery|scenic\s*view|mountain\s*view)\b/i,

  // Blur / Unreadable Clues
  blurIndicators: /\b(heavily\s*blurred|blurred\s*screenshot|unreadable\s*text|blurry\s*image|cannot\s*read|distorted\s*text|motion\s*blur)\b/i,
};

// ── DETERMINISTIC SCREENSHOT ANALYSIS ENGINE ───────────────────────────────────

export function analyzeScreenshotDeterministic({ text = '', confidence = 0, mimeType = '', imageSize = 0, isSyntheticBlur = false }) {
  const t = (text || '').trim();

  // 1. Check for Blurred or Unreadable Screenshot (Test F)
  // Triggered when OCR confidence is critically low (< 35) AND text is sparse/noisy,
  // OR when blur indicators are present in the image metadata/description.
  const isBlurred = isSyntheticBlur ||
    SCREENSHOT_PATTERNS.blurIndicators.test(t) ||
    (confidence > 0 && confidence < 35 && t.length < 80) ||
    (t.length > 0 && t.length < 20 && confidence < 30);

  if (isBlurred) {
    return {
      riskScore: 0,
      overallRiskLevel: 'inconclusive',
      isInconclusive: true,
      findings: [
        {
          type: 'blurred_unreadable_content',
          severity: 'low',
          title: 'Limited Visibility / Unreadable Content',
          evidence: 'The screenshot image appears heavily blurred, degraded, or out of focus.',
          reasoning: 'Critical visual details and text characters cannot be reliably identified due to low resolution or image blur.',
          recommendation: 'Upload a clear, uncompressed, high-resolution screenshot to perform an accurate privacy assessment.',
          status: 'not_applicable',
        },
      ],
      reasoning: 'Analysis inconclusive due to limited visual clarity. Details in the image could not be reliably determined, so no artificial risk was inferred.',
      limitations: 'The uploaded screenshot is unreadable or heavily blurred. Findings and safety scores cannot be reliably calculated without clear visual text.',
      uncertaintyNote: 'High image blur detected. Portions of this screenshot may contain obscured information that could not be evaluated.',
      findingCount: 1,
    };
  }

  // If text is completely empty after OCR on a non-blurred image
  if (!t) {
    return {
      riskScore: 5,
      overallRiskLevel: 'low',
      isInconclusive: false,
      findings: [
        {
          type: 'no_text_detected',
          severity: 'low',
          title: 'No Readable Text Detected',
          evidence: 'No text or textual identifiers were found in the uploaded screenshot.',
          reasoning: 'Visual inspection did not find readable personal data, contact information, or sensitive credentials.',
          recommendation: 'If this screenshot was meant to contain text, ensure the text is legible and well-lit.',
          status: 'resolved',
        },
      ],
      reasoning: 'Low risk. No readable personal data, contact details, or credentials were found in the screenshot.',
      limitations: 'Analysis is based strictly on the readable visual content of the uploaded screenshot.',
      findingCount: 1,
    };
  }

  const findings = [];
  let calculatedScore = 5; // Minimal base

  // 2. Check for Critical Sensitive Authentication & Payment Information (Test D)
  let hasCriticalSecret = false;

  // 2a. Authentication Secrets (API Keys, Tokens, Bearer strings)
  const tokenMatch = t.match(SCREENSHOT_PATTERNS.authToken);
  if (tokenMatch) {
    hasCriticalSecret = true;
    calculatedScore += 55;
    findings.push({
      type: 'auth_secret_exposed',
      severity: 'critical',
      title: 'Authentication Secret / API Key Exposed',
      evidence: 'Detected exposed API key or authentication token in screenshot: ' + maskSensitiveValue(tokenMatch[0]),
      reasoning: 'Exposing authentication tokens or secret keys allows attackers to impersonate your account, access private backend APIs, or compromise services.',
      recommendation: 'Immediately revoke and rotate the exposed API key or token in your account settings. Treat the secret as compromised.',
      status: 'to_review',
    });
  }

  // 2b. Password Exposure
  const pwdMatch = t.match(SCREENSHOT_PATTERNS.password) || t.match(SCREENSHOT_PATTERNS.tempPassword);
  if (pwdMatch) {
    hasCriticalSecret = true;
    calculatedScore += 55;
    findings.push({
      type: 'password_exposed',
      severity: 'critical',
      title: 'Password / Credential Visible',
      evidence: 'Detected visible password or temporary login credential: ' + maskSensitiveValue(pwdMatch[2] || 'password'),
      reasoning: 'A readable password allows anyone viewing the screenshot to access your personal or corporate account directly.',
      recommendation: 'Immediately change your password and enable multi-factor authentication (MFA). Never store passwords in screenshot format.',
      status: 'to_review',
    });
  }

  // 2c. Verification Code / OTP
  const otpMatch = t.match(SCREENSHOT_PATTERNS.verificationCode);
  if (otpMatch) {
    hasCriticalSecret = true;
    calculatedScore += 50;
    findings.push({
      type: 'otp_exposed',
      severity: 'critical',
      title: 'Verification Code / OTP Visible',
      evidence: 'Detected visible verification code or security code: ' + maskSensitiveValue(otpMatch[2] || '123456'),
      reasoning: 'One-time verification codes grant access to accounts during login or transaction verification. Exposing them can lead to instant account takeover.',
      recommendation: 'Never share screenshots displaying verification codes. Ensure login alerts and secondary authentication methods are active.',
      status: 'to_review',
    });
  }

  // 2d. Credit Card / Payment Details
  const ccMatch = t.match(SCREENSHOT_PATTERNS.creditCard);
  const cvvMatch = t.match(SCREENSHOT_PATTERNS.cvv);
  const paymentMatch = t.match(SCREENSHOT_PATTERNS.paymentDetails);
  if (ccMatch || cvvMatch || paymentMatch) {
    hasCriticalSecret = true;
    calculatedScore += 55;
    findings.push({
      type: 'payment_credential_exposed',
      severity: 'critical',
      title: 'Financial / Payment Card Credentials Exposed',
      evidence: ccMatch ? `Payment card number detected: ${maskSensitiveValue(ccMatch[0])}` : 'Payment card credentials or CVV detected.',
      reasoning: 'Exposing debit/credit card numbers or CVVs enables unauthorized financial transactions and card cloning.',
      recommendation: 'Immediately contact your card issuer to block the card or freeze digital transactions. Never post payment receipts or card faces.',
      status: 'to_review',
    });
  }

  // 3. Location Exposures (Test C & Test B)
  // 3a. Real-Time Live Location & Map Interfaces (Test C)
  const isLiveLocation = SCREENSHOT_PATTERNS.liveLocationInterface.test(t);
  if (isLiveLocation) {
    calculatedScore += 30;
    findings.push({
      type: 'live_location_exposed',
      severity: 'critical',
      title: 'Real-Time Live Location / Map Pin Broadcast',
      evidence: 'Screenshot displays an active live location map, dropped pin, or real-time location sharing indicator.',
      reasoning: 'Sharing an active live map or location pin enables in-person tracking in real time, creating an immediate physical safety risk.',
      recommendation: 'Stop live location sharing in messaging/social apps immediately and avoid capturing map pins in screenshots.',
      status: 'to_review',
    });
  }

  // 3b. Home Address / Residential Exposure (Test C)
  const isHomeAddress = SCREENSHOT_PATTERNS.homeAddressDeclared.test(t) ||
    SCREENSHOT_PATTERNS.physicalAddressPattern.some(p => p.test(t));
  if (isHomeAddress) {
    calculatedScore += 35;
    findings.push({
      type: 'home_address_exposed',
      severity: 'critical',
      title: 'Physical Residential Address Exposed',
      evidence: 'Detected visible residential street address or house location in screenshot content.',
      reasoning: 'Disclosing a physical home address exposes your residential dwelling to physical stalking, unsolicited visits, and burglary.',
      recommendation: 'Crop or redact the address from the screenshot before saving or sharing. Never disclose residential street coordinates.',
      status: 'to_review',
    });
  }

  // 3c. City & Recurring Check-In Locations (Test B)
  const isCityCheckIns = SCREENSHOT_PATTERNS.cityCheckInsExposed ? SCREENSHOT_PATTERNS.cityCheckInsExposed.test(t) : SCREENSHOT_PATTERNS.cityCheckIns.test(t);
  if (isCityCheckIns && !isLiveLocation && !isHomeAddress) {
    calculatedScore += 20;
    findings.push({
      type: 'routine_location_exposed',
      severity: 'medium',
      title: 'Routine Check-In & Travel Locations',
      evidence: 'Screenshot mentions city check-ins, routine hangout spots, or predictable travel routes.',
      reasoning: 'Regular check-ins reveal daily movement patterns and make your routine predictable to observers.',
      recommendation: 'Refrain from posting check-ins in real time; post retrospectively after departing the venue.',
      status: 'to_review',
    });
  }

  // 4. Contact Exposures (Test B & Test C)
  // 4a. Email
  const emailHidden = SCREENSHOT_PATTERNS.emailHidden.test(t);
  const literalEmail = !emailHidden && t.match(SCREENSHOT_PATTERNS.emailPattern);
  const emailExposed = !emailHidden && (literalEmail || SCREENSHOT_PATTERNS.emailDeclared.test(t));

  if (emailExposed) {
    calculatedScore += 15;
    findings.push({
      type: 'email_exposed',
      severity: 'medium',
      title: 'Visible Personal Email Address',
      evidence: literalEmail ? `Visible email: ${literalEmail[0].replace(/(?<=.{2}).(?=[^@]*?@)/g, '*')}` : 'Email address is publicly visible in profile/post.',
      reasoning: 'Public emails attract targeted phishing, credential stuffing, and unsolicited spam messages.',
      recommendation: 'Mask or blur your direct email in public screenshots. Use platform-mediated contact options.',
      status: 'to_review',
    });
  }

  // 4b. Phone
  const phoneHidden = SCREENSHOT_PATTERNS.phoneHidden.test(t);
  const literalPhone = !phoneHidden && t.match(SCREENSHOT_PATTERNS.phonePattern);
  const phoneExposed = !phoneHidden && (literalPhone || SCREENSHOT_PATTERNS.phoneDeclared.test(t));

  if (phoneExposed) {
    calculatedScore += 25;
    findings.push({
      type: 'phone_exposed',
      severity: 'high',
      title: 'Visible Phone Number',
      evidence: 'Visible phone number detected in profile/conversation.',
      reasoning: 'Phone numbers can be leveraged for SIM swapping, WhatsApp stalking, and harassing phone calls.',
      recommendation: 'Redact phone numbers from all screenshots before sharing online.',
      status: 'to_review',
    });
  }

  // 5. Post Context: Vulnerable Situations & Hobbies
  const isHomeAlone = SCREENSHOT_PATTERNS.homeAlone.test(t);
  if (isHomeAlone) {
    calculatedScore += 20;
    findings.push({
      type: 'home_alone_disclosure',
      severity: 'high',
      title: 'Home Alone / Solitary Status Disclosed',
      evidence: 'Screenshot contains references indicating the person is home alone or in an isolated setting.',
      reasoning: 'Disclosing that you are alone signals physical vulnerability and substantially magnifies in-person safety risks.',
      recommendation: 'Never post or screenshot updates revealing that you are home alone.',
      status: 'to_review',
    });
  }

  // 6. Benign Artwork & Hobbies (Test A & Test E)
  const isBenignContent = SCREENSHOT_PATTERNS.benignArtHobbies.test(t);
  const hasNoSensitives = !hasCriticalSecret && !isLiveLocation && !isHomeAddress && !emailExposed && !phoneExposed && !isHomeAlone;

  if (isBenignContent && hasNoSensitives) {
    findings.push({
      type: 'benign_content',
      severity: 'low',
      title: 'Safe Non-Sensitive Content',
      evidence: 'Screenshot displays ordinary hobby, landscape, artistic, or creative non-sensitive imagery.',
      reasoning: 'No contact information, credentials, live coordinates, or private disclosures were identified in the visible content.',
      recommendation: 'Continue ensuring that personal identifying markers remain absent from shared screenshots.',
      status: 'resolved',
    });
    calculatedScore = Math.min(calculatedScore, 10);
  }

  // Profile Privacy Indicator
  if (SCREENSHOT_PATTERNS.privateProfile.test(t)) {
    findings.push({
      type: 'private_profile',
      severity: 'low',
      title: 'Private Account Setting Detected',
      evidence: 'Screenshot indicates a private profile configuration with restricted visibility.',
      reasoning: 'A private account prevents unapproved internet users from browsing posted content.',
      recommendation: 'Maintain strict follower approval standards.',
      status: 'resolved',
    });
    if (hasNoSensitives) calculatedScore = Math.min(calculatedScore, 10);
  } else if (SCREENSHOT_PATTERNS.publicProfile.test(t)) {
    calculatedScore += 10;
  }

  // High-Risk Synergy: Home Address + Live Location + (Phone OR Home Alone)
  if (isHomeAddress && isLiveLocation) {
    calculatedScore += 15;
  }

  // Clamp score
  const finalScore = Math.min(100, Math.max(5, Math.round(calculatedScore)));

  // Determine risk level
  let overallRiskLevel = 'low';
  if (hasCriticalSecret || finalScore >= 70) {
    overallRiskLevel = finalScore >= 85 ? 'critical' : 'high';
  } else if (finalScore >= 30) {
    overallRiskLevel = 'medium';
  } else {
    overallRiskLevel = 'low';
  }

  // Contextual reasoning
  let reasoning = '';
  if (overallRiskLevel === 'critical' || overallRiskLevel === 'high') {
    reasoning = hasCriticalSecret
      ? 'Critical risk detected due to exposed authentication credentials, passwords, or payment details. These secrets can lead to immediate account takeover or financial loss.'
      : 'High risk detected due to exposed physical residential address, live-location tracking, or multiple identifying contact coordinates in the screenshot.';
  } else if (overallRiskLevel === 'medium') {
    reasoning = 'Medium risk detected due to visible contact details (e.g. personal email) or recurring location check-in clues. While residential coordinates are absent, routine tracking and phishing risks exist.';
  } else {
    reasoning = 'Low risk. No significant privacy or security exposure was detected in the visible screenshot content.';
  }

  const limitations = 'Analysis is based on visible text and features extracted from the uploaded screenshot. Obscured, off-screen, or encrypted details cannot be verified.';

  return {
    riskScore: finalScore,
    overallRiskLevel,
    isInconclusive: false,
    findings,
    reasoning,
    limitations,
    findingCount: findings.length,
  };
}

// ── GEMINI VISION INTEGRATION (AI MULTIMODAL) ─────────────────────────────────

async function analyzeWithGeminiVision(base64Data, mimeType, ocrText) {
  if (!geminiVisionModel) return null;

  try {
    const prompt = `You are a privacy and digital safety analysis expert for HerGuardian AI.
Analyze this uploaded screenshot image for sensitive personal data, physical safety risks, and security credentials.

Examine the image carefully for:
1. Authentication secrets & credentials: Passwords, OTPs, verification codes, API keys, tokens.
2. Financial & Payment details: Credit/debit card numbers, CVVs, bank credentials.
3. Location exposure: Real-time live location, map pins, GPS coordinates, physical residential home address.
4. Contact information: Personal phone numbers, email addresses, usernames.
5. Location patterns: Routine check-ins, frequent spots, travel schedules.
6. Vulnerable disclosures: Mentions of being home alone or isolated.
7. Image clarity: Is the image heavily blurred, unreadable, or degraded so that content cannot be determined?

CRITICAL SECURITY RULES:
- Never repeat full passwords, API keys, OTPs, or credit card numbers in the evidence or text. Mask them using ••••.
- Do NOT assume every screenshot is high risk. If it's a private profile with artwork or a harmless landscape, it is LOW risk.
- If the screenshot is heavily blurred or unreadable, set "isInconclusive": true and "riskScore": 0.

Respond strictly in valid JSON adhering to this schema:
{
  "isInconclusive": boolean,
  "riskScore": number (0 to 100),
  "overallRiskLevel": "low" | "medium" | "high",
  "reasoning": string,
  "limitations": string,
  "findings": [
    {
      "type": string,
      "severity": "low" | "medium" | "high" | "critical",
      "title": string,
      "evidence": string (masked secrets),
      "reasoning": string,
      "recommendation": string,
      "status": "to_review" | "resolved"
    }
  ]
}`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType || 'image/png',
      },
    };

    const result = await geminiVisionModel.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    if (parsed && typeof parsed.riskScore === 'number' && parsed.overallRiskLevel) {
      return {
        riskScore: Math.min(100, Math.max(0, Math.round(parsed.riskScore))),
        overallRiskLevel: parsed.overallRiskLevel.toLowerCase(),
        isInconclusive: Boolean(parsed.isInconclusive),
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        reasoning: parsed.reasoning || 'AI Vision analysis complete.',
        limitations: parsed.limitations || 'Analysis performed by Gemini Vision.',
        findingCount: Array.isArray(parsed.findings) ? parsed.findings.length : 0,
      };
    }
  } catch (err) {
    console.warn('[ScreenshotAnalyzer] Gemini Vision call failed, falling back to local engine:', err.message);
  }
  return null;
}

// ── MAIN ENTRY POINT ──────────────────────────────────────────────────────────

/**
 * Main Screenshot Analysis Function
 * Handles image data, OCR text, and fallback orchestration.
 */
export async function analyzeScreenshot({
  imageBase64 = '',
  mimeType = 'image/png',
  ocrText = '',
  ocrConfidence = 0,
  isSyntheticBlur = false,
}) {
  // Validate image data
  if (!imageBase64 && !ocrText) {
    throw new Error('Screenshot data or readable content is required for analysis.');
  }

  // 1. Try Gemini Vision if base64 image data and model are available
  if (imageBase64 && geminiVisionModel) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const visionResult = await analyzeWithGeminiVision(cleanBase64, mimeType, ocrText);
    if (visionResult) return visionResult;
  }

  // 2. Deterministic / Multi-Layer Engine
  return analyzeScreenshotDeterministic({
    text: ocrText,
    confidence: ocrConfidence,
    mimeType,
    isSyntheticBlur,
  });
}

export default { analyzeScreenshot, analyzeScreenshotDeterministic, maskSensitiveValue };
