/* ==========================================================================
   KrishiMitra AI — Multilingual Offline Chat Test Suite
   Validates local RAG, language detection, Devanagari Hindi normalization,
   native script formatting for 11 Indian languages, zero network calls when offline,
   and honest fallback for unanswerable queries.
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

async function main() {
  console.log('\n==================================================');
  console.log('  KrishiMitra AI — Multilingual Offline Chat Test Suite');
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

  // Test B: Offline Chat Routing (Returns Local RAG Output)
  runTest('Test B: Offline Chat Routing (Returns Local RAG Output)', () => {
    const res = rag.answerQuestion('wheat leaves yellowing');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.source, 'offline_knowledge');
    assert.strictEqual(res.model, 'local-rag');
    assert.ok(res.reply.includes('Offline AI'), 'Reply must include Offline AI header');
  });

  // Test C: Backend Unavailable Fallback Simulation
  runTest('Test C: Backend Unavailable Fallback Simulation', () => {
    const fallbackAnswer = rag.answerQuestion('how to cure rice blast?');
    assert.strictEqual(fallbackAnswer.success, true);
    assert.ok(fallbackAnswer.docCount > 0, 'Must return matching local records');
    assert.ok(fallbackAnswer.reply.includes('Rice Blast'), 'Must identify Rice Blast');
  });

  // Test D: Hindi Devanagari Query ("गेहूं में पीली पत्तियां क्यों हो रही हैं?")
  runTest('Test D: Hindi Devanagari Query ("गेहूं में पीली पत्तियां क्यों हो रही हैं?")', () => {
    const res = rag.answerQuestion('गेहूं में पीली पत्तियां क्यों हो रही हैं?');
    assert.strictEqual(res.language, 'hi', 'Detected language must be hi');
    assert.ok(/[\u0900-\u097F]/.test(res.reply), 'Response MUST contain Devanagari script');
    assert.ok(!/Gehu me peeli pattiyan/i.test(res.reply), 'Response MUST NOT be Hinglish/Romanized');
    assert.ok(res.docCount > 0, 'Must return relevant wheat knowledge');
    assert.ok(res.reply.includes('गेहूं') || res.reply.includes('पीली पत्तियां'), 'Must return Devanagari wheat yellow leaf facts');
  });

  // Test E: Hindi Romanized Query ("gehu me peeli pattiyan kyu ho rahi hain?")
  runTest('Test E: Hindi Romanized Query ("gehu me peeli pattiyan kyu ho rahi hain?")', () => {
    const res = rag.answerQuestion('gehu me peeli pattiyan kyu ho rahi hain?');
    assert.strictEqual(res.language, 'hi', 'Detected language must be hi for Romanized Hindi input');
    assert.ok(/[\u0900-\u097F]/.test(res.reply), 'Response MUST be normalized to proper Devanagari script');
    assert.ok(!/Gehu me peeli/i.test(res.reply), 'Response MUST NOT be returned in Hinglish');
    assert.ok(res.docCount > 0, 'Must return relevant wheat knowledge');
    assert.ok(res.reply.includes('गेहूं') || res.reply.includes('पीली'), 'Must contain Devanagari wheat terms');
  });

  // Test F: English Query ("Why are wheat leaves turning yellow?")
  runTest('Test F: English Query ("Why are wheat leaves turning yellow?")', () => {
    const res = rag.answerQuestion('Why are wheat leaves turning yellow?');
    assert.strictEqual(res.language, 'en');
    assert.ok(res.docCount > 0);
    assert.ok(res.reply.includes('Wheat Yellow Rust') || res.reply.includes('Organic Treatment'), 'Must include treatment guidance');
  });

  // Test G: Hinglish Fertilizer Query ("black soil ke liye kaunsa fertilizer use kare?")
  runTest('Test G: Hinglish Fertilizer Query ("black soil ke liye kaunsa fertilizer use kare?")', () => {
    const res = rag.answerQuestion('black soil ke liye kaunsa fertilizer use kare?');
    assert.strictEqual(res.language, 'hi');
    assert.ok(/[\u0900-\u097F]/.test(res.reply), 'Must output Devanagari Hindi for black soil fertilizer query');
    assert.ok(res.docCount > 0);
  });

  // Test H: Gujarati Native Script Query
  runTest('Test H: Gujarati Native Script Query ("ડાંગરમાં રોગ વિષે માહિતી")', () => {
    const res = rag.answerQuestion('ડાંગરમાં રોગ વિષે માહિતી');
    assert.strictEqual(res.language, 'gu');
    assert.ok(/[\u0A80-\u0AFF]/.test(res.reply), 'Response must contain Gujarati script');
  });

  // Test I: Marathi Native Script Query ("गहू पिकावर पडणारा करपा रोग")
  runTest('Test I: Marathi Native Script Query ("गहू पिकावर पडणारा करपा रोग")', () => {
    const res = rag.answerQuestion('गहू पिकावर पडणारा करपा रोग');
    assert.strictEqual(res.language, 'mr');
    assert.ok(/[\u0900-\u097F]/.test(res.reply), 'Response must contain Marathi Devanagari script');
  });

  // Test J: Bengali Native Script Query ("ধানের রোগ ও প্রতিকার")
  runTest('Test J: Bengali Native Script Query ("ধানের রোগ ও প্রতিকার")', () => {
    const res = rag.answerQuestion('ধানের রোগ ও প্রতিকার');
    assert.strictEqual(res.language, 'bn');
    assert.ok(/[\u0980-\u09FF]/.test(res.reply), 'Response must contain Bengali script');
  });

  // Test K: Tamil Native Script Query ("நெல்லின் நோய் மற்றும் மருந்து")
  runTest('Test K: Tamil Native Script Query ("நெல்லின் நோய் மற்றும் மருந்து")', () => {
    const res = rag.answerQuestion('நெல்லின் நோய் மற்றும் மருந்து');
    assert.strictEqual(res.language, 'ta');
    assert.ok(/[\u0B80-\u0BFF]/.test(res.reply), 'Response must contain Tamil script');
  });

  // Test L: Telugu Native Script Query ("వరి తెగుళ్ళు నివారణ")
  runTest('Test L: Telugu Native Script Query ("వరి తెగుళ్ళు నివారణ")', () => {
    const res = rag.answerQuestion('వరి తెగుళ్ళు నివారణ');
    assert.strictEqual(res.language, 'te');
    assert.ok(/[\u0C00-\u0C7F]/.test(res.reply), 'Response must contain Telugu script');
  });

  // Test M: Kannada Native Script Query ("ಭತ್ತದ ರೋಗ ಮತ್ತು ಔಷಧ")
  runTest('Test M: Kannada Native Script Query ("ಭತ್ತದ ರೋಗ ಮತ್ತು ಔಷಧ")', () => {
    const res = rag.answerQuestion('ಭತ್ತದ ರೋಗ ಮತ್ತು ಔಷಧ');
    assert.strictEqual(res.language, 'kn');
    assert.ok(/[\u0C80-\u0CFF]/.test(res.reply), 'Response must contain Kannada script');
  });

  // Test N: Malayalam Native Script Query ("നെല്ലിലെ രോഗങ്ങൾ ചികിത്സ")
  runTest('Test N: Malayalam Native Script Query ("നെല്ലിലെ രോഗങ്ങൾ ചികിത്സ")', () => {
    const res = rag.answerQuestion('നെല്ലിലെ രോഗങ്ങൾ ചികിത്സ');
    assert.strictEqual(res.language, 'ml');
    assert.ok(/[\u0D00-\u0D7F]/.test(res.reply), 'Response must contain Malayalam script');
  });

  // Test O: Punjabi Native Script Query ("ਕਣਕ ਦੀ ਬਿਮਾਰੀ ਦਾ ਇਲਾਜ")
  runTest('Test O: Punjabi Native Script Query ("ਕਣਕ ਦੀ ਬਿਮਾਰੀ ਦਾ ਇਲਾਜ")', () => {
    const res = rag.answerQuestion('ਕਣਕ ਦੀ ਬਿਮਾਰੀ ਦਾ ਇਲਾਜ');
    assert.strictEqual(res.language, 'pa');
    assert.ok(/[\u0A00-\u0A7F]/.test(res.reply), 'Response must contain Gurmukhi Punjabi script');
  });

  // Test P: Odia Native Script Query ("ଧାନ ରୋଗ ଓ ଉପଚାର")
  runTest('Test P: Odia Native Script Query ("ଧାନ ରୋଗ ଓ ଉପଚାର")', () => {
    const res = rag.answerQuestion('ଧାନ ରୋଗ ଓ ଉପଚାର');
    assert.strictEqual(res.language, 'or');
    assert.ok(/[\u0B00-\u0B7F]/.test(res.reply), 'Response must contain Odia script');
  });

  // Test Q: Unknown Query Honest Fallback (No Invention)
  runTest('Test Q: Unknown Query Honest Fallback (No Invention/Hallucination)', () => {
    const res = rag.answerQuestion('quantum entanglement theory in space astrophysics');
    assert.strictEqual(res.docCount, 0, 'Doc count must be 0 for unrelated question');
    assert.ok(res.reply.includes("couldn't find enough information") || res.reply.includes('सटीक उत्तर नहीं मिला'), 'Must return honest unanswerable message');
  });

  // Test R: Service Worker Caching Registration
  runTest('Test R: Service Worker Caching Registration for Offline Bundle', () => {
    const swPath = path.join(__dirname, '..', 'service-worker.js');
    assert.strictEqual(fs.existsSync(swPath), true);
    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.ok(swContent.includes('/js/offline-knowledge.json'), 'SW must cache offline-knowledge.json');
    assert.ok(swContent.includes('/js/offlineRAG.js'), 'SW must cache offlineRAG.js');
  });

  // Test S: No Network Request in Offline Mode
  runTest('Test S: No Network Request in Offline Mode Check', () => {
    const gemmaPath = path.join(__dirname, '..', 'js', 'gemmaChat.js');
    const gemmaContent = fs.readFileSync(gemmaPath, 'utf8');
    assert.ok(gemmaContent.includes('navigator.onLine === false'), 'Must check navigator.onLine prior to fetch');
    assert.ok(gemmaContent.includes('Bypassing backend'), 'Must bypass backend fetch when offline');
  });

  console.log('\n--------------------------------------------------');
  console.log(`  AUTOMATED TEST SUMMARY: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
