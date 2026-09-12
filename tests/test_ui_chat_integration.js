/* ==========================================================================
   KrishiMitra AI — Real Browser & UI Integration Test Suite
   Simulates full frontend UI call chain:
   User input -> kmSendText() / handleFarmerVoiceQuestion() -> askKrishiMitraBackend()
   -> offline detection -> offlineRAG -> offline-knowledge-bundle -> DOM rendering.
   ========================================================================== */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Mock JSDOM environment
function setupMockBrowser(isOnline = false) {
  const domStore = {
    messages: [],
    inputsDisabled: false
  };

  const elements = {
    'chat-messages-box': {
      appendChild: (el) => {
        domStore.messages.push(el);
      },
      set scrollTop(v) {},
      get scrollTop() { return 0; },
      get scrollHeight() { return 100; },
      innerHTML: ''
    },
    'km-chat-input': {
      value: '',
      disabled: false,
      focus: () => {}
    },
    'km-chat-send-btn': {
      disabled: false,
      style: {}
    },
    'voice-lang-select': {
      value: 'hi-IN'
    },
    'btn-microphone': {
      disabled: false,
      style: {}
    }
  };

  global.window = global;
  global.document = {
    readyState: 'complete',
    getElementById: (id) => elements[id] || null,
    querySelector: (sel) => {
      if (sel === '.farmer-name') return { innerText: 'Ramesh Prasad' };
      if (sel === '.farmer-village') return { innerText: 'Kishanpur, UP' };
      return null;
    },
    createElement: (tag) => {
      const el = {
        tagName: tag,
        className: '',
        innerHTML: '',
        style: {},
        remove: () => {}
      };
      return el;
    },
    addEventListener: () => {},
    head: { appendChild: () => {} }
  };

  let fetchCallCount = 0;
  global.fetch = async (url, opts) => {
    fetchCallCount++;
    if (url.includes('/api/chat')) {
      if (!global.navigator.onLine) {
        throw new Error('NetworkError: Failed to fetch (Device Offline)');
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          reply: "Online AI Answer: Wheat yellowing is caused by rust or nitrogen deficiency.",
          source: 'sarvam',
          model: 'sarvam-105b',
          language: 'hi'
        })
      };
    }
    throw new Error(`Unexpected fetch to ${url}`);
  };

  let currentOnlineState = isOnline;
  if (!global.navigator) {
    global.navigator = {};
  }
  try {
    Object.defineProperty(global.navigator, 'onLine', {
      get: () => currentOnlineState,
      set: (val) => { currentOnlineState = val; },
      configurable: true
    });
  } catch (e) {
    global.navigator.onLine = isOnline;
  }

  global.setOnlineState = (val) => { currentOnlineState = val; };

  global.getFetchCallCount = () => fetchCallCount;
  global.resetFetchCallCount = () => { fetchCallCount = 0; };
  global.domStore = domStore;

  // Load bundle, RAG, and Gemma Chat
  delete require.cache[require.resolve('../js/offline-knowledge-bundle.js')];
  delete require.cache[require.resolve('../js/offlineRAG.js')];
  delete require.cache[require.resolve('../js/gemmaChat.js')];

  require('../js/offline-knowledge-bundle.js');
  const rag = require('../js/offlineRAG.js');
  require('../js/gemmaChat.js');

  return { domStore, rag };
}

