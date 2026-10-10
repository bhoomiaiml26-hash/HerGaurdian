import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeFootprint } from '../src/services/footprintAnalyzer.js';

describe('Footprint Scanner — Context-Aware Risk Analysis Test Suite', () => {
  // ── 1. THREE CONTRASTING REGRESSION CASES ───────────────────────────────────

  it('Case A: Private profile with hidden contacts and benign hobbies should be LOW RISK', () => {
    const inputCaseA = `
Profile is private.
Email and phone number are hidden.
No location is shared.
Posts contain only general artwork and hobbies.
No sensitive personal information is exposed.
    `.trim();

    const result = analyzeFootprint(inputCaseA);

    assert.strictEqual(result.overallRiskLevel, 'low', `Case A expected 'low' but got '${result.overallRiskLevel}'`);
    assert.ok(result.riskScore < 30, `Case A riskScore should be < 30, got ${result.riskScore}`);
    assert.ok(result.findings.some(f => f.type === 'profile_visibility_private'), 'Should detect private profile');
    assert.ok(result.findings.some(f => f.type === 'email_hidden'), 'Should detect hidden email');
    assert.ok(result.findings.some(f => f.type === 'phone_hidden'), 'Should detect hidden phone');
    assert.ok(result.findings.some(f => f.type === 'benign_hobby_content'), 'Should detect benign artwork/hobby content');
    assert.ok(result.limitations.length > 0, 'Should return explicit limitations statement');
  });

  it('Case B: Public profile with visible email and routine city check-ins should be MEDIUM RISK', () => {
    const inputCaseB = `
Profile is public.
Email address is visible.
Phone number is hidden.
City and recurring check-in locations are shared.
Public posts reveal routine places and activities, but no home address or live location.
    `.trim();

    const result = analyzeFootprint(inputCaseB);

    assert.strictEqual(result.overallRiskLevel, 'medium', `Case B expected 'medium' but got '${result.overallRiskLevel}'`);
    assert.ok(result.riskScore >= 30 && result.riskScore < 70, `Case B riskScore should be between 30 and 69, got ${result.riskScore}`);
    assert.ok(result.findings.some(f => f.type === 'profile_visibility_public'), 'Should detect public profile');
    assert.ok(result.findings.some(f => f.type === 'email_exposed'), 'Should detect exposed email');
    assert.ok(result.findings.some(f => f.type === 'phone_hidden'), 'Should recognize hidden phone');
    assert.ok(result.findings.some(f => f.type === 'routine_location_exposed'), 'Should detect routine check-in exposure');
  });

  it('Case C: Public profile with home address, live location, and home alone status should be HIGH RISK', () => {
    const inputCaseC = `
Profile is public.
Email and phone number are visible.
Home address and live location are publicly shared.
Posts reveal when the person is home alone and disclose real-time whereabouts.
    `.trim();

    const result = analyzeFootprint(inputCaseC);

    assert.strictEqual(result.overallRiskLevel, 'high', `Case C expected 'high' but got '${result.overallRiskLevel}'`);
    assert.ok(result.riskScore >= 70, `Case C riskScore should be >= 70, got ${result.riskScore}`);
    assert.ok(result.findings.some(f => f.type === 'home_address_exposed'), 'Should detect exposed home address');
    assert.ok(result.findings.some(f => f.type === 'live_location_exposed'), 'Should detect live location broadcast');
    assert.ok(result.findings.some(f => f.type === 'home_alone_disclosure'), 'Should detect home alone disclosure');
  });

  // ── 2. DIFFERENTIATION & CONTEXT SENSITIVITY ────────────────────────────────

  it('All three cases must produce distinct, graduated risk levels (Low < Medium < High)', () => {
    const caseA = analyzeFootprint(`Profile is private. Email and phone number are hidden. No location is shared. Posts contain only general artwork and hobbies.`);
    const caseB = analyzeFootprint(`Profile is public. Email address is visible. Phone number is hidden. City and recurring check-in locations are shared. Public posts reveal routine places and activities.`);
    const caseC = analyzeFootprint(`Profile is public. Email and phone number are visible. Home address and live location are publicly shared. Posts reveal when the person is home alone and disclose real-time whereabouts.`);

    assert.ok(caseA.riskScore < caseB.riskScore, `Case A (${caseA.riskScore}) must be lower than Case B (${caseB.riskScore})`);
    assert.ok(caseB.riskScore < caseC.riskScore, `Case B (${caseB.riskScore}) must be lower than Case C (${caseC.riskScore})`);
    assert.strictEqual(caseA.overallRiskLevel, 'low');
    assert.strictEqual(caseB.overallRiskLevel, 'medium');
    assert.strictEqual(caseC.overallRiskLevel, 'high');
  });

  it('A public profile with only artwork or hobbies must remain LOW RISK', () => {
    const publicArtProfile = `
Public profile. Digital artist and illustrator.
Sharing landscape paintings, character sketches, and art tutorials.
No personal contact information or location is disclosed.
    `.trim();

    const result = analyzeFootprint(publicArtProfile);

    assert.strictEqual(result.overallRiskLevel, 'low', `Public art profile should be low risk, got ${result.overallRiskLevel}`);
    assert.ok(result.riskScore < 30, `Score should be < 30, got ${result.riskScore}`);
  });

  it('Home address and live location exposures must receive high/critical severity weighting', () => {
    const addressOnly = analyzeFootprint(`Public profile. Home address is publicly shared.`);
    const liveLocOnly = analyzeFootprint(`Public profile. Live location is publicly shared.`);

    const addressFinding = addressOnly.findings.find(f => f.type === 'home_address_exposed');
    assert.ok(addressFinding, 'Should have home address finding');
    assert.ok(['high', 'critical'].includes(addressFinding.severity), 'Address finding must be high or critical');

    const liveLocFinding = liveLocOnly.findings.find(f => f.type === 'live_location_exposed');
    assert.ok(liveLocFinding, 'Should have live location finding');
    assert.ok(['high', 'critical'].includes(liveLocFinding.severity), 'Live location finding must be high or critical');
  });

  // ── 3. INPUT VALIDATION & ERROR HANDLING ───────────────────────────────────

  it('Missing or empty input should throw descriptive error instead of fake success', () => {
    assert.throws(() => analyzeFootprint(''), /cannot be empty/);
    assert.throws(() => analyzeFootprint('   '), /cannot be empty/);
    assert.throws(() => analyzeFootprint(null), /required/);
    assert.throws(() => analyzeFootprint(undefined), /required/);
  });

  it('Input exceeding length limit should throw descriptive error', () => {
    const tooLong = 'a'.repeat(10001);
    assert.throws(() => analyzeFootprint(tooLong), /maximum allowed length/);
  });

  // ── 4. SCORE & RISK LABEL CONSISTENCY ──────────────────────────────────────

  it('Returned risk label must always strictly match documented score thresholds', () => {
    const testCases = [
      'Profile is private. No info shared.',
      'Public profile with public email info@example.com and city check-ins every morning.',
      'Public profile with home address 14 MG Road and real-time live location broadcast while home alone.',
    ];

    for (const text of testCases) {
      const res = analyzeFootprint(text);
      if (res.riskScore >= 70) {
        assert.strictEqual(res.overallRiskLevel, 'high', `Score ${res.riskScore} must map to 'high'`);
      } else if (res.riskScore >= 30) {
        assert.strictEqual(res.overallRiskLevel, 'medium', `Score ${res.riskScore} must map to 'medium'`);
      } else {
        assert.strictEqual(res.overallRiskLevel, 'low', `Score ${res.riskScore} must map to 'low'`);
      }
    }
  });
});
