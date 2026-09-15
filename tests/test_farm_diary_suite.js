/* ==========================================================================
   KrishiMitra AI — Farm Diary, Farm Memory & Decision Engine Test Suite
   ========================================================================== */

'use strict';

const assert = require('assert');
const path = require('path');
const http = require('http');

// Import Backend Modules directly
const farmDiaryService = require('../backend/services/farmDiaryService');
const ragService = require('../backend/services/ragService');

console.log('===================================================================');
console.log('  KRISHIMITRA AI — FARM DIARY & DECISION ENGINE TEST SUITE');
console.log('===================================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function logPass(testName) {
    passed++;
    console.log(`  🟢 [PASS] ${testName}`);
  }

  function logFail(testName, err) {
    failed++;
    console.error(`  🔴 [FAIL] ${testName}: ${err.message}`);
  }

  // TEST 1: Canonical Demo Farmer ID & Fields Retrieval
  try {
    const fields = farmDiaryService.getFields('farmer_default');
    assert(Array.isArray(fields) && fields.length >= 2, 'Should return at least 2 fields for demo farmer');
    assert.strictEqual(fields[0].farmerId, 'farmer_default');
    logPass('1. Canonical Demo Farmer ID & Fields Retrieval');
  } catch (e) {
    logFail('1. Canonical Demo Farmer ID & Fields Retrieval', e);
  }

  // TEST 2: Event Creation (CRUD)
  let createdEventId = null;
  try {
    const newEv = farmDiaryService.createEvent({
      farmerId: 'farmer_default',
      fieldId: 'field_001',
      crop: 'Wheat',
      eventType: 'fertilizer',
      title: 'Applied 40 kg Urea',
      description: 'Applied 40 kg urea to wheat field',
      quantity: 40,
      unit: 'kg',
      date: new Date().toISOString().split('T')[0],
      source: 'manual'
    });

    assert(newEv && newEv.id, 'Created event should have an ID');
    assert.strictEqual(newEv.quantity, 40);
    assert.strictEqual(newEv.crop, 'Wheat');
    createdEventId = newEv.id;
    logPass('2. Farm Diary Event Creation (CRUD)');
  } catch (e) {
    logFail('2. Farm Diary Event Creation (CRUD)', e);
  }

  // TEST 3: Events Retrieval & Filtering
  try {
    const events = farmDiaryService.getEvents('farmer_default', { eventType: 'fertilizer' });
    assert(Array.isArray(events) && events.length > 0, 'Events array should not be empty');
    assert(events.some(e => e.eventType === 'fertilizer'), 'Should contain fertilizer events');
    logPass('3. Events Retrieval & Filter by EventType');
  } catch (e) {
    logFail('3. Events Retrieval & Filter by EventType', e);
  }

  // TEST 4: Natural Language AI Extraction (English)
  try {
    const res = await farmDiaryService.extractEventFromText('Today I applied 40 kg urea to my wheat field.', { language: 'en' });
    assert(res.success && res.draft, 'Extraction should succeed');
    assert.strictEqual(res.draft.eventType, 'fertilizer');
    assert.strictEqual(res.draft.crop, 'Wheat');
    assert.strictEqual(res.draft.quantity, 40);
    logPass('4. Natural Language AI Extraction (English)');
  } catch (e) {
    logFail('4. Natural Language AI Extraction (English)', e);
  }

  // TEST 5: Natural Language AI Extraction (Hindi Devanagari)
  try {
    const res = await farmDiaryService.extractEventFromText('आज मैंने गेहूं के खेत में सिंचाई की है।', { language: 'hi' });
    assert(res.success && res.draft, 'Extraction should succeed');
    assert.strictEqual(res.draft.eventType, 'irrigation');
    assert.strictEqual(res.draft.crop, 'Wheat');
    assert.strictEqual(res.draft.quantity, null, 'Unmentioned quantity must remain null (no hallucination)');
    logPass('5. Natural Language AI Extraction (Hindi Devanagari - No Quantity Hallucination)');
  } catch (e) {
    logFail('5. Natural Language AI Extraction (Hindi Devanagari - No Quantity Hallucination)', e);
  }

  // TEST 6: Natural Language AI Extraction (Hinglish)
  try {
    const res = await farmDiaryService.extractEventFromText('40 kg urea dala wheat me', { language: 'hi' });
    assert(res.success && res.draft, 'Extraction should succeed');
    assert.strictEqual(res.draft.eventType, 'fertilizer');
    assert.strictEqual(res.draft.quantity, 40);
    logPass('6. Natural Language AI Extraction (Hinglish)');
  } catch (e) {
    logFail('6. Natural Language AI Extraction (Hinglish)', e);
  }

  // TEST 7: Farm Memory Query Layer
  try {
    const memory = farmDiaryService.queryFarmMemory('farmer_default', 'fertilizer');
    assert(typeof memory === 'string' && memory.includes('RECORDED FARM DIARY EVENTS'), 'Memory should format recorded events');
    assert(memory.includes('Wheat'), 'Memory should reference Wheat crop');
    logPass('7. Farm Memory Query Layer');
  } catch (e) {
    logFail('7. Farm Memory Query Layer', e);
  }

  // TEST 8: Next Best Action Decision Engine
  try {
    const decision = await farmDiaryService.generateNextBestAction('farmer_default', 'Wheat');
    assert(decision.success && decision.recommendation, 'Decision generation should succeed');
    const rec = decision.recommendation;
    assert(rec.action && rec.reason, 'Recommendation must contain action and reason');
    assert(Array.isArray(rec.basedOn) && rec.basedOn.length > 0, 'Recommendation must explain WHY with basedOn array');
    logPass('8. Next Best Action Decision Engine & Rationale');
  } catch (e) {
    logFail('8. Next Best Action Decision Engine & Rationale', e);
  }

  // TEST 9: Delete Event (CRUD Cleanup)
  try {
    if (createdEventId) {
      const deleted = farmDiaryService.deleteEvent('farmer_default', createdEventId);
      assert.strictEqual(deleted, true, 'Event deletion should return true');
    }
    logPass('9. Event Deletion (CRUD Cleanup)');
  } catch (e) {
    logFail('9. Event Deletion (CRUD Cleanup)', e);
  }

  console.log('\n===================================================================');
  console.log(`  FARM DIARY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
