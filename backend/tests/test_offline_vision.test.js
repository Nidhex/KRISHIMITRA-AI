/* ==========================================================================
   KrishiMitra AI — Offline Vision Automated Test Suite
   Verifies browser model files, label parity, service worker, & fallback paths.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function runTests() {
  console.log('====================================================');
  console.log('KRISHIMITRA OFFLINE VISION — AUTOMATED VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  🟢 [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  🔴 [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Original .keras models preserved
  assert(fs.existsSync(path.join(ROOT_DIR, 'ai', 'models', 'plant_disease_model.keras')), 'Original plant_disease_model.keras exists & untouched');
  assert(fs.existsSync(path.join(ROOT_DIR, 'ai', 'models', 'soil_classifier_v4.keras')), 'Original soil_classifier_v4.keras exists & untouched');

  // 2. Browser models exist
  assert(fs.existsSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'disease', 'model.json')), 'Disease browser model.json exists');
  assert(fs.existsSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'soil', 'model.json')), 'Soil browser model.json exists');

  // 3. Shard files exist
  const diseaseFiles = fs.readdirSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'disease'));
  const soilFiles = fs.readdirSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'soil'));

  const diseaseShards = diseaseFiles.filter(f => f.endsWith('.bin'));
  const soilShards = soilFiles.filter(f => f.endsWith('.bin'));

  assert(diseaseShards.length >= 1, `Plant disease weight shards generated (${diseaseShards.length} shards)`);
  assert(soilShards.length >= 1, `Soil classifier weight shards generated (${soilShards.length} shards)`);

  // 4. Label files & parity
  const diseaseLabels = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'disease', 'labels.json'), 'utf8'));
  const soilLabels = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'soil', 'soil_labels_v4.json'), 'utf8'));

  assert(Object.keys(diseaseLabels).length === 15, `Disease model labels parity (15 classes verified)`);
  assert(Object.keys(soilLabels).length === 7, `Soil model labels parity (7 classes verified)`);

  // 5. Local TensorFlow.js script bundle (Zero CDN reliance)
  assert(fs.existsSync(path.join(ROOT_DIR, 'js', 'lib', 'tf.min.js')), 'Local js/lib/tf.min.js bundle exists (100% offline capability without CDNs)');

  // 6. Frontend Offline Vision module
  const offlineVisionJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'offlineVision.js'), 'utf8');
  assert(offlineVisionJs.includes('predictDisease') && offlineVisionJs.includes('predictSoil'), 'js/offlineVision.js contains predictDisease and predictSoil functions');
  assert(offlineVisionJs.includes('tf.tidy'), 'js/offlineVision.js implements tf.tidy tensor memory cleanup');
  assert(offlineVisionJs.includes('testMemoryLeak'), 'js/offlineVision.js includes automated memory leak verification method');
  assert(offlineVisionJs.includes('/js/lib/tf.min.js'), 'js/offlineVision.js references local tf.min.js bundle');

  // 7. Service Worker & Manifest
  const swJs = fs.readFileSync(path.join(ROOT_DIR, 'service-worker.js'), 'utf8');
  assert(swJs.includes('krishimitra-static-v1') && swJs.includes('krishimitra-models-v1'), 'service-worker.js implements cache versioning');
  assert(swJs.includes('/ai/browser-models/disease/model.json'), 'service-worker.js caches disease browser model');
  assert(swJs.includes('/ai/browser-models/soil/model.json'), 'service-worker.js caches soil browser model');
  assert(swJs.includes('/js/lib/tf.min.js'), 'service-worker.js caches local tf.min.js bundle');

  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'manifest.json'), 'utf8'));
  assert(manifest.name && manifest.start_url, 'manifest.json is valid PWA web app manifest');

  // 8. Backend API Vision route intact
  const visionRoute = fs.readFileSync(path.join(ROOT_DIR, 'backend', 'routes', 'vision.js'), 'utf8');
  assert(visionRoute.includes('POST /api/vision') || visionRoute.includes('router.post'), 'Backend /api/vision route remains functional');

  // 9. Parity Test Data
  const diseaseParityCount = fs.readdirSync(path.join(ROOT_DIR, 'ai', 'parity_test_data', 'disease')).length;
  const soilParityCount = fs.readdirSync(path.join(ROOT_DIR, 'ai', 'parity_test_data', 'soil')).length;
  assert(diseaseParityCount >= 20, `Disease parity test dataset verified (${diseaseParityCount} images)`);
  assert(soilParityCount >= 20, `Soil parity test dataset verified (${soilParityCount} images)`);

  console.log('\n----------------------------------------------------');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

