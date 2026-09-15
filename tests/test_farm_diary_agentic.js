/* ==========================================================================
   KrishiMitra AI — Farm Diary Real Memory & Agentic Decision Engine Test Suite
   Verifies canonical event schemas, category isolation, natural language extraction,
   and dynamic agentic decision recommendation updates.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const farmDiaryService = require('../backend/services/farmDiaryService');

// Database path for test cleanup
const DB_DIR = path.join(__dirname, '..', 'database', 'farm_diary');
const EVENTS_FILE = path.join(DB_DIR, 'diary_events.json');

const TEST_FARMER_ID = 'test_farmer_agentic_001';

function resetTestData() {
  if (fs.existsSync(EVENTS_FILE)) {
    let events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
    events = events.filter(e => e.farmerId !== TEST_FARMER_ID);
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
  }
}

async function runFarmDiaryTestSuite() {
  console.log('\n==================================================');
  console.log('  KrishiMitra AI — Farm Diary Agentic Test Suite');
  console.log('==================================================\n');

  resetTestData();

  let passCount = 0;
  let failCount = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`  ✕ [FAIL] ${testName}`);
      failCount++;
    }
  }

  // ── TEST 1: Empty Diary State & Recommendation ─────────────────────────────
  const initialEvents = farmDiaryService.getEvents(TEST_FARMER_ID);
  assert(initialEvents.length === 0, 'Test 1a: Initial diary state is empty for test farmer');

  const emptyDecision = await farmDiaryService.generateNextBestAction(TEST_FARMER_ID);
  assert(emptyDecision.success === true, 'Test 1b: Empty decision call returns success');
  assert(
    emptyDecision.recommendation.action.includes('Not enough farm information to provide a personalized next action yet.'),
    'Test 1c: Empty diary returns truthful empty-state recommendation without fake events'
  );

  // ── TEST 2: Category Isolation (Pesticide remains pesticide) ─────────────────
  const event1 = farmDiaryService.createEvent({
    farmerId: TEST_FARMER_ID,
    crop: 'Wheat',
    eventType: 'pesticide',
    title: 'Applied Neem Pesticide',
    description: 'Sprayed neem pesticide to prevent aphids',
    productName: 'Neem Pesticide',
    quantity: 500,
    unit: 'ml',
    area: 2,
    areaUnit: 'acre',
    date: '2026-09-15'
  });

  assert(event1.eventType === 'pesticide', 'Test 2a: Pesticide event strictly preserved as eventType = "pesticide"');
  assert(event1.quantity === 500 && event1.unit === 'ml', 'Test 2b: Quantity & unit preserved accurately');
  assert(event1.area === 2 && event1.areaUnit === 'acre', 'Test 2c: Area & areaUnit preserved');

  const pesticideFilterResults = farmDiaryService.getEvents(TEST_FARMER_ID, { eventType: 'pesticide' });
  const fertilizerFilterResults = farmDiaryService.getEvents(TEST_FARMER_ID, { eventType: 'fertilizer' });
  assert(pesticideFilterResults.length === 1, 'Test 2d: Pesticide filter returns ONLY pesticide events');
  assert(fertilizerFilterResults.length === 0, 'Test 2e: Fertilizer filter returns zero pesticide events (Category Isolation)');

  // ── TEST 3: Multilingual Extraction Without Fake Data Fabrication ─────────────
  const ext1 = await farmDiaryService.extractEventFromText('आज मैंने अपने गेहूं के खेत में 40 किलो यूरिया डाला', { language: 'hi' });
  assert(ext1.success && ext1.draft.eventType === 'fertilizer', 'Test 3a: Hindi extraction parses fertilizer event');
  assert(ext1.draft.quantity === 40 && ext1.draft.unit === 'kg', 'Test 3b: Hindi extraction parses 40 kg correctly');

  const ext2 = await farmDiaryService.extractEventFromText('आज गेहूं में कीटनाशक का छिड़काव किया', { language: 'hi' });
  assert(ext2.success && ext2.draft.eventType === 'pesticide', 'Test 3c: Hindi pesticide phrase parses eventType = "pesticide"');
  assert(ext2.draft.quantity === null, 'Test 3d: Missing quantity in natural language remains null (No fake fabrication)');

  // ── TEST 4: AGENTIC DECISION ENGINE DYNAMIC UPDATE TEST ─────────────────────────
  // We will track decision recommendations as events are added sequentially:
  // Step 1: Currently has Event 1 (Pesticide) -> expect recommendation about pesticide PHI/monitoring
  const decisionStep1 = await farmDiaryService.generateNextBestAction(TEST_FARMER_ID);
  const action1 = decisionStep1.recommendation.action;
  assert(
    action1.toLowerCase().includes('pesticide') || action1.toLowerCase().includes('monitor') || action1.toLowerCase().includes('sprays'),
    'Test 4a: Step 1 Recommendation reflects recent Pesticide application'
  );

  // Step 2: Add Fertilizer event (Urea 40 kg)
  const event2 = farmDiaryService.createEvent({
    farmerId: TEST_FARMER_ID,
    crop: 'Wheat',
    eventType: 'fertilizer',
    title: 'Urea Application',
    description: 'Applied 40kg urea',
    productName: 'Urea',
    quantity: 40,
    unit: 'kg',
    area: 2,
    areaUnit: 'acre',
    date: '2026-09-16'
  });

  const decisionStep2 = await farmDiaryService.generateNextBestAction(TEST_FARMER_ID);
  const action2 = decisionStep2.recommendation.action;
  assert(action2 !== action1, 'Test 4b: Recommendation CHANGED dynamically after adding Fertilizer event');
  assert(
    action2.toLowerCase().includes('fertilizer') || action2.toLowerCase().includes('irrigation') || action2.toLowerCase().includes('moisture'),
    'Test 4c: Step 2 Recommendation suggests light irrigation for fertilizer absorption'
  );

  // Step 3: Add Irrigation event (Canal Irrigation)
  const event3 = farmDiaryService.createEvent({
    farmerId: TEST_FARMER_ID,
    crop: 'Wheat',
    eventType: 'irrigation',
    title: 'Canal Irrigation',
    description: 'Canal watering done',
    quantity: null,
    unit: null,
    area: 2,
    areaUnit: 'acre',
    date: '2026-09-17'
  });

  const decisionStep3 = await farmDiaryService.generateNextBestAction(TEST_FARMER_ID);
  const action3 = decisionStep3.recommendation.action;
  assert(action3 !== action2, 'Test 4d: Recommendation CHANGED dynamically after adding Irrigation event');
  assert(
    action3.toLowerCase().includes('uptake') || action3.toLowerCase().includes('root') || action3.toLowerCase().includes('postpone'),
    'Test 4e: Step 3 Recommendation combines Fertilizer + Irrigation context to advise root uptake period'
  );

  // ── TEST 5: Exact Event Deletion & Persistence ──────────────────────────────
  const delRes = farmDiaryService.deleteEvent(TEST_FARMER_ID, event3.id);
  assert(delRes === true, 'Test 5a: Delete event by exact ID returned true');
  
  const remainingEvents = farmDiaryService.getEvents(TEST_FARMER_ID);
  assert(remainingEvents.length === 2, 'Test 5b: Remaining event count is exactly 2 after deletion');
  assert(remainingEvents.every(e => e.id !== event3.id), 'Test 5c: Deleted event ID no longer exists in storage');

  // Clean up test data after run
  resetTestData();

  console.log('\n--------------------------------------------------');
  console.log(`  AUTOMATED TEST SUMMARY: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('--------------------------------------------------\n');

  process.exit(failCount === 0 ? 0 : 1);
}

runFarmDiaryTestSuite().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
