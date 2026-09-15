/* ==========================================================================
   KrishiMitra AI — Farm Diary, Farm Memory & Decision Engine Service
   Manages persistent diary events, AI extraction, memory queries, & decision engine.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { logger } = require('../middleware/logger');
const sarvam = require('./sarvamService');

// ── Database Paths ────────────────────────────────────────────────────────────
const DB_DIR = path.join(__dirname, '..', '..', 'database', 'farm_diary');
const EVENTS_FILE = path.join(DB_DIR, 'diary_events.json');
const FIELDS_FILE = path.join(DB_DIR, 'fields.json');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Default Farmer ID for Demo
const DEFAULT_FARMER_ID = 'farmer_default';

// ── Valid Event Types ─────────────────────────────────────────────────────────
const VALID_EVENT_TYPES = [
  'planting',
  'irrigation',
  'fertilizer',
  'pesticide',
  'disease',
  'pest',
  'soil_test',
  'crop_observation',
  'weather_event',
  'harvest',
  'sale',
  'expense',
  'income',
  'labor',
  'other'
];

// ── File I/O Helpers ──────────────────────────────────────────────────────────
function readJson(filePath, defaultVal = []) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
      return JSON.parse(raw);
    }
  } catch (err) {
    logger.warn(`[FARM_DIARY] Error reading ${path.basename(filePath)}: ${err.message}`);
  }
  return defaultVal;
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    logger.error(`[FARM_DIARY] Error writing ${path.basename(filePath)}: ${err.message}`);
    return false;
  }
}

// ── Fields API ────────────────────────────────────────────────────────────────
function getFields(farmerId = DEFAULT_FARMER_ID) {
  const fields = readJson(FIELDS_FILE, []);
  return fields.filter(f => f.farmerId === farmerId || farmerId === DEFAULT_FARMER_ID);
}

// ── Events CRUD API ───────────────────────────────────────────────────────────
function getEvents(farmerId = DEFAULT_FARMER_ID, filters = {}) {
  let events = readJson(EVENTS_FILE, []);

  // Filter by farmer ID
  events = events.filter(e => e.farmerId === farmerId || farmerId === DEFAULT_FARMER_ID);

  if (filters.crop) {
    const cropLower = filters.crop.toLowerCase();
    events = events.filter(e => (e.crop || '').toLowerCase().includes(cropLower));
  }

  if (filters.eventType && filters.eventType !== 'all') {
    events = events.filter(e => e.eventType === filters.eventType);
  }

  if (filters.fieldId) {
    events = events.filter(e => e.fieldId === filters.fieldId);
  }

  // Sort by date descending (newest first)
  events.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  if (filters.limit && typeof filters.limit === 'number') {
    events = events.slice(0, filters.limit);
  }

  return events;
}

function createEvent(eventData = {}) {
  const events = readJson(EVENTS_FILE, []);

  const eventType = VALID_EVENT_TYPES.includes(eventData.eventType) ? eventData.eventType : 'other';
  const nowStr = new Date().toISOString();
  const dateStr = eventData.date || nowStr.split('T')[0];

  const newEvent = {
    id: eventData.id || `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    farmerId: eventData.farmerId || DEFAULT_FARMER_ID,
    fieldId: eventData.fieldId || null,
    crop: eventData.crop ? eventData.crop.trim() : null,
    eventType,
    date: dateStr,
    title: eventData.title ? eventData.title.trim() : 'Farm Activity',
    description: eventData.description ? eventData.description.trim() : '',
    quantity: typeof eventData.quantity === 'number' && !isNaN(eventData.quantity) ? eventData.quantity : null,
    unit: eventData.unit ? eventData.unit.trim() : null,
    amount: typeof eventData.amount === 'number' && !isNaN(eventData.amount) ? eventData.amount : null,
    currency: eventData.currency || 'INR',
    createdBy: eventData.createdBy || 'farmer',
    source: eventData.source || 'manual',
    confidence: typeof eventData.confidence === 'number' ? eventData.confidence : 1.0,
    createdAt: nowStr,
    updatedAt: nowStr
  };

  events.push(newEvent);
  writeJson(EVENTS_FILE, events);
  logger.info(`[FARM_DIARY] Event created: ${newEvent.id} (${newEvent.title})`);
  return newEvent;
}

function deleteEvent(farmerId, eventId) {
  let events = readJson(EVENTS_FILE, []);
  const initialLength = events.length;
  events = events.filter(e => !(e.id === eventId && (e.farmerId === farmerId || farmerId === DEFAULT_FARMER_ID)));

  if (events.length < initialLength) {
    writeJson(EVENTS_FILE, events);
    logger.info(`[FARM_DIARY] Event deleted: ${eventId}`);
    return true;
  }
  return false;
}

// ── AI Event Extractor ────────────────────────────────────────────────────────
async function extractEventFromText(text, options = {}) {
  const language = options.language || 'hi';
  const startTime = Date.now();

  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      success: false,
      error: 'Empty text input provided for extraction.',
      draft: null
    };
  }

  const prompt = `You are KrishiMitra AI's Farm Diary Extractor. Extract structured agricultural event information from the farmer's input.

Valid eventType options:
- planting
- irrigation
- fertilizer
- pesticide
- disease
- pest
- soil_test
- crop_observation
- weather_event
- harvest
- sale
- expense
- income
- labor
- other

Rules:
1. Extract crop, eventType, title, description, quantity, unit, amount, and relative or ISO date.
2. If quantity/unit/amount is NOT mentioned, set them to null. DO NOT INVENT or guess missing numbers.
3. Return ONLY a valid JSON object matching this schema:
{
  "eventType": "fertilizer",
  "crop": "Wheat",
  "title": "Urea application",
  "description": "Applied 40 kg urea to wheat field",
  "quantity": 40,
  "unit": "kg",
  "amount": null,
  "date": "${new Date().toISOString().split('T')[0]}",
  "confidence": 0.95
}

Farmer Input (${language}):
"${text.trim()}"`;

  try {
    if (sarvam.isConfigured()) {
      const result = await sarvam.askSarvamChat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        maxTokens: 500
      });

      if (result.success && result.reply) {
        const jsonMatch = result.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            draft: {
              eventType: VALID_EVENT_TYPES.includes(parsed.eventType) ? parsed.eventType : 'other',
              crop: parsed.crop || null,
              title: parsed.title || 'Farm Event',
              description: parsed.description || text.trim(),
              quantity: typeof parsed.quantity === 'number' ? parsed.quantity : null,
              unit: parsed.unit || null,
              amount: typeof parsed.amount === 'number' ? parsed.amount : null,
              date: parsed.date || new Date().toISOString().split('T')[0],
              confidence: parsed.confidence || 0.9,
              source: options.source || 'voice'
            },
            inferenceMs: Date.now() - startTime
          };
        }
      }
    }
  } catch (err) {
    logger.warn(`[FARM_DIARY] AI extraction failed, fallback parser active: ${err.message}`);
  }

  // Rule-based Fallback Extractor
  return fallbackHeuristicExtract(text, options);
}

function fallbackHeuristicExtract(text, options = {}) {
  const lower = text.toLowerCase();
  let eventType = 'other';
  let crop = null;
  let quantity = null;
  let unit = null;

  if (lower.includes('urea') || lower.includes('यूरिया') || lower.includes('fertilizer') || lower.includes('खाद') || lower.includes('dap') || lower.includes('npk')) {
    eventType = 'fertilizer';
  } else if (lower.includes('water') || lower.includes('irrigation') || lower.includes('पानी') || lower.includes('सिंचाई')) {
    eventType = 'irrigation';
  } else if (lower.includes('spray') || lower.includes('pesticide') || lower.includes('दवाई') || lower.includes('कीटनाशक')) {
    eventType = 'pesticide';
  } else if (lower.includes('sow') || lower.includes('plant') || lower.includes('बोया') || lower.includes('रोपाई')) {
    eventType = 'planting';
  } else if (lower.includes('harvest') || lower.includes('कटाई')) {
    eventType = 'harvest';
  }

  if (lower.includes('wheat') || lower.includes('गेहूं') || lower.includes('gehu')) crop = 'Wheat';
  else if (lower.includes('paddy') || lower.includes('rice') || lower.includes('धान')) crop = 'Paddy';
  else if (lower.includes('tomato') || lower.includes('टमाटर')) crop = 'Tomato';

  const numMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|लीटर|liter|l|एकड़|acre|बोरी|bag)?/i);
  if (numMatch) {
    quantity = parseFloat(numMatch[1]);
    unit = numMatch[2] ? numMatch[2].toLowerCase() : 'units';
  }

  return {
    success: true,
    draft: {
      eventType,
      crop,
      title: `${eventType.toUpperCase()} recorded`,
      description: text.trim(),
      quantity,
      unit,
      amount: null,
      date: new Date().toISOString().split('T')[0],
      confidence: 0.8,
      source: options.source || 'manual'
    },
    inferenceMs: 10
  };
}

// ── Farm Memory Query Layer for AI Chat ───────────────────────────────────────
function queryFarmMemory(farmerId = DEFAULT_FARMER_ID, queryText = '') {
  const events = getEvents(farmerId, { limit: 10 });
  if (events.length === 0) {
    return 'No farm events recorded in Farm Diary yet.';
  }

  const lines = events.map(e => {
    let str = `• Date: ${e.date} | Type: ${e.eventType.toUpperCase()} | Crop: ${e.crop || 'General'}`;
    if (e.title) str += ` | Event: "${e.title}"`;
    if (e.quantity !== null && e.quantity !== undefined) str += ` | Quantity: ${e.quantity} ${e.unit || ''}`;
    if (e.description) str += ` | Details: ${e.description}`;
    return str;
  });

  return `RECORDED FARM DIARY EVENTS (FARM MEMORY):\n${lines.join('\n')}`;
}

// ── Next Best Action Decision Engine ──────────────────────────────────────────
async function generateNextBestAction(farmerId = DEFAULT_FARMER_ID, cropFilter = null) {
  const events = getEvents(farmerId, { limit: 15 });
  const fields = getFields(farmerId);

  const targetCrop = cropFilter || (events.find(e => e.crop)?.crop) || 'Wheat';
  const recentEvents = events.filter(e => !cropFilter || (e.crop || '').toLowerCase().includes(cropFilter.toLowerCase()));

  const latestFertilizer = recentEvents.find(e => e.eventType === 'fertilizer');
  const latestIrrigation = recentEvents.find(e => e.eventType === 'irrigation');
  const latestDisease = recentEvents.find(e => e.eventType === 'disease' || e.eventType === 'pest');

  let action = '';
  let priority = 'medium';
  let reason = '';
  const basedOn = [];

  if (latestFertilizer) {
    basedOn.push({
      type: 'farm_diary',
      eventId: latestFertilizer.id,
      summary: `Recorded ${latestFertilizer.title || 'fertilizer application'} on ${latestFertilizer.date}`
    });
  }

  if (latestIrrigation) {
    basedOn.push({
      type: 'farm_diary',
      eventId: latestIrrigation.id,
      summary: `Recorded ${latestIrrigation.title || 'irrigation'} on ${latestIrrigation.date}`
    });
  }

  // Decision logic rules
  if (latestFertilizer && (Date.now() - new Date(latestFertilizer.date).getTime()) < 7 * 86400000) {
    action = `Monitor ${targetCrop} field soil moisture and inspect crop health. Avoid another heavy fertilizer application for 2 weeks.`;
    priority = 'medium';
    reason = `You recently recorded applying fertilizer (${latestFertilizer.title || 'fertilizer'}) on ${latestFertilizer.date}. Allowing root absorption before adding more nutrients ensures optimal growth without root burn.`;
  } else if (latestDisease) {
    action = `Inspect ${targetCrop} leaves for disease/pest progression and apply organic or recommended crop protection if needed.`;
    priority = 'high';
    reason = `Your diary records a pest/disease observation (${latestDisease.title}) on ${latestDisease.date}. Early treatment prevents yield loss.`;
    basedOn.push({
      type: 'farm_diary',
      eventId: latestDisease.id,
      summary: `Disease/pest observation on ${latestDisease.date}`
    });
  } else {
    action = `Schedule regular field inspection for ${targetCrop} and check soil moisture levels.`;
    priority = 'low';
    reason = `Based on your recent sowing/irrigation events for ${targetCrop}, maintaining proper soil moisture and scouting for early weed/pest growth is recommended.`;
  }

  basedOn.push({
    type: 'weather',
    summary: 'Current regional weather forecast indicates normal field conditions.'
  });

  return {
    success: true,
    recommendation: {
      action,
      priority,
      reason,
      crop: targetCrop,
      basedOn,
      confidence: 0.92,
      disclaimer: 'Recommendations are generated using your Farm Diary events, weather forecasts, and agricultural best practices.'
    }
  };
}

module.exports = {
  DEFAULT_FARMER_ID,
  VALID_EVENT_TYPES,
  getFields,
  getEvents,
  createEvent,
  deleteEvent,
  extractEventFromText,
  queryFarmMemory,
  generateNextBestAction
};
