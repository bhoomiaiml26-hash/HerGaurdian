/**
 * Test script for enhanced Safe Route functionality
 * Tests time-dependent and location-dependent risk calculations
 */

const API_BASE = 'http://localhost:5000/api';

async function testSafeRoute() {
  console.log('=== Testing Enhanced Safe Route Module ===\n');

  // Test 1: Same route at different times
  console.log('TEST 1: Same origin/destination at different times');
  console.log('------------------------------------------------');
  
  const origin = { lat: 18.5204, lng: 73.8567 }; // Pune center
  const destination = { lat: 18.5400, lng: 73.8900 }; // University area
  
  const times = [13, 17, 21, 23, 2]; // 1 PM, 5 PM, 9 PM, 11 PM, 2 AM
  
  for (const hour of times) {
    try {
      const response = await fetch(`${API_BASE}/safety/safe-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          travelTime: hour
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.data.routes.length > 0) {
        const recommended = data.data.routes.find(r => r.recommended);
        console.log(`\nTime: ${hour}:00 (${getTimeLabel(hour)})`);
        console.log(`  Routes found: ${data.data.routes.length}`);
        console.log(`  Recommended route risk: ${recommended.riskScore.toFixed(1)} (${recommended.riskLevel})`);
        console.log(`  Recommended route distance: ${(recommended.distance / 1000).toFixed(1)} km`);
        console.log(`  Recommended route duration: ${Math.round(recommended.duration / 60)} min`);
        
        if (recommended.riskFactors) {
          console.log(`  Risk factors:`);
          recommended.riskFactors.forEach(f => {
            console.log(`    - ${f.name}: ${f.value}/${f.max} (${f.description})`);
          });
        }
      }
    } catch (error) {
      console.error(`Error at ${hour}:00:`, error.message);
    }
  }

  // Test 2: Different destinations at same time
  console.log('\n\nTEST 2: Different destinations at same time (1 PM)');
  console.log('-------------------------------------------------------');
  
  const destinations = [
    { lat: 18.5400, lng: 73.8900, name: 'University area' },
    { lat: 18.5300, lng: 73.8400, name: 'Industrial area' },
    { lat: 18.5000, lng: 73.8800, name: 'Residential area' },
  ];
  
  for (const dest of destinations) {
    try {
      const response = await fetch(`${API_BASE}/safety/safe-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination: { lat: dest.lat, lng: dest.lng },
          travelTime: 13
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.data.routes.length > 0) {
        const recommended = data.data.routes.find(r => r.recommended);
        console.log(`\nDestination: ${dest.name}`);
        console.log(`  Routes found: ${data.data.routes.length}`);
        console.log(`  Recommended route risk: ${recommended.riskScore.toFixed(1)} (${recommended.riskLevel})`);
        console.log(`  Recommended route distance: ${(recommended.distance / 1000).toFixed(1)} km`);
      }
    } catch (error) {
      console.error(`Error for ${dest.name}:`, error.message);
    }
  }

  // Test 3: Determinism test - same request twice
  console.log('\n\nTEST 3: Determinism test (same request twice)');
  console.log('---------------------------------------------');
  
  try {
    const response1 = await fetch(`${API_BASE}/safety/safe-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        travelTime: 13
      })
    });
    
    const data1 = await response1.json();
    
    const response2 = await fetch(`${API_BASE}/safety/safe-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        travelTime: 13
      })
    });
    
    const data2 = await response2.json();
    
    if (data1.success && data2.success) {
      const risk1 = data1.data.routes[0].riskScore;
      const risk2 = data2.data.routes[0].riskScore;
      
      console.log(`First request risk: ${risk1.toFixed(1)}`);
      console.log(`Second request risk: ${risk2.toFixed(1)}`);
      console.log(`Match: ${Math.abs(risk1 - risk2) < 0.1 ? '✓ PASS' : '✗ FAIL'}`);
    }
  } catch (error) {
    console.error('Error in determinism test:', error.message);
  }

  console.log('\n=== Test Complete ===');
}

function getTimeLabel(hour) {
  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  if (hour >= 21 && hour < 24) return 'Night';
  return 'Late Night';
}

testSafeRoute();
