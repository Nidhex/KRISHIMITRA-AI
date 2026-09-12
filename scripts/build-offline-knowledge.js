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
  pests:       'pests/pests.json',
  soil:        'soil/soil.json',
  fertilizers: 'fertilizers/fertilizers.json',
  irrigation:  'irrigation/irrigation.json',
  schemes:     'schemes/schemes.json',
  weather:     'weather/weather.json',
  pesticides:  'pesticides/pesticides.json',
  mandi:       'mandi/mandi.json',
  faq:         'faq/faq.json'
};

function validateRecord(record, domain) {
  if (!record || typeof record !== 'object') {
    return { valid: false, error: 'Record is not an object' };
  }
  if (!record.id || typeof record.id !== 'string') {
    return { valid: false, error: 'Missing or invalid id' };
  }
  if (!record.title && !record.name) {
    return { valid: false, error: 'Missing title or name' };
  }

  // Security check (Phase 9): Ensure no sensitive API keys/tokens are leaked
  const str = JSON.stringify(record);
  if (/api_key|secret|password|bearer\s+[a-z0-9]/i.test(str)) {
    return { valid: false, error: 'Record contains sensitive key or credentials!' };
  }

  return { valid: true };
}

function buildBundle() {
  console.log('[BUILD] Generating browser offline knowledge bundles...');
  const bundle = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    data: {}
  };

  let totalRecords = 0;
  let domainsLoaded = 0;
  const seenIds = new Set();
  const duplicateIds = [];
  const malformedRecords = [];

  for (const [domain, relPath] of Object.entries(FILE_MAP)) {
    const fullPath = path.join(DB_ROOT, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
        const records = JSON.parse(raw);

        const validRecords = [];
        records.forEach((rec, idx) => {
          const val = validateRecord(rec, domain);
          if (!val.valid) {
            malformedRecords.push({ domain, index: idx, id: rec?.id, error: val.error });
            return;
          }

          if (seenIds.has(rec.id)) {
            duplicateIds.push({ domain, id: rec.id });
          } else {
            seenIds.add(rec.id);
          }

          validRecords.push(rec);
        });

        bundle.data[domain] = validRecords;
        totalRecords += validRecords.length;
        domainsLoaded++;
        console.log(`  ✓ Loaded ${validRecords.length} records for ${domain}`);
      } else {
        console.warn(`  ⚠ Warning: File missing for domain ${domain}: ${fullPath}`);
        bundle.data[domain] = [];
      }
    } catch (err) {
      console.error(`  ✗ Error loading domain ${domain}: ${err.message}`);
      bundle.data[domain] = [];
    }
  }

  if (duplicateIds.length > 0) {
    console.warn(`  ⚠ Warning: Found ${duplicateIds.length} duplicate IDs:`, duplicateIds);
  }
  if (malformedRecords.length > 0) {
    console.warn(`  ⚠ Warning: Found ${malformedRecords.length} malformed records:`, malformedRecords);
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
