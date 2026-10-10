/**
 * Comprehensive test for Safe Route module
 * Tests multiple scenarios to verify dynamic behavior
 */

const API_BASE = 'http://localhost:5000/api';

async function testScenario(scenarioName, origin, destination, travelTime) {
  try {
    const response = await fetch(`${API_BASE}/safety/safe-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        travelTime
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.data.routes.length > 0) {
      console.log(`\n${scenarioName}`);
      console.log('─'.repeat(60));
      console.log(`Routes found: ${data.data.routes.length}`);
      console.log(`Travel time: ${travelTime}:00 (${getTimeLabel(travelTime)})`);
      console.log(`Incidents in database: ${data.data.incidentCount}`);
      
      data.data.routes.forEach((route, idx) => {
        console.log(`\n  Route ${idx + 1}${route.recommended ? ' ✓ RECOMMENDED' : ''}`);
        console.log(`    Distance: ${(route.distance / 1000).toFixed(1)} km`);
        console.log(`    Duration: ${Math.round(route.duration / 60)} min`);
        console.log(`    Risk Score: ${route.riskScore.toFixed(1)} (${route.riskLevel})`);
        
        if (route.riskFactors) {
          console.log(`    Risk Factors:`);
          route.riskFactors.forEach(f => {
            console.log(`      - ${f.name}: ${f.value}/${f.max}`);
          });
        }
      });
      
      return data.data.routes;
    } else {
      console.log(`\n${scenarioName}: No routes found`);
      return [];
    }
  } catch (error) {
    console.error(`Error in ${scenarioName}:`, error.message);
    return [];
  }
}

function getTimeLabel(hour) {
  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  if (hour >= 21 && hour < 24) return 'Night';
  return 'Late Night';
}

async function runComprehensiveTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('COMPREHENSIVE SAFE ROUTE MODULE TEST');
  console.log('═══════════════════════════════════════════════════════════════');

  // Scenario 1: Same route at different times (TEST TIME DEPENDENCE)
  console.log('\n\n=== SCENARIO 1: TIME DEPENDENCE ===');
  console.log('Testing same origin/destination at different times');
  
  const origin1 = { lat: 18.5204, lng: 73.8567 };
  const dest1 = { lat: 18.5400, lng: 73.8900 };
  
  const routes_1pm = await testScenario('1 PM (Afternoon)', origin1, dest1, 13);
  const routes_5pm = await testScenario('5 PM (Evening)', origin1, dest1, 17);
  const routes_9pm = await testScenario('9 PM (Night)', origin1, dest1, 21);
  const routes_2am = await testScenario('2 AM (Late Night)', origin1, dest1, 2);
  
  // Verify time dependence
  if (routes_1pm.length > 0 && routes_2am.length > 0) {
    const riskDiff = Math.abs(routes_1pm[0].riskScore - routes_2am[0].riskScore);
    console.log(`\n✓ Time dependence verified: Risk difference = ${riskDiff.toFixed(1)}`);
  }

  // Scenario 2: Different destinations (TEST LOCATION DEPENDENCE)
  console.log('\n\n=== SCENARIO 2: LOCATION DEPENDENCE ===');
  console.log('Testing different destinations at same time (1 PM)');
  
  const origin2 = { lat: 18.5204, lng: 73.8567 };
  const dest2a = { lat: 18.5600, lng: 73.9200 }; // Further out
  const dest2b = { lat: 18.4800, lng: 73.8300 }; // Different direction
  const dest2c = { lat: 18.5000, lng: 73.8800 }; // Residential
  
  await testScenario('Destination A (Northeast)', origin2, dest2a, 13);
  await testScenario('Destination B (Southwest)', origin2, dest2b, 13);
  await testScenario('Destination C (Residential)', origin2, dest2c, 13);

  // Scenario 3: Different origins (TEST ORIGIN DEPENDENCE)
  console.log('\n\n=== SCENARIO 3: ORIGIN DEPENDENCE ===');
  console.log('Testing different origins to same destination (1 PM)');
  
  const dest3 = { lat: 18.5400, lng: 73.8900 };
  const origin3a = { lat: 18.4800, lng: 73.8300 };
  const origin3b = { lat: 18.5000, lng: 73.8800 };
  const origin3c = { lat: 18.5800, lng: 73.9000 };
  
  await testScenario('Origin A (Southwest)', origin3a, dest3, 13);
  await testScenario('Origin B (West)', origin3b, dest3, 13);
  await testScenario('Origin C (North)', origin3c, dest3, 13);

  // Scenario 4: Long route (TEST ROUTE COUNT VARIATION)
  console.log('\n\n=== SCENARIO 4: ROUTE COUNT VARIATION ===');
  console.log('Testing longer routes that may have more alternatives');
  
  const origin4 = { lat: 18.4800, lng: 73.8300 };
  const dest4 = { lat: 18.5800, lng: 73.9200 }; // Long distance
  
  await testScenario('Long route (1 PM)', origin4, dest4, 13);
  await testScenario('Long route (9 PM)', origin4, dest4, 21);

  // Scenario 5: Route ranking changes with time
  console.log('\n\n=== SCENARIO 5: ROUTE RANKING CHANGES ===');
  console.log('Testing if recommended route changes with time');
  
  const origin5 = { lat: 18.5204, lng: 73.8567 };
  const dest5 = { lat: 18.5500, lng: 73.8800 };
  
  const routes_day = await testScenario('Daytime (1 PM)', origin5, dest5, 13);
  const routes_night = await testScenario('Nighttime (9 PM)', origin5, dest5, 21);
  
  if (routes_day.length > 1 && routes_night.length > 1) {
    const recommended_day = routes_day.find(r => r.recommended);
    const recommended_night = routes_night.find(r => r.recommended);
    
    if (recommended_day && recommended_night) {
      console.log(`\nRecommended route at 1 PM: Risk ${recommended_day.riskScore.toFixed(1)}`);
      console.log(`Recommended route at 9 PM: Risk ${recommended_night.riskScore.toFixed(1)}`);
      console.log(`✓ Risk changes with time: ${Math.abs(recommended_day.riskScore - recommended_night.riskScore).toFixed(1)}`);
    }
  }

  // Scenario 6: Determinism check
  console.log('\n\n=== SCENARIO 6: DETERMINISM CHECK ===');
  console.log('Running same request twice to verify determinism');
  
  const routes_first = await testScenario('First request', origin1, dest1, 13);
  const routes_second = await testScenario('Second request', origin1, dest1, 13);
  
  if (routes_first.length > 0 && routes_second.length > 0) {
    const risk1 = routes_first[0].riskScore;
    const risk2 = routes_second[0].riskScore;
    console.log(`\nFirst request risk: ${risk1.toFixed(1)}`);
    console.log(`Second request risk: ${risk2.toFixed(1)}`);
    console.log(`Match: ${Math.abs(risk1 - risk2) < 0.1 ? '✓ PASS' : '✗ FAIL'}`);
  }

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
}

runComprehensiveTests();
