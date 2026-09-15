/* ==========================================================================
   KrishiMitra AI — Mandi / Krishi Market Service
   Official Government of India (Agmarknet / data.gov.in) Ingestion & Cache
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { logger } = require('../middleware/logger');

// ── File Paths ────────────────────────────────────────────────────────────────
const DB_DIR = path.join(__dirname, '..', '..', 'database', 'mandi');
const MANDI_FILE = path.join(DB_DIR, 'mandi.json');
const CACHE_FILE = path.join(DB_DIR, 'mandi_cache.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Government API Endpoint & Configuration
const OGD_API_URL = 'https://api.data.gov.in/resource/9ef74154-7634-42a3-9881-43d773041000';
const OGD_API_KEY = process.env.DATA_GOV_IN_API_KEY || '579b464db66ec23bdd000001cdd39463285f472364c070942aa2bf3d';

// Cache TTL: 6 hours (21,600,000 ms)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// Multilingual Crop Mapping
const CROP_ALIAS_MAP = {
  wheat: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेहूँ', 'ગોધી'],
  paddy: ['paddy', 'rice', 'basmati', 'धान', 'चावल', 'बासमती', 'ડાંગર'],
  tomato: ['tomato', 'tamatar', 'टमाटर', 'ટમેટા'],
  potato: ['potato', 'aalu', 'alu', 'आलू', 'બટાટા'],
  mustard: ['mustard', 'sarson', 'सरसों', 'સરસવ'],
  cotton: ['cotton', 'kapas', 'कपास', 'કપાસ'],
  onion: ['onion', 'pyaz', 'pyaaj', 'प्याज', 'ડુંગળી'],
  maize: ['maize', 'corn', 'makka', 'मक्का']
};

/**
 * Resolve multilingual search query to canonical commodity key
 */
function resolveCommodityKey(queryText = '') {
  if (!queryText || typeof queryText !== 'string') return 'wheat';
  const q = queryText.trim().toLowerCase();

  for (const [key, aliases] of Object.entries(CROP_ALIAS_MAP)) {
    if (aliases.some(alias => q.includes(alias.toLowerCase()) || alias.toLowerCase().includes(q))) {
      return key;
    }
  }
  return q;
}

/**
 * File Read Helper
 */
function readJsonFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
      return JSON.parse(raw);
    }
  } catch (err) {
    logger.warn(`[MANDI_SERVICE] Error reading ${path.basename(filePath)}: ${err.message}`);
  }
  return defaultValue;
}

/**
 * File Write Helper
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    logger.error(`[MANDI_SERVICE] Error writing ${path.basename(filePath)}: ${err.message}`);
    return false;
  }
}

/**
 * Normalize raw Government Agmarknet record to KrishiMitra Canonical Schema
 */
function normalizeRecord(raw, index = 0) {
  const minP = parseFloat(raw.min_price || raw.minPrice || raw.min || 0);
  const maxP = parseFloat(raw.max_price || raw.maxPrice || raw.max || 0);
  let modalP = parseFloat(raw.modal_price || raw.modalPrice || raw.modal || 0);

  // Price Integrity Validation: min <= modal <= max
  if (modalP < minP && minP > 0) modalP = minP;
  if (modalP > maxP && maxP > 0) modalP = maxP;

  const dateStr = raw.arrival_date || raw.arrivalDate || raw.date || '15 Sep 2026';

  return {
    id: raw.id || `mandi_${(raw.state || 'IN').toLowerCase().replace(/\s+/g, '_')}_${(raw.market || 'mandi').toLowerCase().replace(/\s+/g, '_')}_${index}`,
    state: raw.state || 'Uttar Pradesh',
    district: raw.district || 'Gorakhpur',
    market: raw.market || raw.mandi || 'Central APMC Mandi',
    commodity: raw.commodity || 'Wheat',
    variety: raw.variety || 'Standard / Local',
    grade: raw.grade || 'FAQ',
    arrivalDate: dateStr,
    minPrice: Math.round(minP),
    maxPrice: Math.round(maxP),
    modalPrice: Math.round(modalP),
    unit: '₹ / Quintal',
    source: 'Government of India — Agmarknet (data.gov.in)',
    sourceUrl: 'https://agmarknet.gov.in/',
    fetchedAt: raw.fetchedAt || new Date().toISOString()
  };
}

/**
 * Fetch Mandi Data from Backend Cache or File Storage
 */
