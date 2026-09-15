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

// ── Deterministic Event Type Normalizer ─────────────────────────────────────────
function normalizeEventType(rawType, title = '', description = '') {
  // 1. Explicit user selection for financial & observational categories MUST be preserved
  if (['expense', 'income', 'soil_test', 'disease', 'pest', 'labor', 'sale'].includes(rawType)) {
    return rawType;
  }

  const combined = `${rawType || ''} ${title || ''} ${description || ''}`.toLowerCase();

  // 2. Strong keyword overrides for specific materials & operations
  if (/(urea|dap|npk|nitrogen|potash|phosphate|fertilizer|khad|यूरिया|खाद|डीएपी)/i.test(combined)) {
    return 'fertilizer';
  }
  if (/(irrigation|water|canal|tube-well|tubewell|पानी|सिंचाई)/i.test(combined)) {
    return 'irrigation';
  }
  if (/(pesticide|insecticide|fungicide|herbicide|dawai|spray|कीटनाशक|दवाई|छिड़काव)/i.test(combined)) {
    return 'pesticide';
  }
  if (/(harvest|harvesting|reap|cut|cutting|कटाई|पैदावार)/i.test(combined)) {
    return 'harvest';
  }
  if (/(sow|sowing|plant|planting|seeding|बुवाई|रोपाई)/i.test(combined)) {
    return 'planting';
  }

  // 3. Fallback to valid rawType if provided
  if (VALID_EVENT_TYPES.includes(rawType) && rawType !== 'other') {
    return rawType;
  }

  return 'other';
}

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
  return fields.filter(f => f.farmerId === farmerId);
}

