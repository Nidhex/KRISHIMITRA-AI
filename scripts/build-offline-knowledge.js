/* ==========================================================================
   KrishiMitra AI — Offline Knowledge Bundle Generator
   Bundles all source-of-truth JSON files from database/ into js/offline-knowledge.json
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const DB_ROOT = path.join(__dirname, '..', 'database');
const OUTPUT_FILE = path.join(__dirname, '..', 'js', 'offline-knowledge.json');

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
  console.log('[BUILD] Generating browser offline knowledge bundle...');
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

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`\n  [SUCCESS] Wrote ${domainsLoaded} domains (${totalRecords} records total) to:\n  ${OUTPUT_FILE}\n`);
  return bundle;
}

if (require.main === module) {
  buildBundle();
}

module.exports = { buildBundle, FILE_MAP, OUTPUT_FILE };
