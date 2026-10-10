/**
 * Test script to verify geocoding fixes
 * Run: node scripts/testGeocoding.js
 */

import { geocode } from '../src/services/geocoding.js';

const TEST_CASES = [
  // Nationally famous landmarks (MUST work - was regressed)
  { query: 'Taj Mahal', expected: 'Agra' },
  { query: 'Kanpur Railway Station', expected: 'Kanpur' },
  { query: 'Gateway of India Mumbai', expected: 'Mumbai' },
  { query: 'India Gate Delhi', expected: 'Delhi' },
  
  // Other major cities
  { query: 'Kolhapur', expected: 'Kolhapur' },
  { query: 'Nashik', expected: 'Nashik' },
  { query: 'Mumbai', expected: 'Mumbai' },
  
  // Pune-local hyperlocal (should still work via ranking bias)
  { query: 'Mangalam Breeze', expected: 'Pune' },
  { query: 'ISKCON Ravet', expected: 'Pune' },
  { query: ' Koregaon Park', expected: 'Pune' },
];

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('GEOCODING REGRESSION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  for (const tc of TEST_CASES) {
    try {
      console.log(`Testing: "${tc.query}"`);
      const result = await geocode(tc.query);
      
      if (result.data.length === 0) {
        console.log(`  ❌ FAIL: No results found`);
      } else {
        const top = result.data[0];
        const nameMatch = top.displayName.toLowerCase().includes(tc.expected.toLowerCase()) ||
                         top.name.toLowerCase().includes(tc.expected.toLowerCase());
        
        if (nameMatch) {
          console.log(`  ✅ PASS: "${top.name}" (${top.displayName.substring(0, 60)}...)`);
          console.log(`      Sources used: ${result.sourcesUsed}`);
        } else {
          console.log(`  ⚠️  PARTIAL: Got "${top.name}" but expected "${tc.expected}"`);
          console.log(`      Full: ${top.displayName.substring(0, 80)}`);
          console.log(`      Sources used: ${result.sourcesUsed}`);
        }
      }
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
}

runTests();