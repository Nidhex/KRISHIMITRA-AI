/* ==========================================================================
   KrishiMitra AI — Offline Knowledge Bundle Generator
   Bundles all source-of-truth JSON files from database/ into:
   1. js/offline-knowledge.json
   2. js/offline-knowledge-bundle.js (Synchronous browser bundle)
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const DB_ROOT = path.join(__dirname, '..', 'database');
const OUTPUT_JSON = path.join(__dirname, '..', 'js', 'offline-knowledge.json');
const OUTPUT_JS = path.join(__dirname, '..', 'js', 'offline-knowledge-bundle.js');

const FILE_MAP = {
  crops:       'crops/crops.json',
  diseases:    'diseases/diseases.json',
  schemes:     'schemes/schemes.json',
  weather:     'weather/weather.json',
  soil:        'soil/soil.json',
  fertilizers: 'fertilizers/fertilizers.json',
  pesticides:  'pesticides/pesticides.json',
  mandi:       'mandi/mandi.json',
  faq:         'faq/faq.json'
};

function buildBundle() {
  console.log('[BUILD] Generating browser offline knowledge bundles...');
  const bundle = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    data: {}
  };

  let totalRecords = 0;
  let domainsLoaded = 0;

  for (const [domain, relPath] of Object.entries(FILE_MAP)) {
    const fullPath = path.join(DB_ROOT, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
        const records = JSON.parse(raw);
        bundle.data[domain] = records;
        totalRecords += records.length;
        domainsLoaded++;
        console.log(`  ✓ Loaded ${records.length} records for ${domain}`);
      } else {
        console.warn(`  ⚠ Warning: File missing for domain ${domain}: ${fullPath}`);
        bundle.data[domain] = [];
      }
    } catch (err) {
      console.error(`  ✗ Error loading domain ${domain}: ${err.message}`);
      bundle.data[domain] = [];
    }
  }

  // 1. Write JSON file
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(bundle, null, 2), 'utf8');

  // 2. Write synchronous JS bundle file
  const jsContent = `/* Auto-generated synchronous offline knowledge bundle */\nwindow.KRISHI_OFFLINE_KNOWLEDGE_BUNDLE = ${JSON.stringify(bundle.data, null, 2)};\n`;
  fs.writeFileSync(OUTPUT_JS, jsContent, 'utf8');

  console.log(`\n  [SUCCESS] Wrote ${domainsLoaded} domains (${totalRecords} records total) to:\n  - ${OUTPUT_JSON}\n  - ${OUTPUT_JS}\n`);
  return bundle;
}

if (require.main === module) {
  buildBundle();
}

module.exports = { buildBundle, FILE_MAP, OUTPUT_JSON, OUTPUT_JS };
