/* ==========================================================================
   KrishiMitra AI — Database Service
   Loads ALL JSON files from database/ at startup.
   Provides fuzzy search functions for every domain.
   ========================================================================== */

'use strict';

const path = require('path');
const fs   = require('fs');

// ── Database root (one level up from backend/) ───────────────────────────────
const DB_ROOT = path.join(__dirname, '..', '..', 'database');

// ── In-memory data store ──────────────────────────────────────────────────────
const db = {
  crops:       [],
  diseases:    [],
  pests:       [],
  soil:        [],
  fertilizers: [],
  irrigation:  [],
  schemes:     [],
  weather:     [],
  pesticides:  [],
  mandi:       [],
  faq:         []
};

// ── JSON file map: domain → relative path inside database/ ───────────────────
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

// ── Load all JSON files at startup ───────────────────────────────────────────
function loadAllData() {
  let loaded = 0;
  let failed = 0;

  for (const [domain, relPath] of Object.entries(FILE_MAP)) {
    const fullPath = path.join(DB_ROOT, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, 'utf8')
          .replace(/^\uFEFF/, ''); // strip UTF-8 BOM if present
        db[domain] = JSON.parse(raw);
        loaded++;
        console.log(`  ✓ [DB] Loaded ${db[domain].length} records → ${domain}`);
      } else {
        db[domain] = [];
      }
    } catch (err) {
      failed++;
      console.warn(`  ✗ [DB] Could not load ${relPath}: ${err.message}`);
      db[domain] = []; // graceful fallback
    }
  }

  console.log(`\n  [DB] Database ready — ${loaded} domains loaded, ${failed} failed.\n`);
}

// ── Core fuzzy search ─────────────────────────────────────────────────────────
function searchDomain(domain, query, limit = 5) {
  if (!query || !db[domain]) return db[domain].slice(0, limit);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = db[domain].map(record => {
    const blob = buildSearchBlob(record).toLowerCase();
    const score = terms.reduce((acc, term) => {
      if (blob.includes(term)) acc += 1;
      return acc;
    }, 0);
    return { record, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.record);
}

function buildSearchBlob(record) {
  const parts = [
    record.id          || '',
    record.category    || '',
    record.title       || '',
    record.title_hi    || '',
    record.crop        || '',
    record.topic       || '',
    record.description || '',
    record.description_hi || ''
  ];

  if (record.metadata && typeof record.metadata === 'object') {
    flattenValues(record.metadata, parts);
  }

  return parts.join(' ');
}

function flattenValues(obj, parts) {
  for (const val of Object.values(obj)) {
    if (typeof val === 'string' || typeof val === 'number') {
      parts.push(String(val));
    } else if (Array.isArray(val)) {
      val.forEach(v => {
        if (typeof v === 'string' || typeof v === 'number') {
          parts.push(String(v));
        } else if (typeof v === 'object' && v !== null) {
          flattenValues(v, parts);
        }
      });
    } else if (typeof val === 'object' && val !== null) {
      flattenValues(val, parts);
    }
  }
}

// ── Public search API ─────────────────────────────────────────────────────────
function searchDisease(query, limit = 5) { return searchDomain('diseases', query, limit); }
function searchPest(query, limit = 5) { return searchDomain('pests', query, limit); }
function searchCrop(query, limit = 5) { return searchDomain('crops', query, limit); }
function searchScheme(query, limit = 5) { return searchDomain('schemes', query, limit); }
function searchWeather(query, limit = 5) { return searchDomain('weather', query, limit); }
function searchSoil(query, limit = 5) { return searchDomain('soil', query, limit); }
function searchFertilizer(query, limit = 5) { return searchDomain('fertilizers', query, limit); }
function searchIrrigation(query, limit = 5) { return searchDomain('irrigation', query, limit); }
function searchPesticide(query, limit = 5) { return searchDomain('pesticides', query, limit); }
function searchMandi(query, limit = 5) { return searchDomain('mandi', query, limit); }
function searchFAQ(query, limit = 5) { return searchDomain('faq', query, limit); }

function getAll(domain) { return db[domain] || []; }
function getStats() {
  return Object.fromEntries(Object.entries(db).map(([k, v]) => [k, v.length]));
}

loadAllData();

module.exports = {
  searchDisease,
  searchPest,
  searchCrop,
  searchScheme,
  searchWeather,
  searchSoil,
  searchFertilizer,
  searchIrrigation,
  searchPesticide,
  searchMandi,
  searchFAQ,
  searchDomain,
  getAll,
  getStats
};
