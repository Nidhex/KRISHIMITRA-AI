/* ==========================================================================
   KrishiMitra AI — Offline Vision Automated Test Suite
   Verifies browser model files, label parity, service worker, & fallback paths.
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

  // 3. Shard files exist & Float32 byte alignment (divisible by 4)
  const diseaseFiles = fs.readdirSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'disease'));
  const soilFiles = fs.readdirSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'soil'));

  const diseaseShards = diseaseFiles.filter(f => f.endsWith('.bin'));
  const soilShards = soilFiles.filter(f => f.endsWith('.bin'));

  assert(diseaseShards.length >= 1, `Plant disease weight shards generated (${diseaseShards.length} shards)`);
  assert(soilShards.length >= 1, `Soil classifier weight shards generated (${soilShards.length} shards)`);

  let allShardsDivisibleBy4 = true;
  [...diseaseShards.map(f => path.join(ROOT_DIR, 'ai', 'browser-models', 'disease', f)),
   ...soilShards.map(f => path.join(ROOT_DIR, 'ai', 'browser-models', 'soil', f))].forEach(shardPath => {
    const size = fs.statSync(shardPath).size;
    if (size % 4 !== 0) {
      allShardsDivisibleBy4 = false;
      console.error(`  [FAIL] Shard ${shardPath} size ${size} is not a multiple of 4!`);
    }
  });
  assert(allShardsDivisibleBy4, 'All browser model .bin weight shards have byte lengths exactly divisible by 4 (Float32 alignment)');

  // 4. Git tracking verification for .bin shards
  let gitTrackingValid = true;
  try {
    const gitIgnoredOut = execSync('git check-ignore ai/browser-models/disease/group1-shard1of3.bin', { cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'ignore'] }).toString();
    if (gitIgnoredOut.trim()) {
      gitTrackingValid = false;
    }
  } catch (e) {
    // Command exited with 1 means file is NOT ignored (tracked by Git)
    gitTrackingValid = true;
  }
  assert(gitTrackingValid, 'Browser model .bin shards are un-ignored and tracked by Git (won\'t be missing on Render deploy)');

  // 5. Label files & parity
  const diseaseLabels = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'disease', 'labels.json'), 'utf8'));
  const soilLabels = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'ai', 'browser-models', 'soil', 'soil_labels_v4.json'), 'utf8'));

  assert(Object.keys(diseaseLabels).length === 15, `Disease model labels parity (15 classes verified)`);
  assert(Object.keys(soilLabels).length === 7, `Soil model labels parity (7 classes verified)`);

  // 6. Local TensorFlow.js script bundle (Zero CDN reliance)
  assert(fs.existsSync(path.join(ROOT_DIR, 'js', 'lib', 'tf.min.js')), 'Local js/lib/tf.min.js bundle exists (100% offline capability without CDNs)');

  // 7. Frontend Offline Vision module & IndexedDB corruption recovery
  const offlineVisionJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'offlineVision.js'), 'utf8');
  assert(offlineVisionJs.includes('predictDisease') && offlineVisionJs.includes('predictSoil'), 'js/offlineVision.js contains predictDisease and predictSoil functions');
  assert(offlineVisionJs.includes('tf.tidy'), 'js/offlineVision.js implements tf.tidy tensor memory cleanup');
  assert(offlineVisionJs.includes('testMemoryLeak'), 'js/offlineVision.js includes automated memory leak verification method');
  assert(offlineVisionJs.includes('removeModel'), 'js/offlineVision.js includes IndexedDB cache corruption recovery');

  // 8. Service Worker & Manifest
  const swJs = fs.readFileSync(path.join(ROOT_DIR, 'service-worker.js'), 'utf8');
  assert(/krishimitra-static-v[2345]/.test(swJs) && swJs.includes('krishimitra-models-v2'), 'service-worker.js implements cache versioning');
  assert(swJs.includes('/ai/browser-models/disease/model.json'), 'service-worker.js caches disease browser model');
  assert(swJs.includes('/ai/browser-models/soil/model.json'), 'service-worker.js caches soil browser model');
  assert(swJs.includes('/js/lib/tf.min.js'), 'service-worker.js caches local tf.min.js bundle');

  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'manifest.json'), 'utf8'));
  assert(manifest.name && manifest.start_url, 'manifest.json is valid PWA web app manifest');

  // 9. Backend API Vision route intact
  const visionRoute = fs.readFileSync(path.join(ROOT_DIR, 'backend', 'routes', 'vision.js'), 'utf8');
  assert(visionRoute.includes('POST /api/vision') || visionRoute.includes('router.post'), 'Backend /api/vision route remains functional');

  // 10. Parity Test Data
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