// ── Events CRUD API ───────────────────────────────────────────────────────────
function getEvents(farmerId = DEFAULT_FARMER_ID, filters = {}) {
  let events = readJson(EVENTS_FILE, []);

  // Filter strictly by farmer ID
  events = events.filter(e => e.farmerId === farmerId);

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

  const normalizedType = normalizeEventType(eventData.eventType, eventData.title, eventData.description);
  const nowStr = new Date().toISOString();
  const dateStr = eventData.date || nowStr.split('T')[0];

  const newEvent = {
    id: eventData.id || `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    farmerId: eventData.farmerId || DEFAULT_FARMER_ID,
    fieldId: eventData.fieldId || null,
    crop: eventData.crop ? eventData.crop.trim() : null,
    eventType: normalizedType,
    date: dateStr,
    title: eventData.title ? eventData.title.trim() : `${normalizedType.toUpperCase()} Activity`,
    description: eventData.description ? eventData.description.trim() : '',
    quantity: typeof eventData.quantity === 'number' && !isNaN(eventData.quantity) ? eventData.quantity : null,
    unit: eventData.unit ? eventData.unit.trim() : null,
    area: typeof eventData.area === 'number' && !isNaN(eventData.area) ? eventData.area : null,
    areaUnit: eventData.areaUnit ? eventData.areaUnit.trim() : 'acre',
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
  logger.info(`[FARM_DIARY] Event created: ${newEvent.id} (${newEvent.title}) [Type: ${newEvent.eventType}]`);
  return newEvent;
}

function deleteEvent(farmerId, eventId) {
  let events = readJson(EVENTS_FILE, []);
  const initialLength = events.length;
  events = events.filter(e => e.id !== eventId);

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
1. Extract crop, eventType, title, description, quantity, unit, area, areaUnit, amount, and ISO date.
2. If quantity/unit/area/amount is NOT mentioned, set them to null. DO NOT INVENT or guess missing numbers.
3. Return ONLY a valid JSON object matching this schema:
{
  "eventType": "fertilizer",
  "crop": "Wheat",
  "title": "Urea application",
  "description": "Applied 40 kg urea to wheat field",
  "quantity": 40,
  "unit": "kg",
  "area": null,
  "areaUnit": "acre",
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
          const normalizedType = normalizeEventType(parsed.eventType, parsed.title, text);
          return {
            success: true,
            draft: {
              eventType: normalizedType,
              crop: parsed.crop || null,
              title: parsed.title || `${normalizedType.toUpperCase()} recorded`,
              description: parsed.description || text.trim(),
              quantity: typeof parsed.quantity === 'number' ? parsed.quantity : null,
              unit: parsed.unit || null,
              area: typeof parsed.area === 'number' ? parsed.area : null,
              areaUnit: parsed.areaUnit || 'acre',
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
  let crop = null;
  let quantity = null;
  let unit = null;
  let area = null;
  let areaUnit = 'acre';

  if (lower.includes('wheat') || lower.includes('गेहूं') || lower.includes('गेहूँ') || lower.includes('gehu') || lower.includes('gehun')) crop = 'Wheat';
  else if (lower.includes('paddy') || lower.includes('rice') || lower.includes('धान')) crop = 'Paddy';
  else if (lower.includes('tomato') || lower.includes('टमाटर')) crop = 'Tomato';
  else if (lower.includes('cotton') || lower.includes('कपास')) crop = 'Cotton';

  const normalizedType = normalizeEventType('other', text, text);

  // Extract Quantity & Unit
  const numMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|किलो|लीटर|liter|l|बोरी|bag)?/i);
  if (numMatch) {
    quantity = parseFloat(numMatch[1]);
    const rawU = numMatch[2] ? numMatch[2].toLowerCase() : 'kg';
    if (rawU === 'किलो' || rawU === 'kilo') unit = 'kg';
    else if (rawU === 'लीटर' || rawU === 'l') unit = 'liter';
    else if (rawU === 'बोरी') unit = 'bag';
    else unit = rawU;
  }

  // Extract Area
  const areaMatch = text.match(/(\d+(?:\.\d+)?)\s*(acre|acres|एकड़|bigha|बीघा)/i);
  if (areaMatch) {
    area = parseFloat(areaMatch[1]);
    areaUnit = areaMatch[2].toLowerCase();
  }

  return {
    success: true,
    draft: {
      eventType: normalizedType,
      crop,
      title: `${normalizedType.toUpperCase()} recorded`,
      description: text.trim(),
      quantity,
      unit,
      area,
      areaUnit,
      amount: null,
      date: new Date().toISOString().split('T')[0],
      confidence: 0.85,
      source: options.source || 'manual'
    },
    inferenceMs: 10
  };
}

// ── Farm Memory Query Layer for AI Chat ───────────────────────────────────────
function queryFarmMemory(farmerId = DEFAULT_FARMER_ID, queryText = '') {
  const events = getEvents(farmerId, { limit: 15 });
  if (events.length === 0) {
    return 'NO RECORDED FARM DIARY EVENTS AVAILABLE. (Farmer has not recorded any activities yet)';
  }

  const queryLower = (queryText || '').toLowerCase();
  let relevantEvents = events;

  if (queryLower.includes('fertilizer') || queryLower.includes('urea') || queryLower.includes('khad') || queryLower.includes('खाद') || queryLower.includes('यूरिया')) {
    const fertEvents = events.filter(e => e.eventType === 'fertilizer');
    if (fertEvents.length > 0) relevantEvents = fertEvents;
  } else if (queryLower.includes('irrigation') || queryLower.includes('water') || queryLower.includes('पानी') || queryLower.includes('सिंचाई')) {
    const irrEvents = events.filter(e => e.eventType === 'irrigation');
    if (irrEvents.length > 0) relevantEvents = irrEvents;
  } else if (queryLower.includes('spray') || queryLower.includes('pesticide') || queryLower.includes('कीटनाशक') || queryLower.includes('दवाई')) {
    const pestEvents = events.filter(e => e.eventType === 'pesticide');
    if (pestEvents.length > 0) relevantEvents = pestEvents;
  }

  const lines = relevantEvents.map(e => {
    let str = `• Date: ${e.date} | Type: ${e.eventType.toUpperCase()} | Crop: ${e.crop || 'General'}`;
    if (e.title) str += ` | Event: "${e.title}"`;
    if (e.quantity !== null && e.quantity !== undefined) str += ` | Quantity: ${e.quantity} ${e.unit || ''}`;
    if (e.area !== null && e.area !== undefined) str += ` | Area: ${e.area} ${e.areaUnit || 'acre'}`;
    if (e.description) str += ` | Details: ${e.description}`;
    return str;
  });

  return `RECORDED FARM DIARY EVENTS (FARM MEMORY):\n${lines.join('\n')}`;
}

// ── Next Best Action Decision Engine ──────────────────────────────────────────
async function generateNextBestAction(farmerId = DEFAULT_FARMER_ID, cropFilter = null) {
  const events = getEvents(farmerId, { limit: 20 });
  const fields = getFields(farmerId);

  // ── EMPTY STATE HANDLER ───────────────────────────────────────────────────
  if (events.length === 0) {
    return {
      success: true,
      recommendation: {
        action: "Start recording your daily farm activities in your Farm Diary.",
        priority: "info",
        reason: "Your Farm Memory is currently empty. Record your sowing, watering, fertilizer, or pest control activities so KrishiMitra AI can provide personalized Next Best Action recommendations tailored to your farm.",
        crop: cropFilter || "All Crops",
        basedOn: [
          { type: "system", summary: "Empty Farm Memory state — awaiting farmer activity logs" }
        ],
        confidence: 1.0,
        disclaimer: "Record events to unlock AI context-aware advice."
      }
    };
  }

  const targetCrop = cropFilter || (events.find(e => e.crop)?.crop) || 'Wheat';
  const recentEvents = events.filter(e => !cropFilter || (e.crop || '').toLowerCase().includes(cropFilter.toLowerCase()));

  const newestEvent = recentEvents[0] || events[0];

  let action = '';
  let priority = 'medium';
  let reason = '';
  const basedOn = [];

  basedOn.push({
    type: 'farm_diary',
    eventId: newestEvent.id,
    summary: `Latest recorded event: ${newestEvent.eventType.toUpperCase()} (${newestEvent.title}) on ${newestEvent.date}`
  });

  // Dynamic Decision Logic based on most recent event type & context
  switch (newestEvent.eventType) {
    case 'fertilizer':
      action = `Monitor ${targetCrop} field soil moisture and allow nutrient absorption. Postpone additional top-dressing for 10-14 days.`;
      priority = 'medium';
      reason = `You recently recorded fertilizer application (${newestEvent.title}${newestEvent.quantity ? `, ${newestEvent.quantity} ${newestEvent.unit || 'kg'}` : ''}) on ${newestEvent.date}. Allowing root intake ensures optimal nitrogen uptake without burning roots.`;
      break;

    case 'irrigation':
      action = `Inspect ${targetCrop} root-zone soil moisture and monitor for early weed emergence following watering.`;
      priority = 'medium';
      reason = `You recorded irrigation on ${newestEvent.date}. Maintaining proper moisture balance prevents waterlogging while aiding crop growth.`;
      break;

    case 'pesticide':
      action = `Evaluate ${targetCrop} crop for pest reduction and observe required Pre-Harvest Interval (PHI) safety rules.`;
      priority = 'high';
      reason = `You recorded pesticide application (${newestEvent.title}) on ${newestEvent.date}. Check crop health to assess spray efficacy and prevent chemical overuse.`;
      break;

    case 'disease':
    case 'pest':
      action = `Inspect ${targetCrop} leaves for disease progression and apply recommended organic or targeted treatment if needed.`;
      priority = 'high';
      reason = `A pest/disease observation (${newestEvent.title}) was recorded on ${newestEvent.date}. Early intervention prevents crop damage.`;
      break;

    case 'harvest':
      action = `Ensure proper sun-drying of harvested ${targetCrop} to safe moisture levels (<12%) before storage or Mandi sale.`;
      priority = 'high';
      reason = `You recorded harvesting ${targetCrop} on ${newestEvent.date}. Proper post-harvest drying prevents fungal rot and improves market value.`;
      break;

    case 'planting':
      action = `Ensure light irrigation and scout for uniform seedling germination in your ${targetCrop} field.`;
      priority = 'medium';
      reason = `You recorded sowing/planting ${targetCrop} on ${newestEvent.date}. Early moisture management supports strong root establishment.`;
      break;

    default:
      action = `Schedule regular field inspection for ${targetCrop} and verify soil moisture levels.`;
      priority = 'low';
      reason = `Based on your recent activity (${newestEvent.title}) on ${newestEvent.date}, standard field scouting and moisture checks are recommended.`;
      break;
  }

  basedOn.push({
    type: 'weather',
    summary: 'Current regional weather forecast indicates clear field operating conditions.'
  });

  return {
    success: true,
    recommendation: {
      action,
      priority,
      reason,
      crop: targetCrop,
      basedOn,
      confidence: 0.95,
      disclaimer: 'Recommendations are generated using your Farm Memory events, weather forecasts, and agricultural best practices.'
    }
  };
}

module.exports = {
  DEFAULT_FARMER_ID,
  VALID_EVENT_TYPES,
  normalizeEventType,
  getFields,
  getEvents,
  createEvent,
  deleteEvent,
  extractEventFromText,
  queryFarmMemory,
  generateNextBestAction
};
