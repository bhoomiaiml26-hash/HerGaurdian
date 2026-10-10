/**
 * screenshotAnalyzer.test.js
 * Regression tests for the Screenshot Analyzer deterministic engine.
 * Tests A–F per specification.
 *
 * Run with: node --test tests/screenshotAnalyzer.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeScreenshotDeterministic, maskSensitiveValue } from '../src/services/screenshotAnalyzer.js';

// ── Helper ────────────────────────────────────────────────────────────────────
function run(text, opts = {}) {
  return analyzeScreenshotDeterministic({ text, confidence: opts.confidence ?? 90, ...opts });
}

// ─────────────────────────────────────────────────────────────────────────────
// Test A: Private profile with artwork — expected LOW RISK
// ─────────────────────────────────────────────────────────────────────────────
describe('Test A: Low Risk — private profile with artwork', () => {
  it('should return low risk for a private account with no sensitive data', () => {
    const text =
      'Profile is private.\nEmail and phone number are hidden.\nNo location is shared.\n' +
      'Posts contain only general artwork and hobbies.\nNo sensitive personal information is exposed.';
    const result = run(text);

    assert.equal(result.overallRiskLevel, 'low', `Expected low, got ${result.overallRiskLevel}`);
    assert.ok(result.riskScore <= 20, `Expected riskScore <= 20, got ${result.riskScore}`);
    assert.equal(result.isInconclusive, false, 'Should NOT be inconclusive');
    const types = result.findings.map(f => f.type);
    assert.ok(
      !types.includes('email_exposed') && !types.includes('phone_exposed') && !types.includes('live_location_exposed'),
      'Should have no exposure findings'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test B: Public profile with email + routine check-ins — expected MEDIUM RISK
// ─────────────────────────────────────────────────────────────────────────────
describe('Test B: Medium Risk — public profile with email and check-ins', () => {
  it('should return medium risk when email is visible and recurring check-ins are shared', () => {
    const text =
      'Profile is public.\nEmail address is visible.\nPhone number is hidden.\n' +
      'City and recurring check-in locations are shared.\n' +
      'Public posts reveal routine places and activities, but no home address or live location.';
    const result = run(text);

    assert.equal(result.overallRiskLevel, 'medium', `Expected medium, got ${result.overallRiskLevel}`);
    assert.ok(result.riskScore >= 25 && result.riskScore < 70, `Expected riskScore 25-69, got ${result.riskScore}`);
    assert.equal(result.isInconclusive, false, 'Should NOT be inconclusive');
    const types = result.findings.map(f => f.type);
    assert.ok(types.includes('email_exposed'), 'Should detect email exposure');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test C: Public profile with home address + live location + phone + home-alone — expected HIGH RISK
// ─────────────────────────────────────────────────────────────────────────────
describe('Test C: High Risk — home address, live location, phone, home-alone disclosure', () => {
  it('should return high risk for combined home address and live location exposure', () => {
    const text =
      'Profile is public.\nEmail and phone number are visible.\n' +
      'Home address and live location are publicly shared.\n' +
      'Posts reveal when the person is home alone and disclose real-time whereabouts.';
    const result = run(text);

    assert.ok(
      result.overallRiskLevel === 'high' || result.overallRiskLevel === 'critical',
      `Expected high/critical, got ${result.overallRiskLevel}`
    );
    assert.ok(result.riskScore >= 60, `Expected riskScore >= 60, got ${result.riskScore}`);
    assert.equal(result.isInconclusive, false, 'Should NOT be inconclusive');
    const types = result.findings.map(f => f.type);
    assert.ok(types.includes('home_address_exposed'), 'Should detect home address');
    assert.ok(types.includes('live_location_exposed'), 'Should detect live location');
    assert.ok(types.includes('phone_exposed'), 'Should detect phone exposure');
    assert.ok(types.includes('home_alone_disclosure'), 'Should detect home-alone disclosure');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test D: Critical sensitive information — API key, password, credit card
// ─────────────────────────────────────────────────────────────────────────────
describe('Test D: Critical Risk — authentication secrets, password, and card number', () => {
  it('should return critical/high risk (score >= 85) and mask the credential in evidence', () => {
    const text =
      'API Key: api_key=FAKE_TEST_TOKEN_abc123xyz789_NOT_REAL\n' +
      'Password: TempPass1!\n' +
      'Card Number: 4532 1234 5678 4490\n' +
      'CVV: 123';
    const result = run(text);

    assert.ok(
      result.overallRiskLevel === 'critical' || result.overallRiskLevel === 'high',
      `Expected critical or high, got ${result.overallRiskLevel}`
    );
    assert.ok(result.riskScore >= 85, `Expected score >= 85, got ${result.riskScore}`);
    assert.equal(result.isInconclusive, false, 'Should NOT be inconclusive');

    // Evidence must NOT expose raw secrets
    const evidenceBlob = result.findings.map(f => f.evidence || '').join(' ');
    assert.ok(
      !evidenceBlob.includes('FAKE_TEST_TOKEN_abc123xyz789_NOT_REAL'),
      'Raw token must be masked in evidence'
    );
    assert.ok(
      !evidenceBlob.includes('TempPass1!'),
      'Raw password must be masked in evidence'
    );
    // Card should be partially masked
    const hasMaskedCard = result.findings.some(
      f => f.evidence && f.evidence.includes('\u2022\u2022\u2022\u2022')
    );
    assert.ok(hasMaskedCard, 'Card number should appear masked (with dots) in evidence');
  });

  it('should detect at least one critical-severity finding', () => {
    const text =
      'Access Token: Bearer sk_live_abcde12345fghij67890\n' +
      'Verification Code: 483920';
    const result = run(text);
    const criticals = result.findings.filter(f => f.severity === 'critical');
    assert.ok(criticals.length >= 1, `Expected >= 1 critical finding, got ${criticals.length}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test E: Harmless landscape / scenic photo with non-sensitive text
// ─────────────────────────────────────────────────────────────────────────────
describe('Test E: Low Risk — harmless landscape photo', () => {
  it('should return low risk for scenic photography content', () => {
    const text =
      'Beautiful sunset photo at the beach.\n' +
      'Mountain view captured during morning hike.\n' +
      'Nature photography and landscape photo.\n' +
      'Ordinary scenery, no people visible.\n' +
      'No personal information shared.';
    const result = run(text);

    assert.equal(result.overallRiskLevel, 'low', `Expected low, got ${result.overallRiskLevel}`);
    assert.ok(result.riskScore <= 20, `Expected riskScore <= 20, got ${result.riskScore}`);
    assert.equal(result.isInconclusive, false, 'Should NOT be inconclusive');
    const sensitiveTypes = ['email_exposed', 'phone_exposed', 'home_address_exposed', 'live_location_exposed'];
    const foundSensitive = result.findings.some(f => sensitiveTypes.includes(f.type));
    assert.ok(!foundSensitive, 'Should have no sensitive findings for a harmless landscape');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test F: Blurred / unreadable screenshot — expected INCONCLUSIVE
// ─────────────────────────────────────────────────────────────────────────────
describe('Test F: Inconclusive — blurred or unreadable screenshot', () => {
  it('should be inconclusive when isSyntheticBlur=true', () => {
    const result = analyzeScreenshotDeterministic({
      text: '',
      confidence: 0,
      isSyntheticBlur: true,
    });

    assert.equal(result.isInconclusive, true, 'Should be inconclusive');
    assert.equal(result.overallRiskLevel, 'inconclusive', `Expected inconclusive, got ${result.overallRiskLevel}`);
    assert.equal(result.riskScore, 0, `Expected riskScore 0, got ${result.riskScore}`);
    assert.ok(
      result.uncertaintyNote && result.uncertaintyNote.length > 10,
      'Should have a non-empty uncertaintyNote'
    );
  });

  it('should be inconclusive when OCR confidence < 35 and very sparse text', () => {
    const result = analyzeScreenshotDeterministic({
      text: 'blr dn',
      confidence: 18,
    });

    assert.equal(result.isInconclusive, true, 'Should be inconclusive due to low confidence + sparse text');
    assert.equal(result.overallRiskLevel, 'inconclusive');
    assert.equal(result.riskScore, 0);
  });

  it('should be inconclusive when blur indicator text is present', () => {
    const result = analyzeScreenshotDeterministic({
      text: 'heavily blurred screenshot -- unreadable text',
      confidence: 45,
    });

    assert.equal(result.isInconclusive, true, 'Should be inconclusive when blur keywords present');
    assert.equal(result.overallRiskLevel, 'inconclusive');
  });

  it('should NOT have fabricated findings — only limited-visibility informational entry', () => {
    const result = analyzeScreenshotDeterministic({
      text: '',
      confidence: 0,
      isSyntheticBlur: true,
    });

    const sensitiveTypes = [
      'email_exposed', 'phone_exposed', 'home_address_exposed',
      'live_location_exposed', 'auth_secret_exposed', 'password_exposed',
    ];
    const hasFabricated = result.findings.some(f => sensitiveTypes.includes(f.type));
    assert.ok(!hasFabricated, 'Should NOT have fabricated sensitive findings for blurred screenshot');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// maskSensitiveValue unit tests
// ─────────────────────────────────────────────────────────────────────────────
describe('maskSensitiveValue', () => {
  it('should mask 16-digit card with first/last 4 visible', () => {
    const masked = maskSensitiveValue('4532123456784490');
    assert.ok(masked.includes('4532'), 'Should preserve first 4 digits');
    assert.ok(masked.includes('4490'), 'Should preserve last 4 digits');
    assert.ok(masked.includes('\u2022\u2022\u2022\u2022'), 'Should mask middle digits');
  });

  it('should mask short secrets (<=8 chars) as ......', () => {
    assert.equal(maskSensitiveValue('pass123'), '\u2022\u2022\u2022\u2022\u2022\u2022');
    assert.equal(maskSensitiveValue('1234'), '\u2022\u2022\u2022\u2022\u2022\u2022');
  });

  it('should partially mask long tokens', () => {
    const token = 'sk_live_abcdefghijklmnop1234';
    const masked = maskSensitiveValue(token);
    assert.ok(masked.includes('sk_'), 'Should keep first 3 chars');
    assert.ok(masked.includes('234'), 'Should keep last 3 chars');
    assert.ok(!masked.includes('abcdefgh'), 'Should not expose middle of token');
  });

  it('should handle null/undefined gracefully', () => {
    assert.equal(maskSensitiveValue(null), '\u2022\u2022\u2022\u2022\u2022\u2022');
    assert.equal(maskSensitiveValue(undefined), '\u2022\u2022\u2022\u2022\u2022\u2022');
    assert.equal(maskSensitiveValue(''), '\u2022\u2022\u2022\u2022\u2022\u2022');
  });
});