async function runIntegrationTests() {
  console.log('\n==================================================');
  console.log('  KrishiMitra UI Integration Test Suite (Offline Bug Fix Validation)');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function runTest(name, fn) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // TEST 1: Devanagari Hindi Question 1 - Wheat Yellow Leaves
  await runTest('Test 1: Hindi Query ("गेहूं में पीली पत्तियां क्यों हो रही हैं और क्या करें?")', async () => {
    setupMockBrowser(false);
    const res = await window.handleFarmerVoiceQuestion('गेहूं में पीली पत्तियां क्यों हो रही हैं और क्या करें?');

    assert.ok(res, 'Must return result object');
    assert.strictEqual(res.source, 'offline_knowledge', 'Source must be offline_knowledge');
    assert.ok(!res.reply.includes('I am currently offline. I can assist you with:'), 'MUST NOT return generic capability message!');
    assert.ok(res.reply.includes('ऑफ़लाइन AI — कृषि मित्र स्थानीय ज्ञान से उत्तर'), 'Must contain offline AI header');
    assert.ok(res.reply.includes('गेहूं') || res.reply.includes('पीली पत्तियां') || res.reply.includes('नाइट्रोजन'), 'Must contain wheat yellow leaves knowledge');
    assert.strictEqual(global.getFetchCallCount(), 0, 'Zero network calls while offline');
  });

  // TEST 2: Devanagari Hindi Question 2 - Black Soil Crops
  await runTest('Test 2: Hindi Query ("काली मिट्टी में कौन सी फसल अच्छी होती है?")', async () => {
    setupMockBrowser(false);
    const res = await window.handleFarmerVoiceQuestion('काली मिट्टी में कौन सी फसल अच्छी होती है?');

    assert.ok(res, 'Must return result object');
    assert.strictEqual(res.source, 'offline_knowledge', 'Source must be offline_knowledge');
    assert.ok(!res.reply.includes('I am currently offline. I can assist you with:'), 'MUST NOT return generic capability message!');
    assert.ok(res.reply.includes('काली मिट्टी') || res.reply.includes('सोयाबीन') || res.reply.includes('कपास'), 'Must contain Black Soil crop knowledge');
    assert.strictEqual(global.getFetchCallCount(), 0, 'Zero network calls while offline');
  });

  // TEST 3: Devanagari Hindi Question 3 - PM Kisan Scheme
  await runTest('Test 3: Hindi Query ("पीएम किसान योजना क्या है?")', async () => {
    setupMockBrowser(false);
    const res = await window.handleFarmerVoiceQuestion('पीएम किसान योजना क्या है?');

    assert.ok(res, 'Must return result object');
    assert.strictEqual(res.source, 'offline_knowledge', 'Source must be offline_knowledge');
    assert.ok(!res.reply.includes('I am currently offline. I can assist you with:'), 'MUST NOT return generic capability message!');
    assert.ok(res.reply.includes('पीएम किसान') || res.reply.includes('6,000') || res.reply.includes('नकद सहायता'), 'Must contain PM-Kisan scheme knowledge');
    assert.strictEqual(global.getFetchCallCount(), 0, 'Zero network calls while offline');
  });

  // TEST 4: English Query
  await runTest('Test 4: English Query ("Why are wheat leaves turning yellow?")', async () => {
    setupMockBrowser(false);
    const res = await window.handleFarmerVoiceQuestion('Why are wheat leaves turning yellow?');

    assert.ok(res, 'Must return result object');
    assert.strictEqual(res.source, 'offline_knowledge', 'Source must be offline_knowledge');
    assert.ok(res.reply.includes('Offline AI — Answer from KrishiMitra'), 'Must return English offline header');
    assert.ok(res.reply.includes('Wheat') || res.reply.includes('Yellow Rust') || res.reply.includes('Nitrogen'), 'Must contain wheat disease info');
  });

  // TEST 5: Romanized Hindi Query -> Devanagari Output Requirement
  await runTest('Test 5: Romanized Hindi Query ("gehu me peeli pattiyan kyu ho rahi hain?") -> Devanagari Response', async () => {
    setupMockBrowser(false);
    const res = await window.handleFarmerVoiceQuestion('gehu me peeli pattiyan kyu ho rahi hain?');

    assert.ok(res, 'Must return result object');
    assert.strictEqual(res.source, 'offline_knowledge', 'Source must be offline_knowledge');
    assert.ok(res.reply.includes('ऑफ़लाइन AI'), 'Must use Devanagari header');
    assert.ok(res.reply.includes('गेहूं') || res.reply.includes('पीली पत्तियां'), 'Must contain Devanagari Hindi text');
    // Ensure no Hinglish in response header or body labels
    assert.ok(!res.reply.includes('Gehu me peeli pattiyan'), 'Must NOT return Hinglish response');
  });

  // TEST 6: Additional Agricultural Queries
  await runTest('Test 6: Additional Queries ("उर्वरक की मात्रा कैसे तय करें?", "धान में ब्लास्ट रोग कैसे नियंत्रित करें?", "मिट्टी की जांच कैसे करें?")', async () => {
    setupMockBrowser(false);

    const q1 = await window.handleFarmerVoiceQuestion('उर्वरक की मात्रा कैसे तय करें?');
    assert.ok(q1.reply.includes('यूरिया') || q1.reply.includes('उर्वरक') || q1.reply.includes('नाइट्रोजन'), 'Must return fertilizer dose guidance');

    const q2 = await window.handleFarmerVoiceQuestion('धान में ब्लास्ट रोग कैसे नियंत्रित करें?');
    assert.ok(q2.reply.includes('धान') || q2.reply.includes('झोंका') || q2.reply.includes('ट्राइसाइक्लाज़ोल'), 'Must return rice blast treatment');

    const q3 = await window.handleFarmerVoiceQuestion('मिट्टी की जांच कैसे करें?');
    assert.ok(q3.reply.includes('मिट्टी') || q3.reply.includes('मृदा स्वास्थ्य'), 'Must return soil testing information');
  });

  // TEST 7: Unknown Query Honest Fallback
  await runTest('Test 7: Unknown Query ("आज चांद पर खेती कैसे करें?") -> Honest Unknown Fallback', async () => {
    setupMockBrowser(false);
    const res = await window.handleFarmerVoiceQuestion('आज चांद पर खेती कैसे करें?');

    assert.ok(res, 'Must return result object');
    assert.ok(res.reply.includes('सटीक उत्तर नहीं मिला'), 'Must return honest unknown message');
    assert.ok(!res.reply.includes('यूरिया') && !res.reply.includes('ट्राइसाइक्लाज़ोल'), 'Must NOT hallucinate agricultural remedies for moon farming!');
  });

  // TEST 8: Online -> Offline -> Online Routing Transition
  await runTest('Test 8: Online -> Offline -> Online Transition Test', async () => {
    // 1. Online
    setupMockBrowser(true);
    const onlineRes = await window.handleFarmerVoiceQuestion('गेहूं में पीली पत्तियां क्यों हो रही हैं?');
    assert.strictEqual(onlineRes.source, 'sarvam', 'Online mode uses Sarvam backend');
    assert.strictEqual(global.getFetchCallCount(), 1, 'Makes 1 network fetch online');

    // 2. Offline
    global.setOnlineState(false);
    global.resetFetchCallCount();

    const offlineRes = await window.handleFarmerVoiceQuestion('गेहूं में पीली पत्तियां क्यों हो रही हैं?');
    assert.strictEqual(offlineRes.source, 'offline_knowledge', 'Offline mode uses local RAG');
    assert.strictEqual(global.getFetchCallCount(), 0, 'Makes 0 network fetches offline');

    // 3. Online again
    global.setOnlineState(true);
    global.resetFetchCallCount();

    const onlineRes2 = await window.handleFarmerVoiceQuestion('गेहूं में पीली पत्तियां क्यों हो रही हैं?');
    assert.strictEqual(onlineRes2.source, 'sarvam', 'Resumed online mode uses Sarvam backend');
    assert.strictEqual(global.getFetchCallCount(), 1, 'Makes 1 network fetch when back online');
  });

  console.log('\n--------------------------------------------------');
  console.log(`  INTEGRATION TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationTests();
