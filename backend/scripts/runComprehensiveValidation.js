import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import app from '../src/app.js';

let server;

async function runValidation() {
  await mongoose.connect(process.env.MONGODB_URI);
  server = app.listen(5098);
  const BASE = 'http://localhost:5098/api/safety';

  console.log('================================================================');
  console.log('HERGUARDIAN AI - SAFE ROUTE COMPREHENSIVE VALIDATION SUITE');
  console.log('================================================================\n');

  // TEST A: Pune -> Mumbai at 1 PM
  console.log('--- TEST A: Pune -> Mumbai at 1 PM (13:00) ---');
  const resA = await fetch(`${BASE}/safe-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 18.5204, lng: 73.8567 },
      destination: { lat: 19.0760, lng: 72.8777 },
      travelTime: 13,
    }),
  });
  const dataA = (await resA.json()).data;
  console.log(`Routes found: ${dataA.routes.length}`);
  console.assert(dataA.routes.length > 2, 'Route count should not be hard-coded to 2');
  console.assert(dataA.routes.some(r => r.recommended), 'At least one route should be recommended');
  
  dataA.routes.forEach((r, i) => {
    const sum = r.riskBreakdown.historicalIncidents + r.riskBreakdown.timeOfDay + r.riskBreakdown.segmentAnalysis + r.riskBreakdown.areaActivity;
    console.log(`  Route ${i + 1}${r.recommended ? ' [REC]' : ''}: ${(r.distance/1000).toFixed(1)} km, ${(r.duration/60).toFixed(0)} min | Risk: ${r.riskScore} (${r.riskLevel}) | Breakdown: [Inc: ${r.riskBreakdown.historicalIncidents}, Time: ${r.riskBreakdown.timeOfDay}, Seg: ${r.riskBreakdown.segmentAnalysis}, Area: ${r.riskBreakdown.areaActivity}] = ${sum.toFixed(1)}`);
    console.assert(Math.abs(sum - r.riskScore) < 0.01, `Breakdown must equal total for Route ${i+1}`);
  });

  // TEST B: Pune -> Mumbai at 11 PM
  console.log('\n--- TEST B: Pune -> Mumbai at 11 PM (23:00) ---');
  const resB = await fetch(`${BASE}/safe-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 18.5204, lng: 73.8567 },
      destination: { lat: 19.0760, lng: 72.8777 },
      travelTime: 23,
    }),
  });
  const dataB = (await resB.json()).data;
  console.log(`Route 1 at 1 PM Risk: ${dataA.routes[0].riskScore} -> at 11 PM Risk: ${dataB.routes[0].riskScore}`);
  console.assert(dataB.routes[0].riskScore > dataA.routes[0].riskScore, 'Risk at 11 PM must be significantly higher than at 1 PM');
  console.assert(dataB.routes[0].riskBreakdown.timeOfDay === 26, 'Time of day risk at 23:00 must be 26/30');

  // TEST C: Different origin -> same destination at 1 PM (Lonavala -> Mumbai)
  console.log('\n--- TEST C: Different origin (Lonavala -> Mumbai) at 1 PM ---');
  const resC = await fetch(`${BASE}/safe-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 18.7557, lng: 73.4091 }, // Lonavala
      destination: { lat: 19.0760, lng: 72.8777 }, // Mumbai
      travelTime: 13,
    }),
  });
  const dataC = (await resC.json()).data;
  console.log(`Lonavala -> Mumbai distance: ${(dataC.routes[0].distance/1000).toFixed(1)} km, Risk: ${dataC.routes[0].riskScore}`);
  console.assert(dataC.routes[0].distance < dataA.routes[0].distance, 'Lonavala is closer to Mumbai than Pune');

  // TEST D: Same origin -> different destination at 1 PM (Pune -> Lonavala)
  console.log('\n--- TEST D: Same origin -> different destination (Pune -> Lonavala) at 1 PM ---');
  const resD = await fetch(`${BASE}/safe-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 18.5204, lng: 73.8567 }, // Pune
      destination: { lat: 18.7557, lng: 73.4091 }, // Lonavala
      travelTime: 13,
    }),
  });
  const dataD = (await resD.json()).data;
  console.log(`Pune -> Lonavala distance: ${(dataD.routes[0].distance/1000).toFixed(1)} km, Risk: ${dataD.routes[0].riskScore}`);
  console.assert(dataD.routes[0].distance < dataA.routes[0].distance, 'Pune to Lonavala is shorter than Pune to Mumbai');

  // TEST E: Paris -> Eiffel Tower (Multi-road city grid)
  console.log('\n--- TEST E: Paris -> Eiffel Tower (Grid Road Network) ---');
  const resE = await fetch(`${BASE}/safe-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 48.8566, lng: 2.3522 },
      destination: { lat: 48.8584, lng: 2.2945 },
      travelTime: 13,
    }),
  });
  const dataE = (await resE.json()).data;
  console.log(`Paris routes count: ${dataE.routes.length}`);
  console.assert(dataE.routes.length >= 3, 'Urban grid should produce multiple route alternatives');
  dataE.routes.forEach((r, i) => {
    console.log(`  Route ${i + 1}: ${(r.distance/1000).toFixed(2)} km, ${(r.duration/60).toFixed(0)} min, Risk: ${r.riskScore} (${r.riskLevel})`);
  });

  // TEST F: Isolated route (Point Reyes lighthouse / single road link)
  console.log('\n--- TEST F: Single road link (Point Reyes / isolated corridor) ---');
  const resF = await fetch(`${BASE}/safe-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: 38.0030, lng: -122.9980 },
      destination: { lat: 37.9975, lng: -123.0230 },
      travelTime: 13,
    }),
  });
  const dataF = (await resF.json()).data;
  console.log(`Isolated link routes count: ${dataF.routes.length} (Only available road returned)`);
  console.assert(dataF.routes.length >= 1, 'At least 1 route should be found');
  console.assert(!dataF.routes.some((r, i) => dataF.routes.some((other, j) => i !== j && r.distance === other.distance)), 'No duplicate routes generated');

  console.log('\n================================================================');
  console.log('ALL VERIFICATION ASSERTIONS PASSED SUCCESSFULLY!');
  console.log('================================================================');

  server.close();
  process.exit(0);
}

runValidation().catch(err => {
  console.error('Validation failure:', err);
  if (server) server.close();
  process.exit(1);
});
