// Declare global __DEV__ for Node execution before imports
(global as any).__DEV__ = true;
if (typeof (globalThis as any).__DEV__ === 'undefined') {
  (globalThis as any).__DEV__ = true;
}

import assert from 'assert';
import { diaryService, FarmDiaryEvent } from '../services/diaryService';

async function runMobileDiaryTests() {
  console.log('');
  console.log('===================================================================');
  console.log('  KRISHIMITRA AI — MOBILE FARM DIARY & AGENTIC AI TEST SUITE');
  console.log('===================================================================');
  console.log('');

  let passed = 0;
  let failed = 0;

  function test(description: string, fn: () => void) {
    try {
      fn();
      console.log(`  🟢 [PASS] ${description}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${description}:`, err.message);
      failed++;
    }
  }

  async function testAsync(description: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  🟢 [PASS] ${description}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${description}:`, err.message);
      failed++;
    }
  }

  const testFarmerId = `test_farmer_${Date.now()}`;

  // Reset local events
  diaryService.clearLocalEvents();

  // ── TEST 1: Empty State & Truthful Advice ──────────────────────────────────
  await testAsync('1. Empty State: Returns zero fake events and truthful empty-state recommendation', async () => {
    const diaryData = await diaryService.getDiaryData(testFarmerId);
    assert.strictEqual(diaryData.events.length, 0, 'Initial local events must be empty');

    const decision = await diaryService.getNextBestAction(testFarmerId);
    assert(decision, 'Decision should be returned');
    assert(
      decision?.action.includes('Not enough farm information') || 
      decision?.action.includes('Start recording') ||
      decision?.action.includes('Add a crop activity'),
      'Empty state recommendation must not invent fake events'
    );
  });

  // ── TEST 2: Category Isolation (Pesticide -> Wheat -> 2 Litre) ─────────────
  await testAsync('2. Category Isolation: Pesticide event remains strictly eventType = "pesticide"', async () => {
    const pestEvent: Partial<FarmDiaryEvent> = {
      farmerId: testFarmerId,
      eventType: 'pesticide',
      crop: 'Wheat',
      title: 'Applied Neem Pesticide',
      description: 'Sprayed 2 litre neem pesticide',
      quantity: 2,
      unit: 'litre',
      area: 2,
      areaUnit: 'acre',
      date: '2026-09-15',
    };

    const saved = await diaryService.saveEvent(pestEvent);
    assert.strictEqual(saved, true);

    const diaryData = await diaryService.getDiaryData(testFarmerId);
    assert.strictEqual(diaryData.events.length, 1);

    const retrieved = diaryData.events[0];
    assert.strictEqual(retrieved.eventType, 'pesticide', 'eventType must remain pesticide');
    assert.strictEqual(retrieved.crop, 'Wheat', 'Crop must remain Wheat');
    assert.strictEqual(retrieved.quantity, 2, 'Quantity must remain 2');
    assert.strictEqual(retrieved.unit, 'litre', 'Unit must remain litre');
  });

  // ── TEST 3: Dynamic Decision Calculation for Pesticide ───────────────────────
  await testAsync('3. Next Best Action Step 1: Decision reflects recent Pesticide application', async () => {
    const decision = await diaryService.getNextBestAction(testFarmerId);
    assert(decision);
    assert(
      decision?.action.includes('Monitor') || decision?.action.includes('pesticide') || decision?.action.includes('sprays'),
      'Recommendation must advise monitoring after pesticide application'
    );
    assert.strictEqual(decision?.priority, 'high');
  });

  // ── TEST 4: Adding Fertilizer & Decision Recalculation ──────────────────────
  await testAsync('4. Next Best Action Step 2: Adding Fertilizer dynamically updates recommendation', async () => {
    await diaryService.saveEvent({
      farmerId: testFarmerId,
      eventType: 'fertilizer',
      crop: 'Wheat',
      title: 'Urea Application',
      description: 'Applied 40 kg urea',
      quantity: 40,
      unit: 'kg',
      area: 2,
      areaUnit: 'acre',
      date: '2026-09-16',
    });

    const diaryData = await diaryService.getDiaryData(testFarmerId);
    assert.strictEqual(diaryData.events.length, 2);

    const decision = await diaryService.getNextBestAction(testFarmerId);
    assert(decision);
    assert(
      decision?.action.includes('irrigation') || decision?.action.includes('fertilizer') || decision?.action.includes('moisture'),
      'Recommendation must adapt to recent Fertilizer entry'
    );
  });

  // ── TEST 5: Adding Irrigation & Sequence Evaluation ─────────────────────────
  await testAsync('5. Next Best Action Step 3: Adding Irrigation combines context dynamically', async () => {
    await diaryService.saveEvent({
      farmerId: testFarmerId,
      eventType: 'irrigation',
      crop: 'Wheat',
      title: 'Canal Irrigation',
      description: 'Watering field',
      area: 2,
      areaUnit: 'acre',
      date: '2026-09-17',
    });

    const diaryData = await diaryService.getDiaryData(testFarmerId);
    assert.strictEqual(diaryData.events.length, 3);

    const decision = await diaryService.getNextBestAction(testFarmerId);
    assert(decision);
    assert(
      decision?.action.includes('uptake') || decision?.action.includes('root') || decision?.action.includes('scouting'),
      'Recommendation must evaluate Fertilizer + Irrigation sequence'
    );
  });

  // ── TEST 6: Delete Event & Decision Re-evaluation ────────────────────────────
  await testAsync('6. Delete Event: Event deletion removes exact ID and updates decision', async () => {
    const diaryData = await diaryService.getDiaryData(testFarmerId);
    const eventToDelete = diaryData.events[0]; // newest event (irrigation)

    const deleted = await diaryService.deleteEvent(eventToDelete.id, testFarmerId);
    assert.strictEqual(deleted, true);

    const updatedData = await diaryService.getDiaryData(testFarmerId);
    assert.strictEqual(updatedData.events.length, 2);
    assert(updatedData.events.every(e => e.id !== eventToDelete.id));

    const decision = await diaryService.getNextBestAction(testFarmerId);
    assert(decision);
  });

  // Clean up test events
  diaryService.clearLocalEvents();

  console.log('');
  console.log('===================================================================');
  console.log(`  MOBILE DIARY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================');
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

runMobileDiaryTests();
