/**
 * Seed Script: Populate realistic incident reports for demo/testing
 * 
 * This script creates ~55 anonymized incident reports clustered across Pune:
 * - HIGH RISK ZONES: Hadapsar, Kondhwa (more incidents, higher severity)
 * - MEDIUM RISK ZONES: Koregaon Park, Viman Nagar (moderate incidents)
 * - LOW RISK ZONES: Baner, Aundh, Hinjewadi (fewer incidents, lower severity)
 * 
 * Usage:
 *   node backend/scripts/seedIncidents.js
 * 
 * NOTE: This clears existing IncidentReport data before seeding.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IncidentReport from '../src/models/IncidentReport.js';

dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════
// PUNE AREA DEFINITIONS (lat/lng bounding boxes)
// ═══════════════════════════════════════════════════════════════════════════

const PUNE_AREAS = {
  // HIGH RISK ZONES
  hadapsar: {
    center: { lat: 18.5089, lng: 73.9260 },
    radius: 0.02, // ~2km spread
    riskLevel: 'high',
    incidentCount: 18,
  },
  kondhwa: {
    center: { lat: 18.4685, lng: 73.8914 },
    radius: 0.015,
    riskLevel: 'high',
    incidentCount: 15,
  },

  // MEDIUM RISK ZONES
  koregaonPark: {
    center: { lat: 18.5362, lng: 73.8977 },
    radius: 0.012,
    riskLevel: 'medium',
    incidentCount: 10,
  },
  vimanNagar: {
    center: { lat: 18.5679, lng: 73.9143 },
    radius: 0.01,
    riskLevel: 'medium',
    incidentCount: 8,
  },

  // LOW RISK ZONES
  baner: {
    center: { lat: 18.5590, lng: 73.7815 },
    radius: 0.015,
    riskLevel: 'low',
    incidentCount: 5,
  },
  aundh: {
    center: { lat: 18.5590, lng: 73.8074 },
    radius: 0.01,
    riskLevel: 'low',
    incidentCount: 4,
  },
  hinjewadi: {
    center: { lat: 18.5912, lng: 73.7397 },
    radius: 0.012,
    riskLevel: 'low',
    incidentCount: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT CATEGORY DISTRIBUTIONS
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIES = ['harassment', 'poor_lighting', 'isolated_area', 'stalking', 'verbal_abuse', 'other'];

// Risk-weighted category distributions
const CATEGORY_WEIGHTS = {
  high: {
    harassment: 0.30,
    stalking: 0.25,
    verbal_abuse: 0.20,
    poor_lighting: 0.15,
    isolated_area: 0.05,
    other: 0.05,
  },
  medium: {
    harassment: 0.20,
    poor_lighting: 0.30,
    verbal_abuse: 0.15,
    isolated_area: 0.20,
    stalking: 0.10,
    other: 0.05,
  },
  low: {
    poor_lighting: 0.50,
    isolated_area: 0.30,
    harassment: 0.10,
    verbal_abuse: 0.05,
    stalking: 0.03,
    other: 0.02,
  },
};

// Severity distributions per risk level
const SEVERITY_WEIGHTS = {
  high: [0.20, 0.40, 0.40],   // [low, medium, high] → more severe incidents
  medium: [0.35, 0.45, 0.20], // balanced
  low: [0.60, 0.30, 0.10],    // mostly low severity
};

// Time-of-day distributions (higher risk → more night/evening incidents)
const TIME_WEIGHTS = {
  high: { morning: 0.10, afternoon: 0.15, evening: 0.35, night: 0.40 },
  medium: { morning: 0.15, afternoon: 0.25, evening: 0.40, night: 0.20 },
  low: { morning: 0.25, afternoon: 0.35, evening: 0.30, night: 0.10 },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate random lat/lng within a circular area
 */
function randomPointInCircle(center, radiusDegrees) {
  const angle = Math.random() * 2 * Math.PI;
  const dist = Math.sqrt(Math.random()) * radiusDegrees; // sqrt for uniform distribution
  return {
    lat: center.lat + dist * Math.cos(angle),
    lng: center.lng + dist * Math.sin(angle),
  };
}

/**
 * Weighted random choice from an object {key: weight, ...}
 */
function weightedChoice(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of Object.entries(weights)) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return Object.keys(weights)[0]; // fallback
}

/**
 * Weighted random choice from an array with parallel weights
 */
function weightedArrayChoice(items, weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return items[i];
  }
  return items[0];
}

/**
 * Random date within the last N days
 */
function randomDateInPast(maxDaysAgo) {
  const now = Date.now();
  const offset = Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateIncidentsForArea(areaConfig) {
  const incidents = [];
  const { center, radius, riskLevel, incidentCount } = areaConfig;

  for (let i = 0; i < incidentCount; i++) {
    const location = randomPointInCircle(center, radius);
    const category = weightedChoice(CATEGORY_WEIGHTS[riskLevel]);
    const severity = weightedArrayChoice([1, 2, 3], SEVERITY_WEIGHTS[riskLevel]);
    const timeOfDay = weightedChoice(TIME_WEIGHTS[riskLevel]);
    const createdAt = randomDateInPast(85); // last ~85 days (within 90-day window)

    incidents.push({
      location,
      category,
      severity,
      timeOfDay,
      createdAt,
    });
  }

  return incidents;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function seedIncidents() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Clear existing incidents
    console.log('Clearing existing incident reports...');
    const deleteResult = await IncidentReport.deleteMany({});
    console.log(`✓ Deleted ${deleteResult.deletedCount} existing incidents\n`);

    // Generate incidents for each area
    const allIncidents = [];
    for (const [areaName, config] of Object.entries(PUNE_AREAS)) {
      console.log(`Generating ${config.incidentCount} incidents for ${areaName} (${config.riskLevel} risk)...`);
      const incidents = generateIncidentsForArea(config);
      allIncidents.push(...incidents);
    }

    // Insert into database
    console.log(`\nInserting ${allIncidents.length} total incidents...`);
    const insertResult = await IncidentReport.insertMany(allIncidents);
    console.log(`✓ Successfully inserted ${insertResult.length} incident reports\n`);

    // Summary stats
    const stats = {
      total: insertResult.length,
      byCategory: {},
      bySeverity: { 1: 0, 2: 0, 3: 0 },
      byTimeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    };

    for (const inc of insertResult) {
      stats.byCategory[inc.category] = (stats.byCategory[inc.category] || 0) + 1;
      stats.bySeverity[inc.severity]++;
      stats.byTimeOfDay[inc.timeOfDay]++;
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('SEED SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total incidents: ${stats.total}`);
    console.log('\nBy category:');
    for (const [cat, count] of Object.entries(stats.byCategory)) {
      console.log(`  ${cat.padEnd(20)} ${count}`);
    }
    console.log('\nBy severity:');
    console.log(`  Low (1):    ${stats.bySeverity[1]}`);
    console.log(`  Medium (2): ${stats.bySeverity[2]}`);
    console.log(`  High (3):   ${stats.bySeverity[3]}`);
    console.log('\nBy time of day:');
    for (const [time, count] of Object.entries(stats.byTimeOfDay)) {
      console.log(`  ${time.padEnd(12)} ${count}`);
    }
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✓ Seed complete! You can now test Safe Route with realistic risk scores.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
seedIncidents();
