/**
 * Test Script: Verify risk scoring works with seed data
 * Calculates risk scores for sample Pune routes at different times
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IncidentReport from '../src/models/IncidentReport.js';
import { calculateRouteRisk, getRiskLevel, getTimeOfDayFromHour } from '../src/services/riskScoring.js';

dotenv.config();

// Sample route coordinates (simplified — real routes would have many more points)
const TEST_ROUTES = {
  // High-risk: Hadapsar to Kondhwa (passes through high-incident areas)
  hadapsarToKondhwa: [
    { lat: 18.5089, lng: 73.9260 }, // Hadapsar
    { lat: 18.4950, lng: 73.9180 },
    { lat: 18.4850, lng: 73.9100 },
    { lat: 18.4685, lng: 73.8914 }, // Kondhwa
  ],

  // Medium-risk: Koregaon Park to Viman Nagar
  koregaonToViman: [
    { lat: 18.5362, lng: 73.8977 }, // Koregaon Park
    { lat: 18.5450, lng: 73.9050 },
    { lat: 18.5550, lng: 73.9100 },
    { lat: 18.5679, lng: 73.9143 }, // Viman Nagar
  ],

  // Low-risk: Baner to Aundh (low-incident zone)
  banerToAundh: [
    { lat: 18.5590, lng: 73.7815 }, // Baner
    { lat: 18.5590, lng: 73.7900 },
    { lat: 18.5590, lng: 73.8000 },
    { lat: 18.5590, lng: 73.8074 }, // Aundh
  ],
};

async function testRiskScores() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    // Fetch all incidents
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const incidents = await IncidentReport.find({ createdAt: { $gte: ninetyDaysAgo } });
    console.log(`Found ${incidents.length} incident reports in database\n`);

    if (incidents.length === 0) {
      console.log('⚠️  No incidents found — run seedIncidents.js first!\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Test times: day vs night
    const testTimes = [
      { hour: 10, label: '10:00 AM (Morning)' },
      { hour: 22, label: '10:00 PM (Night)' },
    ];

    console.log('═══════════════════════════════════════════════════════════');
    console.log('RISK SCORE COMPARISON');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const [routeName, coords] of Object.entries(TEST_ROUTES)) {
      console.log(`Route: ${routeName.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
      console.log('─'.repeat(60));

      for (const time of testTimes) {
        const timeOfDay = getTimeOfDayFromHour(time.hour);
        const result = calculateRouteRisk(coords, incidents, timeOfDay);
        const level = getRiskLevel(result.totalScore);

        console.log(`\n  ${time.label} (${timeOfDay}):`);
        console.log(`    Total Risk Score:  ${result.totalScore.toFixed(1)} / 100`);
        console.log(`    Risk Level:        ${level.toUpperCase()}`);
        console.log(`    Breakdown:`);
        console.log(`      - Incident Proximity:  ${result.breakdown.incidentProximity.toFixed(1)} (40% weight)`);
        console.log(`      - Time-of-Day:         ${result.breakdown.timeOfDay.toFixed(1)} (25% weight)`);
        console.log(`      - Road Type:           ${result.breakdown.roadType.toFixed(1)} (20% weight)`);
        console.log(`      - Area Density:        ${result.breakdown.areaDensity.toFixed(1)} (15% weight)`);
      }

      console.log('\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('KEY OBSERVATIONS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. Routes through high-incident zones (Hadapsar/Kondhwa) score');
    console.log('   significantly higher than low-incident zones (Baner/Aundh).');
    console.log('2. Same route at night (10 PM) scores higher than morning (10 AM)');
    console.log('   due to time-of-day multiplier (1.8x for night vs 1.0x for day).');
    console.log('3. Even with zero nearby incidents, routes still get a base risk');
    console.log('   score from time-of-day, road type, and area density factors.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testRiskScores();
