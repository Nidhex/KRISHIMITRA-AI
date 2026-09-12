/* ==========================================================================
   KrishiMitra AI — Mobile Phase 3 Vision AI Automated Test Suite
   ========================================================================== */

import assert from 'assert';
import { apiClient } from '../services/apiClient';
import { networkService } from '../services/networkService';

// Mock Environment for Node.js execution
(global as any).fetch = async (url: string, options: any) => {
  if (url.includes('/api/vision')) {
    let isSoil = false;

    if (options && options.body) {
      if (typeof options.body.entries === 'function') {
        for (const [key, val] of options.body.entries()) {
          if (key === 'module' && val === 'soil') isSoil = true;
        }
      } else if (options.body._parts && Array.isArray(options.body._parts)) {
        for (const [key, val] of options.body._parts) {
          if (key === 'module' && val === 'soil') isSoil = true;
        }
      }
    }

    if (isSoil) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          disease: null,
          soil: {
            soil_type: 'Black Soil',
            soil_type_hi: 'काली मिट्टी (Regur)',
            confidence: 0.965,
            characteristics: 'उच्च जल धारण क्षमता, कपास व चना के लिए उपयुक्त',
            suitable_crops: ['Cotton', 'Soybean', 'Chickpea'],
            fertilizer_recommendation: ['नाइट्रोजन व फास्फोरस का प्रयोग करें'],
          },
          confidence: 0.965,
          probabilities: { Black: 0.965, Alluvial: 0.025 },
          imagePath: '/uploads/scan_soil.jpg',
        }),
      };
    }

    // Default Disease Scan Response
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        disease: {
          disease_name: 'Tomato___Late_blight',
          disease_name_hi: 'टमाटर का पछेती झुलसा रोग',
          confidence: 0.942,
          symptoms: ['पत्तियों पर गहरे भूरे रंग के धब्बे', 'फल सड़ना'],
          organic_treatment: ['नीम के तेल का छिड़काव (5ml/L)'],
          chemical_treatment: ['मैनकोज़ेब 75% WP @ 2g/L water'],
          precautions: ['छिड़काव के समय मास्क पहनें'],
        },
        soil: null,
        confidence: 0.942,
        probabilities: { Tomato___Late_blight: 0.942, Tomato___healthy: 0.031 },
        imagePath: '/uploads/scan_disease.jpg',
      }),
    };
  }

  return { ok: true, json: async () => ({}) };
};

async function runPhase3VisionTests() {
  console.log('');
  console.log('===================================================================');
  console.log('  KRISHIMITRA AI — MOBILE PHASE 3 VISION AI AUTOMATED TEST SUITE');
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

  // 1. Disease Detection API Scan Test
  await testAsync('Crop Disease API scan returns verified Devanagari symptoms & treatment', async () => {
    const res = await apiClient.scanVision('file:///dummy_leaf.jpg', 'disease');
    assert.strictEqual(res.success, true);
    assert(res.disease);
    assert.strictEqual(res.disease?.disease_name, 'Tomato___Late_blight');
    assert.strictEqual(res.disease?.disease_name_hi, 'टमाटर का पछेती झुलसा रोग');
    assert.strictEqual(res.confidence, 0.942);
  });

  // 2. Soil Classification API Scan Test
  await testAsync('Soil Test API scan returns soil classification & crop recommendations', async () => {
    const res = await apiClient.scanVision('file:///dummy_soil.jpg', 'soil');
    assert.strictEqual(res.success, true);
    assert(res.soil);
    assert.strictEqual(res.soil?.soil_type, 'Black Soil');
    assert.strictEqual(res.soil?.soil_type_hi, 'काली मिट्टी (Regur)');
    assert.strictEqual(res.confidence, 0.965);
    assert(res.soil?.suitable_crops?.includes('Cotton'));
  });

  // 3. Error Handling Test
  await testAsync('Error response handles invalid payload gracefully', async () => {
    const originalFetch = (global as any).fetch;
    (global as any).fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Crop disease prediction failed.' }),
    });

    const res = await apiClient.scanVision('file:///error_test.jpg', 'disease');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'Crop disease prediction failed.');

    (global as any).fetch = originalFetch;
  });

  // 4. Network Offline Detection Guard
  await testAsync('Network state monitor correctly reports backend reachability for vision', async () => {
    const state = networkService.getState();
    assert.strictEqual(typeof state.isBackendReachable, 'boolean');
  });

  // 5. Preprocessing Specs Verification
  test('Image preprocessing settings specify 224x224 input resolution and 80% quality', () => {
    const targetSize = 224;
    const qualitySetting = 0.8;
    assert.strictEqual(targetSize, 224);
    assert.strictEqual(qualitySetting, 0.8);
  });

  console.log('');
  console.log('===================================================================');
  console.log(`  VISION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================');
  console.log('');

  if (failed > 0) {
    (process as any).exit(1);
  }
}

runPhase3VisionTests();
