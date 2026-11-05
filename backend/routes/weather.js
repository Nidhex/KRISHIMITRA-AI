/* ==========================================================================
   KrishiMitra AI — Weather & Micro-Climate Pest Surge Route
   Endpoints: POST /api/weather, GET /api/weather, GET /api/weather/alerts,
              GET /api/weather/live (Direct OpenWeatherMap + Open-Meteo Redundancy)
   ========================================================================== */

'use strict';

const express = require('express');
const router = express.Router();

const db = require('../services/databaseService');
const rag = require('../services/ragService');
const ollama = require('../services/ollamaService');
const { evaluatePestSurgeAlerts } = require('../services/pestSurgeService');

/**
 * Weather condition to emoji mapping
 */
function mapWeatherConditionToEmoji(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('thunder') || c.includes('storm')) return '⛈';
  if (c.includes('heavy rain')) return '🌧';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧';
  if (c.includes('snow')) return '❄️';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫';
  if (c.includes('partly') || c.includes('cloud')) return '⛅';
  if (c.includes('clear') || c.includes('sun')) return '☀️';
  return '⛅';
}

/**
 * Fetch live weather from OpenWeatherMap using coordinates
 */
async function fetchOpenWeatherMap(lat, lon, apiKey) {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  const [curRes, foreRes] = await Promise.all([
    fetch(currentUrl),
    fetch(forecastUrl)
  ]);

  if (!curRes.ok) {
    throw new Error(`OpenWeatherMap Current error: ${curRes.statusText}`);
  }

  const curData = await curRes.json();
  const foreData = foreRes.ok ? await foreRes.json() : { list: [] };

  // Format hourly (next 24 hours in 3h blocks)
  const hourly = (foreData.list || []).slice(0, 8).map(item => ({
    time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    temp: Math.round(item.main?.temp || 0),
    rainProb: Math.round((item.pop || 0) * 100),
    humidity: item.main?.humidity || 0,
    windSpeed: Math.round(item.wind?.speed || 0),
    code: item.weather?.[0]?.id || 800
  }));

  // Format daily (next 5 days)
  const dailyMap = {};
  (foreData.list || []).forEach(item => {
    const dStr = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!dailyMap[dStr]) {
      dailyMap[dStr] = {
        date: dStr,
        tempMax: item.main.temp_max,
        tempMin: item.main.temp_min,
        rainProb: Math.round((item.pop || 0) * 100),
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind?.speed || 0),
        code: item.weather?.[0]?.id || 800
      };
    } else {
      if (item.main.temp_max > dailyMap[dStr].tempMax) dailyMap[dStr].tempMax = item.main.temp_max;
      if (item.main.temp_min < dailyMap[dStr].tempMin) dailyMap[dStr].tempMin = item.main.temp_min;
    }
  });

  const daily = Object.values(dailyMap).slice(0, 7);

  const conditionText = curData.weather?.[0]?.main || 'Clear';
  const emoji = mapWeatherConditionToEmoji(conditionText);

  return {
    source: 'OpenWeatherMap',
    current: {
      temp: Math.round(curData.main?.temp || 0),
      feelsLike: Math.round(curData.main?.feels_like || 0),
      humidity: curData.main?.humidity || 0,
      rainProb: Math.round((foreData.list?.[0]?.pop || 0) * 100),
      windSpeed: Math.round(curData.wind?.speed || 0),
      windDirection: 'NE',
      pressure: Math.round(curData.main?.pressure || 1013),
      visibility: Math.round((curData.visibility || 10000) / 1000),
      uvIndex: 4,
      cloudCover: curData.clouds?.all || 0,
      sunrise: new Date(curData.sys?.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      sunset: new Date(curData.sys?.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      conditionText,
      emoji,
      aqi: null,
      aqiText: 'Normal'
    },
    hourly,
    daily
  };
}

/**
 * GET /api/weather/live
 * Fetches real-time weather using OpenWeatherMap if key is valid, falling back to Open-Meteo
 */
router.get('/live', async (req, res) => {
  const lat = parseFloat(req.query.lat) || 26.7606;
  const lon = parseFloat(req.query.lon) || 83.3731;
  const apiKey = (process.env.WEATHER_API_KEY || '').trim();

  // Try OpenWeatherMap first if key configured
  if (apiKey) {
    try {
      const data = await fetchOpenWeatherMap(lat, lon, apiKey);
      return res.json({ success: true, ...data });
    } catch (owmErr) {
      console.warn('[WEATHER] OpenWeatherMap fetch failed, falling back to client Open-Meteo:', owmErr.message);
    }
  }

  return res.json({
    success: false,
    useClientFallback: true,
    message: 'OpenWeatherMap unavailable or key not set. Using Open-Meteo.'
  });
});

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
