/* ==========================================================================
   KrishiMitra AI — Backend Server (Ollama + Gemma 3)
   Runs on: http://localhost:5000
   ========================================================================== */

'use strict';

const path       = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const fs         = require('fs');

const { requestLogger } = require('./middleware/logger');
const { errorHandler }  = require('./middleware/errorHandler');

// ── Routes ──────────────────────────────────────────────────────────────────
const chatRoutes    = require('./routes/chat');
const voiceRoutes   = require('./routes/voice');
const visionRoutes  = require('./routes/vision');
const weatherRoutes = require('./routes/weather');
const schemesRoutes = require('./routes/schemes');
const geminiRoutes  = require('./routes/gemini');

// ── App Setup ────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Ensure runtime directories exist ─────────────────────────────────────────
const runtimeDirs = ['uploads', 'logs', 'cache'].map(d =>
  path.join(__dirname, d)
);
runtimeDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// ── Static: serve uploads folder ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Static: serve the entire KrishiMitra AI frontend ─────────────────────────
// The frontend lives one level up from backend/
const FRONTEND_ROOT = path.join(__dirname, '..');
app.use(express.static(FRONTEND_ROOT, {
  // Don't serve hidden files or node_modules
  dotfiles: 'ignore',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.bin')) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));


// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    model: process.env.OLLAMA_MODEL || 'gemma3',
    ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    timestamp: new Date().toISOString()
  });
});

const { createRateLimiter } = require('./middleware/rateLimiter');

