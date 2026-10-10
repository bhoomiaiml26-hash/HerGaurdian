/**
 * Quick worldwide routing test
 */

const API_BASE = 'http://localhost:5000/api';

async function testRoute(name, origin, destination, travelTime) {
  try {
    const response = await fetch(`${API_BASE}/safety/safe-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, travelTime })
    });
    
    const data = await response.json();
    
    if (data.success && data.data.routes.length > 0) {
      const route = data.data.routes[0];
      console.log(`\n${name}`);
      console.log(`  Distance: ${(route.distance / 1000).toFixed(1)} km`);
      console.log(`  Duration: ${Math.round(route.duration / 60)} min`);
      console.log(`  Risk: ${route.riskScore.toFixed(1)} (${route.riskLevel})`);
      console.log(`  Routes found: ${data.data.routes.length}`);
      return true;
    } else {
      console.log(`\n${name}: No routes found`);
      return false;
    }
  } catch (error) {
    console.error(`Error in ${name}:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('Testing worldwide routing...\n');
  
  await testRoute('Pune → Mumbai (1 PM)', 
    { lat: 18.5204, lng: 73.8567 }, 
    { lat: 19.0760, lng: 72.8777 }, 13);
  
  await testRoute('London → Manchester (1 PM)', 
    { lat: 51.5074, lng: -0.1278 }, 
    { lat: 53.4808, lng: -2.2426 }, 13);
  
  await testRoute('New York → Brooklyn (1 PM)', 
    { lat: 40.7128, lng: -74.0060 }, 
    { lat: 40.6782, lng: -73.9442 }, 13);
  
  await testRoute('Paris → Eiffel Tower (1 PM)', 
    { lat: 48.8566, lng: 2.3522 }, 
    { lat: 48.8584, lng: 2.2945 }, 13);
  
  console.log('\n✓ Tests complete');
}

runTests();
