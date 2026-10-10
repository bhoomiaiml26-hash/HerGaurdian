/**
 * HerGuardian AI - Prototype Safety Incident Seed Script
 * 
 * Geographically distributed prototype dataset providing realistic risk zones across
 * global test locations.
 * 
 * IMPORTANT: This is prototype/historical demonstration data for student/academic
 * demonstration.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IncidentReport from '../src/models/IncidentReport.js';

dotenv.config();

const riskZones = [
  // ─── PUNE & PUNE-MUMBAI CORRIDOR ──────────────────────────────────────────
  { center: { lat: 18.5204, lng: 73.8567 }, radius: 0.025, incidentCount: 22, nightWeight: 0.6, name: 'Pune Central / Station' },
  { center: { lat: 18.5080, lng: 73.8540 }, radius: 0.020, incidentCount: 16, nightWeight: 0.5, name: 'Swargate / Market' },
  { center: { lat: 18.5910, lng: 73.7380 }, radius: 0.030, incidentCount: 18, nightWeight: 0.7, name: 'Hinjawadi IT Corridor' },
  { center: { lat: 18.7500, lng: 73.4100 }, radius: 0.035, incidentCount: 20, nightWeight: 0.7, name: 'Khopoli / Bhor Ghat (Old Highway)' },
  { center: { lat: 18.7550, lng: 73.4080 }, radius: 0.025, incidentCount: 14, nightWeight: 0.6, name: 'Lonavala Market Area' },
  { center: { lat: 19.0178, lng: 73.1000 }, radius: 0.030, incidentCount: 18, nightWeight: 0.5, name: 'Panvel / Kalamboli Junction' },
  { center: { lat: 19.0600, lng: 72.9980 }, radius: 0.025, incidentCount: 12, nightWeight: 0.4, name: 'Vashi / Navi Mumbai' },

  // ─── MUMBAI ───────────────────────────────────────────────────────────────
  { center: { lat: 18.9220, lng: 72.8347 }, radius: 0.025, incidentCount: 15, nightWeight: 0.4, name: 'South Mumbai / Colaba' },
  { center: { lat: 19.0178, lng: 72.8478 }, radius: 0.025, incidentCount: 20, nightWeight: 0.5, name: 'Dadar / Central Mumbai' },
  { center: { lat: 19.0600, lng: 72.8800 }, radius: 0.030, incidentCount: 26, nightWeight: 0.7, name: 'Kurla / BKC Peripheral' },
  { center: { lat: 19.0596, lng: 72.8295 }, radius: 0.025, incidentCount: 16, nightWeight: 0.5, name: 'Bandra West' },
  { center: { lat: 19.1136, lng: 72.8697 }, radius: 0.030, incidentCount: 20, nightWeight: 0.6, name: 'Andheri East / MIDC' },

  // ─── DELHI & DELHI-NOIDA CORRIDOR ─────────────────────────────────────────
  { center: { lat: 28.6315, lng: 77.2167 }, radius: 0.025, incidentCount: 22, nightWeight: 0.5, name: 'Connaught Place' },
  { center: { lat: 28.6506, lng: 77.2303 }, radius: 0.025, incidentCount: 24, nightWeight: 0.7, name: 'Old Delhi / Chandni Chowk' },
  { center: { lat: 28.5355, lng: 77.2500 }, radius: 0.030, incidentCount: 18, nightWeight: 0.6, name: 'South Delhi / Kalkaji' },
  { center: { lat: 28.6000, lng: 77.2950 }, radius: 0.025, incidentCount: 20, nightWeight: 0.6, name: 'Mayur Vihar / Border' },
  { center: { lat: 28.5706, lng: 77.3272 }, radius: 0.030, incidentCount: 18, nightWeight: 0.5, name: 'Noida Sector 18 Commercial' },
  { center: { lat: 28.6250, lng: 77.3750 }, radius: 0.030, incidentCount: 20, nightWeight: 0.7, name: 'Noida Sector 62 / Industrial' },

  // ─── LONDON & LONDON-MANCHESTER CORRIDOR ──────────────────────────────────
  { center: { lat: 51.5136, lng: -0.1365 }, radius: 0.020, incidentCount: 18, nightWeight: 0.6, name: 'London Soho / West End' },
  { center: { lat: 51.5390, lng: -0.1426 }, radius: 0.025, incidentCount: 20, nightWeight: 0.6, name: 'Camden Town' },
  { center: { lat: 51.5240, lng: -0.0760 }, radius: 0.025, incidentCount: 18, nightWeight: 0.6, name: 'Shoreditch / East London' },
  { center: { lat: 51.5014, lng: -0.1419 }, radius: 0.020, incidentCount: 10, nightWeight: 0.3, name: 'Westminster' },
  { center: { lat: 53.4808, lng: -2.2426 }, radius: 0.025, incidentCount: 20, nightWeight: 0.6, name: 'Manchester City Centre' },
  { center: { lat: 53.4840, lng: -2.2350 }, radius: 0.020, incidentCount: 18, nightWeight: 0.7, name: 'Manchester Northern Quarter' },
  { center: { lat: 53.4875, lng: -2.2680 }, radius: 0.025, incidentCount: 16, nightWeight: 0.5, name: 'Salford' },

  // ─── NEW YORK & BROOKLYN ──────────────────────────────────────────────────
  { center: { lat: 40.7580, lng: -73.9855 }, radius: 0.025, incidentCount: 22, nightWeight: 0.6, name: 'Times Square / Midtown' },
  { center: { lat: 40.7128, lng: -74.0060 }, radius: 0.020, incidentCount: 12, nightWeight: 0.4, name: 'Lower Manhattan' },
  { center: { lat: 40.6928, lng: -73.9875 }, radius: 0.025, incidentCount: 18, nightWeight: 0.6, name: 'Downtown Brooklyn / Fulton' },
  { center: { lat: 40.7081, lng: -73.9571 }, radius: 0.025, incidentCount: 16, nightWeight: 0.6, name: 'Williamsburg' },
  { center: { lat: 40.6944, lng: -73.9212 }, radius: 0.030, incidentCount: 24, nightWeight: 0.7, name: 'Bushwick / Broadway' },

  // ─── PARIS & EIFFEL TOWER ─────────────────────────────────────────────────
  { center: { lat: 48.8584, lng: 2.2945 }, radius: 0.020, incidentCount: 16, nightWeight: 0.4, name: 'Eiffel Tower / Champ de Mars' },
  { center: { lat: 48.8606, lng: 2.3376 }, radius: 0.020, incidentCount: 12, nightWeight: 0.3, name: 'Louvre / Chatelet' },
  { center: { lat: 48.8809, lng: 2.3553 }, radius: 0.025, incidentCount: 26, nightWeight: 0.7, name: 'Gare du Nord / 10th Arr' },
  { center: { lat: 48.8867, lng: 2.3431 }, radius: 0.025, incidentCount: 18, nightWeight: 0.6, name: 'Montmartre' },

  // ─── SYDNEY & BONDI BEACH ─────────────────────────────────────────────────
  { center: { lat: -33.8732, lng: 151.2069 }, radius: 0.020, incidentCount: 16, nightWeight: 0.5, name: 'Sydney Town Hall' },
  { center: { lat: -33.8750, lng: 151.2220 }, radius: 0.025, incidentCount: 22, nightWeight: 0.7, name: 'Kings Cross / Oxford St' },
  { center: { lat: -33.8925, lng: 151.2480 }, radius: 0.020, incidentCount: 14, nightWeight: 0.5, name: 'Bondi Junction Interchange' },
  { center: { lat: -33.8915, lng: 151.2767 }, radius: 0.020, incidentCount: 14, nightWeight: 0.5, name: 'Bondi Beach Pavilion' },
];

function generateIncidents() {
  const incidents = [];
  const categories = [
    'harassment',
    'poor_lighting',
    'isolated_area',
    'stalking',
    'verbal_abuse',
    'theft',
    'unsafe_area',
    'street_incident',
    'other',
  ];

  for (const zone of riskZones) {
    for (let i = 0; i < zone.incidentCount; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.sqrt(Math.random()) * zone.radius;

      const lat = zone.center.lat + dist * Math.cos(angle);
      const lng = zone.center.lng + dist * Math.sin(angle);

      // Determine time period based on nightWeight
      let timeOfDay = 'afternoon';
      const r = Math.random();
      if (zone.nightWeight >= 0.65) {
        if (r < 0.40) timeOfDay = 'night';
        else if (r < 0.65) timeOfDay = 'late-night';
        else if (r < 0.85) timeOfDay = 'evening';
        else timeOfDay = 'morning';
      } else if (zone.nightWeight >= 0.45) {
        if (r < 0.35) timeOfDay = 'night';
        else if (r < 0.50) timeOfDay = 'late-night';
        else if (r < 0.75) timeOfDay = 'evening';
        else if (r < 0.90) timeOfDay = 'afternoon';
        else timeOfDay = 'morning';
      } else {
        if (r < 0.35) timeOfDay = 'afternoon';
        else if (r < 0.65) timeOfDay = 'morning';
        else if (r < 0.85) timeOfDay = 'evening';
        else timeOfDay = 'night';
      }

      // Category
      const catIdx = Math.floor(Math.random() * categories.length);
      const category = categories[catIdx];

      // Severity (1: 45%, 2: 35%, 3: 20%)
      const sR = Math.random();
      const severity = sR < 0.45 ? 1 : sR < 0.80 ? 2 : 3;

      // Created at (within last 45 days)
      const daysAgo = Math.floor(Math.random() * 45);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      incidents.push({
        location: { lat, lng },
        category,
        severity,
        timeOfDay,
        createdAt,
      });
    }
  }

  return incidents;
}

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('Missing MONGODB_URI');

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    console.log('Clearing existing incidents...');
    await IncidentReport.deleteMany({});

    const incidents = generateIncidents();
    console.log(`Inserting ${incidents.length} prototype incidents across ${riskZones.length} risk zones...`);
    await IncidentReport.insertMany(incidents);

    const total = await IncidentReport.countDocuments();
    console.log(`✓ Total incidents in database: ${total}`);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