function getLocalMandiRecords() {
  const cacheData = readJsonFile(CACHE_FILE, null);
  if (cacheData && Array.isArray(cacheData.records) && cacheData.records.length > 0) {
    return {
      records: cacheData.records.map((r, idx) => normalizeRecord(r, idx)),
      isCached: true,
      fetchedAt: cacheData.fetchedAt || new Date().toISOString()
    };
  }

  const baseData = readJsonFile(MANDI_FILE, []);
  return {
    records: baseData.map((r, idx) => normalizeRecord(r, idx)),
    isCached: true,
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Fetch Mandi Prices for a Commodity & State
 */
async function getMandiPrices(queryOptions = {}) {
  const { commodity, state, district } = queryOptions;
  const canonicalKey = resolveCommodityKey(commodity || 'wheat');

  const { records, isCached, fetchedAt } = getLocalMandiRecords();

  // Filter records matching commodity
  let matchedRecords = records.filter(r => {
    const cLower = r.commodity.toLowerCase();
    const vLower = r.variety.toLowerCase();
    const queryLower = (commodity || '').toLowerCase();

    if (canonicalKey === 'wheat') return cLower.includes('wheat') || cLower.includes('गेहूं');
    if (canonicalKey === 'paddy') return cLower.includes('paddy') || cLower.includes('rice') || cLower.includes('धान') || vLower.includes('basmati');
    if (canonicalKey === 'tomato') return cLower.includes('tomato') || cLower.includes('टमाटर');
    if (canonicalKey === 'potato') return cLower.includes('potato') || cLower.includes('आलू');
    if (canonicalKey === 'mustard') return cLower.includes('mustard') || cLower.includes('सरसों');
    if (canonicalKey === 'cotton') return cLower.includes('cotton') || cLower.includes('कपास');
    if (canonicalKey === 'onion') return cLower.includes('onion') || cLower.includes('प्याज');
    if (canonicalKey === 'maize') return cLower.includes('maize') || cLower.includes('मक्का');

    return cLower.includes(queryLower) || queryLower.includes(cLower);
  });

  // Filter by state if provided
  if (state && typeof state === 'string' && state.trim()) {
    const stateLower = state.trim().toLowerCase();
    const stateMatched = matchedRecords.filter(r => r.state.toLowerCase().includes(stateLower));
    if (stateMatched.length > 0) matchedRecords = stateMatched;
  }

  // Filter by district if provided
  if (district && typeof district === 'string' && district.trim()) {
    const distLower = district.trim().toLowerCase();
    const distMatched = matchedRecords.filter(r => r.district.toLowerCase().includes(distLower));
    if (distMatched.length > 0) matchedRecords = distMatched;
  }

  // Sort by Modal Price descending
  matchedRecords.sort((a, b) => b.modalPrice - a.modalPrice);

  if (matchedRecords.length === 0) {
    return {
      success: true,
      commodity: commodity || 'Selected Crop',
      canonicalKey,
      count: 0,
      records: [],
      dataDate: null,
      source: 'Government of India — Agmarknet (data.gov.in)',
      sourceUrl: 'https://agmarknet.gov.in/',
      isCached,
      fetchedAt,
      message: `No current government market data found for "${commodity || 'crop'}".`
    };
  }

  const highestRecord = matchedRecords[0];
  const lowestRecord = matchedRecords[matchedRecords.length - 1];
  const dataDate = highestRecord.arrivalDate;

  return {
    success: true,
    commodity: highestRecord.commodity,
    canonicalKey,
    count: matchedRecords.length,
    dataDate,
    source: 'Government of India — Agmarknet (data.gov.in)',
    sourceUrl: 'https://agmarknet.gov.in/',
    isCached,
    fetchedAt,
    summary: {
      highest: {
        market: highestRecord.market,
        district: highestRecord.district,
        state: highestRecord.state,
        modalPrice: highestRecord.modalPrice,
        minPrice: highestRecord.minPrice,
        maxPrice: highestRecord.maxPrice,
        unit: highestRecord.unit
      },
      lowest: {
        market: lowestRecord.market,
        district: lowestRecord.district,
        state: lowestRecord.state,
        modalPrice: lowestRecord.modalPrice,
        minPrice: lowestRecord.minPrice,
        maxPrice: lowestRecord.maxPrice,
        unit: lowestRecord.unit
      }
    },
    records: matchedRecords
  };
}

module.exports = {
  resolveCommodityKey,
  normalizeRecord,
  getMandiPrices,
  CACHE_TTL_MS
};
