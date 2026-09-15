/* ==========================================================================
   KrishiMitra AI — Complete Farm Diary, Memory & Decision Engine Test Suite
   Run with: node tests/test_farm_diary_suite.js
   ========================================================================== */

'use strict';

const farmDiaryService = require('../backend/services/farmDiaryService');

async function runTests() {
  console.log('====================================================');
  console.log('  KRISHIMITRA AI — FARM DIARY TEST SUITE');
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

  const TEST_FARMER = 'test_farmer_suite';

  // Cleanup prior test events
  const existingEvents = farmDiaryService.getEvents(TEST_FARMER);
  existingEvents.forEach(e => farmDiaryService.deleteEvent(TEST_FARMER, e.id));

  // 1. Classification & Normalization — Urea -> Fertilizer
  const normFert = farmDiaryService.normalizeEventType('pesticide', 'Applied 40 kg urea', 'urea top dressing');
  assert(normFert === 'fertilizer', 'Urea material strictly normalized to "fertilizer" eventType');

  // 2. Classification & Normalization — Water -> Irrigation
  const normIrr = farmDiaryService.normalizeEventType('other', 'Watered wheat field', 'irrigation given');
  assert(normIrr === 'irrigation', 'Water/watering strictly normalized to "irrigation" eventType');

  // 3. Classification & Normalization — Spray -> Pesticide
  const normPest = farmDiaryService.normalizeEventType('other', 'Sprayed Neem Oil', 'pesticide application');
  assert(normPest === 'pesticide', 'Spray/insecticide strictly normalized to "pesticide" eventType');

  // 4. Classification & Normalization — Cutting -> Harvest
  const normHarv = farmDiaryService.normalizeEventType('other', 'Wheat harvest', 'cut standing crop');
  assert(normHarv === 'harvest', 'Harvest/cutting strictly normalized to "harvest" eventType');

  // 5. Empty Diary Decision Engine State
  const emptyDecision = await farmDiaryService.generateNextBestAction(TEST_FARMER);
  assert(
    emptyDecision.success && emptyDecision.recommendation.priority === 'info',
    'Empty Farm Memory returns friendly initial recording prompt'
  );

  // 6. Manual Event Creation — Fertilizer
  const e1 = farmDiaryService.createEvent({
    farmerId: TEST_FARMER,
    eventType: 'fertilizer',
    crop: 'Wheat',
    title: 'Applied 40kg Urea',
    description: 'Applied 40 kg urea to main field',
    quantity: 40,
    unit: 'kg',
    area: 2,
    areaUnit: 'acre',
    date: '2026-09-15',
    source: 'manual'
  });
  assert(e1 && e1.eventType === 'fertilizer' && e1.quantity === 40 && e1.area === 2, 'Created structured Fertilizer event');

  // 7. Manual Event Creation — Irrigation
  const e2 = farmDiaryService.createEvent({
    farmerId: TEST_FARMER,
    eventType: 'irrigation',
    crop: 'Wheat',
    title: 'Canal Irrigation',
    description: 'Irrigated wheat field with canal water',
    date: '2026-09-16',
    source: 'manual'
  });
  assert(e2 && e2.eventType === 'irrigation' && e2.crop === 'Wheat', 'Created structured Irrigation event');

  // 8. Manual Event Creation — Pesticide
  const e3 = farmDiaryService.createEvent({
    farmerId: TEST_FARMER,
    eventType: 'pesticide',
    crop: 'Tomato',
    title: 'Neem Oil Spray',
    description: 'Sprayed organic neem biopesticide',
    quantity: 500,
    unit: 'ml',
    date: '2026-09-17',
    source: 'manual'
  });
  assert(e3 && e3.eventType === 'pesticide' && e3.crop === 'Tomato', 'Created structured Pesticide event');

  // 9. Manual Event Creation — Harvest
  const e4 = farmDiaryService.createEvent({
    farmerId: TEST_FARMER,
    eventType: 'harvest',
    crop: 'Wheat',
    title: 'Wheat Harvest',
    description: 'Harvested 500 kg wheat',
    quantity: 500,
    unit: 'kg',
    date: '2026-09-18',
    source: 'manual'
  });
  assert(e4 && e4.eventType === 'harvest' && e4.quantity === 500, 'Created structured Harvest event');

  // 10. Manual Event Creation — Expense
  const e5 = farmDiaryService.createEvent({
    farmerId: TEST_FARMER,
    eventType: 'expense',
    crop: 'Wheat',
    title: 'Bought Seeds',
    amount: 1500,
    currency: 'INR',
    date: '2026-09-10',
    source: 'manual'
  });
  assert(e5 && e5.eventType === 'expense' && e5.amount === 1500, 'Created structured Expense event');

  // 11. Event Retrieval & Filtering by Farmer
  const events = farmDiaryService.getEvents(TEST_FARMER);
  assert(events.length === 5, 'Retrieved all 5 stored events for test farmer');

  // 12. Filtering by Crop
  const wheatEvents = farmDiaryService.getEvents(TEST_FARMER, { crop: 'Wheat' });
  assert(wheatEvents.length === 4, 'Filtered events by crop (Wheat)');

  // 13. Filtering by Event Type
  const fertEvents = farmDiaryService.getEvents(TEST_FARMER, { eventType: 'fertilizer' });
  assert(fertEvents.length === 1 && fertEvents[0].id === e1.id, 'Filtered events by eventType (fertilizer)');

  // 14. Fallback Extraction — Hindi Text
  const exHindi = await farmDiaryService.extractEventFromText('आज मैंने गेहूं के खेत में 40 किलो यूरिया डाला', { language: 'hi' });
  assert(
    exHindi.success && exHindi.draft.eventType === 'fertilizer' && exHindi.draft.crop === 'Wheat' && exHindi.draft.quantity === 40,
    'AI Extracted Hindi text: Wheat, Fertilizer, 40 kg'
  );

  // 15. Fallback Extraction — Hinglish Text
  const exHinglish = await farmDiaryService.extractEventFromText('40 kg urea dala wheat me', { language: 'hi' });
  assert(
    exHinglish.success && exHinglish.draft.eventType === 'fertilizer' && exHinglish.draft.crop === 'Wheat' && exHinglish.draft.quantity === 40,
    'AI Extracted Hinglish text: Wheat, Fertilizer, 40 kg'
  );

  // 16. Fallback Extraction — Missing Numbers (No Hallucination)
  const exNoNum = await farmDiaryService.extractEventFromText('Watered wheat field today', { language: 'en' });
  assert(
    exNoNum.success && exNoNum.draft.quantity === null,
    'Missing quantity is null (no hallucinated numbers)'
  );

  // 17. Farm Memory Prompt Formatting
  const memoryPrompt = farmDiaryService.queryFarmMemory(TEST_FARMER, 'urea fertilizer');
  assert(
    memoryPrompt.includes('Applied 40kg Urea') && memoryPrompt.includes('FERTILIZER'),
    'Farm Memory returns exact recorded events for AI prompt context'
  );

  // 18. Next Best Action Decision Engine — Harvest Scenario
  const harvestDecision = await farmDiaryService.generateNextBestAction(TEST_FARMER, 'Wheat');
  assert(
    harvestDecision.success && harvestDecision.recommendation.action.includes('sun-drying'),
    'Next Best Action dynamically adapts to latest Harvest event'
  );

  // 19. Next Best Action Decision Engine — Fertilizer Scenario
  // Delete harvest so fertilizer becomes latest
  farmDiaryService.deleteEvent(TEST_FARMER, e4.id);
  farmDiaryService.deleteEvent(TEST_FARMER, e3.id);
  farmDiaryService.deleteEvent(TEST_FARMER, e2.id);
  const fertDecision = await farmDiaryService.generateNextBestAction(TEST_FARMER, 'Wheat');
  assert(
    fertDecision.success && fertDecision.recommendation.action.includes('Monitor') && fertDecision.recommendation.reason.includes('fertilizer'),
    'Next Best Action dynamically adapts to latest Fertilizer event'
  );

  // 20. Event Deletion
  const delRes = farmDiaryService.deleteEvent(TEST_FARMER, e1.id);
  assert(delRes === true, 'Successfully deleted event from database');

  // 21. Verify remaining count
  const remaining = farmDiaryService.getEvents(TEST_FARMER);
  assert(remaining.length === 1 && remaining[0].id === e5.id, 'Remaining event matches expected state');

  // Cleanup test farmer
  farmDiaryService.deleteEvent(TEST_FARMER, e5.id);

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