// Rate Limiters
const chatLimiter   = createRateLimiter({ windowMs: 60000, maxHits: 60, message: 'Chat rate limit exceeded. Please wait a minute.' });
const voiceLimiter  = createRateLimiter({ windowMs: 60000, maxHits: 30, message: 'Voice API rate limit exceeded. Please wait a minute.' });
const visionLimiter = createRateLimiter({ windowMs: 60000, maxHits: 30, message: 'Vision API rate limit exceeded. Please wait a minute.' });

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/chat',    chatLimiter,   chatRoutes);
app.use('/api/voice',   voiceLimiter,  voiceRoutes);
app.use('/api/vision',  visionLimiter, visionRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/gemini',  chatLimiter,   geminiRoutes);

// ── Feed Caching Routes ──────────────────────────────────────────────────────
const NEWS_CACHE_FILE = path.join(__dirname, '..', 'database', 'news', 'news_cache.json');

// Ensure news database folder exists
const newsDbDir = path.dirname(NEWS_CACHE_FILE);
if (!fs.existsSync(newsDbDir)) {
  fs.mkdirSync(newsDbDir, { recursive: true });
}

// GET /api/feed/cache - Load cached articles (no-cache so updates are always served fresh)
app.get('/api/feed/cache', (req, res) => {
  try {
    // Disable ETag / 304 so the browser always gets the latest news_cache.json
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (fs.existsSync(NEWS_CACHE_FILE)) {
      const data = fs.readFileSync(NEWS_CACHE_FILE, 'utf8');
      const articles = JSON.parse(data);
      return res.json({ success: true, articles });
    }
    return res.json({ success: true, articles: [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/feed/cache - Save new articles to cache (keeping up to 500)
app.post('/api/feed/cache', (req, res) => {
  try {
    const { articles } = req.body;
    if (!Array.isArray(articles)) {
      return res.status(400).json({ success: false, error: 'Articles must be an array.' });
    }

    let existingArticles = [];
    if (fs.existsSync(NEWS_CACHE_FILE)) {
      try {
        const raw = fs.readFileSync(NEWS_CACHE_FILE, 'utf8');
        existingArticles = JSON.parse(raw);
        if (!Array.isArray(existingArticles)) existingArticles = [];
      } catch (e) {
        existingArticles = [];
      }
    }

    // Merge new articles with existing ones, avoiding duplicates by ID or Headline
    const merged = [...articles];
    existingArticles.forEach(existing => {
      const isDuplicate = merged.some(item => 
        (item.id && item.id === existing.id) || 
        (item.headline.trim().toLowerCase() === existing.headline.trim().toLowerCase())
      );
      if (!isDuplicate) {
        merged.push(existing);
      }
    });

    // Keep latest 500 articles
    const trimmed = merged.slice(0, 500);

    fs.writeFileSync(NEWS_CACHE_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
    return res.json({ success: true, count: trimmed.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Frontend fallback: serve index.html for root ─────────────────────────────
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── 404 handler (only for /api/* routes) ─────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const ollama = require('./services/ollamaService');

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║      KrishiMitra AI — Backend Server             ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  🌐 App      : http://localhost:${PORT}                ║`);
    console.log(`║  🔧 API      : http://localhost:${PORT}/api/health     ║`);
    console.log(`║  🤖 Ollama   : ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}      ║`);
    console.log(`║  🌱 Model    : ${process.env.OLLAMA_MODEL || 'gemma3'}                      ║`);
    console.log(`║  ⚙️  Mode     : ${process.env.NODE_ENV || 'development'}                 ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');

    // ── Startup Diagnostics & Validation ─────────────────────────────────────────
    const sarvam = require('./services/sarvamService');
    const hasSarvam = sarvam.isConfigured();
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasWeather = !!process.env.WEATHER_API_KEY;
    const hasNews = !!process.env.NEWS_API_KEY;

    let ollamaAvailable = false;
    try {
      const health = await ollama.checkOllamaHealth();
      ollamaAvailable = health.available;
    } catch (e) {
      ollamaAvailable = false;
    }

    console.log('KrishiMitra AI Configuration');
    console.log(`Sarvam AI    : ${hasSarvam ? 'Loaded ✅ (Model: ' + (process.env.SARVAM_MODEL || 'sarvam-105b') + ')' : 'Missing ⚠️ (Set SARVAM_API_KEY in .env)'}`);
    if (hasGemini) {
      console.log('Gemini API   : Loaded ✅');
    } else {
      console.log('Gemini API   : Missing ❌');
    }
    console.log(`Ollama       : ${ollamaAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
    // Validate Browser Vision Model Shards (Float32 alignment & existence)
    const browserModelShards = [
      'ai/browser-models/disease/model.json',
      'ai/browser-models/disease/group1-shard1of3.bin',
      'ai/browser-models/disease/group1-shard2of3.bin',
      'ai/browser-models/disease/group1-shard3of3.bin',
      'ai/browser-models/soil/model.json',
      'ai/browser-models/soil/group1-shard1of3.bin',
      'ai/browser-models/soil/group1-shard2of3.bin',
      'ai/browser-models/soil/group1-shard3of3.bin'
    ];
    let tfjsShardsValid = true;
    for (const relPath of browserModelShards) {
      const fullPath = path.join(FRONTEND_ROOT, relPath);
      if (!fs.existsSync(fullPath)) {
        console.error(`[Vision Startup] ERROR: Missing model file ${relPath}`);
        tfjsShardsValid = false;
      } else if (relPath.endsWith('.bin')) {
        const stat = fs.statSync(fullPath);
        if (stat.size % 4 !== 0) {
          console.error(`[Vision Startup] ERROR: Model shard ${relPath} size (${stat.size} bytes) is not a multiple of 4!`);
          tfjsShardsValid = false;
        }
      }
    }

    console.log(`Weather API  : ${hasWeather ? 'Loaded ✅' : 'Missing ❌'}`);
    console.log(`News API     : ${hasNews ? 'Loaded ✅' : 'Missing ❌'}`);
    console.log(`TF.js Vision : ${tfjsShardsValid ? 'Ready & Validated ✅ (6/6 shards verified)' : 'Invalid ❌'}`);
    console.log(`Offline Mode : Ready ✅`);

    console.log('');
    console.log(`  Open your browser → http://localhost:${PORT}`);
    console.log('');
  });
}

module.exports = app;
