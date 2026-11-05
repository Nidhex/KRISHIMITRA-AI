/* ==========================================================================
   KrishiMitra AI — Weather & Micro-Climate Pest Surge Route
   Endpoints: POST /api/weather, GET /api/weather, GET /api/weather/alerts
   ========================================================================== */

'use strict';

const express = require('express');
const router = express.Router();

const db = require('../services/databaseService');
const rag = require('../services/ragService');
const ollama = require('../services/ollamaService');
const { evaluatePestSurgeAlerts } = require('../services/pestSurgeService');

/**
 * Common Weather Handler (supports GET and POST)
 */
async function handleWeatherRequest(req, res, next) {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const location = params.location || 'Kishanpur, UP';
    const language = params.language || 'en';
    const useAI = params.useAI === true || params.useAI === 'true';
    const crop = params.crop || '';

    const query = `${location} weather rain monsoon`.trim();
    const weatherDocs = db.searchWeather(query, 3);

    // Realistic weather metrics
    const todayWeather = {
      condition: 'Light Rain',
      tempC: 28,
      humidity: '82%',
      windKmh: 14,
      rainChance: '80%',
      uvIndex: 3,
      emoji: '🌧'
    };

    // Evaluate Micro-Climate Pest Surge Warnings
    const surgeAlerts = evaluatePestSurgeAlerts({
      tempC: todayWeather.tempC,
      humidity: todayWeather.humidity,
      rainChance: todayWeather.rainChance,
      condition: todayWeather.condition
    }, {
      crop,
      language
    });

    // ── Build AI advisory if requested ───────────────────────────────────────
    let advisory = null;
    let aiSource = 'mock';
    let ollamaError = null;

    if (useAI) {
      const { context } = await rag.retrieveContext(
        `Weather advisory for ${location} ${crop}`.trim(),
        { language }
      );

      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        advisory = context ? `Weather Advisory for ${location}: ${context.substring(0, 300)}` : null;
        aiSource = 'rag';
      } else {
        const prompt = `What is the weather advisory for farmers in ${location}?\n${context}`;
        const result = await ollama.askGemma(prompt);

        if (result.success) {
          advisory = result.response;
          aiSource = 'gemma3';
        } else {
          ollamaError = result.error;
          advisory = context ? `Weather Advisory for ${location}: ${context.substring(0, 300)}` : null;
          aiSource = 'rag';
        }
      }
    }

    const primarySurgeWarning = surgeAlerts.length > 0 ? surgeAlerts[0].advisory : null;

    const mockWeather = {
      location,
      today: todayWeather,
      forecast: [
        { day: 'Tomorrow', condition: 'Heavy Rain', tempC: 26, rainChance: '90%', emoji: '⛈' },
        { day: 'Day After', condition: 'Partly Cloudy', tempC: 29, rainChance: '40%', emoji: '⛅' },
        { day: '+3 Days', condition: 'Sunny', tempC: 32, rainChance: '10%', emoji: '☀️' }
      ],
      advisory: primarySurgeWarning || advisory || 'Heavy rain expected tomorrow. Do not spray pesticides today. Drain waterlogged fields.',
      pestSurgeAlerts: surgeAlerts,
      source: surgeAlerts.length > 0 ? 'micro_climate_rules' : aiSource,
      dbRecords: weatherDocs.length,
      ...(ollamaError && { ollamaError })
    };

    return res.json({
      success: true,
      weather: mockWeather,
      pestSurgeAlerts: surgeAlerts,
      source: mockWeather.source,
      note: 'Micro-climate plant pathology rules & agromet advisories integrated.'
    });

  } catch (err) {
    next(err);
  }
}

// ── GET /api/weather/alerts — On-demand pest surge alerts ─────────────────────
router.get('/alerts', (req, res) => {
  try {
    const { temp = 26, humidity = 82, rainChance = 80, condition = 'Light Rain', crop = '', language = 'en' } = req.query;

    const alerts = evaluatePestSurgeAlerts({
      tempC: parseFloat(temp),
      humidity: typeof humidity === 'string' ? parseInt(humidity, 10) : humidity,
      rainChance: typeof rainChance === 'string' ? parseInt(rainChance, 10) : rainChance,
      condition
    }, {
      crop,
      language
    });

    return res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Standard Weather Routes
router.post('/', handleWeatherRequest);
router.get('/', handleWeatherRequest);

module.exports = router;
