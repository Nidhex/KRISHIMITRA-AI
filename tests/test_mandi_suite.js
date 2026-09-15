/* ==========================================================================
   KrishiMitra AI — Official Mandi / Krishi Market Test Suite
   Run with: node tests/test_mandi_suite.js
   ========================================================================== */

'use strict';

const mandiService = require('../backend/services/mandiService');

async function runMandiTests() {
  console.log('====================================================');
  console.log('  KRISHIMITRA AI — OFFICIAL MANDI TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✕ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Multilingual Alias Resolution — Wheat
  const keyGehuHindi = mandiService.resolveCommodityKey('गेहूं');
  const keyGehuRoman = mandiService.resolveCommodityKey('gehu');
  const keyWheatEng = mandiService.resolveCommodityKey('wheat');
  assert(
    keyGehuHindi === 'wheat' && keyGehuRoman === 'wheat' && keyWheatEng === 'wheat',
    'Multilingual alias resolution maps "गेहूं", "gehu", and "wheat" to "wheat"'
  );

  // 2. Multilingual Alias Resolution — Paddy
  const keyDhanHindi = mandiService.resolveCommodityKey('धान');
  const keyPaddyEng = mandiService.resolveCommodityKey('paddy');
  assert(
    keyDhanHindi === 'paddy' && keyPaddyEng === 'paddy',
    'Multilingual alias resolution maps "धान" and "paddy" to "paddy"'
  );

  // 3. Record Normalization & Price Integrity Validation
  const rawRecord = {
    state: 'Uttar Pradesh',
    district: 'Gorakhpur',
    market: 'Gorakhpur Mandi',
    commodity: 'Wheat',
    min_price: '2200',
    max_price: '2300',
    modal_price: '2250',
    arrival_date: '15 Sep 2026'
  };
  const norm = mandiService.normalizeRecord(rawRecord);
  assert(
    norm.minPrice === 2200 && norm.maxPrice === 2300 && norm.modalPrice === 2250 && norm.unit === '₹ / Quintal',
    'Record normalizer preserves min/max/modal prices and enforces "₹ / Quintal" unit'
  );
  assert(
    norm.minPrice <= norm.modalPrice && norm.modalPrice <= norm.maxPrice,
    'Price integrity rule verified: minPrice <= modalPrice <= maxPrice'
  );

  // 4. Mandi Query — Wheat
  const wheatRes = await mandiService.getMandiPrices({ commodity: 'wheat' });
  assert(
    wheatRes.success && wheatRes.count > 0 && wheatRes.records[0].commodity === 'Wheat',
    'Retrieved Wheat government market records'
  );
  assert(
    wheatRes.source === 'Government of India — Agmarknet (data.gov.in)',
    'Source metadata strictly identifies "Government of India — Agmarknet (data.gov.in)"'
  );
  assert(
    wheatRes.dataDate !== null && wheatRes.dataDate !== undefined,
    'Data date is present and retrieved from source'
  );

  // 5. Mandi Query — Paddy
  const paddyRes = await mandiService.getMandiPrices({ commodity: 'paddy' });
  assert(
    paddyRes.success && paddyRes.count > 0 && paddyRes.records[0].commodity === 'Paddy',
    'Retrieved Paddy government market records'
  );

  // 6. Mandi Query — Tomato
  const tomatoRes = await mandiService.getMandiPrices({ commodity: 'tomato' });
  assert(
    tomatoRes.success && tomatoRes.count > 0 && tomatoRes.records[0].commodity === 'Tomato',
    'Retrieved Tomato government market records'
  );

  // 7. Mandi Query — Potato
  const potatoRes = await mandiService.getMandiPrices({ commodity: 'potato' });
  assert(
    potatoRes.success && potatoRes.count > 0 && potatoRes.records[0].commodity === 'Potato',
    'Retrieved Potato government market records'
  );

  // 8. Mandi Query — Mustard
  const mustardRes = await mandiService.getMandiPrices({ commodity: 'mustard' });
  assert(
    mustardRes.success && mustardRes.count > 0 && mustardRes.records[0].commodity === 'Mustard',
    'Retrieved Mustard government market records'
  );

  // 9. Absence of Fake Hardcoded Values in Production Output
  const containsFakeLaxmipur = wheatRes.records.some(r => r.market.includes('Laxmipur APMC (12km)'));
  assert(
    !containsFakeLaxmipur,
    'No fake hardcoded distance or fake demo market names in production response'
  );

  // 10. Unknown Commodity Query Handling (No Fabricated Data)
  const unknownRes = await mandiService.getMandiPrices({ commodity: 'dragonfruit_xyz' });
  assert(
    unknownRes.success && unknownRes.count === 0 && unknownRes.records.length === 0,
    'Unknown commodity returns empty records array without throwing or inventing fake prices'
  );

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMandiTests().catch(err => {
  console.error('Mandi test execution failed:', err);
  process.exit(1);
});
