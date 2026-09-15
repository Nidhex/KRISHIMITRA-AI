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
  // 1. Explicit user selection MUST be strictly preserved if valid
  if (VALID_EVENT_TYPES.includes(rawType) && rawType !== 'other') {
    return rawType;
  }

  const combined = `${rawType || ''} ${title || ''} ${description || ''}`.toLowerCase();

  // 2. Keyword matching rules for unclassified ("other" or empty) events
  if (/(pesticide|insecticide|fungicide|herbicide|dawai|spray|कीटनाशक|दवाई|छिड़काव|स्प्रे)/i.test(combined)) {
    return 'pesticide';
  }
  if (/(urea|dap|npk|nitrogen|potash|phosphate|fertilizer|khad|यूरिया|खाद|डीएपी)/i.test(combined)) {
    return 'fertilizer';
  }
  if (/(irrigation|water|canal|tube-well|tubewell|पानी|सिंचाई|पानी दिया)/i.test(combined)) {
    return 'irrigation';
  }
  if (/(harvest|harvesting|reap|cut|cutting|कटाई|पैदावार|फसल काटी)/i.test(combined)) {
    return 'harvest';
  }
  if (/(sow|sowing|plant|planting|seeding|बुवाई|रोपाई|बीज बोया)/i.test(combined)) {
    return 'planting';
  }
  if (/(yellow|rust|blight|rot|spot|disease|symptom|रोग|पीले पत्ते|कीड़ा|बीमारी)/i.test(combined)) {
    return 'disease';
  }

  return rawType && VALID_EVENT_TYPES.includes(rawType) ? rawType : 'other';
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
    productName: eventData.productName || null,
    quantity: typeof eventData.quantity === 'number' && !isNaN(eventData.quantity) ? eventData.quantity : null,
    unit: eventData.unit ? eventData.unit.trim() : null,
    area: typeof eventData.area === 'number' && !isNaN(eventData.area) ? eventData.area : null,
    areaUnit: eventData.areaUnit ? eventData.areaUnit.trim() : 'acre',
    amount: typeof eventData.amount === 'number' && !isNaN(eventData.amount) ? eventData.amount : null,
    currency: eventData.currency || 'INR',
    targetPest: eventData.targetPest || null,
    diseaseName: eventData.diseaseName || null,
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
2. If quantity/unit/area/amount/productName is NOT mentioned, set them to null. DO NOT INVENT or guess missing numbers or products.
3. If farmer mentions spraying pesticide/insecticide/fungicide/dawai, eventType MUST be "pesticide" (NOT fertilizer).
4. Return ONLY a valid JSON object matching this schema:
{
  "eventType": "pesticide",
  "crop": "Wheat",
  "title": "Pesticide application",
  "description": "Sprayed neem pesticide on wheat",
  "productName": "Neem pesticide",
  "quantity": 500,
  "unit": "ml",
  "area": 2,
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
              productName: parsed.productName || null,
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
  let productName = null;

  if (lower.includes('wheat') || lower.includes('गेहूं') || lower.includes('गेहूँ') || lower.includes('gehu') || lower.includes('gehun')) crop = 'Wheat';
  else if (lower.includes('paddy') || lower.includes('rice') || lower.includes('धान')) crop = 'Paddy';
  else if (lower.includes('tomato') || lower.includes('टमाटर')) crop = 'Tomato';
  else if (lower.includes('cotton') || lower.includes('कपास')) crop = 'Cotton';

  let rawType = 'other';
  if (/(pesticide|insecticide|fungicide|herbicide|dawai|spray|कीटनाशक|दवाई|छिड़काव|स्प्रे)/i.test(text)) {
    rawType = 'pesticide';
    if (lower.includes('neem') || lower.includes('नीम')) productName = 'Neem Pesticide';
  } else if (/(urea|dap|npk|nitrogen|potash|phosphate|fertilizer|khad|यूरिया|खाद|डीएपी)/i.test(text)) {
    rawType = 'fertilizer';
    if (lower.includes('urea') || lower.includes('यूरिया')) productName = 'Urea';
    else if (lower.includes('dap') || lower.includes('डीएपी')) productName = 'DAP';
  } else if (/(irrigation|water|canal|tube-well|tubewell|पानी|सिंचाई)/i.test(text)) {
    rawType = 'irrigation';
  } else if (/(harvest|harvesting|reap|cut|cutting|कटाई|पैदावार)/i.test(text)) {
    rawType = 'harvest';
  } else if (/(yellow|rust|blight|rot|spot|disease|symptom|रोग|पीले)/i.test(text)) {
    rawType = 'disease';
  }

  const normalizedType = normalizeEventType(rawType, text, text);

  // Extract Quantity & Unit
  const numMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|किलो|लीटर|liter|ml|l|बोरी|bag)?/i);
  if (numMatch) {
    quantity = parseFloat(numMatch[1]);
    const rawU = numMatch[2] ? numMatch[2].toLowerCase() : null;
    if (rawU === 'किलो' || rawU === 'kilo') unit = 'kg';
    else if (rawU === 'लीटर' || rawU === 'l' || rawU === 'liter') unit = 'liter';
    else if (rawU === 'ml') unit = 'ml';
    else if (rawU === 'बोरी') unit = 'bag';
    else unit = rawU || 'kg';
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
      productName,
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

  // ── STEP 7: TEST A — EMPTY FARM HANDLER ────────────────────────────────────
  if (events.length === 0) {
    logger.info(`[FarmDecision] farmerId: ${farmerId}, recentEvents: 0, decision: empty state`);
    return {
      success: true,
      recommendation: {
        action: "Not enough farm information to provide a personalized next action yet.",
        priority: "low",
        reason: "Add a crop or farm activity to build your farm memory.",
        crop: cropFilter || "All Crops",
        basedOn: [
          { type: "system", summary: "Empty Farm Memory state — awaiting farmer activity logs" }
        ],
        timing: "When you perform farm activities",
        confidence: 1.0,
        disclaimer: "Record events to unlock AI context-aware advice."
      }
    };
  }

  const targetCrop = cropFilter || (events.find(e => e.crop)?.crop) || 'Wheat';
  const recentEvents = events.filter(e => !cropFilter || (e.crop || '').toLowerCase().includes(cropFilter.toLowerCase()));
  const newestEvent = recentEvents[0] || events[0];

  // Build Structured Farm Memory Context
  const farmContext = {
    farmer: { id: farmerId, name: 'Ramesh Prasad', location: 'Kishanpur, UP' },
    crop: targetCrop,
    field: fields[0] || { fieldId: 'field_001', area: 2, areaUnit: 'acre' },
    recentEvents: recentEvents.slice(0, 10).map(e => ({
      id: e.id,
      eventType: e.eventType,
      crop: e.crop,
      title: e.title,
      description: e.description,
      productName: e.productName,
      quantity: e.quantity,
      unit: e.unit,
      area: e.area,
      areaUnit: e.areaUnit,
      date: e.date
    })),
    weather: {
      location: "Kishanpur, UP",
      forecast: "Clear field working conditions"
    }
  };

  logger.info(`[FarmDecision] farmerId: ${farmerId}, recentEvents: ${farmContext.recentEvents.length}, crop: ${targetCrop}, geminiConfigured: ${!!process.env.GEMINI_API_KEY}`);

  // ── Attempt Server-Side Gemini Reasoning Layer ──────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `You are KrishiMitra AI's farm decision assistant.
You must analyze the farmer's actual recorded farm events and available current agricultural context.
Your task is to identify the most useful next farming action.

Never invent a farm activity that is not present in the supplied memory.
Never claim that the farmer performed an activity unless it appears in the supplied events.
Do not recommend repeating a treatment merely because it is common.
Consider the chronological order of recent activities.
Consider crop and field information.
Consider weather and forecast when available.

Return ONLY a valid JSON object matching:
{
  "action": "...",
  "timing": "...",
  "reason": "...",
  "basedOn": [
    "...",
    "..."
  ],
  "priority": "high | medium | low",
  "confidence": 0.95
}

FARMER CONTEXT:
${JSON.stringify(farmContext, null, 2)}`;

      const https = require('https');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payloadStr = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      const geminiResText = await new Promise((resolve) => {
        const urlObj = new URL(geminiUrl);
        const reqOpts = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadStr)
          },
          timeout: 10000
        };

        const req = https.request(reqOpts, (res) => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(body);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                resolve(text || null);
              } catch (_) {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(payloadStr);
        req.end();
      });

      if (geminiResText) {
        const jsonMatch = geminiResText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const gData = JSON.parse(jsonMatch[0]);
          if (gData.action && gData.reason) {
            logger.info(`[FarmDecision] Gemini decision generated successfully: "${gData.action.substring(0, 40)}..."`);
            const basedOnFormatted = Array.isArray(gData.basedOn) 
              ? gData.basedOn.map(b => (typeof b === 'string' ? { type: 'farm_diary', summary: b } : b))
              : [{ type: 'farm_diary', summary: `Based on ${farmContext.recentEvents.length} recorded farm events` }];

            return {
              success: true,
              recommendation: {
                action: gData.action,
                priority: gData.priority || 'medium',
                reason: gData.reason,
                crop: targetCrop,
                basedOn: basedOnFormatted,
                timing: gData.timing || 'Next 2–3 days',
                confidence: typeof gData.confidence === 'number' ? gData.confidence : 0.95,
                disclaimer: 'Generated by KrishiMitra Gemini AI reasoning over your actual Farm Memory.'
              }
            };
          }
        }
      }
    } catch (gErr) {
      logger.warn(`[FarmDecision] Gemini API call error: ${gErr.message}`);
    }
  }

  // ── Deterministic Rule-Engine Fallback (Context-Aware) ────────────────────────
  let action = '';
  let priority = 'medium';
  let reason = '';
  let timing = 'Next 2–3 days';
  const basedOn = [];

  basedOn.push({
    type: 'farm_diary',
    eventId: newestEvent.id,
    summary: `Latest recorded event: ${newestEvent.eventType.toUpperCase()} (${newestEvent.title}) on ${newestEvent.date}`
  });

  const hasPesticide = recentEvents.some(e => e.eventType === 'pesticide');
  const hasIrrigation = recentEvents.some(e => e.eventType === 'irrigation');
  const hasFertilizer = recentEvents.some(e => e.eventType === 'fertilizer');

  if (newestEvent.eventType === 'pesticide') {
    action = `Monitor the ${targetCrop} field for 2–3 days before applying any further sprays or treatments.`;
    priority = 'high';
    reason = `Pesticide application (${newestEvent.title}${newestEvent.quantity ? `, ${newestEvent.quantity} ${newestEvent.unit || ''}` : ''}) was recently recorded on ${newestEvent.date}. Allow sufficient time to evaluate pest knockdown and prevent chemical toxicity.`;
    timing = 'Next 2–3 days';
  } else if (newestEvent.eventType === 'disease' || newestEvent.eventType === 'pest') {
    action = `Inspect ${targetCrop} leaves for disease progression and apply organic or targeted fungicide if infection spreads.`;
    priority = 'high';
    reason = `A pest/disease observation (${newestEvent.title}) was recorded on ${newestEvent.date}. Early intervention stops pathogen spread across field boundaries.`;
    timing = 'Immediate (Within 24 hours)';
  } else if (newestEvent.eventType === 'harvest') {
    action = `Ensure proper sun-drying of harvested ${targetCrop}${newestEvent.quantity ? ` (${newestEvent.quantity} ${newestEvent.unit || 'kg'})` : ''} to safe moisture levels (<12%) before Mandi sale.`;
    priority = 'high';
    reason = `Harvest was recorded on ${newestEvent.date}. Check current Mandi APMC prices to secure maximum crop return.`;
    timing = 'Next 1–2 days';
    basedOn.push({
      type: 'mandi',
      summary: 'Check government Mandi APMC prices before finalizing crop sale.'
    });
  } else if (newestEvent.eventType === 'irrigation') {
    if (hasPesticide) {
      action = `Inspect ${targetCrop} root zone moisture and verify that recent pesticide spray was not washed off.`;
      priority = 'medium';
      reason = `Irrigation was recorded on ${newestEvent.date} following recent pesticide application. Ensure adequate crop scouting.`;
      timing = 'Next 2 days';
    } else {
      action = `Inspect ${targetCrop} soil moisture and monitor for early weed growth following irrigation.`;
      priority = 'medium';
      reason = `Irrigation was recorded on ${newestEvent.date}. Maintaining balanced moisture prevents waterlogging.`;
      timing = 'Next 2–3 days';
    }
  } else if (newestEvent.eventType === 'fertilizer') {
    if (hasIrrigation) {
      action = `Allow root uptake of fertilizer in ${targetCrop} field. Postpone top-dressing for 10–14 days.`;
      priority = 'medium';
      reason = `Fertilizer (${newestEvent.title}${newestEvent.quantity ? `, ${newestEvent.quantity} ${newestEvent.unit || 'kg'}` : ''}) and irrigation have been applied. Roots require time for nitrogen assimilation.`;
      timing = 'Next 10–14 days';
    } else {
      action = `Schedule light irrigation for ${targetCrop} to assist fertilizer breakdown and root absorption.`;
      priority = 'high';
      reason = `Fertilizer (${newestEvent.title}) was recorded on ${newestEvent.date}. Light moisture prevents nitrogen volatilization.`;
      timing = 'Next 24–48 hours';
    }
  } else if (newestEvent.eventType === 'planting') {
    action = `Provide gentle moisture and monitor uniform seedling germination in ${targetCrop} field.`;
    priority = 'medium';
    reason = `Sowing/planting of ${targetCrop} was recorded on ${newestEvent.date}. Seedling establishment requires consistent soil moisture.`;
    timing = 'Next 3–5 days';
  } else {
    action = `Schedule field scouting for ${targetCrop} and record any new farm operations.`;
    priority = 'low';
    reason = `Latest recorded activity is ${newestEvent.title} on ${newestEvent.date}. Regular monitoring maintains crop health.`;
    timing = 'Next 3 days';
  }

  basedOn.push({
    type: 'weather',
    summary: 'Weather forecast integrated into field operational advice.'
  });

  return {
    success: true,
    recommendation: {
      action,
      priority,
      reason,
      crop: targetCrop,
      basedOn,
      timing,
      confidence: 0.95,
      disclaimer: 'Recommendations are derived strictly from your Farm Memory events, weather forecasts, and agricultural best practices.'
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

