/* ==========================================================================
   KrishiMitra AI — Mobile Phase 2 TypeScript Test Suite
   Automated verification of Mobile Chat, Multilingual System, & Voice Services.
   ========================================================================== */

import assert from 'assert';
import { apiClient } from '../services/apiClient';
import { networkService } from '../services/networkService';
import { storageService } from '../services/storageService';
import { SUPPORTED_LANGUAGES, getTranslation, getLanguageOption } from '../i18n/languages';

// Mock Environment for Node.js execution
(global as any).fetch = async (url: string, options: any) => {
  if (url.includes('/api/health')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'running', version: '1.0.0' }),
    };
  }

  if (url.includes('/api/chat')) {
    const body = JSON.parse(options.body);
    if (body.message === 'FAIL_REQUEST') {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'AI provider error', errorCode: 'AI_FAILED' }),
      };
    }

    if (body.language === 'en') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          reply: 'Wheat crops require 3-4 irrigations at critical growth stages.',
          source: 'sarvam',
          model: 'sarvam-105b',
          language: 'en',
        }),
      };
    }

    // Default Hindi response in Devanagari
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        reply: 'गेहूं में पीली पत्तियां नाइट्रोजन की कमी के कारण हो सकती हैं।',
        source: 'sarvam',
        model: 'sarvam-105b',
        language: 'hi',
      }),
    };
  }

  if (url.includes('/api/voice/call-turn')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        userTranscript: 'गेहूं कब बोना चाहिए?',
        replyText: 'गेहूं की बोआई 15 नवंबर से 25 नवंबर तक करें।',
        audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
        mimeType: 'audio/wav',
        language: 'hi',
      }),
    };
  }

  return { ok: true, json: async () => ({}) };
};

async function runPhase2Tests() {
  console.log('');
  console.log('===================================================================');
  console.log('  KRISHIMITRA AI — MOBILE PHASE 2 AUTOMATED TEST SUITE');
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

  // 1. Language Definitions Test
  test('Support exactly 11 Indian languages + English', () => {
    assert.strictEqual(SUPPORTED_LANGUAGES.length, 11);
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    assert(codes.includes('hi'));
    assert(codes.includes('en'));
    assert(codes.includes('gu'));
    assert(codes.includes('mr'));
    assert(codes.includes('bn'));
    assert(codes.includes('ta'));
    assert(codes.includes('te'));
    assert(codes.includes('kn'));
    assert(codes.includes('ml'));
    assert(codes.includes('pa'));
    assert(codes.includes('or'));
  });

  test('Language native script names display correctly', () => {
    assert.strictEqual(getLanguageOption('hi').nativeName, 'हिन्दी');
    assert.strictEqual(getLanguageOption('gu').nativeName, 'ગુજરાતી');
    assert.strictEqual(getLanguageOption('mr').nativeName, 'मराठी');
  });

  // 2. Storage Persistence Test
  await testAsync('Language preference persists in storageService', async () => {
    await storageService.setLanguage('gu');
    const lang = await storageService.getLanguage();
    assert.strictEqual(lang, 'gu');
    // Reset to Hindi
    await storageService.setLanguage('hi');
  });

  await testAsync('Farmer Profile persists and updates cleanly', async () => {
    const profile = await storageService.getFarmerProfile();
    assert.strictEqual(profile.name, 'Ramesh Prasad');
    const updated = await storageService.saveFarmerProfile({ landSizeAcres: '5.0' });
    assert.strictEqual(updated.landSizeAcres, '5.0');
  });

  // 3. API Chat Endpoints Test
  await testAsync('Hindi query returns Devanagari response from backend', async () => {
    const res = await apiClient.sendChat({ message: 'gehu me peeli pattiyan', language: 'hi' });
    assert.strictEqual(res.success, true);
    assert(res.reply.includes('गेहूं'));
    assert.strictEqual(res.source, 'sarvam');
  });

  await testAsync('English query returns English response from backend', async () => {
    const res = await apiClient.sendChat({ message: 'wheat irrigation', language: 'en' });
    assert.strictEqual(res.success, true);
    assert(res.reply.includes('Wheat'));
    assert.strictEqual(res.language, 'en');
  });

  await testAsync('API error response handles server failure gracefully', async () => {
    const res = await apiClient.sendChat({ message: 'FAIL_REQUEST', language: 'hi' });
    assert.strictEqual(res.success, false);
    assert(res.userError && res.userError.length > 0);
  });

  // 4. Voice Call Turn Mock Test
  await testAsync('Voice call turn endpoint returns transcript and audioBase64', async () => {
    const formData = new Map() as any;
    const res = await apiClient.sendVoiceCallTurn(formData);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.userTranscript, 'गेहूं कब बोना चाहिए?');
    assert.strictEqual(res.replyText, 'गेहूं की बोआई 15 नवंबर से 25 नवंबर तक करें।');
    assert(res.audioBase64 && res.audioBase64.length > 0);
  });

  // 5. Network Reachability Test
  await testAsync('Network service pings backend health check', async () => {
    const state = await networkService.checkReachability();
    assert.strictEqual(state.isDeviceConnected, true);
    assert.strictEqual(state.isBackendReachable, true);
    assert.strictEqual(state.status, 'ONLINE');
  });

  // 6. UI Translation Helper Test
  test('UI translation helper returns localized string', () => {
    const hiTitle = getTranslation('hi', 'assistantTitle');
    assert.strictEqual(hiTitle, 'कृषि मित्र AI सहायक');
    const enTitle = getTranslation('en', 'assistantTitle');
    assert.strictEqual(enTitle, 'KrishiMitra AI Assistant');
  });

  console.log('');
  console.log('===================================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================');
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests();
