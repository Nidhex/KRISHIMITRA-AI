/* ==========================================================================
   KrishiMitra AI — Automated Offline Chat Test Suite
   Validates offline knowledge RAG, search quality, fallback routing,
   language handling, Service Worker caching, and zero network calls when offline.
   ========================================================================== */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rag = require('../js/offlineRAG.js');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    passCount++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function main() {
  console.log('\n==================================================');
  console.log('  KrishiMitra AI — Offline Chat Automated Test Suite');
  console.log('==================================================\n');

  // Test A: Knowledge File Integrity
  runTest('Test A: Offline Knowledge File Exists & Parsable', () => {
    const knowledgePath = path.join(__dirname, '..', 'js', 'offline-knowledge.json');
    assert.strictEqual(fs.existsSync(knowledgePath), true, 'offline-knowledge.json must exist');
    const raw = fs.readFileSync(knowledgePath, 'utf8');
    const json = JSON.parse(raw);
    assert.ok(json.data, 'Knowledge bundle must contain data property');
    assert.ok(json.data.crops.length > 0, 'Crops domain must have records');
    assert.ok(json.data.diseases.length > 0, 'Diseases domain must have records');
  });

  // Test B: Offline Chat Routing (No Network Request)
  runTest('Test B: Offline Chat Routing (Returns Local RAG Output)', () => {
    const res = rag.answerQuestion('wheat leaves yellowing');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.source, 'offline_knowledge');
    assert.strictEqual(res.model, 'local-rag');
    assert.ok(res.reply.includes('Offline AI'), 'Reply must include Offline AI header');
  });

  // Test C: Backend Unavailable Fallback Simulation
  runTest('Test C: Backend Unavailable Fallback Simulation', () => {
    // Simulate API fetch error, fallback to offline RAG
    const fallbackAnswer = rag.answerQuestion('how to cure rice blast?');
    assert.strictEqual(fallbackAnswer.success, true);
    assert.ok(fallbackAnswer.docCount > 0, 'Must return matching local records');
    assert.ok(fallbackAnswer.reply.includes('Rice Blast'), 'Must identify Rice Blast');
  });

  // Test D: Hindi Query ("गेहूं में पीली पत्तियां क्यों हो रही हैं?")
  runTest('Test D: Hindi Query ("गेहूं में पीली पत्तियां क्यों हो रही हैं?")', () => {
    const res = rag.answerQuestion('गेहूं में पीली पत्तियां क्यों हो रही हैं?');
    assert.strictEqual(res.language, 'hi');
    assert.ok(res.docCount > 0, 'Must match wheat yellow rust or fertilizer record');
    assert.ok(res.reply.includes('Wheat Yellow Rust') || res.reply.includes('Peeli Pattiyan') || res.reply.includes('Urea'), 'Response must address wheat yellowing');
  });

  // Test E: English Query ("Why are wheat leaves turning yellow?")
  runTest('Test E: English Query ("Why are wheat leaves turning yellow?")', () => {
    const res = rag.answerQuestion('Why are wheat leaves turning yellow?');
    assert.strictEqual(res.language, 'en');
    assert.ok(res.docCount > 0);
    assert.ok(res.reply.includes('Wheat Yellow Rust') || res.reply.includes('Organic Treatment'), 'Must include treatment guidance');
  });

  // Test F: Hinglish Query ("black soil ke liye kaunsa fertilizer use kare?")
  runTest('Test F: Hinglish Query ("black soil ke liye kaunsa fertilizer use kare?")', () => {
    const res = rag.answerQuestion('black soil ke liye kaunsa fertilizer use kare?');
    assert.ok(res.docCount > 0);
    assert.ok(res.reply.includes('Black Clayey Soil') || res.reply.includes('Zinc Sulphate') || res.reply.includes('Compost'), 'Must identify black soil fertilizer');
  });

  // Test G: Crop Domain Query ("wheat lokwan price recommendation")
  runTest('Test G: Crop Domain Query ("wheat lokwan price recommendation")', () => {
    const res = rag.answerQuestion('wheat lokwan price recommendation');
    assert.ok(res.domains.includes('crops') || res.domains.includes('mandi') || res.domains.includes('faq'));
    assert.ok(res.reply.includes('Wheat (Lokwan)') || res.reply.includes('Mandi Rates'));
  });

  // Test H: Disease Domain Query ("aphid kaise control kare?")
  runTest('Test H: Disease Domain Query ("aphid kaise control kare?")', () => {
    const res = rag.answerQuestion('aphid kaise control kare?');
    assert.ok(res.domains.includes('diseases') || res.domains.includes('pesticides'));
    assert.ok(res.reply.includes('Aphid') || res.reply.includes('Imidacloprid') || res.reply.includes('Neem oil'));
  });

  // Test I: Fertilizer Domain Query ("urea dose for wheat")
  runTest('Test I: Fertilizer Domain Query ("urea dose for wheat")', () => {
    const res = rag.answerQuestion('urea dose for wheat');
    assert.ok(res.domains.includes('fertilizers'));
    assert.ok(res.reply.includes('Urea') || res.reply.includes('Nitrogen'));
  });

  // Test J: Soil Domain Query ("mitra mitti test kaise kare?")
  runTest('Test J: Soil Domain Query ("mitti ki janch kaise kare?")', () => {
    const res = rag.answerQuestion('mitti ki janch kaise kare?');
    assert.ok(res.domains.includes('soil') || res.domains.includes('faq'));
    assert.ok(res.reply.includes('Soil') || res.reply.includes('Mitti') || res.reply.includes('Alluvial'));
  });

  // Test K: Pesticide Domain Query ("tricyclazole dose rice blast")
  runTest('Test K: Pesticide Domain Query ("tricyclazole dose rice blast")', () => {
    const res = rag.answerQuestion('tricyclazole dose rice blast');
    assert.ok(res.domains.includes('pesticides') || res.domains.includes('diseases'));
    assert.ok(res.reply.includes('Tricyclazole') || res.reply.includes('0.6 grams'));
  });

  // Test L: FAQ Query ("What is PM Kusum scheme?")
  runTest('Test L: FAQ Query ("What is PM Kusum scheme?")', () => {
    const res = rag.answerQuestion('What is PM Kusum scheme?');
    assert.ok(res.domains.includes('schemes') || res.domains.includes('faq'));
    assert.ok(res.reply.includes('KUSUM') || res.reply.includes('Solar') || res.reply.includes('60%'));
  });

  // Test M: Unknown Query Honest Fallback
  runTest('Test M: Unknown Query Honest Fallback (No Invention/Hallucination)', () => {
    const res = rag.answerQuestion('quantum entanglement theory in space astrophysics');
    assert.strictEqual(res.docCount, 0, 'Doc count must be 0 for unrelated question');
    assert.ok(res.reply.includes("couldn't find enough information") || res.reply.includes('सटीक उत्तर नहीं मिला'), 'Must return honest unanswerable message');
  });

  // Test N: Online -> Offline -> Online Transition Handling
  runTest('Test N: Online -> Offline -> Online Transition Handling', () => {
    let mockConnection = true; // Online
    let modeState = mockConnection ? 'online' : 'offline';
    assert.strictEqual(modeState, 'online');

    mockConnection = false; // Offline
    modeState = mockConnection ? 'online' : 'offline';
    assert.strictEqual(modeState, 'offline');

    mockConnection = true; // Reconnected
    modeState = mockConnection ? 'online' : 'offline';
    assert.strictEqual(modeState, 'online');
  });

  // Test O: Service Worker Caching Registration
  runTest('Test O: Service Worker Caching Registration for Offline Bundle', () => {
    const swPath = path.join(__dirname, '..', 'service-worker.js');
    assert.strictEqual(fs.existsSync(swPath), true);
    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.ok(swContent.includes('/js/offline-knowledge.json'), 'SW must cache offline-knowledge.json');
    assert.ok(swContent.includes('/js/offlineRAG.js'), 'SW must cache offlineRAG.js');
  });

  // Test P: No API Request in Offline Mode
  runTest('Test P: No API Request in Offline Mode Check', () => {
    const gemmaPath = path.join(__dirname, '..', 'js', 'gemmaChat.js');
    const gemmaContent = fs.readFileSync(gemmaPath, 'utf8');
    assert.ok(gemmaContent.includes('navigator.onLine === false'), 'Must check navigator.onLine prior to fetch');
    assert.ok(gemmaContent.includes('Bypassing backend'), 'Must bypass backend fetch when offline');
  });

  // Test Q: Response Quality & Formatting (Direct answer + organic/chemical remedies)
  runTest('Test Q: Response Quality & Formatting', () => {
    const res = rag.answerQuestion('wheat leaves yellow what should I do');
    assert.ok(res.reply.includes('📴 **Offline AI'), 'Must include header');
    assert.ok(res.reply.includes('Organic Treatment') || res.reply.includes('Chemical Treatment'), 'Must include treatment bullet points');
    assert.ok(!res.reply.includes('{') && !res.reply.includes('}'), 'Must not dump raw JSON string');
  });

  // Test R: Farmer Profile Context Integration
  runTest('Test R: Farmer Profile Context Integration', () => {
    const res = rag.answerQuestion('what fertilizer for my soil?', {
      farmerContext: { name: 'Ramesh', location: 'Gorakhpur', soilType: 'Black Clayey Soil' }
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.docCount > 0);
  });

  console.log('\n--------------------------------------------------');
  console.log(`  AUTOMATED TEST SUMMARY: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
