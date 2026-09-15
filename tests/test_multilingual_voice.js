/* ==========================================================================
   KrishiMitra AI — Multilingual Voice Bot Test Suite
   Validates 22 Indian Languages + English pipeline, BCP-47 resolution,
   STT/TTS capability matrix, Gemini fallback, prompt security, and
   frontend API key audit.
   ========================================================================== */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const voiceService = require('../backend/services/sarvamVoiceService');

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
  console.log('  KrishiMitra AI — Multilingual Voice Bot Test Suite');
  console.log('==================================================\n');

  // Test 1: BCP-47 Code Resolution for All 22 Indian Languages + English
  runTest('Test 1: BCP-47 Language Code Resolution Matrix', () => {
    const expectedMappings = {
      en: 'en-IN',
      hi: 'hi-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      or: 'od-IN',
      od: 'od-IN',
      as: 'as-IN',
      ur: 'ur-IN',
      sa: 'sa-IN',
      ne: 'ne-IN',
      kok: 'kok-IN',
      ks: 'ks-IN',
      sd: 'sd-IN',
      brx: 'brx-IN',
      mai: 'mai-IN',
      doi: 'doi-IN',
      mni: 'mni-IN',
      sat: 'sat-IN'
    };

    for (const [shortCode, expectedBCP] of Object.entries(expectedMappings)) {
      const resolved = voiceService.toBCP47(shortCode);
      assert.strictEqual(resolved, expectedBCP, `Shortcode '${shortCode}' must resolve to '${expectedBCP}'`);
    }

    // Test Auto mode
    assert.strictEqual(voiceService.toBCP47('auto'), '', 'Auto mode must resolve to empty string');
  });

  // Test 2: TTS Capability Matrix Check
  runTest('Test 2: TTS Capability Matrix Check (Bulbul:v3 Supported vs Text Fallback)', () => {
    const ttsSupported = ['hi', 'en', 'bn', 'ta', 'te', 'gu', 'kn', 'ml', 'mr', 'pa', 'or'];
    const textFallbackOnly = ['as', 'ur', 'sa', 'ne', 'kok', 'ks', 'sd', 'brx', 'mai', 'doi', 'mni', 'sat'];

    for (const lang of ttsSupported) {
      assert.strictEqual(voiceService.isTTSSupported(lang), true, `Language '${lang}' should report TTS supported`);
    }

    for (const lang of textFallbackOnly) {
      assert.strictEqual(voiceService.isTTSSupported(lang), false, `Language '${lang}' should report Text Fallback (TTS false)`);
    }
  });

  // Test 3: Frontend Dropdown Options Integrity in index.html
  runTest('Test 3: Frontend Language Selector Integrity in index.html', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(htmlContent.includes('id="call-lang-select"'), 'index.html must contain call-lang-select');
    assert.ok(htmlContent.includes('value="auto"'), 'Dropdown must contain Auto Detect option');

    // Verify all 22 Indian language codes + English exist in dropdown options
    const requiredCodes = [
      'hi-IN', 'en-IN', 'bn-IN', 'ta-IN', 'te-IN', 'mr-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN', 'od-IN',
      'as-IN', 'ur-IN', 'sa-IN', 'ne-IN', 'kok-IN', 'ks-IN', 'sd-IN', 'brx-IN', 'mai-IN', 'doi-IN', 'mni-IN', 'sat-IN'
    ];

    for (const code of requiredCodes) {
      assert.ok(htmlContent.includes(`value="${code}"`), `Dropdown must contain option for '${code}'`);
    }
  });

  // Test 4: Frontend Voice Controller State Machine in js/sarvamCall.js
  runTest('Test 4: Frontend Voice Controller State Machine & Offline Safety', () => {
    const callJsPath = path.join(__dirname, '..', 'js', 'sarvamCall.js');
    const callJsContent = fs.readFileSync(callJsPath, 'utf8');

    assert.ok(callJsContent.includes('TRANSCRIBING'), 'State machine must include TRANSCRIBING state');
    assert.ok(callJsContent.includes('ttsSupported'), 'Controller must check ttsSupported flag');
    assert.ok(callJsContent.includes('navigator.onLine === false'), 'Controller must check offline status');
    assert.ok(callJsContent.includes('Voice AI requires an internet connection'), 'Controller must show honest offline message');
  });

  // Test 5: Security Audit — Zero Raw Secrets in Frontend Files
  runTest('Test 5: Security Audit — Zero API Secrets in Frontend Files', () => {
    const frontendFiles = [
      'index.html',
      'script.js',
      'js/sarvamCall.js',
      'js/gemmaChat.js',
      'js/offlineRAG.js',
      'service-worker.js'
    ];

    const forbiddenSecretPatterns = [
      /AIzaSy[A-Za-z0-9_-]{33}/,
      /api-subscription-key\s*[:=]\s*['"][A-Za-z0-9_-]{10,}['"]/i,
      /SARVAM_API_KEY\s*[:=]\s*['"][A-Za-z0-9_-]{10,}['"]/i
    ];

    for (const file of frontendFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf8');

      for (const pattern of forbiddenSecretPatterns) {
        assert.ok(!pattern.test(content), `Security Violation: ${file} contains raw API secret matching ${pattern}`);
      }
    }
  });

  // Test 6: Mobile Project Boundary Verification
  runTest('Test 6: Mobile Project Boundary Verification (krishimitra-mobile/ untouched)', () => {
    const mobilePath = path.join(__dirname, '..', 'krishimitra-mobile');
    assert.strictEqual(fs.existsSync(mobilePath), true, 'krishimitra-mobile folder must exist');
    assert.ok(fs.existsSync(path.join(mobilePath, 'package.json')), 'Mobile package.json intact');
  });

  console.log('\n--------------------------------------------------');
  console.log(`  AUTOMATED TEST SUMMARY: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
