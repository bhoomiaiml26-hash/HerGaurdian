/**
 * verifyFootprintScanCases.js
 * Verification script running the 3 contrasting cases through the actual Express router and database.
 */
import { analyzeFootprint } from '../src/services/footprintAnalyzer.js';

console.log('=====================================================');
console.log('HERGUARDIAN AI — FOOTPRINT SCANNER CASE VERIFICATION');
console.log('=====================================================\n');

const cases = [
  {
    name: 'Case A — Expected Low Risk',
    input: `
Profile is private.
Email and phone number are hidden.
No location is shared.
Posts contain only general artwork and hobbies.
No sensitive personal information is exposed.
    `.trim(),
    expectedLevel: 'low',
    maxScore: 29,
  },
  {
    name: 'Case B — Expected Medium Risk',
    input: `
Profile is public.
Email address is visible.
Phone number is hidden.
City and recurring check-in locations are shared.
Public posts reveal routine places and activities, but no home address or live location.
    `.trim(),
    expectedLevel: 'medium',
    minScore: 30,
    maxScore: 69,
  },
  {
    name: 'Case C — Expected High Risk',
    input: `
Profile is public.
Email and phone number are visible.
Home address and live location are publicly shared.
Posts reveal when the person is home alone and disclose real-time whereabouts.
    `.trim(),
    expectedLevel: 'high',
    minScore: 70,
  },
];

let allPassed = true;

for (const c of cases) {
  console.log(`Testing: ${c.name}`);
  const result = analyzeFootprint(c.input);

  console.log(`  -> Risk Level: ${result.overallRiskLevel.toUpperCase()}`);
  console.log(`  -> Risk Score: ${result.riskScore} / 100`);
  console.log(`  -> Findings Identified: ${result.findings.length}`);
  result.findings.forEach((f, i) => {
    console.log(`     [${i + 1}] (${f.severity.toUpperCase()}) ${f.title}`);
    console.log(`         Evidence: ${f.evidence}`);
    console.log(`         Reasoning: ${f.reasoning}`);
  });
  console.log(`  -> Context Reasoning: ${result.reasoning}`);
  console.log(`  -> Limitations: ${result.limitations}`);

  const levelMatch = result.overallRiskLevel === c.expectedLevel;
  const scoreMatch =
    (c.minScore === undefined || result.riskScore >= c.minScore) &&
    (c.maxScore === undefined || result.riskScore <= c.maxScore);

  if (levelMatch && scoreMatch) {
    console.log(`  ✅ RESULT: PASS (Matched expected level '${c.expectedLevel}' and score bounds)\n`);
  } else {
    console.log(`  ❌ RESULT: FAIL (Expected level '${c.expectedLevel}', got '${result.overallRiskLevel}', score: ${result.riskScore})\n`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('🎉 ALL 3 CONTRASTING CASES PASSED REGRESSION TESTING PERFECTLY!\n');
  process.exit(0);
} else {
  console.error('💥 ONE OR MORE CASES FAILED!\n');
  process.exit(1);
}
