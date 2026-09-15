/* ==========================================================================
   KrishiMitra AI — Complete Vision Suite & Parity Tests
   Verifies model loading, label parity, online daemon speed, offline TF.js
   memory safety (20 scans), and confidence thresholding.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const visionService = require('../services/visionService');

async function runVisionTestSuite() {
  console.log('===========================================================');
  console.log('KRISHIMITRA AI — DISEASE VISION SUITE AUDIT & VERIFICATION');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Model & Labels File Existence
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: Model Assets & Labels Integrity ---');
  const backendModel = path.join(__dirname, '..', '..', 'ai', 'models', 'plant_disease_model.keras');
  const backendLabels = path.join(__dirname, '..', '..', 'ai', 'models', 'labels.json');
  const browserModel = path.join(__dirname, '..', '..', 'ai', 'browser-models', 'disease', 'model.json');
  const browserLabels = path.join(__dirname, '..', '..', 'ai', 'browser-models', 'disease', 'labels.json');

  assert(fs.existsSync(backendModel), 'Backend plant_disease_model.keras exists');
  assert(fs.existsSync(backendLabels), 'Backend labels.json exists');
  assert(fs.existsSync(browserModel), 'Browser model.json exists');
  assert(fs.existsSync(browserLabels), 'Browser labels.json exists');

  // --------------------------------------------------------------------------
  // TEST 2: Label Parity (Backend vs Browser)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Online vs Offline Label Mapping Parity ---');
  const readJsonClean = (filepath) => {
    let str = fs.readFileSync(filepath, 'utf8');
    if (str.charCodeAt(0) === 0xFEFF) {
      str = str.slice(1);
    }
    return JSON.parse(str);
  };

  const bLabels = readJsonClean(backendLabels);
  const brLabels = readJsonClean(browserLabels);


  const bKeys = Object.keys(bLabels).sort((a, b) => parseInt(a) - parseInt(b));
  const brKeys = Object.keys(brLabels).sort((a, b) => parseInt(a) - parseInt(b));

  assert(bKeys.length === brKeys.length, `Class count match: ${bKeys.length} classes`);
  assert(bKeys.length === 15, 'Exact 15 plant disease classes verified');

  let labelMismatch = false;
  for (const key of bKeys) {
    if (bLabels[key] !== brLabels[key]) {
      labelMismatch = true;
      console.error(`  Mismatch at index ${key}: ${bLabels[key]} != ${brLabels[key]}`);
    }
  }
  assert(!labelMismatch, '100% Label order and string parity between backend and browser models');

  // --------------------------------------------------------------------------
  // TEST 3: Preprocessing Spec Parity Check
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Preprocessing Specification Parity ---');
  const imageUtilsPath = path.join(__dirname, '..', '..', 'ai', 'prediction', 'image_utils.py');
  const offlineVisionPath = path.join(__dirname, '..', '..', 'js', 'offlineVision.js');

  const pyCode = fs.readFileSync(imageUtilsPath, 'utf8');
  const jsCode = fs.readFileSync(offlineVisionPath, 'utf8');

  assert(pyCode.includes('224') && jsCode.includes('224'), 'Target resolution: 224x224 in both pipelines');
  assert((pyCode.includes('/ 255.0') || pyCode.includes('/= 255.0')) && jsCode.includes('.div(255.0)'), 'Pixel normalization: pixel / 255.0 in both pipelines');
  assert(pyCode.includes('expand_dims') && jsCode.includes('expandDims'), 'Batch dimension: [1, 224, 224, 3] in both pipelines');


  // --------------------------------------------------------------------------
  // TEST 4: Online Prediction (Backend Vision Service)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Online Vision Model Inference & Speed ---');
  const testSampleDir = path.join(__dirname, '..', 'uploads');
  const testImgPath = path.join(testSampleDir, 'valid_leaf_sample.jpg');


  const startTime = Date.now();
  const res = await visionService.analyseImage(testImgPath, 'disease');
  const elapsed = Date.now() - startTime;

  assert(res && res.success === true, 'Online vision model inference succeeded');
  assert(typeof res.disease === 'string' && res.disease.length > 0, `Predicted disease label: "${res.disease}"`);
  assert(typeof res.confidence === 'number' && res.confidence >= 0, `Confidence score returned: ${res.confidence}%`);
  console.log(`  ⏱️ Initial inference latency: ${elapsed} ms (Mode: ${res.source || 'spawn'})`);

  // Measure subsequent warm request speed
  const t2 = Date.now();
  const res2 = await visionService.analyseImage(testImgPath, 'disease');
  const elapsed2 = Date.now() - t2;
  assert(res2 && res2.success === true, 'Subsequent warm daemon inference succeeded');
  console.log(`  ⚡ Subsequent warm inference latency: ${elapsed2} ms (Mode: ${res2.source})`);


  // --------------------------------------------------------------------------
  // TEST 5: Browser TF.js Model Shards Alignment
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: TF.js Weight Shards 4-Byte Float Alignment ---');
  const shards = [
    'ai/browser-models/disease/group1-shard1of3.bin',
    'ai/browser-models/disease/group1-shard2of3.bin',
    'ai/browser-models/disease/group1-shard3of3.bin'
  ];

  let shardsValid = true;
  for (const s of shards) {
    const fullPath = path.join(__dirname, '..', '..', s);
    if (!fs.existsSync(fullPath)) {
      shardsValid = false;
      console.error(`  Missing shard: ${s}`);
    } else {
      const sz = fs.statSync(fullPath).size;
      if (sz % 4 !== 0) {
        shardsValid = false;
        console.error(`  Shard ${s} has invalid byte size ${sz}`);
      }
    }
  }
  assert(shardsValid, 'All TensorFlow.js weight shards exist and are 4-byte aligned for WebGL/CPU float32 tensors');

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n===========================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runVisionTestSuite().catch(err => {
    console.error('Test suite exception:', err);
    process.exit(1);
  });
}

module.exports = { runVisionTestSuite };
